/**
 * @fileoverview An easy to use interface for GridFS.
 */

/**
 * _Module dependencies._
 */
 
var events = require('events');
 
var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server;

/**
 * _Creates an initialized GridFS instance._
 *
 * @class GridFS
 * 
 * @param {String} db
 * @param {String} rootcoll (optional)
 *
 * @returns {Object} GridFS instance
 * 
 * If a rootcoll is specified, files will be stored in rootcoll.files
 * and rootcoll.chunks. If rootcoll is not already existant, it will be created. 
 * If nothing is specified then the default 'fs' will be used.
 *
 * @api public
 */

function GridFS(dbname,filesys){

	var self = this;

	var host = process.env['MONGO_NODE_DRIVER_HOST'] ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

	try{
		this.dbcon = new Db(dbname, new Server(host, port, {}), { native_parser : true });
  	}catch(err){
		this.dbcon = new Db(dbname, new Server(host, port, {}), { native_parser : false });
  	}
	
	this.fs = filesys || GridStore.DEFAULT_ROOT_COLLECTION;
	this.opQueue = [];
	this.emitter = new events.EventEmitter();
	this.busy = false;

	this.emitter.on('_op', function(){
		self.busy = false;
		if(self.opQueue.length > 0) self.performOp();
	});
	
	if(!(this.dbcon)) throw new Error('Database connection failed.');
	
	this.open();
};

/**
 * _Performs a queued operation._
 *
 * This is used internally to queue operations.
 *
 * @api private
 */

GridFS.prototype.performOp = function(){

	if(this.dbcon.state === 'connected' && !this.busy)
	{
		var self = this;
	
		var op = this.opQueue.shift();
		var func = op.shift();
		var args = op.pop();
		
		func.apply(self,args);
	}
}

/**
 * _Stores a file._
 *
 * @param {Buffer} buffer
 * @param {String} filename 
 * @param {String} mode
 * @param {Object} options (optional)
 * @param {Function} callback
 *
 * mode can be set to either 'w' to overwrite the content of the file
 * or 'w+' to append to the contents of the file.
 * 
 * options can be used to specify the content\_type, metadata and chunk\_size
 *
 * @example var options = { 'content\_type' : 'image/png', 'metadata' : { 'person' : 'George' }, 'chunk\_size' : 1024*4 };
 * 
 * The callback takes an error and a result parameter, which provides information
 * about the file after it has been stored. 
 *
 * @api public
 */

GridFS.prototype.put = function(buffer, filename, mode, options, callback){
	
	var self = this;
	var args = arguments;

	this.opQueue.push([self._put,args]);	
	
	self.performOp();
}

/**
 * _Gets a file._
 *
 * @param {String} filename
 * @param {Number} length (optional)
 * @param {Number} offset (optional) 
 * @param {Object} options (optional)
 * @param {Function} callback
 *
 * The callback function takes an error and data as parameters. The data object is 
 * a buffer.
 * 
 * @see put() for option details.
 *
 * @api public
 */

GridFS.prototype.get = function(filename, length, offset, options, callback){

	var self = this;
	var args = arguments;
	
	this.opQueue.push([self._get,args]);	
	
	self.performOp();
}

/**
 * _Deletes a file._ 
 *
 * @param {String} filename
 * @param {Function} callback (optional)
 *
 * The callback function takes an error as a parameter.
 *
 * @api public
 */

GridFS.prototype.delete = function(filename, callback){

	var self = this;
	var args = arguments;
	
	this.opQueue.push([self._delete,args]);	
	
	self.performOp();
}

/**
 * _Opens the database connection._
 *
 * @param {Function} callback (optional)
 *
 * This method should not normally be implemented, unless you have closed the connection
 * and wish to open it again.
 *
 * @example myFS.put(foo, bar, 'w', function(){ myFS.close(); });
 *			...
 *			myFS.open();
 *
 * By default, a GridFS instance is returned already open(). 
 * The callback takes an error as it's argument and is called before any queued operations
 * are executed.
 *
 * @api public
 */

GridFS.prototype.open = function(callback){
	
	var self = this;
	
	this.dbcon.open(function(err){
		if(callback){
			callback(err);	
		}else{
			if(err) throw err;
		}
		
		if(self.opQueue.length > 0) self.performOp();
	});
}

/**
 * _Closes the database connection._
 *
 * @param {Function} callback (optional)
 *
 * This should be called once you are done using the GridFS.
 * Functions called after this will be queued to perform when 
 * the Grid is reopened. The callback is executed after the 
 * closing of the GridFS database connection.
 *
 * @api public
 */

GridFS.prototype.close = function(callback){

	var self = this;
	var args = arguments;
	
	this.opQueue.push([self._close,args]);	
	
	self.performOp();
}

/**
 * _Stores a file._
 *
 * This is the implementation of put(). 
 *
 * @api private
 */

GridFS.prototype._put = function(buffer, filename, mode, options, callback){

	var self = this;
	var args = Array.prototype.slice.call(arguments, 0);
 	 	
 	if(typeof options === 'function'){
 		callback = args.pop();
 		options = {};
 	}

	var fs = this.fs;
	var db = this.dbcon;
		
	if(!(buffer instanceof Buffer)) return callback(new Error('A Buffer object is required.'),null);
		
	options.root = options.root === undefined ? fs : options.root;
		
	var gridStore = new GridStore(db, filename, mode, options);

	 gridStore.open(function(err, gridStore){
	 	if(err){
	 		self.emitter.emit('_op');
	 		return callback(err, null);
	 	}
	 	gridStore.writeBuffer(buffer, function(err, gridStore){
	 		if(err){
	 			self.emitter.emit('_op');
	 			return callback(err, null);
	 		}
	 		gridStore.close(function(err, result){
	 			self.emitter.emit('_op');
	 			callback(err, result);
	 		});
	 	});
	 });
};

/**
 * _Gets a file._
 *
 * This is the implementation of get().
 *
 * @api private
 */

GridFS.prototype._get = function(filename, length, offset, options, callback){

	var args = Array.prototype.slice.call(arguments, 1);
	var fs = this.fs;
	var db = this.dbcon;
	var self = this;
	
	callback = args.pop();
	length = args.length ? args.shift() : null;
	offset = args.length ? args.shift() : null;
	options = args.length ? args.shift() : null;
			
	GridStore.exist(db, filename, fs, function(err, exists){
		if(err){
			self.emitter.emit('_op');
			return callback(err, null);
		} 
		
		if(exists === true){
			new GridStore(db, filename, "r", options).open(function(err, gs){
				if(offset != null){
					gs.seek(offset, function(err, gridS){
						if(err){
		 					self.emitter.emit('_op');
		 					return callback(err, null);
		 				}
						gridS.readBuffer(length, function(err, data){
							callback(err, data);
							self.emitter.emit('_op');
						});
					});
				}else{
					gs.readBuffer(length, function(err, data){
						callback(err, data);
						self.emitter.emit('_op');
					});
				}
			});	
		}
		else{
			callback(new Error('The file you wish to read does not exist.'),null);
			self.emitter.emit('_op');
		}	
	});
};	

/**
 * _Deletes a file._ 
 *
 * This is the implementation of delete().
 *
 * @api private
 */

GridFS.prototype._delete = function(filename, callback){

	var db = this.dbcon;
	var fs = this.fs;

	var self = this;

	GridStore.unlink(db, filename, function(err, gs){
		if(callback) callback(err);		
			
		self.emitter.emit('_op');
	});
};

/**
 * _Closes the database connection._
 *
 * This is the implementation of close().
 *
 * @api private
 */
 
GridFS.prototype._close = function(callback){

 	this.dbcon.close();
 	this.emitter.emit('_op');
	if(callback) callback();
}

/**
 * _Exports._
 */
 
module.exports = GridFS;

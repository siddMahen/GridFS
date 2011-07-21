/**
 * @fileoverview An easy to use interface for GridFS.
 * @author siddharth\_mahen@me.com (Siddharth Mahendraker)
 * @version 0.2
 */

/**
 * _Module dependencies._
 */

var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection;

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

	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	this.dbcon = new Db(dbname, new Server(host, port, {}), { native_parser : true });
	this.fs = filesys === undefined ? GridStore.DEFAULT_ROOT_COLLECTION : filesys;
	this.opQueue = [];
	
	if(!(this.dbcon)) throw new Error('Database creation failed.');
	
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

	if(this.dbcon.state === 'connected')
	{
		var self = this;
	
		var op = this.opQueue.shift();
		var func = op.shift();
		var args = op.pop();
		
		func.apply(self,args);
		
		if(this.opQueue.length > 0) this.performOp();
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
 * @example var options = {"content\_type":"image/png","metadata":{ "person": "George"},"chunk\_size": 1024*4};
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
 * a string.
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
 * @param {Function} callback
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
 * This method should not normally be implemented, unless you have closed the connection
 * and wish to open it again.
 *
 * @example myFS.put(foo, bar, 'w', function(){ myFS.close(); });
 *			...
 *			myFS.open();
 *
 * By default, a GridFS instance is returned already open(). 
 *
 * @api public
 */

GridFS.prototype.open = function(){
	
	var self = this;
	
	this.dbcon.open(function(err){
		if(err) throw err;
		if(self.opQueue.length > 0) self.performOp();
	});
}

/**
 * _Closes the database connection._
 *
 * @param {Function} callback
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
	 	if(err) return callback(err, null);
	 	gridStore.writeBuffer(buffer, function(err, gridStore){
	 		if(err) return callback(err, null);
	 		gridStore.close(function(err, result){
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
	
	callback = args.pop();
	length = args.length ? args.shift() : null;
	offset = args.length ? args.shift() : null;
	options = args.length ? args.shift() : null;
			
	GridStore.exist(db, filename, fs, function(err, exists){
		if(err) return callback(err, null);
		if(exists === true){
			GridStore.read(db, filename, length, offset, options, callback);				
		}
		else{
			callback(new Error('The file you wish to read does not exist.'),null);
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
	
	GridStore.exist(db, filename, function(err,exists){
		if(err) return callback(err);
	
		if(exists){
			GridStore.unlink(db,filename,function(){
				if(callback) callback(null);
			});
		}
		else{
			callback(new Error('The file you wish to delete does not exist.'));
		}
	});
};

/**
 * _Closes the database connection._
 *
 * This is the implementation of close().
 *
 * @api private
 */
 
GridFS.prototype._close = function(filename, callback){

 	this.dbcon.close();
	if(callback) callback();
}

/**
 * _Exports._
 */
 
module.exports = GridFS;

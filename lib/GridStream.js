/**
 * @fileoverview A stream interface for GridFS.
 * @author siddharth\_mahen@me.com (Siddharth Mahendraker)
 * @version 0.3
 */

/**
 * _Module dependencies._
 */
 
var util = require('util'),
	events = require('events');
	Stream = require('stream').Stream;

var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection,
	Chunk = require('mongodb').Chunk;
	
var GridStream = exports;
	
/**
 * _Creates an initialized Readable GridStream instance._
 *
 * @class Readable GridStream
 * 
 * @param {String} dbname
 * @param {String} filename
 * @param {Object} options (optional)
 * 
 * GridStream is a subclass of Stream, meaning it is compatible with pipe().
 * It emit all of the events that normal readable streams do, with the addition of 'pause'
 * and 'resume', which are emitted upon pause and resume.
 *
 * A Readable GridStream object will begin reading automatically and upon completion,
 * close automatically.
 *
 * The options object can be used to specify the content\_type, metadata, chunk\_size
 * and root collection. The default root collection is 'fs'.
 *
 * @example var options = { 'content\_type' : 'plain/text', 'metadata' : { 'author' : 'Sidd' },
 *  'chunk\_size' : 1024*4, 'root' : 'articles' }; 
 *
 * @api public
 */
 
function GridReadStream(dbname, filename, options){

	Stream.call(this);

	var self = this;
	
	if(!options) options = {}; 
 	 	
 	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	this.db = new Db(dbname, new Server(host, port, {}), { native_parser : true });
	this.filename = filename;
 	this.readable = true
 	this.writable = false;
 	this.paused = false;
 	this.encoding = null;
 	this.options = options;
 	this.head = 0;
 	
 	this.options['root'] = this.options['root'] === undefined ? GridStore.DEFAULT_ROOT_COLLECTION : this.options['root'];
 	this.options['chunk_size'] = this.options['chunk_size'] === undefined ? Chunk.DEFAULT_CHUNK_SIZE : this.options['chunk_size'];
 	
 	this.gridStore = new GridStore(this.db, this.filename, 'r', this.options);
 	
 	this.db.open(function(err){
		if(err) throw err;
		self.gridStore.open(function(err, gs){
			if(err) throw err;
			self.gridStore = gs;
			self._read();
		});
	});
}

util.inherits(GridReadStream, Stream);

/**
 * _Sets the return data encoding._
 *
 * @param {String} encoding 
 * 
 * Setting the encoding return a encoded string instead 
 * of a Buffer on the 'data' event.
 *
 * @api public
 */


GridReadStream.prototype.setEncoding = function(encoding){

	if(encoding === 'utf8'||encoding === 'ascii'||encoding === 'base64') 
		this.encoding = encoding;
	else
		this._throw(new Error('An unknown encoding was used.'));
}

/**
 * _Pauses the Readable GridStream._
 * 
 * @api public
 */

GridReadStream.prototype.pause = function(){

	this.paused = true;
	this.emit('pause');
}

/**
 * _Resumes the Readable GridStream._
 * 
 * @api public
 */

GridReadStream.prototype.resume = function(){

	this.paused = false;
	this._read();
	this.emit('resume');
}

/**
 * _Closes the stream._
 *
 * This should not normally be used as Readable GridStreams
 * close automatically once all their contents have been read.
 * 
 * @api public
 */

GridReadStream.prototype.destroy = function(){
	
	var self = this;
	
	this.gridStore.close(function(err,result){
		if(err) self._throw(err);
		
		this.writable = false;
		this.readable = false;
		self.db.close();
		self.emit('close');
	});
}

GridReadStream.prototype.destroySoon = GridReadStream.prototype.destroy;

/**
 * _Handles errors._
 *
 * This function is used internally to throw errors.
 *
 * @api private
 */

GridReadStream.prototype._throw = function(err){
	
	this.emit('error', err);
	this.readable = false;
}

/**
 * _Begins the read._
 *
 * This method is used internally to to begin/restart reading.
 * 
 * @api private
 */

GridReadStream.prototype._read = function(){

	var self = this;

	if(this.readable){
		if(!this.paused){
			var len;
				
			if(this.head + this.options.chunk_size > this.gridStore.length)
				len = this.gridStore.length - this.head;
			else
				len = this.options.chunk_size;
			
			GridStore.read(self.db, self.filename, len, self.head, { 'root' : self.options.root }, function(err, data){
				var emitData = new Buffer(data);

				if(self.encoding !== null)
					emitData = emitData.toString(self.encoding);
					
				self.emit('data', emitData);
						
				self.head += len;
				if(self.head !== self.gridStore.length)
					self._read();
				else{
					self.emit('end');
					self.destroy();	
				}
			});
		}
	}else{
	 	this._throw(new Error('This stream is not readable.'));
	}
}

/**
 * _Creates an Readable GridStream._
 *
 * @returns a Readable GridStream instance.
 *
 * This is a class convenience method.
 *
 * @api public
 */

GridStream.createGridReadStream = function(dbname, filename, options){

	return new GridReadStream(dbname, filename, options);
}

/**
 * _Creates an initialized Writable GridStream instance._
 *
 * @class Writable GridStream
 * 
 * @param {String} dbname
 * @param {String} filename
 * @param {String} mode
 * @param {Object} options (optional)
 * 
 * GridStream is a subclass of Stream, meaning it is compatible with pipe().
 * It emit all of the events that normal writable streams do.
 *
 * The mode parameter takes one of two values 'w' and 'w+'.
 * 'w' is used to overwrite files or create them if they do not exist.
 * 'w+' is used to append new data to existing files, also creating them
 * if they do not exist.
 *
 * @see GridReadStream for options information. 
 *
 * @api public
 */
 
function GridWriteStream(dbname, filename, mode, options){

	Stream.call(this);

	var self = this;
	
	if(!options) options = {}; 
	mode = mode === 'w' ? 'w' : 'w+';
 	 	
 	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	this.db = new Db(dbname, new Server(host, port, {}), { native_parser : true });
	this.filename = filename;
 	this.readable = false;
 	this.writable = true;
 	this.options = options;
 	
 	this.opQueue = [];
 	this.emitter = new events.EventEmitter();
 	this.busy = false;
 	this.connected = false;
 	
 	this.emitter.on('_op', function(){
			self.busy = false;
			if(self.opQueue.length > 0) self._flush();
		});
 	
 	this.options['root'] = this.options['root'] === undefined ? GridStore.DEFAULT_ROOT_COLLECTION : this.options['root'];
 	this.options['chunk_size'] = this.options['chunk_size'] === undefined ? Chunk.DEFAULT_CHUNK_SIZE : this.options['chunk_size'];
 	
 	this.gridStore = new GridStore(this.db, this.filename, mode, this.options);
 	
 	this.db.open(function(err){
		if(err) throw err;
		self.gridStore.open(function(err, gs){
			if(err) throw err;
			self.gridStore = gs;
			self.connected = true;
			if(self.opQueue.length > 0) self._flush();
		});
	});
}

util.inherits(GridWriteStream, Stream);

/**
 * _Used internally to flush the operations queue._
 *
 * @api private
 */

GridWriteStream.prototype._flush = function(){

	if(this.connected && !this.busy){
	
		this.busy = true;
	
		var self = this;
	
		var op = this.opQueue.shift();
		var func = op.shift();
		var args = op.pop();
		
		func.apply(self,args);
	}
}

/**
 * _Writes data to the stream._
 *
 * @param {Buffer|String} buffer
 *
 * @returns {Boolean} true
 *
 * This method always returns true if there were no errors, 
 * this ensures it works consistently with other stream objects.
 * 
 * @api public
 */
 
GridWriteStream.prototype.write = function(buffer){

	var self = this;
	var args = arguments;

	this.opQueue.push([self._write,args]);	
	
	self._flush();
}

/**
 * _Writes data to the stream and then closes it._ 
 *
 * @param {Buffer|String} buffer (optional)
 *
 * This method is prefered to destroySoon() because it does not require
 * you to have written previously. However, destroySoon() also has it's 
 * advantages. See destroySoon() for more details.
 * 
 * @api public
 */

GridWriteStream.prototype.end = function(buffer){
	
	var self = this;
	var args = arguments;

	this.opQueue.push([self._end,args]);	

	self._flush();
}

/**
 * _The implementation of the write() function._ 
 * 
 * @api private
 */

GridWriteStream.prototype._write = function(buffer){
	
	var self = this;

	if(this.writable){
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
		
		this.gridStore.write(buffer,function(err){
			if(err) self._throw(err);
			self.emitter.emit('_op');
			self.emit('drain');
		});
		
		return true;
		
	}else{
	 	this._throw(new Error('This stream is not writable.'));
	 	this.emitter.emit('_op');
	}
}

/**
 * _The implementation of the end() function._ 
 * 
 * @api private
 */

GridWriteStream.prototype._end = function(buffer){

	var self = this;

	if(this.writable){
		if(!buffer){
			return this.destroy();
		}
	
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
				
		this.destroySoon();
		this._write(buffer);
	}else{
		this._throw(new Error('This stream is not writable.'));
		self.emitter.emit('_op');
	}
}

/**
 * _Closes the stream._
 *
 * This method should only be used to close streams 
 * on severe errors, in other cases use end() or destroySoon() 
 * to close the Writable Stream (preferably end). This allows previous writes to 
 * complete before the underlying database connection is closed.
 * 
 * @api public
 */
 
GridWriteStream.prototype.destroy = function(){
	
	var self = this;
	
	this.writable = false;
	this.readable = false;
	this.connected = false;
	this.busy = false;
			
	this.gridStore.close(function(err,result){
		if(err) self._throw(err);
		
		self.db.close();
		self.emit('close');
	});
}

/**
 * _Completes all writes then closes the stream._
 *
 * This will only work if there have been previous writes. If you wish
 * to close the stream before writing anything, use end().
 * 
 * Note: This function can be called before any writes have been called to 
 * close the stream after the first write completes.
 *
 * @api public
 */

GridWriteStream.prototype.destroySoon = function(){

	var self = this;
	
	if(this.writable){
		if(this.opQueue.length > 1){	
			this.emitter.on('_op', function(){
				if(self.opQueue.length === 1){
					self.emitter.removeAllListeners('_op');
					self.emitter.once('_op', function(){
						self.destroy();
					});
				}
			});
		}else{
			this.emitter.removeAllListeners('_op');
			this.emitter.once('_op', function(){
				self.destroy();
			});
		}
	}else{
		this.destroy();
	}
}

/**
 * _Handles errors._
 *
 * This function is used internally to throw errors.
 *
 * @api private
 */

GridWriteStream.prototype._throw = function(err){
	
	this.emit('error', err);
	this.writable = false;
}

/**
 * _Creates an Writable GridStream._
 *
 * @returns a Writable GridStream instance
 *
 * This is a class convenience method.
 *
 * @api public
 */

GridStream.createGridWriteStream = function(dbname, filename, mode, options){

	return new GridWriteStream(dbname, filename, mode, options);
}

/**
 * _Exports._
 */
 
exports.GridWriteStream = GridWriteStream;
exports.GridReadStream = GridReadStream;

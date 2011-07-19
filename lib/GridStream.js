/**
 * @author Siddharth Mahendraker
 * @version 0.2
 */

/**
 * _Module dependencies._
 */
 
var util = require("util"),
	stream = require('stream').Stream;

var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection,
	Chunk = require('mongodb').Chunk;
	
/**
 * _Creates an initialized GridStream instance._
 *
 * @class GridStream
 * 
 * @param {String} dbname
 * @param {String} filename
 * @param {String} mode
 * @param {Object} options (optional)
 * @param {Function} callback
 * 
 * GridStream is a subclass of Stream, meaning it is (almost) compatible with pipe().
 * They emit all of the events that normal streams do, with the addition of 'pause'
 * and 'resume', which are emitted upon pause and resume.
 *
 * GridStream is a unidirectional stream.
 *
 * The mode parameter takes one of three values 'w', 'w+' and 'r',
 * 'w' is used to overwrite files or create them if they do not exist.
 * 'w+' is used to append new data to existing files, also creating them
 * if they do not exist.
 * 'r' is used to read files.
 *
 * A GridStream object initialized with 'r' as the mode will begin reading and upon completion,
 * close automatically.
 *
 * The options object can be used to specify the content\_type, metadata, chunk\_size
 * and root collection. The default root collection is 'fs'.
 *
 * @example var options = { "content\_type" : "plain/text", "metadata" : { "author" : "Sidd" },
 *  "chunk\_size" : 1024*4, "root" : 'articles' }; 
 *
 * The callback contains two parameters, an error object and the opened GridStream object.
 *
 * @api public
 */
	
function GridStream(dbname, filename, mode, options, callback){

	stream.call(this);

	var args = Array.prototype.slice.call(arguments, 0);
	var self = this;
	
	if((typeof options === 'function') && !(callback)){
 		callback = args.pop();
 		options = {};
 	}
 	 	
 	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	this.db = new Db(dbname, new Server(host, port, {}), { native_parser : true });
	this.filename = filename;
 	this.readable = mode === 'r' ? true : false;
 	this.writable = mode === ('w' || 'w+') ? true : false;
 	this.paused = false;
 	this.encoding = null;
 	this.options = options;
 	this.head = 0;
 	
 	this.options['root'] = this.options['root'] === undefined ? GridStore.DEFAULT_ROOT_COLLECTION : this.options['root'];
 	this.options['chunk_size'] = this.options['chunk_size'] === undefined ? Chunk.DEFAULT_CHUNK_SIZE : this.options['chunk_size'];
 	
 	this.gridStore = new GridStore(this.db, this.filename, mode, this.options);
 	
 	this.db.open(function(err){
		if(err) return callback(err, null);
		self.gridStore.open(function(err, gs){
			if(err) return callback(err, null);
			self.gridStore = gs;
			callback(null, self);
			if(self.readable) self._read();
		});
	});
};

util.inherits(GridStream, stream);

/*
 * _Sets the return data encoding._
 *
 * @param {String} encoding
 *
 * Setting the encoding return a encoded string instead of a Buffer
 * on the 'data' event.
 * 
 * @api public
 */
 
GridStream.prototype.setEncoding = function(encoding){

	if(encoding === 'utf8'||encoding === 'ascii'||encoding === 'base64') 
		this.encoding = encoding;
	else
		throw new Error('An unknown encoding was used.');
}

/*
 * _Pauses the read._
 * 
 * @api public
 */

GridStream.prototype.pause = function(){

	this.paused = true;
	this.emit('pause');
}

/*
 * _Resumes the read._
 * 
 * @api public
 */

GridStream.prototype.resume = function(){

	this.paused = false;
	if(this.readable) this._read();
	this.emit('resume');
}

/*
 * _Begins the read._
 *
 * This method is used internally to to begin/restart reading.
 * 
 * @api private
 */


GridStream.prototype._read = function(){

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
	 	throw new Error('This stream is not readable.');
	}
}

/*
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

GridStream.prototype.write = function(buffer){
	
	var self = this;
	
	if(this.writable){
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
		
		this.gridStore.writeBuffer(buffer,function(err){
			if(err) throw err;
			self.emit('drain');
		});
		
		return true;
		
	}else{
	 	throw new Error('This stream is not writable.');
	}
}

/*
 * _Writes data to the stream and then closes it._ 
 *
 * @param {Buffer|String} buffer (optional)
 * 
 * @api public
 */

GridStream.prototype.end = function(buffer){

	var self = this;

	if(this.writable){
		if(!buffer) return this.destroy();
	
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
				
		this.destroySoon();
		this.write(buffer);
	}else{
		throw new Error('This stream is not writable.');
	}		
}

/*
 * _Closes the stream._
 *
 * This method should only be used if you need to prematurely end
 * a read stream. Otherwise, to close a write stream use end() or 
 * destroySoon(). This allows the write to complete before the 
 * underlying database connection is closed.
 * 
 * @api public
 */
 
 GridStream.prototype.destroy = function(){
	
	var self = this;
	
	this.gridStore.close(function(err,result){
		if(err) throw err;
		self.db.close();
		self.emit('close');
	});
}

/*
 * _Completes all writes then closes the stream._
 *
 * @api public
 */

GridStream.prototype.destroySoon = function(){

	var self = this;
	
	if(this.writable){
		this.once('drain', function(){
			self.destroy();
		});
	}else{
		this.destroy();
	}
}

/**
 * _Exports._
 */

module.exports = GridStream;

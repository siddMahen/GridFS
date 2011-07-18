/**
 * @author Siddharth Mahendraker
 * @version 0.1
 */

/**
 * _Module dependencies._
 */
 
var GridFS = require('./GridFS');
 
var util = require("util"),
	events = require('events');

var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection,
	Chunk = require('mongodb').Chunk;
	
/* 
 Work in progress....
 */
	
function GridStream(dbname, filename, mode, options, callback){

	events.EventEmitter.call(this);

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

util.inherits(GridStream, events.EventEmitter);

GridStream.prototype.write = function(buffer){
	
	var self = this;
	
	if(this.writable){
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
		
		this.gridStore.writeBuffer(buffer,function(err){
			if(err) throw err;
			self.emit('drain');
		});
	}else{
	 	throw new Error('This stream is not writable.');
	}
}

GridStream.prototype._read = function(){

	var self = this;

	if(this.readable){
		var len;
			
		if(this.head + this.options.chunk_size > this.gridStore.length)
			len = this.gridStore.length - this.head;
		else
			len = this.options.chunk_size;
		
		GridStore.read(self.db, self.filename, len, self.head, { 'root' : self.options.root }, function(err, data){
			self.emit('data', new Buffer(data));
					
			self.head += len;
			if(self.head !== self.gridStore.length)
				self._read();
			else{
				self.emit('end');
				self.close();	
			}
		});
	}else{
	 	throw new Error('This stream is not readable.');
	}
}

GridStream.prototype.end = function(buffer){

	var self = this;

	if(this.writable){
		if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
		
		this.write(buffer);
		this.close();
	}else{
		throw new Error('This stream is not writable.');
	}		
}

GridStream.prototype.close = function(){
	
	var self = this;
	
	this.gridStore.close(function(err,result){
		if(err) throw err;
		self.db.close();
		self.emit('close');
	});
}

module.exports = GridStream;

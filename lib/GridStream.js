/**
 * @author Siddharth Mahendraker
 * @version 0.1
 */

/**
 * _Module dependencies._
 */
 
/* 
 Work in progress....
 */
 
var GridFS = require('./GridFS');
 
var util = require("util"),
	stream = require('stream');

var GridStore = require('mongodb').GridStore,
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	Connection = require('mongodb').Connection;
	
function GridStream(gridFS, filename, mode, options, callback){

	var args = Array.prototype.slice.call(arguments, 0);
	var self = this;
	
	if((typeof options === 'function') && !(callback)){
 		callback = args.pop();
 		options = {};
 	}
 	
 	if(!(gridFS instanceof GridFS)) return callback(new Error('A GridFS object is required.'),null);
 	
 	this.gridFS = gridFS;
 	this.filename = filename;
 	this.mode = mode === 'r' ? 'r' : mode;
 	this.options = options;
 	
 	this.options.root = this.options.root === undefined ? this.gridFS.fs : this.options.root;
 	
 	callback(null, this);
};

GridStream.prototype.write = function(buffer){

	if(!(buffer instanceof Buffer)) buffer = new Buffer(buffer);
	this.gridFS.put(buffer, this.filename, 'w+', this.options, function(){});
}

GridStream.prototype.read = function(){
	
}

GridStream.prototype.close = function(){
	this.gridFS.close();
}

module.exports = GridStream;

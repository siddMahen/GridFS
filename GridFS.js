/**
 * @author Siddharth Mahendraker
 * @version 0.1
 */

/**
 * _Module dependencies._
 *
 * These can also be run solely using mongoose using the
 * following syntax:
 *
 * @example var GridStore = require('mongoose').mongo.GridStore,
 *					   Db = require('mongoose').mongo.Db,
 *	   etc...
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

	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	this.dbcon = new Db(dbname, new Server(host, port, {}), { native_parser : true });
	
	this.fs = filesys === undefined ? 'fs' : filesys;
};

/**
 * _Stores a file._
 *
 * @param {Buffer} buffer
 * @param {String} filename 
 * @param {String} mode
 * @param {Object} options
 * @param {Function} callback (optional)
 *
 * mode can be set to either 'w' to overwrite the content of the file
 * or 'w+' to append to the contents of the file.
 * 
 * options can be used to specify the content_type, metadata and chunk_size
 *
 * @example var options = {"content\_type":"image/png","metadata":{ "person": "George"},"chunk\_size": 1024*4};
 *
 * The callback takes an error and a result parameter which provides information
 * such as MD5 hash. Although it is optional, the callback parameter 
 * is recommended to handle errors.
 *
 * @api public
 */

GridFS.prototype.putFile = function(buffer, filename, mode, options, callback){

	var fs = this.fs;
		
	options.root = options.root === undefined ? fs : options.root;
	
	this.dbcon.open(function(err, database){
		if(err && callback) callback(err, null);
		
		var gridStore = new GridStore(database, filename, mode, options);

		 gridStore.open(function(err, gridStore){
		 	if(err && callback) callback(err, null);
		 	gridStore.write(buffer, function(err, gridStore){
		 		if(err && callback) callback(err, null);
		 		gridStore.close(function(err, result){
		 			database.close();
		 			if (callback) callback(err, result);
		 		});
		 	});
		 });
	});
};

/**
 * _Gets a file._
 *
 * @param {String} filename
 * @param {Function} callback
 *
 * The callback function takes an error and the return data as parameter
 *
 * @api public
 */

GridFS.prototype.getFile = function(filename, callback){

	var fs = this.fs;
	// !TODO: Add support for length(size) and offset in read
	this.dbcon.open(function(err, database){	
		if(err) callback(err, null);

		var gridStore = new GridStore(database, filename, 'r', { 'root'
		 : fs });

		GridStore.exist(database, filename, function(err, exists){
			if(err) callback(err, null);
			if(exists === true)
			{
				gridStore.open(function(err, gridStore){
					if(err) callback(err, null);
					gridStore.read(function(err, data){
						database.close();
						callback(err,data);
					});
				});				
			}
			else
			{
				callback(Error('This file does not exist'),null);
			}	
		});
	});
};	

/**
 * _Deletes a file._ 
 *
 * @param {String} filename
 * @param {Function} callback
 *
 * The callback function takes an error as a parameter
 *
 * @api public
 */

GridFS.prototype.deleteFile = function(filename, callback){

	this.dbcon.open(function(err,database){
		if(err && callback) callback(err);
		GridStore.unlink(database,filename,function(){
			database.close();
			if(callback) callback(null);
		});
	});
};

/**
 * _Exports._
 */
 
exports.GridFS = GridFS;


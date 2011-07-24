// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridFS = require('../lib/GridFS');
var assert = require('assert');

var buffer = new Buffer('Hello John');
var secBuffer = new Buffer('Hello Nancy');

var FS = new GridFS('test');

FS.put(buffer, 'Test', 'w', function(err){
	assert.ifError(err);
	FS.get('Test',function(err, data){
		assert.ifError(err);
		assert.strictEqual(data, 'Hello John','Error returning correct data on: "Hello John"');
		FS.delete('Test',function(err){
			assert.ifError(err);
		})
	});
});

FS.put(secBuffer, 'Another Test', 'w', function(err){
	assert.ifError(err);
	FS.get('Another Test',function(err, data){
		assert.ifError(err);
		assert.strictEqual(data, 'Hello Nancy','Error returning correct data on: "Hello Nancy"');
		FS.delete('Another Test',function(err){
			assert.ifError(err);
		});
	});
});

setTimeout(function(){
	FS.close();
},500);

var newBuf = new Buffer('Hello');

setTimeout(function(){
	FS.open();
	FS.put(newBuf,'HelloTest','w',function(err,data){
		assert.ifError(err);
		assert.ok(data,'Error putting correct data on: "Hello"');
		FS.delete('HelloTest',function(err){
				assert.ifError(err);
				FS.close();
		});
	});
},1000);

process.on('exit', function () {
	console.log('Passed.');
});


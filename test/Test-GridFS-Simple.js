// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridFS = require('../lib/GridFS');
var assert = require('assert');

var buffer = new Buffer('Hello John');
var secBuffer = new Buffer('Hello Nancy');

var FS = new GridFS('test');

// GridFS calls are queued up so they complete in order
FS.put(buffer, 'Test', 'w', function(err){
	assert.ifError(err);
});

FS.get('Test',function(err, data){
	assert.ifError(err);
	assert.strictEqual(data.toString(), 'Hello John','Error returning correct data on: "Hello John"');
});

FS.delete('Test',function(err){
	assert.ifError(err);
});

// This is another method to achieve a slightly different outcome,
// as the next function is queued once the first is completed
// Note that in this method, FS.close() must be called at the bottom
// of the callback tree, or else it will be queued to run after FS.put()
// is complete
FS.put(secBuffer, 'Another Test', 'w', function(err){
	assert.ifError(err);
	FS.get('Another Test',function(err, data){
		assert.ifError(err);
		assert.strictEqual(data.toString(), 'Hello Nancy','Error returning correct data on: "Hello Nancy"');
		FS.delete('Another Test',function(err){
			assert.ifError(err);
			var t = 0;
			FS.close(function(){
				t = 1;
			});
			assert.strictEqual(1,t);
		});
	});
});

var newBuf = new Buffer('Hello');

setTimeout(function(){
	FS.open(function(err){
		assert.ifError(err);
	});
	FS.put(newBuf,'HelloTest','w',function(err,data){
		assert.ifError(err);
		assert.ok(data,'Error putting correct data on: "Hello"');
	});
	FS.delete('HelloTest',function(err){
		assert.ifError(err);
	});
	FS.close();
},1000);

process.on('exit', function () {
	console.log('Passed.');
});


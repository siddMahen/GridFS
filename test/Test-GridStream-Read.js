// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridStream = require('../lib/GridStream');
var GridFS = require('../lib/GridFS');
var assert = require('assert');
var fs = require('fs');

var myFS = new GridFS('test');
var buff = new Buffer('Which smoked with bloody execution, Like valour\'s minion carved out his passage \n\r\0');
var testText = new Buffer('The art of government is to make two-thirds of a nation pay all it possibly can pay for the benefit of the other third.');

assert.doesNotThrow(function(){
	myFS.put(buff,'AnotherFile.txt','w',function(err){
		assert.ifError(err);
		var stream = GridStream.createGridReadStream('test','AnotherFile.txt');
		stream.pipe(process.stderr, { end : false });
	});
},'Piping out failed.');

myFS.put(testText,'Text.txt','w',function(err){
	assert.ifError(err);
	var stream = GridStream.createGridReadStream('test','Text.txt',{ 'chunk_size' : 3 });

	var Data = "";

	stream.setEncoding('utf8');
	stream.setEncoding('base64');
	stream.setEncoding('ascii');

	stream.once('data',function(data){
		stream.pause();
		setTimeout(function(){
			stream.resume();
		},1000);
	});

	stream.on('error',function(err){
		assert.ifError(err);
	});
	myFS.close();
});

process.on('exit', function () {
	console.log('Passed.');
});

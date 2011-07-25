// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridStream = require('../lib/GridStream');
var GridFS = require('../lib/GridFS');
var assert = require('assert');
var fs = require('fs');

fs.writeFileSync('TestFile.txt', 'A Mari Usque Ad Mare');
fs.writeFileSync('Long.txt','Add gibberish of text here');

assert.doesNotThrow(function(){
	var wstream = GridStream.createGridWriteStream('test','TestFile.txt','w');
	var rstream = fs.createReadStream('TestFile.txt');
	rstream.pipe(wstream);
},'Piping in failed.');

var buff = fs.readFileSync('Long.txt');
var FStream = GridStream.createGridWriteStream('test','Long.txt','w');

FStream.write(' This should be in front ');
FStream.write(buff);
FStream.end(' This should be in behind ');

FStream.on('error', function(err){
	assert.ifError(err);
});

process.on('exit', function () {
	fs.unlinkSync('Long.txt');
	fs.unlinkSync('TestFile.txt');
	console.log('Passed.');
});
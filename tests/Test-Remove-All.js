// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridFS = require('../lib/GridFS');
var fs = new GridFS('test');

fs.delete('AnotherFile.txt');
fs.delete('Text.txt');
fs.delete('TestFile.txt');
fs.delete('Long.txt');
fs.close();
	
process.on('exit', function () {
	console.log('Passed.');
	console.log('Cleanup complete.');
});
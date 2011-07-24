// GridFS
// Copyright(c) 2011 Siddharth Mahendraker <siddharth_mahen@me.com>
// MIT Licensed

var GridFS = require('../lib/GridFS');
var fs = new GridFS('test');

fs.delete('AnotherFile.txt',function(){
	fs.delete('Text.txt',function(){
		fs.delete('TestFile.txt',function(){
			fs.delete('Long.txt',function(){
				fs.close();
			});
		});
	});
});

process.on('exit', function () {
	console.log('Passed.');
	console.log('Cleanup complete.');
});
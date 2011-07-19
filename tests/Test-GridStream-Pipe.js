
var GridStream = require('../lib/GridStream');
var http = require('http');

var stream = new GridStream('test','test','r',function(err, gs){

	gs.pipe(process.stdout, { end : false });
	console.log('Piping out works.');
});



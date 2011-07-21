
var GridStream = require('../lib/GridStream');
var fs = require('fs');

var stream = GridStream.createGridReadStream('test','test');

stream.pipe(process.stdout, { end : false });
console.log('Piping out works.');

var astream = GridStream.createGridWriteStream('test','README.md','w');

var rstream = fs.createReadStream('README.md');
rstream.pipe(astream);
console.log('Piping in works.');

var stream = GridStream.createGridReadStream('test','test',{ 'chunk_size' : 3 });

console.log('Beginning read.');
var Data = "";

stream.setEncoding('ascii');

stream.once('data',function(data){

	stream.pause();
	console.log('Read paused.');
	setTimeout(function(){
		stream.resume();
		console.log('Read resumed.');
	},1000);
});

stream.on('data', function(data){
	Data = Data.concat(data);
});

stream.on('end', function(){
	console.log('Data: '+Data);
	console.log('Read succeeded.');
});

stream.on('close', function(){
	console.log('Read closed.');		
});



var FStream = GridStream.createGridWriteStream('test','someTest','w');

console.log('Beginning write.');

FStream.write('This test should work... ');

FStream.on('drain',function(){
	console.log('Write succeeded.');
});

FStream.end();

FStream.on('close',function(){
	console.log('Write closed.');
});


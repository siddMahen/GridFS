
var GridStream = require('../lib/GridStream');
var GridFS = require('../lib/GridFS');


var stream = new GridStream('test','someTest','r',{ 'chunk_size' : 3 }, function(err, gs){

	if(err) console.log(err);
	
	console.log('Beginning read.');
	var Data = "";

	gs.on('data', function(data){
		Data = Data.concat(data.toString('utf-8',0,data.length));
	});
	
	gs.on('end', function(){
		console.log('Data: '+Data);
		console.log('Read succeded.');
	});
	
	gs.on('close', function(){
		console.log('Read closed.');		
	});
});


var FStream = new GridStream('test','test','w',function(err, gs){
	if(err) console.log(err);
	console.log('Beginning write.');
	gs.write('This test should work... ');
	console.log('Write succeded.');
	gs.end('Ending...');
	
	gs.on('close',function(){
		console.log('Write closed.');
	});
});

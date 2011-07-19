
var GridStream = require('../lib/GridStream');

var stream = new GridStream('test','test','r',{ 'chunk_size' : 3 }, function(err, gs){

	if(err) console.log(err);
	
	console.log('Beginning read.');
	var Data = "";
	
	gs.setEncoding('ascii');

	gs.once('data',function(data){
	
		gs.pause();
		console.log('Read paused.');
		setTimeout(function(){
			gs.resume();
			console.log('Read resumed.');
		},1000);
	});

	gs.on('data', function(data){
		Data = Data.concat(data);
	});
	
	gs.on('end', function(){
		console.log('Data: '+Data);
		console.log('Read succeeded.');
	});
	
	gs.on('close', function(){
		console.log('Read closed.');		
	});
});


var FStream = new GridStream('test','someTest','w',function(err, gs){
	if(err) console.log(err);
	console.log('Beginning write.');
	gs.write('This test should work... ');
	console.log('Write succeeded.');
	gs.end();
	
	gs.on('close',function(){
		console.log('Write closed.');
	});
});

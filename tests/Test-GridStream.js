
var GridStream = require('../lib/GridStream');
var GridFS = require('../lib/GridFS');


var FStream = new GridStream('test','test','w',function(err, gs){
	if(err) console.log(err);
	gs.write('Hey ;)');

	gs.close();
});

var stream = new GridStream('test','test','r',{ 'chunk_size' : 2 }, function(err, gs){

	if(err) console.log(err);

	gs.on('data', function(err, data){
		if(err) console.log(err);
		console.log(data);
		gs.close();

	});
	
	gs.on('complete', function(){
		
	});
	
	gs.read();
});
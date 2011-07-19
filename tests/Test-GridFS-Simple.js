
var GridFS = require('../lib/GridFS');

var buffer = new Buffer('Hello Siddharth');
var secBuffer = new Buffer('Hello Rohan');

// !TODO: Perhaps add some optimizations which close and open the database on demand,
	//		  ergo, after 30 seconds of inactivity the connection to the db is closed
    //		  if another request is made, then it will queue the request, open and then perform
    //
	//
	//this.i = setInterval(function(){
	//	var tt = setTimeout(function(){
	//		 clearInterval(self.i)
	//		 console.log('final close');
	//	 },20000);
	//
	//	if(self.opQueue.length === 0){
	//		 self.close();
	//		 console.log(self.dbcon.state);
	//	}else{
	//		 clearTimeout(tt);
	//		 self.open();
	//	}
	//},10000);
	//

var FS = new GridFS('test');

FS.put(buffer, 'Test', 'w', function(err){
	if(err) console.log(err);
	console.log('Data inserted.');
	FS.get('Test',function(err, data){
		if(err) console.log(err);
		console.log('Data: "'+data+'" received.');
		FS.delete('Test',function(err){
			if(err) console.log(err);
			console.log('File Deleted.');
		})
	});
});

FS.put(secBuffer, 'Another Test', 'w', function(err){
	if(err) console.log(err);
	console.log('Data inserted.');
	FS.get('Another Test',function(err, data){
		if(err) console.log(err);
		console.log('Data: "'+data+'" received.');
		FS.delete('Test',function(err){
			if(err) console.log(err);
			console.log('File Deleted.');
		});
	});
});

setTimeout(function(){
	FS.close();
},500);

setTimeout(function(){
	FS.open();
	FS.put(new Buffer('Hello'),'HelloTest','w',function(err,data){
		if (err) console.log(err);
		FS.close();
		console.log('Received.');
	});
	console.log('Sent.');

},1000);




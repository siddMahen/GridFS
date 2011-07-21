# GridFS

Simple GridFS capabilities built on [node-mongodb-native](https://github.com/christkv/node-mongodb-native "node-mongodb-native").
 
* * *

## Usage:

To use, simply include GridFS.js or GridStream.js in your project:
<code>
<pre>
var GridFS = require('path/to/GridFS.js');
var GridStream = require('path/to/GridStream.js');
</pre>
</code>

## Tests:

To run the tests:
<code>
<pre>
make tests
</pre>
</code>

## Example:

A simple Hello World example using GridFS.

<code>
<pre>
var GridFS = require('../GridFS.js');

// Use the test database
var myFS = new GridFS('test');
var text = new Buffer('Hello World!');

myFS.put(text, 'Hello World!', 'w', function(err){
	myFS.get('Hello World!',function(err,data){
		console.log(data);
	});
});
</pre>
</code>

A similar example using GridStream.

<code>
<pre>
var GridStream = require('../GridStream.js');

// Use the test database and open or create 'Hello World!'
var writeStream = GridStream.createGridWriteStream('test','Hello World!','w');

writeStream.write('Hello World!');
writeStream.end();
</pre>
</code>


## Documentation:

Click [here](http://siddmahen.github.com/GridFS) to view the documentation online, or look at the source.

## License:

(The MIT License)

Copyright (C) 2011 by Siddharth Mahendraker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	zipstream = require('zipstream'),
	express = require('express'),
	app = express.createServer();

// Configure the server
app.configure(function() {
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(app.router);

	// Use Jade as renderer
	app.set('view engine', 'jade');
});

// Setup global route
app.get('/', function (req, res) {
	// Write out response headers
	res.writeHead(200, {
		'Content-Type': 'application/zip',
		'Content-Description': 'Filter Transfer',
		'Content-Disposition': 'attachment; filename="jquery.qtip.zip"'
	});

	// Construct our zip file
	constructZip(res, ['js/1.js', 'js/2.js', 'js/3.js', 'js/4.js', 'js/5.js'], 'nightly');
});

// Listen on port 80... HTTP!!!11
app.listen(80, '109.123.70.57');

/*
 * Dynamic zip constructor / caching
 */
function constructZip(res, files, version) {
	var zip, result, cachePath, cacheExists, cache;

	// Create new zip stream
	zip = zipstream.createZip({ level: 1 }); 

	// Write out response to server on stream write
	zip.on('data', function(data) { res.write(data); });

	// When the stream ends close server response
	zip.on('end', function() { res.end();  });

	// Loop through all other files and add them sequentially using promises
	result = Q.resolve();
	files.forEach(function(file) {
		result = result.then(function() {
			// If file is found, add it
			if(fs.existsSync(file)) {
				console.log('Adding file: ', file);
				return Q.ncall(zip.addFile, zip, fs.createReadStream(file), {
					name: path.basename(file)
				});
			}

			// File wasn't found...
			else {
				console.log('Cannot locate file: ', file, '. Skipping...');
				return Q.resolve();
			}
		});
	});

	// Finalize the zip file when done
	result.then(function() {
		zip.finalize();
		console.log('Finished zipping!');
	});
}
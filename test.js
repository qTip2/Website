var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	zipstream = require('zipstream');

/*
 * Dynamic zip constructor / caching
 */
function build(res, files, version) {
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

exports.build = build
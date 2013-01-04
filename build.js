var Registry = require('./registry'),
	zipstream = require('zipstream'),
	cp = require('child_process'),
	paths = require('./paths'),
	util = require('util'),
	path = require('path'),
	tmp = require('tmp'),
	fs = require('fs'),
	Q = require('q');

// Additional file paths
var jquery = path.resolve('./build/jquery.min.js');

/* 
 * Init
 */
function init(res, params) {
	console.log('Generating download package...');

	// Setup styles to include
	var styles = [];
	for(style in params.styles) { styles.push(style); }

	// Setup plugins to include
	var plugins = [];
	for(plugin in params.plugins) { plugins.push(plugin); }

	// Set the response headers
	res.set({
		'Pragma': 'public',
		'Expires': '0',
		'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
		'Cache-Control': 'public',
		'Content-Description': 'File Transfer',
		'Content-type': 'application/zip',
		'Content-Disposition': 'attachment; filename="jquery.qtip.custom.zip"'
	});

	// Check if a cached version is
	process.stdout.write('Checking cache... ');
	var cache = generateCacheURI(params), file;

	// If a cached ZIP was found, send it
	if(fs.existsSync(cache)) {
		console.log('found! Using: %s', path.relative(paths.buildcache, cache));
		fs.createReadStream(cache).pipe(res);
		return;
	}
	else { console.log('none found.') }
	
	// Create temp directory to build into
	tmp.dir(function(err, tmpdir) {
		console.log('Grunting files...');

		// Spawn grunt process
		var grunt = cp.spawn('grunt', [
			'--dist='+tmpdir,
			'--plugins='+(plugins.join(' ') || ''),
			'--styles='+(styles.join(' ') || '')
		], {
			cwd: paths.git[params.version],
			stdio: [0,1,2]
		});

		// When all grunt-ed...
		grunt.on('exit', function(code) {
			// Get tmp directory file listing
			Q.ninvoke(fs, 'readdir', tmpdir)

			// Convert grunt-ed files to absolute file paths
			.then(function(files) {
				files.forEach(function(file, i) {
					files[i] = path.resolve(tmpdir, file);
				});
				return files;
			})

			// Add additional zip contents based on params
			.then(function(files) {
				process.stdout.write('Adding additional files... ');

				// Add jQuery if enabled
				if(params.jq || params.jquery) {
					process.stdout.write('jQuery ');
					files.unshift(jquery);
				}

				process.stdout.write("\n");
				return files;
			})

			// Once grunt-ed, create our zip file
			.then(function(files) {
				console.log('Streaming zip file...');
				return constructZip(res, files, params);
			})

			// Done. Cleanup temporary files/dir
			.then(function(files) {
				var result = Q.resolve();

				console.log('Done! Cleaning up temporary files...');

				// Delete all files within the temp directory
				files.forEach(function(file) {
					if( path.relative(tmpdir, file).substr(0,2) !== '..' ) {
						result = Q.ninvoke(fs, 'unlink', file);
					}
					else { result = Q.resolve(); }
				});

				// Attempt to remove the temp directory itself
				result.then(function() {
					return Q.ninvoke(fs, 'rmdir', tmpdir);
				});

				return result;
			})

			// Redirect to download page on error
			.fail(function(err) {
				res.redirect('download/error');
			});
		});
	});
}

/*
 * Generates a cache filename (with build path) from passed params
 */
function generateCacheURI(params) {
	var name = [ Registry.build[params.version].version ];

	for(i in params.plugins) {
		if(params.plugins[i] === 'on') { name.push(i.substr(0,2)); }
	}
	for(i in params.styles) {
		if(params.styles[i] === 'on') { name.push(i); }
	}
	if(params.jquery) { name.push('jq'+params.jquery.replace(/\./g, '')) }
	
	return path.join(paths.buildcache, params.version, name.join('-') + '.zip');
}

/*
 * Dynamic zip constructor / caching
 */
function constructZip(res, files, params) {
	var deferred = Q.defer(),
		zip, file, result;

	// Create new zip and file streams
	zip = zipstream.createZip({ level: 1 });
	file = fs.createWriteStream(generateCacheURI(params));

	// Pipe output to response and file
	zip.pipe(res); zip.pipe(file);

	// Loop through all other files and add them sequentially using promises
	result = Q.resolve();
	files.forEach(function(file) {
		result = result.then(function() {
			// If file is found, add it
			if(fs.existsSync(file)) {
				//console.log('Adding file: ', file);
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
		deferred.resolve(files);
	});

	return deferred.promise;
}

exports.build = function(req, res) {
	init(res, req.body);
};
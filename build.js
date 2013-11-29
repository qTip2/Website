var Registry = require('./registry'),
	archiver = require('archiver'),
	cp = require('child_process'),
	rmdir = require('rmdir'),
	ncp = require('ncp'),
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
function init(req, res, params) {
	console.log('Generating download package...');
	var styles = [], plugins = [], extras = [];

	// Setup styles and plugins to include
	for(style in params.styles) { styles.push(style); }
	for(plugin in params.plugins) { plugins.push(plugin); }
	for(extra in params.extras) { extras.push(extra); }

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

	// Log it
	fs.appendFile(
		path.join(paths.logs, 'build.log'),
		'[' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ']' +
			(' '+Registry.build[params.version].version) + 
			' (' + (plugins.join(' ')||'None') + ' / ' + (styles.join(' ')||'None') + ')' + 
			' + ' + extras + ' [' + req.ip + "]\n"
	);

	// Check if a cached version is
	process.stdout.write('Checking cache... ');
	var cache = generateCacheURI(params).cache, file;

	// If a cached ZIP was found, send it
	if(fs.existsSync(cache)) {
		console.log('found! Using: %s', path.relative(paths.buildcache, cache));
		fs.createReadStream(cache).pipe(res);
	}
	else {
		console.log('none found.');
		
		// Create temp directory to build into
		tmp.dir({ dir: paths.tmp, unsafeCleanup: true }, function(err, tmpdir) {
			//console.log('Grunting files into %s...', tmpdir);

			// Spawn grunt process
			var grunt = cp.spawn('grunt', [
					'--dist='+tmpdir,
					'--plugins='+(plugins.join(' ') || ''),
					'--styles='+(styles.join(' ') || ''),
					'--'+params.version
				], {
					cwd: paths.git[params.version],
					stdio: process.env.DEBUG ? 'inherit' : 'ignore'
				});

			// When all grunt-ed...
			grunt.on('exit', function(code) {
				// Get tmp directory file listing
				Q.ninvoke(fs, 'readdir', tmpdir)

				// Redirect to download page on error
				.fail(function(err) {
					res.redirect('download/error');
				})

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

					// Add any extras
					extras.forEach(function(extra) {
						if(extra === 'jquery') {
							process.stdout.write('jQuery ');
							files.unshift(jquery);
						}
					})

					process.stdout.write("\n");
					return files;
				})

				// Once grunt-ed, create our zip file
				.then(function(files) {
					console.log('Streaming zip file...');
					return constructZip(res, files, params, tmpdir);
				})

				// Done. Cleanup temporary files/dir
				.then(function(files) {
					console.log('Done! Cleaning up temporary files...');
					return Q.nfcall(rmdir, tmpdir);
				})
			});
		});
	}
}

/*
 * Generates a cache filename (with build path) from passed params
 */
function generateCacheURI(params, tmpdir) {
	var name = [ Registry.build[params.version].version ];

	for(i in params.plugins) {
		if(params.plugins[i] === 'on') { name.push(i.substr(0,2)); }
	}
	for(i in params.styles) {
		if(params.styles[i] === 'on') { name.push(i); }
	}
	if(params.jquery) { name.push('jq'+params.jquery.replace(/\./g, '')) }

	return {
		tmp: tmpdir ? path.join(tmpdir, name.join('-') + '.zip') : null,
		cache: path.join(paths.buildcache, params.version, name.join('-') + '.zip')
	}
}

/*
 * Dynamic zip constructor / caching
 */
function constructZip(res, files, params, tmpdir) {
	var deferred = Q.defer(),
		zip, file, paths, result;

	// Create new zip and file streams
	archive = archiver('zip');
	paths = generateCacheURI(params, tmpdir);
	file = fs.createWriteStream( paths.tmp );

	// Pipe output to response and file, and handle errors
	archive.pipe(res); archive.pipe(file);
	archive.on('error', function(err) {
		console.log('Uhoh... error encountered!', err);
	})

	// Loop through all other files and add them sequentially using promises
	files.forEach(function(file) {
		// If file is found, add it
		if(fs.existsSync(file)) {
			//console.log('Adding file: ', file);
			archive.append(fs.createReadStream(file), { name: path.basename(file) })
		}

		// File wasn't found...
		else { console.log('Cannot locate file: ', file, '. Skipping...'); }
	});

	// Finalize the zip file when done
	archive.finalize(function(err) {
		if(err) { throw err; }

		// Copy the zip file into the cache directory
		ncp(paths.tmp, paths.cache, function(err) {
			// Resolve the deferred
			deferred.resolve(files);
			if(err) { console.error(err); }
		}); 
	});

	return deferred.promise;
}

exports.build = function(req, res) {
	init(req, res, req.body);
};

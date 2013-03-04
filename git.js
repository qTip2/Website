var Registry = require('./registry')
	, paths = require('./paths')
	, Q = require('q')
	, util = require('util')
	, fs = require('fs')
	, path = require('path')
	, git = require('gift')
	, cp = require('child_process')
	, glob = require('glob-whatev')
	, colors = require('colors');

// File list to generate file sizes for and it's JSON key mapping
var _files = {
	'core.js': 'core',
	'../../jquery.min.js': 'jquery',
	'*/*.js': 'plugins[%s]',
	'core.css': 'styles[core]',
	'basic.css': 'styles[basic]',
	'css3.css': 'styles[css3]'
};


var cwd = '';
function exec(cmd, newcwd, message) {
	return function() {
		if(message) {
			console.log(message+'...', cmd.green);
		}

		return Q.ninvoke(cp, 'exec', cmd, {
			cwd: (cwd = newcwd || cwd)
		});
	}
}

/*
 * Wiki update
 */
function wiki() {
	console.log('Updating wiki files...');

	// Grab the JSON payload
	var result = Q.resolve();

	// Update the wiki repo
	return result.then( exec('git pull', paths.wiki) )

	// List all the wiki files
	.then(function() {
		return Q.ninvoke(fs, 'readdir', paths.wiki);
	})

	// Update wiki files in Registry
	.then(function(files) {
		files.forEach(function(file) {
			Registry.markdown[ path.basename(file, '.md') ] = fs.readFileSync(
				path.join(paths.wiki, file)
			).toString();
		});
	});
}

/*
 * Repository update
 * 
 * Updates the git repositories and generates new file size
 * mappings and commit message for download page
 */
function repos() {
	// Grab the JSON payload
	var result = Q.resolve(),
		stableVersion;

	// For both nightly and stable repos
	console.log('Updating repos and parsing src file sizes...');
	['nightly', 'stable'].forEach(function(version) {
		// Clean up dist/
		result = result.then(exec('grunt clean', paths.git[version], 'Cleaning up dist/ dir'));

		// Pull newest commits
		result = result.then(exec('git pull origin master', null, 'Pulling '+version+' repo '));

		// If stable... check out latest tag
		if(version === 'stable') {
			result = result.then(exec('git tag -l | tail -1'))
				.then(function(tag) { return tag[0].trim(); }) // Clean it up
				.then(function(tag) {
					stableVersion = tag.substr(1);
					return exec('git checkout '+tag, null, 'Checking out latest stable ')();
				})
		}


		// Generate archive files
		result = result.then(function() {
			var dir = path.join(paths.archive, version === 'stable' ? stableVersion : version);

			// Ensure the package archive has this tag....
			var q = exec('mkdir ' + dir)().fail(function() { })
				.then(exec('grunt dev', null, 'Generate '+version+' archive files'))
				.then(exec('cp -r dist/* ' + dir, null, 'Copying generated files'));

			// Create stable latest link files
			if(version === 'stable') {			
				q.then(exec('rm stable &> /dev/null', paths.archive))
				.then(exec('ln -s '+dir+' stable', paths.archive, 'Linking latest files'));
			}

			return q;
		})

		// Generate file size object
		result = result.then(function() {
			console.log('Calculating file sizes...');
			for(pattern in _files) {
				var filepath = path.join(paths.git[version], 'src', pattern);

				// Locate files and loop over
				glob.glob( filepath ).forEach(function(file) {
					var subject = _files[pattern];

					// Grab fileesize and set
					return Q.ninvoke(fs, 'stat', file).then(function(stats) {
						// Generate object key from pattern and file basename
						var key = subject.indexOf('%s') > -1 ?
							util.format(subject, path.basename(file, '.js')) : subject;

						// Set the key in the Registry object
						Registry.build[version]['filesizes'][key] = stats.size;
					});
				});
			}
		});


	});

	// Generate cached commit message and digest in build folder
	result = result.then(function() {
		console.log('Caching latest commit message and digest...');

		// Setup git repo object
		var repo = git( path.resolve(path.join(paths.build, 'nightly')) );

		// Update the Registry build properties
		return Q.ncall(repo.commits, repo, null, 1, null).then(function(commit) {
			var details = commit[0];
			Registry.build.nightly.version = details.id.substr(0, 7);
			Registry.build.nightly.commitmsg = details.message;
			Registry.build.nightly.commitdate = details.committed_date;

			// Set stable properties
			var pkg = JSON.parse( fs.readFileSync( paths.git.stable + '/package.json' ) );
			Registry.build.stable.version = pkg.version;
		});
	})

	// Record on complete/failure
	.fin(function() { console.log('Done.'); })
	.fail(function(err) {
		console.error('Error: %s', err);
	});

	return result;
}

// GitHub Post hook IPs: 207.97.227.253, 50.57.128.197, 108.171.174.178
var githubIPs = /207\.97\.227\.253|50\.57\.128\.197|108\.171\.174\.178/;

function hookAuth(req, res, next) {
	// Only allow GitHub IP's through
	if(!githubIPs.test(req.ip)) {
		return res.send(500, 'Hold up... you\'re not GitHub! Shoo!');
	}

	console.log('POST hook from GitHub received...');
	next();
}

module.exports = {
	hookAuth: hookAuth,
	repos: repos,
	wiki: wiki
} 
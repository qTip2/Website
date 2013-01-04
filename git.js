var Registry = require('./registry')
	, paths = require('./paths')
	, Q = require('q')
	, util = require('util')
	, fs = require('fs')
	, path = require('path')
	, git = require('gift')
	, cp = require('child_process')
	, glob = require('glob-whatev');

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
function exec(result, cmd, newcwd) {
	return result.then(function() {
		return Q.ninvoke(cp, 'exec', cmd, {
			cwd: (cwd = newcwd || cwd)
		});
	});
}

/*
 * Wiki update
 */
function wiki() {
	// Grab the JSON payload
	var result = Q.resolve();

	// Update the wiki
	console.log('Updating wiki files...');
	return result.then(function() {
		return Q.ninvoke(cp, 'exec', 'git pull', {
			cwd: paths.wiki
		});
	});
}

/*
 * GitHub update
 * 
 * Updates the git repositories and generates new file size
 * mappings and commit message for download page
 */
function update() {
	// Grab the JSON payload
	var result = Q.resolve();

	// Update wiki
	wiki();

	// For both nightly and stable repos
	console.log('Updating repos and parsing src file sizes...');
	['nightly', 'stable'].forEach(function(version) {
		// Clean up dist/
		console.log('Cleaning up dist/ dir...');
		result = exec(result, 'grunt clean', paths.git[version]);

		// Pull newest commits
		console.log('Pulling %s repo...', version);
		result = exec(result, 'git pull origin master');

		// If stable... checkout the latest tag
		if(version === 'stable') {
			result = exec(result, 'git tag -l | tail -1')
				.then(function(tag) {
					console.log('Checking out latest stable release... %s', tag)
					git(result, 'git checkout tags/'+tag)
				});
		}

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
	result.then(function() {
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

	// Update wiki files in Registry
	.then(function() {
		Registry.markdown.gettingstarted = fs.readFileSync(path.join(paths.wiki, 'Getting-Started.md')).toString(),
		Registry.markdown.faq = fs.readFileSync(path.join(paths.wiki, 'FAQ.md')).toString()
	})

	// Record on complete/failure
	.fin(function() { console.log('Done.'); })
	.fail(function(err) {
		console.error('Error: %s', err);
	});

	return result;
}

function hook(req, res, next) {
	// GitHub Post hook IPs: 207.97.227.253, 50.57.128.197, 108.171.174.178
	var githubIPs = /207\.97\.227\.253|50\.57\.128\.197|108\.171\.174\.178/;

	// Only allow GitHub IP's through
	if(!githubIPs.test(req.ip)) { return res.redirect('/'); }

	console.log('POST hook from GitHub received, updating...');
	update();
}

module.exports = {
	hook: hook,
	update: update
} 
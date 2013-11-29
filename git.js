var Registry = require('./registry')
	, paths = require('./paths')
	, Q = require('q')
	, util = require('util')
	, fs = require('fs')
	, path = require('path')
	, git = require('gift')
	, cp = require('child_process')
	, glob = require('glob-whatev')
	, colors = require('colors')
	, marked = require('marked')
	, initialised = false;

// File list to generate file sizes for and it's JSON key mapping
var _files = {
	'core.js': 'core',
	'../../jquery.min.js': 'jquery',
	'*/*.js': 'plugins[%s]',
	'core.css': 'styles[core]',
	'basic.css': 'styles[basic]',
	'css3.css': 'styles[css3]'
};


function exec(command, args, cwd, message) {
	!cwd && console.log(arguments);

	return function() {

		// Echo message if given
		if(message) {
			console.log(('['+path.relative(process.cwd(), cwd)+']\t').magenta, message, '('+(command+' '+(args || []).join(' ')).green+')');
		}

		// If no arguments given, just use exec
		if(!args || !args.push) {
			return Q.nfcall(cp.exec, command, { cwd: cwd });
		}
	
		var deferred = Q.defer(),

		proc = cp.spawn(command, args, {
			cwd: cwd,
			stdio: process.env.DEBUG ? "inherit" : "ignore"
		});

		proc.on("message", function (message) {
			deferred.notify( message );
		});

		proc.on("error", function (error) {
			deferred.reject(error);
		});

		proc.on("exit", function(code) {
			if (code !== 0) {
				deferred.reject(new Error(("Exited with code " + code).red));
			} else {
				deferred.resolve();
			}
		});

		return deferred.promise;
	}
};

/*
 * Process a given markdown article into proper format needed
 */
function processMarkdown(name, text) {
	// Anchor prefix is analogous to URL slug
	var anchorPrefix = name.toLowerCase().replace(/[^\w\d\-]/g, '-'),
		lastType;

	return marked(text)

	// Don't use strong, use b
	.replace(/<(\/)?strong>/g, '<$1b>')

	// Remove <p> wrappers from anchors
	.replace(/<p>\s*(<a\b[^>]*><\/a>)\s*<\/p>/g, '$1')

	// Add category/section elements
	.replace(/(<a\b[^>]*><\/a>\s*)?<h([12])>/g, function(match, anchor, h) {
		var classes = h === '1' ? 'category group' : 'section',
			prefix = lastType === 'section' ? classes !== 'section' ? '</div></div>' : '</div>' : '';

		// Store last type to be replaced
		lastType = classes;

		return prefix + '<div class="'+classes+'">' + (anchor || '') + '<h'+h+'>';
	})


	// Fix up API links
	.replace(/<a name="(\w+)"><\/a>/gi, '<a name="'+anchorPrefix+'.$1"></a>')
	.replace(/<a href="#(\w+)">/gi, '<a href="#'+anchorPrefix+'.$1">')
	.replace(/<a href="\.\/?\/(AJAX|IE6|Image-map|Modal|SVG|Tips|Viewport)">/gi, '<a href="/plugins#$1">')
	.replace(/<a href="\.\.?\/(Global|API|Events)(?:#([^"]+))?">/gi, function(match, type, attr) {
		var anchor = (type + (attr ? '.'+attr : '')).toLowerCase();
		return '<a href="/api#'+anchor+'">';
	})
	.replace(/<a href="\.\.?\/(Content|Position|Core|Show|Hide|Style)(?:#([^"]+))?">/gi, function(match, type, attr) {
		var anchor = (type + (attr ? '.'+attr : '')).toLowerCase();
		return '<a href="/options#'+anchor+'">';
	})
	.replace(/<a href="\.\.?\/(Content-Guide)(?:#([^"]+))?">/gi, function(match, type, attr) {
		var anchor = (type.replace('-Guide', '') + (attr ? '.'+attr : '')).toLowerCase();
		return '<a href="/guides#'+anchor+'">';
	})

	// Replace qTip2 with proper HTML formatting to keep it inline with the rest of the page
	.replace(/([^\/])qTip(<sup>)?2\s*(<\/sup>)?(?!\.com)/gi, '$1<strong>qTip<sup>2</sup>&nbsp;</strong>')

	+ '</div></div>';
}


/*
 * Wiki update method.
 */
function wiki() {
	var fileGlob = path.join(paths.wiki, '**/*.md');

	console.log('======================================= Updating Wiki ======================================='.bold);

	// Update the wiki repo first
	return exec('git', ['pull','origin','master'], paths.wiki, 'Updating wiki files')()

	// Update wiki files in Registry
	.then(function() {
		var pages = [];
		glob.glob( fileGlob ).forEach(function(file) {
			var name = path.basename(file, '.md');

			// Process the markdown immediately
			Registry.markdown[ name ] = processMarkdown(name,
				fs.readFileSync(file).toString()
			);
			pages.push(name);
		});
		console.log('[build/wiki]\t'.magenta, 'Pages updated: ', pages.join(', ').grey, "\n");
	}, 
	function(reason) {
		console.log('[build/wiki]\t'.magenta, 'Unable to update pages...', reason.red, "\n");
	})

	console.log("\n");
}


/*
 * CDNJS Update method. Parses various versions 
 */
function cdnjs() {
	var fileGlob = path.join(paths.cdnjs, 'ajax/libs/qtip2/*');

	console.log('======================================= Updating CDNJS Repo ======================================='.bold);

	// Update the wiki repo first
	return exec('git', ['pull','origin','master'], paths.cdnjs, 'Updating CDNJS files')()

	// Update CDNJS references in Registry
	.then(function() {
		var versions = [], stableVersion;
		glob.glob( fileGlob ).forEach(function(file) {
			var name = path.basename(file, '.json').replace(path.sep, '');
			if(name !== 'package') {
				Registry.cdnjs[name] = name;
				versions.push(name);
				stableVersion = name;
			}
		});

		// Add "stable" folder mapping
		Registry.cdnjs['stable'] = stableVersion;
		versions.push('Stable ('+stableVersion+')');

		// Log out
		console.log('[build/cdnjs]\t'.magenta, 'Versions detected: ' + versions.join(', ').grey);

		return versions;
	})

	// Generate archive files
	.then( exec('find '+paths.cdnjs+'/ajax/libs/qtip2/* -maxdepth 0 -type d -exec ln -fs {} \\;', null, paths.archive, "Generating archive links") )

	// New line
	.then( function() { console.log("\n") })

	// Fail handler
	.fail(function(reason) {
		console.log('[build/cdnjs]\t'.magenta, 'Unable to update... ' + reason.red, "\n");
	})
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
	['nightly', 'stable'].forEach(function(version) {
		var cwd = paths.git[version];

		// Header output
		result.then(function() {
			console.log(('======================================= Updating '+version+' repo =======================================').bold);
		})

		// Clean up dist/ and pull newest commits
		result = result.then(exec('grunt', ['clean'], cwd, 'Cleaning up dist/ dir'))
			.then(exec('git', ['pull','origin','master'], cwd, 'Pulling '+version+' repo '));

		// If stable... check out latest tag
		if(version === 'stable') {
			result = result.then(exec('git tag -l | tail -1', null, cwd))
				.then(function(tag) {
					// Clean it up
					tag = tag[0].trim();

					// Set stable version
					stableVersion = tag.substr(1);

					return exec('git', ['checkout', tag], cwd, 'Checking out latest stable')();
				})
		}

		// Generate archive files
		result = result.then(function() {
			var dir = path.join(paths.archive, version === 'stable' ? stableVersion : version),
				basic = path.join(dir, 'basic'),
				q = Q();

			// If stable...
			if(version === 'stable') {
				// If CDNJS doesn't have latest stable... generate it instead
				if(Registry.cdnjs.stable !== stableVersion) {
					console.log(('[build/'+version+']\t').magenta, (stableVersion + ' (latest stable) not available in CDNJS! Generating manually...').bold);
					q = q.then(exec('grunt', ['dev', '--force', '--dist='+dir,'--'+version], cwd, '\tGenerating '+version+' archive'))
						.then(exec('grunt', ['dev', '--force', '--dist='+path.join(dir, 'basic'),'--'+version], cwd, '\tGenerating basic '+version+' archive'))
				}

				// Symlink stable directory top latest stable version directory
				q = q.then(exec('ln', ['-fs', dir, path.join(paths.archive, 'stable')], paths.archive, 'Sym-linking stable dir'));
			}

			// Always create nightly files
			else {
				q = q.then(exec('grunt', ['dev', '--force', '--dist='+dir,'--'+version], cwd, 'Generate '+version+' archive'));
			}

			return q;
		})

		// Generate file size object
		.then(function() {
			console.log('%s %s', ('[build/'+version+']\t').magenta, "Calculating file sizes\n");
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
	})

	// Generate cached commit message and digest in build folder
	result = result.then(function() {
		console.log('[FINALISE]\t'.red.bold, 'Caching latest commit message and digest');

		// Setup git repo object
		var repo = git( path.resolve(path.join(paths.build, 'nightly')) );

		// Update the Registry build properties
		return Q.ninvoke(repo, 'commits', null, 1, null).then(function(commit) {
			var details = commit[0];

			Registry.build.nightly.version = details.id.substr(0, 7);
			Registry.build.nightly.commitmsg = details.message;
			Registry.build.nightly.commitdate = details.committed_date;

			// Set stable properties
			stableVersion && Registry.build.stable.version = stableVersion;

			console.log('[DONE]\t'.green.bold, 'All ready!', ('(Latest stable: '+stableVersion+')').bold);
		})

		initialised = true;
	})

	return result;
}

// GitHub Post hook IPs: 207.97.227.253/32, 50.57.128.197/32, 108.171.174.178/32, 50.57.231.61/32, 204.232.175.64/27, 192.30.252.0/22
var githubIPs = /(204\.232\.175\.[64-96])|(192\.30\.252.[1-254])/;

function hookAuth(req, res, next) {
	process.stdout.write('POST hook received... is it GitHub? ');

	// Only allow GitHub IP's through
	if(!githubIPs.test(req.ip)) {
		console.log('Nope... from IP ' + req.ip);
		return res.send(500, 'Hold up... you\'re not GitHub! Shoo!');
	}

	console.log('Yep! Updating...');
	next();
}

module.exports = {
	ips: githubIPs,
	hookAuth: hookAuth,
	repos: repos,
	wiki: wiki,
	cdnjs: cdnjs,
	routes: function(app) {
		app.post('/git/update/wiki', hookAuth, wiki);
		app.post('/git/update/repos', hookAuth, repos);
		app.post('/git/update/cdnjs', hookAuth, cdnjs);

		// Ensure download page isn't accessible until repos have been initialised
		app.use('/download', function(req, res, next) {
			if(!initialised) {
				res.send(500, 'Updating our GitHub repos... please refresh in a few seconds!');
			}
		})
	}
};

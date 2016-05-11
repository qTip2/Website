var Registry = require('./registry')
	, express = require('express')
	, paths = require('./paths')
	, Q = require('q')
	, util = require('util')
	, fs = require('fs')
	, path = require('path')
	, cp = require('child_process')
	, glob = require('glob-whatev')
	, colors = require('colors')
	, marked = require('marked')
	, debugLog = fs.openSync( path.join(paths.logs, 'debug.log'), 'a' )
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


function exec(command, args, cwd, message, namespace) {
	!cwd && console.log(arguments);

	return function() {

		// Echo message if given
		if(message) {
			console.log(namespace || ('['+(path.relative(process.cwd(), cwd)+']\t') || 'main').magenta, message, '('+(command+' '+(args || []).join(' ')).green+')');
		}

		// If no arguments given, just use exec
		if(!args || !args.push) {
			return Q.nfcall(cp.exec, command, { cwd: cwd });
		}
	
		var deferred = Q.defer(),

		proc = cp.spawn(command, args, {
			cwd: cwd,
			stdio: [ 'ignore', debugLog, debugLog ]
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
 * Website update method.
 */
function website() {
	console.log('======================================= Updating Website ======================================='.bold);
	return exec('git', ['pull','origin','master'], __dirname, 'Updating files...')()
		.then(exec('npm', ['install'], __dirname, 'Updating dependancies...'))
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
 * CDN Update method. Parses various versions 
 */
function cdn() {
	console.log('======================================= Updating CDN Repo ======================================='.bold);

	// Update the wiki repo first
	return exec('git', ['pull', 'origin', 'master'], paths.cdn, 'Updating CDN files')()

	// Update CDNJS references in Registry
	.then(function() {
		var versions = [], stableVersion;
		glob.glob( paths.cdnProject+'/*' ).forEach(function(file) {
			var name = path.basename(file, '.json').replace(path.sep, '');
			if(/[0-9]/.test(name)) {
				Registry.cdn[name] = name;
				versions.push(name);
				stableVersion = name;
			}
		});

		// Add "stable" folder mapping
		Registry.cdn['stable'] = stableVersion;
		versions.push('Stable ('+stableVersion+')');

		// Log out
		console.log('[build/cdn]\t'.magenta, 'Versions detected: ' + versions.join(', ').grey);

		return versions;
	})

	// Generate archive files
	.then( exec('find '+paths.cdnProject+'/* -maxdepth 0 -type d -exec ln -fs {} \\;', null, paths.archive, "Generating archive links") )

	// New line
	.then( function() { console.log("\n") })

	// Fail handler
	.fail(function(reason) {
		console.log('[build/cdn]\t'.magenta, 'Unable to update... ' + reason.red, "\n");
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
			.then(exec('git', ['pull','origin', 'master'], cwd, 'Pulling remote commits'))
			.then(exec('git', ['fetch','--tags'], cwd, 'Pulling remote tags'));

		// If stable... check out latest tag
		if(version === 'stable') {
			result = result.then(exec('git tag -l | tail -1', null, cwd))
				.then(function(tag) {
					// Clean it up
					tag = tag[0].trim();

					// Set stable version
					Registry.build.stable.version = stableVersion = tag.substr(1);

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
				if(Registry.cdn.stable !== stableVersion) {
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
	return result.then(exec('git log --pretty="format:%h||%s||%ai" -1', null, paths.git.nightly, 'Caching latest commit message and digest', '[FINALISE]'.red.bold))
		.then(function(result) {
			result = result[0].split('||');

			['version', 'commitmsg', 'commitdate'].forEach(function(prop, i) {
				Registry.build.nightly[prop] = /date/.test(prop) ? new Date(result[i]) : result[i];
			});

			console.log('[DONE]\t'.green.bold, 'All ready!', ('(Latest stable: '+stableVersion+')').bold);
			initialised = true;
		});
}


var hookAuth = express.basicAuth('qtip2', 'qtip2');

module.exports = {
	hookAuth: hookAuth,
	website: website,
	repos: repos,
	wiki: wiki,
	cdn: cdn,
	routes: function(app) {
		app.post('/git/update/website', hookAuth, website);
		app.post('/git/update/wiki', hookAuth, wiki);
		app.post('/git/update/repos', hookAuth, repos);
		app.post('/git/update/cdn', hookAuth, cdn);

		// Ensure download page isn't accessible until repos have been initialised
		app.use('/download', function(req, res, next) {
			if(!initialised) {
				res.send(500, 'Updating our GitHub repos... please refresh in a few seconds!');
			}
		})
	}
};

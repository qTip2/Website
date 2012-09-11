var Registry = require('../registry')
	, paths = require('../paths')
	, fs = require('fs')
	, path = require('path')
	, build = require('../build').build
	, shout = require('../shout').shout
	, showdown = require('showdown')
	, nsh = require('node-syntaxhighlighter')
	, highlight = require('highlight').Highlight
	, markdown = new showdown.converter();

/*
 * Home page
 */
exports.new = function(req, res) {
	res.render('new', {
		title: [],
		page: 'new',
		ip: req.ip,
		hostip: '109.123.70.57',
		nightly: Registry.build.nightly
	});
}

/*
 * Home page
 */
exports.index = function(req, res) {
	res.render('index', {
		title: [],
		page: 'home'
	});
}

/*
 * About
 */
exports.about = function(req, res) {
	res.render('about', {
		title: ['About'],
		page: 'about'
	})
}

/*
 * Demos
 */
exports.demos = function(req, res, next) {
	var demo = req.params.demo || '',
		download = req.params.download || 'undefined' !== typeof req.query['download'],
		source = req.params.source || 'undefined' !== typeof req.query['source'],
		props = {
			title: ['Demos'],
			page: 'demos',
			demo: demo
		};

	// Pass IP through on Geolocation demo
	if(demo === 'geolocation') {
		try {
			props.IP = req.headers['x-forwarded-for'];
		}
		catch ( error ) {
			props.IP = req.connection.remoteAddress;
		}
	}

	// Render the view
	res.render('demos/'+demo, props, function(err, html) {
		if(err) { next(err); }

		// If we're wanting a download... force headers
		if(download) {
			res.header('Cache-Control', 'public');
			res.header('Content-Description', 'File Transfer');
			res.header('Content-Disposition', 'attachment; filename="'+demo+'".html');
			res.header('Content-Type', 'application/html');
			res.header('Content-Transfer-Encoding', 'binary');
		}

		// If we're wanting to see the source... we need to do som processing!
		else if(source) {
			singleline = html.replace(/\n/g,'\uffff');

			function sanitize(regex) {
				return singleline.match(regex).join("\n")
					.replace(/\uffff/g,"\n")
					.replace(/https?:\/\/media[0-9]\.juggledesign\.com\/.*?\/(\w+)/g, '/path/to/$1')
					.replace(/https?:\/\/craigsworks.com\/.*?\/(\w+)/g, '/path/to/$1');
			}

			res.render('layouts/source', {
				js: sanitize(/<script type="text\/javascript"[^>]*>(.*?)<\/script>/gi),
				css: sanitize(/<link rel="stylesheet"[^>]*?\/?>|<style type="text\/css"[^>]*>(.*?)<\/style>/gi),
				html: sanitize(/<body[^>]*>(.*?)<!-- JavaScript\(s\)-->/gi)
			});
		}

		// Just send content on regular request
		else { res.send(html); }
	});
}

/*
 * Demos data
 */
exports.demoData = function(req, res) {
	var page = req.params.type,
		body = req.body,
		ratings = {
			'0111161':9.3,
			'0120689':8.4,
			'1375666':8.8,
			'0071562':9.1,
			'0375679':7.9,
			'0468569':9.0,
			'0110912':9.0,
			'0137523':8.9,
			'1119646':7.8,
			'0167260':8.9
		},
		params = {},
		state;

	// IMDb ratings
	if(page === 'imdb') {
		res.header('Content-Type', 'application/json');
		params.rating = JSON.stringify({ rating: ratings[ req.query.id ] });
	}
	// Form login
	else if(page === 'login') {
		res.header('Content-Type', 'application/json');

		// un:qtip, pw:qtip for demo purposes
		state = body.username === 'qtip' && body.password === 'qtip';
		params.json = JSON.stringify({
			status: state ? 'success' : 'error',
			message: state ? 'Successfully logged in!' : 'Invalid username or password'
		});
	}

	res.render('demos/data/' + req.params.type, params);
}

/*
 * Download
 */
exports.download = function(req, res) {
	// Grab commit message
	var file = path.join(paths.build, 'commitmsg'),
		sizes = {
			stable: Registry.build.stable.filesizes,
			nightly: Registry.build.nightly.filesizes
		},
		commitmsg = Registry.build.nightly.commitmsg,
		mtime = Registry.build.nightly.commitdate;

	// Render
	res.render('download', {
		title: ['Download'],
		page: 'download',
		nightly: {
			commitmsg: commitmsg,
			mtime: mtime
		},
		sizes: JSON.stringify(sizes)
	});
}

/* 
 * Download builder
 */
exports.build = function(req, res) {
	// Shout (if shouting)!
	if(req.body.shoutout) {
		shout(req.body.shoutout, false);
	}

	// Build it
	build.apply(build, arguments);
}

/*
 * Donate
 */
exports.donate = function(req, res) {
	function shuffle(theArray) {
		var len = theArray.length, i = len, p, t;
		while (i--) {
			p = parseInt(Math.random()*len);
			t = theArray[i];
			theArray[i] = theArray[p];
			theArray[p] = t;
		}
		return theArray;
	};

	res.render('donate', {
		title: ['Donate'],
		page: 'donate',
		contributors: shuffle(Registry.donate.contributors)
	});
}

/*
 * Converter
 */
exports.converter = function(req, res) {
	res.render('converter', {
		title: ['v1.0 Code Converter'],
		page: 'converter'
	});
}


/*
 * Documentation
 */
exports.docs = function(req, res, next) {
	var page = req.params.page || '',
		plugin = req.params.plugin || '',
		dir = path.join(paths.git.nightly, 'docs'),
		file = path.join(dir, (page || 'gettingstarted'), plugin) + '.md';

	// Open file if it exists
	if(fs.existsSync(file)) {
		content = fs.readFileSync(file, 'utf-8');

		// Convert .md to .html
		content = markdown.makeHtml(content)
			.replace(/\n/g,'\uffff')
			.replace(/<code([^>]*)>(.*?)<\/code>/gm, function(original, props, source){
				var lang = /class="(\w+)"/.exec(props), code = source.replace(/\uffff/g,"\n");
				return '<code'+props+'>'+nsh.highlight(code, nsh.getLanguage(lang && lang[1] || 'js'));+'</code>';
			})
			.replace(/\uffff/g,"\n");
	}

	// Otherwise throw an error and continue
	else { return next(new Error('Unable to find documentation ' + file)); }

	res.render('docs/', {
		title: ['Documentation', page.substr(0,1).toUpperCase() + page.substr(1) ],
		page: 'docs',
		content: content
	});
}

/*
 * "Where are you using qTip2?" handler
 */
exports.where = function(req, res) {
	var params = req.body || {};

	// Shout it if we have proper params
	if(params.name && params.where) {
		shout(params);
	}

	// Redirect back to the referring page
	res.redirect( req.header('Referer') );
}
/**
 * Module dependencies.
 */
var Registry = require('./registry')
	, paths = require('./paths')
	, express = require('express')
	, routes = require('./routes/main')
	, git = require('./git')
	, zip = require('express-zip')
	, gzip = require('connect-gzip')
	, http = require('http')
	, path = require('path')
	, fs = require('fs')
	, moment = require('moment')
	, highlight = require('highlight').Highlight
	, marked = require('marked')
	, Q = require('q');

// Setup the server
var app = express();

// Production
app.configure(function(){
	// Common config
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');

	// Load custom filters
	require('./jadefilters')

	// Use favicon for all middlware
	app.use(express.favicon(__dirname + '/public/favicon.ico')); 

	// Use gzip compression
	app.use(express.compress());

	// Static files first (don't log these)
	app.use('/static', express.static(path.join(__dirname, 'public')));

	// Log files, private please!
	app.use('/l', function(req, res, next) {
		if(req.query.code === 'reallycraig?') { next(); }
		else { return res.send(404); } 
	});
	app.use('/l', express.static(path.join(__dirname, 'log')));

	// CDNJs Redirects
	app.use(function(req, res, next) {
		var matches = /^\/v\/([0-9\.]+|stable)\/(.+\.(?:css|js))$/.exec(req.url),
			version = matches && matches[1];

		// Redirect to correct stable
		if(version === 'stable') {
			version = Registry.build.stable.version;
		}

		// Check for a CDNJS Version
		var cdnVersion = Registry.cdn[ version ];
		if(!cdnVersion) { return next(); }

		// Redirect to CDNJS files
		res.redirect(301, paths.cdnUrl+'/'+version+'/'+matches[2]);
	});

	// Package archive
	app.use('/v', express.logger({
		format: 'default',
		stream: fs.createWriteStream( path.join(paths.logs, 'archive.log'), { flags: 'a' })
	}));
	app.use(express.static(path.join(__dirname, 'stable')));
	app.use('/v', express.static(path.join(__dirname, 'build', 'archive')));
	app.use('/v', express.directory(path.join(__dirname, 'build', 'archive'), { icons: true }));

	// Setup logging
	app.use(express.logger({
		format: 'default',
		stream: fs.createWriteStream( path.join(paths.logs, 'http.log'), { flags: 'a' })
	}));

	// Allow demo data to be accessed by anyone (CORS)
	app.use('/demos/data', function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		next();
    });
	
	// Root files
	app.use( express.static(path.join(__dirname, 'root')) );

	// Set globalStyle var for each request via the cookie
	app.use(express.cookieParser());
	app.use(function(req, res, next) {
		res.locals.globalStyle = req.cookies['qtip2_global_style'] || '';
		next();
	});

	// Use body parser and method override middlewares
	app.use(express.urlencoded());
	app.use(express.json());
	app.use(express.methodOverride());
});

// Development
app.configure('dev', function(){
	app.use(express.errorHandler());
});

// Setup view helpers
app.locals({
	// URL helpers
	WEB_DIR: '/.',
	GIT_URI: 'http://github.com/Craga89/qTip2/',

	// Google Analytics
	ANALYTICS_ENABLED: true,
	ANALYTICS_UA: 'UA-5228245-13',
	
	Registry: Registry,

	moment: moment,
	markdown: marked,

	// CDN
	cdn: function(file) {
		var ext = path.extname(file).substr(1),
			type = /png|jpeg|jpg|gif/.test(ext) ? 'images' : ext,
			rand = Math.floor( Math.random() ) + 1;

		// Use jQuery(UI) code repo
		if(file === 'jquery') {
			return '//code.jquery.com/jquery.min.js'
		}
		else if(file === 'jqueryui') {
			return '//code.jquery.com/ui/1.8.22/jquery-ui.min.js'
		}
		else if(file === 'jqueryui-css') {
			return '//code.jquery.com/ui/1.8.22/themes/ui-lightness/jquery-ui.css'
		}

		return '//' + path.join('media'+rand+'.juggledesign.com', 'qtip2', type, file);
	},

	// URL helper
	url: function(url) {
		if(url === 'github') {
			return '//github.com/Craga89/qTip2'
		}

		return path.join(app.locals.WEB_DIR, url);
	},

	// qTip packages helper
	qtip: function(filename, version, useCdn) {
		// Assume stable if not given
		if(!version) { version = Registry.build.stable.version; }

		// Check for a CDNJS Version
		var cdnVersion = Registry.cdn[ version ];

		// Return CDNJS url if valid, otherwise use the qTip2 archive links
		return useCdn !== false && cdnVersion ? 
			paths.cdnUrl+'/'+version+'/'+filename :
			'//qtip2.com/v/'+version+'/'+filename;
	},

	// Code highlighter
	highlight: function(code, lang) {
		return highlight(code, null, null, lang);
	},

	// Wiki page formatter
	wikipage: function(name) {
		if(!Registry.markdown[name]) {
			return 'Uhoh... no such page!'
		}

		return Registry.markdown[name];
	}
});

// Set markdown defaults
marked.setOptions({
	gfm: true,
	sanitize: false,
	highlight: function(code, lang) {
		var langs = { 'js': 'javascript' };
		return highlight(code, null, null, langs[lang] || lang);
	},
	langPrefix: 'language'
});

// Setup routes
routes(app);
git.routes(app);

// Setup the server
app.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

// Update our various repos
[ git.wiki, git.cdn, git.repos ].reduce(Q.when, Q());

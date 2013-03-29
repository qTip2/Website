/**
 * Module dependencies.
 */
var Registry = require('./registry')
	, paths = require('./paths')
	, express = require('express')
	, routes = require('./routes')
	, git = require('./git')
	, gzip = require('connect-gzip')
	, http = require('http')
	, path = require('path')
	, fs = require('fs')
	, moment = require('moment')
	, highlight = require('highlight').Highlight
	, marked = require('marked');

// Setup the server
var app = express();

// Production
app.configure(function(){
	// Common config
	app.set('port', process.env.PORT || 80);
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

	// CDNJs Redirects
	app.use(function(req, res, next) {
		var matches = /^\/v\/([0-9\.]+)\/(.+\.(?:css|js))$/.exec(req.url),
			isCDNd = matches && Registry.cdnjs[ matches[1] ];

		// Continue if not CDN'd
		if(!isCDNd) { return next(); }

		// Redirect to CDNJS files
		res.redirect(301, '//cdnjs.cloudflare.com/ajax/libs/qtip2/'+matches[1]+'/'+matches[2]);
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

	// Redirect people to the main site for now
	app.use(function(req, res, next) {
		if(!git.ips.test(req.ip)) {
			return res.redirect(302, 'http://craigsworks.com/projects/qtip2');
		}
		next();
	});

	// Allow demo data to be accessed by anyone (CORS)
	app.use('/demos/data', function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		next();
    });

	// Setup blog vhost
	//app.use(express.vhost(
	//	'blog.qtip2.com', require('./node-blog/app').app
	//));

	// Set globalStyle var for each request via the cookie
	app.use(express.cookieParser());
	app.use(function(req, res, next) {
		res.locals.globalStyle = req.cookies['qtip2_global_style'];
		next();
	});

	// Use body parser and method override middlewares
	app.use(express.bodyParser());
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
	ANALYTICS_ENABLED: false,
	ANALYTICS_UA: 'UA-5228245-13',

	// CDN
	cdn: function(file) {
		var ext = path.extname(file).substr(1),
			type = /png|jpeg|jpg|gif/.test(ext) ? 'images' : ext,
			rand = Math.floor( Math.random() ) + 1;

		// Use jQuery(UI) code repo
		if(file === 'jquery') {
			return 'http://code.jquery.com/jquery.min.js'
		}
		else if(file === 'jqueryui') {
			return 'http://code.jquery.com/ui/1.8.22/jquery-ui.min.js'
		}
		else if(file === 'jqueryui-css') {
			return 'http://code.jquery.com/ui/1.8.22/themes/ui-lightness/jquery-ui.css'
		}

		return 'http://' + path.join('media'+rand+'.juggledesign.com', 'qtip2', type, file);
	},

	// URL helper
	url: function(url) {
		if(url === 'github') {
			return 'http://github.com/Craga89/qTip2'
		}

		return path.join(app.locals.WEB_DIR, url);
	},

	// qTip packages helper
	qtip: function(ext, minified) {
		var min = minified !== false ? 'min.' : ''
		return 'http://qtip2.com/v/nightly/jquery.qtip.'+min+ext;
	},

	// Helpers
	moment: moment,
	markdown: marked,
	highlight: function(code, lang) {
		return highlight(code, null, null, lang);
	},
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
app.get('/', routes.index);
app.get('/demos', routes.demos);
app.get('/demos/data/:type', routes.demoData);
app.get('/api', routes.api);
app.get('/options', routes.options);
app.get('/plugins', routes.plugins);
app.get('/events', routes.events);
app.get('/guides', routes.guides);
app.get('/donate', routes.donate);
app.get('/faq', routes.faq);

// Download hooks
app.get('/download', routes.download);
app.post('/download/build', routes.build);

// "Private" hooks
app.post('/git/update/wiki', git.hookAuth, git.wiki);
app.post('/git/update/repos', git.hookAuth, git.repos);
app.post('/git/update/cdnjs', git.hookAuth, git.cdnjs);

// Setup the server
app.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

// Update our repos and upon completion, start the server
git.wiki();
git.cdnjs();
git.repos();
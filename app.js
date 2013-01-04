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
	, moment = require('moment')
	, nsh = require('node-syntaxhighlighter')
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
	app.set('view options', {
		layout: 'layouts/default'
	});
	require('./jadefilters') // Load custom filters

	// Setup IP checks
	app.use(function(req, res, next) {
		if(req.ip !== '78.105.190.31') {
			res.send('Under construction'); return;
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
	app.use(express.vhost(
		'blog.qtip2.com', require('./node-blog/app').app
	));

	//app.use(gzip.gzip())
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
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
	ANALYTICS_UA: 'UA-5228245-10',

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
	qtip: function(version, ext, minified) {
		var min = minified !== false ? 'min.' : ''
		return 'http://craigsworks.com/projects/qtip2/packages/'+version+'/jquery.qtip.'+min+ext;
	},

	// Helpers
	moment: moment,
	markdown: function(str) {
		return marked(str);
	},
	highlight: function(code, lang) {
		return nsh.highlight(code, nsh.getLanguage(lang || 'js'), {
			gutter: false
		});
	},
	wikipage: function(markdown) {
		return marked( markdown )

		// Remove h1 headers
		.replace(/<h1>[^\<]+<\/h1>/g, '')

		// Replace with correct HTML section syntax
		.replace(/<h2>/g, '<div class="section"><h2>').replace(/<\/p>\s*$/g, '</p></div>')
		.replace(/<\/p>\s*<div class="section">/g, '</p></div><div class="section">')

		// Don;'t use strong, use b
		.replace(/<(\/)?strong>/g, '<$1b>')

		// Replace qTip2 with proper HTML formatting to keep it inline with the rest of the page
		.replace(/qTip\s*(<sup>)?2\s*(<\/sup>)?/gi, '<strong>qTip<sup>2</sup>&nbsp;</strong>');
	}
});

// Set markdown defaults
marked.setOptions({
	gfm: true,
	highlight: app.locals.highlight
});

// Setup routes
app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/new', routes.new);

app.get('/demos/:demo?', routes.demos);
app.get('/demos/data/:type', routes.demoData);
app.post('/demos/data/:type', routes.demoData);

app.get('/download', routes.download);
app.post('/download/build', routes.build);

app.get('/donate', routes.donate);
app.get('/converter', routes.converter);
app.get('/docs/:page?/:plugin?', routes.docs);
app.post('/where', routes.where);

// "Private" hooks
app.post('/_git', git.hook);

// Update our repos and upon completion, start the server
git.update().fin(function() {
	// Setup the server
	app.listen(app.get('port'), function() {
		console.log("Express server listening on port " + app.get('port'));
	});
});

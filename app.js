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
	, date = require('date').date
	, moment = require('moment')
	, nsh = require('node-syntaxhighlighter')
	, highlight = require('highlight').Highlight
	, markdown = require('markdown').markdown;

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
	date: function(date) {
		return date.apply(date, arguments);
	},
	moment: moment,
	markdown: function(str) {
		return markdown.toHTML(str);
	},
	highlight: function(code, lang) {
		return nsh.highlight(code, nsh.getLanguage(lang), {
			gutter: false
		});
	},
	timeago: require('timeago')
})

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

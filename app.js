
/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, date = require('date').date
	, nsh = require('node-syntaxhighlighter')
	, markdown = require('markdown').markdown;

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 80);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', {
		layout: 'layouts/default'
	});
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/demos', routes.demos);
app.get('/download', routes.download);
app.get('/donate', routes.donate);
app.get('/converter', routes.converter);
app.get('/docs/:page?', routes.docs);

// Setup view helpers
app.locals({
	// URL helpers
	WEB_DIR: '/.',
	COMMON_DIR: 'http://media1.juggledesign.com/common',
	CSS_DIR: 'http://media1.juggledesign.com/qtip2/css',
	JS_DIR: 'http://media1.juggledesign.com/qtip2/js',
	IMAGES_DIR: 'http://media1.juggledesign.com/qtip2/images',
	GIT_URI: 'http://github.com/Craga89/qTip2/',

	// qTip packages
	QTIP_JS: 'http://craigsworks.com/projects/qtip2/packages/nightly/jquery.qtip.min.js',
	QTIP_CSS: 'http://craigsworks.com/projects/qtip2/packages/nightly/jquery.qtip.min.css',

	// Helpers
	date: date,
	markdown: function(str) {
		return markdown.toHTML(str);
	},
	highlight: function(lang, code) {
		return nsh.highlight(
			code, nsh.getLanguage(lang)
		);
	}
})

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

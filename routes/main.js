var Registry = require('../registry')
	, build = require('../build').build
	, paths = require('../paths')
	, demoData = require('./demodata');

/*
 * Home page
 */
function index(req, res) {
	res.render('index', {
		page: 'index'
	});
}

/*
 * Demos
 */
function demos(req, res) {
	res.render('demos', {
		page: 'demos',
		ip: req.ip,
		hostip: '109.123.70.57'
	});
}

/*
 * Download
 */
function download(req, res) {
	res.render('download', {
		page: 'download',
		build: Registry.build
	});
}

function build(req, res) {
	// Shout (if shouting)!
	if(req.body.shoutout) {
		shout(req.body.shoutout, false);
	}

	// Build it
	build.apply(build, arguments);
}

/*
 * API and Guides
 */
function api(req, res) {
	res.render('api', {
		page: 'api'
	});
}

function events(req, res) {
	res.render('events', {
		page: 'events'
	});
}

function options(req, res) {
	res.render('options', {
		page: 'options'
	});
}

function plugins(req, res) {
	res.render('plugins', {
		page: 'plugins'
	});
}

function guides(req, res) {
	res.render('guides', {
		page: 'guides'
	});
}

function changelog(req, res) {
	res.render('changelog', {
		page: 'changelog'
	});
}


/*
 * Donate
 */
function donate(req, res) {
	res.render('donate', {
		page: 'donate',
		donators: Registry.donate.contributors.split("\n")
	});
}


/*
 * Donate
 */
function faq(req, res) {
	res.render('faq', {
		page: 'faq'
	});
}

module.exports = function(app) {
	app.get('/', index);

	app.get('/api', api);
	app.get('/options', options);
	app.get('/plugins', plugins);
	app.get('/events', events);
	app.get('/guides', guides);
	app.get('/changelog', changelog);
	app.get('/donate', donate);
	app.get('/faq', faq);

	// Download hooks
	app.get('/download', download);
	app.post('/download', build);

	// Demo hooks	
	app.get('/demos', demos);
	demoData(app);
}
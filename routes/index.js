var Registry = require('../registry')
	, build = require('../build').build
	, paths = require('../paths')
	, demoData = require('./demodata');

/*
 * Home page
 */
exports.index = function(req, res) {
	res.render('index', {
		page: 'index'
	});
}

/*
 * Demos
 */
exports.demos = function(req, res) {
	res.render('demos', {
		page: 'demos',
		ip: req.ip,
		hostip: '109.123.70.57'
	});
}

exports.demoData = function(req, res) {
	var page = req.params.type,
		f = demoData[page];
		params = {};

	if(f && (params = f.apply(this, arguments))) {
		return res.render('demos/data/' + page, params);
	}

	res.send(404);
}


/*
 * Download
 */
exports.download = function(req, res) {
	res.render('download', {
		page: 'download',
		build: Registry.build
	});
}

exports.build = function(req, res) {
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
exports.api = function(req, res) {
	res.render('api', {
		page: 'api'
	});
}

exports.events = function(req, res) {
	res.render('events', {
		page: 'events'
	});
}

exports.options = function(req, res) {
	res.render('options', {
		page: 'options'
	});
}

exports.plugins = function(req, res) {
	res.render('plugins', {
		page: 'plugins'
	});
}

exports.guides = function(req, res) {
	res.render('guides', {
		page: 'guides'
	});
}

exports.changelog = function(req, res) {
	res.render('changelog', {
		page: 'changelog'
	});
}


/*
 * Donate
 */
exports.donate = function(req, res) {
	res.render('donate', {
		page: 'donate',
		donators: Registry.donate.contributors.split("\n")
	});
}


/*
 * Donate
 */
exports.faq = function(req, res) {
	res.render('faq', {
		page: 'faq'
	});
}

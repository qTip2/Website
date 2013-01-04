var Registry = require('../registry')
	, build = require('../build').build;

/*
 * Home page
 */
exports.index = function(req, res) {
	res.render('index', {
		page: 'new',
		ip: req.ip,
		hostip: '109.123.70.57',
		build: Registry.build,
		markdown: Registry.markdown,
		donators: Registry.donate.contributors.split("\n")
	});
}

/*
 * Demos data
 */
exports.demoData = function(req, res) {
	var page = req.params.type,
		body = req.body,
		ratings = {
			'0111161':9.3, '0120689':8.4,
			'1375666':8.8, '0071562':9.1,
			'0375679':7.9, '0468569':9.0,
			'0110912':9.0, '0137523':8.9,
			'1119646':7.8, '0167260':8.9
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
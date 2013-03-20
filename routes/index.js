var Registry = require('../registry')
	, build = require('../build').build
	, paths = require('../paths')
	, path = require('path')
	, fs = require('fs')
	, request = require('request')
	, querystring = require('querystring')
	, cronJob = require('cron').CronJob

	// Translation specific	
	, translateCacheFile = path.join(paths.cache, 'translate.json')
	, translateCache = JSON.parse(fs.readFileSync(translateCacheFile).toString() || '{}')
	, translateText = 'Highlight some of these word(s). A tooltip will appear with the Spanish translation!'
	, translateData = {
		key: 'AIzaSyD2NSl8IH_fEDEJyVFkpkvD9RK7LoYMv64',
		source: 'en',
		target: 'es'
	};


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
		body = req.body,
		params = {},
		state;

	// Form login
	if(page === 'login') {
		res.header('Content-Type', 'application/json');

		// un:qtip, pw:qtip for demo purposes
		state = body.username === 'qtip' && body.password === 'qtip';
		params.json = JSON.stringify({
			status: state ? 'success' : 'error',
			message: state ? 'Successfully logged in!' : 'Invalid username or password'
		});
	}

	// Translate
	else if(page === 'translate') {
		res.header('Content-Type', 'application/json');

		// Ensure there's no funny business!
		/*if(translateText.indexOf(req.params.q) < 0 || req.get('Referrer').indexOf('http://qtip.com') < 0) {
			return res.send(500, 'No using my API key for your own translations please! Play nice and pay :)');
		}*/

		// No cached response...? gah. We'll have to use the API.
		if( !(params.response = translateCache[req.query.q]) ) {
			console.log('Hitting Google Translate API... prepare for £££!');
			translateData.q = req.query.q;
			request.get(
				'https://www.googleapis.com/language/translate/v2?' + querystring.stringify(translateData),
				function(err, response, body) {
					if(err) { throw err; }

					// Cache response and return it
					translateCache[translateData.q] = params.response = body;
					res.render('demos/data/' + req.params.type, params);
				}
			);

			return;
		}
	}

	res.render('demos/data/' + req.params.type, params);
}

// Store the translateCache in cache folder every 30 minutes
new cronJob('1 * * * * *', function() {
	console.log('Caching translation results... %s', translateCacheFile);
    fs.writeFile(
    	translateCacheFile,
    	JSON.stringify(translateCache) || '{}'
	);
}, null, true);


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

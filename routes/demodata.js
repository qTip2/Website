var Registry = require('../registry')
	, paths = require('../paths')
	, path = require('path')
	, fs = require('fs')
	, request = require('request')
	, querystring = require('querystring')
	, cronJob = require('cron').CronJob
	, extend = require('extend')

	// Translation specific	
	, translateCacheFile = path.join(paths.cache, 'translate.json')
	, translateCache = JSON.parse(fs.readFileSync(translateCacheFile).toString() || '{}')
	, translateText = 'Highlight some of these word(s). A tooltip will appear with the Spanish translation!'
	, translateData = {
		key: 'AIzaSyD2NSl8IH_fEDEJyVFkpkvD9RK7LoYMv64',
		source: 'en',
		target: 'es'
	};

function owl(req, res) {
	var owls = ['snowy', 'burrowing', 'tawny'],
		owl = owls[ Math.floor(Math.random() * owls.length) ];

	res.render('demos/data/'+owl+'owl.jade', {});
}

function login(req, res) {
	res.header('Content-Type', 'application/json');

	// un:qtip, pw:qtip for demo purposes
	var state = req.body.username === 'qtip' && req.body.password === 'qtip';

	res.render('demos/data/login', {
		json: JSON.stringify({
			status: state ? 'success' : 'error',
			message: state ? 'Successfully logged in!' : 'Invalid username or password'
		})
	});
}

function translate(req, res) {
	// Ensure there's no funny business!
	if(translateText.indexOf(req.query.q) < 0 ||
		!req.get('Referrer') || !/^http:\/\/qtip2.com/.test(req.get('Referrer')) ||
		!req.cookies.qtip2_global_style
	){
		return res.send(500, 'No using my API key for your own translations please! Play nice and pay :)');
	}

	// Return JSON
	res.header('Content-Type', 'application/json');

	// Grab query and trim it
	query = req.query.q.trim()

	// If we have a cached response, get it!
	if(translateCache[query]) {
		res.render('demos/data/translate', { response: translateCache[query] });
	}

	// No cached response...? gah. We'll have to use the API.
	else {
		console.log('Hitting Google Translate API... prepare for £££!', query);
		translateData.q = query;
		request.get(
			'https://www.googleapis.com/language/translate/v2?' + querystring.stringify(translateData),
			function(err, data) {
				if(err) { res.send(500, 'Uhoh... problems! Try again later.'); }
				else {
					res.render('demos/data/translate', {
						response: (translateCache[query] = data.body)
					});
				}
			}
		);
	}
}

// Store the translateCache in cache folder every 30 minutes
new cronJob('10 * * * * *', function() {
	//console.log('Caching translation results... %s', translateCacheFile);
	fs.readFile(translateCacheFile, function(err, data) {
		if(err) { return; }

		// Extend the current object
		try{
			json = JSON.parse(data);
			extend(true, json, translateCache || {});

			// Write it out to the file
			fs.writeFile( translateCacheFile, JSON.stringify(json) );
		}
		catch(e) {}
	});
}, null, true);


module.exports = function(app) {
	app.get('/demos/data/login', login);
	app.get('/demos/data/translate', translate),
	app.get('/demos/data/owl', owl);
}

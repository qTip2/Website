var fs = require('fs')
	, markdown = require('markdown').markdown;

/*
 * Home page
 */
exports.index = function(req, res) {
	res.render('index', {
		title: [],
		page: 'home'
	});
}

/*
 * About
 */
exports.about = function(req, res) {
	res.render('about', {
		title: ['About'],
		page: 'about'
	})
}

/*
 * Demos
 */
exports.demos = function(req, res) {
	res.render('demos', {
		title: ['Demos'],
		page: 'demos'
	});
}

/*
 * Download
 */
exports.download = function(req, res) {
	res.render('download', {
		title: ['Download'],
		page: 'download'
	});
}

/*
 * Donate
 */
exports.donate = function(req, res) {
	res.render('donate', {
		title: ['Donate'],
		page: 'donate'
	});
}

/*
 * Converter
 */
exports.converter = function(req, res) {
	res.render('converter', {
		title: ['v1.0 Code Converter'],
		page: 'converter'
	});
}


/*
 * Documentation
 */
exports.docs = function(req, res, next) {
	var page = req.params[1] || '',
		file = 'docs/' + (page || 'gettingstarted') + '.md';

	// Open file if it exists
	if(fs.exists(file)) {
		content = fs.readFileSync(file);
		content = markdown.toHTML(content);
	}

	// Otherwise throw an error and continue
	else { return next(new Error('Unable to find documentation ' + file)); }

	res.render('docs/'+page, {
		title: ['Documentation', page.substr(0,1).toUpperCase() + page.substr(1) ],
		page: 'docs',
		content: content
	});
}
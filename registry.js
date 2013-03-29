var path = require('path'),
	paths = require('./paths'),
	fs = require('fs');

var Registry = {
	build: {
		stable: {
			filesizes: {}
		},
		nightly: {
			version: null,
			commitmsg: null,
			filesizes: {}
		}
	},
	markdown: { /* See git.js */ },
	cdnjs: { /* See git.js */ },
	donate: {
		contributors: fs.readFileSync(path.join(paths.public, 'donators.txt')).toString()
	}
}

module.exports = Registry;
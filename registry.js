var path = require('path'),
	paths = require('./paths'),
	fs = require('fs'),
	pkg = require( path.join(paths.git.nightly, 'package') );

var Registry = {
	build: {
		stable: {
			version: pkg.version,
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
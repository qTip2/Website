var paths = require('./paths'),
	path = require('path'),
	fs = require('fs'),
	util = require('util');

/*
 * Shouts - "Where are you using qTip2?" logger module
 */
function shout(params) {
	var stream = fs.createWriteStream(
		path.join( paths.logs, 'where' ),
		{ flags: 'a' }
	);

	// Write to the stream and close it
	stream.end(
		[ params.name, params.comment, params.where ].join(' | ') + "\n"
	);
}

exports.shout = shout;
var path = require('path');

/*
 * Paths for use in other modules
 */
module.exports = {
	public: path.resolve('./public'),
	cache: path.resolve('./cache'),
	logs: path.resolve('./log'),
	build: path.resolve('./build'),
	buildcache: path.resolve('./build/cache'),
	archive: path.resolve('./build/archive'),
	git: {
		nightly: path.resolve('./build/nightly/'),
		stable: path.resolve('./build/stable')
	},
	tmp: path.resolve('./build/tmp'),
	wiki: path.resolve('./build/wiki'),

	connectPublic: path.resolve('./node_modules/express/node_modules/connect/lib/public'),

	donators: path.resolve('./public') + '/donators.txt'
}

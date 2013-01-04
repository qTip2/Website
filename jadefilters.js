var nsh = require('node-syntaxhighlighter'),
	marked =  require('marked'),
	jade = require('jade');

['js', 'css', 'html'].forEach(function(lang) {
	jade.filters[lang] = function(str) {
		return nsh.highlight(str, nsh.getLanguage(lang), {
			gutter: false
		});
	}
});


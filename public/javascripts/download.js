$(function() {
	var builder = $('#section-builder'),
		core = [
			'button','class','constants','content','defaults','events','intro',
			'jquery_methods','jquery_overrides','options','outro','plugins','style'
		];

	function calculateSize() {
		var version = $('input[name="version"]:checked', builder).val(),
			size = _.reduce(core, function(memo, name) {
				return memo + (fileSizes[version]['plugins['+name+']'] || 0);
			}, 0);

		$('input:checkbox:checked:not([name="jquery"])', builder).each(function() {
			size += fileSizes[version][this.name] || 0;
		});

		return size;
	}

	$('input:checkbox', builder).bind('change', function() {
		var size = calculateSize();
		$('#filesize b').html(
			Math.ceil(size * 0.001) + 'KB (' + 
			Math.ceil(size * 0.0004) + 'KB minified / ' +  // Random guess!
			Math.ceil(size * 0.00021) + 'KB gzipped)' // RANDOM-er guess!
		);
	})
	.triggerHandler('change');

	$('li input', builder).change(function() {
		$(this).parents('li').toggleClass('checked', this.checked);
	})
	.trigger('change');

	// analyitcs tracking
	$('form', builder).submit(function() {
		 _gaq.push(['_trackEvent', 
			'Download', 
			$('#download-nightly').is(':checked') ? 'nightly' : 'stable',
			$(this).serialize(),
			''+(new Date())
		]);
	});
});

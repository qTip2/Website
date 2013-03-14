var legend = $('#legend');

// Populate legend sub-entries
$('a[name*="."]').each(function() {
	var elem = $(this),
		type = elem.data('type'),
		name = elem.next('h1,h2,h3').html(),
		parts = elem.attr('name').split('.'),
		link = $('a[href="#'+parts[0]+'"]', legend),
		menu = link.next('ul'),
		item;

	// Global translate to $.fn.qtip
	if(parts[0] === 'global') {
		name = name.replace('global', '$.fn.qtip');
	}

	// Create new legend sub-item
	item = $('<a/>', {
		'href': '#'+parts.join('.'),
		'html': parts[0] === 'core' ? parts[1] : name
	})
	.wrap( $('<li/>') )
	.parent();
	
	// Add it to the legend menu
	if(menu.length) {
		menu.append(item);
	}
	else {
		$('<ul>', { 'class': 'submenu' })
			.append(item).insertAfter(link);
	}
});

// On anchor change... update the legend
$(window).hashchange(function() {
	var name = document.location.hash.substr(1),
		parts = name.split('.');

	var link = $('a[href="#'+parts[0]+'"]', legend);
	if(!link.length) { return; }

	$('.submenu', legend).removeClass('active');
	link.next('.submenu').addClass('active');

	$('ul a', legend).removeClass('active');
	$('a[href="#'+name+'"]', legend).addClass('active');
})
.hashchange();
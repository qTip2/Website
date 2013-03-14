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

// Highlight different legend links on scroll
// Adjusted from expressjs.com's source: http://expressjs.com/app.js
var win = $(window),
	winHeight = win.height(),
	headings;

headings = $('a', legend).map(function(i) {
	var anchor = $('a[name="'+this.hash.substr(1)+'"]'),
		parent = anchor.parents('.category, .section');

	return !anchor.length ? null : {
		elem: $(this),
		top: (parent.length ? parent : anchor).offset().top
	}
}).toArray();

function closest() {
	var top = win.scrollTop(),
		i = headings.length,
		h;

	while(i--) {
		h = headings[i];
		if(h.top > top && h.top < top + winHeight / 2){
			return h;
		} 
	}
}

$(document).scroll(function() {
	// Don't do it when we're animating
	if( $('body').is(':animated') ) { return; }

	var h = closest(), a;
	if(!h) return;

	$('ul, a', legend).removeClass('active');
	h.elem.parents('ul.submenu').andSelf()
		.add( h.elem.next('ul.submenu') )
		.addClass('active');
});
$(function() { $(document).scroll(); });


// On anchor change... update the legend
$(window).hashchange(function() {
	var name = document.location.hash.substr(1),
		parts = name.split('.');

	var link = $('a[href="#'+parts[0]+'"]', legend);
	if(!link.length) { return; }

	$('ul, a', legend).removeClass('active');
	$('a[href="#'+name+'"]', legend).add(
		link.next('.submenu')
	).addClass('active');
})
.hashchange();

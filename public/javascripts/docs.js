var legend = $('#legend');

// Add class/tooltip to /path/to strings
$('.string').filter('span:contains("/path/to")').qtip({
	content: 'Replace this with a valid URL!',
	position: {
		my: 'bottom center',
		at: 'top center',
		viewport: $(window)
	},
	style: 'qtip-red invalidpath'
})
.addClass('invalidpath');

// Add class/tooltip to .selector strings
$('.string').filter('span:contains(".selector")').qtip({
	content: 'Replace this with a valid <a href="http://api.jquery.com/category/selectors/">jQuery selector</a>!',
	position: {
		my: 'bottom center',
		at: 'top center',
		viewport: $(window)
	},
	hide: {
		delay: 100,
		fixed: true
	},
	style: 'qtip-red invalidselector'
})
.addClass('invalidselector');

// Populate legend sub-entries
$('a[name*="."]').each(function() {
	var elem = $(this),
		type = elem.data('type'),
		name = elem.next('h1,h2,h3'),
		parts = elem.attr('name').split('.'),
		link = $('a[href="#'+parts[0]+'"]', legend),
		menu = link.next('ul'),
		item;

	// Grab name
	name = name.text().replace(name.children().text().replace(/qTip2/g, ''), '')
		.replace('qTip2', ' qTip<sup>2</sup> ');

	// Global translate to $.fn.qtip
	if(parts[0] === 'global') {
		name = name.replace('global', '$.fn.qtip');
	}

	// Remove any HTML in the name and truncate
	//name = name.replace(/<(?:[A-Z][A-Z0-9]*)\b[^>]*>(.*?)<\/(?:[A-Z][A-Z0-9]*)>/gi, '$1');

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
	// Don't do it when we're scrolling via animation
	if(window.SCROLLING) { return; }

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

// Expand code blocks on hover
$('pre:has(code)').bind('mouseenter mouseleave', function(event) {
	var elem = $(this),
		outer = elem.outerWidth(),
		inner = elem.children('code')[0].scrollWidth,
		win = $(window).width() - 400;

	if(win > inner) {
		elem.css('width',
			event.type === 'mouseenter' && outer < inner && win > inner ? inner + 14 : ''
		);
	}
	else {
		elem.css('overflow-x',
			event.type === 'mouseenter' && outer < inner ? 'auto' : 'hidden'
		);
	}
})
.each(function(i, cur) {
	var elem = $(this);
	elem.css({
		width: elem.outerWidth(),
		height: elem.outerHeight()
	});
})
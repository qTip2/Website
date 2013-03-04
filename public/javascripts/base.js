$(function() {
	// Setup header tooltips
	$('#header a[title]').qtip({
		position: {
			my: 'top center',
			at: 'bottom center',
			viewport: $(window)
		},
		style: 'fixed'
	});

	// Add active class to active header nav elements
	$('#header li:not(.logo)').click(function() {
		$('a', this).addClass('active')
			.end().siblings().children('a').removeClass('active');
	});

	// Setup
	$('li input[type="checkbox"], li input[type="radio"], amount li input').change(function() {
		$(this).parents('li').siblings().andSelf().each(function() {
			$(this).toggleClass('checked', $('input', this)[0].checked);
		});
	});

	// Setup the usual tooltips
	$('[title]').qtip({ overwrite: false });
	$('#content [alt]').qtip({ overwrite: false, content: { attr: 'alt' } });

	function gotoAnchor(id, animate, pulsate) {
		var target = $('a[name="'+id+'"]');
		if(!target.length) { return; }

		var scrollers = $('html, body'),
			newTop = target.offset().top;

		if(animate === false) {
			document.location.hash = '#'+id;
			scrollers.scrollTop(newTop);
		}
		else { 
			scrollers.stop().animate({ scrollTop: newTop }, {
				duration: 550,
				easing: 'swing'
			});
			document.location.hash = '#'+id;
		}
	}

	// Smooht scroll to anchors
	$('a[href^="#"]').on("click", function(e) {
		e.preventDefault();
		gotoAnchor( this.href.substr(this.href.indexOf('#')+1) );
	});

	// Highlight the correct nav element bvased on hash
	//$('a[href="'+document.location.pathname+'"]').addClass('active');
});
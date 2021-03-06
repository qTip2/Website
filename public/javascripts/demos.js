var at = [
	'bottom left', 'bottom right', 'bottom center',
	'top left', 'top right', 'top center'
];

var demos = {
	contents: {
		'text': {
			content: 'Simple textual content'
		},

		'html': {
			content: 'Complex <b>inline</b> <i>HTML</i> in your <u>config</u>!'
		},

		'ajax': {
			content: {
				text: function(event, api) {
					$.ajax({
						url: '/demos/data/owl',
					})
					.then(function(content){
						api.set('content.text', content);
					},
					function(xhr, status, error) {
						// Upon failure... set the tooltip content to the status and error value
						api.set('content.text', status + ': ' + error);
					});

					return 'Loading...';
				}
			},
			position: {
				viewport: $(window)
			},
			hide: {
				fixed: true,
				delay: 300
			},
			style: 'wiki'
		},

		'iframe': {
			content: {
				text: '<iframe src="http://html5rocks.com" />'
			},
			hide: {
				delay: 90,
				fixed: true
			},
			position: {
				viewport: $(window)
			}
		},

		'title': {
			content: {
				text: 'Separate content and title text makes extending existing tooltips a breeze.',
				title: 'Your original title here!'
			}
		},

		'button': {
			content: {
				text: 'Closing your tooltips just got easier with a handy new <i>style-able</i> button!',
				title: {
					button: true
				}
			}
		},

		'titlebutton': {
			content: {
				text: 'A great way to show a persistent tooltip with an easy close method',
				title: {
					text: 'Combined title and button',
					button: true
				}
			},
			hide: { 
				event: 'click',
				inactive: 1500
			}
		},

	},

	positioning: {
		'corners': function(elem) {
			function get(c) {
				var arr = [ $('#corner-'+c+'-y').val(), $('#corner-'+c+'-x').val() ];
				return ($('#corner-'+c+'-swap').is(':checked') ? arr.reverse() : arr).join(' ');
			}

			var tooltip = $('.block', elem).qtip({
				content: 'Move me around using the dropdowns',
				position: {
					my: get('my'),
					at: get('at'),
					viewport: elem,
					adjust: { method: $('#corner-adjust').val() }
				},
				show: true,
				hide: false
			}).qtip('api');

			elem.on('change', 'select', function() {
				tooltip.set({
					'position.my': get('my'),
					'position.at': get('at'),
					'position.adjust.method': $('#corner-adjust').val()
				});
			})
			.on('change', 'input', function() {
				$('#corner-my-y')[ this.checked ? 'insertAfter': 'insertBefore' ](
					$('#corner-my-x')[0]
				)
				.trigger('change');
			});
		},

		'adjust': {
			content: 'My position is adjusted 20px left and 8px up',
			position: {
				adjust: { x: -20, y: -8 }
			}
		},

		'viewport': {
			content: {
				text: 'I\'ll reposition in response to changes in the viewport size, and try to stay visible! Drag this block around to test it out!',
				title: {
					text: 'Drag the block around the screen!',
					button: true
				}
			},
			position: {
				viewport: $(window)
			}
		},

		'target': {
			content: 'You can even use a different positioning target than the one you bound the tooltip to!',
			position: {
				my: 'left center',
				at: 'right center',
				target: $('#section-positioning > h2')
			}
		},

		'mouse': {
			content: 'I\'ll position myself where your mouse is on the element as soon as I open',
			position: {
				target: 'mouse',
				adjust: { x: 5, y: 5, mouse: false }
			}
		},

		'track': {
			content: 'I\'ll follow your mouse around, with a tiny offset to keep myself out the way of your clicks!',
			position: {
				adjust: { x: 5, y: 5 },
				target: 'mouse'
			}
		},

		'imgmap': function(elem) {
			$('circle, rect, polygon, polyline, ellipse, line, area', elem).qtip({
				content: {
					title: 'At: ' + at[4]
				},
				position: {
					my: 'bottom center',
					at: 'top right'
				},
				hide: { 
					fixed: true
				},
				events: {
					render: function(event, api) {
						api.elements.target.add(this).click(function() {
							var i = api.cache.curI || 0,
								curAt = api.get('position.at'),
								newAt = at[ i++ ],
								newMy = new api.reposition.Corner(newAt);

							newMy.invert('x'); newMy.invert('y');

							api.set({
								'position.at': newAt,
								'position.my': newMy.string(),
								'content.title': 'At: ' + newAt
							});

							api.cache.curI = i % at.length;
						})
						.mousedown(function(e) { e.preventDefault(); });
					}
				}
			})
			
			$(' area', elem).parent().prev().maphilight({
				alwaysOn: true,
				stroke: false,
				fillColor: 'FFFFFF',
				fillOpacity: 0.35,
				stroke: true,
				strokeColor: 'BBBBBB',
				strokeOpacity: 0.3,
				strokeWidth: 2
			});
		},

		'svg': function(elem) {
			demos.positioning.imgmap(elem);
		}
	},

	showhide: {
		'click': {
			content: 'I can only be shown and hidden by clicking my target element',
			show: 'click',
			hide: 'click'
		},

		'focus': {
			content: 'I toggle when my input element is focussed/blurred',
			show: 'focus',
			hide: 'blur'
		},

		'unfocus': {
			content: 'Click elsewhere on the page to hide me!',
			hide: 'unfocus'
		},

		'fixed': {
			content: 'You can interact with my contents by mousing onto me. Click my <a href="http://google.com">link!</a>',
			hide: {
				fixed: true,
				delay: 100
			}
		},

		'delay': {
			content: 'I have a longer show delay of 500 milliseconds and a hide delay of 2 seconds',
			show: { delay: 500 },
			hide: { delay: 2000 }
		},

		'solo': {
			content: 'The show.solo property lets me hide other tooltips when I open.',
			show: { solo: true }
		},

		'inactive': {
			content: 'If you don\'t interact with me or my target for <b>3 seconds</b>, I\'ll automatically hide',
			hide: {
				event: false,
				inactive: 3000
			}
		},

		'distance': {
			content: 'I will hide after moving your mouse more than <b>20px away from the opening position.</b>',
			position: {
				target: 'mouse',
				adjust: { mouse: false }
			},
			hide: {
				event: false,
				distance: 20
			}
		},

		'fade': {
			content: 'I use .fadeTo() in the show &amp; hide effects to produce a longer fade duration.',
			show: {
				effect: function() {
					$(this).fadeTo(500, 1);
				}
			},
			hide: {
				effect: function() {
					$(this).fadeTo(500, 0);
				},
			}
		},

		'slide': {
			content: 'I use the built-in jQuery .slideUp() and .slideDown() methods',
			show: {
				effect: function() {
					$(this).slideDown();
				}
			},
			hide: {
				effect: function() {
					$(this).slideUp();
				},
			}
		},

		'fadeslide': {
			content: 'I have a longer fade in duration and slideUp to hide',
			show: {
				effect: function() {
					$(this).fadeTo(500, 1);
				}
			},
			hide: {
				effect: function() {
					$(this).slideUp();
				}
			}
		},

		'ui': {
			content: 'We can utilise jQuery UI\'s additional effects too',
			show: {
				effect: function() {
					$(this).show('slide', 500);
				}
			},
			hide: {
				effect: function() {
					$(this).hide('puff', 500);
				}
			}
		},

		'custom': {
			content: 'You can also utilise jQuery\'s .animate() method to produce custom effects',
			show: {
				effect: function() {
					$(this).fadeTo(500, 1);
				}
			},
			hide: {
				effect: function() {
					$(this).slideUp();
				},
			}
		}
	},

	stacking: {
		'block': function(elem) {
			$('a', elem).qtip({
				position: {
					my: 'bottom center',
					at: 'top center'
				},
				show: true,
				hide: false,
				events: {
					focus: function(event, api) {
						api.set('position.adjust.y', -5);
					},
					blur: function(event, api) {
						api.set('position.adjust.y', 0);	
					}
				}
			})
		}
	},

	apicallbacks: {
		'youtube': {
			content: $('<div />', { id: 'vMF3Vbq2BPbE' }),
			position: {
				at: 'right center',
				my: 'left center'
			},
			show: {
				event: 'click',
				effect: function() {
					var style = this[0].style;
					style.display = 'none';
					setTimeout(function() { style.display = 'block'; }, 1);
				}
			},
			hide: 'unfocus',
			style: {
				classes: 'qtip-youtube',
				width: 275
			},
			events: {
				render: function(event, api) {
					new YT.Player('vMF3Vbq2BPbE', {
						playerVars: {
							autoplay: 1,
							enablejsapi: 1,
							origin: document.location.host
						},
						origin: document.location.host,
						height: 180,
						width: 275,
						videoId: 'MF3Vbq2BPbE',
						events: {
							'onReady': function(e) {
								api.player = e.target;
								api.player.mute();
							},
						}
					});
				},
				hide: function(event, api){
					api.player && api.player.stopVideo();
				}
			},
		},

		'vimeo': {
			content: '<iframe src="http://player.vimeo.com/video/1949449?api=1&autoplay=1&player_id=v1949449" ' +
				'width="275" height="155" frameborder="0" id="v1949449"></iframe>',
			position: {
				at: 'right center',
				my: 'left center'
			},
			show: 'click',
			hide: 'unfocus',
			style: {
				classes: 'vimeo',
				width: 275, height: 157
			},
			events: {
				render: function(event, api) {
					var iframe = $('iframe', this)[0];
					$f(iframe).addEvent('ready', function(player_id) {
						// Set the API player
						api.player = $f(player_id);

						// Mute it on load
						api.player.api('setVolume', 0);
					});
				},
				hide: function(event, api) {
					// Pause the video on hide
					api.player.api('pause');
				}
			}
		},

		'maps': function(container) {
			$('a[data-coords]', container).each(function() {
				var elem = $(this), li = elem.parents('li');

				elem.qtip({
					content: {
						text: 'Loading map...',
						title: { button: true }
					},
					position: {
						my: 'left center',
						at: 'right center',
						target: li
					},
					show: {
						target: li,
						event: 'click'
					},
					hide: {
						target: li,
						event: 'unfocus'
					},
					style: {
						classes: 'googlemap',
						width: 300
					},
					events: {
						render : function(event, api) {
							var tooltip = $(this),

							// Setup the map container and append it to the tooltip
							container = $('<div style="width:300px; height:200px;"></div>')
								.appendTo(api.elements.content.empty());

							// Temporarily show the tooltip so we don't get rendering bugs in GMaps
							tooltip.show();

							// Create map object as api attribute for later use
							api.map = new google.maps.Map(container[0], {
								zoom: 12, // Close zoom!
								mapTypeId: google.maps.MapTypeId.ROADMAP // Use the classic roadmap
							});

							// Hide the tooltip again now we're done
							tooltip.hide();
						},
						show: function(event, api) {
							// Grab the map reference and target
							var map = api.map,
								target = api.elements.target,
								coords, latlong, map, marker, info;

							// Parse coordinates of event target
							coords = api.elements.target.data('coords').split(',');

							// Setup lat/long coordinates
							latlong = new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));

							// Create marker at the new location and center map there
							marker = new google.maps.Marker({
								position: latlong,
								map: map,
								title: target.attr('alt') // Use the alt attribute of the target for the marker title
							});
							map.setCenter(latlong);
						}
					}
				});
			});
		},

		'alert': function(elem) {
			var message = $('<p />', { text: 'This is a sample alert dialogue' }),
				ok = $('<button />', { text: 'Ok', 'class': 'full' });

			elem.click(function() {
				dialogue( message.add(ok), 'Alert!' );
			});
		},

		'prompt': function(elem) {
			var message = $('<p />', { text: 'What do you think about these custom dialogues?' }),
				input = $('<input />', { val: 'Fantastic!' }),
				ok = $('<button />', {
					text: 'Ok'
				}),
				cancel = $('<button />', {
					text: 'Cancel'
				});

			elem.click(function() {
				dialogue( message.add(input).add(ok).add(cancel), 'Attention!' );
			});
		},

		'confirm': function(elem) {
			var message = $('<p />', { text: 'Click a button to exit the custom dialogue' }),
				ok = $('<button />', {
					text: 'Ok'
				}),
				cancel = $('<button />', {
					text: 'Cancel'
				});

			elem.click(function() {
				dialogue( message.add(ok).add(cancel), 'Do you agree?' );
			});
		},

		'jgrowl': function(elem) {
			elem.click(function() {
				createGrowl(false);
			});
		},

		'imdb': function(container) {
			var googleURL = "http://www.google.com/uds/GwebSearch?lstkp=0&rsz=small&hl=en&source=gsc&gss=.com&sig=d5fae37fdfdac0a0e1e1aa0c8bc4b04c&q=http%3A%2F%2Fwww.imdb.com%2Ftitle%2F[id]%2F%20rating%2010%20site%3Aimdb.com&gl=www.google.com&key=notsupplied&v=1.0";

			$('a[href^="http://www.imdb.com"]', container).each(function() {
				var elem = $(this), li = elem.parents('li');

				var id = $(this).attr('href').match(/tt[0-9]{7}/);
				if(id.length < 1) { return true; }

				elem.qtip(
				{
					content: {
						text: 'Rating...',
						text: function(event, api) {
							$.ajax({
								url: googleURL.replace('[id]', id[0]),
								loading: false,
								dataType: 'jsonp',
							})
							.then(function(json){
								// Parse rating from results
								var rating;
								$.each(json.responseData.results, function(i, data) {
									var match = data.content.match(/([0-9\.]+)\/.+10/);
									if(match && (rating = match[1])) { return false; }
								});

								// If we got a rating, perfect. If not, destroy it!
								if(rating) { api.set('content.text', rating); }
								else { api.destroy(); }
							},
							function(xhr, status, error) {
								// Upon failure... set the tooltip content to the status and error value
								api.destroy(true); 
							});
							
							return 'Rating...';
						}
					},
					position: {
						my: 'left center',
						at: 'right center',
						target: li
					},
					show: { target: li },
					hide: { target: li },
					style: {
						classes: 'imdb'
					}
				})
			});
		},

		'websnapr': function(container) {
			$('a:not(.source)', container).each(function() {
				var elem = $(this), li = elem.parents('li');

				// Grab the URL from our link
				var url = encodeURIComponent( $(this).attr('href') ),
					apiKey = '0KUn7MSO3322',
					thumbail;

				// Create image thumbnail using Websnapr thumbnail service
				thumbnail = $('<img />', {
					src: 'http://images.websnapr.com/?url=' + url + '&key=' + apiKey + '&hash=' + encodeURIComponent(websnapr_hash),
					alt: 'Loading thumbnail...',
					width: 202,
					height: 152
				});

				// Setup the tooltip with the content
				elem.qtip({
					content: thumbnail,
					position: {
						at: 'top center',
						my: 'bottom center',
						target: li
					},
					show: { target: li },
					hide: { target: li },
					style: {
						classes: 'websnapr'
					}
				});
			});
		},

		'twitter': function(container) {
			$('a[href^="http://twitter.com"]', container).each(function() {
				var elem = $(this), li = elem.parents('li');

				var username = $(this).attr('href').match(/^http:\/\/twitter\.com\/(\w+)\/?/);
				if(username && username.length > 1) {
					username = username[1];
				}
				else { return; }

				$(this).qtip({
					content: {
						text: function(event, api) {
							$.ajax({
								url: 'http://api.twitter.com/1/statuses/user_timeline/'+username+'.json?callback=?',
								data: { count: 1 },
								dataType: 'jsonp',
							})
							.then(function(tweet){
								var content = tweet[0].text;
								content = content.replace(/(http:\/\/[^\s]+)/gi, '<a href="$1">$1</a>')
								api.set('content.text', '<b>'+username+':</b> ' + content);
							},
							function(xhr, status, error) {
								api.destroy(true);
							});

							return 'Loading Twitter feed...';
						}
					},
					position: {
						at: 'top center',
						my: 'bottom center',
						target: li
					},
					show: { target: li },
					hide: {
						target: li,
						delay: 80,
						fixed: true
					},
					style: {
						classes: 'tweet'
					},
					events: {
						// Optional little extra to add a twitter badge to our tooltip!
						render: function(event, api) {
							$('<img />', {
								'class': 'logo',
								'src': 'http://media2.juggledesign.com/qtip2/images/demos/twitter_logo.png',
								'width': 17,
								'height': 17
							})
							.appendTo(api.elements.tooltip);
						}
					}
				});
			});
		},

		'geoloc': function(container) {
			$('a:not(.source)', container).each(function() {
				var elem = $(this), li = elem.parents('li');

				elem.qtip({
					content: {
						text: function(event, api) {
							$.ajax({
								url: 'http://api.ipinfodb.com/v2/ip_query.php?callback=?',
								type: 'GET',
								dataType: 'jsonp',
								data: {
									ip: elem.data('ip'),
									key: '3d26e08735f33e0cbc88e9841d51e1062f33f84aa77de3c27be83601891fa2c9',
									timezone: false,
									output: 'json'
								}
							})
							.then(function(json){
								var container, latlong, options, map, marker;
		 
								container = $('<div style="width:290px; height:210px;" />')
									.appendTo(api.elements.content.empty());
		 
								latlong = new google.maps.LatLng(json.Latitude, json.Longitude);
								api.map = new google.maps.Map(container[0], {
									zoom: 10,
									center: latlong,
									mapTypeId: google.maps.MapTypeId.ROADMAP
								});
		 
								marker = new google.maps.Marker({
									position: latlong,
									map: api.map,
									clickable: true,
		 
									title: [json.City, json.RegionName, json.CountryName].join(', ')
								});

								api.reposition();
							},
							function(xhr, status, error) {
								api.set('Unable to geo locate the given IP Address!');
							});

							return '<div class="loading">Geolocating...</div>';
						}
					},
					position: {
						my: 'left center',
						at: 'right center',
						target: li
					},
					show: {
						target: li,
						event: 'click'
					},
					hide: {
						target: li,
						delay: 200,
						fixed: true // We'll let the user interact with it
					},
					style: {
						classes: 'googlemap geolocation',
						width: 290 // Override default CSS width to the map width
					}
				});
			})
			.click(function(e){ e.preventDefault(); });
		},

		'translate': function(container) {
			// Ensure we can only select stuff in the translate div!
			container.bind('mousedown', function() {
				container.one('mouseup', function(event) {
					// Get selection
					var selection = (window.getSelection && window.getSelection() ||
						document.selection && document.selection.createRange()).toString();
					if(!$.trim(selection)) { return; }

					// Show the tooltip
					tooltip.cache.query = selection;
					tooltip.set('content.text', tooltip.get('content.text')).show(event);
				});
			})

			var tooltip = $('<div/>').qtip({
				content: {
					text: function(event, api) {
						return $.ajax({
							url: '/demos/data/translate',
							data: { q: api.cache.query }
						})
						.then(function(json){
							// Set the content to the translated text
							return json.data.translations[0].translatedText;
						},
						function(xhr, status, error) {
							api.destroy(true);
						});
					}
				},
				position: {
					target: 'mouse',
					adjust: { mouse: false }
				},
				show: false,
				hide: 'unfocus'
			}).qtip('api');
		}
	}
}

// Alert/Confirm/Prompt
function dialogue(content, title) {
	$('<div />').qtip({
		content: {
			text: content,
			title: title
		},
		position: {
			my: 'center', at: 'center',
			target: $(window)
		},
		show: {
			ready: true,
			modal: {
				on: true,
				blur: false
			}
		},
		hide: false,
		style: 'dialogue',
		events: {
			render: function(event, api) {
				$('button', api.elements.content).click(function() {
					api.hide();
				});
			},
			hide: function(event, api) { api.destroy(); }
		}
	});
}

// Create a jGrowl
window.createGrowl = function(persistent) {
	var target = $('.qtip.jgrowl:visible:last');

	$('<div/>').qtip({
		content: {
			text: 'This is a jGrowl-esque qTip!',
			title: {
				text: 'Attention!',
				button: true
			}
		},
		position: {
			target: [0,0],
			container: $('#jgrowl-container')
		},
		show: {
			event: false,
			ready: true,
			effect: function() {
				$(this).stop(0, 1).animate({ height: 'toggle' }, 400, 'swing');
			},
			delay: 0,
			persistent: persistent
		},
		hide: {
			event: false,
			effect: function(api) {
				$(this).stop(0, 1).animate({ height: 'toggle' }, 400, 'swing');
			}
		},
		style: {
			width: 250,
			classes: 'jgrowl',
			tip: false
		},
		events: {
			render: function(event, api) {
				if(!api.options.show.persistent) {
					$(this).bind('mouseover mouseout', function(e) {
						var lifespan = 5000;

						clearTimeout(api.timer);
						if (e.type !== 'mouseover') {
							api.timer = setTimeout(function() { api.hide(e) }, lifespan);
						}
					})
					.triggerHandler('mouseout');
				}
			}
		}
	});
}
$('<div id="jgrowl-container" />').appendTo(document.body);

// Setup demos
$.each(demos, function(type, children) {
	$.each(children, function(name, config) {
		var elem = $('#'+type+'-'+name);
		if(!elem.length) { return; }

		if($.isPlainObject(config)) {
			config.id = name;
			elem.qtip(config);
			$('a:not(.source)', elem).click(function(e) { e.preventDefault(); });
		}
		else if($.isFunction(config)) {
			config(elem);
		}
	});
});

// Setup viewport adjustment type selector
$('#positioning-viewport select').change(function() {
	$(this).parent().qtip('option', 'position.adjust.method', $(this).val());
});

// Setup styling
$('#section-styling .examples .qtip').each(function() {
	var elem = $(this);

	elem.qtip({
		content: {
			title: elem.data('title')
		},
		position: {
			my: 'top center',
			at: 'bottom center'
		},
		style: {
			classes: this.className
		}
	});
});

// Setup styling shadow/rounded checkboxes
$('#styling-builtin :checkbox').change(function() {
	var parent = $(this).parent(),
		state = this.checked,
		cls = $(this).data('class');

	// Adjust the qtip containers
	$('.qtip', parent).each(function() {
		$(this).qtip('option', 'style.classes',
			$(this).qtip('option', 'style.classes').replace(new RegExp(cls, 'g'), '') +
				(state ? ' '+cls : '')
		);
	})
	.toggleClass(cls, state);

	// Adjust global style
	if( $('#section-styling .qtip-container.active').parent()[0] === parent[0] ) {
		globalStyle = globalStyle.replace(new RegExp(cls, 'g'), '') + (state ? ' '+cls : '');
	}
	$('#header .qtip').attr('class', 'qtip qtip-default ' + globalStyle);

	// Update currently visible tooltips
	$('.qtip:visible').each(function() {
		var api = $.data(this, 'qtip');
		api && updateStyle(api);
	});
	
	// Store it in the cookie
	$.cookie('qtip2_global_style', globalStyle, { path: '/' });
})

// Allow the pages tooltip theme to be changed via it's selector
$('#section-styling .qtip-container').click(function() {
	var style = $(this).children().data('style');

	// Toggle active classes
	$('#section-styling .qtip-container').removeClass('active');
	$(this).addClass('active');

	// Set the global style
	if( this.parentNode.id === 'styling-builtin' ) {
		globalStyle = [style].concat(globalStyle.split(' ').slice(1)).join(' ');
		$(this).siblings(':checkbox').trigger('change');
	}
	else { globalStyle = style; }

	// Update header tooltip style
	$('#header .qtip').attr('class', 'qtip qtip-default ' + globalStyle);

	// Update currently visible tooltips
	$('.qtip:visible').each(function() {
		var api = $.data(this, 'qtip');
		api && updateStyle(api);
	});

	// Store it in the cookie
	$.cookie('qtip2_global_style', globalStyle, { path: '/' });

});

// Setup themeroller themeswitcher
var currentColor = '';
$('#themeswitcher').themeswitcher({
	width: 260,
	height: 200,
	buttonheight: 25,
	initialtext: 'Choose a jQuery UI theme...',
	imgpath: '/static/images/themeswitcher/',
	onopen: function() {
		currentColor = $('#qtip-themeroller .ui-tooltip-header').css('backgroundColor');
	},
	onselect: function() {
		var tooltip = $('#qtip-themeroller');

		// Update the title
		tooltip.qtip('option', 'content.text', 'jQuery UI ' + $('.jquery-ui-switcher-title').text());

		// Continuously check for a change in titlebar colour to signify the theme is loaded (up to 10 times only)
		(function timer(i) {
			if(currentColor !== $('.ui-tooltip-header', tooltip).css('backgroundColor')) {
				tooltip.qtip('option', {
					'style.widget': true
				});
			}
			else if(i < 10) { setTimeout(function() { timer(++i) }, 400); }
		}(0));
	}
})
.qtip({
	id: 'themeroller',
	content: {
		text: "I'm styled using Themeroller style to the left.",
		title: {
			text: 'Themeroller integration',
			button: true
		}
	},
	show: { ready: true },
	hide: false,
	position: {
		at: 'right center',
		my: 'left top',
		container: $('#styling-ui')
	},
	style: {
		widget: true,
		classes: 'qtip-ui'
	}
});

// Setup draggables
var timer;
$('.draggable').draggable({
	revert: true,
	zIndex: 10000,
	containment: 'window',
	scroll: false,
	start: function(event, ui) {
		ui.helper.qtip('option', 'hide.event', false);
		$('body').addClass('dragging').one('mouseup', function() {
			$(this).removeClass('dragging');
		});
	},
	drag: function(event, ui) {
		clearTimeout(timer);
		timer = setTimeout(function() {
			ui.helper.qtip('reposition');
		}, 50);
	},
	stop: function(event, ui) {
		ui.helper.qtip('hide').qtip('option', 'hide.event', 'mouseleave')
	}
});

// Setup FullCalendar
(function() {
	var date = new Date();
	var d = date.getDate();
	var m = date.getMonth();
	var y = date.getFullYear();

	var tooltip = $('<div/>').qtip({
		id: 'fullcalendar',
		prerender: true,
		content: {
			text: ' ',
			title: {
				button: true
			}
		},
		position: {
			my: 'bottom center',
			at: 'top center',
			target: 'mouse',
			viewport: $('#fullcalendar'),
			adjust: {
				mouse: false,
				scroll: false
			}
		},
		show: false,
		hide: false,
		style: 'qtip-light'
	}).qtip('api');

	$('#fullcalendar').fullCalendar({
		editable: true,
		height: 300,
		header: {
			left: 'title',
			center: '',
			right: 'today prev,next'
		},
		eventClick: function(data, event, view) {
			var content = '<h3>'+data.title+'</h3>' + 
				'<p><b>Start:</b> '+data.start+'<br />' + 
				(data.end && '<p><b>End:</b> '+data.end+'</p>' || '');

			tooltip.set({
				'content.text': content
			})
			.reposition(event).show(event);
		},
		dayClick: function() { tooltip.hide() },
		eventResizeStart: function() { tooltip.hide() },
		eventDragStart: function() { tooltip.hide() },
		viewDisplay: function() { tooltip.hide() },
		events: [
			{
				title: 'All Day Event',
				start: new Date(y, m, 1)
			},
			{
				title: 'Long Event',
				start: new Date(y, m, d-5),
				end: new Date(y, m, d-2)
			},
			{
				id: 999,
				title: 'Repeating Event',
				start: new Date(y, m, d+4, 16, 0),
				allDay: false
			},
			{
				title: 'Meeting',
				start: new Date(y, m, d, 10, 30),
				allDay: false
			},
			{
				title: 'Birthday Party',
				start: new Date(y, m, d+1, 19, 0),
				end: new Date(y, m, d+1, 22, 30),
				allDay: false
			}
		]
	});
}());

// Setup jQuery UI elements
(function(){
	var slider = $('#jqueryui-slider').slider({
		slide: function(event, ui) {
			handle.qtip('option', 'content.text', '' + ui.value);
		}
	}),
	handle = $('.ui-slider-handle', slider);

	handle.qtip({
		id: 'uislider',
		content: '' + slider.slider('option', 'value'),
		position: {
			my: 'bottom center',
			at: 'top center',
			container: handle 
		},
		hide: {
			delay: 1000
		},
		style: {
			widget: true
		}
	});
}());


// Setup data Tables
$('#datatables').dataTable({
	bLengthChange: false,
	bFilter: false
})
.on('mouseenter', 'tr[data-browser]', function(event) {
	var browser = $(this).data('browser');

	$(this).qtip({
		overwrite: false,
		content: '<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-'+browser+'.png" alt="'+browser+'"/>',
		position: {
			my: 'right center',
			at: 'left center',
			target: $('td:eq(1)', this),
			viewport: $('#datatables')
		},
		show: {
			event: event.type,
			ready: true
		},
		hide: {
			fixed: true
		}
	});
});

// Setup flot
(function() {
	var sin = [], cos = [];
	for (var i = 0; i < 14; i += 0.5) {
		sin.push([i, Math.sin(i)]);
		cos.push([i, Math.cos(i)]);
	}

	var plot = $.plot("#flot", [
		{ data: sin, label: "sin(x)"},
		{ data: cos, label: "cos(x)"}
	], {
		series: {
			lines: { show: true },
			points: { show: true }
		},
		grid: {
			hoverable: true,
			clickable: true
		},
		yaxis: { min: -1.2, max: 1.2 }
	});

	var tooltip = $('#flot').qtip({
		id: 'flot',
		prerender: true,
		content: ' ',
		position: {
			target: 'mouse',
			viewport: $('#flot'),
			adjust: { x: 5 }
		},
		show: false,
		hide: {
			event: false,
			fixed: true
		}
	});

	var previousPoint = null;
	$("#flot").bind("plothover", function (event, coords, item) {
		// Grab the API reference
		var graph = $(this),
			api = graph.qtip(),
			previousPoint;
 
		// If we weren't passed the item object, hide the tooltip and remove cached point data
		if(!item) {
			api.cache.point = false;
			return api.hide(item);
		}
 
		previousPoint = api.cache.point;
		if(previousPoint !== item.dataIndex) {
			api.cache.point = item.dataIndex;
 
			api.set('content.text', 
				item.series.label + " of " + item.datapoint[0].toFixed(2) + " = " + item.datapoint[1].toFixed(2)
			);
 
			api.elements.tooltip.stop(1, 1);
			api.show(item);
		}
	});
}());

// Event delegation
$('#addmore').click(function() {
	$('<li />', {
		html: '<a title="Lorem ipsum: Added after page load!"><b>New</b> link!</a>'
	})
	.appendTo( $('#more') );
});
$('#more').on('mouseenter', 'a[title]', function(event) {
	$(this).qtip({
		overwrite: false,
		show: {
			event: event.type,
			ready: true
		}
	});
});

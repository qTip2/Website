$(function() {
	var container = $('#donate'),
		form = $('form', container),
		inputs = {
			moneybookers: [
				'pay_to_email', 'status_url', 'return_url', 'return_url_text', 'language', 'recipient_description', 'dynamic_descriptor',
				'detail1_description', 'detail2_description', 'detail2_text', 'amount2_description', 'payment_methods',
				'confirmation_note', 'logo_url', 'firstname', 'amount', 'external', 'amount2', 'lastname', 'merchant_fields', 'currency'
			],
			paypal: [
				'cmd', 'business', 'item_name', 'no_shipping', 'no_note', 'currency_code', 'tax', 'bn', 'firstname', 'amount', 'external'
			]
		};

	$('input[type="number"]', form).bind('focus', function() {
		$('.checked', form).removeClass('checked').find('input').removeAttr('checked');
		$(this).parents('li').addClass('checked');
	});

	$('input[type="number"], :radio', form).bind('focus change', function(event) {
		var type = this.type;
		$('input[type="number"], :radio', form).attr('name', function() {
			return 'amount' + (type === this.type ? '' : 'old');
		});
	})

	$('button', form).bind('mousedown', function() {
		var service = $(this).data('external');

		// Disable everything initially
		$('input[type="hidden"]', form).attr('disabled', 'disabled');

		// Un-disable those needed for this service
		$.each(inputs[ service ], function(i, input) {
			$('input[name="'+input+'"]', form).removeAttr('disabled');
		});

		// Set all amount inputs to the correct amount
		$('input[name="amount2"]', form).val( $('input[name="amount"]', form).val() );
		$('input[name="currency_code"]', form).val( $('input[name="currency"]', form).val() );

		// Set the form action URL
		form.attr('action', function(){ return $(this).data(service); });
	});
});
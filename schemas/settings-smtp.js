NEWSCHEMA('Settings/SMTP').make(function(schema) {

	schema.define('smtp', 'String(100)', true);
	schema.define('smtpsettings', 'JSON');

	schema.addWorkflow('exec', function($) {

		var model = $.model;
		var options = model.smtpsettings.parseJSON();

		Mail.try(model.smtp, options, function(err) {
			if (err) {
				$.error.replace('@', err.toString());
				$.invalid('error-smtp');
			} else
				$.success();
		});
	});
});
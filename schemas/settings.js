NEWSCHEMA('Settings', function(schema) {

	// Main
	schema.define('url', String, true);
	schema.define('emailsender', 'Email', true);
	schema.define('emailrecipient', 'Email', true);
	schema.define('smtp', String);
	schema.define('smtpsettings', 'JSON');

	// Internal
	schema.define('cookie', 'String(30)', true);
	schema.define('cookie_expiration', 'String(30)', true);
	schema.define('cookie_key', 'String(30)', true);

	schema.middleware(function($, next) {
		if ($.user.plugins.settings && $.user.plugins.settings.indexOf('settings') !== -1) {
			next();
		} else {
			$.invalid('error-permissions');
			next(true);
		}
	});

	schema.setRead(function($) {

		var model = {};

		for (var i = 0; i < schema.fields.length; i++) {
			var prop = schema.fields[i];
			switch (prop) {
				case 'cookie':
					model[prop] = PREF[prop] || 'admin';
					break;
				case 'cookie_expiration':
					model[prop] = PREF[prop] || '3 days';
					break;
				case 'cookie_key':
					model[prop] = PREF[prop] || 'auth';
					break;
				default:
					model[prop] = PREF[prop];
					break;
			}
		}

		$.callback(model);
	});

	schema.setSave(function($) {

		var model = $.clean();
		var keys = Object.keys(model);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			PREF.set(key, model[key]);
		}

		PREF.smtp && Mail.use(PREF.smtp, PREF.smtpsettings.parseJSON());
		$.success();
	});

});
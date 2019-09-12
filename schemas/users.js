NEWSCHEMA('Users', function(schema) {

	// Main information
	schema.define('name', 'Capitalize(50)', true);
	schema.define('position', 'Capitalize(30)');
	schema.define('email', 'Email', true);
	schema.define('password', 'String(30)', true);
	schema.define('sa', Boolean);
	schema.define('isaudio', Boolean);
	schema.define('isblocked', Boolean);
	schema.define('iswelcome', Boolean);
	schema.define('plugin', 'String(30)'); // A default plugin
	schema.define('plugins', 'Object'); // { pluginname: roles }

	schema.middleware(function($, next) {
		if ($.user.plugins.settings && $.user.plugins.settings.indexOf('users') !== -1) {
			next();
		} else {
			$.invalid('error-permissions');
			next(true);
		}
	});

	schema.setRead(function($) {
		NOSQL('users').read().fields('-password,-secret').rule((doc, id) => doc.id === id, $.id).callback($.callback, 'error-users-404');
	});

	schema.setQuery(function($) {
		NOSQL('users').find().fields('-password,-secret').sort('dtcreated', true).callback($.callback);
	});

	schema.setInsert(function($) {
		var model = $.model;
		model.id = UID();
		model.dtcreated = NOW;
		model.password = model.password.sha256();
		model.notifications = 0;

		if (model.iswelcome) {
			// Send a welcome email
			// @TODO: missing implementation of welcome email
		}

		delete model.iswelcome;
		NOSQL('users').insert(model).callback($.done(model.id));
	});

	schema.setUpdate(function($) {
		var model = $.clean();
		model.dtupdated = NOW;
		model.password = model.password[0] === '*' ? undefined : model.password.sha256();
		delete model.iswelcome;
		NOSQL('users').modify(model).rule((doc, id) => doc.id === id, $.id).callback($.done(model.id));
		MAIN.session.release2($.id);
	});

	schema.setRemove(function($) {
		if ($.id === $.user.id)
			$.invalid('error-permissions');
		else {
			MAIN.session.remove2($.id);
			NOSQL('users').remove().rule((doc, id) => doc.id === id, $.id).callback($.done($.id));
		}
	});

});
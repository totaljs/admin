NEWSCHEMA('Account', function(schema) {

	schema.define('name', 'Capitalize(50)', true);
	schema.define('email', 'Email', true);
	schema.define('password', 'String(30)', true);
	schema.define('isaudio', Boolean);

	// Two factor
	schema.define('istwofactor', Boolean);
	schema.define('secret', 'String(50)');

	schema.setRead(function($) {
		NOSQL('users').read().rule((doc, id) => doc.id === id, $.user.id).fields('-id,-password,-secret,-notifications').callback($.callback, 'error-account-404');
	});

	schema.setSave(function($) {
		var model = $.clean();
		if (model.password[0] === '*')
			delete model.password;
		else
			model.password = model.password.sha256();

		if (model.istwofactor) {
			if (!model.secret) {
				delete model.secret;
				delete model.istwofactor;
			}
		}

		NOSQL('users').modify(model).rule((doc, id) => doc.id === id, $.user.id).callback($.done(), 'error-account-404');
	});

	schema.addWorkflow('notifications', function($) {

		// Updates all user sessions
		MAIN.sessions.list(model.userid, function(err, sessions) {
			for (var i = 0; i < sessions.length; i++) {
				var session = sessions[i];

				// Optimized for single-thread only
				if (session.data)
					session.data.notifications = 0;
			}
		});

		NOSQL('users').modify({ notifications: 0 }).rule((doc, id) => doc.id === id, $.user.id);
		NOSQL('notifications').find().rule((doc, id) => doc.userid === id, $.user.id).callback($.callback);
	});

});
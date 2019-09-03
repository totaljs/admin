NEWSCHEMA('Account/TOTP', function(schema) {

	schema.define('secret', 'String(50)', true);
	schema.define('code', 'String(6)', true);

	schema.addWorkflow('verify', function($) {
		var output = MODULE('totp').totpverify($.model.secret, $.model.code);
		if (output && output.delta < 3)
			$.success();
		else
			$.invalid('error-totp-code');
	});

	schema.addWorkflow('generate', function($) {
		$.callback(MODULE('totp').generate('TotalAdmin', CONF.name));
	});
});
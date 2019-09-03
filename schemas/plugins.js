NEWSCHEMA('Plugins', function(schema) {
	schema.setQuery(function($) {
		var plugins = [];
		for (var i = 0; i < MAIN.plugins.length; i++) {
			var plugin = MAIN.plugins[i];
			var obj = {};
			obj.id = plugin.id;
			obj.name = plugin.name;
			obj.roles = plugin.roles;
			obj.icon = plugin.icon;
			obj.color = plugin.color;
			plugins.push(obj);
		}
		$.callback(plugins);
	});
});
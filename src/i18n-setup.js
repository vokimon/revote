'use strict';

const _ = require('./translate');
const moment = require('moment');
require('moment/locale/es');
require('moment/locale/ca');
require('moment/locale/eu');
require('moment/locale/gl');

function basename(path) {
	return path.split('/').pop().split('.').shift();
}

var translations = {};
const requireContext = require.context('./i18n', false, /\.yaml$/);
for (let key of requireContext.keys()) {
	const translation = requireContext(key);
	const langname = basename(key);
	translations[langname] = {
		values: translation
	};
}
_.selectLanguage(Object.keys(translations), function(err, lang) {
	_.translator.add(translations[lang] || translations['es']);
	moment.locale(lang);
});

// vim: noet ts=4 sw=4

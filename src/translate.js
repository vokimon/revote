'use strict';

// Mockup module for translations

const _ = require('i18n4v');
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

/*
var _ = function(t,params) {
	return t;
};
*/
module.exports = _

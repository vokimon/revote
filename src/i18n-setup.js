'use strict';

import _ from './translate';
import moment from 'moment';
import 'moment/locale/es';
import 'moment/locale/ca';
import 'moment/locale/eu';
import 'moment/locale/gl';

function basename(path) {
	return path.split('/').pop().split('.').shift();
}

const translations = {};
const modules = import.meta.glob('./i18n/*.yaml', {
	eager: true,
	import: "default",
});

for (const [key, translation] of Object.entries(modules)) {
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

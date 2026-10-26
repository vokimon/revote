'use strict';

import Revote from './revote';
var context = require.context('./data/', true, /\.(yaml)$/);
Revote.scenarios = context.keys().map(function(filename) {
	var scenario = context(filename);
	scenario.filename = filename.split('/').pop();
	scenario.candidatures.sort(function(a, b) { return b.votes - a.votes; });
	return scenario;
});
console.log('Scenarios', Revote.scenarios);
Revote.initialize();

// vim: noet ts=4 sw=4

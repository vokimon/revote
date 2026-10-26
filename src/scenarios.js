'use strict';

import Revote from './revote';
const scenarioModules = import.meta.glob('./data/**/*.yaml', {
	eager: true,
	import: 'default',
});

Revote.scenarios = Object.entries(scenarioModules).map(function([filename, scenario]) {
	scenario.filename = filename.split('/').pop();
	scenario.candidatures.sort(function(a, b) { return b.votes - a.votes; });
	return scenario;
});

Revote.initialize();

// vim: noet ts=4 sw=4

'use strict';

import Revote from './revote';
import { buildShallowScenarios } from './stockscenarios.js';

const scenarioLoaders = import.meta.glob('./data/**/*.yaml', {
    import: 'default',
});

export const shallowScenarios = buildShallowScenarios(Object.keys(scenarioLoaders))

const scenarioModules = import.meta.glob('./data/**/*.yaml', {
	eager: true,
	import: 'default',
});

Revote.scenarios = Object.entries(scenarioModules).map(function([filename, scenario]) {
	scenario.filename = filename.split('/').pop();
	scenario.candidatures.sort(function(a, b) { return b.votes - a.votes; });
	return scenario;
});

console.debug({"scenarios": Revote.scenarios})
console.debug({shallowScenarios})

Revote.initialize();

// vim: noet ts=4 sw=4

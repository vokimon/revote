'use strict';

import Revote from './revote';
import { parseScenarioFilename } from './stockscenarios.js';


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

export { default as scenarioIndex } from './stockscenarios.js';

// vim: noet ts=4 sw=4

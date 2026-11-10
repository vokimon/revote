'use strict';

import Revote from './revote';
import { buildShallowScenarios } from './stockscenarios.js';

const scenarioLoaders = import.meta.glob('./data/**/*.yaml', {
    import: 'default',
});

export const shallowScenarios = buildShallowScenarios(scenarioLoaders)

Revote.initialize(shallowScenarios)

// vim: noet ts=4 sw=4

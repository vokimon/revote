'use strict';

const elections = ['congreso', 'europeas'];
const electionPattern = elections.join('|');

export function parseScenarioFilename(path) {
    const filename = path.split('/').pop();
    const filenamePattern = new RegExp(
        `^(${electionPattern})(.+)-(\\d{4})-(\\d{2})\\.yaml$`
    );
    const match = filename.match(filenamePattern)

    if (!match) {
        throw new Error(`Invalid scenario filename: ${filename}`);
    }

    const [, election, province, year, month] = match;

    return {
        id: filename.slice(0, -5),
        filename,
        election,
        province,
        year: Number(year),
        month: Number(month),
    };
}

const scenarioLoaders = import.meta.glob('./data/**/*.yaml', {
    import: 'default',
});


/*
const scenarios = Object.keys(scenarioLoaders)
    .map(parseScenarioPath)
    .sort((a, b) =>
        a.province.localeCompare(b.province) ||
        a.year - b.year ||
        a.month - b.month ||
        a.election.localeCompare(b.election)
    );

const ids = new Set();

for (const scenario of scenarios) {
    if (ids.has(scenario.id)) {
        throw new Error(`Duplicate scenario ID: ${scenario.id}`);
    }

    ids.add(scenario.id);
}
*/
const scenarios = []

export default scenarios;

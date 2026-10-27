'use strict';

const elections = ['congreso', 'europeas', 'parlament'];
const electionPattern = elections.join('|');

export function parseScenarioFilename(path) {
    const filename = path.split('/').pop();
    const filenamePattern = new RegExp(
        `^(${electionPattern})(.+)-(\\d{4})(?:-(\\d{2}))?\\.yaml$`
    );
    const match = filename.match(filenamePattern)

    if (match) {
        const [, election, province, year, month] = match;

        return {
            id: filename.slice(0, -5),
            filename,
            election,
            province,
            year: Number(year),
            month: month == undefined? null : Number(month),
        };
    }

    return {
        id: filename.slice(0, -5),
    }

}

export function compareScenarios(a, b) {
    return (a.province ?? '').localeCompare(b.province ?? '') ||
        (a.year ?? 0) - (b.year ?? 0) ||
        (a.month ?? 0) - (b.month ?? 0) ||
        (a.election ?? '').localeCompare(b.election ?? '') ||
        a.id.localeCompare(b.id);
}

export function validateScenarioIndex(scenarioIndex) {
    const ids = new Set();

    for (const scenario of scenarioIndex) {
        if (ids.has(scenario.id)) {
            throw new Error(`Duplicate scenario ID: ${scenario.id}`);
        }

        ids.add(scenario.id);
    }
    return scenarioIndex
}

export function buildScenarioIndex(paths) {
    const scenarioIndex = paths
        .map(parseScenarioFilename)
        .sort(compareScenarios)

    validateScenarioIndex(scenarioIndex)
    return scenarioIndex
}


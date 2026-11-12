'use strict';

const elections = ['congreso', 'europeas', 'parlament'];
const electionPattern = elections.join('|');

export function parseScenarioFilename(path) {
    const filename = path.split('/').pop();
    const filenamePattern = new RegExp(
        `^(\\d{4}-\\d{2}-\\d{2})-([^-]+)-(${electionPattern})(?:-(.+))?\\.yaml$`
    );
    const match = filename.match(filenamePattern)

    if (match) {
        const [, date, province, election, extra] = match;
        const [year, month] = date.split('-');

        return {
            id: filename.slice(0, -5),
            filename,
            election,
            province,
            year: Number(year),
            month: Number(month),
            extra: extra ?? null,
        };
    }

    return {
        id: filename.slice(0, -5),
        filename,
    }

}

export function compareScenarios(a, b) {
    return (a.province == null) - (b.province == null) ||
        (a.province ?? '').localeCompare(b.province ?? '') ||
        (a.year ?? 0) - (b.year ?? 0) ||
        (a.month ?? 0) - (b.month ?? 0) ||
        (a.election ?? '').localeCompare(b.election ?? '') ||
        a.id.localeCompare(b.id);
}

export function validateShallowScenarios(shallowScenarios) {
    const ids = new Set();

    for (const scenario of shallowScenarios) {
        if (ids.has(scenario.id)) {
            throw new Error(`Duplicate scenario ID: ${scenario.id}`);
        }

        ids.add(scenario.id);
    }
    return shallowScenarios
}

export function buildShallowScenarios(lazyLoads) {
    const shallowScenarios = Object.entries(lazyLoads)
        .map(([filename, promise]) => ({
            ...parseScenarioFilename(filename),
            promise,
        }))
        .sort(compareScenarios)

    validateShallowScenarios(shallowScenarios)
    return shallowScenarios
}


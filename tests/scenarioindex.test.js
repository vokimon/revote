import { describe, test, expect } from 'vitest';
import { parseScenarioFilename, compareScenarios } from '../src/scenarioindex.js';

describe('parseScenarioFilename', () => {
    test('invalid pattern returns just id', () => {
        expect(parseScenarioFilename('archivo.yaml'))
            .toEqual({
                id: 'archivo',
            });
    });

    test('extracts metadata from a valid filename', () => {
        expect(parseScenarioFilename('congresoCantabria-2023-07.yaml'))
            .toMatchObject({
                election: 'congreso',
                province: 'Cantabria',
                year: 2023,
                month: 7,
            });
    });

    test('ignores dirs', () => {
        expect(parseScenarioFilename('whatever/path/congresoCantabria-2023-07.yaml'))
            .toMatchObject({
                election: 'congreso',
                province: 'Cantabria',
                year: 2023,
                month: 7,
            });
    });

    test('supports parlament', () => {
        expect(parseScenarioFilename('parlamentCantabria-2023-07.yaml'))
            .toMatchObject({
                election: 'parlament', // this changes
                province: 'Cantabria',
                year: 2023,
                month: 7,
            });
    });

    test('extracts metadata from a valid filename', () => {
        expect(parseScenarioFilename('congresoCantabria-2023.yaml'))
            .toMatchObject({
                election: 'congreso',
                province: 'Cantabria',
                year: 2023,
                month: null,
            });
    });


    const scenario = (overrides = {}) => ({
        id: 'scenario',
        province: 'Cantabria',
        year: 2023,
        month: 7,
        election: 'congreso',
        ...overrides,
    });
});

const scenario = (overrides = {}) => ({
    id: 'scenario',
    province: 'Cantabria',
    year: 2023,
    month: 7,
    election: 'congreso',
    ...overrides,
});

describe('compareScenarios', () => {
    test('sorts by province first', () => {
        expect(compareScenarios(
            scenario({ province: 'Barcelona' }),
            scenario({ province: 'Cantabria' }),
        )).toBeLessThan(0);
    });

    test('sorts by year within the same province', () => {
        expect(compareScenarios(
            scenario({ year: 2022 }),
            scenario({ year: 2023 }),
        )).toBeLessThan(0);
    });

    test('sorts by month within the same year', () => {
        expect(compareScenarios(
            scenario({ month: 6 }),
            scenario({ month: 7 }),
        )).toBeLessThan(0);
    });

    test('sorts missing months before numbered months', () => {
        expect(compareScenarios(
            scenario({ month: null }),
            scenario({ month: 1 }),
        )).toBeLessThan(0);
    });

    test('sorts by election after province, year and month', () => {
        expect(compareScenarios(
            scenario({ election: 'congreso' }),
            scenario({ election: 'europeas' }),
        )).toBeLessThan(0);
    });

    test('uses ID as the final tie-breaker', () => {
        expect(compareScenarios(
            scenario({ id: 'a' }),
            scenario({ id: 'b' }),
        )).toBeLessThan(0);
    });

    test('returns zero for equivalent sort keys', () => {
        expect(compareScenarios(
            scenario(),
            scenario(),
        )).toBe(0);
    });
});

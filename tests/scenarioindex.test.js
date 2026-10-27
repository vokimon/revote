import { test, expect } from 'vitest';
import { parseScenarioFilename } from '../src/scenarioindex.js';

test('extracts metadata from a valid filename', () => {
    expect(parseScenarioFilename('congresoCantabria-2023-07.yaml'))
        .toMatchObject({
            election: 'congreso',
            province: 'Cantabria',
            year: 2023,
            month: 7,
        });
});

test('parseScenarioFilename ignores dirs', () => {
    expect(parseScenarioFilename('whatever/path/congresoCantabria-2023-07.yaml'))
        .toMatchObject({
            election: 'congreso',
            province: 'Cantabria',
            year: 2023,
            month: 7,
        });
});

test('rejects invalid filenames', () => {
    expect(() => parseScenarioFilename('archivo.yaml'))
        .toThrow('Invalid scenario filename');
});

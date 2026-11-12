import { describe, test, expect, vi } from 'vitest';
import pristineData from '../src/data/2023-07-23-Cantabria-congreso.yaml';
import { parseScenarioFilename } from '../src/stockscenarios.js';
import tasks from '../src/tasks.js';

globalThis.window = { location: { hash: '' } };
globalThis.location = globalThis.window.location;
vi.mock('mithril', () => ({
    default: { redraw: () => {} },
}));
const { default: Revote } = await import('../src/revote.js') // Async for the window hack to work

const pristine = structuredClone(pristineData);

function flushLoad() {
	return new Promise(resolve => {
		const unsubscribe = tasks.subscribe(null, () => {
			unsubscribe();
			resolve();
		});
	});
}

function injectShallowScenarios(...scenarioDatas) {
	Revote.scenarios.length = 0;
	for (const scenarioData of scenarioDatas) {
		Revote.scenarios.push({
			...parseScenarioFilename(scenarioData.filename),
			promise: () => scenarioData,
		});
	}
	Revote._scenarioIndex = undefined;
}

async function injectPoll(scenarioData) {
	injectShallowScenarios(scenarioData);
	Revote.scenarioIndex(0);
	await flushLoad();
	return Revote.scenario();
}

async function freshScenario() {
	const scenarioData = structuredClone(pristine);
	scenarioData.filename = '2023-07-23-Cantabria-congreso.yaml';
	scenarioData.candidatures.sort(function(a, b) { return b.votes - a.votes; });
	return injectPoll(scenarioData);
}

function candidatureIndex(poll, id) {
	return poll.candidatures.findIndex(c => c.id === id);
}

function optionIndex(poll, id) {
	return poll.options.findIndex(o => o.id === id);
}
describe("Revote", () =>{

    test('scenario list is available before any data is loaded', () => {
        injectShallowScenarios({ filename: '2023-07-23-Cantabria-congreso.yaml' });
        expect(Revote.scenarios.map(s => s.id)).toEqual(['2023-07-23-Cantabria-congreso']);
        expect(Revote.scenarios[0].data).toBeUndefined();
    });

    test('scenario data loads on demand after selection', async () => {
        injectShallowScenarios({ ...structuredClone(pristine), filename: '2023-07-23-Cantabria-congreso.yaml' });
        Revote.scenarioIndex(0);
        expect(Revote.scenario()).toBeUndefined();
        await flushLoad();
        expect(Revote.scenario()).toBeDefined();
    });

    test('transfer keeps the total of votes and yields the expected seats', async () => {
        const poll = await freshScenario();
        Revote.transfer(poll, candidatureIndex(poll, 'PSOE'), optionIndex(poll, 'SUMAR'), 30000);
        const seats = Object.fromEntries(poll.candidatures.map(c => [c.id, c.dhondtseats]));
        expect(seats).toEqual({
            PP: 2, PSOE: 1, VOX: 1, SUMAR: 1,
            PACMA: 0, FO: 0, PCTE: 0, Recortes0: 0,
        });
        expect(poll.candidatures.reduce((sum, c) => sum + c.votes, 0)).toBe(346888);
    });

    test('threshold stays stable across recomputes after a transfer to abstention', async () => {
        const poll = await freshScenario();
        const pp = candidatureIndex(poll, 'PP');
        const abstention = optionIndex(poll, 'abstention');
        Revote.transfer(poll, pp, abstention, 10000);
        const before = poll.threshold;
        Revote.transfer(poll, pp, abstention, 0);
        expect(poll.threshold).toBe(before);
    });

    test('transfer updates nextPrice', async () => {
        const poll = await freshScenario();
        Revote.transfer(poll, candidatureIndex(poll, 'PSOE'), optionIndex(poll, 'SUMAR'), 30000);
        const expected = Math.max(...poll.candidatures.map(c => c.votes / (c.seats + 1)));
        expect(poll.nextPrice).toBe(expected);
    });

    test('nextPrice ignores votes of candidatures below the threshold', async () => {
        const poll = await injectPoll({
            filename: 'synthetic.yaml',
            seats: 5,
            threshold_percent: 25,
            census: 1200,
            abstention: 0,
            nullvotes: 0,
            blankvotes: 0,
            candidatures: [
                { id: 'winner', votes: 1000, seats: 0 },
                { id: 'belowThreshold', votes: 200, seats: 0 },
            ],
        });
        expect(poll.nextPrice).toBe(1000 / 6);
    });

    test('remainderFactor averages only candidatures above the marginality factor', async () => {
        const poll = await injectPoll({
            filename: 'synthetic.yaml',
            seats: 1,
            threshold_percent: 20,
            census: 310,
            abstention: 0,
            nullvotes: 0,
            blankvotes: 0,
            candidatures: [
                { id: 'winner', votes: 100, seats: 1 }, // Marks the prices
                { id: 'bigChallenger', votes: 75, seats: 0 },
                { id: 'otherChallenger', votes: 75, seats: 0 },
                { id: 'belowThreshold', votes: 40, seats: 0 },
                { id: 'marginal', votes: 29, seats: 0 }, // Excluded for mean
            ],
        });
        expect(poll.remainderFactor).toBe((75 + 75 +  40) / 100 / 4);
    });
});

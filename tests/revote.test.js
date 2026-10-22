import { test, expect, mock } from 'bun:test';

mock.module('mithril', () => ({ redraw: () => {} }));

globalThis.window = { location: { hash: '' } };
globalThis.location = globalThis.window.location;

const Revote = require('../src/revote.js');
const pristine = structuredClone(require('../src/data/congresoCantabria-2023-07.yaml'));

function injectPoll(scenario) {
	Revote.scenarios.length = 0;
	Revote.scenarios.push(scenario);
	Revote._scenarioIndex = undefined;
	return Revote.scenarioIndex(0);
}

function freshScenario() {
	const scenario = structuredClone(pristine);
	scenario.filename = 'congresoCantabria-2023-07.yaml';
	scenario.candidatures.sort(function(a, b) { return b.votes - a.votes; });
	return injectPoll(scenario);
}

function candidatureIndex(poll, id) {
	return poll.candidatures.findIndex(c => c.id === id);
}

function optionIndex(poll, id) {
	return poll.options.findIndex(o => o.id === id);
}

test('transfer keeps the total of votes and yields the expected seats', () => {
	const poll = freshScenario();
	Revote.transfer(poll, candidatureIndex(poll, 'PSOE'), optionIndex(poll, 'SUMAR'), 30000);
	const seats = Object.fromEntries(poll.candidatures.map(c => [c.id, c.dhondtseats]));
	expect(seats).toEqual({
		PP: 2, PSOE: 1, VOX: 1, SUMAR: 1,
		PACMA: 0, FO: 0, PCTE: 0, Recortes0: 0,
	});
	expect(poll.candidatures.reduce((sum, c) => sum + c.votes, 0)).toBe(346888);
});

test('threshold stays stable across recomputes after a transfer to abstention', () => {
	const poll = freshScenario();
	const pp = candidatureIndex(poll, 'PP');
	const abstention = optionIndex(poll, 'abstention');
	Revote.transfer(poll, pp, abstention, 10000);
	const before = poll.threshold;
	Revote.transfer(poll, pp, abstention, 0);
	expect(poll.threshold).toBe(before);
});

test('transfer updates nextPrice', () => {
	const poll = freshScenario();
	Revote.transfer(poll, candidatureIndex(poll, 'PSOE'), optionIndex(poll, 'SUMAR'), 30000);
	const expected = Math.max(...poll.candidatures.map(c => c.votes / (c.seats + 1)));
	expect(poll.nextPrice).toBe(expected);
});

test('nextPrice ignores votes of candidatures below the threshold', () => {
	const poll = injectPoll({
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

'use strict';

var _ = require('./translate');
var d3 = require('d3');

var Revote = {};

Revote._updaters = [];
Revote.notify = function() {
	Revote._updaters.map(function (f) { f(); });
};
Revote.subscribe = function(callback) {
	Revote._updaters.push(callback);
};

var context = require.context('./data/', true, /\.(yaml)$/);
Revote.scenarios = context.keys().map(function(filename) {
	var scenario = context(filename);
	scenario.filename = filename.split('/').pop();
	return scenario;
});
console.log('Scenarios', Revote.scenarios);

Revote._scenarioIndex = undefined;
Revote.scenarioIndex = function(index) {
	if (index===undefined)
		return Revote._scenarioIndex;
	Revote._scenarioIndex=index;
	var poll = Revote.scenarios[index];
	recompute(poll);
	Revote.notify();
	return poll;
};


function hamilton(poll) {
	var votesToCandidatures = poll.participation - poll.nullvotes - poll.blankvotes;
	var ncandidatures = poll.candidatures.length;
	poll.minPrice = (votesToCandidatures + ncandidatures -1)
		/ (poll.seats + ncandidatures -1)
	poll.maxPrice = votesToCandidatures/poll.seats;

	var remainingSeats = poll.seats;
	poll.candidatures.map(function (candidature, i) {
		var fullseats = Math.floor(candidature.votes/poll.maxPrice);
		candidature.fullseats = fullseats;
		candidature.hamiltonseats = fullseats;
		candidature.remainder = candidature.votes % poll.maxPrice * 100 / poll.maxPrice;
		remainingSeats -= fullseats;
	});
	poll.halfSeats = remainingSeats;
	var candidaturesWithRemainders = Object.keys(poll.candidatures)
		.sort(function (a,b) {
			return poll.candidatures[b].remainder - poll.candidatures[a].remainder;
		})
		.slice(0,remainingSeats);
	candidaturesWithRemainders.map(function(v) {
		var c = poll.candidatures[v];
		c.hamiltonseats++;
	});
}
function dHondt(poll) {
	poll.validVotes = poll.participation - poll.nullvotes;
	poll.threshold = poll.validVotes * poll.threshold_percent / 100;
	poll.candidatures.map(function(c) {
		c.dhondtseats=0;
	});
	var quotients = poll.candidatures
		.filter(function(o) {
			// TODO: menor o menor o igual?
			return o.votes >= poll.threshold;
		})
		.map(function(o) {
			return [...Array(poll.seats).keys()].map(function(seats) {
				return {
					candidature: o,
					quotient: o.votes/(seats+1),
				};
			});
		})
		.flat()
		.sort(function(a,b) { return b.quotient-a.quotient; })
		;
	poll.seatPrice = quotients[poll.seats-1].quotient;
	quotients
		.slice(0,poll.seats)
		.map(function(d) {
			d.candidature.dhondtseats++;
		});
}
function generateOptions(poll, shownovote) {
	var options = poll.candidatures.slice();
	poll.candidatures.map(function(c) {
		c.seats=c.dhondtseats;
	});
	if (shownovote) {
		options = options.concat([{
			id: 'abstention',
			name: _("Abstención"),
			votes: poll.abstention,
			nocandidature: true,
		},{
			id: 'blankvotes',
			name: _("Blanco"),
			votes: poll.blankvotes,
			nocandidature: true,
		},{
			id: 'nullvotes',
			name: _("Nulo"),
			votes: poll.nullvotes,
			nocandidature: true,
		}]);
	}
	return options.sort(function(a,b) {a.votes-b.votes;});
}

function recompute(poll) {
	hamilton(poll);
	dHondt(poll);
	poll.candidatures.map(function(c) {
		if (c.dhondtseats !== c.seats)
			console.log("D'hondt seats differ", c.id, c.dhondtseats, c.seats);
	});
	poll.options = generateOptions(poll, true)
	poll.participation = poll.census - poll.abstention;
}


function _optionAttribute(scenario, option) {
	if (scenario.candidatures[option]!==undefined)
		return undefined;
	return scenario.options[option].id;
}

function _decreaseOption(scenario, option, nvotes) {
	// Ensure we are not transferring more than the origin has
	var attribute = _optionAttribute(scenario, option);
	var currentValue = attribute?
		scenario[attribute]:
		scenario.candidatures[option].votes;
	if (nvotes>currentValue)
		nvotes = currentValue;
	console.log("Decreasing", attribute || scenario.candidatures[option].id,
		'by', nvotes);
	if (attribute)
		scenario[attribute] -= nvotes;
	else
		scenario.candidatures[option].votes -= nvotes;
	return nvotes;
}
function _increaseOption(scenario, option, nvotes) {
	var attribute = _optionAttribute(scenario, option);
	console.log("Increasing", attribute || scenario.candidatures[option].id,
		'by', nvotes);
	if (attribute)
		scenario[attribute] += nvotes;
	else
		scenario.candidatures[option].votes += nvotes;
}

Revote.transfer = function(scenario, fromOption, toOption, nvotes) {
	nvotes=parseInt(nvotes);
	if (isNaN(nvotes)) return;
	console.log("From", fromOption, 'to', toOption, 'by', nvotes);
	nvotes = _decreaseOption(scenario, fromOption, nvotes);
	_increaseOption(scenario, toOption, nvotes);
	recompute(scenario);
	Revote.notify();
	m.redraw();
};

var loadFixedColors = function() {
	var colorgroups = require("./colorgroups.yaml");
	var colors = [];
	var options = [];
	Object.keys(colorgroups).map(function(color) {
		colorgroups[color].map(function(option) {
			colors.push(color);
			options.push(option);
		});
	});
	var preallocatedColors = d3.scaleOrdinal(colors);
	var normalColors = d3.scaleOrdinal(d3.schemeCategory10);
	// Preallocate non-votes
	options.map(function(option) {
		preallocatedColors(option);
	});
	Revote.color = function(id) {
		if (options.indexOf(id)!==-1)
			return preallocatedColors(id);
		return normalColors(id);
	};
};

loadFixedColors();

module.exports = Revote;

// vim: noet ts=4 sw=4

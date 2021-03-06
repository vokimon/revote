'use strict';

var m = require('mithril');
var _ = require('./translate');
var d3 = require('d3');

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var Revote = {};

// Subscription interface
Revote._updaters = [];
Revote.notify = function() {
	Revote._updaters.map(function (f) { f(); });
};
Revote.subscribe = function(callback) {
	Revote._updaters.push(callback);
};

// Recompute
function hamilton(poll) {
	var votesToCandidatures = poll.participation - poll.nullvotes - poll.blankvotes - (poll.uncounted||0);
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
	poll.validVotes = poll.participation - poll.nullvotes - (poll.uncounted||0);
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
		.reduce(function(acc, v) { return acc.concat(v) }, [])
		.sort(function(a,b) { return b.quotient-a.quotient; })
		;
	poll.seatPrice = quotients[poll.seats-1].quotient;
	poll.nextPrice = Math.max.apply(null, poll.candidatures
		.map(function(c) { return c.votes/(c.seats+1); })
	);
	poll.remainderFactor = poll.candidatures.reduce(function(res,c) {
		return res + c.votes - poll.seatPrice*c.seats;
	},0)/poll.seatPrice/poll.candidatures.length;
	quotients
		.slice(0,poll.seats)
		.map(function(d) {
			d.candidature.dhondtseats++;
		});
	poll.candidatures.map(function(c) {
		c.dhondtRemainder = c.votes % poll.seatPrice * 100 / poll.seatPrice;
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
			name: _("Abstention"),
			votes: poll.abstention,
			nocandidature: true,
		},{
			id: 'blankvotes',
			name: _("Blank"),
			votes: poll.blankvotes,
			nocandidature: true,
		},{
			id: 'nullvotes',
			name: _("Null"),
			votes: poll.nullvotes,
			nocandidature: true,
		},{
			id: 'uncounted',
			name: _("Uncounted"),
			votes: poll.uncounted || 0,
			nocandidature: true,
		}]);
	}
	return options.sort(function(a,b) {a.votes-b.votes;});
}

function _recompute(poll) {
	hamilton(poll);
	dHondt(poll);
/*
	poll.candidatures.map(function(c) {
		if (c.dhondtseats !== c.seats)
			console.log("D'hondt seats differ", c.id, c.dhondtseats, c.seats);
	});
*/
	poll.options = generateOptions(poll, true)
	poll.participation = poll.census - poll.abstention;
	poll._optionsById = {};
	poll.options.map(function(o) {
		poll._optionsById[o.id]=o;
	});
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
	//console.log("From", fromOption, 'to', toOption, 'by', nvotes);
	nvotes = _decreaseOption(scenario, fromOption, nvotes);
	_increaseOption(scenario, toOption, nvotes);
	_recompute(scenario);
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

Revote.optionById = function(id) {
	return Revote.scenario()._optionsById[id];
};

Revote.shortName = function(option) {
	return option.nocandidature===true?option.name:option.id;
}

Revote.optionDescription = function(i) {
	var poll = Revote.scenario();
	var c = poll.options[i];
	return Revote.shortName(c)
		+ (c.name !== Revote.shortName(c)?
			' (' + c.name + ')':'')
		+ '\n'+ _("Votes")+': ' + votes(c.votes)
		+ (c.seats === undefined ? '' :
			'\n'+_("Seats")+': ' + c.seats 
			+ ' (' + c.fullseats
			+ '+' + (c.seats-c.fullseats)
			+ ')'
			)
		+  (c.seats === undefined ? '' :
			'\n'+_("Hamilton")+': ' + c.hamiltonseats
			+ ' (' + c.fullseats
			+ '+' + (c.hamiltonseats-c.fullseats)
			+ ')'
			)
		+  (c.seats === undefined ? '' :
			'\n'+_("Original remainder")+': ' + percent(c.remainder, 100))
		+  (c.seats === undefined ? '' :
			'\n'+_("D'Hondt remainder")+': ' + percent(c.dhondtRemainder, 100))
		;
};

Revote.seatDescription = function(optionIdx, seat) {
	var poll = Revote.scenario();
	var c = poll.options[optionIdx];
	return Revote.optionDescription(optionIdx)
		+"\n------"
		+(seat<=c.seats?
			_("\nSeat %{n} taken", {n:seat}):
			_("\nSeat %{n} no taken", {n:seat}))
		+(seat<=c.seats && seat<=c.fullseats?
			_("\nFull seat"):'')
		+(seat<=c.seats && seat>c.fullseats?
			_("\nExtra by D'Hondt"):'')
		+(seat<=c.hamiltonseats && seat>c.fullseats?
			_("\nExtra by Hamilton"):'')
		+(c.votes<=poll.threshold && c.votes/seat>=poll.seatPrice?
			_("\nThresholded"):'')
		+(c.nocandidature && c.votes/seat>=poll.seatPrice?
			_("\nNon vote choice"):'')
		+(c.votes/seat===poll.seatPrice?
			_("\nLast seat, fixes D'Hondt price"):'')
		+(c.votes/seat===poll.nextPrice?
			_("\nNext seat that would be taken"):'')
		;
}

// Scenario loading
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
	if (index>=Revote.scenarios.length) index=0;
	if (index<0) index=Revote.scenarios.length-1;
	Revote._scenarioIndex=index;
	var poll = Revote.scenarios[index];
	if (poll===undefined) return;
	_recompute(poll);
	var name = poll.filename.slice(0,-5);
	if (name!==location.hash.slice(1))
		location.hash='#'+name;
	Revote.notify();
	return poll;
};
Revote.scenario = function() {
	return Revote.scenarios[Revote._scenarioIndex];
};

Revote.byName = function(name) {
	var i = Revote.scenarios.findIndex(function(s) {
		return s.filename.slice(0,-5)===name;
	});
	Revote.scenarioIndex(i);
};
function jump() {
	var hash = window.location.hash.substr(1);
	Revote.byName(hash);
	m.redraw();
}
window.onhashchange = jump;

Revote.scenarioIndex(0);
jump();

module.exports = Revote;

// vim: noet ts=4 sw=4

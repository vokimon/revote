'use strict';

var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');

require('@material/typography/dist/mdc.typography.css').default;

var poll = require('./congresoBarcelona-1977-06.yaml')
function hamilton(poll) {
	var remainingSeats = poll.seats;
	var votesToCandidatures = poll.participation - poll.nullvotes - poll.blankvotes;
	var seatPrice = votesToCandidatures/poll.seats;
	poll.candidatures.map(function (candidature, i) {
		var fullseats = Math.floor(candidature.votes/seatPrice);
		candidature.fullseats = fullseats;
		candidature.hamiltonseats = fullseats;
		candidature.remainder = candidature.votes % seatPrice / seatPrice;
		remainingSeats -= fullseats;
	});
	var candidaturesWithRemainders = Object.keys(poll.candidatures).sort(function (a,b) {
		return poll.candidatures[b].remainder - poll.candidatures[a].remainder;
	}).slice(0,remainingSeats);
	candidaturesWithRemainders.map(function(v) {
		var c = poll.candidatures[v];
		c.hamiltonseats++;
	});
}
function generateOptions(poll, shownovote) {
	var options = poll.candidatures.slice();
	if (shownovote) {
		options = options.concat([{
			id: 'abstention',
			name: _("Abstención"),
			votes: poll.abstention,
			nocandidature: true,
		},{
			id: 'blank',
			name: _("En blanco"),
			votes: poll.blank,
			nocandidature: true,
		},{
			id: 'null',
			name: _("Nulos"),
			votes: poll.null,
			nocandidature: true,
		}]);
	}
	return options;
}

function optionDescription(i) {
	var c = poll.options[i];
	return c.id 
		+ ' (' + c.name + ')'
		+ '\nVotes: ' + c.votes
		+ (c.seats === undefined ? '' :
			'\nSeats: ' + c.seats )
		+  (c.seats === undefined ? '' :
			'\nHamilton: ' + c.hamiltonseats )
		+  (c.seats === undefined ? '' :
			'\nFull: ' + c.fullseats )
		+  (c.seats === undefined ? '' :
			'\nRemainder: ' + d3.format('.4f')(c.remainder) )
		;
}

function recompute(poll) {
	hamilton(poll);
	poll.options = generateOptions(poll, true)
}

function _optionAttribute(scenario, option) {
	if (scenario.candidatures[option]!==undefined)
		return undefined;
	return scenario.options[option].id;
}

function decreaseOption(scenario, option, nvotes) {
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
function increaseOption(scenario, option, nvotes) {
	var attribute = _optionAttribute(scenario, option);
	console.log("Increasing", attribute || scenario.candidatures[option].id,
		'by', nvotes);
	if (attribute)
		scenario[attribute] += nvotes;
	else
		scenario.candidatures[option].votes += nvotes;
}

function transfer(scenario, fromOption, toOption, nvotes) {
	console.log("From", fromOption, 'to', toOption, 'by', nvotes);
	nvotes = decreaseOption(scenario, fromOption, nvotes);
	increaseOption(scenario, toOption, nvotes);
	recompute(scenario);
}



recompute(poll);


var skip = function (c) { return []; }

var Hemicycle = {};
Hemicycle.onupdate = function(vn) {
	console.log("Updating");
	this.updateSizes();
};
Hemicycle.oncreate = function(vn) {
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	var bbox = vn.dom.getBoundingClientRect();
	var bbox = {width: 600, height: 300};
	var r = Math.min(bbox.width/2, bbox.height);

	var options = poll.options;
	var pie = d3.pie()
		.startAngle(-Math.PI/2)
		.endAngle(Math.PI/2)
		.value(function (d) {
			return d[vn.attrs.attribute || 'seats'] || 0;
		})
		(options)
		;
	var arcs = d3.arc()
		.innerRadius(r/3)
		.outerRadius(r)
		;

	var chart = d3.select(vn.dom)
		.append('g')
			.attr('transform', 'translate('+bbox.width/2+' '+bbox.height+')')
		;
	chart.append('text')
		.attr('x', 0)
		.attr('y', -20)
		.attr('text-anchor', 'middle')
		.attr('font-weight', 'bold')
		.attr('font-size', '120%')
		.text(vn.attrs.label)
		;

	chart.selectAll('path')
		.data(pie)
		.enter()
		.append('path')
			.classed('sector', true)
			.attr('d', arcs)
			.attr('stroke', 'white')
			.attr('fill', function(d,i) {return color(i);} )
			.each(function(d) {
				this._current = d;
			})
			.on('click', function(d,i) {
				console.log("Selected origin:", options[i].id);
				TransferWidget.from = i;
				d3.event.preventDefault();
				m.redraw();
			})
			.on('contextmenu', function(d,i) {
				console.log("Selected target:", options[i].id);
				TransferWidget.to = i;
				d3.event.preventDefault();
				m.redraw();
			})
		.append('title')
			.text(function(d,i) {
				return optionDescription(i);
			})
		;

	chart.selectAll('text.sectorlabel')
		.data(pie)
		.enter()
		.filter(function(d) {
			return d.endAngle-d.startAngle>1*Math.PI/180;
		})
		.append("text")
		.classed("sectorlabel", true)
		.attr('text-anchor', 'middle')
		.attr("transform", function(d,i) {
			return "translate(" + arcs.centroid(d) + ")";
		})
		.text(function(d,i) { return d.data.id;})
		.style("fill", "#fff")
		;

	this.updateSizes = function() {
		console.log('updateSizes');
		var pie = d3.pie()
			.startAngle(-Math.PI/2)
			.endAngle(Math.PI/2)
			.value(function (d) {
				return d[vn.attrs.attribute || 'seats'] || 0;
			})
			(options)
			;
		chart.selectAll('path.sector')
			.data(pie)
			.transition()
				.duration(1000)
				.attrTween('d', function(d) {
					var interpolator = d3.interpolate(
						this._current, d);
					this._current = interpolator(0);
					return function(t) {
						return arcs(interpolator(t));
					}
				})
		;
		chart.selectAll('text.sectorlabel')
			.data(pie)
			.transition()
				.duration(1000)
				.attr('transform', function(d) {
					return 'translate('+arcs.centroid(d)+')';
				})
		;
	}
};

Hemicycle.view = function(vn) {
	return m('svg.hemicycle', {
		'viewBox': '0 0 600 300',
		'preserveAspectRatio': 'xMidYMid meet'
	});
};

var Table = {};
Table.view = function(vn) {
	return m('.hondttable');
};

var ScenaryChooser = {};
ScenaryChooser.current = 0;
ScenaryChooser.view = function(vn) {
	var options = [
	];
	return m('.scenariochooser', [
		m('', [
			m('h3', _("Scenario")),
			m('select', {
				value: ScenaryChooser.current,
				onchanged: function(ev) {
					ScenaryChooser.current=ev.target.value;
				},
			}, options.map(function(option, i) {
				return m('option', {value: i}, option.name);
			})),
		]),
	]);
};

var TransferWidget = {};
TransferWidget.from = 0;
TransferWidget.to = 1;
TransferWidget.transferStep = 100000;
TransferWidget.view = function(vn) {
	console.log('TransferWidget::view', vn.state);
	return m('.transferwidget', [
		m('', [
			m('h3', _("Transfer among options")),
			m('select#transferfrom', {
				value: TransferWidget.from,
				onchange: function(ev) {
					TransferWidget.from=ev.target.value;
				},
			}, poll.options.map(function(option, i) {
				return m('option', {
					value: i,
					selected: i===vn.state.value
				}, option.name);
			})),
			m('select#transferto', {
				value: TransferWidget.to,
				onchange: function(ev) {
					TransferWidget.to=ev.target.value;
				},
			}, poll.options.map(function(option, i) {
				return m('option', {
					value: i,
					selected: i===vn.state.value
				}, option.name);
			})),
		]),
		m('', [
			m('button', {
				onclick: function(ev) {
					transfer(poll,
						TransferWidget.to,
						TransferWidget.from,
						TransferWidget.transferStep);
				},	
			}, _('<< Transfer')),
			m('input[type=number]', {
				value: TransferWidget.transferStep,
				oninput: function(ev) {
					var newValue = (''+ev.target.value).replace(/[^0-9]/g, '');
					TransferWidget.transferStep = parseInt(newValue);
				},
			}),
			m('button', {
				onclick: function(ev) {
					transfer(poll,
						TransferWidget.from,
						TransferWidget.to,
						TransferWidget.transferStep);
				},	
			}, _('Transfer >>')),
		]),
	]);
};

var App = {
	view: function(vn) {
		return m('.app.mdc-typography', [
			m('.hemicycles', [
				m(ScenaryChooser),
				m(Hemicycle, { attribute: 'votes', shownovote: true, label: _("Opción Electoral")}),
				m(Hemicycle, { attribute: 'votes', label: _("Votos a Candidaturas")}),
				m(Hemicycle, { attribute: 'hamiltonseats', label: _("Reparto Hamilton")}),
				m(Hemicycle, { attribute: 'seats', label: _("Reparto D'Hondt")}),
			]),
			m('.vbox.stretch', [
				m(TransferWidget),
			]),
		]);
	},
};


window.onload = function() {
	var element = document.getElementById("mithril-target");
	m.mount(element, App);
	//traceFocus();
};

// vim: noet ts=4 sw=4

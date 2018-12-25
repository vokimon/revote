'use strict';

var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');

require('@material/typography/dist/mdc.typography.css').default;

var poll = require('./congresoBarcelona-1977-06.yaml')
var transferStep = 10000;
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
		console.log("Adding to ", c.name, c.remainder);
	});
}
function generateOptions(poll, shownovote) {
	var options = poll.candidatures.slice();
	if (shownovote) {
		options = options.concat([{
			id: 'abstention',
			name: _("Abstención"),
			votes: poll.abstention,
		},{
			id: 'blank',
			name: _("En blanco"),
			votes: poll.blank,
		},{
			id: 'null',
			name: _("Nulos"),
			votes: poll.null,
		}]);
	}
	return options;
}

hamilton(poll);


var skip = function (c) { return []; }

var VoteArc = {};
VoteArc.oncreate = function(vn) {
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	var bbox = vn.dom.getBoundingClientRect();
	var bbox = {width: 600, height: 300};
	var r = Math.min(bbox.width/2, bbox.height);

	var options = generateOptions(poll, vn.attrs.shownovote);
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
			.classed('arc', true)
			.attr('d', arcs)
			.attr('stroke', 'white')
			.attr('fill', function(d,i) {return color(i);} )
			.on('click', function(d,i) {
				console.log("Selected origin:", options[i].id);
				TransferWidget.fromCandidature = i;
				d3.event.preventDefault();
				m.redraw();
			})
			.on('contextmenu', function(d,i) {
				console.log("Selected target:", options[i].id);
				TransferWidget.toCandidature = i;
				d3.event.preventDefault();
				m.redraw();
			})
		.append('title')
			.text(function(d,i) {
				var c = options[i];
				return c.id 
					+ ' (' + c.name + ')'
					+ '\nVotes: ' + c.votes
					+ '\nSeats: ' + c.seats
					+ '\nHamilton: ' + c.hamiltonseats
					+ '\nFull: ' + c.fullseats
					+ '\nRemainder: ' + c.remainder
					;
			})
		;

	chart.selectAll('text.sectorlabel')
		.data(pie)
		.enter()
		.filter(function(d) {console.log(d); return d.endAngle-d.startAngle>1*Math.PI/180;})
		.append("text")
		.classed("sectorlabel", true)
		.attr('text-anchor', 'middle')
		.attr("transform", function(d,i) { return "translate(" + arcs.centroid(d) + ")"; })
		.text(function(d,i) { console.log(d.data.id); return d.data.id;})
		.style("fill", "#fff")
		;
};

VoteArc.view = function(vn) {
	return m('svg.votingarc', {
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
				value: ScenaryChooser.fromCandidature,
				onchanged: function(ev) {
					ScenaryChooser.fromCandidature=ev.target.value;
				},
			}, options.map(function(option, i) {
				return m('option', {value: i}, option.name);
			})),
		]),
	]);
};

var TransferWidget = {};
TransferWidget.fromCandidature=0;
TransferWidget.toCandidature=1;
TransferWidget.view = function(vn) {
	var opcions = generateOptions(poll, true);
	return m('.transferwidget', [
		m('', [
			m('h3', _("Transfer among options")),
			m('select', {
				value: TransferWidget.fromCandidature,
				onchanged: function(ev) {
					TransferWidget.fromCandidature=ev.target.value;
				},
			}, opcions.map(function(option, i) {
				return m('option', {value: i}, option.name);
			})),
			m('select', {
				value: TransferWidget.toCandidature,
				onchanged: function(ev) {
					TransferWidget.toCandidature=ev.target.value;
				},
			}, opcions.map(function(option, i) {
				return m('option', {value: i}, option.name);
			})),
		]),
		m('', [
			m('input[type=number]', {
				value: transferStep,
				oninput: function(ev) {
					var newValue = (''+ev.target.value).replace(/[^0-9]/g, '');
					transferStep = parseInt(newValue);
				},
			}),
			m('button', {
				onclick: function(ev) {
					// Ensure we are not transferring more than the origin has
					console.log("From", TransferWidget.fromCandidature, 'to', TransferWidget.toCandidature);
					var nTransferred = Math.min(transferStep,
						poll.candidatures[TransferWidget.fromCandidature].votes);
					poll.candidatures[TransferWidget.fromCandidature].votes -= nTransferred;
					poll.candidatures[TransferWidget.toCandidature].votes += nTransferred;
					m.redraw();
				},	
			}, _('Transfer')),
		]),
	]);
};

var App = {
	view: function(vn) {
		return m('.app.mdc-typography', [
			m('.votingarcs', [
				m(ScenaryChooser),
				m(VoteArc, { attribute: 'votes', shownovote: true, label: _("Opción Electoral")}),
				m(VoteArc, { attribute: 'votes', label: _("Votos a Candidaturas")}),
				m(VoteArc, { attribute: 'hamiltonseats', label: _("Reparto Hamilton")}),
				m(VoteArc, { attribute: 'seats', label: _("Reparto D'Hondt")}),
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

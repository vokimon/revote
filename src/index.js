'use strict';

var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');

require('@material/typography/dist/mdc.typography.css').default;

var poll = require('./congresoBarcelona-1977-06.yaml')
var transferStep = 10000;
var fromCandidature = 0;
var toCandidature = 1;
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
			name: 'abstention',
			votes: poll.abstention,
		},{
			id: 'blank',
			name: 'blank',
			votes: poll.blank,
		},{
			id: 'null',
			name: 'null',
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
		.data(pie(options.map(function(d) {
			return d[vn.attrs.attribute || 'seats'] || 0;
		})))
		.enter()
		.append('path')
			.attr('d', arcs)
			.attr('stroke', 'white')
			.attr('fill', function(d,i) {return color(i);} )
			.on('click', function(d,i) {
				console.log("Selected origin:", options[i].id);
				fromCandidature = i;
				m.redraw();
				d3.event.preventDefault();
			})
			.on('contextmenu', function(d,i) {
				console.log("Selected target:", options[i].id);
				toCandidature = i;
				m.redraw();
				d3.event.preventDefault();
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

var TransferWidget = {};
TransferWidget.view = function(vn) {
	var opcions = generateOptions(poll, true);
	return m('.transferwidget', [
		m('', [
			m('select', {
				value: fromCandidature,
				onchanged: function(ev) {
					fromCandidature=ev.target.value;
				},
			}, opcions.map(function(option, i) {
				return m('option', {value: i}, option.name);
			})),
			m('select', {
				value: toCandidature,
				onchanged: function(ev) {
					toCandidature=ev.target.value;
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
					var toTransfer = Math.min(
						transferStep, poll.candidatures[fromCandidature]).votes;
					poll.candidatures[fromCandidature].votes -= toTransfer;
					poll.candidatures[toCandidature].votes += toTransfer;
					hamilton(poll);
					console.log(poll);
					m.redraw();
				},	
			}, _('Transfer')),
		]),
	]);
};

var Examples = {
	view: function(vn) {
		return m('.app.mdc-typography', [
			m('.votingarcs', [
				m(VoteArc, { attribute: 'votes', shownovote: true, label: _("Opción Electoral")}),
				m(VoteArc, { attribute: 'votes', label: _("Votos a Candidaturas")}),
				m(VoteArc, { attribute: 'hamiltonseats', label: _("Reparto Hamilton")}),
				m(VoteArc, { attribute: 'seats', label: _("Reparto D'Hondt")}),
			]),
			m('.vbox', [
				m(TransferWidget),
				m('', 'Hola'),
			]),
		]);
	},
};


window.onload = function() {
	var element = document.getElementById("mithril-target");
	m.mount(element, Examples);
	//traceFocus();
};

// vim: noet ts=4 sw=4

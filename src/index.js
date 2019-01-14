'use strict';

var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');
var Select = require('./mdc/select');
var TextField = require('./mdc/textfield');
var Layout = require('./mdc/layout');
var Button = require('./mdc/button');
var Revote = require('./revote.js');
var Hemicycle = require('./hemicycle.js');
var DHondtPriceBar = require('./dhondtpricebar.js');
var TabBar = require('./mdc/tabbar.js');
var marked = require('marked');
require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};


var skip = function (c) { return []; }

var DHondtTable = {};
DHondtTable.view = function(vn) {
	var poll = Revote.scenario();
	const ndivisors = Math.max.apply(null, poll.options
		.filter(function(v) { return v.seats!==undefined; })
		.map(function(v) { return v.seats; })
		) + 3;
	const nextPrice = Math.max.apply(null, poll.candidatures
		.map(function(c) { return c.votes/(c.seats+1); })
	);
	return m('.dhondttable', m('table', [
		m('tr', m('td'), [
			[...Array(ndivisors).keys()].map(function(i) {
				if (i===0) return m('td');
				return m('th', i);
			}),
		]),
		poll.options.map(function(option, optionIdx) {
			return m('tr', {
					title: Revote.optionDescription(optionIdx),
						onclick: function(ev) {
							TransferWidget.from=optionIdx;
						},
						oncontextmenu: function(ev) {
							TransferWidget.to=optionIdx;
							ev.preventDefault();
						},
				}, m('td.selection', [
					(TransferWidget.from===optionIdx?"A":""),
					(TransferWidget.to===optionIdx?"B":""),
				]) , [
				[...Array(ndivisors).keys()].map(function(i) {
					if (i===0)
						return m('th.candidature', {
							style: { background: Revote.color(option.id) },
						}, option.id);
					return m('td'
						+(i<=option.seats? '.taken':'')
						+(i>option.fullseats? '.extra':'')
						+(i<=option.hamiltonseats && i>option.fullseats? '.hamiltonextra':'')
						+(option.votes<=poll.threshold?'.under':'')
						+(option.nocandidature?'.under':'')
						+(option.votes<=poll.threshold && option.votes/i>=poll.seatPrice?'.thresholded':'')
						+(option.nocandidature && option.votes/i>=poll.seatPrice?'.thresholded':'')
						+(option.votes/i===poll.seatPrice?'.last':'')
						+(option.votes/i===nextPrice?'.last':'')
						, votes(option.votes/i));
				}),
			]);
		}),
			
	]));
};

var ScenaryChooser = {};
ScenaryChooser.view = function(vn) {
	var options = Revote.scenarios.map(function(scenario,i) {
		return {
			text: scenario.name,
			value: i,
		};
	});
	var poll = Revote.scenario();
	return m('.scenariochooser', [
		m(Select, {
			id: 'scenariochooser',
			label: _("Scenario"),
			nohelp: true,
			required: true,
			value: Revote.scenarioIndex(),
			onchange: function(ev) {
				Revote.scenarioIndex(ev.target.value);
			},
			options: options,
		}),
	]);
};

var TransferWidget = {};
TransferWidget.from = 0;
TransferWidget.to = 1;
TransferWidget.transferStep = 10000;
TransferWidget.view = function(vn) {
	var poll = Revote.scenario();
	return m('.transferwidget', [
		m(Select, {
			id: 'transferfrom',
			label: _("Option A"),
			nohelp: true,
			value: TransferWidget.from,
			onchange: function(ev) {
				TransferWidget.from=ev.target.value;
			},
			required: true,
			options: poll.options.map(function(option, i) {
				return {
					value: i,
					selected: i===TransferWidget.from,
					text: option.nocandidature===true?option.name:option.id,
				};
			})
		}),
		m('.transferbuttons', [
		m(Button, {
			raised: true,
			title: _("Transfer from B to A"),
			faicon: 'arrow-left',
			onclick: function(ev) {
				Revote.transfer(poll,
					TransferWidget.to,
					TransferWidget.from,
					TransferWidget.transferStep);
			},
		}),
		m('', {style: {'max-width': '8em'}},
		m(TextField, {
			type: 'number',
			label: _("Votes to transfer"),
			nohelp: true,
			step: 100,
			value: TransferWidget.transferStep,
			oninput: function(ev) {
				if (ev.target.value === undefined) {
					ev.target.value = TransferWidget.transferStep;
					return false;
				}
				var newValue = (''+ev.target.value).replace(/[^0-9]/g, '');
				TransferWidget.transferStep = newValue;
			},
		})),
		m(Button, {
			raised: true,
			title: _("Transfer from A to B"),
			faicon: 'arrow-right',
			onclick: function(ev) {
				Revote.transfer(poll,
					TransferWidget.from,
					TransferWidget.to,
					TransferWidget.transferStep);
			},
		}),,
		]),
		m(Select, {
			required: true,
			id: 'transferto',
			label: _('Option B'),
			nohelp: true,
			value: TransferWidget.to,
			onchange: function(ev) {
				TransferWidget.to=ev.target.value;
			},
			options: poll.options.map(function(option, i) {
				return {
					value: i,
					selected: i===TransferWidget.to,
					text: option.nocandidature===true?option.name:option.id,
				};
			}),
		}),
	]);
};

var Info = {};
Info.view = function(vn) {
	var poll = Revote.scenario();
	var seatNext = Math.max.apply(null, poll.candidatures
		.filter(function(c) { return c.seats!==0; })
		.map(function(c) { return c.votes/(c.seats+1); })
	);

	return m('.info', [{
			label: _("Seats"),
			value: poll.seats,
		},{
			label: _("Census"),
			value: votes(poll.census),
		},{
			label: _("Participation"),
			value: votes(poll.participation)+
				" ("+percent(poll.participation,poll.census)+")",
		},{
			label: _("Abstention"),
			value: votes(poll.abstention)+
				" ("+percent(poll.abstention, poll.census)+")",
		},{
			label: _("Null"),
			value: votes(poll.nullvotes)+
				" ("+percent(poll.nullvotes, poll.census)+")",
		},{
			label: _("Blank"),
			value: votes(poll.blankvotes)+
				" ("+percent(poll.blankvotes, poll.census)+")",
		},{
			label: _("Threshold"),
			value: percent(poll.threshold_percent,100)+
				" ("+votes(poll.threshold)+")",
		},{
			label: _("Max price"),
			value: votes(poll.maxPrice)+
				" ("+percent(poll.maxPrice, poll.validVotes)+")",
		},{
			label: _("Seat price"),
			value: votes(poll.seatPrice)+
				" ("+percent(poll.seatPrice, poll.validVotes)+ " of valid)",
		},{
			label: _("Next price"),
			value: votes(seatNext)+
				" ("+percent(seatNext, poll.validVotes)+")",
		},{
			label: _("Min price"),
			value: votes(poll.minPrice)+
				" ("+percent(poll.minPrice, poll.validVotes)+")",
		},{
			label: _("Half Seats"),
			value: votes(poll.halfSeats),
		}].map(function(v, i) {
			return m('', [
				m('b', v.label, ":"),
				m.trust('&nbsp'),
				v.value
			]);
		})
	);
};


var Description = {};
Description.view = function(vn) {
	return m(".scenariodescription",
		m.trust(marked(
			Revote.scenario().description|| _("## No description")
		))
	);
};

var App = {
	currentView: 0,
	view: function(vn) {
		function selectOrigin(optionIdx) {
			TransferWidget.from=optionIdx;
		};
		function selectTarget(optionIdx) {
			TransferWidget.to=optionIdx;
		};
		return m('.app.mdc-typography', [
			m('.topbar', [
				m('h1',_("reVote: Simulador de flujos electorales")),
			]),
			m(ScenaryChooser),
			m('.appbody', [
				m('.hemicycles', [
					m(Hemicycle, { attribute: 'votes', shownovote: true, label: _("Opción Electoral"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'votes', label: _("Votos a Candidaturas"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'hamiltonseats', label: _("Reparto Hamilton"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'seats', label: _("Reparto D'Hondt"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
				]),
				m('.leftpane', [
					//m('h3', _("Information")),
					m(Info),
					//m('h3', _("Transfers")),
					m(TabBar, {
						index: App.currentView,
						onactivated: function(ev) {
							App.currentView=ev.detail.index;
						},
						align: 'expand',
						tabs: [{
							id: 'dhondtbars',
							text: _("D'Hondt price"),
							faicon: 'chart-bar',
						},{
							id: 'dhondtquotients',
							text: _("D'Hondt Quotients"),
							faicon: 'divide',
						},{
							id: 'description',
							text: _("Description"),
							icon: 'info',
						}],
					}),
					App.currentView===0? m(DHondtPriceBar, {
						optionA: TransferWidget.from,
						optionB: TransferWidget.to,
						onoptionclicked: function(optionIdx) {
							TransferWidget.from=optionIdx;
						},
						onoptioncontext: function(optionIdx) {
							TransferWidget.to=optionIdx;
						},
					}):
					App.currentView===1 ? m(DHondtTable):
					App.currentView===2 ? m(Description):
					m(''),
					m(TransferWidget),
				]),
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

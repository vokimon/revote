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
var TabBar = require('./mdc/tabbar.js');
var marked = require('marked');
require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var poll = Revote.scenario();

var skip = function (c) { return []; }

var DHondtTable = {};
DHondtTable.view = function(vn) {
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
	return m('.scenariochooser', [
		m(Select, {
			id: 'scenariochooser',
			label: _("Scenario"),
			nohelp: true,
			required: true,
			value: Revote.scenarioIndex(),
			onchange: function(ev) {
				poll = Revote.scenarioIndex(ev.target.value);
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

const DHondtPriceBar = {};
DHondtPriceBar.view = function(vn) {
	var width = vn.dom?vn.dom.scrollWidth:500;
	var height = vn.dom?vn.dom.scrollHeight:400;
	var parentWidth = vn.dom?vn.dom.getParent().scrollWidth:400;
	return m('.dhondtbars',m('svg', {
		width: parentWidth,
		height: this.margin.top + this.margin.bottom + this.barwidth*poll.options.length,
		//height: parentHeight,
		//'viewBox': '0 0 '+width+' '+height,
		//'preserveAspectRatio': 'xMidYMid meet'
	}));
};
DHondtPriceBar.oninit = function(vn) {
	// TODO: left should be computed from axis width
	this.margin = { left: 70, top: 48, bottom: 24, right: 24 };
	this.barwidth = 24;
	Revote.subscribe(function() {
		vn.state.updateData && vn.state.updateData();
	})
	window.addEventListener('resize', function() {
		console.log("onresize");
		vn.state.updateData && vn.state.updateData();
	});
};
DHondtPriceBar.onupdate = function(vn) {
	console.log("updating");
	this.updateData();
};
DHondtPriceBar.oncreate = function(vn) {
	var bbox = vn.dom.getBoundingClientRect();
	var margin = this.margin;
	var height = vn.dom.scrollHeight - margin.top - margin.bottom;
	var width = vn.dom.scrollWidth - margin.left -margin.right;

	var svg = d3.select(vn.dom).select('svg');

	var maxSeats = Math.max.apply(null, poll.candidatures
		.map(function(c) { return c.seats; })
	);
	var shownVotes = poll.census/2;

	var chart = svg.append('g')
		.attr('class', 'chart')
		.attr('transform', 'translate('+margin.left+' '+margin.top+')')
		;

	var optionsScale = d3.scaleBand()
		.range([0, height])
		.domain(poll.options
			//.sort(function(a,b) {return b.votes-a.votes;})
			.map(function(o) {return o.id;})
			)
		;
	var optionAxis = d3.axisLeft()
		.scale(optionsScale);
	chart.append('g')
		.attr('class', 'y axis')
		.call(optionAxis)
		;

	var voteScale = d3.scaleLinear()
		.range([0, width])
		.domain([0,shownVotes])
		;
	var voteAxis = d3.axisBottom()
		.scale(voteScale)
		;
	chart.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,'+height+')')
		.call(voteAxis)
		;

	chart.append('g')
		.attr('class', 'bars');

	var seatScale = d3.scaleLinear()
		.range([0,width])
		.domain([0,shownVotes/poll.seatPrice])
		;
    var seatGrid = d3.axisTop()
        .scale(seatScale)
		.tickValues(d3.range(1,maxSeats+3,1))
        .tickSize(-height, 0, 0)
        ;
    chart.append("g")
        .attr("class", "grid seats")
        .attr("transform", "translate(0,0)")
		.attr('stroke', 'green')
        .call(seatGrid)
        ;

	var votesGrid = d3.axisTop()
		.scale(voteScale)
		.tickSize(-height-margin.top/2, 0, 0)
		;
	chart.append("g")
		.attr("class", "grid votes")
        .attr("transform", "translate(0," + -margin.top/2 + ")")
        .call(votesGrid)
		;

	var thresholdLine = chart.append('line')
		.attr('class', 'threshold')
		.attr('y1',0)
		.attr('y2',height)
		.attr('x1',voteScale(poll.threshold))
		.attr('x2',voteScale(poll.threshold))
		;
	var thresholdLabel = chart.append('g')
		.attr('class', 'label threshold')
		.attr('transform','translate('+voteScale(poll.threshold)+' '+(3*height/4)+') ')
		;
	thresholdLabel
		.append('text')
		.attr('class', 'shadow')
		.attr('dx', 10)
		.attr('dy', 0)
		.text(_("Threshold: ")+votes(poll.threshold))
		;
	thresholdLabel
		.append('text')
		.attr('dx', 10)
		.text(_("Threshold: ")+votes(poll.threshold))
		;

	thresholdLabel
		.append('circle')
		.attr('cx', 0)
		.attr('cy', 20)
		.attr('r', 2)
		;
	thresholdLabel
		.append('line')
		.attr('x1', 0)
		.attr('x2', 30)
		.attr('y1', 20)
		.attr('y2', 5)
		;

	var priceLabel = chart.append('g')
		.attr('class', 'label price')
		.attr('transform','translate('+voteScale(poll.seatPrice)+' '+(height/2)+')')
		;
	priceLabel
		.append('text')
		.attr('class', 'shadow')
		.text(_("Seat price: ")+votes(poll.seatPrice))
		.attr('dx', 10)
		;
	priceLabel
		.append('text')
		.text(_("Seat price: ")+votes(poll.seatPrice))
		.attr('dx', 10)
		;
	priceLabel
		.append('circle')
		.attr('cx', 0)
		.attr('cy', 20)
		.attr('r', 2)
		;
	priceLabel
		.append('line')
		.attr('x1', 0)
		.attr('x2', 30)
		.attr('y1', 20)
		.attr('y2', 5)
		;
		

	this.updateData=function() {
		var width = vn.dom.scrollWidth - margin.left -margin.right;
		var height = vn.dom.scrollHeight - margin.top - margin.bottom;
		var shownVotes = poll.census/2;
		var maxSeats = Math.max.apply(null, poll.candidatures
			.map(function(c) { return c.seats; })
		);

		voteScale
			.domain([0,shownVotes])
			.range([0, width])
			;
		seatScale
			.domain([0,shownVotes/poll.seatPrice])
			.range([0,width])
			;
		optionsScale
			.range([0, height])
			.domain(poll.options
				//.sort(function(a,b) {return b.votes-a.votes;})
				.map(function(o) {return o.id;})
			)
			;
		thresholdLine.transition()
			.attr('y2',height)
			.attr('x1',voteScale(poll.threshold))
			.attr('x2',voteScale(poll.threshold))
			;
		seatGrid
			.tickValues(d3.range(1,shownVotes/poll.seatPrice,1))
			.tickSize(-height, 0, 0);
		chart.select('.grid.seats')
			.transition()
				.call(seatGrid)
			;
		votesGrid
			.tickSize(-height-margin.top/2, 0, 0);
		chart.select('.grid.votes')
			.transition()
				.call(votesGrid)
			;
		chart.select('.x.axis')
			.transition()
			.attr('transform', 'translate(0,'+height+')')
			.call(voteAxis)
			;
		chart.select('.y.axis')
			.transition()
				.call(optionAxis)
			;

		function fullbar(bar) {
			bar
				.attr('y', (s) => optionsScale(s.id))
				.attr('height', optionsScale.bandwidth())
				.attr('x', (s) => voteScale(0))
				.attr('width', (s) => voteScale(s.seats===undefined?0:s.seats*poll.seatPrice))
				.attr('fill', (s) => Revote.color(s.id))
			;
			return bar;
		}
		function remainderbar(bar) {
			bar
				.attr('y', (s) => optionsScale(s.id)+1)
				.attr('height', optionsScale.bandwidth()-2)
				.attr('x', (s) => voteScale(s.seats!==undefined?s.seats*poll.seatPrice:0))
				.attr('width', (s) => voteScale(s.votes-(s.seats!==undefined?s.seats*poll.seatPrice:0)))
				.attr('fill', (s) => Revote.color(s.id))
				.attr('fill-opacity', 0.4)
				.attr('stroke', (s) => Revote.color(s.id))
				.attr('stroke-width', 2)
			;
			return bar;
		}
		function barevents(bar) {
			bar
				.on('click', function(d,i) {
					console.log("Selected origin:", poll.options[i].id);
					vn.attrs.onoptionclicked &&
						vn.attrs.onoptionclicked(i);
					d3.event.preventDefault();
					m.redraw();
				})
				.on('contextmenu', function(d,i) {
					console.log("Selected target:", poll.options[i].id);
					vn.attrs.onoptioncontext &&
						vn.attrs.onoptioncontext(i);
					d3.event.preventDefault();
					m.redraw();
				})
			;
			return bar;
		}
	
		var fullbars = chart.select('.bars')
			.selectAll('.fullbar')
			.data(poll.options)
			;
		fullbars
			.transition()
			.call(fullbar)
			;
		fullbars
			.enter()
			.append("rect")
				.attr('class','fullbar')
				.call(fullbar)
				.call(barevents)
			.exit().remove()
			;
		var reminders = chart.select('.bars')
			.selectAll('.remainderbar')
			.data(poll.options)
			;
		reminders
			.transition()
			.call(remainderbar)
			;
		reminders
			.enter()
			.append("rect")
				.attr('class','remainderbar')
				.call(remainderbar)
				.call(barevents)
			;
		reminders.exit().remove();

		thresholdLabel
			.transition()
			.attr('transform','translate('+voteScale(poll.threshold)+' '+(3*height/4)+') ')
			.selectAll('text')
				.text(_("Threshold: ")+votes(poll.threshold))
			;

		priceLabel
			.transition()
			.attr('transform','translate('+voteScale(poll.seatPrice)+' '+(height/2)+')')
			.selectAll('text')
				.text(_("Seat price: ")+votes(poll.seatPrice))
			;
	};
	this.updateData();
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
		return m('.app.mdc-typography', [
			m('.topbar', [
				m('h1',_("reVote: Simulador de flujos electorales")),
			]),
			m(ScenaryChooser),
			m('.appbody', [
				m('.hemicycles', [
					m(Hemicycle, { attribute: 'votes', shownovote: true, label: _("Opción Electoral")}),
					m(Hemicycle, { attribute: 'votes', label: _("Votos a Candidaturas")}),
					m(Hemicycle, { attribute: 'hamiltonseats', label: _("Reparto Hamilton")}),
					m(Hemicycle, { attribute: 'seats', label: _("Reparto D'Hondt")}),
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

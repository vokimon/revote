'use strict';

var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');
var Select = require('./mdc/select');
var TextField = require('./mdc/textfield');
var Layout = require('./mdc/layout');
var Button = require('./mdc/button');

require('@material/typography/dist/mdc.typography.css').default;

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

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
function dHondt(poll) {
	var validVotes = poll.participation - poll.nullvotes;
	var threshold = validVotes * poll.threshold_percent / 100;
	poll.candidatures.map(function(c) {
		c.dhondtseats=0;
	});
	var dividends = poll.candidatures
		.filter(function(o) {
			// TODO: menor o menor o igual?
			return o.votes >= threshold;
		})
		.map(function(o) {
			return [...Array(poll.seats).keys()].map(function(seats) {
				return {
					candidature: o,
					dividend: o.votes/(seats+1),
				};
			});
		})
		.flat()
		.sort(function(a,b) { return b.dividend-a.dividend; })
		;
	dividends
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
	dHondt(poll);
	poll.options = generateOptions(poll, true)
	poll.participation = poll.census - poll.abstention;
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

var updaters = [];

function transfer(scenario, fromOption, toOption, nvotes) {
	nvotes=parseInt(nvotes);
	if (isNaN(nvotes)) return;
	console.log("From", fromOption, 'to', toOption, 'by', nvotes);
	nvotes = decreaseOption(scenario, fromOption, nvotes);
	increaseOption(scenario, toOption, nvotes);
	recompute(scenario);
	updaters.map(function (f) { f(); });
	m.redraw();
}


recompute(poll);


var skip = function (c) { return []; }

var Hemicycle = {};
Hemicycle.color = d3.scaleOrdinal(d3.schemeSet3);
Hemicycle.color = d3.scaleOrdinal([].concat(
	['#000000','#aaaaaa','#f0f0f0'],
	d3.schemeCategory10,
	d3.schemeCategory10
));
// Preallocate non-votes
Hemicycle.color('abstention');
Hemicycle.color('nullvotes');
Hemicycle.color('blankvotes');
Hemicycle.view = function(vn) {
	return m('svg.hemicycle', {
		'viewBox': '0 0 600 300',
		'preserveAspectRatio': 'xMidYMid meet'
	});
};
Hemicycle.oninit = function(vn) {
	updaters.push(function() {
		vn.state.updateSizes && vn.state.updateSizes();
	})
};
Hemicycle.onupdate = function(vn) {
	//console.log("Updating");
};
Hemicycle.oncreate = function(vn) {
	//console.log("Creating");
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

	vn.state.chart = d3.select(vn.dom)
		.append('g')
			.attr('transform', 'translate('+bbox.width/2+' '+bbox.height+')')
		;
	vn.state.chart.append('text')
		.attr('x', 0)
		.attr('y', -20)
		.attr('text-anchor', 'middle')
		.attr('font-weight', 'bold')
		.attr('font-size', '120%')
		.text(vn.attrs.label)
		;

	this.updateSizes = function() {
		console.log('updateSizes', vn.attrs.label);
		var options = poll.options;
		var pie = d3.pie()
			.startAngle(-Math.PI/2)
			.endAngle(Math.PI/2)
			.value(function (d) {
				if (!vn.attrs.shownovote && d.nocandidature)
					return 0;
				return d[vn.attrs.attribute || 'seats'] || 0;
			})
			(options)
			;
		var sectors = vn.state.chart.selectAll('path.sector').data(pie);
		sectors.select('title')
			.text(function(d,i) {
				return optionDescription(i);
			})
			;
		sectors
			//.each(function(d) { console.log('updating:', d.data.id); })
			.transition()
				.duration(1000)
				.attr('d', arcs)
			;
		sectors
			.enter()
			//.each(function(d) { console.log('adding:', d.data.id); })
			.append('path')
				.classed('sector', true)
				.attr('d', arcs)
				.attr('stroke', 'white')
				.attr('fill', function(d,i) {return Hemicycle.color(d.data.id);} )
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
		sectors.exit()
			//.each(function(d) { console.log('removing:', d.data.id); })
			.remove();

		var labels = vn.state.chart.selectAll('text.sectorlabel').data(pie);

		function placeLabel(sectorlabel, d) {
			sectorlabel
				.attr('transform', function(d) {
					return 'translate('+arcs.centroid(d)+')';
				})
				.attr('visibility', function(d,i) {
					return d.endAngle-d.startAngle<2*Math.PI/180?'hidden':'';
				})
				.text(function(d,i) {
					return (
						d.data.nocandidature===true?d.data.name:d.data.id)+
						"\n"+percent((d.endAngle-d.startAngle),Math.PI);
				})
			;
		}
		labels.select('title')
			.text(function(d,i) {
				return optionDescription(i);
			})
			;
		labels
			.transition()
				.duration(1000)
				.call(placeLabel)
			;
		labels.enter()
			.append("text")
				.attr("class", 'sectorlabel')
				.attr('text-anchor', 'middle')
				.call(placeLabel)
				.attr("fill", "white")
				.attr("stroke", "#777")
				.attr('font-weight', 'bold')
				.attr('font-size', '160%')
			.append('title')
				.text(function(d,i) {
					return optionDescription(i);
				})
			;
		labels.exit().remove();
	}
	this.updateSizes();

};

var DHondtTable = {};
DHondtTable.view = function(vn) {
	const ndivisors = Math.max.apply(null, poll.options
		.filter(function(v) { return v.seats!==undefined; })
		.map(function(v) { return v.seats; })
		) + 3;
	const seatPrice = Math.min.apply(null, poll.candidatures
		.filter(function(c) { return c.seats!==0; })
		.map(function(c) { return c.votes/c.seats; })
	);
	const nextPrice = Math.max.apply(null, poll.candidatures
		.map(function(c) { return c.votes/(c.seats+1); })
	);
	const validVotes = poll.participation - poll.nullvotes;
	const threshold = validVotes*poll.threshold_percent/100;
	return m('.dhondttable', m('table', [
		m('tr', m('td'), [
			[...Array(ndivisors).keys()].map(function(i) {
				if (i===0) return m('td');
				return m('th', i);
			}),
		]),
		poll.options.map(function(option, optionIdx) {
			return m('tr', {
					title: optionDescription(optionIdx),
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
							style: { background: Hemicycle.color(option.id) },
						}, option.id);
					return m('td'
						+(i<=option.seats? '.taken':'')
						+(option.votes<=threshold?'.under':'')
						+(option.nocandidature?'.under':'')
						+(option.votes<=threshold && option.votes/i>=seatPrice?'.thresholded':'')
						+(option.nocandidature && option.votes/i>=seatPrice?'.thresholded':'')
						+(option.votes/i===seatPrice?'.last':'')
						+(option.votes/i===nextPrice?'.last':'')
						, votes(option.votes/i));
				}),
			]);
		}),
			
	]));
};

var ScenaryChooser = {};
ScenaryChooser.current = 0;
ScenaryChooser.view = function(vn) {
	var scenarios = [{
			text: poll.name,
			value: 0,
	}];
	return m('.scenariochooser', [
		m(Select, {
			id: 'scenariochooser',
			label: _("Scenario"),
			nohelp: true,
			value: ScenaryChooser.current,
			onchanged: function(ev) {
				ScenaryChooser.current=ev.target.value;
			},
			options: scenarios,
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
			onclick: function(ev) {
				transfer(poll,
					TransferWidget.to,
					TransferWidget.from,
					TransferWidget.transferStep);
			},
		}, _('🡄')),
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
			onclick: function(ev) {
				transfer(poll,
					TransferWidget.from,
					TransferWidget.to,
					TransferWidget.transferStep);
			},
		}, _('🡆')),,
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
	var seatPrice = Math.min.apply(null, poll.candidatures
		.filter(function(c) { return c.seats!==0; })
		.map(function(c) { return c.votes/c.seats; })
	);

	var seatNext = Math.max.apply(null, poll.candidatures
		.filter(function(c) { return c.seats!==0; })
		.map(function(c) { return c.votes/(c.seats+1); })
	);

	var candidatureVotes = poll.participation-poll.nullvotes-poll.blankvotes;
	var validVotes = poll.participation-poll.nullvotes;

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
				" ("+votes(poll.threshold_percent*(validVotes)/100)+")",
		},{
			label: _("Max price"),
			value: votes(candidatureVotes/poll.seats)+
				" ("+percent(candidatureVotes/poll.seats, validVotes)+")",
		},{
			label: _("Min price"),
			value: votes(candidatureVotes/(poll.seats+poll.candidatures.length))+
				" ("+percent(candidatureVotes/(poll.seats+poll.candidatures.length), validVotes)+")",
		},{
			label: _("Seat price"),
			value: votes(seatPrice)+
				" ("+percent(seatPrice, validVotes)+ " of valid)",
		},{
			label: _("Next price"),
			value: votes(seatNext)+
				" ("+percent(seatNext, poll.participation-poll.nullvotes)+")",
		},{
			label: _("Factor"),
			value: percent((validVotes/seatPrice-poll.seats)/poll.candidatures.length,1),
		}]
			.map(function(v, i) {
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
	var parentHeight = vn.dom?vn.dom.getParent().scrollHeight:500;
	var parentWidth = vn.dom?vn.dom.getParent().scrollWidth:400;
	console.log("parentHeight",parentHeight);
	return m('.dhondtbars',m('svg', {
		height: parentHeight,
		width: parentWidth,
		//'viewBox': '0 0 '+width+' '+height,
		//'preserveAspectRatio': 'xMidYMid meet'
	}));
};
DHondtPriceBar.oninit = function(vn) {
	updaters.push(function() {
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
	// TODO: left should be computed from axis width
	var margin = { left: 70, top: 48, bottom: 24, right: 24 };
	var height = vn.dom.scrollHeight - margin.top - margin.bottom;
	var width = vn.dom.scrollWidth - margin.left -margin.right;

	var svg = d3.select(vn.dom).select('svg');

	var seatPrice = Math.min.apply(null, poll.candidatures
		.filter(function(c) { return c.seats!==0; })
		.map(function(c) { return c.votes/c.seats; })
	);
	var maxSeats = Math.max.apply(null, poll.candidatures
		.map(function(c) { return c.seats; })
	);

	var chart = svg.append('g')
		.attr('class', 'chart')
		.attr('transform', 'translate('+margin.left+' '+margin.top+')')
		;

	var optionsScale = d3.scaleBand()
		.range([0, height])
		.domain(poll.options.map(function(o) {return o.id;}))
		;
	var optionAxis = d3.axisLeft()
		.scale(optionsScale);
	chart.append('g')
		.attr('class', 'y axis')
		.call(optionAxis)
		;

	var voteScale = d3.scaleLinear()
		.range([0, width])
		.domain([0,seatPrice*(maxSeats+3)])
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
		.domain([0,maxSeats+3])
		;
    var seatGrid = d3.axisTop()
        .scale(seatScale)
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

	var validVotes = poll.participation - poll.nullvotes;
	var threshold = validVotes * poll.threshold_percent / 100;
	var thresholdLine = chart.append('line')
		.attr('class', 'threshold')
		.attr('y1',0)
		.attr('y2',height)
		.attr('x1',voteScale(threshold))
		.attr('x2',voteScale(threshold))
		;
	var thresholdLabel = chart.append('g')
		.attr('class', 'label threshold')
		.attr('transform','translate('+voteScale(threshold)+' '+(3*height/4)+') ')
		;
	thresholdLabel
		.append('text')
		.text(_("Threshold: ")+votes(threshold))
		.attr('dx', 10)
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
		.attr('transform','translate('+voteScale(seatPrice)+' '+(height/2)+')')
		;
	priceLabel
		.append('text')
		.text(_("Seat price: ")+votes(seatPrice))
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
		var validVotes = poll.participation - poll.nullvotes;
		var threshold = validVotes * poll.threshold_percent / 100;
		var seatPrice = Math.min.apply(null, poll.candidatures
			.filter(function(c) { return c.seats!==0; })
			.map(function(c) { return c.votes/c.seats; })
		);

		voteScale
			.range([0, width])
			;
		seatScale
			.domain([0,maxSeats+3])
			.range([0,voteScale(seatPrice*(maxSeats+3))])
			;
		optionsScale
			.range([0, height])
			;
		thresholdLine.transition()
			.attr('y2',height)
			.attr('x1',voteScale(threshold))
			.attr('x2',voteScale(threshold))
			;
		seatGrid
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
				.attr('width', (s) => voteScale(s.seats===undefined?0:s.seats*seatPrice))
				.attr('fill', (s) => Hemicycle.color(s.id))
			;
		}
		function remainderbar(bar) {
			bar
				.attr('y', (s) => optionsScale(s.id)+1)
				.attr('height', optionsScale.bandwidth()-2)
				.attr('x', (s) => voteScale(s.seats!==undefined?s.seats*seatPrice:0))
				.attr('width', (s) => voteScale(s.votes-(s.seats!==undefined?s.seats*seatPrice:0)))
				.attr('fill', (s) => Hemicycle.color(s.id))
				.attr('fill-opacity', 0.4)
				.attr('stroke', (s) => Hemicycle.color(s.id))
				.attr('stroke-width', 2)
			;
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
			;
		thresholdLabel
			.transition()
			.attr('transform','translate('+voteScale(threshold)+' '+(3*height/4)+') ')
			.select('text')
				.text(_("Threshold: ")+votes(threshold))
			;

		priceLabel
			.transition()
			.attr('transform','translate('+voteScale(seatPrice)+' '+(height/2)+')')
			.select('text')
				.text(_("Seat price: ")+votes(seatPrice))
			;
	};
	this.updateData();
};


var App = {
	view: function(vn) {
		return m('.app.mdc-typography', [
			m('.topbar', [
				m('h1',_("reVote: Simulador de flujos electorales")),
			]),
			m(ScenaryChooser),
			m('.appbody', [
				m('.hemicycles', [
					m('h3', _("Transfers")),
					m(TransferWidget),
					m(Hemicycle, { attribute: 'votes', shownovote: true, label: _("Opción Electoral")}),
					m(Hemicycle, { attribute: 'votes', label: _("Votos a Candidaturas")}),
					m(Hemicycle, { attribute: 'hamiltonseats', label: _("Reparto Hamilton")}),
					m(Hemicycle, { attribute: 'seats', label: _("Reparto D'Hondt")}),
				]),
				m('.leftpane', [
					m('h3', _("Information")),
					m(Info),
					m(DHondtTable),
					m(DHondtPriceBar),
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

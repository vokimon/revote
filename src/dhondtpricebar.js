'use strict';

var m = require('mithril');
var _ = require('./translate');
var d3 = require('d3');
var Revote = require('./revote.js');

var thresholdLabelOffset = 200;
var priceLabelOffset = 250;

var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

const DHondtPriceBar = {};
DHondtPriceBar.view = function(vn) {
	var poll = Revote.scenario();
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
		//console.log("onresize");
		vn.state.updateData && vn.state.updateData();
	});
};
DHondtPriceBar.onupdate = function(vn) {
	//console.log("updating");
	this.updateData();
};
DHondtPriceBar.oncreate = function(vn) {
	var poll = Revote.scenario();
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
		.scale(optionsScale)
		.tickFormat(function(optionId) {
			var option = Revote.optionById(optionId);
			return Revote.shortName(option);
		})
		;
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

	function voteLabel(cssclass, label, yoffset, nvotes) {
		var group = chart.append('g')
			.attr('class', 'label '+cssclass)
			.attr('transform','translate('
				+voteScale(nvotes)+' '
				+yoffset+') ')
		group
			.append('text')
			.attr('class', 'shadow')
			.attr('dx', 10)
			.attr('dy', 0)
			.text(label+votes(nvotes))
			;
		group
			.append('text')
			.attr('dx', 10)
			.text(_("Threshold: ")+votes(nvotes))
			;
		group
			.append('circle')
			.attr('cx', 0)
			.attr('cy', 20)
			.attr('r', 2)
			;
		group
			.append('line')
			.attr('x1', 0)
			.attr('x2', 30)
			.attr('y1', 20)
			.attr('y2', 5)
			;
		
		group.update = function(newnvotes) {
			group
				.transition()
				.attr('transform','translate('+voteScale(newnvotes)+' '+yoffset+') ')
				.selectAll('text')
					.text(label+votes(newnvotes))
				;
		}
		return group;
	}
	var thresholdLabel = voteLabel('threshold', _("Threshold: "), thresholdLabelOffset, poll.threshold);
	var priceLabel = voteLabel('price', _("Seat price: "), priceLabelOffset, poll.seatPrice);

	this.updateData=function() {
		var poll = Revote.scenario();

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
					//console.log("Selected origin:", poll.options[i].id);
					vn.attrs.onoptionclicked &&
						vn.attrs.onoptionclicked(i);
					d3.event.preventDefault();
					m.redraw();
				})
				.on('contextmenu', function(d,i) {
					//console.log("Selected target:", poll.options[i].id);
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

		thresholdLabel.update(poll.threshold);
		priceLabel.update(poll.seatPrice);
	};
	this.updateData();
};

module.exports = DHondtPriceBar;

// vim: noet ts=4 sw=4

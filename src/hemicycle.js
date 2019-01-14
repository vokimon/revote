'use strict';

var m = require('mithril');
var _ = require('./translate');
var d3 = require('d3');
var Revote = require('./revote.js');

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var Hemicycle = {};
Hemicycle.view = function(vn) {
	return m('svg.hemicycle', {
		'viewBox': '0 0 600 300',
		'preserveAspectRatio': 'xMidYMid meet'
	});
};
Hemicycle.oninit = function(vn) {
	Revote.subscribe(function() {
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

	var options = Revote.scenario().options;
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
		//console.log('updateSizes', vn.attrs.label);
		var options = Revote.scenario().options;
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
		function selectOrigin(d,i) {
			if (!vn.attrs.onoptionclicked) return
			vn.attrs.onoptionclicked(i);
			d3.event.preventDefault();
			m.redraw();
		}
		function selectTarget(d,i) {
			if (!vn.attrs.onoptioncontext) return
			vn.attrs.onoptioncontext(i);
			d3.event.preventDefault();
			m.redraw();
		}
		var sectors = vn.state.chart.selectAll('path.sector').data(pie);
		sectors.select('title')
			.text(function(d,i) {
				return Revote.optionDescription(i);
			})
			;
		sectors
			//.each(function(d) { console.log('updating:', d.data.id); })
			.transition()
				.duration(1000)
				.attr('d', arcs)
				.attr('fill', function(d,i) {
					var color = Revote.color(d.data.id);
					if (d.data.id === 'abstention')
					console.log(d.data.id, color);
					return color;
				})
			;
		sectors
			.enter()
			//.each(function(d) { console.log('adding:', d.data.id); })
			.append('path')
				.classed('sector', true)
				.attr('d', arcs)
				.attr('stroke', 'white')
				.attr('fill', function(d,i) {
					var color = Revote.color(d.data.id);
					if (d.data.id === 'abstention')
					console.log(d.data.id, color);
					return color;
				})
				.each(function(d) {
					this._current = d;
				})
				.on('click', selectOrigin)
				.on('contextmenu', selectTarget)
			.append('title')
				.text(function(d,i) {
					return Revote.optionDescription(i);
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
				return Revote.optionDescription(i);
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
					return Revote.optionDescription(i);
				})
			;
		labels.exit().remove();
	}
	this.updateSizes();

};

module.exports = Hemicycle;

// vim: noet ts=4 sw=4

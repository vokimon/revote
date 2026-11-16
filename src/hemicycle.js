'use strict';

import m from 'mithril';
import _ from './translate';
import * as d3 from 'd3';
import Revote from './revote.js';

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var Hemicycle = {};

function getProps(vn) {
	return {
		...vn.attrs,
		options: Revote.scenario()?.options ?? []
	};
}

Hemicycle.view = function(vn) {
	return m('.hemicycle');
};
Hemicycle.oninit = function(vn) {
	vn.state.update = function() {
		var props = getProps(vn);
		if (!props.options.length) return // Transient
		vn.state.hemicycle?.update(props);
	}
	vn.state.unsubscribe = Revote.subscribe(vn.state.update);
};
Hemicycle.onupdate = function(vn) {
	vn.state.update()
};
Hemicycle.oncreate = function(vn) {
	var props = getProps(vn);
	vn.state.hemicycle = new HemicycleD3(vn.dom, props);
};
Hemicycle.onremove = function(vn) {
	vn.state.unsubscribe?.();
	vn.state.hemicycle?.destroy();
	vn.state.hemicycle = null;
}

class HemicycleD3 {
	constructor(element, props) {
		const WIDTH = 600;
		const HEIGHT = 300;
		const INNER_RADIUS_RATIO = 1/3;
		const LABEL_OFFSET_X = 0;
		const LABEL_OFFSET_Y = -20;

		var bbox = {width: WIDTH, height: HEIGHT};
		var r = Math.min(bbox.width/2, bbox.height);
		this.svg = d3.select(element)
			.append('svg')
				.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
				.attr('preserveAspectRatio', 'xMidYMid meet')
			;
		this.chart = this.svg
			.append('g')
				.attr('transform', 'translate('+bbox.width/2+' '+bbox.height+')')
			;
		this.arcs = d3.arc()
			.innerRadius(r*INNER_RADIUS_RATIO)
			.outerRadius(r)
			;
		this.chart.append('text')
			.attr('x', LABEL_OFFSET_X)
			.attr('y', LABEL_OFFSET_Y)
			.attr('text-anchor', 'middle')
			.attr('font-weight', 'bold')
			.attr('font-size', '120%')
			.text(props.label)
			;
		this.update(props)
	}

	update(props) {
		//console.log('updateSizes', props.label);
		const TRANSITION_DURATION = 1000;
		const MIN_LABEL_ANGLE = 2 * Math.PI / 180;
		var options = props.options;
		var arcs = this.arcs
		var pie = d3.pie()
			.startAngle(-Math.PI/2)
			.endAngle(Math.PI/2)
			.value(function (d) {
				if (!props.shownovote && d.nocandidature)
					return 0;
				return d[props.attribute || 'seats'] || 0;
			})
			(options)
			;
		function selectOrigin(d,i) {
			if (!props.onoptionclicked) return
			props.onoptionclicked(i);
			d3.event.preventDefault();
		}
		function selectTarget(d,i) {
			if (!props.onoptioncontext) return
			props.onoptioncontext(i);
			d3.event.preventDefault();
		}
		var sectors = this.chart.selectAll('path.sector').data(pie);
		sectors
			.on('click', selectOrigin)
			.on('contextmenu', selectTarget)
			;
		sectors.select('title')
			.text(function(d,i) {
				return Revote.optionDescription(i);
			})
			;
		sectors
			//.each(function(d) { console.log('updating:', d.data.id); })
			.transition()
				.duration(TRANSITION_DURATION)
				.attr('d', arcs)
				.attr('fill', function(d,i) {
					return Revote.color(d.data.id);
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
					return Revote.color(d.data.id);
				})
				.each(function(d) {
					this._current = d;
				})
			.append('title')
				.text(function(d,i) {
					return Revote.optionDescription(i);
				})
			;
		sectors.exit()
			//.each(function(d) { console.log('removing:', d.data.id); })
			.remove();

		var labels = this.chart.selectAll('text.sectorlabel').data(pie);

		function placeLabel(sectorlabel, d) {
			sectorlabel
				.attr('transform', function(d) {
					return 'translate('+arcs.centroid(d)+')';
				})
				.attr('visibility', function(d,i) {
					return d.endAngle-d.startAngle<MIN_LABEL_ANGLE?'hidden':'';
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
				.duration(TRANSITION_DURATION)
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

	destroy() {
		this.svg.interrupt();
		this.svg.remove();
	}
}

export default Hemicycle;

// vim: noet ts=4 sw=4

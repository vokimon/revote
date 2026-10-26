'use strict';
import m from 'mithril';
import _ from './translate';
import css from './style.styl';
import * as d3 from 'd3';

import 'font-awesome/css/font-awesome.css';
import '@material/typography/dist/mdc.typography.css';

var traceFocus = require('./debughelpers').traceFocus;

var skip = function (c) { return []; }

var VoteArc = {};
VoteArc.oncreate = function(vn) {
	var arc = d3.svg.arc()
		.innerRadius(50)
		.outterRadius(150)
		;
	d3.select(vn.dom).append('path')
		.attr('d', arc);
};
VoteArc.view = function(vn) {
	return m('svg.d3expan');
};

var Examples = {
	view: function(vn) {
		return m('.app.mdc-typography', [
			m(VoteArc.Example),
		]);
	},
};


window.onload = function() {
	var element = document.getElementById("mithril-target");
	m.mount(element, Examples);
	//traceFocus();
};
// vim: noet ts=4 sw=4

'use strict';
var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var d3 = require('d3');

require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;

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

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
var DHondtQuotients = require('./dhondtquotients.js');
var TabBar = require('./mdc/tabbar.js');
var marked = require('marked');
var ScenaryChooser = require('./scenarychooser');
require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var skip = function (c) { return []; }

var App = {
	currentView: 0,
	view: function(vn) {
		return m('.app.mdc-typography', [
			m(ScenaryChooser),
			m('.appbody', [
				m('.leftpane', [
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

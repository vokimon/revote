'use strict';

require('./i18n-setup');
import m from 'mithril';
import _ from './translate';
import css from './style.styl';
import * as d3 from 'd3';
import Select from './mdc/select';
import TextField from './mdc/textfield';
import Layout from './mdc/layout';
import Button from './mdc/button';
import Revote from './revote.js';
require('./scenarios');
import Hemicycle from './hemicycle.js';
import DHondtPriceBar from './dhondtpricebar.js';
import DHondtQuotients from './dhondtquotients.js';
import TabBar from './mdc/tabbar.js';
import marked from 'marked';
import ScenaryChooser from './scenarychooser';
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

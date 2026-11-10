'use strict';

import './i18n-setup';
import m from 'mithril';
import _ from './translate';
import './style.styl';
import * as d3 from 'd3';
import Revote from './revote.js';
import './stockscenarios-setup';
import PoolInfo from './poolinfo'
import Hemicycle from './hemicycle';
import DHondtPriceBar from './dhondtpricebar';
import DHondtQuotients from './dhondtquotients';
import ScenaryChooser from './scenarychooser';
import TransferWidget from './transferwidget';
import TabBar from './mdc/tabbar';
import { marked } from 'marked';
import 'font-awesome/css/font-awesome.css';
import '@material/typography/dist/mdc.typography.css';

var votes = function(v) { return v===undefined ? "-" : d3.format(',.0f')(v).replace(/,/gi,'.');};
var skip = function (c) { return []; }

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
				m('h1',_("reVote"),m('span.subtitle',
					": "+_("Electoral flux simulator"))),
			]),
			m(ScenaryChooser),
			m('.appbody', [
				m('.hemicycles', [
					m(Hemicycle, { attribute: 'votes', shownovote: true, label: _("Electoral Choice"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'votes', label: _("Just Candidatures"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'hamiltonseats', label: _("Hamilton Method"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
					m(Hemicycle, { attribute: 'seats', label: _("D'Hondt Method"),
						onoptionclicked: selectOrigin,
						onoptioncontext: selectTarget,
					}),
				]),
				m('.leftpane', [
					//m('h3', _("Information")),
					m(PoolInfo),
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
					App.currentView===1 ? m(DHondtQuotients, {
						optionA: TransferWidget.from,
						optionB: TransferWidget.to,
						onoptionclicked: function(optionIdx) {
							TransferWidget.from=optionIdx;
						},
						onoptioncontext: function(optionIdx) {
							TransferWidget.to=optionIdx;
						},
					}):
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

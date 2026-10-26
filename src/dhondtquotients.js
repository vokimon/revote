'use strict';

import m from 'mithril';
import _ from './translate';
import './style.styl';
import * as d3 from 'd3';
import Select from './mdc/select';
import TextField from './mdc/textfield';
import Layout from './mdc/layout';
import Button from './mdc/button';
import Revote from './revote.js';
import Hemicycle from './hemicycle.js';
import DHondtPriceBar from './dhondtpricebar.js';
import TabBar from './mdc/tabbar.js';
import 'font-awesome/css/font-awesome.css';
import '@material/typography/dist/mdc.typography.css';

var percent = function(some, all) { return d3.format('.2%')(some/all);};
var votes = function(v) { return d3.format(',.0f')(v).replace(/,/gi,'.');};

var DHondtQuotients = {};
DHondtQuotients.view = function(vn) {
	var poll = Revote.scenario();
	const ndivisors = Math.max.apply(null, poll.options
		.filter(function(v) { return v.seats!==undefined; })
		.map(function(v) { return v.seats; })
		) + 3;
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
						if (!vn.attrs.onoptionclicked) return;
						vn.attrs.onoptionclicked(optionIdx);
					},
					oncontextmenu: function(ev) {
						if (!vn.attrs.onoptioncontext) return;
						vn.attrs.onoptioncontext(optionIdx);
						ev.preventDefault();
					},
				}, m('td.selection', [
					(vn.attrs.optionA===optionIdx?"A":""),
					(vn.attrs.optionB===optionIdx?"B":""),
				]) , [
				[...Array(ndivisors).keys()].map(function(seat) {
					if (seat===0)
						return m('th.candidature', {
							style: { background: Revote.color(option.id) },
						}, Revote.shortName(option));
					return m('td'
						+(seat<=option.seats? '.taken':'')
						+(seat>option.fullseats? '.extra':'')
						+(seat<=option.hamiltonseats && seat>option.fullseats? '.hamiltonextra':'')
						+(option.votes<=poll.threshold?'.under':'')
						+(option.nocandidature?'.under':'')
						+(option.votes<=poll.threshold && option.votes/seat>=poll.seatPrice?'.thresholded':'')
						+(option.nocandidature && option.votes/seat>=poll.seatPrice?'.thresholded':'')
						+(option.votes/seat===poll.seatPrice?'.last':'')
						+(option.votes/seat===poll.nextPrice?'.last':'')
						, {
							title: Revote.seatDescription(optionIdx,seat),
						}, votes(option.votes/seat));
				}),
			]);
		}),
			
	]));
};

export default DHondtQuotients;

// vim: noet ts=4 sw=4

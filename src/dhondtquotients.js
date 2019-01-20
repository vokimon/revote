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
var TabBar = require('./mdc/tabbar.js');
var marked = require('marked');
require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;

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
				[...Array(ndivisors).keys()].map(function(i) {
					if (i===0)
						return m('th.candidature', {
							style: { background: Revote.color(option.id) },
						}, option.id);
					return m('td'
						+(i<=option.seats? '.taken':'')
						+(i>option.fullseats? '.extra':'')
						+(i<=option.hamiltonseats && i>option.fullseats? '.hamiltonextra':'')
						+(option.votes<=poll.threshold?'.under':'')
						+(option.nocandidature?'.under':'')
						+(option.votes<=poll.threshold && option.votes/i>=poll.seatPrice?'.thresholded':'')
						+(option.nocandidature && option.votes/i>=poll.seatPrice?'.thresholded':'')
						+(option.votes/i===poll.seatPrice?'.last':'')
						+(option.votes/i===poll.nextPrice?'.last':'')
						, votes(option.votes/i));
				}),
			]);
		}),
			
	]));
};

module.exports=DHondtQuotients;

// vim: noet ts=4 sw=4

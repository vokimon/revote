'use strict';

import m from 'mithril';
import _ from './translate';
import * as d3 from 'd3';
import Revote from './revote.js';

var percent = function(some, all) { return some===undefined ? '-%' : d3.format('.2%')(some/all);};
var votes = function(v) { return v===undefined ? "-" : d3.format(',.0f')(v).replace(/,/gi,'.');};
var votes_n_percent = function(some, all) {
	return votes(some)+ " (" + percent(some, all) + ")"
}

var PoolInfo = {};
PoolInfo.view = function(vn) {
	var poll = Revote.scenario();

	return m('.info', [{
			label: _("Seats"),
			value: votes(poll?.seats),
		},{
			label: _("Census"),
			value: votes(poll?.census),
		},{
			label: _("Participation"),
			value: votes_n_percent(poll?.participation, poll?.census),
		},{
			label: _("Abstention"),
			value: votes_n_percent(poll?.abstention, poll?.census),
		},{
			label: _("Null"),
			value: votes_n_percent(poll?.nullvotes, poll?.census),
		},{
			label: _("Blank"),
			value: votes_n_percent(poll?.blankvotes, poll?.census),
		},{
			label: _("Threshold"),
			value: percent(poll?.threshold_percent,100)+
				" ("+votes(poll?.threshold)+")",
		},{
			label: _("Max price"),
			value: votes_n_percent(poll?.maxPrice, poll?.validVotes),
		},{
			label: _("Seat price"),
			value: votes_n_percent(poll?.seatPrice, poll?.validVotes),
		},{
			label: _("Next price"),
			value: votes_n_percent(poll?.nextPrice, poll?.validVotes),
		},{
			label: _("Min price"),
			value: votes_n_percent(poll?.minPrice, poll?.validVotes),
		},{
			label: _("Half Seats"),
			value: votes(poll?.halfSeats),
		},{
			label: _("Remainder Factor"),
			value: percent(poll?.remainderFactor,1),
		}].map(function(v, i) {
			return m('', [
				m('b', v.label, ":"),
				m.trust('&nbsp'),
				v.value
			]);
		})
	);
};

export default PoolInfo

// vim: noet ts=4 sw=4

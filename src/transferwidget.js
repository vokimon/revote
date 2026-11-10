'use strict';

import m from 'mithril';
import _ from './translate';
import * as d3 from 'd3';
import Select from './mdc/select';
import TextField from './mdc/textfield';
import Button from './mdc/button';
import Revote from './revote.js';
import 'font-awesome/css/font-awesome.css';
import '@material/typography/dist/mdc.typography.css';

var votes = function(v) { return v===undefined ? "-" : d3.format(',.0f')(v).replace(/,/gi,'.');};
var skip = function (c) { return []; }

var TransferWidget = {};
TransferWidget.from = 0;
TransferWidget.to = 1;
TransferWidget.transferStep = 10000;
TransferWidget.view = function(vn) {
	var poll = Revote.scenario();
	return m('.transferwidget', [
		m(Select, {
			id: 'transferfrom',
			label: _("Option A"),
			nohelp: true,
			value: TransferWidget.from,
			onchange: function(ev) {
				TransferWidget.from=Number(ev.target.value);
			},
			required: true,
			options: poll?.options?.map(function(option, i) {
				return {
					value: i,
					selected: i===TransferWidget.from,
					text: option.nocandidature===true?option.name:option.id,
				};
			}) ?? []
		}),
		m('.transferbuttons', [
		m(Button, {
			raised: true,
			title: _("Transfer from B to A"),
			faicon: 'arrow-left',
			onclick: function(ev) {
				Revote.transfer(poll,
					TransferWidget.to,
					TransferWidget.from,
					TransferWidget.transferStep);
			},
		}),
		m('', {style: {'max-width': '8em'}},
		m(TextField, {
			type: 'number',
			label: _("Votes to transfer"),
			nohelp: true,
			step: 100,
			value: TransferWidget.transferStep,
			oninput: function(ev) {
				if (ev.target.value === undefined) {
					ev.target.value = TransferWidget.transferStep;
					return false;
				}
				var newValue = (''+ev.target.value).replace(/[^0-9]/g, '');
				TransferWidget.transferStep = newValue;
			},
		})),
		m(Button, {
			raised: true,
			title: _("Transfer from A to B"),
			faicon: 'arrow-right',
			onclick: function(ev) {
					Revote.transfer(poll,
						TransferWidget.from,
						TransferWidget.to,
						TransferWidget.transferStep);
			},
		}),
		]),
		m(Select, {
			required: true,
			id: 'transferto',
			label: _('Option B'),
			nohelp: true,
			value: TransferWidget.to,
			onchange: function(ev) {
				TransferWidget.to=Number(ev.target.value);
			},
			options: poll?.options.map(function(option, i) {
				return {
					value: i,
					selected: i===TransferWidget.to,
					text: option.nocandidature===true?option.name:option.id,
				};
			}),
		}),
	]);
};

export default TransferWidget

// vim: noet ts=4 sw=4


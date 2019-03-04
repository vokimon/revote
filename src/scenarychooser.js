'use strict';

var m = require('mithril');
var _ = require('./translate');
var Select = require('./mdc/select');
var Button = require('./mdc/button');
var Revote = require('./revote.js');
var marked = require('marked');

var ScenaryChooser = {};
ScenaryChooser.view = function(vn) {
	var options = Revote.scenarios.map(function(scenario,i) {
		return {
			text: scenario.name,
			value: i,
		};
	});
	var poll = Revote.scenario();
	return m('.scenariochooser', [
		m(Select, {
			id: 'scenariochooser',
			label: _("Scenario"),
			nohelp: true,
			required: true,
			value: Revote.scenarioIndex(),
			onchange: function(ev) {
				Revote.scenarioIndex(ev.target.value);
			},
			options: options,
		}),
		m(Button, {
			raised: true,
			title: _("Previous scenario on the list"),
			onclick: function() {
				Revote.scenarioIndex(Revote.scenarioIndex()-1);
			},
		}, '<'),
		m(Button, {
			raised: true,
			title: _("Next scenario on the list"),
			onclick: function() {
				Revote.scenarioIndex(Revote.scenarioIndex()+1);
			},
		}, '>'),
	]);
};

module.exports = ScenaryChooser;

// vim: noet ts=4 sw=4

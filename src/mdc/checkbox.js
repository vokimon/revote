'use strict';
/** @module */
var m = require('mithril');
var _ = require('../translate');
var MDCCheckbox = require('@material/checkbox');
var MDCFormField = require('@material/form-field');
require('@material/checkbox/dist/mdc.checkbox.css');
require('@material/form-field/dist/mdc.form-field.css');

/**
@namespace Checkbox
@description Material Design Checkbox wrapped as Mithril component
@property {string} id - Required id in order to work properly
@property {string} label - The label shown aside the checkbox
@property {bool|undefined} checked - Whether is checked or not
@property {} * - Any extra attribute is passed to the native checkbox.
	Notably `name`, `onchange`, `disabled`...
*/
var Checkbox = {
	oncreate: function(vn) {
		var mdccheckbox = vn.dom.querySelector('.mdc-checkbox');
		this.native = vn.dom.querySelector('.mdc-checkbox__native-control');
		this.mdcinstance = new MDCCheckbox.MDCCheckbox(mdccheckbox);
		const formField = new MDCFormField.MDCFormField(vn.dom);
		formField.input = this.mdcinstance;
		if (vn.attrs.checked === undefined) {
			this.native.indeterminate = true;
		}
	},
	onupdate: function(vn) {
		if (vn.attrs.checked === undefined) {
			this.native.indeterminate = true;
		}
	},
	view: function(vn) {
		const help_id = vn.attrs.id+'_help';
		return m('.mdc-form-field', [
			m('.mdc-checkbox' +
				(vn.attrs.disabled?'.mdc-checkbox--disabled':'')+
			'', [
				m('input[type=checkbox]'+
					'.mdc-checkbox__native-control'+
					'', vn.attrs),
				m('.mdc-checkbox__background', [
					m('svg.mdc-checkbox__checkmark', {
						viewBox: '0 0 24 24',
					}, [
						m('path.mdc-checkbox__checkmark-path', {
							fill: 'none',
							d: 'M1.73,12.91 8.1,19.28 22.79,4.59',
						}),
					]),
					m('.mdc-checkbox__mixedmark')
				]),
			]),
			m('label', { for: vn.attrs.id }, vn.attrs.label),
		]);
	},
};


var Example = {
	model: {
		apples: true,
		pears: false,
		tomatoes: undefined,
	},
	view: function(vn) {
		var self = this;
		const Layout = require('./layout');
		return m(Layout, [
			m(Layout.Row, m(Layout.Cell, {span:12},
				m('h2', 'Checkboxes'))),
			m(Layout.Row,[
				m(Layout.Cell,{span:3}, [
					m(Checkbox, {
						id: 'applesv',
						label: _('I like apples'),
						checked: self.model.apples,
						disabled: true,
						onchange: function(ev) {
							vn.state.model.apples = ev.target.checked;
						},
					}),
					m(Checkbox, {
						id: 'pearsv',
						label: _('I like pears, mellons, pineapples, grapes, strawberries...'),
						checked: self.model.pears,
						onchange: function(ev) {
							vn.state.model.pears = ev.target.checked;
						},
					}),
					m(Checkbox, {
						id: 'tomatoesv',
						label: _('I like tomatoes'),
						checked: self.model.tomatoes,
						onchange: function(ev) {
							vn.state.model.tomatoes = ev.target.checked;
						},
					})
				]),
				m(Layout.Cell,{span:3},
					m(Checkbox, {
						id: 'apples',
						label: _('I like apples'),
						checked: self.model.apples,
						onchange: function(ev) {
							vn.state.model.apples = ev.target.checked;
						},
					}),
				),
				m(Layout.Cell,{span:3},
					m(Checkbox, {
						id: 'pears',
						label: _('I like pears, mellons, pineapples, grapes, strawberries...'),
						checked: self.model.pears,
						onchange: function(ev) {
							vn.state.model.pears = ev.target.checked;
						},
					})
				),
				m(Layout.Cell,{span:3},
					m(Checkbox, {
						id: 'tomatoes',
						label: _('I like tomatoes'),
						checked: self.model.tomatoes,
						onchange: function(ev) {
							vn.state.model.tomatoes = ev.target.checked;
						},
					})
				),
			]),
			m(Layout.Row, m(Layout.Cell, {span:12},
				m('pre', JSON.stringify(this.model, null, 2))
			)),
		]);
	},
};

Checkbox.Example = Example;

module.exports=Checkbox

// vim: noet ts=4 sw=4

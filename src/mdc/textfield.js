'use strict';
var m = require('mithril');
var _ = require('../translate');
var MDCTextField = require('@material/textfield');
require('@material/textfield/dist/mdc.textfield.css');

var TextField = {
	oncreate: function(vn) {
		var mdcinput = vn.dom.querySelector('.mdc-text-field');
		this.mdcinstance = new MDCTextField.MDCTextField(mdcinput);
		var errormessage = vn.attrs.errormessage || vn.state.errormessage || '';
		vn.state.mdcinstance.valid = !errormessage;
		vn.state.native = vn.dom.querySelector('.mdc-text-field__input');
		vn.state.native.setCustomValidity(errormessage);
	},

	onupdate: function(vn) {
		var errormessage = vn.attrs.errormessage || vn.state.errormessage || '';
		var valid = !errormessage;
		if (vn.state.mdcinstance.valid !== !errormessage) {
			vn.state.mdcinstance.valid = !errormessage;
		}
		vn.state.native = vn.dom.querySelector('.mdc-text-field__input');
		vn.state.native.setCustomValidity(errormessage);
	},

	view: function (vn) {
		function floats() {
			if (vn.attrs.value) return true;
			if (!vn.dom) return false;
			if (!vn.dom.native) return false;
			if (!vn.dom.native===document.activeElement) return true;
			if (!vn.dom.native.value) return true;
			return false;
		}
		var attrs = Object.assign({}, vn.attrs);
		// Remove the custom attributes no to be applied to the native input
		function pop(o,k) { var r=o[k]; if (r!==undefined) { delete o[k];} return r; }
		const floating = floats();
		const fullwidth = pop(attrs, 'fullwidth');
		const boxed = pop(attrs, 'boxed');
		const outlined = pop(attrs, 'outlined');
		const errormessage = pop(attrs, 'errormessage') || vn.state.errormessage;
		const dense = pop(attrs, 'dense');
		const disabled = pop(attrs, 'disabled');
		const help = pop(attrs, 'help');
		const faicon = pop(attrs, 'faicon');
		const iconaction = pop(attrs, 'iconaction');
		const leadingfaicon = pop(attrs, 'leadingfaicon');
		const inputfilter = pop(attrs, 'inputfilter');
		const help_id = vn.attrs.id+'_help';
		const nativeattrs = Object.assign({
			// defaults
			type: 'text',
			placeholder: fullwidth?vn.attrs.label:undefined,
			'aria-label': fullwidth?vn.attrs.label:undefined,
			'aria-controls': help_id,
			'aria-describedby': help_id,
		}, attrs, {
			// redefined
			oninput: function(ev) {
				var value = ev.target.value;
				if (inputfilter) {
					var selectionStart = ev.target.selectionStart;
					ev.target.value = inputfilter instanceof Function ?
						inputfilter(value, selectionStart):
						ev.target.value = RegExp(inputfilter).exec(value)[0];
					if (selectionStart<value.length) {
						ev.target.selectionStart=selectionStart;
						ev.target.selectionEnd=selectionStart;
					}
				}
				ev.target.setCustomValidity('');
				if (attrs.oninput) attrs.oninput(ev);
				vn.state.errormessage = ev.target.validationMessage;
			},
		});

		return m('', [
			m(''
				+'.mdc-text-field'
				+(fullwidth?'.mdc-text-field--fullwidth':'')
				+(boxed?'.mdc-text-field--box':'')
				+(outlined?'.mdc-text-field--outlined':'')
				+(faicon?'.mdc-text-field--with-trailing-icon':'')
				+(leadingfaicon?'.mdc-text-field--with-leading-icon':'')
				+(dense?'.mdc-text-field--dense':'')
				+(disabled?'.mdc-text-field--disabled':'')
			,{
				style: { width: '100%'},
			},[
				(leadingfaicon ? m('i.mdc-text-field__icon.fa.fa-'+leadingfaicon):''),
				m('input.mdc-text-field__input', nativeattrs),
				fullwidth?'':m('label'
					+'.mdc-floating-label'
					+(floating?
						'.mdc-floating-label--float-above':'')
					,
					{'for': vn.attrs.id}, [
					vn.attrs.label,
				]),
				(faicon ? m('i.mdc-text-field__icon.fa.fa-'+faicon,
					iconaction && {tabindex:0, role: 'button', onclick:
						function(ev) {
							iconaction(ev);
							ev.cancelBubble = true;
						}})
				:[]),
				(outlined? []: m('.mdc-line-ripple')),
				(outlined? m('.mdc-notched-outline'
					+(floating?
						'.mdc-notched-outline--notched':''),
					m('svg', m('path.mdc-notched-outline__path'))):[]),
				(outlined? m('.mdc-notched-outline__idle'):''),
			]),
			m('.mdc-text-field-helper-text'+
				'.mdc-text-field-helper-text--persistent'+
				(errormessage?'.mdc-text-field-helper-text--validation-msg':'')+
				'', {
				id: help_id,
				'aria-hidden': true,
				},
				errormessage || help || m.trust('&nbsp;')
			),
		]);
	},
};

TextField.Example = {};
TextField.Example.view = function(vn) {
	var Button = require('./button');
	const Layout = require('./layout');
	return m(Layout, m('h2', 'TextFields'),
		m(Layout.Row, [
			{
				id: 'errormessageexample',
				label: _('Attribute errormessage'),
				help: _('Setting the error as attribute'),
				errormessage: 'You guilty',
			},
			{
				id: 'required',
				label: _('Required field'),
				required: true,
			},
			{
				id: 'number',
				label: _('Numeric field'),
				type: 'number',
				min: 5,
				max: 12,
			},
			{
				id: 'binary',
				label: _('Binary Regexp'),
				pattern: '[01]*',
			},
			{
				id: 'email',
				boxed: true,
				label: _('Email'),
				type: 'email',
				oninput: function(ev) {
					vn.state.value1error = ev.target.validationMessage;
				},
			},
			{
				id: 'inputvalidator',
				label: _('Standard and custom validation'),
				value: vn.state.value1,
				inputfilter: '[^d]*', // you can not input dees
				pattern: '[^p]*', // standard complains on pees
				oninput: function(ev) {
					// custom complains on tees
					if (ev.target.value.indexOf('t')!==-1) {
						ev.target.setCustomValidity('\'t\' are forbidden');
					}
					vn.state.value1=ev.target.value;
					vn.state.value1error = ev.target.validationMessage;
				},
				help: _('not pees, tees, or dees'),
			},
			{
				id: 'inputfilter',
				label: _('Input filter'),
				value: vn.state.value2,
				inputfilter: /[01]*/, // allows incomplete answers
				pattern: "[01]{0,6}1", // more restritive, final validation
				oninput: function(ev) {
					vn.state.value2 = ev.target.value;
					vn.state.value2error = ev.target.validationMessage;
				},
				help: 'Quick input filter with a regexp',
			},
			{
				id: 'inputfilterfunction',
				label: _('input filter function'),
				help: _('Binary turns o into 0 and i into 1'),
				value: vn.state.value2,
				inputfilter: function(value) {
					return value
						.replace('i','1','g')
						.replace('I','1','g')
						.replace('o','0','g')
						.replace('O','0','g')
						;
				},
				pattern: "[01]{0,6}",
				oninput: function(ev) {
					vn.state.value2 = ev.target.value;
					vn.state.value2error = ev.target.validationMessage;
				},
			},
		].map(function(v) {
			return m(Layout.Cell, {span:4}, m(TextField, v));
		}),
		[
			m(Layout.Cell, m('',"value1: ", this.value1),
			this.value1error? m('b.red'," error: ", this.value1error):''),
			m(Layout.Cell, m('',"value2: ", this.value2),
			this.value2error? m('b.red'," error: ", this.value2error):''),
		]),
		m(Layout.Row, [
			m(Layout.Cell, m('h3',"Textfield styles")),
		]),
		['','boxed','outlined','fullwidth'].map(function(type) {
		return m(Layout.Row, [
			{
				id: 'mytextfield',
				label: _('My label'),
			},
			{
				id: 'icon',
				label: _('With icon'),
				faicon: 'asterisk',
			},
			{
				id: 'coloricon',
				label: _('With color icon'),
				faicon: 'asterisk.red',
			},
			{
				id: 'leadicon',
				label: _('With leading icon'),
				leadingfaicon: 'phone',
			},
			{
				id: 'bothicons',
				label: _('With leading and trailing icon'),
				leadingfaicon: 'phone.green',
				faicon: 'exclamation.red',
			},
			{
				id: 'helpfull',
				label: _('With helper text'),
				help: _('This is a helper text'),
			},
			{
				id: 'programatic',
				label: _('Programatic content'),
				help: _('Remove the value programmatically'),
				value: TextField.Example.text,
				oninput: function(ev) {
					TextField.Example.text=ev.target.value;
				},
			}
		].map(function(v) {
			var attrs = Object.assign({}, v);
			if (type) {
				attrs[type] = true;
				attrs.id+=type;
				attrs.label+= " "+type
			}
			return m(Layout.Cell, {span:4}, m(TextField, attrs));
		}),
		m(Layout.Cell, {span:4},
			m(Button, {
				onclick: function() {
					TextField.Example.text=TextField.Example.text?'':_('Added content');
				}
			}, _('Switch'))),
		);
	}),
	);
};


module.exports = TextField

// vim: noet ts=4 sw=4

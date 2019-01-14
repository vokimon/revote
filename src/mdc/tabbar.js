'use strict';
/** @module */

var m = require('mithril');
require('@material/tab-bar/dist/mdc.tab-bar.css');
require('@material/tab-scroller/dist/mdc.tab-scroller.css');
require('@material/tab-indicator/dist/mdc.tab-indicator.css');
require('@material/tab/dist/mdc.tab.css');
require('material-design-icons/iconfont/material-icons.css');

var MDCTabBar = require('@material/tab-bar').MDCTabBar;

/**
@namespace TabBar
@description A Material Design TabBar wrapped as Mithril component.

Widget used to navigate within elements of the same hierarchy by means of tabs.

![](../docs/shots/mdc-tabbar.png)

@see PageSlider for smooth pane transitions

@property {Object} model - An empty object to inject public API
@property {function} model.activateTab(index) - Programatically activates tab at index
@property {function} model.scrollIntoView(index) - Ensures the tab at index visible if scroll is active
@param index The tab index to show
@property {string} [align=center] - How to align the tabs horizontally (center, start, end, expand)
@property {string} [mode=icontext] - How to display icons and text (*icontext, textonly, icononly, stacked)
@property {int} index - Current tab index
@property {function} onactivated - Change handler ev.detail.index
@property {Object[]} tabs - Objects containing attributes for each tab
@property {string} tabs.text - The text to be shown if any
@property {string} tabs.icon - The material icon name to be shown if any
@property {string} tabs.faicon - The font-awesome icon name to be shown if any
@property {bool} tabs.disabled - Non interactive (default: false)
*/
var TabBar = {};
TabBar.oninit = function(vn) {
	vn.state.index = vn.attrs.index === undefined ? 0 : vn.attrs.index;
	vn.state.model = vn.attrs.model || {};
	vn.state.model.activateTab = function(i) {
		vn.state.widget.activateTab(i);
	};
	vn.state.model.scrollIntoView = function(i) {
		vn.state.widget.scrollIntoView(i);
	};
};
TabBar.oncreate = function(vn) {
	vn.state.widget = new MDCTabBar(vn.dom);
	vn.state.widget.listen('MDCTabBar:activated', function(ev) {
		vn.state.index = ev.detail.index;
		vn.attrs.onactivated && vn.attrs.onactivated(ev);
		m.redraw();
	});
	vn.state.index !== undefined && vn.state.model.activateTab(vn.attrs.index);
};
TabBar.view = function(vn) {
	return m('.mdc-tab-bar[role="tablist"]',
		m('.mdc-tab-scroller'
			+(vn.attrs.align?'.mdc-tab-scroller--align-'+vn.attrs.align:'')
			, [
			m('.mdc-tab-scroller__scroll-area',
				m('.mdc-tab-scroller__scroll-content',
					vn.attrs.tabs && vn.attrs.tabs.map(function(tab, index) {
						return m(Tab, {
							id: tab.id,
							disabled: tab.disabled,
							text: vn.attrs.mode!=='icononly' && tab.text,
							icon: vn.attrs.mode!=='textonly' && tab.icon,
							faicon: vn.attrs.mode!=='textonly' && tab.faicon,
							stacked: vn.attrs.mode==='stacked',
							minwidth: vn.attrs.align !== 'expand',
							active: vn.attrs.index===index,
						});
					})
				)
			),
		])
	);
};


var Tab = {};
Tab.view = function(vn) {
	return m('button.mdc-tab'+
		(vn.attrs.active? '.mdc-tab--active':'')+
		(vn.attrs.minwidth? '.mdc-tab--min-width':'')+
		(vn.attrs.stacked? '.mdc-tab--stacked':'')+
	'', Object.assign({
		role: 'tab',
		tabindex: vn.attrs.active?0:-1,
		'aria-selected': vn.attrs.active,
	},vn.attrs),[
		m('span.mdc-tab__content', [
			vn.attrs.icon?m('span.mdc-tab__icon.material-icons', vn.attrs.icon):null,
			vn.attrs.faicon?m('i.mdc-tab__icon.fa.fa-'+vn.attrs.faicon):null,
			vn.attrs.text?m('span.mdc-tab__text-label', vn.attrs.text):null,
		]),
		m('span.mdc-tab-indicator'+
			(vn.attrs.active? '.mdc-tab-indicator--active':''),
			m('span.mdc-tab-indicator__content.mdc-tab-indicator__content--underline')
		),
		m('span.mdc-tab__ripple'),
	]);
};


TabBar.Example = {};
TabBar.Example.model = {
	active: 1,
	align: 'center',
	disableunfavorite: false,
	active2: 0,
};
TabBar.Example.view = function(vn) {
	var model = vn.state.model;
	var Checkbox = require('./checkbox');
	var Button = require('./button');
	var Layout = require('./layout');
	return m(Layout, m(Layout.Cell, {span: 12} , [
		m('h2', 'Tab bars'),
		m(TabBar, {
			model: TabBar.Example.model,
			index: model.active,
			onactivated: function(ev) {
				model.active = ev.detail.index;
			},
			align: model.align,
			mode: model.mode,
			tabs: [{
				id: 'tabfavorites',
				text: 'Favorites',
				icon: 'favorite',
			},{
				id: 'tabunfavorites',
				text: 'Unfavorites',
				icon: 'thumb_down',
				disabled: model.disableunfavorite,
			},{
				id: 'tabowner',
				text: 'Owner',
				icon: 'face',
			}],
		}),
		m('', 'Alignment:', [
			m(Button, {onclick: function() { model.align='start'; }},
				'Align Start'),
			m(Button, {onclick: function() { model.align='center'; }},
				'Align Center'),
			m(Button, {onclick: function() { model.align='end'; }},
				'Align End'),
			m(Button, {onclick: function() { model.align='expand'; }},
				'Expand'),
		]),
		m('', 'Content:', [
			m(Button, {onclick: function() { model.mode='icontext'; }},
				'Text & Icons'),
			m(Button, {onclick: function() { model.mode='icononly'; }},
				'Icons Only'),
			m(Button, {onclick: function() { model.mode='textonly'; }},
				'Text Only'),
			m(Button, {onclick: function() { model.mode='stacked'; }},
				'Stacked'),
		]),
		m('', 'Programmatic jump:', [
			m(Button, {onclick: function() { model.active=0; }},
				'Activate 0'),
			m(Button, {onclick: function() { model.active=1; }},
				'Activate 1'),
			m(Button, {onclick: function() { model.active=2; }},
				'Activate 2'),
		]),
		m(Checkbox, {
			id: 'tabbar-disable',
			label: 'Disable unfavorite',
			checked: model.disableunfavorite,
			onchange: function(ev) {
				model.disableunfavorite = ev.target.checked;
			},
		}),
		m('pre', JSON.stringify(model, null, 2)),
		m(TabBar, {
			index: model.active2,
			onactivated: function(ev) {
				model.active2 = ev.detail.index;
			},
			tabs: [0,1,2,3,4,5,6,7,8,9,10,11].map(function(v, index) {
			return {
				id: 'tabscroll'+v,
				text: 'Scrolled Tab '+v,
				};
			}),
		}),
	]));
};



module.exports=TabBar;

// vim: noet ts=4 sw=4

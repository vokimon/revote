'use strict';
/** @module */
var m = require('mithril');
require('@material/layout-grid/dist/mdc.layout-grid.css');

function pop(o,k) { var r=o[k]; if (r!==undefined) { delete o[k];} return r; }


/**
@namespace Layout
@description Container for a layout 
@property {string} Child alignment: left, right or undefined (center)
*/
var Layout = {
	view: function(vnode) {
		var attrs = Object.assign({},vnode.attrs);
		var align = pop(attrs, 'align'); // left, right, undefined (center)
		return m('.mdc-layout-grid'+
			(align?'.mdc-layout-grid--align-'+align:'')+
			'',
			vnode.attrs,
			vnode.children);
	},
};

/**
@namespace Row
@description Cell containing other cells
*/
var Row = {
	view: function(vnode) {
		return m('.mdc-layout-grid__inner', vnode.attrs, vnode.children);
	},
};

/**
@namespace Cell
@description Leaf Cell of the layout tree
*/
var Cell = {
	view: function(vnode) {
		var attrs = Object.assign({},vnode.attrs);
		var span = pop(attrs, 'span');
		var spantablet = pop(attrs, 'spantablet');
		var spandesktop = pop(attrs, 'spandesktop');
		var spanphone = pop(attrs, 'spanphone');
		var order = pop(attrs, 'order'); // 1 to 12
		var align = pop(attrs, 'align'); // left, right, undefined (center)
		return m(
			(span?'.mdc-layout-grid__cell--span-'+span:'')+
			(spanphone?'.mdc-layout-grid__cell--span-'+spanphone+'-phone':'')+
			(spantablet?'.mdc-layout-grid__cell--span-'+spantablet+'-tablet':'')+
			(spandesktop?'.mdc-layout-grid__cell--span-'+spandesktop+'-desktop':'')+
			(order?'.mdc-layout-grid__cell--order-'+order:'')+
			(align?'.mdc-layout-grid__cell--align-'+align:'')+
			'.mdc-layout-grid__cell'+
			'', attrs, vnode.children);
	},
};
Layout.Row = Row;
Layout.Cell = Cell;

module.exports = Layout

// vim: noet ts=4 sw=4

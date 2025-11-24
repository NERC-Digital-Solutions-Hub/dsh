import{m as l,p as c}from"./CdDXOJ3Y.js";import{m,A as d}from"./DkJ9ydHD.js";import{s as p,B as h,F as u}from"./DOBtub6T.js";import{c as g}from"./Blp-4Wmz.js";import{a as $}from"./BUpj17sD.js";import{s as f,u as v}from"./Dex61Jy7.js";/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const w={disabled:"esri-disabled",empty:"esri-widget__content--empty",heading:"esri-widget__heading",loaderAnimation:"esri-widget__loader-animation",panel:"esri-widget--panel",widget:"esri-widget"};/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const B=l(m);/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const E=(s,e)=>t=>y(t,s);class x extends d{#e=void 0;constructor(e,t){super(e,t),new g(this.component)}hostLoad(){this.#e=$(()=>this.component.el.view,e=>{this.instance.view=e,this.instance.map=e?.map},{sync:!0,initial:!0})}hostDestroy(){this.#e?.remove(),super.hostDestroy()}}const y=c(x);/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */function F({level:s,class:e,id:t,children:a,excludeGlobalCss:r}){const i=C(s),n=`h${i}`,o=f(n);return v`<${o} .ariaLevel=${String(i)} class=${p(u(r?e:w.heading,e))} id=${t??h} role=heading>${a}</${o}>`}function _(s,e,t){return Math.min(Math.max(s,e),t)}function C(s){return _(Math.ceil(s),1,6)}export{F as a,w as e,B as s,E as v};

import{s as l,B as c,F as m}from"./BlOilgcx.js";import{s as d,u as p}from"./B2QWAqRw.js";import{m as h,p as u}from"./C86rxpFH.js";import{m as g,A as $}from"./SBtBj7ez.js";import{c as f}from"./BsPoaGfF.js";import{l as w}from"./CYlsogSb.js";/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const v={disabled:"esri-disabled",empty:"esri-widget__content--empty",heading:"esri-widget__heading",loaderAnimation:"esri-widget__loader-animation",panel:"esri-widget--panel",widget:"esri-widget"};/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */function B({level:s,class:e,id:t,children:r,excludeGlobalCss:n}){const i=y(s),a=`h${i}`,o=d(a);return p`<${o} .ariaLevel=${String(i)} class=${l(m(n?e:v.heading,e))} id=${t??c} role=heading>${r}</${o}>`}function x(s,e,t){return Math.min(Math.max(s,e),t)}function y(s){return x(Math.ceil(s),1,6)}/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const E=h(g);/*! All material copyright Esri, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.34/esri/copyright.txt for details.
v4.34.9 */const F=(s,e)=>t=>C(t,s);class _ extends ${#e=void 0;constructor(e,t){super(e,t),new f(this.component)}hostLoad(){this.#e=w(()=>this.component.el.view,e=>{this.instance.view=e,this.instance.map=e?.map},{sync:!0,initial:!0})}hostDestroy(){this.#e?.remove(),super.hostDestroy()}}const C=u(_);export{B as a,v as e,E as s,F as v};

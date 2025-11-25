import"./DsnmJJEf.js";import{p as S,a5 as L,t as b,aa as F,a7 as Y,r as Z,a as T,a9 as j,n as I}from"./BjFLI01z.js";import{f as ee,d as G,a as x}from"./DAMOoDui.js";import{e as te,i as re,s as C}from"./DoCgVQpV.js";import{c as q}from"./BM3AUTZE.js";import{B as ne}from"./C1ksMhv9.js";import{_ as R}from"./6W6J17CP.js";import{z as oe}from"./BBV24j_2.js";import"./DwWpeHsS.js";import"./D4VJcUD0.js";import"./CjH7Rf0r.js";import"./C9bC63rm.js";import"./CeRhhlE3.js";import"./DFoMxmW4.js";import"./IyXX-m-G.js";import{u as N,m as se,i as ie}from"./CCxKV4CJ.js";import{p as _}from"./DmDvrl5M.js";import{n as z}from"./y635C_uJ.js";import{s as k,r as U}from"./Ck_Twk2V.js";import{I as B}from"./BRkCggxY.js";import{n as D}from"./BsgmZ9YD.js";var ae=ee('<div class="map-sidebar svelte-1gk88h6" role="navigation" aria-label="Map tools"></div>');function Ke(t,e){S(e,!0);let n=Y("");const r=async o=>{b(n)===o?(j(n,""),e.onToggleItem?.(o,!1)):(j(n,o,!0),e.onToggleItem?.(o,!0))};var s=ae();te(s,21,()=>e.options,re,(o,i)=>{var l=G(),c=L(l);{let u=F(()=>`sidebar-button ${b(i).id===b(n)?"active":""}`),f=F(()=>b(i).id===b(n));q(c,()=>ne,(h,A)=>{A(h,{get class(){return b(u)},variant:"ghost",size:"icon",get"aria-label"(){return b(i).label},get"aria-pressed"(){return b(f)},get title(){return b(i).label},onclick:()=>void r(b(i).id),children:(v,p)=>{const a=F(()=>b(i).icon);var g=G(),y=L(g);q(y,()=>b(a),(m,d)=>{d(m,{"aria-hidden":"true",class:"sidebar-icon"})}),x(v,g)},$$slots:{default:!0}})})}x(o,l)}),Z(s),x(t,s),T()}async function He(t,e,n,r){return e.length?t.type==="feature"?le(t,e,n,r):t.type==="graphics"?ce(t,e,n):(console.warn("getUnionPolygonGeometryByIds: unsupported layer type:",t.type),null):null}async function le(t,e,n,r){const s=n,o=t.createQuery(),i=e.map(f=>me(s,f));o.where=i.join(" OR "),o.returnGeometry=!0,o.outFields=[],o.num=e.length||1e3,r?.spatialReference&&(o.outSpatialReference=r.spatialReference);const c=(await t.queryFeatures(o)).features.map(f=>f.geometry).filter(f=>!!f&&f.type==="polygon");if(!c.length)return null;if(c.length===1)return c[0];const u=_(c);return!u||u.type!=="polygon"?null:u}function ce(t,e,n){const r=n,s=new Set(e.map(l=>String(l))),o=[];if(t.graphics.forEach(l=>{const u=(l.attributes||{})[r];if(u==null||!s.has(String(u)))return;const f=l.geometry;f&&f.type==="polygon"&&o.push(f)}),!o.length)return null;if(o.length===1)return o[0];const i=_(o);return!i||i.type!=="polygon"?null:i}async function ue(t,e,n,r){const s=await fe(t,e,n,r);if(!s.length)return[];const o=new Map;for(const l of s){const c=l.value==null?"__NULL__":String(l.value);let u=o.get(c);u||(u={value:l.value,geometries:[]},o.set(c,u)),u.geometries.push(l.geometry)}const i=[];return o.forEach(l=>{const c=J(e,l.geometries);c&&i.push({geometry:c,value:l.value})}),i}async function fe(t,e,n,r){return t.type==="feature"?pe(t,e,n,r):t.type==="graphics"?ge(t,e,n):(console.warn("getClipFeatures: unsupported layer type:",t.type),[])}async function pe(t,e,n,r){const s=t.createQuery();return s.geometry=e,s.spatialRelationship="intersects",s.returnGeometry=!0,s.outFields=[n],s.num=1e3,r?.spatialReference&&(s.outSpatialReference=r.spatialReference),(await t.queryFeatures(s)).features.filter(i=>!!i.geometry).map(i=>({geometry:i.geometry,value:i.attributes?.[n]}))}function ge(t,e,n){const r=e.extent,s=[];return t.graphics.forEach(o=>{if(!o.geometry)return;const i=o.geometry,l="extent"in i?i.extent:null;if(!r||!l||K(r,l)){const c=o.attributes||{};s.push({geometry:i,value:c[n]})}}),s}function W(t,e){return t.spatialReference?.wkid!==e.spatialReference?.wkid&&t.spatialReference?.wkt!==e.spatialReference?.wkt?(console.error("clipPolygon: polygon and union clip geometry must be in the same spatial reference."),console.log("polygon SR",t.spatialReference?.toJSON()),console.log("unionClipGeometry SR",e.spatialReference?.toJSON()),!1):!0}function V(t,e,n){return new R({geometry:t,attributes:{clipped:!0,...e},symbol:n||{type:"simple-fill",color:[0,0,0,.2],outline:{color:[255,0,0,1],width:1.5}}})}function Q(t,e,n){n?.map&&!n.map.layers.includes(t)&&n.map.add(t),t.add(e)}function me(t,e){return typeof e=="number"?`${t} = ${e}`:`${t} = '${String(e).replace(/'/g,"''")}'`}async function ye(t,e,n){const r=await de(t,e,n);return r.length?J(e,r):null}async function de(t,e,n){return t.type==="feature"?he(t,e,n):t.type==="graphics"?ve(t,e):(console.warn("getClipGeometries: unsupported layer type:",t.type),[])}async function he(t,e,n){const r=t.createQuery();return r.geometry=e,r.spatialRelationship="intersects",r.returnGeometry=!0,r.outFields=[],r.num=1e3,n?.spatialReference&&(r.outSpatialReference=n.spatialReference),(await t.queryFeatures(r)).features.map(o=>o.geometry).filter(o=>!!o)}function ve(t,e){const n=e.extent,r=[];return t.graphics.forEach(s=>{if(!s.geometry)return;const o=s.geometry,i="extent"in o?o.extent:null;(!n||!i||K(n,i))&&r.push(o)}),r}function J(t,e){N(t);const n=se(e,t);if(!n.length)return null;const r=n.filter(o=>!!o&&o.type==="polygon");if(!r.length)return null;const s=_(r);return!s||s.type!=="polygon"?null:s}function K(t,e){return!(t.xmax<e.xmin||t.xmin>e.xmax||t.ymax<e.ymin||t.ymin>e.ymax)}async function Xe(t){const{view:e,input:n,clipLayer:r,targetLayer:s,symbol:o,clipLayerValueField:i,sourceIds:l}=t,c=n instanceof R?n.geometry:n;if(!c)return console.warn("clipPolygon: no input geometry provided."),null;if(c.type!=="polygon")return console.warn("clipPolygon: input geometry is not a polygon."),null;const u=c;if(r instanceof oe&&r.geometryType!=="polygon")return console.error("clipPolygon: clipLayer is not of polygon geometry type."),null;const f=[];if(i){const v=await ue(r,u,i,e);if(!v.length)return console.info("clipPolygon: no geometries in clipLayer intersect the polygon for any value."),null;const p=r.title||r.id||"clip-layer";for(const{geometry:a,value:g}of v){if(!W(u,a)){console.error("clipPolygon: spatial reference mismatch for clip value:",g);continue}const m=V(a,{sourceIds:l,layerTitle:p,valueField:i,value:g},o);Q(s,m,e),f.push(m)}return f.length?(e&&e.goTo(f.map(a=>a.geometry)).catch(a=>console.warn("goTo failed:",a)),f):null}const h=await ye(r,u,e);if(!h)return console.info("clipPolygon: no geometries in clipLayer intersect the polygon."),null;if(!W(u,h))return null;const A=V(h,{sourceIds:l},o);return Q(s,A,e),e&&e.goTo(h).catch(v=>console.warn("goTo failed:",v)),f.push(A),f}function Ye(t,e){console.log("[merge-clipped-polygons] merging in layer:",t.id,"opts:",e);const n=be(t);if(n.length<=1)return n;console.log("[merge-clipped-polygons] candidate polygons:",n.length);const r=we(n);if(console.log("[merge-clipped-polygons] overlay pieces count:",r.length),!r.length)return[];const s=Me(r);console.log("[merge-clipped-polygons] groups by layer set:",s.size);const o=$e(s);return console.log("[merge-clipped-polygons] replacing",n.length,"originals with",o.length,"final polygons."),t.graphics.removeMany(n),t.graphics.addMany(o),o}function be(t,e){return t.graphics.toArray().filter(r=>!(!r.geometry||r.geometry.type!=="polygon"))}function we(t){let e=[];for(const n of t)e=Ae(n,e);return e}function Ae(t,e){let r=t.geometry;if(!r)return e;N(r);const s=[];for(const o of e){const i=xe(o,r,t);s.push(...i.pieces),r=i.remaining,r&&N(r)}return r&&s.push({geometry:r,members:[t]}),s}function xe(t,e,n){const r=t.geometry;if(!e)return{pieces:[t],remaining:null};const s=r.extent,o=e.extent;if(!Pe(s,o))return{pieces:[t],remaining:e};const i=ie(r,e);if(!i||i.type!=="polygon")return{pieces:[t],remaining:e};const l=z(r,e),c=z(e,r),u=[];l&&l.type==="polygon"&&u.push({geometry:l,members:t.members.slice()}),u.push({geometry:i,members:[...t.members,n]});const f=c&&c.type==="polygon"?c:null;return{pieces:u,remaining:f}}function Me(t){const e=new Map;for(const n of t){const{key:r,ids:s}=Le(n.members);if(s.length===0)continue;let o=e.get(r);o||(o={geometries:[],members:n.members,comboKey:r},e.set(r,o)),o.geometries.push(n.geometry)}return e}function $e(t){const e=[];for(const[,n]of t.entries()){if(!n.geometries.length)continue;const r=_(n.geometries);if(!r||r.type!=="polygon")continue;const s=Ge(n.members),o=new R({geometry:r,attributes:s,symbol:{type:"simple-fill",color:[0,0,0,.3],outline:{color:[0,0,0,1],width:1}}});e.push(o)}return e}function Le(t){const e=new Set,n=new Set,r=new Set;for(const l of t){const c=l.attributes??{},u=c.layerId,f=c.layerTitle,h=c.layerIds,A=c.layerTitles,v=c.value!=null?String(c.value):void 0,p=c.layerValues,a=c.bufferDistance,g=c.bufferUnit,y=a!=null&&!Number.isNaN(a)?`|buffer:${a}:${g??"sr"}`:"",m=(d,w)=>{r.add(`${d}:${w}${y}`)};if(u){e.add(u),f&&n.add(f);const d=Array.isArray(p)&&p.length?p:v?[v]:["__NOVALUE__"];for(const w of d)m(u,w)}if(Array.isArray(h))for(let d=0;d<h.length;d++){const w=h[d];if(!w)continue;e.add(w);const M=A?.[d];M&&n.add(M);const $=p?.[d]??v??"__NOVALUE__";m(w,$)}}const s=Array.from(e).sort(),o=Array.from(n).sort();return{key:Array.from(r).sort().join("|"),ids:s,titles:o}}function Ge(t){const e={};if(!t.length)return e;const n=t[0].attributes??{};Object.assign(e,n),"sourceId"in n&&(e.sourceId=n.sourceId),"clipped"in n&&(e.clipped=n.clipped);const r=[],s=[],o=new Map,i=p=>{const a=p.bufferDistance,g=p.bufferUnit,y=p.weight;if(a==null&&g==null&&y==null)return;const m=`${a??""}|${g??""}|${y??""}`;o.has(m)||o.set(m,{distance:a,unit:g,weight:y})},l=new Map,c=(p,a,g,y)=>{if(!p)return;let m=l.get(p);m||(m={titles:new Set,values:new Set,weights:[]},l.set(p,m)),a&&m.titles.add(a),Array.isArray(g)&&g.forEach(d=>{d!=null&&m.values.add(String(d))}),typeof y=="number"&&!Number.isNaN(y)&&m.weights.push(y)};for(const p of t){const a=p.attributes??{},g=typeof a.weight=="number"?a.weight:void 0,y=a.layerTitle;y&&typeof g=="number"&&!Number.isNaN(g)&&(r.push(y),s.push(g)),i(a);const m=a.layerId,d=a.layerTitle,w=a.layerValues,M=a.value!=null?String(a.value):void 0,$=a.layerIds,E=a.layerTitles,O=Array.isArray(w)&&w.length?w:M?[M]:void 0;if(m&&c(m,d,O,g),Array.isArray($))for(let P=0;P<$.length;P++){const H=$[P],X=Array.isArray(E)?E[P]:void 0;c(H,X,O,g)}}const u=[],f=[],h=[],A=[],v=Array.from(l.keys()).sort();for(const p of v){const a=l.get(p),g=Array.from(a.titles).sort(),y=Array.from(a.values);u.push(p),f.push(g.join(" / ")),h.push(y.join(", "));const m=a.weights.length>0?Math.min(...a.weights):0;A.push(m)}if(e.layerIds=u,e.layerTitles=f,e.layerValues=h,e.layerWeights=A,e.layerTitlesCsv=f.join(", "),e.memberLayerTitles=r,e.memberLayerWeights=s,o.size){const p=Array.from(o.values());if(e.bufferInfos=p,e.hasBuffer=!0,p.length===1){const a=p[0];a.distance!=null&&(e.bufferDistance=a.distance),a.unit!=null&&(e.bufferUnit=a.unit),a.weight!=null&&(e.weight=a.weight)}}else delete e.bufferDistance,delete e.bufferUnit,delete e.weight,delete e.bufferInfos,delete e.hasBuffer;return e}function Pe(t,e){return!(t.xmax<e.xmin||t.xmin>e.xmax||t.ymax<e.ymin||t.ymin>e.ymax)}function Ze(t,e){S(e,!0);/**
 * @license @lucide/svelte v0.544.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */let n=U(e,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M12 18V5"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77"}]];B(t,k({name:"brain"},()=>n,{get iconNode(){return r},children:(s,o)=>{var i=G(),l=L(i);C(l,()=>e.children??I),x(s,i)},$$slots:{default:!0}})),T()}function et(t,e){S(e,!0);/**
 * @license @lucide/svelte v0.544.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */let n=U(e,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M3 5h.01"}],["path",{d:"M3 12h.01"}],["path",{d:"M3 19h.01"}],["path",{d:"M8 5h13"}],["path",{d:"M8 12h13"}],["path",{d:"M8 19h13"}]];B(t,k({name:"list"},()=>n,{get iconNode(){return r},children:(s,o)=>{var i=G(),l=L(i);C(l,()=>e.children??I),x(s,i)},$$slots:{default:!0}})),T()}function tt(t,e){S(e,!0);/**
 * @license @lucide/svelte v0.544.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */let n=U(e,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"}],["path",{d:"M15 5.764v15"}],["path",{d:"M9 3.236v15"}]];B(t,k({name:"map"},()=>n,{get iconNode(){return r},children:(s,o)=>{var i=G(),l=L(i);C(l,()=>e.children??I),x(s,i)},$$slots:{default:!0}})),T()}function rt(t,e){if(!t||!t.map)throw new Error("MapView is not initialized");const n=new D({title:e,listMode:"show"}),r=new D({listMode:"hide"});return t.map.add(r),t.on("click",async s=>{if(!t)return;const i=(await t.hitTest(s)).results.find(c=>c.layer===n);if(!i){r.removeAll();return}const l=i.graphic;r.removeAll(),r.add(new R({geometry:l.geometry,symbol:{type:"simple-fill",color:[0,0,0,0],outline:{type:"simple-line",color:[255,255,0,1],width:3}}})),t.popup?.open({features:[l],location:s.mapPoint})}),t.map.add(n),n}export{Ze as B,et as L,Ke as M,rt as a,tt as b,Xe as c,V as d,Q as e,fe as f,He as g,J as h,de as i,Ye as m,W as v};

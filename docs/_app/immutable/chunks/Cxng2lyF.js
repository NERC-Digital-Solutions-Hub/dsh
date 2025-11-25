import"./DsnmJJEf.js";import{p as B,a5 as $,t as L,aa as k,a8 as se,r as ie,a as R,a7 as Q,n as O}from"./kZbt_Riz.js";import{f as le,d as M,a as G}from"./CcHDQE4Y.js";import{e as ae,i as ce,s as V}from"./u2O093Vk.js";import{c as J}from"./BtB4Oo-j.js";import{B as ue}from"./D8wi5ct4.js";import{_ as P}from"./CbKIfN8e.js";import{z as H}from"./O7sg2ysZ.js";import"./DwWpeHsS.js";import"./D4VJcUD0.js";import"./CjH7Rf0r.js";import"./C9bC63rm.js";import"./BfMV86KQ.js";import"./D2feDspf.js";import"./BVLmr62Y.js";import{u as U,m as fe,i as pe}from"./BYRe6UlO.js";import{n as E}from"./C92cRl-g.js";import{p as C,m as X,a as ge}from"./Do8Mu2oV.js";import{s as D,r as W}from"./P_mD4-LL.js";import{I as j}from"./vOQ5vgZE.js";import{n as K}from"./DcogKsHq.js";import"./C39vTPtT.js";import{b as ye}from"./JCnLFCbT.js";var me=le('<div class="map-sidebar svelte-1gk88h6" role="navigation" aria-label="Map tools"></div>');function ct(t,e){B(e,!0);let r=se("");const n=async o=>{L(r)===o?(Q(r,""),e.onToggleItem?.(o,!1)):(Q(r,o,!0),e.onToggleItem?.(o,!0))};var s=me();ae(s,21,()=>e.options,ce,(o,i)=>{var l=M(),a=$(l);{let f=k(()=>`sidebar-button ${L(i).id===L(r)?"active":""}`),c=k(()=>L(i).id===L(r));J(a,()=>ue,(m,y)=>{y(m,{get class(){return L(f)},variant:"ghost",size:"icon",get"aria-label"(){return L(i).label},get"aria-pressed"(){return L(c)},get title(){return L(i).label},onclick:()=>void n(L(i).id),children:(b,p)=>{const u=k(()=>L(i).icon);var g=M(),h=$(g);J(h,()=>L(u),(d,v)=>{v(d,{"aria-hidden":"true",class:"sidebar-icon"})}),G(b,g)},$$slots:{default:!0}})})}G(o,l)}),ie(s),G(t,s),R()}async function ut(t,e,r,n){return e.length?t.type==="feature"?de(t,e,r,n):t.type==="graphics"?he(t,e,r):(console.warn("getUnionPolygonGeometryByIds: unsupported layer type:",t.type),null):null}async function de(t,e,r,n){const s=r,o=t.createQuery(),i=e.map(c=>Le(s,c));o.where=i.join(" OR "),o.returnGeometry=!0,o.outFields=[],o.num=e.length||1e3,n?.spatialReference&&(o.outSpatialReference=n.spatialReference);const a=(await t.queryFeatures(o)).features.map(c=>c.geometry).filter(c=>!!c&&c.type==="polygon");if(!a.length)return null;if(a.length===1)return a[0];const f=C(a);return!f||f.type!=="polygon"?null:f}function he(t,e,r){const n=r,s=new Set(e.map(l=>String(l))),o=[];if(t.graphics.forEach(l=>{const f=(l.attributes||{})[n];if(f==null||!s.has(String(f)))return;const c=l.geometry;c&&c.type==="polygon"&&o.push(c)}),!o.length)return null;if(o.length===1)return o[0];const i=C(o);return!i||i.type!=="polygon"?null:i}async function be(t,e,r,n){const s=await Y(t,e,r,n);if(!s.length)return[];const o=new Map;for(const l of s){const a=l.value==null?"__NULL__":String(l.value);let f=o.get(a);f||(f={value:l.value,geometries:[]},o.set(a,f)),f.geometries.push(l.geometry)}const i=[];return o.forEach(l=>{const a=I(e,l.geometries);a&&i.push({geometry:a,value:l.value})}),i}async function Y(t,e,r,n){return t.type==="feature"?ve(t,e,r,n):t.type==="graphics"?we(t,e,r):(console.warn("getClipFeatures: unsupported layer type:",t.type),[])}async function ve(t,e,r,n){const s=t.createQuery();return s.geometry=e,s.spatialRelationship="intersects",s.returnGeometry=!0,s.outFields=[r],s.num=1e3,n?.spatialReference&&(s.outSpatialReference=n.spatialReference),(await t.queryFeatures(s)).features.filter(i=>!!i.geometry).map(i=>({geometry:i.geometry,value:i.attributes?.[r]}))}function we(t,e,r){const n=e.extent,s=[];return t.graphics.forEach(o=>{if(!o.geometry)return;const i=o.geometry,l="extent"in i?i.extent:null;if(!n||!l||ee(n,l)){const a=o.attributes||{};s.push({geometry:i,value:a[r]})}}),s}function N(t,e){return t.spatialReference?.wkid!==e.spatialReference?.wkid&&t.spatialReference?.wkt!==e.spatialReference?.wkt?(console.error("clipPolygon: polygon and union clip geometry must be in the same spatial reference."),console.log("polygon SR",t.spatialReference?.toJSON()),console.log("unionClipGeometry SR",e.spatialReference?.toJSON()),!1):!0}function _(t,e,r){return new P({geometry:t,attributes:{clipped:!0,...e},symbol:r||{type:"simple-fill",color:[0,0,0,.2],outline:{color:[255,0,0,1],width:1.5}}})}function T(t,e,r){r?.map&&!r.map.layers.includes(t)&&r.map.add(t),t.add(e)}function Le(t,e){return typeof e=="number"?`${t} = ${e}`:`${t} = '${String(e).replace(/'/g,"''")}'`}async function Pe(t,e,r){const n=await Z(t,e,r);return n.length?I(e,n):null}async function Z(t,e,r){return t.type==="feature"?Ge(t,e,r):t.type==="graphics"?Ae(t,e):(console.warn("getClipGeometries: unsupported layer type:",t.type),[])}async function Ge(t,e,r){const n=t.createQuery();return n.geometry=e,n.spatialRelationship="intersects",n.returnGeometry=!0,n.outFields=[],n.num=1e3,r?.spatialReference&&(n.outSpatialReference=r.spatialReference),(await t.queryFeatures(n)).features.map(o=>o.geometry).filter(o=>!!o)}function Ae(t,e){const r=e.extent,n=[];return t.graphics.forEach(s=>{if(!s.geometry)return;const o=s.geometry,i="extent"in o?o.extent:null;(!r||!i||ee(r,i))&&n.push(o)}),n}function I(t,e){U(t);const r=fe(e,t);if(!r.length)return null;const n=r.filter(o=>!!o&&o.type==="polygon");if(!n.length)return null;const s=C(n);return!s||s.type!=="polygon"?null:s}function ee(t,e){return!(t.xmax<e.xmin||t.xmin>e.xmax||t.ymax<e.ymin||t.ymin>e.ymax)}async function ft(t){const{view:e,input:r,clipLayer:n,targetLayer:s,symbol:o,clipLayerValueField:i,sourceIds:l}=t,a=r instanceof P?r.geometry:r;if(!a)return console.warn("clipPolygon: no input geometry provided."),null;if(a.type!=="polygon")return console.warn("clipPolygon: input geometry is not a polygon."),null;const f=a;if(n instanceof H&&n.geometryType!=="polygon")return console.error("clipPolygon: clipLayer is not of polygon geometry type."),null;const c=[];if(i){const b=await be(n,f,i,e);if(!b.length)return console.info("clipPolygon: no geometries in clipLayer intersect the polygon for any value."),null;const p=n.title||n.id||"clip-layer";for(const{geometry:u,value:g}of b){if(!N(f,u)){console.error("clipPolygon: spatial reference mismatch for clip value:",g);continue}const d=_(u,{sourceIds:l,layerTitle:p,valueField:i,value:g},o);T(s,d,e),c.push(d)}return c.length?(e&&e.goTo(c.map(u=>u.geometry)).catch(u=>console.warn("goTo failed:",u)),c):null}const m=await Pe(n,f,e);if(!m)return console.info("clipPolygon: no geometries in clipLayer intersect the polygon."),null;if(!N(f,m))return null;const y=_(m,{sourceIds:l},o);return T(s,y,e),e&&e.goTo(m).catch(b=>console.warn("goTo failed:",b)),c.push(y),c}function pt(t,e){console.log("[merge-clipped-polygons] merging in layer:",t.id,"opts:",e);const r=xe(t);if(r.length<=1)return r;console.log("[merge-clipped-polygons] candidate polygons:",r.length);const n=$e(r);if(console.log("[merge-clipped-polygons] overlay pieces count:",n.length),!n.length)return[];const s=Fe(n);console.log("[merge-clipped-polygons] groups by layer set:",s.size);const o=Se(s);return console.log("[merge-clipped-polygons] replacing",r.length,"originals with",o.length,"final polygons."),t.graphics.removeMany(r),t.graphics.addMany(o),o}function xe(t,e){return t.graphics.toArray().filter(n=>!(!n.geometry||n.geometry.type!=="polygon"))}function $e(t){let e=[];for(const r of t)e=Me(r,e);return e}function Me(t,e){let n=t.geometry;if(!n)return e;U(n);const s=[];for(const o of e){const i=Te(o,n,t);s.push(...i.pieces),n=i.remaining,n&&U(n)}return n&&s.push({geometry:n,members:[t]}),s}function Te(t,e,r){const n=t.geometry;if(!e)return{pieces:[t],remaining:null};const s=n.extent,o=e.extent;if(!Be(s,o))return{pieces:[t],remaining:e};const i=pe(n,e);if(!i||i.type!=="polygon")return{pieces:[t],remaining:e};const l=E(n,e),a=E(e,n),f=[];l&&l.type==="polygon"&&f.push({geometry:l,members:t.members.slice()}),f.push({geometry:i,members:[...t.members,r]});const c=a&&a.type==="polygon"?a:null;return{pieces:f,remaining:c}}function Fe(t){const e=new Map;for(const r of t){const{key:n,ids:s}=Ne(r.members);if(s.length===0)continue;let o=e.get(n);o||(o={geometries:[],members:r.members,comboKey:n},e.set(n,o)),o.geometries.push(r.geometry)}return e}function Se(t){const e=[];for(const[,r]of t.entries()){if(!r.geometries.length)continue;const n=C(r.geometries);if(!n||n.type!=="polygon")continue;const s=_e(r.members),o=new P({geometry:n,attributes:s,symbol:{type:"simple-fill",color:[0,0,0,.3],outline:{color:[0,0,0,1],width:1}}});e.push(o)}return e}function Ne(t){const e=new Set,r=new Set,n=new Set;for(const l of t){const a=l.attributes??{},f=a.layerId,c=a.layerTitle,m=a.layerIds,y=a.layerTitles,b=a.value!=null?String(a.value):void 0,p=a.layerValues,u=a.bufferDistance,g=a.bufferUnit,h=u!=null&&!Number.isNaN(u)?`|buffer:${u}:${g??"sr"}`:"",d=(v,w)=>{n.add(`${v}:${w}${h}`)};if(f){e.add(f),c&&r.add(c);const v=Array.isArray(p)&&p.length?p:b?[b]:["__NOVALUE__"];for(const w of v)d(f,w)}if(Array.isArray(m))for(let v=0;v<m.length;v++){const w=m[v];if(!w)continue;e.add(w);const A=y?.[v];A&&r.add(A);const x=p?.[v]??b??"__NOVALUE__";d(w,x)}}const s=Array.from(e).sort(),o=Array.from(r).sort();return{key:Array.from(n).sort().join("|"),ids:s,titles:o}}function _e(t){const e={};if(!t.length)return e;const r=t[0].attributes??{};Object.assign(e,r),"sourceId"in r&&(e.sourceId=r.sourceId),"clipped"in r&&(e.clipped=r.clipped);const n=[],s=[],o=new Map,i=p=>{const u=p.bufferDistance,g=p.bufferUnit,h=p.weight;if(u==null&&g==null&&h==null)return;const d=`${u??""}|${g??""}|${h??""}`;o.has(d)||o.set(d,{distance:u,unit:g,weight:h})},l=new Map,a=(p,u,g,h)=>{if(!p)return;let d=l.get(p);d||(d={titles:new Set,values:new Set,weights:[]},l.set(p,d)),u&&d.titles.add(u),Array.isArray(g)&&g.forEach(v=>{v!=null&&d.values.add(String(v))}),typeof h=="number"&&!Number.isNaN(h)&&d.weights.push(h)};for(const p of t){const u=p.attributes??{},g=typeof u.weight=="number"?u.weight:void 0,h=u.layerTitle;h&&typeof g=="number"&&!Number.isNaN(g)&&(n.push(h),s.push(g)),i(u);const d=u.layerId,v=u.layerTitle,w=u.layerValues,A=u.value!=null?String(u.value):void 0,x=u.layerIds,z=u.layerTitles,q=Array.isArray(w)&&w.length?w:A?[A]:void 0;if(d&&a(d,v,q,g),Array.isArray(x))for(let F=0;F<x.length;F++){const re=x[F],oe=Array.isArray(z)?z[F]:void 0;a(re,oe,q,g)}}const f=[],c=[],m=[],y=[],b=Array.from(l.keys()).sort();for(const p of b){const u=l.get(p),g=Array.from(u.titles).sort(),h=Array.from(u.values);f.push(p),c.push(g.join(" / ")),m.push(h.join(", "));const d=u.weights.length>0?Math.min(...u.weights):0;y.push(d)}if(e.layerIds=f,e.layerTitles=c,e.layerValues=m,e.layerWeights=y,e.layerTitlesCsv=c.join(", "),e.memberLayerTitles=n,e.memberLayerWeights=s,o.size){const p=Array.from(o.values());if(e.bufferInfos=p,e.hasBuffer=!0,p.length===1){const u=p[0];u.distance!=null&&(e.bufferDistance=u.distance),u.unit!=null&&(e.bufferUnit=u.unit),u.weight!=null&&(e.weight=u.weight)}}else delete e.bufferDistance,delete e.bufferUnit,delete e.weight,delete e.bufferInfos,delete e.hasBuffer;return e}function Be(t,e){return!(t.xmax<e.xmin||t.xmin>e.xmax||t.ymax<e.ymin||t.ymin>e.ymax)}function gt(t,e){B(e,!0);/**
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
 */let r=W(e,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M12 18V5"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77"}]];j(t,D({name:"brain"},()=>r,{get iconNode(){return n},children:(s,o)=>{var i=M(),l=$(i);V(l,()=>e.children??O),G(s,i)},$$slots:{default:!0}})),R()}function yt(t,e){B(e,!0);/**
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
 */let r=W(e,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M3 5h.01"}],["path",{d:"M3 12h.01"}],["path",{d:"M3 19h.01"}],["path",{d:"M8 5h13"}],["path",{d:"M8 12h13"}],["path",{d:"M8 19h13"}]];j(t,D({name:"list"},()=>r,{get iconNode(){return n},children:(s,o)=>{var i=M(),l=$(i);V(l,()=>e.children??O),G(s,i)},$$slots:{default:!0}})),R()}function mt(t,e){B(e,!0);/**
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
 */let r=W(e,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"}],["path",{d:"M15 5.764v15"}],["path",{d:"M9 3.236v15"}]];j(t,D({name:"map"},()=>r,{get iconNode(){return n},children:(s,o)=>{var i=M(),l=$(i);V(l,()=>e.children??O),G(s,i)},$$slots:{default:!0}})),R()}function dt(t,e){if(!t||!t.map)throw new Error("MapView is not initialized");const r=new K({title:e,listMode:"show"}),n=new K({listMode:"hide"});return t.map.add(n),t.on("click",async s=>{if(!t)return;const i=(await t.hitTest(s)).results.find(a=>a.layer===r);if(!i){n.removeAll();return}const l=i.graphic;n.removeAll(),n.add(new P({geometry:l.geometry,symbol:{type:"simple-fill",color:[0,0,0,0],outline:{type:"simple-line",color:[255,255,0,1],width:3}}})),t.popup?.open({features:[l],location:s.mapPoint})}),t.map.add(r),r}async function ht(t){const{view:e,input:r,clipLayer:n,targetLayer:s,symbol:o,clipLayerValueField:i,bufferDistance:l,bufferUnit:a,sourceIds:f}=t;if(l<=0)return console.warn("clipPoints: bufferDistance must be greater than zero."),null;const c=r instanceof P?r.geometry:r;if(!c)return console.warn("clipPoints: no input geometry provided."),null;if(c.type!=="polygon")return console.warn("clipPoints: input geometry is not a polygon."),null;const m=c;if(n instanceof H){const g=n.geometryType;if(g!=="point"&&g!=="multipoint")return console.error("clipPoints: clipLayer must be point or multipoint."),null}const y=[],b=n.title||n.id||"clip-layer";if(i){const g=await Ce(n,m,i,l,a,e);if(!g.length)return console.info("clipPoints: no buffered geometries in clipLayer intersect the polygon for any value."),null;for(const{geometry:h,value:d}of g){if(!N(m,h)){console.error("clipPoints: spatial reference mismatch for clip value:",d);continue}const w=_(h,{clippedByPoints:!0,sourceIds:f,layerTitle:b,valueField:i,value:d,bufferDistance:l,bufferUnit:a},o);T(s,w,e),y.push(w)}return y.length?(e&&e.goTo(y.map(h=>h.geometry)).catch(h=>console.warn("goTo failed:",h)),y):null}const p=await Re(n,m,l,a,e);if(!p)return console.info("clipPoints: no buffered geometries in clipLayer intersect the polygon."),null;if(!N(m,p))return null;const u=_(p,{clippedByPoints:!0,sourceIds:f,bufferDistance:l,bufferUnit:a},o);return T(s,u,e),e&&e.goTo(p).catch(g=>console.warn("goTo failed:",g)),y.push(u),y}async function Re(t,e,r,n,s){const o=await Z(t,e,s);if(!o.length)return null;let i;try{i=X(o,[r],n?{unit:n}:void 0)}catch(a){return console.error("getUnionBufferedClipGeometryFromLayer: buffer failed",a),null}const l=i.filter(a=>!!a&&a.type==="polygon");return l.length?I(e,l):null}async function Ce(t,e,r,n,s,o){const i=await Y(t,e,r,o);if(!i.length)return[];const l=new Map;for(const c of i){const m=c.value==null?"__NULL__":String(c.value);let y=l.get(m);y||(y={value:c.value,geometries:[]},l.set(m,y)),y.geometries.push(c.geometry)}const a=[],f=[n];for(const c of l.values()){let m;try{m=X(c.geometries,f,s?{unit:s}:void 0)}catch(p){console.error("getGroupedBufferedClipGeometriesFromLayer: buffer failed for value:",c.value,p);continue}const y=m.filter(p=>!!p&&p.type==="polygon");if(!y.length)continue;const b=I(e,y);b&&a.push({geometry:b,value:c.value})}return a}async function bt(t){const{view:e,input:r,targetLayer:n,bufferDistance:s,bufferUnit:o,symbol:i,sourceIds:l}=t;if(s<=0)return console.warn("createPolygonBuffer: bufferDistance must be greater than zero."),null;const a=r instanceof P?r.geometry:r;if(!a)return console.warn("createPolygonBuffer: no input geometry provided."),null;if(a.type!=="polygon")return console.warn("createPolygonBuffer: input geometry is not a polygon."),null;const f=a,c=ge(f,s,o?{unit:o}:void 0);if(!c||c.type!=="polygon")return console.warn("createPolygonBuffer: buffer operation returned no polygon."),null;const m=E(c,f);let y;m&&m.type==="polygon"?y=m:(console.warn("createPolygonBuffer: difference operation returned no polygon; using outer buffer instead."),y=c);const b=new P({geometry:y,attributes:{polygonBuffer:!0,sourceIds:l,bufferDistance:s,bufferUnit:o},symbol:i||{type:"simple-fill",color:[0,255,255,.1],outline:{color:[0,255,255,1],width:2}}});return T(n,b,e),e&&e.goTo(y).catch(p=>console.warn("goTo failed:",p)),b}class te{id;constructor(e){this.id=e}}class Ie extends te{weight;buffers;constructor(e,r,n){super(e),this.weight=r,this.buffers=n}}class ne extends te{fieldName;constructor(e,r){super(e),this.fieldName=r}}class ke extends ne{fieldValues;constructor(e,r,n){super(e,r),this.fieldValues=n}}class Ue extends ne{weight;constructor(e,r,n){super(e,r),this.weight=n}}let S=null;async function vt(){return S||(S={analysisSettings:(await(await fetch(`${ye}/config/apps/ai-where-to-build/config.json`)).json()).analysisSettings.map(n=>Ee(n))},S)}function Ee(t){if("fieldValues"in t)return new ke(t.id,t.fieldName,t.fieldValues);if("fieldName"in t&&!("fieldValues"in t)){const o=t.weight??1;return new Ue(t.id,t.fieldName,o)}const e=t,r=e.weight??1,n=e.buffers??[];return new Ie(e.id,r,n)}export{gt as B,ke as E,ne as F,yt as L,ct as M,Ue as N,Ie as W,dt as a,vt as b,ft as c,bt as d,ht as e,mt as f,ut as g,pt as m};

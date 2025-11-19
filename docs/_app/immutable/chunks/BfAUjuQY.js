import{o as O}from"./CaJUWSoK.js";import{f as Y,g as Q,a as w,m as R,u as Z}from"./CLKpSLI2.js";import"./DsnmJJEf.js";import{p as S,f as g,a as j,v as y,X as I,c as U,n as N,r as G,a8 as D,W as q,T as ee}from"./CRVpP9yN.js";import{p as T,c as p,a as f,f as k,t as te}from"./gCR6Jetf.js";import{s as b}from"./B8kg81aS.js";import{p as m,i as H,r as M,s as z}from"./DB5kBrEO.js";import{I as V}from"./2D3lK8hZ.js";import{s as re}from"./DiKwmhhg.js";import{c as X}from"./t0KIPAFz.js";import{c as E}from"./BbxDsIno.js";import{a as $}from"./Dz9uIhWG.js";import{C as ae,c as ne,d as oe,e as se}from"./fBmlS_9u.js";import{b as W}from"./DJpdTDn8.js";class ie{#e;#t;constructor(e,r){this.#e=e,this.#t=Y(r)}get current(){return this.#t(),this.#e()}}const ce=/\(.+\)/,de=new Set(["all","print","screen","and","or","not","only"]);class We extends ie{constructor(e,r){let t=ce.test(e)||e.split(/[\s,]+/).some(c=>de.has(c.trim()))?e:`(${e})`;const a=window.matchMedia(t);super(()=>a.matches,c=>O(a,"change",c))}}var le=k("<div><!></div>");function fe(s,e){const r=T();S(e,!0);let t=m(e,"id",19,()=>Q(r)),a=m(e,"ref",15,null),c=m(e,"value",3,""),i=m(e,"forceMount",3,!1),l=M(e,["$$slots","$$events","$$legacy","id","ref","value","forceMount","children","child"]);const u=ae.create({id:w(()=>t()),ref:w(()=>a(),d=>a(d)),forceMount:w(()=>i()),value:w(()=>c())}),h=I(()=>R(l,u.props));var v=p(),_=g(v);{var n=d=>{var C=p(),x=g(C);b(x,()=>e.child,()=>({props:y(h)})),f(d,C)},o=d=>{var C=le();$(C,()=>({...y(h)}));var x=U(C);b(x,()=>e.children??N),G(C),f(d,C)};H(_,d=>{e.child?d(n):d(o,!1)})}f(s,v),j()}var ue=k("<div><!></div>");function ve(s,e){const r=T();S(e,!0);let t=m(e,"id",19,()=>Q(r)),a=m(e,"ref",15,null),c=M(e,["$$slots","$$events","$$legacy","id","ref","children","child"]);const i=ne.create({id:w(()=>t()),ref:w(()=>a(),n=>a(n))}),l=I(()=>R(c,i.props));var u=p(),h=g(u);{var v=n=>{var o=p(),d=g(o);b(d,()=>e.child,()=>({props:y(l)})),f(n,o)},_=n=>{var o=ue();$(o,()=>({...y(l)}));var d=U(o);b(d,()=>e.children??N),G(o),f(n,o)};H(h,n=>{e.child?n(v):n(_,!1)})}f(s,u),j()}var me=k("<div><!></div>"),ge=k('<div style="display: contents;"><!></div>');function he(s,e){const r=T();S(e,!0);let t=m(e,"id",19,()=>Q(r)),a=m(e,"ref",15,null),c=M(e,["$$slots","$$events","$$legacy","id","ref","children","child"]);const i=oe.create({id:w(()=>t()),ref:w(()=>a(),n=>a(n))}),l=I(()=>R(c,i.props));var u=ge(),h=U(u);{var v=n=>{var o=p(),d=g(o);b(d,()=>e.child,()=>({props:y(l)})),f(n,o)},_=n=>{var o=me();$(o,()=>({...y(l)}));var d=U(o);b(d,()=>e.children??N),G(o),f(n,o)};H(h,n=>{e.child?n(v):n(_,!1)})}G(u),f(s,u),j()}function Xe(s,e){S(e,!0);/**
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
 */let r=M(e,["$$slots","$$events","$$legacy"]);const t=[["path",{d:"m9 18 6-6-6-6"}]];V(s,z({name:"chevron-right"},()=>r,{get iconNode(){return t},children:(a,c)=>{var i=p(),l=g(i);b(l,()=>e.children??N),f(a,i)},$$slots:{default:!0}})),j()}function _e(s,e){S(e,!0);/**
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
 */let r=M(e,["$$slots","$$events","$$legacy"]);const t=[["path",{d:"m21 21-4.34-4.34"}],["circle",{cx:"11",cy:"11",r:"8"}]];V(s,z({name:"search"},()=>r,{get iconNode(){return t},children:(a,c)=>{var i=p(),l=g(i);b(l,()=>e.children??N),f(a,i)},$$slots:{default:!0}})),j()}function He(s,e){S(e,!0);/**
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
 */let r=M(e,["$$slots","$$events","$$legacy"]);const t=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];V(s,z({name:"x"},()=>r,{get iconNode(){return t},children:(a,c)=>{var i=p(),l=g(i);b(l,()=>e.children??N),f(a,i)},$$slots:{default:!0}})),j()}var pe=k("<!> <!>",1);function Qe(s,e){S(e,!0);let r=m(e,"ref",15,null),t=M(e,["$$slots","$$events","$$legacy","ref","class","children","heading","value"]);var a=p(),c=g(a);{let i=I(()=>E("text-foreground overflow-hidden p-1",e.class)),l=I(()=>e.value??e.heading??`----${Z()}`);X(c,()=>fe,(u,h)=>{h(u,z({"data-slot":"command-group",get class(){return y(i)},get value(){return y(l)}},()=>t,{get ref(){return r()},set ref(v){r(v)},children:(v,_)=>{var n=pe(),o=g(n);{var d=x=>{var A=p(),F=g(A);X(F,()=>ve,(J,K)=>{K(J,{class:"text-muted-foreground px-2 py-1.5 text-xs font-medium",children:(L,xe)=>{q();var B=te();ee(()=>re(B,e.heading)),f(L,B)},$$slots:{default:!0}})}),f(x,A)};H(o,x=>{e.heading&&x(d)})}var C=D(o,2);X(C,()=>he,(x,A)=>{A(x,{get children(){return e.children}})}),f(v,n)},$$slots:{default:!0}}))})}f(s,a),j()}var Ce=k('<div class="flex h-9 items-center gap-2 border-b pl-3 pr-8" data-slot="command-input-wrapper"><!> <!></div>');function Re(s,e){S(e,!0);let r=m(e,"ref",15,null),t=m(e,"value",15,""),a=M(e,["$$slots","$$events","$$legacy","ref","class","value"]);var c=Ce(),i=U(c);_e(i,{class:"size-4 shrink-0 opacity-50"});var l=D(i,2);{let u=I(()=>E("placeholder:text-muted-foreground outline-hidden flex h-10 w-full rounded-md bg-transparent py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50",e.class));X(l,()=>se,(h,v)=>{v(h,z({"data-slot":"command-input",get class(){return y(u)}},()=>a,{get ref(){return r()},set ref(_){r(_)},get value(){return t()},set value(_){t(_)}}))})}G(c),f(s,c),j()}let P=null;async function Te(){if(!P){P=await fetch(`${W}/config/app.json`).then(t=>t.json()),P||(P={});const s=await fetch(`${W}/config/catalogue/config.json`).then(t=>t.json());P.catalogueConfig=s;const e=await fetch(`${W}/config/services/uprn/config.json`).then(t=>t.json());P.serviceUprnConfig=e;const r=await fetch(`${W}/config/services/uprn2/config.json`).then(t=>t.json());P.serviceUprn2Config=r}return P}export{Xe as C,We as M,_e as S,He as X,Re as a,Qe as b,Te as g};

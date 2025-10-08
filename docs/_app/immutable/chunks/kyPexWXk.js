import"./DsnmJJEf.js";import{h as T,c as B,b as ae,F as O,au as oe,ak as ve,al as de,am as J,Q as H,P as L,i as x,L as ce,R as _e,e as F,s as he,g as me,V as re,o as Ee,d as K,ap as pe,aE as Z,aI as j,ao as Q,p as ne,aJ as P,aK as Y,aG as X,aL as y,aM as Ne,N as we,aN as ge,U as Te,aO as Ae,K as te,Z as se,a9 as Ce,aP as ie,aQ as Se,aR as be,E as Ie,aS as xe,Y as Me,X as ke,aT as Re,a4 as De,aj as Oe,a5 as He,a6 as Le,a as $,_ as We,a2 as Ve,a3 as Fe,aU as Pe,aV as ye}from"./CV9xP8QE.js";import{s as ze}from"./DXdp-obF.js";import{b as Ue}from"./DyJhJq2F.js";import{a as ee}from"./3Ll-hvqY.js";import{p as D,r as Ye}from"./C852zdK3.js";function qe(s,a){return a}function Be(s,a,e){for(var t=s.items,o=[],d=a.length,i=0;i<d;i++)ge(a[i].e,o,!0);var c=d>0&&o.length===0&&e!==null;if(c){var m=e.parentNode;Te(m),m.append(e),t.clear(),b(s,a[0].prev,a[d-1].next)}Ae(o,()=>{for(var l=0;l<d;l++){var _=a[l];c||(t.delete(_.k),b(s,_.prev,_.next)),X(_.e,!c)}})}function Ge(s,a,e,t,o,d=null){var i=s,c={flags:a,items:new Map,first:null},m=(a&ie)!==0;if(m){var l=s;i=T?H(te(l)):l.appendChild(K())}T&&B();var _=null,E=!1,h=new Map,A=oe(()=>{var p=e();return Ee(p)?p:p==null?[]:re(p)}),r,v;function f(){Ke(v,r,c,h,i,o,a,t,e),d!==null&&(r.length===0?_?Q(_):_=F(()=>d(i)):_!==null&&ne(_,()=>{_=null}))}ae(()=>{v??=se,r=O(A);var p=r.length;if(E&&p===0)return;E=p===0;let N=!1;if(T){var C=ve(i)===de;C!==(p===0)&&(i=J(),H(i),L(!1),N=!0)}if(T){for(var I=null,w,n=0;n<p;n++){if(x.nodeType===ce&&x.data===_e){i=x,N=!0,L(!1);break}var u=r[n],g=t(u,n);w=G(x,c,I,null,u,g,n,o,a,e),c.items.set(g,w),I=w}p>0&&H(J())}if(T)p===0&&d&&(_=F(()=>d(i)));else if(he()){var k=new Set,W=me;for(n=0;n<p;n+=1){u=r[n],g=t(u,n);var M=c.items.get(g)??h.get(g);M?(a&(y|P))!==0&&le(M,u,n,a):(w=G(null,c,null,null,u,g,n,o,a,e,!0),h.set(g,w)),k.add(g)}for(const[S,V]of c.items)k.has(S)||W.skipped_effects.add(V.e);W.add_callback(f)}else f();N&&L(!0),O(A)}),T&&(i=x)}function Ke(s,a,e,t,o,d,i,c,m){var l=(i&Se)!==0,_=(i&(y|P))!==0,E=a.length,h=e.items,A=e.first,r=A,v,f=null,p,N=[],C=[],I,w,n,u;if(l)for(u=0;u<E;u+=1)I=a[u],w=c(I,u),n=h.get(w),n!==void 0&&(n.a?.measure(),(p??=new Set).add(n));for(u=0;u<E;u+=1){if(I=a[u],w=c(I,u),n=h.get(w),n===void 0){var g=t.get(w);if(g!==void 0){t.delete(w),h.set(w,g);var k=f?f.next:r;b(e,f,g),b(e,g,k),q(g,k,o),f=g}else{var W=r?r.e.nodes_start:o;f=G(W,e,f,f===null?e.first:f.next,I,w,u,d,i,m)}h.set(w,f),N=[],C=[],r=f.next;continue}if(_&&le(n,I,u,i),(n.e.f&Y)!==0&&(Q(n.e),l&&(n.a?.unfix(),(p??=new Set).delete(n))),n!==r){if(v!==void 0&&v.has(n)){if(N.length<C.length){var M=C[0],S;f=M.prev;var V=N[0],z=N[N.length-1];for(S=0;S<N.length;S+=1)q(N[S],M,o);for(S=0;S<C.length;S+=1)v.delete(C[S]);b(e,V.prev,z.next),b(e,f,V),b(e,z,M),r=M,f=z,u-=1,N=[],C=[]}else v.delete(n),q(n,r,o),b(e,n.prev,n.next),b(e,n,f===null?e.first:f.next),b(e,f,n),f=n;continue}for(N=[],C=[];r!==null&&r.k!==w;)(r.e.f&Y)===0&&(v??=new Set).add(r),C.push(r),r=r.next;if(r===null)continue;n=r}N.push(n),f=n,r=n.next}if(r!==null||v!==void 0){for(var R=v===void 0?[]:re(v);r!==null;)(r.e.f&Y)===0&&R.push(r),r=r.next;var U=R.length;if(U>0){var fe=(i&ie)!==0&&E===0?o:null;if(l){for(u=0;u<U;u+=1)R[u].a?.measure();for(u=0;u<U;u+=1)R[u].a?.fix()}Be(e,R,fe)}}l&&Ce(()=>{if(p!==void 0)for(n of p)n.a?.apply()}),s.first=e.first&&e.first.e,s.last=f&&f.e;for(var ue of t.values())X(ue.e);t.clear()}function le(s,a,e,t){(t&y)!==0&&j(s.v,a),(t&P)!==0?j(s.i,e):s.i=e}function G(s,a,e,t,o,d,i,c,m,l,_){var E=(m&y)!==0,h=(m&Ne)===0,A=E?h?pe(o,!1,!1):Z(o):o,r=(m&P)===0?i:Z(i),v={i:r,v:A,k:d,a:null,e:null,prev:e,next:t};try{if(s===null){var f=document.createDocumentFragment();f.append(s=K())}return v.e=F(()=>c(s,A,r,l),T),v.e.prev=e&&e.e,v.e.next=t&&t.e,e===null?_||(a.first=v):(e.next=v,e.e.next=v.e),t!==null&&(t.prev=v,t.e.prev=v.e),v}finally{}}function q(s,a,e){for(var t=s.next?s.next.e.nodes_start:e,o=a?a.e.nodes_start:e,d=s.e.nodes_start;d!==null&&d!==t;){var i=we(d);o.before(d),d=i}}function b(s,a,e){a===null?s.first=e:(a.next=e,a.e.next=e&&e.e),e!==null&&(e.prev=a,e.e.prev=a&&a.e)}function Qe(s,a,e,t,o,d){let i=T;T&&B();var c,m,l=null;T&&x.nodeType===be&&(l=x,B());var _=T?x:s,E;ae(()=>{const h=a()||null;var A=xe;h!==c&&(E&&(h===null?ne(E,()=>{E=null,m=null}):h===m?Q(E):X(E)),h&&h!==m&&(E=F(()=>{if(l=T?l:document.createElementNS(A,h),Me(l,l),t){T&&Ue(h)&&l.append(document.createComment(""));var r=T?te(l):l.appendChild(K());T&&(r===null?L(!1):H(r)),t(l,r)}se.nodes_end=l,_.before(l)})),c=h,c&&(m=c))},Ie),i&&(L(!0),H(_))}/**
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
 */const Xe={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var Je=Re("<svg><!><!></svg>");function na(s,a){ke(a,!0);const e=D(a,"color",3,"currentColor"),t=D(a,"size",3,24),o=D(a,"strokeWidth",3,2),d=D(a,"absoluteStrokeWidth",3,!1),i=D(a,"iconNode",19,()=>[]),c=Ye(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var m=Je();ee(m,E=>({...Xe,...c,width:t(),height:t(),stroke:e(),"stroke-width":E,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>d()?Number(o())*24/Number(t()):o()]);var l=De(m);Ge(l,17,i,qe,(E,h)=>{var A=Pe(()=>ye(O(h),2));let r=()=>O(A)[0],v=()=>O(A)[1];var f=Ve(),p=Fe(f);Qe(p,r,!0,(N,C)=>{ee(N,()=>({...v()}))}),$(E,f)});var _=Oe(l);ze(_,()=>a.children??He),Le(m),$(s,m),We()}export{na as I,Qe as a,Ge as e,qe as i};

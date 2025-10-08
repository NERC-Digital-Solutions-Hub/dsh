import{ac as d,h as i,a8 as m,g as t,B as u,t as _,ad as h,X as b,a2 as y,a3 as $,a5 as S,a as g,_ as k}from"./CV9xP8QE.js";import"./DsnmJJEf.js";import{s as E}from"./DXdp-obF.js";import{s as w,r as x}from"./C852zdK3.js";import{I}from"./kyPexWXk.js";function W(e,a,l=a){var o=new WeakSet;d(e,"input",async s=>{var r=s?e.defaultValue:e.value;if(r=f(e)?v(r):r,l(r),t!==null&&o.add(t),await u(),r!==(r=a())){var n=e.selectionStart,c=e.selectionEnd;e.value=r??"",c!==null&&(e.selectionStart=n,e.selectionEnd=Math.min(c,e.value.length))}}),(i&&e.defaultValue!==e.value||_(a)==null&&e.value)&&(l(f(e)?v(e.value):e.value),t!==null&&o.add(t)),m(()=>{var s=a();if(e===document.activeElement){var r=h??t;if(o.has(r))return}f(e)&&s===v(e.value)||e.type==="date"&&!s&&!e.value||s!==e.value&&(e.value=s??"")})}function f(e){var a=e.type;return a==="number"||a==="range"}function v(e){return e===""?null:+e}function X(e,a,l=a){d(e,"change",()=>{l(e.files)}),i&&e.files&&l(e.files),m(()=>{e.files=a()})}function j(e,a){b(a,!0);/**
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
 */let l=x(a,["$$slots","$$events","$$legacy"]);const o=[["path",{d:"m21 21-4.34-4.34"}],["circle",{cx:"11",cy:"11",r:"8"}]];I(e,w({name:"search"},()=>l,{get iconNode(){return o},children:(s,r)=>{var n=y(),c=$(n);E(c,()=>a.children??S),g(s,n)},$$slots:{default:!0}})),k()}export{j as S,W as a,X as b};

import{c as k,a as l,f as z}from"./coOZIrlZ.js";import{p as w,f as c,n as P,a as j,a4 as D,c as y,r as _,A as E}from"./Cv6wsIHX.js";import{t as F,I as G,s as C,T as H,e as J}from"./C5P9LRAx.js";import{s as K,r as L,p as t,i as O}from"./BZm1dqWt.js";import{c as Q,a as R}from"./CNhtnZDT.js";import{b as S}from"./BlRPFoB8.js";function U(...s){return F(Q(s))}function W(s,e){w(e,!0);/**
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
 */let o=L(e,["$$slots","$$events","$$legacy"]);const f=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56"}]];G(s,K({name:"loader-circle"},()=>o,{get iconNode(){return f},children:(u,i)=>{var n=k(),r=c(n);C(r,()=>e.children??P),l(u,n)},$$slots:{default:!0}})),j()}const X=H({base:"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md text-sm font-medium whitespace-nowrap outline-hidden transition-all select-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs",destructive:"bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 text-white shadow-2xs",outline:"bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 border shadow-2xs",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-2xs",ghost:"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2 has-[>svg]:px-3",sm:"h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",lg:"h-10 rounded-md px-6 has-[>svg]:px-4",icon:"size-9"}},defaultVariants:{variant:"default",size:"default"}});var Y=z('<div class="absolute flex size-full place-items-center justify-center bg-inherit"><div class="flex animate-spin place-items-center justify-center"><!></div></div> <span class="sr-only">Loading</span>',1),Z=z("<!> <!>",1);function re(s,e){w(e,!0);let o=t(e,"ref",15,null),f=t(e,"variant",3,"default"),u=t(e,"size",3,"default"),i=t(e,"href",3,void 0),n=t(e,"type",3,"button"),r=t(e,"loading",7,!1),d=t(e,"disabled",3,!1),B=t(e,"tabindex",3,0),I=L(e,["$$slots","$$events","$$legacy","ref","variant","size","href","type","loading","disabled","tabindex","onclick","onClickPromise","class","children"]);var v=k(),M=c(v);J(M,()=>i()?"a":"button",!1,(g,N)=>{S(g,a=>o(a),()=>o());var V=async a=>{e.onclick?.(a),n()!==void 0&&e.onClickPromise&&(r(!0),await e.onClickPromise(a),r(!1))};R(g,a=>({...I,"data-slot":"button",type:i()?void 0:n(),href:i()&&!d()?i():void 0,disabled:i()?void 0:d()||r(),"aria-disabled":i()?d():void 0,role:i()&&d()?"link":void 0,tabindex:i()&&d()?-1:B(),class:a,onclick:V}),[()=>U(X({variant:f(),size:u()}),e.class)]);var b=Z(),h=c(b);{var A=a=>{var m=Y(),x=c(m),p=y(x),q=y(p);W(q,{class:"size-4"}),_(p),_(x),E(2),l(a,m)};O(h,a=>{n()!==void 0&&r()&&a(A)})}var T=D(h,2);C(T,()=>e.children??P),l(N,b)}),l(s,v),j()}export{re as B,W as L,X as b,U as c};

import"./DsnmJJEf.js";import{p as k,f as l,n as z,a as w,a8 as A,c as y,r as _,X as D}from"./C1YmX2UH.js";import{c as P,a as c,f as j}from"./BMeCtLyR.js";import{t as E,s as C}from"./P1xUTngh.js";import{s as F,r as L,p as r,i as G}from"./MYJGKh80.js";import{I as H,T as J,e as K}from"./D3jE-Yfs.js";import{c as O,a as Q}from"./Dhg0s-2V.js";import{b as R}from"./DHTNoGoN.js";function S(...s){return E(O(s))}function U(s,e){k(e,!0);/**
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
 */let o=L(e,["$$slots","$$events","$$legacy"]);const f=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56"}]];H(s,F({name:"loader-circle"},()=>o,{get iconNode(){return f},children:(u,i)=>{var t=P(),n=l(t);C(n,()=>e.children??z),c(u,t)},$$slots:{default:!0}})),w()}const W=J({base:"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md text-sm font-medium whitespace-nowrap outline-hidden transition-all select-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs",destructive:"bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 text-white shadow-2xs",outline:"bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 border shadow-2xs",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-2xs",ghost:"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2 has-[>svg]:px-3",sm:"h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",lg:"h-10 rounded-md px-6 has-[>svg]:px-4",icon:"size-9"}},defaultVariants:{variant:"default",size:"default"}});var Y=j('<div class="absolute flex size-full place-items-center justify-center bg-inherit"><div class="flex animate-spin place-items-center justify-center"><!></div></div> <span class="sr-only">Loading</span>',1),Z=j("<!> <!>",1);function de(s,e){k(e,!0);let o=r(e,"ref",15,null),f=r(e,"variant",3,"default"),u=r(e,"size",3,"default"),i=r(e,"href",3,void 0),t=r(e,"type",3,"button"),n=r(e,"loading",7,!1),d=r(e,"disabled",3,!1),B=r(e,"tabindex",3,0),I=L(e,["$$slots","$$events","$$legacy","ref","variant","size","href","type","loading","disabled","tabindex","onclick","onClickPromise","class","children"]);var v=P(),M=l(v);K(M,()=>i()?"a":"button",!1,(g,N)=>{R(g,a=>o(a),()=>o());var V=async a=>{e.onclick?.(a),t()!==void 0&&e.onClickPromise&&(n(!0),await e.onClickPromise(a),n(!1))};Q(g,a=>({...I,"data-slot":"button",type:i()?void 0:t(),href:i()&&!d()?i():void 0,disabled:i()?void 0:d()||n(),"aria-disabled":i()?d():void 0,role:i()&&d()?"link":void 0,tabindex:i()&&d()?-1:B(),class:a,onclick:V}),[()=>S(W({variant:f(),size:u()}),e.class)]);var b=Z(),h=l(b);{var T=a=>{var m=Y(),p=l(m),x=y(p),q=y(x);U(q,{class:"size-4"}),_(x),_(p),D(2),c(a,m)};G(h,a=>{t()!==void 0&&n()&&a(T)})}var X=A(h,2);C(X,()=>e.children??z),c(N,b)}),c(s,v),w()}export{de as B,U as L,W as b,S as c};

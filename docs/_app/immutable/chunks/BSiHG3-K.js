const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./BH1sdSKI.js","./DFoMxmW4.js","./DwWpeHsS.js","./CeRhhlE3.js","./PPVm8Dsz.js","./bnayRBMH.js","./Cgb6qxNH.js","./CqJuLt4C.js","./DQOO6RKE.js","./DNogqiqR.js","./6W6J17CP.js","./v5xyD8FI.js","./CAYuU9oo.js","./CFn2K6-l.js","./Y_0EfhRu.js","./DdbdneQ1.js","./YTLdojGG.js","./BpsOcTIc.js","./pl312233.js","./BVgVoZ7V.js","./BZ4zAYZa.js","./Cx7JF698.js","./B2_jlIup.js","./CLcGMPRo.js","./aQ5IuZRd.js","./Bpx4oPx_.js","./CKc66y4x.js","./B5bJgrnA.js","./BeiFfq_I.js","./BV6LrWRH.js","./B87vTgcy.js","./CBhtnfFj.js","./D8QeVQ97.js","./C2Vi5wSo.js","./nFlxMGaX.js","./CDwolY-d.js","./DAYCaCWY.js","./BR6OtayF.js","./D8oIatBz.js","./gnYV512y.js","./DCOPP4zh.js","./BrbL6HZH.js","./C3R-oROr.js","./HYjb2XVQ.js","./BfZbt_DV.js","./BLyltQyJ.js","./DP4rpmC8.js","./B-KWoBDo.js","./DswpuqiR.js","./BKo2foNY.js","./jb3K7d6P.js","./COb3hz4f.js"])))=>i.map(i=>d[i]);
import{b as qt,a as Nt}from"./CeRhhlE3.js";import{m as kt,t as Wt,u as Yt,h as wt}from"./B2_jlIup.js";import{p as bt,b3 as Xt,b4 as Kt,b5 as Qt,aq as Zt}from"./6W6J17CP.js";import{_ as Jt,u as eo,i as yt,aU as to,aV as oo,aK as io,n as F,t as Je,r as Pt,aW as so,ac as We,U as $t,a as St,a2 as no}from"./DFoMxmW4.js";import{t as ao,m as ro,b as lo,s as co,c as uo,r as fo,u as et,n as Ve,e as tt}from"./BVgVoZ7V.js";import{$ as po}from"./CBhtnfFj.js";import{u as ho}from"./CvSUiumQ.js";import{t as Ye}from"./D8QeVQ97.js";import{o as vo,x as mo}from"./TjNJrFcN.js";import{c as W,_ as oe,A as L,o as ie,s as N,g as G,u as q,E as re,P as Xe,r as we,p as zt,R as go,N as xo}from"./YTLdojGG.js";import{r as H,n as Y,t as ot}from"./WCVSSNPR.js";import{i as wo,a as it,n as X,m as K,s as Ot,f as bo,d as yo,e as Ke,r as Be,b as Ae,c as Po,p as $o,w as Ct,g as At,h as So,j as zo,k as Mt,l as Oo,o as Co,u as Ao,q as Mo,t as Do,v as st,x as Fe,y as nt,z as Vo,A as te,B as jo,C as To,D as Fo,E as _o,F as Ro,G as Eo,H as Dt,I as Uo,J as E,K as Io,L as _e,M as Ho,N as Bo,O as Go,P as Lo,Q as qo,R as No,T as ko,U as Wo,V as at,W as Yo,X as rt,Y as lt,Z as Xo,_ as Ko}from"./CqJuLt4C.js";import{A as Qo,U as Vt}from"./BpsOcTIc.js";import{j as Zo,U as Jo,K as ei}from"./CDwolY-d.js";import{k as ti}from"./Cx7JF698.js";import{n as Qe,r as jt}from"./Cgb6qxNH.js";import{_ as U}from"./DwWpeHsS.js";import{t as M}from"./DAYCaCWY.js";import{s as Tt,g as oi}from"./pl312233.js";import{r as ii,s as si}from"./bnayRBMH.js";import{t as $,n as I}from"./B5bJgrnA.js";import{s as ni}from"./DP4rpmC8.js";import{_ as ai}from"./PPVm8Dsz.js";import{Q as Ft,t as ri}from"./DswpuqiR.js";import{_ as ct}from"./DQOO6RKE.js";import{T as li,d as ci,c as ui}from"./CKc66y4x.js";import{t as fi}from"./BfZbt_DV.js";function Os(o,e){if(o.type==="point")return ee(o,e,!1);if(vo(o))switch(o.type){case"extent":return ee(o.center,e,!1);case"polygon":return ee(ft(o),e,!1);case"polyline":return ee(ut(o),e,!0);case"mesh":return ee(ho(o.vertexSpace,o.spatialReference)??o.extent.center,e,!1);case"multipoint":return}else switch(o.type){case"extent":return ee(pi(o),e,!0);case"polygon":return ee(ft(o),e,!0);case"polyline":return ee(ut(o),e,!0);case"multipoint":return}}function ut(o){const e=o.paths[0];if(!e||e.length===0)return null;const i=to(e,oo(e)/2);return Ye(i[0],i[1],i[2],o.spatialReference)}function pi(o){return Ye(.5*(o.xmax+o.xmin),.5*(o.ymax+o.ymin),o.zmin!=null&&o.zmax!=null&&isFinite(o.zmin)&&isFinite(o.zmax)?.5*(o.zmax+o.zmin):void 0,o.spatialReference)}function ft(o){const e=o.rings[0];if(!e||e.length===0)return null;const i=io(o.rings,!!o.hasZ);return Ye(i[0],i[1],i[2],o.spatialReference)}function ee(o,e,i){const t=i?o:mo(o);return e&&o?po(o,t,e)?t:null:t}function Cs(o,e,i,t=0){if(o){e||(e=yt());const s=o;let a=.5*s.width*(i-1),n=.5*s.height*(i-1);return s.width<1e-7*s.height?a+=n/20:s.height<1e-7*s.width&&(n+=a/20),co(e,s.xmin-a-t,s.ymin-n-t,s.xmax+a+t,s.ymax+n+t),e}return null}function As(o,e,i=null){const t=ao(lo);return o!=null&&(t[0]=o[0],t[1]=o[1],t[2]=o[2],o.length>3&&(t[3]=o[3])),e!=null&&(t[3]=e),i&&ro(t,t,i),t}function Ms(o=Jt,e,i,t=1){const s=new Array(3);if(e==null||i==null)s[0]=1,s[1]=1,s[2]=1;else{let a,n=0;for(let r=2;r>=0;r--){const l=o[r],c=l!=null,u=r===0&&!a&&!c,p=i[r];let h;l==="symbol-value"||u?h=p!==0?e[r]/p:1:c&&l!=="proportional"&&isFinite(l)&&(h=p!==0?l/p:1),h!=null&&(s[r]=h,a=h,n=Math.max(n,Math.abs(h)))}for(let r=2;r>=0;r--)s[r]==null?s[r]=a:s[r]===0&&(s[r]=.001*n)}for(let a=2;a>=0;a--)s[a]/=t;return eo(s)}function di(o){return o.isPrimitive!=null}function Ds(o){return hi(di(o)?[o.width,o.depth,o.height]:o)?null:"Symbol sizes may not be negative values"}function hi(o){const e=i=>i==null||i>=0;return Array.isArray(o)?o.every(e):e(o)}function Vs(o,e,i,t=bt()){return o&&kt(t,t,-o/180*Math.PI),e&&Wt(t,t,e/180*Math.PI),i&&Yt(t,t,i/180*Math.PI),t}function js(o,e,i){if(i.minDemResolution!=null)return i.minDemResolution;const t=qt(e),s=Xt(o)*t,a=Kt(o)*t,n=Qt(o)*(e.isGeographic?1:t);return s===0&&a===0&&n===0?i.minDemResolutionForPoints:.01*Math.max(s,a,n)}function pt(o,e){const i=o[e],t=o[e+1],s=o[e+2];return Math.sqrt(i*i+t*t+s*s)}function vi(o,e){const i=o[e],t=o[e+1],s=o[e+2],a=1/Math.sqrt(i*i+t*t+s*s);o[e]*=a,o[e+1]*=a,o[e+2]*=a}function dt(o,e,i){o[e]*=i,o[e+1]*=i,o[e+2]*=i}function mi(o,e,i,t,s,a=e){(s=s||o)[a]=o[e]+i[t],s[a+1]=o[e+1]+i[t+1],s[a+2]=o[e+2]+i[t+2]}function gi(){return ht??=xi(),ht}function xi(){const i=new M([0,0,0,255,255,0,255,255],[0,1,2,3],2,!0);return new wo([["uv0",i]])}let ht=null;const Re=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],wi=[0,0,1,-1,0,0,1,0,0,0,-1,0,0,1,0,0,0,-1],bi=[0,0,1,0,1,1,0,1],yi=[0,1,2,2,3,0,4,0,3,3,7,4,1,5,6,6,2,1,1,0,4,4,5,1,3,2,6,6,7,3,5,4,7,7,6,5],_t=new Array(36);for(let o=0;o<6;o++)for(let e=0;e<6;e++)_t[6*o+e]=o;const ne=new Array(36);for(let o=0;o<6;o++)ne[6*o]=0,ne[6*o+1]=1,ne[6*o+2]=2,ne[6*o+3]=2,ne[6*o+4]=3,ne[6*o+5]=0;function Ts(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(24);for(let t=0;t<8;t++)i[3*t]=Re[t][0]*e[0],i[3*t+1]=Re[t][1]*e[1],i[3*t+2]=Re[t][2]*e[2];return new K(o,[["position",new M(i,yi,3,!0)],["normal",new M(wi,_t,3)],["uv0",new M(bi,ne,2)]])}const Ee=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],[0,-.5,0],[0,.5,0]],Pi=[0,1,-1,1,1,0,0,1,1,-1,1,0,0,-1,-1,1,-1,0,0,-1,1,-1,-1,0],$i=[5,1,0,5,2,1,5,3,2,5,0,3,4,0,1,4,1,2,4,2,3,4,3,0],Si=[0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7];function Fs(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(18);for(let t=0;t<6;t++)i[3*t]=Ee[t][0]*e[0],i[3*t+1]=Ee[t][1]*e[1],i[3*t+2]=Ee[t][2]*e[2];return new K(o,[["position",new M(i,$i,3,!0)],["normal",new M(Pi,Si,3)]])}const Pe=H(-.5,0,-.5),$e=H(.5,0,-.5),Se=H(0,0,.5),ze=H(0,.5,0),ce=Y(),ue=Y(),pe=Y(),de=Y(),he=Y();W(ce,Pe,ze),W(ue,Pe,$e),oe(pe,ce,ue),L(pe,pe),W(ce,$e,ze),W(ue,$e,Se),oe(de,ce,ue),L(de,de),W(ce,Se,ze),W(ue,Se,Pe),oe(he,ce,ue),L(he,he);const Ue=[Pe,$e,Se,ze],zi=[0,-1,0,pe[0],pe[1],pe[2],de[0],de[1],de[2],he[0],he[1],he[2]],Oi=[0,1,2,3,1,0,3,2,1,3,0,2],Ci=[0,0,0,1,1,1,2,2,2,3,3,3];function _s(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(12);for(let t=0;t<4;t++)i[3*t]=Ue[t][0]*e[0],i[3*t+1]=Ue[t][1]*e[1],i[3*t+2]=Ue[t][2]*e[2];return new K(o,[["position",new M(i,Oi,3,!0)],["normal",new M(zi,Ci,3)]])}function Rs(o,e,i,t,s={uv:!0}){const a=-Math.PI,n=2*Math.PI,r=-Math.PI/2,l=Math.PI,c=Math.max(3,Math.floor(i)),u=Math.max(2,Math.floor(t)),p=(c+1)*(u+1),h=X(3*p),b=X(3*p),y=X(2*p),g=[];let d=0;for(let x=0;x<=u;x++){const C=[],f=x/u,z=r+f*l,O=Math.cos(z);for(let P=0;P<=c;P++){const B=P/c,w=a+B*n,j=Math.cos(w)*O,V=Math.sin(z),Q=-Math.sin(w)*O;h[3*d]=j*e,h[3*d+1]=V*e,h[3*d+2]=Q*e,b[3*d]=j,b[3*d+1]=V,b[3*d+2]=Q,y[2*d]=B,y[2*d+1]=f,C.push(d),++d}g.push(C)}const v=new Array;for(let x=0;x<u;x++)for(let C=0;C<c;C++){const f=g[x][C],z=g[x][C+1],O=g[x+1][C+1],P=g[x+1][C];x===0?(v.push(f),v.push(O),v.push(P)):x===u-1?(v.push(f),v.push(z),v.push(O)):(v.push(f),v.push(z),v.push(O),v.push(O),v.push(P),v.push(f))}const m=[["position",new M(h,v,3,!0)],["normal",new M(b,v,3,!0)]];return s.uv&&m.push(["uv0",new M(y,v,2,!0)]),s.offset&&(m[0][0]="offset",m.push(["position",new M(Float64Array.from(s.offset),Vt(v.length),3,!0)])),new K(o,m)}function Es(o,e,i,t){const s=Ai(e,i);return new K(o,s)}function Ai(o,e,i){let t,s;t=[0,-1,0,1,0,0,0,0,1,-1,0,0,0,0,-1,0,1,0],s=[0,1,2,0,2,3,0,3,4,0,4,1,1,5,2,2,5,3,3,5,4,4,5,1];for(let l=0;l<t.length;l+=3)dt(t,l,o/pt(t,l));let a={};function n(l,c){l>c&&([l,c]=[c,l]);const u=l.toString()+"."+c.toString();if(a[u])return a[u];let p=t.length;return t.length+=3,mi(t,3*l,t,3*c,t,p),dt(t,p,o/pt(t,p)),p/=3,a[u]=p,p}for(let l=0;l<e;l++){const c=s.length,u=new Array(4*c);for(let p=0;p<c;p+=3){const h=s[p],b=s[p+1],y=s[p+2],g=n(h,b),d=n(b,y),v=n(y,h),m=4*p;u[m]=h,u[m+1]=g,u[m+2]=v,u[m+3]=b,u[m+4]=d,u[m+5]=g,u[m+6]=y,u[m+7]=v,u[m+8]=d,u[m+9]=g,u[m+10]=d,u[m+11]=v}s=u,a={}}const r=it(t);for(let l=0;l<r.length;l+=3)vi(r,l);return[["position",new M(it(t),s,3,!0)],["normal",new M(r,s,3,!0)]]}function Us(o,{normal:e,position:i,color:t,rotation:s,size:a,centerOffsetAndDistance:n,uvi:r,featureAttribute:l,olidColor:c=null}={}){const u=i?Je(i):F(),p=e?Je(e):Pt(0,0,1),h=t?[t[0],t[1],t[2],t.length>3?t[3]:255]:[255,255,255,255],b=a!=null&&a.length===2?a:[1,1],y=s!=null?[s]:[0],g=Vt(1),d=[["position",new M(u,g,3,!0)],["normal",new M(p,g,3,!0)],["color",new M(h,g,4,!0)],["size",new M(b,g,2)],["rotation",new M(y,g,1,!0)]];if(r&&d.push(["uvi",new M(r,g,r.length)]),n!=null){const v=[n[0],n[1],n[2],n[3]];d.push(["centerOffsetAndDistance",new M(v,g,4)])}if(l){const v=[l[0],l[1],l[2],l[3]];d.push(["featureAttribute",new M(v,g,4)])}return new K(o,d,null,1,c,void 0,gi())}function Mi(o,e,i,t,s=!0,a=!0){let n=0;const r=e,l=o;let c=H(0,n,0),u=H(0,n+l,0),p=H(0,-1,0),h=H(0,1,0);t&&(n=l,u=H(0,0,0),c=H(0,n,0),p=H(0,1,0),h=H(0,-1,0));const b=[u,c],y=[p,h],g=i+2,d=Math.sqrt(l*l+r*r);if(t)for(let f=i-1;f>=0;f--){const z=f*(2*Math.PI/i),O=H(Math.cos(z)*r,n,Math.sin(z)*r);b.push(O);const P=H(l*Math.cos(z)/d,-r/d,l*Math.sin(z)/d);y.push(P)}else for(let f=0;f<i;f++){const z=f*(2*Math.PI/i),O=H(Math.cos(z)*r,n,Math.sin(z)*r);b.push(O);const P=H(l*Math.cos(z)/d,r/d,l*Math.sin(z)/d);y.push(P)}const v=new Array,m=new Array;if(s){for(let f=3;f<b.length;f++)v.push(1),v.push(f-1),v.push(f),m.push(0),m.push(0),m.push(0);v.push(b.length-1),v.push(2),v.push(1),m.push(0),m.push(0),m.push(0)}if(a){for(let f=3;f<b.length;f++)v.push(f),v.push(f-1),v.push(0),m.push(f),m.push(f-1),m.push(1);v.push(0),v.push(2),v.push(b.length-1),m.push(1),m.push(2),m.push(y.length-1)}const x=X(3*g);for(let f=0;f<g;f++)x[3*f]=b[f][0],x[3*f+1]=b[f][1],x[3*f+2]=b[f][2];const C=X(3*g);for(let f=0;f<g;f++)C[3*f]=y[f][0],C[3*f+1]=y[f][1],C[3*f+2]=y[f][2];return[["position",new M(x,v,3,!0)],["normal",new M(C,m,3,!0)]]}function Is(o,e,i,t,s,a=!0,n=!0){return new K(o,Mi(e,i,t,s,a,n))}function Hs(o,e,i,t,s,a,n){const r=s?ot(s):H(1,0,0),l=a?ot(a):H(0,0,0);n??=!0;const c=Y();L(c,r);const u=Y();G(u,c,Math.abs(e));const p=Y();G(p,u,-.5),q(p,p,l);const h=H(0,1,0);Math.abs(1-Xe(c,h))<.2&&ie(h,0,0,1);const b=Y();oe(b,c,h),L(b,b),oe(h,b,c);const y=2*t+(n?2:0),g=t+(n?2:0),d=X(3*y),v=X(3*g),m=X(2*y),x=new Array(3*t*(n?4:2)),C=new Array(3*t*(n?4:2));n&&(d[3*(y-2)]=p[0],d[3*(y-2)+1]=p[1],d[3*(y-2)+2]=p[2],m[2*(y-2)]=0,m[2*(y-2)+1]=0,d[3*(y-1)]=d[3*(y-2)]+u[0],d[3*(y-1)+1]=d[3*(y-2)+1]+u[1],d[3*(y-1)+2]=d[3*(y-2)+2]+u[2],m[2*(y-1)]=1,m[2*(y-1)+1]=1,v[3*(g-2)]=-c[0],v[3*(g-2)+1]=-c[1],v[3*(g-2)+2]=-c[2],v[3*(g-1)]=c[0],v[3*(g-1)+1]=c[1],v[3*(g-1)+2]=c[2]);const f=(w,j,V)=>{x[w]=j,C[w]=V};let z=0;const O=Y(),P=Y();for(let w=0;w<t;w++){const j=w*(2*Math.PI/t);G(O,h,Math.sin(j)),G(P,b,Math.cos(j)),q(O,O,P),v[3*w]=O[0],v[3*w+1]=O[1],v[3*w+2]=O[2],G(O,O,i),q(O,O,p),d[3*w]=O[0],d[3*w+1]=O[1],d[3*w+2]=O[2],m[2*w]=w/t,m[2*w+1]=0,d[3*(w+t)]=d[3*w]+u[0],d[3*(w+t)+1]=d[3*w+1]+u[1],d[3*(w+t)+2]=d[3*w+2]+u[2],m[2*(w+t)]=w/t,m[2*w+1]=1;const V=(w+1)%t;f(z++,w,w),f(z++,w+t,w),f(z++,V,V),f(z++,V,V),f(z++,w+t,w),f(z++,V+t,V)}if(n){for(let w=0;w<t;w++){const j=(w+1)%t;f(z++,y-2,g-2),f(z++,w,g-2),f(z++,j,g-2)}for(let w=0;w<t;w++){const j=(w+1)%t;f(z++,w+t,g-1),f(z++,y-1,g-1),f(z++,j+t,g-1)}}const B=[["position",new M(d,x,3,!0)],["normal",new M(v,C,3,!0)],["uv0",new M(m,x,2,!0)]];return new K(o,B)}function Bs(o,e,i,t,s,a){t=t||10,s=s==null||s,Tt(e.length>1);const n=[[0,0,0]],r=[],l=[];for(let c=0;c<t;c++){r.push([0,-c-1,-(c+1)%t-1]);const u=c/t*2*Math.PI;l.push([Math.cos(u)*i,Math.sin(u)*i])}return Di(o,l,e,n,r,s,a)}function Di(o,e,i,t,s,a,n=H(0,0,0)){const r=e.length,l=X(i.length*r*3+(6*t.length||0)),c=X(i.length*r*3+(t?6:0)),u=new Array,p=new Array;let h=0,b=0;const y=F(),g=F(),d=F(),v=F(),m=F(),x=F(),C=F(),f=F(),z=F(),O=F(),P=F(),B=F(),w=F(),j=Zo();ie(z,0,1,0),W(g,i[1],i[0]),L(g,g),a?(q(f,i[0],n),L(d,f)):ie(d,0,0,1),vt(g,d,z,z,m,d,mt),N(v,d),N(B,m);for(let S=0;S<t.length;S++)G(x,m,t[S][0]),G(f,d,t[S][2]),q(x,x,f),q(x,x,i[0]),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2];c[b++]=-g[0],c[b++]=-g[1],c[b++]=-g[2];for(let S=0;S<s.length;S++)u.push(s[S][0]>0?s[S][0]:-s[S][0]-1+t.length),u.push(s[S][1]>0?s[S][1]:-s[S][1]-1+t.length),u.push(s[S][2]>0?s[S][2]:-s[S][2]-1+t.length),p.push(0),p.push(0),p.push(0);let V=t.length;const Q=t.length-1;for(let S=0;S<i.length;S++){let me=!1;S>0&&(N(y,g),S<i.length-1?(W(g,i[S+1],i[S]),L(g,g)):me=!0,q(O,y,g),L(O,O),q(P,i[S-1],v),Jo(i[S],O,j),ei(j,ti(P,y),f)?(W(f,f,i[S]),L(d,f),oe(m,O,d),L(m,m)):vt(O,v,B,z,m,d,mt),N(v,d),N(B,m)),a&&(q(f,i[S],n),L(w,f));for(let J=0;J<r;J++)if(G(x,m,e[J][0]),G(f,d,e[J][1]),q(x,x,f),L(C,x),c[b++]=C[0],c[b++]=C[1],c[b++]=C[2],q(x,x,i[S]),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2],!me){const je=(J+1)%r;u.push(V+J),u.push(V+r+J),u.push(V+je),u.push(V+je),u.push(V+r+J),u.push(V+r+je);for(let Te=0;Te<6;Te++){const Lt=u.length-6;p.push(u[Lt+Te]-Q)}}V+=r}const le=i[i.length-1];for(let S=0;S<t.length;S++)G(x,m,t[S][0]),G(f,d,t[S][1]),q(x,x,f),q(x,x,le),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2];const Z=b/3;c[b++]=g[0],c[b++]=g[1],c[b++]=g[2];const k=V-r;for(let S=0;S<s.length;S++)u.push(s[S][0]>=0?V+s[S][0]:-s[S][0]-1+k),u.push(s[S][2]>=0?V+s[S][2]:-s[S][2]-1+k),u.push(s[S][1]>=0?V+s[S][1]:-s[S][1]-1+k),p.push(Z),p.push(Z),p.push(Z);const se=[["position",new M(l,u,3,!0)],["normal",new M(c,p,3,!0)]];return new K(o,se)}function Gs(o,e,i,t,s){const a=Zt(3*e.length),n=new Array(2*(e.length-1));let r=0,l=0;for(let u=0;u<e.length;u++){for(let p=0;p<3;p++)a[r++]=e[u][p];u>0&&(n[l++]=u-1,n[l++]=u)}const c=[["position",new M(a,n,3,!0)]];if(i&&i.length===e.length&&i[0].length===3){const u=X(3*i.length);let p=0;for(let h=0;h<e.length;h++)for(let b=0;b<3;b++)u[p++]=i[h][b];c.push(["normal",new M(u,n,3,!0)])}return t&&c.push(["color",new M(t,Qo(t.length/4),4)]),new K(o,c,null,2)}function Ls(o,e,i,t,s,a=0){const n=new Array(18),r=[[-i,a,s/2],[t,a,s/2],[0,e+a,s/2],[-i,a,-s/2],[t,a,-s/2],[0,e+a,-s/2]],l=[0,1,2,3,0,2,2,5,3,1,4,5,5,2,1,1,0,3,3,4,1,4,3,5];for(let c=0;c<6;c++)n[3*c]=r[c][0],n[3*c+1]=r[c][1],n[3*c+2]=r[c][2];return new K(o,[["position",new M(n,l,3,!0)]])}function qs(o,e){const i=o.getMutableAttribute("position").data;for(let t=0;t<i.length;t+=3){const s=i[t],a=i[t+1],n=i[t+2];ie(fe,s,a,n),re(fe,fe,e),i[t]=fe[0],i[t+1]=fe[1],i[t+2]=fe[2]}}function Ns(o,e=o){const i=o.attributes,t=i.get("position").data,s=i.get("normal").data;if(s){const a=e.getMutableAttribute("normal").data;for(let n=0;n<s.length;n+=3){const r=s[n+1];a[n+1]=-s[n+2],a[n+2]=r}}if(t){const a=e.getMutableAttribute("position").data;for(let n=0;n<t.length;n+=3){const r=t[n+1];a[n+1]=-t[n+2],a[n+2]=r}}}function Ie(o,e,i,t,s){return!(Math.abs(Xe(e,o))>s)&&(oe(i,o,e),L(i,i),oe(t,i,o),L(t,t),!0)}function vt(o,e,i,t,s,a,n){return Ie(o,e,s,a,n)||Ie(o,i,s,a,n)||Ie(o,t,s,a,n)}const mt=.99619469809,fe=F();function Vi(o){return o instanceof Float32Array&&o.length>=16}function ji(o){return Array.isArray(o)&&o.length>=16}function Ti(o){return Vi(o)||ji(o)}const Rt=.5;function Fi(o,e){o.include(Ot),o.attributes.add("position","vec3"),o.attributes.add("normal","vec3"),o.attributes.add("centerOffsetAndDistance","vec4");const i=o.vertex;bo(i,e),yo(i,e),i.uniforms.add(new Ke("viewport",t=>t.camera.fullViewport),new Be("polygonOffset",t=>t.shaderPolygonOffset),new Ae("cameraGroundRelative",t=>t.camera.aboveGround?1:-1)),e.hasVerticalOffset&&Po(i),i.code.add($`struct ProjectHUDAux {
vec3 posModel;
vec3 posView;
vec3 vnormal;
float distanceToCamera;
float absCosAngle;
};`),i.code.add($`
    float applyHUDViewDependentPolygonOffset(float pointGroundDistance, float absCosAngle, inout vec3 posView) {
      float pointGroundSign = ${e.terrainDepthTest?$.float(0):$`sign(pointGroundDistance)`};
      if (pointGroundSign == 0.0) {
        pointGroundSign = cameraGroundRelative;
      }

      // cameraGroundRelative is -1 if camera is below ground, 1 if above ground
      // groundRelative is 1 if both camera and symbol are on the same side of the ground, -1 otherwise
      float groundRelative = cameraGroundRelative * pointGroundSign;

      // view angle dependent part of polygon offset emulation: we take the absolute value because the sign that is
      // dropped is instead introduced using the ground-relative position of the symbol and the camera
      if (polygonOffset > .0) {
        float cosAlpha = clamp(absCosAngle, 0.01, 1.0);
        float tanAlpha = sqrt(1.0 - cosAlpha * cosAlpha) / cosAlpha;
        float factor = (1.0 - tanAlpha / viewport[2]);

        // same side of the terrain
        if (groundRelative > 0.0) {
          posView *= factor;
        }
        // opposite sides of the terrain
        else {
          posView /= factor;
        }
      }

      return groundRelative;
    }
  `),e.draped&&!e.hasVerticalOffset||$o(i),e.draped||(i.uniforms.add(new Ae("perDistancePixelRatio",t=>Math.tan(t.camera.fovY/2)/(t.camera.fullViewport[2]/2))),i.code.add($`
    void applyHUDVerticalGroundOffset(vec3 normalModel, inout vec3 posModel, inout vec3 posView) {
      float distanceToCamera = length(posView);

      // Compute offset in world units for a half pixel shift
      float pixelOffset = distanceToCamera * perDistancePixelRatio * ${$.float(Rt)};

      // Apply offset along normal in the direction away from the ground surface
      vec3 modelOffset = normalModel * cameraGroundRelative * pixelOffset;

      // Apply the same offset also on the view space position
      vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;

      posModel += modelOffset;
      posView += viewOffset;
    }
  `)),e.screenCenterOffsetUnitsEnabled&&Ct(i),e.hasScreenSizePerspective&&At(i),i.code.add($`
    vec4 projectPositionHUD(out ProjectHUDAux aux) {
      vec3 centerOffset = centerOffsetAndDistance.xyz;
      float pointGroundDistance = centerOffsetAndDistance.w;

      aux.posModel = position;
      aux.posView = (view * vec4(aux.posModel, 1.0)).xyz;
      aux.vnormal = normal;
      ${e.draped?"":"applyHUDVerticalGroundOffset(aux.vnormal, aux.posModel, aux.posView);"}

      // Screen sized offset in world space, used for example for line callouts
      // Note: keep this implementation in sync with the CPU implementation, see
      //   - MaterialUtil.verticalOffsetAtDistance
      //   - HUDMaterial.applyVerticalOffsetTransformation

      aux.distanceToCamera = length(aux.posView);

      vec3 viewDirObjSpace = normalize(cameraPosition - aux.posModel);
      float cosAngle = dot(aux.vnormal, viewDirObjSpace);

      aux.absCosAngle = abs(cosAngle);

      ${e.hasScreenSizePerspective&&(e.hasVerticalOffset||e.screenCenterOffsetUnitsEnabled)?"vec3 perspectiveFactor = screenSizePerspectiveScaleFactor(aux.absCosAngle, aux.distanceToCamera, screenSizePerspectiveAlignment);":""}

      ${e.hasVerticalOffset?e.hasScreenSizePerspective?"float verticalOffsetScreenHeight = applyScreenSizePerspectiveScaleFactorFloat(verticalOffset.x, perspectiveFactor);":"float verticalOffsetScreenHeight = verticalOffset.x;":""}

      ${e.hasVerticalOffset?$`
            float worldOffset = clamp(verticalOffsetScreenHeight * verticalOffset.y * aux.distanceToCamera, verticalOffset.z, verticalOffset.w);
            vec3 modelOffset = aux.vnormal * worldOffset;
            aux.posModel += modelOffset;
            vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;
            aux.posView += viewOffset;
            // Since we elevate the object, we need to take that into account
            // in the distance to ground
            pointGroundDistance += worldOffset;`:""}

      float groundRelative = applyHUDViewDependentPolygonOffset(pointGroundDistance, aux.absCosAngle, aux.posView);

      ${e.screenCenterOffsetUnitsEnabled?"":$`
            // Apply x/y in view space, but z in screen space (i.e. along posView direction)
            aux.posView += vec3(centerOffset.x, centerOffset.y, 0.0);

            // Same material all have same z != 0.0 condition so should not lead to
            // branch fragmentation and will save a normalization if it's not needed
            if (centerOffset.z != 0.0) {
              aux.posView -= normalize(aux.posView) * centerOffset.z;
            }
          `}

      vec4 posProj = proj * vec4(aux.posView, 1.0);

      ${e.screenCenterOffsetUnitsEnabled?e.hasScreenSizePerspective?"float centerOffsetY = applyScreenSizePerspectiveScaleFactorFloat(centerOffset.y, perspectiveFactor);":"float centerOffsetY = centerOffset.y;":""}

      ${e.screenCenterOffsetUnitsEnabled?"posProj.xy += vec2(centerOffset.x, centerOffsetY) * pixelRatio * 2.0 / viewport.zw * posProj.w;":""}

      // constant part of polygon offset emulation
      posProj.z -= groundRelative * polygonOffset * posProj.w;
      return posProj;
    }
  `)}function Ze(o){o.uniforms.add(new So("alignPixelEnabled",e=>e.alignPixelEnabled)),o.code.add($`vec4 alignToPixelCenter(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.500123) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = (floor(xy * widthHeight) + vec2(0.5)) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`),o.code.add($`vec4 alignToPixelOrigin(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.5) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = floor((xy + 0.5 * pixelSz) * widthHeight) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`)}function _i(o,e){const{vertex:i,fragment:t}=o;o.include(zo,e),i.include(Ze),i.main.add($`vec4 posProjCenter;
if (dot(position, position) > 0.0) {
ProjectHUDAux projectAux;
vec4 posProj = projectPositionHUD(projectAux);
posProjCenter = alignToPixelCenter(posProj, viewport.zw);
forwardViewPosDepth(projectAux.posView);
vec3 vpos = projectAux.posModel;
if (rejectBySlice(vpos)) {
posProjCenter = vec4(1e038, 1e038, 1e038, 1.0);
}
} else {
posProjCenter = vec4(1e038, 1e038, 1e038, 1.0);
}
gl_Position = posProjCenter;
gl_PointSize = 1.0;`),t.main.add($`fragColor = vec4(1);
if(discardByTerrainDepth()) {
fragColor.g = 0.5;
}`)}function Ri(o){o.vertex.uniforms.add(new Ae("renderTransparentlyOccludedHUD",e=>e.hudRenderStyle===0?1:e.hudRenderStyle===1?0:.75),new Ke("viewport",e=>e.camera.fullViewport),new Mt("hudVisibilityTexture",e=>e.hudVisibility?.getTexture())),o.vertex.include(Ze),o.vertex.code.add($`bool testHUDVisibility(vec4 posProj) {
vec4 posProjCenter = alignToPixelCenter(posProj, viewport.zw);
vec4 occlusionPixel = texture(hudVisibilityTexture, .5 + .5 * posProjCenter.xy / posProjCenter.w);
if (renderTransparentlyOccludedHUD > 0.5) {
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g * renderTransparentlyOccludedHUD < 1.0;
}
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g == 1.0;
}`)}class Ei extends Oo{constructor(e,i,t){super(e,"vec4",2,(s,a,n)=>s.setUniform4fv(e,i(a,n),t))}}function Ui(o){const e=new ni,{signedDistanceFieldEnabled:i,occlusionTestEnabled:t,horizonCullingEnabled:s,pixelSnappingEnabled:a,hasScreenSizePerspective:n,debugDrawLabelBorder:r,hasVVSize:l,hasVVColor:c,hasRotation:u,occludedFragmentFade:p,sampleSignedDistanceFieldTexelCenter:h}=o;e.include(Fi,o),e.vertex.include(Co,o);const{occlusionPass:b,output:y,oitPass:g}=o;if(b)return e.include(_i,o),e;const{vertex:d,fragment:v}=e;e.include(Ot),e.include(Ao,o),e.include(Mo,o),t&&e.include(Ri),v.include(Do),e.varyings.add("vcolor","vec4"),e.varyings.add("vtc","vec2"),e.varyings.add("vsize","vec2");const m=y===9,x=m&&t;x&&e.varyings.add("voccluded","float"),d.uniforms.add(new Ke("viewport",P=>P.camera.fullViewport),new st("screenOffset",(P,B)=>We(Oe,2*P.screenOffset[0]*B.camera.pixelRatio,2*P.screenOffset[1]*B.camera.pixelRatio)),new st("anchorPosition",P=>be(P)),new Fe("materialColor",P=>P.color),new Be("materialRotation",P=>P.rotation),new nt("tex",P=>P.texture)),Ct(d),i&&(d.uniforms.add(new Fe("outlineColor",P=>P.outlineColor)),v.uniforms.add(new Fe("outlineColor",P=>gt(P)?P.outlineColor:uo),new Be("outlineSize",P=>gt(P)?P.outlineSize:0))),s&&d.uniforms.add(new Ei("pointDistanceSphere",(P,B)=>{const w=B.camera.eye,j=P.origin;return fo(j[0]-w[0],j[1]-w[1],j[2]-w[2],Nt.radius)})),a&&d.include(Ze),n&&(Vo(d),At(d)),r&&e.varyings.add("debugBorderCoords","vec4"),e.attributes.add("uv0","vec2"),e.attributes.add("uvi","vec4"),e.attributes.add("color","vec4"),e.attributes.add("size","vec2"),e.attributes.add("rotation","float"),(l||c)&&e.attributes.add("featureAttribute","vec4"),d.code.add(s?$`bool behindHorizon(vec3 posModel) {
vec3 camToEarthCenter = pointDistanceSphere.xyz - localOrigin;
vec3 camToPos = pointDistanceSphere.xyz + posModel;
float earthRadius = pointDistanceSphere.w;
float a = dot(camToPos, camToPos);
float b = dot(camToPos, camToEarthCenter);
float c = dot(camToEarthCenter, camToEarthCenter) - earthRadius * earthRadius;
return b > 0.0 && b < a && b * b  > a * c;
}`:$`bool behindHorizon(vec3 posModel) { return false; }`),d.main.add($`
    ProjectHUDAux projectAux;
    vec4 posProj = projectPositionHUD(projectAux);
    forwardObjectAndLayerIdColor();

    if (rejectBySlice(projectAux.posModel)) {
      // Project outside of clip plane
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    if (behindHorizon(projectAux.posModel)) {
      // Project outside of clip plane
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    vec2 inputSize;
    ${I(n,$`
        inputSize = screenSizePerspectiveScaleVec2(size, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspective);
        vec2 screenOffsetScaled = screenSizePerspectiveScaleVec2(screenOffset, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspectiveAlignment);`,$`
        inputSize = size;
        vec2 screenOffsetScaled = screenOffset;`)}
    ${I(l,$`inputSize *= vvScale(featureAttribute).xx;`)}

    vec2 combinedSize = inputSize * pixelRatio;
    vec4 quadOffset = vec4(0.0);

    ${I(t,$`
    bool visible = testHUDVisibility(posProj);
    if (!visible) {
      vtc = vec2(0.0);
      ${I(r,"debugBorderCoords = vec4(0.5, 0.5, 1.5 / combinedSize);")}
      return;
    }`)}
    ${I(x,$`voccluded = visible ? 0.0 : 1.0;`)}
  `);const C=$`
      vec2 uv = mix(uvi.xy, uvi.zw, bvec2(uv0));
      vec2 texSize = vec2(textureSize(tex, 0));
      uv = mix(vec2(1.0), uv / texSize, lessThan(uv, vec2(${Hi})));
      quadOffset.xy = (uv0 - anchorPosition) * 2.0 * combinedSize;

      ${I(u,$`
          float angle = radians(materialRotation + rotation);
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);
          mat2 rotate = mat2(cosAngle, -sinAngle, sinAngle,  cosAngle);

          quadOffset.xy = rotate * quadOffset.xy;
        `)}

      quadOffset.xy = (quadOffset.xy + screenOffsetScaled) / viewport.zw * posProj.w;
  `,f=a?i?$`posProj = alignToPixelOrigin(posProj, viewport.zw) + quadOffset;`:$`posProj += quadOffset;
if (inputSize.x == size.x) {
posProj = alignToPixelOrigin(posProj, viewport.zw);
}`:$`posProj += quadOffset;`;d.main.add($`
    ${C}
    ${c?"vcolor = interpolateVVColor(featureAttribute.y) * materialColor;":"vcolor = color / 255.0 * materialColor;"}

    ${I(y===10,$`vcolor.a = 1.0;`)}

    bool alphaDiscard = vcolor.a < ${$.float(te)};
    ${I(i,`alphaDiscard = alphaDiscard && outlineColor.a < ${$.float(te)};`)}
    if (alphaDiscard) {
      // "early discard" if both symbol color (= fill) and outline color (if applicable) are transparent
      gl_Position = vec4(1e38, 1e38, 1e38, 1.0);
      return;
    } else {
      ${f}
      gl_Position = posProj;
    }

    vtc = uv;

    ${I(r,$`debugBorderCoords = vec4(uv01, 1.5 / combinedSize);`)}
    vsize = inputSize;
  `),v.uniforms.add(new nt("tex",P=>P.texture)),p&&!m&&v.uniforms.add(new Mt("depthMap",P=>P.mainDepth),new Ae("occludedOpacity",P=>P.hudOccludedFragmentOpacity));const z=r?$`(isBorder > 0.0 ? 0.0 : ${$.float(te)})`:$.float(te),O=$`
    ${I(r,$`float isBorder = float(any(lessThan(debugBorderCoords.xy, debugBorderCoords.zw)) || any(greaterThan(debugBorderCoords.xy, 1.0 - debugBorderCoords.zw)));`)}

    vec2 samplePos = vtc;

    ${I(h,$`
      float txSize = float(textureSize(tex, 0).x);
      float texelSize = 1.0 / txSize;

      // Calculate how much we have to add/subtract to/from each texel to reach the size of an onscreen pixel
      vec2 scaleFactor = (vsize - txSize) * texelSize;
      samplePos += (vec2(1.0, -1.0) * texelSize) * scaleFactor;`)}

    ${i?$`
      vec4 fillPixelColor = vcolor;

      // Get distance in output units (i.e. pixels)

      float sdf = texture(tex, samplePos).r;
      float pixelDistance = sdf * vsize.x;

      // Create smooth transition from the icon into its outline
      float fillAlphaFactor = clamp(0.5 - pixelDistance, 0.0, 1.0);
      fillPixelColor.a *= fillAlphaFactor;

      if (outlineSize > 0.25) {
        vec4 outlinePixelColor = outlineColor;
        float clampedOutlineSize = min(outlineSize, 0.5*vsize.x);

        // Create smooth transition around outline
        float outlineAlphaFactor = clamp(0.5 - (abs(pixelDistance) - 0.5*clampedOutlineSize), 0.0, 1.0);
        outlinePixelColor.a *= outlineAlphaFactor;

        if (
          outlineAlphaFactor + fillAlphaFactor < ${z} ||
          fillPixelColor.a + outlinePixelColor.a < ${$.float(te)}
        ) {
          discard;
        }

        // perform un-premultiplied over operator (see https://en.wikipedia.org/wiki/Alpha_compositing#Description)
        float compositeAlpha = outlinePixelColor.a + fillPixelColor.a * (1.0 - outlinePixelColor.a);
        vec3 compositeColor = vec3(outlinePixelColor) * outlinePixelColor.a +
          vec3(fillPixelColor) * fillPixelColor.a * (1.0 - outlinePixelColor.a);

        ${I(!m,$`fragColor = vec4(compositeColor, compositeAlpha);`)}
      } else {
        if (fillAlphaFactor < ${z}) {
          discard;
        }

        ${I(!m,$`fragColor = premultiplyAlpha(fillPixelColor);`)}
      }

      // visualize SDF:
      // fragColor = vec4(clamp(-pixelDistance/vsize.x*2.0, 0.0, 1.0), clamp(pixelDistance/vsize.x*2.0, 0.0, 1.0), 0.0, 1.0);
      `:$`
          vec4 texColor = texture(tex, samplePos, -0.5);
          if (texColor.a < ${z}) {
            discard;
          }
          ${I(!m,$`fragColor = texColor * premultiplyAlpha(vcolor);`)}
          `}

    ${I(p&&!m,$`
        float zSample = texelFetch(depthMap, ivec2(gl_FragCoord.xy), 0).x;
        if (zSample < gl_FragCoord.z) {
          fragColor *= occludedOpacity;
        }
        `)}

    ${I(!m&&r,$`fragColor = mix(fragColor, vec4(1.0, 0.0, 1.0, 1.0), isBorder * 0.5);`)}
  `;switch(y){case 0:case 1:e.outputs.add("fragColor","vec4",0),y===1&&e.outputs.add("fragEmission","vec4",1),g===1&&e.outputs.add("fragAlpha","float",y===1?2:1),v.main.add($`
        ${O}
        ${I(g===2,$`fragColor.rgb /= fragColor.a;`)}
        ${I(y===1,$`fragEmission = vec4(0.0);`)}
        ${I(g===1,$`fragAlpha = fragColor.a;`)}`);break;case 10:v.main.add($`
        ${O}
        outputObjectAndLayerIdColor();`);break;case 9:e.include(jo,o),v.main.add($`
        ${O}
        outputHighlight(${I(x,$`voccluded == 1.0`,$`false`)});`)}return e}function gt(o){return o.outlineColor[3]>0&&o.outlineSize>0}function be(o){return o.textureIsSignedDistanceField?Ii(o.anchorPosition,o.distanceFieldBoundingBox,Oe):so(Oe,o.anchorPosition),Oe}function Ii(o,e,i){We(i,o[0]*(e[2]-e[0])+e[0],o[1]*(e[3]-e[1])+e[1])}const Oe=Qe(),Me=32e3,Hi=$.float(Me),Bi=Object.freeze(Object.defineProperty({__proto__:null,build:Ui,calculateAnchorPosition:be,fullUV:Me},Symbol.toStringTag,{value:"Module"}));class Gi extends Fo{constructor(e,i){super(e,i,new _o(Bi,()=>ai(()=>import("./BH1sdSKI.js").then(t=>t.H),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51]),import.meta.url)),fi([Et,It()].map(ri))),this.primitiveType=i.occlusionPass?ct.POINTS:ct.TRIANGLE_STRIP}initializePipeline(e){const{oitPass:i,hasPolygonOffset:t,draped:s,output:a,depthTestEnabled:n,occlusionPass:r}=e,l=n&&!s&&i!==1&&!r&&a!==9;return li({blending:Dt(a)?Eo(i,!0):null,depthTest:n&&!s?{func:515}:null,depthWrite:l?ui:null,drawBuffers:Ro(i,a),colorWrite:ci,polygonOffset:t?Li:null})}}const Li={factor:0,units:-4},Et=Ft().vec2u8("uv0",{glNormalized:!0}),Ut=Ft().vec3f("position").vec3f("normal").vec4i16("uvi").vec4u8("color").vec2f("size").f32("rotation").vec4f("centerOffsetAndDistance").vec4f("featureAttribute"),qi=Ut.clone().vec4u8("olidColor");function It(){return To()?qi:Ut}class _ extends Uo{constructor(e){super(),this.spherical=e,this.screenCenterOffsetUnitsEnabled=!1,this.occlusionTestEnabled=!0,this.signedDistanceFieldEnabled=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.hasVVSize=!1,this.hasVVColor=!1,this.hasVerticalOffset=!1,this.hasScreenSizePerspective=!1,this.hasRotation=!1,this.debugDrawLabelBorder=!1,this.hasPolygonOffset=!1,this.depthTestEnabled=!0,this.pixelSnappingEnabled=!0,this.draped=!1,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.occlusionPass=!1,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!0,this.isFocused=!0,this.olidColorInstanced=!1,this.textureCoordinateType=0,this.emissionSource=0,this.discardInvisibleFragments=!0,this.hasVVInstancing=!1,this.snowCover=!1}}U([E()],_.prototype,"screenCenterOffsetUnitsEnabled",void 0),U([E()],_.prototype,"occlusionTestEnabled",void 0),U([E()],_.prototype,"signedDistanceFieldEnabled",void 0),U([E()],_.prototype,"sampleSignedDistanceFieldTexelCenter",void 0),U([E()],_.prototype,"hasVVSize",void 0),U([E()],_.prototype,"hasVVColor",void 0),U([E()],_.prototype,"hasVerticalOffset",void 0),U([E()],_.prototype,"hasScreenSizePerspective",void 0),U([E()],_.prototype,"hasRotation",void 0),U([E()],_.prototype,"debugDrawLabelBorder",void 0),U([E()],_.prototype,"hasPolygonOffset",void 0),U([E()],_.prototype,"depthTestEnabled",void 0),U([E()],_.prototype,"pixelSnappingEnabled",void 0),U([E()],_.prototype,"draped",void 0),U([E()],_.prototype,"terrainDepthTest",void 0),U([E()],_.prototype,"cullAboveTerrain",void 0),U([E()],_.prototype,"occlusionPass",void 0),U([E()],_.prototype,"occludedFragmentFade",void 0),U([E()],_.prototype,"horizonCullingEnabled",void 0),U([E()],_.prototype,"isFocused",void 0);class ks extends Io{constructor(e,i){super(e,Qi),this.produces=new Map([[13,t=>_e(t)&&!this.parameters.drawAsLabel],[14,t=>_e(t)&&this.parameters.drawAsLabel],[12,()=>this.parameters.occlusionTest],[18,t=>this.parameters.draped&&_e(t)]]),this._visible=!0,this._configuration=new _(i)}getConfiguration(e,i){const t=this.parameters.draped;return super.getConfiguration(e,i,this._configuration),this._configuration.hasSlicePlane=this.parameters.hasSlicePlane,this._configuration.hasVerticalOffset=!!this.parameters.verticalOffset,this._configuration.hasScreenSizePerspective=!!this.parameters.screenSizePerspective,this._configuration.screenCenterOffsetUnitsEnabled=this.parameters.centerOffsetUnits==="screen",this._configuration.hasPolygonOffset=this.parameters.polygonOffset,this._configuration.draped=t,this._configuration.occlusionTestEnabled=this.parameters.occlusionTest,this._configuration.pixelSnappingEnabled=this.parameters.pixelSnappingEnabled,this._configuration.signedDistanceFieldEnabled=this.parameters.textureIsSignedDistanceField,this._configuration.sampleSignedDistanceFieldTexelCenter=this.parameters.sampleSignedDistanceFieldTexelCenter,this._configuration.hasRotation=this.parameters.hasRotation,this._configuration.hasVVSize=!!this.parameters.vvSize,this._configuration.hasVVColor=!!this.parameters.vvColor,this._configuration.occlusionPass=i.slot===12,this._configuration.occludedFragmentFade=!t&&this.parameters.occludedFragmentFade,this._configuration.horizonCullingEnabled=this.parameters.horizonCullingEnabled,this._configuration.isFocused=this.parameters.isFocused,this._configuration.depthTestEnabled=this.parameters.depthEnabled||i.slot===12,Dt(e)&&(this._configuration.debugDrawLabelBorder=!!Ho.LABELS_SHOW_BORDER),this._configuration.oitPass=i.oitPass,this._configuration.terrainDepthTest=i.terrainDepthTest,this._configuration.cullAboveTerrain=i.cullAboveTerrain,this._configuration}intersect(e,i,t,s,a,n){const{options:{selectionMode:r,hud:l,excludeLabels:c},point:u,camera:p}=t,{parameters:h}=this;if(!r||!l||c&&h.isLabel||!e.visible||!u||!p)return;const b=e.attributes.get("featureAttribute"),y=b==null?null:et(b.data,qe),{scaleX:g,scaleY:d}=Ne(y,h,p.pixelRatio);$t(Ce,i),e.attributes.has("featureAttribute")&&Wi(Ce);const v=e.attributes.get("position"),m=e.attributes.get("size"),x=e.attributes.get("normal"),C=e.attributes.get("rotation"),f=e.attributes.get("centerOffsetAndDistance");Tt(v.size>=3);const z=be(h),O=this.parameters.centerOffsetUnits==="screen";for(let P=0;P<v.data.length/v.size;P++){const B=P*v.size;ie(A,v.data[B],v.data[B+1],v.data[B+2]),re(A,A,i),re(A,A,p.viewMatrix);const w=P*f.size;if(ie(T,f.data[w],f.data[w+1],f.data[w+2]),!O&&(A[0]+=T[0],A[1]+=T[1],T[2]!==0)){const V=T[2];L(T,A),W(A,A,G(T,T,V))}const j=P*x.size;if(ie(ae,x.data[j],x.data[j+1],x.data[j+2]),Ge(ae,Ce,p,xe),ke(this.parameters,A,xe,p,ve),p.applyProjection(A,D),D[0]>-1){O&&(T[0]||T[1])&&(D[0]+=T[0]*p.pixelRatio,T[1]!==0&&(D[1]+=ve.alignmentEvaluator.apply(T[1])*p.pixelRatio),p.unapplyProjection(D,A)),D[0]+=this.parameters.screenOffset[0]*p.pixelRatio,D[1]+=this.parameters.screenOffset[1]*p.pixelRatio,D[0]=Math.floor(D[0]),D[1]=Math.floor(D[1]);const V=P*m.size;R[0]=m.data[V],R[1]=m.data[V+1],ve.evaluator.applyVec2(R,R);const Q=Gt*p.pixelRatio;let le=0;h.textureIsSignedDistanceField&&(le=Math.min(h.outlineSize,.5*R[0])*p.pixelRatio/2),R[0]*=g,R[1]*=d;const Z=P*C.size,k=h.rotation+C.data[Z];if(Le(u,D[0],D[1],R,Q,le,k,h,z)){const se=t.ray;if(re(De,A,wt(Bt,p.viewMatrix)),D[0]=u[0],D[1]=u[1],p.unprojectFromRenderScreen(D,A)){const S=F();N(S,se.direction);const me=1/we(S);G(S,S,me),n(zt(se.origin,A)*me,S,-1,De)}}}}}intersectDraped(e,i,t,s,a){const n=e.attributes.get("position"),r=e.attributes.get("size"),l=e.attributes.get("rotation"),c=this.parameters,u=be(c),p=e.attributes.get("featureAttribute"),h=p==null?null:et(p.data,qe),{scaleX:b,scaleY:y}=Ne(h,c,e.screenToWorldRatio),g=Xi*e.screenToWorldRatio;for(let d=0;d<n.data.length/n.size;d++){const v=d*n.size,m=n.data[v],x=n.data[v+1],C=d*r.size;R[0]=r.data[C],R[1]=r.data[C+1];let f=0;c.textureIsSignedDistanceField&&(f=Math.min(c.outlineSize,.5*R[0])*e.screenToWorldRatio/2),R[0]*=b,R[1]*=y;const z=d*l.size,O=c.rotation+l.data[z];Le(t,m,x,R,g,f,O,c,u)&&s(a.distance,a.normal,-1)}}createBufferWriter(){return new Zi}applyShaderOffsetsView(e,i,t,s,a,n,r){const l=Ge(i,t,a,xe);return this._applyVerticalGroundOffsetView(e,l,a,r),ke(this.parameters,r,l,a,n),this._applyPolygonOffsetView(r,l,s[3],a,r),this._applyCenterOffsetView(r,s,r),r}applyShaderOffsetsNDC(e,i,t,s,a){return this._applyCenterOffsetNDC(e,i,t,s),a!=null&&N(a,s),this._applyPolygonOffsetNDC(s,i,t,s),s}_applyPolygonOffsetView(e,i,t,s,a){const n=s.aboveGround?1:-1;let r=Math.sign(t);r===0&&(r=n);const l=n*r;if(this.parameters.shaderPolygonOffset<=0)return N(a,e);const c=ii(Math.abs(i.cosAngle),.01,1),u=1-Math.sqrt(1-c*c)/c/s.viewport[2];return G(a,e,l>0?u:1/u),a}_applyVerticalGroundOffsetView(e,i,t,s){const a=we(e),n=t.aboveGround?1:-1,r=t.computeRenderPixelSizeAtDist(a)*Rt,l=G(A,i.normal,n*r);return q(s,e,l),s}_applyCenterOffsetView(e,i,t){const s=this.parameters.centerOffsetUnits!=="screen";return t!==e&&N(t,e),s&&(t[0]+=i[0],t[1]+=i[1],i[2]&&(L(ae,t),go(t,t,G(ae,ae,i[2])))),t}_applyCenterOffsetNDC(e,i,t,s){const a=this.parameters.centerOffsetUnits!=="screen";return s!==e&&N(s,e),a||(s[0]+=i[0]/t.fullWidth*2,s[1]+=i[1]/t.fullHeight*2),s}_applyPolygonOffsetNDC(e,i,t,s){const a=this.parameters.shaderPolygonOffset;if(e!==s&&N(s,e),a){const n=t.aboveGround?1:-1,r=n*Math.sign(i[3]);s[2]-=(r||n)*a}return s}set visible(e){this._visible=e}get visible(){const{color:e,outlineSize:i,outlineColor:t}=this.parameters,s=e[3]>=te||i>=te&&t[3]>=te;return this._visible&&s}createGLMaterial(e){return new Ni(e)}calculateRelativeScreenBounds(e,i,t=yt()){return ki(this.parameters,e,i,t),t[2]=t[0]+e[0],t[3]=t[1]+e[1],t}}class Ni extends Ko{constructor(e){super({...e,...e.material.parameters})}beginSlot(e){return this.updateTexture(this._material.parameters.textureId),this._material.setParameters(this.textureBindParameters),this.getTechnique(Gi,e)}}function ki(o,e,i,t){t[0]=o.anchorPosition[0]*-e[0]+o.screenOffset[0]*i,t[1]=o.anchorPosition[1]*-e[1]+o.screenOffset[1]*i}function Ge(o,e,i,t){return Ti(e)&&(e=$t(Yi,e)),xo(t.normal,o,e),re(t.normal,t.normal,i.viewInverseTransposeMatrix),t.cosAngle=Xe(Ht,Ki),t}function Wi(o){const e=o[0],i=o[1],t=o[2],s=o[3],a=o[4],n=o[5],r=o[6],l=o[7],c=o[8],u=1/Math.sqrt(e*e+i*i+t*t),p=1/Math.sqrt(s*s+a*a+n*n),h=1/Math.sqrt(r*r+l*l+c*c);return o[0]=e*u,o[1]=i*u,o[2]=t*u,o[3]=s*p,o[4]=a*p,o[5]=n*p,o[6]=r*h,o[7]=l*h,o[8]=c*h,o}function Le(o,e,i,t,s,a,n,r,l){let c=e-s-t[0]*l[0],u=c+t[0]+2*s,p=i-s-t[1]*l[1],h=p+t[1]+2*s;const b=r.distanceFieldBoundingBox;return r.textureIsSignedDistanceField&&b!=null&&(c+=t[0]*b[0],p+=t[1]*b[1],u-=t[0]*(1-b[2]),h-=t[1]*(1-b[3]),c-=a,u+=a,p-=a,h+=a),We(xt,e,i),no(ge,o,xt,si(n)),ge[0]>c&&ge[0]<u&&ge[1]>p&&ge[1]<h}const ve=new Bo,A=F(),ae=F(),D=Ve(),Ht=F(),De=F(),ge=Qe(),xt=Qe(),Ce=St(),Yi=St(),Bt=bt(),ye=Ve(),T=F(),He=F(),qe=Ve(),xe={normal:Ht,cosAngle:0},Gt=1,Xi=2,R=jt(0,0),Ki=Pt(0,0,1);class Qi extends Go{constructor(){super(...arguments),this.renderOccluded=1,this.isDecoration=!1,this.color=tt(1,1,1,1),this.polygonOffset=!1,this.anchorPosition=jt(.5,.5),this.screenOffset=[0,0],this.shaderPolygonOffset=1e-5,this.textureIsSignedDistanceField=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.outlineColor=tt(1,1,1,1),this.outlineSize=0,this.distanceFieldBoundingBox=Ve(),this.rotation=0,this.hasRotation=!1,this.vvSizeEnabled=!1,this.vvSize=null,this.vvColor=null,this.vvOpacity=null,this.vvSymbolAnchor=null,this.vvSymbolRotationMatrix=null,this.hasSlicePlane=!1,this.pixelSnappingEnabled=!0,this.occlusionTest=!0,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!1,this.centerOffsetUnits="world",this.drawAsLabel=!1,this.depthEnabled=!0,this.isFocused=!0,this.focusStyle="bright",this.draped=!1,this.isLabel=!1}get hasVVSize(){return!!this.vvSize}get hasVVColor(){return!!this.vvColor}get hasVVOpacity(){return!!this.vvOpacity}}class Zi{constructor(){this.layout=Et,this.instanceLayout=It()}elementCount(e){return e.get("position").indices.length}elementCountBaseInstance(e){return e.get("uv0").indices.length}write(e,i,t,s,a,n){const{position:r,normal:l,color:c,size:u,rotation:p,centerOffsetAndDistance:h,featureAttribute:b,uvi:y}=a;No(t.get("position"),e,r,n),ko(t.get("normal"),i,l,n);const g=t.get("position").indices.length;let d=0,v=0,m=Me,x=Me;const C=t.get("uvi")?.data;C&&C.length>=4&&(d=C[0],v=C[1],m=C[2],x=C[3]);for(let f=0;f<g;++f){const z=n+f;y.setValues(z,d,v,m,x)}if(Wo(t.get("color"),4,c,n),at(t.get("size"),u,n),Yo(t.get("rotation"),p,n),t.get("centerOffsetAndDistance")?rt(t.get("centerOffsetAndDistance"),h,n):lt(h,n,g),t.get("featureAttribute")?rt(t.get("featureAttribute"),b,n):lt(b,n,g),s!=null){const f=t.get("position")?.indices;if(f){const z=f.length,O=a.getField("olidColor",oi);Xo(s,O,z,n)}}return{numVerticesPerItem:1,numItems:g}}writeBaseInstance(e,i){const{uv0:t}=i;at(e.get("uv0"),t,0)}intersect(e,i,t,s,a,n,r){const{options:{selectionMode:l,hud:c,excludeLabels:u},point:p,camera:h}=s;if(!l||!c||u&&i.isLabel||!p)return;const b=this.instanceLayout.createView(e),{position:y,normal:g,rotation:d,size:v,featureAttribute:m,centerOffsetAndDistance:x}=b,C=i.centerOffsetUnits==="screen",f=be(i);if(y==null||g==null||d==null||v==null||x==null||h==null)return;const z=m==null?null:m.getVec(0,qe),{scaleX:O,scaleY:P}=Ne(z,i,h.pixelRatio),B=y.count;for(let w=0;w<B;w++){if(y.getVec(w,A),t!=null&&q(A,A,t),re(A,A,h.viewMatrix),x.getVec(w,ye),ie(T,ye[0],ye[1],ye[2]),!C&&(A[0]+=T[0],A[1]+=T[1],T[2]!==0)){const j=T[2];L(T,A),W(A,A,G(T,T,j))}if(g.getVec(w,ae),Ge(ae,Ce,h,xe),ke(i,A,xe,h,ve),h.applyProjection(A,D),D[0]>-1){C&&(T[0]||T[1])&&(D[0]+=T[0]*h.pixelRatio,T[1]!==0&&(D[1]+=ve.alignmentEvaluator.apply(T[1])*h.pixelRatio),h.unapplyProjection(D,A)),D[0]+=i.screenOffset[0]*h.pixelRatio,D[1]+=i.screenOffset[1]*h.pixelRatio,D[0]=Math.floor(D[0]),D[1]=Math.floor(D[1]),v.getVec(w,R),ve.evaluator.applyVec2(R,R);const j=Gt*h.pixelRatio;let V=0;i.textureIsSignedDistanceField&&(V=Math.min(i.outlineSize,.5*R[0])*h.pixelRatio/2),R[0]*=O,R[1]*=P;const Q=d.get(w),le=i.rotation+Q;if(Le(p,D[0],D[1],R,j,V,le,i,f)){const Z=s.ray;if(re(De,A,wt(Bt,h.viewMatrix)),D[0]=p[0],D[1]=p[1],h.unprojectFromRenderScreen(D,A)){const k=F();N(k,Z.direction);const se=1/we(k);G(k,k,se),r(zt(Z.origin,A)*se,k,w,De)}}}}}}function Ne(o,e,i){return o==null||e.vvSize==null?{scaleX:i,scaleY:i}:(Lo(He,e,o),{scaleX:He[0]*i,scaleY:He[1]*i})}function ke(o,e,i,t,s){if(!o.verticalOffset?.screenLength){const l=we(e);return s.update(i.cosAngle,l,o.screenSizePerspective,o.screenSizePerspectiveMinPixelReferenceSize,o.screenSizePerspectiveAlignment,null),e}const a=we(e),n=o.screenSizePerspectiveAlignment??o.screenSizePerspective,r=qo(t,a,o.verticalOffset,i.cosAngle,n,o.screenSizePerspectiveMinPixelReferenceSize);return s.update(i.cosAngle,a,o.screenSizePerspective,o.screenSizePerspectiveMinPixelReferenceSize,o.screenSizePerspectiveAlignment,null),G(i.normal,i.normal,r),q(e,e,i.normal)}function Ws(o){return o.type==="point"}export{As as A,be as B,Ms as D,Ts as E,Ui as F,js as G,Gs as M,Fs as Q,Cs as U,Ds as Z,Os as a,Ns as b,Me as c,Fi as d,Us as e,Is as f,Vs as g,Es as h,ks as i,vt as j,hi as k,Ze as l,Rs as m,Ri as n,Ls as o,Mi as p,Bs as q,_s as r,Di as s,Ws as t,Ai as u,Hs as w,qs as y};

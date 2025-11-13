const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Br3fzMdT.js","./CEVkfTgd.js","./DUlE1Kon.js","./BFGjv385.js","./DSdBzmdi.js","./DxH_hBwP.js","./CdqyOKuv.js","./PPVm8Dsz.js","./DfRz3K_A.js","./J6jWJpvs.js","./bnayRBMH.js","./Cgb6qxNH.js","./xwu6sSsN.js","./DQOO6RKE.js","./OMM7yKVB.js","./q_b6UJoq.js","./BHDA5-eH.js","./Cw6nET6t.js","./CXkU-Wol.js","./BELp7PG8.js","./DPb6J-GU.js","./D0c9TmgC.js","./BLNJg6YZ.js","./CjadiZf0.js","./BernbCQ7.js","./aQ5IuZRd.js","./Dmag9E2-.js","./CKc66y4x.js","./C-CJOyzY.js","./BP4OB8lT.js","./B5bJgrnA.js","./DPJXGPFY.js","./C3-hxTuw.js","./D-57UJtx.js","./Cc17QD5h.js","./uh6gjmpK.js","./zBqsFMnn.js","./2ISwu1zN.js","./CD2g8Juu.js","./B87vTgcy.js","./BODnff4R.js","./Cd67kGb1.js","./DvUizldf.js","./BeX-jsT6.js","./Cu4bnnQO.js","./BcOkVyXn.js","./7Al2jwGl.js","./CZ7c9hXd.js","./CMUnv9rn.js","./CLE-aSsa.js","./DWQ4DDTW.js","./Bzb85Au4.js","./D2Yxuq6P.js","./BrTgCvRV.js","./Ceg41VYx.js","./BfZbt_DV.js","./BLyltQyJ.js","./Ci6C1k20.js","./DabT61Ls.js","./Zwp3ZH5G.js","./CTVclG3R.js","./BKo2foNY.js","./B9bL92g1.js","./CvKQqnC4.js"])))=>i.map(i=>d[i]);
import{b as qt,h as Nt}from"./CdqyOKuv.js";import{x as kt,l as Wt,m as Yt,h as wt}from"./CjadiZf0.js";import{e as bt}from"./q_b6UJoq.js";import{_ as Xt,u as Kt,i as yt,n as F,t as Je,r as Pt}from"./J6jWJpvs.js";import{m as Qt,s as Zt}from"./BELp7PG8.js";import{t as Jt,s as eo,a as to,r as oo,u as et,n as Ve,e as tt}from"./DPb6J-GU.js";import{$ as io}from"./BODnff4R.js";import{g as no,y as so,E as ro}from"./C-CJOyzY.js";import{aq as ao,ar as lo,ah as co,as as uo,X as We,D as $t,e as St,N as fo}from"./CEVkfTgd.js";import{u as po}from"./eadeHz5Q.js";import{t as Ye}from"./DvUizldf.js";import{o as ho,x as mo}from"./BASipBox.js";import{c as W,_ as oe,A as L,o as ie,s as N,g as G,u as q,E as ae,P as Xe,r as we,p as zt,R as vo,N as go}from"./BHDA5-eH.js";import{r as H,n as Y,t as ot}from"./WCVSSNPR.js";import{e as xo}from"./BP4OB8lT.js";import{i as wo,a as it,n as X,m as K,s as Ot,f as bo,d as yo,e as Ke,r as Be,b as Ae,c as Po,p as $o,w as Ct,g as At,h as So,j as zo,k as Mt,l as Oo,o as Co,u as Ao,q as Mo,t as Do,v as nt,x as Fe,y as st,z as Vo,A as te,B as jo,C as To,D as Fo,E as _o,F as Ro,G as Eo,H as Dt,I as Uo,J as E,K as Io,L as _e,M as Ho,N as Bo,O as Go,P as Lo,Q as qo,R as No,T as ko,U as Wo,V as rt,W as Yo,X as at,Y as lt,Z as Xo,_ as Ko}from"./xwu6sSsN.js";import{A as Qo,U as Vt}from"./Cw6nET6t.js";import{j as Zo,U as Jo,K as ei}from"./BcOkVyXn.js";import{k as ti}from"./BLNJg6YZ.js";import{n as Qe,r as jt}from"./Cgb6qxNH.js";import"./BFGjv385.js";import{t as M}from"./7Al2jwGl.js";import{s as Tt,g as oi}from"./CXkU-Wol.js";import{r as ii,s as ni}from"./bnayRBMH.js";import{t as $,n as U}from"./B5bJgrnA.js";import{s as si}from"./DabT61Ls.js";import{_ as ri}from"./PPVm8Dsz.js";import{Q as Ft,t as ai}from"./CTVclG3R.js";import{_ as ct}from"./DQOO6RKE.js";import{T as li,d as ci,c as ui}from"./CKc66y4x.js";import{t as fi}from"./BfZbt_DV.js";import{_ as I}from"./DUlE1Kon.js";function jn(o,e){if(o.type==="point")return ee(o,e,!1);if(ho(o))switch(o.type){case"extent":return ee(o.center,e,!1);case"polygon":return ee(ft(o),e,!1);case"polyline":return ee(ut(o),e,!0);case"mesh":return ee(po(o.vertexSpace,o.spatialReference)??o.extent.center,e,!1);case"multipoint":return}else switch(o.type){case"extent":return ee(pi(o),e,!0);case"polygon":return ee(ft(o),e,!0);case"polyline":return ee(ut(o),e,!0);case"multipoint":return}}function ut(o){const e=o.paths[0];if(!e||e.length===0)return null;const i=ao(e,lo(e)/2);return Ye(i[0],i[1],i[2],o.spatialReference)}function pi(o){return Ye(.5*(o.xmax+o.xmin),.5*(o.ymax+o.ymin),o.zmin!=null&&o.zmax!=null&&isFinite(o.zmin)&&isFinite(o.zmax)?.5*(o.zmax+o.zmin):void 0,o.spatialReference)}function ft(o){const e=o.rings[0];if(!e||e.length===0)return null;const i=co(o.rings,!!o.hasZ);return Ye(i[0],i[1],i[2],o.spatialReference)}function ee(o,e,i){const t=i?o:mo(o);return e&&o?io(o,t,e)?t:null:t}function Tn(o,e,i,t=0){if(o){e||(e=yt());const n=o;let r=.5*n.width*(i-1),s=.5*n.height*(i-1);return n.width<1e-7*n.height?r+=s/20:n.height<1e-7*n.width&&(s+=r/20),Zt(e,n.xmin-r-t,n.ymin-s-t,n.xmax+r+t,n.ymax+s+t),e}return null}function Fn(o,e,i=null){const t=Jt(eo);return o!=null&&(t[0]=o[0],t[1]=o[1],t[2]=o[2],o.length>3&&(t[3]=o[3])),e!=null&&(t[3]=e),i&&Qt(t,t,i),t}function _n(o=Xt,e,i,t=1){const n=new Array(3);if(e==null||i==null)n[0]=1,n[1]=1,n[2]=1;else{let r,s=0;for(let a=2;a>=0;a--){const l=o[a],c=l!=null,u=a===0&&!r&&!c,p=i[a];let h;l==="symbol-value"||u?h=p!==0?e[a]/p:1:c&&l!=="proportional"&&isFinite(l)&&(h=p!==0?l/p:1),h!=null&&(n[a]=h,r=h,s=Math.max(s,Math.abs(h)))}for(let a=2;a>=0;a--)n[a]==null?n[a]=r:n[a]===0&&(n[a]=.001*s)}for(let r=2;r>=0;r--)n[r]/=t;return Kt(n)}function di(o){return o.isPrimitive!=null}function Rn(o){return hi(di(o)?[o.width,o.depth,o.height]:o)?null:"Symbol sizes may not be negative values"}function hi(o){const e=i=>i==null||i>=0;return Array.isArray(o)?o.every(e):e(o)}function En(o,e,i,t=bt()){return o&&kt(t,t,-o/180*Math.PI),e&&Wt(t,t,e/180*Math.PI),i&&Yt(t,t,i/180*Math.PI),t}function Un(o,e,i){if(i.minDemResolution!=null)return i.minDemResolution;const t=qt(e),n=no(o)*t,r=so(o)*t,s=ro(o)*(e.isGeographic?1:t);return n===0&&r===0&&s===0?i.minDemResolutionForPoints:.01*Math.max(n,r,s)}function pt(o,e){const i=o[e],t=o[e+1],n=o[e+2];return Math.sqrt(i*i+t*t+n*n)}function mi(o,e){const i=o[e],t=o[e+1],n=o[e+2],r=1/Math.sqrt(i*i+t*t+n*n);o[e]*=r,o[e+1]*=r,o[e+2]*=r}function dt(o,e,i){o[e]*=i,o[e+1]*=i,o[e+2]*=i}function vi(o,e,i,t,n,r=e){(n=n||o)[r]=o[e]+i[t],n[r+1]=o[e+1]+i[t+1],n[r+2]=o[e+2]+i[t+2]}function gi(){return ht??=xi(),ht}function xi(){const i=new M([0,0,0,255,255,0,255,255],[0,1,2,3],2,!0);return new wo([["uv0",i]])}let ht=null;const Re=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],wi=[0,0,1,-1,0,0,1,0,0,0,-1,0,0,1,0,0,0,-1],bi=[0,0,1,0,1,1,0,1],yi=[0,1,2,2,3,0,4,0,3,3,7,4,1,5,6,6,2,1,1,0,4,4,5,1,3,2,6,6,7,3,5,4,7,7,6,5],_t=new Array(36);for(let o=0;o<6;o++)for(let e=0;e<6;e++)_t[6*o+e]=o;const se=new Array(36);for(let o=0;o<6;o++)se[6*o]=0,se[6*o+1]=1,se[6*o+2]=2,se[6*o+3]=2,se[6*o+4]=3,se[6*o+5]=0;function In(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(24);for(let t=0;t<8;t++)i[3*t]=Re[t][0]*e[0],i[3*t+1]=Re[t][1]*e[1],i[3*t+2]=Re[t][2]*e[2];return new K(o,[["position",new M(i,yi,3,!0)],["normal",new M(wi,_t,3)],["uv0",new M(bi,se,2)]])}const Ee=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],[0,-.5,0],[0,.5,0]],Pi=[0,1,-1,1,1,0,0,1,1,-1,1,0,0,-1,-1,1,-1,0,0,-1,1,-1,-1,0],$i=[5,1,0,5,2,1,5,3,2,5,0,3,4,0,1,4,1,2,4,2,3,4,3,0],Si=[0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7];function Hn(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(18);for(let t=0;t<6;t++)i[3*t]=Ee[t][0]*e[0],i[3*t+1]=Ee[t][1]*e[1],i[3*t+2]=Ee[t][2]*e[2];return new K(o,[["position",new M(i,$i,3,!0)],["normal",new M(Pi,Si,3)]])}const Pe=H(-.5,0,-.5),$e=H(.5,0,-.5),Se=H(0,0,.5),ze=H(0,.5,0),ce=Y(),ue=Y(),pe=Y(),de=Y(),he=Y();W(ce,Pe,ze),W(ue,Pe,$e),oe(pe,ce,ue),L(pe,pe),W(ce,$e,ze),W(ue,$e,Se),oe(de,ce,ue),L(de,de),W(ce,Se,ze),W(ue,Se,Pe),oe(he,ce,ue),L(he,he);const Ue=[Pe,$e,Se,ze],zi=[0,-1,0,pe[0],pe[1],pe[2],de[0],de[1],de[2],he[0],he[1],he[2]],Oi=[0,1,2,3,1,0,3,2,1,3,0,2],Ci=[0,0,0,1,1,1,2,2,2,3,3,3];function Bn(o,e){Array.isArray(e)||(e=[e,e,e]);const i=new Array(12);for(let t=0;t<4;t++)i[3*t]=Ue[t][0]*e[0],i[3*t+1]=Ue[t][1]*e[1],i[3*t+2]=Ue[t][2]*e[2];return new K(o,[["position",new M(i,Oi,3,!0)],["normal",new M(zi,Ci,3)]])}function Gn(o,e,i,t,n={uv:!0}){const r=-Math.PI,s=2*Math.PI,a=-Math.PI/2,l=Math.PI,c=Math.max(3,Math.floor(i)),u=Math.max(2,Math.floor(t)),p=(c+1)*(u+1),h=X(3*p),b=X(3*p),y=X(2*p),g=[];let d=0;for(let x=0;x<=u;x++){const C=[],f=x/u,z=a+f*l,O=Math.cos(z);for(let P=0;P<=c;P++){const B=P/c,w=r+B*s,j=Math.cos(w)*O,V=Math.sin(z),Q=-Math.sin(w)*O;h[3*d]=j*e,h[3*d+1]=V*e,h[3*d+2]=Q*e,b[3*d]=j,b[3*d+1]=V,b[3*d+2]=Q,y[2*d]=B,y[2*d+1]=f,C.push(d),++d}g.push(C)}const m=new Array;for(let x=0;x<u;x++)for(let C=0;C<c;C++){const f=g[x][C],z=g[x][C+1],O=g[x+1][C+1],P=g[x+1][C];x===0?(m.push(f),m.push(O),m.push(P)):x===u-1?(m.push(f),m.push(z),m.push(O)):(m.push(f),m.push(z),m.push(O),m.push(O),m.push(P),m.push(f))}const v=[["position",new M(h,m,3,!0)],["normal",new M(b,m,3,!0)]];return n.uv&&v.push(["uv0",new M(y,m,2,!0)]),n.offset&&(v[0][0]="offset",v.push(["position",new M(Float64Array.from(n.offset),Vt(m.length),3,!0)])),new K(o,v)}function Ln(o,e,i,t){const n=Ai(e,i);return new K(o,n)}function Ai(o,e,i){let t,n;t=[0,-1,0,1,0,0,0,0,1,-1,0,0,0,0,-1,0,1,0],n=[0,1,2,0,2,3,0,3,4,0,4,1,1,5,2,2,5,3,3,5,4,4,5,1];for(let l=0;l<t.length;l+=3)dt(t,l,o/pt(t,l));let r={};function s(l,c){l>c&&([l,c]=[c,l]);const u=l.toString()+"."+c.toString();if(r[u])return r[u];let p=t.length;return t.length+=3,vi(t,3*l,t,3*c,t,p),dt(t,p,o/pt(t,p)),p/=3,r[u]=p,p}for(let l=0;l<e;l++){const c=n.length,u=new Array(4*c);for(let p=0;p<c;p+=3){const h=n[p],b=n[p+1],y=n[p+2],g=s(h,b),d=s(b,y),m=s(y,h),v=4*p;u[v]=h,u[v+1]=g,u[v+2]=m,u[v+3]=b,u[v+4]=d,u[v+5]=g,u[v+6]=y,u[v+7]=m,u[v+8]=d,u[v+9]=g,u[v+10]=d,u[v+11]=m}n=u,r={}}const a=it(t);for(let l=0;l<a.length;l+=3)mi(a,l);return[["position",new M(it(t),n,3,!0)],["normal",new M(a,n,3,!0)]]}function qn(o,{normal:e,position:i,color:t,rotation:n,size:r,centerOffsetAndDistance:s,uvi:a,featureAttribute:l,olidColor:c=null}={}){const u=i?Je(i):F(),p=e?Je(e):Pt(0,0,1),h=t?[t[0],t[1],t[2],t.length>3?t[3]:255]:[255,255,255,255],b=r!=null&&r.length===2?r:[1,1],y=n!=null?[n]:[0],g=Vt(1),d=[["position",new M(u,g,3,!0)],["normal",new M(p,g,3,!0)],["color",new M(h,g,4,!0)],["size",new M(b,g,2)],["rotation",new M(y,g,1,!0)]];if(a&&d.push(["uvi",new M(a,g,a.length)]),s!=null){const m=[s[0],s[1],s[2],s[3]];d.push(["centerOffsetAndDistance",new M(m,g,4)])}if(l){const m=[l[0],l[1],l[2],l[3]];d.push(["featureAttribute",new M(m,g,4)])}return new K(o,d,null,1,c,void 0,gi())}function Mi(o,e,i,t,n=!0,r=!0){let s=0;const a=e,l=o;let c=H(0,s,0),u=H(0,s+l,0),p=H(0,-1,0),h=H(0,1,0);t&&(s=l,u=H(0,0,0),c=H(0,s,0),p=H(0,1,0),h=H(0,-1,0));const b=[u,c],y=[p,h],g=i+2,d=Math.sqrt(l*l+a*a);if(t)for(let f=i-1;f>=0;f--){const z=f*(2*Math.PI/i),O=H(Math.cos(z)*a,s,Math.sin(z)*a);b.push(O);const P=H(l*Math.cos(z)/d,-a/d,l*Math.sin(z)/d);y.push(P)}else for(let f=0;f<i;f++){const z=f*(2*Math.PI/i),O=H(Math.cos(z)*a,s,Math.sin(z)*a);b.push(O);const P=H(l*Math.cos(z)/d,a/d,l*Math.sin(z)/d);y.push(P)}const m=new Array,v=new Array;if(n){for(let f=3;f<b.length;f++)m.push(1),m.push(f-1),m.push(f),v.push(0),v.push(0),v.push(0);m.push(b.length-1),m.push(2),m.push(1),v.push(0),v.push(0),v.push(0)}if(r){for(let f=3;f<b.length;f++)m.push(f),m.push(f-1),m.push(0),v.push(f),v.push(f-1),v.push(1);m.push(0),m.push(2),m.push(b.length-1),v.push(1),v.push(2),v.push(y.length-1)}const x=X(3*g);for(let f=0;f<g;f++)x[3*f]=b[f][0],x[3*f+1]=b[f][1],x[3*f+2]=b[f][2];const C=X(3*g);for(let f=0;f<g;f++)C[3*f]=y[f][0],C[3*f+1]=y[f][1],C[3*f+2]=y[f][2];return[["position",new M(x,m,3,!0)],["normal",new M(C,v,3,!0)]]}function Nn(o,e,i,t,n,r=!0,s=!0){return new K(o,Mi(e,i,t,n,r,s))}function kn(o,e,i,t,n,r,s){const a=n?ot(n):H(1,0,0),l=r?ot(r):H(0,0,0);s??=!0;const c=Y();L(c,a);const u=Y();G(u,c,Math.abs(e));const p=Y();G(p,u,-.5),q(p,p,l);const h=H(0,1,0);Math.abs(1-Xe(c,h))<.2&&ie(h,0,0,1);const b=Y();oe(b,c,h),L(b,b),oe(h,b,c);const y=2*t+(s?2:0),g=t+(s?2:0),d=X(3*y),m=X(3*g),v=X(2*y),x=new Array(3*t*(s?4:2)),C=new Array(3*t*(s?4:2));s&&(d[3*(y-2)]=p[0],d[3*(y-2)+1]=p[1],d[3*(y-2)+2]=p[2],v[2*(y-2)]=0,v[2*(y-2)+1]=0,d[3*(y-1)]=d[3*(y-2)]+u[0],d[3*(y-1)+1]=d[3*(y-2)+1]+u[1],d[3*(y-1)+2]=d[3*(y-2)+2]+u[2],v[2*(y-1)]=1,v[2*(y-1)+1]=1,m[3*(g-2)]=-c[0],m[3*(g-2)+1]=-c[1],m[3*(g-2)+2]=-c[2],m[3*(g-1)]=c[0],m[3*(g-1)+1]=c[1],m[3*(g-1)+2]=c[2]);const f=(w,j,V)=>{x[w]=j,C[w]=V};let z=0;const O=Y(),P=Y();for(let w=0;w<t;w++){const j=w*(2*Math.PI/t);G(O,h,Math.sin(j)),G(P,b,Math.cos(j)),q(O,O,P),m[3*w]=O[0],m[3*w+1]=O[1],m[3*w+2]=O[2],G(O,O,i),q(O,O,p),d[3*w]=O[0],d[3*w+1]=O[1],d[3*w+2]=O[2],v[2*w]=w/t,v[2*w+1]=0,d[3*(w+t)]=d[3*w]+u[0],d[3*(w+t)+1]=d[3*w+1]+u[1],d[3*(w+t)+2]=d[3*w+2]+u[2],v[2*(w+t)]=w/t,v[2*w+1]=1;const V=(w+1)%t;f(z++,w,w),f(z++,w+t,w),f(z++,V,V),f(z++,V,V),f(z++,w+t,w),f(z++,V+t,V)}if(s){for(let w=0;w<t;w++){const j=(w+1)%t;f(z++,y-2,g-2),f(z++,w,g-2),f(z++,j,g-2)}for(let w=0;w<t;w++){const j=(w+1)%t;f(z++,w+t,g-1),f(z++,y-1,g-1),f(z++,j+t,g-1)}}const B=[["position",new M(d,x,3,!0)],["normal",new M(m,C,3,!0)],["uv0",new M(v,x,2,!0)]];return new K(o,B)}function Wn(o,e,i,t,n,r){t=t||10,n=n==null||n,Tt(e.length>1);const s=[[0,0,0]],a=[],l=[];for(let c=0;c<t;c++){a.push([0,-c-1,-(c+1)%t-1]);const u=c/t*2*Math.PI;l.push([Math.cos(u)*i,Math.sin(u)*i])}return Di(o,l,e,s,a,n,r)}function Di(o,e,i,t,n,r,s=H(0,0,0)){const a=e.length,l=X(i.length*a*3+(6*t.length||0)),c=X(i.length*a*3+(t?6:0)),u=new Array,p=new Array;let h=0,b=0;const y=F(),g=F(),d=F(),m=F(),v=F(),x=F(),C=F(),f=F(),z=F(),O=F(),P=F(),B=F(),w=F(),j=Zo();ie(z,0,1,0),W(g,i[1],i[0]),L(g,g),r?(q(f,i[0],s),L(d,f)):ie(d,0,0,1),mt(g,d,z,z,v,d,vt),N(m,d),N(B,v);for(let S=0;S<t.length;S++)G(x,v,t[S][0]),G(f,d,t[S][2]),q(x,x,f),q(x,x,i[0]),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2];c[b++]=-g[0],c[b++]=-g[1],c[b++]=-g[2];for(let S=0;S<n.length;S++)u.push(n[S][0]>0?n[S][0]:-n[S][0]-1+t.length),u.push(n[S][1]>0?n[S][1]:-n[S][1]-1+t.length),u.push(n[S][2]>0?n[S][2]:-n[S][2]-1+t.length),p.push(0),p.push(0),p.push(0);let V=t.length;const Q=t.length-1;for(let S=0;S<i.length;S++){let ve=!1;S>0&&(N(y,g),S<i.length-1?(W(g,i[S+1],i[S]),L(g,g)):ve=!0,q(O,y,g),L(O,O),q(P,i[S-1],m),Jo(i[S],O,j),ei(j,ti(P,y),f)?(W(f,f,i[S]),L(d,f),oe(v,O,d),L(v,v)):mt(O,m,B,z,v,d,vt),N(m,d),N(B,v)),r&&(q(f,i[S],s),L(w,f));for(let J=0;J<a;J++)if(G(x,v,e[J][0]),G(f,d,e[J][1]),q(x,x,f),L(C,x),c[b++]=C[0],c[b++]=C[1],c[b++]=C[2],q(x,x,i[S]),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2],!ve){const je=(J+1)%a;u.push(V+J),u.push(V+a+J),u.push(V+je),u.push(V+je),u.push(V+a+J),u.push(V+a+je);for(let Te=0;Te<6;Te++){const Lt=u.length-6;p.push(u[Lt+Te]-Q)}}V+=a}const le=i[i.length-1];for(let S=0;S<t.length;S++)G(x,v,t[S][0]),G(f,d,t[S][1]),q(x,x,f),q(x,x,le),l[h++]=x[0],l[h++]=x[1],l[h++]=x[2];const Z=b/3;c[b++]=g[0],c[b++]=g[1],c[b++]=g[2];const k=V-a;for(let S=0;S<n.length;S++)u.push(n[S][0]>=0?V+n[S][0]:-n[S][0]-1+k),u.push(n[S][2]>=0?V+n[S][2]:-n[S][2]-1+k),u.push(n[S][1]>=0?V+n[S][1]:-n[S][1]-1+k),p.push(Z),p.push(Z),p.push(Z);const ne=[["position",new M(l,u,3,!0)],["normal",new M(c,p,3,!0)]];return new K(o,ne)}function Yn(o,e,i,t,n){const r=xo(3*e.length),s=new Array(2*(e.length-1));let a=0,l=0;for(let u=0;u<e.length;u++){for(let p=0;p<3;p++)r[a++]=e[u][p];u>0&&(s[l++]=u-1,s[l++]=u)}const c=[["position",new M(r,s,3,!0)]];if(i&&i.length===e.length&&i[0].length===3){const u=X(3*i.length);let p=0;for(let h=0;h<e.length;h++)for(let b=0;b<3;b++)u[p++]=i[h][b];c.push(["normal",new M(u,s,3,!0)])}return t&&c.push(["color",new M(t,Qo(t.length/4),4)]),new K(o,c,null,2)}function Xn(o,e,i,t,n,r=0){const s=new Array(18),a=[[-i,r,n/2],[t,r,n/2],[0,e+r,n/2],[-i,r,-n/2],[t,r,-n/2],[0,e+r,-n/2]],l=[0,1,2,3,0,2,2,5,3,1,4,5,5,2,1,1,0,3,3,4,1,4,3,5];for(let c=0;c<6;c++)s[3*c]=a[c][0],s[3*c+1]=a[c][1],s[3*c+2]=a[c][2];return new K(o,[["position",new M(s,l,3,!0)]])}function Kn(o,e){const i=o.getMutableAttribute("position").data;for(let t=0;t<i.length;t+=3){const n=i[t],r=i[t+1],s=i[t+2];ie(fe,n,r,s),ae(fe,fe,e),i[t]=fe[0],i[t+1]=fe[1],i[t+2]=fe[2]}}function Qn(o,e=o){const i=o.attributes,t=i.get("position").data,n=i.get("normal").data;if(n){const r=e.getMutableAttribute("normal").data;for(let s=0;s<n.length;s+=3){const a=n[s+1];r[s+1]=-n[s+2],r[s+2]=a}}if(t){const r=e.getMutableAttribute("position").data;for(let s=0;s<t.length;s+=3){const a=t[s+1];r[s+1]=-t[s+2],r[s+2]=a}}}function Ie(o,e,i,t,n){return!(Math.abs(Xe(e,o))>n)&&(oe(i,o,e),L(i,i),oe(t,i,o),L(t,t),!0)}function mt(o,e,i,t,n,r,s){return Ie(o,e,n,r,s)||Ie(o,i,n,r,s)||Ie(o,t,n,r,s)}const vt=.99619469809,fe=F();function Vi(o){return o instanceof Float32Array&&o.length>=16}function ji(o){return Array.isArray(o)&&o.length>=16}function Ti(o){return Vi(o)||ji(o)}const Rt=.5;function Fi(o,e){o.include(Ot),o.attributes.add("position","vec3"),o.attributes.add("normal","vec3"),o.attributes.add("centerOffsetAndDistance","vec4");const i=o.vertex;bo(i,e),yo(i,e),i.uniforms.add(new Ke("viewport",t=>t.camera.fullViewport),new Be("polygonOffset",t=>t.shaderPolygonOffset),new Ae("cameraGroundRelative",t=>t.camera.aboveGround?1:-1)),e.hasVerticalOffset&&Po(i),i.code.add($`struct ProjectHUDAux {
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
}`)}class Ei extends Oo{constructor(e,i,t){super(e,"vec4",2,(n,r,s)=>n.setUniform4fv(e,i(r,s),t))}}function Ui(o){const e=new si,{signedDistanceFieldEnabled:i,occlusionTestEnabled:t,horizonCullingEnabled:n,pixelSnappingEnabled:r,hasScreenSizePerspective:s,debugDrawLabelBorder:a,hasVVSize:l,hasVVColor:c,hasRotation:u,occludedFragmentFade:p,sampleSignedDistanceFieldTexelCenter:h}=o;e.include(Fi,o),e.vertex.include(Co,o);const{occlusionPass:b,output:y,oitPass:g}=o;if(b)return e.include(_i,o),e;const{vertex:d,fragment:m}=e;e.include(Ot),e.include(Ao,o),e.include(Mo,o),t&&e.include(Ri),m.include(Do),e.varyings.add("vcolor","vec4"),e.varyings.add("vtc","vec2"),e.varyings.add("vsize","vec2");const v=y===9,x=v&&t;x&&e.varyings.add("voccluded","float"),d.uniforms.add(new Ke("viewport",P=>P.camera.fullViewport),new nt("screenOffset",(P,B)=>We(Oe,2*P.screenOffset[0]*B.camera.pixelRatio,2*P.screenOffset[1]*B.camera.pixelRatio)),new nt("anchorPosition",P=>be(P)),new Fe("materialColor",P=>P.color),new Be("materialRotation",P=>P.rotation),new st("tex",P=>P.texture)),Ct(d),i&&(d.uniforms.add(new Fe("outlineColor",P=>P.outlineColor)),m.uniforms.add(new Fe("outlineColor",P=>gt(P)?P.outlineColor:to),new Be("outlineSize",P=>gt(P)?P.outlineSize:0))),n&&d.uniforms.add(new Ei("pointDistanceSphere",(P,B)=>{const w=B.camera.eye,j=P.origin;return oo(j[0]-w[0],j[1]-w[1],j[2]-w[2],Nt.radius)})),r&&d.include(Ze),s&&(Vo(d),At(d)),a&&e.varyings.add("debugBorderCoords","vec4"),e.attributes.add("uv0","vec2"),e.attributes.add("uvi","vec4"),e.attributes.add("color","vec4"),e.attributes.add("size","vec2"),e.attributes.add("rotation","float"),(l||c)&&e.attributes.add("featureAttribute","vec4"),d.code.add(n?$`bool behindHorizon(vec3 posModel) {
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
    ${U(s,$`
        inputSize = screenSizePerspectiveScaleVec2(size, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspective);
        vec2 screenOffsetScaled = screenSizePerspectiveScaleVec2(screenOffset, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspectiveAlignment);`,$`
        inputSize = size;
        vec2 screenOffsetScaled = screenOffset;`)}
    ${U(l,$`inputSize *= vvScale(featureAttribute).xx;`)}

    vec2 combinedSize = inputSize * pixelRatio;
    vec4 quadOffset = vec4(0.0);

    ${U(t,$`
    bool visible = testHUDVisibility(posProj);
    if (!visible) {
      vtc = vec2(0.0);
      ${U(a,"debugBorderCoords = vec4(0.5, 0.5, 1.5 / combinedSize);")}
      return;
    }`)}
    ${U(x,$`voccluded = visible ? 0.0 : 1.0;`)}
  `);const C=$`
      vec2 uv = mix(uvi.xy, uvi.zw, bvec2(uv0));
      vec2 texSize = vec2(textureSize(tex, 0));
      uv = mix(vec2(1.0), uv / texSize, lessThan(uv, vec2(${Hi})));
      quadOffset.xy = (uv0 - anchorPosition) * 2.0 * combinedSize;

      ${U(u,$`
          float angle = radians(materialRotation + rotation);
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);
          mat2 rotate = mat2(cosAngle, -sinAngle, sinAngle,  cosAngle);

          quadOffset.xy = rotate * quadOffset.xy;
        `)}

      quadOffset.xy = (quadOffset.xy + screenOffsetScaled) / viewport.zw * posProj.w;
  `,f=r?i?$`posProj = alignToPixelOrigin(posProj, viewport.zw) + quadOffset;`:$`posProj += quadOffset;
if (inputSize.x == size.x) {
posProj = alignToPixelOrigin(posProj, viewport.zw);
}`:$`posProj += quadOffset;`;d.main.add($`
    ${C}
    ${c?"vcolor = interpolateVVColor(featureAttribute.y) * materialColor;":"vcolor = color / 255.0 * materialColor;"}

    ${U(y===10,$`vcolor.a = 1.0;`)}

    bool alphaDiscard = vcolor.a < ${$.float(te)};
    ${U(i,`alphaDiscard = alphaDiscard && outlineColor.a < ${$.float(te)};`)}
    if (alphaDiscard) {
      // "early discard" if both symbol color (= fill) and outline color (if applicable) are transparent
      gl_Position = vec4(1e38, 1e38, 1e38, 1.0);
      return;
    } else {
      ${f}
      gl_Position = posProj;
    }

    vtc = uv;

    ${U(a,$`debugBorderCoords = vec4(uv01, 1.5 / combinedSize);`)}
    vsize = inputSize;
  `),m.uniforms.add(new st("tex",P=>P.texture)),p&&!v&&m.uniforms.add(new Mt("depthMap",P=>P.mainDepth),new Ae("occludedOpacity",P=>P.hudOccludedFragmentOpacity));const z=a?$`(isBorder > 0.0 ? 0.0 : ${$.float(te)})`:$.float(te),O=$`
    ${U(a,$`float isBorder = float(any(lessThan(debugBorderCoords.xy, debugBorderCoords.zw)) || any(greaterThan(debugBorderCoords.xy, 1.0 - debugBorderCoords.zw)));`)}

    vec2 samplePos = vtc;

    ${U(h,$`
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

        ${U(!v,$`fragColor = vec4(compositeColor, compositeAlpha);`)}
      } else {
        if (fillAlphaFactor < ${z}) {
          discard;
        }

        ${U(!v,$`fragColor = premultiplyAlpha(fillPixelColor);`)}
      }

      // visualize SDF:
      // fragColor = vec4(clamp(-pixelDistance/vsize.x*2.0, 0.0, 1.0), clamp(pixelDistance/vsize.x*2.0, 0.0, 1.0), 0.0, 1.0);
      `:$`
          vec4 texColor = texture(tex, samplePos, -0.5);
          if (texColor.a < ${z}) {
            discard;
          }
          ${U(!v,$`fragColor = texColor * premultiplyAlpha(vcolor);`)}
          `}

    ${U(p&&!v,$`
        float zSample = texelFetch(depthMap, ivec2(gl_FragCoord.xy), 0).x;
        if (zSample < gl_FragCoord.z) {
          fragColor *= occludedOpacity;
        }
        `)}

    ${U(!v&&a,$`fragColor = mix(fragColor, vec4(1.0, 0.0, 1.0, 1.0), isBorder * 0.5);`)}
  `;switch(y){case 0:case 1:e.outputs.add("fragColor","vec4",0),y===1&&e.outputs.add("fragEmission","vec4",1),g===1&&e.outputs.add("fragAlpha","float",y===1?2:1),m.main.add($`
        ${O}
        ${U(g===2,$`fragColor.rgb /= fragColor.a;`)}
        ${U(y===1,$`fragEmission = vec4(0.0);`)}
        ${U(g===1,$`fragAlpha = fragColor.a;`)}`);break;case 10:m.main.add($`
        ${O}
        outputObjectAndLayerIdColor();`);break;case 9:e.include(jo,o),m.main.add($`
        ${O}
        outputHighlight(${U(x,$`voccluded == 1.0`,$`false`)});`)}return e}function gt(o){return o.outlineColor[3]>0&&o.outlineSize>0}function be(o){return o.textureIsSignedDistanceField?Ii(o.anchorPosition,o.distanceFieldBoundingBox,Oe):uo(Oe,o.anchorPosition),Oe}function Ii(o,e,i){We(i,o[0]*(e[2]-e[0])+e[0],o[1]*(e[3]-e[1])+e[1])}const Oe=Qe(),Me=32e3,Hi=$.float(Me),Bi=Object.freeze(Object.defineProperty({__proto__:null,build:Ui,calculateAnchorPosition:be,fullUV:Me},Symbol.toStringTag,{value:"Module"}));class Gi extends Fo{constructor(e,i){super(e,i,new _o(Bi,()=>ri(()=>import("./Br3fzMdT.js").then(t=>t.H),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63]),import.meta.url)),fi([Et,It()].map(ai))),this.primitiveType=i.occlusionPass?ct.POINTS:ct.TRIANGLE_STRIP}initializePipeline(e){const{oitPass:i,hasPolygonOffset:t,draped:n,output:r,depthTestEnabled:s,occlusionPass:a}=e,l=s&&!n&&i!==1&&!a&&r!==9;return li({blending:Dt(r)?Eo(i,!0):null,depthTest:s&&!n?{func:515}:null,depthWrite:l?ui:null,drawBuffers:Ro(i,r),colorWrite:ci,polygonOffset:t?Li:null})}}const Li={factor:0,units:-4},Et=Ft().vec2u8("uv0",{glNormalized:!0}),Ut=Ft().vec3f("position").vec3f("normal").vec4i16("uvi").vec4u8("color").vec2f("size").f32("rotation").vec4f("centerOffsetAndDistance").vec4f("featureAttribute"),qi=Ut.clone().vec4u8("olidColor");function It(){return To()?qi:Ut}class _ extends Uo{constructor(e){super(),this.spherical=e,this.screenCenterOffsetUnitsEnabled=!1,this.occlusionTestEnabled=!0,this.signedDistanceFieldEnabled=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.hasVVSize=!1,this.hasVVColor=!1,this.hasVerticalOffset=!1,this.hasScreenSizePerspective=!1,this.hasRotation=!1,this.debugDrawLabelBorder=!1,this.hasPolygonOffset=!1,this.depthTestEnabled=!0,this.pixelSnappingEnabled=!0,this.draped=!1,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.occlusionPass=!1,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!0,this.isFocused=!0,this.olidColorInstanced=!1,this.textureCoordinateType=0,this.emissionSource=0,this.discardInvisibleFragments=!0,this.hasVVInstancing=!1,this.snowCover=!1}}I([E()],_.prototype,"screenCenterOffsetUnitsEnabled",void 0),I([E()],_.prototype,"occlusionTestEnabled",void 0),I([E()],_.prototype,"signedDistanceFieldEnabled",void 0),I([E()],_.prototype,"sampleSignedDistanceFieldTexelCenter",void 0),I([E()],_.prototype,"hasVVSize",void 0),I([E()],_.prototype,"hasVVColor",void 0),I([E()],_.prototype,"hasVerticalOffset",void 0),I([E()],_.prototype,"hasScreenSizePerspective",void 0),I([E()],_.prototype,"hasRotation",void 0),I([E()],_.prototype,"debugDrawLabelBorder",void 0),I([E()],_.prototype,"hasPolygonOffset",void 0),I([E()],_.prototype,"depthTestEnabled",void 0),I([E()],_.prototype,"pixelSnappingEnabled",void 0),I([E()],_.prototype,"draped",void 0),I([E()],_.prototype,"terrainDepthTest",void 0),I([E()],_.prototype,"cullAboveTerrain",void 0),I([E()],_.prototype,"occlusionPass",void 0),I([E()],_.prototype,"occludedFragmentFade",void 0),I([E()],_.prototype,"horizonCullingEnabled",void 0),I([E()],_.prototype,"isFocused",void 0);class Zn extends Io{constructor(e,i){super(e,Qi),this.produces=new Map([[13,t=>_e(t)&&!this.parameters.drawAsLabel],[14,t=>_e(t)&&this.parameters.drawAsLabel],[12,()=>this.parameters.occlusionTest],[18,t=>this.parameters.draped&&_e(t)]]),this._visible=!0,this._configuration=new _(i)}getConfiguration(e,i){const t=this.parameters.draped;return super.getConfiguration(e,i,this._configuration),this._configuration.hasSlicePlane=this.parameters.hasSlicePlane,this._configuration.hasVerticalOffset=!!this.parameters.verticalOffset,this._configuration.hasScreenSizePerspective=!!this.parameters.screenSizePerspective,this._configuration.screenCenterOffsetUnitsEnabled=this.parameters.centerOffsetUnits==="screen",this._configuration.hasPolygonOffset=this.parameters.polygonOffset,this._configuration.draped=t,this._configuration.occlusionTestEnabled=this.parameters.occlusionTest,this._configuration.pixelSnappingEnabled=this.parameters.pixelSnappingEnabled,this._configuration.signedDistanceFieldEnabled=this.parameters.textureIsSignedDistanceField,this._configuration.sampleSignedDistanceFieldTexelCenter=this.parameters.sampleSignedDistanceFieldTexelCenter,this._configuration.hasRotation=this.parameters.hasRotation,this._configuration.hasVVSize=!!this.parameters.vvSize,this._configuration.hasVVColor=!!this.parameters.vvColor,this._configuration.occlusionPass=i.slot===12,this._configuration.occludedFragmentFade=!t&&this.parameters.occludedFragmentFade,this._configuration.horizonCullingEnabled=this.parameters.horizonCullingEnabled,this._configuration.isFocused=this.parameters.isFocused,this._configuration.depthTestEnabled=this.parameters.depthEnabled||i.slot===12,Dt(e)&&(this._configuration.debugDrawLabelBorder=!!Ho.LABELS_SHOW_BORDER),this._configuration.oitPass=i.oitPass,this._configuration.terrainDepthTest=i.terrainDepthTest,this._configuration.cullAboveTerrain=i.cullAboveTerrain,this._configuration}intersect(e,i,t,n,r,s){const{options:{selectionMode:a,hud:l,excludeLabels:c},point:u,camera:p}=t,{parameters:h}=this;if(!a||!l||c&&h.isLabel||!e.visible||!u||!p)return;const b=e.attributes.get("featureAttribute"),y=b==null?null:et(b.data,qe),{scaleX:g,scaleY:d}=Ne(y,h,p.pixelRatio);$t(Ce,i),e.attributes.has("featureAttribute")&&Wi(Ce);const m=e.attributes.get("position"),v=e.attributes.get("size"),x=e.attributes.get("normal"),C=e.attributes.get("rotation"),f=e.attributes.get("centerOffsetAndDistance");Tt(m.size>=3);const z=be(h),O=this.parameters.centerOffsetUnits==="screen";for(let P=0;P<m.data.length/m.size;P++){const B=P*m.size;ie(A,m.data[B],m.data[B+1],m.data[B+2]),ae(A,A,i),ae(A,A,p.viewMatrix);const w=P*f.size;if(ie(T,f.data[w],f.data[w+1],f.data[w+2]),!O&&(A[0]+=T[0],A[1]+=T[1],T[2]!==0)){const V=T[2];L(T,A),W(A,A,G(T,T,V))}const j=P*x.size;if(ie(re,x.data[j],x.data[j+1],x.data[j+2]),Ge(re,Ce,p,xe),ke(this.parameters,A,xe,p,me),p.applyProjection(A,D),D[0]>-1){O&&(T[0]||T[1])&&(D[0]+=T[0]*p.pixelRatio,T[1]!==0&&(D[1]+=me.alignmentEvaluator.apply(T[1])*p.pixelRatio),p.unapplyProjection(D,A)),D[0]+=this.parameters.screenOffset[0]*p.pixelRatio,D[1]+=this.parameters.screenOffset[1]*p.pixelRatio,D[0]=Math.floor(D[0]),D[1]=Math.floor(D[1]);const V=P*v.size;R[0]=v.data[V],R[1]=v.data[V+1],me.evaluator.applyVec2(R,R);const Q=Gt*p.pixelRatio;let le=0;h.textureIsSignedDistanceField&&(le=Math.min(h.outlineSize,.5*R[0])*p.pixelRatio/2),R[0]*=g,R[1]*=d;const Z=P*C.size,k=h.rotation+C.data[Z];if(Le(u,D[0],D[1],R,Q,le,k,h,z)){const ne=t.ray;if(ae(De,A,wt(Bt,p.viewMatrix)),D[0]=u[0],D[1]=u[1],p.unprojectFromRenderScreen(D,A)){const S=F();N(S,ne.direction);const ve=1/we(S);G(S,S,ve),s(zt(ne.origin,A)*ve,S,-1,De)}}}}}intersectDraped(e,i,t,n,r){const s=e.attributes.get("position"),a=e.attributes.get("size"),l=e.attributes.get("rotation"),c=this.parameters,u=be(c),p=e.attributes.get("featureAttribute"),h=p==null?null:et(p.data,qe),{scaleX:b,scaleY:y}=Ne(h,c,e.screenToWorldRatio),g=Xi*e.screenToWorldRatio;for(let d=0;d<s.data.length/s.size;d++){const m=d*s.size,v=s.data[m],x=s.data[m+1],C=d*a.size;R[0]=a.data[C],R[1]=a.data[C+1];let f=0;c.textureIsSignedDistanceField&&(f=Math.min(c.outlineSize,.5*R[0])*e.screenToWorldRatio/2),R[0]*=b,R[1]*=y;const z=d*l.size,O=c.rotation+l.data[z];Le(t,v,x,R,g,f,O,c,u)&&n(r.distance,r.normal,-1)}}createBufferWriter(){return new Zi}applyShaderOffsetsView(e,i,t,n,r,s,a){const l=Ge(i,t,r,xe);return this._applyVerticalGroundOffsetView(e,l,r,a),ke(this.parameters,a,l,r,s),this._applyPolygonOffsetView(a,l,n[3],r,a),this._applyCenterOffsetView(a,n,a),a}applyShaderOffsetsNDC(e,i,t,n,r){return this._applyCenterOffsetNDC(e,i,t,n),r!=null&&N(r,n),this._applyPolygonOffsetNDC(n,i,t,n),n}_applyPolygonOffsetView(e,i,t,n,r){const s=n.aboveGround?1:-1;let a=Math.sign(t);a===0&&(a=s);const l=s*a;if(this.parameters.shaderPolygonOffset<=0)return N(r,e);const c=ii(Math.abs(i.cosAngle),.01,1),u=1-Math.sqrt(1-c*c)/c/n.viewport[2];return G(r,e,l>0?u:1/u),r}_applyVerticalGroundOffsetView(e,i,t,n){const r=we(e),s=t.aboveGround?1:-1,a=t.computeRenderPixelSizeAtDist(r)*Rt,l=G(A,i.normal,s*a);return q(n,e,l),n}_applyCenterOffsetView(e,i,t){const n=this.parameters.centerOffsetUnits!=="screen";return t!==e&&N(t,e),n&&(t[0]+=i[0],t[1]+=i[1],i[2]&&(L(re,t),vo(t,t,G(re,re,i[2])))),t}_applyCenterOffsetNDC(e,i,t,n){const r=this.parameters.centerOffsetUnits!=="screen";return n!==e&&N(n,e),r||(n[0]+=i[0]/t.fullWidth*2,n[1]+=i[1]/t.fullHeight*2),n}_applyPolygonOffsetNDC(e,i,t,n){const r=this.parameters.shaderPolygonOffset;if(e!==n&&N(n,e),r){const s=t.aboveGround?1:-1,a=s*Math.sign(i[3]);n[2]-=(a||s)*r}return n}set visible(e){this._visible=e}get visible(){const{color:e,outlineSize:i,outlineColor:t}=this.parameters,n=e[3]>=te||i>=te&&t[3]>=te;return this._visible&&n}createGLMaterial(e){return new Ni(e)}calculateRelativeScreenBounds(e,i,t=yt()){return ki(this.parameters,e,i,t),t[2]=t[0]+e[0],t[3]=t[1]+e[1],t}}class Ni extends Ko{constructor(e){super({...e,...e.material.parameters})}beginSlot(e){return this.updateTexture(this._material.parameters.textureId),this._material.setParameters(this.textureBindParameters),this.getTechnique(Gi,e)}}function ki(o,e,i,t){t[0]=o.anchorPosition[0]*-e[0]+o.screenOffset[0]*i,t[1]=o.anchorPosition[1]*-e[1]+o.screenOffset[1]*i}function Ge(o,e,i,t){return Ti(e)&&(e=$t(Yi,e)),go(t.normal,o,e),ae(t.normal,t.normal,i.viewInverseTransposeMatrix),t.cosAngle=Xe(Ht,Ki),t}function Wi(o){const e=o[0],i=o[1],t=o[2],n=o[3],r=o[4],s=o[5],a=o[6],l=o[7],c=o[8],u=1/Math.sqrt(e*e+i*i+t*t),p=1/Math.sqrt(n*n+r*r+s*s),h=1/Math.sqrt(a*a+l*l+c*c);return o[0]=e*u,o[1]=i*u,o[2]=t*u,o[3]=n*p,o[4]=r*p,o[5]=s*p,o[6]=a*h,o[7]=l*h,o[8]=c*h,o}function Le(o,e,i,t,n,r,s,a,l){let c=e-n-t[0]*l[0],u=c+t[0]+2*n,p=i-n-t[1]*l[1],h=p+t[1]+2*n;const b=a.distanceFieldBoundingBox;return a.textureIsSignedDistanceField&&b!=null&&(c+=t[0]*b[0],p+=t[1]*b[1],u-=t[0]*(1-b[2]),h-=t[1]*(1-b[3]),c-=r,u+=r,p-=r,h+=r),We(xt,e,i),fo(ge,o,xt,ni(s)),ge[0]>c&&ge[0]<u&&ge[1]>p&&ge[1]<h}const me=new Bo,A=F(),re=F(),D=Ve(),Ht=F(),De=F(),ge=Qe(),xt=Qe(),Ce=St(),Yi=St(),Bt=bt(),ye=Ve(),T=F(),He=F(),qe=Ve(),xe={normal:Ht,cosAngle:0},Gt=1,Xi=2,R=jt(0,0),Ki=Pt(0,0,1);class Qi extends Go{constructor(){super(...arguments),this.renderOccluded=1,this.isDecoration=!1,this.color=tt(1,1,1,1),this.polygonOffset=!1,this.anchorPosition=jt(.5,.5),this.screenOffset=[0,0],this.shaderPolygonOffset=1e-5,this.textureIsSignedDistanceField=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.outlineColor=tt(1,1,1,1),this.outlineSize=0,this.distanceFieldBoundingBox=Ve(),this.rotation=0,this.hasRotation=!1,this.vvSizeEnabled=!1,this.vvSize=null,this.vvColor=null,this.vvOpacity=null,this.vvSymbolAnchor=null,this.vvSymbolRotationMatrix=null,this.hasSlicePlane=!1,this.pixelSnappingEnabled=!0,this.occlusionTest=!0,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!1,this.centerOffsetUnits="world",this.drawAsLabel=!1,this.depthEnabled=!0,this.isFocused=!0,this.focusStyle="bright",this.draped=!1,this.isLabel=!1}get hasVVSize(){return!!this.vvSize}get hasVVColor(){return!!this.vvColor}get hasVVOpacity(){return!!this.vvOpacity}}class Zi{constructor(){this.layout=Et,this.instanceLayout=It()}elementCount(e){return e.get("position").indices.length}elementCountBaseInstance(e){return e.get("uv0").indices.length}write(e,i,t,n,r,s){const{position:a,normal:l,color:c,size:u,rotation:p,centerOffsetAndDistance:h,featureAttribute:b,uvi:y}=r;No(t.get("position"),e,a,s),ko(t.get("normal"),i,l,s);const g=t.get("position").indices.length;let d=0,m=0,v=Me,x=Me;const C=t.get("uvi")?.data;C&&C.length>=4&&(d=C[0],m=C[1],v=C[2],x=C[3]);for(let f=0;f<g;++f){const z=s+f;y.setValues(z,d,m,v,x)}if(Wo(t.get("color"),4,c,s),rt(t.get("size"),u,s),Yo(t.get("rotation"),p,s),t.get("centerOffsetAndDistance")?at(t.get("centerOffsetAndDistance"),h,s):lt(h,s,g),t.get("featureAttribute")?at(t.get("featureAttribute"),b,s):lt(b,s,g),n!=null){const f=t.get("position")?.indices;if(f){const z=f.length,O=r.getField("olidColor",oi);Xo(n,O,z,s)}}return{numVerticesPerItem:1,numItems:g}}writeBaseInstance(e,i){const{uv0:t}=i;rt(e.get("uv0"),t,0)}intersect(e,i,t,n,r,s,a){const{options:{selectionMode:l,hud:c,excludeLabels:u},point:p,camera:h}=n;if(!l||!c||u&&i.isLabel||!p)return;const b=this.instanceLayout.createView(e),{position:y,normal:g,rotation:d,size:m,featureAttribute:v,centerOffsetAndDistance:x}=b,C=i.centerOffsetUnits==="screen",f=be(i);if(y==null||g==null||d==null||m==null||x==null||h==null)return;const z=v==null?null:v.getVec(0,qe),{scaleX:O,scaleY:P}=Ne(z,i,h.pixelRatio),B=y.count;for(let w=0;w<B;w++){if(y.getVec(w,A),t!=null&&q(A,A,t),ae(A,A,h.viewMatrix),x.getVec(w,ye),ie(T,ye[0],ye[1],ye[2]),!C&&(A[0]+=T[0],A[1]+=T[1],T[2]!==0)){const j=T[2];L(T,A),W(A,A,G(T,T,j))}if(g.getVec(w,re),Ge(re,Ce,h,xe),ke(i,A,xe,h,me),h.applyProjection(A,D),D[0]>-1){C&&(T[0]||T[1])&&(D[0]+=T[0]*h.pixelRatio,T[1]!==0&&(D[1]+=me.alignmentEvaluator.apply(T[1])*h.pixelRatio),h.unapplyProjection(D,A)),D[0]+=i.screenOffset[0]*h.pixelRatio,D[1]+=i.screenOffset[1]*h.pixelRatio,D[0]=Math.floor(D[0]),D[1]=Math.floor(D[1]),m.getVec(w,R),me.evaluator.applyVec2(R,R);const j=Gt*h.pixelRatio;let V=0;i.textureIsSignedDistanceField&&(V=Math.min(i.outlineSize,.5*R[0])*h.pixelRatio/2),R[0]*=O,R[1]*=P;const Q=d.get(w),le=i.rotation+Q;if(Le(p,D[0],D[1],R,j,V,le,i,f)){const Z=n.ray;if(ae(De,A,wt(Bt,h.viewMatrix)),D[0]=p[0],D[1]=p[1],h.unprojectFromRenderScreen(D,A)){const k=F();N(k,Z.direction);const ne=1/we(k);G(k,k,ne),a(zt(Z.origin,A)*ne,k,w,De)}}}}}}function Ne(o,e,i){return o==null||e.vvSize==null?{scaleX:i,scaleY:i}:(Lo(He,e,o),{scaleX:He[0]*i,scaleY:He[1]*i})}function ke(o,e,i,t,n){if(!o.verticalOffset?.screenLength){const l=we(e);return n.update(i.cosAngle,l,o.screenSizePerspective,o.screenSizePerspectiveMinPixelReferenceSize,o.screenSizePerspectiveAlignment,null),e}const r=we(e),s=o.screenSizePerspectiveAlignment??o.screenSizePerspective,a=qo(t,r,o.verticalOffset,i.cosAngle,s,o.screenSizePerspectiveMinPixelReferenceSize);return n.update(i.cosAngle,r,o.screenSizePerspective,o.screenSizePerspectiveMinPixelReferenceSize,o.screenSizePerspectiveAlignment,null),G(i.normal,i.normal,a),q(e,e,i.normal)}function Jn(o){return o.type==="point"}export{Fn as A,be as B,_n as D,In as E,Ui as F,Un as G,Yn as M,Hn as Q,Tn as U,Rn as Z,jn as a,Qn as b,Me as c,Fi as d,qn as e,Nn as f,En as g,Ln as h,Zn as i,mt as j,hi as k,Ze as l,Gn as m,Ri as n,Xn as o,Mi as p,Wn as q,Bn as r,Di as s,Jn as t,Ai as u,kn as w,Kn as y};

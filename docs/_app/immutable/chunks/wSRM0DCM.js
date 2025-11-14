import{_ as o,a as l}from"./Chk7m36c.js";import{b as p}from"./BFGjv385.js";import{l as u,h as m}from"./ABSTBJkg.js";import"./DSdBzmdi.js";import{d as g}from"./DJTz9cEt.js";let e=class extends g{initialize(){this.addHandles([u(()=>this.view.scale,()=>this._update(),m)],"constructor")}isUpdating(){const i=this.layer.sublayers.some(d=>d.renderer!=null),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=i&&(a||s||t||r);return p("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=o([l("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

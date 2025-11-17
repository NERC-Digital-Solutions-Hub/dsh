import{_ as o,a as l}from"./Aa_nm3Tf.js";import{b as p}from"./BFGjv385.js";import{watch as u,initial as m}from"./D5lfJVJF.js";import"./DSdBzmdi.js";import{d as g}from"./DTYMWdKp.js";let e=class extends g{initialize(){this.addHandles([u(()=>this.view.scale,()=>this._update(),m)],"constructor")}isUpdating(){const i=this.layer.sublayers.some(d=>d.renderer!=null),a=this._commandsQueue.updateTracking.updating,t=this._updatingRequiredPromise!=null,s=!this._workerProxy,r=this.dataUpdating,n=i&&(a||t||s||r);return p("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${t}
  -> updatingProxy ${s}
  -> updatingPipeline ${r}
`),n}};e=o([l("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

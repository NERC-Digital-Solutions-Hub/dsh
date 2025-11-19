import{_ as o,a as p}from"./CDGqq53N.js";import{b as u}from"./BzZgUCJc.js";import{a as l,m}from"./D1sKJjB8.js";import"./C9_KfL0q.js";import{d as g}from"./DcALBBh4.js";let e=class extends g{initialize(){this.addHandles([l(()=>this.view.scale,()=>this._update(),m)],"constructor")}isUpdating(){const a=this.layer.sublayers.some(d=>d.renderer!=null),i=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=a&&(i||s||t||r);return u("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${a}
  -> hasPendingCommand ${i}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=o([p("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

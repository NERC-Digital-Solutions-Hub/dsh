import{w as o,_ as u,a as l}from"./DwWpeHsS.js";import{a as p,m as g}from"./BUpj17sD.js";import{d as m}from"./DmDHEs9_.js";let e=class extends m{initialize(){this.addHandles([p(()=>this.view.scale,()=>this._update(),g)],"constructor")}isUpdating(){const a=this.layer.sublayers.some(d=>d.renderer!=null),i=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,n=this.dataUpdating,r=a&&(i||s||t||n);return o("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${r}
  -> hasRenderer ${a}
  -> hasPendingCommand ${i}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${n}
`),r}};e=u([l("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const y=e;export{y as default};

import{ag as o,r as u,a as l}from"./-Rap9rN9.js";import{l as p,h as g}from"./DJt6mz6N.js";import{c as h}from"./Cr9E_-Eq.js";let e=class extends h{initialize(){this.addHandles([p((()=>this.view.scale),(()=>this._update()),g)],"constructor")}isUpdating(){const i=this.layer.sublayers.some((d=>d.renderer!=null)),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,n=this.dataUpdating,r=i&&(a||s||t||n);return o("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${r}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${n}
`),r}};e=u([l("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const y=e;export{y as default};

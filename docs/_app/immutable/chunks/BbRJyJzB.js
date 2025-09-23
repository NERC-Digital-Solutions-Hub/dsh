import{r as o,a as u}from"./B1ITX55D.js";import{m as l}from"./ByNAQ7iQ.js";import{l as p,h as m}from"./BifNJpTd.js";import{c as g}from"./BPfOu0f_.js";let e=class extends g{initialize(){this.addHandles([p((()=>this.view.scale),(()=>this._update()),m)],"constructor")}isUpdating(){const i=this.layer.sublayers.some((d=>d.renderer!=null)),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=i&&(a||s||t||r);return l("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=o([u("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

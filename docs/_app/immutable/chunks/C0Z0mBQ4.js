import{r as o,a as u}from"./BNOt8YR4.js";import{m as l}from"./Rwg6dtTd.js";import{l as p,h as m}from"./CJiRSAJW.js";import{c as g}from"./CyewHfV7.js";let e=class extends g{initialize(){this.addHandles([p((()=>this.view.scale),(()=>this._update()),m)],"constructor")}isUpdating(){const i=this.layer.sublayers.some((d=>d.renderer!=null)),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=i&&(a||s||t||r);return l("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=o([u("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

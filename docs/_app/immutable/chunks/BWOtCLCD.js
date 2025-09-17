import{r as o,a as u}from"./IsMQoFqb.js";import{g as l}from"./B5jfOAyC.js";import{l as p,h as g}from"./BeCrDXwC.js";import{c as m}from"./ChMz01kn.js";let e=class extends m{initialize(){this.addHandles([p((()=>this.view.scale),(()=>this._update()),g)],"constructor")}isUpdating(){const i=this.layer.sublayers.some((d=>d.renderer!=null)),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=i&&(a||s||t||r);return l("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=o([u("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const f=e;export{f as default};

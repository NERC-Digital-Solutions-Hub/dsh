import{r as d,a as p}from"./iFuBOtDF.js";import{b as u}from"./DHq0rblm.js";import{l,h as m}from"./C8PpcA25.js";import"./BfhsIlKo.js";import{c as g}from"./C_0rqcEo.js";let e=class extends g{initialize(){this.addHandles([l((()=>this.view.scale),(()=>this._update()),m)],"constructor")}isUpdating(){const i=this.layer.sublayers.some((o=>o.renderer!=null)),a=this._commandsQueue.updateTracking.updating,s=this._updatingRequiredPromise!=null,t=!this._workerProxy,r=this.dataUpdating,n=i&&(a||s||t||r);return u("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${n}
  -> hasRenderer ${i}
  -> hasPendingCommand ${a}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
`),n}};e=d([p("esri.views.2d.layers.SubtypeGroupLayerView2D")],e);const P=e;export{P as default};

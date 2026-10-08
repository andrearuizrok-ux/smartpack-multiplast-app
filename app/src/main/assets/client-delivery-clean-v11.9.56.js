(()=>{
'use strict';
if(window.SPClientDeliveryClean11956)return;
const VERSION='V11.9.56';
const MARK='deliveryInitializedV11956';

const CLEAR_ARRAYS=[
  'orders','production','lidProduction','imlMovements','materialIn','materialOut','mixes','audit',
  'imlPurchaseOrders','productionSheets','deliveryRecords','productionRuns','productionEvents',
  'loadingSheetsV106','loadingSheetsV1167','finishedGoodsLots','finishedGoodsMovements',
  'rawMaterialLots','rawMaterialMovements','warehouseAllocations','warehousePreparationEvents',
  'truckLoads','plannerHistoryV115','scheduledMoldChangesV11931','emailOrderDraftsV115',
  'emailIMLConfirmationsV1163','supplierPayments','deletedOrders','machineDowntime',
  'complianceRecords','directorMessages','importHistoryV116','imlUsageEvents','smartPackMixturesV11949'
];
const CLEAR_OBJECTS=[
  'adminFinanceV1170','financeSpringV1173','financeSettings'
];
function getState(){try{return state}catch(_){return window.state||null}}
function emptyKey(s,k){
  if(!Object.prototype.hasOwnProperty.call(s,k))return;
  const v=s[k];
  if(Array.isArray(v))s[k]=[];
  else if(v&&typeof v==='object')s[k]={};
  else s[k]=null;
}
function resetIML(s){
  if(!Array.isArray(s.imls))return;
  s.imls=s.imls.map(x=>{
    if(!x||typeof x!=='object')return x;
    const y={...x};
    ['physical','reserved','incoming','ordered','inTransit','availableQty','qty','stock','onHand'].forEach(k=>{
      if(Object.prototype.hasOwnProperty.call(y,k))y[k]=0;
    });
    // Keep codes/descriptions/minimum stock/master data, reset only operational counters.
    return y;
  });
}
function clean(){
  const s=getState();
  if(!s)return false;
  if(s[MARK]===true)return true;

  CLEAR_ARRAYS.forEach(k=>emptyKey(s,k));
  CLEAR_OBJECTS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(s,k))s[k]={};});
  resetIML(s);

  // Operational counters / temporary states.
  s.mixtureSequenceV11955=0;
  if(s.materialCoverageRuntimeV11929)s.materialCoverageRuntimeV11929={};
  if(s.menuPrefsV115&&typeof s.menuPrefsV115==='object'){
    // keep UI preferences only; no operational data to clear here
  }

  // IMPORTANT: keep customers and suppliers untouched.
  // clientDirectory, clients, supplierDirectory and commercial price-list master data are preserved.
  s[MARK]=true;
  s.deliveryCleanedAtV11956=new Date().toISOString();

  try{if(typeof save==='function')save()}catch(e){console.error('[V11.9.56 save]',e)}
  setTimeout(()=>{
    try{window.POICloudV10?.syncNow?.()}catch(_){}
  },700);
  return true;
}
function refresh(){
  try{if(typeof renderCurrent==='function')renderCurrent()}catch(_){}
  try{window.SPPlannerV115?.render?.()}catch(_){}
  try{window.SPWorkerDashboardMenu11955?.renderDashboard?.()}catch(_){}
}
function boot(){
  let n=0;
  const attempt=()=>{
    n++;
    const s=getState();
    if(!s){if(n<30)setTimeout(attempt,150);return;}
    const already=s[MARK]===true;
    clean();
    if(!already){
      setTimeout(refresh,250);
      try{if(typeof toast==='function')toast('Piattaforma pronta per i dati reali del cliente.')}catch(_){}
    }
  };
  attempt();
}
window.SPClientDeliveryClean11956={version:VERSION,clean};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(()=>{
'use strict';
if(window.SPFinanceCleanDelivery11944)return;

const FLAG='spmp_v11944_finance_2026_cleaned';

function clean2026Finance(){
  if(localStorage.getItem(FLAG)==='1')return false;
  let changed=false;
  try{
    if(typeof state!=='undefined' && state){
      state.adminFinanceV1170=state.adminFinanceV1170||{records:[]};
      state.financeSpringV1173=state.financeSpringV1173||{};

      if(Array.isArray(state.adminFinanceV1170.records)){
        const before=state.adminFinanceV1170.records.length;
        state.adminFinanceV1170.records=state.adminFinanceV1170.records.filter(x=>!String(x?.period||'').startsWith('2026-'));
        changed=changed || before!==state.adminFinanceV1170.records.length;
      }

      if(Array.isArray(state.financeSpringV1173.snapshots)){
        const before=state.financeSpringV1173.snapshots.length;
        state.financeSpringV1173.snapshots=state.financeSpringV1173.snapshots.filter(x=>!String(x?.period||'').startsWith('2026-'));
        changed=changed || before!==state.financeSpringV1173.snapshots.length;
      }

      if(Array.isArray(state.financeSpringV1173.imports)){
        const before=state.financeSpringV1173.imports.length;
        state.financeSpringV1173.imports=state.financeSpringV1173.imports.filter(x=>!String(x?.period||'').startsWith('2026-'));
        changed=changed || before!==state.financeSpringV1173.imports.length;
      }

      if(state.financeSpringV1173.mappings && typeof state.financeSpringV1173.mappings==='object'){
        // mappings are company-level and remain valid; do not delete.
      }

      try{
        if(typeof save==='function') save();
      }catch(_){}
    }

    // Reset selected finance period away from 2026.
    localStorage.setItem('poi_finance_period_v1179','2025-12');
    sessionStorage.setItem('poi_finance_period_v1179','2025-12');

    const p=document.getElementById('financePeriodV1170');
    if(p) p.value='2025-12';

    // Remove old local snapshots from abandoned Finance experiments.
    [
      'spmp_nf33_snapshot_smartpack',
      'spmp_nf37_snapshot_smartpack'
    ].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});

    localStorage.setItem(FLAG,'1');

    try{
      window.SPSpringBalanceV1173?.rebuildFromSnapshots?.('smartpack');
      window.SPSpringBalanceV1173?.rebuildFromSnapshots?.('multiplast');
    }catch(_){}

    try{
      window.SPFinanceCloudV1179?.save?.('2025-12');
    }catch(_){}
  }catch(e){
    console.error('[V11.9.44 finance clean]',e);
  }
  return changed;
}

function refreshFinance(){
  try{
    const input=document.getElementById('financePeriodV1170');
    if(input)input.value='2025-12';
    window.SPReleaseV1170?.renderFinance?.('2025-12');
  }catch(_){}
  setTimeout(()=>{
    try{window.SPFinanceAnalysisV11922?.render?.(true)}catch(_){}
    try{window.SPFinanceHistory11942?.render?.(true)}catch(_){}
  },100);
}

function boot(){
  clean2026Finance();
  setTimeout(refreshFinance,180);
}
window.SPFinanceCleanDelivery11944={version:'V11.9.44',clean:clean2026Finance};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();

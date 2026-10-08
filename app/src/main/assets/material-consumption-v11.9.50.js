(()=>{
'use strict';
if(window.SPMaterialConsumption11950)return;
const $=id=>document.getElementById(id);
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=(v,d=2)=>N(v).toLocaleString('it-IT',{maximumFractionDigits:d,minimumFractionDigits:0});
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const now=()=>new Date().toISOString();

const FAMILIES=[
  {key:'bucket37',label:'Secchio 3,7 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/3LT|3[,.]?7/i.test(text(o))},
  {key:'bucket5',label:'Secchio 5 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/5LT|5\s?L/i.test(text(o))},
  {key:'bucket14',label:'Secchio 14 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/14LT|14\s?L/i.test(text(o))},
  {key:'bucket18',label:'Secchio 18 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/18LT|18\s?L/i.test(text(o))},
  {key:'lid37',label:'Coperchio 3,7 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/3CLT|3LT|3[,.]?7/i.test(text(o))},
  {key:'lid5',label:'Coperchio 5 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/5CLT|5LT|5\s?L/i.test(text(o))},
  {key:'lid14',label:'Coperchio 14 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/14/i.test(text(o))},
  {key:'lid18',label:'Coperchio 18 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/18/i.test(text(o))}
];
function text(o){return [o?.liters,o?.product,o?.name,o?.kind,o?.moldName].join(' ').toUpperCase()}
function ensure(){
  state.rawMaterialLots=Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[];
  state.rawMaterialMovements=Array.isArray(state.rawMaterialMovements)?state.rawMaterialMovements:[];
  state.productionRuns=Array.isArray(state.productionRuns)?state.productionRuns:[];
  state.materialConsumptionIssuesV11950=Array.isArray(state.materialConsumptionIssuesV11950)?state.materialConsumptionIssuesV11950:[];
}
function saveState(){try{save()}catch(_){}}
function orderForRun(r){return (state.orders||[]).find(o=>String(o.code)===String(r.orderCode))||(state.orders||[]).find(o=>String(o.parent)===String(r.parent)&&String(o.code||'').endsWith('A'))||null}
function familyFor(r){const o=orderForRun(r)||r;return FAMILIES.find(f=>f.match({...o,product:r?.product||o?.product,moldName:r?.moldId||''}))||null}
function weightFor(r){
  const o=orderForRun(r)||{};
  const direct=N(r.weightG||r.pieceWeightG||o.weightG||o.pieceWeightG);
  if(direct>0)return {weightG:direct,source:'ordine'};
  const fam=familyFor(r),cfg=state.materialCoverageConfigV11929||{};
  const w=fam?N(cfg[fam.key]?.weightG):0;
  return {weightG:w,source:fam?fam.label:'non configurato',family:fam};
}
function mixtureFor(r){
  if(!r?.mixtureIdV11949)return null;
  const m=(state.smartPackMixturesV11949||[]).find(x=>String(x.id)===String(r.mixtureIdV11949));
  if(m)return m;
  if(Array.isArray(r.mixtureComponentsV11949)&&r.mixtureComponentsV11949.length)return {id:r.mixtureIdV11949,name:r.mixtureNameV11949||'Miscela produzione',components:r.mixtureComponentsV11949};
  return null;
}
function lotsFor(material){return state.rawMaterialLots.filter(l=>String(l.materialName||l.category||'').trim()===String(material).trim()).slice().sort((a,b)=>String(a.receivedAt||a.date||a.createdAt||'').localeCompare(String(b.receivedAt||b.date||b.createdAt||'')))}
function available(material){return lotsFor(material).reduce((s,l)=>s+Math.max(0,N(l.qtyReceived)-N(l.qtyConsumed)),0)}
function runMoves(runId,material){return state.rawMaterialMovements.filter(m=>String(m.runIdV11950||m.runId||'')===String(runId)&&(!material||String(m.material||'')===String(material))&&m.autoProductionV11950)}
function postedFor(runId,material){return runMoves(runId,material).reduce((s,m)=>s+N(m.signedQtyV11950!=null?m.signedQtyV11950:(/REVERSAL|IN/i.test(String(m.type||''))?-N(m.qty):N(m.qty))),0)}
function issue(run,code,msg){
  const id=`${run.id}|${code}`;
  let x=state.materialConsumptionIssuesV11950.find(i=>i.id===id);
  if(!x){x={id,runId:run.id,orderCode:run.orderCode,parent:run.parent,createdAt:now()};state.materialConsumptionIssuesV11950.unshift(x)}
  Object.assign(x,{code,message:msg,status:'open',updatedAt:now(),mixtureName:run.mixtureNameV11949||'',operator:run.operator||''});
  run.materialConsumptionStatusV11950='pending';run.materialConsumptionIssueV11950=msg;
}
function closeIssues(run){for(const x of state.materialConsumptionIssuesV11950.filter(i=>String(i.runId)===String(run.id)&&i.status==='open')){x.status='resolved';x.resolvedAt=now()}run.materialConsumptionIssueV11950=''}
function consumeFIFO(run,material,qty){
  let left=qty,alloc=[];
  for(const lot of lotsFor(material)){
    if(left<=0.000001)break;
    const av=Math.max(0,N(lot.qtyReceived)-N(lot.qtyConsumed));if(av<=0)continue;
    const q=Math.min(av,left);lot.qtyConsumed=N(lot.qtyConsumed)+q;left-=q;alloc.push({lot,q});
  }
  if(left>0.0001){ // safety rollback
    for(const a of alloc)a.lot.qtyConsumed=Math.max(0,N(a.lot.qtyConsumed)-a.q);
    return false;
  }
  for(const a of alloc){state.rawMaterialMovements.unshift({id:uid('rmm'),type:'OUT',direction:'OUT',kind:'consumo produzione',date:new Date().toISOString().slice(0,10),createdAt:now(),material,qty:a.q,kg:a.q,quantity:a.q,signedQtyV11950:a.q,lotId:a.lot.id||'',lotCode:a.lot.lotCode||a.lot.code||'',runIdV11950:run.id,orderCode:run.orderCode,parent:run.parent,mixtureIdV11949:run.mixtureIdV11949,mixtureNameV11949:run.mixtureNameV11949,operator:run.operator||run.mixtureAssignedByV11949||'',reason:`Produzione reale · ${run.orderCode||run.parent||'ordine'} · ${run.mixtureNameV11949||'miscela'}`,autoProductionV11950:true});}
  return true;
}
function reverseLIFO(run,material,qty){
  let left=qty;
  const outs=runMoves(run.id,material).filter(m=>N(m.signedQtyV11950)>0).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  for(const mv of outs){
    if(left<=0.000001)break;
    const alreadyReversed=state.rawMaterialMovements.filter(x=>x.autoProductionV11950&&x.reversalOfV11950===mv.id).reduce((s,x)=>s+Math.abs(N(x.signedQtyV11950)),0);
    const open=Math.max(0,N(mv.signedQtyV11950)-alreadyReversed);if(open<=0)continue;
    const q=Math.min(open,left);const lot=state.rawMaterialLots.find(l=>String(l.id||'')===String(mv.lotId||''));if(lot)lot.qtyConsumed=Math.max(0,N(lot.qtyConsumed)-q);
    state.rawMaterialMovements.unshift({id:uid('rmm'),type:'IN_REVERSAL',direction:'IN',kind:'rettifica consumo produzione',date:new Date().toISOString().slice(0,10),createdAt:now(),material,qty:q,kg:q,quantity:q,signedQtyV11950:-q,lotId:mv.lotId||'',lotCode:mv.lotCode||'',runIdV11950:run.id,orderCode:run.orderCode,parent:run.parent,mixtureIdV11949:run.mixtureIdV11949,mixtureNameV11949:run.mixtureNameV11949,operator:run.operator||'',reason:'Rettifica quantità netta prodotta',reversalOfV11950:mv.id,autoProductionV11950:true});left-=q;
  }
  return left<=0.0001;
}
function reconcileRun(run){
  const net=Math.max(0,N(run.netProducedV104||run.netProducedV106||run.produced));
  if(net<=0)return true;
  const mix=mixtureFor(run);if(!mix){issue(run,'mixture','Miscela non selezionata per questa produzione.');return false}
  const w=weightFor(run);if(w.weightG<=0){issue(run,'weight',`Peso unitario non configurato (${w.source}). Configuralo in Materie prime.`);return false}
  if(!Array.isArray(mix.components)||!mix.components.length){issue(run,'components','La miscela non contiene componenti validi.');return false}
  const totalPct=mix.components.reduce((s,c)=>s+N(c.pct),0);if(Math.abs(totalPct-100)>0.02){issue(run,'pct','La miscela non totalizza 100%.');return false}
  const totalKg=net*w.weightG/1000;
  const targets=mix.components.map(c=>({material:String(c.material||'').trim(),target:totalKg*N(c.pct)/100})).filter(x=>x.material&&x.target>0);
  // Pre-check shortages for positive deltas to keep posting atomic.
  for(const t of targets){const posted=postedFor(run.id,t.material),delta=t.target-posted;if(delta>0.0001&&available(t.material)+0.0001<delta){issue(run,'stock',`${t.material}: servono ${F(delta)} kg, disponibili ${F(available(t.material))} kg.`);return false}}
  for(const t of targets){const posted=postedFor(run.id,t.material),delta=t.target-posted;if(delta>0.0001){if(!consumeFIFO(run,t.material,delta)){issue(run,'stock',`Stock insufficiente per ${t.material}.`);return false}}else if(delta<-0.0001){reverseLIFO(run,t.material,-delta)}}
  closeIssues(run);run.materialConsumptionStatusV11950='posted';run.materialConsumptionNetPiecesV11950=net;run.materialConsumptionKgV11950=totalKg;run.materialConsumptionWeightGV11950=w.weightG;run.materialConsumptionUpdatedAtV11950=now();return true;
}
let busy=false;
function reconcileAll(){if(busy)return;busy=true;try{ensure();let changed=false;for(const r of state.productionRuns){const before=String(r.materialConsumptionUpdatedAtV11950||'')+String(r.materialConsumptionIssueV11950||'');reconcileRun(r);const after=String(r.materialConsumptionUpdatedAtV11950||'')+String(r.materialConsumptionIssueV11950||'');if(before!==after)changed=true}if(changed)saveState();}finally{busy=false}}
function recentMoves(){return state.rawMaterialMovements.filter(m=>m.autoProductionV11950).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,20)}
function openIssues(){return state.materialConsumptionIssuesV11950.filter(x=>x.status==='open')}
function summary(){const moves=state.rawMaterialMovements.filter(m=>m.autoProductionV11950);const cutoff=Date.now()-30*86400000;let kg30=0;for(const m of moves){if(new Date(m.createdAt||m.date||0).getTime()>=cutoff)kg30+=N(m.signedQtyV11950)}return {kg30,issues:openIssues().length,moves:moves.length}}
function renderWarehouse(){
  const view=$('rawMaterialsView');if(!view||!view.classList.contains('active'))return;ensure();
  let sec=$('sp150Consumption');if(sec)sec.remove();sec=document.createElement('section');sec.id='sp150Consumption';sec.className='sp150-consumption';
  const s=summary(),issues=openIssues(),moves=recentMoves();
  sec.innerHTML=`<div class="sp150-head"><div><span>CONSUMI REALI DA PRODUZIONE</span><h2>Scarico automatico materie prime</h2><p>Il magazzino viene aggiornato sui pezzi netti realmente prodotti e sulla miscela registrata dall'operatore.</p></div><div class="sp150-kpis"><div><span>Consumo ultimi 30 gg</span><b>${F(s.kg30,1)} kg</b></div><div class="${s.issues?'warn':'ok'}"><span>Da verificare</span><b>${s.issues}</b></div></div></div>
  ${issues.length?`<div class="sp150-alert"><b>Consumi non registrati automaticamente</b><span>${issues.slice(0,5).map(x=>`Ordine ${E(x.orderCode||x.parent||'—')}: ${E(x.message)}`).join('<br>')}</span></div>`:''}
  <div class="sp150-grid"><div><div class="sp150-title"><b>Ultimi scarichi</b><span>Tracciati per ordine, miscela e lotto</span></div><div class="sp150-table"><div class="sp150-row head"><span>Data</span><span>Ordine</span><span>Materiale</span><span>Miscela</span><span>Kg</span></div>${moves.map(m=>`<div class="sp150-row"><span>${E(new Date(m.createdAt||m.date).toLocaleString('it-IT'))}</span><span><b>${E(m.orderCode||m.parent||'—')}</b><small>${E(m.operator||'')}</small></span><span>${E(m.material||'')}</span><span>${E(m.mixtureNameV11949||'')}</span><span class="${N(m.signedQtyV11950)<0?'rev':''}">${N(m.signedQtyV11950)<0?'+':'−'}${F(Math.abs(N(m.signedQtyV11950)),2)}</span></div>`).join('')||'<div class="sp150-empty">Nessun consumo automatico ancora registrato.</div>'}</div></div>
  <div><div class="sp150-title"><b>Regole dello scarico</b><span>Per evitare movimenti errati</span></div><div class="sp150-rules"><div><b>1</b><span>Usa solo i <strong>pezzi netti prodotti</strong>.</span></div><div><b>2</b><span>Applica il <strong>peso g/pezzo</strong> configurato.</span></div><div><b>3</b><span>Ripartisce i kg secondo le <strong>% della miscela</strong>.</span></div><div><b>4</b><span>Scarica i lotti in ordine <strong>FIFO</strong>.</span></div><div><b>5</b><span>Ogni aggiornamento scarica solo la <strong>differenza nuova</strong>.</span></div></div></div></div>`;
  const config=$('sp129MaterialConfig');if(config)config.insertAdjacentElement('afterend',sec);else view.prepend(sec);
}
function workerStatus(){
  if(typeof currentRole==='undefined'||currentRole!=='worker')return;const view=$('productionView');if(!view?.classList.contains('active'))return;
  for(const r of state.productionRuns||[]){const cards=[...view.querySelectorAll('.mix11949-run')];const card=cards.find(c=>(c.textContent||'').includes(`Ordine ${r.orderCode||r.parent||'—'}`));if(!card)continue;let st=card.querySelector('.sp150-worker-consumption');if(!st){st=document.createElement('div');st.className='sp150-worker-consumption';card.appendChild(st)}if(r.materialConsumptionStatusV11950==='posted')st.innerHTML=`<span>Materiale scaricato</span><b>${F(r.materialConsumptionKgV11950,2)} kg</b>`;else if(r.materialConsumptionIssueV11950)st.innerHTML=`<span>Consumo da verificare</span><b>${E(r.materialConsumptionIssueV11950)}</b>`;else st.innerHTML='';}
}
function styles(){if($('sp150Style'))return;const s=document.createElement('style');s.id='sp150Style';s.textContent=`
.sp150-consumption{margin:0 0 16px;padding:18px;border:1px solid #d7e5df;border-radius:18px;background:#fff;box-shadow:0 6px 18px rgba(23,57,74,.035)}.sp150-head{display:flex;justify-content:space-between;gap:18px;align-items:center}.sp150-head>div>span{font-size:8px;font-weight:950;letter-spacing:.09em;color:#26745c}.sp150-head h2{font-size:20px;margin:3px 0}.sp150-head p{font-size:9.5px;color:#667a73;margin:0}.sp150-kpis{display:flex;gap:8px}.sp150-kpis>div{min-width:130px;padding:10px 12px;border-radius:11px;background:#f4f8f6}.sp150-kpis span,.sp150-kpis b{display:block}.sp150-kpis span{font-size:8px;color:#6d817a}.sp150-kpis b{font-size:15px;margin-top:3px}.sp150-kpis .warn{background:#fff4e8}.sp150-kpis .ok{background:#eef9f3}.sp150-alert{margin-top:12px;padding:11px 13px;border-radius:11px;border:1px solid #e9c58d;background:#fff8ec}.sp150-alert b,.sp150-alert span{display:block}.sp150-alert b{font-size:10px;color:#805816}.sp150-alert span{font-size:8.5px;line-height:1.55;margin-top:3px;color:#6c5d43}.sp150-grid{display:grid;grid-template-columns:1.6fr .7fr;gap:12px;margin-top:13px}.sp150-title{display:flex;justify-content:space-between;margin-bottom:7px}.sp150-title b{font-size:11px}.sp150-title span{font-size:8px;color:#71847d}.sp150-table{border:1px solid #e1eae7;border-radius:11px;overflow:hidden}.sp150-row{display:grid;grid-template-columns:1fr .8fr 1fr 1fr .45fr;gap:8px;padding:8px 9px;border-top:1px solid #edf2f0;align-items:center;font-size:8px}.sp150-row.head{border-top:0;background:#f5f9f7;text-transform:uppercase;color:#6a7d76;font-weight:900}.sp150-row b,.sp150-row small{display:block}.sp150-row small{font-size:7px;color:#82918c}.sp150-row>span:last-child{font-weight:900;color:#a8444c;text-align:right}.sp150-row>span.rev{color:#1f775b}.sp150-empty{padding:18px;text-align:center;font-size:9px;color:#70827c}.sp150-rules{display:grid;gap:7px}.sp150-rules>div{display:grid;grid-template-columns:27px 1fr;gap:7px;padding:9px;background:#f7faf8;border-radius:10px}.sp150-rules b{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#e7f2ed;color:#246e58}.sp150-rules span{font-size:8.5px;line-height:1.45;color:#5e736b}.sp150-worker-consumption{grid-column:1/-1;margin-top:6px;padding:7px 9px;border-radius:9px;background:#eef8f3}.sp150-worker-consumption span,.sp150-worker-consumption b{display:block}.sp150-worker-consumption span{font-size:7px;color:#60776e}.sp150-worker-consumption b{font-size:8.5px;margin-top:2px;color:#245f4d}@media(max-width:900px){.sp150-head{display:block}.sp150-kpis{margin-top:10px}.sp150-grid{grid-template-columns:1fr}.sp150-row{grid-template-columns:1fr 1fr}.sp150-row.head{display:none}}
`;document.head.appendChild(s)}
function tick(){ensure();reconcileAll();renderWarehouse();workerStatus()}
function boot(){styles();[200,700,1600].forEach(ms=>setTimeout(tick,ms));setInterval(tick,1800)}
window.SPMaterialConsumption11950={version:'V11.9.50',reconcile:reconcileAll,render:renderWarehouse};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
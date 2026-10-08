
(()=>{
'use strict';
if(window.SPWorkerDashboardMenu11951)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let initialized=false;
let originalRenderCurrent=null;
let originalSetRole=null;

function ensureState(){
  state.smartPackMixturesV11949=Array.isArray(state.smartPackMixturesV11949)?state.smartPackMixturesV11949:[];
  state.rawMaterialLots=Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[];
  state.productionRuns=Array.isArray(state.productionRuns)?state.productionRuns:[];
  state.directorMessages=Array.isArray(state.directorMessages)?state.directorMessages:[];
}
function operatorName(){
  return $('#poi11930OperatorBadge b')?.textContent?.trim()
    || $('#userName')?.textContent?.trim()
    || 'Operatore';
}
function availableStock(){
  ensureState();
  const m=new Map();
  for(const lot of state.rawMaterialLots){
    const name=String(lot.materialName||lot.category||'').trim();
    if(!name)continue;
    const av=Math.max(0,N(lot.qtyReceived)-N(lot.qtyConsumed));
    m.set(name,(m.get(name)||0)+av);
  }
  return m;
}
function mixtureAvailable(m){
  if(!m?.components?.length)return 0;
  const stock=availableStock();
  let max=Infinity;
  for(const c of m.components){
    const pct=N(c.pct)/100;
    if(pct<=0)continue;
    max=Math.min(max,(stock.get(c.material)||0)/pct);
  }
  return Number.isFinite(max)?Math.max(0,max):0;
}
function activeRuns(){
  ensureState();
  return state.productionRuns.filter(r=>!['Completata','Chiuso parziale','Annullata'].includes(String(r.status||'')));
}
function unreadMessages(){
  ensureState();
  return state.directorMessages
    .filter(m=>m.active!==false)
    .filter(m=>!(Array.isArray(m.acknowledgements)&&m.acknowledgements.length));
}
function materialAlerts(){
  ensureState();
  const stock=availableStock();
  const used=new Set();
  for(const r of activeRuns()){
    const m=state.smartPackMixturesV11949.find(x=>String(x.id)===String(r.mixtureIdV11949));
    for(const c of (m?.components||[]))used.add(c.material);
  }
  return [...used].filter(n=>(stock.get(n)||0)<=0).length;
}
function ensureViews(){
  const content=$('.content');
  if(!content)return;
  if(!$('#workerDashboardView')){
    const v=document.createElement('section');
    v.className='view';
    v.id='workerDashboardView';
    content.prepend(v);
  }
  if(!$('#mixturesView')){
    const v=document.createElement('section');
    v.className='view';
    v.id='mixturesView';
    content.appendChild(v);
  }
}
function installNav(){
  try{
    if(typeof NAV!=='undefined'){
      NAV.worker=[
        ['workerDashboard','home','Panoramica'],
        ['production','factory','Produzione'],
        ['mixtures','layers','Miscele']
      ];
    }
    if(typeof META!=='undefined'){
      META.workerDashboard=['Panoramica operatore','Le attività di oggi in una sola schermata'];
      META.production=['Produzione','Ordini, avanzamenti, fogli e chiusura produzione'];
      META.mixtures=['Miscele','Composizioni collegate al magazzino materie prime'];
    }
  }catch(e){console.warn('[V11.9.51] nav',e)}
}
function hideEmbeddedMixtures(){
  const panel=$('#workerMixtures11949');
  if(panel)panel.style.setProperty('display','none','important');
}
function removeDuplicateOperatorBadgeFromMix(){
  // badge remains in Production; dashboard has its own compact identity.
}
function mixtureCards(){
  ensureState();
  const stock=availableStock();
  if(!state.smartPackMixturesV11949.length){
    return `<div class="wd51-empty">
      <b>Nessuna miscela registrata</b>
      <span>Crea la prima miscela utilizzando le materie prime già presenti in magazzino.</span>
      <button class="btn primary" data-wd52-new-mix>+ Nuova miscela</button>
    </div>`;
  }
  return state.smartPackMixturesV11949.map(m=>`
    <article class="wd51-mix-card">
      <div class="wd51-mix-top">
        <div><span>MISCELA</span><b>${E(m.name)}</b><small>${m.components?.length||0} componenti</small></div>
        <strong>${mixtureAvailable(m).toLocaleString('it-IT',{maximumFractionDigits:1})} kg</strong>
      </div>
      <div class="wd51-components">
        ${(m.components||[]).map(c=>`<div>
          <span>${E(c.material)}</span>
          <b>${N(c.pct).toLocaleString('it-IT',{maximumFractionDigits:2})}%</b>
          <small>${(stock.get(c.material)||0).toLocaleString('it-IT',{maximumFractionDigits:1})} kg disponibili</small>
        </div>`).join('')}
      </div>
      <div class="wd51-card-actions">
        <button class="btn" data-wd52-edit="${E(m.id)}">Modifica</button>
        <button class="btn danger" data-wd52-remove="${E(m.id)}">Elimina</button>
      </div>
    </article>`).join('');
}
function assignmentRows(){
  const runs=activeRuns();
  if(!runs.length)return `<div class="wd51-empty"><b>Nessun ordine in lavorazione</b><span>Gli ordini assegnati da Roberto compariranno qui.</span></div>`;
  return runs.map(r=>{
    const m=state.smartPackMixturesV11949.find(x=>String(x.id)===String(r.mixtureIdV11949));
    return `<article class="wd51-order-row ${m?'ready':'missing'}">
      <div>
        <span>${E(r.status||'In coda')}</span>
        <b>Ordine ${E(r.orderCode||r.parent||'—')} · ${E(r.product||'')}</b>
        <small>${E(r.client||'')} ${r.qty?`· ${N(r.qty).toLocaleString('it-IT')} pz`:''}</small>
      </div>
      <div class="wd51-order-mix">
        <span>Miscela utilizzata</span>
        <b>${m?E(m.name):'Da selezionare'}</b>
        <small>${m?`${mixtureAvailable(m).toLocaleString('it-IT',{maximumFractionDigits:1})} kg potenzialmente disponibili`:'Selezionala prima di avviare la produzione'}</small>
      </div>
      <button class="btn ${m?'':'primary'}" data-wd52-assign="${E(r.id)}">${m?'Cambia':'Seleziona miscela'}</button>
    </article>`;
  }).join('');
}
function renderMixtures(){
  if(currentRole!=='worker')return;
  ensureState();hideEmbeddedMixtures();
  const view=$('#mixturesView');if(!view)return;
  view.innerHTML=`
    <section class="wd51-page-head">
      <div>
        <span class="eyebrow">MATERIALE DI PRODUZIONE</span>
        <h2>Miscele</h2>
        <p>Crea e gestisci le composizioni utilizzate in reparto. Ogni componente è collegato al magazzino materie prime.</p>
      </div>
      <button class="btn primary wd51-main-btn" data-wd52-new-mix>+ Nuova miscela</button>
    </section>

    <div class="wd51-two-col">
      <section class="wd51-panel">
        <div class="wd51-panel-head">
          <div><span>MISCELE REGISTRATE</span><h3>Composizioni disponibili</h3></div>
          <small>${state.smartPackMixturesV11949.length} registrate</small>
        </div>
        <div class="wd51-mix-grid">${mixtureCards()}</div>
      </section>

      <section class="wd51-panel">
        <div class="wd51-panel-head">
          <div><span>ORDINI</span><h3>Collegamento miscela → produzione</h3></div>
          <small>${activeRuns().length} attivi</small>
        </div>
        <div class="wd51-order-list">${assignmentRows()}</div>
      </section>
    </div>

    <section class="wd51-info">
      <b>Come funziona</b>
      <span>La miscela viene selezionata prima dell'avvio della produzione e resta collegata all'ordine, al foglio, all'operatore e alla tracciabilità. Il magazzino viene scaricato sulla quantità realmente prodotta.</span>
    </section>`;
}
function dashboardRunRows(){
  const runs=activeRuns().slice(0,4);
  if(!runs.length)return `<div class="wd51-empty compact"><b>Nessun ordine attivo</b><span>Non ci sono produzioni da avviare o completare.</span></div>`;
  return runs.map(r=>{
    const m=state.smartPackMixturesV11949.find(x=>String(x.id)===String(r.mixtureIdV11949));
    return `<div class="wd51-dash-run">
      <div><span>${E(r.status||'In coda')}</span><b>${E(r.orderCode||r.parent||'—')} · ${E(r.product||'')}</b><small>${E(r.client||'')}</small></div>
      <div class="${m?'ok':'warn'}"><span>Miscela</span><b>${m?E(m.name):'Da selezionare'}</b></div>
    </div>`;
  }).join('');
}
function dashboardMessages(){
  const msgs=unreadMessages().slice(0,3);
  if(!msgs.length)return `<div class="wd51-empty compact"><b>Nessuna comunicazione da leggere</b><span>Le nuove indicazioni del responsabile appariranno qui.</span></div>`;
  return msgs.map(m=>`<div class="wd51-message ${m.severity==='urgent'?'urgent':''}">
    <div><span>${m.severity==='urgent'?'URGENTE':'COMUNICAZIONE'}</span><b>${m.target==='all'?'Tutto il reparto':E(m.target||'Reparto')}</b><p>${E(m.text)}</p></div>
    <button class="btn" onclick="v52OpenAcknowledge?.('${E(m.id)}')">Leggi</button>
  </div>`).join('');
}
function renderWorkerDashboard(){
  if(currentRole!=='worker')return;
  ensureState();hideEmbeddedMixtures();
  const view=$('#workerDashboardView');if(!view)return;
  const runs=activeRuns();
  const missingMix=runs.filter(r=>!r.mixtureIdV11949).length;
  const messages=unreadMessages().length;
  const matAlerts=materialAlerts();
  const op=operatorName();

  view.innerHTML=`
    <section class="wd51-hero">
      <div>
        <span class="eyebrow">REPARTO PRODUZIONE · OPERATORE ATTIVO</span>
        <h2>Buon lavoro, ${E(op)}</h2>
        <p>Qui trovi solo ciò che ti serve oggi: produzioni assegnate, miscele da selezionare, materiali e comunicazioni.</p>
      </div>
      <button class="btn primary wd51-main-btn" onclick="navTo('production')">Apri Produzione →</button>
    </section>

    <section class="wd51-kpis">
      <article><span>Produzioni attive</span><b>${runs.length}</b><small>Da avviare o completare</small></article>
      <article class="${missingMix?'warn':''}"><span>Miscele da selezionare</span><b>${missingMix}</b><small>Obbligatorie prima dell'avvio</small></article>
      <article class="${matAlerts?'danger':''}"><span>Materiali da verificare</span><b>${matAlerts}</b><small>Componenti senza disponibilità</small></article>
      <article class="${messages?'info':''}"><span>Comunicazioni da leggere</span><b>${messages}</b><small>Indicazioni del responsabile</small></article>
    </section>

    <div class="wd51-dashboard-grid">
      <section class="wd51-panel">
        <div class="wd51-panel-head">
          <div><span>PRODUZIONE</span><h3>Il tuo lavoro adesso</h3></div>
          <button class="btn" onclick="navTo('production')">Vedi tutto</button>
        </div>
        ${dashboardRunRows()}
      </section>

      <section class="wd51-panel">
        <div class="wd51-panel-head">
          <div><span>COMUNICAZIONI</span><h3>Da leggere</h3></div>
        </div>
        ${dashboardMessages()}
      </section>
    </div>

    <section class="wd51-quick">
      <button onclick="navTo('production')"><span>01</span><div><b>Produzione</b><small>Avvia, aggiorna o chiudi una lavorazione.</small></div><strong>→</strong></button>
      <button onclick="navTo('mixtures')"><span>02</span><div><b>Miscele</b><small>Crea composizioni e collegale agli ordini.</small></div><strong>→</strong></button>
    </section>`;
}
function renderCustom(){
  hideEmbeddedMixtures();
  if(currentRole!=='worker')return;
  if(currentView==='workerDashboard')renderWorkerDashboard();
  if(currentView==='mixtures')renderMixtures();
}
function wrapRenderCurrent(){
  if(originalRenderCurrent)return;
  originalRenderCurrent=window.renderCurrent || (typeof renderCurrent==='function'?renderCurrent:null);
  if(typeof originalRenderCurrent!=='function')return;
  const wrapped=function(){
    if(currentRole==='worker' && (currentView==='workerDashboard'||currentView==='mixtures')){
      renderCustom();
      return;
    }
    const out=originalRenderCurrent.apply(this,arguments);
    setTimeout(()=>{hideEmbeddedMixtures(); if(currentRole==='worker'&&currentView==='production')hideEmbeddedMixtures()},30);
    return out;
  };
  wrapped.__wd51=true;
  window.renderCurrent=wrapped;
  try{renderCurrent=wrapped}catch(_){}
}
function wrapSetRole(){
  if(originalSetRole)return;
  originalSetRole=window.setRole || (typeof setRole==='function'?setRole:null);
  if(typeof originalSetRole!=='function')return;
  const wrapped=function(r){
    const out=originalSetRole.apply(this,arguments);
    if(r==='worker'){
      setTimeout(()=>{
        installNav();
        currentView='workerDashboard';
        try{navTo('workerDashboard')}catch(_){}
      },20);
    }
    return out;
  };
  window.setRole=wrapped;
  try{setRole=wrapped}catch(_){}
}
function ensureInitialDashboard(){
  if(initialized)return;
  if(typeof currentRole==='undefined'||currentRole!=='worker')return;
  initialized=true;
  ensureViews();installNav();wrapRenderCurrent();wrapSetRole();
  if(currentView==='production'){
    currentView='workerDashboard';
    try{navTo('workerDashboard')}catch(_){}
  }else{
    try{renderNav()}catch(_){}
    renderCustom();
  }
}
function styles(){
  if($('#wd51Styles'))return;
  const st=document.createElement('style');st.id='wd51Styles';st.textContent=`
  #productionView #workerMixtures11949{display:none!important}
  .wd51-page-head,.wd51-hero,.wd51-panel,.wd51-info,.wd51-quick{background:#fff;border:1px solid #dbe7e5;border-radius:18px;box-shadow:0 3px 12px rgba(15,53,65,.04)}
  .wd51-page-head,.wd51-hero{padding:20px 22px;display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:14px}
  .wd51-page-head h2,.wd51-hero h2{margin:3px 0 5px;font-size:25px;color:#173442}.wd51-page-head p,.wd51-hero p{margin:0;max-width:800px;font-size:12px;line-height:1.55;color:#687d78}.wd51-main-btn{min-height:48px;font-size:13px;padding:0 18px}
  .wd51-two-col,.wd51-dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}.wd51-panel{padding:16px}.wd51-panel-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:11px}.wd51-panel-head span{display:block;font-size:9px;font-weight:950;letter-spacing:.08em;color:#3974da}.wd51-panel-head h3{margin:3px 0 0;font-size:17px}.wd51-panel-head small{font-size:9px;color:#71867f}
  .wd51-mix-grid,.wd51-order-list{display:grid;gap:9px}.wd51-mix-card,.wd51-order-row{border:1px solid #e0e9e6;border-radius:14px;padding:12px;background:#fbfdfc}.wd51-mix-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.wd51-mix-top span,.wd51-order-row span{display:block;font-size:8px;font-weight:850;color:#71847e}.wd51-mix-top b,.wd51-order-row b{display:block;font-size:12px;margin-top:2px}.wd51-mix-top small,.wd51-order-row small{display:block;font-size:8px;color:#7a8b86;margin-top:2px}.wd51-mix-top strong{font-size:15px;color:#24745d}
  .wd51-components{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:10px}.wd51-components>div{padding:8px;background:#f1f7f4;border-radius:9px}.wd51-components span,.wd51-components b,.wd51-components small{display:block}.wd51-components span{font-size:8px;color:#5d746c}.wd51-components b{font-size:10px;margin-top:2px}.wd51-components small{font-size:7px;color:#81918c;margin-top:2px}.wd51-card-actions{display:flex;gap:6px;margin-top:9px}
  .wd51-order-row{display:grid;grid-template-columns:1.2fr .9fr auto;gap:10px;align-items:center}.wd51-order-row.ready{background:#f5fbf8}.wd51-order-row.missing{background:#fff9ef;border-color:#ead9b4}.wd51-order-mix b{font-size:11px}
  .wd51-info{padding:13px 15px;display:flex;gap:12px;align-items:flex-start}.wd51-info b{font-size:10px;white-space:nowrap}.wd51-info span{font-size:10px;line-height:1.5;color:#647973}
  .wd51-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.wd51-kpis article{background:#fff;border:1px solid #dce7e5;border-radius:16px;padding:16px}.wd51-kpis span,.wd51-kpis b,.wd51-kpis small{display:block}.wd51-kpis span{font-size:10px;font-weight:850;color:#637a73}.wd51-kpis b{font-size:34px;margin:7px 0;color:#173642}.wd51-kpis small{font-size:9px;color:#788984}.wd51-kpis .warn{background:#fff9ef;border-color:#eadab6}.wd51-kpis .danger{background:#fff5f6;border-color:#eccfd2}.wd51-kpis .info{background:#f4f8fd;border-color:#d8e4f3}
  .wd51-dash-run{display:grid;grid-template-columns:1fr .7fr;gap:10px;padding:10px 0;border-bottom:1px solid #edf2f1}.wd51-dash-run:last-child{border-bottom:0}.wd51-dash-run span{display:block;font-size:8px;color:#70827d}.wd51-dash-run b{display:block;font-size:11px;margin-top:2px}.wd51-dash-run small{font-size:8px;color:#7a8984}.wd51-dash-run .ok,.wd51-dash-run .warn{padding:8px 10px;border-radius:10px}.wd51-dash-run .ok{background:#eef8f3}.wd51-dash-run .warn{background:#fff4df}
  .wd51-message{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px;border:1px solid #e3ebe9;border-radius:12px;margin-bottom:8px}.wd51-message.urgent{background:#fff4f5;border-color:#edcdd0}.wd51-message span{font-size:8px;font-weight:900;color:#a1672b}.wd51-message b{display:block;font-size:11px;margin-top:2px}.wd51-message p{font-size:10px;line-height:1.45;color:#5d716b;margin:4px 0 0}
  .wd51-quick{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}.wd51-quick button{border:1px solid #e0e9e6;border-radius:14px;background:#f8fbfa;padding:14px;display:grid;grid-template-columns:38px 1fr auto;gap:12px;text-align:left;align-items:center}.wd51-quick button>span{width:38px;height:38px;border-radius:12px;background:#e9f2f7;display:grid;place-items:center;font-size:10px;font-weight:900}.wd51-quick b,.wd51-quick small{display:block}.wd51-quick b{font-size:13px}.wd51-quick small{font-size:9px;color:#71847e;margin-top:3px}.wd51-quick strong{font-size:18px}
  .wd51-empty{padding:24px 14px;border:1px dashed #d6e3df;border-radius:13px;text-align:center}.wd51-empty.compact{padding:15px}.wd51-empty b,.wd51-empty span{display:block}.wd51-empty b{font-size:12px}.wd51-empty span{font-size:9px;color:#748780;margin:4px 0 10px}
  @media(max-width:1000px){.wd51-kpis{grid-template-columns:repeat(2,1fr)}.wd51-two-col,.wd51-dashboard-grid{grid-template-columns:1fr}.wd51-order-row{grid-template-columns:1fr}.wd51-components{grid-template-columns:1fr 1fr}}
  @media(max-width:650px){.wd51-page-head,.wd51-hero{display:block}.wd51-main-btn{margin-top:12px}.wd51-kpis,.wd51-quick{grid-template-columns:1fr}.wd51-components{grid-template-columns:1fr}}
  `;
  document.head.appendChild(st);
}
function boot(){
  styles();ensureViews();installNav();wrapRenderCurrent();wrapSetRole();
  ensureInitialDashboard();
  const tick=()=>{
    hideEmbeddedMixtures();
    if(typeof currentRole!=='undefined'&&currentRole==='worker'){
      ensureViews();installNav();
      if(currentView==='workerDashboard')renderWorkerDashboard();
      if(currentView==='mixtures')renderMixtures();
    }
  };
  [150,500,1200,2400].forEach(ms=>setTimeout(tick,ms));
  setInterval(tick,2500);
}
window.SPWorkerDashboardMenu11951={version:'V11.9.51',render:renderCustom,renderDashboard:renderWorkerDashboard,renderMixtures};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

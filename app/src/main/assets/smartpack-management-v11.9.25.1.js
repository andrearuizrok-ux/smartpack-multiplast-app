
(()=>{
'use strict';
const BUILD='V11.9.25.1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const N=v=>Number(v||0);
const F=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(N(v));
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function isSPRoberto(){
  try{return currentRole==='director' && company!=='multiplast' && company!=='group'}catch(_){return false}
}
function ensureState(){
  if(!Array.isArray(state.truckLoads)) state.truckLoads=[];
}
function lines(parent){return (state.orders||[]).filter(o=>String(o.parent)===String(parent))}
function main(parent){const a=lines(parent);return a.find(o=>String(o.code||'').endsWith('A'))||a[0]}
function delivered(parent){
  return (state.deliveryRecords||[]).filter(r=>String(r.parent)===String(parent)).reduce((a,r)=>a+N(r.qty),0)
}
function producedLine(code){
  const o=(state.orders||[]).find(x=>String(x.code)===String(code));
  const direct=N(o?.productionNetQtyV104||o?.productionProducedQtyV103||o?.produced||0);
  const runs=(state.productionRuns||[]).filter(r=>String(r.orderCode)===String(code)&&r.status!=='Annullata');
  return Math.max(direct, runs.reduce((a,r)=>a+N(r.netProducedV104||r.produced||0),0));
}
function producedOrder(parent){
  const ls=lines(parent); if(!ls.length)return 0;
  const vals=ls.map(x=>producedLine(x.code));
  return vals.length?Math.min(...vals):0;
}
function ready(parent){
  try{return N(window.SPFlowV101?.availableForOrder?.(parent))}catch(_){return 0}
}
function openOrders(){
  const groups=typeof groupOrders==='function'?groupOrders():[];
  return groups.filter(g=>{
    const a=main(g.parent); if(!a)return false;
    return !/complet|soddisfatt|annull|chiuso/i.test(String(a.status||'')) || N(a.qty)>delivered(g.parent);
  }).slice(0,25);
}
function coverage(){
  const outs=(state.materialOut||state.rawMaterialOut||[]), ins=(state.materialIn||state.rawMaterialIn||[]);
  const stock={};
  for(const x of ins){const k=String(x.material||x.name||x.code||'Materiale');stock[k]=(stock[k]||0)+N(x.kg||x.qty||x.quantity)}
  for(const x of outs){const k=String(x.material||x.name||x.code||'Materiale');stock[k]=(stock[k]||0)-N(x.kg||x.qty||x.quantity)}
  const total=Math.max(0,Object.values(stock).reduce((a,b)=>a+b,0));
  const cutoff=Date.now()-14*86400000;
  const recent=outs.filter(x=>{const d=new Date(x.date||x.at||0).getTime();return d>=cutoff});
  const used=recent.reduce((a,x)=>a+N(x.kg||x.qty||x.quantity),0);
  if(total>0&&used>0){
    const perDay=used/14, days=total/perDay;
    const d=new Date(Date.now()+days*86400000);
    return {big:`${days.toLocaleString('it-IT',{maximumFractionDigits:1})} giorni`,sub:`Copertura stimata fino al ${d.toLocaleDateString('it-IT')}`,tone:days<3?'risk':days<7?'warn':'ok'};
  }
  return {big:'Da verificare',sub:'Apri Magazzino interno per controllare materiale e fabbisogni.',tone:'warn'};
}
function truckAvailable(o){return Math.max(0,ready(o.parent)-truckLoaded(o.parent))}
function truckLoaded(parent){
  return (state.truckLoads||[]).flatMap(x=>x.items||[]).filter(i=>String(i.parent)===String(parent)&&xNotCancelled(i)).reduce((a,i)=>a+N(i.qty),0)
}
function xNotCancelled(i){return !/annull/i.test(String(i.status||''))}
function nav(v){try{navTo(v)}catch(_){}}
function addTruckView(){
  if($('#truckLoadsView'))return;
  const v=document.createElement('section');v.id='truckLoadsView';v.className='view';
  ($('#adminView')||$('.view'))?.insertAdjacentElement('afterend',v);
  try{
    META.truckLoads=['Caricamento camion','Prepara il carico usando solo quantità realmente disponibili'];
    if(NAV.director&&!NAV.director.some(x=>x[0]==='truckLoads')){
      const ix=NAV.director.findIndex(x=>x[0]==='admin');
      NAV.director.splice(ix>=0?ix:5,0,['truckLoads','orders','Caricamento camion']);
    }
  }catch(_){}
}
function removeComplianceDirector(){
  try{
    if(NAV?.director) NAV.director=NAV.director.filter(x=>x[0]!=='compliance');
    if(currentRole==='director'&&currentView==='compliance') currentView='dashboard';
    renderNav?.();
  }catch(_){}
  if(isSPRoberto()) $('#sp111Bell')?.classList.remove('show');
}
function orderRows(){
  return openOrders().map(g=>{
    const a=main(g.parent), ord=N(a?.qty), prod=producedOrder(g.parent), del=delivered(g.parent);
    const remain=Math.max(0,ord-prod), avail=Math.max(0,ready(g.parent)), pct=ord?Math.min(100,(prod/ord)*100):0;
    return `<tr><td><b>${E(g.parent)}</b><small>${E(a?.client||'')}</small></td><td>${E(a?.product||'')}</td>
    <td><b>${F(ord)}</b></td><td><b>${F(prod)}</b></td><td><b>${F(remain)}</b></td><td><b>${F(avail)}</b></td>
    <td><div class="ro25-progress"><i style="width:${pct}%"></i><span>${pct.toLocaleString('it-IT',{maximumFractionDigits:0})}%</span></div></td></tr>`;
  }).join('')||`<tr><td colspan="7"><div class="empty"><b>Nessun ordine aperto</b></div></td></tr>`;
}
function renderRobertoDashboard(){
  ensureState(); const os=openOrders(), cov=coverage();
  const readyN=os.filter(g=>ready(g.parent)>0).length;
  const active=(state.productionRuns||[]).filter(r=>['In produzione','In attesa','Bloccata'].includes(r.status)).length;
  $('#dashboardView').innerHTML=`
  <div class="ro25-head"><div><span>GESTIONE SMART PACK</span><h1>Gestione Smart Pack</h1><p>Prima guarda ordini, materiale e produzione. Da qui puoi avviare il foglio produzione o preparare il camion.</p></div>
    <div class="ro25-actions"><button class="btn primary" onclick="navTo('planner')">+ Crea foglio produzione</button><button class="btn ro25-dark" onclick="navTo('truckLoads')">+ Caricamento camion</button></div>
  </div>
  <div class="ro25-kpis">
    <div><span>ORDINI APERTI</span><b>${os.length}</b><small>Aggiornati con la produzione registrata</small></div>
    <div><span>PRODUZIONI ATTIVE</span><b>${active}</b><small>Monitor in tempo reale</small><button onclick="navTo('production')">Apri Monitor produzione →</button></div>
    <div><span>PRONTI AL CARICO</span><b>${readyN}</b><small>Ordini con prodotto disponibile</small><button onclick="navTo('truckLoads')">Prepara camion →</button></div>
    <div class="${cov.tone}"><span>COPERTURA MATERIALI</span><b>${E(cov.big)}</b><small>${E(cov.sub)}</small><button onclick="navTo('warehouse')">Apri Magazzino interno →</button></div>
  </div>
  <div class="section panel ro25-live"><div class="panel-head"><div><h3>Ordini aggiornati con la produzione</h3><p>Vista operativa degli ordini: ordinato, prodotto, residuo e quantità pronta al carico.</p></div><div class="right"><button class="btn" onclick="navTo('planner')">Coda Roberto</button><button class="btn" onclick="navTo('production')">Monitor produzione</button></div></div>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>Ordine / cliente</th><th>Prodotto</th><th>Ordinato</th><th>Prodotto</th><th>Da produrre</th><th>Pronto carico</th><th>Avanzamento</th></tr></thead><tbody>${orderRows()}</tbody></table></div></div>
  <div class="ro25-links"><b>Accessi rapidi</b><button onclick="navTo('planner')">Coda Roberto</button><button onclick="navTo('warehouse')">Magazzino interno</button><button onclick="navTo('imlOrders')">Ordini IML</button><button onclick="navTo('iml')">Giacenze IML</button><button onclick="navTo('trace')">Tracciabilità</button></div>`;
}
function renderTruckLoads(){
  ensureState(); const os=openOrders();
  $('#truckLoadsView').innerHTML=`<div class="hero"><div><span class="eyebrow">LOGISTICA PRODUZIONE</span><h2>Caricamento camion</h2><p>Le quantità disponibili derivano dalla produzione e dal magazzino prodotti finiti.</p></div><div class="hero-actions"><button class="btn primary" id="ro25NewTruck">+ Nuovo caricamento</button></div></div>
  <div class="section panel"><div class="panel-head"><div><h3>Carichi preparati</h3><p>Storico operativo dei camion.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Cliente</th><th>Destinazione</th><th>Vettore / targa</th><th>Quantità</th><th>Stato</th></tr></thead><tbody>
  ${(state.truckLoads||[]).map(x=>`<tr><td>${E(x.date||'—')}</td><td><b>${E(x.client||'—')}</b></td><td>${E(x.destination||'—')}</td><td>${E(x.vehicle||'—')}</td><td><b>${F((x.items||[]).reduce((a,i)=>a+N(i.qty),0))} pz</b></td><td><span class="status">${E(x.status||'Preparazione')}</span></td></tr>`).join('')||'<tr><td colspan="6"><div class="empty"><b>Nessun caricamento creato</b></div></td></tr>'}
  </tbody></table></div></div>`;
  $('#ro25NewTruck').onclick=()=>openTruckModal(os);
}
function openTruckModal(os){
  let d=$('#ro25TruckDialog');
  if(!d){d=document.createElement('dialog');d.id='ro25TruckDialog';d.innerHTML=`<div class="modal-head"><div><span class="eyebrow">CARICAMENTO CAMION</span><h3>Nuovo carico</h3><p>Inserisci solo quantità disponibili.</p></div><button class="close" type="button">×</button></div><form id="ro25TruckForm"><div class="modal-body"><div class="form-grid"><label class="field">Cliente<input name="client" required></label><label class="field">Data carico<input name="date" type="date" required></label><label class="field">Destinazione<input name="destination"></label><label class="field">Vettore / targa<input name="vehicle"></label></div><div id="ro25TruckItems" class="ro25-items"></div><label class="field">Note<textarea name="notes"></textarea></label></div><div class="modal-actions"><button type="button" class="btn" data-cancel>Annulla</button><button class="btn primary">Salva caricamento</button></div></form>`;document.body.appendChild(d);
    d.querySelector('.close').onclick=()=>d.close(); d.querySelector('[data-cancel]').onclick=()=>d.close();
  }
  d.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);
  $('#ro25TruckItems').innerHTML=os.map((g,i)=>{const a=main(g.parent), av=ready(g.parent);return `<label class="ro25-item"><input type="checkbox" name="sel_${i}" ${av>0?'checked':''}><span><b>Ordine ${E(g.parent)} · ${E(a?.client||'')}</b><small>${E(a?.product||'')}</small></span><span>Disponibile <b>${F(av)} pz</b></span><input type="number" name="qty_${i}" min="0" max="${av}" value="${av}"></label>`}).join('')||'<div class="empty">Nessun ordine con disponibilità.</div>';
  d.querySelector('form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),items=[];os.forEach((g,i)=>{if(!fd.get(`sel_${i}`))return;const q=N(fd.get(`qty_${i}`)),av=ready(g.parent);if(q>0&&q<=av){const a=main(g.parent);items.push({parent:g.parent,orderCode:a?.code||'',product:a?.product||'',qty:q,status:'Preparazione'})}});state.truckLoads.unshift({id:'LOAD-'+Date.now(),date:fd.get('date'),client:fd.get('client'),destination:fd.get('destination'),vehicle:fd.get('vehicle'),notes:fd.get('notes'),status:'Preparazione',items,createdAt:new Date().toISOString()});save();d.close();renderTruckLoads();toast?.('Caricamento camion salvato')};
  d.showModal();
}
function styles(){
  if($('#ro25Style'))return;const st=document.createElement('style');st.id='ro25Style';st.textContent=`
  .ro25-head{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,#fff,#f4fafb);box-shadow:var(--shadow);margin-bottom:14px}.ro25-head span{font-size:9px;font-weight:950;letter-spacing:.09em;color:#0b78d0}.ro25-head h1{font-size:28px;margin:4px 0}.ro25-head p{font-size:11px;color:var(--muted);margin:0}.ro25-actions{display:flex;gap:9px;flex-wrap:wrap}.ro25-dark{background:#17394a!important;color:#fff!important;border-color:#17394a!important}
  .ro25-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.ro25-kpis>div{padding:16px;border:1px solid var(--line);border-radius:16px;background:#fff}.ro25-kpis span,.ro25-kpis small{display:block}.ro25-kpis span{font-size:8px;font-weight:950;color:var(--muted)}.ro25-kpis b{display:block;font-size:24px;margin:5px 0}.ro25-kpis small{font-size:9px;color:var(--muted);line-height:1.4}.ro25-kpis button{border:0;background:transparent;color:var(--primary);font-size:8px;font-weight:900;padding:6px 0 0;cursor:pointer}.ro25-kpis .ok{background:#f3fbf7;border-color:#bfe1d2}.ro25-kpis .warn{background:#fff9ec;border-color:#ead7a6}.ro25-kpis .risk{background:#fff4f4;border-color:#e7b8bb}
  .ro25-live{margin-bottom:14px}.ro25-progress{min-width:105px;height:24px;background:#edf3f5;border-radius:999px;position:relative;overflow:hidden}.ro25-progress i{display:block;height:100%;background:#69b79c}.ro25-progress span{position:absolute;inset:0;display:grid;place-items:center;font-size:8px;font-weight:950}.data-table td small{display:block;font-size:8px;color:var(--muted);margin-top:2px}
  .ro25-links{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:#f8fbfc}.ro25-links b{margin-right:auto}.ro25-links button{border:1px solid var(--line);background:#fff;border-radius:9px;padding:8px 10px;font-weight:850;cursor:pointer}
  .ro25-items{display:grid;gap:7px;margin:14px 0}.ro25-item{display:grid;grid-template-columns:auto 1.8fr .8fr .6fr;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:11px}.ro25-item span small{display:block;color:var(--muted);font-size:8px}.ro25-item input[type=number]{width:100%;border:1px solid var(--line);border-radius:8px;padding:7px}
  @media(max-width:900px){.ro25-kpis{grid-template-columns:1fr 1fr}.ro25-head{display:block}.ro25-actions{margin-top:12px}.ro25-item{grid-template-columns:auto 1fr}.ro25-item input[type=number]{grid-column:2}}
  `;document.head.appendChild(st)}
function patch(){
  ensureState(); addTruckView(); removeComplianceDirector(); styles();
  try{
    const oldRenderCurrent=renderCurrent;
    if(!oldRenderCurrent.__ro25){renderCurrent=function(){if(currentView==='truckLoads')return renderTruckLoads();return oldRenderCurrent.apply(this,arguments)};renderCurrent.__ro25=true}
    const oldDash=renderDashboard;
    if(!oldDash.__ro25){renderDashboard=function(){if(isSPRoberto())return renderRobertoDashboard();return oldDash.apply(this,arguments)};renderDashboard.__ro25=true}
  }catch(_){}
  try{if(isSPRoberto()&&currentView==='dashboard')renderRobertoDashboard()}catch(_){}
  document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/,'V11.9.25');
}
function boot(){patch();setTimeout(patch,300);setTimeout(patch,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

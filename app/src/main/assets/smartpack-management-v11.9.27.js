(()=>{
'use strict';
const BUILD='V11.9.27';
const $=id=>document.getElementById(id);
const num=v=>Number(v||0);
const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(num(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function isSPDirector(){try{return company==='smartpack'&&currentRole==='director'}catch(_){return false}}
function ensureTruckState(){if(!Array.isArray(state.truckLoads))state.truckLoads=[]}
function lineMain(parent){const ls=(state.orders||[]).filter(o=>String(o.parent)===String(parent));return ls.find(o=>String(o.code||'').endsWith('A'))||ls[0]||null}
function producedFor(parent){
  const ls=(state.orders||[]).filter(o=>String(o.parent)===String(parent));
  if(!ls.length)return 0;
  const vals=ls.map(o=>{
    const direct=Math.max(num(o.productionNetQtyV104),num(o.productionProducedQtyV103),num(o.produced));
    const runs=(state.productionRuns||[]).filter(r=>String(r.orderCode)===String(o.code)&&!/annull/i.test(String(r.status||'')));
    const runTotal=runs.reduce((a,r)=>a+Math.max(num(r.netProducedV104),num(r.produced)),0);
    return Math.max(direct,runTotal);
  });
  return vals.length?Math.min(...vals):0;
}
function deliveredFor(parent){return (state.deliveryRecords||[]).filter(r=>String(r.parent)===String(parent)).reduce((a,r)=>a+num(r.qty),0)}
function readyFor(parent){
  try{if(window.SPFlowV101?.availableForOrder)return num(window.SPFlowV101.availableForOrder(parent))}catch(_){}
  const a=lineMain(parent);return Math.max(0,producedFor(parent)-deliveredFor(parent),num(a?.warehousePreparedQty)-deliveredFor(parent));
}
function openOrders(){
  let gs=[];try{gs=groupOrders()}catch(_){}
  return gs.filter(g=>{const a=lineMain(g.parent);return a&&!/annull|complet|soddisfatt|chiuso/i.test(String(a.status||''))}).slice(0,20);
}
function materialCoverage(){
  const lots=Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[];
  const available=lots.reduce((s,l)=>s+Math.max(0,num(l.qtyReceived)-num(l.qtyConsumed)),0);
  const moves=Array.isArray(state.rawMaterialMovements)?state.rawMaterialMovements:[];
  const cutoff=Date.now()-30*86400000;
  const used=moves.filter(m=>{
    const d=new Date(m.date||m.createdAt||0).getTime();
    return d>=cutoff && /out|usc|consum/i.test(String(m.type||m.direction||m.kind||''));
  }).reduce((s,m)=>s+Math.abs(num(m.qty||m.kg||m.quantity)),0);
  if(available<=0)return {value:'Da verificare',sub:'Nessuna giacenza valorizzata disponibile.',cls:'warn'};
  if(used<=0)return {value:`${fmt(available)} kg`,sub:'Stock disponibile. Storico consumi insufficiente per stimare i giorni.',cls:'warn'};
  const days=available/(used/30);
  const until=new Date(Date.now()+days*86400000);
  return {value:`${days.toLocaleString('it-IT',{maximumFractionDigits:1})} giorni`,sub:`Stima fino al ${until.toLocaleDateString('it-IT')} · ${fmt(available)} kg disponibili`,cls:days<3?'risk':days<7?'warn':'ok'};
}

function ensureTruckView(){
  if($('truckLoadsView'))return;
  const content=document.querySelector('.content');if(!content)return;
  const sec=document.createElement('section');sec.className='view';sec.id='truckLoadsView';content.appendChild(sec);
  try{META.truckLoads=['Caricamento camion','Prepara il carico con le quantità realmente disponibili']}catch(_){}
}
function ensureNavData(){
  try{
    NAV.director=NAV.director||[];
    NAV.director=NAV.director.filter(x=>x[0]!=='compliance');
    if(!NAV.director.some(x=>x[0]==='truckLoads'))NAV.director.push(['truckLoads','orders','Caricamento camion']);
    const labels={reports:'Analisi produzione',sheets:'Fogli produzione',rawMaterials:'Materie prime'};
    NAV.director.forEach(x=>{if(labels[x[0]])x[2]=labels[x[0]]});
  }catch(_){}
}

const GROUPS=[
  ['OPERATIVITÀ',['dashboard','orders','ordersRegister','production','planner','sheets','truckLoads']],
  ['PRODUZIONE E MAGAZZINO',['rawMaterials','warehouse','presses','imlOrders','iml','trace']],
  ['CONTROLLO',['reports','finance','pricing','admin']],
  ['CONFIGURAZIONE',['settings']]
];
function groupedNavHTML(){
  const items=NAV.director||[];const byId=new Map(items.map(x=>[x[0],x]));const used=new Set();let html='';
  for(const [label,ids] of GROUPS){
    const rows=ids.map(id=>byId.get(id)).filter(Boolean);if(!rows.length)continue;
    html+=`<div class="sp127-nav-group"><div class="sp127-nav-label">${label}</div>`;
    html+=rows.map(([v,i,l])=>{used.add(v);return `<button data-view="${v}" class="${currentView===v?'active':''}"><span class="icon">${icon(i)}</span>${esc(l)}</button>`}).join('');
    html+='</div>';
  }
  const extra=items.filter(x=>!used.has(x[0]));
  if(extra.length)html+=`<div class="sp127-nav-group"><div class="sp127-nav-label">ALTRO</div>${extra.map(([v,i,l])=>`<button data-view="${v}" class="${currentView===v?'active':''}"><span class="icon">${icon(i)}</span>${esc(l)}</button>`).join('')}</div>`;
  return html;
}
function renderSPNav(){
  const side=$('sideNav'),mobile=$('mobileNav');if(side)side.innerHTML=groupedNavHTML();
  if(mobile){
    const ids=['dashboard','ordersRegister','production','truckLoads'];const map=new Map((NAV.director||[]).map(x=>[x[0],x]));
    const rows=ids.map(x=>map.get(x)).filter(Boolean);
    mobile.innerHTML=rows.map(([v,i,l])=>`<button data-view="${v}" class="${currentView===v?'active':''}"><span>${icon(i)}</span>${esc(l)}</button>`).join('')+'<button id="sp127More" type="button"><span>☰</span>Altro</button>';
    $('sp127More')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navTo(b.dataset.view));
}

function dashboardAddon(){
  if(!isSPDirector())return;
  const view=$('dashboardView');if(!view||$('sp127Ops'))return;
  const orders=openOrders(),active=(state.productionRuns||[]).filter(r=>/produzione|attesa|blocc/i.test(String(r.status||''))).length,ready=orders.filter(g=>readyFor(g.parent)>0).length,cov=materialCoverage();
  const box=document.createElement('section');box.id='sp127Ops';box.className='sp127-ops';
  box.innerHTML=`<div class="sp127-head"><div><span>GESTIONE SMART PACK</span><h2>Centro operativo</h2><p>Ordini, produzione, materiali e carichi in una sola vista.</p></div><div class="sp127-actions"><button class="btn primary" data-go="sheets">+ Crea foglio produzione</button><button class="btn sp127-dark" data-go="truckLoads">+ Caricamento camion</button></div></div>
  <div class="sp127-kpis"><article><span>ORDINI APERTI</span><b>${orders.length}</b><small>Aggiornati dalla produzione</small></article><article><span>PRODUZIONI ATTIVE</span><b>${active}</b><small>Monitor produzione</small></article><article><span>PRONTI AL CARICO</span><b>${ready}</b><small>Con disponibilità reale</small></article><article class="${cov.cls}"><span>COPERTURA MATERIALI</span><b>${esc(cov.value)}</b><small>${esc(cov.sub)}</small></article></div>
  <div class="sp127-table"><div class="sp127-table-head"><div><h3>Ordini aggiornati</h3><p>Ordinato, prodotto, residuo e pronto al carico.</p></div><button class="btn" data-go="production">Monitor produzione</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Prodotto</th><th>Ordinato</th><th>Prodotto</th><th>Da produrre</th><th>Pronto carico</th></tr></thead><tbody>${orders.slice(0,8).map(g=>{const a=lineMain(g.parent),ord=num(a?.qty),prod=producedFor(g.parent);return `<tr><td><b>${esc(g.parent)}</b></td><td>${esc(a?.client||'')}</td><td>${esc(a?.product||'')}</td><td>${fmt(ord)}</td><td><b>${fmt(prod)}</b></td><td>${fmt(Math.max(0,ord-prod))}</td><td><b>${fmt(readyFor(g.parent))}</b></td></tr>`}).join('')||'<tr><td colspan="7">Nessun ordine aperto.</td></tr>'}</tbody></table></div></div>`;
  view.prepend(box);box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>navTo(b.dataset.go));
}

function renderTruck(){
  ensureTruckState();const view=$('truckLoadsView');if(!view)return;
  view.innerHTML=`<div class="hero"><div><span class="eyebrow">GESTIONE SMART PACK · LOGISTICA</span><h2>Caricamento camion</h2><p>Prepara il carico partendo soltanto dalle quantità realmente disponibili.</p></div><div class="hero-actions"><button class="btn primary" id="sp127NewLoad">+ Nuovo caricamento</button></div></div><div class="section panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Cliente</th><th>Destinazione</th><th>Targa / vettore</th><th>Quantità</th><th>Stato</th></tr></thead><tbody>${state.truckLoads.map(x=>`<tr><td>${esc(x.date||'—')}</td><td><b>${esc(x.client||'—')}</b></td><td>${esc(x.destination||'—')}</td><td>${esc(x.vehicle||'—')}</td><td>${fmt((x.items||[]).reduce((s,i)=>s+num(i.qty),0))} pz</td><td>${esc(x.status||'Preparazione')}</td></tr>`).join('')||'<tr><td colspan="6">Nessun caricamento creato.</td></tr>'}</tbody></table></div></div>`;
  $('sp127NewLoad').onclick=openLoadDialog;
}
function openLoadDialog(){
  let d=$('sp127LoadDlg');if(!d){d=document.createElement('dialog');d.id='sp127LoadDlg';d.innerHTML=`<form id="sp127LoadForm"><div class="modal-head"><div><span class="eyebrow">CARICAMENTO CAMION</span><h3>Nuovo carico</h3><p>Seleziona gli ordini e le quantità disponibili.</p></div><button type="button" class="close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Data<input name="date" type="date" required></label><label class="field">Cliente<input name="client" required></label><label class="field">Destinazione<input name="destination"></label><label class="field">Targa / vettore<input name="vehicle"></label></div><div id="sp127LoadItems"></div><label class="field full">Note<textarea name="notes"></textarea></label></div><div class="modal-actions"><button type="button" class="btn" data-cancel>Annulla</button><button class="btn primary">Salva caricamento</button></div></form>`;document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('[data-cancel]').onclick=()=>d.close();}
  const orders=openOrders();d.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);$('sp127LoadItems').innerHTML='<div class="sp127-load-list">'+orders.map((g,i)=>{const a=lineMain(g.parent),av=readyFor(g.parent);return `<label><input type="checkbox" name="sel_${i}" ${av>0?'checked':''}><span><b>${esc(g.parent)} · ${esc(a?.client||'')}</b><small>${esc(a?.product||'')}</small></span><span>Disponibile <b>${fmt(av)}</b></span><input type="number" name="qty_${i}" min="0" max="${av}" value="${av}"></label>`}).join('')+'</div>';
  $('sp127LoadForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),items=[];orders.forEach((g,i)=>{if(!fd.get(`sel_${i}`))return;const q=num(fd.get(`qty_${i}`)),av=readyFor(g.parent);if(q>0&&q<=av){const a=lineMain(g.parent);items.push({parent:g.parent,orderCode:a?.code||'',product:a?.product||'',qty:q})}});state.truckLoads.unshift({id:'LOAD-'+Date.now(),date:String(fd.get('date')||''),client:String(fd.get('client')||''),destination:String(fd.get('destination')||''),vehicle:String(fd.get('vehicle')||''),notes:String(fd.get('notes')||''),status:'Preparazione',items,createdAt:new Date().toISOString()});try{save()}catch(_){}d.close();renderTruck();try{toast('Caricamento camion salvato')}catch(_){}};d.showModal();
}

function styles(){if($('sp127Style'))return;const s=document.createElement('style');s.id='sp127Style';s.textContent=`
#sideNav .sp127-nav-group{display:grid;gap:3px;margin:0 0 10px}.sp127-nav-label{padding:9px 12px 4px;font-size:9px;font-weight:950;letter-spacing:.1em;color:#8ba0a9}.sp127-nav-group+.sp127-nav-group{border-top:1px solid rgba(255,255,255,.08);padding-top:5px}
.sp127-ops{margin-bottom:16px}.sp127-head{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:20px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.sp127-head span{font-size:9px;font-weight:950;color:#1680d7;letter-spacing:.08em}.sp127-head h2{margin:4px 0}.sp127-head p{margin:0;color:var(--muted)}.sp127-actions{display:flex;gap:8px;flex-wrap:wrap}.sp127-dark{background:#173e50!important;color:#fff!important}
.sp127-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.sp127-kpis article{padding:14px;border:1px solid var(--line);border-radius:15px;background:#fff}.sp127-kpis span,.sp127-kpis small{display:block}.sp127-kpis span{font-size:8px;font-weight:950;color:var(--muted)}.sp127-kpis b{display:block;font-size:22px;margin:5px 0}.sp127-kpis small{font-size:9px;color:var(--muted)}.sp127-kpis .ok{background:#f3fbf7}.sp127-kpis .warn{background:#fff8e9}.sp127-kpis .risk{background:#fff1f1}
.sp127-table{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}.sp127-table-head{padding:14px 16px;display:flex;justify-content:space-between;align-items:center}.sp127-table-head h3,.sp127-table-head p{margin:0}.sp127-table-head p{color:var(--muted);font-size:10px}.sp127-load-list{display:grid;gap:7px;margin:14px 0}.sp127-load-list label{display:grid;grid-template-columns:auto 1.5fr .8fr .5fr;align-items:center;gap:9px;padding:9px;border:1px solid var(--line);border-radius:10px}.sp127-load-list small{display:block;color:var(--muted)}
@media(max-width:900px){.sp127-head{display:block}.sp127-actions{margin-top:12px}.sp127-kpis{grid-template-columns:1fr 1fr}.sp127-load-list label{grid-template-columns:auto 1fr}}`;
document.head.appendChild(s)}

function patch(){
  ensureTruckState();ensureTruckView();ensureNavData();styles();
  try{const oldNav=renderNav;if(typeof oldNav==='function'&&!oldNav.__sp127){const w=function(){if(isSPDirector())return renderSPNav();return oldNav.apply(this,arguments)};w.__sp127=true;renderNav=w;window.renderNav=w}}catch(_){}
  try{const oldDash=renderDashboard;if(typeof oldDash==='function'&&!oldDash.__sp127){const w=function(){const r=oldDash.apply(this,arguments);dashboardAddon();return r};w.__sp127=true;renderDashboard=w;window.renderDashboard=w}}catch(_){}
  try{const oldCurrent=renderCurrent;if(typeof oldCurrent==='function'&&!oldCurrent.__sp127){const w=function(){if(currentView==='truckLoads')return renderTruck();const r=oldCurrent.apply(this,arguments);if(currentView==='dashboard')dashboardAddon();return r};w.__sp127=true;renderCurrent=w;window.renderCurrent=w}}catch(_){}
  if(isSPDirector()){
    ensureNavData();try{renderSPNav()}catch(_){}
    try{if(currentView==='compliance'){currentView='dashboard';navTo('dashboard')}}catch(_){}
    const bell=$('sp111Bell');if(bell)bell.style.display='none';
    if(currentView==='dashboard')dashboardAddon();
  }
  document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/,'V11.9.27');
}
function boot(){patch();[300,1200,2800,5200].forEach(ms=>setTimeout(patch,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(()=>{
'use strict';
const BUILD='V11.9.28';
const $=id=>document.getElementById(id);
const num=v=>Number(v||0);
const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(num(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up=s=>String(s||'').trim().toUpperCase();

function isSPDirector(){try{return company==='smartpack'&&currentRole==='director'}catch(_){return false}}
function ensureShipState(){if(!Array.isArray(state.truckLoads))state.truckLoads=[]}
function lineMain(parent){const ls=(state.orders||[]).filter(o=>String(o.parent)===String(parent));return ls.find(o=>String(o.code||'').endsWith('A'))||ls[0]||null}
function producedFor(parent){
  const ls=(state.orders||[]).filter(o=>String(o.parent)===String(parent));
  if(!ls.length)return 0;
  const vals=ls.map(o=>{const direct=Math.max(num(o.productionNetQtyV104),num(o.productionProducedQtyV103),num(o.produced));const runs=(state.productionRuns||[]).filter(r=>String(r.orderCode)===String(o.code)&&!/annull/i.test(String(r.status||'')));const runTotal=runs.reduce((a,r)=>a+Math.max(num(r.netProducedV104),num(r.produced)),0);return Math.max(direct,runTotal)});
  return vals.length?Math.min(...vals):0;
}
function deliveredFor(parent){return (state.deliveryRecords||[]).filter(r=>String(r.parent)===String(parent)).reduce((a,r)=>a+num(r.qty),0)}
function readyFor(parent){try{if(window.SPFlowV101?.availableForOrder)return num(window.SPFlowV101.availableForOrder(parent))}catch(_){}const a=lineMain(parent);return Math.max(0,producedFor(parent)-deliveredFor(parent),num(a?.warehousePreparedQty)-deliveredFor(parent))}
function openOrders(){let gs=[];try{gs=groupOrders()}catch(_){}return gs.filter(g=>{const a=lineMain(g.parent);return a&&!/annull|complet|soddisfatt|chiuso/i.test(String(a.status||''))}).slice(0,100)}
function clientNames(){return [...new Set([...(state.clients||[]),...(state.clientDirectory||[]).map(x=>x.name),...(state.orders||[]).map(x=>x.client)].filter(Boolean).map(x=>String(x).trim()))].sort((a,b)=>a.localeCompare(b,'it'))}

function materialCoverage(){
  const lots=Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[];
  const moves=Array.isArray(state.rawMaterialMovements)?state.rawMaterialMovements:[];
  const cutoff=Date.now()-30*86400000;
  const stock=new Map(),used=new Map();
  for(const l of lots){const name=String(l.materialName||l.category||'Materia prima').trim();const av=Math.max(0,num(l.qtyReceived)-num(l.qtyConsumed));stock.set(name,(stock.get(name)||0)+av)}
  for(const m of moves){const d=new Date(m.date||m.createdAt||0).getTime();if(!Number.isFinite(d)||d<cutoff||!/out|usc|consum/i.test(String(m.type||m.direction||m.kind||'')))continue;const name=String(m.material||'Materia prima').trim();used.set(name,(used.get(name)||0)+Math.abs(num(m.qty||m.kg||m.quantity)))}
  const total=[...stock.values()].reduce((a,b)=>a+b,0);
  const cover=[];
  for(const [name,u] of used){if(u<=0)continue;const av=stock.get(name)||0;cover.push({name,av,used:u,days:av/(u/30)})}
  cover.sort((a,b)=>a.days-b.days);
  if(!lots.length||total<=0)return {value:'Da verificare',date:'',sub:'Giacenze materie prime non sufficientemente valorizzate.',critical:'Apri Materie prime',cls:'warn',days:null,total};
  if(!cover.length)return {value:`${fmt(total)} kg disponibili`,date:'',sub:'Manca uno storico di consumo sufficiente per stimare i giorni di copertura.',critical:'Nessuna stima inventata',cls:'warn',days:null,total};
  const c=cover[0],days=Math.max(0,c.days),until=new Date(Date.now()+days*86400000);
  return {value:`${days.toLocaleString('it-IT',{maximumFractionDigits:1})} giorni`,date:until.toLocaleDateString('it-IT'),sub:`Stima sui consumi reali degli ultimi 30 giorni · stock totale ${fmt(total)} kg`,critical:`Materiale più critico: ${c.name} · ${fmt(c.av)} kg`,cls:days<3?'risk':days<7?'warn':'ok',days,total};
}

function ensureShipView(){
  if($('truckLoadsView'))return;
  const content=document.querySelector('.content');if(!content)return;
  const sec=document.createElement('section');sec.className='view';sec.id='truckLoadsView';content.appendChild(sec);
  try{META.truckLoads=['Preparazione spedizione','Collega ordine, pallet e modalità di consegna prima dell’uscita della merce']}catch(_){}
}
function ensureNavData(){
  try{
    NAV.director=NAV.director||[];NAV.director=NAV.director.filter(x=>x[0]!=='compliance');
    const old=NAV.director.find(x=>x[0]==='truckLoads');if(old){old[1]='orders';old[2]='Preparazione spedizione'}
    else {const si=NAV.director.findIndex(x=>x[0]==='sheets');NAV.director.splice(si>=0?si+1:NAV.director.length,0,['truckLoads','orders','Preparazione spedizione'])}
    const labels={reports:'Analisi produzione',sheets:'Fogli produzione',rawMaterials:'Materie prime'};NAV.director.forEach(x=>{if(labels[x[0]])x[2]=labels[x[0]]});
  }catch(_){}
}
const GROUPS=[
  ['OPERATIVITÀ',['dashboard','orders','ordersRegister','production','planner','sheets','truckLoads']],
  ['PRODUZIONE E MAGAZZINO',['rawMaterials','warehouse','presses','imlOrders','iml','trace']],
  ['CONTROLLO',['reports','finance','pricing','admin']],
  ['CONFIGURAZIONE',['settings']]
];
function groupedNavHTML(){const items=NAV.director||[],byId=new Map(items.map(x=>[x[0],x])),used=new Set();let html='';for(const [label,ids] of GROUPS){const rows=ids.map(id=>byId.get(id)).filter(Boolean);if(!rows.length)continue;html+=`<div class="sp128-nav-group"><div class="sp128-nav-label">${label}</div>`+rows.map(([v,i,l])=>{used.add(v);return `<button data-view="${v}" class="${currentView===v?'active':''}"><span class="icon">${icon(i)}</span>${esc(l)}</button>`}).join('')+'</div>'}const extra=items.filter(x=>!used.has(x[0]));if(extra.length)html+=`<div class="sp128-nav-group"><div class="sp128-nav-label">ALTRO</div>${extra.map(([v,i,l])=>`<button data-view="${v}" class="${currentView===v?'active':''}"><span class="icon">${icon(i)}</span>${esc(l)}</button>`).join('')}</div>`;return html}
function renderSPNav(){const side=$('sideNav'),mobile=$('mobileNav');if(side)side.innerHTML=groupedNavHTML();if(mobile){const ids=['dashboard','production','sheets','truckLoads'],map=new Map((NAV.director||[]).map(x=>[x[0],x])),rows=ids.map(x=>map.get(x)).filter(Boolean);mobile.innerHTML=rows.map(([v,i,l])=>`<button data-view="${v}" class="${currentView===v?'active':''}"><span>${icon(i)}</span>${esc(l)}</button>`).join('')+'<button id="sp128More" type="button"><span>☰</span>Altro</button>';$('sp128More')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'))}document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navTo(b.dataset.view))}

function dashboardAddon(){
  if(!isSPDirector())return;const view=$('dashboardView');if(!view||$('sp128Ops'))return;
  const orders=openOrders(),active=(state.productionRuns||[]).filter(r=>/produzione|attesa|blocc/i.test(String(r.status||''))).length,ready=orders.filter(g=>readyFor(g.parent)>0).length,cov=materialCoverage();
  const box=document.createElement('section');box.id='sp128Ops';box.className='sp128-ops';
  box.innerHTML=`<div class="sp128-head"><div><span>GESTIONE SMART PACK</span><h2>Centro operativo</h2><p>Le informazioni che servono a Roberto per decidere cosa produrre e cosa preparare per la consegna.</p></div><div class="sp128-actions"><button class="btn primary big" data-go="sheets">+ Crea foglio produzione</button><button class="btn sp128-dark big" data-go="truckLoads">+ Preparazione spedizione</button></div></div>
  <div class="sp128-kpis"><article><span>ORDINI APERTI</span><b>${orders.length}</b><small>Aggiornati con la produzione registrata</small></article><article><span>PRODUZIONI ATTIVE</span><b>${active}</b><small>Monitor produzione</small></article><article><span>PRONTI ALLA PREPARAZIONE</span><b>${ready}</b><small>Ordini con quantità realmente disponibile</small></article><article class="${cov.cls}"><span>COPERTURA MATERIE PRIME</span><b>${esc(cov.value)}</b><small>${cov.date?`Coperti circa fino al <strong>${esc(cov.date)}</strong><br>`:''}${esc(cov.critical)}</small></article></div>
  <div class="sp128-table"><div class="sp128-table-head"><div><h3>Ordini aggiornati</h3><p>Ordinato, prodotto, residuo e pronto alla preparazione.</p></div><button class="btn" data-go="production">Monitor produzione</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Prodotto</th><th>Ordinato</th><th>Prodotto</th><th>Da produrre</th><th>Disponibile</th></tr></thead><tbody>${orders.slice(0,8).map(g=>{const a=lineMain(g.parent),ord=num(a?.qty),prod=producedFor(g.parent);return `<tr><td><b>${esc(g.parent)}</b></td><td>${esc(a?.client||'')}</td><td>${esc(a?.product||'')}</td><td>${fmt(ord)}</td><td><b>${fmt(prod)}</b></td><td>${fmt(Math.max(0,ord-prod))}</td><td><b>${fmt(readyFor(g.parent))}</b></td></tr>`}).join('')||'<tr><td colspan="7">Nessun ordine aperto.</td></tr>'}</tbody></table></div></div>`;
  view.prepend(box);box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>navTo(b.dataset.go));
}

function renderShipment(){
  ensureShipState();const view=$('truckLoadsView');if(!view)return;
  view.innerHTML=`<div class="hero"><div><span class="eyebrow">GESTIONE SMART PACK · ORDINE → PALLET → CONSEGNA</span><h2>Preparazione spedizione</h2><p>Prepara la merce collegandola al cliente e agli ordini. La modalità di consegna viene scelta da un elenco controllato.</p></div><div class="hero-actions"><button class="btn primary big" id="sp128NewLoad">+ Nuova preparazione</button></div></div><div class="section panel"><div class="panel-head"><div><h3>Preparazioni salvate</h3><p>Ogni preparazione mantiene il collegamento con cliente, ordine e tracciabilità.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Cliente</th><th>Ordini</th><th>Modalità consegna</th><th>Quantità</th><th>Stato</th></tr></thead><tbody>${state.truckLoads.map(x=>`<tr><td>${esc(x.date||'—')}</td><td><b>${esc(x.client||'—')}</b></td><td>${[...new Set((x.items||[]).map(i=>i.parent).filter(Boolean))].map(esc).join(', ')||'—'}</td><td>${esc(x.deliveryMode||x.vehicle||'—')}</td><td>${fmt((x.items||[]).reduce((s,i)=>s+num(i.qty),0))} pz</td><td>${esc(x.status||'Preparazione')}</td></tr>`).join('')||'<tr><td colspan="6">Nessuna preparazione creata.</td></tr>'}</tbody></table></div></div>`;
  $('sp128NewLoad').onclick=openShipmentDialog;
}
function shipmentItemsHTML(client){
  const orders=openOrders().filter(g=>up(lineMain(g.parent)?.client)===up(client));
  if(!client)return '<div class="sp128-empty-select"><b>1. Seleziona il cliente</b><span>Vedrai soltanto gli ordini di quel cliente.</span></div>';
  if(!orders.length)return '<div class="sp128-empty-select"><b>Nessun ordine aperto per questo cliente.</b></div>';
  return '<div class="sp128-load-list">'+orders.map((g,i)=>{const a=lineMain(g.parent),av=readyFor(g.parent);return `<label class="${av<=0?'disabled':''}"><input type="checkbox" name="sel_${i}" data-parent="${esc(g.parent)}" ${av>0?'':'disabled'}><span><b>Ordine ${esc(g.parent)}</b><small>${esc(a?.product||'')}</small></span><span>Disponibile <b>${fmt(av)} pz</b></span><input type="number" name="qty_${i}" min="0" max="${av}" value="${av>0?av:0}" ${av>0?'':'disabled'}></label>`}).join('')+'</div>';
}
function openShipmentDialog(){
  let d=$('sp128LoadDlg');
  if(!d){d=document.createElement('dialog');d.id='sp128LoadDlg';d.innerHTML=`<form id="sp128LoadForm"><div class="modal-head"><div><span class="eyebrow">PREPARAZIONE SPEDIZIONE</span><h3>Nuova preparazione</h3><p>Cliente e ordini restano collegati alla tracciabilità.</p></div><button type="button" class="close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Data<input name="date" type="date" required></label><label class="field">Cliente<select name="client" required><option value="">Seleziona cliente</option></select></label><label class="field">Modalità consegna<select name="deliveryMode" required><option value="">Seleziona modalità</option><option>Vettore</option><option>Nostro camion</option><option>Ritiro in sede</option></select></label><label class="field">Destinazione / nota consegna<input name="destination" placeholder="Facoltativo"></label></div><div id="sp128LoadItems"></div><label class="field full">Note<textarea name="notes" rows="3"></textarea></label></div><div class="modal-actions"><button type="button" class="btn" data-cancel>Annulla</button><button class="btn primary big">Salva preparazione</button></div></form>`;document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('[data-cancel]').onclick=()=>d.close();}
  const clients=clientNames(),sel=d.querySelector('[name=client]');sel.innerHTML='<option value="">Seleziona cliente</option>'+clients.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');d.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);$('sp128LoadItems').innerHTML=shipmentItemsHTML('');sel.onchange=()=>{$('sp128LoadItems').innerHTML=shipmentItemsHTML(sel.value)};
  $('sp128LoadForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),client=String(fd.get('client')||''),orders=openOrders().filter(g=>up(lineMain(g.parent)?.client)===up(client)),items=[];orders.forEach((g,i)=>{if(!fd.get(`sel_${i}`))return;const q=num(fd.get(`qty_${i}`)),av=readyFor(g.parent),a=lineMain(g.parent);if(q>0&&q<=av)items.push({parent:g.parent,orderCode:a?.code||'',client:a?.client||client,product:a?.product||'',qty:q,traceKey:`${g.parent}|${a?.code||''}`})});if(!items.length){alert('Seleziona almeno un ordine con quantità disponibile.');return}const rec={id:'SHIP-'+Date.now(),date:String(fd.get('date')||''),client,deliveryMode:String(fd.get('deliveryMode')||''),destination:String(fd.get('destination')||''),notes:String(fd.get('notes')||''),status:'Preparazione',items,createdAt:new Date().toISOString(),traceabilityLinked:true};state.truckLoads.unshift(rec);try{save()}catch(_){}d.close();renderShipment();try{toast('Preparazione spedizione salvata')}catch(_){}};
  d.showModal();
}

function coverageCardHTML(){const c=materialCoverage();return `<section id="sp128MaterialCoverage" class="sp128-material ${c.cls}"><div class="sp128-material-main"><span>PRIMA DI AVVIARE LA PRODUZIONE</span><h2>Copertura materie prime</h2><b>${esc(c.value)}</b>${c.date?`<strong>Coperti circa fino al ${esc(c.date)}</strong>`:''}<p>${esc(c.sub)}</p><p class="critical">${esc(c.critical)}</p></div><div class="sp128-material-action"><button class="btn primary big" onclick="navTo('rawMaterials')">Controlla materie prime</button></div></section>`}
function arrangePressesPage(){
  if(!isSPDirector()||currentView!=='presses')return;const v=$('pressesView');if(!v)return;
  let planner=$('sp103Planner');
  let cov=$('sp128MaterialCoverage');if(cov)cov.remove();v.insertAdjacentHTML('afterbegin',coverageCardHTML());cov=$('sp128MaterialCoverage');
  if(planner){planner.remove();cov.insertAdjacentElement('afterend',planner)}
  const hero=v.querySelector(':scope > .hero');if(hero){hero.querySelector('h2')&&(hero.querySelector('h2').textContent='Configurazione presse e stampi');hero.querySelector('p')&&(hero.querySelector('p').textContent='Configurazione tecnica. Prima controlla copertura materiali e suggerimento operativo qui sopra.');}
  let label=$('sp128ConfigDivider');if(!label){label=document.createElement('div');label.id='sp128ConfigDivider';label.className='sp128-config-divider';label.innerHTML='<span>3</span><div><b>Configurazione tecnica presse</b><small>Da modificare solo quando serve.</small></div>';const target=v.querySelector(':scope > .hero');if(target)target.insertAdjacentElement('beforebegin',label)}
  if(cov&&!$('sp128PlannerStep')){const step=document.createElement('div');step.id='sp128PlannerStep';step.className='sp128-step-label';step.innerHTML='<span>2</span><div><b>Assistente cambio stampo</b><small>Dopo il controllo materiali, verifica la sequenza consigliata.</small></div>';cov.insertAdjacentElement('afterend',step);if(planner)step.insertAdjacentElement('afterend',planner)}
}
function patchPressFlow(){
  try{const old=window.renderPressSettingsV51;if(typeof old==='function'&&!old.__sp128){const w=function(){const r=old.apply(this,arguments);setTimeout(arrangePressesPage,20);setTimeout(arrangePressesPage,250);return r};w.__sp128=true;window.renderPressSettingsV51=w;try{renderPressSettingsV51=w}catch(_){}}}catch(_){}
  const v=$('pressesView');if(v&&!v.dataset.sp128obs){v.dataset.sp128obs='1';new MutationObserver(()=>{if(currentView==='presses')setTimeout(arrangePressesPage,0)}).observe(v,{childList:true})}
}
function appendShipmentTrace(){
  if(!isSPDirector()||currentView!=='trace')return;const v=$('traceView');if(!v||$('sp128TraceShip'))return;const rows=(state.truckLoads||[]).slice(0,20);const sec=document.createElement('div');sec.id='sp128TraceShip';sec.className='section panel';sec.innerHTML=`<div class="panel-head"><div><h3>Preparazioni spedizione collegate</h3><p>Collegamento ordine → pallet/preparazione → modalità consegna.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Cliente</th><th>Ordini collegati</th><th>Modalità</th><th>Stato</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date||'—')}</td><td><b>${esc(x.client||'—')}</b></td><td>${[...new Set((x.items||[]).map(i=>i.parent))].map(esc).join(', ')||'—'}</td><td>${esc(x.deliveryMode||x.vehicle||'—')}</td><td>${esc(x.status||'Preparazione')}</td></tr>`).join('')||'<tr><td colspan="5">Nessuna preparazione collegata.</td></tr>'}</tbody></table></div>`;v.appendChild(sec)
}

function styles(){if($('sp128Style'))return;const s=document.createElement('style');s.id='sp128Style';s.textContent=`
#sideNav .sp128-nav-group{display:grid;gap:3px;margin:0 0 10px}.sp128-nav-label{padding:9px 12px 4px;font-size:9px;font-weight:950;letter-spacing:.1em;color:#8ba0a9}.sp128-nav-group+.sp128-nav-group{border-top:1px solid rgba(255,255,255,.08);padding-top:5px}
.sp128-ops{margin-bottom:16px}.sp128-head{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:22px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.sp128-head span{font-size:10px;font-weight:950;color:#1680d7;letter-spacing:.08em}.sp128-head h2{margin:4px 0;font-size:25px}.sp128-head p{margin:0;color:var(--muted);font-size:12px}.sp128-actions{display:flex;gap:10px;flex-wrap:wrap}.sp128-dark{background:#173e50!important;color:#fff!important}.btn.big{min-height:48px;padding:0 18px;font-size:12px;font-weight:900}
.sp128-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.sp128-kpis article{padding:16px;border:1px solid var(--line);border-radius:15px;background:#fff}.sp128-kpis span,.sp128-kpis small{display:block}.sp128-kpis span{font-size:9px;font-weight:950;color:var(--muted)}.sp128-kpis b{display:block;font-size:24px;margin:5px 0}.sp128-kpis small{font-size:10px;line-height:1.45;color:var(--muted)}.sp128-kpis .ok{background:#f3fbf7}.sp128-kpis .warn{background:#fff8e9}.sp128-kpis .risk{background:#fff1f1}
.sp128-table{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}.sp128-table-head{padding:15px 17px;display:flex;justify-content:space-between;align-items:center}.sp128-table-head h3,.sp128-table-head p{margin:0}.sp128-table-head h3{font-size:18px}.sp128-table-head p{color:var(--muted);font-size:10px}
.sp128-load-list{display:grid;gap:8px;margin:14px 0}.sp128-load-list label{display:grid;grid-template-columns:auto 1.5fr .8fr .5fr;align-items:center;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff}.sp128-load-list label.disabled{opacity:.55}.sp128-load-list small{display:block;color:var(--muted);font-size:10px;margin-top:2px}.sp128-load-list input[type=number]{min-height:40px}.sp128-empty-select{padding:24px;border:1px dashed var(--line);border-radius:12px;text-align:center;background:#f7fafb}.sp128-empty-select b,.sp128-empty-select span{display:block}.sp128-empty-select span{color:var(--muted);margin-top:4px}
.sp128-material{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px;margin-bottom:14px;border:2px solid #b8dccc;border-radius:18px;background:#f3fbf7;box-shadow:0 8px 26px rgba(23,57,74,.06)}.sp128-material.warn{border-color:#e7ce91;background:#fff9ec}.sp128-material.risk{border-color:#e3a7ac;background:#fff3f3}.sp128-material span{font-size:9px;font-weight:950;letter-spacing:.1em;color:#4f6f61}.sp128-material h2{font-size:22px;margin:4px 0 6px}.sp128-material b{font-size:28px;display:block}.sp128-material strong{display:block;font-size:14px;margin-top:3px}.sp128-material p{margin:5px 0 0;color:var(--muted);font-size:10px}.sp128-material .critical{font-weight:900;color:#17394a}.sp128-step-label,.sp128-config-divider{display:flex;align-items:center;gap:10px;margin:12px 0 8px;padding:10px 12px;background:#f5f8f9;border-radius:12px}.sp128-step-label span,.sp128-config-divider span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#173e50;color:#fff;font-weight:950}.sp128-step-label b,.sp128-step-label small,.sp128-config-divider b,.sp128-config-divider small{display:block}.sp128-step-label small,.sp128-config-divider small{color:var(--muted);font-size:9px;margin-top:2px}
@media(max-width:900px){.sp128-head,.sp128-material{display:block}.sp128-actions,.sp128-material-action{margin-top:12px}.sp128-kpis{grid-template-columns:1fr 1fr}.sp128-load-list label{grid-template-columns:auto 1fr}.sp128-load-list input[type=number]{grid-column:2}}
`;document.head.appendChild(s)}

function patch(){
  ensureShipState();ensureShipView();ensureNavData();styles();patchPressFlow();
  try{const oldNav=renderNav;if(typeof oldNav==='function'&&!oldNav.__sp128){const w=function(){if(isSPDirector())return renderSPNav();return oldNav.apply(this,arguments)};w.__sp128=true;renderNav=w;window.renderNav=w}}catch(_){}
  try{const oldDash=renderDashboard;if(typeof oldDash==='function'&&!oldDash.__sp128){const w=function(){const r=oldDash.apply(this,arguments);dashboardAddon();return r};w.__sp128=true;renderDashboard=w;window.renderDashboard=w}}catch(_){}
  try{const oldCurrent=renderCurrent;if(typeof oldCurrent==='function'&&!oldCurrent.__sp128){const w=function(){if(currentView==='truckLoads')return renderShipment();const r=oldCurrent.apply(this,arguments);if(currentView==='dashboard')dashboardAddon();if(currentView==='presses')setTimeout(arrangePressesPage,30);if(currentView==='trace')setTimeout(appendShipmentTrace,30);return r};w.__sp128=true;renderCurrent=w;window.renderCurrent=w}}catch(_){}
  if(isSPDirector()){ensureNavData();try{renderSPNav()}catch(_){}try{if(currentView==='compliance'){currentView='dashboard';navTo('dashboard')}}catch(_){}const bell=$('sp111Bell');if(bell)bell.style.display='none';if(currentView==='dashboard')dashboardAddon();if(currentView==='presses')setTimeout(arrangePressesPage,20);if(currentView==='trace')setTimeout(appendShipmentTrace,20)}
  document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/,'V11.9.28');
}
function boot(){patch();[300,900,1800,3600].forEach(ms=>setTimeout(patch,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

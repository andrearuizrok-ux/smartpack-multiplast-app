(()=>{
'use strict';
if(window.SPAdminDashboardRefresh11948)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const N=v=>Number.isFinite(Number(String(v).replace(/[^\d.-]/g,'')))?Number(String(v).replace(/[^\d.-]/g,'')):0;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function activeAdminOverview(){
  const v=$('#adminOverviewV1170View');
  return v && v.classList.contains('active') ? v : null;
}
function findMetric(view,label){
  const els=$$('div,section,article',view).filter(el=>new RegExp(label,'i').test((el.textContent||'').replace(/\s+/g,' ')));
  for(const el of els){
    const txt=(el.textContent||'').replace(/\s+/g,' ');
    const nums=txt.match(/\b\d+\b/g);
    if(nums&&nums.length){
      return {value:N(nums[0]), detail:txt};
    }
  }
  return {value:0,detail:''};
}
function sourceData(view){
  const pronti=findMetric(view,'Carichi pronti per DDT');
  const reparto=findMetric(view,'Carichi ancora in reparto');
  const scad=findMetric(view,'Scadenze da controllare');
  const anom=findMetric(view,'Anomalie ?\/ ?dati mancanti');
  return {
    pronti:pronti.value,
    reparto:reparto.value,
    scadenze:scad.value,
    anomalie:anom.value,
    priorita:(pronti.value>0?1:0)+(reparto.value>0?1:0)+(scad.value>0?1:0)+(anom.value>0?1:0)
  };
}
function goByText(text){
  const candidates=$$('button,a,div,span');
  const found=candidates.find(el=>((el.textContent||'').trim()===text || (el.textContent||'').trim().startsWith(text)) && el.offsetParent!==null);
  if(found){found.click();return true;}
  return false;
}
function action(type){
  if(type==='ddt') return goByText('Consegne / DDT');
  if(type==='clienti') return goByText('Clienti e fornitori');
  if(type==='scadenze') return goByText('Scadenze & Compliance');
  if(type==='traccia') return goByText('Tracciabilità');
  if(type==='magazzino') return goByText('Magazzino interno');
  if(type==='dati') return goByText('Configurazione azienda');
}
function priorityItems(d){
  const out=[];
  if(d.scadenze>0) out.push({cls:'warn',title:'Scadenze da controllare',text:`Ci sono ${d.scadenze} scadenze da verificare o rinnovare.`});
  if(d.anomalie>0) out.push({cls:'risk',title:'Dati da correggere',text:`Ci sono ${d.anomalie} anomalie o dati mancanti da sistemare.`});
  if(d.reparto>0) out.push({cls:'info',title:'Carichi ancora in reparto',text:`Ci sono ${d.reparto} carichi ancora non chiusi o non pronti per il DDT.`});
  if(d.pronti>0) out.push({cls:'ok',title:'Carichi pronti',text:`Ci sono ${d.pronti} carichi pronti da registrare o chiudere con DDT.`});
  if(!out.length) out.push({cls:'ok',title:'Situazione sotto controllo',text:'Al momento non risultano priorità aperte: la dashboard è pulita.'});
  return out.slice(0,4);
}
function buildDashboard(view){
  let dash=$('#adminDash11948',view);
  if(!dash){
    dash=document.createElement('div');
    dash.id='adminDash11948';
    view.prepend(dash);
  }
  const d=sourceData(view);
  const items=priorityItems(d);
  dash.innerHTML=`
    <section class="ad48-hero">
      <div>
        <span class="ad48-eye">AMMINISTRAZIONE · CENTRO OPERATIVO</span>
        <h2>Dashboard amministrazione</h2>
        <p>Una vista semplice e chiara per seguire consegne, dati da completare, scadenze e controlli operativi.</p>
      </div>
      <div class="ad48-status ${d.priorita>0?'warn':'ok'}">
        <b>${d.priorita}</b>
        <span>${d.priorita===1?'priorità attiva':'priorità attive'}</span>
      </div>
    </section>

    <section class="ad48-grid4">
      <article class="ad48-card">
        <span>Carichi pronti per DDT</span>
        <b>${d.pronti}</b>
        <small>Ordini già caricati e pronti per la chiusura documentale.</small>
      </article>
      <article class="ad48-card">
        <span>Carichi ancora in reparto</span>
        <b>${d.reparto}</b>
        <small>Consegne o carichi non ancora completati dal reparto.</small>
      </article>
      <article class="ad48-card">
        <span>Scadenze da controllare</span>
        <b>${d.scadenze}</b>
        <small>Visite, documenti o scadenze amministrative da verificare.</small>
      </article>
      <article class="ad48-card highlight ${d.anomalie>0?'risk':''}">
        <span>Anomalie / dati mancanti</span>
        <b>${d.anomalie}</b>
        <small>Anagrafiche, conti o dati incompleti che richiedono un controllo.</small>
      </article>
    </section>

    <section class="ad48-split">
      <article class="ad48-panel">
        <div class="ad48-head"><span>Priorità di oggi</span><h3>Cosa controllare per primo</h3></div>
        <div class="ad48-list">
          ${items.map((x,i)=>`<div class="ad48-item ${x.cls}"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></div></div>`).join('')}
        </div>
      </article>
      <article class="ad48-panel">
        <div class="ad48-head"><span>Azioni rapide</span><h3>Apri subito il modulo giusto</h3></div>
        <div class="ad48-actions">
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('ddt')"><b>Consegne / DDT</b><small>Chiudi carichi e registra documenti.</small></button>
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('clienti')"><b>Clienti e fornitori</b><small>Gestisci anagrafiche e riferimenti.</small></button>
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('scadenze')"><b>Scadenze & Compliance</b><small>Controlla visite, alert e documenti.</small></button>
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('traccia')"><b>Tracciabilità</b><small>Segui lotto, ordine e storico.</small></button>
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('magazzino')"><b>Magazzino interno</b><small>Verifica disponibilità e movimenti.</small></button>
          <button type="button" onclick="SPAdminDashboardRefresh11948.action('dati')"><b>Configurazione azienda</b><small>Aggiorna accessi e dati base.</small></button>
        </div>
      </article>
    </section>

    <section class="ad48-bottom">
      <article class="ad48-panel">
        <div class="ad48-head"><span>Flusso consigliato</span><h3>Ordine di lavoro per amministrazione</h3></div>
        <div class="ad48-steps">
          <div><b>1</b><span>Controlla prima le <strong>anomalie</strong> e le <strong>scadenze</strong>.</span></div>
          <div><b>2</b><span>Verifica i <strong>carichi ancora in reparto</strong>.</span></div>
          <div><b>3</b><span>Chiudi i <strong>carichi pronti</strong> con DDT.</span></div>
          <div><b>4</b><span>Apri i moduli necessari dalle <strong>azioni rapide</strong>.</span></div>
        </div>
      </article>
    </section>`;
}
function hideOriginal(view){
  [...view.children].forEach(ch=>{
    if(ch.id==='adminDash11948') return;
    ch.classList.add('ad48-source-hidden');
  });
  // hide any orphan finance/economico label
  $$('*',view).forEach(el=>{
    const t=(el.textContent||'').trim().toLowerCase();
    if(t==='economico') el.style.setProperty('display','none','important');
  });
}
function fixHeaders(){
  if($('#pageTitle')) $('#pageTitle').textContent='Panoramica Amministrazione';
  if($('#pageSubtitle')) $('#pageSubtitle').textContent='Priorità operative, consegne, DDT SPRING e controllo dati';
}
function styles(){
  if($('#ad48Styles')) return;
  const st=document.createElement('style');
  st.id='ad48Styles';
  st.textContent=`
  #adminOverviewV1170View .ad48-source-hidden{display:none!important}
  #adminOverviewV1170View{padding-bottom:22px}
  .ad48-hero,.ad48-card,.ad48-panel{background:#fff;border:1px solid #dce7eb;border-radius:18px;box-shadow:0 2px 10px rgba(7,34,53,.04)}
  .ad48-hero{padding:22px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:14px}
  .ad48-eye{display:block;font-size:10px;font-weight:900;letter-spacing:.08em;color:#3167d8;margin-bottom:8px}
  .ad48-hero h2{margin:0 0 6px;font-size:26px;color:#183240}
  .ad48-hero p{margin:0;max-width:780px;font-size:14px;line-height:1.55;color:#667b86}
  .ad48-status{min-width:120px;text-align:center;padding:14px 16px;border-radius:16px;background:#f5f8f9;border:1px solid #e1eaee}
  .ad48-status b{display:block;font-size:34px;line-height:1;color:#193541}
  .ad48-status span{display:block;margin-top:6px;font-size:11px;font-weight:800;color:#5f7380}
  .ad48-status.ok{background:#f2fbf6;border-color:#cfe9d6}.ad48-status.warn{background:#fff7ee;border-color:#f0d9b7}
  .ad48-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
  .ad48-card{padding:18px 18px 16px}.ad48-card span{display:block;font-size:12px;font-weight:800;color:#58707e;min-height:30px}.ad48-card b{display:block;font-size:48px;line-height:1.05;color:#173140;margin:8px 0}.ad48-card small{display:block;font-size:12px;line-height:1.45;color:#738590}
  .ad48-card.highlight{background:#f9fcfd}.ad48-card.risk b{color:#b13e4a}
  .ad48-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .ad48-panel{padding:18px}.ad48-head span{display:block;font-size:10px;font-weight:900;letter-spacing:.08em;color:#6c818c;margin-bottom:5px}.ad48-head h3{margin:0 0 12px;font-size:19px;color:#173342}
  .ad48-list{display:grid;gap:10px}.ad48-item{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:12px;border:1px solid #ebf0f2;border-radius:14px}.ad48-item b{font-size:11px;color:#6a7f8a;padding-top:2px}.ad48-item strong{display:block;font-size:14px;color:#173241;margin-bottom:3px}.ad48-item p{margin:0;font-size:12.5px;line-height:1.5;color:#5e727d}.ad48-item.warn{background:#fffaf1}.ad48-item.risk{background:#fff5f6}.ad48-item.ok{background:#f5fcf8}.ad48-item.info{background:#f7fbfd}
  .ad48-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ad48-actions button{appearance:none;border:1px solid #dce7eb;border-radius:14px;background:#f8fbfc;padding:14px;text-align:left;cursor:pointer;transition:.15s ease}.ad48-actions button:hover{border-color:#b8d0df;background:#fff}.ad48-actions b{display:block;font-size:14px;color:#193542;margin-bottom:4px}.ad48-actions small{display:block;font-size:12px;line-height:1.45;color:#677c86}
  .ad48-bottom{display:grid;grid-template-columns:1fr}.ad48-steps{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ad48-steps>div{display:grid;grid-template-columns:32px 1fr;gap:10px;padding:12px;border:1px solid #ebf0f2;border-radius:14px;background:#fbfdfe}.ad48-steps b{width:32px;height:32px;border-radius:12px;background:#eff5f8;color:#173442;display:grid;place-items:center;font-size:13px}.ad48-steps span{font-size:12.5px;line-height:1.5;color:#5d717a}
  @media (max-width:1200px){.ad48-grid4{grid-template-columns:repeat(2,1fr)}.ad48-split{grid-template-columns:1fr}.ad48-steps{grid-template-columns:1fr 1fr}}
  @media (max-width:760px){.ad48-hero{display:block}.ad48-status{margin-top:14px}.ad48-grid4,.ad48-actions,.ad48-steps{grid-template-columns:1fr}.ad48-card b{font-size:40px}}
  `;
  document.head.appendChild(st);
}
function render(){
  const view=activeAdminOverview();
  if(!view) return;
  fixHeaders();
  buildDashboard(view);
  hideOriginal(view);
}
function boot(){
  styles();
  [120,400,1000,1800].forEach(ms=>setTimeout(render,ms));
  const mo=new MutationObserver(()=>setTimeout(render,30));
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
window.SPAdminDashboardRefresh11948={version:'V11.9.48',render,action};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
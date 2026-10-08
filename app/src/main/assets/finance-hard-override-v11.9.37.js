
(()=>{
'use strict';
if(window.SPFinanceHardOverride11937)return;

const VERSION='V11.9.37';
const FIN_URL='https://cktactfxjmatbkoosjvs.supabase.co';
const FIN_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiY2t0YWN0ZnhqbWF0Ymtvb3NqdnMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MDcwOTgwNCwiZXhwIjoyMTA2Mjg1ODA0fQ.osb4lKiLMAmPvZ4z-Zu8ry1HZD5Vk5RMBaZV6_I1t6Q';
const SESSION_KEY='spmp-nomyra-finance-v11923';
const SNAP='spmp_nf37_snapshot_smartpack';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(v)):'—';
const fmt=(v,u)=>u==='%'?`${new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(Number(v||0))}%`:u==='x'?`${new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(Number(v||0))}x`:money(v);

let busy=false, lastError='', current=null;

function sessionObj(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return null;
    const x=JSON.parse(raw);
    // Supabase JS v2 storage is normally the session object itself.
    if(x?.access_token)return x;
    if(x?.currentSession?.access_token)return x.currentSession;
    if(x?.session?.access_token)return x.session;
    return null;
  }catch(_){return null}
}
function expectedAccount(){return 'info@smartpack.srl'}

async function rest(path,token){
  const r=await fetch(FIN_URL+'/rest/v1/'+path,{
    headers:{
      apikey:FIN_KEY,
      Authorization:'Bearer '+token,
      Accept:'application/json'
    }
  });
  if(!r.ok){
    let msg=`Finance HTTP ${r.status}`;
    try{const j=await r.json();msg=j.message||j.error_description||j.error||msg}catch(_){}
    throw new Error(msg)
  }
  return r.json();
}
function saveSnap(s){try{localStorage.setItem(SNAP,JSON.stringify(s))}catch(_){}}
function loadSnap(){try{return JSON.parse(localStorage.getItem(SNAP)||'null')}catch(_){return null}}

function find(rows,keys=[],labels=[]){
  for(const k of keys){const x=rows.find(r=>norm(r.key)===norm(k));if(x)return x}
  for(const l of labels){
    const n=norm(l);
    const x=rows.find(r=>norm(r.label)===n)||rows.find(r=>norm(r.label).includes(n));
    if(x)return x
  }
  return null
}

async function fetchOfficial(){
  if(busy)return current;
  busy=true; lastError='';
  try{
    const s=sessionObj();
    if(!s?.access_token){current=null;return null}
    const email=String(s.user?.email||'').toLowerCase();
    if(email!==expectedAccount()){
      current=null;
      throw new Error(`Account Finance non corretto. Per Smart Pack usa ${expectedAccount()}. Account attuale: ${email||'sconosciuto'}.`);
    }
    const companies=await rest('companies?select=id,name&order=name.asc',s.access_token);
    const company=(companies||[]).find(c=>norm(c.name).includes('smartpack'));
    if(!company)throw new Error('Nessuna azienda Smart Pack disponibile in NOMYRA Finance per questo account.');

    const docs=await rest(`financial_documents?select=id,company_id,period,document_name,document_type,coverage_score,missing_values,updated_at&company_id=eq.${encodeURIComponent(company.id)}&order=period.desc`,s.access_token);
    const doc=(docs||[])[0]||null;
    let vals=[],kpis=[];
    if(doc){
      vals=await rest(`financial_values?select=document_id,key,label,value,unit,method,confidence,is_confirmed&document_id=eq.${encodeURIComponent(doc.id)}`,s.access_token);
      kpis=await rest(`financial_kpis?select=document_id,key,label,value,unit,formula,explanation,result_reading,status&document_id=eq.${encodeURIComponent(doc.id)}&order=label.asc`,s.access_token);
    }
    current={email,company,doc,vals,kpis,syncedAt:new Date().toISOString()};
    saveSnap(current);
    return current;
  }catch(e){
    lastError=e?.message||String(e);
    current=loadSnap();
    return current;
  }finally{busy=false}
}

function openLogin(){
  // Reuse the login already wired by the NOMYRA Finance connector.
  const modal=$('#nf23Login');
  if(modal){
    const email=$('[data-nf23-email]',modal);
    if(email)email.value=expectedAccount();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    return;
  }
  // Ask the existing connector to render its modal if not yet mounted.
  window.SPNomyraFinanceLiveV11923?.render?.();
  setTimeout(()=>{
    const m=$('#nf23Login');
    if(m){
      const email=$('[data-nf23-email]',m);if(email)email.value=expectedAccount();
      m.classList.add('open');m.setAttribute('aria-hidden','false')
    }else alert('Il modulo NOMYRA Finance non è ancora pronto. Ricarica la pagina e riprova.');
  },150)
}
function disconnect(){
  try{localStorage.removeItem(SESSION_KEY)}catch(_){}
  current=null;lastError='';
  renderFinance();
  renderAdminDashboard();
}

function financeHTML(s){
  if(!s){
    return `<section class="nf37-page"><div class="nf37-connect">
      <div class="nf37-mark">NF</div>
      <div><span>NOMYRA FINANCE</span><h2>Collega i dati finanziari</h2>
      <p>Questa pagina non utilizza più i calcoli locali SP-MP. Per Smart Pack la fonte ufficiale è NOMYRA Finance.</p>
      <div class="nf37-account">Account richiesto: <b>${expectedAccount()}</b></div></div>
      <button data-nf37-connect>Collega Finance</button>
    </div></section>`;
  }
  const vals=s.vals||[], ks=s.kpis||[];
  const revenue=find(ks,['revenue'],['Ricavi'])||find(vals,['revenue'],['Ricavi']);
  const production=find(ks,['productionValue'],['Valore della produzione'])||find(vals,['productionValue'],['Valore della produzione']);
  const ebitda=find(ks,['ebitda'],['EBITDA / MOL','EBITDA'])||find(vals,['ebitda'],['EBITDA']);
  const margin=find(ks,['ebitdaMargin'],['EBITDA margin','Margine EBITDA']);
  const ebit=find(ks,['ebit'],['EBIT'])||find(vals,['ebit'],['EBIT']);
  const cash=find(vals,['cash'],['Liquidità']);
  const rec=find(vals,['receivables'],['Crediti']);
  const pay=find(vals,['payables'],['Debiti fornitori']);
  const inv=find(vals,['inventory'],['Rimanenze']);
  const debt=find(vals,['debt'],['Debiti totali']);
  const eq=find(vals,['equity'],['Patrimonio netto']);
  const extra=ks.filter(k=>![revenue,production,ebitda,margin,ebit].includes(k)).slice(0,24);
  const m=(label,row)=>`<article><span>${esc(label)}</span><b>${row?fmt(row.value,row.unit):'—'}</b><small>${row?'NOMYRA Finance':'Dato non disponibile'}</small></article>`;
  return `<section class="nf37-page">
    <header class="nf37-head">
      <div><span>NOMYRA FINANCE · DATI UFFICIALI</span><h2>${esc(s.company?.name||'Smart Pack')}</h2>
      <p>Account: <b>${esc(s.email)}</b>. Nessun KPI viene ricalcolato da SP-MP.</p></div>
      <div class="nf37-actions"><div class="nf37-ok">● Finance collegato</div><button data-nf37-refresh>Aggiorna da Finance</button><button data-nf37-disconnect>Disconnetti</button></div>
    </header>
    ${lastError?`<div class="nf37-warn">${esc(lastError)} · Mostro l'ultimo snapshot ufficiale salvato.</div>`:''}
    <section class="nf37-doc">
      <div><span>Periodo</span><b>${esc(s.doc?.period||'—')}</b></div>
      <div><span>Documento</span><b>${esc(s.doc?.document_name||'Nessun documento')}</b></div>
      <div><span>Copertura</span><b>${s.doc?Math.round(Number(s.doc.coverage_score||0))+'%':'—'}</b></div>
      <div><span>Aggiornato in Finance</span><b>${s.doc?.updated_at?new Date(s.doc.updated_at).toLocaleString('it-IT'):'—'}</b></div>
    </section>
    ${!s.doc?`<div class="nf37-empty"><b>Nessun bilancio disponibile</b><p>Completa il bilancio in NOMYRA Finance. SP-MP non mostra valori sostitutivi.</p></div>`:`
    <section class="nf37-block"><div class="nf37-title"><span>KPI PRINCIPALI</span><h3>Situazione economica</h3></div>
      <div class="nf37-grid">${m('Ricavi',revenue)}${m('Valore produzione',production)}${m('EBITDA',ebitda)}${m('EBITDA margin',margin)}${m('EBIT',ebit)}</div>
    </section>
    <section class="nf37-block"><div class="nf37-title"><span>STATO PATRIMONIALE</span><h3>Equilibrio finanziario</h3></div>
      <div class="nf37-patr">${[['Liquidità',cash],['Crediti',rec],['Debiti fornitori',pay],['Rimanenze',inv],['Debiti totali',debt],['Patrimonio netto',eq]].map(([l,r])=>`<div><span>${l}</span><b>${r?fmt(r.value,r.unit||'EUR'):'—'}</b></div>`).join('')}</div>
    </section>
    <section class="nf37-block"><div class="nf37-title"><span>INDICATORI</span><h3>Analisi NOMYRA Finance</h3></div>
      <div class="nf37-table">${extra.length?extra.map(k=>`<div class="nf37-row"><div><b>${esc(k.label)}</b><small>${esc(k.formula||'')}</small></div><strong>${fmt(k.value,k.unit)}</strong><p>${esc(k.result_reading||k.explanation||'')}</p></div>`).join(''):'<div class="nf37-empty">Nessun altro indicatore disponibile.</div>'}</div>
    </section>`}
  </section>`;
}

function renderFinance(){
  const view=$('#adminFinanceV1170View');
  if(!view?.classList.contains('active'))return;

  let root=$('#nf37Root',view);
  if(!root){
    root=document.createElement('div');root.id='nf37Root';view.prepend(root);
  }

  // Hard ownership: every legacy finance block is hidden permanently.
  [...view.children].forEach(ch=>{if(ch!==root)ch.style.setProperty('display','none','important')});
  root.style.setProperty('display','block','important');
  root.innerHTML=financeHTML(current||loadSnap());

  $('[data-nf37-connect]',root)?.addEventListener('click',openLogin);
  $('[data-nf37-refresh]',root)?.addEventListener('click',async e=>{e.currentTarget.disabled=true;current=null;await fetchOfficial();renderFinance();renderAdminDashboard()});
  $('[data-nf37-disconnect]',root)?.addEventListener('click',disconnect);
}

function adminFinanceCard(){
  const s=current||loadSnap();
  if(!s){
    return `<section class="nf37-admin"><div><span>NOMYRA FINANCE</span><h3>Finance non collegato</h3><p>La dashboard Amministrazione non mostra più bilanci locali o valori SP-MP.</p></div><button data-nf37-open>Collega / apri Finance</button></section>`;
  }
  const revenue=find(s.kpis||[],['revenue'],['Ricavi'])||find(s.vals||[],['revenue'],['Ricavi']);
  const ebitda=find(s.kpis||[],['ebitda'],['EBITDA / MOL','EBITDA'])||find(s.vals||[],['ebitda'],['EBITDA']);
  const ebit=find(s.kpis||[],['ebit'],['EBIT'])||find(s.vals||[],['ebit'],['EBIT']);
  return `<section class="nf37-admin"><div><span>NOMYRA FINANCE · ${esc(s.doc?.period||'')}</span><h3>${esc(s.company?.name||'Smart Pack')}</h3><p>Ultimo snapshot ufficiale ${new Date(s.syncedAt).toLocaleString('it-IT')}</p></div><div class="nf37-admin-kpis"><div><span>Ricavi</span><b>${revenue?fmt(revenue.value,revenue.unit):'—'}</b></div><div><span>EBITDA</span><b>${ebitda?fmt(ebitda.value,ebitda.unit):'—'}</b></div><div><span>EBIT</span><b>${ebit?fmt(ebit.value,ebit.unit):'—'}</b></div></div><button data-nf37-open>Apri Finance</button></section>`;
}
function renderAdminDashboard(){
  const view=$('#adminOverviewV1170View');
  if(!view?.classList.contains('active'))return;

  // Remove legacy economic panels by text/signature instead of trusting old class names.
  $$('*',view).filter(el=>{
    const t=(el.textContent||'').trim();
    return el.children.length>0 && (
      /ANDAMENTO ECONOMICO/i.test(t) ||
      /SALUTE AZIENDA/i.test(t) ||
      /Ricavi vendite gruppo/i.test(t)
    );
  }).forEach(el=>{
    // remove only sizeable top-level-ish blocks
    if(el.parentElement===view || el.parentElement?.parentElement===view) el.style.setProperty('display','none','important')
  });

  let host=$('#nf37AdminHost',view);
  if(!host){host=document.createElement('div');host.id='nf37AdminHost';view.prepend(host)}
  host.innerHTML=adminFinanceCard();
  $('[data-nf37-open]',host)?.addEventListener('click',()=>{
    try{navTo('finance')}catch(_){}
    setTimeout(()=>{renderFinance(); if(!sessionObj()) openLogin()},100)
  });
}
function styles(){
  if($('#nf37Style'))return;
  const st=document.createElement('style');st.id='nf37Style';st.textContent=`
  #adminFinanceV1170View>#nf37Root{display:block!important;width:100%}
  #adminFinanceV1170View>#nf37Root~*{display:none!important}
  .nf37-page{display:grid;gap:12px;padding:16px}.nf37-head,.nf37-doc,.nf37-block,.nf37-connect,.nf37-empty,.nf37-admin{background:#fff;border:1px solid #d8e5e9;border-radius:18px;box-shadow:0 8px 24px rgba(23,57,74,.045)}
  .nf37-head{padding:18px 20px;display:flex;justify-content:space-between;gap:18px;align-items:center}.nf37-head span,.nf37-title span,.nf37-connect span,.nf37-admin>div>span{font-size:9px;font-weight:950;letter-spacing:.08em;color:#a56c49}.nf37-head h2,.nf37-connect h2{margin:4px 0;font-size:25px}.nf37-head p,.nf37-connect p,.nf37-admin p{margin:0;color:#617984;font-size:11px}.nf37-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.nf37-actions button,.nf37-connect>button,.nf37-admin>button{border:0;border-radius:11px;background:#2688ee;color:#fff;font-weight:900;padding:11px 14px;cursor:pointer}.nf37-actions button:last-child{background:#fff;color:#46616d;border:1px solid #d6e3e7}.nf37-ok{background:#eef8f4;padding:10px 12px;border-radius:11px;font-size:10px;font-weight:900;color:#276b55}
  .nf37-warn{padding:10px 13px;border-radius:12px;background:#fff8e8;border:1px solid #ead9a8;color:#7a5c16;font-size:10px}.nf37-doc{display:grid;grid-template-columns:repeat(4,1fr);padding:12px}.nf37-doc>div{padding:8px 10px;border-right:1px solid #e5ecef}.nf37-doc>div:last-child{border-right:0}.nf37-doc span,.nf37-patr span,.nf37-admin-kpis span{display:block;font-size:9px;color:#748890}.nf37-doc b{display:block;margin-top:4px;font-size:12px}
  .nf37-block{padding:15px}.nf37-title h3{margin:3px 0 0;font-size:16px}.nf37-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:11px}.nf37-grid article{padding:12px;border:1px solid #dde8eb;border-radius:12px;background:#fbfcfd}.nf37-grid article span{display:block;font-size:9px;color:#71858e}.nf37-grid article b{display:block;font-size:18px;margin-top:5px}.nf37-grid article small{display:block;font-size:8px;color:#64808a;margin-top:4px}.nf37-patr{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:11px}.nf37-patr>div{padding:10px;border-radius:11px;background:#f7fafb;border:1px solid #e0e9ec}.nf37-patr b{display:block;margin-top:4px;font-size:12px}
  .nf37-table{margin-top:10px;border:1px solid #e0e9ec;border-radius:12px;overflow:hidden}.nf37-row{display:grid;grid-template-columns:1fr 150px 1.5fr;gap:12px;padding:10px;border-top:1px solid #edf2f3;align-items:center}.nf37-row:first-child{border-top:0}.nf37-row b{font-size:10px}.nf37-row small{display:block;font-size:8px;color:#819198}.nf37-row strong{font-size:11px}.nf37-row p{margin:0;font-size:9px;color:#617781}
  .nf37-connect{padding:26px;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center}.nf37-mark{width:56px;height:56px;border-radius:15px;background:#17394a;color:#fff;display:grid;place-items:center;font-weight:950}.nf37-account{display:inline-block;margin-top:10px;padding:8px 10px;border-radius:9px;background:#f5f8fa;font-size:10px}.nf37-empty{padding:28px;text-align:center}
  .nf37-admin{padding:16px 18px;display:grid;grid-template-columns:1.2fr 1.5fr auto;gap:18px;align-items:center;margin:0 0 14px}.nf37-admin h3{margin:4px 0;font-size:18px}.nf37-admin-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nf37-admin-kpis>div{padding:10px;border:1px solid #e0e9ec;border-radius:11px;background:#f8fafb}.nf37-admin-kpis b{display:block;margin-top:3px;font-size:16px}
  @media(max-width:900px){.nf37-grid{grid-template-columns:repeat(2,1fr)}.nf37-patr{grid-template-columns:repeat(2,1fr)}.nf37-doc{grid-template-columns:1fr 1fr}.nf37-admin{grid-template-columns:1fr}.nf37-connect{display:block}.nf37-mark{margin-bottom:10px}}
  `;
  document.head.appendChild(st)
}
async function refreshAll(){
  await fetchOfficial();
  renderFinance();
  renderAdminDashboard();
}
function boot(){
  styles();
  current=loadSnap();
  const mo=new MutationObserver(()=>{setTimeout(()=>{renderFinance();renderAdminDashboard()},20)});
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  setInterval(()=>{if($('#adminFinanceV1170View')?.classList.contains('active') && sessionObj() && !current) refreshAll()},1200);
  setTimeout(()=>{renderFinance();renderAdminDashboard()},200);
}
window.SPFinanceHardOverride11937={version:VERSION,refresh:refreshAll};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

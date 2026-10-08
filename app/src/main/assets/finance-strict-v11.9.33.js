
(()=>{
'use strict';
if(window.SPFinanceStrictV11933)return;

const VERSION='V11.9.33';
const FIN_URL='https://cktactfxjmatbkoosjvs.supabase.co';
const FIN_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGFjdGZ4am1hdGJrb29zanZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDk4MDQsImV4cCI6MjEwNjI4NTgwNH0.osb4lKiLMAmPvZ4z-Zu8ry1HZD5Vk5RMBaZV6_I1t6Q';

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(v)):'—';
const number=(v,d=2)=>Number.isFinite(Number(v))?new Intl.NumberFormat('it-IT',{maximumFractionDigits:d}).format(Number(v)):'—';
const fmt=(v,u)=>u==='%'?`${number(v,1)}%`:u==='x'?`${number(v,2)}x`:u==='EUR'||!u?money(v):number(v,2);

const CACHE_PREFIX='spmp_nf33_snapshot_';
let client=null;
let loading=false;
let lastError='';
let currentSnapshot=null;

function selectedCompany(){
  try{
    if(typeof window.selectedCompany==='string' && /smartpack|multiplast/i.test(window.selectedCompany)) return window.selectedCompany.toLowerCase();
  }catch(_){}
  for(const k of ['nomyra_group_company_v92','poi_v113_company','poi_v112_company','poi_v116_config_company']){
    const v=sessionStorage.getItem(k)||localStorage.getItem(k);
    if(v && /smartpack|multiplast/i.test(v)) return String(v).toLowerCase();
  }
  const buttons=[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null);
  const active=buttons.find(x=>x.classList.contains('active') && /smart pack|multiplast/i.test(x.textContent||''));
  if(active)return /multiplast/i.test(active.textContent||'')?'multiplast':'smartpack';
  return 'smartpack';
}

function expectedEmail(company){
  return company==='smartpack' ? 'info@smartpack.srl' : '';
}

function exactCompany(finName,company){
  const n=norm(finName);
  if(company==='smartpack') return n.includes('smartpack');
  if(company==='multiplast') return n.includes('multiplast');
  return false;
}

async function getClient(){
  if(client)return client;
  const mod=await import('https://esm.sh/@supabase/supabase-js@2');
  client=mod.createClient(FIN_URL,FIN_KEY,{auth:{
    storageKey:'spmp-nomyra-finance-v11923',
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:false
  }});
  return client;
}

async function getSession(){
  const c=await getClient();
  const {data}=await c.auth.getSession();
  return data.session||null;
}

function cacheKey(company){return CACHE_PREFIX+company}
function saveSnapshot(s){
  try{localStorage.setItem(cacheKey(s.companyCode),JSON.stringify(s))}catch(_){}
}
function loadSnapshot(company){
  try{
    const x=JSON.parse(localStorage.getItem(cacheKey(company))||'null');
    return x&&x.companyCode===company?x:null;
  }catch(_){return null}
}

async function fetchFinance(force=false){
  if(loading)return;
  loading=true;lastError='';
  try{
    const companyCode=selectedCompany();
    const c=await getClient();
    const session=await getSession();
    if(!session){
      currentSnapshot=loadSnapshot(companyCode);
      render();
      return;
    }
    const email=(session.user?.email||'').toLowerCase();
    const must=expectedEmail(companyCode);
    if(must && email!==must){
      currentSnapshot=null;
      lastError=`Account Finance non corretto. Per Smart Pack devi collegare ${must}. Account attuale: ${email||'sconosciuto'}.`;
      render();
      return;
    }

    const cr=await c.from('companies').select('id,name').order('name');
    if(cr.error)throw cr.error;
    const company=(cr.data||[]).find(x=>exactCompany(x.name,companyCode));
    if(!company){
      currentSnapshot=null;
      lastError=`NOMYRA Finance non restituisce un'azienda ${companyCode==='smartpack'?'Smart Pack':'Multiplast'} accessibile con questo account. Nessun dato viene mostrato.`;
      render();
      return;
    }

    const dr=await c.from('financial_documents')
      .select('id,company_id,period,document_name,document_type,coverage_score,recognized_key_values,expected_key_values,confirmed_values,missing_values,extraction_status,updated_at')
      .eq('company_id',company.id)
      .order('period',{ascending:false});
    if(dr.error)throw dr.error;

    const docs=dr.data||[];
    const doc=docs[0]||null;
    let values=[],kpis=[];
    if(doc){
      const [vr,kr]=await Promise.all([
        c.from('financial_values').select('document_id,company_id,key,label,value,unit,method,confidence,is_confirmed').eq('document_id',doc.id),
        c.from('financial_kpis').select('document_id,company_id,key,label,value,unit,formula,explanation,result_reading,status').eq('document_id',doc.id).order('label')
      ]);
      if(vr.error)throw vr.error;
      if(kr.error)throw kr.error;
      values=vr.data||[];kpis=kr.data||[];
    }
    currentSnapshot={
      companyCode,
      accountEmail:email,
      company:{id:company.id,name:company.name},
      documents:docs,
      document:doc,
      values,
      kpis,
      syncedAt:new Date().toISOString()
    };
    saveSnapshot(currentSnapshot);
  }catch(e){
    lastError=e?.message||String(e);
    const companyCode=selectedCompany();
    currentSnapshot=loadSnapshot(companyCode);
  }finally{
    loading=false;render();
  }
}

function rowByKeyOrLabel(rows, keys=[], labels=[]){
  for(const k of keys){const x=rows.find(r=>norm(r.key)===norm(k));if(x)return x}
  for(const l of labels){
    const nl=norm(l);
    const x=rows.find(r=>norm(r.label)===nl)||rows.find(r=>norm(r.label).includes(nl));
    if(x)return x;
  }
  return null;
}
function metric(label,row){
  return `<article class="nf33-metric"><span>${esc(label)}</span><b>${row?fmt(row.value,row.unit):'—'}</b><small>${row?'Fonte NOMYRA Finance':'Dato non disponibile'}</small></article>`;
}
function connected(s){
  const doc=s.document, vals=s.values||[], kpis=s.kpis||[];
  const revenue=rowByKeyOrLabel(kpis,['revenue'],['Ricavi'])||rowByKeyOrLabel(vals,['revenue'],['Ricavi']);
  const prod=rowByKeyOrLabel(kpis,['productionValue'],['Valore della produzione'])||rowByKeyOrLabel(vals,['productionValue'],['Valore della produzione']);
  const ebitda=rowByKeyOrLabel(kpis,['ebitda'],['EBITDA / MOL','EBITDA'])||rowByKeyOrLabel(vals,['ebitda'],['EBITDA']);
  const margin=rowByKeyOrLabel(kpis,['ebitdaMargin'],['EBITDA margin','Margine EBITDA']);
  const ebit=rowByKeyOrLabel(kpis,['ebit'],['EBIT'])||rowByKeyOrLabel(vals,['ebit'],['EBIT']);
  const cash=rowByKeyOrLabel(vals,['cash'],['Liquidità']);
  const rec=rowByKeyOrLabel(vals,['receivables'],['Crediti']);
  const pay=rowByKeyOrLabel(vals,['payables'],['Debiti fornitori']);
  const inv=rowByKeyOrLabel(vals,['inventory'],['Rimanenze']);
  const debt=rowByKeyOrLabel(vals,['debt'],['Debiti totali']);
  const eq=rowByKeyOrLabel(vals,['equity'],['Patrimonio netto']);
  const extra=kpis.filter(x=>![revenue,prod,ebitda,margin,ebit].includes(x)).slice(0,30);
  return `
  <section class="nf33-page">
    <header class="nf33-head">
      <div>
        <span>NOMYRA FINANCE · DATI UFFICIALI</span>
        <h2>${esc(s.company.name)}</h2>
        <p>Account collegato: <b>${esc(s.accountEmail)}</b>. SP-MP visualizza soltanto l'ultimo documento salvato in NOMYRA Finance e non ricalcola nessun valore.</p>
      </div>
      <div class="nf33-actions">
        <div class="nf33-state"><i></i><div><b>Finance collegato</b><small>Ultimo sync ${new Date(s.syncedAt).toLocaleString('it-IT')}</small></div></div>
        <button data-nf33-refresh>Aggiorna da Finance</button>
        <button data-nf33-logout>Disconnetti</button>
      </div>
    </header>
    ${lastError?`<div class="nf33-warning">${esc(lastError)} · Sto mostrando l'ultimo snapshot Finance salvato.</div>`:''}
    <section class="nf33-doc">
      <div><span>Periodo</span><b>${esc(doc?.period||'—')}</b></div>
      <div><span>Documento</span><b>${esc(doc?.document_name||'Nessun documento')}</b></div>
      <div><span>Copertura</span><b>${doc?Math.round(Number(doc.coverage_score||0))+'%':'—'}</b></div>
      <div><span>Aggiornato in Finance</span><b>${doc?.updated_at?new Date(doc.updated_at).toLocaleString('it-IT'):'—'}</b></div>
    </section>
    ${!doc?`<div class="nf33-empty"><b>Nessun bilancio disponibile per Smart Pack</b><p>Carica o completa il bilancio in NOMYRA Finance. SP-MP non genera valori sostitutivi.</p></div>`:`
    <section class="nf33-block">
      <div class="nf33-title"><div><span>KPI PRINCIPALI</span><h3>Situazione economica</h3></div><small>Valori congelati al documento Finance selezionato</small></div>
      <div class="nf33-grid">${metric('Ricavi',revenue)}${metric('Valore produzione',prod)}${metric('EBITDA',ebitda)}${metric('EBITDA margin',margin)}${metric('EBIT',ebit)}</div>
    </section>
    <section class="nf33-block">
      <div class="nf33-title"><div><span>STATO PATRIMONIALE</span><h3>Equilibrio finanziario</h3></div></div>
      <div class="nf33-patr">${[['Liquidità',cash],['Crediti',rec],['Debiti fornitori',pay],['Rimanenze',inv],['Debiti totali',debt],['Patrimonio netto',eq]].map(([l,r])=>`<div><span>${l}</span><b>${r?fmt(r.value,r.unit||'EUR'):'—'}</b></div>`).join('')}</div>
    </section>
    <section class="nf33-block">
      <div class="nf33-title"><div><span>INDICATORI</span><h3>Analisi NOMYRA Finance</h3></div><small>${extra.length} indicatori</small></div>
      <div class="nf33-table">${extra.length?extra.map(k=>`<div class="nf33-row"><div><b>${esc(k.label)}</b><small>${esc(k.formula||'')}</small></div><strong>${fmt(k.value,k.unit)}</strong><p>${esc(k.result_reading||k.explanation||'')}</p></div>`).join(''):'<div class="nf33-empty small">Nessun altro indicatore salvato in Finance.</div>'}</div>
    </section>`}
  </section>`;
}
function disconnected(companyCode){
  const must=expectedEmail(companyCode);
  return `<section class="nf33-page"><div class="nf33-connect">
    <div class="nf33-mark">NF</div>
    <div><span>NOMYRA FINANCE</span><h2>Collega ${companyCode==='smartpack'?'Smart Pack':'Multiplast'} a Finance</h2><p>Per Smart Pack la fonte finanziaria ufficiale è NOMYRA Finance. Finché l'account non è collegato non vengono mostrati KPI o calcoli SP-MP.</p>${must?`<div class="nf33-info">Account richiesto: <b>${must}</b></div>`:''}</div>
    <button data-nf33-connect>Collega Finance</button>
  </div></section>`;
}
function errorOnly(companyCode){
  return `<section class="nf33-page"><div class="nf33-empty"><b>Finance non disponibile</b><p>${esc(lastError)}</p><div class="nf33-actions center"><button data-nf33-connect>Collega account corretto</button><button data-nf33-refresh>Riprova</button></div></div></section>`;
}

async function render(){
  const view=$('#adminFinanceV1170View');
  if(!view || !view.classList.contains('active'))return;
  const companyCode=selectedCompany();
  const session=await getSession().catch(()=>null);

  // Elimina COMPLETAMENTE il vecchio motore SP-MP da questa pagina.
  if(!view.dataset.nf33Owned){
    view.dataset.nf33Owned='1';
    view.innerHTML='<div id="nf33Root"></div>';
  }else if(!$('#nf33Root',view)){
    view.innerHTML='<div id="nf33Root"></div>';
  }
  const root=$('#nf33Root',view);
  if(!session){
    const cached=loadSnapshot(companyCode);
    currentSnapshot=cached;
    root.innerHTML=cached?connected(cached):disconnected(companyCode);
  }else{
    const email=(session.user?.email||'').toLowerCase();
    const must=expectedEmail(companyCode);
    if(must && email!==must){
      lastError=`Account collegato non corretto: ${email||'sconosciuto'}. Per Smart Pack è richiesto ${must}.`;
      root.innerHTML=errorOnly(companyCode);
    }else if(currentSnapshot && currentSnapshot.companyCode===companyCode){
      root.innerHTML=connected(currentSnapshot);
    }else{
      root.innerHTML=`<section class="nf33-page"><div class="nf33-empty"><b>Lettura NOMYRA Finance…</b><p>Sto caricando i dati ufficiali di ${companyCode==='smartpack'?'Smart Pack':'Multiplast'}.</p></div></section>`;
      setTimeout(()=>fetchFinance(false),20);
    }
  }
  bind(root);
}

function ensureLogin(){
  if($('#nf33Login'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="nf33Login" class="nf33-login"><form id="nf33LoginForm"><div class="nf33-login-head"><div><span>NOMYRA FINANCE</span><h3>Collega account Finance</h3></div><button type="button" data-close>×</button></div><label>Email<input type="email" name="email" autocomplete="username"></label><label>Password<input type="password" name="password" autocomplete="current-password"></label><div class="nf33-msg"></div><button class="nf33-primary">Collega</button></form></dialog>`);
  const d=$('#nf33Login');
  d.querySelector('[data-close]').onclick=()=>d.close();
  $('#nf33LoginForm').onsubmit=async e=>{
    e.preventDefault();
    const msg=d.querySelector('.nf33-msg'), btn=d.querySelector('.nf33-primary');
    btn.disabled=true;msg.textContent='Connessione in corso…';
    try{
      const companyCode=selectedCompany();
      const email=e.currentTarget.email.value.trim().toLowerCase();
      const must=expectedEmail(companyCode);
      if(must && email!==must)throw new Error(`Per Smart Pack devi usare ${must}.`);
      const c=await getClient();
      const {error}=await c.auth.signInWithPassword({email,password:e.currentTarget.password.value});
      if(error)throw error;
      currentSnapshot=null;lastError='';
      d.close();
      await fetchFinance(true);
    }catch(err){msg.textContent=err?.message||'Accesso non riuscito.'}
    finally{btn.disabled=false}
  };
}
function bind(root){
  root.querySelector('[data-nf33-connect]')?.addEventListener('click',()=>{ensureLogin();const d=$('#nf33Login');const must=expectedEmail(selectedCompany());if(must)d.querySelector('[name=email]').value=must;d.showModal()});
  root.querySelector('[data-nf33-refresh]')?.addEventListener('click',async()=>{currentSnapshot=null;lastError='';await fetchFinance(true)});
  root.querySelector('[data-nf33-logout]')?.addEventListener('click',async()=>{const c=await getClient();await c.auth.signOut();currentSnapshot=null;lastError='';render()});
}

function styles(){
  if($('#nf33Styles'))return;
  const st=document.createElement('style');st.id='nf33Styles';st.textContent=`
  #adminFinanceV1170View[data-nf33-owned="1"]{padding:16px!important;background:#f5f9fa!important}
  .nf33-page{display:grid;gap:12px}.nf33-head,.nf33-doc,.nf33-block,.nf33-connect,.nf33-empty{background:#fff;border:1px solid #d8e5e9;border-radius:18px;box-shadow:0 8px 24px rgba(23,57,74,.045)}
  .nf33-head{padding:18px 20px;display:flex;justify-content:space-between;gap:18px;align-items:center}.nf33-head span,.nf33-title span,.nf33-connect span{font-size:8px;font-weight:950;letter-spacing:.09em;color:#a56c49}.nf33-head h2,.nf33-connect h2{margin:4px 0;font-size:25px;color:#173642}.nf33-head p,.nf33-connect p{margin:0;color:#617984;font-size:10px;line-height:1.5}.nf33-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.nf33-actions button,.nf33-connect>button,.nf33-primary{border:0;border-radius:11px;background:#2688ee;color:#fff;font-weight:900;padding:11px 14px;cursor:pointer}.nf33-actions button:last-child{background:#fff;color:#46616d;border:1px solid #d6e3e7}
  .nf33-state{display:flex;align-items:center;gap:8px;background:#eef8f4;padding:9px 11px;border-radius:12px}.nf33-state i{width:9px;height:9px;background:#2d946e;border-radius:50%}.nf33-state b,.nf33-state small{display:block}.nf33-state b{font-size:9px}.nf33-state small{font-size:7.5px;color:#68808a}
  .nf33-warning{padding:10px 13px;border-radius:12px;background:#fff8e8;border:1px solid #ead9a8;color:#7a5c16;font-size:9px}.nf33-doc{display:grid;grid-template-columns:repeat(4,1fr);padding:12px}.nf33-doc>div{padding:7px 10px;border-right:1px solid #e5ecef}.nf33-doc>div:last-child{border-right:0}.nf33-doc span,.nf33-patr span{display:block;font-size:8px;color:#748890}.nf33-doc b{display:block;margin-top:4px;font-size:11px;color:#203e4a}
  .nf33-block{padding:15px}.nf33-title{display:flex;justify-content:space-between;align-items:end;gap:12px}.nf33-title h3{margin:3px 0 0;font-size:15px}.nf33-title small{font-size:8px;color:#7a8d95}.nf33-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:11px}.nf33-metric{padding:12px;border:1px solid #dde8eb;border-radius:12px;background:#fbfcfd}.nf33-metric span{display:block;font-size:8px;color:#71858e}.nf33-metric b{display:block;font-size:17px;margin-top:5px;color:#183744}.nf33-metric small{display:block;font-size:7.5px;color:#64808a;margin-top:4px}
  .nf33-patr{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:11px}.nf33-patr>div{padding:10px;border-radius:11px;background:#f7fafb;border:1px solid #e0e9ec}.nf33-patr b{display:block;margin-top:4px;font-size:11px}.nf33-table{margin-top:10px;border:1px solid #e0e9ec;border-radius:12px;overflow:hidden}.nf33-row{display:grid;grid-template-columns:1fr 150px 1.5fr;gap:12px;padding:10px;border-top:1px solid #edf2f3;align-items:center}.nf33-row:first-child{border-top:0}.nf33-row b{font-size:9px}.nf33-row small{display:block;font-size:7px;color:#819198;margin-top:2px}.nf33-row strong{font-size:10px}.nf33-row p{margin:0;font-size:8px;color:#617781}
  .nf33-connect{padding:25px;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center}.nf33-mark{width:56px;height:56px;border-radius:15px;background:#17394a;color:#fff;display:grid;place-items:center;font-weight:950}.nf33-info{display:inline-block;margin-top:10px;padding:8px 10px;border-radius:9px;background:#f5f8fa;font-size:9px;color:#57717c}.nf33-empty{padding:28px;text-align:center}.nf33-empty b{font-size:14px}.nf33-empty p{font-size:9px;color:#71858e}.nf33-empty.small{border:0;box-shadow:none;padding:14px}
  .nf33-login{width:min(500px,94vw);border:0;border-radius:18px;padding:0;box-shadow:0 25px 80px rgba(0,0,0,.25)}.nf33-login::backdrop{background:rgba(18,37,46,.55)}.nf33-login form{padding:22px}.nf33-login-head{display:flex;justify-content:space-between;align-items:start}.nf33-login-head span{font-size:8px;font-weight:950;color:#a56c49}.nf33-login-head h3{margin:4px 0 10px}.nf33-login-head button{border:0;background:#eef3f5;border-radius:9px;width:34px;height:34px;font-size:20px}.nf33-login label{display:block;font-size:8px;font-weight:850;color:#667e88;margin-top:10px}.nf33-login input{display:block;width:100%;margin-top:4px;border:1px solid #d5e2e6;border-radius:9px;padding:10px}.nf33-msg{min-height:20px;margin-top:8px;font-size:9px;color:#ad3c47}.nf33-primary{width:100%;margin-top:8px}
  @media(max-width:1000px){.nf33-grid{grid-template-columns:repeat(3,1fr)}.nf33-patr{grid-template-columns:repeat(3,1fr)}.nf33-doc{grid-template-columns:1fr 1fr}.nf33-row{grid-template-columns:1fr 110px 1.2fr}}
  @media(max-width:700px){.nf33-head,.nf33-connect{display:block}.nf33-actions{margin-top:12px}.nf33-mark{margin-bottom:10px}.nf33-grid,.nf33-patr,.nf33-doc,.nf33-row{grid-template-columns:1fr}.nf33-doc>div{border-right:0;border-bottom:1px solid #e5ecef}.nf33-doc>div:last-child{border-bottom:0}}
  `;
  document.head.appendChild(st);
}

function patchNavigation(){
  const old=window.renderCurrent||((typeof renderCurrent==='function')?renderCurrent:null);
  if(typeof old==='function'&&!old.__nf33){
    const wrapped=function(){
      const r=old.apply(this,arguments);
      setTimeout(()=>{if($('#adminFinanceV1170View')?.classList.contains('active'))render()},40);
      return r;
    };
    wrapped.__nf33=true;
    window.renderCurrent=wrapped;
    try{renderCurrent=wrapped}catch(_){}
  }
}
function boot(){
  styles();ensureLogin();patchNavigation();
  const view=$('#adminFinanceV1170View');
  if(view){
    new MutationObserver(()=>{if(view.classList.contains('active'))setTimeout(render,20)}).observe(view,{attributes:true,attributeFilter:['class']});
  }
  setTimeout(()=>{if($('#adminFinanceV1170View')?.classList.contains('active'))render()},150);
}
window.SPFinanceStrictV11933={version:VERSION,render,refresh:()=>fetchFinance(true)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

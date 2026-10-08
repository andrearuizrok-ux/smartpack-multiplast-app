(()=>{
'use strict';
if(window.SPClientInitFinance11936)return;
const VERSION='V11.9.36';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(v)):'—';
const SNAP='spmp_nf33_snapshot_smartpack';

function snapshot(){try{return JSON.parse(localStorage.getItem(SNAP)||'null')}catch(_){return null}}
function kpi(s,labels){
  if(!s)return null;const rows=[...(s.kpis||[]),...(s.values||[])];
  const n=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  for(const label of labels){const q=n(label),x=rows.find(r=>n(r.label)===q)||rows.find(r=>n(r.key)===q)||rows.find(r=>n(r.label).includes(q));if(x)return x}
  return null;
}
function financePanelHTML(){
  const s=snapshot();
  if(!s||s.companyCode!=='smartpack')return `<section class="v11936-finance-card disconnected" data-v11936-finance>
    <div class="v11936-fin-head"><div><span>NOMYRA FINANCE · FONTE UFFICIALE</span><h3>Finance non collegato</h3><p>La dashboard non mostra più valori economici calcolati da SP-MP. Collega NOMYRA Finance per visualizzare il bilancio ufficiale Smart Pack.</p></div><button class="btn primary" data-v11936-openfinance>Collega Finance</button></div>
  </section>`;
  const revenue=kpi(s,['Ricavi']);
  const ebitda=kpi(s,['EBITDA / MOL','EBITDA']);
  const ebit=kpi(s,['EBIT']);
  const rec=kpi(s,['Crediti']);
  const debt=kpi(s,['Debiti totali','Debiti fornitori']);
  const working=(rec&&debt)?Number(rec.value||0)-Number(debt.value||0):null;
  return `<section class="v11936-finance-card" data-v11936-finance>
    <div class="v11936-fin-head"><div><span>NOMYRA FINANCE · DATI UFFICIALI</span><h3>${esc(s.company?.name||'Smart Pack')}</h3><p>Periodo <b>${esc(s.document?.period||'—')}</b> · Ultimo aggiornamento ${s.syncedAt?new Date(s.syncedAt).toLocaleString('it-IT'):'—'}. I valori restano fissi finché Finance non viene aggiornato.</p></div><button class="btn" data-v11936-openfinance>Apri Finance</button></div>
    <div class="v11936-fin-grid"><div><span>Ricavi</span><b>${revenue?money(revenue.value):'—'}</b></div><div><span>EBITDA</span><b>${ebitda?money(ebitda.value):'—'}</b></div><div><span>EBIT</span><b>${ebit?money(ebit.value):'—'}</b></div><div><span>Crediti − Debiti</span><b>${working==null?'—':money(working)}</b></div></div>
  </section>`;
}
function openFinance(){
  try{if(window.SPReleaseV1170?.adminQuick)return window.SPReleaseV1170.adminQuick('finance')}catch(_){}
  try{if(typeof navTo==='function')navTo('finance')}catch(_){}
}
function patchAdminDashboard(){
  const view=$('#adminOverviewV1170View');if(!view||!view.classList.contains('active'))return;
  // Rimuove l'intero blocco economico legacy per impedire la ricomparsa di bilanci locali.
  const old=$('.v1182-economic-panel',view);if(old){const tmp=document.createElement('div');tmp.innerHTML=financePanelHTML();old.replaceWith(tmp.firstElementChild)}
  // Anche il confronto aziende conteneva EBIT/Ricavi locali: lo rendiamo neutro.
  const compare=$('.v1182-company-compare',view);
  if(compare){compare.innerHTML=`<button data-v11936-openfinance><span>SMART PACK</span><b>NOMYRA Finance</b><small>Dati economici disponibili solo dalla fonte Finance ufficiale.</small></button><button data-v11936-openfinance><span>MULTIPLAST</span><b>NOMYRA Finance</b><small>Apri Finance per consultare i dati autorizzati.</small></button>`}
  $$('[data-v11936-openfinance]',view).forEach(b=>b.onclick=openFinance);
}

const CLEAR_ARRAYS=[
 'orders','production','lidProduction','imlMovements','materialIn','materialOut','mixes','audit','imlPurchaseOrders','productionSheets',
 'deliveryRecords','productionRuns','productionEvents','loadingSheetsV106','loadingSheetsV1167','finishedGoodsLots','finishedGoodsMovements',
 'rawMaterialLots','rawMaterialMovements','warehouseAllocations','warehousePreparationEvents','truckLoads','plannerHistoryV115',
 'scheduledMoldChangesV11931','emailOrderDraftsV115','emailIMLConfirmationsV1163','supplierPayments','deletedOrders','machineDowntime',
 'complianceRecords','directorMessages','importHistoryV116','imlUsageEvents','clientDirectory','clients','supplierDirectory','customerPrices',
 'supplierPrices','clientPriceListAssignments','priceLists','priceListItems'
];
const OPTIONAL_CONFIG=['products','productDirectory','machines','molds'];
function clearKey(k){if(Array.isArray(state?.[k]))state[k]=[];else if(state&&Object.prototype.hasOwnProperty.call(state,k)){const v=state[k];state[k]=Array.isArray(v)?[]:(v&&typeof v==='object'?{}:null)}}
function performReset(clearConfig){
  if(!window.state&&typeof state==='undefined')return;
  for(const k of CLEAR_ARRAYS)clearKey(k);
  // IML: azzera dati di stock/catalogo demo per un avvio realmente pulito.
  if(Array.isArray(state.imls))state.imls=[];
  // I vecchi calcoli finanziari SP-MP non devono sopravvivere all'inizializzazione.
  state.adminFinanceV1170={records:[]};state.financeSpringV1173={};state.financeSettings={};
  if(clearConfig){for(const k of OPTIONAL_CONFIG)clearKey(k);state.plannerRulesV115={};state.materialCoverageConfigV11929={};}
  try{localStorage.removeItem(SNAP)}catch(_){}
  try{if(typeof save==='function')save()}catch(e){console.error('[V11.9.36 reset save]',e)}
  setTimeout(()=>{try{window.POICloudV10?.syncNow?.()}catch(_){}},700);
  try{if(typeof toast==='function')toast('Dati aziendali azzerati. La piattaforma è pronta per l’avvio reale.')}catch(_){}
  setTimeout(()=>location.reload(),1200);
}
function ensureResetDialog(){
  if($('#v11936ResetDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="v11936ResetDialog" class="v11936-reset"><form id="v11936ResetForm">
    <div class="modal-head"><div><span class="eyebrow">AVVIO REALE CLIENTE</span><h3>Inizializza dati azienda</h3><p>Elimina i dati demo/operativi e prepara Smart Pack per l'utilizzo reale. Utenti, accessi, Gmail, NOMYRA Finance e anagrafica azienda vengono mantenuti.</p></div><button type="button" class="close" data-v11936-close>×</button></div>
    <div class="modal-body"><div class="v11936-danger"><b>Verranno azzerati</b><span>Ordini, produzione, fogli, magazzino, materie prime, IML, clienti/fornitori, spedizioni, tracciabilità operativa, scadenze e vecchi dati Finance locali.</span></div>
      <fieldset><legend>Azzera anche configurazione prodotti/presse?</legend><label><input type="radio" name="clearConfig" value="no" checked> <span><b>No</b><small>Mantieni prodotti, presse, stampi e relativa configurazione.</small></span></label><label><input type="radio" name="clearConfig" value="yes"> <span><b>Sì</b><small>Riparti da zero anche con prodotti, presse e stampi.</small></span></label></fieldset>
      <label class="v11936-confirm"><input type="checkbox" name="confirm" required> Confermo di voler azzerare i dati operativi attuali.</label>
    </div><div class="modal-actions"><button type="button" class="btn" data-v11936-close>Annulla</button><button type="submit" class="btn danger">Azzera e inizializza</button></div>
  </form></dialog>`);
  $$('[data-v11936-close]').forEach(b=>b.onclick=()=>$('#v11936ResetDialog')?.close());
  $('#v11936ResetForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(!fd.get('confirm'))return;if(!confirm('Confermi definitivamente? I dati operativi attuali verranno azzerati.'))return;performReset(fd.get('clearConfig')==='yes')};
}
function addResetCard(){
  const view=$('#companySettingsView');if(!view||!view.classList.contains('active')||$('#v11936InitCard',view))return;
  const shell=$('.v116-settings',view)||view;
  const card=document.createElement('div');card.id='v11936InitCard';card.className='v116-card v11936-init-card';card.innerHTML=`<div><span class="eyebrow">AVVIO REALE</span><h3>Inizializza dati del cliente</h3><p>Usa questa funzione quando vuoi eliminare i dati demo e iniziare a inserire i dati reali Smart Pack da zero.</p><div class="v11936-keeps"><b>Mantiene:</b> utenti e PIN · accessi · Gmail · NOMYRA Finance · anagrafica azienda</div></div><button class="btn danger" type="button" id="v11936OpenReset">Inizializza / azzera dati</button>`;
  shell.appendChild(card);$('#v11936OpenReset').onclick=()=>{ensureResetDialog();$('#v11936ResetDialog').showModal()};
}
function patchConfig(){
  const api=window.SPDeliveryV116;if(api&&typeof api.render==='function'&&!api.render.__v11936){const old=api.render;api.render=function(){const r=old.apply(this,arguments);setTimeout(addResetCard,20);return r};api.render.__v11936=true}
  addResetCard();
}
function styles(){
  if($('#v11936Styles'))return;const st=document.createElement('style');st.id='v11936Styles';st.textContent=`
  .v11936-finance-card{background:#fff;border:1px solid #d7e5e9;border-radius:17px;padding:16px;box-shadow:0 6px 18px rgba(23,57,74,.035)}.v11936-finance-card.disconnected{background:#fbfcfd}.v11936-fin-head{display:flex;justify-content:space-between;gap:16px;align-items:center}.v11936-fin-head span{font-size:9px;letter-spacing:.08em;font-weight:950;color:#a86c48}.v11936-fin-head h3{margin:4px 0;font-size:19px}.v11936-fin-head p{margin:0;font-size:11px;color:#657b84}.v11936-fin-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.v11936-fin-grid>div{padding:11px;border:1px solid #e0e9ec;border-radius:11px;background:#f8fafb}.v11936-fin-grid span{display:block;font-size:9px;color:#73878f}.v11936-fin-grid b{display:block;font-size:18px;margin-top:4px}.v11936-init-card{margin-top:16px!important;border:1px solid #e6c5c8!important;background:#fffafa!important;display:flex;justify-content:space-between;gap:20px;align-items:center}.v11936-init-card h3{margin:4px 0 5px}.v11936-init-card p{margin:0;color:#647a83}.v11936-keeps{margin-top:10px;padding:9px 10px;border-radius:10px;background:#fff;font-size:10px;color:#5f757e}.v11936-reset{width:min(720px,94vw);border:0;border-radius:19px;padding:0;box-shadow:0 28px 90px rgba(0,0,0,.28)}.v11936-reset::backdrop{background:rgba(17,35,44,.58)}.v11936-reset .modal-body{display:grid;gap:13px}.v11936-danger{padding:12px;border-radius:12px;background:#fff2f3;border:1px solid #efc9cc}.v11936-danger b,.v11936-danger span{display:block}.v11936-danger span{font-size:10px;margin-top:3px;color:#76565a}.v11936-reset fieldset{border:1px solid #d9e5e9;border-radius:12px;padding:12px}.v11936-reset legend{font-weight:900;font-size:11px}.v11936-reset fieldset label{display:flex;gap:10px;padding:9px;border-radius:10px;cursor:pointer}.v11936-reset fieldset label:hover{background:#f6f9fa}.v11936-reset fieldset span b,.v11936-reset fieldset span small{display:block}.v11936-reset fieldset span small{margin-top:2px;color:#6d818a}.v11936-confirm{font-size:10px;font-weight:850}.v11936-confirm input{margin-right:7px}@media(max-width:750px){.v11936-fin-head,.v11936-init-card{display:block}.v11936-fin-grid{grid-template-columns:1fr 1fr}.v11936-fin-head button,.v11936-init-card button{margin-top:12px;width:100%}}
  `;document.head.appendChild(st);
}
function refresh(){styles();patchConfig();patchAdminDashboard()}
function boot(){ensureResetDialog();refresh();const mo=new MutationObserver(()=>setTimeout(refresh,20));mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setTimeout(refresh,300);setTimeout(refresh,1000)}
window.SPClientInitFinance11936={version:VERSION,reset:performReset,refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

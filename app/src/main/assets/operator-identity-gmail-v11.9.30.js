(()=>{
'use strict';
const BUILD='V11.9.30';
const EMP_KEYS=['poi_v113_employee','poi_v1180_device_employee'];
const WORKER_ROLES=new Set(['worker','mpworker']);
function role(){return sessionStorage.getItem('industrialos_role_session')||sessionStorage.getItem('nomyra_group_role_v92')||''}
function employee(){
  for(const k of EMP_KEYS){
    for(const store of [sessionStorage,localStorage]){
      try{const raw=store.getItem(k);if(raw){const e=JSON.parse(raw);if(e?.display_name)return e}}catch(_){}
    }
  }
  return null;
}
function workerName(){const e=employee();return WORKER_ROLES.has(role())?String(e?.display_name||'').trim():''}
function isOperatorField(el){
  if(!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement))return false;
  const n=String(el.name||'').toLowerCase(), id=String(el.id||'').toLowerCase();
  if(n==='operator'||n==='operatore'||id.includes('operator'))return true;
  if(/^op_\d+/.test(n)||n.startsWith('operatorproduction')||n.startsWith('operatorhandles'))return true;
  return false;
}
function lockField(el,name){
  if(!isOperatorField(el)||!name)return;
  try{
    el.value=name;
    el.setAttribute('value',name);
    el.setAttribute('readonly','readonly');
    el.removeAttribute('list');
    el.dataset.poiOperatorLocked='1';
    el.title='Operatore identificato automaticamente dal USER/PIN';
    if(el.tagName==='SELECT'){
      let opt=[...el.options].find(o=>o.value===name);
      if(!opt){opt=new Option(name,name,true,true);el.add(opt)}
      el.value=name;el.style.pointerEvents='none';
    }
  }catch(_){}
}
function lockAll(root=document){
  const name=workerName();if(!name)return;
  root.querySelectorAll?.('input,select,textarea').forEach(el=>lockField(el,name));
  const p=document.getElementById('productionView');
  if(p&&!document.getElementById('poi11930OperatorBadge')){
    const badge=document.createElement('div');badge.id='poi11930OperatorBadge';badge.className='poi11930-op-badge';
    badge.innerHTML=`<span>OPERATORE ATTIVO</span><b>${escapeHtml(name)}</b><small>Gli aggiornamenti di produzione vengono registrati automaticamente con questo utente.</small>`;
    p.prepend(badge);
  }
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function guardEvents(){
  ['beforeinput','input','change','paste','drop'].forEach(evt=>document.addEventListener(evt,e=>{
    const name=workerName();if(!name||!isOperatorField(e.target))return;
    if(evt!=='change')e.preventDefault?.();
    lockField(e.target,name);
  },true));
  document.addEventListener('submit',e=>{const name=workerName();if(name)lockAll(e.target)},true);
}
function observe(){
  const mo=new MutationObserver(ms=>{if(!workerName())return;for(const m of ms){for(const n of m.addedNodes){if(n.nodeType===1)lockAll(n)}}});
  mo.observe(document.documentElement,{subtree:true,childList:true});
}
function style(){if(document.getElementById('poi11930Style'))return;const s=document.createElement('style');s.id='poi11930Style';s.textContent=`
.poi11930-op-badge{margin:0 0 14px;padding:15px 17px;border:1px solid #b9d8cf;border-radius:14px;background:#f2faf7;display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center}.poi11930-op-badge span{font-size:9px;font-weight:950;letter-spacing:.08em;color:#16705b}.poi11930-op-badge b{font-size:18px}.poi11930-op-badge small{grid-column:1/-1;margin-top:5px;color:#617781;font-size:10px}.poi11930-locked-label{font-size:9px;color:#16705b;font-weight:800}`;document.head.appendChild(s)}

async function parseFunctionError(err){
  let detail='';
  try{
    const ctx=err?.context;
    if(ctx&&typeof ctx.clone==='function'){
      const res=ctx.clone();
      const text=await res.text();
      if(text){
        try{const j=JSON.parse(text);detail=j.error||j.message||j.code||text}catch(_){detail=text}
      }
      if(!detail)detail=`HTTP ${ctx.status||''}`.trim();
    }
  }catch(_){}
  const msg=String(detail||err?.message||err||'Errore sconosciuto');
  if(/gmail_secrets_not_configured|client.?id|client.?secret/i.test(msg))return 'Backend Gmail non configurato: mancano Google Client ID/Client Secret nei Secrets della Edge Function.';
  if(/redirect|redirect_uri/i.test(msg))return 'Google OAuth rifiuta il redirect URI. Va autorizzato in Google Cloud il dominio staging e il callback usato dalla Edge Function.';
  if(/401|jwt|unauthor|auth/i.test(msg))return 'La Edge Function Gmail non accetta la sessione corrente (autenticazione/JWT).';
  if(/404|not found|function.*not/i.test(msg))return 'La Edge Function poi-gmail-orders non risulta disponibile nel progetto Supabase usato dalla piattaforma.';
  return msg;
}
async function fixedConnectGmail(){
  const sb=window.POICloudV10?.getClient?.();
  if(!sb){alert('Connessione cloud non disponibile.');return}
  try{
    const returnUrl=`${location.origin}${location.pathname}`;
    const {data,error}=await sb.functions.invoke('poi-gmail-orders',{body:{action:'connect',company_code:'smartpack',return_url:returnUrl}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    if(!data?.url)throw new Error('La Edge Function non ha restituito l’URL OAuth di Google.');
    location.href=data.url;
  }catch(e){
    const d=await parseFunctionError(e);
    alert('Collegamento Gmail non riuscito.\n\n'+d+'\n\nLa correzione, se riguarda OAuth/Secrets, va fatta nel backend Supabase e non nel browser.');
  }
}
function patchGmail(){
  if(window.SPPlannerV115){window.SPPlannerV115.connectGmail=fixedConnectGmail;window.SPPlannerV115.gmailDiagnostic11930=true}
}
function boot(){style();guardEvents();observe();lockAll();patchGmail();setTimeout(()=>{lockAll();patchGmail()},400);setTimeout(()=>{lockAll();patchGmail()},1400);document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/g,BUILD)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

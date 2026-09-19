/* Smart Pack · Multiplast — V11.5 · Coda Roberto + pianificazione intelligente
   Obiettivi:
   - Roberto mantiene sempre il controllo della coda (drag & drop / su-giu / blocco posizione).
   - Il motore suggerisce, non applica modifiche senza conferma.
   - Regole operative: coperchi a fine settimana; cambio stampo solo 06:00-12:00 con Saverio;
     minimizzazione cambi; urgenza/data consegna; stampo e IML disponibili; tempi ciclo reali.
   - Menu Direzione personalizzabile.
   - Inbox ordini Gmail con OAuth server-side, sincronizzazione in sola lettura e verifica umana obbligatoria.
*/
(()=>{
  'use strict';

  const BUILD='V11.5';
  const MARKER='PIATTAFORMA-GRUPPO-V11.5';
  const VIEW='planner';
  // poi115-access-cleanup: il flusso accessi è gestito esclusivamente da access-v11.5.js.

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const n=v=>Number(v||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n(v));
  const now=()=>new Date();
  const iso=()=>new Date().toISOString();
  const uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const role=()=>typeof currentRole!=='undefined'?currentRole:'';
  const currentCompany=()=>sessionStorage.getItem('poi_v113_company')||'';
  const isSmartPackContext=()=>currentCompany()==='smartpack' || role()==='director';

  const DEFAULT_RULES={
    moldChangeStart:'06:00',
    moldChangeEnd:'12:00',
    moldChangeTechnician:'Saverio',
    lidDays:[5,6],
    urgencyDays:3,
    preferInstalledMold:true,
    preferLidsWeekend:true,
    allowUrgentLidOverride:true
  };

  let draggedRunId='';
  let emailDraftEditing='';
  let menuWorking=[];
  let gmailStatus={loading:true,connected:false,connection:null,error:''};

  const cloudClient=()=>window.POICloudV10?.getClient?.()||null;
  async function gmailCall(action,extra={}){
    const sb=cloudClient();
    if(!sb)throw new Error('cloud_not_ready');
    const {data,error}=await sb.functions.invoke('poi-gmail-orders',{body:{action,company_code:'smartpack',...extra}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data||{};
  }
  function normalizeDueDate(raw=''){
    const v=String(raw||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;
    const m=v.match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/);
    if(!m)return '';
    const y=(m[3]||new Date().getFullYear().toString());const yy=y.length===2?`20${y}`:y;
    return `${yy}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  }
  async function loadGmailStatus(shouldRender=false){
    if(!isSmartPackContext()){gmailStatus={loading:false,connected:false,connection:null,error:''};return gmailStatus;}
    try{
      const data=await gmailCall('status');
      gmailStatus={loading:false,connected:Boolean(data.connected),connection:data.connection||null,error:''};
    }catch(e){
      gmailStatus={loading:false,connected:false,connection:null,error:String(e?.message||e)};
    }
    if(shouldRender){
      if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();
      decorateOrdersEmail();
    }
    updateGmailDialog();
    return gmailStatus;
  }
  function gmailStateHtml(){
    if(gmailStatus.loading)return '<b>Verifica connessione Gmail…</b><span>Controllo dello stato della casella ordini.</span>';
    if(gmailStatus.connected){
      const c=gmailStatus.connection||{};
      return `<b>Gmail Smart Pack collegato · ${esc(c.google_email||'casella ordini')}</b><span>${c.last_sync_at?'Ultima sincronizzazione: '+esc(new Date(c.last_sync_at).toLocaleString('it-IT')):'Connessione attiva. Prima sincronizzazione non ancora eseguita.'}</span>`;
    }
    return `<b>Gmail non collegato</b><span>${gmailStatus.error&&gmailStatus.error!=='authentication_required'?'Configurazione da completare. ':''}Collega la casella ordini con OAuth Google: nessuna password viene salvata nella piattaforma.</span>`;
  }
  async function connectGmail(){
    try{
      const returnUrl=`${location.origin}${location.pathname}`;
      const data=await gmailCall('connect',{return_url:returnUrl});
      if(!data.url)throw new Error('oauth_url_missing');
      location.href=data.url;
    }catch(e){
      const msg=String(e?.message||e);
      if(msg.includes('gmail_secrets_not_configured')) alert('Mancano ancora Client ID e Client Secret Google nel backend Supabase.');
      else alert('Impossibile avviare il collegamento Gmail: '+msg);
    }
  }
  async function syncGmail(){
    try{
      const data=await gmailCall('sync');
      ensureState();
      const existing=new Set((state.emailOrderDraftsV115||[]).map(x=>x.id||`${x.gmailMessageId||''}_${x.gmailItemIndex||1}`));
      let added=0;
      for(const raw of (data.drafts||[])){
        const d={...raw,dueDate:normalizeDueDate(raw.dueDate||raw.dueDateRaw||''),status:raw.status||'Da verificare'};
        const masterClient=findClientV115(d.clientCode||d.client);
        const masterProduct=findProductV115(d.productCode||d.product);
        if(masterClient){d.clientCode=masterClient.code;d.client=masterClient.name;d.newClient=false}
        if(masterProduct){d.productCode=masterProduct.code;d.product=masterProduct.name}
        const key=d.id||`${d.gmailMessageId||''}_${d.gmailItemIndex||1}`;
        if(existing.has(key))continue;
        state.emailOrderDraftsV115.unshift(d);existing.add(key);added++;
      }
      audit('Gmail sincronizzato','Inbox ordini',`${added} nuove bozze`);
      saveNow(added?`${added} nuove e-mail importate`:'Nessuna nuova e-mail');
      await loadGmailStatus(false);
      if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();
      decorateOrdersEmail();
    }catch(e){alert('Sincronizzazione Gmail non riuscita: '+String(e?.message||e))}
  }
  async function disconnectGmail(){
    if(!confirm('Scollegare la casella Gmail dalla piattaforma?'))return;
    try{await gmailCall('disconnect');gmailStatus={loading:false,connected:false,connection:null,error:''};updateGmailDialog();if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();decorateOrdersEmail();}catch(e){alert('Disconnessione non riuscita: '+String(e?.message||e))}
  }
  function updateGmailDialog(){
    const el=$('#v115GmailDialogState');if(el)el.innerHTML=gmailStateHtml();
    const sync=$('#v115GmailSyncBtn'),connect=$('#v115GmailConnectBtn'),disconnect=$('#v115GmailDisconnectBtn');
    if(sync)sync.style.display=gmailStatus.connected?'':'none';
    if(connect)connect.style.display=gmailStatus.connected?'none':'';
    if(disconnect)disconnect.style.display=gmailStatus.connected?'':'none';
  }

  function saveNow(message=''){
    try{save()}catch(e){console.warn('[V11.5] save',e)}
    if(message){try{toast(message)}catch(_){}}
  }
  function audit(action,ref,detail){
    try{addAudit(action,ref,detail)}catch(_){
      state.audit=Array.isArray(state.audit)?state.audit:[];
      state.audit.unshift({id:uid('aud'),at:iso(),action,ref,detail,role:role()});
    }
  }
  function machine(id){return (state.machines||[]).find(x=>String(x.id)===String(id))||null}
  function mold(id){return (state.molds||[]).find(x=>String(x.id)===String(id))||null}
  function order(code){return (state.orders||[]).find(x=>String(x.code)===String(code))||null}
  function orderMain(parent){const a=(state.orders||[]).filter(x=>String(x.parent)===String(parent)&&!x.cancelled);return a.find(x=>String(x.code||'').endsWith('A'))||a[0]||null}
  function netRun(r){return Math.max(0,n(r?.netProducedV104!=null?r.netProducedV104:r?.produced))}
  function remaining(r){return Math.max(0,n(r?.qty)-netRun(r))}
  function rateFor(r){const m=mold(r?.moldId);const rate=n(m?.rate);if(rate>0)return rate;const sec=n(m?.cycleSeconds);return sec>0?3600/sec:0}
  function hoursFor(r){const rate=rateFor(r);return rate>0?remaining(r)/rate:0}
  function isLid(r){const o=order(r?.orderCode),m=mold(r?.moldId);return /COPERCHIO|CLT|TAPPO|LID/i.test([o?.product,o?.liters,m?.name,m?.kind,r?.product].join(' '))}
  function dueDate(r){const o=order(r?.orderCode)||orderMain(r?.parent);const v=o?.dueDate||r?.requestedDate||'';if(!v)return null;let d;if(/^\d{4}-\d{2}-\d{2}$/.test(v))d=new Date(v+'T12:00:00');else if(/^\d{2}\/\d{2}\/\d{4}$/.test(v)){const [dd,mm,yy]=v.split('/');d=new Date(`${yy}-${mm}-${dd}T12:00:00`)}else d=new Date(v);return isNaN(d)?null:d}
  function daysTo(d){if(!d)return 9999;const a=new Date();a.setHours(0,0,0,0);const b=new Date(d);b.setHours(0,0,0,0);return Math.ceil((b-a)/86400000)}
  function isUrgent(r){const o=order(r?.orderCode)||orderMain(r?.parent);const dd=daysTo(dueDate(r));return /URGENT/i.test(String(r?.priority||o?.priority||''))||dd<=rules().urgencyDays}
  function imlState(r){
    const o=order(r?.orderCode);if(!o?.imlCode)return {needed:false,ok:true,physical:null,code:''};
    let x=null;try{x=typeof getIML==='function'?getIML(o.imlCode):null}catch(_){}
    const physical=x?Math.max(0,n(x.physical)):null;
    return {needed:true,ok:physical==null?true:physical>=remaining(r),physical,code:o.imlCode};
  }
  function fmtHours(v){return n(v)>0?`${n(v).toLocaleString('it-IT',{minimumFractionDigits:n(v)<10?1:0,maximumFractionDigits:1})} h`:'—'}
  function localTimeMinutes(){const d=now();return d.getHours()*60+d.getMinutes()}
  function hmMinutes(v){const [h,m]=String(v||'00:00').split(':').map(Number);return h*60+m}
  function inChangeWindow(){const x=localTimeMinutes(),r=rules();return x>=hmMinutes(r.moldChangeStart)&&x<=hmMinutes(r.moldChangeEnd)}
  function changeWindowLabel(){const r=rules();return `${r.moldChangeStart}–${r.moldChangeEnd} · ${r.moldChangeTechnician}`}
  function weekendMode(){return rules().lidDays.includes(now().getDay())}
  function tomorrowWeekend(){const d=new Date();d.setDate(d.getDate()+1);return rules().lidDays.includes(d.getDay())}

  function rules(){return state.plannerRulesV115||DEFAULT_RULES}
  function ensureState(){
    state.plannerRulesV115={...DEFAULT_RULES,...(state.plannerRulesV115||{})};
    state.menuPrefsV115=state.menuPrefsV115&&typeof state.menuPrefsV115==='object'?state.menuPrefsV115:{};
    state.emailOrderDraftsV115=Array.isArray(state.emailOrderDraftsV115)?state.emailOrderDraftsV115:[];
    state.plannerHistoryV115=Array.isArray(state.plannerHistoryV115)?state.plannerHistoryV115:[];
    state.productionRuns=Array.isArray(state.productionRuns)?state.productionRuns:[];
    for(const [idx,r] of state.productionRuns.entries()){
      if(r.sequence==null)r.sequence=idx+1;
      if(r.plannerLockedV115==null)r.plannerLockedV115=false;
    }
  }

  function machineList(){
    const ids=new Set((state.productionRuns||[]).filter(r=>r.machineId).map(r=>r.machineId));
    for(const m of state.machines||[])ids.add(m.id);
    return [...ids].map(id=>machine(id)||{id,name:id}).filter(Boolean).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  }
  function queued(machineId=''){
    return (state.productionRuns||[]).filter(r=>r.status==='In coda'&&remaining(r)>0&&(!machineId||String(r.machineId)===String(machineId))).sort((a,b)=>n(a.sequence)-n(b.sequence)||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  }

  function runScore(r){
    const o=order(r.orderCode)||{},m=machine(r.machineId),mo=mold(r.moldId),dd=daysTo(dueDate(r)),urgent=isUrgent(r),lid=isLid(r),iml=imlState(r),wk=weekendMode()||tomorrowWeekend();
    let score=0;const reasons=[],warnings=[];
    if(urgent){score+=650;reasons.push(dd<=rules().urgencyDays?`consegna vicina (${dd<0?'scaduta':dd+' gg'})`:'priorità urgente')}
    else if(dd<=7){score+=180;reasons.push(`consegna entro ${dd} gg`)}
    if(m?.installedMoldId&&m.installedMoldId===r.moldId){score+=rules().preferInstalledMold?420:120;reasons.push('stampo già montato')}
    else if(mo){
      score-=inChangeWindow()?35:220;
      warnings.push(inChangeWindow()?`richiede cambio stampo nella finestra ${changeWindowLabel()}`:`cambio stampo da fare solo ${changeWindowLabel()}`);
    }else warnings.push('stampo non configurato');
    if(lid){
      if(rules().preferLidsWeekend&&wk){score+=520;reasons.push('coperchio: preferenza fine settimana')}
      else if(rules().preferLidsWeekend&&!urgent){score-=120;warnings.push('coperchio preferibile a fine settimana')}
      else if(urgent&&rules().allowUrgentLidOverride){score+=200;reasons.push('urgenza supera la preferenza weekend')}
    }
    if(iml.needed){if(iml.ok){score+=80;reasons.push('IML disponibili')}else{score-=900;warnings.push(`IML insufficienti (${fmt(iml.physical||0)} / ${fmt(remaining(r))})`)}}
    const h=hoursFor(r);if(h>0){score+=Math.min(180,h*18);reasons.push(`${fmtHours(h)} stimate`)}else warnings.push('tempo ciclo non configurato');
    score+=Math.min(120,Math.log10(Math.max(10,remaining(r)))*25);
    return {score,reasons,warnings,urgent,lid,iml,days:dd,hours:h,machine:m,mold:mo};
  }

  function suggestedForMachine(machineId){
    const current=queued(machineId),ranked=current.slice().sort((a,b)=>runScore(b).score-runScore(a).score||n(a.sequence)-n(b.sequence));
    const result=new Array(current.length),unlocked=[];
    current.forEach((r,i)=>r.plannerLockedV115?result[i]=r:unlocked.push(r));
    const rankedUnlocked=ranked.filter(r=>!r.plannerLockedV115);
    let k=0;for(let i=0;i<result.length;i++)if(!result[i])result[i]=rankedUnlocked[k++];
    return result.filter(Boolean);
  }
  function countSuggestedChanges(){
    let c=0;for(const m of machineList()){const a=queued(m.id),b=suggestedForMachine(m.id);a.forEach((r,i)=>{if(b[i]&&b[i].id!==r.id)c++})}return c;
  }

  function nextChangeSlot(){
    const r=rules(),d=new Date();const start=hmMinutes(r.moldChangeStart),x=localTimeMinutes();
    if(x<=hmMinutes(r.moldChangeEnd)&&x<=start){d.setHours(Math.floor(start/60),start%60,0,0)}
    else if(x<=hmMinutes(r.moldChangeEnd)&&inChangeWindow())return 'adesso, entro '+r.moldChangeEnd;
    else{d.setDate(d.getDate()+1);d.setHours(Math.floor(start/60),start%60,0,0)}
    while(d.getDay()===0){d.setDate(d.getDate()+1)}
    return d.toLocaleString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function reasonText(r,index){
    const s=runScore(r),m=machine(r.machineId),installed=mold(m?.installedMoldId),change=!!(m?.installedMoldId&&m.installedMoldId!==r.moldId);
    let text=index===0?'Consigliata come prossima produzione':'Compatibile con la sequenza suggerita';
    if(s.reasons.length)text+=': '+s.reasons.slice(0,3).join(', ')+'.';
    if(change)text+=` Cambio stampo: ${nextChangeSlot()} (${rules().moldChangeTechnician}).`;
    if(s.warnings.length)text+=' Attenzione: '+s.warnings.join('; ')+'.';
    if(r.plannerLockedV115)text='Posizione bloccata da Roberto. '+text;
    if(installed&&!change&&index===0)text+=` Mantiene ${installed.name}.`;
    return text;
  }

  function setSequences(machineId,list,source='manuale'){
    list.forEach((r,i)=>{r.sequence=(i+1)*10;r.plannerLastMovedV115=iso();r.plannerSourceV115=source});
    state.plannerHistoryV115.unshift({id:uid('plan'),at:iso(),machineId,source,order:[...list].map(r=>r.id)});
    state.plannerHistoryV115=state.plannerHistoryV115.slice(0,100);
  }
  function moveRun(runId,delta){
    const r=(state.productionRuns||[]).find(x=>String(x.id)===String(runId));if(!r)return;
    const list=queued(r.machineId),i=list.findIndex(x=>x.id===r.id),j=i+delta;if(i<0||j<0||j>=list.length)return;
    [list[i],list[j]]=[list[j],list[i]];setSequences(r.machineId,list,'Roberto');audit('Coda produzione modificata',r.orderCode,`${machine(r.machineId)?.name||r.machineId} · posizione ${j+1}`);saveNow();renderPlanner();
  }
  function dropRun(targetId){
    if(!draggedRunId||draggedRunId===targetId)return;
    const a=(state.productionRuns||[]).find(x=>x.id===draggedRunId),b=(state.productionRuns||[]).find(x=>x.id===targetId);if(!a||!b||a.machineId!==b.machineId)return;
    const list=queued(a.machineId),from=list.findIndex(x=>x.id===a.id),to=list.findIndex(x=>x.id===b.id);if(from<0||to<0)return;
    const [moved]=list.splice(from,1);list.splice(to,0,moved);setSequences(a.machineId,list,'Roberto');audit('Coda produzione trascinata',a.orderCode,`${machine(a.machineId)?.name||a.machineId} · posizione ${to+1}`);saveNow();renderPlanner();
  }
  function toggleLock(runId){const r=(state.productionRuns||[]).find(x=>x.id===runId);if(!r)return;r.plannerLockedV115=!r.plannerLockedV115;audit(r.plannerLockedV115?'Produzione bloccata in pianificazione':'Produzione sbloccata in pianificazione',r.orderCode,'Roberto');saveNow();renderPlanner()}
  function applySuggestions(){
    if(!confirm('Applicare la sequenza consigliata ai lavori NON bloccati? Le posizioni bloccate da Roberto restano ferme.'))return;
    for(const m of machineList())setSequences(m.id,suggestedForMachine(m.id),'Assistente V11.5');
    audit('Pianificazione suggerita applicata','Coda produzione','Applicate solo posizioni non bloccate');saveNow('Sequenza consigliata applicata');renderPlanner();
  }

  function runCard(r,index){
    const s=runScore(r),o=order(r.orderCode)||{},mo=mold(r.moldId),due=dueDate(r),m=machine(r.machineId),installed=mold(m?.installedMoldId),change=!!(r.moldId&&m?.installedMoldId&&r.moldId!==m.installedMoldId);
    return `<article class="v115-run" draggable="true" data-run="${esc(r.id)}">
      <div class="v115-grip" title="Trascina">⋮⋮</div>
      <div class="v115-run-main"><div class="v115-run-top"><div><span class="v115-over">#${index+1} · ${esc(r.orderCode)}${r.plannerLockedV115?' · BLOCCATO':''}</span><h4>${esc(r.client||o.client||'')} · ${esc(r.product||o.product||'')}</h4></div><div class="v115-badges">${s.urgent?'<span class="v115-chip urgent">URGENTE</span>':''}${s.lid?'<span class="v115-chip lid">COPERCHIO</span>':''}${change?'<span class="v115-chip change">CAMBIO STAMPO</span>':'<span class="v115-chip ok">STAMPO OK</span>'}</div></div>
      <div class="v115-metrics"><div><span>Residuo</span><b>${fmt(remaining(r))} pz</b></div><div><span>Tempo</span><b>${fmtHours(s.hours)}</b></div><div><span>Stampo</span><b>${esc(mo?.name||r.moldId||'Da definire')}</b></div><div><span>Consegna</span><b>${due?due.toLocaleDateString('it-IT'):'—'}</b></div></div>
      <div class="v115-reason">${esc(reasonText(r,index))}</div>
      <div class="v115-run-actions"><button class="btn small" type="button" onclick="SPPlannerV115.move('${esc(r.id)}',-1)">↑ Su</button><button class="btn small" type="button" onclick="SPPlannerV115.move('${esc(r.id)}',1)">↓ Giù</button><button class="btn small ${r.plannerLockedV115?'secondary':''}" type="button" onclick="SPPlannerV115.lock('${esc(r.id)}')">${r.plannerLockedV115?'🔒 Sblocca':'🔓 Blocca'}</button><button class="btn small" type="button" onclick="navTo('production')">Monitor</button></div></div>
    </article>`;
  }

  function machinePanel(m){
    const list=queued(m.id),suggested=suggestedForMachine(m.id),first=suggested[0],inst=mold(m.installedMoldId),change=first&&m.installedMoldId&&first.moldId!==m.installedMoldId;
    return `<section class="v115-machine"><div class="v115-machine-head"><div><span>PIANIFICAZIONE PRESSA</span><h3>${esc(m.name||m.id)}</h3><p>Stampo installato: <b>${esc(inst?.name||'non indicato')}</b></p></div><div class="v115-machine-summary"><b>${list.length}</b><span>in coda</span></div></div>
      ${first?`<div class="v115-advice"><div><span>ASSISTENTE IA · PROSSIMO CONSIGLIATO</span><b>Ordine ${esc(first.orderCode)} · ${esc(first.client||order(first.orderCode)?.client||'')}</b><p>${esc(reasonText(first,0))}</p></div><span class="v115-score">${Math.round(runScore(first).score)}</span></div>`:'<div class="v115-empty">Nessuna produzione in coda.</div>'}
      ${change&&!inChangeWindow()?`<div class="v115-warning"><b>Cambio stampo non adesso.</b> La prossima finestra prevista è ${esc(nextChangeSlot())}, con ${esc(rules().moldChangeTechnician)}.</div>`:''}
      <div class="v115-queue" data-machine="${esc(m.id)}">${list.map(runCard).join('')}</div>
    </section>`;
  }

  function rulesChips(){const r=rules();return `<div class="v115-rules"><span>Cambio stampo ${esc(r.moldChangeStart)}–${esc(r.moldChangeEnd)}</span><span>${esc(r.moldChangeTechnician)}</span><span>Coperchi ven/sab</span><span>Urgenza ≤ ${r.urgencyDays} gg</span><span>Roberto prevale sempre</span></div>`}
  function emailDraftCard(d){
    const verified=d.status==='Verificata';
    const clientMaster=findClientV115(d.clientCode||d.client);
    const productMaster=findProductV115(d.productCode||d.product);
    const clientOfficial=clientMaster
      ? `<button type="button" class="v115-inline-client" onclick="SPPlannerV115.client('${esc(clientMaster.code)}')"><span class="v115-master-code">${esc(clientMaster.code)}</span> ${esc(clientMaster.name)}</button>`
      : `<span class="v115-unmatched">Cliente da associare</span>`;
    const productOfficial=productMaster
      ? `<span class="v115-product-master"><span class="v115-master-code">${esc(productMaster.code)}</span> ${esc(productMaster.name)}</span>`
      : `<span class="v115-unmatched">Prodotto da associare</span>`;
    const suggestions=[];
    if(!clientMaster&&d.client)suggestions.push(`cliente letto: ${esc(d.client)}`);
    if(!productMaster&&d.product)suggestions.push(`prodotto letto: ${esc(d.product)}`);
    return `<article class="v115-email-draft">
      <div>
        <span>${esc(d.status||'Bozza')}</span>
        <b class="v115-master-row">${clientOfficial}<span class="v115-master-sep">·</span>${productOfficial}</b>
        ${suggestions.length?`<div class="v115-mail-suggestion">Dalla e-mail: ${suggestions.join(' · ')}</div>`:''}
        <p>${fmt(d.qty)} pz${d.dueDate?' · consegna '+esc(d.dueDate):''}${d.subject?' · '+esc(d.subject):''}</p>
      </div>
      <div>
        <button class="btn small" onclick="SPPlannerV115.editEmail('${esc(d.id)}')">${verified?'Modifica':'Controlla'}</button>
        ${verified?`<button class="btn small primary" onclick="SPPlannerV115.toOrder('${esc(d.id)}')">Approva e crea ordine</button>`:'<span class="v115-waiting-ok">Da approvare</span>'}
        <button class="btn small danger" type="button" onclick="SPPlannerV115.discardEmail('${esc(d.id)}')">Scarta</button>
      </div>
    </article>`;
  }

  function renderPlanner(){
    ensureState();const v=$('#plannerView');if(!v)return;
    const q=queued(),urgent=q.filter(isUrgent),hours=q.reduce((s,r)=>s+hoursFor(r),0),changes=countSuggestedChanges(),drafts=state.emailOrderDraftsV115.filter(d=>d.status!=='Convertita'&&(!d.companyCode||d.companyCode==='smartpack'));
    v.innerHTML=`<div class="v115-hero"><div><span class="v115-eyebrow">SMART PACK · PIANIFICAZIONE ROBERTO</span><h2>Coda produzione</h2><p>Roberto decide l'ordine reale. L'assistente confronta urgenza, tempi, stampi installati, IML e regole operative e propone una sequenza spiegata.</p></div><div class="v115-hero-actions"><button class="btn" onclick="SPPlannerV115.menu()">Personalizza menu</button><button class="btn" onclick="SPPlannerV115.rules()">Regole</button><button class="btn primary" onclick="SPPlannerV115.apply()">Applica suggerimento</button></div></div>
    ${rulesChips()}
    <div class="v115-kpis"><div><span>Produzioni in coda</span><b>${q.length}</b><small>ordinate da Roberto</small></div><div><span>Urgenti / vicine</span><b>${urgent.length}</b><small>entro ${rules().urgencyDays} giorni</small></div><div><span>Ore stimate</span><b>${fmtHours(hours)}</b><small>su tempi ciclo configurati</small></div><div><span>Movimenti suggeriti</span><b>${changes}</b><small>mai applicati automaticamente</small></div><div><span>Ordini e-mail</span><b>${drafts.length}</b><small>bozze da verificare</small></div></div>
    <div class="v115-status ${inChangeWindow()?'ok':'warn'}"><b>${inChangeWindow()?'Finestra cambio stampo aperta':'Finestra cambio stampo chiusa'}</b><span>${esc(changeWindowLabel())}. ${weekendMode()?'Oggi è attiva la preferenza coperchi.':tomorrowWeekend()?'Domani è giornata coperchi: il suggerimento ne tiene conto.':'I coperchi vengono favoriti a fine settimana salvo urgenze.'}</span></div>
    <div class="v115-machines">${machineList().map(machinePanel).join('')}</div>
    <section class="v115-email v115-email-summary"><div class="v115-section-head"><div><span>ORDINI DA E-MAIL</span><h3>${drafts.length?drafts.length+' bozze da controllare':'Nessuna bozza in attesa'}</h3><p>La gestione delle e-mail è stata spostata nella sezione <b>Ordini</b>, dove le bozze vengono controllate e approvate prima della creazione.</p></div><div><button class="btn primary" onclick="navTo('orders')">Vai a Ordini</button></div></div></section>`;
    bindDrag();version();
  }


  function ordersEmailHtml(){
    ensureState();
    if(!isSmartPackContext())return '';
    const drafts=state.emailOrderDraftsV115.filter(d=>d.status!=='Convertita'&&(!d.companyCode||d.companyCode==='smartpack'));
    return `<section class="v115-orders-email" id="v115OrdersEmailPanel"><div class="v115-orders-email-top"><div><span class="v115-eyebrow">ORDINI DA GMAIL</span><h3>Acquisisci ordini da e-mail</h3><p>Sincronizza la casella ordini. Ogni e-mail entra come <b>bozza</b>: controllate cliente, articolo, quantità e consegna; solo dopo la vostra approvazione viene aperto il modulo per creare l’ordine.</p><span class="v115-orders-email-count">${drafts.length} ${drafts.length===1?'bozza da verificare':'bozze da verificare'}</span></div><div class="v115-orders-email-actions"><button class="btn" type="button" onclick="SPPlannerV115.emailSetup()">Impostazioni Gmail</button>${gmailStatus.connected?'<button class="btn primary" type="button" onclick="SPPlannerV115.syncGmail()">Sincronizza Gmail</button>':'<button class="btn primary" type="button" onclick="SPPlannerV115.connectGmail()">Collega Gmail</button>'}<button class="btn" type="button" onclick="SPPlannerV115.importEmail()">Importa manualmente</button></div></div><div class="v115-email-state">${gmailStateHtml()}</div><div class="v115-email-list">${drafts.map(emailDraftCard).join('')||'<div class="v115-empty">Nessuna e-mail in attesa di verifica.</div>'}</div></section>`;
  }
  function decorateOrdersEmail(){
    const view=$('#ordersView');if(!view)return;
    const old=$('#v115OrdersEmailPanel',view);if(old)old.remove();
    if(!isSmartPackContext())return;
    const host=view.querySelector('.v106-page-head')||view.firstElementChild;
    if(host)host.insertAdjacentHTML('afterend',ordersEmailHtml());
    else view.insertAdjacentHTML('afterbegin',ordersEmailHtml());
    decorateClientLinksV115();
  }
  function observeOrders(){
    const view=$('#ordersView');if(!view||view.dataset.v115EmailObserved==='1')return;
    view.dataset.v115EmailObserved='1';
    let pending=false;
    new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;if(!$('#v115OrdersEmailPanel',view))decorateOrdersEmail()},0)}).observe(view,{childList:true});
    decorateOrdersEmail();
  }
  function patchOrdersRender(){
    try{
      const old=window.renderOrdersV106||((typeof renderOrdersV106!=='undefined')?renderOrdersV106:null);
      if(typeof old==='function'&&!old.__v115gmail){
        const w=function(){const out=old.apply(this,arguments);setTimeout(decorateOrdersEmail,0);return out};w.__v115gmail=true;window.renderOrdersV106=w;try{renderOrdersV106=w}catch(_){}
      }
    }catch(e){console.warn('[V11.5] orders gmail render',e)}
    observeOrders();
  }

  function bindDrag(){
    $$('#plannerView .v115-run').forEach(card=>{
      card.addEventListener('dragstart',e=>{draggedRunId=card.dataset.run;card.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
      card.addEventListener('dragend',()=>{draggedRunId='';card.classList.remove('dragging')});
      card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('over')});
      card.addEventListener('dragleave',()=>card.classList.remove('over'));
      card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('over');dropRun(card.dataset.run)});
    });
  }

  function menuDefaults(){return (NAV?.director||[]).map(x=>x[0])}
  function menuLabels(){return Object.fromEntries((NAV?.director||[]).map(x=>[x[0],x[2]]))}
  function menuPref(){
    const all=menuDefaults(),saved=state.menuPrefsV115?.director?.order||[];const order=[...saved.filter(x=>all.includes(x)),...all.filter(x=>!saved.includes(x))];const hidden=(state.menuPrefsV115?.director?.hidden||[]).filter(x=>all.includes(x));return {order,hidden};
  }
  function applyMenuPrefs(){
    if(role()!=='director')return;const side=$('#sideNav');if(!side)return;const p=menuPref(),map=new Map($$('[data-view]',side).map(b=>[b.dataset.view,b]));
    p.order.forEach(key=>{const b=map.get(key);if(b){b.style.display=p.hidden.includes(key)?'none':'';side.appendChild(b)}});
    for(const [key,b] of map)if(!p.order.includes(key))side.appendChild(b);
  }
  function openMenu(){
    const d=$('#v115MenuDialog'),p=menuPref();menuWorking=p.order.map(k=>({key:k,hidden:p.hidden.includes(k)}));drawMenu();d.showModal();
  }
  function drawMenu(){
    const body=$('#v115MenuBody'),labels=menuLabels();if(!body)return;body.innerHTML=menuWorking.map((x,i)=>`<div class="v115-menu-row"><label><input type="checkbox" data-menu-check="${esc(x.key)}" ${x.hidden?'':'checked'}> <b>${esc(labels[x.key]||x.key)}</b></label><div><button type="button" class="btn small" data-menu-up="${i}">↑</button><button type="button" class="btn small" data-menu-down="${i}">↓</button></div></div>`).join('');
    $$('[data-menu-check]',body).forEach(c=>c.onchange=()=>{const x=menuWorking.find(y=>y.key===c.dataset.menuCheck);if(x)x.hidden=!c.checked});
    $$('[data-menu-up]',body).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.menuUp);if(i>0)[menuWorking[i-1],menuWorking[i]]=[menuWorking[i],menuWorking[i-1]];drawMenu()});
    $$('[data-menu-down]',body).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.menuDown);if(i<menuWorking.length-1)[menuWorking[i+1],menuWorking[i]]=[menuWorking[i],menuWorking[i+1]];drawMenu()});
  }
  function saveMenu(){state.menuPrefsV115.director={order:menuWorking.map(x=>x.key),hidden:menuWorking.filter(x=>x.hidden).map(x=>x.key)};saveNow('Menu salvato');$('#v115MenuDialog').close();try{renderNav()}catch(_){}applyMenuPrefs()}

  function openRules(){const r=rules(),f=$('#v115RulesForm');f.elements.start.value=r.moldChangeStart;f.elements.end.value=r.moldChangeEnd;f.elements.technician.value=r.moldChangeTechnician;f.elements.urgency.value=r.urgencyDays;f.elements.friday.checked=r.lidDays.includes(5);f.elements.saturday.checked=r.lidDays.includes(6);f.elements.preferInstalled.checked=!!r.preferInstalledMold;f.elements.preferLids.checked=!!r.preferLidsWeekend;$('#v115RulesDialog').showModal()}
  function saveRules(e){e.preventDefault();const f=e.currentTarget;state.plannerRulesV115={...rules(),moldChangeStart:f.elements.start.value||'06:00',moldChangeEnd:f.elements.end.value||'12:00',moldChangeTechnician:f.elements.technician.value.trim()||'Saverio',urgencyDays:Math.max(0,n(f.elements.urgency.value)),lidDays:[f.elements.friday.checked?5:null,f.elements.saturday.checked?6:null].filter(x=>x!=null),preferInstalledMold:f.elements.preferInstalled.checked,preferLidsWeekend:f.elements.preferLids.checked};audit('Regole pianificazione aggiornate','V11.5',changeWindowLabel());saveNow('Regole salvate');$('#v115RulesDialog').close();renderPlanner()}


  const KNOWN_CLIENT_CODES_V115={
    'ALPAZOO':'CLI-001','CIDERPLAST':'CLI-002','DECORA':'CLI-003','DIMARIA':'CLI-004',
    'DITAN COLOR':'CLI-005','EKOS':'CLI-006','FLAMINGO':'CLI-007','GIPSOS':'CLI-008',
    'IDEAL COLOR':'CLI-009','IIVELA':'CLI-010','MARMOPLAST':'CLI-011','NEWMAIER':'CLI-012',
    'PLASTIMUR':'CLI-013','SALETTA':'CLI-014','SEGI':'CLI-015','SPIVER':'CLI-016',
    'TIZIANO COLORI':'CLI-017'
  };

  function clientDirectoryV115(){
    const primary=Array.isArray(state.clientDirectory)&&state.clientDirectory.length?state.clientDirectory:
      (Array.isArray(state.clients)?state.clients:[]);
    return primary.map((x,i)=>{
      const name=typeof x==='string'?x:String(x?.name||'');
      if(!name)return null;
      const stable=KNOWN_CLIENT_CODES_V115[String(name).trim().toUpperCase()]||'';
      const code=typeof x==='object'?(x.code||x.reference||stable||`CLI-${String(i+1).padStart(3,'0')}`):(stable||`CLI-${String(i+1).padStart(3,'0')}`);
      return typeof x==='object'?{...x,name,code,reference:x.reference||code}:{name,code,reference:code};
    }).filter(Boolean).sort((a,b)=>String(a.name).localeCompare(String(b.name),'it'));
  }
  function productDirectoryV115(){
    const arr=Array.isArray(state.products)?state.products:[];
    return arr.map((x,i)=>{
      if(typeof x==='string') return {name:x,code:`PRD-${String(i+1).padStart(3,'0')}`};
      return {...x,code:x.code||`PRD-${String(i+1).padStart(3,'0')}`};
    }).filter(x=>x.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'it'));
  }
  function findClientV115(codeOrName){
    const raw=String(codeOrName||'').trim();
    const v=raw.toLowerCase().replace(/\s+/g,' ');
    return clientDirectoryV115().find(x=>{
      const code=String(x.code||'').toLowerCase();
      const name=String(x.name||'').trim().toLowerCase().replace(/\s+/g,' ');
      return code===v||name===v;
    })||null;
  }
  function findProductV115(codeOrName){
    const raw=String(codeOrName||'').trim();
    const v=raw.toLowerCase().replace(/\s+/g,' ');
    return productDirectoryV115().find(x=>{
      const code=String(x.code||'').toLowerCase();
      const name=String(x.name||'').trim().toLowerCase().replace(/\s+/g,' ');
      return code===v||name===v;
    })||null;
  }
  function optionHtmlV115(list,currentCode,currentName,placeholder){
    const cc=String(currentCode||''),cn=String(currentName||'').toLowerCase();
    return [`<option value="">${esc(placeholder)}</option>`].concat(list.map(x=>{
      const sel=(cc&&String(x.code)===cc)||(!cc&&cn&&String(x.name).toLowerCase()===cn);
      return `<option value="${esc(x.code)}" ${sel?'selected':''}>${esc(x.code)} · ${esc(x.name)}</option>`;
    })).join('');
  }
  function fillEmailMasterDataV115(d){
    const f=$('#v115EmailDraftForm');if(!f)return;
    const cs=f.elements.clientCode,ps=f.elements.productCode;
    if(cs) cs.innerHTML=optionHtmlV115(clientDirectoryV115(),d.clientCode,d.client,d.newClient?'Nuovo cliente: seleziona dopo il censimento':'Seleziona cliente');
    if(ps) ps.innerHTML=optionHtmlV115(productDirectoryV115(),d.productCode,d.product,'Seleziona prodotto');
    const note=$('#v115NewClientNote');
    if(note){
      note.style.display=d.newClient?'block':'none';
      note.textContent=d.newClient?`Nuovo mittente: ${d.senderEmail||d.from||d.client||''}. Prima di confermare l'ordine, censisci il cliente nell'anagrafica e poi selezionalo dall'elenco.`:'';
    }
  }

  function orderClientCodeV115(name){
    return findClientV115(name)?.code||'';
  }
  function orderPendingV115(lines){
    const active=(lines||[]).filter(o=>!o.cancelled);
    if(!active.length)return false;
    return active.some(o=>{
      const s=String(o.status||'').toLowerCase();
      const productionDone=Boolean(o.productionCompleteV106)||/soddisf|chius|consegn|complet/.test(s);
      const deliveryRemaining=o.deliveryRemaining!=null?n(o.deliveryRemaining):Math.max(0,n(o.qty)-n(o.delivered));
      return !productionDone || deliveryRemaining>0;
    });
  }
  function clientOrdersV115(name){
    const nm=String(name||'').trim().toLowerCase();
    const parents=[...new Set((state.orders||[]).filter(o=>String(o.client||'').trim().toLowerCase()===nm).map(o=>String(o.parent||o.code||'')))].filter(Boolean);
    return parents.map(parent=>{
      const lines=(state.orders||[]).filter(o=>String(o.parent||o.code||'')===parent&&!o.cancelled);
      const main=lines.find(o=>String(o.code||'').endsWith('A'))||lines[0]||{};
      return {parent,lines,main,pending:orderPendingV115(lines)};
    }).sort((a,b)=>Number(b.pending)-Number(a.pending)||String(b.main.date||'').localeCompare(String(a.main.date||'')));
  }
  function openClientV115(codeOrName){
    const c=findClientV115(codeOrName)||{code:'',name:String(codeOrName||'Cliente')};
    const rows=clientOrdersV115(c.name),pending=rows.filter(x=>x.pending),closed=rows.filter(x=>!x.pending);
    const dlg=$('#v115ClientDialog'),title=$('#v115ClientTitle'),meta=$('#v115ClientMeta'),body=$('#v115ClientBody');
    if(!dlg||!body)return;
    title.textContent=`${c.code?c.code+' · ':''}${c.name}`;
    meta.textContent=`${pending.length} ordini pendenti · ${rows.length} ordini totali`;
    const rowHtml=x=>{
      const a=x.main||{},qty=(x.lines||[]).reduce((s,o)=>s+n(o.qty),0);
      return `<article class="v115-client-order ${x.pending?'pending':'closed'}"><div><span>ORDINE ${esc(x.parent)}</span><b>${esc(a.product||'')}</b><p>${fmt(qty)} pz${a.dueDate?' · consegna '+esc(a.dueDate):''}${a.status?' · '+esc(a.status):''}</p></div><div><span class="v115-client-state">${x.pending?'PENDENTE':'CHIUSO'}</span><button class="btn small" type="button" onclick="SPPlannerV115.clientOrderDetails('${esc(x.parent)}')">Dettagli</button></div></article>`;
    };
    body.innerHTML=`<div class="v115-client-kpis"><div><span>Pendenti</span><b>${pending.length}</b></div><div><span>Totali</span><b>${rows.length}</b></div></div><div class="v115-client-section"><h4>Ordini pendenti</h4>${pending.map(rowHtml).join('')||'<div class="v115-empty">Nessun ordine pendente.</div>'}</div>${closed.length?`<div class="v115-client-section"><h4>Storico</h4>${closed.map(rowHtml).join('')}</div>`:''}`;
    dlg.showModal();
  }
  function clientOrderDetailsV115(parent){
    $('#v115ClientDialog')?.close();
    if(typeof traceOrder==='function') traceOrder(parent);
  }
  function decorateClientLinksV115(){
    const view=$('#ordersView');if(!view)return;
    $$('#ordersCardsV106 .v106-admin-card',view).forEach(card=>{
      const h3=card.querySelector('.v106-admin-top h3');if(!h3||h3.dataset.v115ClientLink==='1')return;
      const name=h3.textContent.trim();if(!name)return;
      h3.dataset.v115ClientLink='1';
      const code=orderClientCodeV115(name);
      h3.innerHTML=`<button type="button" class="v115-client-link" onclick="SPPlannerV115.client('${esc(code||name)}')">${code?`<small>${esc(code)}</small>`:''}${esc(name)}</button>`;
    });
  }

  function patchOrderMasterDataV115(){
    const f=$('#orderForm');if(!f||f.dataset.v115Master==='1')return;
    f.dataset.v115Master='1';
    const clientInput=f.elements.client,productInput=f.elements.product;
    if(clientInput&&clientInput.tagName==='INPUT'){
      const sel=document.createElement('select');sel.id='orderClientMasterV115';sel.innerHTML=optionHtmlV115(clientDirectoryV115(),'','','Seleziona cliente');
      clientInput.style.display='none';clientInput.removeAttribute('required');clientInput.parentElement.insertBefore(sel,clientInput);
      const code=document.createElement('input');code.type='hidden';code.name='clientCode';clientInput.parentElement.appendChild(code);
      sel.onchange=()=>{const c=findClientV115(sel.value);clientInput.value=c?.name||'';code.value=c?.code||'';clientInput.dispatchEvent(new Event('change',{bubbles:true}));};
    }
    if(productInput&&productInput.tagName==='INPUT'){
      const sel=document.createElement('select');sel.id='orderProductMasterV115';sel.innerHTML=optionHtmlV115(productDirectoryV115(),'','','Seleziona prodotto');
      productInput.style.display='none';productInput.parentElement.insertBefore(sel,productInput);
      const code=document.createElement('input');code.type='hidden';code.name='productCode';productInput.parentElement.appendChild(code);
      sel.onchange=()=>{const p=findProductV115(sel.value);productInput.value=p?.name||'';code.value=p?.code||'';productInput.dispatchEvent(new Event('change',{bubbles:true}));};
    }
    const oldOpen=window.openNewOrder;
    if(typeof oldOpen==='function'&&!oldOpen.__v115master){
      const wrapped=function(){const r=oldOpen.apply(this,arguments);setTimeout(()=>{
        patchOrderMasterDataV115();
        const ff=$('#orderForm'),cs=$('#orderClientMasterV115'),ps=$('#orderProductMasterV115');
        if(cs){const c=findClientV115(ff.elements.client?.value);cs.value=c?.code||'';if(ff.elements.clientCode)ff.elements.clientCode.value=c?.code||'';}
        if(ps){const p=findProductV115(ff.elements.product?.value);ps.value=p?.code||'';if(ff.elements.productCode)ff.elements.productCode.value=p?.code||'';}
      },0);return r};wrapped.__v115master=true;window.openNewOrder=wrapped;try{openNewOrder=wrapped}catch(_){}
    }
    const oldSubmit=f.onsubmit;
    if(typeof oldSubmit==='function'&&!oldSubmit.__v115master){
      const wrappedSubmit=function(e){
        const clientCode=String(this.elements.clientCode?.value||''),productCode=String(this.elements.productCode?.value||'');
        if(!clientCode){e.preventDefault();alert('Seleziona il cliente dall’anagrafica.');return false}
        if(!productCode&&String(this.elements.product?.value||'').trim()){e.preventDefault();alert('Seleziona il prodotto dall’anagrafica.');return false}
        const parent=String(this.elements.parent?.value||'').trim(),before=(state.orders||[]).filter(o=>String(o.parent)===parent).length;
        const r=oldSubmit.call(this,e);
        setTimeout(()=>{
          const rows=(state.orders||[]).filter(o=>String(o.parent)===parent);
          if(rows.length>before){for(const o of rows){o.clientCode=clientCode;if(productCode&&String(o.code||'').endsWith('A'))o.productCode=productCode}saveNow();}
        },20);
        return r;
      };wrappedSubmit.__v115master=true;f.onsubmit=wrappedSubmit;
    }
  }


  function registerClientCellV115(g,a,director,closed,cancel){
    const current=findClientV115(a.clientCode||a.client);
    const disabled=!(director&&!closed&&!cancel);
    const options=optionHtmlV115(clientDirectoryV115(),current?.code||a.clientCode||'',current?.name||a.client||'','Seleziona cliente');
    const code=current?.code||a.clientCode||'';
    return `<div class="v115-register-master">
      <select class="v115-reg-select" id="reg54Client_${esc(g.parent)}" ${disabled?'disabled':''}>${options}</select>
      ${code?`<button type="button" class="v115-reg-client-open" onclick="SPPlannerV115.client('${esc(code)}')">Apri ${esc(code)} · ${esc(current?.name||a.client||'cliente')}</button>`:'<span class="v115-reg-unmatched">Cliente da associare</span>'}
    </div>`;
  }

  function registerProductCellV115(g,a,director,closed,cancel){
    const current=findProductV115(a.productCode||a.product);
    const disabled=!(director&&!closed&&!cancel);
    const options=optionHtmlV115(productDirectoryV115(),current?.code||a.productCode||'',current?.name||a.product||'','Seleziona prodotto');
    return `<div class="v115-register-master">
      <select class="v115-reg-select v115-reg-product-select" id="reg54Product_${esc(g.parent)}" ${disabled?'disabled':''}>${options}</select>
      ${current?`<span class="v115-reg-code">${esc(current.code)}</span>`:'<span class="v115-reg-unmatched">Prodotto da associare</span>'}
    </div>`;
  }

  function patchOrdersRegisterV115(){
    if(typeof window.renderOrdersRegisterV53!=='function')return;
    const enhanced=function(){
      const all=groupOrders();
      const view=$('#ordersRegisterView');if(!view)return;
      view.innerHTML=`<div class="hero"><div><h2>Registro ordini operativo</h2><p>Cliente e prodotto sono collegati alle anagrafiche ufficiali. Roberto può correggere ordine, riferimenti e consegne mantenendo codici univoci per la tracciabilità.</p></div><div class="hero-actions">${currentRole==='director'?'<button class="btn primary" onclick="openNewOrder()">+ Nuovo ordine</button>':''}<button class="btn" onclick="navTo('reports')">Analisi periodo</button></div></div>
      <div class="register-toolbar-v54">
        <label class="field search">Cerca<input id="regSearchV54" placeholder="Ordine, rif., codice cliente, cliente, prodotto, DDT..."></label>
        <label class="field">Stato<select id="regStatusV54"><option value="all">Tutti</option><option value="open">Aperti</option><option value="closed">Chiusi</option><option value="cancelled">Annullati</option></select></label>
        ${currentRole==='director'?`<button class="btn" id="showDeletedV54">Archivio eliminati (${state.deletedOrders?.length||0})</button>`:''}
      </div>
      <div class="panel"><div class="table-wrap"><table class="data-table register-table-v54"><thead><tr>
        <th>Ordine</th><th>Data ordine</th><th>Rif. ordine</th><th>Cliente</th><th>Q.tà</th><th>Prodotto</th><th>Foglio</th><th>Consegna prevista</th><th>Data consegna</th><th>Materiale/Miscela</th><th>DDT</th><th>Stato</th><th>Azioni</th>
      </tr></thead><tbody id="regBodyV54"></tbody></table></div></div><div class="deleted-archive-v54" id="deletedArchiveV54"></div>`;

      function row(g){
        const a=g.main,s=v54StatusName(g),sh=(state.productionSheets||[]).find(x=>String(x.parent)===String(g.parent)),
          mat=v54MaterialText(g.parent),director=currentRole==='director',admin=currentRole==='admin',
          lockedQty=v54HasProduction(g.parent),cancel=s==='Annullato',closed=s==='Chiuso';
        const clientCell=registerClientCellV115(g,a,director,closed,cancel);
        const productCell=registerProductCellV115(g,a,director,closed,cancel);
        return `<tr class="${closed?'closed-row':cancel?'cancelled-row':''}">
          <td><b>${esc(g.parent)}</b></td>
          <td><input type="date" id="reg54Date_${esc(g.parent)}" value="${esc(v54ISO(v54Date(a.date)))}" ${director?'':'disabled'}></td>
          <td><input id="reg54Ref_${esc(g.parent)}" value="${esc(a.orderRef||'')}" ${director||admin?'':'disabled'}></td>
          <td>${clientCell}</td>
          <td><input class="reg-qty" type="number" min="1" id="reg54Qty_${esc(g.parent)}" value="${Number(a.qty||0)}" ${director&&!closed&&!cancel&&!lockedQty?'':'disabled'}></td>
          <td>${productCell}</td>
          <td>${sh?`<a href="#" onclick="openSheet('${sh.id}');return false">Foglio ${esc(sh.sheetNo)}</a>`:'—'}</td>
          <td><input type="date" id="reg54Due_${esc(g.parent)}" value="${esc(v54ISO(v54Date(a.dueDate)))}" ${closed?'disabled':''}></td>
          <td>${dmy(a.deliveryDate)||'—'}</td>
          <td>${esc(mat||'—')}</td>
          <td>${a.ddtRef?`<span class="ddt-pill">${esc(a.ddtRef)}</span>`:'—'}</td>
          <td><span class="status ${statusClass(s)}">${esc(s)}</span></td>
          <td><div class="card-actions">
            <button class="btn small primary" onclick="v54SaveRegister('${esc(g.parent)}')">Salva</button>
            ${director?`<button class="btn small" onclick="v53OpenEditOrder('${esc(g.parent)}')">Modifica completa</button>${!closed&&!cancel?`<button class="btn small danger" onclick="v53CancelOrder('${esc(g.parent)}')">Annulla</button>`:''}${v54CanDelete(g.parent)?`<button class="btn small danger" onclick="v54OpenDelete('${esc(g.parent)}')">Elimina</button>`:''}`:''}
            ${admin&&!a.ddtRef&&!cancel?`<button class="btn small" onclick="v53OpenDDT('${esc(g.parent)}')">DDT</button>`:''}
          </div></td>
        </tr>`;
      }

      function draw(){
        const q=String($('#regSearchV54')?.value||'').toLowerCase(),f=$('#regStatusV54')?.value||'all';
        const arr=all.filter(g=>{
          const s=v54StatusName(g),client=findClientV115(g.main.clientCode||g.main.client),product=findProductV115(g.main.productCode||g.main.product);
          const okStatus=f==='all'||(f==='open'&&!['Chiuso','Annullato'].includes(s))||(f==='closed'&&s==='Chiuso')||(f==='cancelled'&&s==='Annullato');
          const hay=[g.parent,g.main.orderRef,client?.code,g.main.client,product?.code,g.main.product,g.main.ddtRef].join(' ').toLowerCase();
          return okStatus&&(!q||hay.includes(q));
        });
        $('#regBodyV54').innerHTML=arr.map(row).join('')||'<tr><td colspan="13"><div class="empty"><b>Nessun ordine</b>Nessun risultato per i filtri scelti.</div></td></tr>';
      }

      $('#regSearchV54').oninput=draw;
      $('#regStatusV54').onchange=draw;
      draw();
      if($('#showDeletedV54')&&typeof v54ToggleDeleted==='function')$('#showDeletedV54').onclick=v54ToggleDeleted;
    };
    enhanced.__v115master=true;
    window.renderOrdersRegisterV53=enhanced;
    try{renderOrdersRegisterV53=enhanced}catch(_){}
  }

  function patchRegisterSaveV115(){
    const saveRegister=function(parent){
      if(!['director','admin'].includes(currentRole))return;
      const g=groupOrders().find(x=>String(x.parent)===String(parent));if(!g)return;
      const a=g.main,lines=g.lines,d=$(`#reg54Date_${CSS.escape(String(parent))}`)?.value||'',
        ref=$(`#reg54Ref_${CSS.escape(String(parent))}`)?.value||'',
        due=$(`#reg54Due_${CSS.escape(String(parent))}`)?.value||'';
      if(currentRole==='director'){
        const clientCode=String($(`#reg54Client_${CSS.escape(String(parent))}`)?.value||a.clientCode||'');
        const productCode=String($(`#reg54Product_${CSS.escape(String(parent))}`)?.value||a.productCode||'');
        const client=findClientV115(clientCode),product=findProductV115(productCode),
          qty=Number($(`#reg54Qty_${CSS.escape(String(parent))}`)?.value||a.qty);
        if(!client){alert('Seleziona il cliente dall’anagrafica prima di salvare.');return}
        if(!product){alert('Seleziona il prodotto dall’anagrafica prima di salvare.');return}
        if(!qty){alert('La quantità è obbligatoria.');return}
        if(qty!==Number(a.qty||0)&&v54HasProduction(parent)){
          alert('La quantità non può essere modificata perché esistono già dati di produzione. Puoi correggere gli altri campi.');return;
        }
        if(qty!==Number(a.qty||0)&&a.imlCode&&!v54Cancelled(g)){
          const iml=getIML(a.imlCode);if(iml)iml.reserved=Math.max(0,Number(iml.reserved||0)+(qty-Number(a.qty||0)));
        }
        for(const o of lines){
          o.client=client.name;o.clientCode=client.code;
          if(d)o.date=d;o.orderRef=ref.trim();o.dueDate=due;o.qty=qty;
          if(!v54HasProduction(parent))o.remaining=qty;
        }
        a.product=product.name;a.productCode=product.code;
        if(Array.isArray(state.clients)&&!state.clients.includes(client.name))state.clients.push(client.name);
        for(const j of state.productionRuns||[]){
          if(String(j.parent)===String(parent)){
            j.client=client.name;j.clientCode=client.code;
            if(!v54HasProduction(parent))j.qty=Number((state.orders.find(o=>o.code===j.orderCode)||a).qty||qty);
            if(String(j.orderCode).endsWith('A')){j.product=product.name;j.productCode=product.code}
          }
        }
      }else{
        for(const o of lines){o.orderRef=ref.trim();o.dueDate=due}
      }
      addAudit('Registro ordine modificato',parent,`${currentRole} · rif ${ref||'—'} · consegna ${due||'—'}`);
      save();renderCurrent();toast(`Ordine ${parent} aggiornato`);
    };
    window.v54SaveRegister=saveRegister;
    try{v54SaveRegister=saveRegister}catch(_){}
  }



  function dashboardCountsV115(){
    const groups=typeof groupOrders==='function'?groupOrders():[];
    const statusOf=g=>{
      try{
        if(typeof v54StatusName==='function')return String(v54StatusName(g)||'');
        if(typeof normalizeOrderStatus==='function')return String(normalizeOrderStatus(g.status||g.main?.status)||'');
      }catch(_){}
      return String(g.main?.status||g.status||'');
    };
    const open=groups.filter(g=>!['Chiuso','Annullato','Completato','Completata','Soddisfatta'].includes(statusOf(g))).length;
    const toPrep=groups.filter(g=>/da preparare/i.test(statusOf(g))).length;
    const imls=Array.isArray(state?.imls)?state.imls:[];
    const critical=imls.filter(i=>{
      if(!i)return false;
      try{return typeof available==='function'?available(i)<=Number(i.minStock||0):Number(i.physical||0)-Number(i.reserved||0)<=Number(i.minStock||0)}
      catch(_){return false}
    }).length;
    const poOpen=(Array.isArray(state?.imlPurchaseOrders)?state.imlPurchaseOrders:[]).filter(x=>x&&!['Ricevuto','Chiuso','Annullato'].includes(String(x.status||''))).length;
    const emailDrafts=(Array.isArray(state?.emailOrderDraftsV115)?state.emailOrderDraftsV115:[]).filter(d=>
      (!d.companyCode||d.companyCode==='smartpack') &&
      !['Convertita','Scartata','Eliminata'].includes(String(d.status||''))
    ).length;
    const urgent=groups.filter(g=>{
      const p=String(g.main?.priority||g.priority||'');
      return !['Chiuso','Annullato','Completato','Completata','Soddisfatta'].includes(statusOf(g)) && /urgent/i.test(p);
    }).length;
    return {groups,open,toPrep,critical,poOpen,emailDrafts,urgent};
  }

  function dashboardCardV115({kind,label,value,desc,icon,attention=false}){
    return `<button type="button" class="v115-dash-card ${attention?'attention':''}" onclick="SPPlannerV115.dashboardGo('${esc(kind)}')">
      <div class="v115-dash-card-top">
        <span class="v115-dash-icon">${icon}</span>
        <span class="v115-dash-open">Apri →</span>
      </div>
      <span class="v115-dash-label">${esc(label)}</span>
      <b class="v115-dash-value">${fmt(value)}</b>
      <small>${esc(desc)}</small>
    </button>`;
  }

  function dashboardGoV115(kind){
    const later=fn=>setTimeout(fn,60);
    if(kind==='open'){
      navTo('ordersRegister');
      later(()=>{
        const s=$('#regStatusV54');
        if(s){s.value='open';s.dispatchEvent(new Event('change',{bubbles:true}))}
        $('#ordersRegisterView')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
      return;
    }
    if(kind==='prep'){
      navTo('production');
      later(()=>$('#productionView')?.scrollIntoView({behavior:'smooth',block:'start'}));
      return;
    }
    if(kind==='iml'){
      navTo('iml');
      later(()=>{
        const body=$('#imlBody');
        if(body){
          $$('#imlBody tr').forEach(r=>{
            const t=(r.textContent||'').toLowerCase();
            r.style.display=(t.includes('critico')||t.includes('esaurito'))?'':'none';
          });
          const view=$('#imlView');
          if(view&&!$('#v115CriticalFilterNote')){
            view.insertAdjacentHTML('afterbegin',`<div id="v115CriticalFilterNote" class="v115-filter-note"><b>Filtro attivo:</b> solo IML critici o esauriti. <button type="button" onclick="navTo('iml')">Mostra tutti</button></div>`);
          }
        }
      });
      return;
    }
    if(kind==='imlOrders'){
      navTo('imlOrders');
      later(()=>{
        const body=$('#imlOrdersView tbody');
        if(body){
          [...body.querySelectorAll('tr')].forEach(r=>{
            const t=(r.textContent||'').toLowerCase();
            r.style.display=(t.includes('chiuso')||t.includes('annullato'))?'none':'';
          });
          const view=$('#imlOrdersView');
          if(view&&!$('#v115IMLOpenFilterNote')){
            view.insertAdjacentHTML('afterbegin',`<div id="v115IMLOpenFilterNote" class="v115-filter-note"><b>Filtro attivo:</b> solo ordini IML aperti. <button type="button" onclick="navTo('imlOrders')">Mostra tutti</button></div>`);
          }
        }
      });
      return;
    }
    if(kind==='email'){
      navTo('orders');
      later(()=>{
        const p=$('#v115OrdersEmailPanel');
        if(p){p.classList.add('v115-email-highlight');p.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>p.classList.remove('v115-email-highlight'),1800)}
      });
      return;
    }
  }

  function renderDashboardV115(){
    if(typeof currentRole==='undefined'||currentRole!=='director'){
      try{return window.__v115OriginalDashboard?.apply(this,arguments)}catch(_){return}
    }
    ensureState();
    const d=dashboardCountsV115();
    const totalAttention=d.toPrep+d.critical+d.poOpen+d.emailDrafts;
    const view=$('#dashboardView');if(!view)return;
    view.classList.add('v115-dashboard');
    view.innerHTML=`
      <div class="role-banner v115-role-banner">
        <div class="role-icon">R</div>
        <div><b>Modalità Direzione</b><span>Roberto registra ordini, organizza la produzione e controlla IML, priorità e avanzamento.</span></div>
        <div class="right"><strong>${totalAttention}</strong> attività operative da controllare</div>
      </div>

      <div class="hero v115-dashboard-hero">
        <div>
          <span class="v115-eyebrow">SMART PACK · CENTRO OPERATIVO</span>
          <h2>Situazione operativa in tempo reale</h2>
          <p>Ogni indicatore è cliccabile: apre direttamente la schermata collegata già pronta per il controllo.</p>
        </div>
        <div class="hero-actions">
          <button class="btn primary" onclick="openNewOrder()">+ Nuovo ordine cliente</button>
          <button class="btn" onclick="SPPlannerV115.dashboardGo('email')">Ordini da e-mail</button>
          <button class="btn" onclick="openNewIMLOrder()">+ Ordine IML</button>
          <button class="btn" onclick="openFinishedGoodsV103()">Magazzino interno</button>
        </div>
      </div>

      <div class="section">
        <div class="v115-dash-grid">
          ${dashboardCardV115({kind:'open',label:'Ordini aperti',value:d.open,desc:'Ordini cliente ancora da completare',icon:'▤',attention:d.open>0})}
          ${dashboardCardV115({kind:'prep',label:'Da preparare',value:d.toPrep,desc:'Richiedono attività del reparto',icon:'⚙',attention:d.toPrep>0})}
          ${dashboardCardV115({kind:'email',label:'Ordini da e-mail da inserire',value:d.emailDrafts,desc:'Bozze Gmail da verificare e approvare',icon:'✉',attention:d.emailDrafts>0})}
          ${dashboardCardV115({kind:'iml',label:'IML critici',value:d.critical,desc:'Sotto il livello minimo o esauriti',icon:'▧',attention:d.critical>0})}
          ${dashboardCardV115({kind:'imlOrders',label:'Ordini IML aperti',value:d.poOpen,desc:'Da inviare, ricevere o chiudere',icon:'↗',attention:d.poOpen>0})}
        </div>
      </div>

      <div class="section v115-dash-secondary">
        <div class="panel">
          <div class="panel-head">
            <div><h3>Azioni rapide</h3><p>Le attività più frequenti, con accesso diretto.</p></div>
          </div>
          <div class="panel-body">
            <div class="quick-grid v115-quick-grid">
              <button class="quick" onclick="SPPlannerV115.dashboardGo('open')"><div class="bubble">1</div><b>Controlla ordini aperti</b><span>Vai al Registro già filtrato sugli ordini ancora aperti.</span><em>→</em></button>
              <button class="quick" onclick="SPPlannerV115.dashboardGo('email')"><div class="bubble">2</div><b>Verifica ordini da Gmail</b><span>Controlla le bozze ricevute e approva solo gli ordini corretti.</span><em>→</em></button>
              <button class="quick" onclick="navTo('planner')"><div class="bubble">3</div><b>Organizza la coda Roberto</b><span>Rivedi priorità, stampi, urgenze e suggerimenti di pianificazione.</span><em>→</em></button>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div><h3>Attenzione oggi</h3><p>Gli indicatori che meritano un controllo immediato.</p></div>
          </div>
          <div class="panel-body">
            <div class="v115-attention-list">
              <button onclick="SPPlannerV115.dashboardGo('email')" class="${d.emailDrafts?'hot':''}"><span>Ordini e-mail da verificare</span><b>${d.emailDrafts}</b></button>
              <button onclick="SPPlannerV115.dashboardGo('iml')" class="${d.critical?'hot':''}"><span>IML critici</span><b>${d.critical}</b></button>
              <button onclick="SPPlannerV115.dashboardGo('prep')" class="${d.toPrep?'hot':''}"><span>Ordini da preparare</span><b>${d.toPrep}</b></button>
              <button onclick="SPPlannerV115.dashboardGo('imlOrders')" class="${d.poOpen?'hot':''}"><span>Ordini IML aperti</span><b>${d.poOpen}</b></button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function patchDashboardV115(){
    try{
      const original=window.renderDashboard||renderDashboard;
      if(typeof original!=='function')return;
      if(!window.__v115OriginalDashboard)window.__v115OriginalDashboard=original;
      window.renderDashboard=renderDashboardV115;
      try{renderDashboard=renderDashboardV115}catch(_){}
    }catch(e){console.warn('[V11.5] dashboard patch',e)}
  }


  function parseEmailText(text,subject=''){
    const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const find=(re)=>{const l=lines.find(x=>re.test(x));return l?l.replace(re,'').replace(/^\s*[:\-]\s*/,'').trim():''};
    const client=find(/^(cliente|customer)\b\s*[:\-]?/i);
    const product=find(/^(prodotto|articolo|descrizione|product|item)\b\s*[:\-]?/i);
    const ref=find(/^(ordine|order|rif\.?\s*ordine|po)\b\s*[:#\-]?/i);
    const qtyLine=find(/^(quantit[aà]|q\.t[aà]|qty|quantity)\b\s*[:\-]?/i)||String(text||'').match(/\b([\d.]+(?:,\d+)?)\s*(?:pz|pezzi|pcs)\b/i)?.[1]||'';
    const qty=n(String(qtyLine).replace(/\./g,'').replace(',','.'));
    const dateRaw=find(/^(consegna|data\s*consegna|delivery|due\s*date)\b\s*[:\-]?/i)||String(text||'').match(/\b(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/)?.[1]||'';
    let due='';if(/^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)){const [d,m,y]=dateRaw.split('/');due=`${y}-${m}-${d}`}else if(/^\d{4}-\d{2}-\d{2}$/.test(dateRaw))due=dateRaw;
    const liters=(String(product)+' '+String(text)).match(/\b(3(?:[,.]7)?|5|14|18)\s*L(?:T)?\b/i)?.[1]?.replace(',','.')||'';
    const litersNorm=liters.startsWith('3')?'3LT':liters?`${liters}LT`:'';
    return {client,product,orderRef:ref,qty:qty||0,dueDate:due,liters:litersNorm,subject:String(subject||''),sourceText:String(text||''),priority:/urgent|urgente/i.test(subject+' '+text)?'Urgente':'Normale'};
  }
  function openImportEmail(){const f=$('#v115EmailImportForm');f.reset();$('#v115EmailImportDialog').showModal()}
  function submitEmailImport(e){e.preventDefault();const f=e.currentTarget,parsed=parseEmailText(f.elements.body.value,f.elements.subject.value);const d={id:uid('mail'),companyCode:'smartpack',receivedAt:iso(),status:'Da verificare',from:f.elements.from.value.trim(),...parsed};state.emailOrderDraftsV115.unshift(d);audit('E-mail ordine importata',d.orderRef||d.id,d.subject||d.from);saveNow('Bozza e-mail creata');$('#v115EmailImportDialog').close();if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();decorateOrdersEmail();editEmail(d.id)}
  function editEmail(id){
    const d=state.emailOrderDraftsV115.find(x=>x.id===id);if(!d)return;
    emailDraftEditing=id;const f=$('#v115EmailDraftForm');
    fillEmailMasterDataV115(d);
    ['orderRef','qty','dueDate','liters','priority'].forEach(k=>{if(f.elements[k])f.elements[k].value=d[k]||''});
    $('#v115EmailDraftSource').textContent=d.sourceText||'';
    $('#v115EmailDraftDialog').showModal();
  }
  function saveEmailDraft(e){
    e.preventDefault();const d=state.emailOrderDraftsV115.find(x=>x.id===emailDraftEditing);if(!d)return;
    const f=e.currentTarget,clientCode=String(f.elements.clientCode?.value||''),productCode=String(f.elements.productCode?.value||'');
    if(!clientCode){alert('Seleziona il cliente dall’anagrafica. Per un nuovo cliente, censiscilo prima e poi selezionalo.');return}
    if(!productCode){alert('Seleziona il prodotto dall’anagrafica.');return}
    const client=findClientV115(clientCode),product=findProductV115(productCode);
    if(!client||!product){alert('Cliente o prodotto non valido. Riapri la verifica.');return}
    d.clientCode=client.code;d.client=client.name;d.productCode=product.code;d.product=product.name;
    ['orderRef','dueDate','liters','priority'].forEach(k=>d[k]=f.elements[k].value);
    d.qty=Math.max(0,n(f.elements.qty.value));d.status='Verificata';d.verifiedAt=iso();d.newClient=false;
    saveNow('Bozza verificata');$('#v115EmailDraftDialog').close();emailDraftEditing='';
    if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();decorateOrdersEmail();
  }
  function cancelEmailEdit(){emailDraftEditing='';$('#v115EmailDraftDialog')?.close()}
  function discardEmailDraft(id){
    const d=state.emailOrderDraftsV115.find(x=>x.id===id);if(!d)return;
    const label=[d.client,d.subject,d.orderRef].filter(Boolean).join(' · ')||'questa bozza';
    if(!confirm(`Scartare definitivamente ${label}?\n\nLa bozza verrà rimossa dalla coda Ordini e non verrà trasformata in ordine.`))return;
    state.emailOrderDraftsV115=state.emailOrderDraftsV115.filter(x=>x.id!==id);
    audit('Bozza ordine e-mail scartata',d.orderRef||d.id,d.subject||d.from||d.client||'');
    if(emailDraftEditing===id){emailDraftEditing='';$('#v115EmailDraftDialog')?.close()}
    saveNow('Bozza e-mail scartata');
    if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();
    decorateOrdersEmail();
  }
  function toOrder(id){
    const d=state.emailOrderDraftsV115.find(x=>x.id===id);if(!d)return;
    if(d.status!=='Verificata'){alert('Prima controlla la bozza e premi “Salva verifica”. L’ordine viene creato solo dopo la vostra approvazione.');editEmail(id);return}
    if(!d.clientCode||!d.productCode||!d.client||!d.product||!d.qty){alert('Prima seleziona cliente e prodotto dalle anagrafiche e salva la verifica.');editEmail(id);return}
    if(!confirm(`Confermi la creazione dell’ordine${d.orderRef?' '+d.orderRef:''} per ${d.client}?`))return;
    if(typeof openNewOrder!=='function'){alert('Modulo nuovo ordine non disponibile.');return}openNewOrder();setTimeout(()=>{const f=$('#orderForm');if(!f)return;f.elements.client.value=d.client;f.elements.product.value=d.product;if(f.elements.clientCode)f.elements.clientCode.value=d.clientCode||'';if(f.elements.productCode)f.elements.productCode.value=d.productCode||'';const cs=$('#orderClientMasterV115'),ps=$('#orderProductMasterV115');if(cs)cs.value=d.clientCode||'';if(ps)ps.value=d.productCode||'';f.elements.orderRef.value=d.orderRef||'';f.elements.qty.value=d.qty;f.elements.dueDate.value=d.dueDate||'';if(d.liters)f.elements.liters.value=d.liters;f.elements.priority.value=d.priority||'Normale';f.elements.notes.value=`Ordine importato da e-mail · Cliente ${d.clientCode||''} · Prodotto ${d.productCode||''}${d.from?' · '+d.from:''}${d.subject?' · '+d.subject:''}`;d.status='Convertita';d.convertedAt=iso();saveNow('Ordine approvato: dati trasferiti nel modulo');decorateOrdersEmail();if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner()},80)
  }
  function emailSetup(){
    $('#v115EmailSetupDialog').showModal();
    loadGmailStatus(false).then(updateGmailDialog);
  }

  function injectStyles(){if($('#v115Styles'))return;const s=document.createElement('style');s.id='v115Styles';s.textContent=`
    #plannerView{--v115:#17394a;--v115soft:#f2f8fa}.v115-hero{display:flex;gap:18px;align-items:center;background:linear-gradient(135deg,#fff,#f3faf8);border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:var(--shadow)}.v115-hero h2{font-size:25px;margin:2px 0 6px}.v115-hero p{font-size:11px;color:var(--muted);line-height:1.55;margin:0;max-width:760px}.v115-eyebrow,.v115-section-head>div>span,.v115-machine-head>div>span,.v115-over{font-size:8px;font-weight:900;letter-spacing:.11em;color:var(--primary);text-transform:uppercase}.v115-hero-actions{margin-left:auto;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.v115-rules{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.v115-rules span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:8px;font-weight:850;color:#4e6671}.v115-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.v115-kpis>div{background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px}.v115-kpis span,.v115-kpis small{display:block;font-size:8px;color:var(--muted)}.v115-kpis b{display:block;font-size:22px;margin:4px 0}.v115-status{display:flex;gap:12px;align-items:center;margin:12px 0;border-radius:13px;padding:10px 12px;font-size:9px}.v115-status b{font-size:10px}.v115-status span{color:#5f737d}.v115-status.ok{background:#edf9f4;border:1px solid #c9e8da}.v115-status.warn{background:#fff8ea;border:1px solid #efd9ad}.v115-machines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.v115-machine{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;min-width:0}.v115-machine-head{display:flex;gap:10px;align-items:flex-start}.v115-machine-head h3{font-size:17px;margin:3px 0}.v115-machine-head p{font-size:9px;color:var(--muted);margin:0}.v115-machine-summary{margin-left:auto;text-align:center;background:var(--soft);border-radius:12px;padding:7px 10px;min-width:62px}.v115-machine-summary b{display:block;font-size:17px}.v115-machine-summary span{font-size:7px;color:var(--muted)}.v115-advice{display:flex;gap:10px;align-items:flex-start;margin:11px 0;border:1px solid #bcded3;background:#f3fbf7;border-radius:13px;padding:11px}.v115-advice>div{flex:1}.v115-advice span{font-size:7px;font-weight:900;color:#26715c;letter-spacing:.08em}.v115-advice b{display:block;font-size:10px;margin-top:3px}.v115-advice p{font-size:8px;color:#4e6f64;line-height:1.45;margin:4px 0 0}.v115-score{font-size:12px!important;background:#fff;border-radius:10px;padding:7px!important;color:#26715c!important}.v115-warning{border:1px solid #efd6a4;background:#fff8e9;border-radius:11px;padding:9px 10px;font-size:8px;color:#735a2d;margin-bottom:9px}.v115-queue{display:grid;gap:8px;min-height:40px}.v115-run{display:grid;grid-template-columns:24px 1fr;gap:8px;border:1px solid #d9e5e9;border-radius:14px;padding:10px;background:#fff;transition:.16s}.v115-run:hover{border-color:#a8c8d3}.v115-run.dragging{opacity:.45}.v115-run.over{border-color:var(--primary);box-shadow:0 0 0 2px rgba(31,94,120,.10)}.v115-grip{display:flex;align-items:center;justify-content:center;color:#91a5ae;cursor:grab;font-weight:900}.v115-run-top{display:flex;gap:8px;align-items:flex-start}.v115-run-top>div:first-child{flex:1}.v115-run h4{font-size:10px;margin:3px 0 0}.v115-badges{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.v115-chip{display:inline-flex;padding:4px 6px;border-radius:999px;background:#edf2f4;color:#5f727c;font-size:6.8px;font-weight:950;white-space:nowrap}.v115-chip.urgent{background:#fdebec;color:#9b3e44}.v115-chip.lid{background:#fff2dc;color:#8a5b17}.v115-chip.change{background:#fff6e8;color:#925e13}.v115-chip.ok{background:#eaf7f1;color:#1d7258}.v115-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:8px}.v115-metrics div{background:#f7fafb;border-radius:8px;padding:6px}.v115-metrics span{display:block;font-size:6.5px;color:var(--muted);text-transform:uppercase}.v115-metrics b{display:block;font-size:8.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.v115-reason{font-size:7.8px;line-height:1.45;color:#526a75;margin-top:7px}.v115-run-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.v115-run-actions .btn{font-size:7px!important;min-height:27px!important;padding:5px 7px!important}.v115-empty{padding:20px;text-align:center;color:var(--muted);font-size:9px}.v115-email{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px}.v115-section-head{display:flex;gap:10px;align-items:flex-start}.v115-section-head>div:first-child{flex:1}.v115-section-head h3{font-size:16px;margin:3px 0}.v115-section-head p{font-size:9px;color:var(--muted);margin:0;line-height:1.5}.v115-section-head>div:last-child{display:flex;gap:6px}.v115-email-state{margin:11px 0;background:#f5f9fa;border-radius:11px;padding:9px 10px}.v115-email-state b{display:block;font-size:9px}.v115-email-state span{display:block;font-size:8px;color:var(--muted);margin-top:3px}.v115-email-list{display:grid;gap:7px}.v115-email-draft{display:flex;align-items:center;gap:10px;border-top:1px solid #edf2f3;padding:9px 0}.v115-email-draft>div:first-child{flex:1}.v115-email-draft span{font-size:7px;color:var(--primary);font-weight:900}.v115-email-draft b{display:block;font-size:9px;margin-top:2px}.v115-email-draft p{font-size:8px;color:var(--muted);margin:3px 0}.v115-menu-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2f3}.v115-menu-row label{font-size:10px}.v115-menu-row>div{display:flex;gap:4px}.v115-source{white-space:pre-wrap;background:#f5f8f9;border:1px solid var(--line);border-radius:10px;padding:10px;max-height:160px;overflow:auto;font:9px/1.45 ui-monospace,monospace}.v115-oauth{display:grid;gap:8px}.v115-oauth>div{border:1px solid var(--line);border-radius:12px;padding:11px}.v115-oauth b{font-size:10px}.v115-oauth p{font-size:8px;color:var(--muted);line-height:1.5;margin:4px 0 0}
    .v115-orders-email{margin:12px 0 16px;background:linear-gradient(135deg,#ffffff,#f5fafb);border:1px solid #cfe0e6;border-radius:18px;padding:15px;box-shadow:0 8px 24px rgba(23,57,74,.05)}.v115-orders-email .v115-orders-email-top{display:flex;gap:12px;align-items:flex-start}.v115-orders-email .v115-orders-email-top>div:first-child{flex:1}.v115-orders-email h3{font-size:16px;margin:3px 0}.v115-orders-email p{font-size:9px;color:var(--muted);line-height:1.5;margin:0}.v115-orders-email-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.v115-orders-email .v115-email-state{margin:10px 0}.v115-waiting-ok{display:inline-flex;align-items:center;padding:6px 8px;border-radius:999px;background:#fff3df;color:#8a5b17;font-size:7px;font-weight:900}.v115-email-summary{margin-top:14px}.v115-orders-email-count{display:inline-flex;margin-top:8px;padding:5px 8px;border-radius:999px;background:#e8f5ef;color:#176b57;font-size:8px;font-weight:900}.btn.danger{border-color:#e5b9bd!important;background:#fff5f5!important;color:#a13d46!important}.btn.danger:hover{background:#fdebec!important}.v115-client-link,.v115-inline-client{border:0;background:transparent;padding:0;color:var(--ink);font:inherit;font-weight:900;cursor:pointer;text-align:left}.v115-client-link:hover,.v115-inline-client:hover{color:var(--primary);text-decoration:underline}.v115-client-link small{display:inline-flex;margin-right:7px;padding:3px 6px;border-radius:999px;background:#eaf4f7;color:var(--primary);font-size:9px}.v115-master-warning{display:block;color:#9a5a16;background:#fff8e8;border:1px solid #efdcb6;border-radius:8px;padding:7px 8px;font-size:8px;line-height:1.4}.v115-client-kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.v115-client-kpis>div{background:#f5f9fa;border:1px solid var(--line);border-radius:12px;padding:12px}.v115-client-kpis span{display:block;font-size:8px;color:var(--muted)}.v115-client-kpis b{display:block;font-size:22px;margin-top:4px}.v115-client-section{margin-top:14px}.v115-client-section h4{font-size:12px;margin:0 0 8px}.v115-client-order{display:flex;align-items:center;gap:10px;border:1px solid #dbe7eb;border-radius:12px;padding:10px;margin-bottom:7px;background:#fff}.v115-client-order.pending{border-left:4px solid #d8a13b}.v115-client-order.closed{opacity:.78}.v115-client-order>div:first-child{flex:1}.v115-client-order span{font-size:7px;color:var(--muted);font-weight:900}.v115-client-order b{display:block;font-size:10px;margin-top:2px}.v115-client-order p{font-size:8px;color:var(--muted);margin:3px 0 0}.v115-client-order>div:last-child{display:flex;gap:7px;align-items:center}.v115-client-state{padding:5px 7px;border-radius:999px;background:#fff2d8;color:#8a5b17!important}.v115-client-order.closed .v115-client-state{background:#eaf7f1;color:#26715c!important}
    .v115-master-row{display:flex!important;align-items:center;gap:7px;flex-wrap:wrap}.v115-master-code{display:inline-flex!important;padding:3px 6px;border-radius:999px;background:#e8f4f7;color:#17617e!important;font-size:7px!important;font-weight:950!important;letter-spacing:.03em}.v115-master-sep{color:#9babb2!important}.v115-product-master{font-size:9px!important;color:var(--ink)!important;font-weight:900!important}.v115-unmatched{display:inline-flex!important;padding:4px 7px;border-radius:999px;background:#fff2dc;color:#8a5b17!important;font-size:7px!important;font-weight:950!important}.v115-mail-suggestion{margin-top:5px;font-size:7.5px;color:#788c95;font-style:italic}.v115-inline-client .v115-master-code{margin-right:4px}.v115-register-master{display:grid;gap:5px;min-width:190px}.v115-reg-select{width:100%;min-width:190px;border:1px solid #cfdee3;background:#fff;border-radius:9px;padding:8px 9px;font-size:9px;color:var(--ink)}.v115-reg-product-select{min-width:240px}.v115-reg-client-open{border:0;background:transparent;color:var(--primary);padding:0;text-align:left;font-size:7.5px;font-weight:900;cursor:pointer}.v115-reg-client-open:hover{text-decoration:underline}.v115-reg-code{font-size:7px;color:var(--muted);font-weight:850}.v115-reg-unmatched{font-size:7px;color:#9a641c;background:#fff4df;border-radius:999px;padding:4px 6px;justify-self:start}
.v115-dashboard .v115-role-banner{padding:16px 18px!important}
.v115-dashboard .v115-role-banner b{font-size:14px!important}
.v115-dashboard .v115-role-banner span{font-size:11px!important;line-height:1.45!important}
.v115-dashboard .v115-role-banner .right{font-size:11px!important}
.v115-dashboard .v115-role-banner .right strong{font-size:18px;color:var(--primary);margin-right:4px}
.v115-dashboard-hero{align-items:flex-start!important}
.v115-dashboard-hero h2{font-size:29px!important;line-height:1.15!important;margin-top:4px!important}
.v115-dashboard-hero p{font-size:13px!important;line-height:1.55!important;max-width:760px!important}
.v115-dashboard-hero .btn{font-size:11px!important;min-height:44px!important;padding:11px 15px!important}
.v115-dash-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.v115-dash-card{appearance:none;border:1px solid #d8e5e9;background:#fff;border-radius:18px;padding:17px 18px;text-align:left;min-height:166px;box-shadow:0 7px 20px rgba(22,58,72,.05);transition:.18s;position:relative;color:var(--ink)}
.v115-dash-card:hover{transform:translateY(-2px);border-color:#8db7c7;box-shadow:0 14px 28px rgba(22,58,72,.10)}
.v115-dash-card.attention{border-top:4px solid var(--primary);padding-top:14px}
.v115-dash-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.v115-dash-icon{width:38px;height:38px;border-radius:12px;background:#edf6f8;color:var(--primary);display:grid;place-items:center;font-size:18px;font-weight:900}
.v115-dash-open{font-size:10px;font-weight:900;color:var(--primary)}
.v115-dash-label{display:block;font-size:13px;font-weight:850;line-height:1.3;color:#536b76}
.v115-dash-value{display:block;font-size:38px;line-height:1;margin:9px 0 8px;letter-spacing:-.03em}
.v115-dash-card small{display:block;font-size:10.5px;line-height:1.45;color:#6c8089}
.v115-dash-secondary{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}
.v115-dashboard .panel-head h3{font-size:15px!important}
.v115-dashboard .panel-head p{font-size:10.5px!important}
.v115-dashboard .quick b{font-size:13px!important}
.v115-dashboard .quick span{font-size:10.5px!important;line-height:1.5!important}
.v115-dashboard .quick{min-height:138px!important}
.v115-attention-list{display:grid;gap:8px}
.v115-attention-list button{width:100%;border:1px solid #dce6e9;background:#f8fbfc;border-radius:12px;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;text-align:left;color:var(--ink)}
.v115-attention-list button span{font-size:11px;font-weight:800}
.v115-attention-list button b{font-size:19px}
.v115-attention-list button.hot{background:#fff8ea;border-color:#ecd6a9}
.v115-attention-list button.hot b{color:#9a641c}
.v115-filter-note{margin-bottom:12px;border:1px solid #b9d8e2;background:#f2fafc;border-radius:12px;padding:10px 12px;font-size:10px;color:#49636e}
.v115-filter-note button{border:0;background:transparent;color:var(--primary);font-weight:900;cursor:pointer;margin-left:7px}
.v115-email-highlight{outline:3px solid rgba(31,94,120,.20);box-shadow:0 0 0 7px rgba(31,94,120,.06)!important}
@media(max-width:1280px){.v115-dash-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:900px){.v115-dash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v115-dash-secondary{grid-template-columns:1fr}.v115-dashboard-hero h2{font-size:25px!important}}
@media(max-width:560px){.v115-dash-grid{grid-template-columns:1fr}.v115-dash-card{min-height:145px}.v115-dash-value{font-size:34px}.v115-dashboard-hero p{font-size:12px!important}}

/* V11.5 · leggibilità inbox Gmail / ordini da e-mail */
#v115OrdersEmailPanel{font-size:13px!important}
#v115OrdersEmailPanel .v115-orders-email-head h3{font-size:19px!important;line-height:1.2!important}
#v115OrdersEmailPanel .v115-orders-email-head p{font-size:12px!important;line-height:1.5!important;max-width:900px!important}
#v115OrdersEmailPanel .v115-orders-email-count{font-size:11px!important;padding:7px 11px!important}
#v115OrdersEmailPanel .v115-gmail-state b{font-size:12px!important}
#v115OrdersEmailPanel .v115-gmail-state span{font-size:10.5px!important;line-height:1.45!important}
#v115OrdersEmailPanel .btn{font-size:12px!important;min-height:42px!important;padding:10px 14px!important}

.v115-email-draft{padding:16px 0!important;min-height:104px!important;align-items:center!important}
.v115-email-draft>div:first-child{min-width:0!important}
.v115-email-draft>div:first-child>span{font-size:10.5px!important;font-weight:900!important;letter-spacing:.01em!important}
.v115-email-draft b.v115-master-row{font-size:14px!important;line-height:1.35!important;margin-top:6px!important}
.v115-email-draft .v115-inline-client{font-size:14px!important;line-height:1.35!important}
.v115-email-draft .v115-product-master{font-size:14px!important;line-height:1.35!important}
.v115-email-draft .v115-master-code{font-size:9.5px!important;padding:4px 7px!important}
.v115-email-draft .v115-unmatched{font-size:10.5px!important;padding:6px 9px!important}
.v115-email-draft .v115-mail-suggestion{font-size:10.5px!important;line-height:1.45!important;margin-top:7px!important;color:#647985!important}
.v115-email-draft p{font-size:11.5px!important;line-height:1.45!important;margin-top:5px!important;color:#4f6570!important}
.v115-email-draft>div:last-child{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important;justify-content:flex-end!important}
.v115-email-draft .btn.small{font-size:12px!important;min-height:42px!important;padding:9px 14px!important;border-radius:12px!important}
.v115-email-draft .v115-waiting-ok{font-size:10px!important;padding:6px 9px!important}
.v115-master-sep{font-size:14px!important}
.v115-orders-email-list{margin-top:10px!important}

/* Dialog verifica ordine email */
#v115EmailDraftDialog .modal-head h3{font-size:24px!important}
#v115EmailDraftDialog .modal-head p{font-size:13px!important}
#v115EmailDraftDialog .field{font-size:12px!important}
#v115EmailDraftDialog .field input,
#v115EmailDraftDialog .field select{font-size:14px!important;min-height:48px!important}
#v115EmailDraftDialog #v115EmailDraftSource{font-size:11.5px!important;line-height:1.55!important}
#v115EmailDraftDialog .modal-actions .btn{font-size:13px!important;min-height:44px!important;padding:10px 16px!important}

@media(max-width:900px){
  .v115-email-draft{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
  .v115-email-draft>div:last-child{justify-content:flex-start!important}
  .v115-email-draft b.v115-master-row{font-size:13px!important}
  #v115OrdersEmailPanel .v115-orders-email-head h3{font-size:18px!important}
}
@media(max-width:1050px){.v115-kpis{grid-template-columns:repeat(3,1fr)}.v115-machines{grid-template-columns:1fr}}
    @media(max-width:760px){.v115-hero{display:block}.v115-hero-actions{margin-top:12px;justify-content:flex-start}.v115-hero-actions .btn{flex:1}.v115-kpis{grid-template-columns:1fr 1fr}.v115-metrics{grid-template-columns:1fr 1fr}.v115-section-head{display:block}.v115-section-head>div:last-child{margin-top:10px;display:grid;grid-template-columns:1fr 1fr}.v115-email-draft{display:block}.v115-email-draft>div:last-child{margin-top:8px}.v115-run{grid-template-columns:18px 1fr}.v115-run-top{display:block}.v115-badges{justify-content:flex-start;margin-top:5px}.v115-status{display:block}.v115-status span{display:block;margin-top:3px}}
  `;document.head.appendChild(s)}

  function ensureView(){let v=$('#plannerView');if(v)return v;v=document.createElement('section');v.className='view';v.id='plannerView';const content=$('.content');content?.appendChild(v);return v}
  function ensureDialogs(){
    if(!$('#v115MenuDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115MenuDialog"><div class="modal-head"><div><span class="eyebrow">Direzione</span><h3>Personalizza menu</h3><p>Scegli ordine e visibilità delle voci nel menu laterale.</p></div><button type="button" class="close" onclick="document.getElementById('v115MenuDialog').close()">×</button></div><div class="modal-body" id="v115MenuBody"></div><div class="modal-actions"><button class="btn" onclick="document.getElementById('v115MenuDialog').close()">Annulla</button><button class="btn primary" onclick="SPPlannerV115.saveMenu()">Salva menu</button></div></dialog>`);
    if(!$('#v115RulesDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115RulesDialog"><form id="v115RulesForm"><div class="modal-head"><div><span class="eyebrow">Regole operative</span><h3>Pianificazione produzione</h3><p>Queste regole guidano i consigli. Roberto può sempre scegliere diversamente.</p></div><button type="button" class="close" onclick="document.getElementById('v115RulesDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Cambio stampo da<input type="time" name="start" required></label><label class="field">Cambio stampo fino a<input type="time" name="end" required></label><label class="field">Tecnico disponibile<input name="technician" required></label><label class="field">Ordine urgente entro (giorni)<input type="number" min="0" max="30" name="urgency"></label><label class="field"><span>Giorni coperchi</span><span style="display:flex;gap:12px;padding:8px 0"><span><input type="checkbox" name="friday"> Venerdì</span><span><input type="checkbox" name="saturday"> Sabato</span></span></label><label class="field"><span>Preferenze</span><span style="display:grid;gap:7px;padding:8px 0"><span><input type="checkbox" name="preferInstalled"> Evita cambi stampo inutili</span><span><input type="checkbox" name="preferLids"> Coperchi a fine settimana</span></span></label></div><div class="notice ok" style="margin-top:10px"><strong>Principio:</strong> il sistema suggerisce. Non cambia mai automaticamente la pianificazione decisa da Roberto.</div></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115RulesDialog').close()">Annulla</button><button class="btn primary" type="submit">Salva regole</button></div></form></dialog>`);
    if(!$('#v115EmailImportDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailImportDialog"><form id="v115EmailImportForm"><div class="modal-head"><div><span class="eyebrow">Ordini da e-mail</span><h3>Importa e-mail di prova</h3><p>Incolla un ordine ricevuto: il sistema estrae i dati e crea solo una bozza da controllare.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailImportDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Mittente<input name="from" type="email" placeholder="cliente@azienda.it"></label><label class="field">Oggetto<input name="subject" placeholder="Ordine 123"></label><label class="field full">Testo e-mail<textarea name="body" rows="10" placeholder="Cliente: ...\nOrdine: ...\nProdotto: ...\nQuantità: 800 pz\nConsegna: 25/09/2026" required></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115EmailImportDialog').close()">Annulla</button><button class="btn primary" type="submit">Analizza e crea bozza</button></div></form></dialog>`);
    if(!$('#v115EmailDraftDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailDraftDialog"><form id="v115EmailDraftForm"><div class="modal-head"><div><span class="eyebrow">Controllo umano obbligatorio</span><h3>Verifica ordine e-mail</h3><p>Correggi i dati prima di creare l'ordine nella piattaforma.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailDraftDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Cliente<select name="clientCode" required></select><small id="v115NewClientNote" class="v115-master-warning" style="display:none"></small></label><label class="field">Rif. ordine<input name="orderRef"></label><label class="field full">Prodotto<select name="productCode" required></select></label><label class="field">Quantità<input name="qty" type="number" min="1" required></label><label class="field">Consegna<input name="dueDate" type="date"></label><label class="field">Formato<select name="liters"><option value="">Da verificare</option><option>3LT</option><option>5LT</option><option>14LT</option><option>18LT</option></select></label><label class="field">Priorità<select name="priority"><option>Normale</option><option>Urgente</option></select></label><div class="full"><span class="eyebrow">Testo originale</span><div id="v115EmailDraftSource" class="v115-source"></div></div></div></div><div class="modal-actions"><button type="button" class="btn danger" onclick="SPPlannerV115.discardEmailDraftCurrent()">Elimina bozza</button><button type="button" class="btn" onclick="SPPlannerV115.cancelEmailEdit()">Annulla</button><button class="btn primary" type="submit">Salva verifica</button></div></form></dialog>`);
    if(!$('#v115EmailSetupDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailSetupDialog"><div class="modal-head"><div><span class="eyebrow">SMART PACK · Gmail OAuth</span><h3>Casella ordini Smart Pack</h3><p>Collegamento sicuro in sola lettura tramite Google. Nessuna password Gmail viene salvata.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailSetupDialog').close()">×</button></div><div class="modal-body"><div class="v115-email-state" id="v115GmailDialogState">Verifica connessione…</div><div class="v115-oauth"><div><b>Permesso richiesto</b><p>Solo lettura Gmail. La piattaforma può leggere i messaggi necessari a creare bozze ordine, ma non può inviare, cancellare o modificare e-mail.</p></div><div><b>Controllo umano</b><p>Ogni messaggio importato entra come bozza. Roberto o amministrazione verificano cliente, articolo, quantità e consegna prima di creare l'ordine.</p></div><div><b>Token protetto</b><p>Il refresh token Google resta cifrato nel backend Supabase e non viene esposto al browser o all'APK.</p></div><div><b>Allegati</b><p>I nomi degli allegati vengono rilevati. La lettura automatica di PDF/Excel può essere aggiunta nella fase successiva.</p></div></div></div><div class="modal-actions"><button class="btn" id="v115GmailDisconnectBtn" onclick="SPPlannerV115.disconnectGmail()" style="display:none">Scollega</button><button class="btn" onclick="document.getElementById('v115EmailSetupDialog').close()">Chiudi</button><button class="btn" id="v115GmailSyncBtn" onclick="SPPlannerV115.syncGmail()" style="display:none">Sincronizza ora</button><button class="btn primary" id="v115GmailConnectBtn" onclick="SPPlannerV115.connectGmail()">Collega Gmail</button></div></dialog>`);
    if(!$('#v115ClientDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115ClientDialog"><div class="modal-head"><div><span class="eyebrow">ANAGRAFICA CLIENTE</span><h3 id="v115ClientTitle">Cliente</h3><p id="v115ClientMeta">Ordini cliente</p></div><button type="button" class="close" onclick="document.getElementById('v115ClientDialog').close()">×</button></div><div class="modal-body" id="v115ClientBody"></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115ClientDialog').close()">Chiudi</button></div></dialog>`);
    $('#v115RulesForm').onsubmit=saveRules;$('#v115EmailImportForm').onsubmit=submitEmailImport;$('#v115EmailDraftForm').onsubmit=saveEmailDraft;
  }

  function addNav(){
    try{
      if(NAV?.director&&!NAV.director.some(x=>x[0]===VIEW)){const idx=Math.max(0,NAV.director.findIndex(x=>x[0]==='production')+1);NAV.director.splice(idx,0,[VIEW,'factory','Coda Roberto'])}
      if(typeof META!=='undefined')META[VIEW]=['Coda Roberto','Pianificazione produzione, stampi e consigli intelligenti'];
    }catch(e){console.warn('[V11.5] NAV',e)}
  }
  function patchRenderNav(){
    try{const old=window.renderNav||renderNav;if(typeof old==='function'&&!old.__v115){const w=function(){const out=old.apply(this,arguments);setTimeout(applyMenuPrefs,0);return out};w.__v115=true;window.renderNav=w;renderNav=w}}catch(e){console.warn('[V11.5] renderNav',e)}
  }
  function patchRenderCurrent(){
    try{const old=window.renderCurrent||renderCurrent;if(typeof old==='function'&&!old.__v115){const w=function(){if(typeof currentView!=='undefined'&&currentView===VIEW){renderPlanner();return}const out=old.apply(this,arguments);return out};w.__v115=true;window.renderCurrent=w;renderCurrent=w}}catch(e){console.warn('[V11.5] renderCurrent',e)}
  }
  function version(){document.title=`Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · ${BUILD}`;document.body.dataset.build=MARKER;$$('.version-badge').forEach(x=>x.textContent=BUILD)}

  function boot(){
    ensureState();injectStyles();ensureView();ensureDialogs();addNav();patchRenderNav();patchRenderCurrent();patchOrdersRender();patchOrdersRegisterV115();patchRegisterSaveV115();patchDashboardV115();version();
    try{renderNav()}catch(_){}applyMenuPrefs();patchOrderMasterDataV115();decorateClientLinksV115();
    const params=new URL(location.href).searchParams;
    if(params.has('gmail')){
      const result=params.get('gmail');const account=params.get('account')||'';
      if(result==='connected')setTimeout(()=>{try{toast(`Gmail collegato${account?' · '+account:''}`)}catch(_){}},300);
      const clean=new URL(location.href);clean.searchParams.delete('gmail');clean.searchParams.delete('account');clean.searchParams.delete('reason');history.replaceState({},'',clean.toString());
    }
    setTimeout(()=>{version();applyMenuPrefs();patchOrderMasterDataV115();if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner();decorateOrdersEmail();decorateClientLinksV115();loadGmailStatus(true)},900);
    setTimeout(()=>{if(gmailStatus.loading)loadGmailStatus(true)},2600);
  }

  window.SPPlannerV115={
    refresh:renderPlanner,move:moveRun,lock:toggleLock,apply:applySuggestions,menu:openMenu,saveMenu,rules:openRules,
    importEmail:openImportEmail,editEmail,toOrder,emailSetup,connectGmail,syncGmail,disconnectGmail,refreshOrdersEmail:decorateOrdersEmail,
    cancelEmailEdit,discardEmail:discardEmailDraft,discardEmailDraftCurrent:()=>{if(emailDraftEditing)discardEmailDraft(emailDraftEditing)},
    client:openClientV115,clientOrderDetails:clientOrderDetailsV115,
    dashboardGo:dashboardGoV115,
    suggest:()=>Object.fromEntries(machineList().map(m=>[m.id,suggestedForMachine(m.id).map(r=>({id:r.id,orderCode:r.orderCode,score:runScore(r).score,reason:reasonText(r,0)}))])),
    rulesData:rules
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* ===== Smart Pack · Multiplast — V11.6 CONSEGNA CLIENTE =====
   Configurazione azienda + import/export Excel + guida interattiva.
   La modalità guida non crea dati demo e non modifica dati reali.
*/
(()=>{
  'use strict';
  if(window.SPDeliveryV116) return;

  const VIEW='companySettings';
  const VERSION='V11.6.3';
  const XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v??'').trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const num=v=>{const x=Number(String(v??'').replace(/\s/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(x)?x:0};
  const iso=()=>new Date().toISOString();
  const role=()=>typeof currentRole!=='undefined'?currentRole:'';
  const cloudProfile=()=>window.POICloudV10?.getProfile?.()||null;
  const accountType=()=>String(cloudProfile()?.account_type||'');
  const isAdminAccount=()=>['platform_admin','tenant_admin','backup_admin'].includes(accountType())||window.POICloudV10?.isOwner?.();
  const currentCompany=()=>sessionStorage.getItem('poi_v113_company')||sessionStorage.getItem('poi_v112_company')||'';
  const companyName=c=>c==='multiplast'?'Multiplast':'Smart Pack';
  let selectedCompany=sessionStorage.getItem('poi_v116_config_company')||currentCompany()||(role()==='manager'?'multiplast':'smartpack');
  let pendingImport=null;
  let tourIndex=0,tourItems=[];

  function canConfigure(){return ['director','manager','admin'].includes(role())&&isAdminAccount()}
  function allowedCompanies(){
    if(role()==='director') return ['smartpack'];
    if(role()==='manager') return ['multiplast'];
    const arr=cloudProfile()?.company_codes;
    const out=Array.isArray(arr)&&arr.length?arr.filter(x=>['smartpack','multiplast'].includes(x)):['smartpack','multiplast'];
    return out.length?out:['smartpack','multiplast'];
  }
  function safeCompany(){const a=allowedCompanies();if(!a.includes(selectedCompany))selectedCompany=a[0]||'smartpack';return selectedCompany}
  function saveState(msg=''){
    try{save()}catch(e){try{localStorage.setItem('industrial_os_v2_state',JSON.stringify(state))}catch(_){} console.warn('[V11.6] save',e)}
    if(msg){try{toast(msg)}catch(_){}}
  }
  function audit(action,ref,detail){
    try{addAudit(action,ref,detail)}catch(_){
      state.audit=Array.isArray(state.audit)?state.audit:[];
      state.audit.unshift({id:'aud_'+Date.now(),at:iso(),action,ref,detail,role:role()});
    }
  }
  function ensureData(){
    state.companyProfilesV116=state.companyProfilesV116&&typeof state.companyProfilesV116==='object'?state.companyProfilesV116:{};
    state.importHistoryV116=Array.isArray(state.importHistoryV116)?state.importHistoryV116:[];
    state.operatorsByCompanyV116=state.operatorsByCompanyV116&&typeof state.operatorsByCompanyV116==='object'?state.operatorsByCompanyV116:{};
    for(const c of ['smartpack','multiplast']) state.companyProfilesV116[c]=state.companyProfilesV116[c]||{};
  }
  function profileData(c=safeCompany()){ensureData();return state.companyProfilesV116[c]||{}}

  function injectStyles(){
    if($('#v116DeliveryStyles'))return;
    const st=document.createElement('style');st.id='v116DeliveryStyles';st.textContent=`
      .v116-settings{display:grid;gap:16px}.v116-settings .hero{margin-bottom:0}.v116-company-tabs{display:flex;gap:8px;flex-wrap:wrap}.v116-company-tabs button{border:1px solid var(--line,#d8e4e8);background:#fff;border-radius:999px;padding:8px 13px;font-weight:850;font-size:11px;cursor:pointer}.v116-company-tabs button.active{background:#17394a;color:#fff;border-color:#17394a}
      .v116-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(360px,.88fr);gap:16px}.v116-card{background:#fff;border:1px solid var(--line,#d8e4e8);border-radius:18px;padding:18px;box-shadow:0 7px 22px rgba(20,54,69,.05)}.v116-card h3{margin:0;font-size:16px}.v116-card>p{margin:5px 0 14px;color:var(--muted,#687f89);font-size:10.5px;line-height:1.5}.v116-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v116-form .full{grid-column:1/-1}.v116-form label{display:grid;gap:5px;font-size:9px;font-weight:850;color:#516a76}.v116-form input,.v116-form textarea,.v116-form select{width:100%;box-sizing:border-box;border:1px solid #d7e3e8;border-radius:10px;background:#fbfdfe;padding:10px 11px;font:inherit;font-size:11px;color:#17394a}.v116-form textarea{resize:vertical;min-height:74px}.v116-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.v116-actions .btn{min-height:40px}.v116-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.v116-kpi{background:#f5f9fa;border:1px solid #e0e9ed;border-radius:12px;padding:10px}.v116-kpi span{display:block;color:#6a7e88;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.v116-kpi b{display:block;font-size:20px;color:#17394a;margin-top:4px}.v116-upload{border:1.5px dashed #b9cdd5;border-radius:15px;padding:14px;background:#f8fbfc}.v116-upload input{width:100%;margin-top:8px}.v116-mode{display:flex;gap:7px;margin-top:10px}.v116-mode label{flex:1;border:1px solid #dbe6ea;border-radius:11px;padding:9px;background:#fff;font-size:9.5px}.v116-preview{margin-top:12px;display:grid;gap:7px}.v116-preview-row{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border-radius:10px;background:#f5f9fa;font-size:9.5px}.v116-preview-row b{color:#17394a}.v116-good{color:#19724f}.v116-warn{color:#9c6c13}.v116-history{display:grid;gap:7px;max-height:220px;overflow:auto}.v116-history-row{border:1px solid #e3ebee;border-radius:10px;padding:9px 10px;font-size:9px}.v116-history-row b{display:block;color:#17394a}.v116-history-row span{display:block;color:#6a7e88;margin-top:3px}.v116-guide-card{background:linear-gradient(135deg,#17394a,#245f78);color:#fff}.v116-guide-card h3,.v116-guide-card>p{color:#fff}.v116-guide-card>p{opacity:.78}.v116-guide-note{font-size:9px;opacity:.76;margin-top:10px}.v116-help{border:1px solid #cbdbe1;background:#fff;color:#17394a;border-radius:12px;min-height:38px;padding:0 12px;font-weight:900;font-size:10px;cursor:pointer;display:none;align-items:center;gap:7px}.v116-help.show{display:inline-flex}.v116-help-dot{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#17394a;color:#fff}
      /* V11.6.1 · Manuale dinamico con spotlight reale */
      .v116-tour-layer{position:fixed;inset:0;z-index:25000;display:none;pointer-events:none}.v116-tour-layer.show{display:block}.v116-tour-mask{position:fixed;background:rgba(8,24,34,.66);transition:all .22s ease;pointer-events:none}.v116-tour-ring{position:fixed;border:3px solid #2b8bc0;border-radius:18px;box-shadow:0 0 0 4px rgba(43,139,192,.16),0 14px 40px rgba(8,31,43,.2);transition:all .22s ease;pointer-events:none}.v116-tour-tag{position:fixed;z-index:25004;display:flex;align-items:center;gap:7px;background:#17394a;color:#fff;border-radius:999px;padding:7px 11px;font-size:9px;font-weight:900;letter-spacing:.04em;box-shadow:0 8px 22px rgba(10,35,48,.22);transition:all .22s ease;white-space:nowrap}.v116-tour-tag i{width:7px;height:7px;border-radius:50%;background:#4fd39b;display:block}
      .v116-tour-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:25005;width:min(1180px,calc(100vw - 28px));background:#fff;border:1px solid #d7e4e9;border-radius:18px;box-shadow:0 22px 70px rgba(8,30,42,.28);padding:14px 16px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;pointer-events:auto}.v116-tour-count{width:54px;height:54px;border-radius:15px;background:#eef6f8;color:#17536d;display:grid;place-items:center;text-align:center;font-weight:950;line-height:1.05}.v116-tour-count b{display:block;font-size:17px}.v116-tour-count span{display:block;font-size:8px;margin-top:2px;color:#6b818b}.v116-tour-copy{min-width:0}.v116-tour-copy .eyebrow{font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#2a718d}.v116-tour-copy h3{margin:3px 0 4px;font-size:16px;color:#17394a}.v116-tour-copy p{margin:0;color:#5f7681;font-size:10.5px;line-height:1.45}.v116-tour-copy .how{margin-top:6px;color:#17394a;font-size:9.5px}.v116-tour-copy .how b{color:#1c6f91}.v116-tour-actions{display:flex;align-items:center;gap:7px}.v116-tour-actions .btn{min-height:38px;white-space:nowrap}.v116-tour-progress{position:absolute;left:16px;right:16px;bottom:0;height:3px;background:#e8eff2;border-radius:99px;overflow:hidden}.v116-tour-progress i{display:block;height:100%;background:linear-gradient(90deg,#2b8bc0,#44a783);transition:width .22s ease}
      .v116-first{position:fixed;right:18px;bottom:18px;z-index:12000;width:min(380px,calc(100vw - 36px));background:#fff;border:1px solid #dbe7eb;border-radius:16px;box-shadow:0 20px 55px rgba(16,48,62,.18);padding:15px;display:none}.v116-first.show{display:block}.v116-first b{display:block;color:#17394a;font-size:13px}.v116-first p{font-size:9.5px;color:#657b86;line-height:1.5;margin:6px 0 11px}.v116-first .actions{display:flex;gap:7px}.v116-admin-shortcut{margin:0 0 12px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 13px;border:1px solid #d8e5e9;background:#fff;border-radius:13px}.v116-admin-shortcut b{font-size:11px}.v116-admin-shortcut span{font-size:8.5px;color:#6c818b;display:block;margin-top:2px}
      @media(max-width:980px){.v116-grid{grid-template-columns:1fr}.v116-summary{grid-template-columns:repeat(3,1fr)}.v116-tour-bar{grid-template-columns:auto 1fr;gap:11px}.v116-tour-actions{grid-column:1/-1;justify-content:flex-end}.v116-tour-copy h3{font-size:15px}}
      @media(max-width:680px){.v116-form{grid-template-columns:1fr}.v116-form .full{grid-column:auto}.v116-summary{grid-template-columns:1fr 1fr}.v116-tour-bar{bottom:8px;width:calc(100vw - 16px);padding:11px;border-radius:15px;grid-template-columns:44px 1fr}.v116-tour-count{width:44px;height:44px;border-radius:12px}.v116-tour-copy p{font-size:9.5px}.v116-tour-copy .how{display:none}.v116-tour-actions{display:grid;grid-template-columns:1fr 1fr 1fr;width:100%}.v116-tour-actions .btn{width:100%;padding-left:8px!important;padding-right:8px!important}.v116-tour-tag{font-size:8px;padding:6px 9px}}
    `;document.head.appendChild(st);
  }

  function ensureView(){
    let v=$('#companySettingsView');if(v)return v;
    v=document.createElement('section');v.className='view';v.id='companySettingsView';
    ($('.content')||document.body).appendChild(v);return v;
  }

  function addNav(){
    try{
      if(typeof NAV!=='undefined'){
        for(const r of ['director','manager','admin']){
          NAV[r]=NAV[r]||[];
          if(!NAV[r].some(x=>x[0]===VIEW)) NAV[r].push([VIEW,'settings','Configurazione azienda']);
        }
      }
      if(typeof META!=='undefined') META[VIEW]=['Configurazione azienda','Dati aziendali, import Excel e guida alla piattaforma'];
    }catch(e){console.warn('[V11.6] nav',e)}
  }

  function stats(){
    ensureData();const c=safeCompany();
    const filt=a=>(a||[]).filter(x=>belongs(x,c));
    const openOrders=filt(state.orders).filter(x=>!x.cancelled&&!/chiuso|consegnato|evaso/i.test(String(x.status||'')));
    return {clients:filt(state.clientDirectory||state.clients).length,products:filt(state.productDirectory||state.products).length,machines:filt(state.machines).length,molds:filt(state.molds).length,imls:filt(state.imls).length,orders:openOrders.length};
  }
  function belongs(x,c){
    if(!x||typeof x!=='object') return c==='smartpack';
    const v=norm(x.companyCode||x.company||x.azienda||'');
    if(!v) return c==='smartpack';
    return c==='multiplast'?v.includes('multiplast'):v.includes('smartpack')||v==='sp';
  }

  function renderConfig(){
    ensureData();injectStyles();const view=ensureView();
    if(!canConfigure()){
      view.innerHTML=`<div class="hero"><div><h2>Configurazione azienda</h2><p>Questa sezione è riservata agli amministratori autorizzati.</p></div></div>`;return;
    }
    const c=safeCompany(),p=profileData(c),s=stats(),hist=(state.importHistoryV116||[]).filter(x=>x.company===c).slice(0,8);
    const tabs=allowedCompanies().map(x=>`<button type="button" class="${x===c?'active':''}" onclick="SPDeliveryV116.setCompany('${x}')">${companyName(x)}</button>`).join('');
    view.innerHTML=`<div class="v116-settings">
      <div class="hero"><div><span class="eyebrow">Configurazione</span><h2>Dati aziendali e avvio piattaforma</h2><p>Aggiorna l'anagrafica, importa i dati esistenti e accompagna gli utenti nell'uso dei moduli.</p></div><div class="v116-company-tabs">${tabs}</div></div>
      <div class="v116-summary"><div class="v116-kpi"><span>Clienti</span><b>${s.clients}</b></div><div class="v116-kpi"><span>Prodotti</span><b>${s.products}</b></div><div class="v116-kpi"><span>Macchine</span><b>${s.machines}</b></div><div class="v116-kpi"><span>Stampi</span><b>${s.molds}</b></div><div class="v116-kpi"><span>IML</span><b>${s.imls}</b></div><div class="v116-kpi"><span>Ordini aperti</span><b>${s.orders}</b></div></div>
      <div class="v116-grid">
        <div class="v116-card"><h3>Anagrafica ${companyName(c)}</h3><p>Questi dati diventano il riferimento aziendale della piattaforma e possono essere aggiornati in qualsiasi momento.</p>
          <form id="v116CompanyForm" class="v116-form">
            <label>Ragione sociale<input name="ragioneSociale" value="${esc(p.ragioneSociale||companyName(c))}"></label>
            <label>Partita IVA<input name="partitaIva" value="${esc(p.partitaIva||'')}"></label>
            <label>Codice fiscale<input name="codiceFiscale" value="${esc(p.codiceFiscale||'')}"></label>
            <label>Codice SDI<input name="codiceSdi" value="${esc(p.codiceSdi||'')}"></label>
            <label class="full">Sede legale<input name="sedeLegale" value="${esc(p.sedeLegale||'')}"></label>
            <label class="full">Sede operativa<input name="sedeOperativa" value="${esc(p.sedeOperativa||'')}"></label>
            <label>PEC<input name="pec" type="email" value="${esc(p.pec||'')}"></label>
            <label>E-mail<input name="email" type="email" value="${esc(p.email||'')}"></label>
            <label>Telefono<input name="telefono" value="${esc(p.telefono||'')}"></label>
            <label>Sito web<input name="website" value="${esc(p.website||'')}"></label>
            <label>Referente<input name="referente" value="${esc(p.referente||'')}"></label>
            <label class="full">Note<textarea name="note">${esc(p.note||'')}</textarea></label>
          </form><div class="v116-actions"><button class="btn primary" type="button" onclick="SPDeliveryV116.saveCompany()">Salva dati azienda</button></div>
        </div>
        <div style="display:grid;gap:16px">
          <div class="v116-card"><h3>Importa dati da Excel</h3><p>Carica anagrafiche e dati operativi già esistenti senza partire da zero. Prima dell'importazione viene mostrata un'anteprima.</p>
            <div class="v116-upload"><b>File Excel / CSV</b><div style="font-size:9px;color:#6d8089;margin-top:4px">Clienti, prodotti, macchine, stampi, IML, ordini, operatori e scadenze.</div><input id="v116ExcelFile" type="file" accept=".xlsx,.xls,.csv" onchange="SPDeliveryV116.previewExcel(this.files[0])"></div>
            <div class="v116-mode"><label><input type="radio" name="v116ImportMode" value="merge" checked> <b>Unisci / aggiorna</b><br><span style="color:#6d8089">Mantiene i dati presenti e aggiorna i codici corrispondenti.</span></label><label><input type="radio" name="v116ImportMode" value="replace"> <b>Sostituisci sezioni</b><br><span style="color:#6d8089">Sostituisce solo le sezioni presenti nel file.</span></label></div>
            <div id="v116ImportPreview" class="v116-preview"></div>
            <div class="v116-actions"><button class="btn" type="button" onclick="SPDeliveryV116.downloadTemplate()">Scarica modello Excel</button><button class="btn" type="button" onclick="SPDeliveryV116.exportExcel()">Esporta dati attuali</button><button class="btn primary" id="v116ApplyImport" type="button" onclick="SPDeliveryV116.applyImport()" disabled>Importa dati</button></div>
            ${localStorage.getItem('poi_v116_last_import_backup')?'<div class="v116-actions"><button class="btn" type="button" onclick="SPDeliveryV116.restoreImport()">Ripristina ultimo import</button></div>':''}
          </div>
          <div class="v116-card v116-guide-card"><h3>Guida interattiva</h3><p>Una modalità dimostrativa sicura che accompagna l'utente modulo per modulo senza creare o modificare dati reali.</p><div class="v116-actions"><button class="btn" type="button" onclick="SPDeliveryV116.startTour()">Avvia guida</button><button class="btn" type="button" onclick="SPDeliveryV116.resetGuide()">Ripristina primo accesso</button></div><div class="v116-guide-note">La guida usa i moduli realmente disponibili per il ruolo con cui l'utente ha effettuato l'accesso.</div></div>
        </div>
      </div>
      <div class="v116-card"><h3>Storico importazioni</h3><p>Ultime operazioni registrate per ${companyName(c)}.</p><div class="v116-history">${hist.length?hist.map(x=>`<div class="v116-history-row"><b>${esc(x.file||'Importazione Excel')} · ${esc(x.mode==='replace'?'sostituzione':'aggiornamento')}</b><span>${esc(new Date(x.at).toLocaleString('it-IT'))} · ${esc(summaryText(x.counts||{}))}</span></div>`).join(''):'<div style="font-size:10px;color:#71858e">Nessuna importazione registrata.</div>'}</div></div>
    </div>`;
  }

  function saveCompany(){
    if(!canConfigure())return;ensureData();const f=$('#v116CompanyForm');if(!f)return;const fd=new FormData(f),c=safeCompany();
    state.companyProfilesV116[c]={...profileData(c),ragioneSociale:txt(fd.get('ragioneSociale')),partitaIva:txt(fd.get('partitaIva')),codiceFiscale:txt(fd.get('codiceFiscale')),codiceSdi:txt(fd.get('codiceSdi')),sedeLegale:txt(fd.get('sedeLegale')),sedeOperativa:txt(fd.get('sedeOperativa')),pec:txt(fd.get('pec')),email:txt(fd.get('email')),telefono:txt(fd.get('telefono')),website:txt(fd.get('website')),referente:txt(fd.get('referente')),note:txt(fd.get('note')),updatedAt:iso()};
    audit('Configurazione azienda aggiornata',companyName(c),'Dati anagrafici aziendali');saveState('Dati azienda salvati');renderConfig();
  }
  function setCompany(c){if(!allowedCompanies().includes(c))return;selectedCompany=c;sessionStorage.setItem('poi_v116_config_company',c);pendingImport=null;renderConfig()}

  function ensureXLSX(){
    if(window.XLSX)return Promise.resolve(window.XLSX);
    if(window.__v116XlsxPromise)return window.__v116XlsxPromise;
    window.__v116XlsxPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=XLSX_URL;s.async=true;s.referrerPolicy='no-referrer';s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('xlsx_not_loaded'));s.onerror=()=>reject(new Error('xlsx_download_failed'));document.head.appendChild(s);
    });return window.__v116XlsxPromise;
  }
  function findSheet(wb,names){const map=new Map(wb.SheetNames.map(n=>[norm(n),n]));for(const n of names){const exact=map.get(norm(n));if(exact)return wb.Sheets[exact]}return null}
  function rowsOf(wb,names){const ws=findSheet(wb,names);if(!ws)return null;return window.XLSX.utils.sheet_to_json(ws,{defval:'',raw:false}).filter(r=>Object.values(r).some(v=>txt(v)!==''))}
  function val(row,aliases){if(!row)return'';const map={};for(const [k,v] of Object.entries(row))map[norm(k)]=v;for(const a of aliases){const k=norm(a);if(k in map)return map[k]}return''}
  function bool(v,def=true){const s=norm(v);if(!s)return def;return !['no','false','0','inattivo','disattivo','annullato'].includes(s)}
  function date(v){if(!v)return'';if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);const s=txt(v);const m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(m){let y=m[3];if(y.length===2)y='20'+y;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}const d=new Date(s);return isNaN(d)?s:d.toISOString().slice(0,10)}
  function maxCode(prefix,arr,key='code'){let m=0;for(const x of arr||[]){const z=String(typeof x==='object'?x?.[key]:x||'').match(new RegExp('^'+prefix+'-(\\d+)$','i'));if(z)m=Math.max(m,Number(z[1]))}return m}
  function nextCode(prefix,arr,key='code'){const n=maxCode(prefix,arr,key)+1;return `${prefix}-${String(n).padStart(3,'0')}`}

  function parseWorkbook(wb,fileName=''){
    const c=safeCompany(),out={company:c,file:fileName,sections:{},counts:{},errors:[]};
    const companyRows=rowsOf(wb,['AZIENDA','COMPANY','DATI AZIENDA']);
    if(companyRows){
      const obj={};
      if(companyRows.length&&val(companyRows[0],['Campo','Field'])){
        const map={ragionesociale:'ragioneSociale',partitaiva:'partitaIva',codicefiscale:'codiceFiscale',codicesdi:'codiceSdi',sdi:'codiceSdi',sedelegale:'sedeLegale',sedeoperativa:'sedeOperativa',pec:'pec',email:'email',telefono:'telefono',sitoweb:'website',website:'website',referente:'referente',note:'note'};
        for(const r of companyRows){const k=norm(val(r,['Campo','Field'])),vv=val(r,['Valore','Value']);for(const [alias,target] of Object.entries(map)){if(k===norm(alias.split(',')[0])||alias.split(',').some(a=>k===norm(a)))obj[target]=txt(vv)}}
      }else if(companyRows[0]){
        const r=companyRows[0];obj.ragioneSociale=txt(val(r,['Ragione sociale','Azienda','Company']));obj.partitaIva=txt(val(r,['Partita IVA','PIVA','VAT']));obj.codiceFiscale=txt(val(r,['Codice fiscale','CF']));obj.codiceSdi=txt(val(r,['Codice SDI','SDI']));obj.sedeLegale=txt(val(r,['Sede legale']));obj.sedeOperativa=txt(val(r,['Sede operativa']));obj.pec=txt(val(r,['PEC']));obj.email=txt(val(r,['Email','E-mail']));obj.telefono=txt(val(r,['Telefono','Phone']));obj.website=txt(val(r,['Sito web','Website']));obj.referente=txt(val(r,['Referente']));obj.note=txt(val(r,['Note']));
      }
      out.sections.company=obj;out.counts.company=Object.values(obj).filter(Boolean).length;
    }
    const clRows=rowsOf(wb,['CLIENTI','CLIENTS','ANAGRAFICA CLIENTI']);
    if(clRows){const existing=state.clientDirectory||state.clients||[];let tmp=[...existing];out.sections.clients=clRows.map(r=>{let code=txt(val(r,['Codice cliente SPRING','Codice SPRING','Codice cliente','Codice','Code','ID']));if(!code){code=nextCode('CLI',tmp);tmp.push({code})}const name=txt(val(r,['Cliente','Ragione sociale','Nome','Name']));if(!name)out.errors.push(`Cliente senza nome (${code})`);return{code,name,vat:txt(val(r,['Partita IVA','PIVA','VAT'])),fiscalCode:txt(val(r,['Codice fiscale','CF'])),email:txt(val(r,['Email','E-mail'])),phone:txt(val(r,['Telefono','Phone'])),address:txt(val(r,['Indirizzo','Address'])),city:txt(val(r,['Citta','Città','City'])),province:txt(val(r,['Provincia','Province'])),cap:txt(val(r,['CAP','ZIP'])),pec:txt(val(r,['PEC'])),sdi:txt(val(r,['SDI','Codice SDI'])),active:bool(val(r,['Attivo','Active']),true),companyCode:c}}).filter(x=>x.name);out.counts.clients=out.sections.clients.length}
    const prRows=rowsOf(wb,['PRODOTTI','PRODUCTS','ARTICOLI']);
    if(prRows){const existing=state.productDirectory||state.products||[];let tmp=[...existing];out.sections.products=prRows.map(r=>{let code=txt(val(r,['Codice prodotto','Codice articolo','Codice','Code','ID']));if(!code){code=nextCode('PRD',tmp);tmp.push({code})}const name=txt(val(r,['Prodotto','Articolo','Descrizione','Nome','Name']));if(!name)out.errors.push(`Prodotto senza nome (${code})`);return{code,name,family:txt(val(r,['Famiglia','Categoria','Family'])),liters:txt(val(r,['Formato','Litri','Liters'])),color:txt(val(r,['Colore','Color'])),unit:txt(val(r,['UM','Unita','Unità','Unit']))||'PZ',notes:txt(val(r,['Note','Notes'])),active:bool(val(r,['Attivo','Active']),true),companyCode:c}}).filter(x=>x.name);out.counts.products=out.sections.products.length}
    const maRows=rowsOf(wb,['MACCHINE','MACHINES','PRESSE']);
    if(maRows){let tmp=[...(state.machines||[])];out.sections.machines=maRows.map(r=>{let id=txt(val(r,['ID macchina','Codice macchina','ID','Codice','Code']));if(!id){id=nextCode('MCH',tmp,'id');tmp.push({id})}return{id,name:txt(val(r,['Macchina','Pressa','Nome','Name']))||id,status:txt(val(r,['Stato','Status']))||'Disponibile',installedMold:txt(val(r,['Stampo installato','Installed mold','Stampo'])),notes:txt(val(r,['Note','Notes'])),companyCode:c}});out.counts.machines=out.sections.machines.length}
    const moRows=rowsOf(wb,['STAMPI','MOLDS']);
    if(moRows){let tmp=[...(state.molds||[])];out.sections.molds=moRows.map(r=>{let id=txt(val(r,['ID stampo','Codice stampo','ID','Codice','Code']));if(!id){id=nextCode('MLD',tmp,'id');tmp.push({id})}const cyc=num(val(r,['Tempo ciclo sec','Cycle seconds','Ciclo secondi'])),rate=num(val(r,['Pezzi ora','Pz ora','Rate']));return{id,name:txt(val(r,['Stampo','Nome','Name']))||id,machineId:txt(val(r,['ID macchina','Macchina','Machine'])),kind:txt(val(r,['Tipo','Kind'])),cycleSeconds:cyc,rate:rate||(cyc?3600/cyc:0),notes:txt(val(r,['Note','Notes'])),companyCode:c}});out.counts.molds=out.sections.molds.length}
    const imlRows=rowsOf(wb,['IML','ETICHETTE','LABELS']);
    if(imlRows){let tmp=[...(state.imls||[])];out.sections.imls=imlRows.map(r=>{let code=txt(val(r,['Codice IML aziendale','Codice IML','IML','Codice','Code','ID']));if(!code){code=nextCode('IML',tmp);tmp.push({code})}return{code,id:code,productCode:txt(val(r,['Codice prodotto','Product code'])),clientCode:txt(val(r,['Codice cliente','Client code'])),description:txt(val(r,['Descrizione','Description']))||code,physical:num(val(r,['Giacenza fisica','Fisico','Physical','Quantita','Quantità'])),reserved:num(val(r,['Riservato','Reserved'])),minimum:num(val(r,['Scorta minima','Minimo','Minimum'])),status:txt(val(r,['Stato','Status'])),notes:txt(val(r,['Note','Notes'])),companyCode:c}});out.counts.imls=out.sections.imls.length}
    const suRows=rowsOf(wb,['FORNITORI','SUPPLIERS','ANAGRAFICA FORNITORI']);
    if(suRows){let tmp=[...(state.supplierDirectory||[])];out.sections.suppliers=suRows.map(r=>{let code=txt(val(r,['Codice fornitore','Codice','Code','ID']));if(!code){code=nextCode('FOR',tmp);tmp.push({code})}const name=txt(val(r,['Fornitore','Ragione sociale','Nome','Name']));if(!name)out.errors.push(`Fornitore senza nome (${code})`);return{code,reference:code,name,email:txt(val(r,['Email','E-mail'])).toLowerCase(),phone:txt(val(r,['Telefono','Phone'])),category:txt(val(r,['Tipo','Categoria','Category']))||'',active:bool(val(r,['Attivo','Active']),true),companyCode:c}}).filter(x=>x.name);out.counts.suppliers=out.sections.suppliers.length}
    const orRows=rowsOf(wb,['ORDINI','ORDERS','ORDINI APERTI']);
    if(orRows){let seq=0;out.sections.orders=orRows.map(r=>{seq++;let code=txt(val(r,['Codice ordine','Codice riga','Code','ID']));if(!code)code=`ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(seq).padStart(3,'0')}`;let parent=txt(val(r,['Ordine padre','Parent','Rif interno']))||code;const cc=txt(val(r,['Codice cliente','Client code'])),pc=txt(val(r,['Codice prodotto','Product code']));const cm=(out.sections.clients||state.clientDirectory||state.clients||[]).find(x=>String(x.code)===cc),pm=(out.sections.products||state.productDirectory||state.products||[]).find(x=>String(x.code)===pc);return{code,parent,orderRef:txt(val(r,['Riferimento ordine','Ordine cliente','Order ref'])),clientCode:cc,client:txt(val(r,['Cliente','Client']))||cm?.name||'',productCode:pc,product:txt(val(r,['Prodotto','Product']))||pm?.name||'',qty:num(val(r,['Quantita','Quantità','Qty','Qta'])),dueDate:date(val(r,['Data consegna','Consegna','Due date'])),priority:txt(val(r,['Priorita','Priorità','Priority']))||'Normale',imlCode:txt(val(r,['Codice IML','IML'])),status:txt(val(r,['Stato','Status']))||'Aperto',notes:txt(val(r,['Note','Notes'])),cancelled:!bool(val(r,['Attivo','Active']),true),companyCode:c}}).filter(x=>x.qty||x.client||x.product);out.counts.orders=out.sections.orders.length}
    const opRows=rowsOf(wb,['OPERATORI','OPERATORS','DIPENDENTI']);
    if(opRows){out.sections.operators=opRows.map(r=>txt(val(r,['Nome e cognome','Operatore','Nome','Name']))).filter(Boolean);out.counts.operators=out.sections.operators.length}
    const coRows=rowsOf(wb,['SCADENZE','COMPLIANCE','SCADENZE COMPLIANCE']);
    if(coRows){out.sections.compliance=coRows.map(r=>({id:txt(val(r,['ID','Codice']))||'cmp_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),company:companyName(c),subjectType:txt(val(r,['Tipo soggetto','Subject type']))||'Azienda',subjectName:txt(val(r,['Persona elemento','Soggetto','Subject']))||companyName(c),category:txt(val(r,['Categoria','Category']))||'Altro',title:txt(val(r,['Titolo','Title'])),issueDate:date(val(r,['Data rilascio','Data effettuazione','Issue date'])),expiryDate:date(val(r,['Data scadenza','Scadenza','Expiry date'])),responsible:txt(val(r,['Responsabile','Responsible'])),alertEmails:txt(val(r,['Email alert','Alert emails'])),documentRef:txt(val(r,['Riferimento documento','Document ref'])),notes:txt(val(r,['Note','Notes'])),active:bool(val(r,['Attivo','Active']),true),createdAt:iso()})).filter(x=>x.title&&x.expiryDate);out.counts.compliance=out.sections.compliance.length}
    return out;
  }

  async function previewExcel(file){
    if(!file)return;const box=$('#v116ImportPreview'),btn=$('#v116ApplyImport');if(box)box.innerHTML='<div class="v116-preview-row"><span>Lettura file…</span><b>Attendere</b></div>';if(btn)btn.disabled=true;
    try{await ensureXLSX();const ab=await file.arrayBuffer();const wb=window.XLSX.read(ab,{type:'array',cellDates:true});pendingImport=parseWorkbook(wb,file.name);renderImportPreview();}catch(e){pendingImport=null;if(box)box.innerHTML=`<div class="v116-preview-row"><span>Impossibile leggere il file</span><b class="v116-warn">${esc(e?.message||e)}</b></div>`}
  }
  function renderImportPreview(){
    const box=$('#v116ImportPreview'),btn=$('#v116ApplyImport');if(!box)return;if(!pendingImport){box.innerHTML='';if(btn)btn.disabled=true;return}
    const labels={company:'Dati azienda',clients:'Clienti',products:'Prodotti',suppliers:'Fornitori',machines:'Macchine',molds:'Stampi',imls:'IML',orders:'Ordini',operators:'Operatori',compliance:'Scadenze'};
    const entries=Object.entries(pendingImport.counts||{}).filter(([,n])=>n>0);box.innerHTML=entries.length?entries.map(([k,n])=>`<div class="v116-preview-row"><span>${labels[k]||k}</span><b class="v116-good">${n} ${k==='company'?'campi':'righe'}</b></div>`).join(''):'<div class="v116-preview-row"><span>Nessuna sezione riconosciuta</span><b class="v116-warn">Controlla i nomi dei fogli</b></div>';
    if(pendingImport.errors?.length)box.innerHTML+=`<div class="v116-preview-row"><span>Avvisi</span><b class="v116-warn">${pendingImport.errors.length}</b></div>`;
    if(btn)btn.disabled=!entries.length;
  }
  function importMode(){return document.querySelector('input[name="v116ImportMode"]:checked')?.value||'merge'}
  function mergeObjects(existing,incoming,key,company,mode){
    const old=Array.isArray(existing)?existing:[],inc=Array.isArray(incoming)?incoming:[];if(!inc.length)return old;
    const other=old.filter(x=>!belongs(x,company));const same=old.filter(x=>belongs(x,company));
    if(mode==='replace')return [...other,...inc];
    const map=new Map(same.map(x=>[String(x?.[key]||'').toLowerCase(),x]));
    for(const x of inc){const k=String(x?.[key]||'').toLowerCase();if(k&&map.has(k))map.set(k,{...map.get(k),...x});else map.set(k||'__'+Math.random(),x)}
    return [...other,...map.values()];
  }
  function snapshot(){ensureData();return{companyProfilesV116:state.companyProfilesV116,clientDirectory:state.clientDirectory,clients:state.clients,productDirectory:state.productDirectory,products:state.products,supplierDirectory:state.supplierDirectory,machines:state.machines,molds:state.molds,imls:state.imls,orders:state.orders,operators:state.operators,operatorsByCompanyV116:state.operatorsByCompanyV116,complianceRecords:state.complianceRecords,importHistoryV116:state.importHistoryV116}}
  function applyImport(){
    if(!pendingImport||!canConfigure())return;const mode=importMode(),c=safeCompany(),sec=pendingImport.sections||{};if(!confirm(`Importare i dati di “${pendingImport.file}” in ${companyName(c)}?\nModalità: ${mode==='replace'?'Sostituisci le sezioni presenti':'Unisci / aggiorna'}.`))return;
    try{localStorage.setItem('poi_v116_last_import_backup',JSON.stringify({at:iso(),company:c,data:snapshot()}))}catch(_){ }
    ensureData();
    if(sec.company)state.companyProfilesV116[c]={...profileData(c),...Object.fromEntries(Object.entries(sec.company).filter(([,v])=>txt(v)!=='')),updatedAt:iso()};
    if(sec.clients){
      // I codici importati (es. SPRING) sono autorevoli. In modalità merge sostituiamo l'eventuale codice provvisorio del cliente con lo stesso nome.
      if(mode==='merge'){const names=new Map(sec.clients.map(x=>[norm(x.name),x]));state.clientDirectory=(state.clientDirectory||state.clients||[]).filter(x=>!names.has(norm(x?.name||''))||String(names.get(norm(x?.name||''))?.code||'').toLowerCase()===String(x?.code||'').toLowerCase())}
      state.clientDirectory=mergeObjects(state.clientDirectory||state.clients,sec.clients,'code',c,mode);state.clients=state.clientDirectory.map(x=>({...x}))
    }
    if(sec.products){state.productDirectory=mergeObjects(state.productDirectory||state.products,sec.products,'code',c,mode);state.products=state.productDirectory.map(x=>({...x}))}
    if(sec.suppliers)state.supplierDirectory=mergeObjects(state.supplierDirectory,sec.suppliers,'code',c,mode);
    if(sec.machines)state.machines=mergeObjects(state.machines,sec.machines,'id',c,mode);
    if(sec.molds)state.molds=mergeObjects(state.molds,sec.molds,'id',c,mode);
    if(sec.imls){
      if(mode==='merge'){for(const incoming of sec.imls){state.imls=(state.imls||[]).filter(old=>{if(String(old?.code||'').toLowerCase()===String(incoming.code||'').toLowerCase())return true;const sameMaster=incoming.clientCode&&incoming.productCode&&String(old?.clientCode||'')===String(incoming.clientCode)&&String(old?.productCode||'')===String(incoming.productCode);const sameDesc=incoming.description&&norm(old?.description||'')===norm(incoming.description);return !(sameMaster||sameDesc)})}}
      state.imls=mergeObjects(state.imls,sec.imls,'code',c,mode)
    }
    if(sec.orders)state.orders=mergeObjects(state.orders,sec.orders,'code',c,mode);
    if(sec.operators){state.operatorsByCompanyV116[c]=mode==='replace'?[...new Set(sec.operators)]:[...new Set([...(state.operatorsByCompanyV116[c]||[]),...sec.operators])];state.operators=[...new Set([...(state.operators||[]),...state.operatorsByCompanyV116[c]])]}
    if(sec.compliance)state.complianceRecords=mergeObjects(state.complianceRecords,sec.compliance,'id',c,mode);
    const entry={at:iso(),company:c,file:pendingImport.file,mode,counts:pendingImport.counts,by:cloudProfile()?.email||accountType()||role()};state.importHistoryV116.unshift(entry);state.importHistoryV116=state.importHistoryV116.slice(0,50);
    audit('Importazione Excel completata',companyName(c),`${pendingImport.file} · ${summaryText(pendingImport.counts)}`);saveState('Importazione completata');pendingImport=null;renderConfig();
    try{if(typeof renderNav==='function')renderNav();if(typeof renderCurrent==='function')renderCurrent()}catch(_){ }
  }
  function restoreImport(){
    if(!canConfigure())return;let b;try{b=JSON.parse(localStorage.getItem('poi_v116_last_import_backup')||'null')}catch(_){b=null}if(!b?.data){alert('Nessun backup di importazione disponibile.');return}if(!confirm(`Ripristinare la situazione precedente all'ultimo import (${new Date(b.at).toLocaleString('it-IT')})?`))return;Object.assign(state,b.data);audit('Ripristino importazione',companyName(b.company||safeCompany()),'Ripristinato backup precedente');saveState('Backup ripristinato');localStorage.removeItem('poi_v116_last_import_backup');renderConfig();
  }
  function summaryText(c){const labels={clients:'clienti',products:'prodotti',suppliers:'fornitori',machines:'macchine',molds:'stampi',imls:'IML',orders:'ordini',operators:'operatori',compliance:'scadenze'};return Object.entries(c||{}).filter(([k,n])=>n>0&&k!=='company').map(([k,n])=>`${n} ${labels[k]||k}`).join(' · ')||'dati azienda'}

  function sheetRowsForExport(c){
    ensureData();const p=profileData(c),filter=a=>(a||[]).filter(x=>belongs(x,c));const kv=[['Campo','Valore'],['Ragione sociale',p.ragioneSociale||companyName(c)],['Partita IVA',p.partitaIva||''],['Codice fiscale',p.codiceFiscale||''],['Codice SDI',p.codiceSdi||''],['Sede legale',p.sedeLegale||''],['Sede operativa',p.sedeOperativa||''],['PEC',p.pec||''],['Email',p.email||''],['Telefono',p.telefono||''],['Sito web',p.website||''],['Referente',p.referente||''],['Note',p.note||'']];
    const clients=filter(state.clientDirectory||state.clients).map(x=>({'Codice cliente':x.code||'','Cliente':x.name||'','Partita IVA':x.vat||x.partitaIva||'','Codice fiscale':x.fiscalCode||'','Email':x.email||'','Telefono':x.phone||'','Indirizzo':x.address||'','Città':x.city||'','Provincia':x.province||'','CAP':x.cap||'','PEC':x.pec||'','Codice SDI':x.sdi||'','Attivo':x.active!==false?'SI':'NO'}));
    const products=filter(state.productDirectory||state.products).map(x=>({'Codice prodotto':x.code||'','Prodotto':x.name||x.product||'','Famiglia':x.family||'','Formato':x.liters||'','Colore':x.color||'','UM':x.unit||'PZ','Note':x.notes||'','Attivo':x.active!==false?'SI':'NO'}));
    const suppliers=filter(state.supplierDirectory||[]).map(x=>({'Codice fornitore':x.code||x.reference||'','Fornitore':x.name||'','Email':x.email||'','Telefono':x.phone||'','Tipo':x.category||'','Attivo':x.active!==false?'SI':'NO'}));
    const machines=filter(state.machines).map(x=>({'ID macchina':x.id||'','Macchina':x.name||'','Stato':x.status||'','Stampo installato':x.installedMold||x.moldId||'','Note':x.notes||''}));
    const molds=filter(state.molds).map(x=>({'ID stampo':x.id||'','Stampo':x.name||'','ID macchina':x.machineId||'','Tipo':x.kind||'','Tempo ciclo sec':x.cycleSeconds||'','Pezzi ora':x.rate||'','Note':x.notes||''}));
    const imls=filter(state.imls).map(x=>({'Codice IML':x.code||x.id||'','Codice prodotto':x.productCode||'','Codice cliente':x.clientCode||'','Descrizione':x.description||x.name||'','Giacenza fisica':x.physical??x.qty??'','Riservato':x.reserved??'','Scorta minima':x.minimum??x.minStock??'','Stato':x.status||'','Note':x.notes||''}));
    const orders=filter(state.orders).map(x=>({'Codice ordine':x.code||'','Ordine padre':x.parent||'','Riferimento ordine':x.orderRef||'','Codice cliente':x.clientCode||'','Cliente':x.client||'','Codice prodotto':x.productCode||'','Prodotto':x.product||'','Quantità':x.qty||0,'Data consegna':x.dueDate||'','Priorità':x.priority||'','Codice IML':x.imlCode||'','Stato':x.status||'','Note':x.notes||'','Attivo':x.cancelled?'NO':'SI'}));
    const operators=(state.operatorsByCompanyV116[c]||state.operators||[]).map(x=>({'Nome e cognome':typeof x==='string'?x:(x.name||x.display_name||'')})).filter(x=>x['Nome e cognome']);
    const compliance=filter(state.complianceRecords).map(x=>({'ID':x.id||'','Tipo soggetto':x.subjectType||'','Persona elemento':x.subjectName||'','Categoria':x.category||'','Titolo':x.title||'','Data rilascio':x.issueDate||'','Data scadenza':x.expiryDate||'','Responsabile':x.responsible||'','Email alert':x.alertEmails||'','Riferimento documento':x.documentRef||'','Note':x.notes||'','Attivo':x.active!==false?'SI':'NO'}));
    return{company:kv,clients,products,suppliers,machines,molds,imls,orders,operators,compliance};
  }
  async function exportExcel(){
    if(!canConfigure())return;try{await ensureXLSX();const c=safeCompany(),d=sheetRowsForExport(c),wb=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(wb,window.XLSX.utils.aoa_to_sheet(d.company),'AZIENDA');for(const [name,key] of [['CLIENTI','clients'],['PRODOTTI','products'],['FORNITORI','suppliers'],['MACCHINE','machines'],['STAMPI','molds'],['IML','imls'],['ORDINI','orders'],['OPERATORI','operators'],['SCADENZE','compliance']])window.XLSX.utils.book_append_sheet(wb,window.XLSX.utils.json_to_sheet(d[key]),name);window.XLSX.writeFile(wb,`${companyName(c).replace(/\s/g,'_')}_dati_piattaforma_${new Date().toISOString().slice(0,10)}.xlsx`)}catch(e){alert('Esportazione Excel non riuscita: '+String(e?.message||e))}
  }
  function downloadTemplate(){const a=document.createElement('a');a.href='./IndustrialOS_Modello_Import_Dati_Azienda_V11.6.3.xlsx';a.download='IndustrialOS_Modello_Import_Dati_Azienda_V11.6.3.xlsx';document.body.appendChild(a);a.click();a.remove()}

  const guideText={
    dashboard:['Panoramica','La schermata iniziale riassume ciò che richiede attenzione e collega rapidamente ai flussi principali.','Controlla KPI, ordini aperti, criticità e collegamenti rapidi prima di entrare nei singoli moduli.'],
    orders:['Ordini clienti','Qui si inseriscono, verificano e seguono gli ordini cliente, inclusi quelli acquisiti da e-mail.','Verifica cliente, prodotto, quantità e consegna; poi conferma la bozza e trasformala in ordine operativo.'],
    ordersRegister:['Registro ordini','È l’elenco operativo degli ordini con anagrafiche ufficiali cliente e prodotto.','Cerca per codice, aggiorna i dati consentiti e apri la scheda cliente per vedere ordini pendenti e storico.'],
    imlOrders:['Ordini IML','Raccoglie gli ordini e i fabbisogni collegati alle etichette IML.','Controlla ciò che è da ordinare, ricevuto o ancora in attesa e mantieni allineata la produzione.'],
    planner:['Coda di produzione','Organizza la sequenza delle lavorazioni e rende visibili priorità e vincoli.','Riordina le produzioni, verifica macchina/stampo e usa i suggerimenti come supporto alla decisione.'],
    production:['Monitor produzione','Mostra lo stato reale delle lavorazioni in corso e di quelle da avviare.','Avvia, metti in pausa, aggiorna o chiudi una produzione registrando quantità prodotte, scarti e operatore.'],
    presses:['Presse e stampi','Raccoglie la configurazione delle macchine e degli stampi utilizzati in reparto.','Verifica disponibilità e associazioni macchina/stampo prima di pianificare o avviare una lavorazione.'],
    sheets:['Fogli produzione','Conserva i fogli operativi collegati alle singole lavorazioni.','Consulta righe, quantità, operatori e stato del foglio; usalo come riferimento durante la produzione.'],
    warehouse:['Magazzino','Controlla disponibilità fisiche, lotti e movimenti generati dalla produzione.','Verifica ciò che è realmente disponibile prima di preparare carichi e consegne.'],
    inventory:['Giacenze','Raccoglie le giacenze operative utilizzate nei flussi di produzione.','Aggiorna quantità e soglie quando necessario e usa le criticità per prevenire fermi.'],
    iml:['Giacenze IML','Controlla disponibilità, riservato, fabbisogno e scorta minima delle etichette.','Individua subito IML critici o esauriti e aggiorna le quantità quando arriva nuovo materiale.'],
    trace:['Tracciabilità','Ricostruisce il percorso completo dall’ordine alla produzione fino a lotto, carico e consegna.','Cerca il riferimento dell’ordine e verifica tutti i passaggi collegati senza ricostruirli manualmente.'],
    reports:['Report e analisi','Raccoglie indicatori e riepiloghi del periodo per il controllo operativo.','Seleziona il periodo e usa i riepiloghi per leggere produzione, scarti, consegne e andamento.'],
    compliance:['Scadenze & Compliance','Gestisce scadenze aziendali, verifiche, formazione e rinnovi.','Registra la prossima scadenza e il responsabile; evita di inserire diagnosi o dati clinici sensibili.'],
    admin:['Amministrazione','Raccoglie le attività documentali e amministrative collegate ai flussi operativi.','Controlla ciò che è pronto per DDT, consegna o chiusura e completa la parte amministrativa senza duplicare i dati.'],
    settings:['Impostazioni','Raccoglie le preferenze operative della piattaforma.','Modifica solo le impostazioni necessarie al funzionamento dell’azienda e dei relativi flussi.'],
    companySettings:['Configurazione azienda','Permette di aggiornare dati aziendali e importare le informazioni esistenti senza ripartire da zero.','Compila l’anagrafica, esporta un backup Excel oppure importa clienti, prodotti, ordini, macchine, stampi, IML e scadenze.']
  };
  let tourResizeBound=false,tourActive=false;

  function ensureGuideUI(){
    const old=$('#v116GuideDialog');if(old)old.remove();
    if(!$('#v116TourLayer'))document.body.insertAdjacentHTML('beforeend',`<div class="v116-tour-layer" id="v116TourLayer" aria-live="polite">
      <div class="v116-tour-mask" id="v116MaskTop"></div><div class="v116-tour-mask" id="v116MaskLeft"></div><div class="v116-tour-mask" id="v116MaskRight"></div><div class="v116-tour-mask" id="v116MaskBottom"></div>
      <div class="v116-tour-ring" id="v116TourRing"></div><div class="v116-tour-tag" id="v116TourTag"><i></i><span>Area evidenziata</span></div>
      <div class="v116-tour-bar" id="v116TourBar">
        <div class="v116-tour-count"><div><b id="v116TourNow">1</b><span id="v116TourTotal">di 1</span></div></div>
        <div class="v116-tour-copy"><span class="eyebrow">Manuale dinamico · area evidenziata</span><h3 id="v116GuideTitle">Benvenuto</h3><p id="v116GuideText"></p><p class="how" id="v116GuideHow"></p></div>
        <div class="v116-tour-actions"><button class="btn" type="button" id="v116GuidePrev" onclick="SPDeliveryV116.prevTour()">Indietro</button><button class="btn" type="button" onclick="SPDeliveryV116.closeGuide()">Esci</button><button class="btn primary" type="button" id="v116GuideNext" onclick="SPDeliveryV116.nextTour()">Avanti</button></div>
        <div class="v116-tour-progress"><i id="v116GuideProgress" style="width:0%"></i></div>
      </div></div>`);
    if(!$('#v116FirstHelp'))document.body.insertAdjacentHTML('beforeend',`<div class="v116-first" id="v116FirstHelp"><b>Vuoi vedere come funziona la piattaforma?</b><p>Avvia il manuale dinamico: aprirà i moduli uno alla volta, evidenzierà l’area spiegata e ti mostrerà le istruzioni nella barra in basso. Nessun dato viene modificato.</p><div class="actions"><button class="btn primary" type="button" onclick="SPDeliveryV116.startTour(true)">Avvia guida</button><button class="btn" type="button" onclick="SPDeliveryV116.dismissIntro()">Più tardi</button></div></div>`);
    if(!tourResizeBound){tourResizeBound=true;window.addEventListener('resize',()=>tourActive&&updateSpotlight(),{passive:true});window.addEventListener('scroll',()=>tourActive&&updateSpotlight(),{passive:true,capture:true})}
  }
  function navItems(){
    let arr=[];try{if(typeof NAV!=='undefined'&&Array.isArray(NAV[role()]))arr=NAV[role()].filter(x=>x&&x[0]&&x[0]!==VIEW)}catch(_){ }
    const seen=new Set();return arr.filter(x=>{if(seen.has(x[0]))return false;seen.add(x[0]);return true}).map(x=>({view:x[0],label:guideText[x[0]]?.[0]||x[2]||x[0],text:guideText[x[0]]?.[1]||(typeof META!=='undefined'&&META[x[0]]?.[1])||'Apri il modulo per vedere le funzioni disponibili.',how:guideText[x[0]]?.[2]||'Usa questa schermata seguendo il flusso operativo previsto per il tuo ruolo.'}));
  }
  function tourTarget(item){
    if(!item)return null;
    const view=$(`#${item.view}View`);if(view&&getComputedStyle(view).display!=='none')return view;
    const active=$(`[data-view="${item.view}"].active`)||$(`[data-view="${item.view}"]`);if(active)return active;
    return $('.content')||$('.main')||document.body;
  }
  function openTourView(item){
    if(!item?.view)return;
    try{if(typeof navTo==='function')navTo(item.view)}catch(_){ }
  }
  function updateSpotlight(){
    if(!tourActive)return;const item=tourItems[tourIndex],el=tourTarget(item);if(!el)return;
    const r=el.getBoundingClientRect(),pad=8,vw=window.innerWidth,vh=window.innerHeight;
    const bar=$('#v116TourBar')?.getBoundingClientRect();const reserved=bar?Math.max(0,vh-bar.top+8):120;
    let x=Math.max(8,r.left-pad),y=Math.max(8,r.top-pad),w=Math.min(vw-16,Math.max(70,r.width+pad*2)),h=Math.max(54,r.height+pad*2);
    if(x+w>vw-8)w=vw-8-x;if(y+h>vh-reserved)h=Math.max(54,vh-reserved-y-8);
    if(h<90&&r.height>120){try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){};setTimeout(updateSpotlight,180);return}
    const top=$('#v116MaskTop'),left=$('#v116MaskLeft'),right=$('#v116MaskRight'),bottom=$('#v116MaskBottom'),ring=$('#v116TourRing'),tag=$('#v116TourTag');
    if(top)Object.assign(top.style,{left:'0px',top:'0px',width:vw+'px',height:y+'px'});
    if(left)Object.assign(left.style,{left:'0px',top:y+'px',width:x+'px',height:h+'px'});
    if(right)Object.assign(right.style,{left:(x+w)+'px',top:y+'px',width:Math.max(0,vw-x-w)+'px',height:h+'px'});
    if(bottom)Object.assign(bottom.style,{left:'0px',top:(y+h)+'px',width:vw+'px',height:Math.max(0,vh-y-h)+'px'});
    if(ring)Object.assign(ring.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
    if(tag){const tw=Math.min(260,Math.max(130,w));let ty=y+10,tx=x+12;if(y<48)ty=y+h-38;Object.assign(tag.style,{left:Math.min(vw-tw-10,tx)+'px',top:Math.max(8,ty)+'px'});tag.querySelector('span').textContent=item.label}
  }
  function renderTour(){
    const item=tourItems[tourIndex];if(!item)return;openTourView(item);
    $('#v116GuideTitle').textContent=item.label;$('#v116GuideText').textContent=item.text;$('#v116GuideHow').innerHTML=`<b>Cosa fare qui:</b> ${esc(item.how)}`;$('#v116TourNow').textContent=String(tourIndex+1);$('#v116TourTotal').textContent=`di ${tourItems.length}`;$('#v116GuideProgress').style.width=`${Math.round((tourIndex+1)/tourItems.length*100)}%`;$('#v116GuidePrev').disabled=tourIndex===0;$('#v116GuideNext').textContent=tourIndex===tourItems.length-1?'Completa guida':'Avanti';
    setTimeout(()=>{const el=tourTarget(item);if(el&&el!==document.body){try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){}}setTimeout(updateSpotlight,180)},100);
  }
  function startTour(fromIntro=false){
    ensureGuideUI();if(fromIntro)dismissIntro(true);tourItems=navItems();if(canConfigure()&&!tourItems.some(x=>x.view===VIEW))tourItems.push({view:VIEW,label:guideText.companySettings[0],text:guideText.companySettings[1],how:guideText.companySettings[2]});if(!tourItems.length){alert('La guida sarà disponibile dopo l’accesso a un reparto o a un’area ufficio.');return}tourIndex=0;tourActive=true;$('#v116TourLayer')?.classList.add('show');renderTour();
  }
  function nextTour(){if(tourIndex>=tourItems.length-1){finishTour();return}tourIndex++;renderTour()}
  function prevTour(){if(tourIndex<=0)return;tourIndex--;renderTour()}
  function closeGuide(){tourActive=false;$('#v116TourLayer')?.classList.remove('show')}
  function guideKey(suffix){return `poi_v116_${suffix}_${role()||'guest'}_${currentCompany()||safeCompany()}`}
  function finishTour(){localStorage.setItem(guideKey('tour_done'),'1');closeGuide();try{toast('Guida completata. Puoi riaprirla in qualsiasi momento dal pulsante “Guida”.')}catch(_){} }
  function resetGuide(){for(const k of Object.keys(localStorage)){if(k.startsWith('poi_v116_intro_seen_')||k.startsWith('poi_v116_tour_done_'))localStorage.removeItem(k)}alert('Guida primo accesso ripristinata. Al prossimo accesso verrà proposta di nuovo.')}
  function dismissIntro(silent=false){localStorage.setItem(guideKey('intro_seen'),'1');$('#v116FirstHelp')?.classList.remove('show');if(!silent)try{toast('La guida resta disponibile dal pulsante “Guida”.')}catch(_){} }
  function maybeIntro(){ensureGuideUI();if(!role()||tourActive)return;const k=guideKey('intro_seen');if(!localStorage.getItem(k))$('#v116FirstHelp')?.classList.add('show')}

  function decorateHelp(){
    let b=$('#v116HelpBtn');if(!b){b=document.createElement('button');b.id='v116HelpBtn';b.className='v116-help';b.type='button';b.innerHTML='<span class="v116-help-dot">?</span> Guida';b.onclick=()=>startTour(false);const top=$('.topbar');if(top){const profile=$('.profile',top);(profile||top.lastElementChild)?.insertAdjacentElement('beforebegin',b)}else{b.style.position='fixed';b.style.right='14px';b.style.bottom='14px';b.style.zIndex='9000';document.body.appendChild(b)}}b.classList.toggle('show',!!role());
  }
  function decorateNomyraAdmin(){
    const root=$('#poi113Nomyra');if(!root||!root.classList.contains('open')||$('#v116NomyraConfig',root))return;const target=$('#poi113AdminTabs',root)||root.querySelector('.poi113-admin-grid');if(!target)return;const el=document.createElement('div');el.id='v116NomyraConfig';el.className='v116-admin-shortcut';el.innerHTML='<div><b>Configurazione dati azienda</b><span>Import Excel, anagrafica e avvio guidato.</span></div><button type="button" class="btn small">Apri</button>';el.querySelector('button').onclick=()=>{root.classList.remove('open');try{if(typeof setRole==='function')setRole('admin');if(typeof navTo==='function')navTo(VIEW)}catch(_){alert('Apri l’area Amministrazione e seleziona “Configurazione azienda”.')}};target.insertAdjacentElement('afterend',el);
  }

  function patchRender(){
    try{const old=window.renderCurrent||renderCurrent;if(typeof old==='function'&&!old.__v116){const w=function(){if(typeof currentView!=='undefined'&&currentView===VIEW){renderConfig();decorateHelp();return}const out=old.apply(this,arguments);setTimeout(decorateHelp,0);return out};w.__v116=true;window.renderCurrent=w;renderCurrent=w}}catch(e){console.warn('[V11.6] render patch',e)}
    try{const oldNav=window.renderNav||renderNav;if(typeof oldNav==='function'&&!oldNav.__v116){const w=function(){const out=oldNav.apply(this,arguments);setTimeout(decorateHelp,0);return out};w.__v116=true;window.renderNav=w;renderNav=w}}catch(e){console.warn('[V11.6] nav patch',e)}
  }
  function version(){document.body.dataset.deliveryBuild='PIATTAFORMA-GRUPPO-V11.6.3';$$('.version-badge').forEach(x=>x.textContent=VERSION)}
  function boot(){ensureData();injectStyles();ensureView();ensureGuideUI();addNav();patchRender();version();try{if(typeof renderNav==='function')renderNav()}catch(_){}decorateHelp();setTimeout(()=>{addNav();decorateHelp();decorateNomyraAdmin();maybeIntro();version()},900);setInterval(()=>{decorateHelp();decorateNomyraAdmin();if(role())maybeIntro()},1800)}

  window.SPDeliveryV116={render:renderConfig,setCompany,saveCompany,previewExcel,applyImport,restoreImport,exportExcel,downloadTemplate,startTour,nextTour,prevTour,closeGuide,resetGuide,dismissIntro};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ===== Smart Pack · Multiplast — V11.6.2 TRACCIABILITÀ ORIGINE ORDINE =====
   - Origine ordine: Chiamata / E-mail / Altro
   - Per ordini Gmail conserva riferimenti al messaggio originale
   - Link "Apri e-mail originale" quando esiste un riferimento Gmail utilizzabile
   - Storico origine nella scheda di tracciabilità
*/
(()=>{
  'use strict';
  if(window.SPOrderSourceV1162)return;

  const VERSION='V11.6.2';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowIso=()=>new Date().toISOString();
  let pendingEmailSource=null;
  let openWrapped=false;

  function actor(){
    try{
      const e=JSON.parse(sessionStorage.getItem('poi_v113_employee')||'null');
      if(e?.display_name)return e.display_name;
      if(e?.username)return e.username;
    }catch(_){}
    try{
      const p=window.POICloudV10?.getProfile?.();
      if(p?.display_name)return p.display_name;
      if(p?.name)return p.name;
      if(p?.email)return p.email;
    }catch(_){}
    try{
      const r=typeof currentRole!=='undefined'?currentRole:'';
      return ({director:'Gestione Smart Pack',manager:'Responsabile Produzione Multiplast',admin:'Amministrazione',worker:'Produzione Smart Pack',mpworker:'Produzione Multiplast'}[r]||r||'Utente piattaforma');
    }catch(_){return 'Utente piattaforma'}
  }

  function sourceLabel(v){
    return ({call:'Chiamata',email:'E-mail',other:'Altro'}[String(v||'').toLowerCase()]||String(v||'Non registrata'));
  }

  function normalizeRfc(v=''){
    v=String(v||'').trim();
    if(!v)return '';
    return v.startsWith('<')?v:`<${v}>`;
  }

  function gmailUrl(meta={}){
    const rfc=normalizeRfc(meta.rfcMessageId||meta.rfc822MessageId||meta.internetMessageId||'');
    if(rfc){
      const q=`rfc822msgid:${rfc}`;
      return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(q)}`;
    }
    const thread=String(meta.gmailThreadId||meta.threadId||'').trim();
    if(thread)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(thread)}`;
    const mid=String(meta.gmailMessageId||meta.messageId||'').trim();
    if(mid)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(mid)}`;

    const parts=[];
    if(meta.from)parts.push(`from:${meta.from}`);
    if(meta.subject)parts.push(`subject:"${String(meta.subject).replace(/"/g,'')}"`);
    if(parts.length)return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(parts.join(' '))}`;
    return '';
  }

  function draftMeta(d){
    if(!d)return null;
    const meta={
      sourceType:'email',
      sourceLabel:'E-mail',
      draftId:d.id||'',
      receivedAt:d.receivedAt||d.internalDate||d.date||'',
      verifiedAt:d.verifiedAt||'',
      from:d.from||d.sender||'',
      subject:d.subject||'',
      gmailMessageId:d.gmailMessageId||d.messageId||'',
      gmailThreadId:d.gmailThreadId||d.threadId||'',
      rfcMessageId:d.rfcMessageId||d.rfc822MessageId||d.internetMessageId||'',
      gmailAccount:d.gmailAccount||d.google_email||'',
      sourceText:d.sourceText||'',
      preparedAt:nowIso()
    };
    meta.gmailUrl=gmailUrl(meta);
    return meta;
  }

  function ensureSourceDialog(){
    if($('#v1162OrderSourceDialog'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <dialog id="v1162OrderSourceDialog" class="v1162-source-dialog">
        <div class="modal-head">
          <div><span class="eyebrow">Tracciabilità ordine</span><h3 id="v1162SourceTitle">Origine ordine</h3><p id="v1162SourceSub"></p></div>
          <button type="button" class="close" onclick="document.getElementById('v1162OrderSourceDialog').close()">×</button>
        </div>
        <div class="modal-body"><div id="v1162SourceBody"></div></div>
        <div class="modal-actions">
          <a id="v1162OpenEmail" class="btn primary" target="_blank" rel="noopener" style="display:none">Apri e-mail originale ↗</a>
          <button type="button" class="btn" onclick="document.getElementById('v1162OrderSourceDialog').close()">Chiudi</button>
        </div>
      </dialog>`);
  }

  function injectStyles(){
    if($('#v1162SourceStyles'))return;
    const st=document.createElement('style');
    st.id='v1162SourceStyles';
    st.textContent=`
      .v1162-order-source-field{grid-column:1/-1}
      .v1162-source-preview{margin-top:8px;padding:10px 12px;border:1px solid #d9e6eb;border-radius:11px;background:#f7fafb;color:#536a75;font-size:9px;line-height:1.5}
      .v1162-source-preview b{color:#17394a}
      .v1162-source-preview a{color:#176b8c;font-weight:900;text-decoration:none}
      .v1162-source-preview a:hover{text-decoration:underline}
      .v1162-source-strip{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0 0;padding:9px 11px;border-radius:11px;background:#f6f9fa;border:1px solid #dfe8eb;font-size:8px;color:#59707b}
      .v1162-source-strip b{color:#17394a}
      .v1162-source-strip .mail{color:#176b8c;font-weight:900;text-decoration:none}
      .v1162-source-chip{display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;background:#eaf4f7;color:#17617e;font-size:7px;font-weight:950}
      .v1162-source-dialog{width:min(660px,94vw)}
      .v1162-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .v1162-source-box{padding:11px 12px;border:1px solid #dce7ea;border-radius:12px;background:#fff}
      .v1162-source-box.full{grid-column:1/-1}
      .v1162-source-box span{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#748a94;font-weight:900}
      .v1162-source-box b{display:block;margin-top:4px;font-size:10px;color:#17394a;overflow-wrap:anywhere}
      .v1162-timeline{margin-top:14px;border-top:1px solid #e3eaed;padding-top:10px}
      .v1162-event{display:grid;grid-template-columns:135px 1fr;gap:10px;padding:7px 0;font-size:8px}
      .v1162-event time{color:#6d818a}
      .v1162-event b{color:#17394a}
      @media(max-width:720px){.v1162-source-grid{grid-template-columns:1fr}.v1162-source-box.full{grid-column:auto}.v1162-event{grid-template-columns:1fr;gap:2px}}
    `;
    document.head.appendChild(st);
  }

  function sourceForParent(parent){
    const rows=(window.state?.orders||[]).filter(o=>String(o.parent)===String(parent));
    return rows.find(o=>o.orderSourceV1162)?.orderSourceV1162
      || rows.find(o=>o.sourceTypeV1162)?.sourceTypeV1162 && rows.find(o=>o.sourceTypeV1162)
      || null;
  }

  function prettyDate(v){
    if(!v)return '—';
    try{return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
    catch(_){return String(v)}
  }

  function openSource(parent){
    ensureSourceDialog();
    const rows=(window.state?.orders||[]).filter(o=>String(o.parent)===String(parent));
    const row=rows.find(o=>o.orderSourceV1162)||rows[0];
    const s=row?.orderSourceV1162||null;
    $('#v1162SourceTitle').textContent=`Origine · ${parent}`;
    if(!s){
      $('#v1162SourceSub').textContent='Per questo ordine storico non è stata registrata l’origine.';
      $('#v1162SourceBody').innerHTML='<div class="v1162-source-box"><b>Origine non disponibile</b></div>';
      $('#v1162OpenEmail').style.display='none';
      $('#v1162OrderSourceDialog').showModal();return;
    }
    $('#v1162SourceSub').textContent=`${sourceLabel(s.type)} · registrato ${prettyDate(s.recordedAt)}`;
    const email=s.email||{};
    const history=Array.isArray(s.history)?s.history:[];
    $('#v1162SourceBody').innerHTML=`
      <div class="v1162-source-grid">
        <div class="v1162-source-box"><span>Origine</span><b>${esc(sourceLabel(s.type))}</b></div>
        <div class="v1162-source-box"><span>Registrato da</span><b>${esc(s.recordedBy||'—')}</b></div>
        <div class="v1162-source-box"><span>Data registrazione</span><b>${esc(prettyDate(s.recordedAt))}</b></div>
        ${s.type==='email'?`<div class="v1162-source-box"><span>E-mail ricevuta</span><b>${esc(prettyDate(email.receivedAt))}</b></div>
        <div class="v1162-source-box"><span>Mittente</span><b>${esc(email.from||'—')}</b></div>
        <div class="v1162-source-box"><span>Verifica bozza</span><b>${esc(prettyDate(email.verifiedAt))}</b></div>
        <div class="v1162-source-box full"><span>Oggetto</span><b>${esc(email.subject||'—')}</b></div>
        <div class="v1162-source-box full"><span>Riferimento Gmail</span><b>${esc(email.rfcMessageId||email.gmailThreadId||email.gmailMessageId||'Non disponibile')}</b></div>`:''}
      </div>
      ${history.length?`<div class="v1162-timeline">${history.map(h=>`<div class="v1162-event"><time>${esc(prettyDate(h.at))}</time><div><b>${esc(h.action||'Evento')}</b>${h.detail?`<div>${esc(h.detail)}</div>`:''}</div></div>`).join('')}</div>`:''}`;
    const btn=$('#v1162OpenEmail');
    const url=s.type==='email'?(email.gmailUrl||gmailUrl(email)):'';
    if(url){btn.href=url;btn.style.display='inline-flex'}else{btn.style.display='none';btn.removeAttribute('href')}
    $('#v1162OrderSourceDialog').showModal();
  }

  function pending(){
    if(pendingEmailSource)return pendingEmailSource;
    try{return JSON.parse(sessionStorage.getItem('poi_v1162_pending_order_source')||'null')}catch(_){return null}
  }
  function setPending(v){
    pendingEmailSource=v||null;
    if(v)sessionStorage.setItem('poi_v1162_pending_order_source',JSON.stringify(v));
    else sessionStorage.removeItem('poi_v1162_pending_order_source');
  }

  function patchOrderForm(){
    const f=$('#orderForm');if(!f)return;
    if(!f.querySelector('[name="orderSourceTypeV1162"]')){
      const label=document.createElement('label');
      label.className='field v1162-order-source-field';
      label.innerHTML=`Origine ordine
        <select name="orderSourceTypeV1162" required>
          <option value="call">Chiamata</option>
          <option value="email">E-mail</option>
          <option value="other">Altro</option>
        </select>
        <div class="v1162-source-preview" id="v1162OrderSourcePreview">Indica come è stato ricevuto l’ordine.</div>`;
      const notes=f.elements.notes;
      const notesLabel=notes?.closest?.('label');
      (notesLabel?.parentElement||f.querySelector('.form-grid')||f).insertBefore(label,notesLabel||null);
    }

    const sel=f.elements.orderSourceTypeV1162;
    const p=pending();
    if(p?.sourceType==='email'){
      sel.value='email';
      const pr=$('#v1162OrderSourcePreview',f);
      const url=p.gmailUrl||gmailUrl(p);
      if(pr)pr.innerHTML=`<b>E-mail sincronizzata</b>${p.from?` · ${esc(p.from)}`:''}${p.subject?`<br>${esc(p.subject)}`:''}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">Apri originale ↗</a>`:''}`;
    }else{
      const pr=$('#v1162OrderSourcePreview',f);
      if(pr&&!pr.dataset.boundText)pr.textContent='Indica se l’ordine è arrivato per chiamata, e-mail o altro canale.';
    }

    if(!sel.dataset.v1162Bound){
      sel.dataset.v1162Bound='1';
      sel.addEventListener('change',()=>{
        const pr=$('#v1162OrderSourcePreview',f);
        if(sel.value==='email'){
          const pm=pending();
          if(pm){
            const url=pm.gmailUrl||gmailUrl(pm);
            pr.innerHTML=`<b>E-mail sincronizzata</b>${pm.from?` · ${esc(pm.from)}`:''}${pm.subject?`<br>${esc(pm.subject)}`:''}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">Apri originale ↗</a>`:''}`;
          }else pr.textContent='Ordine ricevuto via e-mail. Nessun collegamento Gmail automatico disponibile per questo inserimento manuale.';
        }else if(sel.value==='call')pr.textContent='Ordine ricevuto tramite chiamata. Verranno registrati data/ora e utente che crea l’ordine.';
        else pr.textContent='Ordine ricevuto tramite un altro canale. Verranno registrati data/ora e utente.';
      });
    }

    if(!f.dataset.v1162Submit){
      f.dataset.v1162Submit='1';
      f.addEventListener('submit',function(){
        const beforeRefs=new Set(window.state?.orders||[]);
        const beforeKeys=new Set((window.state?.orders||[]).map(o=>`${o.id||''}|${o.code||''}|${o.parent||''}`));
        const selected=String(this.elements.orderSourceTypeV1162?.value||'call');
        const mail=pending();
        const createdAt=nowIso();
        const who=actor();

        setTimeout(()=>{
          const all=window.state?.orders||[];
          let created=all.filter(o=>!beforeRefs.has(o));
          if(!created.length){
            created=all.filter(o=>!beforeKeys.has(`${o.id||''}|${o.code||''}|${o.parent||''}`));
          }
          if(!created.length)return;

          const typ=selected==='email'?'email':selected==='other'?'other':'call';
          const e=typ==='email'&&mail?{
            receivedAt:mail.receivedAt||'',
            verifiedAt:mail.verifiedAt||'',
            from:mail.from||'',
            subject:mail.subject||'',
            gmailMessageId:mail.gmailMessageId||'',
            gmailThreadId:mail.gmailThreadId||'',
            rfcMessageId:mail.rfcMessageId||'',
            gmailAccount:mail.gmailAccount||'',
            gmailUrl:mail.gmailUrl||gmailUrl(mail)
          }:null;
          const hist=[];
          if(e?.receivedAt)hist.push({at:e.receivedAt,action:'E-mail ordine ricevuta',detail:e.from||e.subject||''});
          if(e?.verifiedAt)hist.push({at:e.verifiedAt,action:'Bozza e-mail verificata',detail:e.subject||''});
          hist.push({at:createdAt,action:'Ordine registrato in piattaforma',detail:`Origine: ${sourceLabel(typ)} · ${who}`});
          const source={type:typ,label:sourceLabel(typ),recordedAt:createdAt,recordedBy:who,email:e,history:hist};

          for(const o of created){
            o.orderSourceV1162=source;
            o.sourceTypeV1162=typ;
            o.sourceRecordedAtV1162=createdAt;
            o.sourceRecordedByV1162=who;
            if(e){
              o.sourceEmailFromV1162=e.from;
              o.sourceEmailSubjectV1162=e.subject;
              o.sourceEmailReceivedAtV1162=e.receivedAt;
              o.sourceGmailMessageIdV1162=e.gmailMessageId;
              o.sourceGmailThreadIdV1162=e.gmailThreadId;
              o.sourceRfcMessageIdV1162=e.rfcMessageId;
              o.sourceEmailUrlV1162=e.gmailUrl;
            }
          }
          if(mail?.draftId){
            const d=(window.state?.emailOrderDraftsV115||[]).find(x=>String(x.id)===String(mail.draftId));
            if(d){
              d.linkedOrderParentV1162=created[0]?.parent||'';
              d.linkedOrderCodeV1162=created[0]?.code||'';
            }
          }
          try{if(typeof save==='function')save()}catch(_){}
          try{if(typeof toast==='function')toast(`Origine ordine registrata · ${sourceLabel(typ)}`)}catch(_){}
          setPending(null);
          setTimeout(decorate,50);
        },120);
      },true);
    }
  }

  function patchOpenNewOrder(){
    if(openWrapped)return;
    const old=window.openNewOrder;
    if(typeof old!=='function')return;
    const wrapped=function(){
      const p=pending();
      if(!(p&&p.sourceType==='email'&&Date.now()-new Date(p.preparedAt||0).getTime()<120000))setPending(null);
      const r=old.apply(this,arguments);
      setTimeout(patchOrderForm,20);
      return r;
    };
    wrapped.__v1162=true;
    window.openNewOrder=wrapped;
    try{openNewOrder=wrapped}catch(_){}
    openWrapped=true;
  }

  function patchEmailConversion(){
    const api=window.SPPlannerV115;
    if(!api||api.__v1162EmailPatched||typeof api.toOrder!=='function')return;
    const old=api.toOrder;
    api.toOrder=function(id){
      const d=(window.state?.emailOrderDraftsV115||[]).find(x=>String(x.id)===String(id));
      if(d)setPending(draftMeta(d));
      const r=old.apply(this,arguments);
      setTimeout(()=>{
        patchOrderForm();
        const f=$('#orderForm');
        if(f?.elements?.orderSourceTypeV1162){
          f.elements.orderSourceTypeV1162.value='email';
          f.elements.orderSourceTypeV1162.dispatchEvent(new Event('change',{bubbles:true}));
        }
      },130);
      return r;
    };
    api.__v1162EmailPatched=true;
  }

  function decorateEmailDrafts(){
    $$('.v115-email-draft').forEach(card=>{
      if(card.dataset.v1162Trace==='1')return;
      const b=[...card.querySelectorAll('button')].find(x=>String(x.getAttribute('onclick')||'').includes('editEmail('));
      const m=String(b?.getAttribute('onclick')||'').match(/editEmail\('([^']+)'\)/);
      if(!m)return;
      const d=(window.state?.emailOrderDraftsV115||[]).find(x=>String(x.id)===m[1]);
      if(!d)return;
      const url=gmailUrl(d);
      if(!url)return;
      card.dataset.v1162Trace='1';
      const actions=card.lastElementChild;
      if(actions){
        const a=document.createElement('a');
        a.className='btn small';
        a.target='_blank';a.rel='noopener';a.href=url;a.textContent='Apri e-mail ↗';
        actions.insertBefore(a,actions.firstChild);
      }
    });
  }

  function decorateOrders(){
    $$('#ordersCardsV106 .v106-admin-card').forEach(card=>{
      const over=card.querySelector('.v106-overline');
      const m=String(over?.textContent||'').match(/ORDINE\s+(.+)/i);
      if(!m)return;
      const parent=m[1].trim();
      const rows=(window.state?.orders||[]).filter(o=>String(o.parent)===parent);
      const s=rows.find(o=>o.orderSourceV1162)?.orderSourceV1162;
      const old=card.querySelector('.v1162-source-strip');
      if(old)old.remove();
      if(!s)return;
      const url=s.type==='email'?(s.email?.gmailUrl||gmailUrl(s.email||{})):'';
      const div=document.createElement('div');
      div.className='v1162-source-strip';
      div.innerHTML=`<span class="v1162-source-chip">${esc(sourceLabel(s.type))}</span><b>Origine ordine</b><span>${esc(prettyDate(s.type==='email'?(s.email?.receivedAt||s.recordedAt):s.recordedAt))}</span>${url?`<a class="mail" href="${esc(url)}" target="_blank" rel="noopener">Apri e-mail ↗</a>`:''}<button class="btn small" type="button" onclick="SPOrderSourceV1162.open('${esc(parent)}')">Dettagli origine</button>`;
      const actions=card.querySelector('.v106-actions');
      if(actions)card.insertBefore(div,actions);else card.appendChild(div);
    });
  }

  function decorate(){
    injectStyles();ensureSourceDialog();patchOpenNewOrder();patchEmailConversion();patchOrderForm();decorateEmailDrafts();decorateOrders();
    document.body.dataset.traceability='V11.6.2';
  }

  function boot(){
    decorate();
    setTimeout(decorate,350);
    setTimeout(decorate,1100);
    setInterval(decorate,1600);
  }

  window.SPOrderSourceV1162={open:openSource,gmailUrl,refresh:decorate,version:VERSION};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ===== Smart Pack · Multiplast — V11.6.3 FLUSSO E-MAIL CORRETTO =====
   - Accetta ordine Gmail = crea realmente ordine + codice + foglio produzione.
   - Solo ultimo messaggio del thread tramite backend v8.
   - Fornitori separati: conferme IML non entrano mai negli ordini cliente.
   - Codici master importati dall'Excel restano autorevoli (SPRING / IML aziendale).
*/
(()=>{
  'use strict';
  if(window.SPMailFlowV1163)return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number(v||0),iso=()=>new Date().toISOString(),uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const cloud=()=>window.POICloudV10?.getClient?.()||null;
  const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n(v));

  function gmailSearchUrl(m={}){
    const rfc=String(m.rfcMessageId||'').trim();
    if(rfc)return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent('rfc822msgid:'+rfc)}`;
    const tid=String(m.gmailThreadId||'').trim();if(tid)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(tid)}`;
    const mid=String(m.gmailMessageId||'').trim();if(mid)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(mid)}`;
    return '';
  }
  async function syncGmailV1163(){
    const sb=cloud();if(!sb){alert('Connessione cloud non disponibile.');return}
    try{
      let {data,error}=await sb.functions.invoke('poi-gmail-orders-v8',{body:{action:'sync',company_code:'smartpack'}});
      if(error||data?.error)throw error||new Error(data?.error||'sync_failed');
      state.emailOrderDraftsV115=Array.isArray(state.emailOrderDraftsV115)?state.emailOrderDraftsV115:[];
      state.emailIMLConfirmationsV1163=Array.isArray(state.emailIMLConfirmationsV1163)?state.emailIMLConfirmationsV1163:[];
      const existing=new Set(state.emailOrderDraftsV115.map(x=>x.id||`${x.gmailMessageId}_${x.gmailItemIndex||1}`));
      let added=0;
      for(const raw of data.drafts||[]){
        const d={...raw,status:raw.status||'Da verificare'};const key=d.id||`${d.gmailMessageId}_${d.gmailItemIndex||1}`;
        if(d.gmailThreadId)state.emailOrderDraftsV115=state.emailOrderDraftsV115.filter(x=>!(x.gmailThreadId===d.gmailThreadId&&x.gmailMessageId!==d.gmailMessageId&&!x.linkedOrderParentV1163));
        if(existing.has(key))continue;
        state.emailOrderDraftsV115.unshift(d);existing.add(key);added++;
      }
      const cset=new Set(state.emailIMLConfirmationsV1163.map(x=>x.gmailMessageId||x.id));let cadded=0;
      for(const raw of data.imlConfirmations||[]){const k=raw.gmailMessageId||raw.id;if(raw.gmailThreadId)state.emailOrderDraftsV115=state.emailOrderDraftsV115.filter(x=>!(x.gmailThreadId===raw.gmailThreadId&&!x.linkedOrderParentV1163));if(cset.has(k))continue;state.emailIMLConfirmationsV1163.unshift(raw);cset.add(k);cadded++}
      try{addAudit('Gmail sincronizzato','Inbox ordini',`${added} ordini cliente · ${cadded} conferme fornitori IML`)}catch(_){ }
      try{save()}catch(_){ }
      try{toast(`${added} ordini cliente · ${cadded} conferme IML nuove`)}catch(_){ }
      try{window.SPPlannerV115?.refreshOrdersEmail?.()}catch(_){ }
      decorateSupplierConfirmations();
      if(typeof currentView!=='undefined'&&currentView==='planner')try{window.SPPlannerV115?.refresh?.()}catch(_){ }
    }catch(e){alert('Sincronizzazione Gmail non riuscita: '+String(e?.message||e))}
  }

  function nextParent(){const nums=(state.orders||[]).map(o=>Number(String(o.parent||'').replace(/\D/g,''))).filter(Number.isFinite);return String((nums.length?Math.max(...nums):0)+1)}
  function exactIML(d){
    const arr=(state.imls||[]).filter(i=>{
      const cc=String(i.clientCode||'').trim(),pc=String(i.productCode||'').trim();
      return cc&&pc&&cc===String(d.clientCode||'')&&pc===String(d.productCode||'');
    });
    return arr.length===1?arr[0]:null;
  }
  function createSheet(parent,main,d){
    state.productionSheets=Array.isArray(state.productionSheets)?state.productionSheets:[];
    const existing=state.productionSheets.find(x=>String(x.parent)===String(parent)&&String(x.orderCode)===String(main.code));if(existing)return existing;
    const cap=String(main.liters||'').startsWith('3')?725:String(main.liters||'').startsWith('5')?880:400;
    let left=Math.max(0,n(main.productionRequiredQty!=null?main.productionRequiredQty:main.qty));
    if(left<=0)left=n(main.qty);
    const rows=[];let k=1;while(left>0){const pieces=Math.min(cap,left);rows.push({id:uid('row'),orderCode:main.code,imlCode:main.imlCode||'',pieces,packageLabel:'# '+k,lidColor:`${main.color||'BIANCO'} TAPPI`,status:'Da produrre',operatorProduction:'',operatorHandles:'',finishAt:'',notes:''});left-=pieces;k++}
    const sheet={id:uid('sheet'),sheetNo:1,sheetDate:new Date().toISOString().slice(0,10),productionDate:'',parent,client:main.client,clientCode:main.clientCode||'',product:main.product,productCode:main.productCode||'',imlCode:main.imlCode||'',orderCode:main.code,priority:main.priority||'Normale',packageType:main.packaging||'Cesta',rows,createdAt:iso(),createdBy:'Ordine e-mail',statusV106:'Aperto',sourceEmail:{gmailMessageId:d.gmailMessageId||'',gmailThreadId:d.gmailThreadId||'',rfcMessageId:d.rfcMessageId||'',subject:d.subject||'',from:d.from||'',receivedAt:d.receivedAt||''}};
    state.productionSheets.unshift(sheet);return sheet;
  }
  function attachSource(rows,d,parent,sheet){
    const src={type:'email',label:'E-mail',recordedAt:iso(),recordedBy:window.POICloudV10?.getProfile?.()?.email||'Utente ufficio',email:{receivedAt:d.receivedAt||'',verifiedAt:d.verifiedAt||'',from:d.from||'',subject:d.subject||'',gmailMessageId:d.gmailMessageId||'',gmailThreadId:d.gmailThreadId||'',rfcMessageId:d.rfcMessageId||'',gmailUrl:gmailSearchUrl(d)},history:[{at:d.receivedAt||iso(),action:'E-mail ordine ricevuta',detail:d.from||''},{at:d.verifiedAt||iso(),action:'Bozza verificata',detail:d.subject||''},{at:iso(),action:'Ordine creato dalla bozza e-mail',detail:`Ordine ${parent} · foglio produzione ${sheet?.id||''}`} ]};
    for(const o of rows){o.orderSourceV1162=src;o.sourceTypeV1162='email';o.sourceRecordedAtV1162=src.recordedAt;o.sourceRecordedByV1162=src.recordedBy;o.sourceEmailUrlV1162=src.email.gmailUrl}
  }
  function acceptEmailOrder(id){
    const d=(state.emailOrderDraftsV115||[]).find(x=>x.id===id);if(!d)return;
    if(d.status!=='Verificata'){alert('Prima verifica cliente, prodotto, quantità e consegna e premi “Salva verifica”.');window.SPPlannerV115?.editEmail?.(id);return}
    if(!d.clientCode||!d.productCode||!d.client||!d.product||!n(d.qty)){alert('Cliente/prodotto/quantità non sono completi.');return}
    if(d.linkedOrderParentV1163){alert(`Questa e-mail è già collegata all’ordine ${d.linkedOrderParentV1163}.`);return}
    if(!confirm(`Creare ora l’ordine per ${d.client} · ${fmt(d.qty)} pz?\nVerranno generati automaticamente codice ordine e foglio produzione.`))return;
    const parent=nextParent(),iml=exactIML(d),code=parent+'A',status=iml&&typeof available==='function'&&available(iml)<n(d.qty)?'In attesa IML':'Da preparare';
    if(iml)iml.reserved=n(iml.reserved)+n(d.qty);
    const main={id:code,code,parent,date:new Date().toISOString().slice(0,10),client:String(d.client).toUpperCase(),clientCode:d.clientCode,product:d.product,productCode:d.productCode,liters:d.liters||'',color:d.color||'BIANCO',imlCode:iml?.code||'',qty:n(d.qty),remaining:n(d.qty),delivered:0,status,dueDate:d.dueDate||'',packaging:'Cesta',notes:`Ordine creato da Gmail${d.orderRef?' · Rif. '+d.orderRef:''}`,priority:d.priority||'Normale',orderRef:d.orderRef||'',createdBy:'E-mail verificata',companyCode:'smartpack'};
    state.orders.push(main);
    const sheet=createSheet(parent,main,d);attachSource([main],d,parent,sheet);
    d.status='Convertita';d.convertedAt=iso();d.linkedOrderParentV1163=parent;d.linkedOrderCodeV1163=code;d.productionSheetIdV1163=sheet.id;
    try{addAudit('Ordine creato da Gmail',parent,`${d.clientCode} · ${d.productCode} · ${d.qty} pz`)}catch(_){ }
    try{save()}catch(_){ }
    try{toast(`Ordine ${parent} creato · foglio produzione generato`)}catch(_){ }
    try{if(typeof navTo==='function')navTo('orders')}catch(_){ }
    setTimeout(()=>{try{renderCurrent()}catch(_){ }try{window.SPOrderSourceV1162?.refresh?.()}catch(_){ }},80);
  }

  function ensureSupplierDialog(){
    if($('#v1163SupplierDialog'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="v1163SupplierDialog"><form id="v1163SupplierForm"><div class="modal-head"><div><span class="eyebrow">Gmail · fornitore</span><h3>Associa conferma a ordine IML</h3><p id="v1163SupplierInfo"></p></div><button type="button" class="close" onclick="document.getElementById('v1163SupplierDialog').close()">×</button></div><div class="modal-body"><label class="field">Ordine IML<select name="poId" required></select></label></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v1163SupplierDialog').close()">Annulla</button><button class="btn primary" type="submit">Associa conferma</button></div></form></dialog>`);
    $('#v1163SupplierForm').onsubmit=e=>{e.preventDefault();const id=e.currentTarget.dataset.confirmation,poId=e.currentTarget.elements.poId.value,c=(state.emailIMLConfirmationsV1163||[]).find(x=>x.id===id),po=(state.imlPurchaseOrders||[]).find(x=>x.id===poId);if(!c||!po)return;const url=gmailSearchUrl(c);po.supplierConfirmedAt=c.receivedAt||iso();po.supplierConfirmationSubject=c.subject||'';po.supplierConfirmationEmailLink=url;po.supplierConfirmationGmailMessageId=c.gmailMessageId||'';po.supplierConfirmationThreadId=c.gmailThreadId||'';po.supplierConfirmationRfcMessageId=c.rfcMessageId||'';po.supplierConfirmationStatus='Confermato dal fornitore';if(po.status==='Bozza')po.status='Inviato';c.status='Associata';c.linkedIMLOrderId=po.id;c.linkedAt=iso();try{addAudit('Conferma fornitore IML associata',po.id,c.subject||c.supplierName||'')}catch(_){ }try{save()}catch(_){ }$('#v1163SupplierDialog').close();decorateSupplierConfirmations();try{renderCurrent()}catch(_){ }};
  }
  function openAssociate(id){ensureSupplierDialog();const c=(state.emailIMLConfirmationsV1163||[]).find(x=>x.id===id);if(!c)return;const open=(state.imlPurchaseOrders||[]).filter(po=>!['Chiuso','Ricevuto','Annullato'].includes(String(po.status||'')));const same=open.filter(po=>String(po.supplier||'').toLowerCase().includes(String(c.supplierName||'').toLowerCase())||String(c.supplierName||'').toLowerCase().includes(String(po.supplier||'').toLowerCase()));const list=same.length?same:open;$('#v1163SupplierInfo').textContent=`${c.supplierName||c.from||'Fornitore'} · ${c.subject||''}`;const f=$('#v1163SupplierForm');f.dataset.confirmation=id;f.elements.poId.innerHTML='<option value="">Seleziona...</option>'+list.map(po=>`<option value="${esc(po.id)}">${esc(po.id)} · ${esc(po.supplier||'')} · ${esc(po.status||'')}</option>`).join('');$('#v1163SupplierDialog').showModal()}
  function discardSupplier(id){const c=(state.emailIMLConfirmationsV1163||[]).find(x=>x.id===id);if(!c)return;if(!confirm('Scartare questa conferma fornitore?'))return;c.status='Scartata';try{save()}catch(_){ }decorateSupplierConfirmations()}
  function decorateSupplierConfirmations(){
    const host=$('#v115OrdersEmailPanel');if(!host)return;let sec=$('#v1163SupplierConfirmations');if(sec)sec.remove();const arr=(state.emailIMLConfirmationsV1163||[]).filter(x=>!['Associata','Scartata'].includes(x.status));sec=document.createElement('section');sec.id='v1163SupplierConfirmations';sec.className='v115-orders-email';sec.style.marginTop='12px';sec.innerHTML=`<div class="v115-orders-email-top"><div><span class="v115-eyebrow">CONFERME FORNITORI · IML</span><h3>Messaggi fornitori separati dagli ordini cliente</h3><p>Qui arrivano esclusivamente conferme o aggiornamenti dei fornitori IML. Non possono essere trasformati in ordini cliente.</p><span class="v115-orders-email-count">${arr.length} da associare</span></div></div><div class="v115-email-list">${arr.map(c=>{const url=gmailSearchUrl(c);return `<article class="v115-email-draft"><div><span class="v115-over">FORNITORE · ${esc(c.supplierName||'Da verificare')}</span><h4>${esc(c.subject||'Conferma ordine IML')}</h4><p>${esc(c.from||'')} · ${c.receivedAt?esc(new Date(c.receivedAt).toLocaleString('it-IT')):''}</p><small>Analizzato solo l’ultimo messaggio della conversazione.</small></div><div class="v115-email-draft-actions">${url?`<a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">Apri e-mail ↗</a>`:''}<button class="btn small primary" type="button" onclick="SPMailFlowV1163.associate('${esc(c.id)}')">Associa ordine IML</button><button class="btn small danger" type="button" onclick="SPMailFlowV1163.discardSupplier('${esc(c.id)}')">Scarta</button></div></article>`}).join('')||'<div class="v115-empty">Nessuna conferma fornitore in attesa.</div>'}</div>`;host.insertAdjacentElement('afterend',sec)
  }

  async function syncSuppliersCloud(){
    const sb=cloud();if(!sb||!Array.isArray(state.supplierDirectory))return;
    try{const uid=window.POICloudV10?.getProfile?.()?.user_id||null;await sb.from('poi_app_segments').upsert({group_code:'smartpack-multiplast',segment_key:'supplierDirectory',data:state.supplierDirectory,updated_by:uid,updated_at:iso()},{onConflict:'group_code,segment_key'})}catch(e){console.warn('[V11.6.3] supplier cloud sync',e)}
  }
  function patchDeliveryImport(){
    const api=window.SPDeliveryV116;if(!api||api.__v1163)return;const old=api.applyImport;if(typeof old==='function'){api.applyImport=function(){const r=old.apply(this,arguments);setTimeout(syncSuppliersCloud,250);return r}}api.__v1163=true;
  }
  function repairConvertedDrafts(){for(const d of state.emailOrderDraftsV115||[]){if(d.status==='Convertita'&&!d.linkedOrderParentV1163)d.status='Verificata'}try{save()}catch(_){ }}
  function boot(){
    state.emailIMLConfirmationsV1163=Array.isArray(state.emailIMLConfirmationsV1163)?state.emailIMLConfirmationsV1163:[];
    window.SPMailFlowV1163={sync:syncGmailV1163,accept:acceptEmailOrder,associate:openAssociate,discardSupplier,refresh:decorateSupplierConfirmations};
    if(window.SPPlannerV115){window.SPPlannerV115.syncGmail=syncGmailV1163;window.SPPlannerV115.toOrder=(id)=>window.SPMPV1164?window.SPMPV1164.accept(id):acceptEmailOrder(id)}
    patchDeliveryImport();repairConvertedDrafts();ensureSupplierDialog();decorateSupplierConfirmations();
    setInterval(()=>{if(window.SPPlannerV115){window.SPPlannerV115.syncGmail=syncGmailV1163;window.SPPlannerV115.toOrder=(id)=>window.SPMPV1164?window.SPMPV1164.accept(id):acceptEmailOrder(id)}patchDeliveryImport();decorateSupplierConfirmations()},1600);
    document.body.dataset.mailFlow='V11.6.3';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* ===== V11.6.4 · MULTIPLAST SEPARATA + REGISTRO ORDINI SMART PACK ===== */
(()=>{
  'use strict';
  if(window.SPMPV1164)return;
  const VERSION='V11.6.4';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0);
  const iso=()=>new Date().toISOString();
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const company=()=>sessionStorage.getItem('poi_v113_company')||sessionStorage.getItem('nomyra_group_company_v92')||'';
  const officeRole=()=>sessionStorage.getItem('poi_v115_office_role')||sessionStorage.getItem('industrialos_role_session')||'';
  const isMP=()=>company()==='multiplast'||['manager','mpworker'].includes(officeRole());
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:4}).format(num(v));
  const nf=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(num(v));

  function saveSafe(){try{save()}catch(e){console.warn('[V11.6.4] save',e)}}
  function mainFor(parent){
    const rows=(state.orders||[]).filter(o=>String(o.parent)===String(parent)&&!o.cancelled);
    return rows.find(o=>String(o.code||'').endsWith('A'))||rows[0]||null;
  }
  function nextParent(){
    const nums=(state.orders||[]).map(o=>String(o.parent||'')).filter(x=>/^\d+$/.test(x)).map(Number);
    return String((nums.length?Math.max(...nums):0)+1);
  }
  function gmailUrl(d={}){
    const rfc=String(d.rfcMessageId||'').trim();
    if(rfc)return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent('rfc822msgid:'+rfc)}`;
    const tid=String(d.gmailThreadId||'').trim();
    if(tid)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(tid)}`;
    const mid=String(d.gmailMessageId||'').trim();
    if(mid)return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(mid)}`;
    return '';
  }
  function matchingIML(d){
    const rows=(state.imls||[]).filter(i=>
      String(i.clientCode||'')===String(d.clientCode||'') &&
      String(i.productCode||'')===String(d.productCode||'')
    );
    return rows.length===1?rows[0]:null;
  }
  function nextSheetNo(){
    const nums=(state.productionSheets||[]).map(x=>parseInt(String(x.sheetNo||'').replace(/\D/g,''),10)||0);
    return (nums.length?Math.max(...nums):0)+1;
  }
  function makeSheet(parent,main,d={}){
    state.productionSheets=Array.isArray(state.productionSheets)?state.productionSheets:[];
    const found=state.productionSheets.find(x=>String(x.parent)===String(parent));
    if(found)return found;
    const liters=String(main.liters||'');
    const cap=liters.startsWith('3')?725:liters.startsWith('5')?880:400;
    let left=Math.max(0,num(main.productionRequiredQty!=null?main.productionRequiredQty:main.qty));
    if(!left)left=num(main.qty);
    const rows=[];
    let pack=1;
    while(left>0){
      const pieces=Math.min(cap,left);
      rows.push({
        id:uid('row'),orderCode:main.code,imlCode:main.imlCode||'',pieces,
        packageLabel:`# ${pack++}`,lidColor:`${main.color||'BIANCO'} TAPPI`,
        status:'Da produrre',operatorProduction:'',operatorHandles:'',finishAt:'',notes:''
      });
      left-=pieces;
    }
    const sheet={
      id:uid('sheet'),sheetNo:nextSheetNo(),sheetDate:main.date||new Date().toISOString().slice(0,10),
      productionDate:'',parent,client:main.client,clientCode:main.clientCode||'',product:main.product,
      productCode:main.productCode||'',imlCode:main.imlCode||'',orderCode:main.code,
      priority:main.priority||'Normale',packageType:main.packaging||'Cesta',rows,
      createdAt:iso(),createdBy:'Ordine Smart Pack',statusV106:'Aperto',companyCode:'smartpack',
      sourceEmail:{gmailMessageId:d.gmailMessageId||'',gmailThreadId:d.gmailThreadId||'',rfcMessageId:d.rfcMessageId||'',subject:d.subject||'',from:d.from||'',receivedAt:d.receivedAt||''}
    };
    state.productionSheets.unshift(sheet);
    return sheet;
  }
  function addEmailTrace(main,d,parent,sheet){
    const url=gmailUrl(d);
    const src={
      type:'email',label:'E-mail',recordedAt:iso(),
      recordedBy:window.POICloudV10?.getProfile?.()?.email||'Utente ufficio',
      email:{receivedAt:d.receivedAt||'',verifiedAt:d.verifiedAt||'',from:d.from||'',subject:d.subject||'',gmailMessageId:d.gmailMessageId||'',gmailThreadId:d.gmailThreadId||'',rfcMessageId:d.rfcMessageId||'',gmailUrl:url},
      history:[
        {at:d.receivedAt||iso(),action:'E-mail ordine ricevuta',detail:d.from||''},
        {at:d.verifiedAt||iso(),action:'Bozza verificata',detail:d.subject||''},
        {at:iso(),action:'Ordine registrato',detail:`Ordine ${parent} · Foglio ${sheet?.sheetNo||''}`}
      ]
    };
    main.orderSourceV1162=src;
    main.sourceTypeV1162='email';
    main.sourceRecordedAtV1162=src.recordedAt;
    main.sourceRecordedByV1162=src.recordedBy;
    main.sourceEmailUrlV1162=url;
    main.sourceContact='MAIL';
    main.source='GMAIL';
  }
  function createFromDraft(d,parentOverride=''){
    if(!d||!d.client||!d.product||!num(d.qty))return null;
    const parent=String(parentOverride||nextParent());
    const existing=mainFor(parent);
    if(existing){
      const sheet=makeSheet(parent,existing,d);
      return {parent,main:existing,sheet,created:false};
    }
    const iml=matchingIML(d);
    const qty=num(d.qty);
    const code=parent+'A';
    const date=String(d.receivedAt||'').slice(0,10)||new Date().toISOString().slice(0,10);
    let status='Da preparare';
    try{if(iml&&typeof available==='function'&&available(iml)<qty)status='In attesa IML'}catch(_){ }
    if(iml)iml.reserved=num(iml.reserved)+qty;
    const main={
      id:code,code,parent,date,client:String(d.client).toUpperCase(),clientCode:d.clientCode||'',
      product:d.product,productCode:d.productCode||'',liters:d.liters||'',color:d.color||'BIANCO',
      imlCode:iml?.code||'',qty,remaining:qty,delivered:0,status,dueDate:d.dueDate||'',
      packaging:d.packaging||'Cesta',notes:`Ordine creato da Gmail${d.orderRef?' · Rif. '+d.orderRef:''}`,
      priority:d.priority||'Normale',orderRef:d.orderRef||'',createdBy:'E-mail verificata',companyCode:'smartpack',
      fulfillmentMode:'produce',warehouseReservedQty:0,warehousePreparedQty:0,productionRequiredQty:qty,cancelled:false
    };
    state.orders=Array.isArray(state.orders)?state.orders:[];
    state.orders.push(main);
    const sheet=makeSheet(parent,main,d);
    addEmailTrace(main,d,parent,sheet);
    return {parent,main,sheet,created:true};
  }
  function commitDraft(d,res){
    d.status='Convertita';
    d.convertedAt=iso();
    d.linkedOrderParentV1163=res.parent;
    d.linkedOrderParentV1164=res.parent;
    d.linkedOrderCodeV1163=res.main.code;
    d.linkedOrderCodeV1164=res.main.code;
    d.productionSheetIdV1163=res.sheet?.id||'';
    d.productionSheetIdV1164=res.sheet?.id||'';
    try{addAudit('Ordine Smart Pack registrato',res.parent,`${d.clientCode||d.client} · ${d.productCode||d.product} · ${d.qty} pz`)}catch(_){ }
    saveSafe();
  }
  function openRegister(parent=''){
    try{if(typeof navTo==='function')navTo('ordersRegister')}catch(_){ }
    setTimeout(()=>{
      try{
        currentView='ordersRegister';
        document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
        document.getElementById('ordersRegisterView')?.classList.add('active');
        const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');
        if(title)title.textContent='Registro ordini';
        if(sub)sub.textContent='Tutti gli ordini Smart Pack registrati, inclusi quelli creati da Gmail';
      }catch(_){ }
      try{window.renderOrdersRegisterV53?.()}catch(e){console.warn('[V11.6.5] registro ordini',e)}
      const search=document.getElementById('regSearchV1165')||document.getElementById('regSearchV54');
      if(search&&parent){search.value=String(parent);search.dispatchEvent(new Event('input',{bubbles:true}))}
    },120);
  }
  function acceptDraft(id){
    const d=(state.emailOrderDraftsV115||[]).find(x=>String(x.id)===String(id));
    if(!d)return;
    const linked=String(d.linkedOrderParentV1164||d.linkedOrderParentV1163||'');
    if(linked&&mainFor(linked)){openRegister(linked);return}
    if(d.status!=='Verificata'){
      alert('Prima verifica cliente, prodotto, quantità e consegna e premi “Salva verifica”.');
      try{window.SPPlannerV115?.editEmail?.(id)}catch(_){ }
      return;
    }
    if(!d.clientCode||!d.productCode||!d.client||!d.product||!num(d.qty)){
      alert('Cliente, prodotto e quantità devono essere associati alle anagrafiche prima della creazione.');
      return;
    }
    if(!confirm(`Creare ora l’ordine Smart Pack per ${d.client} · ${num(d.qty).toLocaleString('it-IT')} pz?\nVerranno creati anche Registro ordini e foglio produzione.`))return;
    const res=createFromDraft(d,linked);
    if(!res||!mainFor(res.parent)){alert('Non è stato possibile registrare l’ordine. Riprova.');return}
    commitDraft(d,res);
    try{toast(`Ordine ${res.parent} registrato · Foglio ${res.sheet?.sheetNo||''} creato`)}catch(_){ }
    openRegister(res.parent);
  }
  function reconcileEmailOrders(){
    state.emailOrderDraftsV115=Array.isArray(state.emailOrderDraftsV115)?state.emailOrderDraftsV115:[];
    let fixed=0;
    for(const d of state.emailOrderDraftsV115){
      const parent=String(d.linkedOrderParentV1164||d.linkedOrderParentV1163||'');
      if(!parent)continue;
      let main=mainFor(parent);
      if(!main&&d.client&&d.product&&num(d.qty)){
        const res=createFromDraft(d,parent);
        if(res){commitDraft(d,res);main=res.main;fixed++}
      }
      if(main){
        main.companyCode='smartpack';
        makeSheet(parent,main,d);
      }
    }
    if(fixed){saveSafe();try{toast(`${fixed} ordine/i Gmail ripristinati nel Registro ordini`)}catch(_){ }}
    return fixed;
  }

  /* ---------- Ambiente Multiplast dedicato ---------- */
  const MODEL_NAMES=['Europa 17','Europa 20','Europa 22','Europa 26','GAE','Agricola','Simo','Big','Elisa','Small','Marina','Padellone 10','Padellone 12','Padellone 15'];
  function mpState(){
    state.groupV92=state.groupV92||{};
    state.groupV92.multiplast=state.groupV92.multiplast||{};
    const mp=state.groupV92.multiplast;
    mp.presses=Array.isArray(mp.presses)?mp.presses:[];
    mp.models=Array.isArray(mp.models)?mp.models:[];
    for(const name of MODEL_NAMES){
      if(!mp.models.some(x=>String(x.name||'').toLowerCase()===name.toLowerCase())){
        mp.models.push({id:uid('mpmdl'),name,mold:'',compatible:'',cycleSec:0,piecesPerCycle:0,standardRatePph:0,minEfficiencyPct:85,palletCapacity:0,minStock:0,notes:'Parametri da configurare con i dati aziendali.'});
      }
    }
    mp.costsV1164=mp.costsV1164&&typeof mp.costsV1164==='object'?mp.costsV1164:{
      energyPriceKwh:0,kwhPerKg:0,laborCostHour:0,packagingPerPiece:0,transportPerPiece:0,otherPerPiece:0,models:{}
    };
    mp.costsV1164.models=mp.costsV1164.models||{};
    return mp;
  }
  function enforceMPBrand(){
    if(!isMP())return;
    document.body.dataset.companyV1164='multiplast';
    const img=$('#sideLogo'),fallback=$('#brandFallback');
    if(img){img.src='multiplast-logo.png';img.classList.remove('hidden')}
    if(fallback)fallback.classList.add('hidden');
    const name=$('#sideName'),tag=$('#sideTag');
    if(name)name.textContent='MULTIPLAST S.R.L.';
    if(tag)tag.textContent='Produzione, materie prime, costi e tracciabilità';
  }
  function bridgeMP(){
    if(!isMP())return;
    sessionStorage.setItem('nomyra_group_company_v92','multiplast');
    const r=officeRole()||'manager';
    sessionStorage.setItem('nomyra_group_role_v92',r);
    try{currentRole=r}catch(_){ }
    if(document.body.dataset.mpBridgeV1164!=='1'){
      document.body.dataset.mpBridgeV1164='1';
      try{window.switchCompanyV92?.('multiplast')}catch(e){console.warn('[V11.6.4] switch Multiplast',e)}
    }
    enforceMPBrand();
    mpState();
  }
  function modelCost(model){
    const mp=mpState(),c=mp.costsV1164,m=c.models[model.name]||{};
    const weight=num(m.weightKg),matKg=num(m.materialCostKg),kwhKg=num(m.kwhPerKg)||num(c.kwhPerKg),rate=num(m.ratePph)||num(model.standardRatePph);
    const material=weight*matKg;
    const energy=weight*kwhKg*num(c.energyPriceKwh);
    const labor=rate>0?num(c.laborCostHour)/rate:0;
    const pack=num(c.packagingPerPiece),transport=num(c.transportPerPiece),other=num(c.otherPerPiece);
    const cost=material+energy+labor+pack+transport+other;
    const sale=num(m.salePrice),margin=sale-cost,marginPct=sale>0?margin/sale*100:0;
    return {weight,matKg,kwhKg,rate,material,energy,labor,pack,transport,other,cost,sale,margin,marginPct};
  }
  function ensureCostView(){
    if($('#mpCostsV1164View'))return;
    const content=$('.content');if(!content)return;
    const view=document.createElement('section');view.id='mpCostsV1164View';view.className='view';content.appendChild(view);
  }
  function renderMPCosts(){
    ensureCostView();const view=$('#mpCostsV1164View');if(!view)return;
    const mp=mpState(),c=mp.costsV1164,models=mp.models.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'it'));
    view.innerHTML=`
      <div class="hero"><div><span class="eyebrow">MULTIPLAST · CONTROLLO INDUSTRIALE</span><h2>Costi industriali e marginalità</h2><p>I valori partono volutamente vuoti/zero: inserisci o importa i dati reali dell’azienda. Il costo unitario viene calcolato da materia prima, energia, manodopera, imballaggio, trasporto e altre voci.</p></div></div>
      <div class="section panel"><div class="panel-head"><div><h3>Parametri generali</h3><p>Valori utilizzati come base per tutti i modelli.</p></div></div><div class="panel-body"><form id="mpCostGeneralV1164" class="v1164-cost-grid">
        <label class="field">Energia €/kWh<input name="energyPriceKwh" type="number" min="0" step="0.0001" value="${c.energyPriceKwh||''}"></label>
        <label class="field">Consumo standard kWh/kg<input name="kwhPerKg" type="number" min="0" step="0.0001" value="${c.kwhPerKg||''}"></label>
        <label class="field">Costo manodopera €/h<input name="laborCostHour" type="number" min="0" step="0.01" value="${c.laborCostHour||''}"></label>
        <label class="field">Imballaggio €/pz<input name="packagingPerPiece" type="number" min="0" step="0.0001" value="${c.packagingPerPiece||''}"></label>
        <label class="field">Trasporto €/pz<input name="transportPerPiece" type="number" min="0" step="0.0001" value="${c.transportPerPiece||''}"></label>
        <label class="field">Altri costi €/pz<input name="otherPerPiece" type="number" min="0" step="0.0001" value="${c.otherPerPiece||''}"></label>
        <button class="btn primary" type="submit">Salva parametri</button>
      </form></div></div>
      <div class="section panel"><div class="panel-head"><div><h3>Costo per prodotto / modello</h3><p>La velocità può essere presa dalla capacità del modello oppure specificata qui. Nessun valore economico viene inventato.</p></div></div><div class="table-wrap"><table class="data-table v1164-cost-table"><thead><tr><th>Modello</th><th>Peso kg</th><th>Materia €/kg</th><th>kWh/kg</th><th>Pezzi/ora</th><th>Prezzo vendita</th><th>Materia</th><th>Energia</th><th>Manodopera</th><th>Altri costi</th><th>Costo unit.</th><th>Margine</th><th></th></tr></thead><tbody>${models.map((model,i)=>{const z=modelCost(model),m=c.models[model.name]||{};return `<tr data-model="${esc(model.name)}"><td><b>${esc(model.name)}</b></td><td><input data-f="weightKg" type="number" min="0" step="0.0001" value="${m.weightKg||''}"></td><td><input data-f="materialCostKg" type="number" min="0" step="0.0001" value="${m.materialCostKg||''}"></td><td><input data-f="kwhPerKg" type="number" min="0" step="0.0001" value="${m.kwhPerKg||''}"></td><td><input data-f="ratePph" type="number" min="0" step="1" value="${m.ratePph||model.standardRatePph||''}"></td><td><input data-f="salePrice" type="number" min="0" step="0.0001" value="${m.salePrice||''}"></td><td>${money(z.material)}</td><td>${money(z.energy)}</td><td>${money(z.labor)}</td><td>${money(z.pack+z.transport+z.other)}</td><td><b>${money(z.cost)}</b></td><td class="${z.sale?(z.margin>=0?'v1164-good':'v1164-bad'):''}">${z.sale?`${money(z.margin)} · ${nf(z.marginPct)}%`:'—'}</td><td><button class="btn small" type="button" data-save-cost="${i}">Salva</button></td></tr>`}).join('')}</tbody></table></div></div>`;
    $('#mpCostGeneralV1164').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);
      for(const k of ['energyPriceKwh','kwhPerKg','laborCostHour','packagingPerPiece','transportPerPiece','otherPerPiece'])c[k]=num(f.get(k));
      saveSafe();renderMPCosts();try{toast('Parametri costi Multiplast salvati')}catch(_){ }
    };
    $$('[data-save-cost]',view).forEach(btn=>btn.onclick=()=>{
      const i=num(btn.dataset.saveCost),model=models[i],tr=btn.closest('tr');
      c.models[model.name]=c.models[model.name]||{};
      tr.querySelectorAll('[data-f]').forEach(inp=>c.models[model.name][inp.dataset.f]=num(inp.value));
      if(num(c.models[model.name].ratePph))model.standardRatePph=num(c.models[model.name].ratePph);
      saveSafe();renderMPCosts();try{toast(`${model.name} aggiornato`)}catch(_){ }
    });
  }
  function openMPCosts(){
    ensureCostView();
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    $('#mpCostsV1164View')?.classList.add('active');
    try{currentView='mpCostsV1164'}catch(_){ }
    const title=$('#pageTitle'),sub=$('#pageSubtitle');
    if(title)title.textContent='Costi industriali Multiplast';
    if(sub)sub.textContent='Materia prima, energia, manodopera e marginalità per prodotto';
    decorateMPNav();renderMPCosts();enforceMPBrand();
  }
  function decorateMPNav(){
    if(!isMP())return;
    const side=$('#sideNav');if(!side)return;
    let btn=$('#mpCostsNavV1164');
    if(!btn){
      btn=document.createElement('button');btn.id='mpCostsNavV1164';btn.type='button';
      btn.innerHTML='<span class="icon">€</span><span>Costi industriali</span>';
      btn.onclick=openMPCosts;
      const analysis=[...side.querySelectorAll('button')].find(x=>/Analisi produttiva/i.test(x.textContent));
      analysis?analysis.insertAdjacentElement('afterend',btn):side.appendChild(btn);
    }
    btn.classList.toggle('active',(()=>{try{return currentView==='mpCostsV1164'}catch(_){return false}})());
  }
  function decorateMPDashboard(){
    if(!isMP())return;
    const view=$('#mpDashboardView');if(!view||$('#mpCostSummaryV1164',view))return;
    const mp=mpState(),configured=mp.models.filter(x=>{const z=modelCost(x);return z.weight>0&&z.matKg>0});
    const priced=configured.filter(x=>modelCost(x).sale>0);
    const avg=configured.length?configured.reduce((s,x)=>s+modelCost(x).cost,0)/configured.length:0;
    const margin=priced.length?priced.reduce((s,x)=>s+modelCost(x).marginPct,0)/priced.length:0;
    const box=document.createElement('div');box.id='mpCostSummaryV1164';box.className='section v1164-mp-summary';
    box.innerHTML=`<div><span>Modelli con costo configurato</span><b>${configured.length}/${mp.models.length}</b></div><div><span>Costo standard medio</span><b>${configured.length?money(avg):'Da configurare'}</b></div><div><span>Margine medio</span><b>${priced.length?nf(margin)+'%':'Da configurare'}</b></div><button class="btn" type="button" onclick="SPMPV1164.openCosts()">Apri costi industriali</button>`;
    view.querySelector('.hero')?.insertAdjacentElement('afterend',box);
  }
  function injectStyles(){
    if($('#v1164Styles'))return;
    const st=document.createElement('style');st.id='v1164Styles';st.textContent=`
      body[data-company-v1164="multiplast"]{--primary:#174f7d;--secondary:#d72f3d}
      body[data-company-v1164="multiplast"] .sidebar{background:linear-gradient(180deg,#102f48,#174f70)}
      body[data-company-v1164="multiplast"] .topbar{border-top:2px solid #d72f3d}
      .v1164-cost-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end}
      .v1164-cost-table{min-width:1450px}.v1164-cost-table input{width:96px;min-height:34px;border:1px solid var(--line);border-radius:8px;padding:6px}
      .v1164-good{color:#1c7358;font-weight:900}.v1164-bad{color:#a93d47;font-weight:900}
      .v1164-mp-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:10px;align-items:stretch}
      .v1164-mp-summary>div{background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px}
      .v1164-mp-summary span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:900}
      .v1164-mp-summary b{display:block;font-size:18px;margin-top:5px}.v1164-mp-summary .btn{align-self:center}
      @media(max-width:900px){.v1164-cost-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v1164-mp-summary{grid-template-columns:1fr 1fr}}
      @media(max-width:620px){.v1164-cost-grid,.v1164-mp-summary{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
  }
  function patchInterfaces(){
    if(window.SPPlannerV115)window.SPPlannerV115.toOrder=acceptDraft;
    if(window.SPMailFlowV1163)window.SPMailFlowV1163.accept=acceptDraft;
  }
  function boot(){
    injectStyles();
    reconcileEmailOrders();
    patchInterfaces();
    if(isMP())setTimeout(bridgeMP,40);
    setInterval(()=>{
      patchInterfaces();
      if(isMP()){
        bridgeMP();decorateMPNav();decorateMPDashboard();enforceMPBrand();
      }else{
        document.body.removeAttribute('data-company-v1164');
        document.body.removeAttribute('data-mp-bridge-v1164');
      }
    },900);
    document.body.dataset.buildFinal='V11.6.4';
  }
  window.SPMPV1164={accept:acceptDraft,reconcile:reconcileEmailOrders,openRegister,openCosts:openMPCosts,bridgeMP,createFromDraft,commitDraft,mainFor,makeSheet,version:VERSION};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ===== V11.6.5 · REGISTRO ORDINI CANONICO + RIPRISTINO VISIBILITÀ ===== */
(()=>{
  'use strict';
  if(window.SPRegisterV1165)return;
  const VERSION='V11.6.5';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0);
  const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(num(v));

  function groups(){
    const map=new Map();
    for(const o of (Array.isArray(state?.orders)?state.orders:[])){
      if(!o||typeof o!=='object'||o.deletedV54)continue;
      if(o.companyCode && o.companyCode!=='smartpack')continue;
      const parent=String(o.parent??o.code??'').replace(/[A-Za-z]+$/,'').trim();
      if(!parent)continue;
      if(!map.has(parent))map.set(parent,[]);
      map.get(parent).push(o);
    }
    return [...map.entries()].map(([parent,lines])=>{
      const main=lines.find(x=>String(x.code||'').endsWith('A'))||lines[0]||{};
      return {parent,lines,main};
    }).sort((a,b)=>{
      const an=Number(String(a.parent).replace(/\D/g,''))||0;
      const bn=Number(String(b.parent).replace(/\D/g,''))||0;
      return bn-an;
    });
  }

  function status(g){
    const a=g.main||{};
    if(a.cancelled)return 'Annullato';
    if(num(a.delivered)>=num(a.qty)&&num(a.qty)>0)return 'Chiuso';
    const raw=String(a.status||'Da preparare');
    if(/complet|chius|soddis/i.test(raw))return 'Chiuso';
    if(/annull/i.test(raw))return 'Annullato';
    return raw;
  }

  function sheetFor(parent){
    return (state.productionSheets||[]).find(x=>String(x.parent)===String(parent))||null;
  }

  function gmailUrl(a){
    return String(a?.sourceEmailUrlV1162||a?.orderSourceV1162?.email?.gmailUrl||'');
  }

  function sourceLabel(a){
    const s=String(a?.sourceTypeV1162||a?.sourceContact||a?.source||'').toLowerCase();
    if(s.includes('email')||s.includes('mail')||s.includes('gmail'))return 'E-mail';
    if(s.includes('call')||s.includes('chiam'))return 'Chiamata';
    return a?.createdBy==='E-mail verificata'?'E-mail':'Manuale';
  }

  function repairDraftLinks(){
    let changed=false;
    for(const d of (state.emailOrderDraftsV115||[])){
      if(String(d.status||'')!=='Convertita')continue;
      const parent=String(d.linkedOrderParentV1164||d.linkedOrderParentV1163||'');
      if(parent){
        const exists=groups().some(g=>String(g.parent)===parent);
        if(!exists){
          // Non ricreiamo automaticamente per evitare doppie riserve IML:
          // rimettiamo la bozza nello stato verificato affinché venga confermata una sola volta.
          d.status='Verificata';
          d.convertedAt='';
          d.linkedOrderParentV1164='';
          d.linkedOrderParentV1163='';
          d.linkedOrderCodeV1164='';
          d.linkedOrderCodeV1163='';
          d.productionSheetIdV1164='';
          d.productionSheetIdV1163='';
          changed=true;
        }
      }else{
        // Vecchio flusso V11.5: "Convertita" significava solo dati passati al form.
        // Deve tornare approvabile, non sparire dall'inbox.
        d.status='Verificata';
        d.convertedAt='';
        changed=true;
      }
    }
    if(changed){
      try{save()}catch(_){}
    }
    return changed;
  }

  function render(){
    repairDraftLinks();
    const view=$('#ordersRegisterView');if(!view)return;
    view.innerHTML=`
      <div class="hero">
        <div>
          <span class="eyebrow">SMART PACK · REGISTRO UFFICIALE</span>
          <h2>Registro ordini</h2>
          <p>Questa vista legge direttamente gli ordini salvati nella piattaforma. Gli ordini creati da Gmail e quelli inseriti manualmente compaiono nello stesso registro.</p>
        </div>
        <div class="hero-actions">
          ${currentRole==='director'?'<button class="btn primary" type="button" onclick="openNewOrder()">+ Nuovo ordine</button>':''}
          <button class="btn" type="button" onclick="SPRegisterV1165.refresh()">Aggiorna</button>
        </div>
      </div>
      <div class="section">
        <div class="register-toolbar-v54">
          <label class="field search">Cerca
            <input id="regSearchV1165" placeholder="Ordine, codice cliente, cliente, prodotto, IML, rif. ordine...">
          </label>
          <label class="field">Stato
            <select id="regStatusV1165">
              <option value="all">Tutti</option>
              <option value="open">Aperti</option>
              <option value="closed">Chiusi</option>
              <option value="cancelled">Annullati</option>
            </select>
          </label>
          <span class="v1165-register-count" id="regCountV1165"></span>
        </div>
        <div class="panel">
          <div class="table-wrap">
            <table class="data-table v1165-register-table">
              <thead><tr>
                <th>Ordine</th><th>Data</th><th>Rif. ordine</th><th>Cliente</th><th>Q.tà</th>
                <th>Prodotto</th><th>IML</th><th>Origine</th><th>Foglio produzione</th>
                <th>Consegna prevista</th><th>Stato</th><th>Azioni</th>
              </tr></thead>
              <tbody id="regBodyV1165"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    function draw(){
      const q=String($('#regSearchV1165')?.value||'').trim().toLowerCase();
      const filter=$('#regStatusV1165')?.value||'all';
      const all=groups();
      const arr=all.filter(g=>{
        const a=g.main||{},s=status(g);
        const ok=filter==='all'||(filter==='open'&&!['Chiuso','Annullato'].includes(s))||(filter==='closed'&&s==='Chiuso')||(filter==='cancelled'&&s==='Annullato');
        const hay=[g.parent,a.code,a.orderRef,a.clientCode,a.client,a.productCode,a.product,a.imlCode,a.sourceEmailFromV1162].join(' ').toLowerCase();
        return ok&&(!q||hay.includes(q));
      });
      const count=$('#regCountV1165');if(count)count.textContent=`${arr.length} di ${all.length} ordini`;

      $('#regBodyV1165').innerHTML=arr.map(g=>{
        const a=g.main||{},s=status(g),sh=sheetFor(g.parent),mail=gmailUrl(a),src=sourceLabel(a);
        const sourceHtml=src==='E-mail'
          ? `<span class="v1165-source email">E-mail</span>${mail?`<a href="${esc(mail)}" target="_blank" rel="noopener">Apri ↗</a>`:''}`
          : `<span class="v1165-source">${esc(src)}</span>`;
        const client=`<b>${esc(a.client||'—')}</b>${a.clientCode?`<span>${esc(a.clientCode)}</span>`:'<span>Codice da associare/importare</span>'}`;
        const product=`<b>${esc(a.product||'—')}</b>${a.productCode?`<span>${esc(a.productCode)}</span>`:''}`;
        return `<tr>
          <td class="main-cell"><b>${esc(g.parent)}</b><span>${esc(a.code||'')}</span></td>
          <td>${esc(a.date||'—')}</td>
          <td>${esc(a.orderRef||'—')}</td>
          <td class="main-cell">${client}</td>
          <td><b>${fmt(a.qty)} pz</b></td>
          <td class="main-cell">${product}</td>
          <td>${esc(a.imlCode||'ANONIMO')}</td>
          <td><div class="v1165-source-cell">${sourceHtml}</div></td>
          <td>${sh?`<button class="btn small" type="button" onclick="openSheet('${esc(sh.id)}')">Foglio ${esc(sh.sheetNo||'')}</button>`:'<span class="v1165-missing">Da generare</span>'}</td>
          <td>${esc(a.dueDate||'—')}</td>
          <td><span class="status ${typeof statusClass==='function'?statusClass(s):''}">${esc(s)}</span></td>
          <td><div class="card-actions">
            ${typeof window.v53OpenEditOrder==='function'&&currentRole==='director'?`<button class="btn small" type="button" onclick="v53OpenEditOrder('${esc(g.parent)}')">Modifica</button>`:''}
            ${typeof window.traceOrder==='function'?`<button class="btn small" type="button" onclick="traceOrder('${esc(g.parent)}')">Traccia</button>`:''}
            ${currentRole==='admin'&&typeof window.v53OpenDDT==='function'&&!a.ddtRef&&s!=='Annullato'?`<button class="btn small primary" type="button" onclick="v53OpenDDT('${esc(g.parent)}')">DDT</button>`:''}
          </div></td>
        </tr>`;
      }).join('')||'<tr><td colspan="12"><div class="empty"><b>Nessun ordine nel registro</b>Non ci sono ordini corrispondenti ai filtri selezionati.</div></td></tr>';
    }

    $('#regSearchV1165').oninput=draw;
    $('#regStatusV1165').onchange=draw;
    draw();
  }

  function forceOpen(parent=''){
    try{
      currentView='ordersRegister';
      document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
      $('#ordersRegisterView')?.classList.add('active');
      const title=$('#pageTitle'),sub=$('#pageSubtitle');
      if(title)title.textContent='Registro ordini';
      if(sub)sub.textContent='Ordini Smart Pack registrati e tracciati';
      render();
      const search=$('#regSearchV1165');
      if(search&&parent){search.value=String(parent);search.dispatchEvent(new Event('input',{bubbles:true}))}
    }catch(e){console.warn('[V11.6.5] apertura registro',e)}
  }

  function injectStyles(){
    if($('#v1165RegisterStyles'))return;
    const st=document.createElement('style');st.id='v1165RegisterStyles';st.textContent=`
      .v1165-register-count{display:inline-flex;align-items:center;padding:8px 11px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font-size:8px;font-weight:900}
      .v1165-register-table{min-width:1280px}
      .v1165-source-cell{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.v1165-source-cell a{font-size:8px;font-weight:900;color:var(--primary);text-decoration:none}
      .v1165-source{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef3f5;color:#536a75;font-size:7px;font-weight:950}.v1165-source.email{background:#eaf4fb;color:#176b93}
      .v1165-missing{font-size:8px;color:#9a6a18;font-weight:900}
    `;document.head.appendChild(st);
  }

  function patch(){
    injectStyles();
    window.renderOrdersRegisterV53=render;
    try{renderOrdersRegisterV53=render}catch(_){}
    if(window.SPMPV1164){
      window.SPMPV1164.openRegister=forceOpen;
    }
  }

  function boot(){
    patch();
    repairDraftLinks();
    setInterval(patch,1200);
    document.body.dataset.registerFix='V11.6.5';
  }

  window.SPRegisterV1165={render,refresh:render,open:forceOpen,groups,repairDraftLinks,version:VERSION};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


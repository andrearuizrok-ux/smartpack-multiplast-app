/* Smart Pack · Multiplast — V11.5 · Coda Roberto + pianificazione intelligente
   Obiettivi:
   - Roberto mantiene sempre il controllo della coda (drag & drop / su-giu / blocco posizione).
   - Il motore suggerisce, non applica modifiche senza conferma.
   - Regole operative: coperchi a fine settimana; cambio stampo solo 06:00-12:00 con Saverio;
     minimizzazione cambi; urgenza/data consegna; stampo e IML disponibili; tempi ciclo reali.
   - Menu Direzione personalizzabile.
   - Inbox ordini e-mail predisposta con import manuale sicuro; OAuth server-side da collegare in seguito.
*/
(()=>{
  'use strict';

  const BUILD='V11.5';
  const MARKER='PIATTAFORMA-GRUPPO-V11.5';
  const VIEW='planner';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const n=v=>Number(v||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n(v));
  const now=()=>new Date();
  const iso=()=>new Date().toISOString();
  const uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const role=()=>typeof currentRole!=='undefined'?currentRole:'';

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
  function emailDraftCard(d){return `<article class="v115-email-draft"><div><span>${esc(d.status||'Bozza')}</span><b>${esc(d.client||'Cliente da verificare')} · ${esc(d.product||'Prodotto da verificare')}</b><p>${fmt(d.qty)} pz${d.dueDate?' · consegna '+esc(d.dueDate):''}${d.subject?' · '+esc(d.subject):''}</p></div><div><button class="btn small" onclick="SPPlannerV115.editEmail('${esc(d.id)}')">Controlla</button><button class="btn small primary" onclick="SPPlannerV115.toOrder('${esc(d.id)}')">Crea ordine</button></div></article>`}

  function renderPlanner(){
    ensureState();const v=$('#plannerView');if(!v)return;
    const q=queued(),urgent=q.filter(isUrgent),hours=q.reduce((s,r)=>s+hoursFor(r),0),changes=countSuggestedChanges(),drafts=state.emailOrderDraftsV115.filter(d=>d.status!=='Convertita');
    v.innerHTML=`<div class="v115-hero"><div><span class="v115-eyebrow">SMART PACK · PIANIFICAZIONE ROBERTO</span><h2>Coda produzione</h2><p>Roberto decide l'ordine reale. L'assistente confronta urgenza, tempi, stampi installati, IML e regole operative e propone una sequenza spiegata.</p></div><div class="v115-hero-actions"><button class="btn" onclick="SPPlannerV115.menu()">Personalizza menu</button><button class="btn" onclick="SPPlannerV115.rules()">Regole</button><button class="btn primary" onclick="SPPlannerV115.apply()">Applica suggerimento</button></div></div>
    ${rulesChips()}
    <div class="v115-kpis"><div><span>Produzioni in coda</span><b>${q.length}</b><small>ordinate da Roberto</small></div><div><span>Urgenti / vicine</span><b>${urgent.length}</b><small>entro ${rules().urgencyDays} giorni</small></div><div><span>Ore stimate</span><b>${fmtHours(hours)}</b><small>su tempi ciclo configurati</small></div><div><span>Movimenti suggeriti</span><b>${changes}</b><small>mai applicati automaticamente</small></div><div><span>Ordini e-mail</span><b>${drafts.length}</b><small>bozze da verificare</small></div></div>
    <div class="v115-status ${inChangeWindow()?'ok':'warn'}"><b>${inChangeWindow()?'Finestra cambio stampo aperta':'Finestra cambio stampo chiusa'}</b><span>${esc(changeWindowLabel())}. ${weekendMode()?'Oggi è attiva la preferenza coperchi.':tomorrowWeekend()?'Domani è giornata coperchi: il suggerimento ne tiene conto.':'I coperchi vengono favoriti a fine settimana salvo urgenze.'}</span></div>
    <div class="v115-machines">${machineList().map(machinePanel).join('')}</div>
    <section class="v115-email"><div class="v115-section-head"><div><span>ORDINI DA E-MAIL</span><h3>Inbox ordini</h3><p>Il flusso definitivo sarà e-mail → bozza → controllo → ordine. Nessun ordine viene creato senza conferma.</p></div><div><button class="btn" onclick="SPPlannerV115.emailSetup()">Connessione e-mail</button><button class="btn primary" onclick="SPPlannerV115.importEmail()">Importa e-mail di prova</button></div></div><div class="v115-email-state"><b>Integrazione server-side predisposta</b><span>Le credenziali della casella non vengono mai salvate nel browser. Per collegare Gmail/Workspace o un altro provider serve OAuth nel backend.</span></div><div class="v115-email-list">${drafts.map(emailDraftCard).join('')||'<div class="v115-empty">Nessuna bozza e-mail da controllare.</div>'}</div></section>`;
    bindDrag();version();
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
  function submitEmailImport(e){e.preventDefault();const f=e.currentTarget,parsed=parseEmailText(f.elements.body.value,f.elements.subject.value);const d={id:uid('mail'),receivedAt:iso(),status:'Da verificare',from:f.elements.from.value.trim(),...parsed};state.emailOrderDraftsV115.unshift(d);audit('E-mail ordine importata',d.orderRef||d.id,d.subject||d.from);saveNow('Bozza e-mail creata');$('#v115EmailImportDialog').close();renderPlanner();editEmail(d.id)}
  function editEmail(id){const d=state.emailOrderDraftsV115.find(x=>x.id===id);if(!d)return;emailDraftEditing=id;const f=$('#v115EmailDraftForm');['client','product','orderRef','qty','dueDate','liters','priority'].forEach(k=>{if(f.elements[k])f.elements[k].value=d[k]||''});$('#v115EmailDraftSource').textContent=d.sourceText||'';$('#v115EmailDraftDialog').showModal()}
  function saveEmailDraft(e){e.preventDefault();const d=state.emailOrderDraftsV115.find(x=>x.id===emailDraftEditing);if(!d)return;const f=e.currentTarget;['client','product','orderRef','dueDate','liters','priority'].forEach(k=>d[k]=f.elements[k].value);d.qty=Math.max(0,n(f.elements.qty.value));d.status='Verificata';d.verifiedAt=iso();saveNow('Bozza verificata');$('#v115EmailDraftDialog').close();renderPlanner()}
  function toOrder(id){
    const d=state.emailOrderDraftsV115.find(x=>x.id===id);if(!d)return;if(!d.client||!d.product||!d.qty){alert('Controlla prima cliente, prodotto e quantità.');editEmail(id);return}
    if(typeof openNewOrder!=='function'){alert('Modulo nuovo ordine non disponibile.');return}openNewOrder();setTimeout(()=>{const f=$('#orderForm');if(!f)return;f.elements.client.value=d.client;f.elements.product.value=d.product;f.elements.orderRef.value=d.orderRef||'';f.elements.qty.value=d.qty;f.elements.dueDate.value=d.dueDate||'';if(d.liters)f.elements.liters.value=d.liters;f.elements.priority.value=d.priority||'Normale';f.elements.notes.value=`Ordine importato da e-mail${d.from?' · '+d.from:''}${d.subject?' · '+d.subject:''}`;d.status='Convertita';d.convertedAt=iso();saveNow();renderPlanner()},80)
  }
  function emailSetup(){
    $('#v115EmailSetupDialog').showModal();
  }

  function injectStyles(){if($('#v115Styles'))return;const s=document.createElement('style');s.id='v115Styles';s.textContent=`
    #plannerView{--v115:#17394a;--v115soft:#f2f8fa}.v115-hero{display:flex;gap:18px;align-items:center;background:linear-gradient(135deg,#fff,#f3faf8);border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:var(--shadow)}.v115-hero h2{font-size:25px;margin:2px 0 6px}.v115-hero p{font-size:11px;color:var(--muted);line-height:1.55;margin:0;max-width:760px}.v115-eyebrow,.v115-section-head>div>span,.v115-machine-head>div>span,.v115-over{font-size:8px;font-weight:900;letter-spacing:.11em;color:var(--primary);text-transform:uppercase}.v115-hero-actions{margin-left:auto;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.v115-rules{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.v115-rules span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:8px;font-weight:850;color:#4e6671}.v115-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.v115-kpis>div{background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px}.v115-kpis span,.v115-kpis small{display:block;font-size:8px;color:var(--muted)}.v115-kpis b{display:block;font-size:22px;margin:4px 0}.v115-status{display:flex;gap:12px;align-items:center;margin:12px 0;border-radius:13px;padding:10px 12px;font-size:9px}.v115-status b{font-size:10px}.v115-status span{color:#5f737d}.v115-status.ok{background:#edf9f4;border:1px solid #c9e8da}.v115-status.warn{background:#fff8ea;border:1px solid #efd9ad}.v115-machines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.v115-machine{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;min-width:0}.v115-machine-head{display:flex;gap:10px;align-items:flex-start}.v115-machine-head h3{font-size:17px;margin:3px 0}.v115-machine-head p{font-size:9px;color:var(--muted);margin:0}.v115-machine-summary{margin-left:auto;text-align:center;background:var(--soft);border-radius:12px;padding:7px 10px;min-width:62px}.v115-machine-summary b{display:block;font-size:17px}.v115-machine-summary span{font-size:7px;color:var(--muted)}.v115-advice{display:flex;gap:10px;align-items:flex-start;margin:11px 0;border:1px solid #bcded3;background:#f3fbf7;border-radius:13px;padding:11px}.v115-advice>div{flex:1}.v115-advice span{font-size:7px;font-weight:900;color:#26715c;letter-spacing:.08em}.v115-advice b{display:block;font-size:10px;margin-top:3px}.v115-advice p{font-size:8px;color:#4e6f64;line-height:1.45;margin:4px 0 0}.v115-score{font-size:12px!important;background:#fff;border-radius:10px;padding:7px!important;color:#26715c!important}.v115-warning{border:1px solid #efd6a4;background:#fff8e9;border-radius:11px;padding:9px 10px;font-size:8px;color:#735a2d;margin-bottom:9px}.v115-queue{display:grid;gap:8px;min-height:40px}.v115-run{display:grid;grid-template-columns:24px 1fr;gap:8px;border:1px solid #d9e5e9;border-radius:14px;padding:10px;background:#fff;transition:.16s}.v115-run:hover{border-color:#a8c8d3}.v115-run.dragging{opacity:.45}.v115-run.over{border-color:var(--primary);box-shadow:0 0 0 2px rgba(31,94,120,.10)}.v115-grip{display:flex;align-items:center;justify-content:center;color:#91a5ae;cursor:grab;font-weight:900}.v115-run-top{display:flex;gap:8px;align-items:flex-start}.v115-run-top>div:first-child{flex:1}.v115-run h4{font-size:10px;margin:3px 0 0}.v115-badges{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.v115-chip{display:inline-flex;padding:4px 6px;border-radius:999px;background:#edf2f4;color:#5f727c;font-size:6.8px;font-weight:950;white-space:nowrap}.v115-chip.urgent{background:#fdebec;color:#9b3e44}.v115-chip.lid{background:#fff2dc;color:#8a5b17}.v115-chip.change{background:#fff6e8;color:#925e13}.v115-chip.ok{background:#eaf7f1;color:#1d7258}.v115-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:8px}.v115-metrics div{background:#f7fafb;border-radius:8px;padding:6px}.v115-metrics span{display:block;font-size:6.5px;color:var(--muted);text-transform:uppercase}.v115-metrics b{display:block;font-size:8.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.v115-reason{font-size:7.8px;line-height:1.45;color:#526a75;margin-top:7px}.v115-run-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.v115-run-actions .btn{font-size:7px!important;min-height:27px!important;padding:5px 7px!important}.v115-empty{padding:20px;text-align:center;color:var(--muted);font-size:9px}.v115-email{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px}.v115-section-head{display:flex;gap:10px;align-items:flex-start}.v115-section-head>div:first-child{flex:1}.v115-section-head h3{font-size:16px;margin:3px 0}.v115-section-head p{font-size:9px;color:var(--muted);margin:0;line-height:1.5}.v115-section-head>div:last-child{display:flex;gap:6px}.v115-email-state{margin:11px 0;background:#f5f9fa;border-radius:11px;padding:9px 10px}.v115-email-state b{display:block;font-size:9px}.v115-email-state span{display:block;font-size:8px;color:var(--muted);margin-top:3px}.v115-email-list{display:grid;gap:7px}.v115-email-draft{display:flex;align-items:center;gap:10px;border-top:1px solid #edf2f3;padding:9px 0}.v115-email-draft>div:first-child{flex:1}.v115-email-draft span{font-size:7px;color:var(--primary);font-weight:900}.v115-email-draft b{display:block;font-size:9px;margin-top:2px}.v115-email-draft p{font-size:8px;color:var(--muted);margin:3px 0}.v115-menu-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2f3}.v115-menu-row label{font-size:10px}.v115-menu-row>div{display:flex;gap:4px}.v115-source{white-space:pre-wrap;background:#f5f8f9;border:1px solid var(--line);border-radius:10px;padding:10px;max-height:160px;overflow:auto;font:9px/1.45 ui-monospace,monospace}.v115-oauth{display:grid;gap:8px}.v115-oauth>div{border:1px solid var(--line);border-radius:12px;padding:11px}.v115-oauth b{font-size:10px}.v115-oauth p{font-size:8px;color:var(--muted);line-height:1.5;margin:4px 0 0}
    @media(max-width:1050px){.v115-kpis{grid-template-columns:repeat(3,1fr)}.v115-machines{grid-template-columns:1fr}}
    @media(max-width:760px){.v115-hero{display:block}.v115-hero-actions{margin-top:12px;justify-content:flex-start}.v115-hero-actions .btn{flex:1}.v115-kpis{grid-template-columns:1fr 1fr}.v115-metrics{grid-template-columns:1fr 1fr}.v115-section-head{display:block}.v115-section-head>div:last-child{margin-top:10px;display:grid;grid-template-columns:1fr 1fr}.v115-email-draft{display:block}.v115-email-draft>div:last-child{margin-top:8px}.v115-run{grid-template-columns:18px 1fr}.v115-run-top{display:block}.v115-badges{justify-content:flex-start;margin-top:5px}.v115-status{display:block}.v115-status span{display:block;margin-top:3px}}
  `;document.head.appendChild(s)}

  function ensureView(){let v=$('#plannerView');if(v)return v;v=document.createElement('section');v.className='view';v.id='plannerView';const content=$('.content');content?.appendChild(v);return v}
  function ensureDialogs(){
    if(!$('#v115MenuDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115MenuDialog"><div class="modal-head"><div><span class="eyebrow">Direzione</span><h3>Personalizza menu</h3><p>Scegli ordine e visibilità delle voci nel menu laterale.</p></div><button type="button" class="close" onclick="document.getElementById('v115MenuDialog').close()">×</button></div><div class="modal-body" id="v115MenuBody"></div><div class="modal-actions"><button class="btn" onclick="document.getElementById('v115MenuDialog').close()">Annulla</button><button class="btn primary" onclick="SPPlannerV115.saveMenu()">Salva menu</button></div></dialog>`);
    if(!$('#v115RulesDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115RulesDialog"><form id="v115RulesForm"><div class="modal-head"><div><span class="eyebrow">Regole operative</span><h3>Pianificazione produzione</h3><p>Queste regole guidano i consigli. Roberto può sempre scegliere diversamente.</p></div><button type="button" class="close" onclick="document.getElementById('v115RulesDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Cambio stampo da<input type="time" name="start" required></label><label class="field">Cambio stampo fino a<input type="time" name="end" required></label><label class="field">Tecnico disponibile<input name="technician" required></label><label class="field">Ordine urgente entro (giorni)<input type="number" min="0" max="30" name="urgency"></label><label class="field"><span>Giorni coperchi</span><span style="display:flex;gap:12px;padding:8px 0"><span><input type="checkbox" name="friday"> Venerdì</span><span><input type="checkbox" name="saturday"> Sabato</span></span></label><label class="field"><span>Preferenze</span><span style="display:grid;gap:7px;padding:8px 0"><span><input type="checkbox" name="preferInstalled"> Evita cambi stampo inutili</span><span><input type="checkbox" name="preferLids"> Coperchi a fine settimana</span></span></label></div><div class="notice ok" style="margin-top:10px"><strong>Principio:</strong> il sistema suggerisce. Non cambia mai automaticamente la pianificazione decisa da Roberto.</div></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115RulesDialog').close()">Annulla</button><button class="btn primary" type="submit">Salva regole</button></div></form></dialog>`);
    if(!$('#v115EmailImportDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailImportDialog"><form id="v115EmailImportForm"><div class="modal-head"><div><span class="eyebrow">Ordini da e-mail</span><h3>Importa e-mail di prova</h3><p>Incolla un ordine ricevuto: il sistema estrae i dati e crea solo una bozza da controllare.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailImportDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Mittente<input name="from" type="email" placeholder="cliente@azienda.it"></label><label class="field">Oggetto<input name="subject" placeholder="Ordine 123"></label><label class="field full">Testo e-mail<textarea name="body" rows="10" placeholder="Cliente: ...\nOrdine: ...\nProdotto: ...\nQuantità: 800 pz\nConsegna: 25/09/2026" required></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115EmailImportDialog').close()">Annulla</button><button class="btn primary" type="submit">Analizza e crea bozza</button></div></form></dialog>`);
    if(!$('#v115EmailDraftDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailDraftDialog"><form id="v115EmailDraftForm"><div class="modal-head"><div><span class="eyebrow">Controllo umano obbligatorio</span><h3>Verifica ordine e-mail</h3><p>Correggi i dati prima di creare l'ordine nella piattaforma.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailDraftDialog').close()">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Cliente<input name="client" required></label><label class="field">Rif. ordine<input name="orderRef"></label><label class="field full">Prodotto<input name="product" required></label><label class="field">Quantità<input name="qty" type="number" min="1" required></label><label class="field">Consegna<input name="dueDate" type="date"></label><label class="field">Formato<select name="liters"><option value="">Da verificare</option><option>3LT</option><option>5LT</option><option>14LT</option><option>18LT</option></select></label><label class="field">Priorità<select name="priority"><option>Normale</option><option>Urgente</option></select></label><div class="full"><span class="eyebrow">Testo originale</span><div id="v115EmailDraftSource" class="v115-source"></div></div></div></div><div class="modal-actions"><button type="button" class="btn" onclick="document.getElementById('v115EmailDraftDialog').close()">Chiudi</button><button class="btn primary" type="submit">Salva verifica</button></div></form></dialog>`);
    if(!$('#v115EmailSetupDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v115EmailSetupDialog"><div class="modal-head"><div><span class="eyebrow">Connessione e-mail</span><h3>Ordini automatici dalla casella</h3><p>Architettura pronta per una connessione OAuth server-side.</p></div><button type="button" class="close" onclick="document.getElementById('v115EmailSetupDialog').close()">×</button></div><div class="modal-body"><div class="v115-oauth"><div><b>1 · Casella ordini</b><p>Collegheremo la casella che riceve gli ordini (Gmail / Google Workspace o altro provider compatibile).</p></div><div><b>2 · Lettura sicura</b><p>Il token OAuth resta nel backend. Nessuna password e-mail viene inserita nel JavaScript o nell'APK.</p></div><div><b>3 · Bozza, non ordine automatico</b><p>Ogni e-mail diventa una bozza. Roberto o l'amministrazione controllano prima di creare l'ordine.</p></div><div><b>4 · Allegati</b><p>La fase successiva potrà leggere anche PDF/Excel allegati e collegarli all'ordine originale.</p></div></div><div class="notice warn" style="margin-top:12px"><strong>Da configurare:</strong> provider e casella ordini. La V11.5 include già l'Inbox e il flusso di verifica.</div></div><div class="modal-actions"><button class="btn primary" onclick="document.getElementById('v115EmailSetupDialog').close()">OK</button></div></dialog>`);
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
    ensureState();injectStyles();ensureView();ensureDialogs();addNav();patchRenderNav();patchRenderCurrent();version();
    try{renderNav()}catch(_){}applyMenuPrefs();
    setTimeout(()=>{version();applyMenuPrefs();if(typeof currentView!=='undefined'&&currentView===VIEW)renderPlanner()},600);
  }

  window.SPPlannerV115={
    refresh:renderPlanner,move:moveRun,lock:toggleLock,apply:applySuggestions,menu:openMenu,saveMenu,rules:openRules,
    importEmail:openImportEmail,editEmail,toOrder,emailSetup,
    suggest:()=>Object.fromEntries(machineList().map(m=>[m.id,suggestedForMachine(m.id).map(r=>({id:r.id,orderCode:r.orderCode,score:runScore(r).score,reason:reasonText(r,0)}))])),
    rulesData:rules
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

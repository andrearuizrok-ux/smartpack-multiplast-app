(()=>{
'use strict';
if(window.SPV11931)return;
const BUILD='V11.9.32';
const $=(id)=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number.isFinite(Number(v))?Number(v):0;
let lastMoldMachine='';

function ensureState(){
  state.scheduledMoldChangesV11931=Array.isArray(state.scheduledMoldChangesV11931)?state.scheduledMoldChangesV11931:[];
}
function machine(id){return (state.machines||[]).find(x=>String(x.id)===String(id))||null}
function mold(id){return (state.molds||[]).find(x=>String(x.id)===String(id))||null}
function queued(machineId){return (state.productionRuns||[]).filter(r=>String(r.machineId)===String(machineId)&&r.status==='In coda'&&Math.max(0,n(r.qty)-n(r.produced))>0)}
function persist(msg=''){try{save()}catch(_){}if(msg){try{toast(msg)}catch(_){}}}

function reorderForInstalledMold(machineId){
  const m=machine(machineId);if(!m?.installedMoldId)return;
  // Se è stato registrato un cambio fisico di stampo, una produzione attiva legata
  // allo stampo precedente non può restare attiva sulla stessa pressa.
  for(const r of state.productionRuns||[]){
    if(String(r.machineId)!==String(machineId))continue;
    if(!['In produzione','Bloccata'].includes(String(r.status||'')))continue;
    if(String(r.moldId||'')===String(m.installedMoldId))continue;
    r.status='In coda';
    r.note=[r.note,'Sospesa automaticamente: cambio stampo registrato sulla pressa'].filter(Boolean).join(' · ');
  }
  const list=queued(machineId).slice().sort((a,b)=>n(a.sequence)-n(b.sequence));
  const yes=list.filter(r=>String(r.moldId)===String(m.installedMoldId));
  const no=list.filter(r=>String(r.moldId)!==String(m.installedMoldId));
  [...yes,...no].forEach((r,i)=>{r.sequence=(i+1)*10});
  try{if(typeof addAudit==='function')addAudit('Coda riallineata allo stampo installato',machineId,`${mold(m.installedMoldId)?.name||m.installedMoldId} · ${yes.length} produzioni compatibili prima`)}catch(_){}
  persist();
}
function compatibleSummary(machineId){
  const m=machine(machineId),mid=m?.installedMoldId;
  const q=queued(machineId).filter(r=>String(r.moldId)===String(mid));
  const pieces=q.reduce((s,r)=>s+Math.max(0,n(r.qty)-n(r.produced)),0);
  return {q,pieces,name:mold(mid)?.name||'non indicato'};
}

function relocateAssistant(){
  if(typeof currentView!=='undefined'&&currentView!=='presses')return;
  const view=$('pressesView'),planner=$('sp103Planner');if(!view||!planner)return;
  // Material coverage belongs to queue/dashboard, never to press configuration.
  $('sp128MaterialCoverage')?.remove();$('sp128PlannerStep')?.remove();$('sp128ConfigDivider')?.remove();
  const grid=view.querySelector('.press-settings-grid');
  if(grid&&planner.nextElementSibling!==grid)grid.insertAdjacentElement('beforebegin',planner);
  decorateAssistant();
}
function suggestedMold(machineId){
  try{const rows=planningRows103();const p=planForMachine103(machineId,rows);return p?.choice?.moldId||''}catch(_){return ''}
}
function decorateAssistant(){
  const planner=$('sp103Planner');if(!planner)return;
  const cards=[...planner.querySelectorAll('.sp103-plan-card')];
  ['P1','P2'].forEach((machineId,i)=>{
    const card=cards[i];if(!card)return;
    let tools=card.querySelector('.sp11931-tools');
    if(!tools){tools=document.createElement('div');tools.className='sp11931-tools';card.appendChild(tools)}
    const sum=compatibleSummary(machineId),sid=suggestedMold(machineId),m=machine(machineId);
    tools.innerHTML=`<div class="sp11931-compatible"><span>CON LO STAMPO INSTALLATO</span><b>${esc(sum.name)}</b><small>${sum.q.length?`${sum.q.length} produzioni compatibili · ${sum.pieces.toLocaleString('it-IT')} pz residui`:'Nessuna produzione in coda per questo stampo'}</small></div><button type="button" class="btn primary" data-plan-mold="${machineId}" data-suggest="${esc(sid)}">Programma cambio stampo</button>${m?.installedMoldId?`<button type="button" class="btn" data-align-mold="${machineId}">Mostra prima produzioni compatibili</button>`:''}`;
  });
  planner.querySelectorAll('[data-plan-mold]').forEach(b=>b.onclick=()=>openSchedule(b.dataset.planMold,b.dataset.suggest||''));
  planner.querySelectorAll('[data-align-mold]').forEach(b=>b.onclick=()=>{reorderForInstalledMold(b.dataset.alignMold);refreshPlanning()});
}

function ensureDialog(){
  if($('sp11931MoldDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="sp11931MoldDialog" class="sp11931-dialog"><form id="sp11931MoldForm"><div class="modal-head"><div><span class="eyebrow">PIANIFICAZIONE CAMBIO STAMPO</span><h3>Programma cambio stampo</h3><p>Programma il cambio in anticipo. Quando viene registrato come eseguito, la coda della pressa viene riallineata allo stampo realmente installato.</p></div><button type="button" class="close" data-close>×</button></div><div class="modal-body"><input type="hidden" name="machineId"><div class="form-grid"><label class="field">Pressa<input name="machineName" disabled></label><label class="field">Nuovo stampo<select name="moldId" required></select></label><label class="field">Data<input name="date" type="date" required></label><label class="field">Ora<input name="time" type="time" required></label></div><label class="field">Nota<textarea name="note" placeholder="Es. cambio con Saverio, preparare stampo prima del turno"></textarea></label><div class="notice ok"><strong>Dopo il cambio:</strong> la pressa mostrerà prima gli ordini collegati esattamente allo stampo registrato.</div></div><div class="modal-actions"><button type="button" class="btn" data-close>Annulla</button><button type="button" class="btn" id="sp11931ExecuteNow">Registra cambio eseguito adesso</button><button class="btn primary" type="submit">Salva programmazione</button></div></form></dialog>`);
  const d=$('sp11931MoldDialog');d.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>d.close());
  $('sp11931MoldForm').onsubmit=e=>{e.preventDefault();ensureState();const f=new FormData(e.currentTarget),rec={id:'MC-'+Date.now(),machineId:String(f.get('machineId')),moldId:String(f.get('moldId')),date:String(f.get('date')),time:String(f.get('time')),note:String(f.get('note')||''),status:'Programmato',createdAt:new Date().toISOString()};state.scheduledMoldChangesV11931.unshift(rec);persist('Cambio stampo programmato');d.close();refreshPlanning()};
  $('sp11931ExecuteNow').onclick=()=>{const f=new FormData($('sp11931MoldForm')),machineId=String(f.get('machineId')),moldId=String(f.get('moldId'));if(!machineId||!moldId)return;const m=machine(machineId);if(!m)return;m.installedMoldId=moldId;ensureState();state.scheduledMoldChangesV11931.unshift({id:'MC-'+Date.now(),machineId,moldId,date:new Date().toISOString().slice(0,10),time:new Date().toTimeString().slice(0,5),note:String(f.get('note')||''),status:'Eseguito',createdAt:new Date().toISOString(),executedAt:new Date().toISOString()});reorderForInstalledMold(machineId);persist('Cambio stampo registrato e coda aggiornata');d.close();try{renderPressSettingsV51()}catch(_){}refreshPlanning()};
}
function openSchedule(machineId,suggested=''){
  ensureDialog();const d=$('sp11931MoldDialog'),m=machine(machineId),molds=(state.molds||[]).filter(x=>String(x.machineId)===String(machineId));
  const form=$('sp11931MoldForm');form.elements.machineId.value=machineId;form.elements.machineName.value=m?.name||machineId;form.elements.moldId.innerHTML=molds.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(suggested||m?.installedMoldId)?'selected':''}>${esc(x.name)}</option>`).join('');
  const dt=new Date();dt.setDate(dt.getDate()+1);form.elements.date.value=dt.toISOString().slice(0,10);form.elements.time.value='06:00';form.elements.note.value='';d.showModal();
}
function refreshPlanning(){try{if(typeof renderPlanner==='function')renderPlanner()}catch(_){}try{window.SPPlannerV103?.refresh?.()}catch(_){}setTimeout(relocateAssistant,40)}

function patchMoldConfig(){
  if(window.v5OpenMolds&&!window.v5OpenMolds.__sp11931){const old=window.v5OpenMolds;const w=function(machineId){lastMoldMachine=String(machineId||'');return old.apply(this,arguments)};w.__sp11931=true;window.v5OpenMolds=w}
  const form=$('moldConfigV5Form');if(form&&form.onsubmit&&!form.onsubmit.__sp11931){const old=form.onsubmit;const w=function(e){const machineId=lastMoldMachine,sel=$('installedMoldSelectV5')?.value||'';const before=machine(machineId)?.installedMoldId||'';const r=old.call(this,e);if(machineId&&sel&&sel!==before){setTimeout(()=>{reorderForInstalledMold(machineId);refreshPlanning();try{renderProduction()}catch(_){}},0)}return r};w.__sp11931=true;form.onsubmit=w}
}

function financeStrict(){
  const view=$('adminFinanceV1170View');if(!view)return;
  let st=$('sp11931FinanceStyle');if(!st){st=document.createElement('style');st.id='sp11931FinanceStyle';st.textContent=`#adminFinanceV1170View> *:not([data-nf23-host]){display:none!important}#adminFinanceV1170View>[data-nf23-host]{display:block!important;margin-top:0!important}`;document.head.appendChild(st)}
  try{window.SPNomyraFinanceLiveV11923?.render?.()}catch(_){}
  const host=view.querySelector('[data-nf23-host]');if(host)host.style.display='block';
}

function styles(){if($('sp11931Style'))return;const s=document.createElement('style');s.id='sp11931Style';s.textContent=`
.sp11931-tools{margin-top:12px;padding-top:12px;border-top:1px solid #e4ecef;display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center}.sp11931-compatible span,.sp11931-compatible b,.sp11931-compatible small{display:block}.sp11931-compatible span{font-size:8px;font-weight:950;color:#69808a;letter-spacing:.05em}.sp11931-compatible b{font-size:12px;margin-top:3px}.sp11931-compatible small{font-size:9px;color:#71858e;margin-top:2px}.sp11931-dialog{width:min(760px,94vw)}
#pressesView #sp103Planner{order:-1;margin-top:12px;margin-bottom:16px}.sp103-planner .sp103-plan-card{overflow:visible}
@media(max-width:850px){.sp11931-tools{grid-template-columns:1fr}.sp11931-tools .btn{width:100%}}
`;document.head.appendChild(s)}

function patchRenderers(){
  try{const old=window.renderPressSettingsV51;if(typeof old==='function'&&!old.__sp11931){const w=function(){const r=old.apply(this,arguments);setTimeout(()=>{patchMoldConfig();relocateAssistant()},30);return r};w.__sp11931=true;window.renderPressSettingsV51=w;try{renderPressSettingsV51=w}catch(_){}}}catch(_){}
  try{const old=window.renderCurrent||((typeof renderCurrent==='function')?renderCurrent:null);if(typeof old==='function'&&!old.__sp11931){const w=function(){const r=old.apply(this,arguments);setTimeout(()=>{if(currentView==='presses')relocateAssistant();if(currentView==='finance'||currentView==='adminFinance')financeStrict();if($('adminFinanceV1170View')?.classList.contains('active'))financeStrict()},30);return r};w.__sp11931=true;window.renderCurrent=w;try{renderCurrent=w}catch(_){}}}catch(_){}
}
function boot(){ensureState();styles();ensureDialog();patchMoldConfig();patchRenderers();setTimeout(relocateAssistant,100);setTimeout(financeStrict,200);const press=$('pressesView');if(press&&!press.dataset.sp11931){press.dataset.sp11931='1';new MutationObserver(()=>setTimeout(relocateAssistant,10)).observe(press,{childList:true,subtree:false})}const fin=$('adminFinanceV1170View');if(fin&&!fin.dataset.sp11931){fin.dataset.sp11931='1';new MutationObserver(()=>setTimeout(financeStrict,10)).observe(fin,{childList:true,subtree:false,attributes:true,attributeFilter:['class']})}document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/,'V11.9.32')}
window.SPV11931={reorderForInstalledMold,openSchedule,financeStrict,relocateAssistant};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

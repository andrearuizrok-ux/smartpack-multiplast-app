
(()=>{
'use strict';
if(window.SPWorkerMixtures11949)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

function ensureState(){
  state.smartPackMixturesV11949=Array.isArray(state.smartPackMixturesV11949)?state.smartPackMixturesV11949:[];
  state.rawMaterialLots=Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[];
  state.productionRuns=Array.isArray(state.productionRuns)?state.productionRuns:[];
  state.rawMaterialMovements=Array.isArray(state.rawMaterialMovements)?state.rawMaterialMovements:[];
  state.productionEvents=Array.isArray(state.productionEvents)?state.productionEvents:[];
}
function saveState(){
  try{save()}catch(_){
    try{localStorage.setItem('industrial_os_v2_state',JSON.stringify(state))}catch(__){}
  }
}
function operatorName(){
  return $('#poi11930OperatorBadge b')?.textContent?.trim()
    || $('.account-user-name')?.textContent?.trim()
    || 'Operatore';
}
function materialNames(){
  ensureState();
  return [...new Set(state.rawMaterialLots
    .map(x=>String(x.materialName||x.category||'').trim())
    .filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'it'));
}
function stockMap(){
  const m=new Map();
  for(const l of state.rawMaterialLots){
    const name=String(l.materialName||l.category||'').trim();
    if(!name)continue;
    const av=Math.max(0,N(l.qtyReceived)-N(l.qtyConsumed));
    m.set(name,(m.get(name)||0)+av);
  }
  return m;
}
function mixtures(){ensureState();return state.smartPackMixturesV11949}
function mix(id){return mixtures().find(x=>String(x.id)===String(id))}
function mixAvailableKg(m){
  if(!m?.components?.length)return 0;
  const stock=stockMap();
  let possible=Infinity;
  for(const c of m.components){
    const pct=N(c.pct)/100;
    if(pct<=0)continue;
    possible=Math.min(possible,(stock.get(c.material)||0)/pct);
  }
  return Number.isFinite(possible)?Math.max(0,possible):0;
}
function validComponents(rows){
  const clean=rows
    .map(x=>({material:String(x.material||'').trim(),pct:N(x.pct)}))
    .filter(x=>x.material&&x.pct>0);
  const total=clean.reduce((a,b)=>a+b.pct,0);
  return {clean,total};
}
function ensureDialog(){
  if($('#mix11949Dialog'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <dialog id="mix11949Dialog" class="mix11949-dialog">
      <div class="modal-head">
        <div><span class="eyebrow">PRODUZIONE · MATERIE PRIME</span><h3 id="mix11949Title">Nuova miscela</h3><p>Crea la miscela scegliendo esclusivamente materiali presenti nel magazzino materie prime.</p></div>
        <button class="close" type="button" onclick="document.getElementById('mix11949Dialog').close()">×</button>
      </div>
      <form id="mix11949Form">
        <div class="modal-body">
          <input type="hidden" id="mix11949Id">
          <label class="field">Nome miscela<input id="mix11949Name" required placeholder="Es. PP bianco standard"></label>
          <div class="mix11949-components" id="mix11949Components"></div>
          <div class="mix11949-total"><span>Totale composizione</span><b id="mix11949Total">0%</b></div>
          <div class="mix11949-help">La somma delle percentuali deve essere esattamente 100%. Il materiale non viene scaricato al salvataggio della miscela: il consumo sarà collegato alla produzione effettiva.</div>
        </div>
        <div class="modal-actions">
          <button class="btn" type="button" onclick="document.getElementById('mix11949Dialog').close()">Annulla</button>
          <button class="btn primary" type="submit">Salva miscela</button>
        </div>
      </form>
    </dialog>

    <dialog id="assignMix11949Dialog" class="mix11949-dialog">
      <div class="modal-head">
        <div><span class="eyebrow">AVVIO PRODUZIONE</span><h3>Seleziona la miscela utilizzata</h3><p id="assignMix11949Info">La miscela resterà collegata all'ordine e alla tracciabilità.</p></div>
        <button class="close" type="button" onclick="document.getElementById('assignMix11949Dialog').close()">×</button>
      </div>
      <form id="assignMix11949Form">
        <div class="modal-body">
          <input type="hidden" id="assignMix11949RunId">
          <label class="field">Miscela
            <select id="assignMix11949Select" required></select>
          </label>
          <div id="assignMix11949Preview"></div>
        </div>
        <div class="modal-actions">
          <button class="btn" type="button" onclick="document.getElementById('assignMix11949Dialog').close()">Annulla</button>
          <button class="btn primary" type="submit">Conferma miscela e continua</button>
        </div>
      </form>
    </dialog>`);
  $('#mix11949Form').onsubmit=saveMixture;
  $('#assignMix11949Form').onsubmit=confirmAssignment;
  $('#assignMix11949Select').onchange=renderAssignPreview;
}
function componentRow(c={},i=0){
  const opts=materialNames().map(n=>`<option value="${E(n)}" ${n===c.material?'selected':''}>${E(n)}</option>`).join('');
  return `<div class="mix11949-comp" data-mix11949-row>
    <label>Materia prima<select data-mix11949-material required><option value="">Seleziona materiale...</option>${opts}</select></label>
    <label>Percentuale %<input data-mix11949-pct type="number" min="0.01" max="100" step="0.01" value="${c.pct||''}" required></label>
    <div class="mix11949-stock"><span>Disponibile</span><b data-mix11949-stock>—</b></div>
    <button type="button" class="btn small danger" data-mix11949-remove>Rimuovi</button>
  </div>`;
}
function bindRows(){
  const box=$('#mix11949Components');
  $$('[data-mix11949-row]',box).forEach(row=>{
    $('[data-mix11949-material]',row).onchange=()=>{updateRowStock(row);updateTotal()};
    $('[data-mix11949-pct]',row).oninput=updateTotal;
    $('[data-mix11949-remove]',row).onclick=()=>{row.remove();updateTotal()};
    updateRowStock(row);
  });
  updateTotal();
}
function updateRowStock(row){
  const n=$('[data-mix11949-material]',row)?.value||'';
  const kg=stockMap().get(n)||0;
  const out=$('[data-mix11949-stock]',row);
  if(out)out.textContent=n?`${kg.toLocaleString('it-IT',{maximumFractionDigits:2})} kg`:'—';
}
function updateTotal(){
  const total=$$('[data-mix11949-pct]','#mix11949Components').reduce((s,x)=>s+N(x.value),0);
  const el=$('#mix11949Total');if(el){
    el.textContent=`${total.toLocaleString('it-IT',{maximumFractionDigits:2})}%`;
    el.className=Math.abs(total-100)<0.005?'ok':'bad';
  }
}
function openMixture(id=''){
  ensureDialog();
  const m=id?mix(id):null;
  $('#mix11949Id').value=m?.id||'';
  $('#mix11949Name').value=m?.name||'';
  $('#mix11949Title').textContent=m?'Modifica miscela':'Nuova miscela';
  const comps=(m?.components?.length?m.components:[{},{}]);
  $('#mix11949Components').innerHTML=comps.map(componentRow).join('')+`<button type="button" id="mix11949Add" class="btn small">+ Aggiungi componente</button>`;
  $('#mix11949Add').onclick=()=>{
    $('#mix11949Add').insertAdjacentHTML('beforebegin',componentRow({}));
    bindRows();
  };
  bindRows();
  $('#mix11949Dialog').showModal();
}
function saveMixture(e){
  e.preventDefault();ensureState();
  const rows=$$('[data-mix11949-row]','#mix11949Components').map(r=>({
    material:$('[data-mix11949-material]',r)?.value||'',
    pct:$('[data-mix11949-pct]',r)?.value||0
  }));
  const {clean,total}=validComponents(rows);
  if(!clean.length){alert('Inserisci almeno un componente.');return}
  if(Math.abs(total-100)>0.005){alert(`La composizione deve essere 100%. Totale attuale: ${total.toLocaleString('it-IT',{maximumFractionDigits:2})}%.`);return}
  if(new Set(clean.map(x=>x.material)).size!==clean.length){alert('La stessa materia prima non può comparire due volte nella stessa miscela.');return}
  const name=$('#mix11949Name').value.trim();
  const id=$('#mix11949Id').value;
  const existing=id?mix(id):null;
  if(existing){
    existing.name=name;existing.components=clean;existing.updatedAt=new Date().toISOString();existing.updatedBy=operatorName();
  }else{
    state.smartPackMixturesV11949.unshift({id:uid('mix'),name,components:clean,createdAt:new Date().toISOString(),createdBy:operatorName()});
  }
  saveState();$('#mix11949Dialog').close();renderWorkerPanel();
}
function deleteMixture(id){
  const m=mix(id);if(!m)return;
  const used=(state.productionRuns||[]).some(r=>String(r.mixtureIdV11949||'')===String(id));
  if(used){alert('Questa miscela è già collegata a una produzione e non può essere eliminata. Puoi modificarne il nome solo dopo aver verificato la tracciabilità.');return}
  if(!confirm(`Eliminare la miscela "${m.name}"?`))return;
  state.smartPackMixturesV11949=mixtures().filter(x=>x.id!==id);saveState();renderWorkerPanel();
}
function activeRuns(){
  ensureState();
  return state.productionRuns
    .filter(r=>!['Completata','Chiuso parziale','Annullata'].includes(String(r.status||'')))
    .slice()
    .sort((a,b)=>N(a.sequence)-N(b.sequence))
    .slice(0,20);
}
function assignSelectOptions(selected=''){
  return `<option value="">Seleziona miscela...</option>`+mixtures().map(m=>`<option value="${E(m.id)}" ${String(m.id)===String(selected)?'selected':''}>${E(m.name)}</option>`).join('');
}
function openAssign(runId,continueStart=false){
  ensureDialog();
  const r=(state.productionRuns||[]).find(x=>String(x.id)===String(runId));if(!r)return;
  if(!mixtures().length){alert('Prima registra almeno una miscela di produzione.');openMixture();return}
  $('#assignMix11949RunId').value=runId;
  $('#assignMix11949Select').innerHTML=assignSelectOptions(r.mixtureIdV11949||'');
  $('#assignMix11949Dialog').dataset.continueStart=continueStart?'1':'0';
  $('#assignMix11949Info').textContent=`Ordine ${r.orderCode||r.parent||'—'} · ${r.product||''}. La miscela resterà registrata con l'operatore ${operatorName()}.`;
  renderAssignPreview();
  $('#assignMix11949Dialog').showModal();
}
function renderAssignPreview(){
  const id=$('#assignMix11949Select')?.value||'';
  const m=mix(id),box=$('#assignMix11949Preview');if(!box)return;
  if(!m){box.innerHTML='<div class="mix11949-empty">Seleziona una miscela per vedere disponibilità e composizione.</div>';return}
  const stock=stockMap(),kg=mixAvailableKg(m);
  box.innerHTML=`<div class="mix11949-preview"><div class="mix11949-preview-head"><b>${E(m.name)}</b><span>Potenziale miscela disponibile: <strong>${kg.toLocaleString('it-IT',{maximumFractionDigits:2})} kg</strong></span></div>
    ${m.components.map(c=>`<div><span>${E(c.material)}</span><b>${N(c.pct).toLocaleString('it-IT',{maximumFractionDigits:2})}%</b><small>${(stock.get(c.material)||0).toLocaleString('it-IT',{maximumFractionDigits:2})} kg disponibili</small></div>`).join('')}</div>`;
}
function linkMixtureToRun(r,m){
  const now=new Date().toISOString(),op=operatorName();
  r.mixtureIdV11949=m.id;r.mixtureNameV11949=m.name;r.mixtureComponentsV11949=m.components.map(x=>({...x}));r.mixtureAssignedAtV11949=now;r.mixtureAssignedByV11949=op;
  for(const o of (state.orders||[]).filter(x=>String(x.code)===String(r.orderCode)||String(x.parent)===String(r.parent))){
    o.mixtureIdV11949=m.id;o.mixtureNameV11949=m.name;o.mixtureComponentsV11949=m.components.map(x=>({...x}));o.mixtureAssignedAtV11949=now;o.mixtureAssignedByV11949=op;
  }
  for(const s of (state.productionSheets||[]).filter(x=>String(x.orderCode)===String(r.orderCode)||String(x.parent)===String(r.parent))){
    s.mixtureIdV11949=m.id;s.mixtureNameV11949=m.name;s.mixtureComponentsV11949=m.components.map(x=>({...x}));
    for(const row of (s.rows||[]))if(String(row.orderCode)===String(r.orderCode)){row.mixtureIdV11949=m.id;row.mixtureNameV11949=m.name}
  }
  state.productionEvents.unshift({id:uid('mixev'),runId:r.id,orderCode:r.orderCode,parent:r.parent,at:now,kind:'miscela assegnata',operator:op,note:`Miscela ${m.name}`,mixtureIdV11949:m.id,mixtureNameV11949:m.name,componentsV11949:m.components.map(x=>({...x}))});
  try{addAudit?.('Miscela produzione assegnata',r.orderCode||r.parent,`${m.name} · ${op}`)}catch(_){}
}
function confirmAssignment(e){
  e.preventDefault();
  const runId=$('#assignMix11949RunId').value,m=mix($('#assignMix11949Select').value),r=(state.productionRuns||[]).find(x=>String(x.id)===String(runId));
  if(!r||!m){alert('Seleziona una miscela valida.');return}
  linkMixtureToRun(r,m);saveState();
  const go=$('#assignMix11949Dialog').dataset.continueStart==='1';
  $('#assignMix11949Dialog').close();renderWorkerPanel();
  if(go && typeof window.__mix11949OriginalStart==='function')setTimeout(()=>window.__mix11949OriginalStart(runId),40);
}
function runRows(){
  const runs=activeRuns();
  if(!runs.length)return '<div class="mix11949-empty"><b>Nessuna produzione da avviare.</b><span>Quando Roberto mette un ordine in coda apparirà qui.</span></div>';
  return runs.map(r=>{
    const m=r.mixtureIdV11949?mix(r.mixtureIdV11949):null;
    return `<article class="mix11949-run ${m?'assigned':''}">
      <div><span>${E(r.status||'In coda')}</span><b>Ordine ${E(r.orderCode||r.parent||'—')} · ${E(r.product||'')}</b><small>${E(r.client||'')} · ${N(r.qty).toLocaleString('it-IT')} pz</small></div>
      <div class="mix11949-run-mix"><span>Miscela</span><b>${m?E(m.name):'Da selezionare'}</b><small>${m?`${mixAvailableKg(m).toLocaleString('it-IT',{maximumFractionDigits:1})} kg miscela potenzialmente disponibili`:'Obbligatoria prima dell’avvio'}</small></div>
      <button class="btn ${m?'':'primary'}" type="button" onclick="SPWorkerMixtures11949.assign('${E(r.id)}')">${m?'Cambia miscela':'Seleziona miscela'}</button>
    </article>`;
  }).join('');
}
function mixtureCards(){
  if(!mixtures().length)return '<div class="mix11949-empty"><b>Nessuna miscela registrata.</b><span>Crea la prima miscela usando le materie prime già presenti in magazzino.</span></div>';
  const stock=stockMap();
  return mixtures().map(m=>`<article class="mix11949-card">
    <div class="mix11949-card-head"><div><b>${E(m.name)}</b><span>${m.components.length} componenti · creata da ${E(m.createdBy||'Operatore')}</span></div><strong>${mixAvailableKg(m).toLocaleString('it-IT',{maximumFractionDigits:1})} kg</strong></div>
    <div class="mix11949-components-mini">${m.components.map(c=>`<span>${E(c.material)} <b>${N(c.pct).toLocaleString('it-IT',{maximumFractionDigits:2})}%</b><small>${(stock.get(c.material)||0).toLocaleString('it-IT',{maximumFractionDigits:1})} kg</small></span>`).join('')}</div>
    <div class="mix11949-card-actions"><button class="btn small" onclick="SPWorkerMixtures11949.edit('${E(m.id)}')">Modifica</button><button class="btn small danger" onclick="SPWorkerMixtures11949.remove('${E(m.id)}')">Elimina</button></div>
  </article>`).join('');
}
function renderWorkerPanel(){
  if(typeof currentRole==='undefined'||currentRole!=='worker')return;
  ensureState();ensureDialog();
  const view=$('#productionView');if(!view)return;
  let panel=$('#workerMixtures11949',view);
  if(!panel){panel=document.createElement('section');panel.id='workerMixtures11949';panel.className='mix11949-panel';}
  panel.innerHTML=`<div class="mix11949-head">
      <div><span class="eyebrow">MATERIALE DI PRODUZIONE</span><h3>Miscele di lavoro</h3><p>Registra le miscele che utilizzerai e collegale all'ordine prima di avviare la produzione.</p></div>
      <button class="btn primary" type="button" onclick="SPWorkerMixtures11949.newMix()">+ Nuova miscela</button>
    </div>
    <div class="mix11949-layout">
      <div><div class="mix11949-subhead"><b>Miscele registrate</b><span>Collegate al magazzino materie prime</span></div><div class="mix11949-cards">${mixtureCards()}</div></div>
      <div><div class="mix11949-subhead"><b>Ordini da avviare / in corso</b><span>La miscela resta salvata nella tracciabilità</span></div><div class="mix11949-runs">${runRows()}</div></div>
    </div>`;
  const badge=$('#poi11930OperatorBadge',view);
  if(badge)badge.insertAdjacentElement('afterend',panel);
  else{
    const logistics=$('[data-v1170-logistics]',view);
    if(logistics)logistics.insertAdjacentElement('afterend',panel);else view.prepend(panel);
  }
}
function patchStart(){
  if(typeof window.v106StartRun!=='function')return;
  if(window.v106StartRun.__mix11949)return;
  const old=window.v106StartRun;
  window.__mix11949OriginalStart=old;
  const wrapped=function(id){
    const r=(state.productionRuns||[]).find(x=>String(x.id)===String(id));
    if(r && !r.mixtureIdV11949){
      openAssign(id,true);
      return;
    }
    return old.apply(this,arguments);
  };
  wrapped.__mix11949=true;
  window.v106StartRun=wrapped;
}
function patchProgress(){
  const old=window.v5OpenProgress;
  if(typeof old!=='function'||old.__mix11949)return;
  const wrapped=function(id){
    const r=(state.productionRuns||[]).find(x=>String(x.id)===String(id));
    if(r && !r.mixtureIdV11949 && ['In coda','In pausa','In attesa'].includes(String(r.status||''))){
      openAssign(id,false);
      return;
    }
    const out=old.apply(this,arguments);
    setTimeout(()=>decorateProgress(id),80);
    return out;
  };
  wrapped.__mix11949=true;
  window.v5OpenProgress=wrapped;
  try{v5OpenProgress=wrapped}catch(_){}
}
function decorateProgress(id){
  const dlg=$('#progressRunDialog');if(!dlg)return;
  const r=(state.productionRuns||[]).find(x=>String(x.id)===String(id));if(!r)return;
  let box=$('#mix11949ProgressInfo',dlg);
  if(!box){
    box=document.createElement('div');box.id='mix11949ProgressInfo';box.className='mix11949-progress';
    const info=$('#progressRunInfo',dlg);if(info)info.insertAdjacentElement('afterend',box);
  }
  const m=r.mixtureIdV11949?mix(r.mixtureIdV11949):null;
  box.innerHTML=`<div><span>Miscela utilizzata</span><b>${m?E(m.name):'Non selezionata'}</b><small>${m?m.components.map(c=>`${E(c.material)} ${N(c.pct)}%`).join(' · '):'Seleziona la miscela prima di registrare la produzione.'}</small></div>
    <button type="button" class="btn small" onclick="SPWorkerMixtures11949.assign('${E(r.id)}')">${m?'Cambia':'Seleziona'}</button>`;
}
function styles(){
  if($('#mix11949Style'))return;
  const s=document.createElement('style');s.id='mix11949Style';s.textContent=`
  .mix11949-panel{margin:0 0 14px;border:1px solid #d9e7e3;border-radius:18px;background:#fff;overflow:hidden}
  .mix11949-head{padding:16px 18px;display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:1px solid #e7eeec;background:#fbfdfc}.mix11949-head h3{margin:3px 0 4px;font-size:19px}.mix11949-head p{margin:0;color:#647a74;font-size:11px}
  .mix11949-layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:0}.mix11949-layout>div{padding:14px}.mix11949-layout>div+div{border-left:1px solid #e6eeeb}
  .mix11949-subhead{display:flex;justify-content:space-between;gap:12px;margin-bottom:9px}.mix11949-subhead b{font-size:12px}.mix11949-subhead span{font-size:9px;color:#748780}
  .mix11949-cards,.mix11949-runs{display:grid;gap:8px}.mix11949-card,.mix11949-run{border:1px solid #dfe9e6;border-radius:13px;padding:11px;background:#fff}.mix11949-card-head,.mix11949-run{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.mix11949-card-head b{display:block;font-size:12px}.mix11949-card-head span{font-size:8.5px;color:#71837d}.mix11949-card-head strong{font-size:15px;color:#20735c}
  .mix11949-components-mini{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.mix11949-components-mini>span{padding:6px 8px;border-radius:9px;background:#f3f8f6;font-size:8px;color:#536a62}.mix11949-components-mini small{margin-left:4px;color:#82928d}.mix11949-card-actions{display:flex;gap:6px;margin-top:8px}
  .mix11949-run{grid-template-columns:1.2fr .9fr auto}.mix11949-run>div>span,.mix11949-run-mix>span{display:block;font-size:8px;color:#6f817b;font-weight:800}.mix11949-run>div>b,.mix11949-run-mix>b{display:block;font-size:11px;margin-top:2px}.mix11949-run small{display:block;font-size:8px;color:#74847f;margin-top:2px}.mix11949-run.assigned{background:#f5fbf8;border-color:#cce5d9}
  .mix11949-empty{padding:16px;border:1px dashed #d7e3df;border-radius:12px;text-align:center;color:#647870}.mix11949-empty b,.mix11949-empty span{display:block}.mix11949-empty span{font-size:9px;margin-top:3px}
  .mix11949-dialog{width:min(800px,95vw)}.mix11949-components{display:grid;gap:8px;margin-top:12px}.mix11949-comp{display:grid;grid-template-columns:1.4fr .65fr .75fr auto;gap:8px;align-items:end;padding:10px;border:1px solid #e0e9e6;border-radius:11px;background:#fafcfb}.mix11949-comp label,.mix11949-stock span{font-size:8px;font-weight:800;color:#60766e}.mix11949-comp select,.mix11949-comp input{display:block;width:100%;margin-top:4px;padding:9px;border:1px solid #d3e0dc;border-radius:9px}.mix11949-stock b{display:block;margin-top:5px;font-size:10px}.mix11949-total{margin-top:10px;display:flex;justify-content:space-between;padding:10px 12px;border-radius:10px;background:#f4f8f6}.mix11949-total b.ok{color:#187154}.mix11949-total b.bad{color:#b2414a}.mix11949-help{margin-top:8px;padding:10px;border-radius:10px;background:#eef6f3;font-size:9px;line-height:1.45;color:#587067}
  .mix11949-preview{margin-top:12px;border:1px solid #dde8e4;border-radius:12px;padding:12px}.mix11949-preview-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}.mix11949-preview-head span{font-size:9px;color:#64766f}.mix11949-preview>div:not(.mix11949-preview-head){display:grid;grid-template-columns:1fr auto auto;gap:8px;padding:7px 0;border-top:1px solid #edf2f0;font-size:9px}.mix11949-preview small{color:#778982}
  .mix11949-progress{margin:10px 0;padding:10px 12px;border:1px solid #cfe2da;border-radius:11px;background:#f4faf7;display:flex;align-items:center;justify-content:space-between;gap:10px}.mix11949-progress span,.mix11949-progress small{display:block;font-size:8px;color:#657a72}.mix11949-progress b{display:block;font-size:11px;margin:2px 0}
  @media(max-width:900px){.mix11949-layout{grid-template-columns:1fr}.mix11949-layout>div+div{border-left:0;border-top:1px solid #e6eeeb}.mix11949-run{grid-template-columns:1fr}.mix11949-comp{grid-template-columns:1fr 1fr}.mix11949-comp .btn{grid-column:1/-1}}
  `;document.head.appendChild(s);
}
function boot(){
  ensureState();styles();ensureDialog();
  const tick=()=>{if(typeof currentRole!=='undefined'&&currentRole==='worker'&&$('#productionView')?.classList.contains('active')){patchStart();patchProgress();renderWorkerPanel()}};
  [150,500,1200,2500].forEach(ms=>setTimeout(tick,ms));
  setInterval(tick,2500);
}
window.SPWorkerMixtures11949={
  version:'V11.9.49',
  newMix:()=>openMixture(''),
  edit:openMixture,
  remove:deleteMixture,
  assign:(id)=>openAssign(id,false),
  render:renderWorkerPanel
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


(()=>{
'use strict';
if(window.SPWorkerMixturesV11955)return;

const $=(s,r=document)=>{
  const root=typeof r==='string'?document.querySelector(r):r;
  return root?.querySelector?.(s)||null;
};
const $$=(s,r=document)=>{
  const root=typeof r==='string'?document.querySelector(r):r;
  return root?.querySelectorAll?[...root.querySelectorAll(s)]:[];
};
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

function S(){try{return state}catch(_){return window.state||null}}
function ensure(){
  const s=S();
  if(!s)throw new Error('Dati piattaforma non ancora disponibili');
  s.smartPackMixturesV11949=Array.isArray(s.smartPackMixturesV11949)?s.smartPackMixturesV11949:[];
  s.rawMaterialLots=Array.isArray(s.rawMaterialLots)?s.rawMaterialLots:[];
  s.productionRuns=Array.isArray(s.productionRuns)?s.productionRuns:[];
  s.orders=Array.isArray(s.orders)?s.orders:[];
  s.productionEvents=Array.isArray(s.productionEvents)?s.productionEvents:[];
  s.productionSheets=Array.isArray(s.productionSheets)?s.productionSheets:[];
  s.mixtureSequenceV11955=N(s.mixtureSequenceV11955);
  migrateExisting(s);
  return s;
}
function saveS(){try{save()}catch(_){}}
function operator(){
  return $('#poi11930OperatorBadge b')?.textContent?.trim()
    || $('#userName')?.textContent?.trim()
    || document.querySelector('.account-user-name')?.textContent?.trim()
    || 'Operatore';
}
function now(){return new Date().toISOString()}
function stock(){
  const s=ensure(),m=new Map();
  for(const l of s.rawMaterialLots){
    const name=String(l.materialName||l.category||'').trim();
    if(!name)continue;
    const av=Math.max(0,N(l.qtyReceived)-N(l.qtyConsumed));
    m.set(name,(m.get(name)||0)+av);
  }
  return m;
}
function materials(){
  const st=stock();
  return [...st.entries()]
    .filter(([,kg])=>kg>0.0001)
    .map(([name,kg])=>({name,kg}))
    .sort((a,b)=>a.name.localeCompare(b.name,'it'));
}
function mixtures(){return ensure().smartPackMixturesV11949}
function getMix(id){return mixtures().find(x=>String(x.id)===String(id))}
function nextCode(){
  const s=ensure();
  const used=new Set(mixtures().map(m=>String(m.code||'').toUpperCase()));
  let n=Math.max(0,N(s.mixtureSequenceV11955));
  let code='';
  do{
    n++;
    code=`MIX-${String(n).padStart(4,'0')}`;
  }while(used.has(code));
  s.mixtureSequenceV11955=n;
  return code;
}
function normalizeComponents(comps){
  const clean=(comps||[])
    .map(c=>({material:String(c.material||'').trim(),qtyKg:N(c.qtyKg||c.qty||0)}))
    .filter(c=>c.material&&c.qtyKg>0);
  const total=clean.reduce((a,c)=>a+c.qtyKg,0);
  return clean.map(c=>({
    material:c.material,
    qtyKg:c.qtyKg,
    pct:total>0?c.qtyKg/total*100:0
  }));
}
function migrateExisting(s){
  let changed=false;
  for(const m of s.smartPackMixturesV11949){
    if(!m.code){
      // do not increment global sequence during simple reads more than necessary
      const nums=s.smartPackMixturesV11949.map(x=>Number(String(x.code||'').match(/MIX-(\d+)/)?.[1]||0));
      let n=Math.max(s.mixtureSequenceV11955||0,...nums);
      n++;
      s.mixtureSequenceV11955=n;
      m.code=`MIX-${String(n).padStart(4,'0')}`;
      changed=true;
    }
    if(Array.isArray(m.components)&&m.components.length){
      const hasQty=m.components.every(c=>N(c.qtyKg)>0);
      if(!hasQty){
        // legacy percentage recipe: convert to a 100kg reference batch
        m.components=m.components.map(c=>({
          material:c.material,
          qtyKg:N(c.qtyKg)>0?N(c.qtyKg):N(c.pct),
          pct:N(c.pct)
        }));
        m.totalQtyKg=m.components.reduce((a,c)=>a+N(c.qtyKg),0);
        changed=true;
      }else{
        m.components=normalizeComponents(m.components);
        m.totalQtyKg=m.components.reduce((a,c)=>a+N(c.qtyKg),0);
      }
    }
  }
  if(changed)saveS();
}
function availableBatchCount(m){
  if(!m?.components?.length)return 0;
  const st=stock();
  let count=Infinity;
  for(const c of m.components){
    const q=N(c.qtyKg);
    if(q<=0)continue;
    count=Math.min(count,(st.get(c.material)||0)/q);
  }
  return Number.isFinite(count)?Math.max(0,count):0;
}
function availableMixtureKg(m){
  return availableBatchCount(m)*N(m.totalQtyKg||m.components?.reduce((a,c)=>a+N(c.qtyKg),0));
}

function ensureDialogs(){
  if($('#mix55Dialog'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <dialog id="mix55Dialog" class="mix55-dialog">
      <div class="modal-head">
        <div>
          <span class="eyebrow">MATERIALE DI PRODUZIONE</span>
          <h3 id="mix55Title">Nuova miscela</h3>
          <p>Inserisci i quantitativi reali utilizzati. Le percentuali vengono calcolate automaticamente.</p>
        </div>
        <button type="button" class="close" data-m55-close>×</button>
      </div>
      <form id="mix55Form">
        <div class="modal-body">
          <input type="hidden" id="mix55Id">
          <div class="mix55-top">
            <label class="field">Codice miscela
              <input id="mix55Code" disabled value="Generato al salvataggio">
            </label>
            <label class="field">Nome / descrizione
              <input id="mix55Name" required placeholder="Es. PP nero + masterbatch">
            </label>
          </div>
          <div class="mix55-cols">
            <span>Materia prima dal magazzino</span>
            <span>Disponibile</span>
            <span>Quantità miscela (kg)</span>
            <span>% calcolata</span>
            <span></span>
          </div>
          <div id="mix55Rows" class="mix55-rows"></div>
          <button type="button" class="btn" id="mix55Add">+ Aggiungi materiale</button>
          <div class="mix55-summary">
            <div><span>Totale miscela</span><b id="mix55TotalKg">0 kg</b></div>
            <div><span>Composizione</span><b id="mix55TotalPct">0%</b></div>
          </div>
          <div class="mix55-note">
            Puoi selezionare solo materiali con disponibilità in magazzino. La miscela non scarica il materiale quando la crei:
            lo scarico avviene sulla produzione reale registrata.
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-m55-close>Annulla</button>
          <button type="submit" class="btn primary">Salva miscela</button>
        </div>
      </form>
    </dialog>

    <dialog id="mixAssign55Dialog" class="mix55-dialog">
      <div class="modal-head">
        <div>
          <span class="eyebrow">ORDINE / PRODUZIONE</span>
          <h3>Seleziona miscela utilizzata</h3>
          <p id="mixAssign55Info">La miscela resterà registrata sull'ordine e sulla produzione.</p>
        </div>
        <button type="button" class="close" data-m55-assign-close>×</button>
      </div>
      <form id="mixAssign55Form">
        <div class="modal-body">
          <input type="hidden" id="mixAssign55RunId">
          <label class="field">Miscela
            <select id="mixAssign55Select" required></select>
          </label>
          <div id="mixAssign55Preview"></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-m55-assign-close>Annulla</button>
          <button type="submit" class="btn primary">Conferma miscela</button>
        </div>
      </form>
    </dialog>
  `);
  $('#mix55Form').addEventListener('submit',saveMix);
  $('#mix55Add').addEventListener('click',()=>addRow({}));
  $$('[data-m55-close]').forEach(b=>b.addEventListener('click',()=>$('#mix55Dialog').close()));
  $$('[data-m55-assign-close]').forEach(b=>b.addEventListener('click',()=>$('#mixAssign55Dialog').close()));
  $('#mixAssign55Form').addEventListener('submit',confirmAssign);
  $('#mixAssign55Select').addEventListener('change',renderAssignPreview);
}
function materialOptions(selected=''){
  return materials().map(x=>`<option value="${E(x.name)}" ${x.name===selected?'selected':''}>${E(x.name)}</option>`).join('');
}
function addRow(c={}){
  const box=$('#mix55Rows');
  if(!box)return;
  const id=uid('row');
  box.insertAdjacentHTML('beforeend',`
    <div class="mix55-row" id="${id}" data-m55-row>
      <select data-m55-material required>
        <option value="">Seleziona materiale...</option>
        ${materialOptions(c.material||'')}
      </select>
      <b data-m55-stock>—</b>
      <input data-m55-qty type="number" min="0.001" step="0.001" value="${N(c.qtyKg)>0?N(c.qtyKg):''}" required placeholder="kg">
      <b data-m55-pct>0%</b>
      <button type="button" class="btn small danger" data-m55-remove>Rimuovi</button>
    </div>`);
  const row=$(`#${id}`);
  $('[data-m55-material]',row).addEventListener('change',()=>{updateRowStock(row);updateSummary()});
  $('[data-m55-qty]',row).addEventListener('input',()=>{updateSummary();updateRowStock(row)});
  $('[data-m55-remove]',row).addEventListener('click',()=>{row.remove();updateSummary()});
  updateRowStock(row);
  updateSummary();
}
function updateRowStock(row){
  const mat=$('[data-m55-material]',row)?.value||'';
  const qty=N($('[data-m55-qty]',row)?.value);
  const av=stock().get(mat)||0;
  const out=$('[data-m55-stock]',row);
  if(out){
    out.textContent=mat?`${av.toLocaleString('it-IT',{maximumFractionDigits:3})} kg`:'—';
    out.className=qty>av+0.0001?'bad':'';
  }
}
function readRows(){
  return $$('[data-m55-row]','#mix55Rows').map(r=>({
    material:$('[data-m55-material]',r)?.value||'',
    qtyKg:N($('[data-m55-qty]',r)?.value)
  })).filter(x=>x.material||x.qtyKg>0);
}
function updateSummary(){
  const rows=readRows();
  const total=rows.reduce((a,x)=>a+N(x.qtyKg),0);
  for(const r of $$('[data-m55-row]','#mix55Rows')){
    const q=N($('[data-m55-qty]',r)?.value);
    const p=total>0?q/total*100:0;
    const out=$('[data-m55-pct]',r);
    if(out)out.textContent=`${p.toLocaleString('it-IT',{maximumFractionDigits:2})}%`;
  }
  if($('#mix55TotalKg'))$('#mix55TotalKg').textContent=`${total.toLocaleString('it-IT',{maximumFractionDigits:3})} kg`;
  if($('#mix55TotalPct'))$('#mix55TotalPct').textContent=total>0?'100%':'0%';
}
function openMix(id=''){
  try{
    ensure();ensureDialogs();
    const m=id?getMix(id):null;
    $('#mix55Id').value=m?.id||'';
    $('#mix55Code').value=m?.code||'Generato al salvataggio';
    $('#mix55Name').value=m?.name||'';
    $('#mix55Title').textContent=m?`Modifica ${m.code||'miscela'}`:'Nuova miscela';
    $('#mix55Rows').innerHTML='';
    const comps=m?.components?.length?m.components:[{},{}];
    comps.forEach(addRow);
    updateSummary();
    $('#mix55Dialog').showModal();
  }catch(e){
    console.error('[MIX55 open]',e);
    alert('Impossibile aprire la miscela: '+e.message);
  }
}
function saveMix(e){
  e.preventDefault();
  const s=ensure();
  const id=$('#mix55Id').value;
  const name=$('#mix55Name').value.trim();
  const raw=readRows().filter(x=>x.material&&x.qtyKg>0);
  if(!name)return alert('Inserisci il nome della miscela.');
  if(!raw.length)return alert('Inserisci almeno una materia prima e la relativa quantità.');
  if(new Set(raw.map(x=>x.material)).size!==raw.length)return alert('La stessa materia prima non può essere inserita due volte.');

  const st=stock();
  for(const c of raw){
    const av=st.get(c.material)||0;
    if(c.qtyKg>av+0.0001){
      return alert(`${c.material}: hai indicato ${c.qtyKg.toLocaleString('it-IT',{maximumFractionDigits:3})} kg ma in magazzino risultano ${av.toLocaleString('it-IT',{maximumFractionDigits:3})} kg disponibili.`);
    }
  }

  const comps=normalizeComponents(raw);
  const total=comps.reduce((a,c)=>a+c.qtyKg,0);
  let m=id?getMix(id):null;
  if(m){
    m.name=name;
    m.components=comps;
    m.totalQtyKg=total;
    m.updatedAt=now();
    m.updatedBy=operator();
  }else{
    const code=nextCode();
    m={
      id:uid('mix'),
      code,
      name,
      components:comps,
      totalQtyKg:total,
      createdAt:now(),
      createdBy:operator()
    };
    s.smartPackMixturesV11949.unshift(m);
  }
  saveS();
  $('#mix55Dialog').close();
  refreshPages();
}
function removeMix(id){
  const s=ensure(),m=getMix(id);
  if(!m)return;
  const used=s.productionRuns.some(r=>String(r.mixtureIdV11949||'')===String(id));
  if(used)return alert(`La miscela ${m.code||''} è già collegata a una produzione e non può essere eliminata.`);
  if(!confirm(`Eliminare ${m.code||''} · ${m.name}?`))return;
  s.smartPackMixturesV11949=s.smartPackMixturesV11949.filter(x=>String(x.id)!==String(id));
  saveS();refreshPages();
}
function assignOptions(selected=''){
  return `<option value="">Seleziona miscela...</option>`+mixtures().map(m=>
    `<option value="${E(m.id)}" ${String(m.id)===String(selected)?'selected':''}>${E(m.code||'')} · ${E(m.name)}</option>`
  ).join('');
}
function openAssign(runId){
  try{
    ensure();ensureDialogs();
    const r=ensure().productionRuns.find(x=>String(x.id)===String(runId));
    if(!r)return alert('Produzione non trovata.');
    if(!mixtures().length){alert('Prima crea almeno una miscela.');openMix('');return}
    $('#mixAssign55RunId').value=runId;
    $('#mixAssign55Select').innerHTML=assignOptions(r.mixtureIdV11949||'');
    $('#mixAssign55Info').textContent=`Ordine ${r.orderCode||r.parent||'—'} · ${r.product||''}. La miscela verrà salvata su ordine, produzione e tracciabilità.`;
    renderAssignPreview();
    $('#mixAssign55Dialog').showModal();
  }catch(e){
    console.error('[MIX55 assign]',e);
    alert('Impossibile selezionare la miscela: '+e.message);
  }
}
function renderAssignPreview(){
  const m=getMix($('#mixAssign55Select')?.value||'');
  const box=$('#mixAssign55Preview');if(!box)return;
  if(!m){
    box.innerHTML='<div class="mix55-empty">Seleziona una miscela.</div>';
    return;
  }
  box.innerHTML=`<div class="mix55-preview">
    <div class="mix55-preview-head">
      <div><span>CODICE</span><b>${E(m.code||'')}</b></div>
      <div><span>MISCELA</span><b>${E(m.name)}</b></div>
      <div><span>BATCH</span><b>${N(m.totalQtyKg).toLocaleString('it-IT',{maximumFractionDigits:3})} kg</b></div>
      <div><span>DISPONIBILE</span><b>${availableMixtureKg(m).toLocaleString('it-IT',{maximumFractionDigits:1})} kg</b></div>
    </div>
    <div class="mix55-preview-list">${m.components.map(c=>`<div><span>${E(c.material)}</span><b>${N(c.qtyKg).toLocaleString('it-IT',{maximumFractionDigits:3})} kg</b><small>${N(c.pct).toLocaleString('it-IT',{maximumFractionDigits:2})}%</small></div>`).join('')}</div>
  </div>`;
}
function linkRun(r,m){
  const s=ensure(),ts=now(),op=operator();
  const snap=m.components.map(c=>({...c}));
  Object.assign(r,{
    mixtureIdV11949:m.id,
    mixtureCodeV11955:m.code,
    mixtureNameV11949:m.name,
    mixtureComponentsV11949:snap,
    mixtureTotalQtyKgV11955:m.totalQtyKg,
    mixtureAssignedAtV11949:ts,
    mixtureAssignedByV11949:op
  });

  for(const o of s.orders.filter(x=>String(x.code)===String(r.orderCode)||String(x.parent)===String(r.parent))){
    Object.assign(o,{
      mixtureIdV11949:m.id,
      mixtureCodeV11955:m.code,
      mixtureNameV11949:m.name,
      mixtureComponentsV11949:snap.map(c=>({...c})),
      mixtureTotalQtyKgV11955:m.totalQtyKg,
      mixtureAssignedAtV11949:ts,
      mixtureAssignedByV11949:op
    });
  }

  for(const sh of s.productionSheets.filter(x=>String(x.orderCode)===String(r.orderCode)||String(x.parent)===String(r.parent))){
    sh.mixtureIdV11949=m.id;
    sh.mixtureCodeV11955=m.code;
    sh.mixtureNameV11949=m.name;
    sh.mixtureComponentsV11949=snap.map(c=>({...c}));
    for(const row of (sh.rows||[])){
      if(String(row.orderCode)===String(r.orderCode)){
        row.mixtureIdV11949=m.id;
        row.mixtureCodeV11955=m.code;
        row.mixtureNameV11949=m.name;
      }
    }
  }

  s.productionEvents.unshift({
    id:uid('mixev'),
    runId:r.id,
    orderCode:r.orderCode,
    parent:r.parent,
    at:ts,
    kind:'miscela assegnata',
    operator:op,
    note:`${m.code} · ${m.name}`,
    mixtureIdV11949:m.id,
    mixtureCodeV11955:m.code,
    mixtureNameV11949:m.name,
    componentsV11949:snap
  });
  try{addAudit?.('Miscela produzione assegnata',r.orderCode||r.parent,`${m.code} · ${m.name} · ${op}`)}catch(_){}
}
function confirmAssign(e){
  e.preventDefault();
  const s=ensure();
  const r=s.productionRuns.find(x=>String(x.id)===String($('#mixAssign55RunId').value));
  const m=getMix($('#mixAssign55Select').value);
  if(!r||!m)return alert('Seleziona una miscela valida.');
  linkRun(r,m);
  saveS();
  $('#mixAssign55Dialog').close();
  refreshPages();
}
function refreshPages(){
  try{window.SPWorkerDashboardMenu11955?.renderMixtures?.()}catch(_){}
  try{window.SPWorkerDashboardMenu11955?.renderDashboard?.()}catch(_){}
  try{window.SPWorkerDashboardMenu11951?.renderMixtures?.()}catch(_){}
  try{window.SPWorkerDashboardMenu11951?.render?.()}catch(_){}
}
function bindDelegatedActions(){
  if(document.body?.dataset.mix55Bound==='1')return;
  if(document.body)document.body.dataset.mix55Bound='1';
  document.addEventListener('click',e=>{
    const n=e.target.closest('[data-wd55-new-mix],[data-wd52-new-mix]');
    if(n){e.preventDefault();e.stopPropagation();openMix('');return}
    const edit=e.target.closest('[data-wd55-edit],[data-wd52-edit]');
    if(edit){e.preventDefault();e.stopPropagation();openMix(edit.dataset.wd55Edit||edit.dataset.wd52Edit);return}
    const rem=e.target.closest('[data-wd55-remove],[data-wd52-remove]');
    if(rem){e.preventDefault();e.stopPropagation();removeMix(rem.dataset.wd55Remove||rem.dataset.wd52Remove);return}
    const a=e.target.closest('[data-wd55-assign],[data-wd52-assign]');
    if(a){e.preventDefault();e.stopPropagation();openAssign(a.dataset.wd55Assign||a.dataset.wd52Assign);return}
  },true);
}
function styles(){
  if($('#mix55Style'))return;
  const st=document.createElement('style');st.id='mix55Style';st.textContent=`
  .mix55-dialog{width:min(900px,96vw);max-height:92vh}
  .mix55-top{display:grid;grid-template-columns:.7fr 1.5fr;gap:10px}
  .mix55-cols,.mix55-row{display:grid;grid-template-columns:1.5fr .8fr .9fr .7fr auto;gap:8px;align-items:center}
  .mix55-cols{margin-top:14px;padding:0 9px;font-size:8px;font-weight:900;color:#738680}
  .mix55-rows{display:grid;gap:7px;margin-top:5px}
  .mix55-row{padding:9px;border:1px solid #dfe9e6;border-radius:11px;background:#fbfdfc}
  .mix55-row select,.mix55-row input{width:100%;padding:9px;border:1px solid #d4e1dd;border-radius:9px;background:#fff}
  .mix55-row>b{font-size:9px;color:#516a61}.mix55-row>b.bad{color:#b33e49}
  .mix55-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .mix55-summary>div{padding:10px 12px;border-radius:10px;background:#f2f7f5}
  .mix55-summary span,.mix55-summary b{display:block}.mix55-summary span{font-size:8px;color:#667c74}.mix55-summary b{font-size:14px;margin-top:2px}
  .mix55-note{margin-top:8px;padding:10px;border-radius:10px;background:#eef6f3;font-size:9px;line-height:1.45;color:#587067}
  .mix55-preview{margin-top:10px;border:1px solid #dae6e2;border-radius:12px;padding:11px}
  .mix55-preview-head{display:grid;grid-template-columns:.7fr 1.3fr .7fr .7fr;gap:8px}
  .mix55-preview-head>div{padding:8px;background:#f3f8f6;border-radius:9px}.mix55-preview-head span,.mix55-preview-head b{display:block}.mix55-preview-head span{font-size:7px;color:#71847d}.mix55-preview-head b{font-size:10px;margin-top:2px}
  .mix55-preview-list{margin-top:8px}.mix55-preview-list>div{display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:7px 2px;border-top:1px solid #edf2f0;font-size:9px}.mix55-preview-list small{color:#71847d}
  .mix55-empty{padding:14px;text-align:center;color:#687c75}
  @media(max-width:760px){.mix55-top,.mix55-summary{grid-template-columns:1fr}.mix55-cols{display:none}.mix55-row{grid-template-columns:1fr 1fr}.mix55-row select{grid-column:1/-1}.mix55-preview-head{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(st);
}
function boot(){
  ensure();ensureDialogs();styles();bindDelegatedActions();
}
window.SPWorkerMixturesV11955={
  version:'V11.9.55',
  newMix:()=>openMix(''),
  edit:openMix,
  remove:removeMix,
  assign:openAssign,
  get:getMix,
  availableKg:availableMixtureKg,
  stock
};
// Compatibility alias used by prior worker dashboard versions.
window.SPWorkerMixturesV11949=window.SPWorkerMixturesV11955;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

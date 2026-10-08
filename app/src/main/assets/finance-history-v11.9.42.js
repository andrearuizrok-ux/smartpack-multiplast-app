
(()=>{
'use strict';
if(window.SPFinanceHistory11942)return;

const FIN='https://nomyra-finance.pages.dev/';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function S(){try{return state}catch(_){return window.state||null}}
function ensure(){
  const s=S();if(!s)return null;
  s.financeSpringV1173=s.financeSpringV1173||{};
  s.financeSpringV1173.snapshots=Array.isArray(s.financeSpringV1173.snapshots)?s.financeSpringV1173.snapshots:[];
  s.financeSpringV1173.imports=Array.isArray(s.financeSpringV1173.imports)?s.financeSpringV1173.imports:[];
  s.adminFinanceV1170=s.adminFinanceV1170||{records:[]};
  s.adminFinanceV1170.records=Array.isArray(s.adminFinanceV1170.records)?s.adminFinanceV1170.records:[];
  return s;
}
function companyName(c){return c==='multiplast'?'Multiplast':'Smart Pack'}
function key(x){return String(x?.id||'')}
function allImports(){
  const s=ensure();if(!s)return [];
  return s.financeSpringV1173.imports.slice().sort((a,b)=>String(b.importedAt||'').localeCompare(String(a.importedAt||'')));
}
function snapshotsFor(company,period){
  const s=ensure();if(!s)return [];
  return s.financeSpringV1173.snapshots
    .filter(x=>x.company===company&&x.period===period)
    .slice()
    .sort((a,b)=>String(a.importedAt||a.id||'').localeCompare(String(b.importedAt||b.id||'')));
}
function activeSnapshot(company,period){
  const xs=snapshotsFor(company,period);
  return xs[xs.length-1]||null;
}
function isActive(x){
  const a=activeSnapshot(x.company,x.period);
  return !!a && a.id===x.id;
}
function typeLabel(x){
  return x.mode==='annual'?'Esercizio completo':x.mode==='cumulative'?'Progressivo YTD':'Mese / periodo';
}
function fmtDate(v){
  try{return new Date(v).toLocaleString('it-IT')}catch(_){return String(v||'—')}
}
async function deleteImport(id){
  const s=ensure();if(!s)return;
  const imp=s.financeSpringV1173.imports.find(x=>x.id===id);
  if(!imp)return;

  const active=isActive(imp);
  const ok=confirm(
    `Eliminare il bilancio "${imp.fileName}"?\n\n`+
    `${companyName(imp.company)} · ${imp.period}\n`+
    (active?'È la versione attualmente usata nei calcoli.':'È una versione storica non attiva.')+
    `\n\nL'operazione non elimina altri periodi.`
  );
  if(!ok)return;

  s.financeSpringV1173.imports=s.financeSpringV1173.imports.filter(x=>x.id!==id);
  s.financeSpringV1173.snapshots=s.financeSpringV1173.snapshots.filter(x=>x.id!==id);

  if(active){
    // Rimuove il risultato derivato del solo periodo cancellato.
    s.adminFinanceV1170.records=s.adminFinanceV1170.records.filter(
      x=>!(x.company===imp.company&&x.period===imp.period)
    );
    // Ricostruisce i periodi dell'azienda dalle versioni ancora presenti.
    try{window.SPSpringBalanceV1173?.rebuildFromSnapshots?.(imp.company)}catch(_){}
  }

  try{save()}catch(_){}
  try{await window.SPFinanceCloudV1179?.save?.(imp.period)}catch(_){}
  try{toast?.('Bilancio eliminato')}catch(_){}

  // Re-render native finance + our history.
  try{
    const fp=$('#financePeriodV1170');
    if(fp && active){
      const replacement=activeSnapshot(imp.company,imp.period);
      if(replacement)fp.value=imp.period;
    }
    window.SPReleaseV1170?.renderFinance?.(fp?.value||imp.period);
  }catch(_){}
  setTimeout(()=>render(true),100);
}
function historyHTML(){
  const rows=allImports();
  if(!rows.length){
    return `<div class="fh42-empty"><b>Nessun bilancio caricato</b><span>Carica il primo Bilancio SPRING per iniziare l'analisi.</span></div>`;
  }
  return `<div class="fh42-list">${rows.map(x=>{
    const active=isActive(x);
    const hasSnap=!!snapshotsFor(x.company,x.period).find(s=>s.id===x.id);
    return `<article class="fh42-row ${active?'active':''}">
      <div class="fh42-file">
        <div><b>${E(x.fileName||'Bilancio')}</b>${active?'<em>ATTIVO</em>':'<em class="history">STORICO</em>'}</div>
        <span>${E(companyName(x.company))} · ${E(x.period)} · ${E(typeLabel(x))}</span>
      </div>
      <div><span>Importato</span><b>${E(fmtDate(x.importedAt))}</b></div>
      <div><span>Conti letti</span><b>${E(x.accounts??'—')}</b></div>
      <div><span>Stato</span><b>${hasSnap?(active?'Usato nei calcoli':'Versione precedente'):'Solo registro storico'}</b></div>
      <button data-fh42-delete="${E(x.id)}" class="fh42-delete">Elimina</button>
    </article>`;
  }).join('')}</div>`;
}
function render(force=false){
  const view=$('#adminFinanceV1170View');
  if(!view?.classList.contains('active'))return;

  // Remove any obsolete Finance-connect cards if they survived in the DOM.
  $$('button',view).filter(b=>/Collega Finance/i.test(b.textContent||'')).forEach(b=>{
    const block=b.closest('section,article,.panel,.card,div');
    if(block&&/NOMYRA FINANCE/i.test(block.textContent||''))block.remove();
  });

  let box=$('[data-fh42]',view);
  if(box && !force)return;
  if(!box){
    box=document.createElement('section');
    box.dataset.fh42='1';
    box.className='fh42';
    const nativeCenter=$('[data-v11922-center]',view);
    if(nativeCenter)nativeCenter.insertAdjacentElement('afterend',box);
    else view.appendChild(box);
  }
  box.innerHTML=`
    <div class="fh42-head">
      <div><span>GESTIONE BILANCI</span><h3>Storico file caricati</h3><p>Ogni importazione resta registrata. L'ultima versione di ogni periodo è quella utilizzata nei calcoli.</p></div>
      <div class="fh42-actions">
        <button data-fh42-import>+ Carica bilancio</button>
        <button data-fh42-finance>Approfondisci su NOMYRA Finance ↗</button>
      </div>
    </div>
    ${historyHTML()}`;
  $('[data-fh42-import]',box)?.addEventListener('click',()=>window.SPSpringBalanceV1173?.openImport?.());
  $('[data-fh42-finance]',box)?.addEventListener('click',()=>window.open(FIN,'_blank','noopener,noreferrer'));
  $$('[data-fh42-delete]',box).forEach(b=>b.addEventListener('click',()=>deleteImport(b.dataset.fh42Delete)));
}
function styles(){
  if($('#fh42Style'))return;
  const st=document.createElement('style');st.id='fh42Style';st.textContent=`
  .fh42{margin:12px 0 18px;border:1px solid #d9e5e9;border-radius:17px;background:#fff;box-shadow:0 6px 18px rgba(23,57,74,.035);overflow:hidden}
  .fh42-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 16px;border-bottom:1px solid #e2ebee}.fh42-head span{font-size:9px;font-weight:950;letter-spacing:.08em;color:#1475cf}.fh42-head h3{margin:3px 0;font-size:16px}.fh42-head p{margin:0;font-size:9px;color:#6a7f88}.fh42-actions{display:flex;gap:8px;flex-wrap:wrap}.fh42-actions button{min-height:40px;border:1px solid #d4e1e5;border-radius:10px;background:#fff;padding:9px 12px;font-size:10px;font-weight:900;cursor:pointer}.fh42-actions button:first-child{background:#2688ee;color:#fff;border-color:#2688ee}
  .fh42-list{display:grid}.fh42-row{display:grid;grid-template-columns:1.7fr 1fr .55fr 1fr auto;gap:12px;align-items:center;padding:11px 15px;border-top:1px solid #edf2f3}.fh42-row:first-child{border-top:0}.fh42-row.active{background:#f2faf6}.fh42-row>div>span{display:block;font-size:8px;color:#778b93}.fh42-row>div>b{display:block;font-size:9.5px;margin-top:2px}.fh42-file>div{display:flex;gap:7px;align-items:center}.fh42-file>div>b{font-size:10.5px}.fh42-file em{font-style:normal;font-size:7px;font-weight:950;color:#20785c;background:#e8f6ef;border-radius:999px;padding:4px 6px}.fh42-file em.history{color:#6b7f88;background:#edf2f4}.fh42-file>span{margin-top:3px}.fh42-delete{border:1px solid #e4b9be;background:#fff4f5;color:#a53640;border-radius:9px;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer}.fh42-empty{padding:20px;text-align:center}.fh42-empty b,.fh42-empty span{display:block}.fh42-empty span{margin-top:4px;font-size:9px;color:#71858e}
  @media(max-width:900px){.fh42-head{display:block}.fh42-actions{margin-top:10px}.fh42-row{grid-template-columns:1fr 1fr}.fh42-delete{grid-column:1/-1}}
  `;
  document.head.appendChild(st);
}
function patchNativeHistory(){
  // SPFinanceAnalysisV11922 hides its legacy history. We use our versioned history instead.
  render(true);
}
function boot(){
  styles();
  setTimeout(patchNativeHistory,120);
  const view=$('#adminFinanceV1170View');
  if(view)new MutationObserver(()=>{if(view.classList.contains('active'))setTimeout(()=>render(false),50)}).observe(view,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
}
window.SPFinanceHistory11942={version:'V11.9.42',render,deleteImport};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

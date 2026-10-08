
(()=>{
'use strict';
if(window.SPAdminManagement11940)return;

const FINANCE_URL='https://nomyra-finance.pages.dev/';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const N=v=>Number(v||0);
const F=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(N(v));
const M=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(N(v));
const P=v=>`${new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(N(v))}%`;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function monthNow(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function currentPeriod(){
  return $('#financePeriodV1170')?.value ||
         (state?.adminFinanceV1170?.records||[]).map(x=>String(x.period||'')).filter(x=>/^\d{4}-\d{2}$/.test(x)).sort().reverse()[0] ||
         monthNow();
}
function smartPackFinance(period){
  const rows=state?.adminFinanceV1170?.records||[];
  return rows.find(x=>x.company==='smartpack'&&x.period===period) || null;
}
function hasImportedBalance(period){
  const imports=state?.financeSpringV1173?.imports||[];
  return imports.some(x=>x.company==='smartpack'&&x.period===period);
}
function financeCalc(r){
  if(!r)return null;
  const opex=N(r.materials)+N(r.personnel)+N(r.energy)+N(r.transport)+N(r.otherOpex);
  const ebitda=N(r.revenue)-opex;
  const ebit=ebitda-N(r.depreciation);
  const result=ebit+N(r.extraordinaryIncome)-N(r.financialCharges)-N(r.taxes);
  return {
    revenue:N(r.revenue),opex,ebitda,ebit,result,
    margin:N(r.revenue)?ebitda/N(r.revenue)*100:0,
    receivables:N(r.receivables),payables:N(r.payables),cash:N(r.cash),inventory:N(r.inventory)
  };
}
function orderGroupsSafe(){
  try{
    if(typeof orderGroups==='function')return orderGroups();
  }catch(_){}
  const arr=state?.orders||[];
  const map=new Map();
  for(const o of arr){
    const p=String(o.parent||o.orderNo||o.code||'');
    if(!map.has(p))map.set(p,{parent:p,lines:[]});
    map.get(p).lines.push(o);
  }
  return [...map.values()];
}
function isClosedOrder(g){
  const all=g.lines||[];
  return all.length && all.every(o=>/chius|complet|annull|soddisfatt/i.test(String(o.status||'')));
}
function orderedQty(g){
  const ls=g.lines||[];
  if(!ls.length)return 0;
  const vals=ls.map(x=>N(x.qty||x.quantity));
  return Math.max(...vals,0);
}
function producedForCode(code){
  const o=(state?.orders||[]).find(x=>String(x.code)===String(code));
  const direct=N(o?.productionNetQtyV104||o?.productionProducedQtyV103||o?.produced||0);
  const runs=(state?.productionRuns||[]).filter(r=>String(r.orderCode)===String(code)&&!/annull/i.test(String(r.status||'')));
  const runQty=runs.reduce((a,r)=>a+N(r.netProducedV104||r.produced||r.qtyProduced),0);
  return Math.max(direct,runQty);
}
function producedQty(g){
  const ls=g.lines||[];
  if(!ls.length)return 0;
  const vals=ls.map(x=>producedForCode(x.code));
  return vals.length?Math.min(...vals):0;
}
function operationSnapshot(){
  const groups=orderGroupsSafe().filter(g=>!isClosedOrder(g));
  let ordered=0,produced=0;
  for(const g of groups){
    ordered+=orderedQty(g);
    produced+=Math.min(orderedQty(g),producedQty(g));
  }
  const completion=ordered?produced/ordered*100:0;
  const activeRuns=(state?.productionRuns||[]).filter(r=>/produzione|attesa|avviat/i.test(String(r.status||''))&&!/chius|complet|annull/i.test(String(r.status||''))).length;
  const loads=state?.loadingSheetsV1167||[];
  const readyLoads=loads.filter(x=>/pronto per ddt/i.test(String(x.status||''))).length;
  return {openOrders:groups.length,ordered,produced,completion,activeRuns,readyLoads};
}
function goalsState(){
  state.adminGoalsV11940=state.adminGoalsV11940&&typeof state.adminGoalsV11940==='object'?state.adminGoalsV11940:{};
  return state.adminGoalsV11940;
}
function goal(period,fin,ops){
  const all=goalsState();
  if(!all[period]){
    all[period]={
      revenueTarget:fin?.revenue?Math.round(fin.revenue*1.05):0,
      ebitdaMarginTarget:fin?.margin?Math.max(8,Math.round(fin.margin*10)/10):8,
      orderCompletionTarget:95,
      note:''
    };
  }
  return all[period];
}
function saveGoals(period){
  const g=goal(period);
  g.revenueTarget=N($('#mg40RevenueTarget')?.value);
  g.ebitdaMarginTarget=N($('#mg40MarginTarget')?.value);
  g.orderCompletionTarget=N($('#mg40CompletionTarget')?.value);
  g.note=$('#mg40GoalNote')?.value||'';
  try{save()}catch(_){}
  renderManagement();
  try{toast?.('Obiettivi salvati')}catch(_){}
}
function insight(fin,ops,g){
  const arr=[];
  if(!fin)return arr;
  if(fin.margin<g.ebitdaMarginTarget){
    arr.push({tone:'warn',title:'Margine EBITDA sotto obiettivo',text:`Attuale ${P(fin.margin)} · obiettivo ${P(g.ebitdaMarginTarget)}. Controllare costi e mix produttivo.`});
  }else{
    arr.push({tone:'ok',title:'Margine EBITDA in linea',text:`Attuale ${P(fin.margin)} rispetto a un obiettivo di ${P(g.ebitdaMarginTarget)}.`});
  }
  if(ops.completion<g.orderCompletionTarget){
    arr.push({tone:'warn',title:'Coda ordini da accelerare',text:`Completamento produzione ${P(ops.completion)} · obiettivo ${P(g.orderCompletionTarget)}.`});
  }else{
    arr.push({tone:'ok',title:'Avanzamento ordini in linea',text:`La produzione ha completato ${P(ops.completion)} della quantità aperta.`});
  }
  if(g.revenueTarget>0 && fin.revenue<g.revenueTarget){
    arr.push({tone:'info',title:'Ricavi sotto obiettivo',text:`Mancano ${M(g.revenueTarget-fin.revenue)} al target impostato per il periodo.`});
  }
  return arr;
}
function managementHTML(period){
  const rec=smartPackFinance(period);
  const imported=hasImportedBalance(period);
  const fin=financeCalc(rec);
  const ops=operationSnapshot();
  const g=goal(period,fin,ops);
  const ins=insight(fin,ops,g);

  if(!rec || !imported){
    return `<section class="mg40">
      <div class="mg40-head"><div><span>CONTROLLO GESTIONALE</span><h3>Bilancio Smart Pack non ancora importato</h3><p>Importa il Bilancio SPRING per confrontare situazione economica e produzione reale.</p></div>
      <button class="mg40-primary" onclick="SPSpringBalanceV1173?.openImport?.()">Importa bilancio</button></div>
      <div class="mg40-ops">
        <div><span>Ordini aperti</span><b>${ops.openOrders}</b></div>
        <div><span>Quantità aperta</span><b>${F(ops.ordered)} pz</b></div>
        <div><span>Prodotto</span><b>${F(ops.produced)} pz</b></div>
        <div><span>Avanzamento</span><b>${P(ops.completion)}</b></div>
      </div>
      <div class="mg40-finance-link"><div><b>Serve un'analisi finanziaria più approfondita?</b><span>NOMYRA Finance resta lo strumento dedicato all'analisi completa.</span></div><button data-mg40-finance>Approfondisci su NOMYRA Finance ↗</button></div>
    </section>`;
  }

  const revPerPiece=ops.produced>0?fin.revenue/ops.produced:0;
  const costPerPiece=ops.produced>0?fin.opex/ops.produced:0;
  const ebitdaPerPiece=ops.produced>0?fin.ebitda/ops.produced:0;

  return `<section class="mg40">
    <div class="mg40-head"><div><span>CONTROLLO GESTIONALE · ${E(period)}</span><h3>Bilancio + situazione produttiva</h3><p>I dati economici del bilancio vengono letti insieme alla produzione corrente per definire obiettivi concreti.</p></div>
      <button data-mg40-finance>Approfondisci su NOMYRA Finance ↗</button></div>

    <div class="mg40-summary">
      <article><span>Ricavi bilancio</span><b>${M(fin.revenue)}</b></article>
      <article><span>Costi operativi</span><b>${M(fin.opex)}</b></article>
      <article><span>EBITDA</span><b class="${fin.ebitda<0?'loss':''}">${M(fin.ebitda)}</b><small>Margine ${P(fin.margin)}</small></article>
      <article><span>Ordini aperti</span><b>${ops.openOrders}</b><small>${F(ops.ordered)} pz da gestire</small></article>
      <article><span>Produzione completata</span><b>${P(ops.completion)}</b><small>${F(ops.produced)} pz prodotti</small></article>
    </div>

    <div class="mg40-unit">
      <div><span>Ricavo medio / pezzo prodotto</span><b>${ops.produced?M(revPerPiece):'—'}</b></div>
      <div><span>Costo operativo / pezzo prodotto</span><b>${ops.produced?M(costPerPiece):'—'}</b></div>
      <div><span>EBITDA / pezzo prodotto</span><b class="${ebitdaPerPiece<0?'loss':''}">${ops.produced?M(ebitdaPerPiece):'—'}</b></div>
      <div><span>Produzioni attive</span><b>${ops.activeRuns}</b></div>
      <div><span>Carichi pronti DDT</span><b>${ops.readyLoads}</b></div>
    </div>

    <div class="mg40-columns">
      <section>
        <div class="mg40-title"><span>OBIETTIVI</span><h4>Imposta i target del periodo</h4></div>
        <div class="mg40-form">
          <label>Ricavi target (€)<input id="mg40RevenueTarget" type="number" min="0" step="100" value="${N(g.revenueTarget)}"></label>
          <label>EBITDA margin target (%)<input id="mg40MarginTarget" type="number" step="0.1" value="${N(g.ebitdaMarginTarget)}"></label>
          <label>Completamento ordini target (%)<input id="mg40CompletionTarget" type="number" min="0" max="100" step="1" value="${N(g.orderCompletionTarget)}"></label>
          <label class="wide">Nota obiettivo<textarea id="mg40GoalNote" rows="2">${E(g.note||'')}</textarea></label>
          <button class="mg40-primary" data-mg40-save>Salva obiettivi</button>
        </div>
      </section>
      <section>
        <div class="mg40-title"><span>LETTURA OPERATIVA</span><h4>Cosa richiede attenzione</h4></div>
        <div class="mg40-insights">${ins.map(x=>`<div class="${x.tone}"><b>${E(x.title)}</b><span>${E(x.text)}</span></div>`).join('')}</div>
      </section>
    </div>
  </section>`;
}
function renderManagement(){
  const view=$('#adminFinanceV1170View');
  if(!view?.classList.contains('active'))return;
  const period=currentPeriod();
  let host=$('#mg40Host',view);
  if(!host){
    host=document.createElement('div');
    host.id='mg40Host';
    view.appendChild(host);
  }
  host.innerHTML=managementHTML(period);
  $('[data-mg40-finance]',host)?.addEventListener('click',()=>window.open(FINANCE_URL,'_blank','noopener,noreferrer'));
  $('[data-mg40-save]',host)?.addEventListener('click',()=>saveGoals(period));

  // Replace any old "Collega Finance" remnants with simple deep-link semantics.
  $$('button',view).filter(b=>/Collega Finance|Apri NOMYRA Finance/i.test(b.textContent||'')).forEach(b=>{
    b.textContent='Approfondisci su NOMYRA Finance ↗';
    b.onclick=()=>window.open(FINANCE_URL,'_blank','noopener,noreferrer');
  });
}
function decorateDashboard(){
  const view=$('#adminOverviewV1170View');
  if(!view?.classList.contains('active'))return;
  const period=currentPeriod(),rec=smartPackFinance(period),imported=hasImportedBalance(period),fin=financeCalc(rec),ops=operationSnapshot();
  let host=$('#mg40Dash',view);
  if(!host){host=document.createElement('div');host.id='mg40Dash';view.prepend(host)}
  if(!rec||!imported){
    host.innerHTML=`<div class="mg40-dash empty"><div><span>CONTROLLO GESTIONALE</span><b>Importa il bilancio Smart Pack</b><small>La dashboard confronterà automaticamente bilancio e produzione reale.</small></div><button data-mg40-import>Importa bilancio</button></div>`;
    $('[data-mg40-import]',host)?.addEventListener('click',()=>window.SPSpringBalanceV1173?.openImport?.());
  }else{
    host.innerHTML=`<div class="mg40-dash">
      <div><span>CONTROLLO GESTIONALE · ${E(period)}</span><b>Economia + produzione</b><small>Analisi costruita sul bilancio importato e sulla situazione operativa attuale.</small></div>
      <div class="mg40-dash-kpi"><span>EBITDA</span><b class="${fin.ebitda<0?'loss':''}">${M(fin.ebitda)}</b></div>
      <div class="mg40-dash-kpi"><span>Margine</span><b>${P(fin.margin)}</b></div>
      <div class="mg40-dash-kpi"><span>Ordini aperti</span><b>${ops.openOrders}</b></div>
      <div class="mg40-dash-kpi"><span>Produzione</span><b>${P(ops.completion)}</b></div>
      <button data-mg40-open>Apri analisi</button>
    </div>`;
    $('[data-mg40-open]',host)?.addEventListener('click',()=>window.SPReleaseV1170?.adminQuick?.('finance'));
  }
}
function styles(){
  if($('#mg40Style'))return;
  const st=document.createElement('style');st.id='mg40Style';st.textContent=`
  .mg40{margin-top:14px;display:grid;gap:12px}.mg40-head,.mg40-summary,.mg40-unit,.mg40-columns>section,.mg40-finance-link{background:#fff;border:1px solid var(--line,#d9e5e9);border-radius:17px;box-shadow:0 6px 18px rgba(23,57,74,.035)}
  .mg40-head{padding:17px 18px;display:flex;justify-content:space-between;gap:16px;align-items:center}.mg40-head span,.mg40-title span,.mg40-dash span{font-size:9px;font-weight:950;letter-spacing:.08em;color:#1976d2}.mg40-head h3{font-size:20px;margin:4px 0}.mg40-head p{font-size:11px;color:#617984;margin:0}.mg40-head button,.mg40-primary,.mg40-finance-link button,.mg40-dash button{border:0;background:#2688ee;color:#fff;border-radius:11px;padding:11px 14px;font-weight:900;cursor:pointer}
  .mg40-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:0;overflow:hidden}.mg40-summary article{padding:14px;border-right:1px solid #e3ecef}.mg40-summary article:last-child{border-right:0}.mg40-summary span,.mg40-unit span{display:block;font-size:9px;color:#71858e}.mg40-summary b{display:block;font-size:20px;margin-top:5px}.mg40-summary small{display:block;font-size:8px;color:#71858e;margin-top:3px}.loss{color:#b43742!important}
  .mg40-unit{display:grid;grid-template-columns:repeat(5,1fr);padding:11px}.mg40-unit>div{padding:9px 11px;border-right:1px solid #e4ecef}.mg40-unit>div:last-child{border-right:0}.mg40-unit b{display:block;font-size:13px;margin-top:3px}
  .mg40-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mg40-columns>section{padding:15px}.mg40-title h4{font-size:15px;margin:3px 0 11px}.mg40-form{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mg40-form label{font-size:9px;font-weight:850;color:#607782}.mg40-form input,.mg40-form textarea{width:100%;margin-top:4px;border:1px solid #d7e3e7;border-radius:9px;padding:9px;font-size:12px}.mg40-form .wide{grid-column:1/-1}.mg40-form button{grid-column:1/-1}
  .mg40-insights{display:grid;gap:7px}.mg40-insights>div{padding:10px 11px;border-radius:10px;background:#f7fafb;border:1px solid #e0e9ec}.mg40-insights b,.mg40-insights span{display:block}.mg40-insights b{font-size:10px}.mg40-insights span{font-size:9px;color:#607782;margin-top:3px}.mg40-insights .warn{background:#fff8eb;border-color:#ead8a8}.mg40-insights .ok{background:#eff9f4;border-color:#c4e1d2}.mg40-finance-link{padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}.mg40-finance-link b,.mg40-finance-link span{display:block}.mg40-finance-link b{font-size:11px}.mg40-finance-link span{font-size:9px;color:#6b7f88;margin-top:2px}
  .mg40-ops{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.mg40-ops>div{padding:13px;border-radius:12px;background:#fff;border:1px solid #dce7ea}.mg40-ops span,.mg40-ops b{display:block}.mg40-ops span{font-size:9px;color:#71858e}.mg40-ops b{font-size:18px;margin-top:4px}
  .mg40-dash{margin:0 0 12px;background:#fff;border:1px solid #d8e5e9;border-radius:16px;padding:13px 15px;display:grid;grid-template-columns:1.5fr repeat(4,.7fr) auto;gap:10px;align-items:center}.mg40-dash>div:first-child b,.mg40-dash>div:first-child small{display:block}.mg40-dash>div:first-child b{font-size:14px;margin-top:3px}.mg40-dash>div:first-child small{font-size:8px;color:#71858e;margin-top:2px}.mg40-dash-kpi{padding:8px 10px;background:#f7fafb;border-radius:10px}.mg40-dash-kpi span,.mg40-dash-kpi b{display:block}.mg40-dash-kpi span{font-size:8px;color:#72868e}.mg40-dash-kpi b{font-size:13px;margin-top:3px}.mg40-dash.empty{grid-template-columns:1fr auto}
  @media(max-width:1000px){.mg40-summary,.mg40-unit{grid-template-columns:repeat(2,1fr)}.mg40-columns{grid-template-columns:1fr}.mg40-dash{grid-template-columns:1fr 1fr}.mg40-form{grid-template-columns:1fr}}
  `;document.head.appendChild(st);
}
function render(){
  renderManagement();
  decorateDashboard();
}
function boot(){
  styles();
  render();
  const mo=new MutationObserver(()=>setTimeout(render,40));
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.SPAdminManagement11940={version:'V11.9.40',render,openFinance:()=>window.open(FINANCE_URL,'_blank','noopener,noreferrer')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

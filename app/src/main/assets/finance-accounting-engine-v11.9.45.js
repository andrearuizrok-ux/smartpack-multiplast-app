
(()=>{
'use strict';
if(window.SPFinanceAccountingEngine11945)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const EPS=.005;

function S(){try{return state}catch(_){return window.state||null}}
function keyOf(a){return String(a?.mapKey||(a?.partitario?`${a.code}|${a.partitario}`:a?.code||''))}
function prefix(code,p){code=String(code||'').trim();return code===p||code.startsWith(p+'.')}

function latestSnapshot(company,period){
  const xs=(S()?.financeSpringV1173?.snapshots||[])
    .filter(x=>x.company===company&&x.period===period)
    .slice()
    .sort((a,b)=>String(a.importedAt||a.id||'').localeCompare(String(b.importedAt||b.id||'')));
  return xs[xs.length-1]||null;
}
function previousSnapshot(company,snap){
  if(!snap||snap.mode!=='cumulative')return null;
  return (S()?.financeSpringV1173?.snapshots||[])
    .filter(x=>x.company===company&&x.mode==='cumulative'&&x.period<snap.period&&String(x.period).slice(0,4)===String(snap.period).slice(0,4))
    .slice()
    .sort((a,b)=>String(a.period).localeCompare(String(b.period)))
    .slice(-1)[0]||null;
}
function accountMap(snap){
  const m=new Map();
  for(const a of (snap?.accounts||[]))m.set(keyOf(a),a);
  return m;
}
function signed(a){
  if(Number.isFinite(Number(a?.signedAmount)))return Number(a.signedAmount);
  const d=N(a?.debit),c=N(a?.credit),sec=String(a?.section||'').toLowerCase();
  if(d||c){
    // Revenues/liabilities are credit-positive, costs/assets are debit-positive.
    if(sec==='revenue'||sec==='liability')return c-d;
    return d-c;
  }
  return N(a?.balance);
}
function flowAmount(a,snap,prev,prevMap){
  let v=signed(a);
  if(snap?.mode==='cumulative'&&prev){
    const p=prevMap.get(keyOf(a));
    if(p)v-=signed(p);
  }
  return v;
}
function sumPrefixes(snap,prev,prefixes){
  if(!snap)return 0;
  const pm=accountMap(prev);
  return (snap.accounts||[])
    .filter(a=>prefixes.some(p=>prefix(a.code,p)))
    .reduce((s,a)=>s+flowAmount(a,snap,prev,pm),0);
}
function sumByDescriptionWithin76(snap,prev,re){
  if(!snap)return 0;
  const pm=accountMap(prev);
  return (snap.accounts||[])
    .filter(a=>prefix(a.code,'76')&&re.test(String(a.description||'').toLowerCase()))
    .reduce((s,a)=>s+flowAmount(a,snap,prev,pm),0);
}
function exactOperational(company,period){
  const snap=latestSnapshot(company,period);
  if(!snap)return null;
  const prev=previousSnapshot(company,snap);

  const sales=sumPrefixes(snap,prev,['70']);
  const closingInventory=sumPrefixes(snap,prev,['71']);
  const otherOperatingRevenue=sumPrefixes(snap,prev,['73']);

  const openingInventory=sumPrefixes(snap,prev,['72']);
  const purchases=sumPrefixes(snap,prev,['75']);
  const services=sumPrefixes(snap,prev,['76']);
  const vehicles=sumPrefixes(snap,prev,['77']);
  const nonEmployeeLabor=sumPrefixes(snap,prev,['78']);
  const adminCommercial=sumPrefixes(snap,prev,['79']);
  const thirdPartyAssets=sumPrefixes(snap,prev,['80']);
  const personnel=sumPrefixes(snap,prev,['81']);
  const otherManagement=sumPrefixes(snap,prev,['83']);

  const energy=sumByDescriptionWithin76(snap,prev,/energia elettrica|acqua potabile|\bgas\b|metano/);
  const transport=sumPrefixes(snap,prev,['76.03','76.05']);
  const servicesOther=services-energy-transport;

  const depreciation=sumPrefixes(snap,prev,['90']);
  const extraordinaryIncome=sumPrefixes(snap,prev,['87']);
  const financialCharges=sumPrefixes(snap,prev,['86']);
  const taxes=sumPrefixes(snap,prev,['93']);

  const materials=openingInventory+purchases;
  const otherOpex=servicesOther+vehicles+nonEmployeeLabor+adminCommercial+thirdPartyAssets+otherManagement;

  const productionValue=sales+closingInventory+otherOperatingRevenue;
  const opex=materials+personnel+energy+transport+otherOpex;
  const ebitda=productionValue-opex;
  const ebit=ebitda-depreciation;
  const netResult=ebit+extraordinaryIncome-financialCharges-taxes;

  return {
    configured:true,company,period,snapshot:snap,
    salesRevenue:sales,
    openingInventory,closingInventory,
    inventoryChange:closingInventory-openingInventory,
    otherOperatingRevenue,
    productionValue,
    materials,purchases,personnel,energy,transport,otherOpex,
    services,servicesOther,vehicles,nonEmployeeLabor,adminCommercial,thirdPartyAssets,otherManagement,
    opex,ebitda,depreciation,ebit,
    extraordinaryIncome,financialCharges,taxes,netResult,
    marginProduction:productionValue?ebitda/productionValue*100:0
  };
}
function applyToRecord(company,period){
  const d=exactOperational(company,period);
  if(!d)return null;
  const s=S();if(!s)return d;
  s.adminFinanceV1170=s.adminFinanceV1170||{records:[]};
  s.adminFinanceV1170.records=Array.isArray(s.adminFinanceV1170.records)?s.adminFinanceV1170.records:[];
  let r=s.adminFinanceV1170.records.find(x=>x.company===company&&x.period===period);
  if(!r){
    r={company,period};
    s.adminFinanceV1170.records.push(r);
  }
  Object.assign(r,{
    salesRevenue:d.salesRevenue,
    revenue:d.productionValue,            // legacy engine expects production value here
    productionValue:d.productionValue,
    inventoryProductionChange:d.closingInventory,
    otherOperatingRevenue:d.otherOperatingRevenue,
    materials:d.materials,
    personnel:d.personnel,
    energy:d.energy,
    transport:d.transport,
    otherOpex:d.otherOpex,
    depreciation:d.depreciation,
    extraordinaryIncome:d.extraordinaryIncome,
    financialCharges:d.financialCharges,
    taxes:d.taxes,
    accountingNetResult:d.netResult,
    accountingEngine:'SPRING_CANONICAL_V11.9.45',
    accountingRebuiltAt:new Date().toISOString()
  });
  return d;
}
function group(period){
  const xs=['smartpack','multiplast'].map(c=>exactOperational(c,period)).filter(Boolean);
  if(!xs.length)return {configured:false};
  const sum=k=>xs.reduce((a,x)=>a+N(x[k]),0);
  const productionValue=sum('productionValue'),opex=sum('opex'),ebitda=productionValue-opex,depreciation=sum('depreciation'),ebit=ebitda-depreciation;
  return {
    configured:true,
    salesRevenue:sum('salesRevenue'),
    closingInventory:sum('closingInventory'),
    openingInventory:sum('openingInventory'),
    inventoryChange:sum('inventoryChange'),
    otherOperatingRevenue:sum('otherOperatingRevenue'),
    productionValue,materials:sum('materials'),personnel:sum('personnel'),energy:sum('energy'),transport:sum('transport'),otherOpex:sum('otherOpex'),
    opex,ebitda,depreciation,ebit,
    extraordinaryIncome:sum('extraordinaryIncome'),financialCharges:sum('financialCharges'),taxes:sum('taxes'),
    netResult:sum('netResult'),
    marginProduction:productionValue?ebitda/productionValue*100:0
  };
}
function installEngine(){
  const c=window.SPFinanceClarityV1199;
  if(c){
    c.derived=(company,p)=>exactOperational(company,p)||{configured:false};
    c.groupDerived=p=>group(p);
    c.financeCorrectionVersion='V11.9.45-CANONICAL';
  }
  const g=window.SPFinanceGuidedV11921;
  if(g){
    g.derive=(company,p)=>exactOperational(company,p)||{configured:false};
    g.group=p=>group(p);
  }
}
function periods(){
  return [...new Set((S()?.financeSpringV1173?.snapshots||[]).map(x=>x.period).filter(Boolean))];
}
function rebuildAll(){
  installEngine();
  for(const p of periods()){
    for(const c of ['smartpack','multiplast'])applyToRecord(c,p);
  }
  try{if(typeof save==='function')save()}catch(_){}
}
function officialResult(snapshot){
  const p=snapshot?.totals?.profit;
  return Number.isFinite(Number(p))?Number(p):null;
}
function addQuadrature(){
  const view=$('#adminFinanceV1170View');
  if(!view?.classList.contains('active'))return;
  const p=$('#financePeriodV1170')?.value||localStorage.getItem('poi_finance_period_v1179')||'';
  const d=group(p);if(!d.configured)return;
  let card=$('[data-ac45-quadrature]',view);
  if(!card){
    card=document.createElement('section');
    card.dataset.ac45Quadrature='1';
    card.className='ac45-quadrature';
    const center=$('[data-v11922-center]',view);
    (center||view).insertAdjacentElement(center?'beforebegin':'afterbegin',card);
  }
  const official=['smartpack','multiplast']
    .map(c=>latestSnapshot(c,p)).filter(Boolean)
    .map(officialResult).filter(x=>x!=null);
  const officialTotal=official.length?official.reduce((a,b)=>a+b,0):null;
  const diff=officialTotal==null?null:d.netResult-officialTotal;
  const ok=diff==null||Math.abs(diff)<0.02;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(N(v));
  card.innerHTML=`
    <div><span>RISULTATO D'ESERCIZIO RICOSTRUITO</span><b class="${d.netResult<0?'loss':'profit'}">${money(d.netResult)}</b>
    <small>EBIT ${money(d.ebit)} + proventi straordinari ${money(d.extraordinaryIncome)} − oneri finanziari ${money(d.financialCharges)} − imposte ${money(d.taxes)}</small></div>
    ${officialTotal!=null?`<div class="ac45-official"><span>Risultato ufficiale SPRING</span><b>${money(officialTotal)}</b><em class="${ok?'ok':'bad'}">${ok?'Quadratura corretta':`Scostamento ${money(diff)}`}</em></div>`:''}`;
}
function render(){
  rebuildAll();
  const p=$('#financePeriodV1170')?.value||localStorage.getItem('poi_finance_period_v1179')||'';
  if(p){
    try{window.SPReleaseV1170?.renderFinance?.(p)}catch(_){}
  }
  setTimeout(()=>{
    installEngine();
    try{window.SPFinanceAnalysisV11922?.render?.(true)}catch(_){}
    try{window.SPFinanceHistory11942?.render?.(true)}catch(_){}
    addQuadrature();
  },100);
}
function styles(){
  if($('#ac45Style'))return;
  const st=document.createElement('style');st.id='ac45Style';st.textContent=`
  .ac45-quadrature{margin:10px 0;padding:14px 16px;border:1px solid #d5e5df;border-radius:15px;background:#f6fbf8;display:flex;justify-content:space-between;gap:18px;align-items:center}
  .ac45-quadrature span,.ac45-quadrature small{display:block}.ac45-quadrature span{font-size:8px;font-weight:950;letter-spacing:.07em;color:#56766a}.ac45-quadrature b{display:block;font-size:22px;margin-top:4px}.ac45-quadrature small{font-size:8.5px;color:#667e75;margin-top:4px}.ac45-quadrature .profit{color:#147658}.ac45-quadrature .loss{color:#b23641}.ac45-official{text-align:right}.ac45-official b{font-size:15px}.ac45-official em{display:inline-block;margin-top:5px;font-style:normal;font-size:8px;font-weight:900;padding:5px 7px;border-radius:999px}.ac45-official em.ok{background:#def3e8;color:#17694f}.ac45-official em.bad{background:#fde8ea;color:#a4323c}
  `;
  document.head.appendChild(st);
}
function patchImporter(){
  const api=window.SPSpringBalanceV1173;
  if(!api||api.__ac45)return;
  const old=api.rebuildFromSnapshots;
  if(typeof old==='function'){
    api.rebuildFromSnapshots=function(){
      const r=old.apply(this,arguments);
      setTimeout(()=>{rebuildAll();render()},40);
      return r;
    };
  }
  api.__ac45=true;
}
function boot(){
  styles();installEngine();patchImporter();rebuildAll();
  setTimeout(render,180);
  const view=$('#adminFinanceV1170View');
  if(view)new MutationObserver(()=>{if(view.classList.contains('active'))setTimeout(render,40)}).observe(view,{attributes:true,attributeFilter:['class']});
}
window.SPFinanceAccountingEngine11945={version:'V11.9.45',derive:exactOperational,group,rebuild:rebuildAll,render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

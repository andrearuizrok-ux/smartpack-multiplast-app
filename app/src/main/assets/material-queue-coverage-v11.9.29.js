(()=>{
'use strict';
const BUILD='V11.9.29';
const $=id=>document.getElementById(id);
const N=v=>Number(v||0);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(N(v));
const P=v=>`${Math.max(0,Math.min(100,N(v))).toLocaleString('it-IT',{maximumFractionDigits:0})}%`;

const FAMILIES=[
  {key:'bucket37',label:'Secchio 3,7 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/3LT|3[,.]?7/i.test(text(o))},
  {key:'bucket5',label:'Secchio 5 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/5LT|5\s?L/i.test(text(o))},
  {key:'bucket14',label:'Secchio 14 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/14LT|14\s?L/i.test(text(o))},
  {key:'bucket18',label:'Secchio 18 L',match:o=>!/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/18LT|18\s?L/i.test(text(o))},
  {key:'lid37',label:'Coperchio 3,7 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/3CLT|3LT|3[,.]?7/i.test(text(o))},
  {key:'lid5',label:'Coperchio 5 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/5CLT|5LT|5\s?L/i.test(text(o))},
  {key:'lid14',label:'Coperchio 14 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/14/i.test(text(o))},
  {key:'lid18',label:'Coperchio 18 L',match:o=>/COPERCHIO|TAPPO|CLT/i.test(text(o))&&/18/i.test(text(o))}
];
function text(o){return [o?.liters,o?.product,o?.name,o?.kind,o?.moldName].join(' ').toUpperCase()}
function isSP(){try{return company==='smartpack'&&currentRole==='director'}catch(_){return false}}
function orderForRun(r){return (state.orders||[]).find(o=>String(o.code)===String(r.orderCode))||(state.orders||[]).find(o=>String(o.parent)===String(r.parent)&&String(o.code||'').endsWith('A'))||null}
function remaining(r){return Math.max(0,N(r?.qty)-Math.max(N(r?.netProducedV104),N(r?.produced)))}
function familyFor(r){const o=orderForRun(r)||r;return FAMILIES.find(f=>f.match({...o,product:r?.product||o?.product,moldName:r?.moldId||''}))||null}
function queue(){return (state.productionRuns||[]).filter(r=>r.status==='In coda'&&remaining(r)>0).slice().sort((a,b)=>N(a.sequence)-N(b.sequence)||String(a.machineId||'').localeCompare(String(b.machineId||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||'')))}
function cfg(){state.materialCoverageConfigV11929=state.materialCoverageConfigV11929&&typeof state.materialCoverageConfigV11929==='object'?state.materialCoverageConfigV11929:{};return state.materialCoverageConfigV11929}
function lots(){return Array.isArray(state.rawMaterialLots)?state.rawMaterialLots:[]}
function materialNames(){return [...new Set(lots().map(x=>String(x.materialName||x.category||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'))}
function stockMap(){const m=new Map();for(const l of lots()){const k=String(l.materialName||l.category||'').trim();if(!k)continue;const av=Math.max(0,N(l.qtyReceived)-N(l.qtyConsumed));m.set(k,(m.get(k)||0)+av)}return m}
function defaultMaterial(f){const names=materialNames();const lid=/^lid/.test(f.key);return names.find(n=>lid?/TAPP|COPER/i.test(n):/SECCHI|PP/i.test(n)&&!/TAPP|COPER/i.test(n))||''}
function defaultMaster(){return materialNames().find(n=>/MASTER|MBI/i.test(n))||''}
function recipe(f){const c=cfg()[f.key]||{};return {weightG:N(c.weightG),baseMaterial:String(c.baseMaterial||defaultMaterial(f)),masterMaterial:String(c.masterMaterial||defaultMaster()),masterPct:c.masterPct==null?2.9126:N(c.masterPct)}}
function configured(f){const r=recipe(f);return r.weightG>0&&!!r.baseMaterial}

function calculate(){
  const q=queue(),stock=stockMap(),rows=[];let totalPieces=0,coveredPieces=0,missingConfig=0;
  for(let i=0;i<q.length;i++){
    const run=q[i],o=orderForRun(run)||{},qty=remaining(run),fam=familyFor(run);totalPieces+=qty;
    if(!fam||!configured(fam)){
      missingConfig++;rows.push({index:i+1,run,o,qty,fam,status:'config',coverage:null,baseNeed:0,masterNeed:0});continue;
    }
    const r=recipe(fam),totalKg=qty*r.weightG/1000,mp=Math.max(0,Math.min(100,r.masterPct))/100,masterNeed=r.masterMaterial?totalKg*mp:0,baseNeed=totalKg-masterNeed;
    const baseAv=stock.get(r.baseMaterial)||0,masterAv=r.masterMaterial?(stock.get(r.masterMaterial)||0):Infinity;
    let ratio=1;if(baseNeed>0)ratio=Math.min(ratio,baseAv/baseNeed);if(masterNeed>0)ratio=Math.min(ratio,masterAv/masterNeed);ratio=Math.max(0,Math.min(1,ratio));
    const covQty=qty*ratio;coveredPieces+=covQty;
    stock.set(r.baseMaterial,Math.max(0,baseAv-baseNeed*ratio));if(r.masterMaterial&&masterNeed>0)stock.set(r.masterMaterial,Math.max(0,masterAv-masterNeed*ratio));
    rows.push({index:i+1,run,o,qty,fam,recipe:r,status:ratio>=.999?'ok':ratio>0?'partial':'no',coverage:ratio*100,covQty,baseNeed,masterNeed});
  }
  const pct=totalPieces>0?coveredPieces/totalPieces*100:100;
  const firstProblem=rows.find(x=>x.status!=='ok');
  const fully=rows.filter(x=>x.status==='ok').length;
  return {rows,totalPieces,coveredPieces,pct,firstProblem,fully,missingConfig,queueCount:q.length,stock};
}

function summaryText(c){
  if(!c.queueCount)return {big:'100%',detail:'Nessuna produzione in coda.',tone:'ok',alert:''};
  if(c.missingConfig){return {big:'Da configurare',detail:`Mancano i pesi di ${c.missingConfig} lavorazioni in coda.`,tone:'warn',alert:'Configura il peso g/pezzo nelle Materie prime per ottenere una copertura reale.'}}
  if(!c.firstProblem)return {big:'100%',detail:`Tutti i ${c.queueCount} lavori in coda sono coperti dal materiale disponibile.`,tone:'ok',alert:''};
  const x=c.firstProblem,ord=x.run.orderCode||x.run.parent||'—';
  if(x.status==='partial')return {big:P(c.pct),detail:`Materiale completo fino al lavoro ${Math.max(0,x.index-1)}. Ordine ${ord} coperto al ${P(x.coverage)}.`,tone:'warn',alert:`Conviene ordinare materiale: la coda attuale non è coperta interamente.`};
  if(x.status==='no')return {big:P(c.pct),detail:`Materiale completo fino al lavoro ${Math.max(0,x.index-1)}. Ordine ${ord} non coperto.`,tone:'risk',alert:'È necessario approvvigionare materiale per completare la coda.'};
  return {big:P(c.pct),detail:'Copertura materiale della coda.',tone:'warn',alert:''};
}

function cleanPresses(){
  if(!isSP())return;const v=$('pressesView');if(!v)return;
  const cov=$('sp128MaterialCoverage');if(cov)cov.style.display='none';
  const step=$('sp128PlannerStep');if(step)step.style.display='none';
  const hero=v.querySelector(':scope > .hero');if(hero){const p=hero.querySelector('p');if(p)p.textContent='Configurazione tecnica di presse e stampi. La copertura materiale viene calcolata dalla Coda Roberto.'}
}

function dashboard(){
  if(!isSP())return;const ops=$('sp128Ops');if(!ops)return;const c=calculate(),s=summaryText(c),cards=ops.querySelectorAll('.sp128-kpis article');
  if(cards.length>=4){const a=cards[3];a.className=s.tone;a.style.cursor='pointer';a.onclick=()=>navTo('rawMaterials');a.innerHTML=`<span>COPERTURA MATERIALE DELLA CODA</span><b>${E(s.big)}</b><small>${E(s.detail)}<br><strong>Apri Materie prime →</strong></small>`}
  let alert=$('sp129MaterialAlert');if(alert)alert.remove();if(s.alert){alert=document.createElement('div');alert.id='sp129MaterialAlert';alert.className=`sp129-alert ${s.tone}`;alert.innerHTML=`<div><b>${s.tone==='risk'?'Materiale insufficiente':'Attenzione materiale'}</b><span>${E(s.alert)}</span></div><button class="btn" type="button">Apri Materie prime</button>`;alert.querySelector('button').onclick=()=>navTo('rawMaterials');ops.querySelector('.sp128-kpis')?.insertAdjacentElement('afterend',alert)}
}

function plannerBlock(){
  if(!isSP()||currentView!=='planner')return;const v=$('plannerView');if(!v)return;let old=$('sp129QueueCoverage');if(old)old.remove();const c=calculate(),s=summaryText(c);const sec=document.createElement('section');sec.id='sp129QueueCoverage';sec.className=`sp129-queue-cover ${s.tone}`;
  const rowHtml=c.rows.slice(0,12).map(x=>{const label=x.status==='ok'?'COPERTO':x.status==='partial'?`PARZIALE ${P(x.coverage)}`:x.status==='no'?'NON COPERTO':'DA CONFIGURARE';return `<div class="sp129-qrow ${x.status}"><b>${x.index}</b><div><strong>Ordine ${E(x.run.orderCode||x.run.parent||'—')} · ${E(x.run.client||x.o.client||'')}</strong><span>${E(x.run.product||x.o.product||'')} · ${F(x.qty)} pz</span></div><em>${label}</em></div>`}).join('');
  sec.innerHTML=`<div class="sp129-qhead"><div><span>COPERTURA MATERIALE · SEGUE LA CODA</span><h3>${E(s.big)} della produzione programmata</h3><p>${E(s.detail)} Se Roberto cambia la priorità, questo calcolo cambia automaticamente.</p></div><button class="btn primary" type="button">Materie prime</button></div>${s.alert?`<div class="sp129-inline-alert">${E(s.alert)}</div>`:''}<div class="sp129-qrows">${rowHtml||'<div class="sp129-empty">Nessun lavoro in coda.</div>'}</div>`;
  sec.querySelector('button').onclick=()=>navTo('rawMaterials');const host=v.querySelector('.v115-rules')||v.querySelector('.v115-hero');if(host)host.insertAdjacentElement('afterend',sec);else v.prepend(sec)
}

function configPanel(){
  if(!isSP()||currentView!=='rawMaterials')return;const v=$('rawMaterialsView');if(!v)return;let old=$('sp129MaterialConfig');if(old)old.remove();const names=materialNames();const c=calculate(),s=summaryText(c);const sec=document.createElement('section');sec.id='sp129MaterialConfig';sec.className='sp129-config';
  const options=names.map(n=>`<option value="${E(n)}">${E(n)}</option>`).join('');
  sec.innerHTML=`<div class="sp129-config-head"><div><span>COPERTURA PRODUZIONE</span><h2>Consumo materiale per famiglia prodotto</h2><p>Inserisci il peso reale del pezzo. La piattaforma usa questi dati per coprire la Coda Roberto in ordine di priorità.</p></div><div class="sp129-config-summary ${s.tone}"><b>${E(s.big)}</b><span>${E(s.detail)}</span></div></div><div class="sp129-config-grid">${FAMILIES.map(f=>{const r=recipe(f);return `<div class="sp129-family"><b>${E(f.label)}</b><label>Peso unitario g/pezzo<input type="number" min="0" step="0.1" data-key="${f.key}" data-field="weightG" value="${r.weightG||''}" placeholder="es. peso reale"></label><label>Materiale base<select data-key="${f.key}" data-field="baseMaterial"><option value="">Seleziona</option>${options}</select></label><label>Masterbatch<select data-key="${f.key}" data-field="masterMaterial"><option value="">Nessuno</option>${options}</select></label><label>Master %<input type="number" min="0" max="100" step="0.01" data-key="${f.key}" data-field="masterPct" value="${r.masterPct}"></label></div>`}).join('')}</div><div class="sp129-config-actions"><p><b>Importante:</b> senza il peso reale del pezzo la piattaforma non inventa la copertura.</p><button class="btn primary big" id="sp129SaveRecipes" type="button">Salva consumi produzione</button></div>`;
  v.prepend(sec);
  for(const f of FAMILIES){const r=recipe(f);const b=sec.querySelector(`[data-key="${f.key}"][data-field="baseMaterial"]`),m=sec.querySelector(`[data-key="${f.key}"][data-field="masterMaterial"]`);if(b)b.value=r.baseMaterial;if(m)m.value=r.masterMaterial}
  $('sp129SaveRecipes').onclick=()=>{const c=cfg();sec.querySelectorAll('[data-key]').forEach(el=>{const k=el.dataset.key,field=el.dataset.field;c[k]=c[k]||{};c[k][field]=field==='weightG'||field==='masterPct'?N(el.value):String(el.value||'')});try{save()}catch(_){};try{toast('Consumi produzione salvati')}catch(_){};setTimeout(()=>{configPanel();dashboard();plannerBlock()},50)}
}

function styles(){if($('sp129Style'))return;const s=document.createElement('style');s.id='sp129Style';s.textContent=`
#pressesView #sp128MaterialCoverage,#pressesView #sp128PlannerStep{display:none!important}
.sp129-alert{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:10px 0;padding:13px 15px;border-radius:13px;border:1px solid #e7ce91;background:#fff9ec}.sp129-alert.risk{border-color:#e3a7ac;background:#fff3f3}.sp129-alert b,.sp129-alert span{display:block}.sp129-alert b{font-size:13px}.sp129-alert span{font-size:10px;color:var(--muted);margin-top:2px}
.sp129-queue-cover{margin:12px 0 15px;padding:16px;border:2px solid #b8dccc;border-radius:17px;background:#f3fbf7}.sp129-queue-cover.warn{border-color:#e7ce91;background:#fff9ec}.sp129-queue-cover.risk{border-color:#e3a7ac;background:#fff3f3}.sp129-qhead{display:flex;align-items:center;justify-content:space-between;gap:16px}.sp129-qhead span{font-size:8px;font-weight:950;letter-spacing:.1em;color:#4d7366}.sp129-qhead h3{font-size:20px;margin:3px 0}.sp129-qhead p{font-size:9px;color:var(--muted);margin:0}.sp129-inline-alert{margin-top:10px;padding:9px 11px;border-radius:10px;background:rgba(255,255,255,.7);font-size:9px;font-weight:850}.sp129-qrows{display:grid;gap:6px;margin-top:10px}.sp129-qrow{display:grid;grid-template-columns:30px 1fr auto;gap:9px;align-items:center;padding:8px 9px;border-radius:10px;background:#fff;border:1px solid #dbe7eb}.sp129-qrow>b{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#17394a;color:#fff}.sp129-qrow strong,.sp129-qrow span{display:block}.sp129-qrow strong{font-size:9px}.sp129-qrow span{font-size:7.5px;color:var(--muted);margin-top:2px}.sp129-qrow em{font-style:normal;font-size:7.5px;font-weight:950;padding:5px 7px;border-radius:999px;background:#eaf7f1;color:#26715c}.sp129-qrow.partial em{background:#fff1d5;color:#8a5b17}.sp129-qrow.no em{background:#fdebec;color:#9b3e44}.sp129-qrow.config em{background:#edf2f4;color:#627984}
.sp129-config{margin:0 0 16px;padding:18px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.sp129-config-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.sp129-config-head>div:first-child{flex:1}.sp129-config-head>div:first-child>span{font-size:9px;font-weight:950;letter-spacing:.1em;color:#1680d7}.sp129-config-head h2{font-size:22px;margin:4px 0}.sp129-config-head p{font-size:10px;color:var(--muted);margin:0}.sp129-config-summary{min-width:220px;padding:12px;border-radius:12px;background:#f3fbf7}.sp129-config-summary.warn{background:#fff9ec}.sp129-config-summary.risk{background:#fff3f3}.sp129-config-summary b,.sp129-config-summary span{display:block}.sp129-config-summary b{font-size:20px}.sp129-config-summary span{font-size:8px;color:var(--muted);margin-top:3px}.sp129-config-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}.sp129-family{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#f9fbfc}.sp129-family>b{grid-column:1/-1;font-size:11px}.sp129-family label{font-size:7.5px;font-weight:850;color:#607680}.sp129-family input,.sp129-family select{display:block;width:100%;margin-top:4px;min-height:36px;border:1px solid #d4e1e5;border-radius:8px;background:#fff;padding:6px 8px;font-size:9px}.sp129-config-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.sp129-config-actions p{font-size:9px;color:var(--muted);margin:0}
@media(max-width:900px){.sp129-qhead,.sp129-config-head,.sp129-config-actions,.sp129-alert{display:block}.sp129-qhead button,.sp129-config-actions button,.sp129-alert button{margin-top:10px}.sp129-config-grid{grid-template-columns:1fr}.sp129-family{grid-template-columns:1fr}}
`;document.head.appendChild(s)}

function refresh(){if(!isSP())return;styles();cleanPresses();dashboard();plannerBlock();configPanel();document.title=document.title.replace(/V\d+\.\d+(?:\.\d+)*/,'V11.9.29')}
function observe(){
  const root=document.querySelector('.content')||document.body;if(!root||root.dataset.sp129obs)return;root.dataset.sp129obs='1';let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(refresh,40)}).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(refresh,80),true)
}
function boot(){refresh();observe();[300,900,1800].forEach(ms=>setTimeout(refresh,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

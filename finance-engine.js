const CORE_WEIGHTS={revenue:14,productionValue:6,ebitda:10,ebit:10,netIncome:9,equity:9,debt:8,currentAssets:7,currentLiabilities:6,cash:6,receivables:5,inventory:5,personnel:5,services:4,rawMaterials:4,depreciation:4,operatingCosts:4,totalAssets:2};

export const metricNames={
 revenue:'Ricavi delle vendite e prestazioni',productionValue:'Valore della produzione',otherRevenue:'Altri ricavi e proventi',
 closingInventoryChange:'Variazione rimanenze finali / costruzioni interne',openingInventoryChange:'Variazione rimanenze iniziali',capitalizedWork:'Incrementi per lavori interni',
 ebitda:'EBITDA / MOL',ebit:'EBIT / Risultato operativo',netIncome:'Utile netto',equity:'Patrimonio netto',debt:'Debiti',
 cash:'Disponibilità liquide',receivables:'Crediti',inventory:'Rimanenze',personnel:'Costo del personale',services:'Acquisti / costi per servizi',
 rawMaterials:'Acquisti di beni / materie prime e merci',leases:'Godimento beni di terzi',depreciation:'Ammortamenti',otherOperatingCosts:'Oneri diversi di gestione',
 operatingCosts:'Costi della produzione',currentAssets:'Attivo circolante',currentLiabilities:'Passivo circolante',totalAssets:'Totale attivo',
 otherCredits:'Crediti vari',activeTaxCredits:'Crediti / conti erariali attivi',prepaidAssets:'Ratei e risconti attivi',tradePayables:'Debiti commerciali',taxPayables:'Debiti tributari / conti erariali passivi',socialSecurityPayables:'Enti previdenziali',otherPayables:'Altri debiti',accruedLiabilities:'Ratei e risconti passivi',capitalReserves:'Capitale e riserve',profitCarryForward:'Utile portato a nuovo',lossCarryForward:'Perdita portata a nuovo',
 taxes:'Imposte sul reddito',financialResult:'Oneri finanziari',vehicleCosts:'Gestione veicoli aziendali',externalLabor:'Prestazioni di lavoro non dipendente',adminCommercialCosts:'Spese amministrative, commerciali e rappresentanza',extraordinaryRevenue:'Proventi straordinari'
};

const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-zA-Z0-9%()+\-.,/ ]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const abs=n=>n==null?null:Math.abs(Number(n));

export function parseItalianNumber(raw){
 if(raw==null)return null;let s=String(raw).trim();if(!s)return null;
 let negative=/^\(.*\)$/.test(s)||/-\s*$/.test(s)||/^\s*-/.test(s);
 s=s.replace(/[()€\s]/g,'').replace(/-$/,'').replace(/^-/,'');
 if(!/[0-9]/.test(s))return null;
 if(s.includes('.')&&s.includes(',')){const ld=s.lastIndexOf('.'),lc=s.lastIndexOf(',');s=lc>ld?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}
 else if(s.includes(',')){const parts=s.split(',');s=(parts.length===2&&parts[1].length<=2)?parts[0].replace(/\./g,'')+'.'+parts[1]:s.replace(/,/g,'');}
 else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');
 else if(/^\d{1,3}\.\d{3}$/.test(s))s=s.replace('.','');
 const n=Number(s.replace(/[^0-9.]/g,''));return Number.isFinite(n)?(negative?-n:n):null;
}

function stripLeadingCodes(raw){return String(raw).replace(/^\s*(?:[A-Z]{1,3}\s*\)?\s*)?(?:\d+(?:[./-]\d+)*\s*\)?\s*){0,2}/i,'').trim();}
function numberTokens(raw){
 const cleaned=stripLeadingCodes(raw);
 const re=/\(?-?\d{1,3}(?:\.\d{3})+,\d{1,2}-?\)?|\(?-?\d+,\d{1,2}-?\)?|\(?-?\d{1,3}(?:\.\d{3})+-?\)?|\(?-?\d+-?\)?/g;
 const vals=(cleaned.match(re)||[]).map(t=>({raw:String(t),value:parseItalianNumber(t),hasComma:/,\d{1,2}/.test(t),hasThousands:/\.\d{3}(?:\D|$)/.test(t),isAccountFragment:/^\d{1,3}$/.test(String(t))&&Number(t)<=99,isYear:Number.isInteger(parseItalianNumber(t))&&parseItalianNumber(t)>=1900&&parseItalianNumber(t)<=2100})).filter(x=>x.value!=null);
 const nonYears=vals.filter(x=>!x.isYear);return nonYears.length?nonYears:vals;
}
function amountFromRow(row){
 const vals=numberTokens(row?.text||row);if(!vals.length)return null;
 const money=vals.filter(x=>x.hasComma||x.hasThousands);
 if(row?.layout==='dual-half'){if(money.length)return money[0].value;const usable=vals.filter(x=>!x.isAccountFragment);return (usable.length?usable:vals)[0].value;}
 // In bilanci civilistici a due colonne temporali, il primo importo dopo la voce è l'esercizio corrente.
 if(money.length)return money[0].value;
 const usable=vals.filter(x=>!x.isAccountFragment);return (usable.length?usable:vals)[0].value;
}
function accountMeta(raw){
 const m=String(raw||'').match(/^\s*(\d{1,3}(?:\.\d{1,3})*)\b/);if(!m)return {code:null,depth:99,parent:null};
 const code=m[1],parts=code.split('.');return {code,depth:parts.length,parent:parts[0]};
}
function romanOrLetterMeta(raw){const s=normalize(raw);if(/^\(?[abcd]\)?\s+/.test(s))return 'letter';if(/^\(?[ivxlcdm]+\)?\s+/.test(s))return 'roman';return null;}
function hitItem(row,value){const m=accountMeta(row.text);return {page:row.page,line:row.text,value,side:row.side,section:row.section,code:m.code};}

function textAfterLeadingCode(raw){return normalize(String(raw||'').replace(/^\s*\d{1,3}(?:\.\d{1,3})*\s*/,''));}
function isExplicitLossLine(raw){
 const n=textAfterLeadingCode(raw);
 if(!n)return false;
 // Non considerare negativa la formula civilistica generica "Utile (perdita) dell'esercizio" se non c'è un segno contabile nel valore.
 if(/utile\s*\(?\s*perdita\s*\)?/.test(n))return false;
 return /^perdita/.test(n)||/perdita\s+(?:dell\s+)?esercizio/.test(n)||/risultato\s+.*perdita/.test(n);
}
function isExplicitProfitLine(raw){const n=textAfterLeadingCode(raw);return /^utile/.test(n)||/utile\s+(?:dell\s+)?esercizio/.test(n);}
function valueByAccountNature(metric,row,value){
 if(value==null)return value;
 const v=Number(value);
 if(metric==='netIncome'){
  if(isExplicitLossLine(row?.text))return -Math.abs(v);
  if(isExplicitProfitLine(row?.text))return Math.abs(v);
 }
 if(metric==='financialResult'){
  const n=textAfterLeadingCode(row?.text);
  if(/^oneri/.test(n)||/oneri\s+finanziari/.test(n))return -Math.abs(v);
  if(/^proventi/.test(n)||/proventi\s+finanziari/.test(n))return Math.abs(v);
 }
 return v;
}

const BALANCE_METRICS=new Set(['equity','debt','cash','receivables','inventory','currentAssets','currentLiabilities','totalAssets']);
const INCOME_METRICS=new Set(['revenue','productionValue','operatingCosts','ebit','ebitda','personnel','services','rawMaterials','leases','depreciation','otherOperatingCosts','otherRevenue','openingInventoryChange','closingInventoryChange','capitalizedWork','netIncome','taxes','financialResult','vehicleCosts','externalLabor','adminCommercialCosts','extraordinaryRevenue']);
function metricAllowedOnRow(metric,row){
 if(row?.section==='income'&&BALANCE_METRICS.has(metric))return false;
 if(row?.section==='balance'&&INCOME_METRICS.has(metric))return false;
 return true;
}

const directRules={
 revenue:[/ricavi delle vendite e (?:delle )?prestazioni/,/ricavi delle vendite/,/ricavi vendite e prestazioni/,/ricavi netti delle vendite/,/^\d+\)?\s*ricavi delle vendite/],
 productionValue:[/totale valore della produzione/,/^a\)? valore della produzione/,/valore della produzione totale/,/valore della produzione/],
 operatingCosts:[/totale costi della produzione/,/^b\)? costi della produzione/,/costi della produzione totale/,/costi della produzione/],
 ebit:[/differenza tra valore e costi della produzione/,/risultato operativo/,/^ebit\b/],
 ebitda:[/^ebitda\b/,/margine operativo lordo/,/^mol\b/],
 personnel:[/totale costi? (?:del|per il) personale/,/costi? (?:del|per il) personale/,/costo (?:del|per il) personale/],
 services:[/acquisti di servizi/,/totale costi? per servizi/,/costi? per servizi/,/per servizi/],
 rawMaterials:[/acquisti di beni/,/materie prime sussidiarie di consumo e merci/,/per materie prime/,/costi? per materie prime/,/acquisti materie prime/,/per merci/],
 leases:[/godimento (?:di )?beni di terzi/,/costi? per godimento beni di terzi/],
 depreciation:[/totale ammortamenti(?! e svalutazioni)/,/ammortamento delle immobilizzazioni materiali/,/ammortamento delle immobilizzazioni immateriali/,/^ammortamenti$/,/ammortamenti e svalutazioni/],
 otherOperatingCosts:[/oneri diversi di gestione/],
 otherRevenue:[/altri ricavi e proventi/,/altri ricavi/],
 openingInventoryChange:[/^72\b.*(?:variaz|rimanenze)/,/variaz[.\s]*(?:rim|rimanenze)[.\s]*iniz/i,/variaz(?:ione|\.)?\s*rimanenze\s*iniziali/,/rimanenze\s*iniziali/,/rim\.?\s*iniz/],
 closingInventoryChange:[/variaz[.\s]*rim[.\s]*finali/,/variaz(?:ione|\.)? ?rim(?:anenze)? ?finali/,/rimanenze finali e costruzioni/,/variazione rimanenze finali/,/variazioni delle rimanenze di prodotti/],
 capitalizedWork:[/incrementi? di immobilizzazioni per lavori interni/,/lavori interni capitalizzati/],
 netIncome:[/utile \(perdita\) dell esercizio/,/utile dell esercizio/,/perdita dell esercizio/,/risultato netto/,/^utile\b/,/^perdita\b/],
 equity:[/totale patrimonio netto/,/^a\)? patrimonio netto/,/patrimonio netto totale/,/patrimonio netto$/],
 debt:[/totale debiti/,/^d\)? debiti\b/,/debiti totale/,/^debiti\b/],
 cash:[/totale disponibilita liquide/,/^iv\)? disponibilita liquide/,/^\d{1,3}\s+disponibilita liquide/,/disponibilita liquide totale/,/^disponibilita liquide/],
 receivables:[/totale crediti/,/^ii\)? crediti\b/,/^\d{1,3}\s+crediti\b/,/crediti totale/],
 inventory:[/totale rimanenze/,/^i\)? rimanenze\b/,/^\d{1,3}\s+rimanenze\b/,/rimanenze totale/],
 currentAssets:[/totale attivo circolante/,/^c\)? attivo circolante/,/attivo circolante totale/],
 currentLiabilities:[/totale passivo corrente/,/passivo corrente totale/,/totale passivo circolante/,/passivo circolante totale/,/debiti esigibili entro (?:l )?esercizio successivo/,/debiti entro 12 mesi/],
 totalAssets:[/totale attivo(?! circolante)/,/totale attivita/],
 taxes:[/imposte sul reddito dell esercizio/,/totale imposte sul reddito/],
 financialResult:[/totale proventi e oneri finanziari/,/risultato della gestione finanziaria/,/saldo gestione finanziaria/,/^oneri finanziari\b/],
 vehicleCosts:[/gestione veicoli aziendali/,/esercizio automezzi/],
 externalLabor:[/prestazioni di lavoro non dipendente/,/prestazioni di lavoro autonomo/],
 adminCommercialCosts:[/spese amministrative.*commerciali/,/spese ammin.*comm/,/spese amministrative e generali/],
 extraordinaryRevenue:[/proventi straordinari/]
};

const atomicRules={
 revenue:[/vendite prodotti/,/vendite merci/,/ricavi prestazioni/,/ricavi servizi/,/fatturato/,/corrispettivi/],
 otherRevenue:[/contributi in conto esercizio/,/sopravvenienze attive ordinarie/,/arrotondamenti attivi/],
 personnel:[/salari/,/stipendi/,/oneri sociali/,/trattamento di fine rapporto/,/tfr/,/costo personale/],
 services:[/consulenz/,/utenze/,/energia elettrica/,/trasport/,/manutenz/,/assicuraz/,/spese telefon/,/pubblicit/,/servizi amministrativi/,/lavorazioni di terzi/],
 rawMaterials:[/acquisti materie/,/materie prime c\/acquisti/,/merci c\/acquisti/,/acquisti merci/,/materiali di consumo/,/imballaggi c\/acquisti/,/acquisti materiali/],
 leases:[/locazion/,/nolegg/,/leasing/,/affitti passivi/],
 depreciation:[/ammortament/],
 otherOperatingCosts:[/imposte e tasse deducibili/,/spese varie di gestione/,/oneri diversi/],
 cash:[/cassa/,/banca c\/c/,/conto corrente bancario/,/depositi bancari/,/posta c\/c/],
 inventory:[/rimanenze finali/,/magazzino merci/,/magazzino materie/,/prodotti finiti/],
 receivables:[/crediti verso clienti/,/clienti c\/crediti/],
 debt:[/debiti verso fornitori/,/fornitori c\/debiti/,/debiti tributari/,/debiti verso banche/]
};

function inferSections(rows){
 let current='generic';
 return rows.map(r=>{const n=normalize(r.text);let section=r.section&&r.section!=='generic'?r.section:current;
  if(/conto economico/.test(n))current='income';
  if(/stato patrimoniale|attivita|passivita|attivo|passivo/.test(n)&&!/attivo circolante/.test(n))current='balance';
  if(/conto economico/.test(n))section='income';else if(/stato patrimoniale/.test(n))section='balance';else if(r.section&&r.section!=='generic')section=r.section;else section=current;
  return {...r,section};
 });
}
function detectProfile(rows){
 const text=normalize(rows.map(r=>r.text).join(' '));
 const dualIncome=rows.filter(r=>r.layout==='dual-half'&&r.section==='income').length;
 const dualBalance=rows.filter(r=>r.layout==='dual-half'&&r.section==='balance').length;
 const accountRows=rows.filter(r=>accountMeta(r.text).depth<99).length;
 const civilistic=/stato patrimoniale/.test(text)&&/conto economico/.test(text)&&(/valore della produzione/.test(text)||/ricavi delle vendite/.test(text));
 const fourSection=(dualIncome>10&&/costi/.test(text)&&/ricavi/.test(text))||(/bilancio di verifica/.test(text)&&dualIncome>5);
 const publicBalance=/nota integrativa|bilancio abbreviato|bilancio ordinario|registro imprese|camera di commercio|xbrl/.test(text)||civilistic;
 const scanned=rows.length<5;
 let kind=fourSection?'Bilancio gestionale a 4 sezioni':publicBalance?'Bilancio pubblico / civilistico':(/bilancio di verifica/.test(text)||accountRows>20?'Bilancio di verifica':'Bilancio contabile');
 const hints=[];
 if(fourSection)hints.push('layout a colonne contrapposte');
 if(publicBalance)hints.push('schema civilistico / depositato');
 if(accountRows>20)hints.push('piano dei conti riconosciuto');
 if(rows.some(r=>/spring/i.test(r.text)))hints.push('possibile formato Spring');
 return {kind,fourSection,publicBalance,accountRows,dualIncome,dualBalance,scanned,hints};
}
function rowScore(row,ruleIndex=0){
 const n=normalize(row.text),m=accountMeta(row.text);let s=100-ruleIndex*2;
 if(row.layout==='dual-half')s+=18;if(/\btotale\b/.test(n))s+=35;
 if(m.depth===1)s+=65;else if(m.depth===2)s+=25;else if(m.depth===3)s+=5;else if(romanOrLetterMeta(row.text))s+=20;
 if(/\baltri\b/.test(n)&&m.depth>=3)s-=20;
 if(/nota integrativa|commento|descrizione/.test(n))s-=25;
 return s;
}
function directExtract(lines){
 const data={},sources={},candidates={};
 for(const [metric,rules] of Object.entries(directRules)){
  const hits=[];
  for(const row of lines){const n=normalize(row.text);if(!n||!metricAllowedOnRow(metric,row))continue;const ri=rules.findIndex(r=>r.test(n));if(ri<0)continue;const value=amountFromRow(row);if(value==null)continue;hits.push({value,row,score:rowScore(row,ri),ri});}
  if(!hits.length)continue;hits.sort((a,b)=>b.score-a.score);candidates[metric]=hits.slice(0,5).map(h=>hitItem(h.row,h.value));
  if(metric==='depreciation'){
   const specific=hits.filter(h=>/ammortamento/.test(normalize(h.row.text))&&!/svalutaz/.test(normalize(h.row.text)));
   if(specific.length>=2){const minDepth=Math.min(...specific.map(h=>accountMeta(h.row.text).depth));const chosen=specific.filter(h=>accountMeta(h.row.text).depth===minDepth);data[metric]=chosen.reduce((s,h)=>s+abs(h.value),0);sources[metric]={method:'classified_sum',confidence:92,items:chosen.map(h=>hitItem(h.row,h.value))};continue;}
  }
  const h=hits[0];const signed=valueByAccountNature(metric,h.row,h.value);data[metric]=signed;sources[metric]={method:'direct',confidence:h.score>=170?99:h.score>=140?96:88,items:[hitItem(h.row,signed)]};
 }
 return {data,sources,candidates};
}

const FOUR_SECTION_CODE_MAP={'70':'revenue','71':'closingInventoryChange','72':'openingInventoryChange','73':'otherRevenue','74':'capitalizedWork','75':'rawMaterials','76':'services','77':'vehicleCosts','78':'externalLabor','79':'adminCommercialCosts','80':'leases','81':'personnel','83':'otherOperatingCosts','86':'financialResult','87':'extraordinaryRevenue','90':'depreciation','93':'taxes'};

function rowTextAmountConfidence(row){
 const v=amountFromRow(row);if(v==null)return null;
 const txt=String(row.text||'');const toks=numberTokens(txt);let confidence=80;
 if(toks.some(t=>t.hasComma||t.hasThousands))confidence+=10;
 if(/\b\d{2}(?:\.\d{2})+\b/.test(txt))confidence-=5;
 return {value:v,confidence};
}
function firstLevelOrHeader(row){const m=accountMeta(row.text);return m.depth===1||!m.code;}
function matchFourSectionClass(row){
 const n=normalize(row.text);const m=accountMeta(row.text);const parent=m.parent;
 // Codice di classe: è sempre più affidabile quando è all'inizio della metà corretta della tabella.
 if(m.depth===1&&FOUR_SECTION_CODE_MAP[parent])return {metric:FOUR_SECTION_CODE_MAP[parent],reason:`classe ${parent}`,priority:120};
 // Nei PDF Spring il codice della colonna di destra può cadere nella metà sinistra; quindi servono anche pattern testuali.
 const phraseRules=[
  ['revenue',[/ricavi delle vendite e (?:delle )?prestazioni/,/ricavi delle vendite/,/vendite prodotti finiti e merci/],115],
  ['closingInventoryChange',[/variaz\.?\s*rim\.?\s*finali/,/variazioni? (?:delle )?rimanenze (?:di )?prodotti/,/rimanenze finali e costruzioni/,/^rimanenze finali/],112],
  ['otherRevenue',[/altri ricavi e proventi/,/^proventi diversi/],110],
  ['extraordinaryRevenue',[/proventi straordinari/],105],
  ['capitalizedWork',[/incrementi? di immobilizzazioni per lavori interni/,/costruzioni interne/],108],
  ['openingInventoryChange',[/^72\b.*(?:variaz|rimanenze)/,/variaz[.\s]*(?:rim|rimanenze)[.\s]*iniz/i,/variaz\.?\s*rimanenze\s*iniziali/,/^rimanenze\s*iniziali\b/,/rim\.?\s*iniz/],116],
  ['rawMaterials',[/^acquisti di beni/,/acquisti per produz(?:ione|\.)? di beni/,/materie prime sussidiarie di consumo e merci/],112],
  ['services',[/^acquisti di servizi/,/servizi per la produzione/,/costi? per servizi/],112],
  ['vehicleCosts',[/gestione veicoli aziendali/,/esercizio automezzi/],112],
  ['externalLabor',[/prestazioni di lavoro non dipendente/,/prestazioni di lavoro autonomo/],112],
  ['adminCommercialCosts',[/spese amministrative.*commerciali/,/spese ammin.*comm/,/spese amministrative e generali/],112],
  ['leases',[/godimento (?:di )?beni di terzi/],112],
  ['personnel',[/costi? (?:del|per il) personale/,/^personale/],112],
  ['otherOperatingCosts',[/oneri diversi di gestione/],112],
  ['financialResult',[/^oneri finanziari/,/oneri finanziari verso banche/],110],
  ['depreciation',[/ammortamenti e svalutazioni/,/^ammortamenti/],112],
  ['taxes',[/imposte dell esercizio/,/imposte sul reddito/],100],
  ['netIncome',[/^utile/,/^perdita/],105]
 ];
 for(const [metric,regs,priority] of phraseRules){if(regs.some(r=>r.test(n)))return {metric,reason:'descrizione',priority};}
 return null;
}
function chooseFourSectionCandidate(cands){
 if(!cands.length)return null;
 // Preferisci la riga di classe/top level. I sottoconti servono solo se manca il totale.
 cands.sort((a,b)=>{
  const am=accountMeta(a.row.text),bm=accountMeta(b.row.text);
  const ad=am.depth===99?2:am.depth,bd=bm.depth===99?2:bm.depth;
  const as=a.priority+(ad===1?60:ad===2?15:0)+(a.value!=null&&Math.abs(a.value)>0?5:0)+(a.row.layout==='dual-half'?10:0);
  const bs=b.priority+(bd===1?60:bd===2?15:0)+(b.value!=null&&Math.abs(b.value)>0?5:0)+(b.row.layout==='dual-half'?10:0);
  return bs-as;
 });
 return cands[0];
}
function fourSectionExtract(lines,data,sources){
 const income=lines.filter(r=>r.section==='income');
 const buckets={};
 for(const row of income){
  const cls=matchFourSectionClass(row);if(!cls)continue;
  const av=rowTextAmountConfidence(row);if(!av||av.value==null)continue;
  // Evita righe di dettaglio molto profonde quando contengono solo descrizioni atomiche, a meno che siano l'unica fonte.
  const meta=accountMeta(row.text);
  const item={row,value:av.value,priority:cls.priority,reason:cls.reason,meta,confidence:Math.min(99,av.confidence+(meta.depth===1?10:0))};
  (buckets[cls.metric] ||= []).push(item);
 }
 const recognized=[];
 for(const [metric,cands] of Object.entries(buckets)){
  const chosen=chooseFourSectionCandidate(cands);if(!chosen)continue;
  // Nel 4 sezioni il totale di classe deve sovrascrivere letture generiche precedenti, anche se directExtract aveva trovato un sottoconto.
  const signed=valueByAccountNature(metric,chosen.row,chosen.value);
  data[metric]=signed;
  sources[metric]={method:'direct',confidence:chosen.confidence,items:[hitItem(chosen.row,signed)]};
  recognized.push({metric,...chosen,value:signed});
 }
 // V55: riconoscimento rinforzato delle rimanenze iniziali nei bilanci Spring / 4 sezioni.
 // In alcuni PDF la riga 72 può essere estratta insieme al lato ricavi o senza sezione income;
 // se non viene mappata, i KPI di costi e marginalità risultano falsati.
 if(data.openingInventoryChange==null){
  const rimRows=lines.filter(r=>{
   const meta=accountMeta(r.text), n=normalize(r.text), raw=String(r.text||'');
   return (meta.parent==='72'||/^\s*72(?:\b|[.\s])/.test(raw)) && /(variaz|rimanenze|rim\.?\s*iniz)/.test(n);
  }).map(r=>({row:r,value:amountFromRow(r),meta:accountMeta(r.text)})).filter(x=>x.value!=null);
  if(rimRows.length){
   rimRows.sort((a,b)=>{
    const ad=a.meta.depth===1?0:a.meta.depth===2?1:2;
    const bd=b.meta.depth===1?0:b.meta.depth===2?1:2;
    return ad-bd;
   });
   const best=rimRows[0];
   data.openingInventoryChange=best.value;
   sources.openingInventoryChange={method:'direct',confidence:98,items:[hitItem(best.row,best.value)],note:'Riconosciuto da conto 72 / rimanenze iniziali'};
   recognized.push({metric:'openingInventoryChange',row:best.row,value:best.value,meta:best.meta,confidence:98,priority:125,reason:'conto 72'});
  }
 }
 if(data.depreciation==null){
  const depRows=income.filter(r=>accountMeta(r.text).parent==='90'&&/ammortament/.test(normalize(r.text))).map(r=>({row:r,meta:accountMeta(r.text),value:amountFromRow(r)})).filter(x=>x.value!=null);
  if(depRows.length){const minDepth=Math.min(...depRows.map(x=>x.meta.depth));const chosen=depRows.filter(x=>x.meta.depth===minDepth);data.depreciation=chosen.reduce((s,x)=>s+abs(x.value),0);sources.depreciation={method:'classified_sum',confidence:94,items:chosen.map(x=>hitItem(x.row,x.value))};}
 }
 const revenueKeys=['revenue','closingInventoryChange','otherRevenue','capitalizedWork'];
 const revenueItems=revenueKeys.filter(k=>data[k]!=null).map(k=>({k,v:data[k],src:sources[k]?.items?.[0]}));
 if(data.revenue!=null&&revenueItems.length>=1){
  // Nel bilancio gestionale a 4 sezioni il valore della produzione è il lato ricavi: 70 + 71 + 73 (+74). Non solo 70.
  const pv=revenueItems.reduce((s,x)=>s+Number(x.v||0),0);
  if(data.productionValue==null||sources.productionValue?.method!=='direct'){
   data.productionValue=pv;sources.productionValue={method:'classified_sum',confidence:revenueItems.length>=3?98:revenueItems.length>=2?92:78,formula:'70 + 71 + 73 (+ 74 se presente)',deps:revenueItems.map(x=>x.k),items:revenueItems.map(x=>x.src).filter(Boolean)};
  }
 }
 const opCostKeys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','depreciation','otherOperatingCosts'];
 const opPresent=opCostKeys.filter(k=>data[k]!=null);
 // V25: non creare un totale "costi della produzione" utile per EBIT se mancano gli ammortamenti.
 // Senza 82/ammortamenti, la somma è solo costi monetari e genera un EBIT fittizio uguale al MOL.
 if(opPresent.length>=4 && data.depreciation!=null){
  const oc=opPresent.reduce((s,k)=>s+abs(data[k]),0);
  if(data.operatingCosts==null||sources.operatingCosts?.method!=='direct'){
   data.operatingCosts=oc;sources.operatingCosts={method:'classified_sum',confidence:opPresent.length===opCostKeys.length?97:88,formula:'72 + 75 + 76 + 77 + 78 + 79 + 80 + 81 + 83 + 90',deps:opPresent,items:opPresent.flatMap(k=>sources[k]?.items||[])};
  }
 }
 const cashCostKeys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts'];
 const cashPresent=cashCostKeys.filter(k=>data[k]!=null);
 if(data.productionValue!=null&&cashPresent.length>=4){
  const cashCosts=cashPresent.reduce((s,k)=>s+abs(data[k]),0);
  data.ebitda=data.productionValue-cashCosts;
  sources.ebitda={method:'calculated',confidence:cashPresent.length===cashCostKeys.length?98:88,formula:'Valore produzione − costi operativi monetari completi (72+75+76+77+78+79+80+81+83)',deps:['productionValue',...cashPresent],items:cashPresent.flatMap(k=>sources[k]?.items||[])};
 }
 return {topLevelIncomeRows:recognized.filter(x=>x.meta?.depth===1).length,recognizedTopLevel:recognized.length};
}



function findTopValue(lines, code, labelRegex, opts={}){
 const out=[];
 const codeRe=String(code).replace('.', '\\.');
 const rx=new RegExp('(?:^|\\s)'+codeRe+'\\s+'+labelRegex.source+'\\s+(-?\\d{1,3}(?:\\.\\d{3})*,\\d{1,2}-?)','i');
 for(const row of lines){
  const m=String(row.text||'').match(rx);
  if(m){const value=parseItalianNumber(m[1]); if(value!=null)out.push({row,value});}
 }
 if(!out.length)return null;
 if(opts.pick==='min')return out.reduce((a,b)=>Math.abs(b.value)<Math.abs(a.value)?b:a);
 if(opts.pick==='max')return out.reduce((a,b)=>Math.abs(b.value)>Math.abs(a.value)?b:a);
 return out[0];
}
function findTextValue(lines, labelRegex, opts={}){
 const out=[];
 const rx=new RegExp(labelRegex.source+'\\s+(-?\\d{1,3}(?:\\.\\d{3})*,\\d{1,2}-?)','i');
 for(const row of lines){const m=String(row.text||'').match(rx); if(m){const value=parseItalianNumber(m[1]); if(value!=null)out.push({row,value});}}
 if(!out.length)return null;
 if(opts.pick==='min')return out.reduce((a,b)=>Math.abs(b.value)<Math.abs(a.value)?b:a);
 if(opts.pick==='max')return out.reduce((a,b)=>Math.abs(b.value)>Math.abs(a.value)?b:a);
 return out[0];
}
function setStructured(key,data,sources,value,formula,deps,items,confidence=95){
 if(Number.isFinite(value)){
  data[key]=Number(value);
  sources[key]={method:'reconstructed',confidence,formula,deps,items:(items||[]).filter(Boolean).map(x=>hitItem(x.row,x.value))};
 }
}
function hardReconstructFourSectionBalance(lines,data,sources){
 const balance=lines.filter(r=>r.section==='balance');
 if(!balance.length)return 0;
 const v={
  inventory:findTopValue(balance,'21',/RIMANENZE/),
  receivables:findTopValue(balance,'23',/CREDITI COMMERCIALI/),
  otherCredits:findTopValue(balance,'27',/CREDITI VARI/),
  cash:findTopValue(balance,'31',/DISPONIBILITA'? LIQUIDE/),
  activeTax:findTopValue(balance,'59',/CONTI ERARIALI/,{pick:'max'}),
  prepaid:findTopValue(balance,'39',/RATEI E RISCONTI ATTIVI/),
  tradeDebt:findTopValue(balance,'57',/DEBITI COMMERCIALI/),
  passiveTax:findTopValue(balance,'59',/CONTI ERARIALI/,{pick:'min'}),
  socialSecurity:findTopValue(balance,'61',/ENTI PREVIDENZIALI/),
  otherDebt:findTopValue(balance,'63',/ALTRI DEBITI/),
  accruals:findTopValue(balance,'69',/RATEI E RISCONTI PASSIVI/),
  capitalReserves:findTopValue(balance,'41',/CAPITALE E RISERVE/),
  profitCarry:findTextValue(balance,/Utile portato a nuovo/),
  lossCarry:findTextValue(balance,/Perdita portata a nuovo/)
 };
 const setComp=(key,hit,label)=>{if(hit){data[key]=Math.abs(hit.value);sources[key]={method:'direct',confidence:98,items:[hitItem(hit.row,hit.value)],formula:label};}};
 setComp('inventory',v.inventory,'21 Rimanenze');
 setComp('receivables',v.receivables,'23 Crediti commerciali');
 setComp('otherCredits',v.otherCredits,'27 Crediti vari');
 setComp('cash',v.cash,'31 Disponibilità liquide');
 setComp('activeTaxCredits',v.activeTax,'59 Crediti / conti erariali attivi');
 setComp('prepaidAssets',v.prepaid,'39 Ratei e risconti attivi');
 const caItems=[v.inventory,v.receivables,v.otherCredits,v.cash,v.activeTax,v.prepaid].filter(Boolean);
 if(caItems.length>=4){const val=caItems.reduce((s,x)=>s+Math.abs(x.value),0);setStructured('currentAssets',data,sources,val,'21 Rimanenze + 23 Crediti commerciali + 27 Crediti vari + 31 Disponibilità liquide + 59 crediti/conti erariali attivi + 39 ratei/risconti attivi',['inventory','receivables','otherCredits','cash','activeTaxCredits','prepaidAssets'],caItems,96);}
 setComp('tradePayables',v.tradeDebt,'57 Debiti commerciali');
 setComp('taxPayables',v.passiveTax,'59 Debiti tributari / conti erariali passivi');
 setComp('socialSecurityPayables',v.socialSecurity,'61 Enti previdenziali');
 setComp('otherPayables',v.otherDebt,'63 Altri debiti');
 setComp('accruedLiabilities',v.accruals,'69 Ratei e risconti passivi');
 const clItems=[v.tradeDebt,v.passiveTax,v.socialSecurity,v.otherDebt,v.accruals].filter(Boolean);
 if(clItems.length>=4){const val=clItems.reduce((s,x)=>s+Math.abs(x.value),0);setStructured('currentLiabilities',data,sources,val,'57 Debiti commerciali + 59 debiti tributari/previdenziali + 63 altri debiti + 69 ratei/risconti passivi',['tradePayables','taxPayables','socialSecurityPayables','otherPayables','accruedLiabilities'],clItems,94);}
 if(v.tradeDebt){data.debt=Math.abs(v.tradeDebt.value);sources.debt={method:'direct',confidence:98,items:[hitItem(v.tradeDebt.row,v.tradeDebt.value)]};}
 const eqItems=[v.capitalReserves,v.profitCarry,v.lossCarry].filter(Boolean);
 let equity=null;
 if(v.capitalReserves){data.capitalReserves=Math.abs(v.capitalReserves.value);sources.capitalReserves={method:'direct',confidence:98,items:[hitItem(v.capitalReserves.row,v.capitalReserves.value)],formula:'41 Capitale e riserve'};equity=(equity??0)+Math.abs(v.capitalReserves.value);}
 if(v.profitCarry){data.profitCarryForward=Math.abs(v.profitCarry.value);sources.profitCarryForward={method:'direct',confidence:98,items:[hitItem(v.profitCarry.row,v.profitCarry.value)],formula:'Utile portato a nuovo'};equity=(equity??0)+Math.abs(v.profitCarry.value);}
 if(v.lossCarry){data.lossCarryForward=Math.abs(v.lossCarry.value);sources.lossCarryForward={method:'direct',confidence:98,items:[hitItem(v.lossCarry.row,v.lossCarry.value)],formula:'Perdita portata a nuovo'};equity=(equity??0)-Math.abs(v.lossCarry.value);}
 if(data.netIncome!=null)equity=(equity??0)+Number(data.netIncome);
 if(equity!=null){setStructured('equity',data,sources,equity,'41 Capitale e riserve + utili portati a nuovo − perdite portate a nuovo + utile/perdita dell’esercizio',['capitalReserves','profitCarryForward','lossCarryForward','netIncome'],eqItems.concat(sources.netIncome?.items?.[0]? [{row:{text:sources.netIncome.items[0].line,page:sources.netIncome.items[0].page,section:'income'},value:data.netIncome}] : []),92);}
 return caItems.length+clItems.length+eqItems.length;
}

function reconstructFourSectionBalance(lines,data,sources){
 const balance=lines.filter(r=>r.section==='balance');
 if(!balance.length)return {balanceComponents:0};
 const byCode={};
 for(const row of balance){
  const meta=accountMeta(row.text);
  if(meta.depth!==1||!meta.parent)continue;
  const av=rowTextAmountConfidence(row);if(!av||av.value==null)continue;
  const code=meta.parent;
  // In layout a 4 sezioni il lato aiuta a distinguere attivo/passivo anche quando il testo è ambiguo.
  byCode[code]={code,row,value:av.value,side:row.side,confidence:Math.min(99,av.confidence+8)};
 }
 const item=c=>byCode[c]?hitItem(byCode[c].row,byCode[c].value):null;
 const sumCodes=(codes)=>codes.filter(c=>byCode[c]).reduce((s,c)=>s+abs(byCode[c].value),0);
 const items=(codes)=>codes.map(item).filter(Boolean);
 const setRecon=(key,value,formula,codes,confidence=94)=>{
  if(Number.isFinite(value)&&value!==0){
   data[key]=value;
   sources[key]={method:'reconstructed',confidence,formula,deps:codes,items:items(codes)};
  }
 };
 // Attivo circolante gestionale: rimanenze, crediti, liquidità, crediti fiscali e ratei/risconti attivi.
 const currentAssetCodes=['21','23','27','31','59','39'];
 const currentAssets=sumCodes(currentAssetCodes);
 const compByCode={
  '21':['inventory','21 Rimanenze'],'23':['receivables','23 Crediti commerciali'],'27':['otherCredits','27 Crediti vari'],'31':['cash','31 Disponibilità liquide'],'59':['activeTaxCredits','59 Crediti / conti erariali attivi'],'39':['prepaidAssets','39 Ratei e risconti attivi']
 };
 for(const [code,[key,label]] of Object.entries(compByCode)){if(byCode[code]){data[key]=abs(byCode[code].value);sources[key]={method:'direct',confidence:byCode[code].confidence,items:[item(code)],formula:label};}}
 if(currentAssets>0)setRecon('currentAssets',currentAssets,'21 Rimanenze + 23 Crediti commerciali + 27 Crediti vari + 31 Disponibilità liquide + 59 crediti/conti erariali attivi + 39 ratei/risconti attivi',['inventory','receivables','otherCredits','cash','activeTaxCredits','prepaidAssets'],96);
 // Passivo circolante operativo: debiti commerciali, tributari/previdenziali, altri debiti, ratei/risconti passivi.
 // I finanziamenti 55 restano esclusi dal circolante perché il PDF non separa entro/oltre 12 mesi.
 const currentLiabilityCodes=['57','59','61','63','69'];
 const currentLiabilities=sumCodes(currentLiabilityCodes);
 const liabByCode={'57':['tradePayables','57 Debiti commerciali'],'59':['taxPayables','59 Debiti tributari / conti erariali passivi'],'61':['socialSecurityPayables','61 Enti previdenziali'],'63':['otherPayables','63 Altri debiti'],'69':['accruedLiabilities','69 Ratei e risconti passivi']};
 for(const [code,[key,label]] of Object.entries(liabByCode)){if(byCode[code]){data[key]=abs(byCode[code].value);sources[key]={method:'direct',confidence:byCode[code].confidence,items:[item(code)],formula:label};}}
 if(currentLiabilities>0)setRecon('currentLiabilities',currentLiabilities,'57 Debiti commerciali + 59 debiti tributari/previdenziali + 63 altri debiti + 69 ratei/risconti passivi',['tradePayables','taxPayables','socialSecurityPayables','otherPayables','accruedLiabilities'],94);
 if(byCode['57']){data.debt=abs(byCode['57'].value);sources.debt={method:'direct',confidence:byCode['57'].confidence,items:[item('57')]};}
 // Patrimonio netto ricostruito: capitale/riserve + utili portati a nuovo - perdite portate a nuovo + utile/perdita esercizio.
 const equityItems=[];
 let equity=null;
 if(byCode['41']){data.capitalReserves=abs(byCode['41'].value);sources.capitalReserves={method:'direct',confidence:byCode['41'].confidence,items:[item('41')],formula:'41 Capitale e riserve'};equity=(equity??0)+abs(byCode['41'].value);equityItems.push(item('41'));}
 // Codice 43 può apparire su entrambi i lati: a destra utile portato a nuovo, a sinistra perdita portata a nuovo.
 const code43Rows=balance.filter(r=>accountMeta(r.text).depth===1&&accountMeta(r.text).parent==='43').map(row=>({row,value:amountFromRow(row)})).filter(x=>x.value!=null);
 for(const h of code43Rows){
  const n=normalize(h.row.text);
  if(/perdita/.test(n)||h.row.side==='left') {data.lossCarryForward=abs(h.value);sources.lossCarryForward={method:'direct',confidence:96,items:[hitItem(h.row,h.value)],formula:'Perdita portata a nuovo'};equity=(equity??0)-abs(h.value);equityItems.push(hitItem(h.row,-abs(h.value)));}
  else {data.profitCarryForward=abs(h.value);sources.profitCarryForward={method:'direct',confidence:96,items:[hitItem(h.row,h.value)],formula:'Utile portato a nuovo'};equity=(equity??0)+abs(h.value);equityItems.push(hitItem(h.row,abs(h.value)));}
 }
 if(data.netIncome!=null){equity=(equity??0)+Number(data.netIncome);if(sources.netIncome?.items?.[0])equityItems.push(sources.netIncome.items[0]);}
 if(equity!=null&&Number.isFinite(equity)){data.equity=equity;sources.equity={method:'reconstructed',confidence:92,formula:'41 Capitale e riserve + 43 utili portati a nuovo − perdite portate a nuovo + utile/perdita dell’esercizio',deps:['capitalReserves','profitCarryForward','lossCarryForward','netIncome'],items:equityItems.filter(Boolean)};}
 return {balanceComponents:Object.keys(byCode).length};
}

function isTotalOrHeader(n){return /\btotale\b|valore della produzione|costi della produzione|stato patrimoniale|conto economico|patrimonio netto|attivo circolante/.test(n);}
function looksLikeAccountLine(raw){return /^\s*\d{2,}(?:[./-]\d+)*\b/.test(raw)||/^\s*[A-Z]{1,3}\d{2,}/i.test(raw);}
function atomicFallback(lines,data,sources){
 for(const [metric,rules] of Object.entries(atomicRules)){
  if(data[metric]!=null)continue;const hits=[];
  for(const row of lines){const n=normalize(row.text),meta=accountMeta(row.text);if(!n||!metricAllowedOnRow(metric,row)||isTotalOrHeader(n)||!looksLikeAccountLine(row.text))continue;if(!rules.some(r=>r.test(n)))continue;const v=amountFromRow(row);if(v==null)continue;hits.push({page:row.page,line:row.text,value:v,depth:meta.depth,code:meta.code,side:row.side,section:row.section});}
  if(!hits.length)continue;const minDepth=Math.min(...hits.map(h=>h.depth));const chosen=hits.filter(h=>h.depth===minDepth);
  if(chosen.length>=2||['cash','receivables','inventory','debt'].includes(metric)){data[metric]=chosen.reduce((a,h)=>a+abs(h.value),0);sources[metric]={method:'classified_sum',confidence:chosen.length>=2?78:70,items:chosen};}
 }
}
function calculate(data,sources){
 const setCalc=(k,v,formula,deps,confidence=90)=>{if(data[k]==null&&Number.isFinite(v)){data[k]=v;sources[k]={method:'calculated',confidence,formula,deps,items:[]};}};
 const dep=data.depreciation!=null?abs(data.depreciation):null;
 if(data.productionValue==null&&data.revenue!=null){const revKeys=['revenue','closingInventoryChange','otherRevenue','capitalizedWork'].filter(k=>data[k]!=null);if(revKeys.length>=2)setCalc('productionValue',revKeys.reduce((s,k)=>s+Number(data[k]||0),0),'Ricavi + variazione rimanenze finali + altri ricavi',revKeys,revKeys.length>=3?92:82);}
 const opKeys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','depreciation','otherOperatingCosts'];
 const opPresent=opKeys.filter(k=>data[k]!=null);
 if(data.operatingCosts==null&&opPresent.length>=5&&data.depreciation!=null)setCalc('operatingCosts',opPresent.reduce((s,k)=>s+abs(data[k]),0),'Somma costi operativi riconosciuti inclusi ammortamenti',opPresent,opPresent.length===opKeys.length?92:82);
 const cashKeys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts'];
 const cashPresent=cashKeys.filter(k=>data[k]!=null);
 if(data.ebitda==null&&data.productionValue!=null&&cashPresent.length>=5)setCalc('ebitda',data.productionValue-cashPresent.reduce((s,k)=>s+abs(data[k]),0),'Valore produzione − costi operativi monetari completi',['productionValue',...cashPresent],cashPresent.length===cashKeys.length?94:82);
 if(data.ebit==null&&data.productionValue!=null&&data.operatingCosts!=null&&(sources.operatingCosts?.method==='direct'||data.depreciation!=null))setCalc('ebit',data.productionValue-data.operatingCosts,'Valore della produzione − Costi della produzione',['productionValue','operatingCosts'],95);
 if(data.ebitda==null&&data.ebit!=null&&dep!=null)setCalc('ebitda',data.ebit+dep,'EBIT + Ammortamenti',['ebit','depreciation'],94);
 if(data.ebit==null&&data.ebitda!=null&&dep!=null)setCalc('ebit',data.ebitda-dep,'EBITDA − Ammortamenti',['ebitda','depreciation'],90);
}
function validations(data,parser){
 const out=[];
 out.push({ok:true,label:`Formato rilevato: ${parser.kind}`,detail:(parser.hints||[]).length?parser.hints.join(' · '):'Documento analizzato con tassonomia NOMYRA universale.'});
 if(parser?.fourSection)out.push({ok:true,label:'Struttura a 4 sezioni riconosciuta',detail:'Costi e ricavi sono stati separati per colonna prima dell’estrazione dei valori.'});
 if(data.ebit!=null&&data.productionValue!=null&&data.operatingCosts!=null){const expected=data.productionValue-data.operatingCosts,tol=Math.max(10,abs(data.ebit)*.02);out.push({ok:Math.abs(expected-data.ebit)<=tol,label:'Quadratura risultato operativo',detail:`A − B = ${expected.toFixed(0)}, EBIT = ${data.ebit.toFixed(0)}`});}
 if(data.ebit==null&&data.ebitda!=null&&data.depreciation==null)out.push({ok:false,label:'EBIT non confermato',detail:'Il MOL/EBITDA è disponibile, ma non sono stati trovati ammortamenti o un risultato operativo ufficiale. EBIT e ROS restano da completare.'});
 if(data.ebitda!=null&&data.ebit!=null&&data.depreciation!=null){const expected=data.ebit+abs(data.depreciation),tol=Math.max(10,abs(data.ebitda)*.03);out.push({ok:Math.abs(expected-data.ebitda)<=tol,label:'Quadratura EBITDA / MOL',detail:'Confronto tra MOL e EBIT + ammortamenti'});}
 if(data.totalAssets!=null&&data.equity!=null&&data.debt!=null&&data.totalAssets<(data.equity+data.debt)*0.5)out.push({ok:false,label:'Possibile incompleta lettura patrimoniale',detail:'Totale attivo molto inferiore a patrimonio netto + debiti: verificare fonti o pagina mancante.'});
 if(data.equity!=null&&data.equity<0)out.push({ok:false,label:'Patrimonio netto negativo',detail:'Richiede approfondimento'});
 return out;
}
function qualityScore(data,sources,vals){
 let got=0,total=Object.values(CORE_WEIGHTS).reduce((a,b)=>a+b,0);for(const [k,w] of Object.entries(CORE_WEIGHTS))if(data[k]!=null)got+=w;
 const sourceConf=Object.values(sources).length?Object.values(sources).reduce((a,s)=>a+(s.confidence||60),0)/Object.values(sources).length:0;
 const checks=vals.filter(v=>!/^Formato/.test(v.label)&&!/^Struttura/.test(v.label));const valAdj=checks.length?checks.filter(v=>v.ok).length/checks.length*5:2;
 return Math.max(20,Math.min(99,Math.round((got/total)*82+(sourceConf/100)*13+valAdj)));
}


export const REVIEW_KEYS=['revenue','productionValue','ebitda','ebit','netIncome','equity','capitalReserves','profitCarryForward','lossCarryForward','debt','currentAssets','currentLiabilities','cash','receivables','inventory','otherCredits','activeTaxCredits','prepaidAssets','tradePayables','taxPayables','socialSecurityPayables','otherPayables','accruedLiabilities','personnel','services','rawMaterials','depreciation','leases','otherOperatingCosts','vehicleCosts','externalLabor','adminCommercialCosts','financialResult','taxes','extraordinaryRevenue','netIncome','totalAssets'];
function recalcCompositeReview(data,sources,edited=new Set()){
 const has=(k)=>data[k]!=null&&Number.isFinite(Number(data[k]));
 const sum=(keys)=>keys.reduce((t,k)=>t+Math.abs(Number(data[k]||0)),0);
 const currentAssetKeys=['inventory','receivables','otherCredits','cash','activeTaxCredits','prepaidAssets'];
 if(!edited.has('currentAssets')&&currentAssetKeys.filter(has).length>=4){
  data.currentAssets=sum(currentAssetKeys);
  sources.currentAssets={method:'calculated',confidence:96,formula:'Rimanenze + crediti commerciali + crediti vari + disponibilità liquide + crediti/conti erariali attivi + ratei/risconti attivi',deps:currentAssetKeys,items:currentAssetKeys.flatMap(k=>sources[k]?.items||[])};
 }
 const currentLiabilityKeys=['tradePayables','taxPayables','socialSecurityPayables','otherPayables','accruedLiabilities'];
 if(!edited.has('currentLiabilities')&&currentLiabilityKeys.filter(has).length>=4){
  data.currentLiabilities=sum(currentLiabilityKeys);
  sources.currentLiabilities={method:'calculated',confidence:94,formula:'Debiti commerciali + debiti tributari/previdenziali + altri debiti + ratei/risconti passivi',deps:currentLiabilityKeys,items:currentLiabilityKeys.flatMap(k=>sources[k]?.items||[])};
 }
 const eqKeys=['capitalReserves','profitCarryForward','lossCarryForward','netIncome'];
 if(!edited.has('equity')&&eqKeys.filter(has).length>=2){
  const equity=(has('capitalReserves')?Math.abs(Number(data.capitalReserves)):0)+(has('profitCarryForward')?Math.abs(Number(data.profitCarryForward)):0)-(has('lossCarryForward')?Math.abs(Number(data.lossCarryForward)):0)+(has('netIncome')?Number(data.netIncome):0);
  data.equity=equity;
  sources.equity={method:'calculated',confidence:92,formula:'Capitale e riserve + utili portati a nuovo − perdite portate a nuovo + utile/perdita dell’esercizio',deps:eqKeys,items:eqKeys.flatMap(k=>sources[k]?.items||[])};
 }
}
export function applyManualReview(doc, values={}){
 const data={...(doc?.data||{})};
 const sources={...(doc?.sources||{})};
 const edited=new Set();
 for(const [k,raw] of Object.entries(values||{})){
  if(!REVIEW_KEYS.includes(k))continue;
  const isBlank=raw==null||String(raw).trim()==='';
  if(isBlank){delete data[k];delete sources[k];continue;}
  const v=typeof raw==='number'?raw:parseItalianNumber(raw);
  if(v==null||!Number.isFinite(Number(v)))continue;
  const old=data[k];
  const same=old!=null&&Math.abs(Number(old)-Number(v))<0.01;
  data[k]=Number(v);
  sources[k]={method:same?'user_confirmed':'manual_override',confidence:100,verified:true,items:[{page:'—',line:same?'Valore confermato dall’utente in revisione guidata':'Valore inserito o corretto dall’utente in revisione guidata',value:Number(v)}]};
  edited.add(k);
 }
 // Quando l’utente corregge voci base, i KPI calcolati vanno ricostruiti e non tenuti dal vecchio parsing.
 for(const k of ['productionValue','operatingCosts','ebitda','ebit','currentAssets','currentLiabilities','equity']){
  if(edited.has(k))continue;
  if(['calculated','classified_sum','reconstructed'].includes(sources[k]?.method)){delete data[k];delete sources[k];}
 }
 recalcCompositeReview(data,sources,edited);
 calculate(data,sources);
 const parser={...(doc?.parser||{}),version:'33.0',reviewed:true};
 const vals=validations(data,parser);
 const quality=qualityScore(data,sources,vals);
 const manualOrVerified=REVIEW_KEYS.filter(k=>data[k]!=null&&['manual_override','user_confirmed'].includes(sources[k]?.method)).length;
 const found=REVIEW_KEYS.filter(k=>data[k]!=null).length;
 return {...doc,data,sources,validations:vals,quality,recognized:Object.keys(data).filter(k=>data[k]!=null),parser,review:{completedAt:new Date().toISOString(),found,total:REVIEW_KEYS.length,manualOrVerified}};
}

export function analyzeLines(lines,{documentType='auto'}={}){
 const base=lines.filter(x=>x&&String(x.text||'').trim()).map(x=>({...x,page:x.page||1,text:String(x.text).replace(/\s+/g,' ').trim()}));
 const clean=inferSections(base);
 const profile=detectProfile(clean);
 const {data,sources,candidates}=directExtract(clean);
 const shouldUseFourSection=profile.fourSection||clean.filter(r=>r.layout==='dual-half'&&r.section==='income').length>=4;
 const parserInfo=shouldUseFourSection?fourSectionExtract(clean,data,sources):{topLevelIncomeRows:0,recognizedTopLevel:0};
 const balanceInfo=reconstructFourSectionBalance(clean,data,sources);
 const hardBalanceComponents=hardReconstructFourSectionBalance(clean,data,sources);
 profile.fourSection=profile.fourSection||shouldUseFourSection;
 atomicFallback(clean,data,sources);
 if(profile.fourSection||hardBalanceComponents>0)hardReconstructFourSectionBalance(clean,data,sources);
 calculate(data,sources);
 const requested=documentType&&documentType!=='auto'&&documentType!=='Rileva automaticamente'?documentType:null;
 const kind=requested||profile.kind;
 const parser={version:'31.0',kind,fourSection:profile.fourSection,publicBalance:profile.publicBalance,accountRows:profile.accountRows,hints:profile.hints,...parserInfo,...balanceInfo,hardBalanceComponents};
 const vals=validations(data,parser),quality=qualityScore(data,sources,vals);
 return {data,sources,candidates,validations:vals,quality,type:kind,recognized:Object.keys(data).filter(k=>data[k]!=null),parser};
}

export function safeDiv(a,b,mult=100){return a==null||b==null||b===0?null:a/b*mult;}
export function derivedIndicators(doc,previous=null){
 if(!doc)return{};const x=doc.data||{},p=previous?.data||{};const avgEquity=x.equity!=null&&p.equity!=null?(x.equity+p.equity)/2:x.equity;
 const avgAssets=x.totalAssets!=null&&p.totalAssets!=null?(x.totalAssets+p.totalAssets)/2:x.totalAssets;
 const monetaryOperatingCosts=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts'].map(k=>Math.abs(Number(x[k]||0))).reduce((a,b)=>a+b,0);
 const workingCapital=(x.currentAssets!=null&&x.currentLiabilities!=null)?x.currentAssets-x.currentLiabilities:null;
 return {
  revenueGrowth:(x.revenue!=null&&p.revenue)?(x.revenue-p.revenue)/Math.abs(p.revenue)*100:null,
  ebitdaGrowth:(x.ebitda!=null&&p.ebitda)?(x.ebitda-p.ebitda)/Math.abs(p.ebitda)*100:null,
  productionRevenueRatio:safeDiv(x.productionValue,x.revenue),
  ebitdaMargin:safeDiv(x.ebitda,x.revenue),
  ebitMargin:safeDiv(x.ebit,x.revenue),
  netMargin:safeDiv(x.netIncome,x.revenue),
  roe:safeDiv(x.netIncome,avgEquity),
  roa:safeDiv(x.netIncome,avgAssets),
  roi:safeDiv(x.ebit,avgAssets),
  assetTurnover:x.revenue!=null&&avgAssets?x.revenue/avgAssets:null,
  debtEquity:x.debt!=null&&x.equity?x.debt/x.equity:null,
  debtRevenue:x.debt!=null&&x.revenue?safeDiv(x.debt,x.revenue):null,
  debtEbitda:x.debt!=null&&x.ebitda?x.debt/x.ebitda:null,
  debtAssets:safeDiv(x.debt,x.totalAssets),
  currentRatio:x.currentAssets!=null&&x.currentLiabilities?x.currentAssets/x.currentLiabilities:null,
  quickRatio:x.currentAssets!=null&&x.inventory!=null&&x.currentLiabilities?(x.currentAssets-x.inventory)/x.currentLiabilities:null,
  cashRatio:x.cash!=null&&x.currentLiabilities?x.cash/x.currentLiabilities:null,
  workingCapital,
  equityRatio:x.equity!=null&&x.totalAssets?safeDiv(x.equity,x.totalAssets):null,
  cashRevenue:safeDiv(x.cash,x.revenue),
  receivablesRevenue:safeDiv(x.receivables,x.revenue),
  inventoryRevenue:safeDiv(x.inventory,x.revenue),
  personnelInc:safeDiv(x.personnel,x.revenue),
  servicesInc:safeDiv(x.services,x.revenue),
  materialsInc:safeDiv(x.rawMaterials,x.revenue),
  leasesInc:safeDiv(x.leases,x.revenue),
  depreciationInc:safeDiv(x.depreciation,x.revenue),
  otherOperatingInc:safeDiv(x.otherOperatingCosts,x.revenue),
  operatingCostsInc:safeDiv(x.operatingCosts,x.revenue),
  monetaryOperatingCosts:monetaryOperatingCosts||null,
  monetaryCostsInc:monetaryOperatingCosts&&x.revenue?safeDiv(monetaryOperatingCosts,x.revenue):null,
  ebitdaToPersonnel:x.ebitda!=null&&x.personnel?x.ebitda/x.personnel:null,
  interestCoverage:x.ebit!=null&&x.financialResult?x.ebit/Math.abs(x.financialResult):null
 };
}
export function completeness(doc){const keys=['revenue','ebitda','ebit','netIncome','equity','debt','currentAssets','cash','receivables','inventory','personnel','services','rawMaterials','depreciation'];const found=keys.filter(k=>doc?.data?.[k]!=null).length;return {found,total:keys.length,pct:Math.round(found/keys.length*100)};}

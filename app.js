import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {analyzeLines,derivedIndicators,metricNames,safeDiv,completeness,REVIEW_KEYS,applyManualReview} from './finance-engine.js';

const ENGINE_VERSION='40.0';
const SUPABASE_URL='https://cktactfxjmatbkoosjvs.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGFjdGZ4am1hdGJrb29zanZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDk4MDQsImV4cCI6MjEwNjI4NTgwNH0.osb4lKiLMAmPvZ4z-Zu8ry1HZD5Vk5RMBaZV6_I1t6Q';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const STORAGE='nomyra-finance-storage-v34';
const PROFILE_STORAGE='nomyra-finance-profile_storage-v34';
const PRODUCTIVITY_STORAGE='nomyra-finance-productivity_storage-v34';
const USERS_STORAGE='nomyra-finance-users_storage-v34';
const WORKSPACE_STORAGE='nomyra-finance-workspace_storage-v34';
const previousDocs=JSON.parse(localStorage.getItem('nomyra-finance-docs-v14')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v13')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v12')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v11')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v10')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v9')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v8')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v7')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v6')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v5')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v4')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v3')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs-v2')||'null')||JSON.parse(localStorage.getItem('nomyra-finance-docs')||'[]');
function migrateLegacy(docs){return (docs||[]).map(d=>{const version=String(d?.engineVersion||'');const compatible=version===ENGINE_VERSION||version==='12.0'||version==='11.0';if(d?.id?.startsWith('u')&&!compatible){return {...d,data:{},sources:{},validations:[],quality:0,needsReanalysis:true,engineVersion:'legacy'};}return d;});}
function profileKey(company=''){return String(company||'').trim().toLowerCase().replace(/\s+/g,' ');}
function profilesFromDocs(docs=[]){const out={};(docs||[]).forEach(d=>{if(d?.company&&d?.profile&&Object.values(d.profile).some(v=>String(v??'').trim()!=='')){out[profileKey(d.company)]=normalizeProfile?normalizeProfile(d.profile):d.profile;}});return out;}
const storedDocs=JSON.parse(localStorage.getItem(STORAGE)||'null');
const baseDocs=storedDocs||migrateLegacy(previousDocs);
const storedProfiles=JSON.parse(localStorage.getItem(PROFILE_STORAGE)||'null');
const storedProductivity=JSON.parse(localStorage.getItem(PRODUCTIVITY_STORAGE)||'null');
const storedUsers=JSON.parse(localStorage.getItem(USERS_STORAGE)||'null');
const storedWorkspace=JSON.parse(localStorage.getItem(WORKSPACE_STORAGE)||'null');
const defaultUsers=[{id:'u-owner',name:'Andrea / NOMYRA',email:'owner@nomyra.local',company:'NOMYRA',role:'Owner',status:'Demo'}];
const state={docs:baseDocs,selectedCompany:'',selectedPeriod:'',lastComparison:null,profiles:storedProfiles||profilesFromDocs(baseDocs),productivity:storedProductivity||[],users:storedUsers||defaultUsers,workspace:storedWorkspace||{mode:'locked',currentUser:null},demoUnlocked:localStorage.getItem('nomyra-finance-demo-unlocked-v21')==='1',platformAdmin:false,adminCache:{companies:[],plans:[],subscriptions:[],users:[],reports:[]}};
const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const num=n=>n==null||!Number.isFinite(Number(n))?'—':new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n);
const fmt=n=>{if(n==null||!Number.isFinite(Number(n)))return '—';const a=Math.abs(Number(n));const decimals=a>0&&a<100?2:0;return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(n);};
const pct=n=>n==null||!Number.isFinite(Number(n))?'—':`${Number(n).toLocaleString('it-IT',{maximumFractionDigits:1})}%`;
const ratio=n=>n==null||!Number.isFinite(Number(n))?'—':`${Number(n).toLocaleString('it-IT',{maximumFractionDigits:2})}x`;
const variation=(cur,prev)=>cur==null||prev==null||prev===0?null:(cur-prev)/Math.abs(prev)*100;

const onlyAvailableState={value:false};
const kpiFilterState={value:'all'};
function moneyPer100(v){return v==null||!Number.isFinite(Number(v))?'—':`${Number(v).toLocaleString('it-IT',{maximumFractionDigits:1})} € ogni 100 € di ricavi`;}

function parseProfileNumber(v){
 if(v==null||String(v).trim()==='')return null;
 let s=String(v).trim().replace(/\s/g,'').replace(/[^0-9,.-]/g,'');
 const hasComma=s.includes(','), hasDot=s.includes('.');
 if(hasComma&&hasDot){
  // Italian format: 1.500,50 -> 1500.50
  s=s.replace(/\./g,'').replace(',','.');
 }else if(hasComma){
  // Decimal comma: 1,5 -> 1.5
  s=s.replace(',','.');
 }else if(hasDot){
  const parts=s.split('.');
  const last=parts[parts.length-1]||'';
  // 1.500 is usually thousands, 1.5 is decimal.
  if(parts.length>1 && last.length===3 && parts.slice(0,-1).every(p=>p.length<=3)) s=parts.join('');
 }
 const n=Number(s);return Number.isFinite(n)?n:null;
}
function normalizeProfile(p={}){
 return {
  sector:p.sector||'',businessModel:p.businessModel||'',customerType:p.customerType||'',avgProductPrice:parseProfileNumber(p.avgProductPrice),avgOrderValue:parseProfileNumber(p.avgOrderValue),annualUnits:parseProfileNumber(p.annualUnits),employees:parseProfileNumber(p.employees),plants:p.plants||'',exportShare:parseProfileNumber(p.exportShare),seasonality:p.seasonality||'',notes:p.notes||''
 };
}
function profileCompleteness(profile={}){const keys=['sector','businessModel','customerType','avgProductPrice','employees','seasonality'];const filled=keys.filter(k=>profile?.[k]!=null&&String(profile[k]).trim()!=='').length;return {filled,total:keys.length,label:filled===0?'Non compilato':filled===keys.length?'Completo':`${filled}/${keys.length} campi`};}
function getCompanyProfile(company){return normalizeProfile((state.profiles||{})[profileKey(company)]||{});}
function setCompanyProfile(company,profile){if(!company)return;state.profiles={...(state.profiles||{}),[profileKey(company)]:normalizeProfile(profile)};state.docs=state.docs.map(d=>profileKey(d.company)===profileKey(company)?{...d,profile:getCompanyProfile(company)}:d);}
function profileContext(doc){return normalizeProfile((state.profiles||{})[profileKey(doc?.company)]||doc?.profile||{});}
function profileContextText(doc){
 const p=profileContext(doc),parts=[];
 if(p.sector)parts.push(`settore ${p.sector}`);if(p.businessModel)parts.push(`modello ${p.businessModel}`);if(p.customerType)parts.push(`clientela ${p.customerType}`);if(p.avgProductPrice!=null)parts.push(`prezzo medio prodotto ${fmt(p.avgProductPrice)}`);if(p.avgOrderValue!=null)parts.push(`ordine medio ${fmt(p.avgOrderValue)}`);if(p.annualUnits!=null)parts.push(`${num(p.annualUnits)} unità/anno`);if(p.employees!=null)parts.push(`${num(p.employees)} addetti`);if(p.exportShare!=null)parts.push(`export ${pct(p.exportShare)}`);if(p.seasonality)parts.push(`stagionalità ${p.seasonality}`);
 return parts.length?parts.join(' · '):'Profilo aziendale non compilato';
}
function profileInsightForKpi(label,value,doc){
 const p=profileContext(doc); if(!p.sector&&!p.businessModel&&!p.avgProductPrice&&!p.employees&&!p.annualUnits)return '';
 const sector=(p.sector||'').toLowerCase(),model=(p.businessModel||'').toLowerCase();
 const notes=[];
 if(label==='Materie / Ricavi'&&(sector.includes('manifatt')||sector.includes('produz')||model.includes('produz')))notes.push('Essendo una realtà produttiva, questa incidenza va letta insieme a mix prodotti, scarti, rimanenze e prezzo medio.');
 if(label==='Personale / Ricavi'&&p.employees!=null&&doc?.data?.revenue!=null){notes.push(`Con ${num(p.employees)} addetti, i ricavi per addetto sono circa ${fmt(doc.data.revenue/p.employees)}.`)}
 if(label==='Ricavi'&&p.avgProductPrice!=null&&doc?.data?.revenue!=null){notes.push(`Con prezzo medio prodotto di ${fmt(p.avgProductPrice)}, il fatturato corrisponde indicativamente a ${num(doc.data.revenue/p.avgProductPrice)} unità teoriche vendute.`)}
 if(label==='Rimanenze / Ricavi'&&(sector.includes('manifatt')||sector.includes('distrib')||model.includes('magazz')))notes.push('Per aziende con magazzino, questo KPI va letto con rotazione stock, tempi di approvvigionamento e obsolescenza.');
 if(label==='Servizi / Ricavi'&&model.includes('conto terzi'))notes.push('Nel conto terzi i servizi esterni possono pesare di più: va distinto ciò che è produttivo da ciò che è struttura.');
 if(label==='EBITDA margin'&&p.avgProductPrice!=null)notes.push('Conoscere il prezzo medio aiuta a capire se il margine deriva da volume, mix prodotti o aumento dei costi unitari.');
 return notes.length?' '+notes.join(' '):'';
}
function getUploadProfile(){return normalizeProfile({sector:document.querySelector('#uploadSector')?.value,businessModel:document.querySelector('#uploadBusinessModel')?.value,customerType:document.querySelector('#uploadCustomerType')?.value,avgProductPrice:document.querySelector('#uploadAvgProductPrice')?.value,avgOrderValue:document.querySelector('#uploadAvgOrderValue')?.value,annualUnits:document.querySelector('#uploadAnnualUnits')?.value,employees:document.querySelector('#uploadEmployees')?.value,plants:document.querySelector('#uploadPlants')?.value,exportShare:document.querySelector('#uploadExportShare')?.value,seasonality:document.querySelector('#uploadSeasonality')?.value,notes:document.querySelector('#uploadProfileNotes')?.value});}
function profileHasData(p={}){return Object.values(normalizeProfile(p)).some(v=>v!=null&&String(v).trim()!=='');}
function setUploadProfileFields(profile={}){const p=normalizeProfile(profile); const set=(sel,val)=>{const el=document.querySelector(sel); if(el)el.value=val??'';};set('#uploadSector',p.sector);set('#uploadBusinessModel',p.businessModel);set('#uploadCustomerType',p.customerType);set('#uploadAvgProductPrice',p.avgProductPrice??'');set('#uploadAvgOrderValue',p.avgOrderValue??'');set('#uploadAnnualUnits',p.annualUnits??'');set('#uploadEmployees',p.employees??'');set('#uploadPlants',p.plants);set('#uploadExportShare',p.exportShare??'');set('#uploadSeasonality',p.seasonality);set('#uploadProfileNotes',p.notes);}
function refreshUploadCompanyProfile(){const company=document.querySelector('#uploadCompany')?.value.trim();const notice=document.querySelector('#uploadProfileNotice');if(!company){if(notice)notice.textContent='Il profilo aziendale viene salvato una sola volta per azienda e riutilizzato per tutti i bilanci successivi.';return;}const p=getCompanyProfile(company);if(profileHasData(p)){setUploadProfileFields(p);if(notice)notice.innerHTML=`Profilo già salvato per <strong>${esc(company)}</strong>. Puoi modificarlo qui solo se vuoi aggiornare tutti i bilanci di questa azienda.`;}else if(notice){notice.innerHTML=`Nessun profilo salvato per <strong>${esc(company)}</strong>. Compilalo una sola volta: verrà riutilizzato nei prossimi bilanci.`;}}
function reviewStatus(doc){
 const found=REVIEW_KEYS.filter(k=>doc?.data?.[k]!=null).length;
 const verified=REVIEW_KEYS.filter(k=>doc?.data?.[k]!=null&&['manual_override','user_confirmed'].includes(doc?.sources?.[k]?.method)).length;
 const missing=REVIEW_KEYS.filter(k=>doc?.data?.[k]==null);
 const automatic=found-verified;
 const complete=missing.length===0;
 const label=complete?'Dati completi':`${found}/${REVIEW_KEYS.length} voci chiave`;
 const state=complete?'Pronto per report':'Da completare';
 return {found,total:REVIEW_KEYS.length,verified,automatic,missing,complete,label,state};
}
function dataCoverage(doc){const rs=reviewStatus(doc);const cp=completeness(doc);return {found:rs.found,total:rs.total,pct:Math.round(rs.found/rs.total*100),tech:doc?.quality??cp.pct,label:rs.label,state:rs.state,missing:rs.missing,verified:rs.verified,automatic:rs.automatic,explain:`${rs.found}/${rs.total} voci chiave disponibili. ${rs.verified} confermate/inserite manualmente, ${rs.automatic} solo automatiche. Le voci mancanti possono essere completate nella Revisione guidata.`};}
function kpiSeverity(row){
 if(!row.available)return 'missing'; const v=Number(row.value),l=row.label;
 if(['EBITDA / MOL','EBIT','Utile netto'].includes(l)&&v<0)return 'critical';
 if(['EBITDA margin','ROS / EBIT margin','Net margin','ROE','ROA','ROI operativo'].includes(l)&&v<0)return 'critical';
 if(l==='Current ratio'&&v<1)return 'critical'; if(l==='Quick ratio'&&v<0.8)return 'warning'; if(l==='Cash ratio'&&v<0.2)return 'warning';
 if(l==='Debiti / Equity'&&v>2)return 'critical'; if(l==='Debiti / EBITDA'&&v>4)return 'warning'; if(l==='Debiti / Ricavi'&&v>100)return 'warning';
 if(l==='Costi operativi monetari / Ricavi'&&v>100)return 'critical'; if(['Personale / Ricavi','Servizi / Ricavi'].includes(l)&&v>35)return 'warning'; if(l==='Materie / Ricavi'&&v>60)return 'warning'; if(l==='Oneri diversi / Ricavi'&&v>5)return 'warning';
 if(['EBITDA margin','ROS / EBIT margin','Net margin'].includes(l)&&v>=15)return 'good'; if(l==='Current ratio'&&v>=1.5)return 'good'; if(l==='Equity / Attivo'&&v>=30)return 'good';
 return 'neutral';
}
function kpiReading(row,doc,previous){
 const v=row.value,l=row.label,x=doc?.data||{},z=derivedIndicators(doc,previous),p=previous?.data||{};
 if(v==null||!Number.isFinite(Number(v)))return `NOMYRA non calcola questo KPI perché mancano nel PDF: ${(row.needs||[]).join(', ')}. Il dato resta non disponibile invece di essere stimato.`;
 if(l==='Ricavi'){const g=previous?variation(x.revenue,p.revenue):null;return `Il bilancio mostra ${fmt(v)} di ricavi. ${g==null?'È la base per leggere costi, margini e peso dei debiti.':`Rispetto al ${previous.period} i ricavi ${g>=0?'crescono':'si riducono'} del ${Math.abs(g).toLocaleString('it-IT',{maximumFractionDigits:1})}%.`}${profileInsightForKpi(l,v,doc)}`;}
 if(l==='Valore della produzione')return `Il valore ottenuto è ${fmt(v)}: include ricavi, variazioni di rimanenze e altri ricavi. Se è molto diverso dai ricavi, significa che rimanenze o altri proventi pesano nella performance del periodo.`;
 if(l==='EBITDA / MOL')return v>=0?`Il MOL è positivo (${fmt(v)}): l’attività operativa genera margine prima di ammortamenti, finanza e imposte.`:`Alert: il MOL è negativo (${fmt(v)}). I costi operativi monetari riconosciuti superano il valore prodotto; serve verificare costi, rimanenze e corretta classificazione.`;
 if(l==='EBITDA margin')return (v>=0?`Ogni 100 € di ricavi restano circa ${v.toLocaleString('it-IT',{maximumFractionDigits:1})} € di MOL. ${v<5?'Margine debole: da leggere con struttura costi e settore.':v<15?'Margine presente ma da confrontare con storico e competitor.':'Marginalità operativa solida rispetto ai ricavi.'}`:`Alert: per ogni 100 € di ricavi l’azienda perde circa ${Math.abs(v).toLocaleString('it-IT',{maximumFractionDigits:1})} € a livello MOL.`)+profileInsightForKpi(l,v,doc);
 if(l==='EBIT')return v>=0?`Il risultato operativo è positivo (${fmt(v)}), quindi dopo gli ammortamenti resta margine industriale.`:`Alert: EBIT negativo (${fmt(v)}). Dopo ammortamenti e costi operativi il risultato industriale non copre la struttura.`;
 if(l==='ROS / EBIT margin')return v>=0?`Ogni 100 € di ricavi generano circa ${v.toLocaleString('it-IT',{maximumFractionDigits:1})} € di risultato operativo.`:`Alert: ROS negativo: l’attività operativa assorbe ${Math.abs(v).toLocaleString('it-IT',{maximumFractionDigits:1})} € ogni 100 € di ricavi.`;
 if(l==='Utile netto')return v>=0?`Il risultato finale è positivo (${fmt(v)}), dopo gestione finanziaria e imposte.`:`Alert: perdita netta di ${fmt(Math.abs(v))}. Va distinta la causa: operativa, finanziaria, fiscale o straordinaria.`;
 if(l==='Net margin')return v>=0?`Rimane come utile finale circa ${v.toLocaleString('it-IT',{maximumFractionDigits:1})} € ogni 100 € di ricavi.`:`La gestione complessiva chiude in perdita: ${Math.abs(v).toLocaleString('it-IT',{maximumFractionDigits:1})} € persi ogni 100 € di ricavi.`;
 if(l==='ROE')return `Il capitale proprio genera un rendimento del ${pct(v)}. ${v<0?'Alert: rendimento negativo per effetto della perdita.':v<5?'Rendimento contenuto: da confrontare con rischio e settore.':'Rendimento positivo del capitale proprio.'}`;
 if(l==='ROA'||l==='ROI operativo')return `Il rendimento sugli asset è ${pct(v)}. ${v<0?'Gli asset non stanno generando risultato positivo nel periodo.':'Indica quanto risultato viene prodotto dalla struttura patrimoniale.'}`;
 if(l==='Asset turnover')return `Ogni euro di attivo genera ${ratio(v)} di ricavi nel periodo. Più è basso, più capitale è immobilizzato rispetto al fatturato.`;
 if(l==='Equity / Attivo')return `Il ${pct(v)} dell’attivo è finanziato da patrimonio netto. ${v<15?'Solidità patrimoniale debole: forte dipendenza da capitale di terzi.':v<30?'Struttura patrimoniale da monitorare.':'Base patrimoniale relativamente solida.'}`;
 if(l==='Debiti')return `I debiti rilevati sono ${fmt(v)}. Il dato va letto con patrimonio netto, ricavi, liquidità e scadenze.`;
 if(l==='Debiti / Equity')return `I debiti sono pari a ${ratio(v)} il patrimonio netto. ${v>2?'Alert: leva elevata, da leggere con banche, scadenze e cassa.':v>1?'Leva da monitorare.':'Leva contenuta rispetto al patrimonio netto.'}`;
 if(l==='Debiti / Ricavi')return `I debiti pesano ${moneyPer100(v)}. ${v>100?'Alert: debiti superiori al fatturato annuo.':v>60?'Peso del debito significativo.':'Peso del debito più contenuto rispetto ai ricavi.'}`;
 if(l==='Debiti / EBITDA')return v>0?`Servirebbero teoricamente ${ratio(v)} anni di EBITDA per coprire i debiti. ${v>4?'Alert: multiplo alto.':v>2?'Da monitorare.':'Copertura teorica più confortevole.'}`:`Il rapporto non è leggibile perché EBITDA nullo/negativo rende la copertura del debito critica o non significativa.`;
 if(l==='Current ratio')return `Per ogni 1 € di passivo circolante risultano ${ratio(v)} di attività correnti. ${v<1?'Alert: possibile tensione di breve periodo.':v<1.5?'Copertura positiva ma da monitorare.':'Copertura corrente buona.'}`;
 if(l==='Quick ratio')return `Senza considerare le rimanenze, la copertura corrente è ${ratio(v)}. ${v<1?'La liquidità allargata può essere insufficiente se il magazzino non è rapidamente monetizzabile.':'Copertura di breve più solida anche senza magazzino.'}`;
 if(l==='Cash ratio')return `La sola liquidità copre ${ratio(v)} delle passivo circolante. È un indicatore prudenziale della cassa immediata.`;
 if(l==='Capitale circolante netto')return v>=0?`Il capitale circolante netto è positivo (${fmt(v)}): attività correnti superiori alle passivo circolante.`:`Alert: capitale circolante netto negativo (${fmt(v)}), possibile squilibrio finanziario di breve.`;
 if(l.includes('/ Ricavi'))return `Questo costo/voce assorbe ${moneyPer100(v)}. ${v>100?'Alert: supera il fatturato, verificare classificazione e struttura costi.':v>50?'Incidenza molto rilevante sul fatturato.':v>25?'Incidenza importante da confrontare con settore e storico.':'Incidenza contenuta o fisiologica, da confermare col settore.'}${profileInsightForKpi(l,v,doc)}`;
 if(l==='EBITDA / Personale')return `Per ogni euro di costo del personale vengono generati ${ratio(v)} di MOL. ${v<1?'Alert: il margine operativo non copre il costo del personale.':'Il personale genera margine operativo positivo secondo i dati riconosciuti.'}`;
 if(l==='Crescita ricavi'||l==='Crescita EBITDA')return `${l}: ${pct(v)} rispetto al periodo precedente. ${v<0?'Trend negativo da approfondire.':'Trend positivo da leggere insieme alla marginalità.'}`;
 return `Valore ottenuto: ${row.type==='money'?fmt(v):row.type==='pct'?pct(v):row.type==='ratio'?ratio(v):num(v)}. ${row.why}`;
}
function kpiRowsForDoc(d,p=null){
 const x=d?.data||{},z=derivedIndicators(d,p);
 const defs=[
  {area:'Dimensione',label:'Ricavi',value:x.revenue,type:'money',formula:'Voce ricavi vendite/prestazioni letta dal bilancio',why:'Misura la dimensione commerciale e la base su cui leggere costi e margini.',needs:['Ricavi']},
  {area:'Dimensione',label:'Valore della produzione',value:x.productionValue,type:'money',formula:'Ricavi + variazioni rimanenze finali + altri ricavi',why:'Indica il valore economico complessivo prodotto nel periodo.',needs:['Ricavi','Rimanenze finali','Altri ricavi']},
  {area:'Crescita',label:'Crescita ricavi',value:z.revenueGrowth,type:'pct',kind:'growth',formula:'(Ricavi periodo − Ricavi precedente) / Ricavi precedente',why:'Fa capire se l’azienda sta aumentando o riducendo il volume d’affari.',needs:['Ricavi periodo','Ricavi periodo precedente']},
  {area:'Crescita',label:'Crescita EBITDA',value:z.ebitdaGrowth,type:'pct',kind:'growth',formula:'(EBITDA periodo − EBITDA precedente) / EBITDA precedente',why:'Indica se la redditività operativa cresce più o meno dei ricavi.',needs:['EBITDA periodo','EBITDA precedente']},
  {area:'Marginalità',label:'EBITDA / MOL',value:x.ebitda,type:'money',formula:'EBIT + ammortamenti oppure Valore produzione − costi operativi monetari',why:'Mostra il margine operativo prima di ammortamenti, interessi e imposte.',needs:['EBIT','Ammortamenti oppure costi operativi']},
  {area:'Marginalità',label:'EBITDA margin',value:z.ebitdaMargin,type:'pct',kind:'margin',formula:'EBITDA / Ricavi',why:'Per ogni 100 € di ricavi mostra quanti € restano prima di ammortamenti, finanza e imposte.',needs:['EBITDA','Ricavi']},
  {area:'Marginalità',label:'EBIT',value:x.ebit,type:'money',formula:'Risultato operativo ufficiale oppure EBITDA − ammortamenti',why:'Rappresenta il risultato operativo dopo gli ammortamenti. Se mancano gli ammortamenti, il dato deve essere completato o verificato prima di usarlo.',needs:['Valore produzione','Costi produzione']},
  {area:'Marginalità',label:'ROS / EBIT margin',value:z.ebitMargin,type:'pct',kind:'margin',formula:'EBIT / Ricavi',why:'Misura la redditività operativa netta dei costi industriali e ammortamenti.',needs:['EBIT','Ricavi']},
  {area:'Marginalità',label:'Utile netto',value:x.netIncome,type:'money',formula:'Risultato d’esercizio letto dal bilancio',why:'È il risultato finale dopo gestione finanziaria, straordinaria e imposte.',needs:['Utile/perdita esercizio']},
  {area:'Marginalità',label:'Net margin',value:z.netMargin,type:'pct',kind:'margin',formula:'Utile netto / Ricavi',why:'Mostra quanta parte dei ricavi rimane come utile finale.',needs:['Utile netto','Ricavi']},
  {area:'Redditività capitale',label:'ROE',value:z.roe,type:'pct',formula:'Utile netto / Patrimonio netto medio',why:'Misura il rendimento del capitale proprio investito nell’azienda.',needs:['Utile netto','Patrimonio netto']},
  {area:'Redditività capitale',label:'ROA',value:z.roa,type:'pct',formula:'Utile netto / Totale attivo medio',why:'Indica quanto rendimento genera l’intero attivo aziendale.',needs:['Utile netto','Totale attivo']},
  {area:'Redditività capitale',label:'ROI operativo',value:z.roi,type:'pct',formula:'EBIT / Totale attivo medio',why:'Misura il rendimento operativo degli asset impiegati.',needs:['EBIT','Totale attivo']},
  {area:'Efficienza',label:'Asset turnover',value:z.assetTurnover,type:'ratio',formula:'Ricavi / Totale attivo medio',why:'Indica quante volte gli asset generano ricavi nel periodo.',needs:['Ricavi','Totale attivo']},
  {area:'Struttura',label:'Totale attivo',value:x.totalAssets,type:'money',formula:'Totale attività letto dal bilancio',why:'Dimensione patrimoniale complessiva dell’azienda.',needs:['Totale attivo']},
  {area:'Struttura',label:'Patrimonio netto',value:x.equity,type:'money',formula:'Patrimonio netto letto dal bilancio',why:'Base di capitale proprio che sostiene l’impresa.',needs:['Patrimonio netto']},
  {area:'Struttura',label:'Equity / Attivo',value:z.equityRatio,type:'pct',formula:'Patrimonio netto / Totale attivo',why:'Mostra quanta parte dell’attivo è finanziata con capitale proprio.',needs:['Patrimonio netto','Totale attivo']},
  {area:'Indebitamento',label:'Debiti',value:x.debt,type:'money',formula:'Totale debiti letto dal bilancio',why:'Misura l’esposizione complessiva verso terzi.',needs:['Debiti']},
  {area:'Indebitamento',label:'Debiti / Equity',value:z.debtEquity,type:'ratio',kind:'leverage',formula:'Debiti / Patrimonio netto',why:'Confronta capitale di terzi e capitale proprio.',needs:['Debiti','Patrimonio netto']},
  {area:'Indebitamento',label:'Debiti / Ricavi',value:z.debtRevenue,type:'pct',kind:'leverage',formula:'Debiti / Ricavi',why:'Mostra il peso dei debiti rispetto al volume d’affari.',needs:['Debiti','Ricavi']},
  {area:'Indebitamento',label:'Debiti / EBITDA',value:z.debtEbitda,type:'ratio',kind:'leverage',formula:'Debiti / EBITDA',why:'Stima quanti anni di EBITDA servirebbero teoricamente per coprire i debiti.',needs:['Debiti','EBITDA']},
  {area:'Indebitamento',label:'Debiti / Attivo',value:z.debtAssets,type:'pct',kind:'leverage',formula:'Debiti / Totale attivo',why:'Misura il peso del debito nella struttura patrimoniale.',needs:['Debiti','Totale attivo']},
  {area:'Liquidità',label:'Disponibilità liquide',value:x.cash,type:'money',formula:'Cassa + banche + disponibilità liquide',why:'Risorse liquide immediatamente disponibili.',needs:['Disponibilità liquide']},
  {area:'Liquidità',label:'Attivo circolante',value:x.currentAssets,type:'money',formula:'Rimanenze + crediti + disponibilità liquide + crediti/conti erariali attivi + ratei/risconti attivi',why:'Mostra le attività che dovrebbero trasformarsi in liquidità nel breve periodo o sostenere il ciclo operativo.',needs:['Rimanenze','Crediti','Disponibilità liquide']},
  {area:'Liquidità',label:'Passivo circolante',value:x.currentLiabilities,type:'money',formula:'Debiti commerciali + debiti tributari/previdenziali + altri debiti + ratei/risconti passivi',why:'Mostra gli impegni di breve periodo stimati dal bilancio gestionale. I finanziamenti sono esclusi se il PDF non separa la quota entro 12 mesi.',needs:['Debiti commerciali','Debiti tributari','Altri debiti']},
  {area:'Liquidità',label:'Current ratio',value:z.currentRatio,type:'ratio',kind:'liquidity',formula:'Attivo circolante / Passivo circolante',why:'Misura la capacità teorica di coprire il passivo circolante con attività correnti.',needs:['Attivo circolante','Passivo circolante']},
  {area:'Liquidità',label:'Quick ratio',value:z.quickRatio,type:'ratio',kind:'liquidity',formula:'(Attivo circolante − Rimanenze) / Passivo circolante',why:'Misura la copertura di breve senza considerare il magazzino.',needs:['Attivo circolante','Rimanenze','Passivo circolante']},
  {area:'Liquidità',label:'Cash ratio',value:z.cashRatio,type:'ratio',kind:'liquidity',formula:'Disponibilità liquide / Passivo circolante',why:'Misura la copertura dei passivo circolante con sola liquidità.',needs:['Disponibilità liquide','Passivo circolante']},
  {area:'Liquidità',label:'Capitale circolante netto',value:z.workingCapital,type:'money',formula:'Attivo circolante − Passivo circolante',why:'Mostra l’equilibrio finanziario di breve periodo.',needs:['Attivo circolante','Passivo circolante']},
  {area:'Attivo corrente',label:'Crediti / Ricavi',value:z.receivablesRevenue,type:'pct',formula:'Crediti / Ricavi',why:'Aiuta a leggere il peso dei crediti verso clienti sul fatturato.',needs:['Crediti','Ricavi']},
  {area:'Attivo corrente',label:'Rimanenze / Ricavi',value:z.inventoryRevenue,type:'pct',formula:'Rimanenze / Ricavi',why:'Mostra quanto magazzino è immobilizzato rispetto ai ricavi.',needs:['Rimanenze','Ricavi']},
  {area:'Attivo corrente',label:'Liquidità / Ricavi',value:z.cashRevenue,type:'pct',formula:'Disponibilità liquide / Ricavi',why:'Indica la liquidità disponibile rispetto al volume d’affari.',needs:['Disponibilità liquide','Ricavi']},
  {area:'Costi',label:'Personale',value:x.personnel,type:'money',formula:'Costo del personale letto o aggregato',why:'Uno dei principali driver di costo e produttività.',needs:['Costo del personale']},
  {area:'Costi',label:'Personale / Ricavi',value:z.personnelInc,type:'pct',formula:'Costo personale / Ricavi',why:'Misura l’incidenza del personale sul fatturato.',needs:['Costo personale','Ricavi']},
  {area:'Costi',label:'Servizi / Ricavi',value:z.servicesInc,type:'pct',formula:'Costi per servizi / Ricavi',why:'Evidenzia il peso dei servizi esterni sul fatturato.',needs:['Servizi','Ricavi']},
  {area:'Costi',label:'Materie / Ricavi',value:z.materialsInc,type:'pct',formula:'Materie prime e merci / Ricavi',why:'Mostra il peso degli acquisti produttivi rispetto alle vendite.',needs:['Materie prime/merci','Ricavi']},
  {area:'Costi',label:'Godimento beni terzi / Ricavi',value:z.leasesInc,type:'pct',formula:'Godimento beni di terzi / Ricavi',why:'Evidenzia il peso di affitti, leasing e noleggi.',needs:['Godimento beni terzi','Ricavi']},
  {area:'Costi',label:'Ammortamenti / Ricavi',value:z.depreciationInc,type:'pct',formula:'Ammortamenti / Ricavi',why:'Misura il peso degli investimenti ammortizzati sul fatturato.',needs:['Ammortamenti','Ricavi']},
  {area:'Costi',label:'Oneri diversi / Ricavi',value:z.otherOperatingInc,type:'pct',formula:'Oneri diversi gestione / Ricavi',why:'Aiuta a individuare costi non produttivi o ricorrenti da monitorare.',needs:['Oneri diversi','Ricavi']},
  {area:'Costi',label:'Costi operativi monetari / Ricavi',value:z.monetaryCostsInc,type:'pct',formula:'Costi monetari operativi / Ricavi',why:'Sintetizza il peso dei costi correnti prima degli ammortamenti.',needs:['Costi operativi monetari','Ricavi']},
  {area:'Produttività',label:'EBITDA / Personale',value:z.ebitdaToPersonnel,type:'ratio',formula:'EBITDA / Costo del personale',why:'Indica quanta marginalità operativa viene generata per ogni euro di personale.',needs:['EBITDA','Costo personale']},
  {area:'Copertura',label:'Copertura oneri finanziari',value:z.interestCoverage,type:'ratio',formula:'EBIT / |Saldo gestione finanziaria|',why:'Stima la capacità operativa di coprire il peso finanziario.',needs:['EBIT','Gestione finanziaria']}
 ];
 return defs.map(r=>{const row={...r,available:r.value!=null&&Number.isFinite(Number(r.value))};row.reading=kpiReading(row,d,p);row.severity=kpiSeverity(row);return row;});
}
function kpiFormat(row){return row.type==='money'?fmt(row.value):row.type==='pct'?pct(row.value):row.type==='ratio'?ratio(row.value):num(row.value);}

const KPI_DEPENDENCIES={
 'Ricavi':['revenue'],'Valore della produzione':['productionValue'],'Crescita ricavi':['revenue'],'Crescita EBITDA':['ebitda'],
 'EBITDA / MOL':['ebitda'],'EBITDA margin':['ebitda','revenue'],'EBIT':['ebit'],'ROS / EBIT margin':['ebit','revenue'],'Utile netto':['netIncome'],'Net margin':['netIncome','revenue'],
 'ROE':['netIncome','equity'],'ROA':['netIncome','totalAssets'],'ROI operativo':['ebit','totalAssets'],'Asset turnover':['revenue','totalAssets'],
 'Totale attivo':['totalAssets'],'Patrimonio netto':['equity'],'Equity / Attivo':['equity','totalAssets'],
 'Debiti':['debt'],'Debiti / Equity':['debt','equity'],'Debiti / Ricavi':['debt','revenue'],'Debiti / EBITDA':['debt','ebitda'],'Debiti / Attivo':['debt','totalAssets'],
 'Disponibilità liquide':['cash'],'Attivo circolante':['currentAssets'],'Passivo circolante':['currentLiabilities'],'Current ratio':['currentAssets','currentLiabilities'],'Quick ratio':['currentAssets','inventory','currentLiabilities'],'Cash ratio':['cash','currentLiabilities'],'Capitale circolante netto':['currentAssets','currentLiabilities'],
 'Crediti / Ricavi':['receivables','revenue'],'Rimanenze / Ricavi':['inventory','revenue'],'Liquidità / Ricavi':['cash','revenue'],
 'Personale':['personnel'],'Personale / Ricavi':['personnel','revenue'],'Servizi / Ricavi':['services','revenue'],'Materie / Ricavi':['rawMaterials','revenue'],'Godimento beni terzi / Ricavi':['leases','revenue'],'Ammortamenti / Ricavi':['depreciation','revenue'],'Oneri diversi / Ricavi':['otherOperatingCosts','revenue'],
 'Costi operativi monetari / Ricavi':['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts','revenue'],
 'EBITDA / Personale':['ebitda','personnel'],'Copertura oneri finanziari':['ebit','financialResult']
};
function unique(arr){return [...new Set((arr||[]).filter(Boolean))];}
function formatMetricValue(key,value){
 if(value==null||!Number.isFinite(Number(value)))return '—';
 const pctKeys=['productionRevenueRatio','ebitdaMargin','ebitMargin','netMargin','roe','roa','roi','equityRatio','debtRevenue','debtAssets','cashRevenue','receivablesRevenue','inventoryRevenue','personnelInc','servicesInc','materialsInc','leasesInc','depreciationInc','otherOperatingInc','operatingCostsInc','monetaryCostsInc'];
 const ratioKeys=['assetTurnover','debtEquity','debtEbitda','currentRatio','quickRatio','cashRatio','ebitdaToPersonnel','interestCoverage'];
 if(pctKeys.includes(key))return pct(value);
 if(ratioKeys.includes(key))return ratio(value);
 if(key==='revenueGrowth'||key==='ebitdaGrowth')return pct(value);
 return fmt(value);
}
function sourceMethodLabel(s){
 if(!s)return 'Dato non trovato';
 const map={direct:'Letto dal PDF',classified_sum:'Somma conti classificati',calculated:'Calcolato dal motore',manual_override:'Corretto manualmente',user_confirmed:'Confermato dall’utente'};
 return map[s.method]||s.method||'Fonte registrata';
}
function sourceLines(s){
 const items=s?.items||[];
 if(!items.length&&s?.formula)return [s.formula];
 return items.slice(0,3).map(i=>`${i.page&&i.page!=='—'?`p.${i.page} · `:''}${i.line||metricNames[i.k]||'Fonte registrata'}`);
}
function dependencyRowsForKpi(row,doc,previous){
 const data=doc?.data||{},sources=doc?.sources||{};
 let deps=KPI_DEPENDENCIES[row.label]||[];
 // Se il KPI è una voce calcolata aggregata, mostra i componenti reali usati dal motore invece del solo risultato finale.
 const resultKey=deps.length===1?deps[0]:null;
 if(resultKey&&sources[resultKey]?.deps?.length)deps=sources[resultKey].deps;
 if(row.label==='Costi operativi monetari / Ricavi')deps=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts','revenue'];
 if(row.label==='Crescita ricavi'&&previous)return [{key:'revenue_prev',name:`Ricavi ${previous.period}`,value:previous.data?.revenue,source:previous.sources?.revenue,doc:previous},{key:'revenue',name:`Ricavi ${doc.period}`,value:data.revenue,source:sources.revenue,doc}];
 if(row.label==='Crescita EBITDA'&&previous)return [{key:'ebitda_prev',name:`EBITDA ${previous.period}`,value:previous.data?.ebitda,source:previous.sources?.ebitda,doc:previous},{key:'ebitda',name:`EBITDA ${doc.period}`,value:data.ebitda,source:sources.ebitda,doc}];
 return unique(deps).map(k=>({key:k,name:metricNames[k]||k,value:data[k],source:sources[k],doc}));
}
function calculationExpression(row,doc,previous){
 const d=doc?.data||{},p=previous?.data||{};
 const f=(k)=>fmt(d[k]); const n=(k)=>Number(d[k]);
 const pctExpr=(a,b)=>d[a]!=null&&d[b]!=null?`${fmt(d[a])} / ${fmt(d[b])} × 100 = ${pct(safeDiv(d[a],d[b]))}`:null;
 const ratioExpr=(a,b)=>d[a]!=null&&d[b]!=null?`${fmt(d[a])} / ${fmt(d[b])} = ${ratio(d[a]/d[b])}`:null;
 const map={
  'EBITDA margin':()=>pctExpr('ebitda','revenue'),'ROS / EBIT margin':()=>pctExpr('ebit','revenue'),'Net margin':()=>pctExpr('netIncome','revenue'),
  'ROE':()=>pctExpr('netIncome','equity'),'ROA':()=>pctExpr('netIncome','totalAssets'),'ROI operativo':()=>pctExpr('ebit','totalAssets'),
  'Equity / Attivo':()=>pctExpr('equity','totalAssets'),'Debiti / Ricavi':()=>pctExpr('debt','revenue'),'Debiti / Attivo':()=>pctExpr('debt','totalAssets'),
  'Crediti / Ricavi':()=>pctExpr('receivables','revenue'),'Rimanenze / Ricavi':()=>pctExpr('inventory','revenue'),'Liquidità / Ricavi':()=>pctExpr('cash','revenue'),
  'Personale / Ricavi':()=>pctExpr('personnel','revenue'),'Servizi / Ricavi':()=>pctExpr('services','revenue'),'Materie / Ricavi':()=>pctExpr('rawMaterials','revenue'),'Godimento beni terzi / Ricavi':()=>pctExpr('leases','revenue'),'Ammortamenti / Ricavi':()=>pctExpr('depreciation','revenue'),'Oneri diversi / Ricavi':()=>pctExpr('otherOperatingCosts','revenue'),
  'Asset turnover':()=>ratioExpr('revenue','totalAssets'),'Debiti / Equity':()=>ratioExpr('debt','equity'),'Debiti / EBITDA':()=>ratioExpr('debt','ebitda'),'Current ratio':()=>ratioExpr('currentAssets','currentLiabilities'),'Cash ratio':()=>ratioExpr('cash','currentLiabilities'),'EBITDA / Personale':()=>ratioExpr('ebitda','personnel'),
  'Quick ratio':()=>d.currentAssets!=null&&d.inventory!=null&&d.currentLiabilities?`(${fmt(d.currentAssets)} − ${fmt(d.inventory)}) / ${fmt(d.currentLiabilities)} = ${ratio((d.currentAssets-d.inventory)/d.currentLiabilities)}`:null,
  'Capitale circolante netto':()=>d.currentAssets!=null&&d.currentLiabilities?`${fmt(d.currentAssets)} − ${fmt(d.currentLiabilities)} = ${fmt(d.currentAssets-d.currentLiabilities)}`:null,
  'Costi operativi monetari / Ricavi':()=>{const keys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts'];const used=keys.filter(k=>d[k]!=null).map(k=>({k,v:Math.abs(Number(d[k]))}));const total=used.reduce((a,x)=>a+x.v,0);return used.length&&d.revenue!=null?`(${used.map(x=>fmt(x.v)).join(' + ')}) / ${fmt(d.revenue)} × 100 = ${pct(total/d.revenue*100)}`:null;},
  'Valore della produzione':()=>doc.sources?.productionValue?.formula?`${doc.sources.productionValue.formula} = ${fmt(d.productionValue)}`:null,
  'EBITDA / MOL':()=>doc.sources?.ebitda?.formula?`${doc.sources.ebitda.formula} = ${fmt(d.ebitda)}`:null,
  'EBIT':()=>doc.sources?.ebit?.formula?`${doc.sources.ebit.formula} = ${fmt(d.ebit)}`:null,
  'Crescita ricavi':()=>previous&&d.revenue!=null&&p.revenue?`(${fmt(d.revenue)} − ${fmt(p.revenue)}) / ${fmt(p.revenue)} × 100 = ${pct((d.revenue-p.revenue)/Math.abs(p.revenue)*100)}`:null,
  'Crescita EBITDA':()=>previous&&d.ebitda!=null&&p.ebitda?`(${fmt(d.ebitda)} − ${fmt(p.ebitda)}) / ${fmt(p.ebitda)} × 100 = ${pct((d.ebitda-p.ebitda)/Math.abs(p.ebitda)*100)}`:null
 };
 return (map[row.label]?.()||`${row.formula} = ${kpiFormat(row)}`);
}
function openKpiCalculation(label){
 const d=currentDoc(),p=previousDoc(d); if(!d)return;
 const row=kpiRowsForDoc(d,p).find(r=>r.label===label); if(!row)return;
 const modal=document.querySelector('#kpiCalcModal'); if(!modal)return;
 const rows=dependencyRowsForKpi(row,d,p);
 const v55MissingHelp=(r)=>{
  if(r.key==='openingInventoryChange')return ['Cerca nel PDF: conto 72, “VARIAZ. RIMANENZE INIZIALI”, “RIMANENZE INIZIALI” o “Rim. iniziali”.'];
  return ['Completa dati per inserire o confermare questa voce.'];
 };
 document.querySelector('#kpiCalcTitle').textContent=row.label;
 document.querySelector('#kpiCalcSubtitle').textContent=`${d.company} · ${d.period}`;
 document.querySelector('#kpiCalcResult').innerHTML=`<span>Risultato KPI</span><strong>${kpiFormat(row)}</strong><small>${esc(row.formula)}</small>`;
 document.querySelector('#kpiCalcReading').innerHTML=`<strong>${esc(kpiNarrativeLabel(row))}</strong><p>${esc(row.reading)}</p>`;
 document.querySelector('#kpiCalcFormula').innerHTML=`<strong>Calcolo applicato</strong><code>${esc(calculationExpression(row,d,p))}</code>`;
 document.querySelector('#kpiCalcSources').innerHTML=rows.length?rows.map(r=>{const s=r.source;const lines=sourceLines(s);const missing=r.value==null||!Number.isFinite(Number(r.value));return `<tr class="${missing?'missing':''}"><td><strong>${esc(r.name)}</strong><br><small>${esc(r.key)}</small></td><td>${formatMetricValue(r.key,r.value)}</td><td>${esc(sourceMethodLabel(s))}<br><small>Conf. ${s?.confidence??'—'}%</small></td><td>${lines.length?lines.map(x=>`<small>${esc(x)}</small>`).join(''):v55MissingHelp(r).map(x=>`<small>${esc(x)}</small>`).join('')}</td></tr>`;}).join(''):'<tr><td colspan="4" class="empty-state">Nessun dettaglio disponibile per questo KPI.</td></tr>';
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}
function closeKpiCalculation(){const modal=document.querySelector('#kpiCalcModal');if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}}
function kpiToneLabel(severity){
 const map={critical:'Critico',warning:'Da monitorare',good:'Positivo',neutral:'Informativo',missing:'Da completare'};
 return map[severity]||'Informativo';
}
function kpiToneIcon(severity){
 const map={critical:'●',warning:'●',good:'●',neutral:'○',missing:'○'};
 return map[severity]||'○';
}
function kpiNarrativeLabel(row){
 if(!row.available)return 'Dato mancante';
 if(row.severity==='critical')return 'Alert';
 if(row.severity==='warning')return 'Da controllare';
 if(row.severity==='good')return 'Positivo';
 return '';
}
function applyKpiFilters(rows){
 const f=kpiFilterState.value||'all';
 if(f==='available')return rows.filter(r=>r.available);
 if(f==='critical')return rows.filter(r=>r.available&&r.severity==='critical');
 if(f==='warning')return rows.filter(r=>r.available&&r.severity==='warning');
 if(f==='good')return rows.filter(r=>r.available&&r.severity==='good');
 if(f==='missing')return rows.filter(r=>!r.available||r.severity==='missing');
 return rows;
}
function refreshKpiFilterButtons(rows=[]){
 const box=document.querySelector('#kpiFilters');if(!box)return;
 const counts={
  all:rows.length,
  critical:rows.filter(r=>r.available&&r.severity==='critical').length,
  warning:rows.filter(r=>r.available&&r.severity==='warning').length,
  good:rows.filter(r=>r.available&&r.severity==='good').length,
  missing:rows.filter(r=>!r.available||r.severity==='missing').length,
  available:rows.filter(r=>r.available).length
 };
 box.querySelectorAll('[data-kpi-filter]').forEach(btn=>{
  const k=btn.dataset.kpiFilter;
  btn.classList.toggle('active',k===kpiFilterState.value);
  const label=btn.dataset.label||btn.textContent.replace(/\s*\(.*\)$/,'');
  btn.dataset.label=label;
  btn.innerHTML=`${esc(label)} <span>${counts[k]??0}</span>`;
 });
}
function renderKpiLibrary(){
 const d=currentDoc(),p=previousDoc(d),el=document.querySelector('#kpiLibrary');if(!el)return;
 if(!d){el.innerHTML='<div class="empty-state">Carica un bilancio per vedere tutti i KPI spiegati.</div>';refreshKpiFilterButtons([]);return;}
 const allRows=kpiRowsForDoc(d,p);
 refreshKpiFilterButtons(allRows);
 let rows=applyKpiFilters(allRows);
 if(!rows.length){el.innerHTML='<div class="empty-state">Nessun indicatore corrisponde al filtro selezionato.</div>';return;}
 el.innerHTML=rows.map(r=>{const label=kpiNarrativeLabel(r);const prefix=label?`<strong>${esc(label)}:</strong> `:'';return `<div class="kpi-explain-row ${r.available?'':'missing'} severity-${r.severity}"><div class="kpi-area">${esc(r.area)}</div><div class="kpi-name"><strong>${esc(r.label)}</strong><span>${esc(r.formula)}</span></div><button class="kpi-number kpi-number-btn" data-kpi-label="${esc(r.label)}" title="Vedi dati e formula usati"><strong>${kpiFormat(r)}</strong><span>Vedi calcolo</span></button><div class="kpi-explain"><div class="kpi-status-pill tone-${esc(r.severity)}">${kpiToneIcon(r.severity)} ${esc(kpiToneLabel(r.severity))}</div><p>${prefix}${esc(r.reading)}</p><small>${esc(r.why)}</small></div></div>`;}).join('');
}


const demo=[
 {id:'d1',company:'Teralvia S.r.l.',period:'2024',name:'Bilancio_2024.pdf',type:'Bilancio a 4 sezioni',quality:96,data:{revenue:1480000,productionValue:1525000,operatingCosts:1437000,ebitda:226000,ebit:88000,netIncome:42000,equity:710000,debt:860000,cash:94000,receivables:335000,inventory:282000,personnel:328000,services:274000,rawMaterials:511000,depreciation:138000,currentAssets:811000,currentLiabilities:602000,totalAssets:1700000},sources:{}},
 {id:'d2',company:'Teralvia S.r.l.',period:'2025',name:'Bilancio_2025.pdf',type:'Bilancio a 4 sezioni',quality:97,data:{revenue:1685000,productionValue:1730000,operatingCosts:1598000,ebitda:286000,ebit:132000,netIncome:71000,equity:781000,debt:895000,cash:107000,receivables:364000,inventory:310000,personnel:351000,services:293000,rawMaterials:564000,depreciation:154000,currentAssets:865000,currentLiabilities:616000,totalAssets:1830000},sources:{}},
 {id:'d3',company:'Teralvia S.r.l.',period:'2026',name:'Bilancio_2026.pdf',type:'Bilancio a 4 sezioni',quality:98,data:{revenue:1925000,productionValue:1980000,operatingCosts:1804000,ebitda:356000,ebit:176000,netIncome:99000,equity:880000,debt:930000,cash:126000,receivables:438000,inventory:348000,personnel:391000,services:327000,rawMaterials:635000,depreciation:180000,currentAssets:989000,currentLiabilities:651000,totalAssets:2050000},sources:{}},
 {id:'d4',company:'Nordpack S.r.l.',period:'2026',name:'Bilancio_Nordpack_2026.pdf',type:'Bilancio civilistico',quality:94,data:{revenue:4870000,productionValue:4990000,operatingCosts:4598000,ebitda:610000,ebit:392000,netIncome:238000,equity:1540000,debt:2210000,cash:310000,receivables:910000,inventory:770000,personnel:790000,services:865000,rawMaterials:1780000,depreciation:218000,currentAssets:2340000,currentLiabilities:1760000,totalAssets:4230000},sources:{}},
 {id:'d5',company:'Aurex Industries S.p.A.',period:'2026',name:'Bilancio_Aurex_2026.pdf',type:'Bilancio civilistico',quality:93,data:{revenue:3110000,productionValue:3210000,operatingCosts:2879000,ebitda:526000,ebit:331000,netIncome:184000,equity:1330000,debt:1270000,cash:198000,receivables:620000,inventory:415000,personnel:570000,services:512000,rawMaterials:1040000,depreciation:195000,currentAssets:1600000,currentLiabilities:1040000,totalAssets:2940000},sources:{}}
];

function save(){saveLocalOnly();queueCloudSync();}

// --- Supabase cloud sync ----------------------------------------------------
const CLOUD={session:null,user:null,ready:false,busy:false,timer:null,lastSync:null,error:null};
function currentUserId(){return CLOUD.user?.id||null;}
function dbRole(role='Owner'){const r=String(role||'owner').toLowerCase().replace(/\s+/g,'_');return ['owner','admin','analyst','viewer','external_advisor'].includes(r)?r:'owner';}
function profileToCompanyRow(name,profile={}){const p=normalizeProfile(profile);return {name,legal_name:name,sector:p.sector||null,business_type:p.sector||null,operating_model:p.businessModel||null,customer_type:p.customerType||null,avg_product_price:p.avgProductPrice,avg_order_value:p.avgOrderValue,yearly_units:p.annualUnits,employees:p.employees,sites:parseProfileNumber(p.plants),export_percentage:p.exportShare,seasonality:p.seasonality||null,notes:p.notes||null};}
function companyRowToProfile(c={}){return normalizeProfile({sector:c.sector||c.business_type||'',businessModel:c.operating_model||'',customerType:c.customer_type||'',avgProductPrice:c.avg_product_price,avgOrderValue:c.avg_order_value,annualUnits:c.yearly_units,employees:c.employees,plants:c.sites??'',exportShare:c.export_percentage,seasonality:c.seasonality||'',notes:c.notes||''});}
function cloudMethod(m){return ({direct:'extracted',reconstructed:'classified_sum',classified_sum:'classified_sum',sum:'classified_sum',calculated:'calculated',manual_override:'corrected',user_confirmed:'confirmed'}[m]||'extracted');}
function localMethod(m){return ({extracted:'direct',manual:'manual_override',corrected:'manual_override',confirmed:'user_confirmed',classified_sum:'classified_sum',calculated:'calculated',missing:'missing'}[m]||m||'direct');}
function slugFileName(name='file'){return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_.-]+/g,'-').replace(/^-+|-+$/g,'')||'file';}
function cloudStatusText(){if(!CLOUD.user)return 'Cloud non collegato';if(CLOUD.busy)return 'Sincronizzazione…';if(CLOUD.error)return `Errore cloud: ${CLOUD.error}`;return `Cloud attivo · ${CLOUD.user.email||'utente'}`;}
function updateCloudUI(){const btn=document.querySelector('#cloudAuthButton');const st=document.querySelector('#cloudStatusText');if(btn)btn.textContent=CLOUD.user?'Cloud attivo':'Login cloud';if(st)st.textContent=cloudStatusText();try{updateAuthHomeUI();}catch(e){}}
function queueCloudSync(){if(!CLOUD.ready||!CLOUD.user||CLOUD.busy)return;clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(()=>pushAllToCloud().catch(err=>{console.error(err);CLOUD.error=err.message||'sync';updateCloudUI();}),900);}
async function ensureCompany(companyName,profile={}){
 if(!CLOUD.user)throw new Error('LOGIN_REQUIRED');
 const name=String(companyName||'').trim(); if(!name)throw new Error('COMPANY_REQUIRED');
 let {data:rows,error}=await supabase.from('companies').select('*').ilike('name',name).limit(1);
 if(error)throw error;
 let company=rows?.[0];
 const row={...profileToCompanyRow(name,profile),created_by:CLOUD.user.id};
 if(!company){
  const ins=await supabase.from('companies').insert(row).select('*').single(); if(ins.error)throw ins.error; company=ins.data;
  const memb=await supabase.from('company_users').insert({company_id:company.id,user_id:CLOUD.user.id,role:'owner',status:'active'}); if(memb.error)console.warn('membership',memb.error.message);
 }else{
  await supabase.from('companies').update(profileToCompanyRow(name,profile)).eq('id',company.id);
  const {data:mem}=await supabase.from('company_users').select('id').eq('company_id',company.id).eq('user_id',CLOUD.user.id).maybeSingle();
  if(!mem)await supabase.from('company_users').insert({company_id:company.id,user_id:CLOUD.user.id,role:'owner',status:'active'});
 }
 return company;
}

function valuePriority(v){const order={extracted:1,missing:1,reconstructed:2,classified_sum:3,calculated:3,confirmed:4,corrected:5,manual:5,manual_override:5,user_confirmed:4};return order[v?.method]||1;}

function sourceForKey(doc,k){const s=doc.sources?.[k]||{};const first=s.items?.[0]||{};return {source:s.formula||first.line||null,source_page:first.page&&Number.isFinite(Number(first.page))?Number(first.page):null,source_row:first.line||null,method:cloudMethod(s.method),confidence:s.confidence??null,is_confirmed:['manual_override','user_confirmed'].includes(s.method)};}
async function uploadToBucket(bucket,companyId,file,folder){if(!file||!companyId)return {path:null,error:null};const path=`${companyId}/${folder}/${Date.now()}-${slugFileName(file.name)}`;const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type||'application/octet-stream'});if(error)throw error;return {path,error:null};}
async function cloudSaveDocument(doc,file=null){
 if(!CLOUD.user||!doc)return null;
 const company=await ensureCompany(doc.company,profileContext(doc));
 let filePath=doc.file_path||null; if(file)filePath=(await uploadToBucket('financial-documents',company.id,file,String(doc.period||'bilancio'))).path;
 let remoteId=doc._remoteId;
 const cov=dataCoverage(doc);
 const payload={company_id:company.id,period:String(doc.period||''),document_name:doc.name||null,document_type:doc.type||null,file_bucket:'financial-documents',file_path:filePath,extraction_status:cov.complete?'verified':'needs_review',extraction_engine_version:ENGINE_VERSION,coverage_score:Number(doc.quality||0),recognized_key_values:cov.found||0,expected_key_values:cov.total||0,confirmed_values:cov.verified||0,missing_values:cov.missing?.length||0,uploaded_by:CLOUD.user.id};
 if(remoteId){const up=await supabase.from('financial_documents').update(payload).eq('id',remoteId).select('id').single(); if(up.error){remoteId=null;} }
 if(!remoteId){const existing=await supabase.from('financial_documents').select('id').eq('company_id',company.id).eq('period',String(doc.period||'')).limit(1).maybeSingle(); if(existing.data?.id)remoteId=existing.data.id;}
 if(remoteId){const up=await supabase.from('financial_documents').update(payload).eq('id',remoteId).select('id').single(); if(up.error)throw up.error;}
 else{const ins=await supabase.from('financial_documents').insert(payload).select('id').single(); if(ins.error)throw ins.error; remoteId=ins.data.id;}
 doc._remoteId=remoteId;doc._companyId=company.id;doc.file_path=filePath;
 await supabase.from('financial_values').delete().eq('document_id',remoteId);
 const values=Object.keys(doc.data||{}).filter(k=>doc.data[k]!=null&&Number.isFinite(Number(doc.data[k]))).map(k=>{const src=sourceForKey(doc,k);return {document_id:remoteId,company_id:company.id,key:k,label:metricNames[k]||k,value:Number(doc.data[k]),unit:'EUR',category:null,...src};});
 if(values.length){const insv=await supabase.from('financial_values').insert(values); if(insv.error)throw insv.error;}
 await supabase.from('financial_kpis').delete().eq('document_id',remoteId);
 const kpis=kpiRowsForDoc(doc,previousDoc(doc)).filter(r=>r.available).slice(0,80).map(r=>({document_id:remoteId,company_id:company.id,key:profileKey(r.label).replace(/[^a-z0-9]+/g,'_'),label:r.label,value:Number(r.value),unit:r.type==='pct'?'%':r.type==='ratio'?'x':r.type==='money'?'EUR':null,formula:r.formula||null,explanation:r.why||null,result_reading:r.reading||null,status:r.severity==='critical'?'critical':r.severity==='warning'?'warning':'available',inputs:dependencyRowsForKpi(r,doc,previousDoc(doc)).map(x=>({key:x.key,label:x.name,value:x.value}))}));
 if(kpis.length){const insk=await supabase.from('financial_kpis').insert(kpis); if(insk.error)throw insk.error;}
 return remoteId;
}
async function cloudSaveProductivity(record,file=null){
 if(!CLOUD.user||!record)return null;
 const company=await ensureCompany(record.company,getCompanyProfile(record.company));
 let filePath=record.file_path||null; if(file)filePath=(await uploadToBucket('productivity-files',company.id,file,String(record.period||'vendite'))).path;
 let remoteId=record._remoteId; const m=record.metrics||{};
 const payload={company_id:company.id,period:String(record.period||''),file_name:record.fileName||null,file_bucket:'productivity-files',file_path:filePath,total_revenue:m.totalRevenue??null,customers_count:m.uniqueCustomers??null,products_count:m.uniqueProducts??null,units_total:m.totalQty??null,weighted_avg_price:m.avgUnitPrice??null,top_customer_share:m.topCustomerShare??null,top_product_share:m.topProductShare??null,uploaded_by:CLOUD.user.id};
 if(!remoteId){const ex=await supabase.from('productivity_files').select('id').eq('company_id',company.id).eq('period',String(record.period||'')).limit(1).maybeSingle();if(ex.data?.id)remoteId=ex.data.id;}
 if(remoteId){const up=await supabase.from('productivity_files').update(payload).eq('id',remoteId).select('id').single();if(up.error)throw up.error;}
 else{const ins=await supabase.from('productivity_files').insert(payload).select('id').single();if(ins.error)throw ins.error;remoteId=ins.data.id;}
 record._remoteId=remoteId;record._companyId=company.id;record.file_path=filePath;return remoteId;
}
async function pushAllToCloud(){if(!CLOUD.user)return;CLOUD.busy=true;CLOUD.error=null;updateCloudUI();try{for(const [k,p] of Object.entries(state.profiles||{})){await ensureCompany(k,p);}for(const d of state.docs||[]){await cloudSaveDocument(d);}for(const r of state.productivity||[]){await cloudSaveProductivity(r);}CLOUD.lastSync=new Date().toISOString();saveLocalOnly();}finally{CLOUD.busy=false;updateCloudUI();}}
async function acceptPendingInvitation(){
 if(!CLOUD.user || state.platformAdmin)return null;
 try{
  const {data,error}=await supabase.rpc('accept_client_invitation');
  if(error){console.warn('accept invitation',error.message);return null;}
  return data;
 }catch(e){console.warn('accept invitation',e.message);return null;}
}

async function loadCloudData(){
 if(!CLOUD.user)throw new Error('LOGIN_REQUIRED');CLOUD.busy=true;CLOUD.error=null;updateCloudUI();
 await checkPlatformAdmin();
 await acceptPendingInvitation();
 try{
  const {data:companies,error:ce}=await supabase.from('companies').select('*').order('name'); if(ce)throw ce;
  const cmap={}; const profiles={}; (companies||[]).forEach(c=>{cmap[c.id]=c;profiles[profileKey(c.name)]=companyRowToProfile(c);});
  const {data:docs,error:de}=await supabase.from('financial_documents').select('*').order('period'); if(de)throw de;
  const {data:vals,error:ve}=await supabase.from('financial_values').select('*'); if(ve)throw ve;
  const valsByDoc={}; (vals||[]).forEach(v=>{(valsByDoc[v.document_id] ||= []).push(v);});
  state.docs=(docs||[]).map(r=>{const data={},sources={};(valsByDoc[r.id]||[]).sort((a,b)=>valuePriority(a)-valuePriority(b)).forEach(v=>{data[v.key]=Number(v.value);sources[v.key]={method:localMethod(v.method),confidence:v.confidence,formula:v.source||null,items:[{page:v.source_page||'—',line:v.source_row||v.source||metricNames[v.key]||v.key}]};});const company=cmap[r.company_id]?.name||'Azienda';return {id:'r'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,name:r.document_name||'Bilancio',type:r.document_type,quality:Number(r.coverage_score||0),data,sources,candidates:{},validations:[],recognized:r.recognized_key_values,engineVersion:r.extraction_engine_version||ENGINE_VERSION,parser:{kind:r.document_type},profile:profiles[profileKey(company)]||{},file_path:r.file_path};});
  const {data:prod,error:pe}=await supabase.from('productivity_files').select('*').order('created_at'); if(pe)throw pe;
  state.productivity=(prod||[]).map(r=>{const company=cmap[r.company_id]?.name||'Azienda';return {id:'s'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,fileName:r.file_name,createdAt:r.created_at,file_path:r.file_path,metrics:(r.raw_metrics&&typeof r.raw_metrics==='object')?r.raw_metrics:{rowsCount:0,totalRevenue:Number(r.total_revenue||0),totalQty:Number(r.units_total||0),avgUnitPrice:r.weighted_avg_price!=null?Number(r.weighted_avg_price):null,uniqueCustomers:r.customers_count||0,uniqueProducts:r.products_count||0,avgRevenuePerCustomer:null,topCustomerShare:r.top_customer_share!=null?Number(r.top_customer_share):null,topProductShare:r.top_product_share!=null?Number(r.top_product_share):null,topCustomers:[],topProducts:[],headers:{},detectedPeriodLabel:r.detected_period_label||'',detectedStartDate:r.detected_start_date||null,detectedEndDate:r.detected_end_date||null}};});
  state.profiles=profiles;state.selectedCompany=state.docs[0]?.company||companies?.[0]?.name||'';state.selectedPeriod=state.docs.find(d=>d.company===state.selectedCompany)?.period||state.docs[0]?.period||'';saveLocalOnly();renderAll();return true;
 }finally{CLOUD.busy=false;updateCloudUI();}
}
function saveLocalOnly(){localStorage.setItem(STORAGE,JSON.stringify(state.docs));localStorage.setItem(PROFILE_STORAGE,JSON.stringify(state.profiles||{}));localStorage.setItem(PRODUCTIVITY_STORAGE,JSON.stringify(state.productivity||[]));localStorage.setItem(USERS_STORAGE,JSON.stringify(state.users||[]));localStorage.setItem(WORKSPACE_STORAGE,JSON.stringify(state.workspace||{}));}
function installCloudAuthUI(){
 const host=document.querySelector('#contextActions')||document.body;const btn=document.createElement('button');btn.id='cloudAuthButton';btn.className='ghost';btn.type='button';btn.textContent='Login cloud';host.prepend(btn);
 const modal=document.createElement('div');modal.id='cloudAuthModal';modal.className='modal';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<div class="modal-card auth-card"><div class="modal-head"><div><p class="eyebrow">SUPABASE CLOUD</p><h2>Accesso NOMYRA Finance</h2><p id="cloudStatusText" class="modal-intro">Cloud non collegato</p></div><button id="closeCloudAuth" class="icon-btn">×</button></div><div class="auth-grid"><label>Email<input id="cloudEmail" type="email" placeholder="email@azienda.it"></label><label>Password<input id="cloudPassword" type="password" placeholder="Password"></label></div><div id="cloudAuthMessage" class="provider-result empty-state">Accedi per salvare aziende, bilanci, KPI, Excel e report nel backend Supabase privato.</div><div class="modal-actions wrap"><button id="cloudSignUp" class="ghost">Crea utente</button><button id="cloudLogin" class="primary">Accedi</button><button id="cloudLoad" class="ghost">Carica dati cloud</button><button id="cloudPush" class="ghost">Invia dati locali al cloud</button><button id="cloudLogout" class="ghost danger">Esci</button></div></div>`;document.body.appendChild(modal);
 const css=document.createElement('style');css.textContent=`.auth-card{max-width:720px}.auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.modal-actions.wrap{flex-wrap:wrap}.top-actions #cloudAuthButton{border-color:#cbd8d7;background:#fff}@media(max-width:720px){.auth-grid{grid-template-columns:1fr}}`;document.head.appendChild(css);
 const open=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');updateCloudUI();};const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};
 btn.onclick=open;modal.querySelector('#closeCloudAuth').onclick=close;
 const msg=()=>modal.querySelector('#cloudAuthMessage');
 modal.querySelector('#cloudLogin').onclick=async()=>{try{const email=modal.querySelector('#cloudEmail').value.trim(),password=modal.querySelector('#cloudPassword').value;msg().textContent='Accesso in corso…';const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;CLOUD.session=data.session;CLOUD.user=data.user;CLOUD.ready=true;updateCloudUI();await checkPlatformAdmin();if(state.platformAdmin){await renderAdmin();close();showView('admin','ADMIN NOMYRA');}else{await loadCloudData();close();renderAll();showView('home','Dashboard');}msg().textContent='Accesso effettuato.';}catch(e){msg().textContent=e.message||'Accesso non riuscito.';}};
 modal.querySelector('#cloudSignUp').onclick=async()=>{try{const email=modal.querySelector('#cloudEmail').value.trim(),password=modal.querySelector('#cloudPassword').value;msg().textContent='Creazione utente…';const {data,error}=await supabase.auth.signUp({email,password});if(error)throw error;CLOUD.session=data.session;CLOUD.user=data.user;CLOUD.ready=!!data.user;updateCloudUI();await checkPlatformAdmin();if(CLOUD.user){if(state.platformAdmin){await renderAdmin();close();showView('admin','ADMIN NOMYRA');}else{await loadCloudData();close();renderAll();showView('home','Dashboard');}}else{msg().textContent='Utente creato. Conferma la mail e poi accedi.';}}catch(e){msg().textContent=e.message||'Creazione utente non riuscita.';}};
 modal.querySelector('#cloudLoad').onclick=async()=>{try{await loadCloudData();msg().textContent='Dati caricati da Supabase.';}catch(e){msg().textContent=e.message||'Impossibile caricare i dati cloud.';}};
 modal.querySelector('#cloudPush').onclick=async()=>{try{await pushAllToCloud();msg().textContent='Dati locali inviati a Supabase.';}catch(e){msg().textContent=e.message||'Impossibile inviare i dati.';}};
 modal.querySelector('#cloudLogout').onclick=async()=>{await supabase.auth.signOut();CLOUD.session=null;CLOUD.user=null;CLOUD.ready=false;state.platformAdmin=false;state.demoUnlocked=false;localStorage.removeItem('nomyra-finance-demo-unlocked-v21');msg().textContent='Logout effettuato.';updateCloudUI();showView('access','Accesso utenti');};
}
async function initCloud(){installCloudAuthUI();const {data}=await supabase.auth.getSession();CLOUD.session=data.session||null;CLOUD.user=data.session?.user||null;CLOUD.ready=!!CLOUD.user;updateCloudUI();supabase.auth.onAuthStateChange((_e,session)=>{CLOUD.session=session;CLOUD.user=session?.user||null;CLOUD.ready=!!CLOUD.user;updateCloudUI();});}


// V16 · Accesso utenti chiaro e home separata
function updateAuthHomeUI(){
 const box=document.querySelector('#authHomeStatus');
 if(!box)return;
 if(CLOUD.user){box.classList.add('connected');box.innerHTML=`<strong>Cloud attivo</strong><span>Utente collegato: ${esc(CLOUD.user.email||'utente')}</span>`;} 
 else {box.classList.remove('connected');box.innerHTML='<strong>Accesso sicuro</strong><span>Entra nel tuo workspace e sincronizza i dati nel cloud.</span>';}
 const chipId='cloudUserChip';let chip=document.querySelector('#'+chipId);const host=document.querySelector('#contextActions');
 if(host && CLOUD.user && !chip){chip=document.createElement('span');chip.id=chipId;chip.className='cloud-user-chip';host.prepend(chip);} 
 if(chip){if(CLOUD.user){chip.innerHTML=`<span>Utente</span><b>${esc(CLOUD.user.email||'cloud')}</b>`;chip.style.display='inline-flex';}else{chip.style.display='none';}}
}
function goToRealHome(){showView('home','Dashboard');}
function bindAccessLanding(){
 const login=document.querySelector('#accessOpenLogin');
 const topLogin=document.querySelector('#accessOpenLoginTop');
 const demo=document.querySelector('#accessContinueDemo');
 const doLogin=()=>{
   const email=document.querySelector('#landingEmail')?.value?.trim()||'';
   const password=document.querySelector('#landingPassword')?.value||'';
   document.querySelector('#cloudAuthButton')?.click();
   setTimeout(()=>{
     const ce=document.querySelector('#cloudEmail');
     const cp=document.querySelector('#cloudPassword');
     if(ce&&email)ce.value=email;
     if(cp&&password)cp.value=password;
     if(email&&password)document.querySelector('#cloudLogin')?.click();
   },50);
 };
 if(login)login.onclick=doLogin;
 if(topLogin)topLogin.onclick=doLogin;
 const explore=document.querySelector('#accessExploreProduct');
 if(explore)explore.onclick=()=>document.querySelector('#nf40Benefits')?.scrollIntoView({behavior:'smooth',block:'start'});
 if(demo)demo.onclick=()=>{state.demoUnlocked=true;localStorage.setItem('nomyra-finance-demo-unlocked-v21','1');applyPortalShell();goToRealHome();};
 updateAuthHomeUI();
}

function companyDocs(company=state.selectedCompany){return state.docs.filter(d=>!company||d.company===company).sort((a,b)=>String(a.period).localeCompare(String(b.period)));}
function currentDoc(){const ds=companyDocs();return ds.find(d=>d.period===state.selectedPeriod)||ds.at(-1)||null;}
function previousDoc(doc){if(!doc)return null;const ds=companyDocs(doc.company);const i=ds.findIndex(x=>x.id===doc.id);return i>0?ds[i-1]:null;}
function derived(doc){return derivedIndicators(doc,previousDoc(doc));}
function deltaHTML(cur,prev){const v=variation(cur,prev);if(v==null)return '<span class="delta neutral">—</span>';return `<span class="delta ${v>=0?'positive':'negative'}">${v>=0?'↑':'↓'} ${Math.abs(v).toLocaleString('it-IT',{maximumFractionDigits:1})}%</span>`;}

function populateFilters(){
 const companies=[...new Set(state.docs.map(d=>d.company))];const cf=document.querySelector('#companyFilter');cf.innerHTML=companies.length?companies.map(c=>`<option>${esc(c)}</option>`).join(''):'<option>Nessuna azienda</option>';
 if(!state.selectedCompany||!companies.includes(state.selectedCompany))state.selectedCompany=companies[0]||'';cf.value=state.selectedCompany;
 const periods=companyDocs().map(d=>d.period);const pf=document.querySelector('#periodFilter');pf.innerHTML=periods.length?periods.map(p=>`<option>${esc(p)}</option>`).join(''):'<option>—</option>';if(!state.selectedPeriod||!periods.includes(state.selectedPeriod))state.selectedPeriod=periods.at(-1)||'';pf.value=state.selectedPeriod;
 const bp=document.querySelector('#benchmarkPeriod');const all=[...new Set(state.docs.map(d=>d.period))].sort();const old=bp.value;bp.innerHTML=all.length?all.map(p=>`<option>${esc(p)}</option>`).join(''):'<option>—</option>';bp.value=all.includes(old)?old:(all.includes(state.selectedPeriod)?state.selectedPeriod:all.at(-1)||'');
}

function renderOverview(){
 const d=currentDoc(),p=previousDoc(d),grid=document.querySelector('#kpiGrid');
 if(!d){grid.innerHTML='';document.querySelector('#dataQuality').textContent='—';document.querySelector('#dataQualityLabel').textContent='Nessun documento';document.querySelector('#executiveSummary').textContent='Carica un bilancio per generare la sintesi.';drawTrend([]);renderKpiLibrary();return;}
 const dv=derived(d),comp=completeness(d),cov=dataCoverage(d);document.querySelector('#dataQuality').textContent=cov.label;document.querySelector('#dataQualityLabel').textContent=`${cov.state} · ${cov.verified} confermate · ${cov.automatic} automatiche`;document.querySelector('#heroTitle').textContent=`${d.company} · ${d.period}`;document.querySelector('#heroSummary').innerHTML=`I KPI sono calcolati sui valori riconosciuti o confermati. ${cov.missing.length?`Mancano ancora ${cov.missing.length} voci chiave: apri <strong>Completa dati</strong> per arrivare a un dataset validato.`:'Dataset completo: puoi generare analisi e report con tutte le voci chiave disponibili.'}`;
 const kpis=[
  {label:'Ricavi',value:fmt(d.data?.revenue),current:d.data?.revenue,previous:p?.data?.revenue,severity:'neutral'},
  {label:'EBITDA',value:fmt(d.data?.ebitda),current:d.data?.ebitda,previous:p?.data?.ebitda,severity:d.data?.ebitda<0?'critical':'good'},
  {label:'EBITDA margin',value:pct(dv.ebitdaMargin),current:dv.ebitdaMargin,previous:p?derived(p).ebitdaMargin:null,severity:dv.ebitdaMargin==null?'neutral':dv.ebitdaMargin<0?'critical':dv.ebitdaMargin<5?'warning':'good'},
  {label:'EBIT',value:fmt(d.data?.ebit),current:d.data?.ebit,previous:p?.data?.ebit,severity:d.data?.ebit==null?'neutral':d.data.ebit<0?'critical':'good'},
  {label:'ROE',value:pct(dv.roe),current:dv.roe,previous:p?derived(p).roe:null,severity:dv.roe==null?'neutral':dv.roe<0?'critical':dv.roe<5?'warning':'good'},
  {label:'Debiti',value:fmt(d.data?.debt),current:d.data?.debt,previous:p?.data?.debt,severity:'neutral'}
 ];
 grid.innerHTML=kpis.map(k=>`<div class="kpi-card severity-${esc(k.severity)}"><div class="label">${esc(k.label)}</div><div class="value">${k.value}</div>${k.severity==='critical'?'<div class="kpi-card-alert">Da approfondire</div>':k.severity==='warning'?'<div class="kpi-card-warning">Monitorare</div>':deltaHTML(k.current,k.previous)}</div>`).join('');
 renderKpiLibrary();
 drawTrend(companyDocs());document.querySelector('#executiveSummary').innerHTML=summaryText(d,p);renderChanges(d,p);renderAlerts(d,p);
 const rv=p?variation(d.data?.revenue,p.data?.revenue):null,b=document.querySelector('#trendBadge');b.textContent=rv==null?'Dati storici insufficienti':`${rv>=0?'+':''}${rv.toFixed(1)}% ricavi`;b.className=`badge ${rv==null?'neutral':rv>=0?'good':'warn'}`;
}

function summaryText(d,p){
 const x=d.data||{},dv=derived(d),parts=[];
 if(x.revenue!=null)parts.push(`ricavi pari a <strong>${fmt(x.revenue)}</strong>`);if(x.ebitda!=null)parts.push(`EBITDA di <strong>${fmt(x.ebitda)}</strong>${dv.ebitdaMargin!=null?` (${pct(dv.ebitdaMargin)} dei ricavi)`:''}`);if(x.ebit!=null)parts.push(`EBIT di <strong>${fmt(x.ebit)}</strong>`);
 let html=parts.length?`<p>Nel ${esc(d.period)} il bilancio evidenzia ${parts.join(', ')}.</p>`:`<p>Il documento è stato acquisito, ma non contiene ancora abbastanza voci riconosciute per una lettura economica completa. Apri <strong>Verifica dati</strong> per controllare le voci estratte.</p>`;
 const pc=profileCompleteness(d.profile||{}); if(pc.filled>0)html+=`<p><strong>Contesto aziendale:</strong> ${esc(profileContextText(d))}. Questo contesto viene usato per leggere i KPI in modo più coerente con settore, modello operativo e struttura aziendale.</p>`;
 if(p){const rv=variation(x.revenue,p.data?.revenue),ev=variation(x.ebitda,p.data?.ebitda),pm=derived(p).ebitdaMargin;if(rv!=null)html+=`<p>I ricavi ${rv>=0?'crescono':'si riducono'} del <strong>${Math.abs(rv).toFixed(1)}%</strong> rispetto al ${esc(p.period)}.${ev!=null?` L'EBITDA ${ev>=0?'cresce':'si riduce'} del <strong>${Math.abs(ev).toFixed(1)}%</strong>.`:''}${dv.ebitdaMargin!=null&&pm!=null?` La marginalità EBITDA passa dal ${pct(pm)} al <strong>${pct(dv.ebitdaMargin)}</strong>.`:''}</p>`;}
 if(d.validations?.some(v=>!v.ok))html+=`<p><strong>Controllo dati:</strong> sono presenti verifiche di quadratura da esaminare nel dettaglio del documento.</p>`;
 return html;
}

function renderChanges(d,p){const el=document.querySelector('#changesList');if(!p){el.className='changes-list empty-state';el.textContent='Servono almeno due periodi della stessa azienda.';return;}const keys=['revenue','ebitda','ebit','netIncome','personnel','services','receivables','inventory','debt'];const rows=keys.map(k=>({k,v:variation(d.data?.[k],p.data?.[k]),diff:d.data?.[k]!=null&&p.data?.[k]!=null?d.data[k]-p.data[k]:null})).filter(x=>x.v!=null).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,6);if(!rows.length){el.className='changes-list empty-state';el.textContent='Non ci sono abbastanza valori comparabili tra i due periodi.';return;}el.className='changes-list';el.innerHTML=rows.map(x=>`<div class="change-item"><div><strong>${metricNames[x.k]||x.k}</strong><br><span>${x.diff>=0?'+':''}${fmt(x.diff)}</span></div><div class="delta ${x.v>=0?'positive':'negative'}">${x.v>=0?'+':''}${x.v.toFixed(1)}%</div></div>`).join('');}

function buildNegativeAlerts(d,p){
 const a=[],x=d.data||{},dv=derived(d);
 const add=(title,text,opts={})=>a.push({
  title,
  text,
  severity:opts.severity||'warning',
  action:opts.action||'review-data',
  actionLabel:opts.actionLabel||'Controlla dati',
  secondaryAction:opts.secondaryAction||null,
  secondaryLabel:opts.secondaryLabel||null
 });
 if(x.ebitda!=null&&x.ebitda<0)add('EBITDA / MOL negativo',`Il MOL è ${fmt(x.ebitda)}: i costi operativi monetari riconosciuti superano il valore della produzione.`,{severity:'critical',action:'kpi-ebitda',actionLabel:'Vedi calcolo EBITDA',secondaryAction:'review-data',secondaryLabel:'Correggi valori'});
 if(dv.ebitdaMargin!=null&&dv.ebitdaMargin<0)add('EBITDA margin negativo',`Per ogni 100 € di ricavi l’azienda perde circa ${Math.abs(dv.ebitdaMargin).toLocaleString('it-IT',{maximumFractionDigits:1})} € a livello operativo monetario.`,{severity:'critical',action:'kpi-ebitda-margin',actionLabel:'Vedi calcolo margine',secondaryAction:'review-data',secondaryLabel:'Controlla dati'});
 if(x.ebit!=null&&x.ebit<0)add('EBIT negativo',`Risultato operativo ${fmt(x.ebit)}: dopo ammortamenti il margine industriale non copre la struttura.`,{severity:'critical',action:'kpi-ebit',actionLabel:'Vedi calcolo EBIT',secondaryAction:'review-data',secondaryLabel:'Correggi valori'});
 if(x.netIncome!=null&&x.netIncome<0)add('Perdita netta',`Risultato d’esercizio negativo: ${fmt(x.netIncome)}.`,{severity:'critical',action:'review-data',actionLabel:'Controlla risultato'});
 if(dv.currentRatio!=null&&dv.currentRatio<1)add('Current ratio sotto 1',`${ratio(dv.currentRatio)}: attività correnti inferiori alle passivo circolante rilevate.`,{action:'kpi-current-ratio',actionLabel:'Vedi calcolo liquidità'});
 if(dv.debtEquity!=null&&dv.debtEquity>2)add('Debiti / patrimonio netto elevato',`${ratio(dv.debtEquity)}: leva finanziaria da approfondire con scadenze e capacità di cassa.`,{action:'kpi-debt-equity',actionLabel:'Vedi calcolo debiti'});
 if(dv.debtEbitda!=null&&dv.debtEbitda>4)add('Debiti / EBITDA elevato',`${ratio(dv.debtEbitda)}: multiplo alto rispetto alla marginalità operativa.`,{action:'kpi-debt-ebitda',actionLabel:'Vedi calcolo'});
 if(dv.monetaryCostsInc!=null&&dv.monetaryCostsInc>100)add('Costi operativi monetari superiori ai ricavi',`${pct(dv.monetaryCostsInc)} dei ricavi: il sistema ha sommato rimanenze iniziali, materie, servizi, godimento beni terzi, personale e oneri diversi. Clicca per vedere esattamente quali voci generano il 122,9% e correggere eventuali classificazioni.`,{severity:'critical',action:'kpi-monetary-costs',actionLabel:'Vedi voci usate',secondaryAction:'review-data',secondaryLabel:'Correggi dati'});
 if(p&&x.revenue!=null&&p.data?.revenue!=null){const rv=variation(x.revenue,p.data.revenue);[['personnel','Costo del personale'],['services','Costi per servizi'],['receivables','Crediti'],['inventory','Rimanenze'],['debt','Debiti']].forEach(([k,l])=>{const v=variation(x[k],p.data?.[k]);if(v!=null&&rv!=null&&v>rv+8)add(`${l} cresce più dei ricavi`,`${l} ${v>=0?'+':''}${v.toFixed(1)}% vs ricavi ${rv>=0?'+':''}${rv.toFixed(1)}%. È un segnale da approfondire, non una causa automatica.`,{action:'review-data',actionLabel:'Controlla voce'});});}
 if(d.validations?.some(v=>!v.ok))add('Verifica di quadratura richiesta','Almeno un controllo matematico sui dati estratti non coincide entro la tolleranza prevista. Clicca per vedere quali controlli non tornano e le fonti PDF usate.',{severity:'warning',action:'verify-details',actionLabel:'Apri verifica dati',secondaryAction:'review-data',secondaryLabel:'Completa dati'});
 return a;
}
function runAlertAction(action){
 const d=currentDoc(); if(!d)return;
 const map={
  'kpi-monetary-costs':'Costi operativi monetari / Ricavi',
  'kpi-ebitda':'EBITDA / MOL',
  'kpi-ebitda-margin':'EBITDA margin',
  'kpi-ebit':'EBIT',
  'kpi-current-ratio':'Current ratio',
  'kpi-debt-equity':'Debiti / Equity',
  'kpi-debt-ebitda':'Debiti / EBITDA'
 };
 if(action==='verify-details'){openDetails(d.id);return;}
 if(action==='review-data'){openReview(d.id);return;}
 if(map[action]){openKpiCalculation(map[action]);return;}
 openReview(d.id);
}
function renderAlerts(d,p){
 const el=document.querySelector('#alertsList'),a=buildNegativeAlerts(d,p);
 el.className=a.length?'alerts-list v24-alerts-list':'alerts-list empty-state';
 el.innerHTML=a.length?a.map((x,i)=>`<div class="alert-item v24-alert-item severity-${esc(x.severity)}"><div class="alert-copy"><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></div><div class="alert-actions"><button class="mini-btn primary-mini" data-alert-action="${esc(x.action)}">${esc(x.actionLabel)}</button>${x.secondaryAction?`<button class="mini-btn" data-alert-action="${esc(x.secondaryAction)}">${esc(x.secondaryLabel)}</button>`:''}</div></div>`).join(''):'Nessun alert automatico con i dati disponibili.';
}


function drawTrend(ds){const c=document.querySelector('#trendChart'),ctx=c.getContext('2d'),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=c.clientHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);const W=c.clientWidth,H=c.clientHeight;ctx.clearRect(0,0,W,H);const rows=ds.filter(d=>d.data?.revenue!=null||d.data?.ebitda!=null);if(!rows.length){ctx.fillStyle='#6e7a83';ctx.font='12px system-ui';ctx.fillText('Dati insufficienti per il grafico',20,30);return;}const vals=rows.flatMap(d=>[d.data?.revenue,d.data?.ebitda]).filter(v=>v!=null),max=Math.max(...vals,1),pad=34;ctx.strokeStyle='#dfe6e3';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=pad+(H-pad*2)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.stroke();}const plot=(key,stroke)=>{const pts=rows.map((d,i)=>({x:rows.length===1?W/2:pad+(W-pad*2)*i/(rows.length-1),y:H-pad-((d.data?.[key]??0)/max)*(H-pad*2),v:d.data?.[key]})).filter(p=>p.v!=null);if(!pts.length)return;ctx.strokeStyle=stroke;ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();pts.forEach(p=>{ctx.fillStyle=stroke;ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();});};plot('revenue','#1F5A5D');plot('ebitda','#B97850');ctx.fillStyle='#6e7a83';ctx.font='11px system-ui';rows.forEach((d,i)=>{const x=rows.length===1?W/2:pad+(W-pad*2)*i/(rows.length-1);ctx.fillText(String(d.period),x-14,H-10);});}

function renderDocuments(){const tb=document.querySelector('#documentsTable');if(!state.docs.length){tb.innerHTML='<tr><td colspan="6" class="empty-state">Nessun bilancio caricato.</td></tr>';return;}tb.innerHTML=state.docs.slice().sort((a,b)=>b.period.localeCompare(a.period)).map(d=>{const cov=dataCoverage(d);const missing=cov.missing.length?`<small>Mancano: ${cov.missing.slice(0,3).map(k=>metricNames[k]||k).join(', ')}${cov.missing.length>3?'…':''}</small>`:'<small>Dataset completo / revisionato</small>';return `<tr><td><strong>${esc(d.company)}</strong><br><small>${esc(profileCompleteness(profileContext(d)).label)} profilo</small></td><td>${esc(d.period)}</td><td>${esc(d.name)}</td><td>${esc(d.type||'—')}</td><td><span class="quality-dot ${cov.complete?'ok':'warn'}"></span><strong>${esc(cov.state)}</strong><br>${cov.found}/${cov.total} voci · ${cov.verified} confermate<br>${missing}</td><td><button class="mini-btn primary-mini" data-review="${d.id}">Completa dati</button> <button class="mini-btn" data-profile="${d.id}">Profilo azienda</button> <button class="mini-btn" data-details="${d.id}">Verifica</button> <button class="mini-btn" data-select="${d.id}">Apri</button> <button class="mini-btn danger" data-delete="${d.id}">Elimina</button></td></tr>`;}).join('');}

function renderHistory(){const ds=companyDocs(),t=document.querySelector('#historyTable'),n=document.querySelector('#historyNarrative');if(!ds.length){t.innerHTML='';n.textContent='Nessun documento.';return;}const rows=[['Ricavi',d=>fmt(d.data?.revenue)],['EBITDA',d=>fmt(d.data?.ebitda)],['EBITDA margin',d=>pct(derived(d).ebitdaMargin)],['EBIT / ROS',d=>`${fmt(d.data?.ebit)}${derived(d).ebitMargin!=null?` · ${pct(derived(d).ebitMargin)}`:''}`],['Utile netto',d=>fmt(d.data?.netIncome)],['Patrimonio netto',d=>fmt(d.data?.equity)],['Debiti',d=>fmt(d.data?.debt)],['Personale/Ricavi',d=>pct(derived(d).personnelInc)]];t.innerHTML=`<thead><tr><th>Indicatore</th>${ds.map(d=>`<th>${esc(d.period)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l,f])=>`<tr><td><strong>${l}</strong></td>${ds.map(d=>`<td>${f(d)}</td>`).join('')}</tr>`).join('')}</tbody>`;if(ds.length<2){n.textContent='Servono almeno due periodi per l’analisi evolutiva.';return;}const first=ds[0],last=ds.at(-1),rv=variation(last.data?.revenue,first.data?.revenue),ev=variation(last.data?.ebitda,first.data?.ebitda);let s=`<p>Confronto ${esc(first.period)} → ${esc(last.period)}.`;if(rv!=null)s+=` I ricavi variano del <strong>${rv>=0?'+':''}${rv.toFixed(1)}%</strong>.`;if(ev!=null)s+=` L'EBITDA varia del <strong>${ev>=0?'+':''}${ev.toFixed(1)}%</strong>.`;s+=' Gli indicatori non disponibili non vengono stimati.</p>';n.innerHTML=s;}

function indicatorForDoc(d,key){const z=derived(d);return z[key];}
function renderBenchmark(){
 const period=document.querySelector('#benchmarkPeriod').value,docs=state.docs.filter(d=>d.period===period),t=document.querySelector('#benchmarkTable'),n=document.querySelector('#benchmarkNarrative');if(!docs.length){t.innerHTML='';n.textContent='Nessun bilancio disponibile per questo periodo.';return;}
 const rows=[
  {l:'Ricavi',f:d=>fmt(d.data?.revenue),e:'Dimensione commerciale: utile per capire scala aziendale, ma non basta per valutare performance.'},
  {l:'Valore produzione',f:d=>fmt(d.data?.productionValue),e:'Include ricavi, rimanenze finali e altri ricavi: misura il valore economico generato.'},
  {l:'EBITDA / MOL',f:d=>fmt(d.data?.ebitda),e:'Margine operativo prima di ammortamenti, finanza e imposte.'},
  {l:'EBITDA margin',f:d=>pct(indicatorForDoc(d,'ebitdaMargin')),e:'Confronto normalizzato: mostra quanti € di MOL restano ogni 100 € di ricavi.'},
  {l:'EBIT margin / ROS',f:d=>pct(indicatorForDoc(d,'ebitMargin')),e:'Marginalità operativa dopo ammortamenti; consente confronto tra aziende diverse.'},
  {l:'Net margin',f:d=>pct(indicatorForDoc(d,'netMargin')),e:'Quota dei ricavi che diventa utile netto dopo tutte le componenti.'},
  {l:'ROE',f:d=>pct(indicatorForDoc(d,'roe')),e:'Rendimento del capitale proprio; richiede utile netto e patrimonio netto.'},
  {l:'ROA',f:d=>pct(indicatorForDoc(d,'roa')),e:'Rendimento dell’attivo complessivo, utile per leggere efficienza patrimoniale.'},
  {l:'ROI operativo',f:d=>pct(indicatorForDoc(d,'roi')),e:'Rendimento operativo degli asset prima di finanza e imposte.'},
  {l:'Asset turnover',f:d=>ratio(indicatorForDoc(d,'assetTurnover')),e:'Quante volte l’attivo genera ricavi nel periodo.'},
  {l:'Debiti/Equity',f:d=>ratio(indicatorForDoc(d,'debtEquity')),e:'Leva finanziaria: confronta capitale di terzi e capitale proprio.'},
  {l:'Debiti/Ricavi',f:d=>pct(indicatorForDoc(d,'debtRevenue')),e:'Peso dell’indebitamento rispetto alla capacità commerciale.'},
  {l:'Debiti/EBITDA',f:d=>ratio(indicatorForDoc(d,'debtEbitda')),e:'Stima quanti anni di EBITDA servirebbero teoricamente per coprire i debiti.'},
  {l:'Equity/Attivo',f:d=>pct(indicatorForDoc(d,'equityRatio')),e:'Solidità patrimoniale: quota di attivo finanziata con mezzi propri.'},
  {l:'Current ratio',f:d=>ratio(indicatorForDoc(d,'currentRatio')),e:'Copertura dei passivo circolante con attività correnti.'},
  {l:'Quick ratio',f:d=>ratio(indicatorForDoc(d,'quickRatio')),e:'Liquidità potenziale senza considerare il magazzino.'},
  {l:'Cash ratio',f:d=>ratio(indicatorForDoc(d,'cashRatio')),e:'Copertura dei passivo circolante con sola liquidità.'},
  {l:'Personale/Ricavi',f:d=>pct(indicatorForDoc(d,'personnelInc')),e:'Incidenza del personale sul fatturato.'},
  {l:'Servizi/Ricavi',f:d=>pct(indicatorForDoc(d,'servicesInc')),e:'Peso dei servizi esterni sul fatturato.'},
  {l:'Materie/Ricavi',f:d=>pct(indicatorForDoc(d,'materialsInc')),e:'Peso degli acquisti produttivi rispetto alle vendite.'},
  {l:'Ammortamenti/Ricavi',f:d=>pct(indicatorForDoc(d,'depreciationInc')),e:'Peso degli investimenti ammortizzati rispetto ai ricavi.'}
 ];
 t.innerHTML=`<thead><tr><th>Indicatore</th>${docs.map(d=>`<th>${esc(d.company)}</th>`).join('')}<th>Spiegazione</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${r.l}</strong></td>${docs.map(d=>`<td>${r.f(d)}</td>`).join('')}<td class="kpi-explain-cell">${esc(r.e)}</td></tr>`).join('')}</tbody>`;
 if(docs.length<2){n.textContent='Carica almeno due aziende nello stesso periodo per generare il benchmark.';return;}
 const focus=docs.find(d=>d.company===state.selectedCompany)||docs[0],fz=derived(focus),sent=[];for(const peer of docs.filter(d=>d.id!==focus.id)){const pz=derived(peer);const bits=[];if(fz.ebitdaMargin!=null&&pz.ebitdaMargin!=null)bits.push(`EBITDA margin ${pct(fz.ebitdaMargin)} vs ${pct(pz.ebitdaMargin)}`);if(fz.personnelInc!=null&&pz.personnelInc!=null)bits.push(`personale/ricavi ${pct(fz.personnelInc)} vs ${pct(pz.personnelInc)}`);if(fz.debtEquity!=null&&pz.debtEquity!=null)bits.push(`debiti/equity ${ratio(fz.debtEquity)} vs ${ratio(pz.debtEquity)}`);sent.push(bits.length?`<p><strong>${esc(focus.company)} vs ${esc(peer.company)}:</strong> ${bits.join('; ')}.</p>`:`<p><strong>${esc(peer.company)}:</strong> dati insufficienti per un confronto normalizzato affidabile.</p>`);}n.innerHTML=sent.join('')+`<p class="muted-note">Il benchmark descrive differenze nei dati caricati; non attribuisce automaticamente cause gestionali alle differenze osservate.</p>`;
}

function answerQuestion(q){const d=currentDoc();if(!d)return 'Carica e seleziona un bilancio prima di fare l’analisi.';const p=previousDoc(d),x=d.data||{},z=derived(d),s=q.toLowerCase();if(s.includes('redditiv')||s.includes('margine')||s.includes('ebitda')){let r=`Per ${d.company} (${d.period}) l'EBITDA è ${fmt(x.ebitda)} e il margine EBITDA è ${pct(z.ebitdaMargin)}.`;if(p&&x.ebitda!=null&&p.data?.ebitda!=null){const v=variation(x.ebitda,p.data.ebitda);r+=` Rispetto al ${p.period} varia del ${v>=0?'+':''}${v.toFixed(1)}%.`;}return r;}if(s.includes('costi')||s.includes('personale')){const arr=[['personale',z.personnelInc],['servizi',z.servicesInc],['materie prime',z.materialsInc]].filter(([,v])=>v!=null);return arr.length?`Incidenza sui ricavi: ${arr.map(([l,v])=>`${l} ${pct(v)}`).join(', ')}.`:'Il documento non contiene abbastanza dettaglio sui costi per rispondere in modo affidabile.';}if(s.includes('concorrent')||s.includes('benchmark')){const peers=state.docs.filter(x=>x.period===d.period&&x.id!==d.id).filter(x=>derived(x).ebitdaMargin!=null);if(!peers.length||z.ebitdaMargin==null)return 'Non ci sono abbastanza dati comparabili nello stesso periodo.';const avg=peers.reduce((a,x)=>a+derived(x).ebitdaMargin,0)/peers.length;return `EBITDA margin di ${d.company}: ${pct(z.ebitdaMargin)}. Media semplice delle altre aziende caricate con dato disponibile: ${pct(avg)}.`;}if(s.includes('cambiato')||s.includes('variaz')){if(!p)return 'Serve almeno un periodo precedente della stessa azienda.';const candidates=['revenue','ebitda','ebit','netIncome','personnel','services','debt','receivables','inventory'].map(k=>({k,v:variation(x[k],p.data?.[k])})).filter(a=>a.v!=null).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));return candidates.length?`La variazione percentuale più ampia tra le voci confrontabili è ${metricNames[candidates[0].k]}: ${candidates[0].v>=0?'+':''}${candidates[0].v.toFixed(1)}%.`:'Non ci sono abbastanza voci comparabili.';}return `${d.company}, ${d.period}: Ricavi ${fmt(x.revenue)}, EBITDA ${fmt(x.ebitda)}, EBITDA margin ${pct(z.ebitdaMargin)}, EBIT ${fmt(x.ebit)}, utile netto ${fmt(x.netIncome)}, debiti ${fmt(x.debt)}. Quando un dato non è presente nel PDF, lo lascio non disponibile.`;}
function renderChatIntro(){const chat=document.querySelector('#chat');if(!chat.children.length)chat.innerHTML='<div class="bubble ai">Ciao, sono <strong>Ask NOMYRA</strong>. Le risposte usano esclusivamente le voci estratte e gli indicatori calcolati dal bilancio selezionato; non tratto i dati mancanti come zero.</div>';}

function renderReport(){const d=currentDoc(),p=previousDoc(d),c=document.querySelector('#reportContent');document.querySelector('#reportCompany').textContent=d?.company||'—';document.querySelector('#reportPeriod').textContent=d?`Periodo ${d.period}`:'—';if(!d){c.innerHTML='<div class="report-section"><p>Nessun documento selezionato.</p></div>';return;}const z=derived(d),cp=completeness(d);const costRows=[['Costo del personale','personnel'],['Costi per servizi','services'],['Materie prime / merci','rawMaterials'],['Ammortamenti','depreciation']].filter(([,k])=>d.data?.[k]!=null);c.innerHTML=`<section class="report-section"><h2>Executive summary</h2><div class="long-copy">${summaryText(d,p)}</div></section><section class="report-section"><h2>Profilo aziendale</h2><p>${esc(profileContextText(d))}</p><p>Il profilo aziendale aiuta a interpretare i KPI in modo coerente con settore, modello operativo, prezzo medio, struttura del personale e stagionalità.</p></section><section class="report-section"><h2>Indicatori principali</h2><div class="report-kpis"><div class="report-kpi"><span>Ricavi</span><strong>${fmt(d.data?.revenue)}</strong></div><div class="report-kpi"><span>EBITDA</span><strong>${fmt(d.data?.ebitda)}</strong></div><div class="report-kpi"><span>EBITDA margin</span><strong>${pct(z.ebitdaMargin)}</strong></div><div class="report-kpi"><span>EBIT</span><strong>${fmt(d.data?.ebit)}</strong></div><div class="report-kpi"><span>ROE</span><strong>${pct(z.roe)}</strong></div><div class="report-kpi"><span>Debiti / Equity</span><strong>${ratio(z.debtEquity)}</strong></div></div></section><section class="report-section"><h2>Struttura economica</h2>${costRows.length?`<table><tr><th>Voce</th><th>Valore</th><th>% Ricavi</th></tr>${costRows.map(([l,k])=>`<tr><td>${l}</td><td>${fmt(d.data[k])}</td><td>${pct(safeDiv(d.data[k],d.data.revenue))}</td></tr>`).join('')}</table>`:'<p>Dati di costo non sufficientemente dettagliati nel documento.</p>'}</section><section class="report-section"><h2>Qualità e metodologia</h2><p>${cp.found}/${cp.total} voci chiave disponibili; copertura dati ${cp.found}/${cp.total}; affidabilità tecnica estrazione ${d.quality??cp.pct}%.</p><p>Le voci sono lette dal PDF, normalizzate e poi i KPI sono calcolati con formule deterministiche. Un indicatore non viene calcolato se mancano i dati necessari. Le interpretazioni evidenziano relazioni da approfondire e non sostituiscono la verifica contabile professionale.</p></section>`;}



function workspaceCompanies(){
 const fromDocs=state.docs.map(d=>d.company).filter(Boolean);
 const fromProfiles=Object.keys(state.profiles||{}).map(k=>state.docs.find(d=>profileKey(d.company)===k)?.company||k);
 const fromUsers=(state.users||[]).map(u=>u.company).filter(Boolean);
 return unique([...fromDocs,...fromProfiles,...fromUsers]).sort((a,b)=>String(a).localeCompare(String(b)));
}
function rolePermissions(role){
 const map={
  Owner:'Gestisce utenti, aziende, bilanci, report e impostazioni.',
  Admin:'Carica PDF/Excel, completa dati, genera report e modifica profili.',
  Analyst:'Analizza KPI, confronti e produttività; può proporre correzioni.',
  Viewer:'Consulta dashboard e report senza modificare dati.',
  'External Advisor':'Accesso limitato a bilanci e report condivisi.'
 };
 return map[role]||'Permessi personalizzati.';
}
function renderWorkspace(){
 const sum=document.querySelector('#workspaceSummary'), table=document.querySelector('#usersTable'), sel=document.querySelector('#inviteCompany');
 if(!sum||!table)return;
 const companies=workspaceCompanies();
 if(sel){const current=sel.value;sel.innerHTML=(companies.length?companies:['NOMYRA']).map(c=>`<option>${esc(c)}</option>`).join('');if(current&&[...sel.options].some(o=>o.value===current))sel.value=current;}
 const docs=state.docs.length, profiles=Object.keys(state.profiles||{}).length, sales=state.productivity.length;
 const owner=(state.users||[]).find(u=>u.email===state.workspace?.currentUser)||state.users?.[0];
 sum.innerHTML=`<div class="workspace-metrics"><div><span>Utente attivo</span><strong>${esc(owner?.name||'Demo')}</strong><small>${esc(owner?.role||'Owner')} · ${esc(owner?.email||'owner@nomyra.local')}</small></div><div><span>Aziende</span><strong>${companies.length}</strong><small>${profiles} profili compilati</small></div><div><span>Bilanci</span><strong>${docs}</strong><small>${sales} file vendite collegati</small></div></div><p class="workspace-note">Ogni cliente deve avere un workspace separato. In produzione, i dati non resteranno nel browser: PDF, Excel e report saranno salvati in storage privato con policy per tenant.</p>`;
 if(!state.users?.length){table.innerHTML='<tr><td colspan="5" class="empty-state">Nessun utente configurato.</td></tr>';return;}
 table.innerHTML=(state.users||[]).map(u=>`<tr><td><strong>${esc(u.name||'—')}</strong><br><small>${esc(u.email||'—')}</small></td><td>${esc(u.company||'—')}</td><td><span class="role-pill role-${esc(String(u.role||'').toLowerCase().replace(/\s+/g,'-'))}">${esc(u.role||'Viewer')}</span></td><td class="permissions-cell">${esc(rolePermissions(u.role))}</td><td><button class="mini-btn" data-set-user="${esc(u.email)}">Usa demo</button> <button class="mini-btn danger" data-delete-user="${esc(u.id)}">Rimuovi</button></td></tr>`).join('');
}

function renderHome(){
 const el=document.querySelector('#homeRecentDocs');if(!el)return;
 const docs=state.docs.slice().sort((a,b)=>String(b.period).localeCompare(String(a.period))).slice(0,4);
 if(!docs.length){el.className='home-recent empty-state';el.textContent='Nessun documento caricato. Puoi iniziare da uno dei tre moduli qui sopra.';return;}
 el.className='home-recent';
 el.innerHTML=docs.map(d=>`<button class="recent-doc" data-home-doc="${d.id}"><span><strong>${esc(d.company)}</strong><small>${esc(d.period)} · ${esc(d.type||'Bilancio')}</small></span><b>${completeness(d).found}/${completeness(d).total}</b></button>`).join('');
 el.querySelectorAll('[data-home-doc]').forEach(b=>b.onclick=()=>{const d=state.docs.find(x=>x.id===b.dataset.homeDoc);if(!d)return;state.selectedCompany=d.company;state.selectedPeriod=d.period;renderAll();showView('overview','Analisi singola');});
}

function standaloneDerived(doc,previous=null){return derivedIndicators(doc,previous);}
function comparisonCellDiff(a,b,kind,mode){
 if(a==null||b==null||!Number.isFinite(Number(a))||!Number.isFinite(Number(b)))return '—';
 if(kind==='pct')return `${b-a>=0?'+':''}${(b-a).toLocaleString('it-IT',{maximumFractionDigits:1})} p.p.`;
 if(kind==='ratio')return `${b-a>=0?'+':''}${(b-a).toLocaleString('it-IT',{maximumFractionDigits:2})}x`;
 if(mode==='periods'){const v=variation(b,a);return v==null?'—':`${v>=0?'+':''}${v.toLocaleString('it-IT',{maximumFractionDigits:1})}%`;}
 return `${b-a>=0?'+':''}${fmt(b-a)}`;
}
function comparisonReading(r,a,b,mode){
 if(r.a==null||r.b==null||!Number.isFinite(Number(r.a))||!Number.isFinite(Number(r.b)))return 'Non confrontabile: almeno uno dei due documenti non contiene la base di calcolo.';
 const diff=Number(r.b)-Number(r.a);
 if(r.l==='EBITDA margin')return `Il margine passa da ${pct(r.a)} a ${pct(r.b)}: ${diff>=0?'migliora':'peggiora'} di ${Math.abs(diff).toLocaleString('it-IT',{maximumFractionDigits:1})} punti percentuali.`;
 if(r.l==='Personale / Ricavi'||r.l==='Materie prime / merci'||r.l==='Costi per servizi')return mode==='periods'?`Il valore ${diff>=0?'aumenta':'diminuisce'} rispetto al periodo A. Va confrontato con la crescita dei ricavi.`:'Differenza utile per capire diversa struttura dei costi tra le due aziende.';
 if(r.l==='Debiti / Equity')return `La leva passa da ${ratio(r.a)} a ${ratio(r.b)}. ${r.b>2?'Valore B elevato da approfondire.':'Confrontare con cassa e marginalità.'}`;
 if(r.l==='Current ratio')return `Copertura corrente: ${ratio(r.a)} vs ${ratio(r.b)}. ${r.b<1?'Valore B sotto 1: possibile tensione di breve.':'Valore B sopra 1: copertura positiva.'}`;
 if(r.k==='money')return mode==='periods'?`Variazione assoluta ${diff>=0?'+':''}${fmt(diff)}; la variazione percentuale è mostrata nella colonna scostamento.`:'Il valore assoluto risente della diversa dimensione; leggere anche gli indicatori percentuali.';
 return `Scostamento ${diff>=0?'+':''}${diff.toLocaleString('it-IT',{maximumFractionDigits:1})}${r.k==='pct'?' p.p.':r.k==='ratio'?'x':''}.`;
}
function buildComparisonAlerts(a,b,mode){
 const za=derivedIndicators(a,null),zb=derivedIndicators(b,mode==='periods'?a:null),out=[];
 const push=(title,txt)=>out.push(`<div class="alert-item"><strong>${esc(title)}</strong><br><span>${esc(txt)}</span></div>`);
 if(b.data?.ebitda!=null&&b.data.ebitda<0)push('EBITDA negativo',`${b.company} presenta MOL negativo (${fmt(b.data.ebitda)}): i costi operativi monetari superano il valore prodotto.`);
 if(zb.ebitdaMargin!=null&&zb.ebitdaMargin<0)push('Marginalità operativa negativa',`${b.company} perde circa ${Math.abs(zb.ebitdaMargin).toLocaleString('it-IT',{maximumFractionDigits:1})} € ogni 100 € di ricavi a livello EBITDA.`);
 if(zb.currentRatio!=null&&zb.currentRatio<1)push('Current ratio sotto 1',`${b.company}: ${ratio(zb.currentRatio)}. Possibile tensione finanziaria di breve periodo.`);
 if(zb.debtEquity!=null&&zb.debtEquity>2)push('Leva finanziaria elevata',`${b.company}: Debiti/Equity ${ratio(zb.debtEquity)}.`);
 if(mode==='periods'){
  const rv=variation(b.data?.revenue,a.data?.revenue),cv=variation(b.data?.personnel,a.data?.personnel),sv=variation(b.data?.services,a.data?.services),dv=variation(b.data?.debt,a.data?.debt);
  if(rv!=null&&cv!=null&&cv>rv+8)push('Personale cresce più dei ricavi',`Personale ${cv>=0?'+':''}${cv.toFixed(1)}% vs ricavi ${rv>=0?'+':''}${rv.toFixed(1)}%.`);
  if(rv!=null&&sv!=null&&sv>rv+8)push('Servizi crescono più dei ricavi',`Servizi ${sv>=0?'+':''}${sv.toFixed(1)}% vs ricavi ${rv>=0?'+':''}${rv.toFixed(1)}%.`);
  if(rv!=null&&dv!=null&&dv>rv+10)push('Debiti crescono più dei ricavi',`Debiti ${dv>=0?'+':''}${dv.toFixed(1)}% vs ricavi ${rv>=0?'+':''}${rv.toFixed(1)}%.`);
 }
 if(za.ebitdaMargin!=null&&zb.ebitdaMargin!=null&&zb.ebitdaMargin<za.ebitdaMargin-5)push('Margine in peggioramento',`EBITDA margin: ${pct(za.ebitdaMargin)} → ${pct(zb.ebitdaMargin)}.`);
 return out.slice(0,8);
}
function renderDirectComparison(){
 if(!state.lastComparison)return;
 const {mode,aId,bId}=state.lastComparison,a=state.docs.find(d=>d.id===aId),b=state.docs.find(d=>d.id===bId);if(!a||!b)return;
 const prevB=mode==='periods'?a:null,za=standaloneDerived(a,null),zb=standaloneDerived(b,prevB);
 document.querySelector('#comparisonEyebrow').textContent=mode==='periods'?'CONFRONTO TEMPORALE':'BENCHMARK COMPARATIVO';
 document.querySelector('#comparisonTitle').textContent=mode==='periods'?`${a.company}: ${a.period} vs ${b.period}`:`${a.company} vs ${b.company}`;
 document.querySelector('#comparisonSubtitle').textContent=mode==='periods'?'I due bilanci della stessa azienda sono stati letti separatamente e poi confrontati voce per voce.':'I due bilanci sono stati letti separatamente; il confronto combina valori assoluti e indicatori normalizzati.';
 const ident=document.querySelector('#comparisonIdentity');
 ident.innerHTML=`<article class="identity-card"><span>DOCUMENTO A</span><h3>${esc(a.company)}</h3><strong>${esc(a.period)}</strong><small>${esc(a.name)} · stato dati ${dataCoverage(a).found}/${dataCoverage(a).total}</small><button class="mini-btn" data-direct-details="${a.id}">Verifica dati</button></article><div class="identity-vs">VS</div><article class="identity-card"><span>DOCUMENTO B</span><h3>${esc(b.company)}</h3><strong>${esc(b.period)}</strong><small>${esc(b.name)} · stato dati ${dataCoverage(b).found}/${dataCoverage(b).total}</small><button class="mini-btn" data-direct-details="${b.id}">Verifica dati</button></article>`;
 ident.querySelectorAll('[data-direct-details]').forEach(btn=>btn.onclick=()=>openDetails(btn.dataset.directDetails));
 const rows=[
  {l:'Ricavi',a:a.data?.revenue,b:b.data?.revenue,f:fmt,k:'money'},
  {l:'Valore della produzione',a:a.data?.productionValue,b:b.data?.productionValue,f:fmt,k:'money'},
  {l:'EBITDA / MOL',a:a.data?.ebitda,b:b.data?.ebitda,f:fmt,k:'money'},
  {l:'EBITDA margin',a:za.ebitdaMargin,b:zb.ebitdaMargin,f:pct,k:'pct'},
  {l:'EBIT',a:a.data?.ebit,b:b.data?.ebit,f:fmt,k:'money'},
  {l:'EBIT margin / ROS',a:za.ebitMargin,b:zb.ebitMargin,f:pct,k:'pct'},
  {l:'Utile netto',a:a.data?.netIncome,b:b.data?.netIncome,f:fmt,k:'money'},
  {l:'Costo del personale',a:a.data?.personnel,b:b.data?.personnel,f:fmt,k:'money'},
  {l:'Personale / Ricavi',a:za.personnelInc,b:zb.personnelInc,f:pct,k:'pct'},
  {l:'Costi per servizi',a:a.data?.services,b:b.data?.services,f:fmt,k:'money'},
  {l:'Materie prime / merci',a:a.data?.rawMaterials,b:b.data?.rawMaterials,f:fmt,k:'money'},
  {l:'Patrimonio netto',a:a.data?.equity,b:b.data?.equity,f:fmt,k:'money'},
  {l:'Debiti',a:a.data?.debt,b:b.data?.debt,f:fmt,k:'money'},
  {l:'Debiti / Equity',a:za.debtEquity,b:zb.debtEquity,f:ratio,k:'ratio'},
  {l:'Current ratio',a:za.currentRatio,b:zb.currentRatio,f:ratio,k:'ratio'}
 ];
 const t=document.querySelector('#directComparisonTable');
 const diffTitle=mode==='periods'?'Variazione':'Scostamento B − A';
 t.innerHTML=`<thead><tr><th>Indicatore</th><th>${esc(a.company)} · ${esc(a.period)}</th><th>${esc(b.company)} · ${esc(b.period)}</th><th>${diffTitle}</th><th>Lettura</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${r.l}</strong></td><td>${r.f(r.a)}</td><td>${r.f(r.b)}</td><td>${comparisonCellDiff(r.a,r.b,r.k,mode)}</td><td class="kpi-explain-cell">${esc(comparisonReading(r,a,b,mode))}</td></tr>`).join('')}</tbody>`;
 const narratives=[];
 if(mode==='periods'){
  const candidates=[['Ricavi',a.data?.revenue,b.data?.revenue],['EBITDA',a.data?.ebitda,b.data?.ebitda],['EBIT',a.data?.ebit,b.data?.ebit],['Costo del personale',a.data?.personnel,b.data?.personnel],['Costi per servizi',a.data?.services,b.data?.services],['Debiti',a.data?.debt,b.data?.debt]].map(([l,x,y])=>({l,v:variation(y,x)})).filter(x=>x.v!=null).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v));
  if(candidates.length)narratives.push(`<p>Tra il ${esc(a.period)} e il ${esc(b.period)}, la variazione percentuale più ampia tra le principali voci confrontabili riguarda <strong>${candidates[0].l}</strong>: ${candidates[0].v>=0?'+':''}${candidates[0].v.toFixed(1)}%.</p>`);
  if(za.ebitdaMargin!=null&&zb.ebitdaMargin!=null)narratives.push(`<p>La marginalità EBITDA passa dal <strong>${pct(za.ebitdaMargin)}</strong> al <strong>${pct(zb.ebitdaMargin)}</strong>, una differenza di ${(zb.ebitdaMargin-za.ebitdaMargin)>=0?'+':''}${(zb.ebitdaMargin-za.ebitdaMargin).toFixed(1)} punti percentuali.</p>`);
  if(za.personnelInc!=null&&zb.personnelInc!=null)narratives.push(`<p>L'incidenza del costo del personale sui ricavi passa dal ${pct(za.personnelInc)} al ${pct(zb.personnelInc)}.</p>`);
 }else{
  if(a.data?.revenue!=null&&b.data?.revenue!=null)narratives.push(`<p>I ricavi rilevati sono <strong>${fmt(a.data.revenue)}</strong> per ${esc(a.company)} e <strong>${fmt(b.data.revenue)}</strong> per ${esc(b.company)}. I valori assoluti descrivono anche la diversa dimensione delle imprese.</p>`);
  if(za.ebitdaMargin!=null&&zb.ebitdaMargin!=null)narratives.push(`<p>L'EBITDA margin è ${pct(za.ebitdaMargin)} per ${esc(a.company)} e ${pct(zb.ebitdaMargin)} per ${esc(b.company)}: il confronto percentuale consente una lettura meno influenzata dalla dimensione.</p>`);
  if(za.personnelInc!=null&&zb.personnelInc!=null)narratives.push(`<p>Il costo del personale incide sui ricavi per ${pct(za.personnelInc)} e ${pct(zb.personnelInc)} rispettivamente.</p>`);
  if(za.debtEquity!=null&&zb.debtEquity!=null)narratives.push(`<p>Il rapporto Debiti/Equity è ${ratio(za.debtEquity)} per ${esc(a.company)} e ${ratio(zb.debtEquity)} per ${esc(b.company)}.</p>`);
 }
 document.querySelector('#directComparisonNarrative').innerHTML=narratives.length?narratives.join(''):'<p>Le voci comuni disponibili non sono ancora sufficienti per una lettura comparativa approfondita. Verifica l’estrazione dei due documenti.</p>';
 const ca=dataCoverage(a),cb=dataCoverage(b),common=['revenue','ebitda','ebit','netIncome','equity','debt','currentAssets','personnel','services','rawMaterials'].filter(k=>a.data?.[k]!=null&&b.data?.[k]!=null).length;
 document.querySelector('#directComparisonQuality').innerHTML=`<div class="quality-row"><span>${esc(a.company)}</span><strong>${ca.found}/${ca.total}</strong><small>${esc(ca.state)} · ${ca.verified} confermate</small></div><div class="quality-row"><span>${esc(b.company)}</span><strong>${cb.found}/${cb.total}</strong><small>${esc(cb.state)} · ${cb.verified} confermate</small></div><div class="quality-row common"><span>Voci principali comuni</span><strong>${common}/10</strong><small>Solo i dati presenti in entrambi i bilanci vengono confrontati.</small></div>`;
 const cmpAlerts=buildComparisonAlerts(a,b,mode);const cmpEl=document.querySelector('#directComparisonAlerts');if(cmpEl){cmpEl.className=cmpAlerts.length?'alerts-list':'alerts-list empty-state';cmpEl.innerHTML=cmpAlerts.length?cmpAlerts.join(''):'Nessun alert comparativo con i dati disponibili.';}
}


function uniqueCompanies(){return [...new Set([...state.docs.map(d=>d.company),...Object.keys(state.profiles||{}).map(k=>state.docs.find(d=>profileKey(d.company)===k)?.company||k)].filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
function renderCompanies(){
 const tb=document.querySelector('#companiesTable');if(!tb)return;const companies=uniqueCompanies();
 if(!companies.length){tb.innerHTML='<tr><td colspan="5" class="empty-state">Nessuna azienda ancora presente. Carica un bilancio o importa un file vendite.</td></tr>';return;}
 tb.innerHTML=companies.map(c=>{const p=getCompanyProfile(c),pc=profileCompleteness(p),docs=state.docs.filter(d=>profileKey(d.company)===profileKey(c)),sales=state.productivity.filter(x=>profileKey(x.company)===profileKey(c));return `<tr><td><strong>${esc(c)}</strong></td><td><strong>${esc(pc.label)}</strong><br><small>${esc(profileContextText({company:c,profile:p}))}</small></td><td>${docs.length}</td><td>${sales.length} file</td><td><button class="mini-btn primary-mini" data-company-profile="${esc(c)}">Profilo azienda</button> <button class="mini-btn" data-company-open="${esc(c)}">Apri analisi</button></td></tr>`;}).join('');
 tb.onclick=e=>{if(e.target.dataset.companyProfile){openProfile(e.target.dataset.companyProfile);return;}if(e.target.dataset.companyOpen){state.selectedCompany=e.target.dataset.companyOpen;state.selectedPeriod='';renderAll();showView('overview','Analisi singola');}};
}
function normalizeHeader(s=''){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function findHeader(headers,patterns){const norm=headers.map(h=>[h,normalizeHeader(h)]);return norm.find(([,n])=>patterns.some(p=>n.includes(p)))?.[0]||null;}
function parseAmount(v){return parseProfileNumber(v);}
function aggregateRows(rows,key){const m=new Map();rows.forEach(r=>{const k=(r[key]||'Non specificato').toString().trim()||'Non specificato';m.set(k,(m.get(k)||0)+(r.revenue||0));});return [...m.entries()].map(([name,revenue])=>({name,revenue})).sort((a,b)=>b.revenue-a.revenue);}
async function readSalesFile(file){
 if(!window.XLSX)throw new Error('XLSX_MISSING');
 const data=await file.arrayBuffer();const wb=window.XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return window.XLSX.utils.sheet_to_json(ws,{defval:''});
}
function analyzeSalesRows(rawRows){
 if(!rawRows.length)throw new Error('EMPTY_SALES');const headers=Object.keys(rawRows[0]||{});
 const hCustomer=findHeader(headers,['cliente','customer','ragione sociale','nominativo','clienti']);
 const hProduct=findHeader(headers,['prodotto','articolo','descrizione','sku','item','referenza']);
 const hQty=findHeader(headers,['quantita','qta','qty','pezzi','unita','pz']);
 const hPrice=findHeader(headers,['prezzo unitario','prezzo','price','unitario']);
 const hRevenue=findHeader(headers,['fatturato','ricavo','totale','importo','valore','imponibile','prezzo totale']);
 const rows=rawRows.map(r=>{const qty=parseAmount(r[hQty]),price=parseAmount(r[hPrice]);let revenue=parseAmount(r[hRevenue]);if((revenue==null||revenue===0)&&qty!=null&&price!=null)revenue=qty*price;return {customer:hCustomer?String(r[hCustomer]||'').trim():'',product:hProduct?String(r[hProduct]||'').trim():'',qty,unitPrice:price,revenue};}).filter(r=>r.revenue!=null&&Number.isFinite(r.revenue)&&Math.abs(r.revenue)>0);
 if(!rows.length)throw new Error('NO_REVENUE_COL');
 const totalRevenue=rows.reduce((a,r)=>a+r.revenue,0),totalQty=rows.reduce((a,r)=>a+(r.qty||0),0);
 const customers=aggregateRows(rows,'customer'),products=aggregateRows(rows,'product');
 return {rowsCount:rows.length,totalRevenue,totalQty,avgUnitPrice:totalQty?totalRevenue/totalQty:null,uniqueCustomers:customers.length,uniqueProducts:products.length,avgRevenuePerCustomer:customers.length?totalRevenue/customers.length:null,topCustomerShare:customers[0]?customers[0].revenue/totalRevenue*100:null,topProductShare:products[0]?products[0].revenue/totalRevenue*100:null,topCustomers:customers.slice(0,10),topProducts:products.slice(0,10),headers:{customer:hCustomer,product:hProduct,quantity:hQty,price:hPrice,revenue:hRevenue}};
}
function currentProductivity(){const c=state.selectedCompany;const p=state.selectedPeriod;return state.productivity.find(x=>profileKey(x.company)===profileKey(c)&&String(x.period)===String(p))||state.productivity.filter(x=>profileKey(x.company)===profileKey(c)).at(-1)||state.productivity.at(-1)||null;}
function renderProductivity(){
 const companySel=document.querySelector('#prodCompany');if(!companySel)return;const companies=uniqueCompanies();companySel.innerHTML=companies.length?companies.map(c=>`<option>${esc(c)}</option>`).join(''):'<option></option>';if(state.selectedCompany&&companies.includes(state.selectedCompany))companySel.value=state.selectedCompany;document.querySelector('#prodPeriod').value=state.selectedPeriod||document.querySelector('#prodPeriod').value||'';
 const p=currentProductivity(),metrics=document.querySelector('#productivityMetrics'),rec=document.querySelector('#productivityReconciliation'),tc=document.querySelector('#topCustomersTable'),tp=document.querySelector('#topProductsTable');
 if(!p){metrics.innerHTML='';rec.className='productivity-reconciliation empty-state';rec.textContent='Carica un file vendite per confrontare dati commerciali e bilancio.';tc.innerHTML='<tr><td class="empty-state">Nessun file vendite.</td></tr>';tp.innerHTML='<tr><td class="empty-state">Nessun file vendite.</td></tr>';return;}
 const m=p.metrics;metrics.innerHTML=[['Fatturato vendite',fmt(m.totalRevenue)],['Clienti',num(m.uniqueCustomers)],['Prodotti',num(m.uniqueProducts)],['Prezzo medio ponderato',fmt(m.avgUnitPrice)],['Fatturato medio / cliente',fmt(m.avgRevenuePerCustomer)],['Concentrazione top cliente',pct(m.topCustomerShare)]].map(([l,v])=>`<div class="kpi-card"><div class="label">${esc(l)}</div><div class="value">${v}</div></div>`).join('');
 const bil=state.docs.find(d=>profileKey(d.company)===profileKey(p.company)&&String(d.period)===String(p.period));
 if(bil?.data?.revenue!=null){const diff=m.totalRevenue-bil.data.revenue;const diffPct=variation(m.totalRevenue,bil.data.revenue);rec.className='productivity-reconciliation';rec.innerHTML=`<strong>${esc(p.company)} · ${esc(p.period)}</strong><p>Vendite da Excel: <b>${fmt(m.totalRevenue)}</b><br>Ricavi da bilancio: <b>${fmt(bil.data.revenue)}</b></p><p>Scostamento: <b>${fmt(diff)}</b> (${diffPct==null?'—':(diffPct>=0?'+':'')+diffPct.toLocaleString('it-IT',{maximumFractionDigits:1})+'%'})</p><small>Questo controllo aiuta a capire se il file vendite rappresenta tutto il fatturato o solo una parte del perimetro commerciale.</small>`;}else{rec.className='productivity-reconciliation';rec.innerHTML=`<strong>${esc(p.company)} · ${esc(p.period)}</strong><p>Fatturato vendite da Excel: <b>${fmt(m.totalRevenue)}</b>.</p><small>Carica o completa il bilancio dello stesso periodo per confrontarlo con i ricavi contabili.</small>`;}
 const rowTable=arr=>`<thead><tr><th>Voce</th><th>Fatturato</th><th>% totale</th></tr></thead><tbody>${arr.map(x=>`<tr><td>${esc(x.name)}</td><td>${fmt(x.revenue)}</td><td>${pct(x.revenue/m.totalRevenue*100)}</td></tr>`).join('')}</tbody>`;
 tc.innerHTML=rowTable(m.topCustomers);tp.innerHTML=rowTable(m.topProducts);
}
async function handleProductivityUpload(){
 const company=document.querySelector('#prodCompany')?.value.trim()||state.selectedCompany,period=document.querySelector('#prodPeriod')?.value.trim()||state.selectedPeriod,file=document.querySelector('#prodFile')?.files?.[0],status=document.querySelector('#productivityStatus');
 if(!company||!period||!file){status.className='provider-result empty-state';status.textContent='Seleziona azienda, periodo e file Excel/CSV.';return;}
 try{status.className='provider-result';status.textContent='Lettura file vendite…';const rows=await readSalesFile(file);const metrics=analyzeSalesRows(rows);const record={id:'s'+Date.now(),company,period,fileName:file.name,createdAt:new Date().toISOString(),metrics};state.productivity=state.productivity.filter(x=>!(profileKey(x.company)===profileKey(company)&&String(x.period)===String(period)));state.productivity.push(record);state.selectedCompany=company;state.selectedPeriod=period;save();cloudSaveProductivity(record,file).catch(console.warn);renderAll();status.innerHTML=`<strong>Analisi vendite completata</strong><p>${metrics.rowsCount} righe lette · ${num(metrics.uniqueCustomers)} clienti · ${num(metrics.uniqueProducts)} prodotti · fatturato ${fmt(metrics.totalRevenue)}.</p><small>Colonne riconosciute: cliente ${metrics.headers.customer||'—'}, prodotto ${metrics.headers.product||'—'}, quantità ${metrics.headers.quantity||'—'}, prezzo ${metrics.headers.price||'—'}, fatturato ${metrics.headers.revenue||'—'}.</small>`;}catch(err){console.error(err);status.className='provider-result empty-state';status.textContent=err.message==='XLSX_MISSING'?'Impossibile caricare il lettore Excel dal CDN. Riprovare online o usare CSV in una versione server.':err.message==='NO_REVENUE_COL'?'Non ho trovato una colonna fatturato/importo/totale né quantità × prezzo. Controlla le intestazioni del file.':'Non è stato possibile leggere il file vendite.';}
}

function renderAll(){populateFilters();renderHome();renderOverview();renderDocuments();renderCompanies();renderWorkspace();renderProductivity();renderHistory();renderBenchmark();renderChatIntro();renderReport();if(state.lastComparison)renderDirectComparison();}


// Data verification modal
const detailsModal=document.querySelector('#detailsModal');
function openDetails(id){
 const d=state.docs.find(x=>x.id===id);if(!d)return;
 document.querySelector('#detailsTitle').textContent=`${d.company} · ${d.period}`;
 const body=document.querySelector('#detailsBody'),keys=[...new Set([...Object.keys(d.data||{}),...Object.keys(d.sources||{})])].filter(k=>d.data?.[k]!=null);
 const parser=d.parser||{};
 const parserCard=`<div class="verify-row parser-row"><div><strong>Profilo documento</strong><span>Motore ${esc(d.engineVersion||parser.version||'—')} · ${esc(d.type||parser.kind||'—')}</span></div><div class="verify-value">${dataCoverage(d).label}</div><div><div class="source-line">${esc((parser.hints||[]).join(' · ')||'Tassonomia NOMYRA universale')}</div><div class="source-line">Righe conto riconosciute: ${parser.accountRows??'—'} · Top level CE: ${parser.recognizedTopLevel??'—'}</div></div></div>`;
 const rows=keys.length?keys.map(k=>{
  const s=d.sources?.[k],method=s?.method==='manual_override'?'Corretto manualmente':s?.method==='user_confirmed'?'Confermato dall’utente':s?.method==='calculated'?`Calcolato: ${s.formula||''}`:s?.method==='classified_sum'?'Somma conti classificati':s?.method==='sum'?'Somma voci':'Letto dal PDF';
  const src=s?.items?.length?s.items.slice(0,4).map(i=>`<div class="source-line">p.${i.page} · ${esc(i.line)}</div>`).join(''):(s?.deps?.length?`<div class="source-line">Deriva da: ${s.deps.map(x=>metricNames[x]||x).join(', ')}</div>`:'<div class="source-line">Dato demo / fonte non registrata</div>');
  const extra=(d.candidates?.[k]?.length>1)?`<details class="candidate-details"><summary>Altri valori candidati</summary>${d.candidates[k].slice(1,4).map(i=>`<div class="source-line">p.${i.page} · ${esc(i.line)}</div>`).join('')}</details>`:'';
  return `<div class="verify-row"><div><strong>${metricNames[k]||k}</strong><span>${esc(method)}${s?.confidence?` · conf. ${s.confidence}%`:''}</span></div><div class="verify-value">${fmt(d.data[k])}</div><div>${src}${extra}</div></div>`;
 }).join(''):'<div class="empty-state">Nessuna voce economico-finanziaria riconosciuta. Se il PDF è scansionato serve OCR/vision lato server.</div>';
 body.innerHTML=parserCard+rows;
 const val=document.querySelector('#validationBox');
 const legacy=d.needsReanalysis?'<div class="validation bad"><strong>! Documento da rianalizzare</strong><span>È stato importato con il vecchio motore. Ricarica il PDF per ottenere fonti, quadrature e KPI affidabili.</span></div>':'';
 val.innerHTML=legacy+(d.validations?.length?d.validations.map(v=>`<div class="validation ${v.ok?'ok':'bad'}"><strong>${v.ok?'✓':'!'} ${esc(v.label)}</strong><span>${esc(v.detail||'')}</span></div>`).join(''):'<div class="validation ok"><strong>✓ Nessuna incoerenza automatica rilevata</strong><span>I controlli disponibili dipendono dalle voci presenti.</span></div>');
 detailsModal.classList.add('open');detailsModal.setAttribute('aria-hidden','false');
}
const closeDetails=()=>{detailsModal.classList.remove('open');detailsModal.setAttribute('aria-hidden','true');};document.querySelector('#closeDetails').onclick=closeDetails;


// Company profile modal
const profileModal=document.querySelector('#profileModal');
let activeProfileCompany=null;
function setProfileField(sel,val){const el=document.querySelector(sel);if(el)el.value=val??'';}
function readProfileFields(){return normalizeProfile({sector:document.querySelector('#profileSector')?.value,businessModel:document.querySelector('#profileBusinessModel')?.value,customerType:document.querySelector('#profileCustomerType')?.value,avgProductPrice:document.querySelector('#profileAvgProductPrice')?.value,avgOrderValue:document.querySelector('#profileAvgOrderValue')?.value,annualUnits:document.querySelector('#profileAnnualUnits')?.value,employees:document.querySelector('#profileEmployees')?.value,plants:document.querySelector('#profilePlants')?.value,exportShare:document.querySelector('#profileExportShare')?.value,seasonality:document.querySelector('#profileSeasonality')?.value,notes:document.querySelector('#profileNotes')?.value});}
function openProfile(target){
 const d=state.docs.find(x=>x.id===target);const company=d?d.company:target;if(!company||!profileModal)return;activeProfileCompany=company;
 document.querySelector('#profileTitle').textContent=company;
 const p=getCompanyProfile(company);
 setProfileField('#profileSector',p.sector);setProfileField('#profileBusinessModel',p.businessModel);setProfileField('#profileCustomerType',p.customerType);setProfileField('#profileAvgProductPrice',p.avgProductPrice??'');setProfileField('#profileAvgOrderValue',p.avgOrderValue??'');setProfileField('#profileAnnualUnits',p.annualUnits??'');setProfileField('#profileEmployees',p.employees??'');setProfileField('#profilePlants',p.plants);setProfileField('#profileExportShare',p.exportShare??'');setProfileField('#profileSeasonality',p.seasonality);setProfileField('#profileNotes',p.notes);
 const pc=profileCompleteness(p),docCount=state.docs.filter(x=>profileKey(x.company)===profileKey(company)).length;
 document.querySelector('#profileSummary').innerHTML=`<strong>${esc(pc.label)}</strong><span>${esc(profileContextText({company,profile:p}))}</span><small>Questo profilo verrà applicato a ${docCount} bilancio/i già caricati e a tutti i prossimi documenti della stessa azienda.</small>`;
 profileModal.classList.add('open');profileModal.setAttribute('aria-hidden','false');
}
function closeProfile(){if(!profileModal)return;profileModal.classList.remove('open');profileModal.setAttribute('aria-hidden','true');activeProfileCompany=null;}
document.querySelector('#closeProfile')?.addEventListener('click',closeProfile);document.querySelector('#cancelProfile')?.addEventListener('click',closeProfile);
if(document.querySelector('#saveProfile'))document.querySelector('#saveProfile').onclick=()=>{if(!activeProfileCompany)return;const profile=readProfileFields();setCompanyProfile(activeProfileCompany,profile);save();ensureCompany(activeProfileCompany,profile).catch(console.warn);renderAll();closeProfile();showView('companies','Aziende');};

// Guided review / manual validation modal
const reviewModal=document.querySelector('#reviewModal');
let activeReviewId=null;
const reviewGroups=[
 ['Economico',['revenue','productionValue','ebitda','ebit','netIncome']],
 ['Costi',['rawMaterials','services','leases','personnel','depreciation','otherOperatingCosts']],
 ['Patrimoniale',['totalAssets','equity','debt','currentAssets','currentLiabilities','cash','receivables','inventory']]
];
function inputValueFor(n){return n==null||!Number.isFinite(Number(n))?'':Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});}
function sourceBadge(doc,k){const s=doc?.sources?.[k];if(!doc?.data||doc.data[k]==null)return '<span class="review-badge missing">Mancante</span>';
 if(s?.method==='manual_override')return '<span class="review-badge manual">Corretto manualmente</span>';
 if(s?.method==='user_confirmed')return '<span class="review-badge confirmed">Confermato</span>';
 if(s?.method==='calculated')return '<span class="review-badge calculated">Calcolato</span>';
 return '<span class="review-badge auto">Automatico da verificare</span>';}
function reviewFormulaBlock(doc,k){
 const s=doc?.sources?.[k];
 const composite={
  currentAssets:['inventory','receivables','otherCredits','cash','activeTaxCredits','prepaidAssets'],
  currentLiabilities:['tradePayables','taxPayables','socialSecurityPayables','otherPayables','accruedLiabilities'],
  equity:['capitalReserves','profitCarryForward','lossCarryForward','netIncome']
 };
 const keys=composite[k]||s?.deps||[];
 if(!s?.formula&&!keys.length)return '';
 const parts=keys.map(dep=>{
  const sign=(k==='equity'&&dep==='lossCarryForward')?'−':'+';
  const val=doc?.data?.[dep];
  const ok=val!=null&&Number.isFinite(Number(val));
  return `<span class="formula-chip ${ok?'':'missing'}"><b>${esc(metricNames[dep]||dep)}</b> ${ok?formatMetricValue(dep,val):'manca'}${dep==='lossCarryForward'?' da sottrarre':''}</span>`;
 }).join('');
 return `<div class="review-formula"><strong>Formula guida</strong><small>${esc(s?.formula||'Somma delle voci collegate')}</small>${parts?`<div class="formula-chips">${parts}</div>`:''}</div>`;
}
function reviewSourceText(doc,k){
 const s=doc?.sources?.[k];
 if(s?.formula)return `<small>${esc(s.formula)}</small>`;
 if(s?.items?.[0]?.line)return `<small>${esc(s.items[0].line)}</small>`;
 return '<small>Fonte non registrata o dato non trovato</small>';
}
function openReview(id){
 const d=state.docs.find(x=>x.id===id);if(!d)return;activeReviewId=id;const cov=dataCoverage(d);
 document.querySelector('#reviewTitle').textContent=`${d.company} · ${d.period}`;
 document.querySelector('#reviewSummary').innerHTML=`<strong>${esc(cov.state)}</strong><span>${cov.explain}</span>${cov.missing.length?`<small>Per arrivare a un dataset completo devi confermare/correggere le voci automatiche e completare le voci mancanti.</small>`:'<small>Tutte le voci chiave risultano disponibili. Puoi comunque correggere qualsiasi valore.</small>'}`;
 document.querySelector('#reviewFields').innerHTML=reviewGroups.map(([group,keys])=>`<section class="review-group"><h3>${esc(group)}</h3>${keys.map(k=>{const src=reviewSourceText(d,k);const formula=reviewFormulaBlock(d,k);return `<label class="review-field ${['currentAssets','currentLiabilities','equity'].includes(k)?'composite-field':''}"><span><strong>${esc(metricNames[k]||k)}</strong>${src}${formula}</span><input data-review-key="${k}" value="${inputValueFor(d.data?.[k])}" placeholder="Non disponibile" inputmode="decimal"><em>${sourceBadge(d,k)}</em></label>`;}).join('')}</section>`).join('');
 reviewModal.classList.add('open');reviewModal.setAttribute('aria-hidden','false');
}
function closeReview(){reviewModal.classList.remove('open');reviewModal.setAttribute('aria-hidden','true');activeReviewId=null;}
document.querySelector('#closeReview').onclick=closeReview;document.querySelector('#cancelReview').onclick=closeReview;
document.querySelector('#fillExampleHelp').onclick=()=>{document.querySelector('#reviewSummary').insertAdjacentHTML('beforeend','<small class="inline-help">Puoi copiare i valori dal PDF originale. Usa formato italiano o internazionale: 1.355.379,62 oppure 1355379.62. Lascia vuoto solo se la voce non esiste nel bilancio.</small>');};
document.querySelector('#openDetailsFromReview').onclick=()=>{if(activeReviewId){closeReview();openDetails(activeReviewId);}};
document.querySelector('#saveReview').onclick=()=>{
 const d=state.docs.find(x=>x.id===activeReviewId);if(!d)return;
 const values={};document.querySelectorAll('#reviewFields [data-review-key]').forEach(i=>values[i.dataset.reviewKey]=i.value);
 const updated=applyManualReview(d,values);updated.engineVersion=ENGINE_VERSION;state.docs=state.docs.map(x=>x.id===d.id?updated:x);state.selectedCompany=updated.company;state.selectedPeriod=updated.period;save();cloudSaveDocument(updated).catch(console.warn);renderAll();closeReview();showView('overview','Analisi singola');
};


/* ===========================
   V55 - Fix rimanenze iniziali / conto 72 e formula costi monetari
   =========================== */
(function(){
  function v55TryRecoverOpeningInventory(doc){
    if(!doc||doc.data?.openingInventoryChange!=null)return doc;
    const cands=[...(doc.candidates?.openingInventoryChange||[]),...(doc.sources?.openingInventoryChange?.items||[])];
    const hit=cands.find(x=>x&&x.value!=null&&/(72|rimanenze|rim|iniz)/i.test(String(x.line||x.code||'')));
    if(!hit)return doc;
    doc.data.openingInventoryChange=Number(hit.value);
    doc.sources.openingInventoryChange={method:'direct',confidence:96,items:[hit],note:'Recuperato da candidato conto 72'};
    return doc;
  }
  const __v55RenderAll=renderAll;
  renderAll=function(){
    state.docs=(state.docs||[]).map(d=>v55TryRecoverOpeningInventory(d));
    __v55RenderAll();
  };
})();

// Navigation and actions
function showView(view,title=null){
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 const target=document.querySelector('#'+view);if(target)target.classList.add('active');
 const labels={home:'Dashboard',overview:'Analisi bilancio',documents:'Documenti',companies:'Aziende',benchmark:'Benchmark',productivity:'Produttività',history:'Analisi storica',analysis:'Analisi AI',report:'Report',comparison:'Confronto'};
 document.querySelector('#pageTitle').textContent=title||labels[view]||view;
 document.querySelector('#contextActions').style.display=(view==='home'||view==='comparison')?'none':'flex';
 if(view==='benchmark')renderBenchmark();if(view==='companies')renderCompanies();if(view==='productivity')renderProductivity();if(view==='report')renderReport();if(view==='comparison')renderDirectComparison();if(view==='home')renderHome();
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view,b.textContent.trim()));
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
document.querySelector('#kpiFilters')?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-kpi-filter]');if(!btn)return;
 kpiFilterState.value=btn.dataset.kpiFilter||'all';
 renderKpiLibrary();
});
document.querySelector('#kpiLibrary')?.addEventListener('click',e=>{const btn=e.target.closest('[data-kpi-label]');if(btn)openKpiCalculation(btn.dataset.kpiLabel);});
document.querySelector('#alertsList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-alert-action]');if(btn)runAlertAction(btn.dataset.alertAction);});
document.querySelector('#closeKpiCalc')?.addEventListener('click',closeKpiCalculation);
document.querySelector('#closeKpiCalcBottom')?.addEventListener('click',closeKpiCalculation);
document.querySelector('#openReviewFromKpi')?.addEventListener('click',()=>{const d=currentDoc();closeKpiCalculation();if(d)openReview(d.id);});
document.querySelector('#backHome').onclick=()=>showView('home','Home');
document.querySelector('#companyFilter').onchange=e=>{state.selectedCompany=e.target.value;state.selectedPeriod='';renderAll();};document.querySelector('#periodFilter').onchange=e=>{state.selectedPeriod=e.target.value;renderAll();};document.querySelector('#benchmarkPeriod').onchange=renderBenchmark;document.querySelector('#normalizeToggle').onchange=renderBenchmark;
document.querySelector('#loadDemo').onclick=()=>{state.docs=structuredClone(demo);state.profiles={'teralvia s.r.l.':normalizeProfile({sector:'Manifattura / produzione',businessModel:'Produzione propria',customerType:'B2B',avgProductPrice:'2,40',employees:'12',seasonality:'Media'}),'nordpack s.r.l.':normalizeProfile({sector:'Manifattura / produzione',businessModel:'Produzione propria',customerType:'B2B',employees:'28',seasonality:'Media'}),'aurex industries s.p.a.':normalizeProfile({sector:'Manifattura / produzione',businessModel:'Produzione propria',customerType:'B2B',employees:'22',seasonality:'Bassa'})};state.productivity=[];state.users=[{id:'u1',name:'Andrea / NOMYRA',email:'owner@nomyra.local',company:'NOMYRA',role:'Owner',status:'Demo'},{id:'u2',name:'Direzione Teralvia',email:'direzione@teralvia.local',company:'Teralvia S.r.l.',role:'Admin',status:'Demo'},{id:'u3',name:'Consulente esterno',email:'advisor@studio.local',company:'Teralvia S.r.l.',role:'External Advisor',status:'Demo'}];state.workspace={mode:'demo',currentUser:'owner@nomyra.local'};state.selectedCompany='Teralvia S.r.l.';state.selectedPeriod='2026';state.lastComparison=null;save();renderAll();showView('home','Home');};document.querySelector('#clearData').onclick=()=>{state.docs=[];state.profiles={};state.productivity=[];state.users=defaultUsers;state.workspace={mode:'demo',currentUser:'owner@nomyra.local'};state.selectedCompany='';state.selectedPeriod='';state.lastComparison=null;save();renderAll();showView('home','Home');};
const competitorForm=document.querySelector('#competitorSearchForm');if(competitorForm)competitorForm.onsubmit=e=>{e.preventDefault();const vat=document.querySelector('#competitorVat').value.trim();const year=document.querySelector('#competitorYear').value.trim();const provider=document.querySelector('#competitorProvider').value;const out=document.querySelector('#competitorLookupResult');if(!vat){out.className='provider-result empty-state';out.textContent='Inserisci una Partita IVA o Codice Fiscale per avviare la ricerca.';return;}out.className='provider-result';out.innerHTML=`<strong>Ricerca preparata</strong><p>Partita IVA/C.F.: <b>${esc(vat)}</b> · Anno: <b>${esc(year||'ultimo disponibile')}</b> · Provider: <b>${esc(provider)}</b></p><p>Per il download automatico serve il backend NOMYRA collegato a credenziali/provider autorizzato. In questa demo statica puoi importare manualmente il PDF del concorrente e NOMYRA lo userà nel benchmark.</p><div class="connector-actions"><button class="mini-btn" id="openManualCompetitorUpload">Carica PDF concorrente</button><button class="mini-btn" id="copyEndpoint">Copia endpoint previsto</button></div>`;document.querySelector('#openManualCompetitorUpload').onclick=openUpload;document.querySelector('#copyEndpoint').onclick=()=>navigator.clipboard?.writeText(`/api/company-statements?vat=${encodeURIComponent(vat)}&year=${encodeURIComponent(year||'latest')}`);};
const userInviteForm=document.querySelector('#userInviteForm');
if(userInviteForm)userInviteForm.onsubmit=e=>{e.preventDefault();const name=document.querySelector('#inviteName').value.trim()||'Nuovo utente';const email=document.querySelector('#inviteEmail').value.trim();const company=document.querySelector('#inviteCompany').value.trim()||state.selectedCompany||'NOMYRA';const role=document.querySelector('#inviteRole').value;if(!email){alert('Inserisci email utente.');return;}state.users=(state.users||[]).filter(u=>u.email!==email);state.users.push({id:'usr'+Date.now(),name,email,company,role,status:'Demo'});state.workspace.currentUser=email;save();renderWorkspace();userInviteForm.reset();};
const demoUserBtn=document.querySelector('#workspaceDemoUser');
if(demoUserBtn)demoUserBtn.onclick=()=>{const company=state.selectedCompany||workspaceCompanies()[0]||'Cliente demo';const email=`utente${(state.users||[]).length+1}@cliente.local`;state.users.push({id:'usr'+Date.now(),name:'Utente cliente demo',email,company,role:'Viewer',status:'Demo'});save();renderWorkspace();};
const usersTable=document.querySelector('#usersTable');
if(usersTable)usersTable.onclick=e=>{const t=e.target;if(t.dataset.setUser){state.workspace.currentUser=t.dataset.setUser;save();renderWorkspace();return;}if(t.dataset.deleteUser){state.users=(state.users||[]).filter(u=>u.id!==t.dataset.deleteUser);save();renderWorkspace();return;}};
document.querySelector('#documentsTable').onclick=e=>{const t=e.target;if(t.dataset.review){openReview(t.dataset.review);return;}if(t.dataset.profile){openProfile(t.dataset.profile);return;}if(t.dataset.details){openDetails(t.dataset.details);return;}if(t.dataset.delete){state.docs=state.docs.filter(d=>d.id!==t.dataset.delete);save();renderAll();return;}if(t.dataset.select){const d=state.docs.find(x=>x.id===t.dataset.select);if(!d)return;state.selectedCompany=d.company;state.selectedPeriod=d.period;document.querySelector('.nav-item[data-view="overview"]').click();renderAll();}};
document.querySelector('#askForm').onsubmit=e=>{e.preventDefault();const i=document.querySelector('#askInput'),q=i.value.trim();if(!q)return;const chat=document.querySelector('#chat');chat.insertAdjacentHTML('beforeend',`<div class="bubble user">${esc(q)}</div><div class="bubble ai">${esc(answerQuestion(q))}</div>`);i.value='';chat.scrollTop=chat.scrollHeight;};document.querySelectorAll('.suggestion').forEach(b=>b.onclick=()=>{document.querySelector('#askInput').value=b.textContent;document.querySelector('#askForm').requestSubmit();});document.querySelector('#printReport').onclick=()=>window.print();

// Upload + PDF parsing
const modal=document.querySelector('#uploadModal');const openUpload=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.querySelector('#parseStatus').textContent='';refreshUploadCompanyProfile();};const closeUpload=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};['#openUpload','#openUpload2','#homeSingleUpload'].forEach(s=>document.querySelector(s).onclick=openUpload);
const competitorManual=document.querySelector('#competitorManualUpload');if(competitorManual)competitorManual.onclick=openUpload;document.querySelector('#closeUpload').onclick=closeUpload;document.querySelector('#cancelUpload').onclick=closeUpload;document.querySelector('#uploadCompany')?.addEventListener('input',refreshUploadCompanyProfile);document.querySelector('#uploadCompany')?.addEventListener('change',refreshUploadCompanyProfile);
const dz=document.querySelector('#dropZone'),fi=document.querySelector('#pdfFile');dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag')};dz.ondragleave=()=>dz.classList.remove('drag');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag');if(e.dataTransfer.files[0]){fi.files=e.dataTransfer.files;document.querySelector('#parseStatus').textContent=`Selezionato: ${fi.files[0].name}`;}};fi.onchange=()=>{if(fi.files[0])document.querySelector('#parseStatus').textContent=`Selezionato: ${fi.files[0].name}`;};

async function pdfLines(file){
 const pdfjsLib=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs');
 pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';
 const buf=await file.arrayBuffer();
 const pdf=await pdfjsLib.getDocument({data:buf}).promise;
 const lines=[];
 const cleanText=items=>items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
 for(let p=1;p<=pdf.numPages;p++){
  const page=await pdf.getPage(p),viewport=page.getViewport({scale:1}),content=await page.getTextContent(),groups=new Map();
  for(const item of content.items){
   if(!item.str?.trim())continue;
   const x=item.transform?.[4]??0,y=item.transform?.[5]??0,w=item.width??0,key=Math.round(y/2)*2;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push({x,w,text:item.str});
  }
  const ordered=[...groups.entries()].sort((a,b)=>b[0]-a[0]);
  const pageText=ordered.map(([,items])=>cleanText([...items])).join(' ').toUpperCase();
  const incomeDual=/CONTO ECONOMICO/.test(pageText)&&/\bCOSTI\b/.test(pageText)&&/\bRICAVI\b/.test(pageText);
  const balanceDual=(/ATTIVIT/.test(pageText)&&/PASSIVIT/.test(pageText))||(/STATO PATRIMONIALE/.test(pageText)&&/ATTIV/.test(pageText)&&/PASSIV/.test(pageText));
  const dual=incomeDual||balanceDual;
  const section=incomeDual?'income':balanceDual?'balance':'generic';
  // Nei bilanci a 4 sezioni le due metà della stessa riga sono due record contabili distinti.
  // Non vanno mai concatenate: è il motivo per cui la vecchia versione prendeva 373.848 € come Ricavi.
  const mid=viewport.width*0.515;
  for(const [y,rawItems] of ordered){
   const items=[...rawItems].sort((a,b)=>a.x-b.x);
   if(dual){
    const left=items.filter(i=>i.x<mid),right=items.filter(i=>i.x>=mid);
    const lt=cleanText(left),rt=cleanText(right);
    if(lt)lines.push({page:p,text:lt,side:'left',section,layout:'dual-half',y,pageWidth:viewport.width});
    if(rt)lines.push({page:p,text:rt,side:'right',section,layout:'dual-half',y,pageWidth:viewport.width});
   }else{
    const text=cleanText(items);
    if(text)lines.push({page:p,text,side:'full',section,layout:'single',y,pageWidth:viewport.width});
   }
  }
 }
 return lines;
}


// Direct two-PDF comparison workflow
const compareModal=document.querySelector('#compareModal');
let compareMode='periods';
const compareInputs={
 shared:document.querySelector('#compareSharedCompany'),companyA:document.querySelector('#compareCompanyA'),companyB:document.querySelector('#compareCompanyB'),
 periodA:document.querySelector('#comparePeriodA'),periodB:document.querySelector('#comparePeriodB'),fileA:document.querySelector('#compareFileA'),fileB:document.querySelector('#compareFileB')
};
function resetCompareFiles(){compareInputs.fileA.value='';compareInputs.fileB.value='';document.querySelector('#compareFileAName').textContent='Seleziona il primo PDF';document.querySelector('#compareFileBName').textContent='Seleziona il secondo PDF';document.querySelector('#compareStatusA').textContent='';document.querySelector('#compareStatusB').textContent='';document.querySelector('#compareGlobalStatus').textContent='';}
function openCompare(mode){
 compareMode=mode;resetCompareFiles();compareModal.classList.add('open');compareModal.setAttribute('aria-hidden','false');
 const periodMode=mode==='periods';
 document.querySelector('#compareModalEyebrow').textContent=periodMode?'CONFRONTO TEMPORALE':'BENCHMARK COMPARATIVO';
 document.querySelector('#compareModalTitle').textContent=periodMode?'Confronta due periodi':'Confronta due aziende';
 document.querySelector('#compareModalIntro').textContent=periodMode?'Carica due bilanci della stessa azienda. Ogni PDF viene letto separatamente e poi confrontato.':'Carica un bilancio per ciascuna azienda. Ogni PDF viene letto separatamente prima del benchmark.';
 document.querySelector('#periodSharedCompany').style.display=periodMode?'block':'none';
 document.querySelector('#companyAField').style.display=periodMode?'none':'block';document.querySelector('#companyBField').style.display=periodMode?'none':'block';
 document.querySelector('#slotATitle').textContent=periodMode?'Periodo A':'Azienda A';document.querySelector('#slotBTitle').textContent=periodMode?'Periodo B':'Azienda B';
 if(periodMode&&state.selectedCompany)compareInputs.shared.value=state.selectedCompany;
 if(!periodMode&&state.selectedPeriod){compareInputs.periodA.value=state.selectedPeriod;compareInputs.periodB.value=state.selectedPeriod;}
}
function closeCompare(){compareModal.classList.remove('open');compareModal.setAttribute('aria-hidden','true');}
document.querySelectorAll('[data-start-compare]').forEach(b=>b.onclick=()=>openCompare(b.dataset.startCompare));
document.querySelector('#closeCompare').onclick=closeCompare;document.querySelector('#cancelCompare').onclick=closeCompare;
compareInputs.fileA.onchange=()=>{if(compareInputs.fileA.files[0])document.querySelector('#compareFileAName').textContent=compareInputs.fileA.files[0].name;};
compareInputs.fileB.onchange=()=>{if(compareInputs.fileB.files[0])document.querySelector('#compareFileBName').textContent=compareInputs.fileB.files[0].name;};

async function analyzeFileToDoc(file,company,period,statusEl,suffix){
 statusEl.textContent='Lettura PDF…';const lines=await pdfLines(file);if(lines.length<5)throw new Error('NO_TEXT');
 statusEl.textContent='Riconoscimento voci…';const result=analyzeLines(lines,{documentType:'auto'});
 statusEl.textContent='Calcolo indicatori…';
 return {id:`u${Date.now()}${suffix}`,company,period,name:file.name,type:result.type,quality:result.quality,data:result.data,sources:result.sources,candidates:result.candidates,validations:result.validations,recognized:result.recognized,engineVersion:ENGINE_VERSION,parser:result.parser,profile:getCompanyProfile(company)};
}

document.querySelector('#analyzeComparison').onclick=async()=>{
 const global=document.querySelector('#compareGlobalStatus'),stA=document.querySelector('#compareStatusA'),stB=document.querySelector('#compareStatusB');
 const fileA=compareInputs.fileA.files[0],fileB=compareInputs.fileB.files[0];
 let companyA,companyB,periodA=compareInputs.periodA.value.trim(),periodB=compareInputs.periodB.value.trim();
 if(compareMode==='periods'){companyA=companyB=compareInputs.shared.value.trim();}else{companyA=compareInputs.companyA.value.trim();companyB=compareInputs.companyB.value.trim();}
 if(!fileA||!fileB||!companyA||!companyB||!periodA||!periodB){global.textContent='Completa i dati e seleziona entrambi i PDF.';return;}
 if(compareMode==='periods'&&periodA===periodB){global.textContent='Per il confronto temporale indica due periodi diversi.';return;}
 try{
  global.textContent='Analisi del primo documento…';const a=await analyzeFileToDoc(fileA,companyA,periodA,stA,'a');stA.textContent=`Completato · ${dataCoverage(a).label}. Apri Completa dati per validare o correggere.`;
  global.textContent='Analisi del secondo documento…';const b=await analyzeFileToDoc(fileB,companyB,periodB,stB,'b');stB.textContent=`Completato · ${dataCoverage(b).label}. Apri Completa dati per validare o correggere.`;
  state.docs=state.docs.filter(x=>!((x.company===a.company&&x.period===a.period)||(x.company===b.company&&x.period===b.period)));state.docs.push(a,b);
  state.lastComparison={mode:compareMode,aId:a.id,bId:b.id};state.selectedCompany=b.company;state.selectedPeriod=b.period;save();cloudSaveDocument(a,fileA).catch(console.warn);cloudSaveDocument(b,fileB).catch(console.warn);renderAll();
  global.textContent='Confronto pronto.';setTimeout(()=>{closeCompare();showView('comparison',compareMode==='periods'?'Confronto periodi':'Confronto aziende');},300);
 }catch(err){console.error(err);global.textContent=err.message==='NO_TEXT'?'Uno dei PDF sembra scansionato o non contiene testo selezionabile. In questa versione non vengono inventati valori: servirà OCR/vision.':'Non è stato possibile completare l’analisi dei due documenti.';}
};

document.querySelector('#analyzeProductivity')?.addEventListener('click',handleProductivityUpload);

document.querySelector('#analyzePdf').onclick=async()=>{const file=fi.files[0],company=document.querySelector('#uploadCompany').value.trim(),period=document.querySelector('#uploadPeriod').value.trim(),st=document.querySelector('#parseStatus');if(!file||!company||!period){st.textContent='Inserisci azienda, periodo e seleziona un PDF.';return;}try{st.textContent='1/3 · Lettura struttura PDF…';const lines=await pdfLines(file);if(lines.length<5)throw new Error('NO_TEXT');st.textContent='2/3 · Riconoscimento e normalizzazione delle voci contabili…';const requested=document.querySelector('#uploadType').value;const result=analyzeLines(lines,{documentType:requested});st.textContent='3/3 · Calcolo indicatori e controlli di quadratura…';const uploadProfile=getUploadProfile();if(profileHasData(uploadProfile))setCompanyProfile(company,uploadProfile);const doc={id:'u'+Date.now(),company,period,name:file.name,type:result.type,quality:result.quality,data:result.data,sources:result.sources,candidates:result.candidates,validations:result.validations,recognized:result.recognized,engineVersion:ENGINE_VERSION,parser:result.parser,profile:getCompanyProfile(company)};state.docs=state.docs.filter(x=>!(x.company===company&&x.period===period));state.docs.push(doc);state.selectedCompany=company;state.selectedPeriod=period;save();cloudSaveDocument(doc,file).catch(console.warn);const cp=completeness(doc);st.textContent=`Completato: ${cp.found}/${cp.total} voci chiave riconosciute. Ora completa o conferma i dati prima del report.`;setTimeout(()=>{closeUpload();renderAll();document.querySelector('.nav-item[data-view="documents"]').click();openReview(doc.id);},650);}catch(err){console.error(err);st.textContent=err.message==='NO_TEXT'?'Il PDF sembra scansionato o privo di testo selezionabile. La versione server dovrà attivare OCR/vision prima dell’analisi; nessun valore viene inventato.':'Errore durante la lettura del PDF. Il documento non è stato importato.';}};



// --- V20 · strict role separation: client portal vs ADMIN NOMYRA ------
function isNomyraEmail(email=''){
 const e=String(email||'').toLowerCase();
 return e==='info.nomyra@gmail.com';
}
async function checkPlatformAdmin(){
 state.platformAdmin=false;
 if(!CLOUD.user)return false;
 const email=String(CLOUD.user.email||'').toLowerCase().trim();
 // Regola rigida: un utente è ADMIN NOMYRA solo se la sua email è registrata come admin attivo.
 // Non basta che esista almeno un admin nella tabella.
 try{
  const {data,error}=await supabase
    .from('platform_admins')
    .select('id,email,role,is_active')
    .eq('is_active',true)
    .ilike('email',email)
    .limit(1);
  if(!error && data?.length)state.platformAdmin=true;
 }catch(e){console.warn('platform admin check',e.message);}
 if(isNomyraEmail(email))state.platformAdmin=true;
 return state.platformAdmin;
}
function isPortalUnlocked(){return !!CLOUD.user || !!state.demoUnlocked;}
function isClientUser(){return !!CLOUD.user && !state.platformAdmin;}
function applyPortalShell(){
 const unlocked=isPortalUnlocked();
 const client=isClientUser();
 document.body.classList.toggle('app-locked',!unlocked);
 document.body.classList.toggle('app-unlocked',unlocked);
 document.body.classList.toggle('is-platform-admin',!!state.platformAdmin);
 document.body.classList.toggle('is-client-user',client);
 document.body.classList.toggle('is-cloud-user',!!CLOUD.user);
 // Moduli admin sempre nascosti ai clienti.
 document.querySelectorAll('.admin-only').forEach(el=>{el.style.display=state.platformAdmin?'flex':'none';});
 // Il cliente già autenticato non deve rivedere la pagina accesso/utenti.
 const accessNav=document.querySelector('.nav-item[data-view="access"]');
 if(accessNav)accessNav.style.display=(CLOUD.user && !state.platformAdmin)?'none':'flex';
 const demo=document.querySelector('#accessContinueDemo');
 if(demo){demo.style.display=new URLSearchParams(location.search).get('demo')==='1' || state.platformAdmin?'inline-flex':'none';}
 document.querySelectorAll('.client-hidden').forEach(el=>{el.style.display=client?'none':'';});
 const openUploadBtn=document.querySelector('#openUpload');
 if(openUploadBtn)openUploadBtn.disabled=!unlocked;
}
const originalUpdateCloudUI=updateCloudUI;
updateCloudUI=function(){originalUpdateCloudUI();applyPortalShell();};
const originalLoadCloudData=loadCloudData;
loadCloudData=async function(){const ok=await originalLoadCloudData();await checkPlatformAdmin();applyPortalShell();if(state.platformAdmin)renderAdmin();return ok;};
const originalShowView=showView;
showView=function(view,title=null){
 if(!isPortalUnlocked() && view!=='access')view='access';
 // Se un cliente autenticato prova ad aprire Accesso utenti, lo mandiamo alla Home cliente.
 if(CLOUD.user && !state.platformAdmin && view==='access')view='home';
 // Workspace/utenti e ADMIN NOMYRA sono esclusivamente admin.
 if((view==='admin' || view==='workspace') && !state.platformAdmin)view=CLOUD.user?'home':'access';
 originalShowView(view,title);
 if(view==='admin')renderAdmin();
 applyPortalShell();
};
function companyIdForDoc(doc){return doc?._companyId||null;}
function activeCompanyName(){return currentDoc()?.company || state.selectedCompany || state.docs[0]?.company || '';}
function sectionForReport(kind){
 const map={single_analysis:'#overview',period_comparison:'#comparison',company_comparison:'#comparison',comparison:'#comparison',benchmark:'#benchmark',productivity:'#productivity',complete:'#report'};
 return document.querySelector(map[kind]||'#overview');
}
function cleanReportHTML(root){
 const clone=root.cloneNode(true);
 clone.querySelectorAll('button,.no-print,.modal,.empty-state').forEach(x=>x.remove());
 clone.querySelectorAll('canvas').forEach(c=>{const p=document.createElement('p');p.textContent='Grafico disponibile nella piattaforma interattiva.';c.replaceWith(p);});
 return clone.innerHTML;
}
function reportTitle(kind){
 const d=currentDoc();
 const labels={single_analysis:'Analisi bilancio',period_comparison:'Confronto periodi',company_comparison:'Confronto aziende',comparison:'Confronto',benchmark:'Benchmark aziende',productivity:'Analisi produttività',complete:'Executive Financial Report'};
 return `${labels[kind]||'Report'}${d?` · ${d.company} ${d.period}`:''}`;
}
async function registerReportExport(kind,title){
 if(!CLOUD.user)return;
 const d=currentDoc(); const companyName=activeCompanyName(); if(!companyName)return;
 try{
  const company=await ensureCompany(companyName,getCompanyProfile(companyName));
  await supabase.from('report_exports').insert({company_id:company.id,document_id:d?._remoteId||null,report_kind:kind==='comparison'?(state.lastComparison?.mode==='companies'?'company_comparison':'period_comparison'):kind,title,period:d?.period||state.selectedPeriod||null,related_payload:{selectedCompany:state.selectedCompany,selectedPeriod:state.selectedPeriod,comparison:state.lastComparison||null},generated_by:CLOUD.user.id});
 }catch(e){console.warn('report export log',e.message);}
}
function downloadReport(kind){
 if(kind==='comparison' && state.lastComparison?.mode==='companies')kind='company_comparison';
 if(kind==='comparison' && state.lastComparison?.mode==='periods')kind='period_comparison';
 if(kind==='complete')renderReport();
 const root=sectionForReport(kind); if(!root){alert('Sezione non disponibile.');return;}
 const title=reportTitle(kind);
 const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Inter,Arial,sans-serif;color:#102033;margin:36px;line-height:1.45}h1,h2,h3{color:#102033}.eyebrow,.section-label{letter-spacing:.12em;text-transform:uppercase;color:#0f5b5e;font-size:12px;font-weight:800}.panel,.kpi-explain-row,.module-card,.report-section{border:1px solid #d9e3e1;border-radius:16px;padding:18px;margin:14px 0;break-inside:avoid}.kpi-grid,.grid-2,.grid-3{display:block}.kpi-card,.report-kpi{display:inline-block;vertical-align:top;border:1px solid #d9e3e1;border-radius:12px;padding:12px;margin:6px;min-width:160px}table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border-bottom:1px solid #d9e3e1;text-align:left;padding:8px}.badge,.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf4f2}small,.muted-note{color:#63717d}.nav-item,.sidebar,.topbar,.modal-actions,.quick-report-bar{display:none!important}</style></head><body><p class="eyebrow">NOMYRA FINANCE</p><h1>${esc(title)}</h1><p>Report separato generato dalla piattaforma. I dati derivano dai valori caricati, estratti o confermati dall’utente.</p>${cleanReportHTML(root)}</body></html>`;
 const blob=new Blob([html],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'nomyra-report'}.html`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 registerReportExport(kind,title);
}
function bindReportExports(){document.querySelectorAll('[data-export-report]').forEach(b=>{b.onclick=()=>downloadReport(b.dataset.exportReport);});}
async function renderAdmin(){
 const gate=document.querySelector('#adminGate'), content=document.querySelector('#adminContent'); if(!gate||!content)return;
 if(!CLOUD.user){gate.className='provider-result empty-state';gate.textContent='Accedi con un utente NOMYRA per gestire clienti e piani.';content.classList.add('hidden');return;}
 await checkPlatformAdmin(); applyPortalShell();
 if(!state.platformAdmin){gate.className='provider-result empty-state';gate.textContent='Questo utente non è autorizzato come ADMIN NOMYRA.';content.classList.add('hidden');return;}
 gate.className='provider-result';gate.innerHTML=`<strong>ADMIN NOMYRA attivo</strong><p>Utente: ${esc(CLOUD.user.email||'')}</p>`;content.classList.remove('hidden');
 try{
  const [companies,plans,subs,users,reports]=await Promise.all([
   supabase.from('companies').select('*').order('created_at',{ascending:false}),
   supabase.from('client_plans').select('*').order('monthly_price',{ascending:true}),
   supabase.from('company_subscriptions').select('*'),
   supabase.from('company_users').select('*'),
   supabase.from('report_exports').select('*').order('created_at',{ascending:false}).limit(30)
  ]);
  if(companies.error)throw companies.error; if(plans.error)throw plans.error;
  state.adminCache={companies:companies.data||[],plans:plans.data||[],subscriptions:subs.data||[],users:users.data||[],reports:reports.data||[]};
  const cs=state.adminCache.companies, ps=state.adminCache.plans, ss=state.adminCache.subscriptions, us=state.adminCache.users, rs=state.adminCache.reports;
  const byPlan=Object.fromEntries(ps.map(p=>[p.id,p])); const byCompany=Object.fromEntries(cs.map(c=>[c.id,c]));
  document.querySelector('#adminCompaniesCount').textContent=cs.length;
  document.querySelector('#adminUsersCount').textContent=us.length;
  document.querySelector('#adminPlansCount').textContent=ps.length;
  const fill=(id,arr,label)=>{const el=document.querySelector(id);if(el)el.innerHTML=arr.map(x=>`<option value="${esc(x.id)}">${esc(label(x))}</option>`).join('');};
  fill('#adminCompanySelect',cs,c=>c.name); fill('#adminUserCompany',cs,c=>c.name); fill('#adminPlanSelect',ps,p=>`${p.name} ${p.monthly_price!=null?'· €'+p.monthly_price+'/mese':''}`);
  const table=document.querySelector('#adminCompaniesTable');
  table.innerHTML=`<thead><tr><th>Cliente</th><th>Piano</th><th>Stato</th><th>Utenti</th><th>Documenti</th><th>Azioni</th></tr></thead><tbody>${cs.map(c=>{const s=ss.find(x=>x.company_id===c.id);const userCount=us.filter(u=>u.company_id===c.id).length;const plan=s?byPlan[s.plan_id]?.name||'—':'Non assegnato';return `<tr><td><strong>${esc(c.name)}</strong><br><small>${esc(c.vat_number||c.country||'')}</small></td><td>${esc(plan)}</td><td><span class="badge ${s?.status==='active'?'good':s?.status==='disabled'?'danger':'neutral'}">${esc(s?.status||'no plan')}</span></td><td>${userCount}</td><td><button class="mini-btn" data-admin-company="${esc(c.id)}">Seleziona</button></td><td><button class="mini-btn" data-admin-disable="${esc(c.id)}">Disattiva</button></td></tr>`}).join('')}</tbody>`;
  const rt=document.querySelector('#adminReportsTable');
  rt.innerHTML=`<thead><tr><th>Report</th><th>Cliente</th><th>Tipo</th><th>Data</th></tr></thead><tbody>${rs.length?rs.map(r=>`<tr><td>${esc(r.title||'Report')}</td><td>${esc(byCompany[r.company_id]?.name||'—')}</td><td>${esc(r.report_kind)}</td><td>${new Date(r.created_at).toLocaleString('it-IT')}</td></tr>`).join(''):'<tr><td colspan="4" class="empty-state">Nessun export registrato.</td></tr>'}</tbody>`;
 }catch(e){gate.className='provider-result empty-state';gate.textContent=e.message||'Impossibile caricare dati admin.';content.classList.add('hidden');}
}
function bindAdminForms(){
 const refresh=document.querySelector('#adminRefresh'); if(refresh)refresh.onclick=renderAdmin;
 const planForm=document.querySelector('#adminPlanForm'); if(planForm)planForm.onsubmit=async e=>{e.preventDefault(); if(!state.platformAdmin)return alert('Accesso admin richiesto.'); const company_id=document.querySelector('#adminCompanySelect').value, plan_id=document.querySelector('#adminPlanSelect').value, status=document.querySelector('#adminPlanStatus').value, notes=document.querySelector('#adminPlanNotes').value; const {error}=await supabase.from('company_subscriptions').upsert({company_id,plan_id,status,notes,updated_at:new Date().toISOString()},{onConflict:'company_id'}); if(error)return alert(error.message); await renderAdmin();};
 const userForm=document.querySelector('#adminUserForm'); if(userForm)userForm.onsubmit=async e=>{e.preventDefault(); if(!state.platformAdmin)return alert('Accesso admin richiesto.'); const company_id=document.querySelector('#adminUserCompany').value,email=document.querySelector('#adminUserEmail').value.trim().toLowerCase(),name=document.querySelector('#adminUserName').value.trim(),role=document.querySelector('#adminUserRole').value; if(!email)return alert('Inserisci email utente.'); const {error}=await supabase.from('client_user_invitations').upsert({company_id,email,name,role,status:'pending',invited_by:CLOUD.user.id},{onConflict:'company_id,email'}); if(error)return alert(error.message); alert('Invito creato. Il cliente deve registrarsi/accedere con questa email.'); await renderAdmin();};
 document.querySelector('#adminCompaniesTable')?.addEventListener('click',async e=>{const t=e.target;if(t.dataset.adminCompany){const c=state.adminCache.companies.find(x=>x.id===t.dataset.adminCompany);if(c){state.selectedCompany=c.name;save();renderAll();showView('documents','Bilanci');}} if(t.dataset.adminDisable){if(!confirm('Disattivare il piano cliente?'))return;const c=t.dataset.adminDisable;let plan=state.adminCache.plans[0]?.id||null;await supabase.from('company_subscriptions').upsert({company_id:c,plan_id:plan,status:'disabled',updated_at:new Date().toISOString()},{onConflict:'company_id'});await renderAdmin();}});
}
const originalBindAccessLanding=bindAccessLanding;
bindAccessLanding=function(){originalBindAccessLanding();applyPortalShell();};


initCloud().then(async()=>{try{document.body.classList.add('cloud-booting');await checkPlatformAdmin();if(CLOUD.user && !state.platformAdmin){await acceptPendingInvitation();try{await loadCloudData();}catch(e){console.warn('cloud preload',e.message);} }bindAccessLanding();bindReportExports();bindAdminForms();renderAll();applyPortalShell();if(state.platformAdmin){showView('admin','ADMIN NOMYRA');}else{showView(isPortalUnlocked()?'home':'access',isPortalUnlocked()?'Dashboard':'Accesso utenti');}}finally{document.body.classList.remove('cloud-booting');document.body.classList.add('boot-ready');}}).catch(err=>{console.warn(err);document.body.classList.remove('cloud-booting');document.body.classList.add('boot-ready');});


// --- V21 · client dashboard, no competitor lookup, PDF/Excel reports ---
function v21HideUnavailableModules(){
  const hasDocs=(state.docs||[]).length>0;
  const client=isClientUser();
  const nav=(sel)=>document.querySelector(`.nav-item${sel}`);
  const access=nav('[data-view="access"]'); if(access)access.style.display=(CLOUD.user&&!state.platformAdmin)?'none':'flex';
  const workspace=nav('[data-view="workspace"]'); if(workspace)workspace.style.display=state.platformAdmin?'flex':'none';
  const admin=nav('[data-view="admin"]'); if(admin)admin.style.display=state.platformAdmin?'flex':'none';
  const competitor=nav('[data-view="competitorLookup"]'); if(competitor)competitor.style.display='none';
  const overview=nav('[data-view="overview"]'); if(overview)overview.style.display=hasDocs?'flex':'none';
  const benchmark=nav('[data-view="benchmark"]'); if(benchmark)benchmark.style.display=hasDocs?'flex':'none';
  const report=nav('[data-view="report"]'); if(report)report.style.display=hasDocs?'flex':'none';
  document.querySelectorAll('[data-nav="competitorLookup"],#competitorLookup,.competitor-card').forEach(el=>el.style.display='none');
  document.querySelectorAll('.private-saas-panel,[data-nav="workspace"]').forEach(el=>{ if(client) el.style.display='none'; });
  const accessTitle=document.querySelector('#pageTitle');
  if(CLOUD.user&&!state.platformAdmin&&accessTitle?.textContent==='Accesso utenti')accessTitle.textContent='Dashboard';
}

const _v21ApplyPortalShell=applyPortalShell;
applyPortalShell=function(){
  _v21ApplyPortalShell();
  v21HideUnavailableModules();
};

const _v21ShowView=showView;
showView=function(view,title=null){
  if(view==='competitorLookup')view='home';
  if(CLOUD.user&&!state.platformAdmin&&(view==='access'||view==='workspace'||view==='admin'))view='home';
  if(view==='overview' && !(state.docs||[]).length)view='documents';
  if((view==='benchmark'||view==='report') && !(state.docs||[]).length)view='documents';
  _v21ShowView(view,title||({home:'Dashboard',overview:'Analisi bilancio',documents:'Bilanci'}[view]));
  v21HideUnavailableModules();
};

function reportHTML(kind){
  if(kind==='comparison' && state.lastComparison?.mode==='companies')kind='company_comparison';
  if(kind==='comparison' && state.lastComparison?.mode==='periods')kind='period_comparison';
  if(kind==='complete')renderReport();
  const root=sectionForReport(kind); if(!root)throw new Error('Sezione non disponibile');
  const title=reportTitle(kind);
  return {title,html:`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Inter,Arial,sans-serif;color:#102033;margin:28px;line-height:1.45}h1,h2,h3{color:#102033}.eyebrow,.section-label{letter-spacing:.12em;text-transform:uppercase;color:#0f5b5e;font-size:12px;font-weight:800}.panel,.kpi-explain-row,.module-card,.report-section{border:1px solid #d9e3e1;border-radius:16px;padding:18px;margin:14px 0;break-inside:avoid}.kpi-grid,.grid-2,.grid-3{display:block}.kpi-card,.report-kpi{display:inline-block;vertical-align:top;border:1px solid #d9e3e1;border-radius:12px;padding:12px;margin:6px;min-width:160px}table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border-bottom:1px solid #d9e3e1;text-align:left;padding:8px}.badge,.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf4f2}small,.muted-note{color:#63717d}.nav-item,.sidebar,.topbar,.modal-actions,.quick-report-bar,.export-btn,button{display:none!important}@media print{body{margin:16mm}}</style></head><body><p class="eyebrow">NOMYRA FINANCE</p><h1>${esc(title)}</h1><p>Report generato dalla piattaforma. I dati derivano dai valori caricati, estratti o confermati dall’utente.</p>${cleanReportHTML(root)}</body></html>`};
}
function downloadPDFReport(kind){
  try{const r=reportHTML(kind);const w=window.open('','_blank');if(!w){alert('Permetti i popup per generare il PDF.');return;}w.document.open();w.document.write(r.html);w.document.close();setTimeout(()=>{w.focus();w.print();},450);registerReportExport(kind,r.title);}catch(e){alert(e.message||'Report non disponibile.');}
}
function downloadExcelReport(kind){
  try{const r=reportHTML(kind);const xls=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${r.html.replace(/^[\s\S]*<body>|<\/body>[\s\S]*$/g,'')}</body></html>`;const blob=new Blob([xls],{type:'application/vnd.ms-excel;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${r.title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'nomyra-report'}.xls`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);registerReportExport(kind,r.title+' · Excel');}catch(e){alert(e.message||'Report Excel non disponibile.');}
}
// Override: data-export-report = PDF/stampa, data-export-excel = file Excel.
downloadReport=function(kind){downloadPDFReport(kind);};
const _v21BindReports=bindReportExports;
bindReportExports=function(){
  document.querySelectorAll('[data-export-report]').forEach(b=>{b.onclick=()=>downloadPDFReport(b.dataset.exportReport);});
  document.querySelectorAll('[data-export-excel]').forEach(b=>{b.onclick=()=>downloadExcelReport(b.dataset.exportExcel);});
};

const _v21RenderAll=renderAll;
renderAll=function(){_v21RenderAll();v21HideUnavailableModules();bindReportExports();};

// Close auth modal if login state is already active and user presses Accedi again.
document.addEventListener('click',e=>{
  if(e.target?.id==='cloudLogin' && CLOUD.user){setTimeout(()=>{document.querySelector('#cloudAuthModal')?.classList.remove('open');showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard');},700);}
});

v21HideUnavailableModules();

// --- V22 · menu order, cleaner client dashboard, editable company profiles ---
function v22CompanyRows(){
  return uniqueCompanies().map(c=>{
    const p=getCompanyProfile(c), pc=profileCompleteness(p);
    const docs=state.docs.filter(d=>profileKey(d.company)===profileKey(c));
    const sales=state.productivity.filter(x=>profileKey(x.company)===profileKey(c));
    const latest=docs.slice().sort((a,b)=>String(b.period).localeCompare(String(a.period))).at(0);
    return {company:c,profile:p,pc,docs,sales,latest};
  });
}
function v22DashboardStatus(){
  const docs=state.docs||[];
  const companies=uniqueCompanies();
  const latest=docs.slice().sort((a,b)=>String(b.period).localeCompare(String(a.period))).at(0)||null;
  const pending=docs.filter(d=>!dataCoverage(d).complete);
  const latestCov=latest?dataCoverage(latest):null;
  return {docs,companies,latest,pending,latestCov};
}
function v22PrimaryNextStep(){
  const s=v22DashboardStatus();
  if(!s.companies.length) return {title:'Crea il profilo aziendale',text:'Inserisci settore, modello operativo, prezzo medio, addetti e note. Questo contesto migliora le letture KPI.',action:'Apri Azienda',view:'companies'};
  if(!s.docs.length) return {title:'Carica il primo bilancio',text:'Importa il PDF del bilancio o bilancio di verifica. NOMYRA estrarrà le voci e ti guiderà nella revisione.',action:'Carica bilancio',upload:true};
  if(s.pending.length) return {title:'Completa i dati mancanti',text:`${s.pending.length} bilancio/i hanno voci da confermare o completare prima del report finale.`,action:'Completa dati',review:s.pending[0].id};
  return {title:'Analizza e scarica il report',text:'I dati principali sono disponibili. Puoi consultare l’analisi direzionale o esportare un report PDF/Excel.',action:'Apri analisi',view:'overview'};
}
function v22DashboardHTML(){
  const s=v22DashboardStatus();
  const next=v22PrimaryNextStep();
  const latest=s.latest;
  const dv=latest?derived(latest):{};
  const profile=latest?profileContext(latest):{};
  const profileLabel=profileCompleteness(profile).label;
  const alertCount=latest?buildNegativeAlerts(latest,previousDoc(latest)).length:0;
  const cards=[
    ['Aziende',String(s.companies.length),'Profili cliente configurati','companies'],
    ['Bilanci',String(s.docs.length),s.pending.length?`${s.pending.length} da completare`:'Dati principali verificati','documents'],
    ['Ultimi ricavi',latest?fmt(latest.data?.revenue):'—',latest?`${latest.company} · ${latest.period}`:'Carica un bilancio','overview'],
    ['Alert',String(alertCount),alertCount?'Indicatori da approfondire':'Nessun alert sul bilancio selezionato','overview']
  ];
  const checklist=[];
  if(!s.companies.length) checklist.push(['Crea o completa il profilo aziendale','Serve per interpretare KPI, produttività, addetti e prezzo medio.','companies']);
  if(!s.docs.length) checklist.push(['Carica un bilancio PDF','È il punto di partenza per KPI, alert e report.','documents']);
  if(s.pending.length) checklist.push(['Completa o conferma le voci contabili',`${s.pending.length} documento/i non sono ancora pronti per report definitivo.`,'documents']);
  if(!state.productivity?.length) checklist.push(['Carica vendite Excel/CSV','Permette di leggere clienti, prodotti, prezzo medio e riconciliazione col bilancio.','productivity']);
  if(s.docs.length && s.companies.length && !s.pending.length) checklist.push(['Genera report direzionale','Scarica report completo o report separati per modulo.','report']);
  return `
    <div class="v22-dashboard-hero">
      <div>
        <span class="pill light">NOMYRA FINANCE</span>
        <h2>Dashboard cliente</h2>
        <p>Uno spazio semplice per caricare il bilancio, completare i dati, analizzare la situazione aziendale e scaricare report PDF o Excel.</p>
        <div class="v22-next-step">
          <span>Prossimo passo consigliato</span>
          <strong>${esc(next.title)}</strong>
          <small>${esc(next.text)}</small>
          <button class="primary" id="v22NextAction">${esc(next.action)}</button>
        </div>
      </div>
      <div class="v22-latest-card">
        <span class="section-label">ULTIMO BILANCIO</span>
        <h3>${latest?`${esc(latest.company)} · ${esc(latest.period)}`:'Nessun bilancio caricato'}</h3>
        <div class="v22-mini-metrics">
          <div><span>Ricavi</span><strong>${latest?fmt(latest.data?.revenue):'—'}</strong></div>
          <div><span>EBITDA margin</span><strong>${latest?pct(dv.ebitdaMargin):'—'}</strong></div>
          <div><span>Copertura</span><strong>${s.latestCov?s.latestCov.label:'—'}</strong></div>
        </div>
        <small>Profilo aziendale: ${esc(latest?profileLabel:'da creare')}</small>
      </div>
    </div>
    <div class="v22-stat-grid">${cards.map(([label,value,note,view])=>`<button class="v22-stat-card" data-nav="${esc(view)}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></button>`).join('')}</div>
    <div class="v22-dashboard-grid">
      <article class="panel v22-actions-panel">
        <div class="panel-head"><div><span class="section-label">AZIONI RAPIDE</span><h3>Cosa vuoi fare?</h3></div></div>
        <div class="v22-action-list">
          <button class="v22-action" id="v22UploadBalance"><b>Carica bilancio</b><span>Importa un PDF e avvia revisione dati.</span></button>
          <button class="v22-action" data-nav="companies"><b>Gestisci azienda</b><span>Modifica profilo, prezzo medio, addetti, settore.</span></button>
          <button class="v22-action" data-start-compare="periods"><b>Confronta due periodi</b><span>Stessa azienda, due bilanci.</span></button>
          <button class="v22-action" data-nav="productivity"><b>Carica vendite Excel</b><span>Analizza clienti, prodotti e prezzi.</span></button>
        </div>
      </article>
      <article class="panel v22-checklist-panel">
        <div class="panel-head"><div><span class="section-label">CHECKLIST</span><h3>Per arrivare a un’analisi affidabile</h3></div></div>
        <div class="v22-checklist">${checklist.slice(0,5).map(([title,text,view],i)=>`<button class="v22-check" data-nav="${esc(view)}"><b>${i+1}</b><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></button>`).join('')}</div>
      </article>
    </div>
    <div class="panel v22-recent-panel">
      <div class="panel-head"><div><span class="section-label">ARCHIVIO RECENTE</span><h3>Bilanci e stato dati</h3></div><button class="text-btn" data-nav="documents">Apri Bilancio →</button></div>
      <div class="v22-recent-list">${s.docs.length?s.docs.slice().sort((a,b)=>String(b.period).localeCompare(String(a.period))).slice(0,5).map(d=>{const cov=dataCoverage(d);return `<button class="v22-recent-doc" data-home-doc="${esc(d.id)}"><span><strong>${esc(d.company)}</strong><small>${esc(d.period)} · ${esc(d.name||'Bilancio')}</small></span><em class="${cov.complete?'ok':'warn'}">${esc(cov.state)} · ${cov.found}/${cov.total}</em></button>`}).join(''):'<div class="empty-state">Nessun bilancio caricato.</div>'}</div>
    </div>`;
}
function v22RenderDashboard(){
  const home=document.querySelector('#home'); if(!home)return;
  home.innerHTML=v22DashboardHTML();
  const next=v22PrimaryNextStep();
  const nextBtn=document.querySelector('#v22NextAction');
  if(nextBtn) nextBtn.onclick=()=>{ if(next.upload) document.querySelector('#openUpload')?.click(); else if(next.review) openReview(next.review); else if(next.view) showView(next.view); };
  document.querySelector('#v22UploadBalance')?.addEventListener('click',()=>document.querySelector('#openUpload')?.click());
  home.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
  home.querySelectorAll('[data-start-compare]').forEach(b=>b.onclick=()=>openCompare(b.dataset.startCompare));
  home.querySelectorAll('[data-home-doc]').forEach(b=>b.onclick=()=>{const d=state.docs.find(x=>x.id===b.dataset.homeDoc);if(!d)return;state.selectedCompany=d.company;state.selectedPeriod=d.period;renderAll();showView('overview','Analisi bilancio');});
}
function v22RefreshCompanyProfile(company){
  if(!company)return;
  const p=getCompanyProfile(company);
  setCompanyProfile(company,p);
  save();
  state.docs.filter(d=>profileKey(d.company)===profileKey(company)).forEach(d=>cloudSaveDocument(d).catch(console.warn));
  ensureCompany(company,p).catch(console.warn);
  renderAll();
}
function v22DeleteCompanyProfile(company){
  if(!company)return;
  if(!confirm(`Eliminare solo il profilo aziendale di ${company}? I bilanci caricati non verranno cancellati.`))return;
  const key=profileKey(company);
  if(state.profiles) delete state.profiles[key];
  state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:{}}:d);
  save();
  renderAll();
}
function v22RenderCompanies(){
  const tb=document.querySelector('#companiesTable'); if(!tb)return;
  const rows=v22CompanyRows();
  if(!rows.length){tb.innerHTML='<tr><td colspan="5" class="empty-state">Nessuna azienda ancora presente. Crea il profilo aziendale o carica un bilancio.</td></tr>';return;}
  tb.innerHTML=rows.map(r=>`<tr><td><strong>${esc(r.company)}</strong><br><small>${r.latest?`Ultimo bilancio ${esc(r.latest.period)}`:'Nessun bilancio'}</small></td><td><strong>${esc(r.pc.label)}</strong><br><small>${esc(profileContextText({company:r.company,profile:r.profile}))}</small></td><td>${r.docs.length}</td><td>${r.sales.length} file</td><td><button class="mini-btn primary-mini" data-company-profile="${esc(r.company)}">Modifica</button> <button class="mini-btn" data-company-refresh="${esc(r.company)}">Aggiorna analisi</button> <button class="mini-btn" data-company-open="${esc(r.company)}">Apri</button> <button class="mini-btn danger" data-company-delete-profile="${esc(r.company)}">Elimina profilo</button></td></tr>`).join('');
  tb.onclick=e=>{const t=e.target;if(t.dataset.companyProfile){openProfile(t.dataset.companyProfile);return;}if(t.dataset.companyRefresh){v22RefreshCompanyProfile(t.dataset.companyRefresh);return;}if(t.dataset.companyDeleteProfile){v22DeleteCompanyProfile(t.dataset.companyDeleteProfile);return;}if(t.dataset.companyOpen){state.selectedCompany=t.dataset.companyOpen;state.selectedPeriod='';renderAll();showView(state.docs.some(d=>profileKey(d.company)===profileKey(t.dataset.companyOpen))?'overview':'documents','Analisi bilancio');}};
}
function v22InjectProfileButtons(){
  const actions=document.querySelector('#profileModal .modal-actions');
  if(!actions || document.querySelector('#deleteProfile'))return;
  const btn=document.createElement('button');btn.id='deleteProfile';btn.type='button';btn.className='ghost danger';btn.textContent='Elimina profilo';
  btn.onclick=()=>{const c=activeProfileCompany;closeProfile();v22DeleteCompanyProfile(c);};
  const refresh=document.createElement('button');refresh.id='refreshProfileAnalysis';refresh.type='button';refresh.className='ghost';refresh.textContent='Aggiorna analisi';
  refresh.onclick=()=>{if(activeProfileCompany){v22RefreshCompanyProfile(activeProfileCompany);alert('Profilo aggiornato e analisi ricalcolata sui bilanci disponibili.');}};
  actions.insertBefore(btn,actions.firstChild);
  actions.insertBefore(refresh,actions.firstChild);
}
// Override save profile to force profile propagation and visible refresh.
const _v22OldSaveProfile=document.querySelector('#saveProfile')?.onclick;
if(document.querySelector('#saveProfile'))document.querySelector('#saveProfile').onclick=()=>{if(!activeProfileCompany)return;const profile=readProfileFields();setCompanyProfile(activeProfileCompany,profile);save();ensureCompany(activeProfileCompany,profile).catch(console.warn);state.docs.filter(d=>profileKey(d.company)===profileKey(activeProfileCompany)).forEach(d=>cloudSaveDocument(d).catch(console.warn));renderAll();closeProfile();showView('companies','Azienda');};
const _v22OldOpenProfile=openProfile;
openProfile=function(target){_v22OldOpenProfile(target);setTimeout(v22InjectProfileButtons,0);};
// More robust login modal behavior: close as soon as Supabase session is active.
document.addEventListener('click',e=>{ if(e.target?.id==='cloudLogin'){ let tries=0; const timer=setInterval(()=>{tries++; if(CLOUD.user){clearInterval(timer);document.querySelector('#cloudAuthModal')?.classList.remove('open');showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard');} if(tries>20)clearInterval(timer);},250); }});
function v22ApplyMenuOrder(){
  const nav=document.querySelector('.sidebar nav'); if(!nav)return;
  const order=['access','home','companies','documents','overview','workspace','admin'];
  const map={}; [...nav.querySelectorAll('.nav-item[data-view]')].forEach(b=>map[b.dataset.view]=b);
  order.reverse().forEach(k=>{ if(map[k]) nav.prepend(map[k]); });
  // compare buttons must stay after analysis block
  const overview=map.overview;
  if(overview){
    const period=nav.querySelector('[data-start-compare="periods"]'), comp=nav.querySelector('[data-start-compare="companies"]'), bench=map.benchmark;
    if(period) overview.after(period);
    if(comp&&period) period.after(comp);
    if(bench&&comp) comp.after(bench);
  }
}
const _v22RenderAll=renderAll;
renderAll=function(){_v22RenderAll();v22RenderDashboard();v22RenderCompanies();v22InjectProfileButtons();v22ApplyMenuOrder();v21HideUnavailableModules?.();};
const _v22ShowView=showView;
showView=function(view,title=null){
  const titles={home:'Dashboard',companies:'Azienda',documents:'Bilancio',overview:'Analisi bilancio',benchmark:'Benchmark aziende',productivity:'Produttività',report:'Report'};
  _v22ShowView(view,title||titles[view]);
  if(view==='home')v22RenderDashboard();
  if(view==='companies')v22RenderCompanies();
  v22ApplyMenuOrder();
};
// First paint for V22
setTimeout(()=>{v22ApplyMenuOrder();v22RenderDashboard();v22RenderCompanies();},300);


// --- V23 · profile source-of-truth and forced recalculation -----------------
// Fixes: company profile values must update everywhere after edit (ex. product price 15 -> 1,5).
const fmtUnitPrice = n => n==null || !Number.isFinite(Number(n)) ? '—' : new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n));
const fmtMaybeDecimal = n => n==null || !Number.isFinite(Number(n)) ? '—' : new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(Number(n));

function v23ProfileContextText(doc){
 const p=profileContext(doc),parts=[];
 if(p.sector)parts.push(`settore ${p.sector}`);
 if(p.businessModel)parts.push(`modello ${p.businessModel}`);
 if(p.customerType)parts.push(`clientela ${p.customerType}`);
 if(p.avgProductPrice!=null)parts.push(`prezzo medio prodotto ${fmtUnitPrice(p.avgProductPrice)}`);
 if(p.avgOrderValue!=null)parts.push(`ordine medio ${fmtUnitPrice(p.avgOrderValue)}`);
 if(p.annualUnits!=null)parts.push(`${num(p.annualUnits)} unità/anno`);
 if(p.employees!=null)parts.push(`${fmtMaybeDecimal(p.employees)} addetti`);
 if(p.exportShare!=null)parts.push(`export ${pct(p.exportShare)}`);
 if(p.seasonality)parts.push(`stagionalità ${p.seasonality}`);
 return parts.length?parts.join(' · '):'Profilo aziendale non compilato';
}
profileContextText = v23ProfileContextText;

function v23ProfileInsightForKpi(label,value,doc){
 const p=profileContext(doc); if(!p.sector&&!p.businessModel&&!p.avgProductPrice&&!p.employees&&!p.annualUnits)return '';
 const sector=(p.sector||'').toLowerCase(),model=(p.businessModel||'').toLowerCase();
 const notes=[];
 if(label==='Materie / Ricavi'&&(sector.includes('manifatt')||sector.includes('produz')||model.includes('produz')))notes.push('Essendo una realtà produttiva, questa incidenza va letta insieme a mix prodotti, scarti, rimanenze e prezzo medio.');
 if(label==='Personale / Ricavi'&&p.employees!=null&&doc?.data?.revenue!=null){notes.push(`Con ${fmtMaybeDecimal(p.employees)} addetti, i ricavi per addetto sono circa ${fmt(doc.data.revenue/p.employees)}.`)}
 if(label==='Ricavi'&&p.avgProductPrice!=null&&doc?.data?.revenue!=null){notes.push(`Con prezzo medio prodotto di ${fmtUnitPrice(p.avgProductPrice)}, il fatturato corrisponde indicativamente a ${num(doc.data.revenue/p.avgProductPrice)} unità teoriche vendute.`)}
 if(label==='Rimanenze / Ricavi'&&(sector.includes('manifatt')||sector.includes('distrib')||model.includes('magazz')))notes.push('Per aziende con magazzino, questo KPI va letto con rotazione stock, tempi di approvvigionamento e obsolescenza.');
 if(label==='Servizi / Ricavi'&&model.includes('conto terzi'))notes.push('Nel conto terzi i servizi esterni possono pesare di più: va distinto ciò che è produttivo da ciò che è struttura.');
 if(label==='EBITDA margin'&&p.avgProductPrice!=null)notes.push('Conoscere il prezzo medio aiuta a capire se il margine deriva da volume, mix prodotti o aumento dei costi unitari.');
 return notes.length?' '+notes.join(' '):'';
}
profileInsightForKpi = v23ProfileInsightForKpi;

async function v23EnsureCompany(companyName,profile={}){
 if(!CLOUD.user)throw new Error('LOGIN_REQUIRED');
 const name=String(companyName||'').trim(); if(!name)throw new Error('COMPANY_REQUIRED');
 const normalized=profileKey(name);
 const payload={...profileToCompanyRow(name,profile),created_by:CLOUD.user.id,updated_at:new Date().toISOString()};
 let {data:rows,error}=await supabase.from('companies').select('*').ilike('name',name);
 if(error)throw error;
 rows=(rows||[]).filter(r=>profileKey(r.name)===normalized);
 let company=null;
 // Prefer the company id already used by existing documents to avoid creating/updating the wrong duplicate.
 const docCompanyId=(state.docs||[]).find(d=>profileKey(d.company)===normalized && d._companyId)?._companyId;
 if(docCompanyId)company=rows.find(r=>r.id===docCompanyId)||null;
 if(!company)company=rows[0]||null;
 if(!company){
   const ins=await supabase.from('companies').insert(payload).select('*').single(); if(ins.error)throw ins.error; company=ins.data;
 }else{
   // Update every visible duplicate with the same logical name, so stale profiles cannot override the new value later.
   const ids=rows.map(r=>r.id);
   const up=await supabase.from('companies').update(payload).in('id',ids.length?ids:[company.id]).select('*');
   if(up.error)throw up.error;
   company=(up.data||[]).find(r=>r.id===company.id)||up.data?.[0]||company;
 }
 const {data:mem}=await supabase.from('company_users').select('id').eq('company_id',company.id).eq('user_id',CLOUD.user.id).maybeSingle();
 if(!mem)await supabase.from('company_users').insert({company_id:company.id,user_id:CLOUD.user.id,role:'owner',status:'active'});
 return company;
}
ensureCompany = v23EnsureCompany;

async function v23SaveProfileAndRefresh(closeAfter=true){
 if(!activeProfileCompany)return;
 const company=activeProfileCompany;
 const profile=readProfileFields();
 setCompanyProfile(company,profile);
 // Force local docs to carry the newest profile object and clear any stale derived presentation.
 const key=profileKey(company);
 state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:normalizeProfile(profile),engineVersion:ENGINE_VERSION}:d);
 saveLocalOnly();
 let cloudOk=true, cloudError='';
 if(CLOUD.user){
   try{
     const c=await ensureCompany(company,profile);
     state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,_companyId:c.id,profile:normalizeProfile(profile)}:d);
     for(const d of state.docs.filter(d=>profileKey(d.company)===key)) await cloudSaveDocument(d);
     CLOUD.error=null;
   }catch(e){cloudOk=false;cloudError=e.message||'Errore cloud';CLOUD.error=cloudError;console.error(e);}
 }
 saveLocalOnly();
 renderAll();
 if(closeAfter){closeProfile();showView('companies','Azienda');}
 if(!cloudOk) alert('Profilo aggiornato in locale, ma non salvato su Supabase: '+cloudError);
 return cloudOk;
}

if(document.querySelector('#saveProfile'))document.querySelector('#saveProfile').onclick=()=>v23SaveProfileAndRefresh(true);
v22RefreshCompanyProfile = async function(company){
 if(!company)return;
 const p=getCompanyProfile(company);
 setCompanyProfile(company,p);
 await v23SaveProfileAndRefresh(false).catch(console.warn);
 state.docs.filter(d=>profileKey(d.company)===profileKey(company)).forEach(d=>{d.profile=normalizeProfile(p);d.engineVersion=ENGINE_VERSION;});
 saveLocalOnly();renderAll();
};

// Replace the injected refresh button with a real save+refresh from current form values.
function v23InjectProfileButtons(){
 v22InjectProfileButtons();
 const refresh=document.querySelector('#refreshProfileAnalysis');
 if(refresh){
   refresh.onclick=async()=>{await v23SaveProfileAndRefresh(false);alert('Profilo salvato e analisi ricalcolata con gli ultimi valori inseriti.');};
 }
}
v22InjectProfileButtons = v23InjectProfileButtons;

// If the user is already logged in from a previous session, force a cloud reload so stale localStorage values (ex. 15) do not win over Supabase (ex. 1,5).
setTimeout(async()=>{
 try{
  if(CLOUD.user && !state.platformAdmin && !window.__nomyra_v23_cloud_loaded){
    window.__nomyra_v23_cloud_loaded=true;
    await loadCloudData();
    renderAll();
    showView('home','Dashboard');
  }
 }catch(e){console.warn('V23 cloud reload',e.message);}
},900);

// Add a visible cloud reload button on dashboard if needed by support.
setTimeout(()=>{
 const host=document.querySelector('#contextActions');
 if(host && !document.querySelector('#forceCloudReload')){
  const b=document.createElement('button');b.id='forceCloudReload';b.className='ghost';b.type='button';b.textContent='Aggiorna dati cloud';
  b.onclick=async()=>{try{await loadCloudData();renderAll();alert('Dati cloud aggiornati.');}catch(e){alert(e.message||'Impossibile aggiornare i dati cloud.');}};
  host.appendChild(b);
 }
},1200);

/* V26 · responsive charts and deeper productivity/comparison analysis */
function v26CanvasSetup(canvas){
 if(!canvas)return null;
 const dpr=window.devicePixelRatio||1;
 const rect=canvas.getBoundingClientRect();
 const w=Math.max(260,rect.width||canvas.clientWidth||600),h=Math.max(220,rect.height||canvas.clientHeight||280);
 canvas.width=w*dpr;canvas.height=h*dpr;
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 return {ctx,w,h};
}
function v26Compact(v){
 if(v==null||!Number.isFinite(Number(v)))return '—';
 const n=Number(v),a=Math.abs(n);
 if(a>=1000000)return (n/1000000).toLocaleString('it-IT',{maximumFractionDigits:1})+'M';
 if(a>=1000)return (n/1000).toLocaleString('it-IT',{maximumFractionDigits:0})+'k';
 return n.toLocaleString('it-IT',{maximumFractionDigits:0});
}
function v26DrawNoData(canvas,msg='Dati insufficienti per il grafico'){
 const o=v26CanvasSetup(canvas);if(!o)return;const {ctx}=o;ctx.fillStyle='#6e7a83';ctx.font='14px system-ui';ctx.fillText(msg,18,32);
}
function v26DrawBar(canvas,labels,values,opts={}){
 const o=v26CanvasSetup(canvas);if(!o)return;const {ctx,w,h}=o;
 const rows=(labels||[]).map((l,i)=>({label:String(l||'—'),value:Number(values?.[i]||0)})).filter(r=>Number.isFinite(r.value));
 if(!rows.length)return v26DrawNoData(canvas);
 const max=Math.max(...rows.map(r=>Math.abs(r.value)),1),padL=44,padR=18,padT=18,padB=44,plotW=w-padL-padR,plotH=h-padT-padB;
 ctx.strokeStyle='#dfe6e3';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=padT+plotH*i/3;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();}
 const barW=Math.max(18,plotW/rows.length*.52);
 rows.forEach((r,i)=>{const x=padL+plotW*(i+.5)/rows.length-barW/2;const bh=Math.abs(r.value)/max*plotH;const y=padT+plotH-bh;ctx.fillStyle=opts.accent||'#1F5A5D';ctx.fillRect(x,y,barW,bh);ctx.fillStyle='#142033';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(v26Compact(r.value),x+barW/2,Math.max(12,y-6));ctx.fillStyle='#6e7a83';ctx.font='11px system-ui';let lab=r.label.length>13?r.label.slice(0,12)+'…':r.label;ctx.fillText(lab,x+barW/2,h-18);});
 ctx.textAlign='left';
}
function v26DrawGroupedBar(canvas,labels,series,opts={}){
 const o=v26CanvasSetup(canvas);if(!o)return;const {ctx,w,h}=o;
 const clean=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null&&Number.isFinite(Number(v))));
 if(!labels?.length||!clean.length)return v26DrawNoData(canvas);
 const vals=clean.flatMap(s=>s.values).filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number),max=Math.max(...vals.map(v=>Math.abs(v)),1),padL=48,padR=18,padT=24,padB=52,plotW=w-padL-padR,plotH=h-padT-padB;
 ctx.strokeStyle='#dfe6e3';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=padT+plotH*i/3;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();ctx.fillStyle='#8a97a0';ctx.font='10px system-ui';ctx.fillText(v26Compact(max*(3-i)/3),6,y+3);}
 const colors=['#1F5A5D','#B97850','#536CB8','#8EAF57'],groupW=plotW/labels.length*.7,barW=Math.max(10,groupW/clean.length*.78);
 labels.forEach((lab,i)=>{const baseX=padL+plotW*(i+.5)/labels.length-groupW/2;clean.forEach((s,j)=>{const v=Number(s.values[i]||0),bh=Math.abs(v)/max*plotH,x=baseX+j*(groupW/clean.length)+(groupW/clean.length-barW)/2,y=padT+plotH-bh;ctx.fillStyle=colors[j%colors.length];ctx.fillRect(x,y,barW,bh);});ctx.fillStyle='#6e7a83';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(String(lab),padL+plotW*(i+.5)/labels.length,h-22);});
 ctx.textAlign='left';clean.forEach((s,j)=>{ctx.fillStyle=colors[j%colors.length];ctx.fillRect(padL+j*130,padT-18,10,10);ctx.fillStyle='#142033';ctx.font='11px system-ui';ctx.fillText(s.label,padL+j*130+14,padT-9);});
}
function v26DrawLine(canvas,labels,series){
 const o=v26CanvasSetup(canvas);if(!o)return;const {ctx,w,h}=o;
 const clean=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null&&Number.isFinite(Number(v))));
 if(!labels?.length||!clean.length)return v26DrawNoData(canvas);
 const vals=clean.flatMap(s=>s.values).filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number),max=Math.max(...vals,1),min=Math.min(...vals,0),range=max-min||1,padL=48,padR=18,padT=26,padB=46,plotW=w-padL-padR,plotH=h-padT-padB,colors=['#1F5A5D','#B97850','#536CB8','#8EAF57'];
 ctx.strokeStyle='#dfe6e3';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=padT+plotH*i/3;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();}
 clean.forEach((s,j)=>{const pts=s.values.map((v,i)=>v==null?null:{x:labels.length===1?padL+plotW/2:padL+plotW*i/(labels.length-1),y:padT+plotH-(Number(v)-min)/range*plotH,v:Number(v)}).filter(Boolean);if(!pts.length)return;ctx.strokeStyle=colors[j%colors.length];ctx.lineWidth=2.6;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();pts.forEach(p=>{ctx.fillStyle=colors[j%colors.length];ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});ctx.fillStyle=colors[j%colors.length];ctx.fillRect(padL+j*130,padT-20,10,10);ctx.fillStyle='#142033';ctx.font='11px system-ui';ctx.fillText(s.label,padL+j*130+14,padT-11);});
 ctx.fillStyle='#6e7a83';ctx.font='11px system-ui';ctx.textAlign='center';labels.forEach((lab,i)=>{const x=labels.length===1?padL+plotW/2:padL+plotW*i/(labels.length-1);ctx.fillText(String(lab),x,h-18);});ctx.textAlign='left';
}
function v26EnsureComparisonCharts(){
 const table=document.querySelector('.comparison-panel');if(!table||document.querySelector('#comparisonCharts'))return;
 const block=document.createElement('div');block.id='comparisonCharts';block.className='v26-chart-grid';
 block.innerHTML=`<article class="v26-chart-card"><h3>Trend valori principali</h3><p>Ricavi, EBITDA e debiti dei due documenti.</p><canvas id="comparisonMainChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card"><h3>Marginalità e incidenze</h3><p>Indicatori normalizzati per evitare confronti distorti dalla dimensione.</p><canvas id="comparisonMarginChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card v26-chart-wide"><h3>Lettura grafica del confronto</h3><p id="comparisonGraphReading">Il grafico aiuta a capire quali voci muovono il risultato e dove approfondire.</p></article>`;
 table.parentNode.insertBefore(block,table);
}
const __v26RenderDirectComparison=renderDirectComparison;
renderDirectComparison=function(){
 __v26RenderDirectComparison();
 if(!state.lastComparison)return;const a=state.docs.find(d=>d.id===state.lastComparison.aId),b=state.docs.find(d=>d.id===state.lastComparison.bId);if(!a||!b)return;
 v26EnsureComparisonCharts();
 const labels=state.lastComparison.mode==='periods'?[a.period,b.period]:[a.company,b.company];
 v26DrawGroupedBar(document.querySelector('#comparisonMainChart'),labels,[{label:'Ricavi',values:[a.data?.revenue,b.data?.revenue]},{label:'EBITDA',values:[a.data?.ebitda,b.data?.ebitda]},{label:'Debiti',values:[a.data?.debt,b.data?.debt]}]);
 const za=derived(a),zb=derived(b,state.lastComparison.mode==='periods'?a:null);
 v26DrawGroupedBar(document.querySelector('#comparisonMarginChart'),labels,[{label:'EBITDA %',values:[za.ebitdaMargin,zb.ebitdaMargin]},{label:'Personale %',values:[za.personnelInc,zb.personnelInc]},{label:'Materie %',values:[za.materialsInc,zb.materialsInc]},{label:'Debiti/Ricavi %',values:[za.debtRevenue,zb.debtRevenue]}],{accent:'#B97850'});
 const rv=variation(b.data?.revenue,a.data?.revenue),ev=variation(b.data?.ebitda,a.data?.ebitda);
 const r=document.querySelector('#comparisonGraphReading');if(r){r.innerHTML=state.lastComparison.mode==='periods'?`Ricavi ${rv==null?'non confrontabili':(rv>=0?'+':'')+rv.toLocaleString('it-IT',{maximumFractionDigits:1})+'%'} · EBITDA ${ev==null?'non confrontabile':(ev>=0?'+':'')+ev.toLocaleString('it-IT',{maximumFractionDigits:1})+'%'}. Usa il grafico per vedere se la crescita deriva da volume, margine o struttura dei costi.`:'Il confronto mostra valori assoluti e indicatori normalizzati: utile per leggere differenze di scala, marginalità e peso dei debiti.';}
};

const __v26AnalyzeSalesRows=analyzeSalesRows;
analyzeSalesRows=function(rawRows){
 const metrics=__v26AnalyzeSalesRows(rawRows);
 const headers=Object.keys(rawRows[0]||{});
 const hDate=findHeader(headers,['data','date','giorno','mese','data fattura','data documento','riferimento data','doc date']);
 const hFamily=findHeader(headers,['famiglia','categoria','category','linea','gruppo prodotto']);
 const hCustomer=findHeader(headers,['cliente','customer','ragione sociale','nominativo','clienti']);
 const hProduct=findHeader(headers,['prodotto','articolo','descrizione','sku','item','referenza']);
 const hQty=findHeader(headers,['quantita','qta','qty','pezzi','unita','pz']);
 const hPrice=findHeader(headers,['prezzo unitario','prezzo','price','unitario']);
 const hRevenue=findHeader(headers,['fatturato','ricavo','totale','importo','valore','imponibile','prezzo totale']);
 const parseDate=(v)=>{if(v==null||v==='')return null;if(v instanceof Date&&!isNaN(v))return v;const s=String(v).trim();let m=s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return new Date(y,Number(m[2])-1,Number(m[1]));}m=s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return null;};
 const rows=rawRows.map(r=>{const qty=parseAmount(r[hQty]),price=parseAmount(r[hPrice]);let revenue=parseAmount(r[hRevenue]);if((revenue==null||revenue===0)&&qty!=null&&price!=null)revenue=qty*price;return {customer:hCustomer?String(r[hCustomer]||'').trim():'',product:hProduct?String(r[hProduct]||'').trim():'',family:hFamily?String(r[hFamily]||'').trim():'',qty,unitPrice:price,revenue,date:hDate?parseDate(r[hDate]):null};}).filter(r=>r.revenue!=null&&Number.isFinite(r.revenue)&&Math.abs(r.revenue)>0);
 const byMonth=new Map(),byFamily=new Map();
 rows.forEach(r=>{if(r.date){const k=`${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;byMonth.set(k,(byMonth.get(k)||0)+r.revenue);}if(r.family){byFamily.set(r.family,(byFamily.get(r.family)||0)+r.revenue);}});
 metrics.monthlyRevenue=[...byMonth.entries()].sort().map(([month,revenue])=>({month,revenue}));
 metrics.topFamilies=[...byFamily.entries()].map(([name,revenue])=>({name,revenue})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
 metrics.headers.date=hDate;metrics.headers.family=hFamily;
 return metrics;
};
function v26EnsureProductivityCharts(){
 const metrics=document.querySelector('#productivityMetrics');if(!metrics||document.querySelector('#productivityCharts'))return;
 const block=document.createElement('div');block.id='productivityCharts';block.className='v26-chart-grid';
 block.innerHTML=`<article class="v26-chart-card"><h3>Fatturato mensile</h3><p>Trend delle vendite se il file contiene una colonna data.</p><canvas id="prodMonthlyChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card"><h3>Top prodotti</h3><p>Prodotti con maggiore impatto sul fatturato.</p><canvas id="prodProductsChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card"><h3>Top clienti</h3><p>Concentrazione del fatturato sui principali clienti.</p><canvas id="prodCustomersChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card"><h3>Famiglie prodotto</h3><p>Mix vendite per famiglia/categoria, se disponibile.</p><canvas id="prodFamiliesChart" class="v26-chart-canvas"></canvas></article><article class="v26-chart-card v26-chart-wide"><h3>Lettura produttività</h3><p id="productivityGraphReading">Carica un Excel vendite per generare analisi grafica di clienti, prodotti, prezzi e fatturato.</p></article>`;
 metrics.parentNode.insertBefore(block,metrics.nextSibling);
}
const __v26RenderProductivity=renderProductivity;
renderProductivity=function(){
 __v26RenderProductivity();
 v26EnsureProductivityCharts();
 const p=currentProductivity();
 if(!p||!p.metrics){['#prodMonthlyChart','#prodProductsChart','#prodCustomersChart','#prodFamiliesChart'].forEach(sel=>v26DrawNoData(document.querySelector(sel),'Carica un file vendite per generare il grafico'));return;}
 const m=p.metrics;
 if(m.monthlyRevenue?.length)v26DrawLine(document.querySelector('#prodMonthlyChart'),m.monthlyRevenue.map(x=>x.month),[{label:'Fatturato',values:m.monthlyRevenue.map(x=>x.revenue)}]);else v26DrawNoData(document.querySelector('#prodMonthlyChart'),'Aggiungi una colonna data per vedere il trend mensile');
 const products=(m.topProducts||[]).slice(0,8),customers=(m.topCustomers||[]).slice(0,8),families=(m.topFamilies||[]).slice(0,8);
 v26DrawBar(document.querySelector('#prodProductsChart'),products.map(x=>x.name||'—'),products.map(x=>x.revenue));
 v26DrawBar(document.querySelector('#prodCustomersChart'),customers.map(x=>x.name||'—'),customers.map(x=>x.revenue),{accent:'#B97850'});
 if(families.length)v26DrawBar(document.querySelector('#prodFamiliesChart'),families.map(x=>x.name||'—'),families.map(x=>x.revenue),{accent:'#536CB8'});else v26DrawNoData(document.querySelector('#prodFamiliesChart'),'Aggiungi una colonna famiglia/categoria per vedere il mix');
 const read=document.querySelector('#productivityGraphReading');
 if(read){const topC=customers[0],topP=products[0];read.innerHTML=`Fatturato vendite ${fmt(m.totalRevenue)} · ${num(m.uniqueCustomers)} clienti · ${num(m.uniqueProducts)} prodotti. ${topC?`Primo cliente: <strong>${esc(topC.name)}</strong> (${pct(topC.revenue/m.totalRevenue*100)} del fatturato).`:''} ${topP?`Primo prodotto: <strong>${esc(topP.name)}</strong> (${pct(topP.revenue/m.totalRevenue*100)}).`:''}`;}
};

// Force a redraw of custom charts after resize without creating horizontal overflow.
let __v26ResizeTimer=null;window.addEventListener('resize',()=>{clearTimeout(__v26ResizeTimer);__v26ResizeTimer=setTimeout(()=>{try{if(state.lastComparison)renderDirectComparison();if(document.querySelector('#productivity.view.active'))renderProductivity();}catch(e){console.warn(e)}},180);});


// V27: Excel export reale in formato tabellare (.xlsx), non HTML mascherato da Excel.
function v27CleanSheetName(name){return String(name||'Report').replace(/[\\/?*\[\]:]/g,' ').slice(0,31)||'Report';}
function v27AoAFromKpis(doc){
  const prev=previousDoc(doc); const rows=kpiRowsForDoc(doc,prev);
  return [['Area','Indicatore','Valore','Tipo','Formula','Lettura','Dati usati']].concat(rows.map(r=>[
    r.area||'', r.label, r.available? (r.type==='money'||r.type==='pct'||r.type==='ratio'? Number(r.value): r.value) : '', r.type||'', r.formula||'', r.reading||'', dependencyRowsForKpi(r,doc,prev).map(x=>`${x.name}: ${formatMetricValue(x.key,x.value)}`).join(' | ')
  ]));
}
function v27AoAFromValues(doc){
  const data=doc?.data||{}, sources=doc?.sources||{};
  const keys=Object.keys(data).sort();
  return [['Chiave','Voce','Valore','Metodo','Fonte','Riga']].concat(keys.map(k=>{
    const s=sources[k]||{}; const lines=sourceLines(s).join(' | ');
    return [k, metricNames[k]||k, Number(data[k]), sourceMethodLabel(s), s.formula||s.source||'', lines];
  }));
}
function v27AoAFromSummary(doc){
  const z=derivedIndicators(doc,previousDoc(doc)); const cp=completeness(doc);
  return [['Campo','Valore'],['Azienda',doc?.company||''],['Periodo',doc?.period||''],['Ricavi',doc?.data?.revenue??''],['Valore produzione',doc?.data?.productionValue??''],['EBITDA / MOL',doc?.data?.ebitda??''],['EBITDA margin %',z.ebitdaMargin??''],['EBIT',doc?.data?.ebit??''],['Utile netto',doc?.data?.netIncome??''],['Debiti',doc?.data?.debt??''],['Copertura dati',`${cp.found}/${cp.total}`],['Profilo aziendale',profileContextText(doc)]];
}
function v27AoAComparison(){
  const c=state.lastComparison;if(!c?.a||!c?.b)return [['Nessun confronto disponibile']];
  const a=c.a,b=c.b,za=derivedIndicators(a),zb=derivedIndicators(b);
  const rows=[['Indicatore',`${a.company} ${a.period}`,`${b.company} ${b.period}`,'Variazione / differenza'],
    ['Ricavi',a.data?.revenue??'',b.data?.revenue??'',variation(b.data?.revenue,a.data?.revenue)??''],
    ['Valore produzione',a.data?.productionValue??'',b.data?.productionValue??'',variation(b.data?.productionValue,a.data?.productionValue)??''],
    ['EBITDA',a.data?.ebitda??'',b.data?.ebitda??'',variation(b.data?.ebitda,a.data?.ebitda)??''],
    ['EBITDA margin %',za.ebitdaMargin??'',zb.ebitdaMargin??'',(zb.ebitdaMargin!=null&&za.ebitdaMargin!=null)?zb.ebitdaMargin-za.ebitdaMargin:''],
    ['EBIT',a.data?.ebit??'',b.data?.ebit??'',variation(b.data?.ebit,a.data?.ebit)??''],
    ['Debiti',a.data?.debt??'',b.data?.debt??'',variation(b.data?.debt,a.data?.debt)??''],
    ['Personale/Ricavi %',za.personnelInc??'',zb.personnelInc??'',(zb.personnelInc!=null&&za.personnelInc!=null)?zb.personnelInc-za.personnelInc:'']
  ];return rows;
}
function v27AoAProductivity(){
  const rows=state.productivity||[]; if(!rows.length)return [['Nessun file produttività caricato']];
  return [['Azienda','Periodo','File','Ricavi vendite','Clienti','Prodotti','Unità','Prezzo medio ponderato','Top cliente %','Top prodotto %']].concat(rows.map(r=>[r.company||'',r.period||'',r.name||'',r.totalRevenue??'',r.customersCount??'',r.productsCount??'',r.unitsTotal??'',r.weightedAvgPrice??'',r.topCustomerShare??'',r.topProductShare??'']));
}
function v27WriteWorkbook(kind){
  if(!window.XLSX)throw new Error('Libreria Excel non caricata.');
  const wb=XLSX.utils.book_new(); const doc=currentDoc();
  const add=(name,aoa)=>{const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!cols']=(aoa[0]||[]).map(()=>({wch:24})); XLSX.utils.book_append_sheet(wb,ws,v27CleanSheetName(name));};
  if(kind==='comparison'||kind==='period_comparison'||kind==='company_comparison'){add('Confronto',v27AoAComparison()); if(state.lastComparison?.a)add('KPI A',v27AoAFromKpis(state.lastComparison.a)); if(state.lastComparison?.b)add('KPI B',v27AoAFromKpis(state.lastComparison.b));}
  else if(kind==='productivity'){add('Produttivita',v27AoAProductivity());}
  else {if(!doc)throw new Error('Nessun documento selezionato.'); add('Sintesi',v27AoAFromSummary(doc)); add('KPI',v27AoAFromKpis(doc)); add('Valori e fonti',v27AoAFromValues(doc));}
  const base=(reportTitle(kind)||'nomyra-report').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
  XLSX.writeFile(wb,`${base}.xlsx`);
  registerReportExport(kind,(reportTitle(kind)||'Report')+' · Excel tabellare');
}
downloadExcelReport=function(kind){try{v27WriteWorkbook(kind);}catch(e){alert(e.message||'Report Excel non disponibile.');}};
bindReportExports=function(){
  document.querySelectorAll('[data-export-report]').forEach(b=>{b.onclick=()=>downloadPDFReport(b.dataset.exportReport);});
  document.querySelectorAll('[data-export-excel]').forEach(b=>{b.onclick=()=>downloadExcelReport(b.dataset.exportExcel);});
};
try{bindReportExports();}catch(e){}


/* V28 · profili aziendali in card + deduplica visiva + aggiornamento cloud più chiaro */
function v28CompanyRows(){
  const map=new Map();
  uniqueCompanies().forEach(c=>{
    const key=profileKey(c); if(!map.has(key)) map.set(key,{company:c,docs:[],sales:[],profile:getCompanyProfile(c)});
  });
  (state.docs||[]).forEach(d=>{
    const key=profileKey(d.company); if(!map.has(key)) map.set(key,{company:d.company,docs:[],sales:[],profile:getCompanyProfile(d.company)});
    map.get(key).docs.push(d);
  });
  (state.productivity||[]).forEach(s=>{
    const key=profileKey(s.company); if(!map.has(key)) map.set(key,{company:s.company,docs:[],sales:[],profile:getCompanyProfile(s.company)});
    map.get(key).sales.push(s);
  });
  return [...map.values()].map(r=>{
    r.profile=getCompanyProfile(r.company);
    r.pc=profileCompleteness(r.profile);
    r.latest=r.docs.slice().sort((a,b)=>String(b.period).localeCompare(String(a.period))).at(0)||null;
    return r;
  }).sort((a,b)=>a.company.localeCompare(b.company));
}
function v28ProfileChips(profile){
  const p=normalizeProfile(profile||{}); const chips=[];
  if(p.sector) chips.push(p.sector);
  if(p.businessModel) chips.push(p.businessModel);
  if(p.customerType) chips.push(p.customerType);
  if(p.avgProductPrice!=null) chips.push('Prezzo medio '+fmt(p.avgProductPrice));
  if(p.avgOrderValue!=null) chips.push('Ordine medio '+fmt(p.avgOrderValue));
  if(p.annualUnits!=null) chips.push(num(p.annualUnits)+' unità/anno');
  if(p.employees!=null) chips.push(num(p.employees)+' addetti');
  if(p.exportShare!=null) chips.push('Export '+pct(p.exportShare));
  if(p.seasonality) chips.push('Stagionalità '+p.seasonality);
  return chips.length?`<div class="company-profile-summary">${chips.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'<small>Profilo aziendale non compilato.</small>';
}
v22RenderCompanies=function(){
  const tb=document.querySelector('#companiesTable'); if(!tb)return;
  const rows=v28CompanyRows();
  if(!rows.length){tb.innerHTML='<tr><td colspan="5" class="empty-state">Nessuna azienda ancora presente. Crea il profilo aziendale o carica un bilancio.</td></tr>';return;}
  tb.innerHTML=rows.map(r=>`<tr>
    <td><strong>${esc(r.company)}</strong><small>${r.latest?`Ultimo bilancio ${esc(r.latest.period)}`:'Nessun bilancio collegato'}</small></td>
    <td><strong>${esc(r.pc.label)}</strong>${v28ProfileChips(r.profile)}</td>
    <td><div class="company-metric-row"><div><span>Bilanci</span><b>${r.docs.length}</b></div><div><span>Produttività</span><b>${r.sales.length}</b></div></div></td>
    <td></td>
    <td><button class="mini-btn primary-mini" data-company-profile="${esc(r.company)}">Modifica profilo</button><button class="mini-btn" data-company-refresh="${esc(r.company)}">Aggiorna analisi</button><button class="mini-btn" data-company-open="${esc(r.company)}">Apri analisi</button><button class="mini-btn danger" data-company-delete-profile="${esc(r.company)}">Elimina profilo</button></td>
  </tr>`).join('');
  tb.onclick=async e=>{
    const t=e.target;
    if(t.dataset.companyProfile){openProfile(t.dataset.companyProfile);return;}
    if(t.dataset.companyRefresh){await v23SaveProfileAndRefresh(false).catch(console.warn);renderAll();alert('Dati aggiornati. Se hai modificato il profilo, apri Modifica profilo → Salva per propagare i valori.');return;}
    if(t.dataset.companyDeleteProfile){v22DeleteCompanyProfile(t.dataset.companyDeleteProfile);return;}
    if(t.dataset.companyOpen){state.selectedCompany=t.dataset.companyOpen;state.selectedPeriod='';renderAll();showView(state.docs.some(d=>profileKey(d.company)===profileKey(t.dataset.companyOpen))?'overview':'documents','Analisi bilancio');}
  };
};

// In caso di dati cloud duplicati, mostra sempre un solo profilo per nome e non lascia che valori vecchi prevalgano localmente.
const __v28LoadCloudData = loadCloudData;
loadCloudData = async function(){
  const ok = await __v28LoadCloudData();
  const fixed={};
  (state.docs||[]).forEach(d=>{ if(d.company){ const k=profileKey(d.company); fixed[k]=normalizeProfile({...((state.profiles||{})[k]||{}), ...(d.profile||{}), ...((state.profiles||{})[k]||{})}); }});
  state.profiles={...(state.profiles||{}),...fixed};
  saveLocalOnly();
  return ok;
};

// Forza ricalcolo vista Azienda dopo il reload Cloudflare/cache.
setTimeout(()=>{try{v22RenderCompanies();}catch(e){}},600);


/* V29 · cloud persistence guard, real delete, profile save confirmation */
function v29Toast(message,type='ok'){
  let el=document.querySelector('#v29Toast');
  if(!el){el=document.createElement('div');el.id='v29Toast';el.style.cssText='position:fixed;right:22px;bottom:22px;z-index:10000;background:#fff;border:1px solid #dbe6e3;border-radius:14px;padding:12px 14px;box-shadow:0 16px 48px rgba(20,32,51,.16);font:600 13px Inter,Arial;color:#102033;max-width:360px';document.body.appendChild(el);} 
  el.textContent=message; el.style.borderColor=type==='error'?'#efc7c7':'#dbe6e3'; el.style.color=type==='error'?'#9c3434':'#102033';
  clearTimeout(el._timer); el._timer=setTimeout(()=>el.remove(),3600);
}
function v29SetCloudBusy(on,label='Sincronizzazione…'){
  CLOUD.busy=!!on; updateCloudUI();
  let b=document.querySelector('#forceCloudReload'); if(b)b.disabled=!!on;
  let badge=document.querySelector('#v29PersistBadge');
  const host=document.querySelector('#contextActions');
  if(host && !badge){badge=document.createElement('span');badge.id='v29PersistBadge';badge.className='persist-badge';host.appendChild(badge);} 
  if(badge){badge.className='persist-badge '+(on?'syncing':(CLOUD.error?'error':'ok'));badge.textContent=on?label:(CLOUD.error?'Errore salvataggio':'Salvato');}
}
async function v29PersistCompanyProfile(company,profile){
  if(!CLOUD.user)return {cloud:false};
  v29SetCloudBusy(true,'Salvataggio profilo…');
  try{
    const row=await ensureCompany(company,profile);
    const key=profileKey(company);
    state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,_companyId:row.id,profile:normalizeProfile(profile)}:d);
    CLOUD.error=null; return {cloud:true,row};
  }catch(e){CLOUD.error=e.message||'Errore salvataggio';throw e;}
  finally{v29SetCloudBusy(false);}
}
async function v29SaveProfile(closeAfter=true){
  if(!activeProfileCompany)return false;
  const company=activeProfileCompany;
  const profile=readProfileFields();
  const key=profileKey(company);
  setCompanyProfile(company,profile);
  state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:normalizeProfile(profile),engineVersion:ENGINE_VERSION}:d);
  saveLocalOnly();
  const btn=document.querySelector('#saveProfile'); const oldText=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…';}
  try{
    await v29PersistCompanyProfile(company,profile);
    saveLocalOnly(); renderAll();
    if(closeAfter){closeProfile();showView('companies','Azienda');}
    v29Toast('Profilo salvato nel cloud e ricalcolato.');
    return true;
  }catch(e){
    v29Toast('Non salvato su Supabase: '+(e.message||'errore'), 'error');
    return false;
  }finally{
    if(btn){btn.disabled=false;btn.textContent=oldText||'Salva profilo';}
  }
}
async function v29DeleteRemoteDocument(doc){
  if(!CLOUD.user || !doc?._remoteId)return;
  const id=doc._remoteId;
  const ops=[
    supabase.from('financial_values').delete().eq('document_id',id),
    supabase.from('financial_kpis').delete().eq('document_id',id),
    supabase.from('report_exports').delete().eq('document_id',id),
    supabase.from('financial_documents').delete().eq('id',id)
  ];
  const res=await Promise.all(ops);
  const err=res.find(x=>x.error)?.error; if(err)throw err;
}
async function v29DeleteDocument(id){
  const doc=state.docs.find(d=>d.id===id); if(!doc)return;
  if(!confirm(`Eliminare definitivamente il bilancio ${doc.company} ${doc.period}?`))return;
  v29SetCloudBusy(true,'Eliminazione bilancio…');
  try{
    await v29DeleteRemoteDocument(doc);
    state.docs=state.docs.filter(d=>d.id!==id);
    if(state.selectedPeriod===doc.period && profileKey(state.selectedCompany)===profileKey(doc.company)) state.selectedPeriod='';
    saveLocalOnly(); renderAll(); v29Toast('Bilancio eliminato dal cloud.');
  }catch(e){v29Toast('Bilancio non eliminato su Supabase: '+(e.message||'errore'),'error');}
  finally{v29SetCloudBusy(false);}
}
async function v29ClearRemoteCompanyProfile(company){
  if(!CLOUD.user)return;
  const name=String(company||'').trim(); if(!name)return;
  const payload={sector:null,business_type:null,operating_model:null,customer_type:null,avg_product_price:null,avg_order_value:null,yearly_units:null,employees:null,sites:null,export_percentage:null,seasonality:null,notes:null,updated_at:new Date().toISOString()};
  const {data:rows,error}=await supabase.from('companies').select('id,name').ilike('name',name);
  if(error)throw error;
  const ids=(rows||[]).filter(r=>profileKey(r.name)===profileKey(name)).map(r=>r.id);
  if(ids.length){const up=await supabase.from('companies').update(payload).in('id',ids); if(up.error)throw up.error;}
}
async function v29DeleteCompanyProfile(company){
  if(!company)return;
  if(!confirm(`Eliminare il profilo aziendale di ${company}? I bilanci resteranno caricati.`))return;
  const key=profileKey(company);
  v29SetCloudBusy(true,'Eliminazione profilo…');
  try{
    await v29ClearRemoteCompanyProfile(company);
    if(state.profiles) state.profiles[key]=normalizeProfile({});
    state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:{}}:d);
    saveLocalOnly(); renderAll(); v29Toast('Profilo eliminato dal cloud.');
  }catch(e){v29Toast('Profilo non eliminato su Supabase: '+(e.message||'errore'),'error');}
  finally{v29SetCloudBusy(false);}
}
async function v29DeleteCompanyFull(company){
  if(!company)return;
  if(!confirm(`Eliminare definitivamente l’azienda ${company} con bilanci, KPI e file collegati?`))return;
  const key=profileKey(company);
  v29SetCloudBusy(true,'Eliminazione azienda…');
  try{
    if(CLOUD.user){
      const {data:rows,error}=await supabase.from('companies').select('id,name').ilike('name',company);
      if(error)throw error;
      const ids=(rows||[]).filter(r=>profileKey(r.name)===key).map(r=>r.id);
      for(const id of ids){const del=await supabase.from('companies').delete().eq('id',id); if(del.error)throw del.error;}
    }
    state.docs=state.docs.filter(d=>profileKey(d.company)!==key);
    state.productivity=state.productivity.filter(p=>profileKey(p.company)!==key);
    if(state.profiles) delete state.profiles[key];
    if(profileKey(state.selectedCompany)===key){state.selectedCompany='';state.selectedPeriod='';}
    saveLocalOnly(); renderAll(); showView('companies','Azienda'); v29Toast('Azienda eliminata.');
  }catch(e){v29Toast('Azienda non eliminata su Supabase: '+(e.message||'errore'),'error');}
  finally{v29SetCloudBusy(false);}
}
// override company actions with persistent operations
const __v29RenderCompaniesBase = v22RenderCompanies;
v22RenderCompanies=function(){
  __v29RenderCompaniesBase();
  const tb=document.querySelector('#companiesTable'); if(!tb)return;
  tb.querySelectorAll('[data-company-delete-full]').forEach(x=>x.remove());
  tb.querySelectorAll('[data-company-delete-profile]').forEach(btn=>{
    btn.textContent='Elimina profilo';
    if(!btn.parentElement.querySelector('[data-company-delete-full]')){
      const full=document.createElement('button'); full.className='mini-btn danger'; full.textContent='Elimina azienda'; full.dataset.companyDeleteFull=btn.dataset.companyDeleteProfile; btn.after(full);
    }
  });
  tb.onclick=async e=>{
    const t=e.target;
    if(t.dataset.companyProfile){openProfile(t.dataset.companyProfile);return;}
    if(t.dataset.companyRefresh){await v29SaveProfile(false);renderAll();return;}
    if(t.dataset.companyDeleteProfile){await v29DeleteCompanyProfile(t.dataset.companyDeleteProfile);return;}
    if(t.dataset.companyDeleteFull){await v29DeleteCompanyFull(t.dataset.companyDeleteFull);return;}
    if(t.dataset.companyOpen){state.selectedCompany=t.dataset.companyOpen;state.selectedPeriod='';renderAll();showView(state.docs.some(d=>profileKey(d.company)===profileKey(t.dataset.companyOpen))?'overview':'documents','Analisi bilancio');}
  };
};
// profile modal buttons
if(document.querySelector('#saveProfile')) document.querySelector('#saveProfile').onclick=()=>v29SaveProfile(true);
v22DeleteCompanyProfile = v29DeleteCompanyProfile;
v22RefreshCompanyProfile = async function(company){ if(!company)return; openProfile(company); v29Toast('Apri Modifica profilo, controlla i valori e clicca Salva.'); };
// documents delete handler persisted to cloud
function v29BindDocumentsTable(){
  const tb=document.querySelector('#documentsTable'); if(!tb)return;
  tb.onclick=e=>{const t=e.target;if(t.dataset.review){openReview(t.dataset.review);return;}if(t.dataset.profile){openProfile(t.dataset.profile);return;}if(t.dataset.details){openDetails(t.dataset.details);return;}if(t.dataset.delete){v29DeleteDocument(t.dataset.delete);return;}if(t.dataset.select){const d=state.docs.find(x=>x.id===t.dataset.select);if(!d)return;state.selectedCompany=d.company;state.selectedPeriod=d.period;document.querySelector('.nav-item[data-view="overview"]')?.click();renderAll();}};
}
// force cloud load and no stale local dashboard after login/session restore
const __v29LoadCloudData = loadCloudData;
loadCloudData = async function(){
  const ok=await __v29LoadCloudData();
  try{
    const {data:companies}=await supabase.from('companies').select('*').order('updated_at',{ascending:false});
    const {data:docs}=await supabase.from('financial_documents').select('company_id,id');
    const docCount={}; (docs||[]).forEach(d=>docCount[d.company_id]=(docCount[d.company_id]||0)+1);
    const best={};
    (companies||[]).forEach(c=>{const k=profileKey(c.name); if(!best[k] || (docCount[c.id]||0)>(docCount[best[k].id]||0)) best[k]=c;});
    Object.values(best).forEach(c=>{state.profiles[profileKey(c.name)]=companyRowToProfile(c);});
    state.docs=state.docs.map(d=>({...d,profile:state.profiles[profileKey(d.company)]||d.profile||{}}));
    saveLocalOnly();
  }catch(e){console.warn('v29 dedupe profiles',e.message);} 
  renderAll(); return ok;
};
const __v29RenderAll = renderAll;
renderAll=function(){__v29RenderAll();v29BindDocumentsTable();};
setTimeout(()=>{try{v29BindDocumentsTable();v22RenderCompanies();document.body.classList.add('boot-ready');document.body.classList.remove('cloud-booting');}catch(e){}},700);

/* V32 · persistence + decimal parsing hardening
   Fix: values typed as 1.5 must remain 1.5, not 15. Disable unsafe automatic local->cloud sync. */
parseProfileNumber = function(v){
  if(v==null || String(v).trim()==='') return null;
  let s=String(v).trim().replace(/\s/g,'').replace(/[^0-9,\.\-]/g,'');
  if(!s) return null;
  const commaCount=(s.match(/,/g)||[]).length;
  const dotCount=(s.match(/\./g)||[]).length;
  if(commaCount>0){
    // Italian format: 1.234,56 or 1,5
    s=s.replace(/\./g,'').replace(',','.');
  }else if(dotCount>1){
    // Thousand separators only: 1.300.000
    s=s.replace(/\./g,'');
  }else if(dotCount===1){
    const parts=s.split('.');
    // Decimal dot: 1.5 / 1.50 / 1500.75. Thousand dot: 1.300 or 1.300000.
    if(parts[1] && parts[1].length<=2){
      // keep as decimal
    }else{
      s=s.replace(/\./g,'');
    }
  }
  const n=Number(s);
  return Number.isFinite(n)?n:null;
};

normalizeProfile = function(p={}){
 return {
  sector:p.sector||'',
  businessModel:p.businessModel||'',
  customerType:p.customerType||'',
  avgProductPrice:parseProfileNumber(p.avgProductPrice),
  avgOrderValue:parseProfileNumber(p.avgOrderValue),
  annualUnits:parseProfileNumber(p.annualUnits),
  employees:parseProfileNumber(p.employees),
  plants:p.plants||'',
  exportShare:parseProfileNumber(p.exportShare),
  seasonality:p.seasonality||'',
  notes:p.notes||''
 };
};

// Avoid stale localStorage silently restoring old cloud values. Cloud writes are explicit only.
queueCloudSync = function(){};
save = function(){ saveLocalOnly(); };

async function v32EnsureCompany(companyName,profile={}){
 if(!CLOUD.user) throw new Error('LOGIN_REQUIRED');
 const name=String(companyName||'').trim(); if(!name) throw new Error('COMPANY_REQUIRED');
 const normalized=profileKey(name);
 const payload={...profileToCompanyRow(name,profile),created_by:CLOUD.user.id,updated_at:new Date().toISOString()};
 let {data:rows,error}=await supabase.from('companies').select('*').ilike('name',name);
 if(error) throw error;
 rows=(rows||[]).filter(r=>profileKey(r.name)===normalized);
 const ids=rows.map(r=>r.id);
 let preferredId=(state.docs||[]).find(d=>profileKey(d.company)===normalized && d._companyId)?._companyId;
 let company=rows.find(r=>r.id===preferredId)||rows[0]||null;
 if(company){
   const up=await supabase.from('companies').update(payload).in('id',ids.length?ids:[company.id]).select('*');
   if(up.error) throw up.error;
   company=(up.data||[]).find(r=>r.id===company.id)||up.data?.[0]||company;
 }else{
   const ins=await supabase.from('companies').insert(payload).select('*').single();
   if(ins.error) throw ins.error;
   company=ins.data;
 }
 const {data:mem,error:memErr}=await supabase.from('company_users').select('id').eq('company_id',company.id).eq('user_id',CLOUD.user.id).maybeSingle();
 if(memErr) throw memErr;
 if(!mem){
   const add=await supabase.from('company_users').insert({company_id:company.id,user_id:CLOUD.user.id,role:'owner',status:'active'});
   if(add.error && !String(add.error.message||'').includes('duplicate')) throw add.error;
 }
 return company;
}
ensureCompany = v32EnsureCompany;

async function v32PersistCompanyProfile(company,profile){
 if(!CLOUD.user) return {cloud:false};
 v29SetCloudBusy(true,'Salvataggio profilo…');
 try{
   const row=await ensureCompany(company,profile);
   const key=profileKey(company);
   state.profiles[key]=normalizeProfile(profile);
   state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,_companyId:row.id,profile:normalizeProfile(profile)}:d);
   CLOUD.error=null;
   return {cloud:true,row};
 }catch(e){CLOUD.error=e.message||'Errore salvataggio';throw e;}
 finally{v29SetCloudBusy(false);}
}
v29PersistCompanyProfile = v32PersistCompanyProfile;

async function v32SaveProfile(closeAfter=true){
  if(!activeProfileCompany) return false;
  const company=activeProfileCompany;
  const profile=readProfileFields();
  const key=profileKey(company);
  const btn=document.querySelector('#saveProfile'); const old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…';}
  try{
    setCompanyProfile(company,profile);
    state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:normalizeProfile(profile),engineVersion:ENGINE_VERSION}:d);
    await v32PersistCompanyProfile(company,profile);
    saveLocalOnly();
    // Re-read cloud so the UI shows exactly what Supabase accepted.
    if(CLOUD.user){await loadCloudData();}
    renderAll();
    if(closeAfter){closeProfile();showView('companies','Azienda');}
    v29Toast('Profilo salvato e sincronizzato con Supabase.');
    return true;
  }catch(e){
    v29Toast('Non salvato su Supabase: '+(e.message||'errore'),'error');
    return false;
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||'Salva profilo';}
  }
}
v29SaveProfile = v32SaveProfile;
if(document.querySelector('#saveProfile')) document.querySelector('#saveProfile').onclick=()=>v32SaveProfile(true);

// Make cloud reload the source of truth and never immediately push local stale data back up.
const __v32LoadCloudData = loadCloudData;
loadCloudData = async function(){
  const ok = await __v32LoadCloudData();
  saveLocalOnly();
  return ok;
};

console.info('NOMYRA Finance V32 loaded: robust decimal parser and explicit cloud persistence.');


/* V34 · fix recursive profile save handler
   The previous chain replaced v22InjectProfileButtons with a function that called itself.
   This caused "Maximum call stack size exceeded" during profile save/render.
   V34 installs a non-recursive handler and avoids full cloud reload inside Save profile. */
function v34SafeInjectProfileButtons(){
  const saveBtn=document.querySelector('#saveProfile');
  if(saveBtn) saveBtn.onclick=()=>v34SaveProfile(true);
  const refresh=document.querySelector('#refreshProfileAnalysis');
  if(refresh){
    refresh.onclick=async()=>{
      const ok=await v34SaveProfile(false);
      if(ok) v29Toast('Profilo salvato e analisi aggiornata.');
    };
  }
}
v22InjectProfileButtons = v34SafeInjectProfileButtons;

async function v34SaveProfile(closeAfter=true){
  if(!activeProfileCompany) return false;
  const company=activeProfileCompany;
  const profile=readProfileFields();
  const key=profileKey(company);
  const btn=document.querySelector('#saveProfile');
  const old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…';}
  try{
    // Local update first, so UI uses the typed values immediately.
    setCompanyProfile(company,profile);
    state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,profile:normalizeProfile(profile),engineVersion:ENGINE_VERSION}:d);

    // Cloud update, explicit and awaited.
    if(CLOUD.user){
      const row=await ensureCompany(company,profile);
      state.docs=state.docs.map(d=>profileKey(d.company)===key?{...d,_companyId:row.id,profile:normalizeProfile(profile)}:d);
    }

    saveLocalOnly();
    renderAll();
    if(closeAfter){closeProfile();showView('companies','Azienda');}
    v29Toast('Profilo salvato su Supabase.');
    return true;
  }catch(e){
    console.error('V34 profile save failed',e);
    v29Toast('Non salvato su Supabase: '+(e.message||'errore'),'error');
    return false;
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||'Salva profilo';}
  }
}
v29SaveProfile = v34SaveProfile;
if(document.querySelector('#saveProfile')) document.querySelector('#saveProfile').onclick=()=>v34SaveProfile(true);

// Make render bindings safe after every render without recursive injection.
const __v34RenderAll = renderAll;
renderAll = function(){
  __v34RenderAll();
  try{v34SafeInjectProfileButtons();}catch(e){console.warn('v34 inject',e.message);}
};
setTimeout(()=>{try{v34SafeInjectProfileButtons();}catch(e){}},300);
console.info('NOMYRA Finance V34 loaded: fixed recursive save/render stack.');


/* V35 · dashboard cliente personalizzata + account/logout in topbar */
function v35DisplayName(email){
  const e=String(email||'').trim();
  if(!e)return 'Utente';
  return e.split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
}
function v35LatestDoc(){
  const selected=currentDoc?.();
  if(selected)return selected;
  return (state.docs||[]).slice().sort((a,b)=>String(b.period||'').localeCompare(String(a.period||''))||String(b.id||'').localeCompare(String(a.id||'')))[0]||null;
}
function v35MainCompany(){
  return state.selectedCompany || v35LatestDoc()?.company || uniqueCompanies?.()[0] || 'Workspace cliente';
}
function v35Logout(){
  return (async()=>{
    try{ if(window.supabase && CLOUD.user) await supabase.auth.signOut(); }catch(e){ console.warn('logout',e.message); }
    CLOUD.session=null;CLOUD.user=null;CLOUD.ready=false;state.platformAdmin=false;state.demoUnlocked=false;
    state.docs=[];state.profiles={};state.productivity=[];state.selectedCompany='';state.selectedPeriod='';state.lastComparison=null;
    localStorage.removeItem('nomyra-finance-demo-unlocked-v21');
    try{saveLocalOnly();}catch(e){}
    updateCloudUI();renderAll();showView('access','Accesso utenti');
  })();
}
function v35EnsureAccountHost(){
  const topbar=document.querySelector('.topbar'); if(!topbar)return null;
  let host=document.querySelector('#accountActions');
  if(!host){ host=document.createElement('div'); host.id='accountActions'; host.className='account-actions'; topbar.appendChild(host); }
  return host;
}
function v35RenderAccountActions(){
  const host=v35EnsureAccountHost(); if(!host)return;
  const company=v35MainCompany();
  const email=CLOUD.user?.email||'';
  if(email){
    host.innerHTML=`<div class="v35-account-card"><div class="v35-avatar">${esc((email[0]||'U').toUpperCase())}</div><div class="v35-account-copy"><span>Utente collegato</span><strong>${esc(email)}</strong><small>${state.platformAdmin?'ADMIN NOMYRA':'Cliente'} · ${esc(company)}</small></div><button class="ghost v35-logout" type="button">Esci</button></div>`;
    host.querySelector('.v35-logout').onclick=v35Logout;
  }else{
    host.innerHTML=`<button class="primary" id="v35TopLogin" type="button">Accedi</button>`;
    host.querySelector('#v35TopLogin').onclick=()=>document.querySelector('#cloudAuthButton')?.click();
  }
}
function v35NextStep(latest,coverage){
  const companies=uniqueCompanies?.()||[];
  if(!companies.length) return {k:'CONFIGURAZIONE',title:'Crea il profilo aziendale',text:'Inserisci settore, modello operativo e dati base per rendere l’analisi più utile.',action:'Azienda',nav:'companies'};
  if(!latest) return {k:'PRIMO BILANCIO',title:'Carica il primo bilancio',text:'Carica il PDF del bilancio a 4 sezioni o un bilancio gestionale per avviare l’analisi.',action:'Carica bilancio',upload:true};
  if(coverage && !coverage.complete) return {k:'REVISIONE DATI',title:'Completa i dati mancanti',text:`${coverage.missing.length} voci da completare o confermare prima del report finale.`,action:'Completa dati',review:true};
  return {k:'REPORT DIREZIONALE',title:'Analisi pronta per il report',text:'I dati principali sono disponibili. Puoi aprire l’analisi o scaricare un report PDF/Excel.',action:'Apri analisi',nav:'overview'};
}
function v35Progress(found,total){
  const pct=total?Math.max(0,Math.min(100,(found/total)*100)):0;
  return `<div class="v35-progress"><span style="width:${pct}%"></span></div>`;
}
function v35TrendBars(docs){
  const valid=docs.filter(d=>Number.isFinite(Number(d.data?.revenue))).slice(-6);
  if(!valid.length)return '<div class="empty-state">Carica almeno un bilancio per vedere l’andamento ricavi.</div>';
  const max=Math.max(...valid.map(d=>Number(d.data.revenue)),1);
  return `<div class="v35-bars">${valid.map(d=>`<div class="v35-bar-item"><div class="v35-bar" style="height:${Math.max(14,Number(d.data.revenue)/max*100)}%"></div><span>${esc(String(d.period||''))}</span></div>`).join('')}</div>`;
}
function v35RecentActivities(){
  const items=[];
  (state.docs||[]).slice().sort((a,b)=>String(b.period||'').localeCompare(String(a.period||''))).slice(0,3).forEach(d=>items.push({t:`Bilancio ${d.period}`,s:`${d.company} · ${dataCoverage(d).found}/${dataCoverage(d).total} voci disponibili`,nav:'overview',company:d.company,period:d.period}));
  (state.productivity||[]).slice(-2).forEach(p=>items.push({t:'File produttività',s:`${p.company} · ${p.period||'periodo non indicato'}`,nav:'productivity'}));
  if(!items.length)return '<div class="empty-state">Nessuna attività recente.</div>';
  return `<div class="v35-activity-list">${items.map((it,i)=>`<button class="v35-activity" data-act-index="${i}"><b>${esc(it.t)}</b><span>${esc(it.s)}</span></button>`).join('')}</div>`;
}
function v35RenderDashboard(){
  const home=document.querySelector('#home'); if(!home)return;
  const latest=v35LatestDoc();
  const company=v35MainCompany();
  const cov=latest?dataCoverage(latest):null;
  const next=v35NextStep(latest,cov);
  const z=latest?derivedIndicators(latest,previousDoc(latest)):{};
  const docsForCompany=(state.docs||[]).filter(d=>!company||profileKey(d.company)===profileKey(company)).sort((a,b)=>String(a.period||'').localeCompare(String(b.period||'')));
  const alerts=latest?buildNegativeAlerts(latest,previousDoc(latest)).length:0;
  const userEmail=CLOUD.user?.email||'Demo locale';
  const role=state.platformAdmin?'ADMIN NOMYRA':'Cliente';
  home.innerHTML=`
    <section class="v35-dashboard-hero">
      <div class="v35-hero-main">
        <span class="pill light">NOMYRA FINANCE</span>
        <h2>Benvenuto nel workspace ${esc(company)}</h2>
        <p>Controlla bilanci, KPI, confronti, produttività e report da un’unica dashboard operativa.</p>
        <div class="v35-next-card">
          <span>${esc(next.k)}</span>
          <strong>${esc(next.title)}</strong>
          <small>${esc(next.text)}</small>
          <button class="primary" id="v35NextAction">${esc(next.action)}</button>
        </div>
      </div>
      <aside class="v35-user-panel">
        <div class="v35-user-top"><div class="v35-avatar big">${esc((userEmail[0]||'U').toUpperCase())}</div><div><span>Utente collegato</span><strong>${esc(userEmail)}</strong><small>${esc(role)} · Cloud ${CLOUD.user?'attivo':'locale'}</small></div></div>
        <div class="v35-user-meta"><span>Workspace</span><b>${esc(company)}</b></div>
        <div class="v35-user-meta"><span>Ultimo bilancio</span><b>${latest?`${esc(latest.company)} · ${esc(latest.period)}`:'—'}</b></div>
        <button class="ghost danger" id="v35HeroLogout">Esci dal profilo</button>
      </aside>
    </section>
    <section class="v35-stat-grid">
      <button class="v35-stat-card" data-nav="companies"><span>Aziende</span><strong>${uniqueCompanies().length}</strong><small>Profili configurati</small></button>
      <button class="v35-stat-card" data-nav="documents"><span>Bilanci</span><strong>${(state.docs||[]).length}</strong><small>${(state.docs||[]).filter(d=>!dataCoverage(d).complete).length} da completare</small></button>
      <button class="v35-stat-card" data-nav="overview"><span>Ultimi ricavi</span><strong>${fmt(latest?.data?.revenue)}</strong><small>${latest?`${esc(latest.company)} · ${esc(latest.period)}`:'Nessun bilancio'}</small></button>
      <button class="v35-stat-card ${alerts?'warn':''}" data-nav="overview"><span>Alert</span><strong>${alerts}</strong><small>Indicatori da approfondire</small></button>
    </section>
    <section class="v35-main-grid">
      <article class="panel v35-actions-panel"><div class="panel-head"><div><span class="section-label">AZIONI RAPIDE</span><h3>Cosa vuoi fare adesso?</h3></div></div>
        <div class="v35-action-list">
          <button id="v35Upload" class="v35-action"><b>Carica bilancio</b><span>Importa un nuovo PDF e aggiorna il dataset.</span></button>
          <button id="v35Review" class="v35-action"><b>Completa dati</b><span>Controlla formule, valori mancanti e fonti del bilancio.</span></button>
          <button data-nav="overview" class="v35-action"><b>Apri analisi bilancio</b><span>Leggi KPI, alert e spiegazioni manageriali.</span></button>
          <button data-nav="report" class="v35-action"><b>Genera report</b><span>Scarica PDF o Excel per condividere l’analisi.</span></button>
        </div>
      </article>
      <article class="panel v35-health-panel"><div class="panel-head"><div><span class="section-label">STATO DATI</span><h3>Qualità analisi</h3></div><span class="badge ${cov?.complete?'good':'warn'}">${cov?cov.state:'Da iniziare'}</span></div>
        <div class="v35-health-row"><span>Copertura voci chiave</span><strong>${cov?`${cov.found}/${cov.total}`:'—'}</strong></div>${cov?v35Progress(cov.found,cov.total):v35Progress(0,1)}
        <div class="v35-health-row"><span>EBITDA margin</span><strong>${pct(z.ebitdaMargin)}</strong></div>
        <div class="v35-health-row"><span>Current ratio</span><strong>${ratio(z.currentRatio)}</strong></div>
        <div class="v35-health-row"><span>Debiti / Equity</span><strong>${ratio(z.debtEquity)}</strong></div>
      </article>
      <article class="panel v35-chart-panel"><div class="panel-head"><div><span class="section-label">TREND</span><h3>Andamento ricavi</h3></div><button class="text-btn" data-start-compare="periods">Confronta →</button></div>${v35TrendBars(docsForCompany)}</article>
      <article class="panel v35-activity-panel"><div class="panel-head"><div><span class="section-label">ATTIVITÀ</span><h3>Ultimi movimenti</h3></div></div>${v35RecentActivities()}</article>
    </section>`;
  const nextBtn=home.querySelector('#v35NextAction');
  if(nextBtn) nextBtn.onclick=()=>{ if(next.upload)openUpload(); else if(next.review && latest)openReview(latest.id); else showView(next.nav||'overview'); };
  home.querySelector('#v35HeroLogout')?.addEventListener('click',v35Logout);
  home.querySelector('#v35Upload')?.addEventListener('click',openUpload);
  home.querySelector('#v35Review')?.addEventListener('click',()=> latest?openReview(latest.id):openUpload());
  home.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
  home.querySelectorAll('[data-start-compare]').forEach(b=>b.onclick=()=>startDirectComparison(b.dataset.startCompare));
  home.querySelectorAll('.v35-activity').forEach((b,i)=>b.onclick=()=>{const d=(state.docs||[]).slice().sort((a,b)=>String(b.period||'').localeCompare(String(a.period||'')))[i]; if(d){state.selectedCompany=d.company;state.selectedPeriod=d.period;renderAll();showView('overview','Analisi bilancio');}});
}

const __v35RenderHome = renderHome;
renderHome = function(){ v35RenderDashboard(); };
const __v35UpdateCloudUI = updateCloudUI;
updateCloudUI = function(){ __v35UpdateCloudUI(); v35RenderAccountActions(); };
setTimeout(()=>{try{v35RenderAccountActions(); if(document.querySelector('#home.active'))v35RenderDashboard();}catch(e){console.warn('v35 init',e.message);}},200);
console.info('NOMYRA Finance V35 loaded: personalized client dashboard and account/logout controls.');

/* V36 · hard tenant isolation
   Fix: a new user must not see companies/documents left in browser localStorage from another account.
   Cloud session is source of truth; data is loaded only from company_users membership. */
function v36TenantKey(){ return CLOUD.user?.id ? `nomyra-finance-tenant-${CLOUD.user.id}` : null; }
function v36GenericKeys(){
  const keys=[STORAGE,PROFILE_STORAGE,PRODUCTIVITY_STORAGE,USERS_STORAGE,WORKSPACE_STORAGE,'nomyra-finance-demo-unlocked-v21'];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && (/^nomyra-finance-docs/.test(k)||/^nomyra-finance-storage/.test(k)||/^nomyra-finance-profile_storage/.test(k)||/^nomyra-finance-productivity_storage/.test(k)||/^nomyra-finance-users_storage/.test(k)||/^nomyra-finance-workspace_storage/.test(k))) keys.push(k);
  }
  return [...new Set(keys)];
}
function v36ClearGenericLocal(){ v36GenericKeys().forEach(k=>{try{localStorage.removeItem(k);}catch(e){}}); }
function v36ClearRuntime(){
  state.docs=[]; state.profiles={}; state.productivity=[]; state.users=[];
  state.selectedCompany=''; state.selectedPeriod=''; state.lastComparison=null;
  state.workspace={mode:CLOUD.user?'cloud':'locked',currentUser:CLOUD.user?.email||null};
}
function v36SaveTenantCache(){
  const key=v36TenantKey(); if(!key) return;
  try{localStorage.setItem(key,JSON.stringify({docs:state.docs,profiles:state.profiles,productivity:state.productivity,workspace:state.workspace,selectedCompany:state.selectedCompany,selectedPeriod:state.selectedPeriod,updatedAt:new Date().toISOString()}));}catch(e){}
}
const __v36OldSaveLocalOnly = saveLocalOnly;
saveLocalOnly = function(){
  if(CLOUD.user){ v36ClearGenericLocal(); v36SaveTenantCache(); return; }
  return __v36OldSaveLocalOnly();
};
async function v36LoadCloudDataStrict(){
  if(!CLOUD.user) throw new Error('LOGIN_REQUIRED');
  CLOUD.busy=true; CLOUD.error=null; updateCloudUI();
  try{
    v36ClearRuntime();
    await checkPlatformAdmin();
    if(!state.platformAdmin) await acceptPendingInvitation();
    if(state.platformAdmin){ await renderAdmin(); return true; }

    const memRes=await supabase.from('company_users').select('company_id, role, status').eq('user_id',CLOUD.user.id);
    if(memRes.error) throw memRes.error;
    const memberships=(memRes.data||[]).filter(m=>!m.status || ['active','trial'].includes(String(m.status).toLowerCase()));
    const companyIds=[...new Set(memberships.map(m=>m.company_id).filter(Boolean))];

    state.workspace={mode:'cloud',currentUser:CLOUD.user.email,role:memberships[0]?.role||'cliente'};
    if(!companyIds.length){
      state.docs=[]; state.profiles={}; state.productivity=[]; state.users=[{id:CLOUD.user.id,email:CLOUD.user.email,name:v35DisplayName(CLOUD.user.email),role:'Cliente',company:''}];
      state.selectedCompany=''; state.selectedPeriod='';
      saveLocalOnly(); renderAll(); applyPortalShell();
      return true;
    }

    const companiesRes=await supabase.from('companies').select('*').in('id',companyIds).order('name');
    if(companiesRes.error) throw companiesRes.error;
    const companies=(companiesRes.data||[]).filter(c=>companyIds.includes(c.id));
    const cmap={}; const profiles={};
    companies.forEach(c=>{cmap[c.id]=c; profiles[profileKey(c.name)]=companyRowToProfile(c);});

    const docsRes=await supabase.from('financial_documents').select('*').in('company_id',companyIds).order('period');
    if(docsRes.error) throw docsRes.error;
    const docs=(docsRes.data||[]).filter(d=>companyIds.includes(d.company_id));
    const docIds=docs.map(d=>d.id);
    let vals=[];
    if(docIds.length){
      const valsRes=await supabase.from('financial_values').select('*').in('document_id',docIds);
      if(valsRes.error) throw valsRes.error;
      vals=valsRes.data||[];
    }
    const valsByDoc={};
    vals.forEach(v=>{(valsByDoc[v.document_id] ||= []).push(v);});
    state.docs=docs.map(r=>{
      const data={}, sources={};
      (valsByDoc[r.id]||[]).sort((a,b)=>valuePriority(a)-valuePriority(b)).forEach(v=>{
        data[v.key]=Number(v.value);
        sources[v.key]={method:localMethod(v.method),confidence:v.confidence,formula:v.source||null,items:[{page:v.source_page||'—',line:v.source_row||v.source||metricNames[v.key]||v.key}]};
      });
      const company=cmap[r.company_id]?.name||'Azienda';
      return {id:'r'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,name:r.document_name||'Bilancio',type:r.document_type,quality:Number(r.coverage_score||0),data,sources,candidates:{},validations:[],recognized:r.recognized_key_values,engineVersion:r.extraction_engine_version||ENGINE_VERSION,parser:{kind:r.document_type},profile:profiles[profileKey(company)]||{},file_path:r.file_path};
    });

    const prodRes=await supabase.from('productivity_files').select('*').in('company_id',companyIds).order('created_at');
    if(prodRes.error) throw prodRes.error;
    state.productivity=(prodRes.data||[]).map(r=>{const company=cmap[r.company_id]?.name||'Azienda';return {id:'s'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,fileName:r.file_name,createdAt:r.created_at,file_path:r.file_path,metrics:(r.raw_metrics&&typeof r.raw_metrics==='object')?r.raw_metrics:{rowsCount:0,totalRevenue:Number(r.total_revenue||0),totalQty:Number(r.units_total||0),avgUnitPrice:r.weighted_avg_price!=null?Number(r.weighted_avg_price):null,uniqueCustomers:r.customers_count||0,uniqueProducts:r.products_count||0,avgRevenuePerCustomer:null,topCustomerShare:r.top_customer_share!=null?Number(r.top_customer_share):null,topProductShare:r.top_product_share!=null?Number(r.top_product_share):null,topCustomers:[],topProducts:[],headers:{},detectedPeriodLabel:r.detected_period_label||'',detectedStartDate:r.detected_start_date||null,detectedEndDate:r.detected_end_date||null}};});

    state.profiles=profiles;
    state.users=[{id:CLOUD.user.id,email:CLOUD.user.email,name:v35DisplayName(CLOUD.user.email),company:companies[0]?.name||'',role:memberships[0]?.role||'Cliente',status:'Cloud'}];
    state.selectedCompany=state.docs[0]?.company||companies[0]?.name||'';
    state.selectedPeriod=state.docs.find(d=>d.company===state.selectedCompany)?.period||state.docs[0]?.period||'';
    saveLocalOnly(); renderAll(); applyPortalShell();
    return true;
  }catch(e){CLOUD.error=e.message||'Errore cloud'; throw e;}
  finally{CLOUD.busy=false; updateCloudUI();}
}
loadCloudData = v36LoadCloudDataStrict;

const __v36OldEnsureCompany = ensureCompany;
ensureCompany = async function(companyName,profile={}){
  // A user can create/update only within their own account. Existing companies are resolved only through RLS/membership.
  return __v36OldEnsureCompany(companyName,profile);
};

const __v36OldLogout = v35Logout;
v35Logout = function(){
  return (async()=>{
    try{ if(window.supabase && CLOUD.user) await supabase.auth.signOut(); }catch(e){ console.warn('logout',e.message); }
    CLOUD.session=null; CLOUD.user=null; CLOUD.ready=false; state.platformAdmin=false; state.demoUnlocked=false;
    v36ClearRuntime(); v36ClearGenericLocal();
    updateCloudUI(); renderAll(); showView('access','Accesso utenti');
  })();
};

supabase.auth.onAuthStateChange(async(event,session)=>{
  if(event==='SIGNED_OUT'){
    CLOUD.session=null; CLOUD.user=null; CLOUD.ready=false; state.platformAdmin=false; v36ClearRuntime(); v36ClearGenericLocal(); renderAll(); showView('access','Accesso utenti');
  }
  if(event==='SIGNED_IN' && session?.user){
    CLOUD.session=session; CLOUD.user=session.user; CLOUD.ready=true;
    v36ClearGenericLocal();
    try{ await loadCloudData(); showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard'); }
    catch(e){ console.warn('v36 signed in load',e.message); }
  }
});

// If the page started with local data before Supabase finished, force a clean tenant reload shortly after boot.
setTimeout(async()=>{
  try{ if(CLOUD.user){ v36ClearGenericLocal(); await loadCloudData(); showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard'); } }
  catch(e){ console.warn('v36 postboot reload',e.message); }
},1200);

console.info('NOMYRA Finance V36 loaded: hard tenant isolation and no cross-user localStorage leakage.');

/* ===========================
   V38 - Robust session restore and tenant persistence
   Fix: page refresh must never reset the customer workspace to zero.
   Rules:
   - Supabase session is preserved on refresh.
   - Generic localStorage is never shown as customer data.
   - Tenant cache is user-scoped only.
   - Cloud data is committed to UI only after a successful complete load.
   - If cloud temporarily fails, the same user's tenant cache is used instead of showing another account or empty demo.
   =========================== */
const APP_VERSION='38.0';
let v38TenantLoadLock=null;

function v38SetLoading(on,msg='Caricamento workspace...'){
  let gate=document.querySelector('#v38TenantGate');
  if(on){
    if(!gate){
      gate=document.createElement('div');
      gate.id='v38TenantGate';
      gate.innerHTML=`<div><strong>NOMYRA Finance</strong><span>${esc(msg)}</span></div>`;
      document.body.appendChild(gate);
    }else{
      gate.querySelector('span').textContent=msg;
    }
    document.body.classList.add('tenant-loading-v38');
  }else{
    gate?.remove();
    document.body.classList.remove('tenant-loading-v38');
  }
}

function v38ApplyTenantSnapshot(snapshot){
  if(!snapshot) return false;
  state.docs=snapshot.docs||[];
  state.profiles=snapshot.profiles||{};
  state.productivity=snapshot.productivity||[];
  state.workspace=snapshot.workspace||{mode:'cloud',currentUser:CLOUD.user?.email||null};
  state.selectedCompany=snapshot.selectedCompany||state.docs[0]?.company||Object.keys(state.profiles||{})[0]||'';
  state.selectedPeriod=snapshot.selectedPeriod||state.docs.find(d=>d.company===state.selectedCompany)?.period||state.docs[0]?.period||'';
  state.users=snapshot.users||[{id:CLOUD.user?.id,email:CLOUD.user?.email,name:v35DisplayName(CLOUD.user?.email||'utente'),role:'Cliente',company:state.selectedCompany||'',status:'Cloud'}];
  return true;
}

function v38TenantCacheRead(){
  const key=v36TenantKey?.();
  if(!key) return null;
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}
}
function v38TenantCacheWrite(snapshot){
  const key=v36TenantKey?.();
  if(!key) return;
  try{localStorage.setItem(key,JSON.stringify({...snapshot,updatedAt:new Date().toISOString(),appVersion:APP_VERSION}));}catch(e){}
}
function v38SnapshotFromState(){
  return {docs:state.docs,profiles:state.profiles,productivity:state.productivity,workspace:state.workspace,users:state.users,selectedCompany:state.selectedCompany,selectedPeriod:state.selectedPeriod};
}

async function v38LoadCloudDataRobust(){
  if(!CLOUD.user) throw new Error('LOGIN_REQUIRED');
  if(v38TenantLoadLock) return v38TenantLoadLock;
  v38TenantLoadLock=(async()=>{
    CLOUD.busy=true; CLOUD.error=null; updateCloudUI(); v38SetLoading(true,'Caricamento dati del workspace...');
    try{
      await checkPlatformAdmin();
      if(!state.platformAdmin) await acceptPendingInvitation();
      if(state.platformAdmin){
        await renderAdmin();
        const snap={docs:[],profiles:{},productivity:[],workspace:{mode:'admin',currentUser:CLOUD.user.email,role:'ADMIN NOMYRA'},users:[],selectedCompany:'',selectedPeriod:''};
        v38ApplyTenantSnapshot(snap);
        return true;
      }

      const memRes=await supabase.from('company_users').select('company_id, role, status').eq('user_id',CLOUD.user.id);
      if(memRes.error) throw memRes.error;
      const memberships=(memRes.data||[]).filter(m=>!m.status || ['active','trial'].includes(String(m.status).toLowerCase()));
      const companyIds=[...new Set(memberships.map(m=>m.company_id).filter(Boolean))];
      const temp={docs:[],profiles:{},productivity:[],users:[{id:CLOUD.user.id,email:CLOUD.user.email,name:v35DisplayName(CLOUD.user.email),role:memberships[0]?.role||'Cliente',company:'',status:'Cloud'}],workspace:{mode:'cloud',currentUser:CLOUD.user.email,role:memberships[0]?.role||'Cliente'},selectedCompany:'',selectedPeriod:''};

      if(companyIds.length){
        const companiesRes=await supabase.from('companies').select('*').in('id',companyIds).order('name');
        if(companiesRes.error) throw companiesRes.error;
        const companies=(companiesRes.data||[]).filter(c=>companyIds.includes(c.id));
        const cmap={};
        companies.forEach(c=>{cmap[c.id]=c; temp.profiles[profileKey(c.name)]=companyRowToProfile(c);});

        const docsRes=await supabase.from('financial_documents').select('*').in('company_id',companyIds).order('period');
        if(docsRes.error) throw docsRes.error;
        const docs=(docsRes.data||[]).filter(d=>companyIds.includes(d.company_id));
        const docIds=docs.map(d=>d.id);
        let vals=[];
        if(docIds.length){
          const valsRes=await supabase.from('financial_values').select('*').in('document_id',docIds);
          if(valsRes.error) throw valsRes.error;
          vals=valsRes.data||[];
        }
        const valsByDoc={};
        vals.forEach(v=>{(valsByDoc[v.document_id] ||= []).push(v);});
        temp.docs=docs.map(r=>{
          const data={}, sources={};
          (valsByDoc[r.id]||[]).sort((a,b)=>valuePriority(a)-valuePriority(b)).forEach(v=>{
            if(v.value==null || !Number.isFinite(Number(v.value))) return;
            data[v.key]=Number(v.value);
            sources[v.key]={method:localMethod(v.method),confidence:v.confidence,formula:v.source||null,items:[{page:v.source_page||'—',line:v.source_row||v.source||metricNames[v.key]||v.key}]};
          });
          const company=cmap[r.company_id]?.name||'Azienda';
          return {id:'r'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,name:r.document_name||'Bilancio',type:r.document_type,quality:Number(r.coverage_score||0),data,sources,candidates:{},validations:[],recognized:r.recognized_key_values,engineVersion:r.extraction_engine_version||ENGINE_VERSION,parser:{kind:r.document_type},profile:temp.profiles[profileKey(company)]||{},file_path:r.file_path};
        });

        const prodRes=await supabase.from('productivity_files').select('*').in('company_id',companyIds).order('created_at');
        if(prodRes.error) throw prodRes.error;
        temp.productivity=(prodRes.data||[]).map(r=>{
          const company=cmap[r.company_id]?.name||'Azienda';
          return {id:'s'+r.id,_remoteId:r.id,_companyId:r.company_id,company,period:r.period,fileName:r.file_name,createdAt:r.created_at,file_path:r.file_path,metrics:(r.raw_metrics&&typeof r.raw_metrics==='object')?r.raw_metrics:{rowsCount:0,totalRevenue:Number(r.total_revenue||0),totalQty:Number(r.units_total||0),avgUnitPrice:r.weighted_avg_price!=null?Number(r.weighted_avg_price):null,uniqueCustomers:r.customers_count||0,uniqueProducts:r.products_count||0,avgRevenuePerCustomer:null,topCustomerShare:r.top_customer_share!=null?Number(r.top_customer_share):null,topProductShare:r.top_product_share!=null?Number(r.top_product_share):null,topCustomers:[],topProducts:[],headers:{},detectedPeriodLabel:r.detected_period_label||'',detectedStartDate:r.detected_start_date||null,detectedEndDate:r.detected_end_date||null}};
        });
        temp.users=[{id:CLOUD.user.id,email:CLOUD.user.email,name:v35DisplayName(CLOUD.user.email),company:companies[0]?.name||'',role:memberships[0]?.role||'Cliente',status:'Cloud'}];
        temp.selectedCompany=temp.docs[0]?.company||companies[0]?.name||'';
        temp.selectedPeriod=temp.docs.find(d=>d.company===temp.selectedCompany)?.period||temp.docs[0]?.period||'';
      }

      // Commit only after every query succeeds.
      v38ApplyTenantSnapshot(temp);
      v38TenantCacheWrite(v38SnapshotFromState());
      v36ClearGenericLocal();
      renderAll(); applyPortalShell(); updateCloudUI();
      return true;
    }catch(e){
      CLOUD.error=e.message||'Errore cloud';
      const cached=v38TenantCacheRead();
      if(cached){
        v38ApplyTenantSnapshot(cached);
        renderAll(); applyPortalShell(); updateCloudUI();
        console.warn('V38: cloud non disponibile, uso cache utente isolata',e.message);
        return true;
      }
      v36ClearRuntime(); renderAll(); applyPortalShell(); updateCloudUI();
      throw e;
    }finally{
      CLOUD.busy=false; v38TenantLoadLock=null; v38SetLoading(false); updateCloudUI();
    }
  })();
  return v38TenantLoadLock;
}

loadCloudData=v38LoadCloudDataRobust;

async function v38RestoreSession(){
  try{
    v38SetLoading(true,'Ripristino sessione sicura...');
    const {data}=await supabase.auth.getSession();
    const session=data?.session||null;
    if(session?.user){
      CLOUD.session=session; CLOUD.user=session.user; CLOUD.ready=true;
      const cached=v38TenantCacheRead();
      if(cached){ v38ApplyTenantSnapshot(cached); renderAll(); applyPortalShell(); }
      await loadCloudData();
      showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard');
    }else{
      CLOUD.session=null; CLOUD.user=null; CLOUD.ready=false; v36ClearRuntime(); renderAll(); showView('access','Accesso utenti');
    }
  }catch(e){
    console.warn('V38 restore session',e.message);
  }finally{
    v38SetLoading(false); document.body.classList.add('boot-ready'); updateCloudUI();
  }
}

supabase.auth.onAuthStateChange(async(event,session)=>{
  if(event==='INITIAL_SESSION' && session?.user){
    CLOUD.session=session; CLOUD.user=session.user; CLOUD.ready=true;
    try{ await loadCloudData(); showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard'); }catch(e){console.warn('V38 initial session load',e.message);}
  }
  if(event==='SIGNED_IN' && session?.user){
    CLOUD.session=session; CLOUD.user=session.user; CLOUD.ready=true;
    try{ await loadCloudData(); showView(state.platformAdmin?'admin':'home',state.platformAdmin?'ADMIN NOMYRA':'Dashboard'); }catch(e){console.warn('V38 signed in load',e.message);}
  }
});

setTimeout(v38RestoreSession, 250);
console.info('NOMYRA Finance V38 loaded: refresh-safe tenant persistence and cloud restore.');

/* V42 · dashboard premium semplificata
   Obiettivo: azioni rapide in alto, meno rumore visivo, lettura guidata per utente cliente. */
function v42DocSetForCompany(company){
  return (state.docs||[]).filter(d=>!company || profileKey(d.company)===profileKey(company))
    .sort((a,b)=>String(a.period||'').localeCompare(String(b.period||'')));
}
function v42LatestDoc(){ return currentDoc?.() || v35LatestDoc?.() || null; }
function v42KpiTone(key,value,z){
  if(value==null || !Number.isFinite(Number(value))) return {cls:'neutral',label:'—'};
  if(key==='ebit' && Number(value)<0) return {cls:'critical',label:'Alert'};
  if(key==='ebitda' && Number(value)<0) return {cls:'critical',label:'Alert'};
  if(key==='debt' && z?.debtRevenue!=null && z.debtRevenue>55) return {cls:'warning',label:'Da monitorare'};
  if(key==='ebitdaMargin' && Number(value)<5) return {cls:'warning',label:'Da monitorare'};
  if(key==='ebitdaMargin' && Number(value)>=10) return {cls:'positive',label:'Positivo'};
  if(Number(value)<0) return {cls:'critical',label:'Alert'};
  return {cls:'neutral',label:'Disponibile'};
}
function v42MiniTrend(docs,key){
  const values=(docs||[]).map(d=>Number(key==='ebitdaMargin'?derivedIndicators(d,previousDoc(d)).ebitdaMargin:d.data?.[key])).filter(v=>Number.isFinite(v));
  if(values.length<2) return '<span class="v42-no-trend">Trend disponibile con più periodi</span>';
  const max=Math.max(...values),min=Math.min(...values),range=max-min||1;
  const pts=values.map((v,i)=>`${i*(100/(values.length-1))},${28-((v-min)/range)*24+2}`).join(' ');
  const last=values.at(-1),prev=values.at(-2); const cls=last>=prev?'up':'down';
  return `<svg class="v42-spark ${cls}" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function v42QuickReading(latest,z,cov,alerts){
  if(!latest) return 'Carica il primo bilancio per generare una panoramica automatica della situazione aziendale.';
  if(cov && !cov.complete) return `L’analisi è già leggibile, ma mancano ${cov.missing.length} voci da completare prima di generare un report finale affidabile.`;
  if(latest.data?.ebit!=null && latest.data.ebit<0) return 'Il margine operativo monetario è disponibile, ma l’EBIT risulta negativo dopo gli ammortamenti. Prima di condividere il report, verifica ammortamenti e struttura patrimoniale.';
  if(alerts.length) return 'Sono presenti indicatori da approfondire. Apri i dettagli degli alert per capire quali voci incidono maggiormente sull’analisi.';
  return 'I principali dati sono disponibili. Puoi aprire l’analisi completa o generare un report direzionale.';
}
function v42NextAction(latest,cov,alerts){
  if(!latest) return {title:'Carica il primo bilancio',text:'Importa un PDF per iniziare l’analisi.',label:'Carica bilancio',do:'upload'};
  if(cov && !cov.complete) return {title:`Completa ${cov.missing.length} dati mancanti`,text:'Valida le voci chiave prima del report.',label:'Completa dati',do:'review'};
  if(alerts.length) return {title:'Controlla gli indicatori critici',text:'Apri gli alert principali e verifica le fonti.',label:'Apri analisi',do:'overview'};
  return {title:'Report pronto',text:'Scarica o condividi la lettura direzionale.',label:'Scarica report',do:'report'};
}
function v42KpiCard(label,value,sub,key,z,docs,format='money'){
  const raw=value;
  const tone=v42KpiTone(key,raw,z);
  const shown=format==='pct'?pct(raw):fmt(raw);
  return `<button class="v42-kpi-card ${tone.cls}" data-v42-kpi="${esc(key)}"><span>${esc(label)}</span><strong>${shown}</strong><small>${esc(sub||tone.label)}</small>${v42MiniTrend(docs,key)}</button>`;
}
function v42DashboardHTML(){
  const latest=v42LatestDoc();
  const company=v35MainCompany?.() || latest?.company || 'Workspace cliente';
  const docs=v42DocSetForCompany(company);
  const prev=latest?previousDoc(latest):null;
  const z=latest?derivedIndicators(latest,prev):{};
  const cov=latest?dataCoverage(latest):null;
  const alerts=latest?buildNegativeAlerts(latest,prev):[];
  const topAlerts=alerts.slice(0,3);
  const next=v42NextAction(latest,cov,alerts);
  const periodLabel=latest?`Bilancio ${esc(latest.period)} · ${cov?`${cov.found}/${cov.total} dati verificati`:'dati in analisi'}`:'Nessun bilancio caricato';
  return `
    <section class="v42-quick-actions" aria-label="Azioni rapide">
      <button id="v42Upload" class="v42-quick primary-action"><span>↥</span><b>Carica bilancio</b><small>Importa PDF</small></button>
      <button id="v42Review" class="v42-quick"><span>✎</span><b>Completa dati</b><small>Valida fonti</small></button>
      <button class="v42-quick" data-nav="overview"><span>▥</span><b>Apri analisi</b><small>KPI e alert</small></button>
      <button class="v42-quick" data-nav="report"><span>▧</span><b>Scarica report</b><small>PDF o Excel</small></button>
    </section>

    <section class="v42-hero">
      <div class="v42-hero-copy">
        <span class="section-label">WORKSPACE</span>
        <h2>${esc(company)}</h2>
        <p class="v42-period">${periodLabel}</p>
        <p class="v42-reading">${esc(v42QuickReading(latest,z,cov,alerts))}</p>
      </div>
      <div class="v42-hero-side">
        <div class="v42-coverage">
          <span>Copertura dati</span>
          <strong>${cov?`${Math.round((cov.found/cov.total)*100)}%`:'—'}</strong>
          ${cov?v35Progress(cov.found,cov.total):v35Progress(0,1)}
          <small>${cov?`${cov.found}/${cov.total} voci chiave`:'Carica un bilancio'}</small>
        </div>
        <div class="v42-next">
          <span>Prossima azione</span>
          <strong>${esc(next.title)}</strong>
          <small>${esc(next.text)}</small>
          <button class="primary" id="v42NextAction">${esc(next.label)} →</button>
        </div>
      </div>
    </section>

    <section class="v42-kpi-grid" aria-label="KPI essenziali">
      ${v42KpiCard('Ricavi',latest?.data?.revenue,latest?`${latest.company} · ${latest.period}`:'—','revenue',z,docs)}
      ${v42KpiCard('EBITDA / MOL',latest?.data?.ebitda,'Margine operativo','ebitda',z,docs)}
      ${v42KpiCard('EBIT',latest?.data?.ebit,'Dopo ammortamenti','ebit',z,docs)}
      ${v42KpiCard('Debiti',latest?.data?.debt,'Da confrontare','debt',z,docs)}
    </section>

    <section class="v42-dashboard-grid">
      <article class="panel v42-alert-panel">
        <div class="panel-head"><div><span class="section-label">ALERT PRINCIPALI</span><h3>Da vedere prima del report</h3></div><button class="text-btn" data-nav="overview">Vedi tutti →</button></div>
        ${topAlerts.length?`<div class="v42-alert-list">${topAlerts.map(a=>`<button class="v42-alert-item ${esc(a.severity)}" data-alert-action="${esc(a.action)}"><b>${esc(a.title)}</b><span>${esc(a.text)}</span><em>${esc(a.actionLabel||'Apri dettaglio')} →</em></button>`).join('')}</div>`:`<div class="v42-empty-ok"><b>Nessun alert critico</b><span>Apri l’analisi completa per leggere tutti gli indicatori.</span></div>`}
      </article>
      <article class="panel v42-reading-panel">
        <div class="panel-head"><div><span class="section-label">LETTURA RAPIDA NOMYRA</span><h3>In poche righe</h3></div></div>
        <p>${esc(v42QuickReading(latest,z,cov,alerts))}</p>
        <div class="v42-reading-actions">
          <button class="ghost" data-nav="overview">Apri analisi completa</button>
          <button class="ghost" data-start-compare="periods">Confronta periodi</button>
        </div>
      </article>
      <article class="panel v42-chart-panel">
        <div class="panel-head"><div><span class="section-label">TREND</span><h3>Ricavi nel tempo</h3></div><button class="text-btn" data-start-compare="periods">Confronta →</button></div>
        ${v35TrendBars(docs)}
      </article>
    </section>`;
}
function v42RenderDashboard(){
  const home=document.querySelector('#home'); if(!home)return;
  home.innerHTML=v42DashboardHTML();
  const latest=v42LatestDoc();
  const cov=latest?dataCoverage(latest):null;
  const alerts=latest?buildNegativeAlerts(latest,previousDoc(latest)):[];
  const next=v42NextAction(latest,cov,alerts);
  home.querySelector('#v42Upload')?.addEventListener('click',openUpload);
  home.querySelector('#v42Review')?.addEventListener('click',()=>latest?openReview(latest.id):openUpload());
  home.querySelector('#v42NextAction')?.addEventListener('click',()=>{
    if(next.do==='upload') return openUpload();
    if(next.do==='review') return latest?openReview(latest.id):openUpload();
    if(next.do==='report') return showView('report','Report');
    return showView('overview','Analisi bilancio');
  });
  home.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
  home.querySelectorAll('[data-start-compare]').forEach(b=>b.onclick=()=>startDirectComparison(b.dataset.startCompare));
  home.querySelectorAll('[data-alert-action]').forEach(b=>b.onclick=()=>runAlertAction(b.dataset.alertAction));
  home.querySelectorAll('[data-v42-kpi]').forEach(b=>b.onclick=()=>showView('overview','Analisi bilancio'));
}
renderHome=function(){v42RenderDashboard();};
setTimeout(()=>{try{if(document.querySelector('#home.active'))v42RenderDashboard();}catch(e){console.warn('v42 init',e.message);}},300);
console.info('NOMYRA Finance V42 loaded: simplified premium client dashboard.');

/* V43 · Dashboard cliente essenziale premium, visibilmente nuova */
function v43StatusTone(key,value){
  const n=Number(value);
  if(!Number.isFinite(n)) return {cls:'missing',label:'Dato da completare'};
  if((key==='ebit'||key==='ebitda') && n<0) return {cls:'critical',label:'Alert'};
  if(key==='debt' && n>0) return {cls:'watch',label:'Da monitorare'};
  if(key==='coverage' && n<95) return {cls:'watch',label:'Da completare'};
  if(key==='ebitdaMargin' && n<0.08) return {cls:'watch',label:'Da monitorare'};
  return {cls:'ok',label:'Disponibile'};
}
function v43Metric(label,value,key,sub,formatter){
  const tone=v43StatusTone(key,value);
  const shown=formatter?formatter(value):(key==='ebitdaMargin'?pct(value):fmt(value));
  return `<button class="v43-metric ${tone.cls}" data-v43-open="overview"><span>${esc(label)}</span><strong>${shown}</strong><small>${esc(sub||tone.label)}</small></button>`;
}
function v43AlertCards(latest,alerts,cov,z){
  const items=[];
  if(latest?.data?.ebit!=null && Number(latest.data.ebit)<0){items.push({tone:'critical',title:'EBIT negativo',text:'Il risultato operativo dopo ammortamenti è sotto zero.',action:'Apri dettaglio',go:'overview'});}
  if(cov && !cov.complete){items.push({tone:'warning',title:`${cov.missing.length} dati da completare`,text:'Completa le voci mancanti prima di generare il report finale.',action:'Completa dati',go:'review'});}
  if(alerts?.length){const a=alerts[0]; if(!items.some(x=>x.title===a.title))items.push({tone:a.severity==='critical'?'critical':'warning',title:a.title,text:a.text,action:a.actionLabel||'Apri dettaglio',go:a.action||'overview'});}
  if(!items.length){items.push({tone:'ok',title:'Nessun alert critico',text:'I dati principali sono leggibili. Apri l’analisi per il dettaglio completo.',action:'Apri analisi',go:'overview'});}
  return items.slice(0,3).map(x=>`<button class="v43-alert ${esc(x.tone)}" data-v43-alert="${esc(x.go)}"><b>${esc(x.title)}</b><span>${esc(x.text)}</span><em>${esc(x.action)} →</em></button>`).join('');
}
function v43DashboardHTML(){
  const latest=v42LatestDoc?.() || currentDoc?.() || null;
  const company=v35MainCompany?.() || latest?.company || state.selectedCompany || 'Workspace cliente';
  const docs=v42DocSetForCompany?.(company) || companyDocs?.(company) || [];
  const prev=latest?previousDoc(latest):null;
  const z=latest?derivedIndicators(latest,prev):{};
  const cov=latest?dataCoverage(latest):null;
  const alerts=latest?buildNegativeAlerts(latest,prev):[];
  const next=v42NextAction?.(latest,cov,alerts) || {title:'Carica il primo bilancio',text:'Importa un PDF per iniziare.',label:'Carica bilancio',do:'upload'};
  const covPct=cov?Math.round((cov.found/cov.total)*100):0;
  const period=latest?`Bilancio ${esc(latest.period)} · ${cov?`${cov.found}/${cov.total} dati verificati`:'dati in analisi'}`:'Nessun bilancio caricato';
  const reading=latest?v42QuickReading(latest,z,cov,alerts):'Carica il primo bilancio per ottenere una lettura guidata della situazione aziendale.';
  return `
    <section class="v43-actions-wrap">
      <div class="v43-section-title"><span>Azioni rapide</span><small>Le operazioni più usate, sempre in alto.</small></div>
      <div class="v43-actions">
        <button id="v43Upload" class="v43-action primary"><i>↥</i><b>Carica bilancio</b><small>Importa PDF</small></button>
        <button id="v43Review" class="v43-action"><i>✎</i><b>Completa dati</b><small>Valida voci</small></button>
        <button class="v43-action" data-v43-nav="overview"><i>▥</i><b>Apri analisi</b><small>KPI e alert</small></button>
        <button class="v43-action" data-v43-nav="report"><i>▧</i><b>Scarica report</b><small>PDF / Excel</small></button>
      </div>
    </section>

    <section class="v43-hero-simple">
      <div class="v43-workspace-copy">
        <span class="section-label">WORKSPACE AZIENDA</span>
        <h2>${esc(company)}</h2>
        <p class="v43-period">${period}</p>
        <p class="v43-reading">${esc(reading)}</p>
      </div>
      <div class="v43-next-card">
        <span>Prossima azione</span>
        <strong>${esc(next.title)}</strong>
        <small>${esc(next.text)}</small>
        <button class="primary" id="v43NextAction">${esc(next.label)} →</button>
      </div>
    </section>

    <section class="v43-main-metrics">
      ${v43Metric('Ricavi',latest?.data?.revenue,'revenue',latest?`${latest.company} · ${latest.period}`:'Carica bilancio')}
      ${v43Metric('EBITDA / MOL',latest?.data?.ebitda,'ebitda','Margine operativo')}
      ${v43Metric('EBIT',latest?.data?.ebit,'ebit','Dopo ammortamenti')}
      ${v43Metric('Debiti',latest?.data?.debt,'debt','Da confrontare')}
      ${v43Metric('Copertura dati',covPct,'coverage',cov?`${cov.found}/${cov.total} voci chiave`:'—',v=>`${Number(v||0)}%`)}
    </section>

    <section class="v43-lower-grid">
      <article class="v43-panel v43-alert-panel">
        <div class="v43-panel-head"><div><span>Da controllare</span><h3>Alert principali</h3></div><button class="text-btn" data-v43-nav="overview">Vedi tutti →</button></div>
        <div class="v43-alert-list">${v43AlertCards(latest,alerts,cov,z)}</div>
      </article>
      <article class="v43-panel v43-nomyra-reading">
        <div class="v43-panel-head"><div><span>Lettura NOMYRA</span><h3>In breve</h3></div></div>
        <p>${esc(reading)}</p>
        <div class="v43-reading-buttons"><button class="ghost" data-v43-nav="overview">Analisi completa</button><button class="ghost" data-v43-compare="periods">Confronta periodi</button></div>
      </article>
      <article class="v43-panel v43-trend-panel">
        <div class="v43-panel-head"><div><span>Trend</span><h3>Ricavi e confronto</h3></div></div>
        ${(docs&&docs.length>1)?v35TrendBars(docs):`<div class="v43-placeholder-chart"><b>Carica un secondo periodo</b><span>Qui apparirà il grafico di andamento ricavi, margini e principali scostamenti.</span></div>`}
      </article>
    </section>`;
}
function v43RenderDashboard(){
  const home=document.querySelector('#home'); if(!home)return;
  home.innerHTML=v43DashboardHTML();
  const latest=v42LatestDoc?.() || currentDoc?.() || null;
  const cov=latest?dataCoverage(latest):null;
  const alerts=latest?buildNegativeAlerts(latest,previousDoc(latest)):[];
  const next=v42NextAction?.(latest,cov,alerts) || {do:'upload'};
  home.querySelector('#v43Upload')?.addEventListener('click',openUpload);
  home.querySelector('#v43Review')?.addEventListener('click',()=>latest?openReview(latest.id):openUpload());
  home.querySelector('#v43NextAction')?.addEventListener('click',()=>{
    if(next.do==='upload')return openUpload();
    if(next.do==='review')return latest?openReview(latest.id):openUpload();
    if(next.do==='report')return showView('report','Report');
    return showView('overview','Analisi bilancio');
  });
  home.querySelectorAll('[data-v43-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.v43Nav));
  home.querySelectorAll('[data-v43-compare]').forEach(b=>b.onclick=()=>startDirectComparison(b.dataset.v43Compare));
  home.querySelectorAll('[data-v43-open]').forEach(b=>b.onclick=()=>showView(b.dataset.v43Open));
  home.querySelectorAll('[data-v43-alert]').forEach(b=>b.onclick=()=>{const a=b.dataset.v43Alert;if(a==='review')return latest?openReview(latest.id):openUpload(); if(['overview','report','documents'].includes(a))return showView(a); return runAlertAction?.(a);});
}
renderHome=function(){v43RenderDashboard();};
setTimeout(()=>{try{if(document.querySelector('#home.active'))v43RenderDashboard();}catch(e){console.warn('v43 init',e.message);}},350);
console.info('NOMYRA Finance V43 loaded: essential premium dashboard with top quick actions.');


/* V44 · FIX REALE DASHBOARD
   La V43 esisteva, ma un override precedente di showView/renderAll richiamava ancora v22RenderDashboard()
   dopo ogni refresh/login. Questa patch forza la dashboard premium essenziale come ultimo render. */
(function(){
  function forcePremiumDashboard(){
    try{
      const home=document.querySelector('#home');
      if(!home) return;
      if(typeof v43RenderDashboard==='function') v43RenderDashboard();
      home.dataset.dashboardVersion='v44-premium-simple';
    }catch(e){ console.warn('v44 dashboard force', e.message); }
  }

  const previousRenderAll = renderAll;
  renderAll = function(){
    previousRenderAll();
    forcePremiumDashboard();
  };

  const previousShowView = showView;
  showView = function(view,title=null){
    previousShowView(view,title);
    if(view==='home'){
      forcePremiumDashboard();
      setTimeout(forcePremiumDashboard, 50);
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    if(document.querySelector('#home.active')) forcePremiumDashboard();
  });
  setTimeout(()=>{ if(document.querySelector('#home.active')) forcePremiumDashboard(); }, 250);
  setTimeout(()=>{ if(document.querySelector('#home.active')) forcePremiumDashboard(); }, 900);

  console.info('NOMYRA Finance V44 loaded: dashboard premium semplice forzata come render finale.');
})();

/* V45 · FIX NAVIGAZIONE SEZIONI
   La dashboard premium deve apparire SOLO nella sezione Dashboard.
   Quando l'utente apre Analisi, Azienda, Bilancio o Report, nessun blocco dashboard deve restare sopra la pagina. */
(function(){
  const VIEW_TITLES = {
    access:'Accesso utenti', home:'Dashboard', overview:'Analisi bilancio', documents:'Bilancio', companies:'Azienda',
    benchmark:'Benchmark aziende', productivity:'Produttività', history:'Analisi storica', analysis:'Ask NOMYRA', report:'Report',
    comparison:'Confronto', workspace:'Workspace / utenti', admin:'ADMIN NOMYRA'
  };

  function hardSetActiveView(view){
    document.querySelectorAll('main > section.view').forEach(sec=>{
      const active = sec.id === view;
      sec.classList.toggle('active', active);
      sec.style.display = active ? 'block' : 'none';
      sec.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    document.querySelectorAll('.nav-item').forEach(item=>{
      const isActive = item.dataset.view === view || (view==='comparison' && item.dataset.startCompare);
      item.classList.toggle('active', !!isActive && item.dataset.view === view);
    });
  }

  function renderViewContent(view){
    if(view==='home' && typeof v43RenderDashboard === 'function') v43RenderDashboard();
    if(view==='overview' && typeof renderOverview === 'function') renderOverview();
    if(view==='documents' && typeof renderDocuments === 'function') renderDocuments();
    if(view==='companies' && typeof renderCompanies === 'function') renderCompanies();
    if(view==='benchmark' && typeof renderBenchmark === 'function') renderBenchmark();
    if(view==='productivity' && typeof renderProductivity === 'function') renderProductivity();
    if(view==='report' && typeof renderReport === 'function') renderReport();
    if(view==='comparison' && typeof renderDirectComparison === 'function') renderDirectComparison();
    if(view==='admin' && typeof renderAdmin === 'function') renderAdmin();
  }

  const previousShowViewV45 = showView;
  window.__nomyraCurrentView = document.querySelector('main > section.view.active')?.id || 'access';

  showView = function(view, title=null){
    window.__nomyraCurrentView = view;

    // Lasciamo eseguire la logica esistente, poi forziamo l'isolamento visuale.
    try{ previousShowViewV45(view, title); }catch(e){ console.warn('previous showView failed', e); }

    hardSetActiveView(view);
    renderViewContent(view);

    const pageTitle = document.querySelector('#pageTitle');
    if(pageTitle) pageTitle.textContent = title || VIEW_TITLES[view] || view;

    const contextActions = document.querySelector('#contextActions');
    if(contextActions) contextActions.style.display = (view==='home' || view==='comparison' || view==='access' || view==='admin') ? 'none' : 'flex';

    window.scrollTo({top:0, behavior:'smooth'});
  };

  const previousRenderAllV45 = renderAll;
  renderAll = function(){
    try{ previousRenderAllV45(); }catch(e){ console.warn('renderAll previous failed', e); }
    const active = window.__nomyraCurrentView || document.querySelector('main > section.view.active')?.id || 'home';
    hardSetActiveView(active);
    if(active === 'home' && typeof v43RenderDashboard === 'function') v43RenderDashboard();
  };

  // Riaggancia esplicitamente il menu dopo tutti gli override precedenti.
  document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
    btn.onclick = () => showView(btn.dataset.view, VIEW_TITLES[btn.dataset.view] || btn.textContent.trim());
  });

  // Stato iniziale coerente.
  setTimeout(()=>{
    const active = window.__nomyraCurrentView || document.querySelector('main > section.view.active')?.id || 'access';
    hardSetActiveView(active);
    if(active === 'home' && typeof v43RenderDashboard === 'function') v43RenderDashboard();
  }, 450);

  console.info('NOMYRA Finance V45 loaded: dashboard isolated to Home only; other sections render cleanly.');
})();

/* ===========================
   V47 - Produttività evoluta
   - prodotti nome + codice
   - periodo report da input o auto-detect da DATA
   - analisi mensile + annuale
   - confronto con bilancio
   - insight / consigli automatici
   =========================== */
function v47Norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function v47FindHeader(headers,patterns){const norm=headers.map(h=>[h,v47Norm(h)]);return norm.find(([,n])=>patterns.some(p=>n.includes(p)))?.[0]||null;}
function v47ExcelDate(v){
  if(v==null||v==='')return null;
  if(v instanceof Date && !isNaN(v))return v;
  if(typeof v==='number' && Number.isFinite(v) && v>20000 && v<80000){const epoch=new Date(Date.UTC(1899,11,30));return new Date(epoch.getTime()+v*86400000);}
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); if(m){let y=Number(m[3]); if(y<100)y+=2000; return new Date(y,Number(m[2])-1,Number(m[1]));}
  m=s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/); if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  const d=new Date(s); return isNaN(d)?null:d;
}
function v47MonthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function v47MonthLabel(k){const [y,m]=String(k).split('-');return `${m}/${y}`;}
function v47DateIso(d){return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:null;}
function v47PeriodLabel(dates){
  if(!dates?.length)return '';
  const min=new Date(Math.min(...dates.map(d=>d.getTime()))),max=new Date(Math.max(...dates.map(d=>d.getTime())));
  const sameYear=min.getFullYear()===max.getFullYear();
  const sameMonth=sameYear&&min.getMonth()===max.getMonth();
  if(sameMonth)return `${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()}`;
  if(sameYear)return String(min.getFullYear());
  return `${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()} – ${String(max.getMonth()+1).padStart(2,'0')}/${max.getFullYear()}`;
}
function v47ShortProduct(code,name){
  const c=String(code||'').trim(), n=String(name||'').trim();
  if(n&&c&&v47Norm(n)!==v47Norm(c))return `${n} · ${c}`;
  return n||c||'Non specificato';
}
function v47Aggregate(rows,key){const m=new Map();rows.forEach(r=>{const k=(r[key]||'Non specificato').toString().trim()||'Non specificato';const prev=m.get(k)||{name:k,revenue:0,qty:0};prev.revenue+=r.revenue||0;prev.qty+=r.qty||0;m.set(k,prev);});return [...m.values()].sort((a,b)=>b.revenue-a.revenue);}
function v47BuildProductivityInsights(m,bil,record){
  const out=[];
  const topC=m.topCustomers?.[0], topP=m.topProducts?.[0];
  const topCS=topC?topC.revenue/m.totalRevenue*100:null, topPS=topP?topP.revenue/m.totalRevenue*100:null;
  if(topCS!=null){out.push({level:topCS>20?'warning':'positive',title:topCS>20?'Concentrazione clienti da monitorare':'Base clienti diversificata',text:topCS>20?`Il primo cliente pesa ${pct(topCS)} del fatturato. Valuta il rischio di dipendenza commerciale.`:`Il primo cliente pesa solo ${pct(topCS)} del fatturato: la concentrazione cliente risulta contenuta.`});}
  if(topPS!=null){out.push({level:topPS>25?'warning':'neutral',title:topPS>25?'Dipendenza dal prodotto principale':'Mix prodotti equilibrato',text:topPS>25?`Il prodotto ${esc(topP.name)} genera ${pct(topPS)} del fatturato. Conviene verificare margini, scorte e alternative commerciali.`:`Il prodotto principale pesa ${pct(topPS)} del fatturato.`});}
  if(m.monthlyRevenue?.length>1){const arr=m.monthlyRevenue.slice();const best=arr.reduce((a,b)=>b.revenue>a.revenue?b:a,arr[0]);const worst=arr.reduce((a,b)=>b.revenue<a.revenue?b:a,arr[0]);out.push({level:'neutral',title:'Stagionalità commerciale',text:`Mese migliore: ${v47MonthLabel(best.month)} (${fmt(best.revenue)}). Mese più basso: ${v47MonthLabel(worst.month)} (${fmt(worst.revenue)}).`});}
  if(bil?.data?.revenue!=null){const diff=m.totalRevenue-bil.data.revenue;const diffPct=bil.data.revenue?diff/bil.data.revenue*100:null;const samePeriod=String(record.period||'')===String(bil.period||'') || String(record.detectedYear||'')===String(bil.period||'');
    out.unshift({level:Math.abs(diffPct||0)>5?'warning':'positive',title:Math.abs(diffPct||0)>5?'Vendite e bilancio non allineati':'Vendite coerenti con il bilancio',text:Math.abs(diffPct||0)>5?`Il report vendite mostra ${fmt(m.totalRevenue)}, mentre il bilancio ${bil.period} riporta ${fmt(bil.data.revenue)}. Scostamento ${fmt(diff)}${diffPct!=null?` (${pct(Math.abs(diffPct))})`:''}. ${samePeriod?'Verifica perimetro, resi, ricavi non commerciali o periodo.':'Il periodo del report potrebbe non coincidere con il bilancio selezionato.'}`:`Il fatturato del report vendite è vicino ai ricavi del bilancio (${fmt(bil.data.revenue)}).`});
  }else out.unshift({level:'neutral',title:'Confronto con bilancio non disponibile',text:'Carica o seleziona un bilancio dello stesso periodo per confrontare vendite commerciali e ricavi contabili.'});
  return out.slice(0,5);
}

analyzeSalesRows=function(rawRows){
 if(!rawRows.length)throw new Error('EMPTY_SALES');const headers=Object.keys(rawRows[0]||{});
 const hCustomer=v47FindHeader(headers,['cliente','customer','ragione sociale','nominativo','clienti']);
 const hProductCode=v47FindHeader(headers,['codice articolo','cod articolo','codice prodotto','cod prodotto','codice','sku','item code','articolo codice']);
 const hProductName=v47FindHeader(headers,['descrizione articolo','descrizione prodotto','nome prodotto','articolo','prodotto','descrizione','referenza']);
 const hFamily=v47FindHeader(headers,['famiglia','categoria','category','linea','gruppo prodotto','tipologia']);
 const hQty=v47FindHeader(headers,['quantita','qta','qty','pezzi','unita','pz']);
 const hPrice=v47FindHeader(headers,['prezzo unitario','prezzo','price','unitario']);
 const hRevenue=v47FindHeader(headers,['fatturato','ricavo','totale','importo','valore','imponibile','importo totale','prezzo totale']);
 const hDate=v47FindHeader(headers,['data','date','giorno','mese','data fattura','data documento','riferimento data','doc date']);
 const rows=rawRows.map(r=>{const qty=parseAmount(r[hQty]),price=parseAmount(r[hPrice]);let revenue=parseAmount(r[hRevenue]);if((revenue==null||revenue===0)&&qty!=null&&price!=null)revenue=qty*price;const dt=hDate?v47ExcelDate(r[hDate]):null;const code=hProductCode?String(r[hProductCode]||'').trim():'';const name=hProductName?String(r[hProductName]||'').trim():'';return {customer:hCustomer?String(r[hCustomer]||'').trim():'',product:v47ShortProduct(code,name),productCode:code,productName:name,family:hFamily?String(r[hFamily]||'').trim():'',qty,unitPrice:price,revenue,date:dt&& !isNaN(dt)?dt:null};}).filter(r=>r.revenue!=null&&Number.isFinite(r.revenue)&&Math.abs(r.revenue)>0);
 if(!rows.length)throw new Error('NO_REVENUE_COL');
 const totalRevenue=rows.reduce((a,r)=>a+r.revenue,0),totalQty=rows.reduce((a,r)=>a+(r.qty||0),0);
 const customers=v47Aggregate(rows,'customer'),products=v47Aggregate(rows,'product');
 const byMonth=new Map(), byFamily=new Map(); const dates=[];
 rows.forEach(r=>{if(r.date){dates.push(r.date);const k=v47MonthKey(r.date);byMonth.set(k,(byMonth.get(k)||0)+r.revenue);} if(r.family){byFamily.set(r.family,(byFamily.get(r.family)||0)+r.revenue);}});
 const monthlyRevenue=[...byMonth.entries()].sort().map(([month,revenue])=>({month,revenue}));
 const topFamilies=[...byFamily.entries()].map(([name,revenue])=>({name,revenue})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
 const periodLabel=v47PeriodLabel(dates); const start=dates.length?new Date(Math.min(...dates.map(d=>d.getTime()))):null; const end=dates.length?new Date(Math.max(...dates.map(d=>d.getTime()))):null;
 const years=[...new Set(dates.map(d=>d.getFullYear()))];
 return {rowsCount:rows.length,totalRevenue,totalQty,avgUnitPrice:totalQty?totalRevenue/totalQty:null,uniqueCustomers:customers.length,uniqueProducts:products.length,avgRevenuePerCustomer:customers.length?totalRevenue/customers.length:null,topCustomerShare:customers[0]?customers[0].revenue/totalRevenue*100:null,topProductShare:products[0]?products[0].revenue/totalRevenue*100:null,topCustomers:customers.slice(0,10),topProducts:products.slice(0,10),monthlyRevenue,topFamilies,detectedPeriodLabel:periodLabel,detectedStartDate:v47DateIso(start),detectedEndDate:v47DateIso(end),detectedYear:years.length===1?String(years[0]):'',headers:{customer:hCustomer,productCode:hProductCode,productName:hProductName,product:hProductName||hProductCode,quantity:hQty,price:hPrice,revenue:hRevenue,date:hDate,family:hFamily}};
};

function v47EnsureProductivityShell(){
 const section=document.querySelector('#productivity'); if(!section)return null;
 let shell=document.querySelector('#v47ProductivityDashboard');
 if(!shell){
   shell=document.createElement('div'); shell.id='v47ProductivityDashboard'; shell.className='v47-prod';
   const oldMetrics=document.querySelector('#productivityMetrics');
   if(oldMetrics) oldMetrics.parentNode.insertBefore(shell,oldMetrics);
 }
 const periodInput=document.querySelector('#prodPeriod');
 if(periodInput && !document.querySelector('#prodAutoPeriodHint')){
   periodInput.placeholder='Es. 2025 oppure lascia vuoto: NOMYRA legge la DATA';
   periodInput.insertAdjacentHTML('afterend','<small id="prodAutoPeriodHint" class="v47-form-hint">Se il file contiene una colonna DATA, il periodo viene rilevato automaticamente e potrai leggere sia il totale anno sia il dettaglio mensile.</small>');
 }
 return shell;
}
function v47BarRows(items,total,kind='teal'){return (items||[]).slice(0,5).map((x,i)=>{const share=total?x.revenue/total*100:0;return `<div class="v47-bar-row ${kind}"><span class="rank">${i+1}</span><strong title="${esc(x.name)}">${esc(x.name)}</strong><div class="bar"><i style="width:${Math.min(100,share)}%"></i></div><b>${fmt(x.revenue)}</b><em>${pct(share)}</em></div>`}).join('')||'<div class="empty-state">Nessun dato disponibile.</div>';}
function v47InsightHtml(list){return (list||[]).map(x=>`<div class="v47-insight ${esc(x.level)}"><strong>${esc(x.title)}</strong><p>${x.text}</p></div>`).join('')||'<div class="empty-state">Carica vendite e bilancio per generare consigli.</div>';}
function v47FindComparableBil(record){
 return state.docs.find(d=>profileKey(d.company)===profileKey(record.company)&&String(d.period)===String(record.period))
 || state.docs.find(d=>profileKey(d.company)===profileKey(record.company)&&record.metrics?.detectedYear&&String(d.period)===String(record.metrics.detectedYear))
 || state.docs.find(d=>profileKey(d.company)===profileKey(record.company));
}
function v47RenderProdCharts(m){
 if(typeof v26DrawLine!=='function')return;
 if(m.monthlyRevenue?.length)v26DrawLine(document.querySelector('#v47MonthlyChart'),m.monthlyRevenue.map(x=>v47MonthLabel(x.month)),[{label:'Fatturato',values:m.monthlyRevenue.map(x=>x.revenue)}]);
 else v26DrawNoData(document.querySelector('#v47MonthlyChart'),'Aggiungi una colonna DATA per vedere il trend mensile');
 v26DrawBar(document.querySelector('#v47ProductsChart'),(m.topProducts||[]).slice(0,6).map(x=>x.name),(m.topProducts||[]).slice(0,6).map(x=>x.revenue),{accent:'#B97850'});
}
const __v47RenderProductivityBase = renderProductivity;
renderProductivity=function(){
 __v47RenderProductivityBase();
 const shell=v47EnsureProductivityShell(); if(!shell)return;
 const p=currentProductivity();
 if(!p||!p.metrics){shell.innerHTML=`<div class="v47-empty"><strong>Carica un report vendite</strong><span>NOMYRA leggerà clienti, prodotti, date, quantità e fatturato per generare analisi mensile, complessiva e confronto con il bilancio.</span></div>`;return;}
 const m=p.metrics, bil=v47FindComparableBil(p), insights=v47BuildProductivityInsights(m,bil,p);
 const diff=bil?.data?.revenue!=null?m.totalRevenue-bil.data.revenue:null; const diffPct=bil?.data?.revenue?diff/bil.data.revenue*100:null;
 shell.innerHTML=`
  <div class="v47-prod-hero">
    <div><span class="section-label">LETTURA PRODUTTIVITÀ</span><h2>${fmt(m.totalRevenue)} di fatturato vendite</h2><p>${num(m.uniqueCustomers)} clienti · ${num(m.uniqueProducts)} prodotti${m.detectedPeriodLabel?` · periodo rilevato: <b>${esc(m.detectedPeriodLabel)}</b>`:''}</p></div>
    <div class="v47-status ${bil&&Math.abs(diffPct||0)<=5?'ok':bil?'warn':'neutral'}"><strong>${bil?Math.abs(diffPct||0)<=5?'Coerente':'Da verificare':'Bilancio mancante'}</strong><span>${bil?`Scostamento vs bilancio: ${diff==null?'—':fmt(diff)}`:'Carica il bilancio dello stesso periodo'}</span></div>
  </div>
  <div class="v47-prod-kpis">
    <div><small>Fatturato report</small><strong>${fmt(m.totalRevenue)}</strong></div><div><small>Ricavi bilancio</small><strong>${bil?.data?.revenue!=null?fmt(bil.data.revenue):'—'}</strong></div><div><small>Scostamento</small><strong>${diff==null?'—':fmt(diff)}</strong></div><div><small>Periodo</small><strong>${esc(p.period||m.detectedPeriodLabel||'—')}</strong></div><div><small>Prezzo medio</small><strong>${fmt(m.avgUnitPrice)}</strong></div>
  </div>
  <div class="v47-prod-grid">
    <article class="panel"><div class="panel-head"><div><span class="section-label">CLIENTI</span><h3>Top clienti</h3></div></div>${v47BarRows(m.topCustomers,m.totalRevenue,'teal')}</article>
    <article class="panel"><div class="panel-head"><div><span class="section-label">PRODOTTI</span><h3>Top prodotti per nome</h3></div></div>${v47BarRows(m.topProducts,m.totalRevenue,'copper')}</article>
  </div>
  <div class="v47-prod-grid">
    <article class="panel"><div class="panel-head"><div><span class="section-label">MESE</span><h3>Fatturato mensile</h3></div></div><canvas id="v47MonthlyChart" class="v26-chart-canvas"></canvas></article>
    <article class="panel"><div class="panel-head"><div><span class="section-label">MIX</span><h3>Prodotti principali</h3></div></div><canvas id="v47ProductsChart" class="v26-chart-canvas"></canvas></article>
  </div>
  <div class="v47-prod-grid bottom"><article class="panel"><div class="panel-head"><div><span class="section-label">CONSIGLI NOMYRA</span><h3>Insight e azioni consigliate</h3></div></div>${v47InsightHtml(insights)}</article><article class="panel"><div class="panel-head"><div><span class="section-label">CONFRONTO BILANCIO</span><h3>Vendite vs ricavi contabili</h3></div></div><div class="v47-reco"><p>${bil?`Il report vendite caricato mostra <b>${fmt(m.totalRevenue)}</b>. Il bilancio ${esc(bil.period)} mostra ricavi per <b>${fmt(bil.data?.revenue)}</b>.`: 'Non è disponibile un bilancio collegato per questo confronto.'}</p><p>${bil&&Math.abs(diffPct||0)>5?'Verifica se il report copre più periodi, se include articoli fuori perimetro, note credito, ricavi non commerciali o dati non ancora presenti nel bilancio.':'Usa questo controllo per validare il perimetro commerciale prima di generare report.'}</p></div></article></div>`;
 v47RenderProdCharts(m);
};

handleProductivityUpload=async function(){
 const company=document.querySelector('#prodCompany')?.value.trim()||state.selectedCompany;
 let period=document.querySelector('#prodPeriod')?.value.trim()||state.selectedPeriod;
 const file=document.querySelector('#prodFile')?.files?.[0],status=document.querySelector('#productivityStatus');
 if(!company||!file){status.className='provider-result empty-state';status.textContent='Seleziona azienda e file Excel/CSV. Il periodo può essere indicato manualmente oppure rilevato dalla colonna DATA.';return;}
 try{status.className='provider-result';status.textContent='Lettura file vendite…';const rows=await readSalesFile(file);const metrics=analyzeSalesRows(rows);if(!period)period=metrics.detectedYear||metrics.detectedPeriodLabel||String(new Date().getFullYear());const record={id:'s'+Date.now(),company,period,fileName:file.name,createdAt:new Date().toISOString(),metrics,detected_start_date:metrics.detectedStartDate,detected_end_date:metrics.detectedEndDate,detected_period_label:metrics.detectedPeriodLabel};state.productivity=state.productivity.filter(x=>!(profileKey(x.company)===profileKey(company)&&String(x.period)===String(period)));state.productivity.push(record);state.selectedCompany=company;state.selectedPeriod=period;save();cloudSaveProductivity(record,file).catch(console.warn);renderAll();status.innerHTML=`<strong>Analisi vendite completata</strong><p>${metrics.rowsCount} righe lette · ${num(metrics.uniqueCustomers)} clienti · ${num(metrics.uniqueProducts)} prodotti · fatturato ${fmt(metrics.totalRevenue)}.</p><small>Periodo: ${esc(metrics.detectedPeriodLabel||period)} · colonne: cliente ${metrics.headers.customer||'—'}, prodotto ${metrics.headers.productName||metrics.headers.productCode||'—'}, data ${metrics.headers.date||'—'}, fatturato ${metrics.headers.revenue||'—'}.</small>`;}catch(err){console.error(err);status.className='provider-result empty-state';status.textContent=err.message==='XLSX_MISSING'?'Impossibile caricare il lettore Excel dal CDN. Riprovare online o usare CSV in una versione server.':err.message==='NO_REVENUE_COL'?'Non ho trovato una colonna fatturato/importo/totale né quantità × prezzo. Controlla le intestazioni del file.':'Non è stato possibile leggere il file vendite.';}
};

const __v47CloudSaveProductivityBase=cloudSaveProductivity;
cloudSaveProductivity=async function(record,file=null){
 if(!CLOUD.user)return null;const company=await ensureCompany(record.company,getCompanyProfile(record.company));const m=record.metrics||{};let remoteId=record._remoteId||null;let filePath=record.file_path||null; if(file)filePath=(await uploadToBucket('productivity-files',company.id,file,String(record.period||'vendite'))).path;
 const notes=v47BuildProductivityInsights(m,v47FindComparableBil(record),record);
 const payload={company_id:company.id,period:String(record.period||''),file_name:record.fileName||null,file_bucket:'productivity-files',file_path:filePath,total_revenue:m.totalRevenue??null,customers_count:m.uniqueCustomers??null,products_count:m.uniqueProducts??null,units_total:m.totalQty??null,weighted_avg_price:m.avgUnitPrice??null,top_customer_share:m.topCustomerShare??null,top_product_share:m.topProductShare??null,raw_metrics:m,detected_start_date:m.detectedStartDate||record.detected_start_date||null,detected_end_date:m.detectedEndDate||record.detected_end_date||null,detected_period_label:m.detectedPeriodLabel||record.detected_period_label||null,analysis_notes:notes,uploaded_by:CLOUD.user.id};
 if(!remoteId){const ex=await supabase.from('productivity_files').select('id').eq('company_id',company.id).eq('period',String(record.period||'')).limit(1).maybeSingle();if(ex.data?.id)remoteId=ex.data.id;}
 if(remoteId){const up=await supabase.from('productivity_files').update(payload).eq('id',remoteId).select('id').single();if(up.error)throw up.error;record._remoteId=remoteId;}
 else{const ins=await supabase.from('productivity_files').insert(payload).select('id').single();if(ins.error)throw ins.error;record._remoteId=ins.data.id;}
 return record._remoteId;
};
console.info('NOMYRA Finance V47 loaded: productivity analysis with product names, period detection, monthly trend, reconciliation and recommendations.');

/* ===========================
   V48 - Persistenza vista + grafici produttività interattivi
   - mantiene la sezione aperta tra cambio scheda/refresh soft
   - grafico mensile con label leggibili e dettaglio cliccabile
   - analisi prezzi/quantità/costi in confronto con il bilancio
   =========================== */
(function(){
  const V48_VIEW_KEY='nomyra-finance-last-view-v48';
  const VALID_VIEWS=new Set(['home','companies','documents','overview','benchmark','productivity','analysis','report','comparison','admin','access']);
  function v48CanRestore(view){const unlocked=(typeof isPortalUnlocked==='function')?isPortalUnlocked():true;return VALID_VIEWS.has(view)&&view!=='access'&&unlocked;}
  function v48SaveView(view){try{if(VALID_VIEWS.has(view))localStorage.setItem(V48_VIEW_KEY,view);}catch(e){}}
  function v48WantedView(){try{return localStorage.getItem(V48_VIEW_KEY)||'';}catch(e){return '';}}
  const __v48ShowViewBase=showView;
  showView=function(view,title=null){
    __v48ShowViewBase(view,title);
    window.__nomyraCurrentView=view;
    if(view!=='access')v48SaveView(view);
  };
  function v48RestoreView(){
    const wanted=v48WantedView();
    if(v48CanRestore(wanted) && document.querySelector(`#${wanted}.view`)){
      const active=document.querySelector('main > section.view.active')?.id;
      if(active!==wanted) showView(wanted, (typeof VIEW_TITLES!=='undefined'&&VIEW_TITLES[wanted])||wanted);
      else if(wanted==='productivity') renderProductivity();
      else if(wanted==='overview') renderOverview();
    }
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(v48RestoreView,180);});
  window.addEventListener('focus',()=>setTimeout(v48RestoreView,180));
  setTimeout(v48RestoreView,900);
  if(window.supabase?.auth){supabase.auth.onAuthStateChange((event,session)=>{if(event!=='SIGNED_OUT'&&session)setTimeout(v48RestoreView,650);});}

  function v48MonthLabel(k){
    const months=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const [y,m]=String(k||'').split('-');
    const idx=Math.max(0,Math.min(11,Number(m||1)-1));
    return `${months[idx]} ${String(y||'').slice(-2)}`;
  }
  function v48FullMonthLabel(k){
    const months=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    const [y,m]=String(k||'').split('-');
    const idx=Math.max(0,Math.min(11,Number(m||1)-1));
    return `${months[idx]} ${y||''}`;
  }
  function v48CanvasSetup(canvas){
    if(!canvas)return null;const rect=canvas.getBoundingClientRect();const dpr=window.devicePixelRatio||1;const w=Math.max(320,Math.floor(rect.width||640)),h=Math.max(260,Math.floor(rect.height||280));canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width='100%';canvas.style.height=h+'px';const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h};
  }
  function v48Nearest(points,x,y){let best=null,bd=Infinity;points.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}});return bd<26?best:null;}
  function v48SetDetail(el,html){if(el)el.innerHTML=html;}
  function v48DrawInteractiveLine(canvas,items,detailEl){
    const o=v48CanvasSetup(canvas);if(!o)return;const {ctx,w,h}=o;
    if(!items?.length){v26DrawNoData(canvas,'Aggiungi una colonna DATA per vedere il trend mensile');return;}
    const vals=items.map(x=>Number(x.revenue||0)),max=Math.max(...vals,1),min=Math.min(...vals,0),range=max-min||1;
    const padL=70,padR=24,padT=30,padB=62,plotW=w-padL-padR,plotH=h-padT-padB;
    ctx.strokeStyle='#dfe8e5';ctx.lineWidth=1;ctx.fillStyle='#7a8991';ctx.font='11px system-ui';ctx.textAlign='right';
    for(let i=0;i<5;i++){const y=padT+plotH*i/4;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();const val=max-(max-min)*i/4;ctx.fillText((typeof v26Compact==='function')? v26Compact(val): Math.round(val).toLocaleString('it-IT'),padL-10,y+4);}
    const pts=items.map((it,i)=>({
      x:items.length===1?padL+plotW/2:padL+plotW*i/(items.length-1),
      y:padT+plotH-(Number(it.revenue||0)-min)/range*plotH,
      raw:it
    }));
    const grad=ctx.createLinearGradient(0,padT,0,padT+plotH);grad.addColorStop(0,'rgba(31,90,93,.22)');grad.addColorStop(1,'rgba(31,90,93,0)');
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(pts.at(-1).x,padT+plotH);ctx.lineTo(pts[0].x,padT+plotH);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#1F5A5D';ctx.lineWidth=3;ctx.stroke();
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='#1F5A5D';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();});
    const step=Math.max(1,Math.ceil(items.length/8));ctx.textAlign='center';ctx.fillStyle='#65727b';ctx.font='11px system-ui';
    items.forEach((it,i)=>{if(i%step!==0&&i!==items.length-1)return;const p=pts[i];ctx.save();ctx.translate(p.x,h-30);ctx.rotate(-Math.PI/7);ctx.fillText(v48MonthLabel(it.month),0,0);ctx.restore();});
    canvas.__v48Points=pts;canvas.style.cursor='pointer';
    canvas.onclick=e=>{const r=canvas.getBoundingClientRect();const dprX=(canvas.width/(window.devicePixelRatio||1))/r.width;const dprY=(canvas.height/(window.devicePixelRatio||1))/r.height;const p=v48Nearest(pts,(e.clientX-r.left)*dprX,(e.clientY-r.top)*dprY);if(!p)return;v48SetDetail(detailEl,`<strong>${v48FullMonthLabel(p.raw.month)}</strong><span>Fatturato: ${fmt(p.raw.revenue)}</span><small>Clicca un altro punto del grafico per cambiare mese.</small>`);};
    if(detailEl&&!detailEl.dataset.touched&&items.length){const last=items.at(-1);v48SetDetail(detailEl,`<strong>${v48FullMonthLabel(last.month)}</strong><span>Fatturato: ${fmt(last.revenue)}</span><small>Clicca un punto del grafico per leggere il dettaglio.</small>`);}
  }
  function v48DrawInteractiveBars(canvas,items,detailEl){
    const o=v48CanvasSetup(canvas);if(!o)return;const{ctx,w,h}=o;
    const rows=(items||[]).slice(0,7);if(!rows.length){v26DrawNoData(canvas,'Nessun prodotto disponibile');return;}
    const max=Math.max(...rows.map(x=>Number(x.revenue||0)),1),padL=150,padR=84,padT=24,rowH=Math.min(34,(h-padT-24)/rows.length),barH=18;
    const bars=[];ctx.font='12px system-ui';
    rows.forEach((it,i)=>{const y=padT+i*rowH+rowH/2;const barW=(w-padL-padR)*Number(it.revenue||0)/max;ctx.fillStyle='#eef3f1';ctx.fillRect(padL,y-barH/2,w-padL-padR,barH);ctx.fillStyle='#B97850';ctx.fillRect(padL,y-barH/2,barW,barH);ctx.fillStyle='#142033';ctx.textAlign='left';let name=String(it.name||'');if(name.length>23)name=name.slice(0,22)+'…';ctx.fillText(name,12,y+4);ctx.textAlign='right';ctx.fillStyle='#596871';ctx.fillText(pct((it.revenue||0)/(items.totalRevenue||max)*100),w-18,y+4);bars.push({x:padL,y:y-barH/2,w:Math.max(4,barW),h:barH,raw:it});});
    canvas.__v48Bars=bars;canvas.style.cursor='pointer';canvas.onclick=e=>{const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left),y=(e.clientY-r.top);const b=bars.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y-8&&y<=b.y+b.h+8)||bars.find(b=>y>=b.y-8&&y<=b.y+b.h+8);if(!b)return;v48SetDetail(detailEl,`<strong>${esc(b.raw.name)}</strong><span>Fatturato: ${fmt(b.raw.revenue)} · Quantità: ${num(b.raw.qty||0)}</span><small>Quota sul fatturato: ${pct((b.raw.revenue||0)/(items.totalRevenue||1)*100)}</small>`);};
  }
  function v48CostBaseFromBil(bil){
    if(!bil?.data)return null;const x=bil.data;
    const keys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','adminCommercialCosts','leases','personnel','otherOperatingCosts'];
    const rows=keys.map(k=>({key:k,label:metricNames?.[k]||k,value:Math.abs(Number(x[k]||0))})).filter(r=>r.value>0);
    const total=rows.reduce((a,r)=>a+r.value,0);if(!total)return null;return{rows,total};
  }
  function v48CostAdvice(m,bil){
    const cost=v48CostBaseFromBil(bil);if(!cost||!m?.totalQty)return {level:'neutral',title:'Costo unitario non calcolabile',text:'Per stimare il costo del quantitativo servono quantità vendute e voci di costo operative nel bilancio.'};
    const costPerUnit=cost.total/m.totalQty,price=m.avgUnitPrice||0,margin=price-costPerUnit,marginPct=price?margin/price*100:null;
    let level=margin<0?'danger':marginPct<10?'warning':'positive';
    let title=margin<0?'Prezzo medio sotto il costo stimato':marginPct<10?'Margine unitario molto stretto':'Prezzo medio sopra il costo stimato';
    const text=`Costo operativo stimato per unità: ${fmt(costPerUnit)}. Prezzo medio vendite: ${fmt(price)}. Margine unitario stimato: ${fmt(margin)}${marginPct!=null?` (${pct(marginPct)} sul prezzo medio)`:''}.`;
    return {level,title,text,costPerUnit,margin,marginPct,totalCost:cost.total,costRows:cost.rows};
  }
  function v48CostPanelHtml(m,bil){
    const a=v48CostAdvice(m,bil);const rows=a.costRows?.slice(0,5)||[];
    return `<div class="v48-cost ${esc(a.level)}"><div><span class="section-label">PREZZI, COSTI E QUANTITÀ</span><h3>${esc(a.title)}</h3><p>${a.text}</p></div>${rows.length?`<div class="v48-cost-breakdown">${rows.map(r=>`<span><b>${esc(r.label)}</b><em>${fmt(r.value)}</em></span>`).join('')}</div>`:''}<small>Stima direzionale: usa i costi del bilancio e le quantità del report vendite. Per margini reali per articolo serve il costo industriale/distinta base per prodotto.</small></div>`;
  }
  function v48QuantityPanelHtml(m){
    const top=(m.topProducts||[]).slice(0,4);
    return `<div class="v48-qty-panel"><span class="section-label">QUANTITÀ</span><h3>Volumi e prezzo medio</h3><div class="v48-qty-kpis"><div><small>Unità vendute</small><strong>${num(m.totalQty||0)}</strong></div><div><small>Prezzo medio</small><strong>${fmt(m.avgUnitPrice)}</strong></div><div><small>Prodotti attivi</small><strong>${num(m.uniqueProducts)}</strong></div></div>${top.length?`<div class="v48-qty-list">${top.map(x=>`<span><b>${esc(x.name)}</b><em>${num(x.qty||0)} unità · ${fmt(x.revenue)}</em></span>`).join('')}</div>`:''}</div>`;
  }
  function v48RenderProdCharts(m){
    const monthDetail=document.querySelector('#v48MonthDetail');const productDetail=document.querySelector('#v48ProductDetail');
    v48DrawInteractiveLine(document.querySelector('#v47MonthlyChart'),m.monthlyRevenue||[],monthDetail);
    const top=(m.topProducts||[]).slice(0,7);top.totalRevenue=m.totalRevenue||1;v48DrawInteractiveBars(document.querySelector('#v47ProductsChart'),top,productDetail);
  }
  const __v48RenderProductivityBase=renderProductivity;
  renderProductivity=function(){
    __v48RenderProductivityBase();
    const shell=document.querySelector('#v47ProductivityDashboard');const p=currentProductivity();if(!shell||!p?.metrics)return;
    const m=p.metrics, bil=v47FindComparableBil(p);
    const costHtml=v48CostPanelHtml(m,bil);const qtyHtml=v48QuantityPanelHtml(m);
    const monthlyPanel=document.querySelector('#v47MonthlyChart')?.closest('.panel');
    const productPanel=document.querySelector('#v47ProductsChart')?.closest('.panel');
    if(monthlyPanel&&!document.querySelector('#v48MonthDetail')) monthlyPanel.insertAdjacentHTML('beforeend','<div id="v48MonthDetail" class="v48-chart-detail"></div>');
    if(productPanel&&!document.querySelector('#v48ProductDetail')) productPanel.insertAdjacentHTML('beforeend','<div id="v48ProductDetail" class="v48-chart-detail"></div>');
    if(!document.querySelector('#v48CostAnalysis')){
      const target=shell.querySelector('.v47-prod-grid.bottom')||shell.lastElementChild;
      target?.insertAdjacentHTML('beforebegin',`<div id="v48CostAnalysis" class="v48-analysis-grid"><article class="panel">${costHtml}</article><article class="panel">${qtyHtml}</article></div>`);
    }else{
      document.querySelector('#v48CostAnalysis').innerHTML=`<article class="panel">${costHtml}</article><article class="panel">${qtyHtml}</article>`;
    }
    v48RenderProdCharts(m);
  };
  const __v48CloudSaveProductivityBase=cloudSaveProductivity;
  cloudSaveProductivity=async function(record,file=null){
    const id=await __v48CloudSaveProductivityBase(record,file);
    if(!CLOUD.user||!record?._remoteId)return id;
    try{
      const bil=v47FindComparableBil(record),m=record.metrics||{},cost=v48CostAdvice(m,bil),balanceRevenue=bil?.data?.revenue??null;
      await supabase.from('productivity_files').update({
        cost_analysis:cost,
        period_mode:m.detectedStartDate?'auto_date':'manual',
        detected_months:m.monthlyRevenue?.length||0,
        source_revenue:m.totalRevenue??null,
        balance_revenue:balanceRevenue,
        revenue_gap:balanceRevenue!=null&&m.totalRevenue!=null?m.totalRevenue-balanceRevenue:null
      }).eq('id',record._remoteId);
    }catch(e){console.warn('V48 productivity metadata save',e.message);}
    return id;
  };
  const __v48RenderAllBase=renderAll;
  renderAll=function(){__v48RenderAllBase();const active=v48WantedView();if(v48CanRestore(active)&&typeof hardSetActiveView==='function')hardSetActiveView(active);};
  console.info('NOMYRA Finance V48 loaded: persistent view, interactive productivity charts, quantity and cost analysis.');
})();

/* ===========================
   V49 - Produttività: analisi subito visibile + upload compatto
   =========================== */
(function(){
  function v49MoveProductivityAnalysis(){
    const section=document.querySelector('#productivity');
    if(!section)return;
    const layout=section.querySelector('.productivity-layout');
    const shell=section.querySelector('#v47ProductivityDashboard');
    const p=(typeof currentProductivity==='function')?currentProductivity():null;
    section.classList.toggle('v49-has-analysis',!!(p&&p.metrics));
    if(shell&&layout&&shell.compareDocumentPosition(layout)&Node.DOCUMENT_POSITION_PRECEDING){
      // already before layout
    }else if(shell&&layout){
      section.insertBefore(shell,layout);
    }
    let banner=section.querySelector('#v49LoadedSalesBanner');
    if(p&&p.metrics){
      const m=p.metrics;
      const period=m.detectedPeriodLabel||p.period||'Periodo non indicato';
      const file=p.fileName||'Report vendite';
      const html=`<div class="v49-loaded-sales" id="v49LoadedSalesBanner">
        <div class="v49-loaded-icon">✓</div>
        <div class="v49-loaded-main">
          <span class="section-label">REPORT VENDITE CARICATO</span>
          <strong>${esc(file)}</strong>
          <small>${esc(period)} · ${num(m.rowsCount||0)} righe · ${num(m.uniqueCustomers||0)} clienti · ${num(m.uniqueProducts||0)} prodotti · ${fmt(m.totalRevenue||0)}</small>
        </div>
        <button type="button" class="mini-btn" id="v49ReplaceSalesFile">Carica nuovo file</button>
      </div>`;
      if(!banner){
        shell.insertAdjacentHTML('beforebegin',html);
        banner=section.querySelector('#v49LoadedSalesBanner');
      }else banner.outerHTML=html;
      section.querySelector('#v49ReplaceSalesFile')?.addEventListener('click',()=>{
        section.querySelector('.productivity-layout')?.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(()=>section.querySelector('#prodFile')?.click(),350);
      });
      const status=section.querySelector('#productivityStatus');
      if(status&&!status.dataset.v49Compact){
        status.dataset.v49Compact='1';
        status.innerHTML=`<strong>Analisi pronta</strong><small>Puoi sostituire il file o rianalizzarlo. La lettura principale è mostrata sopra.</small>`;
        status.className='provider-result v49-compact-status';
      }
    }else{
      banner?.remove();
    }
  }
  const __v49RenderProductivityBase=renderProductivity;
  renderProductivity=function(){
    __v49RenderProductivityBase();
    v49MoveProductivityAnalysis();
  };
  const __v49RenderAllBase=renderAll;
  renderAll=function(){
    __v49RenderAllBase();
    if((window.__nomyraCurrentView||document.querySelector('main > section.view.active')?.id)==='productivity') v49MoveProductivityAnalysis();
  };
  setTimeout(v49MoveProductivityAnalysis,500);
  console.info('NOMYRA Finance V49 loaded: productivity analysis first, compact upload area.');
})();

/* ===========================
   V50 - Produttività: analisi sempre sopra + upload compatto reale
   =========================== */
(function(){
  function v50SelectedProductivity(){
    try{return typeof currentProductivity==='function'?currentProductivity():null;}catch(e){return null;}
  }
  function v50PutAnalysisFirst(){
    const section=document.querySelector('#productivity');
    if(!section)return;
    const layout=section.querySelector('.productivity-layout');
    const shell=section.querySelector('#v47ProductivityDashboard');
    const p=v50SelectedProductivity();
    const has=!!(p&&p.metrics);
    section.classList.toggle('v50-has-analysis',has);
    section.classList.toggle('v49-has-analysis',has);

    if(shell&&layout){
      // Force analysis dashboard before the upload/reconciliation grid.
      section.insertBefore(shell,layout);
    }

    let banner=section.querySelector('#v50LoadedSalesBanner');
    if(has){
      const m=p.metrics||{};
      const period=m.detectedPeriodLabel||p.period||'Periodo non indicato';
      const file=p.fileName||'Report vendite';
      const html=`<div class="v50-loaded-sales" id="v50LoadedSalesBanner">
        <div class="v50-loaded-icon">✓</div>
        <div class="v50-loaded-main">
          <span class="section-label">REPORT VENDITE CARICATO</span>
          <strong>${esc(file)}</strong>
          <small>${esc(period)} · ${num(m.rowsCount||0)} righe · ${num(m.uniqueCustomers||0)} clienti · ${num(m.uniqueProducts||0)} prodotti · ${fmt(m.totalRevenue||0)}</small>
        </div>
        <button type="button" class="mini-btn" id="v50ReplaceSalesFile">Sostituisci file</button>
      </div>`;
      if(!banner){
        if(shell) shell.insertAdjacentHTML('beforebegin',html);
        else layout?.insertAdjacentHTML('beforebegin',html);
      }else banner.outerHTML=html;
      section.querySelector('#v50ReplaceSalesFile')?.addEventListener('click',()=>section.querySelector('#prodFile')?.click());
      const status=section.querySelector('#productivityStatus');
      if(status){
        status.className='provider-result v49-compact-status';
        status.innerHTML='<strong>Analisi già caricata.</strong><small>Usa questa barra solo se devi sostituire o rianalizzare il file vendite.</small>';
      }
    }else{
      banner?.remove();
    }
  }
  const __v50RenderProductivityBase=renderProductivity;
  renderProductivity=function(){
    __v50RenderProductivityBase();
    v50PutAnalysisFirst();
  };
  const __v50RenderAllBase=renderAll;
  renderAll=function(){
    __v50RenderAllBase();
    if((window.__nomyraCurrentView||document.querySelector('main > section.view.active')?.id)==='productivity') v50PutAnalysisFirst();
  };
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='prodFile')setTimeout(v50PutAnalysisFirst,100);});
  setTimeout(v50PutAnalysisFirst,450);
  console.info('NOMYRA Finance V50 loaded: compact productivity upload and analysis-first layout.');
})();


/* ===========================
   V51 - Produttività: upload compatto sempre + analisi sopra
   =========================== */
(function(){
  function v51HasProductivity(){try{const p=typeof currentProductivity==='function'?currentProductivity():null;if(p&&p.metrics)return true;}catch(e){} const st=document.querySelector('#productivityStatus'); const file=document.querySelector('#prodFile'); return !!(st&&/Analisi vendite completata|Analisi pronta|Analisi già caricata/i.test(st.textContent||'')) || !!(file&&file.files&&file.files.length);}
  function v51FixProductivityLayout(){
    const section=document.querySelector('#productivity'); if(!section)return;
    const layout=section.querySelector('.productivity-layout'); let shell=section.querySelector('#v47ProductivityDashboard');
    if(!shell&&layout){shell=document.createElement('div');shell.id='v47ProductivityDashboard';shell.className='v47-prod';section.insertBefore(shell,layout);}
    if(shell&&layout&&shell.nextElementSibling!==layout){section.insertBefore(shell,layout);} 
    const has=v51HasProductivity(); section.classList.toggle('v51-has-analysis',has); section.classList.toggle('v50-has-analysis',has); section.classList.toggle('v49-has-analysis',has);
    if(has){
      const status=section.querySelector('#productivityStatus');
      if(status&&!/Analisi pronta|Analisi già caricata/i.test(status.textContent||'')){
        status.className='provider-result v49-compact-status';
        status.innerHTML='<strong>Report vendite caricato.</strong><small>L’analisi è visibile sopra. Usa questa barra solo per sostituire o rianalizzare il file.</small>';
      }
    }
  }
  const __v51RenderProductivityBase=renderProductivity;
  renderProductivity=function(){__v51RenderProductivityBase();v51FixProductivityLayout();};
  const __v51RenderAllBase=renderAll;
  renderAll=function(){__v51RenderAllBase();if((window.__nomyraCurrentView||document.querySelector('main > section.view.active')?.id)==='productivity')v51FixProductivityLayout();};
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='prodFile')setTimeout(v51FixProductivityLayout,60);});
  // V57: disattivato MutationObserver V51 su Produttività.
  // Il vecchio observer reagiva a ogni cambio di testo/status durante l'upload e poteva generare blocchi della pagina.
  setTimeout(()=>{v51FixProductivityLayout();},600);
  console.info('NOMYRA Finance V51 loaded: compact productivity upload always, analysis above.');
})();


/* ===========================
   V52 - Favicon NOMYRA + persistenza sezione reale
   - favicon nella scheda Chrome
   - non torna alla Dashboard dopo cambio scheda / refresh sessione
   - salva la sezione visibile prima di uscire dalla scheda
   =========================== */
(function(){
  const VIEW_KEY='nomyra-finance-last-view-v52';
  const OLD_KEYS=['nomyra-finance-last-view-v48'];
  const VALID=new Set(['home','companies','documents','overview','benchmark','productivity','analysis','report','comparison','admin','access']);
  let restoring=false;
  let explicitHomeUntil=0;

  function isUnlocked(){
    try{return typeof isPortalUnlocked==='function'?isPortalUnlocked():!!(CLOUD&&CLOUD.user);}catch(e){return true;}
  }
  function activeView(){return document.querySelector('main > section.view.active')?.id || window.__nomyraCurrentView || '';}
  function read(){
    try{
      const v=localStorage.getItem(VIEW_KEY);
      if(v)return v;
      for(const k of OLD_KEYS){const old=localStorage.getItem(k);if(old)return old;}
    }catch(e){}
    return '';
  }
  function write(view){
    if(!VALID.has(view)||view==='access')return;
    try{localStorage.setItem(VIEW_KEY,view);localStorage.setItem('nomyra-finance-last-view-v48',view);}catch(e){}
  }
  function canRestore(view){return VALID.has(view)&&view!=='access'&&isUnlocked()&&!!document.getElementById(view);}
  function pageTitleFor(view){try{return VIEW_TITLES?.[view]||view;}catch(e){return view;}}

  // Ensure the browser tab uses the NOMYRA symbol even if Cloudflare serves cached HTML.
  function ensureFavicon(){
    const head=document.head||document.querySelector('head'); if(!head)return;
    const href='assets/nomyra-mark-primary.png?v=52';
    ['icon','shortcut icon','apple-touch-icon'].forEach(rel=>{
      let el=[...head.querySelectorAll('link')].find(x=>(x.getAttribute('rel')||'').toLowerCase()===rel);
      if(!el){el=document.createElement('link');el.setAttribute('rel',rel);head.appendChild(el);}
      el.setAttribute('href',href);el.setAttribute('type','image/png');
      if(rel==='icon')el.setAttribute('sizes','32x32');
    });
    let meta=head.querySelector('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';head.appendChild(meta);}meta.content='#142033';
  }
  ensureFavicon();

  // Capture user intent before the existing onclick handlers run.
  document.addEventListener('pointerdown',e=>{
    const nav=e.target.closest?.('.nav-item[data-view], [data-nav], [data-v43-nav], [data-v43-open], [data-v42-kpi]');
    if(!nav)return;
    const view=nav.dataset.view||nav.dataset.nav||nav.dataset.v43Nav||nav.dataset.v43Open||(nav.dataset.v42Kpi?'overview':'');
    if(view==='home') explicitHomeUntil=Date.now()+1400;
    if(view&&view!=='access') write(view);
  },true);
  document.addEventListener('click',e=>{
    const compare=e.target.closest?.('[data-start-compare]');
    if(compare)write('comparison');
  },true);

  const baseShowView=showView;
  showView=function(view,title=null){
    const savedBefore=read();
    const automaticHome=view==='home' && savedBefore && savedBefore!=='home' && Date.now()>explicitHomeUntil && !restoring;
    baseShowView(view,title);
    window.__nomyraCurrentView=view;
    if(view!=='access' && !automaticHome && !restoring) write(view);
    if(automaticHome && canRestore(savedBefore)){
      // Supabase restore/session callbacks often push the user to Dashboard.
      // Restore the last real section just after those callbacks finish.
      setTimeout(()=>restore(savedBefore),60);
      setTimeout(()=>restore(savedBefore),380);
      setTimeout(()=>restore(savedBefore),900);
    }
  };

  function restore(view=read()){
    if(!canRestore(view))return false;
    const current=activeView();
    if(current===view){
      if(view==='productivity'&&typeof renderProductivity==='function')renderProductivity();
      if(view==='overview'&&typeof renderOverview==='function')renderOverview();
      return true;
    }
    restoring=true;
    try{baseShowView(view,pageTitleFor(view));window.__nomyraCurrentView=view;write(view);}catch(e){console.warn('V52 restore view failed',e);}finally{restoring=false;}
    return true;
  }

  function persistCurrent(){const v=activeView();if(v&&v!=='access')write(v);}
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)persistCurrent();
    else{setTimeout(()=>restore(),80);setTimeout(()=>restore(),450);}
  });
  window.addEventListener('pagehide',persistCurrent);
  window.addEventListener('beforeunload',persistCurrent);
  window.addEventListener('focus',()=>{setTimeout(()=>restore(),120);setTimeout(()=>restore(),650);});
  window.addEventListener('pageshow',()=>{setTimeout(()=>restore(),160);setTimeout(()=>restore(),800);});

  // On boot, wait for Supabase/session render to finish, then restore section.
  [500,1200,2200].forEach(ms=>setTimeout(()=>restore(),ms));
  if(window.supabase?.auth){
    try{supabase.auth.onAuthStateChange((event,session)=>{if(event!=='SIGNED_OUT'&&session)setTimeout(()=>restore(),700);});}catch(e){}
  }
  console.info('NOMYRA Finance V52 loaded: favicon + persistent section restore.');
})();


/* ===========================
   V54 - Recupero password Supabase
   - collega il pulsante "Password dimenticata?"
   - invia email reset con redirect alla piattaforma
   - gestisce PASSWORD_RECOVERY e mostra cambio password
   =========================== */
(function(){
  const VERSION='53';
  const RESET_REDIRECT=()=>{
    // Redirect pubblico fisso: evita che Supabase generi link verso localhost:3000.
    // Deve essere presente anche in Supabase > Authentication > URL Configuration.
    return 'https://nomyra-finance.pages.dev/';
  };
  function modal(){
    let m=document.querySelector('#passwordResetModal');
    if(m)return m;
    m=document.createElement('div');
    m.id='passwordResetModal';
    m.className='modal';
    m.setAttribute('aria-hidden','true');
    m.innerHTML=`
      <div class="modal-card auth-card reset-card">
        <div class="modal-head">
          <div>
            <p class="eyebrow">ACCESSO NOMYRA</p>
            <h2 id="resetTitle">Recupera password</h2>
            <p id="resetIntro" class="modal-intro">Inserisci la tua email: riceverai un link per creare una nuova password.</p>
          </div>
          <button id="closePasswordReset" class="icon-btn" type="button">×</button>
        </div>
        <div id="resetRequestBox" class="reset-step">
          <label>Email
            <input id="resetEmail" type="email" autocomplete="email" placeholder="nome@azienda.it">
          </label>
          <div class="provider-result" id="resetMessage">Usa la stessa email del tuo account NOMYRA Finance. Il link deve aprirsi su nomyra-finance.pages.dev, non su localhost.</div>
          <div class="modal-actions wrap">
            <button id="sendPasswordReset" class="primary" type="button">Invia link di recupero</button>
            <button id="cancelPasswordReset" class="ghost" type="button">Annulla</button>
          </div>
        </div>
        <div id="resetUpdateBox" class="reset-step" hidden>
          <label>Nuova password
            <input id="newPassword" type="password" autocomplete="new-password" placeholder="Minimo 8 caratteri">
          </label>
          <label>Conferma password
            <input id="newPasswordConfirm" type="password" autocomplete="new-password" placeholder="Ripeti la nuova password">
          </label>
          <div class="provider-result" id="updatePasswordMessage">Inserisci la nuova password per completare il recupero.</div>
          <div class="modal-actions wrap">
            <button id="saveNewPassword" class="primary" type="button">Salva nuova password</button>
            <button id="cancelUpdatePassword" class="ghost" type="button">Chiudi</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    const css=document.createElement('style');
    css.textContent=`
      .reset-card{max-width:560px}.reset-card label{display:block;margin:0 0 14px;font-weight:850;color:#142033}.reset-card input{width:100%;height:52px;border:1px solid #d2ddd9;border-radius:12px;padding:0 14px;font-size:16px;background:#fff}.reset-card input:focus{outline:0;border-color:#1f5a5d;box-shadow:0 0 0 4px rgba(31,90,93,.12)}.reset-step[hidden]{display:none!important}`;
    document.head.appendChild(css);
    m.querySelector('#closePasswordReset').onclick=close;
    m.querySelector('#cancelPasswordReset').onclick=close;
    m.querySelector('#cancelUpdatePassword').onclick=close;
    m.querySelector('#sendPasswordReset').onclick=sendReset;
    m.querySelector('#saveNewPassword').onclick=saveNewPassword;
    return m;
  }
  function open(){const m=modal();m.classList.add('open');m.setAttribute('aria-hidden','false');}
  function close(){const m=modal();m.classList.remove('open');m.setAttribute('aria-hidden','true');}
  function setMode(mode){
    const m=modal();
    const request=m.querySelector('#resetRequestBox');
    const update=m.querySelector('#resetUpdateBox');
    if(mode==='update'){
      m.querySelector('#resetTitle').textContent='Crea nuova password';
      m.querySelector('#resetIntro').textContent='Il link di recupero è stato verificato. Ora puoi impostare una nuova password.';
      request.hidden=true; update.hidden=false;
    }else{
      m.querySelector('#resetTitle').textContent='Recupera password';
      m.querySelector('#resetIntro').textContent='Inserisci la tua email: riceverai un link per creare una nuova password.';
      request.hidden=false; update.hidden=true;
    }
  }
  function openRequest(email=''){
    setMode('request'); open();
    const input=modal().querySelector('#resetEmail');
    if(input && email)input.value=email;
    setTimeout(()=>input?.focus(),80);
  }
  function openUpdate(){setMode('update'); open();setTimeout(()=>modal().querySelector('#newPassword')?.focus(),80);}
  function getEmailFromUI(){
    return (document.querySelector('#landingEmail')?.value||document.querySelector('#cloudEmail')?.value||CLOUD?.user?.email||'').trim().toLowerCase();
  }
  async function sendReset(){
    const m=modal(); const msg=m.querySelector('#resetMessage');
    const email=(m.querySelector('#resetEmail')?.value||getEmailFromUI()).trim().toLowerCase();
    if(!email || !email.includes('@')){msg.textContent='Inserisci una email valida.';return;}
    try{
      msg.textContent='Invio email di recupero…';
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:RESET_REDIRECT()});
      if(error)throw error;
      msg.innerHTML='Email inviata se l\'account esiste. Controlla anche Spam/Promozioni. Dopo aver cliccato il link, torna qui per impostare la nuova password.';
    }catch(e){
      msg.textContent=e.message||'Non sono riuscito a inviare la email di recupero.';
    }
  }
  async function saveNewPassword(){
    const m=modal(); const msg=m.querySelector('#updatePasswordMessage');
    const p1=m.querySelector('#newPassword')?.value||'';
    const p2=m.querySelector('#newPasswordConfirm')?.value||'';
    if(p1.length<8){msg.textContent='La password deve avere almeno 8 caratteri.';return;}
    if(p1!==p2){msg.textContent='Le due password non coincidono.';return;}
    try{
      msg.textContent='Aggiornamento password…';
      const {error}=await supabase.auth.updateUser({password:p1});
      if(error)throw error;
      msg.textContent='Password aggiornata. Puoi accedere con la nuova password.';
      setTimeout(async()=>{try{await supabase.auth.signOut();}catch(e){} close(); showView?.('access','Accesso utenti');},1200);
    }catch(e){
      msg.textContent=e.message||'Non sono riuscito ad aggiornare la password.';
    }
  }
  function bindResetControls(){
    document.querySelectorAll('.nf41-text-link').forEach(btn=>{
      btn.type='button';
      btn.onclick=(e)=>{e.preventDefault();openRequest(getEmailFromUI());};
    });
    const cloudActions=document.querySelector('#cloudAuthModal .modal-actions');
    if(cloudActions && !document.querySelector('#cloudForgotPassword')){
      const b=document.createElement('button');
      b.id='cloudForgotPassword';
      b.className='ghost';
      b.type='button';
      b.textContent='Password dimenticata?';
      b.onclick=()=>openRequest(getEmailFromUI());
      cloudActions.prepend(b);
    }
  }
  function detectRecoveryUrl(){
    const raw=`${window.location.hash||''}&${window.location.search||''}`;
    if(/type=recovery|access_token=|code=/.test(raw) && /recovery|access_token|code/.test(raw)){
      // Supabase emits PASSWORD_RECOVERY when the session from the recovery link is ready.
      setTimeout(openUpdate,500);
    }
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('.nf41-text-link,#cloudForgotPassword,[data-reset-password]');
    if(t){e.preventDefault();openRequest(getEmailFromUI());}
  },true);
  [50,500,1500].forEach(ms=>setTimeout(bindResetControls,ms));
  if(window.supabase?.auth){
    try{supabase.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')openUpdate();});}catch(e){}
  }
  detectRecoveryUrl();
  console.info('NOMYRA Finance V54 loaded: password recovery fixed public redirect.');
})();

/* ===========================
   V56 - Analisi finanziaria period-aware + confronto periodi obbligatorio + upload produttività non bloccante
   =========================== */
(function(){
  const VERSION='V56';
  const sleep=(ms=0)=>new Promise(r=>setTimeout(r,ms));
  const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));

  function periodInfo(label){
    const raw=String(label||'').trim();
    const m=raw.match(/(20\d{2})\D?(0?[1-9]|1[0-2])?/);
    if(!m)return {raw,kind:'unknown',year:null,month:null,monthsElapsed:null,factor:null,label:raw||'Periodo non indicato'};
    const year=Number(m[1]);
    const month=m[2]?Number(m[2]):null;
    if(month)return {raw,kind:'monthly',year,month,monthsElapsed:month,factor:12/month,label:`${String(month).padStart(2,'0')}/${year}`};
    return {raw,kind:'annual',year,month:null,monthsElapsed:12,factor:1,label:String(year)};
  }
  function periodMatchesDate(date,period){
    const info=periodInfo(period); if(!date||!info.year)return true;
    if(date.getFullYear()!==info.year)return false;
    if(info.month&&date.getMonth()+1!==info.month)return false;
    return true;
  }
  function excelDate(v){
    if(typeof v47ExcelDate==='function')return v47ExcelDate(v);
    if(v instanceof Date&&!isNaN(v))return v;
    if(typeof v==='number'&&Number.isFinite(v)){const d=new Date(Math.round((v-25569)*86400*1000));return isNaN(d)?null:d;}
    const s=String(v||'').trim();if(!s)return null;
    let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]));return isNaN(d)?null:d;}
    m=s.match(/^(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return isNaN(d)?null:d;}
    const d=new Date(s);return isNaN(d)?null:d;
  }
  function dateHeader(rows){
    const headers=Object.keys(rows?.[0]||{});
    const finder=typeof v47FindHeader==='function'?v47FindHeader:findHeader;
    return finder(headers,['data','date','giorno','mese','data fattura','data documento','doc date','data doc']);
  }
  function filterRowsByRequestedPeriod(rows,period){
    const h=dateHeader(rows); if(!h)return {rows,filtered:false,dateHeader:null,range:null,multipleYears:false};
    const dated=[]; const years=new Set();
    rows.forEach(r=>{const d=excelDate(r[h]);if(d&&!isNaN(d)){dated.push({r,d});years.add(d.getFullYear());}});
    if(!dated.length)return {rows,filtered:false,dateHeader:h,range:null,multipleYears:false};
    const dates=dated.map(x=>x.d.getTime());
    const range={start:new Date(Math.min(...dates)),end:new Date(Math.max(...dates)),years:[...years].sort()};
    const info=periodInfo(period);
    if(!info.year){
      return {rows,filtered:false,dateHeader:h,range,multipleYears:years.size>1,needsPeriod:years.size>1};
    }
    const selected=dated.filter(x=>periodMatchesDate(x.d,period)).map(x=>x.r);
    if(!selected.length)return {rows:[],filtered:true,dateHeader:h,range,multipleYears:years.size>1,emptyForPeriod:true};
    return {rows:selected,filtered:selected.length!==rows.length,dateHeader:h,range,multipleYears:years.size>1};
  }
  function rangeText(r){
    if(!r)return '';
    const f=d=>`${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    return `${f(r.start)} – ${f(r.end)}`;
  }


  // V57 - Lettura report vendite in Web Worker per evitare blocchi UI durante parsing Excel/CSV.
  function v57ProductivityWorkerScript(){return `
    self.importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
    const findHeader=(headers,patterns)=>{const hs=headers.map(h=>[h,norm(h)]);return (hs.find(([,n])=>patterns.some(p=>n.includes(norm(p))))||[])[0]||'';};
    const parseAmount=v=>{if(v==null||v==='')return null;if(typeof v==='number'&&Number.isFinite(v))return v;let s=String(v).trim();if(!s)return null;s=s.replace(/€/g,'').replace(/\\s/g,'');const neg=/^\\(.*\\)$/.test(s)||/-$/.test(s);s=s.replace(/[()]/g,'').replace(/-$/,'').replace(/[^0-9,.-]/g,'');if(!s)return null;const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');if(lastComma>-1&&lastDot>-1){if(lastComma>lastDot)s=s.replace(/\\./g,'').replace(',', '.');else s=s.replace(/,/g,'');}else if(lastComma>-1){s=s.replace(/\\./g,'').replace(',', '.');}else{s=s.replace(/,/g,'');}const n=Number(s);return Number.isFinite(n)?(neg?-n:n):null;};
    const excelDate=v=>{if(!v&&v!==0)return null;if(v instanceof Date&&!isNaN(v))return v;if(typeof v==='number'&&v>20000){const d=new Date(Math.round((v-25569)*86400*1000));return isNaN(d)?null:d;}const s=String(v).trim();let m=s.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]));return isNaN(d)?null:d;}m=s.match(/^(20\\d{2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{1,2})$/);if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return isNaN(d)?null:d;}m=s.match(/^(\\d{1,2})\\/(20\\d{2})$/);if(m){const d=new Date(Number(m[2]),Number(m[1])-1,1);return isNaN(d)?null:d;}const d=new Date(s);return isNaN(d)?null:d;};
    const periodInfo=p=>{p=String(p||'').trim();let m=p.match(/^(20\\d{2})(?:[-\\/](\\d{1,2}))?/);return {year:m?Number(m[1]):null,month:m&&m[2]?Number(m[2]):null};};
    const periodMatches=(d,p)=>{const i=periodInfo(p);if(!i.year)return true;if(d.getFullYear()!==i.year)return false;if(i.month&&d.getMonth()+1!==i.month)return false;return true;};
    const iso=d=>d&&!isNaN(d)?d.toISOString().slice(0,10):null;
    const monthKey=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):'';
    const periodLabel=dates=>{if(!dates.length)return '';const years=[...new Set(dates.map(d=>d.getFullYear()))].sort();const months=[...new Set(dates.map(monthKey))].sort();if(years.length===1&&months.length>=10)return String(years[0]);if(months.length===1)return months[0];return months[0]+' / '+months[months.length-1];};
    const aggregate=(rows,key,total)=>{const m=new Map();for(const r of rows){const k=String(r[key]||'Non specificato').trim()||'Non specificato';const prev=m.get(k)||{name:k,revenue:0,qty:0,lines:0};prev.revenue+=Number(r.revenue||0);prev.qty+=Number(r.qty||0);prev.lines+=1;m.set(k,prev);}return [...m.values()].map(x=>({...x,avgUnitPrice:x.qty?x.revenue/x.qty:null,share:total?x.revenue/total*100:null})).sort((a,b)=>b.revenue-a.revenue);};
    self.onmessage=e=>{try{
      const {buffer,period,fileName}=e.data; self.postMessage({stage:'parse'});
      const wb=XLSX.read(buffer,{type:'array',cellDates:true,raw:false});
      const ws=wb.Sheets[wb.SheetNames[0]]; if(!ws)throw new Error('EMPTY_SALES');
      let rawRows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
      if(!rawRows.length)throw new Error('EMPTY_SALES');
      const headers=Object.keys(rawRows[0]||{});
      const hDate=findHeader(headers,['data','date','giorno','mese','data fattura','data documento','data doc','doc date']);
      const hCustomer=findHeader(headers,['cliente','customer','ragione sociale','nominativo','clienti','denominazione cliente']);
      const hProductCode=findHeader(headers,['codice articolo','cod articolo','cod art','codice prodotto','codice','sku','articolo']);
      let hProductName=findHeader(headers,['descrizione articolo','desc articolo','descrizione prodotto','descrizione','prodotto','nome prodotto','item description']);
      if(hProductName===hProductCode)hProductName='';
      const hFamily=findHeader(headers,['famiglia','categoria','linea','gruppo','tipo prodotto']);
      const hQty=findHeader(headers,['quantita','quantità','qta','qty','pezzi','unita','unità','pz']);
      const hPrice=findHeader(headers,['prezzo unitario','prezzo','price','unitario','prezzo medio']);
      const hRevenue=findHeader(headers,['fatturato','ricavo','ricavi','totale','importo','valore','imponibile','prezzo totale','totale riga']);
      const allDates=[];const years=new Set();
      if(hDate){for(const r of rawRows){const d=excelDate(r[hDate]);if(d){allDates.push(d);years.add(d.getFullYear());}}}
      const range=allDates.length?{start:iso(new Date(Math.min(...allDates.map(d=>d.getTime())))),end:iso(new Date(Math.max(...allDates.map(d=>d.getTime())))),years:[...years].sort()} : null;
      if(hDate&&years.size>1&&!period){self.postMessage({error:'NEED_PERIOD',range});return;}
      let used=rawRows;
      if(hDate&&period&&periodInfo(period).year){used=rawRows.filter(r=>{const d=excelDate(r[hDate]);return d&&periodMatches(d,period);});}
      if(!used.length){self.postMessage({error:'EMPTY_PERIOD',range});return;}
      self.postMessage({stage:'analyze',rows:used.length,totalRows:rawRows.length});
      const rows=[];const dates=[];const byMonth=new Map();const byFamily=new Map();
      for(const r of used){const qty=parseAmount(r[hQty]);const price=parseAmount(r[hPrice]);let revenue=parseAmount(r[hRevenue]);if((revenue==null||revenue===0)&&qty!=null&&price!=null)revenue=qty*price;if(revenue==null||!Number.isFinite(revenue)||Math.abs(revenue)===0)continue;const d=hDate?excelDate(r[hDate]):null;if(d)dates.push(d);const code=hProductCode?String(r[hProductCode]||'').trim():'';const name=hProductName?String(r[hProductName]||'').trim():'';const product=(name&&code)?(name+' · '+code):(name||code||'Non specificato');const family=hFamily?String(r[hFamily]||'').trim():'';const customer=hCustomer?String(r[hCustomer]||'').trim():'Non specificato';const row={customer,product,qty:qty||0,unitPrice:price,revenue,date:d,family};rows.push(row);if(d){const k=monthKey(d);byMonth.set(k,(byMonth.get(k)||0)+revenue);}if(family)byFamily.set(family,(byFamily.get(family)||0)+revenue);}
      if(!rows.length)throw new Error('NO_REVENUE_COL');
      const totalRevenue=rows.reduce((a,r)=>a+r.revenue,0);const totalQty=rows.reduce((a,r)=>a+(r.qty||0),0);
      const customers=aggregate(rows,'customer',totalRevenue);const products=aggregate(rows,'product',totalRevenue);
      const monthlyRevenue=[...byMonth.entries()].sort().map(([month,revenue])=>({month,revenue}));
      const topFamilies=[...byFamily.entries()].map(([name,revenue])=>({name,revenue,share:totalRevenue?revenue/totalRevenue*100:null})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
      const detectedPeriodLabel=periodLabel(dates)||period||'';const start=dates.length?new Date(Math.min(...dates.map(d=>d.getTime()))):null;const end=dates.length?new Date(Math.max(...dates.map(d=>d.getTime()))):null;
      self.postMessage({metrics:{rowsCount:rows.length,sourceRowsCount:rawRows.length,filteredRowsCount:used.length,periodFilterApplied:used.length!==rawRows.length,requestedPeriod:period,totalRevenue,totalQty,avgUnitPrice:totalQty?totalRevenue/totalQty:null,uniqueCustomers:customers.length,uniqueProducts:products.length,avgRevenuePerCustomer:customers.length?totalRevenue/customers.length:null,topCustomerShare:customers[0]?customers[0].share:null,topProductShare:products[0]?products[0].share:null,topCustomers:customers.slice(0,10),topProducts:products.slice(0,10),monthlyRevenue,topFamilies,detectedPeriodLabel,detectedStartDate:iso(start),detectedEndDate:iso(end),detectedYear:(new Set(dates.map(d=>d.getFullYear()))).size===1?String(dates[0]?.getFullYear()||''):'',sourcePeriodLabel:range?(range.start?.slice(5,7)+'/'+range.start?.slice(0,4)+' – '+range.end?.slice(5,7)+'/'+range.end?.slice(0,4)):'',sourceYears:range?.years||[],headers:{customer:hCustomer,productCode:hProductCode,productName:hProductName,product:hProductName||hProductCode,quantity:hQty,price:hPrice,revenue:hRevenue,date:hDate,family:hFamily}}});
    }catch(err){self.postMessage({error:err.message||'WORKER_ERROR'});}};
  `;}
  function v57ReadAndAnalyzeSalesFile(file,period,onProgress){
    return new Promise(async (resolve,reject)=>{
      if(!window.Worker){try{onProgress?.('Lettura file in modalità compatibile…');const rows=await readSalesFile(file);const metrics=analyzeSalesRows(rows);resolve({metrics});}catch(e){reject(e);}return;}
      let worker,url;
      try{
        url=URL.createObjectURL(new Blob([v57ProductivityWorkerScript()],{type:'application/javascript'}));
        worker=new Worker(url);
        const timer=setTimeout(()=>{try{worker.terminate();}catch(e){} reject(new Error('WORKER_TIMEOUT'));},120000);
        worker.onmessage=ev=>{const d=ev.data||{}; if(d.stage==='parse')onProgress?.('Lettura Excel in corso…'); if(d.stage==='analyze')onProgress?.(`Calcolo ${d.rows||''} righe vendite…`); if(d.error){clearTimeout(timer);try{worker.terminate();}catch(e){};reject(new Error(d.error));} if(d.metrics){clearTimeout(timer);try{worker.terminate();}catch(e){};resolve({metrics:d.metrics});}};
        worker.onerror=err=>{clearTimeout(timer);try{worker.terminate();}catch(e){};reject(new Error(err.message||'WORKER_ERROR'));};
        const buffer=await file.arrayBuffer();
        worker.postMessage({buffer,period,fileName:file.name},[buffer]);
      }catch(e){try{worker&&worker.terminate();}catch(_){} reject(e);}finally{setTimeout(()=>{if(url)URL.revokeObjectURL(url);},5000);}
    });
  }

  async function v56ProductivityUpload(){
    const btn=document.querySelector('#analyzeProductivity');
    const status=document.querySelector('#productivityStatus');
    const company=(document.querySelector('#prodCompany')?.value||state.selectedCompany||'').trim();
    let period=(document.querySelector('#prodPeriod')?.value||state.selectedPeriod||'').trim();
    const file=document.querySelector('#prodFile')?.files?.[0];
    if(!company||!file){status.className='provider-result empty-state';status.textContent='Seleziona azienda e file Excel/CSV. Se il file contiene più periodi, indica anche il periodo da analizzare, ad esempio 2025 o 2026-06.';return;}
    const oldText=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Analisi in corso…';}
      status.className='provider-result';
      status.innerHTML='<strong>Analisi report vendite…</strong><small>La lettura viene eseguita in background, la pagina non deve bloccarsi.</small>';
      await nextFrame();
      const {metrics}=await v57ReadAndAnalyzeSalesFile(file,period,msg=>{if(status){status.className='provider-result';status.innerHTML=`<strong>${esc(msg)}</strong><small>Puoi continuare a usare la piattaforma: NOMYRA sta elaborando il file in background.</small>`;}});
      if(String(metrics?.error||'')==='NEED_PERIOD')throw new Error('NEED_PERIOD');
      if(!period){period=metrics.detectedYear||metrics.requestedPeriod||metrics.detectedPeriodLabel||String(new Date().getFullYear());}
      if(metrics.sourceYears?.length>1 && !metrics.periodFilterApplied && period){
        // Safety: this case should not occur in worker filtering, but prevents mixed-period persistence.
        throw new Error('NEED_PERIOD');
      }
      const record={id:'s'+Date.now(),company,period,fileName:file.name,createdAt:new Date().toISOString(),metrics,detected_start_date:metrics.detectedStartDate,detected_end_date:metrics.detectedEndDate,detected_period_label:metrics.detectedPeriodLabel||period};
      state.productivity=state.productivity.filter(x=>!(profileKey(x.company)===profileKey(company)&&String(x.period)===String(period)));
      state.productivity.push(record);state.selectedCompany=company;state.selectedPeriod=period;
      saveLocalOnly();
      setTimeout(()=>cloudSaveProductivity(record,file).catch(console.warn),120);
      populateFilters();
      renderProductivity();
      try{renderHome();renderReport();}catch(e){console.warn('Aggiornamento sezioni non critico',e);}
      status.className='provider-result v49-compact-status';
      status.innerHTML=`<strong>Report vendite caricato.</strong><small>${num(metrics.rowsCount)} righe analizzate${metrics.filteredRowsCount&&metrics.sourceRowsCount&&metrics.filteredRowsCount!==metrics.sourceRowsCount?` su ${num(metrics.sourceRowsCount)} totali`:''} · ${num(metrics.uniqueCustomers)} clienti · ${num(metrics.uniqueProducts)} prodotti · ${fmt(metrics.totalRevenue)}. ${metrics.periodFilterApplied?`Periodo usato: ${esc(period)}.`:''}</small>`;
    }catch(err){
      console.error(err);
      status.className='provider-result empty-state';
      const msg=err.message||'';
      status.innerHTML= msg==='NEED_PERIOD'
        ? '<strong>Il file contiene più anni.</strong><small>Inserisci il periodo da analizzare, per esempio 2025, e clicca di nuovo “Analizza vendite”.</small>'
        : msg==='EMPTY_PERIOD'
        ? `<strong>Nessuna riga trovata per il periodo ${esc(period)}.</strong><small>Controlla il periodo selezionato oppure carica un file filtrato.</small>`
        : msg==='XLSX_MISSING'
        ? 'Impossibile caricare il lettore Excel dal CDN. Riprovare online o usare CSV.'
        : msg==='NO_REVENUE_COL'
        ? 'Non ho trovato una colonna fatturato/importo/totale né quantità × prezzo. Controlla le intestazioni del file.'
        : msg==='WORKER_TIMEOUT'
        ? 'Il file è troppo pesante o il browser ha interrotto l’elaborazione. Prova con un file filtrato per anno oppure in formato CSV.'
        : 'Non è stato possibile leggere il file vendite.';
    }finally{
      if(btn){btn.disabled=false;btn.textContent=oldText||'Analizza vendite';}
    }
  }

  // Bypass older upload listeners that rendered every section and could make the page appear blocked.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#analyzeProductivity');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    v56ProductivityUpload();
  },true);

  // Two-balance comparison must always have two explicit periods.
  const compareBtn=document.querySelector('#analyzeComparison');
  if(compareBtn){
    const oldCompare=compareBtn.onclick;
    compareBtn.onclick=async function(e){
      const global=document.querySelector('#compareGlobalStatus');
      const mode=typeof compareMode!=='undefined'?compareMode:'periods';
      const pA=(document.querySelector('#comparePeriodA')?.value||'').trim();
      const pB=(document.querySelector('#comparePeriodB')?.value||'').trim();
      if(!pA||!pB){global.textContent='Per confrontare due bilanci devi indicare due periodi: periodo A e periodo B.';return;}
      if(mode==='periods'&&pA===pB){global.textContent='Il confronto periodi richiede due periodi diversi, ad esempio 2025 e 2026-06.';return;}
      compareBtn.disabled=true;const label=compareBtn.textContent;compareBtn.textContent='Analisi confronto…';
      try{await oldCompare?.call(this,e);}finally{compareBtn.disabled=false;compareBtn.textContent=label||'Analizza e confronta';}
    };
  }
  const oldOpenCompare=typeof openCompare==='function'?openCompare:null;
  if(oldOpenCompare){
    openCompare=function(mode){
      oldOpenCompare(mode);
      const global=document.querySelector('#compareGlobalStatus');
      if(global)global.innerHTML='<strong>Nota:</strong> per il confronto servono due bilanci con due periodi espliciti. NOMYRA analizzerà ogni PDF separatamente e confronterà solo le voci presenti in entrambi.';
      const pa=document.querySelector('#comparePeriodA'),pb=document.querySelector('#comparePeriodB');
      if(pa)pa.placeholder='Es. 2025 oppure 2026-06';
      if(pb)pb.placeholder='Es. 2026 oppure 2026-09';
    };
  }

  function forecastValue(value,info){
    if(value==null||!Number.isFinite(Number(value))||!info.factor||info.factor===1)return null;
    return Number(value)*info.factor;
  }
  function ensureFinancialFlowPanel(){
    let el=document.querySelector('#v56FinancialFlow');
    if(el)return el;
    const hero=document.querySelector('#overview .hero-card');
    if(!hero)return null;
    el=document.createElement('div');el.id='v56FinancialFlow';el.className='panel v56-financial-flow';
    hero.insertAdjacentElement('afterend',el);
    return el;
  }
  function renderFinancialFlow(){
    const el=ensureFinancialFlowPanel(); if(!el)return;
    const d=currentDoc(),p=previousDoc(d);
    if(!d){el.innerHTML='<div class="empty-state">Carica un bilancio per ottenere analisi periodo, confronto e previsione.</div>';return;}
    const info=periodInfo(d.period); const x=d.data||{},dv=derived(d); const cov=dataCoverage(d);
    const revFc=forecastValue(x.revenue,info), ebitdaFc=forecastValue(x.ebitda,info), ebitFc=forecastValue(x.ebit,info);
    const rv=p?variation(x.revenue,p.data?.revenue):null, ev=p?variation(x.ebitda,p.data?.ebitda):null;
    const missing=(cov.missing||[]).slice(0,4).map(k=>metricNames[k]||k).join(', ');
    el.innerHTML=`<div class="v56-flow-head"><div><span class="section-label">ANALISI FINANZIARIA GUIDATA</span><h3>Periodo, confronto e previsione</h3></div><button class="mini-btn" data-v56-open-review>Completa dati</button></div>
      <div class="v56-flow-grid">
        <div class="v56-flow-card"><small>Periodo letto</small><strong>${esc(info.label)}</strong><span>${info.kind==='monthly'?`Bilancio progressivo: ${info.monthsElapsed}/12 mesi`:'Periodo annuale o non progressivo'}</span></div>
        <div class="v56-flow-card"><small>Confronto precedente</small><strong>${p?esc(p.period):'Manca il periodo precedente'}</strong><span>${p?`Ricavi ${rv==null?'—':(rv>=0?'+':'')+rv.toFixed(1)+'%'} · EBITDA ${ev==null?'—':(ev>=0?'+':'')+ev.toFixed(1)+'%'}`:'Carica il primo bilancio precedente per leggere l’andamento.'}</span></div>
        <div class="v56-flow-card"><small>Previsione a fine periodo</small><strong>${revFc==null?'Non applicabile':fmt(revFc)}</strong><span>${revFc==null?'Serve un periodo mensile/progressivo, es. 2026-06.':`EBITDA stimato ${fmt(ebitdaFc)} · EBIT stimato ${fmt(ebitFc)}`}</span></div>
        <div class="v56-flow-card ${cov.missing?.length?'warn':'ok'}"><small>Affidabilità dati</small><strong>${esc(cov.label)}</strong><span>${cov.missing?.length?`Da completare: ${esc(missing)}${cov.missing.length>4?'…':''}`:'Voci principali disponibili.'}</span></div>
      </div>
      <p class="v56-flow-reading">${p?'NOMYRA confronta questo bilancio con il periodo precedente disponibile della stessa azienda.':'Per ottenere l’analisi dell’andamento devi caricare almeno due bilanci della stessa azienda con periodi diversi.'} La previsione è una stima lineare: serve per orientarsi, non sostituisce budget, stagionalità o piano industriale.</p>`;
    el.querySelector('[data-v56-open-review]')?.addEventListener('click',()=>{const doc=currentDoc();if(doc)openReview(doc.id);});
  }
  const oldRenderOverview=renderOverview;
  renderOverview=function(){oldRenderOverview();renderFinancialFlow();};

  const style=document.createElement('style');
  style.textContent=`
    .v56-financial-flow{margin:18px 0}.v56-flow-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}.v56-flow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.v56-flow-card{border:1px solid #d9e4e1;border-radius:18px;padding:16px;background:#fff}.v56-flow-card small{display:block;text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#6b7b84;font-weight:900}.v56-flow-card strong{display:block;font-size:22px;margin:6px 0;color:#0b1b33}.v56-flow-card span{color:#64737d;font-size:13px}.v56-flow-card.warn{background:#fff7ec;border-color:#ecd2aa}.v56-flow-card.ok{background:#effaf5;border-color:#cfe8dc}.v56-flow-reading{margin:12px 0 0;color:#52636d;line-height:1.55}.productivity-form .primary[disabled],#analyzeComparison[disabled]{opacity:.72;cursor:wait}@media(max-width:1100px){.v56-flow-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:680px){.v56-flow-grid{grid-template-columns:1fr}.v56-flow-head{align-items:flex-start;flex-direction:column;}}
  `;
  document.head.appendChild(style);
  setTimeout(()=>{try{if(document.querySelector('#overview.view.active'))renderFinancialFlow();}catch(e){}},350);
  console.info('NOMYRA Finance V57 loaded: worker-based productivity upload, no MutationObserver loop, safer period filtering.');
})();

/* ===========================
   V58 - Analisi finanziaria guidata, periodi Da/A, Consigli e Ask NOMYRA migliorato
   =========================== */
(function(){
  const VERSION='58';
  const day=24*60*60*1000;
  const qs=s=>document.querySelector(s);
  const qsa=s=>[...document.querySelectorAll(s)];
  const toISO=d=>d instanceof Date&&!isNaN(d)?d.toISOString().slice(0,10):'';
  const fmtDate=d=>{if(!(d instanceof Date)||isNaN(d))return '';return d.toLocaleDateString('it-IT');};
  const parseDateLocal=v=>{if(!v)return null;if(v instanceof Date&&!isNaN(v))return v;const s=String(v).trim();let m=s.match(/^(20\d{2})-(\d{2})-(\d{2})$/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2}|\d{2})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return new Date(y,Number(m[2])-1,Number(m[1]));}return null;};
  function inferRangeFromPeriod(period){
    const raw=String(period||'').trim();
    let m=raw.match(/^(20\d{2})[-_/]?(0?[1-9]|1[0-2])$/);
    if(m){const y=Number(m[1]),mo=Number(m[2]);return {start:new Date(y,0,1),end:new Date(y,mo,0),kind:'progressive',months:mo,label:`01/01/${y} – ${String(new Date(y,mo,0).getDate()).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${y}`};}
    m=raw.match(/^(20\d{2})$/);
    if(m){const y=Number(m[1]);return {start:new Date(y,0,1),end:new Date(y,11,31),kind:'annual',months:12,label:`01/01/${y} – 31/12/${y}`};}
    return {start:null,end:null,kind:'unknown',months:null,label:raw||'Periodo non indicato'};
  }
  function getDocRange(doc){
    const s=parseDateLocal(doc?.periodStart||doc?.period_start||doc?.startDate||doc?.dateFrom);
    const e=parseDateLocal(doc?.periodEnd||doc?.period_end||doc?.endDate||doc?.dateTo);
    if(s&&e)return {start:s,end:e,kind:'explicit',months:Math.max(1,(e.getFullYear()-s.getFullYear())*12+e.getMonth()-s.getMonth()+1),label:`${fmtDate(s)} – ${fmtDate(e)}`};
    return inferRangeFromPeriod(doc?.period);
  }
  function rangeFromFields(prefix){
    const s=parseDateLocal(qs(`#${prefix}StartDate`)?.value||'');
    const e=parseDateLocal(qs(`#${prefix}EndDate`)?.value||'');
    return {start:s,end:e,ok:!!(s&&e&&s<=e),label:s&&e?`${fmtDate(s)} – ${fmtDate(e)}`:''};
  }
  function addPeriodFields(){
    const uploadPeriod=qs('#uploadPeriod');
    if(uploadPeriod&&!qs('#uploadStartDate')){
      const wrapper=document.createElement('div');
      wrapper.className='v58-period-box';
      wrapper.innerHTML=`<div class="v58-period-title"><strong>Periodo coperto dal bilancio</strong><span>Obbligatorio per confronti corretti, previsioni e rimanenze iniziali.</span></div><div class="v58-period-grid"><label>Da<input id="uploadStartDate" type="date"></label><label>A<input id="uploadEndDate" type="date"></label></div><small id="uploadPeriodHint">Esempio: bilancio 2026-06 = da 01/01/2026 a 30/06/2026.</small>`;
      uploadPeriod.closest('label')?.insertAdjacentElement('afterend',wrapper);
      uploadPeriod.addEventListener('input',()=>{const r=inferRangeFromPeriod(uploadPeriod.value);if(r.start&&!qs('#uploadStartDate').value)qs('#uploadStartDate').value=toISO(r.start);if(r.end&&!qs('#uploadEndDate').value)qs('#uploadEndDate').value=toISO(r.end);});
    }
    [['compareA','comparePeriodA'],['compareB','comparePeriodB']].forEach(([prefix,id])=>{
      const inp=qs('#'+id);
      if(inp&&!qs(`#${prefix}StartDate`)){
        const box=document.createElement('div');box.className='v58-compare-dates';
        box.innerHTML=`<label>Da<input id="${prefix}StartDate" type="date"></label><label>A<input id="${prefix}EndDate" type="date"></label>`;
        inp.closest('label')?.insertAdjacentElement('afterend',box);
        inp.addEventListener('input',()=>{const r=inferRangeFromPeriod(inp.value);if(r.start&&!qs(`#${prefix}StartDate`).value)qs(`#${prefix}StartDate`).value=toISO(r.start);if(r.end&&!qs(`#${prefix}EndDate`).value)qs(`#${prefix}EndDate`).value=toISO(r.end);});
      }
    });
  }
  addPeriodFields();
  const oldOpenUpload=qs('#openUpload')?.onclick;
  ['#openUpload','#openUpload2','#homeSingleUpload'].forEach(sel=>{const b=qs(sel);if(b){const old=b.onclick;b.onclick=function(e){old?.call(this,e);setTimeout(addPeriodFields,30);};}});

  function enhanceDocPeriod(doc,prefix='upload'){
    const r=rangeFromFields(prefix);
    if(!r.ok)return {ok:false,message:'Indica sempre il periodo coperto dal bilancio: data inizio e data fine.'};
    doc.periodStart=toISO(r.start);doc.periodEnd=toISO(r.end);doc.periodLabel=r.label;doc.periodMonths=Math.max(1,(r.end.getFullYear()-r.start.getFullYear())*12+r.end.getMonth()-r.start.getMonth()+1);
    if(!doc.period||String(doc.period).trim()==='')doc.period=doc.periodEnd.slice(0,7);
    return {ok:true,range:r};
  }

  const oldAnalyzePdfBtn=qs('#analyzePdf');
  if(oldAnalyzePdfBtn){
    oldAnalyzePdfBtn.onclick=async()=>{
      addPeriodFields();
      const file=qs('#pdfFile')?.files?.[0],company=qs('#uploadCompany')?.value.trim(),period=qs('#uploadPeriod')?.value.trim(),st=qs('#parseStatus');
      const r=rangeFromFields('upload');
      if(!file||!company||!period||!r.ok){if(st)st.textContent='Inserisci azienda, periodo, data Da/A e seleziona un PDF.';return;}
      try{
        st.textContent='1/3 · Lettura struttura PDF…';const lines=await pdfLines(file);if(lines.length<5)throw new Error('NO_TEXT');
        st.textContent='2/3 · Riconoscimento e normalizzazione delle voci contabili…';const requested=qs('#uploadType')?.value;const result=analyzeLines(lines,{documentType:requested});
        st.textContent='3/3 · Calcolo indicatori, controlli e periodo…';const uploadProfile=getUploadProfile();if(profileHasData(uploadProfile))setCompanyProfile(company,uploadProfile);
        const doc={id:'u'+Date.now(),company,period,name:file.name,type:result.type,quality:result.quality,data:result.data,sources:result.sources,candidates:result.candidates,validations:result.validations,recognized:result.recognized,engineVersion:ENGINE_VERSION,parser:result.parser,profile:getCompanyProfile(company)};
        const ok=enhanceDocPeriod(doc,'upload');if(!ok.ok){st.textContent=ok.message;return;}
        applyPreviousOpeningHints(doc);
        state.docs=state.docs.filter(x=>!(x.company===company&&x.period===period));state.docs.push(doc);state.selectedCompany=company;state.selectedPeriod=period;save();cloudSaveDocument(doc,file).catch(console.warn);
        const cp=completeness(doc);st.textContent=`Completato: ${cp.found}/${cp.total} voci chiave riconosciute. Periodo: ${doc.periodLabel}.`;
        setTimeout(()=>{qs('#cancelUpload')?.click();renderAll();showView('overview','Analisi bilancio');openReview(doc.id);},650);
      }catch(err){console.error(err);st.textContent=err.message==='NO_TEXT'?'Il PDF sembra scansionato o privo di testo selezionabile. Nessun valore viene inventato.':'Errore durante la lettura del PDF. Il documento non è stato importato.';}
    };
  }

  function sameDuration(a,b){const da=Math.round((a.end-a.start)/day)+1,db=Math.round((b.end-b.start)/day)+1;return Math.abs(da-db)<=3;}
  function sameExactRange(a,b){return toISO(a.start)===toISO(b.start)&&toISO(a.end)===toISO(b.end);}
  const baseAnalyzeFileToDoc=typeof analyzeFileToDoc==='function'?analyzeFileToDoc:null;
  if(baseAnalyzeFileToDoc){
    analyzeFileToDoc=async function(file,company,period,statusEl,suffix){
      const doc=await baseAnalyzeFileToDoc(file,company,period,statusEl,suffix);
      const prefix=suffix==='a'?'compareA':'compareB';
      const r=rangeFromFields(prefix); if(r.ok){doc.periodStart=toISO(r.start);doc.periodEnd=toISO(r.end);doc.periodLabel=r.label;doc.periodMonths=Math.max(1,(r.end.getFullYear()-r.start.getFullYear())*12+r.end.getMonth()-r.start.getMonth()+1);}else{const inf=inferRangeFromPeriod(period);if(inf.start&&inf.end){doc.periodStart=toISO(inf.start);doc.periodEnd=toISO(inf.end);doc.periodLabel=inf.label;doc.periodMonths=inf.months;}}
      applyPreviousOpeningHints(doc);
      return doc;
    };
  }
  const compBtn=qs('#analyzeComparison');
  if(compBtn){
    const prior=compBtn.onclick;
    compBtn.onclick=async function(e){
      addPeriodFields();
      const global=qs('#compareGlobalStatus');
      const a=rangeFromFields('compareA'),b=rangeFromFields('compareB');
      const pA=(qs('#comparePeriodA')?.value||'').trim(),pB=(qs('#comparePeriodB')?.value||'').trim();
      if(!pA||!pB||!a.ok||!b.ok){if(global)global.textContent='Per confrontare due bilanci devi indicare per entrambi: periodo, data Da e data A.';return;}
      const mode=typeof compareMode!=='undefined'?compareMode:'periods';
      if(mode==='companies'&&!sameExactRange(a,b)){global.textContent='Benchmark aziende: i due bilanci devono coprire esattamente lo stesso periodo, per esempio 01/01/2025 – 31/12/2025.';return;}
      if(mode==='periods'&&!sameDuration(a,b)){global.textContent='Confronto periodi: i due bilanci devono avere la stessa durata. Non confrontare un anno intero con un semestre.';return;}
      await prior?.call(this,e);
    };
  }

  function applyPreviousOpeningHints(doc){
    const prev=previousDoc(doc)||companyDocs(doc.company).filter(x=>x.id!==doc.id).sort((a,b)=>String(a.period).localeCompare(String(b.period))).at(-1);
    if(!doc||!prev)return;
    if(doc.data?.openingInventoryChange==null && prev.data?.inventory!=null){
      doc.candidates=doc.candidates||{};
      doc.candidates.openingInventoryFromPrevious=[{value:prev.data.inventory,page:'periodo precedente',line:`Rimanenze finali ${prev.period}: ${fmt(prev.data.inventory)}`}];
      doc.validations=doc.validations||[];
      if(!doc.validations.some(v=>v.code==='OPENING_INVENTORY_FROM_PREVIOUS'))doc.validations.push({ok:false,code:'OPENING_INVENTORY_FROM_PREVIOUS',message:`Puoi usare le rimanenze finali del periodo precedente (${prev.period}) come dato iniziale da verificare.`});
    }
  }

  function adviceForDoc(doc=currentDoc()){
    if(!doc)return [];
    const p=previousDoc(doc),x=doc.data||{},z=derived(doc),cov=dataCoverage(doc),adv=[];
    const add=(type,title,text,action='Apri verifica dati',view='overview')=>adv.push({type,title,text,action,view});
    if(cov.missing?.length)add('Da completare','Completa le voci mancanti',`Mancano ${cov.missing.length} voci chiave. Completa solo i valori presenti nel bilancio: NOMYRA ricalcola automaticamente i KPI.`, 'Completa dati','review');
    if(x.ebitda!=null&&x.ebitda<0)add('Rosso','MOL/EBITDA negativo',`I costi operativi monetari superano il valore prodotto. Verifica rimanenze, materie, servizi, personale e oneri diversi: sono le prime leve da controllare.`, 'Vedi EBITDA','overview');
    if(x.ebit!=null&&x.ebit<0)add('Rosso','EBIT negativo',`Dopo ammortamenti il risultato operativo è ${fmt(x.ebit)}. Controlla se gli ammortamenti sono sostenibili rispetto a ricavi e margine operativo.`, 'Vedi EBIT','overview');
    if(z.ebitdaMargin!=null&&z.ebitdaMargin<5)add('Margine','Marginalità operativa bassa',`Ogni 100 € di ricavi restano ${pct(z.ebitdaMargin)} di MOL. Serve valutare prezzi, mix prodotti, costi variabili e produttività.`, 'Apri Produttività','productivity');
    if(z.materialsInc!=null&&z.materialsInc>45)add('Costo','Materie prime pesanti',`Materie/acquisti pesano ${pct(z.materialsInc)} sui ricavi. Verifica listini di acquisto, scarti, prezzi vendita e mix prodotto.`, 'Analizza vendite','productivity');
    if(z.servicesInc!=null&&z.servicesInc>25)add('Costo','Servizi esterni elevati',`Servizi/Ricavi è ${pct(z.servicesInc)}. Separare energia, trasporti, manutenzioni e consulenze aiuta a capire dove intervenire.`, 'Verifica costi','overview');
    if(z.personnelInc!=null&&z.personnelInc>25)add('Costo','Personale da monitorare',`Personale/Ricavi è ${pct(z.personnelInc)}. Confronta ore, produzione, stagionalità e ricavi per addetto.`, 'Apri Produttività','productivity');
    if(z.currentRatio!=null&&z.currentRatio<1)add('Liquidità','Liquidità corrente debole',`Current ratio ${ratio(z.currentRatio)}: le attività correnti non coprono il passivo circolante. Verifica incassi, debiti a breve e magazzino.`, 'Vedi patrimoniale','overview');
    if(z.debtEbitda!=null&&z.debtEbitda>4)add('Debito','Debiti pesanti rispetto al MOL',`Debiti/EBITDA ${ratio(z.debtEbitda)}: l’indebitamento è alto rispetto alla marginalità operativa.`, 'Vedi debiti','overview');
    if(p){const rv=variation(x.revenue,p.data?.revenue),ev=variation(x.ebitda,p.data?.ebitda);if(rv!=null&&ev!=null&&rv>0&&ev<0)add('Andamento','Ricavi in crescita ma margine in calo',`I ricavi crescono del ${rv.toFixed(1)}%, ma l’EBITDA cala del ${Math.abs(ev).toFixed(1)}%. Questo indica aumento costi, prezzi insufficienti o mix meno redditizio.`, 'Apri confronto','comparison');}
    const pr=state.productivity.find(r=>profileKey(r.company)===profileKey(doc.company)&&String(r.period)===String(doc.period));
    if(!pr)add('Dati commerciali','Carica vendite e prodotti',`Per capire se prezzi e costi sono coerenti, carica il report vendite dello stesso periodo. NOMYRA confronterà fatturato Excel, ricavi di bilancio, quantità e prezzo medio.`, 'Apri Produttività','productivity');
    return adv.slice(0,12);
  }
  function renderRecommendations(){
    const section=qs('#recommendations'); if(!section)return;
    const d=currentDoc(),a=adviceForDoc(d),r=d?getDocRange(d):null;
    section.innerHTML=`<div class="section-intro"><div><p class="eyebrow">CONSIGLI NOMYRA</p><h2>Azioni e verifiche consigliate</h2><p>${d?`Analisi per ${esc(d.company)} · ${esc(d.period)}${r?.label?` · ${esc(r.label)}`:''}.`:'Carica un bilancio per generare consigli.'}</p></div><button class="primary" data-nav="overview">Apri analisi</button></div>${!d?'<div class="panel empty-state">Nessun bilancio selezionato.</div>':`<div class="advice-grid">${a.map((x,i)=>`<article class="advice-card ${x.type==='Rosso'?'critical':x.type==='Costo'||x.type==='Debito'?'warning':''}"><span>${esc(x.type)}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><button class="mini-btn" data-advice-action="${esc(x.view)}">${esc(x.action)}</button></article>`).join('')||'<div class="panel">Nessun alert rilevante. Continua a monitorare margini, liquidità e andamento rispetto al periodo precedente.</div>'}</div>`}`;
    section.querySelectorAll('[data-advice-action]').forEach(b=>b.onclick=()=>{const v=b.dataset.adviceAction;if(v==='review'){const doc=currentDoc();if(doc)openReview(doc.id);return;}if(v==='comparison')showView('comparison','Confronto');else showView(v||'overview',v==='productivity'?'Produttività':'Analisi bilancio');});
  }
  function ensureRecommendationsView(){
    if(!qs('#recommendations')){const sec=document.createElement('section');sec.id='recommendations';sec.className='view';qs('main')?.appendChild(sec);}
    if(!qs('.nav-item[data-view="recommendations"]')){const btn=document.createElement('button');btn.className='nav-item';btn.dataset.view='recommendations';btn.innerHTML='<span>◆</span> Consigli';qs('.nav-item[data-view="analysis"]')?.insertAdjacentElement('beforebegin',btn);btn.onclick=()=>showView('recommendations','Consigli');}
  }
  ensureRecommendationsView();
  const priorShow=showView;
  showView=function(view,title=null){
    if(view==='recommendations'){
      qsa('main > section.view').forEach(s=>{const act=s.id==='recommendations';s.classList.toggle('active',act);s.style.display=act?'block':'none';s.setAttribute('aria-hidden',act?'false':'true');});
      qsa('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view==='recommendations'));
      qs('#pageTitle').textContent=title||'Consigli';window.__nomyraCurrentView='recommendations';try{localStorage.setItem('nomyra-finance-active-view-v52','recommendations');}catch(e){}renderRecommendations();return;
    }
    priorShow(view,title);
  };
  document.addEventListener('click',e=>{const nav=e.target.closest?.('[data-nav="recommendations"], .nav-item[data-view="recommendations"]');if(nav){e.preventDefault();e.stopPropagation();showView('recommendations','Consigli');}},true);

  const oldRenderOverview=renderOverview;
  renderOverview=function(){oldRenderOverview();injectAdviceSummary();};
  function injectAdviceSummary(){
    const d=currentDoc();let box=qs('#v58AdviceSummary');if(!d)return;const hero=qs('#overview .hero-card')||qs('#v56FinancialFlow')||qs('#kpiGrid')?.parentElement;if(!box){box=document.createElement('div');box.id='v58AdviceSummary';box.className='panel v58-advice-summary';(qs('#v56FinancialFlow')||hero)?.insertAdjacentElement('afterend',box);}const a=adviceForDoc(d).slice(0,3);box.innerHTML=`<div class="panel-head"><div><span class="section-label">DA VERIFICARE</span><h3>Consigli principali</h3></div><button class="mini-btn" data-nav="recommendations">Vedi tutti</button></div><div class="v58-advice-list">${a.map(x=>`<div class="v58-advice-chip ${x.type==='Rosso'?'critical':''}"><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></div>`).join('')||'<div class="empty-state">Nessun consiglio critico rilevato.</div>'}</div>`;box.querySelector('[data-nav="recommendations"]').onclick=()=>showView('recommendations','Consigli');}

  const oldAnswer=answerQuestion;
  answerQuestion=function(q){
    const s=String(q||'').toLowerCase(),d=currentDoc(),p=d?previousDoc(d):null,x=d?.data||{},z=d?derived(d):{};
    const defs={
      ebitda:'EBITDA/MOL indica il margine operativo prima di ammortamenti, gestione finanziaria e imposte. Serve a capire se l’attività ordinaria genera margine monetario.',
      mol:'MOL è il margine operativo lordo: valore della produzione meno costi operativi monetari.',
      ebit:'EBIT è il risultato operativo dopo gli ammortamenti. Se è negativo, la gestione industriale non copre completamente struttura e ammortamenti.',
      roe:'ROE misura il rendimento del patrimonio netto: utile netto diviso patrimonio netto.',
      'current ratio':'Current ratio = attivo circolante / passivo circolante. Sotto 1 indica possibile tensione di liquidità.',
      rimanenze:'Le rimanenze finali di un periodo diventano la base iniziale del periodo successivo. Per questo NOMYRA chiede bilanci con data Da/A e usa il periodo precedente come riferimento.'
    };
    for(const [k,v] of Object.entries(defs)){if(s.includes('cosa significa')&&s.includes(k)||s.includes('che significa')&&s.includes(k)||s.includes(k+'?'))return v;}
    if(s.includes('consigli')||s.includes('cosa devo fare')||s.includes('azioni')||s.includes('migliorare')){if(!d)return 'Carica un bilancio per generare consigli specifici.';const a=adviceForDoc(d).slice(0,5);return a.length?`Azioni consigliate per ${d.company} ${d.period}: `+a.map((x,i)=>`${i+1}) ${x.title}: ${x.text}`).join(' '):'Non vedo criticità principali. Continua a confrontare margini, liquidità e costi con il periodo precedente.';}
    if(s.includes('rosso')||s.includes('negativ')||s.includes('alert')){if(!d)return 'Carica un bilancio prima di leggere gli alert.';const a=adviceForDoc(d).filter(x=>['Rosso','Costo','Debito','Liquidità'].includes(x.type)).slice(0,6);return a.length?a.map(x=>`${x.title}: ${x.text}`).join(' '):'Non risultano alert rossi con i dati attuali. Verifica comunque le voci mancanti.';}
    if(s.includes('previs')||s.includes('fine periodo')||s.includes('come finir')){if(!d)return 'Carica un bilancio con periodo Da/A per calcolare una previsione.';const r=getDocRange(d);if(!r.months||r.months>=12)return 'La previsione lineare è utile solo per bilanci progressivi infrannuali, per esempio da gennaio a giugno.';const f=12/r.months;return `Proiezione lineare su 12 mesi basata su ${r.label}: ricavi stimati ${fmt((x.revenue||0)*f)}, EBITDA stimato ${fmt((x.ebitda||0)*f)}, EBIT stimato ${fmt((x.ebit||0)*f)}. È una stima semplice: va corretta per stagionalità e andamento ordini.`;}
    if(s.includes('confront')||s.includes('periodo precedente')||s.includes('andamento')){if(!d)return 'Carica un bilancio.';if(!p)return 'Serve il bilancio del periodo precedente della stessa azienda e della stessa durata per leggere l’andamento.';const rv=variation(x.revenue,p.data?.revenue),ev=variation(x.ebitda,p.data?.ebitda),iv=variation(x.ebit,p.data?.ebit);return `Confronto ${p.period} → ${d.period}: ricavi ${rv==null?'—':(rv>=0?'+':'')+rv.toFixed(1)+'%'}, EBITDA ${ev==null?'—':(ev>=0?'+':'')+ev.toFixed(1)+'%'}, EBIT ${iv==null?'—':(iv>=0?'+':'')+iv.toFixed(1)+'%'}.`;
    }
    return oldAnswer(q);
  };
  const oldRenderChatIntro=renderChatIntro;
  renderChatIntro=function(){oldRenderChatIntro();const sug=qs('.suggestions');if(sug&&!sug.querySelector('[data-v58-advice-q]')){sug.insertAdjacentHTML('beforeend','<button class="suggestion" data-v58-advice-q>Quali sono i numeri rossi e cosa devo verificare?</button><button class="suggestion" data-v58-forecast-q>Come finirà il periodo se continua così?</button>');sug.querySelector('[data-v58-advice-q]').onclick=()=>{qs('#chatInput').value='Quali sono i numeri rossi e cosa devo verificare?';qs('#sendQuestion').click();};sug.querySelector('[data-v58-forecast-q]').onclick=()=>{qs('#chatInput').value='Come finirà il periodo se continua così?';qs('#sendQuestion').click();};}}

  const oldCloudSaveDocument=cloudSaveDocument;
  cloudSaveDocument=async function(doc,file=null){const id=await oldCloudSaveDocument(doc,file);try{if(id&&doc?.periodStart&&doc?.periodEnd){await supabase.from('financial_documents').update({period_start:doc.periodStart,period_end:doc.periodEnd,period_months:doc.periodMonths||null,period_label:doc.periodLabel||null}).eq('id',id);}}catch(e){console.warn('V58 period cloud metadata not saved',e.message);}return id;};
  const oldLoadCloudData=loadCloudData;
  loadCloudData=async function(){const res=await oldLoadCloudData();try{const {data}=await supabase.from('financial_documents').select('id,period_start,period_end,period_months,period_label');(data||[]).forEach(r=>{const d=state.docs.find(x=>String(x._remoteId||'')===String(r.id));if(d){d.periodStart=r.period_start||d.periodStart;d.periodEnd=r.period_end||d.periodEnd;d.periodMonths=r.period_months||d.periodMonths;d.periodLabel=r.period_label||d.periodLabel;}});saveLocalOnly();}catch(e){console.warn('V58 period cloud metadata load',e.message);}return res;};

  const style=document.createElement('style');style.textContent=`
    .v58-period-box{grid-column:1/-1;border:1px solid #dce8e5;background:#f8fcfb;border-radius:16px;padding:14px;margin-top:8px}.v58-period-title{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}.v58-period-title span,.v58-period-box small{color:#657680}.v58-period-grid,.v58-compare-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v58-compare-dates{margin-top:8px}.advice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.advice-card{background:#fff;border:1px solid #dce5e2;border-radius:20px;padding:18px}.advice-card>span{display:inline-block;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:900;color:#1f5a5d}.advice-card h3{margin:8px 0}.advice-card p{color:#52636d;line-height:1.5}.advice-card.critical{border-color:#e7b7b7;background:#fff7f7}.advice-card.critical>span{color:#a73535}.advice-card.warning{border-color:#ecd2aa;background:#fffaf1}.v58-advice-summary{margin:18px 0}.v58-advice-list{display:grid;gap:10px}.v58-advice-chip{border:1px solid #dce5e2;border-radius:14px;padding:12px;background:#fff}.v58-advice-chip.critical{border-color:#e7b7b7;background:#fff7f7}.v58-advice-chip strong{display:block;margin-bottom:4px}.v58-advice-chip span{color:#52636d}@media(max-width:800px){.advice-grid,.v58-period-grid,.v58-compare-dates{grid-template-columns:1fr}.v58-period-title{display:block}}
  `;document.head.appendChild(style);
  setTimeout(()=>{try{addPeriodFields();ensureRecommendationsView();if(qs('#overview.view.active')){renderOverview();}if(qs('#recommendations.view.active'))renderRecommendations();}catch(e){console.warn('V58 boot',e);}},500);
  console.info('NOMYRA Finance V58 loaded: period ranges, advice section and stronger Ask NOMYRA.');
})();


/* ===========================
   V59 - Natura conti, perdita negativa e ammortamenti stimati da periodo precedente
   =========================== */
(function(){
  const toNum=v=>Number.isFinite(Number(v))?Number(v):null;
  const abs=v=>v==null?null:Math.abs(Number(v));
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').toLowerCase();
  const parseDate=v=>{if(!v)return null;const s=String(v).slice(0,10);let m=s.match(/^(20\d{2})-(\d{2})-(\d{2})$/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);m=String(v).match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|\d{2})$/);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]);}return null;};
  function inferredRange(doc){
    const s=parseDate(doc?.periodStart||doc?.period_start||doc?.startDate||doc?.dateFrom);
    const e=parseDate(doc?.periodEnd||doc?.period_end||doc?.endDate||doc?.dateTo);
    if(s&&e&&s<=e)return {start:s,end:e,months:Math.max(1,(e.getFullYear()-s.getFullYear())*12+e.getMonth()-s.getMonth()+1),label:`${s.toLocaleDateString('it-IT')} – ${e.toLocaleDateString('it-IT')}`};
    const raw=String(doc?.period||'').trim();let m=raw.match(/^(20\d{2})[-_/]?(0?[1-9]|1[0-2])$/);
    if(m){const y=+m[1],mo=+m[2];return {start:new Date(y,0,1),end:new Date(y,mo,0),months:mo,label:`01/01/${y} – ${String(new Date(y,mo,0).getDate()).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${y}`};}
    m=raw.match(/^(20\d{2})$/);if(m){const y=+m[1];return {start:new Date(y,0,1),end:new Date(y,11,31),months:12,label:`01/01/${y} – 31/12/${y}`};}
    return {start:null,end:null,months:doc?.periodMonths||doc?.period_months||null,label:raw||'Periodo non indicato'};
  }
  function explicitLoss(line){
    const n=norm(String(line||'').replace(/^\s*\d{1,3}(?:\.\d{1,3})*\s*/,''));
    if(/utile\s*\(?\s*perdita\s*\)?/.test(n))return false;
    return /^perdita\b/.test(n)||/\bperdita\s+(?:dell\s+)?esercizio\b/.test(n)||/risultato\s+.*\bperdita\b/.test(n);
  }
  function explicitProfit(line){const n=norm(String(line||'').replace(/^\s*\d{1,3}(?:\.\d{1,3})*\s*/,''));return /^utile\b/.test(n)||/\butile\s+(?:dell\s+)?esercizio\b/.test(n);}
  function comparablePrevious(doc){
    if(!doc)return null;
    const r=inferredRange(doc);
    const docs=(state.docs||[]).filter(x=>x.company===doc.company&&x.id!==doc.id&&x.data);
    const before=docs.map(x=>({doc:x,range:inferredRange(x)})).filter(x=>x.range.end&&(!r.start||x.range.end<r.start)).sort((a,b)=>b.range.end-a.range.end);
    return before[0]?.doc||previousDoc(doc)||null;
  }
  function applyAccountNatureAndEstimates(){
    (state.docs||[]).forEach(doc=>{
      const d=doc.data||{}; const src=doc.sources||{};
      const niLine=src.netIncome?.items?.[0]?.line || src.netIncome?.items?.[0]?.row?.text || '';
      if(d.netIncome!=null&&explicitLoss(niLine)){
        d.netIncome=-Math.abs(Number(d.netIncome));
        if(src.netIncome){src.netIncome.method=src.netIncome.method||'direct';src.netIncome.note='Segno corretto in base alla natura del conto: perdita d’esercizio.'; if(src.netIncome.items?.[0])src.netIncome.items[0].value=d.netIncome;}
      }else if(d.netIncome!=null&&explicitProfit(niLine)){
        d.netIncome=Math.abs(Number(d.netIncome));
        if(src.netIncome?.items?.[0])src.netIncome.items[0].value=d.netIncome;
      }
      const finLine=src.financialResult?.items?.[0]?.line||'';
      if(d.financialResult!=null&&/oneri\s+finanziari/i.test(finLine))d.financialResult=-Math.abs(Number(d.financialResult));
    });
    (state.docs||[]).forEach(doc=>{
      const d=doc.data||{}; const src=doc.sources||{};
      if(d.depreciation!=null)return;
      const prev=comparablePrevious(doc); if(!prev?.data?.depreciation)return;
      const curR=inferredRange(doc), prevR=inferredRange(prev);
      const curMonths=Number(curR.months||doc.periodMonths||doc.period_months||0);
      const prevMonths=Number(prevR.months||prev.periodMonths||prev.period_months||12)||12;
      if(!curMonths||curMonths<1)return;
      const monthly=Math.abs(Number(prev.data.depreciation))/prevMonths;
      if(!Number.isFinite(monthly)||monthly<=0)return;
      const estimated=monthly*curMonths;
      d.depreciation=estimated;
      src.depreciation={method:'estimated_from_previous_period',confidence:68,formula:'Ammortamenti periodo precedente / mesi periodo precedente × mesi periodo corrente',deps:['previous.depreciation','period_months'],items:[{line:`Stima da ${prev.period}: ${fmt(prev.data.depreciation)} / ${prevMonths} × ${curMonths}`,value:estimated}],note:'Spring non espone gli ammortamenti del progressivo: valore stimato automaticamente dalla quota mensile del periodo precedente.'};
      if(d.ebitda!=null&&(d.ebit==null||doc._v59EstimatedEbit)){
        d.ebit=Number(d.ebitda)-estimated;
        src.ebit={method:'estimated_from_ebitda_and_depreciation',confidence:66,formula:'EBITDA − ammortamenti stimati',deps:['ebitda','depreciation'],items:src.depreciation.items,note:'EBIT stimato perché gli ammortamenti non erano presenti nel bilancio caricato.'};
        doc._v59EstimatedEbit=true;
      }
    });
  }
  const oldRenderAll=renderAll;
  renderAll=function(){try{applyAccountNatureAndEstimates();}catch(e){console.warn('V59 account nature/estimate failed',e);}oldRenderAll();};
  const oldRenderOverview=renderOverview;
  renderOverview=function(){try{applyAccountNatureAndEstimates();}catch(e){}oldRenderOverview();injectV59MethodologyNote();};
  function injectV59MethodologyNote(){
    const d=currentDoc(); if(!d)return;
    let box=document.querySelector('#v59MethodologyNote');
    const target=document.querySelector('#v56FinancialFlow')||document.querySelector('#overview .hero-card');
    if(!box&&target){box=document.createElement('div');box.id='v59MethodologyNote';box.className='panel v59-method-note';target.insertAdjacentElement('afterend',box);} if(!box)return;
    const depEstimated=d.sources?.depreciation?.method==='estimated_from_previous_period';
    const niLine=d.sources?.netIncome?.items?.[0]?.line||'';
    const lossFixed=d.data?.netIncome<0&&explicitLoss(niLine);
    if(!depEstimated&&!lossFixed){box.style.display='none';return;}
    box.style.display='block';
    box.innerHTML=`<div class="panel-head"><div><span class="section-label">METODO DI CALCOLO</span><h3>Controlli automatici sui segni e sugli ammortamenti</h3></div></div><div class="v59-method-grid">${lossFixed?`<div><strong>Perdita riconosciuta</strong><span>Il risultato d’esercizio è stato trattato come valore negativo perché la riga del bilancio indica perdita, non utile.</span></div>`:''}${depEstimated?`<div><strong>Ammortamenti stimati</strong><span>Spring non espone gli ammortamenti del periodo: NOMYRA usa la quota mensile del periodo precedente e la moltiplica per i mesi del bilancio corrente.</span></div>`:''}</div>`;
  }
  const css=document.createElement('style');css.textContent=`.v59-method-note{margin:16px 0}.v59-method-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v59-method-grid>div{border:1px solid #dce5e2;background:#f8fcfb;border-radius:16px;padding:14px}.v59-method-grid strong{display:block;color:#0b1b33;margin-bottom:4px}.v59-method-grid span{color:#52636d;line-height:1.45}@media(max-width:780px){.v59-method-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  setTimeout(()=>{try{applyAccountNatureAndEstimates(); if(document.querySelector('#overview.view.active'))renderOverview(); else renderAll();}catch(e){}},700);
  console.info('NOMYRA Finance V59 loaded: account-nature sign control and estimated depreciation from previous period.');
})();


/* ===========================
   V60 - Produttività decisionale + prezzo medio per modello + stagionalità + Ask NOMYRA più utile
   - Prezzo medio generale = fatturato / unità lette.
   - Ogni prodotto mostra quantità, fatturato, prezzo medio, costo stimato e margine stimato.
   - Stagionalità configurabile per mesi nel profilo aziendale.
   - Ask NOMYRA risponde meglio su prezzo medio, prodotti, costi e stagionalità.
   =========================== */
(function(){
  const MONTHS=[['01','Gen'],['02','Feb'],['03','Mar'],['04','Apr'],['05','Mag'],['06','Giu'],['07','Lug'],['08','Ago'],['09','Set'],['10','Ott'],['11','Nov'],['12','Dic']];
  const q=(s,root=document)=>root.querySelector(s);
  const qa=(s,root=document)=>[...root.querySelectorAll(s)];
  const safeN=v=>Number.isFinite(Number(v))?Number(v):0;
  const safePct=(a,b)=>b?`${((a/b)*100).toLocaleString('it-IT',{maximumFractionDigits:1})}%`:'—';
  function currentBilForProductivity(rec){
    const c=rec?.company||state.selectedCompany,p=rec?.period||state.selectedPeriod;
    return (state.docs||[]).find(d=>profileKey(d.company)===profileKey(c)&&String(d.period)===String(p))||currentDoc();
  }
  function costRowsFromBil(bil){
    const x=bil?.data||{};
    const keys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','leases','personnel','otherOperatingCosts','adminCommercialCosts'];
    return keys.map(k=>({key:k,label:(typeof metricNames==='object'&&metricNames[k])||k,value:Math.abs(Number(x[k]||0))})).filter(r=>Number.isFinite(r.value)&&r.value>0);
  }
  function costUnitFromBilAndQty(bil,totalQty){
    const rows=costRowsFromBil(bil);const total=rows.reduce((a,r)=>a+r.value,0);
    return {rows,total,costPerUnit:totalQty?total/totalQty:null};
  }
  function productNameParts(name=''){
    const parts=String(name||'').split(' · ');
    if(parts.length>1)return {label:parts[0],code:parts.slice(1).join(' · ')};
    return {label:name||'Non specificato',code:''};
  }
  function inferSeasonalityFromMonthly(monthly=[]){
    if(!monthly||monthly.length<6)return {type:'non_calcolabile',text:'Servono almeno 6 mesi di vendite per stimare la stagionalità dai dati.'};
    const vals=monthly.map(x=>Number(x.revenue||0)).filter(Number.isFinite);if(!vals.length)return {type:'non_calcolabile',text:'Trend mensile non disponibile.'};
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;const max=Math.max(...vals),min=Math.min(...vals);const ratio=avg?max/avg:0;
    const best=monthly.reduce((a,b)=>Number(b.revenue||0)>Number(a.revenue||0)?b:a,monthly[0]);
    const worst=monthly.reduce((a,b)=>Number(b.revenue||0)<Number(a.revenue||0)?b:a,monthly[0]);
    const lab=k=>{const [y,m]=String(k).split('-');return `${MONTHS[(Number(m)||1)-1]?.[1]||m} ${String(y||'').slice(-2)}`;};
    if(ratio>1.55)return {type:'alta',text:`Andamento stagionale evidente: il mese migliore è ${lab(best.month)} (${fmt(best.revenue)}), il mese più basso è ${lab(worst.month)} (${fmt(worst.revenue)}).`};
    if(ratio>1.25)return {type:'media',text:`Stagionalità moderata: alcuni mesi pesano più della media. Mese migliore: ${lab(best.month)}.`};
    return {type:'bassa',text:'Andamento mensile abbastanza distribuito: non emerge una stagionalità forte dai dati caricati.'};
  }
  function seasonalMonthsText(profile){
    const arr=Array.isArray(profile?.seasonalMonths)?profile.seasonalMonths:[];
    if(!arr.length)return '';
    return arr.map(m=>MONTHS.find(x=>x[0]===String(m).padStart(2,'0'))?.[1]||m).join(', ');
  }
  function v60ProductivityHtml(rec){
    const m=rec?.metrics||{};const bil=currentBilForProductivity(rec);const cost=costUnitFromBilAndQty(bil,m.totalQty);const costPerUnit=cost.costPerUnit;
    const avg=m.avgUnitPrice;const marginUnit=(avg!=null&&costPerUnit!=null)?avg-costPerUnit:null;
    const profile=getCompanyProfile(rec.company||state.selectedCompany)||{};const season=inferSeasonalityFromMonthly(m.monthlyRevenue||[]);const seasonMonths=seasonalMonthsText(profile);
    const products=(m.topProducts||[]).slice(0,8).map(p=>{const qty=safeN(p.qty);const price=p.avgUnitPrice!=null?Number(p.avgUnitPrice):(qty?Number(p.revenue||0)/qty:null);const margin=(price!=null&&costPerUnit!=null)?price-costPerUnit:null;const parts=productNameParts(p.name);return {...p,qty,price,margin,parts};});
    const qtyMissing=products.length&&products.every(p=>!p.qty);
    const formula=avg!=null?`Prezzo medio = ${fmt(m.totalRevenue)} / ${num(m.totalQty||0)} unità = ${fmt(avg)}`:'Prezzo medio non calcolabile: manca una quantità valida.';
    const costText=costPerUnit!=null?`Costo operativo stimato/unità = ${fmt(cost.total)} / ${num(m.totalQty||0)} unità = ${fmt(costPerUnit)}`:'Costo unitario non calcolabile: servono quantità vendute e costi operativi del bilancio.';
    return `<div id="v60ProductivityDecision" class="v60-prod-decision">
      <div class="v60-head"><div><span class="section-label">LETTURA DECISIONALE</span><h3>Prezzi, quantità e margine stimato</h3><p>Questa sezione legge se i prezzi medi di vendita sono coerenti con la struttura dei costi riconosciuta nel bilancio.</p></div>${qtyMissing?'<span class="v60-badge warn">Quantità prodotto da verificare</span>':'<span class="v60-badge ok">Quantità lette</span>'}</div>
      <div class="v60-kpi-row">
        <article><small>Prezzo medio generale</small><strong>${fmt(avg)}</strong><span>${esc(formula)}</span></article>
        <article><small>Costo stimato unitario</small><strong>${fmt(costPerUnit)}</strong><span>${esc(costText)}</span></article>
        <article class="${marginUnit<0?'danger':marginUnit!=null&&marginUnit<1?'warn':'ok'}"><small>Margine unitario stimato</small><strong>${fmt(marginUnit)}</strong><span>${marginUnit==null?'Da completare':marginUnit<0?'Prezzo medio sotto il costo stimato':'Prezzo medio sopra il costo stimato'}</span></article>
        <article><small>Stagionalità</small><strong>${esc(profile.seasonality||season.type||'Da definire')}</strong><span>${seasonMonths?`Mesi indicati: ${esc(seasonMonths)}`:esc(season.text)}</span></article>
      </div>
      ${qtyMissing?`<div class="v60-warning"><strong>Attenzione:</strong> il report contiene quantità totali, ma la quantità non è ancora collegata correttamente ai singoli prodotti già caricati. Ricarica il file con questa versione: NOMYRA salverà quantità e prezzo medio per modello.</div>`:''}
      <div class="v60-products-panel"><div class="panel-head"><div><span class="section-label">MODELLI / PRODOTTI</span><h3>Prezzo medio, quantità e margine per prodotto</h3></div></div>
        <div class="v60-product-table"><table><thead><tr><th>Prodotto</th><th>Quantità</th><th>Fatturato</th><th>Prezzo medio</th><th>Costo stimato</th><th>Margine stimato</th></tr></thead><tbody>${products.length?products.map(p=>`<tr class="${p.margin<0?'neg':''}"><td><strong>${esc(p.parts.label)}</strong>${p.parts.code?`<small>${esc(p.parts.code)}</small>`:''}</td><td>${p.qty?num(p.qty):'<span class="muted">Da leggere</span>'}</td><td>${fmt(p.revenue)}</td><td>${fmt(p.price)}</td><td>${fmt(costPerUnit)}</td><td>${p.margin==null?'—':`<b>${fmt(p.margin)}</b>`}</td></tr>`).join(''):'<tr><td colspan="6" class="empty-state">Carica un report vendite per vedere il dettaglio per prodotto.</td></tr>'}</tbody></table></div>
      </div>
      <div class="v60-season-box"><strong>Come usare la stagionalità</strong><p>${esc(season.text)} ${seasonMonths?`NOMYRA terrà conto dei mesi stagionali configurati: ${seasonMonths}.`: 'Puoi configurare i mesi stagionali nel profilo aziendale: questo aiuta a non giudicare un periodo basso come negativo se è fisiologico.'}</p></div>
    </div>`;
  }
  function v60EnhanceProductivity(){
    const rec=typeof currentProductivity==='function'?currentProductivity():null;const shell=q('#v47ProductivityDashboard')||q('#productivity');if(!shell||!rec?.metrics)return;
    let box=q('#v60ProductivityDecision');const html=v60ProductivityHtml(rec);if(box){box.outerHTML=html;}else{shell.insertAdjacentHTML('afterbegin',html);}    
    // Riduci le tabelle ripetitive se esistono già: lasciale come approfondimento, ma con titolo più utile.
    const custPanel=q('#topCustomersTable')?.closest('.panel'); if(custPanel){const h=custPanel.querySelector('h3'); if(h)h.textContent='Clienti principali e concentrazione';}
    const prodPanel=q('#topProductsTable')?.closest('.panel'); if(prodPanel){const h=prodPanel.querySelector('h3'); if(h)h.textContent='Prodotti per fatturato';}
  }
  const prevRenderProductivity=renderProductivity;
  renderProductivity=function(){prevRenderProductivity();try{v60EnhanceProductivity();}catch(e){console.warn('V60 productivity enhance',e);}};

  function ensureSeasonalityMonthsUI(){
    const grid=q('#profileModal .profile-grid'); if(!grid||q('#v60SeasonalMonthsBox'))return;
    const box=document.createElement('div');box.id='v60SeasonalMonthsBox';box.className='wide v60-season-months';
    box.innerHTML=`<label>Mesi stagionali / mesi forti</label><div>${MONTHS.map(([v,l])=>`<button type="button" class="mini-btn" data-season-month="${v}">${l}</button>`).join('')}</div><small>Serve per leggere meglio bilanci infrannuali, vendite e proiezioni: non tutti i mesi devono generare lo stesso risultato.</small>`;
    const seasonLabel=q('#profileSeasonality')?.closest('label');(seasonLabel||grid.lastElementChild)?.insertAdjacentElement('afterend',box);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-season-month]');if(!b)return;b.classList.toggle('active');});
  }
  function setSeasonalMonthsUI(profile){ensureSeasonalityMonthsUI();const months=(profile?.seasonalMonths||[]).map(x=>String(x).padStart(2,'0'));qa('[data-season-month]').forEach(b=>b.classList.toggle('active',months.includes(b.dataset.seasonMonth)));}
  const oldOpenProfile=openProfile;
  openProfile=function(target){oldOpenProfile(target);try{const key=profileKey(activeProfileCompany||target);setSeasonalMonthsUI(state.profiles?.[key]||getCompanyProfile(target)||{});}catch(e){}};
  const oldReadProfileFields=readProfileFields;
  readProfileFields=function(){const p=oldReadProfileFields();p.seasonalMonths=qa('[data-season-month].active').map(b=>b.dataset.seasonMonth);return p;};

  const oldProfileContextText=profileContextText;
  profileContextText=function(doc){const txt=oldProfileContextText(doc);const p=getCompanyProfile(doc?.company||doc)||{};const months=seasonalMonthsText(p);return months?`${txt} · mesi stagionali ${months}`:txt;};

  const oldAnswer=answerQuestion;
  answerQuestion=function(query){
    const s=String(query||'').toLowerCase();const rec=typeof currentProductivity==='function'?currentProductivity():null;const m=rec?.metrics||{};const bil=rec?currentBilForProductivity(rec):currentDoc();const cost=costUnitFromBilAndQty(bil,m.totalQty);const profile=getCompanyProfile(rec?.company||state.selectedCompany)||{};
    if(/prezzo\s+medio|media\s+prezzo|prezzi/.test(s)&&rec){
      return `Il prezzo medio generale viene calcolato così: fatturato vendite ${fmt(m.totalRevenue)} diviso quantità vendute ${num(m.totalQty||0)} = ${fmt(m.avgUnitPrice)}. Per prodotto, NOMYRA usa fatturato del prodotto diviso quantità del prodotto. Se vedi quantità pari a zero, ricarica il file: significa che il vecchio report non aveva salvato le quantità per singolo modello.`;
    }
    if(/prodotto|modello|articolo|quantit/.test(s)&&rec){
      const top=(m.topProducts||[]).slice(0,5).map(p=>{const qty=safeN(p.qty);const price=p.avgUnitPrice!=null?p.avgUnitPrice:(qty?p.revenue/qty:null);return `${p.name}: ${qty?num(qty)+' unità':'quantità da verificare'}, fatturato ${fmt(p.revenue)}, prezzo medio ${fmt(price)}`;});
      return top.length?`Dettaglio principali prodotti: ${top.join(' · ')}.`:'Non vedo prodotti analizzabili. Carica il report vendite/prodotti.';
    }
    if(/costo|margine|produzione|redditivit/.test(s)&&rec){
      const avg=m.avgUnitPrice,cpu=cost.costPerUnit,margin=(avg!=null&&cpu!=null)?avg-cpu:null;
      return `Stima direzionale: prezzo medio ${fmt(avg)}, costo operativo stimato per unità ${fmt(cpu)}, margine unitario stimato ${fmt(margin)}. Questo non è ancora il costo industriale reale per articolo: per quello servono distinta base, costo materia, ore macchina, energia e scarti per modello.`;
    }
    if(/stagional/.test(s)){
      const months=seasonalMonthsText(profile);const season=inferSeasonalityFromMonthly(m.monthlyRevenue||[]);
      return months?`Nel profilo aziendale sono indicati come mesi stagionali: ${months}. Questo aiuta NOMYRA a non interpretare automaticamente un mese basso come problema strutturale. Dai dati vendite: ${season.text}`:`La stagionalità serve per leggere correttamente periodi infrannuali. Configura nel profilo aziendale i mesi forti/deboli; dai dati vendite disponibili: ${season.text}`;
    }
    return oldAnswer(query);
  };

  const css=document.createElement('style');css.textContent=`
    .v60-prod-decision{margin:18px 0 22px}.v60-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.v60-head h3{font-size:24px;margin:4px 0}.v60-head p{color:#60717a;margin:0}.v60-badge{border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px;white-space:nowrap}.v60-badge.ok{background:#e9f7ef;color:#19724b}.v60-badge.warn{background:#fff1e0;color:#9b5a00}.v60-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.v60-kpi-row article{background:#fff;border:1px solid #d9e4e1;border-radius:18px;padding:16px}.v60-kpi-row small{text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#6d7d85;font-weight:900}.v60-kpi-row strong{display:block;font-size:24px;margin:6px 0;color:#0b1b33}.v60-kpi-row span{display:block;color:#60717a;line-height:1.35;font-size:13px}.v60-kpi-row article.danger{background:#fff4f4;border-color:#e9b5b5}.v60-kpi-row article.danger strong{color:#b34242}.v60-kpi-row article.warn{background:#fff8ed;border-color:#efd0a4}.v60-kpi-row article.ok{background:#f1fbf6;border-color:#cde8da}.v60-warning{background:#fff6ed;border-left:5px solid #b97850;border-radius:14px;padding:12px 14px;margin:10px 0;color:#5f4428}.v60-products-panel{background:#fff;border:1px solid #d9e4e1;border-radius:22px;padding:18px;margin:14px 0}.v60-product-table{overflow:auto}.v60-product-table table{width:100%;border-collapse:collapse}.v60-product-table th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6e7d85;background:#f6f9f8;padding:12px}.v60-product-table td{border-top:1px solid #e5ece9;padding:12px;vertical-align:top}.v60-product-table td small{display:block;color:#6e7d85}.v60-product-table tr.neg{background:#fff7f7}.v60-product-table tr.neg td:last-child{color:#b34242}.v60-season-box{background:#f7fbfa;border:1px solid #dbe8e5;border-radius:18px;padding:14px;color:#52636d}.v60-season-box strong{display:block;color:#0b1b33;margin-bottom:4px}.v60-season-months{border:1px solid #dce8e5;background:#f8fcfb;border-radius:16px;padding:14px}.v60-season-months>label{display:block;font-weight:900;margin-bottom:8px}.v60-season-months div{display:flex;flex-wrap:wrap;gap:8px}.v60-season-months .mini-btn.active{background:#1f5a5d;color:#fff;border-color:#1f5a5d}.muted{color:#7a8991}@media(max-width:1100px){.v60-kpi-row{grid-template-columns:repeat(2,minmax(0,1fr));}.v60-head{flex-direction:column}}@media(max-width:680px){.v60-kpi-row{grid-template-columns:1fr}}
  `;document.head.appendChild(css);
  setTimeout(()=>{try{ensureSeasonalityMonthsUI();if(q('#productivity.view.active'))renderProductivity();}catch(e){}},500);
  console.info('NOMYRA Finance V60 loaded: decision productivity, per-product average price/quantity/margin, seasonality and smarter Ask NOMYRA.');
})();


/* ================================
   NOMYRA Finance V61
   Produttività: prezzo medio pulito, NC/rettifiche separate, esclusione accessori/non-prodotto
   ================================ */
(function(){
  const V61_EXCLUDE_WORDS=['pedana','pedane','pallet','bancale','bancali','timbro','timbri','ottone','trasporto','spese','contributo','servizio','servizi','imballo accessorio','accessorio','sconto','arrotondamento'];
  function v61Norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function v61IsExcludedProduct(name,code,family){const hay=v61Norm([name,code,family].join(' '));return V61_EXCLUDE_WORDS.some(w=>hay.includes(v61Norm(w)));}
  function v61ClassLabel(row){
    if(row?.isCreditNote)return 'Nota credito / rettifica';
    if(row?.isExcludedProduct)return 'Extra escluso dal prezzo medio';
    if(row?.priceMismatch)return 'Prezzo/importo da verificare';
    return 'Prodotto venduto';
  }
  function v61ProductivityWorkerScript(){return `
    self.importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    const EXCLUDE_WORDS=${JSON.stringify(V61_EXCLUDE_WORDS)};
    const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
    const findHeader=(headers,patterns)=>{const hs=headers.map(h=>[h,norm(h)]);return (hs.find(([,n])=>patterns.some(p=>n.includes(norm(p))))||[])[0]||'';};
    const isExcludedProduct=(name,code,family)=>{const hay=norm([name,code,family].join(' '));return EXCLUDE_WORDS.some(w=>hay.includes(norm(w)));};
    const isCreditNoteText=s=>{const n=norm(s);return /(^| )nc( |$)/.test(n)||n.includes('nota credito')||n.includes('nota di credito')||n.includes('accredito')||n.includes('storno');};
    const parseAmount=v=>{if(v==null||v==='')return null;if(typeof v==='number'&&Number.isFinite(v))return v;let s=String(v).trim();if(!s)return null;s=s.replace(/€/g,'').replace(/\\s/g,'');let neg=/^\\(.*\\)$/.test(s)||/-$/.test(s)||/^-/.test(s);s=s.replace(/[()]/g,'').replace(/^-|-$|\\+/g,'').replace(/[^0-9,.-]/g,'');if(!s)return null;const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');if(lastComma>-1&&lastDot>-1){if(lastComma>lastDot)s=s.replace(/\\./g,'').replace(',', '.');else s=s.replace(/,/g,'');}else if(lastComma>-1){s=s.replace(/\\./g,'').replace(',', '.');}else if(lastDot>-1){if(/^\\d{1,3}(\\.\\d{3})+$/.test(s))s=s.replace(/\\./g,'');}
      const n=Number(s);return Number.isFinite(n)?(neg?-n:n):null;};
    const excelDate=v=>{if(!v&&v!==0)return null;if(v instanceof Date&&!isNaN(v))return v;if(typeof v==='number'&&v>20000){const d=new Date(Math.round((v-25569)*86400*1000));return isNaN(d)?null:d;}const s=String(v).trim();let m=s.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]));return isNaN(d)?null:d;}m=s.match(/^(20\\d{2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{1,2})$/);if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return isNaN(d)?null:d;}m=s.match(/^(\\d{1,2})\\/(20\\d{2})$/);if(m){const d=new Date(Number(m[2]),Number(m[1])-1,1);return isNaN(d)?null:d;}const d=new Date(s);return isNaN(d)?null:d;};
    const periodInfo=p=>{p=String(p||'').trim();let m=p.match(/^(20\\d{2})(?:[-\\/](\\d{1,2}))?/);return {year:m?Number(m[1]):null,month:m&&m[2]?Number(m[2]):null};};
    const periodMatches=(d,p)=>{const i=periodInfo(p);if(!i.year)return true;if(d.getFullYear()!==i.year)return false;if(i.month&&d.getMonth()+1!==i.month)return false;return true;};
    const iso=d=>d&&!isNaN(d)?d.toISOString().slice(0,10):null;
    const monthKey=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):'';
    const periodLabel=dates=>{if(!dates.length)return '';const years=[...new Set(dates.map(d=>d.getFullYear()))].sort();const months=[...new Set(dates.map(monthKey))].sort();if(years.length===1&&months.length>=10)return String(years[0]);if(months.length===1)return months[0];return months[0]+' / '+months[months.length-1];};
    const aggregate=(rows,key,total)=>{const m=new Map();for(const r of rows){const k=String(r[key]||'Non specificato').trim()||'Non specificato';const prev=m.get(k)||{name:k,revenue:0,qty:0,lines:0,creditNotes:0,excluded:0,anomalies:0};prev.revenue+=Number(r.revenue||0);prev.qty+=Number(r.qty||0);prev.lines+=1;if(r.isCreditNote)prev.creditNotes+=1;if(r.isExcludedProduct)prev.excluded+=1;if(r.priceMismatch)prev.anomalies+=1;m.set(k,prev);}return [...m.values()].map(x=>({...x,avgUnitPrice:x.qty?x.revenue/x.qty:null,share:total?x.revenue/total*100:null})).sort((a,b)=>b.revenue-a.revenue);};
    self.onmessage=e=>{try{
      const {buffer,period}=e.data; self.postMessage({stage:'parse'});
      const wb=XLSX.read(buffer,{type:'array',cellDates:true,raw:false});
      const ws=wb.Sheets[wb.SheetNames[0]]; if(!ws)throw new Error('EMPTY_SALES');
      let rawRows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
      if(!rawRows.length)throw new Error('EMPTY_SALES');
      const headers=Object.keys(rawRows[0]||{});
      const hDate=findHeader(headers,['data','date','giorno','mese','data fattura','data documento','data doc','doc date']);
      const hCustomer=findHeader(headers,['cliente','customer','ragione sociale','nominativo','clienti','denominazione cliente']);
      const hProductCode=findHeader(headers,['codice articolo','cod articolo','cod art','codice prodotto','codice','sku']);
      let hProductName=findHeader(headers,['descrizione articolo','desc articolo','descrizione prodotto','descrizione','prodotto','articolo','nome prodotto','item description']);
      if(hProductName===hProductCode)hProductName='';
      const hFamily=findHeader(headers,['famiglia','categoria','linea','gruppo','tipo prodotto']);
      const hQty=findHeader(headers,['quantita','quantità','qta','qty','pezzi','unita','unità','pz']);
      const hPrice=findHeader(headers,['prezzo unitario','prezzo','price','unitario','prezzo medio']);
      const hRevenue=findHeader(headers,['fatturato','ricavo','ricavi','totale','importo','valore','imponibile','prezzo totale','totale riga']);
      const hDoc=findHeader(headers,['riferimenti registrazio','riferimenti registrazione','tipo documento','tipo doc','documento','causale','protocollo','registro','riferimento']);
      const allDates=[];const years=new Set();
      if(hDate){for(const r of rawRows){const d=excelDate(r[hDate]);if(d){allDates.push(d);years.add(d.getFullYear());}}}
      const range=allDates.length?{start:iso(new Date(Math.min(...allDates.map(d=>d.getTime())))),end:iso(new Date(Math.max(...allDates.map(d=>d.getTime())))),years:[...years].sort()} : null;
      if(hDate&&years.size>1&&!period){self.postMessage({error:'NEED_PERIOD',range});return;}
      let used=rawRows;
      if(hDate&&period&&periodInfo(period).year){used=rawRows.filter(r=>{const d=excelDate(r[hDate]);return d&&periodMatches(d,period);});}
      if(!used.length){self.postMessage({error:'EMPTY_PERIOD',range});return;}
      self.postMessage({stage:'analyze',rows:used.length,totalRows:rawRows.length});
      const rows=[];const dates=[];const byMonth=new Map();const byFamily=new Map();const excludedRows=[];const creditRows=[];const anomalyRows=[];
      for(const r of used){
        let qty=parseAmount(r[hQty]);const price=parseAmount(r[hPrice]);let revenue=parseAmount(r[hRevenue]);
        const d=hDate?excelDate(r[hDate]):null;if(d)dates.push(d);
        const code=hProductCode?String(r[hProductCode]||'').trim():'';const name=hProductName?String(r[hProductName]||'').trim():'';
        const family=hFamily?String(r[hFamily]||'').trim():'';const customer=hCustomer?String(r[hCustomer]||'').trim():'Non specificato';
        const docText=hDoc?String(r[hDoc]||''):'';
        let isCreditNote=isCreditNoteText(docText)||isCreditNoteText(String(r[hRevenue]||''));
        if((revenue==null||revenue===0)&&qty!=null&&price!=null)revenue=qty*price;
        if(revenue==null||!Number.isFinite(revenue)||Math.abs(revenue)===0)continue;
        if(isCreditNote&&revenue>0)revenue=-Math.abs(revenue);
        if(isCreditNote&&qty>0)qty=-Math.abs(qty);
        const product=(name&&code)?(name+' · '+code):(name||code||'Non specificato');
        const isExcludedProduct=isExcludedProduct(name||product,code,family);
        const expected=(qty!=null&&price!=null)?qty*price:null;
        const priceMismatch=expected!=null&&Math.abs(expected-revenue)>Math.max(1,Math.abs(revenue)*0.02)&&!isCreditNote;
        const row={customer,product,productCode:code,productName:name,family,qty:qty||0,unitPrice:price,revenue,date:d,isCreditNote,isExcludedProduct,priceMismatch,docText};
        rows.push(row);
        if(d){const k=monthKey(d);byMonth.set(k,(byMonth.get(k)||0)+revenue);}if(family)byFamily.set(family,(byFamily.get(family)||0)+revenue);
        if(isCreditNote)creditRows.push(row); if(isExcludedProduct)excludedRows.push(row); if(priceMismatch)anomalyRows.push(row);
      }
      if(!rows.length)throw new Error('NO_REVENUE_COL');
      const productRows=rows.filter(r=>!r.isCreditNote&&!r.isExcludedProduct&&r.qty>0);
      const netRevenue=rows.reduce((a,r)=>a+r.revenue,0);
      const productRevenue=productRows.reduce((a,r)=>a+r.revenue,0);
      const productQty=productRows.reduce((a,r)=>a+(r.qty||0),0);
      const excludedRevenue=excludedRows.reduce((a,r)=>a+r.revenue,0);
      const creditRevenue=creditRows.reduce((a,r)=>a+r.revenue,0);
      const customers=aggregate(rows.filter(r=>!r.isCreditNote), 'customer', Math.abs(netRevenue));
      const products=aggregate(productRows,'product',productRevenue);
      const monthlyRevenue=[...byMonth.entries()].sort().map(([month,revenue])=>({month,revenue}));
      const topFamilies=[...byFamily.entries()].map(([name,revenue])=>({name,revenue,share:netRevenue?revenue/netRevenue*100:null})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
      const detectedPeriodLabel=periodLabel(dates)||period||'';const start=dates.length?new Date(Math.min(...dates.map(d=>d.getTime()))):null;const end=dates.length?new Date(Math.max(...dates.map(d=>d.getTime()))):null;
      self.postMessage({metrics:{rowsCount:rows.length,sourceRowsCount:rawRows.length,filteredRowsCount:used.length,periodFilterApplied:used.length!==rawRows.length,requestedPeriod:period,
        totalRevenue:productRevenue,totalQty:productQty,avgUnitPrice:productQty?productRevenue/productQty:null,
        netSalesRevenue:netRevenue,productRevenue,productQty,excludedRevenue,creditNoteRevenue:creditRevenue,excludedRowsCount:excludedRows.length,creditNotesCount:creditRows.length,anomalyRowsCount:anomalyRows.length,
        uniqueCustomers:customers.length,uniqueProducts:products.length,avgRevenuePerCustomer:customers.length?netRevenue/customers.length:null,topCustomerShare:customers[0]?customers[0].share:null,topProductShare:products[0]?products[0].share:null,topCustomers:customers.slice(0,10),topProducts:products.slice(0,12),monthlyRevenue,topFamilies,
        excludedSummary:aggregate(excludedRows,'product',Math.abs(excludedRevenue)).slice(0,8),creditNotesSummary:aggregate(creditRows,'product',Math.abs(creditRevenue)).slice(0,8),priceAnomalies:anomalyRows.slice(0,12).map(x=>({product:x.product,qty:x.qty,unitPrice:x.unitPrice,revenue:x.revenue,customer:x.customer,docText:x.docText})),
        detectedPeriodLabel,detectedStartDate:iso(start),detectedEndDate:iso(end),detectedYear:(new Set(dates.map(d=>d.getFullYear()))).size===1?String(dates[0]?.getFullYear()||''):'',sourcePeriodLabel:range?(range.start?.slice(5,7)+'/'+range.start?.slice(0,4)+' – '+range.end?.slice(5,7)+'/'+range.end?.slice(0,4)):'',sourceYears:range?.years||[],headers:{customer:hCustomer,productCode:hProductCode,productName:hProductName,product:hProductName||hProductCode,quantity:hQty,price:hPrice,revenue:hRevenue,date:hDate,family:hFamily,document:hDoc}}});
    }catch(err){self.postMessage({error:err.message||'WORKER_ERROR'});}};
  `;}
  // Sostituisce il worker V57/V60 mantenendo compatibilità con il resto della piattaforma.
  window.v57ProductivityWorkerScript=v61ProductivityWorkerScript;
  try{v57ProductivityWorkerScript=v61ProductivityWorkerScript;}catch(e){}

  function v61ProductivityHtml(rec){
    const m=rec?.metrics||{};const bil=typeof currentBilForProductivity==='function'?currentBilForProductivity(rec):null;const cost=typeof costUnitFromBilAndQty==='function'?costUnitFromBilAndQty(bil,m.productQty||m.totalQty):{};const costPerUnit=cost.costPerUnit;
    const avg=m.avgUnitPrice;const marginUnit=(avg!=null&&costPerUnit!=null)?avg-costPerUnit:null;
    const products=(m.topProducts||[]).slice(0,12).map(p=>{const qty=safeN(p.qty);const price=p.avgUnitPrice!=null?Number(p.avgUnitPrice):(qty?Number(p.revenue||0)/qty:null);const margin=(price!=null&&costPerUnit!=null)?price-costPerUnit:null;const parts=productNameParts(p.name);return {...p,qty,price,margin,parts};});
    const profile=getCompanyProfile(rec.company||state.selectedCompany)||{};const season=typeof inferSeasonalityFromMonthly==='function'?inferSeasonalityFromMonthly(m.monthlyRevenue||[]):{type:'',text:''};const seasonMonths=typeof seasonalMonthsText==='function'?seasonalMonthsText(profile):'';
    const formula=avg!=null?`Prezzo medio prodotti = ${fmt(m.productRevenue??m.totalRevenue)} / ${num(m.productQty??m.totalQty||0)} unità = ${fmt(avg)}`:'Prezzo medio non calcolabile: manca una quantità valida sulle righe prodotto.';
    const excluded=(m.excludedRowsCount||0)+(m.creditNotesCount||0);
    return `<div id="v60ProductivityDecision" class="v60-prod-decision v61-prod-decision">
      <div class="v60-head"><div><span class="section-label">LETTURA DECISIONALE</span><h3>Prezzo medio pulito, quantità e margine per modello</h3><p>Il prezzo medio viene calcolato solo sulle righe prodotto. Pedane, timbri, ottone, spese e note credito vengono separati per non falsare il prezzo medio.</p></div>${excluded?`<span class="v60-badge warn">${excluded} righe escluse/rettificate</span>`:'<span class="v60-badge ok">Prezzo medio pulito</span>'}</div>
      <div class="v60-kpi-row">
        <article><small>Fatturato netto report</small><strong>${fmt(m.netSalesRevenue??m.totalRevenue)}</strong><span>Include prodotti, extra e rettifiche/NC.</span></article>
        <article><small>Fatturato prodotti</small><strong>${fmt(m.productRevenue??m.totalRevenue)}</strong><span>Base usata per prezzo medio e margine prodotto.</span></article>
        <article><small>Prezzo medio prodotti</small><strong>${fmt(avg)}</strong><span>${esc(formula)}</span></article>
        <article class="${marginUnit<0?'danger':marginUnit!=null&&marginUnit<1?'warn':'ok'}"><small>Margine unitario stimato</small><strong>${fmt(marginUnit)}</strong><span>${marginUnit==null?'Da completare':marginUnit<0?'Prezzo medio sotto il costo stimato':'Prezzo medio sopra il costo stimato'}</span></article>
      </div>
      <div class="v61-split-grid">
        <div class="v61-note"><strong>Righe separate dal prezzo medio</strong><p>NC/rettifiche: ${m.creditNotesCount||0} righe, ${fmt(m.creditNoteRevenue||0)}. Extra/accessori: ${m.excludedRowsCount||0} righe, ${fmt(m.excludedRevenue||0)}.</p>${(m.excludedSummary||[]).length?`<ul>${(m.excludedSummary||[]).slice(0,5).map(x=>`<li>${esc(x.name)} · ${fmt(x.revenue)}</li>`).join('')}</ul>`:''}</div>
        <div class="v61-note ${m.anomalyRowsCount?'warn':''}"><strong>Prezzi/importi da verificare</strong><p>${m.anomalyRowsCount||0} righe dove quantità × prezzo non coincide con importo. NOMYRA usa l'importo riga come valore reale, ma segnala la differenza.</p></div>
      </div>
      <div class="v60-products-panel"><div class="panel-head"><div><span class="section-label">MODELLI / PRODOTTI</span><h3>Prezzo medio e quantità venduta per prodotto</h3></div></div>
        <div class="v60-product-table"><table><thead><tr><th>Prodotto</th><th>Quantità venduta</th><th>Fatturato prodotto</th><th>Prezzo medio</th><th>Costo stimato</th><th>Margine stimato</th></tr></thead><tbody>${products.length?products.map(p=>`<tr class="${p.margin<0?'neg':''}"><td><strong>${esc(p.parts.label)}</strong>${p.parts.code?`<small>${esc(p.parts.code)}</small>`:''}</td><td>${p.qty?num(p.qty):'<span class="muted">Da leggere</span>'}</td><td>${fmt(p.revenue)}</td><td>${fmt(p.price)}</td><td>${fmt(costPerUnit)}</td><td>${p.margin==null?'—':`<b>${fmt(p.margin)}</b>`}</td></tr>`).join(''):'<tr><td colspan="6" class="empty-state">Carica un report vendite per vedere il dettaglio per prodotto.</td></tr>'}</tbody></table></div>
      </div>
      <div class="v60-season-box"><strong>Stagionalità</strong><p>${esc(season.text||'Configura i mesi stagionali nel profilo aziendale per leggere meglio vendite e proiezioni.')} ${seasonMonths?`Mesi indicati: ${esc(seasonMonths)}.`:''}</p></div>
    </div>`;
  }
  try{v60ProductivityHtml=v61ProductivityHtml;}catch(e){}

  const oldV61Answer=answerQuestion;
  answerQuestion=function(query){
    const s=String(query||'').toLowerCase();const rec=typeof currentProductivity==='function'?currentProductivity():null;const m=rec?.metrics||{};
    if(/prezzo\s+medio|media\s+prezzo|prezzi/.test(s)&&rec){
      return `Il prezzo medio prodotti non include pedane, timbri, ottone, spese e note credito. NOMYRA usa: fatturato prodotti ${fmt(m.productRevenue??m.totalRevenue)} / quantità prodotti ${num(m.productQty??m.totalQty||0)} = ${fmt(m.avgUnitPrice)}. Il fatturato netto del report, invece, è ${fmt(m.netSalesRevenue??m.totalRevenue)} e serve per il confronto con il bilancio.`;
    }
    if(/nc|nota credito|rettific/.test(s)&&rec){
      return `Ho separato ${m.creditNotesCount||0} righe di note credito/rettifiche per ${fmt(m.creditNoteRevenue||0)}. Non entrano nel prezzo medio dei prodotti, ma restano nel fatturato netto del report per riconciliare con il bilancio.`;
    }
    if(/pedan|timbro|ottone|accessor|extra/.test(s)&&rec){
      return `Le righe extra/accessorie escluse dal prezzo medio sono ${m.excludedRowsCount||0}, per ${fmt(m.excludedRevenue||0)}. Servono per il fatturato totale, ma non devono alterare il prezzo medio dei modelli prodotti.`;
    }
    return oldV61Answer(query);
  };

  const css=document.createElement('style');css.textContent=`.v61-split-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}.v61-note{border:1px solid var(--line);border-radius:14px;padding:14px;background:#f8fbfa}.v61-note.warn{border-color:#e3b6a8;background:#fff7f4}.v61-note p{margin:.35rem 0;color:var(--muted)}.v61-note ul{margin:8px 0 0 18px;color:var(--muted)}@media(max-width:900px){.v61-split-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  console.info('NOMYRA Finance V61 loaded: clean average price excluding NC/accessories/pallets/stamps/ottone, product quantities and anomaly checks.');
})();

/* ================================
   NOMYRA Finance V62
   Dettaglio cliccabile prodotto → clienti, quantità, prezzo medio, costo e margine
   - Ogni riga prodotto apre una finestra con dettaglio per cliente.
   - Il worker salva productClientDetails per i nuovi report caricati.
   - Evidenzia dove si perde margine per cliente/prodotto.
   ================================ */
(function(){
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const hasVal=v=>Number.isFinite(Number(v));
  const norm=s=>String(s||'').trim();
  const money=v=>hasVal(v)?fmt(Number(v)):'—';
  const qtyFmt=v=>hasVal(v)?num(Number(v)):'—';

  const prevWorker = window.v57ProductivityWorkerScript || (typeof v57ProductivityWorkerScript==='function'?v57ProductivityWorkerScript:null);
  function v62ProductivityWorkerScript(){
    let src = prevWorker ? String(prevWorker()) : '';
    if(!src || src.includes('productClientDetails')) return src;
    src = src.replace(
      "const products=aggregate(productRows,'product',productRevenue);",
      `const products=aggregate(productRows,'product',productRevenue);\n      const productClientDetails={};\n      for(const pr of productRows){\n        const pk=String(pr.product||'Non specificato').trim()||'Non specificato';\n        const ck=String(pr.customer||'Non specificato').trim()||'Non specificato';\n        if(!productClientDetails[pk]) productClientDetails[pk]={product:pk,clients:{}};\n        const old=productClientDetails[pk].clients[ck]||{customer:ck,qty:0,revenue:0,lines:0,avgUnitPrice:null};\n        old.qty+=Number(pr.qty||0);\n        old.revenue+=Number(pr.revenue||0);\n        old.lines+=1;\n        old.avgUnitPrice=old.qty?old.revenue/old.qty:null;\n        productClientDetails[pk].clients[ck]=old;\n      }\n      for(const k in productClientDetails){\n        productClientDetails[k].clients=Object.values(productClientDetails[k].clients).sort((a,b)=>Math.abs(b.revenue)-Math.abs(a.revenue)).slice(0,80);\n      }`
    );
    src = src.replace('topProducts:products.slice(0,12),monthlyRevenue', 'topProducts:products.slice(0,12),productClientDetails,monthlyRevenue');
    src = src.replace('topProducts:products.slice(0,10),monthlyRevenue', 'topProducts:products.slice(0,10),productClientDetails,monthlyRevenue');
    return src;
  }
  if(prevWorker){
    window.v57ProductivityWorkerScript = v62ProductivityWorkerScript;
    try{ v57ProductivityWorkerScript = v62ProductivityWorkerScript; }catch(e){}
  }

  function currentProductivityRecord(){
    try{return typeof currentProductivity==='function'?currentProductivity():null;}catch(e){return null;}
  }
  function currentBil(rec){
    try{
      const c=rec?.company||state.selectedCompany,p=rec?.period||state.selectedPeriod;
      return (state.docs||[]).find(d=>profileKey(d.company)===profileKey(c)&&String(d.period)===String(p))||currentDoc();
    }catch(e){return null;}
  }
  function v62CostPerUnit(rec){
    const bil=currentBil(rec), x=bil?.data||{}, m=rec?.metrics||{};
    const keys=['openingInventoryChange','rawMaterials','services','vehicleCosts','externalLabor','leases','personnel','otherOperatingCosts','adminCommercialCosts'];
    const total=keys.reduce((a,k)=>a+Math.abs(Number(x[k]||0)),0);
    const units=Number(m.productQty||m.totalQty||0);
    return units?total/units:null;
  }
  function productParts(name){
    const parts=String(name||'').split(' · ');
    if(parts.length>1)return {label:parts[0],code:parts.slice(1).join(' · ')};
    return {label:name||'Non specificato',code:''};
  }
  function detailForProduct(metrics,productName){
    if(!metrics)return null;
    const details=metrics.productClientDetails||{};
    if(details[productName]) return details[productName];
    const alt=Object.keys(details).find(k=>String(k).toLowerCase()===String(productName).toLowerCase());
    if(alt) return details[alt];
    return null;
  }

  function ensureModal(){
    let modal=document.querySelector('#v62ProductDetailModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='v62ProductDetailModal';
    modal.className='v62-modal-backdrop';
    modal.innerHTML=`<div class="v62-modal" role="dialog" aria-modal="true" aria-labelledby="v62ProductTitle">
      <button type="button" class="v62-close" aria-label="Chiudi">×</button>
      <div id="v62ProductDetailContent"></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal || e.target.closest('.v62-close')) closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open')) closeModal();});
    return modal;
  }
  function closeModal(){document.querySelector('#v62ProductDetailModal')?.classList.remove('open');}

  function openProductDetail(productName){
    const rec=currentProductivityRecord(); const m=rec?.metrics||{}; const product=(m.topProducts||[]).find(p=>p.name===productName) || {name:productName};
    const detail=detailForProduct(m,productName); const cpu=v62CostPerUnit(rec); const pparts=productParts(productName);
    const modal=ensureModal(); const content=modal.querySelector('#v62ProductDetailContent');
    if(!detail || !Array.isArray(detail.clients) || !detail.clients.length){
      content.innerHTML=`<span class="section-label">DETTAGLIO PRODOTTO</span><h2 id="v62ProductTitle">${esc(pparts.label)}</h2>${pparts.code?`<p class="v62-sub">Codice: ${esc(pparts.code)}</p>`:''}<div class="v62-empty"><strong>Dettaglio clienti non ancora disponibile.</strong><p>Ricarica il report vendite con questa versione: NOMYRA salverà quantità, fatturato e prezzo medio per cliente dentro ogni prodotto.</p></div>`;
      modal.classList.add('open'); return;
    }
    const qty=n(product.qty || detail.clients.reduce((a,c)=>a+n(c.qty),0));
    const revenue=n(product.revenue || detail.clients.reduce((a,c)=>a+n(c.revenue),0));
    const avg=qty?revenue/qty:null; const marginUnit=(avg!=null&&cpu!=null)?avg-cpu:null; const marginTotal=(marginUnit!=null&&qty)?marginUnit*qty:null;
    const rows=detail.clients.map(c=>{const q=n(c.qty),rev=n(c.revenue),price=c.avgUnitPrice!=null?Number(c.avgUnitPrice):(q?rev/q:null),mu=(price!=null&&cpu!=null)?price-cpu:null,mt=(mu!=null&&q)?mu*q:null;return {...c,qty:q,revenue:rev,price,marginUnit:mu,marginTotal:mt};}).sort((a,b)=>n(a.marginTotal)-n(b.marginTotal));
    const negatives=rows.filter(r=>n(r.marginTotal)<0).slice(0,5);
    content.innerHTML=`<span class="section-label">DETTAGLIO PRODOTTO / CLIENTE</span>
      <h2 id="v62ProductTitle">${esc(pparts.label)}</h2>${pparts.code?`<p class="v62-sub">Codice: ${esc(pparts.code)}</p>`:''}
      <div class="v62-detail-kpis">
        <article><small>Quantità venduta</small><strong>${qtyFmt(qty)}</strong></article>
        <article><small>Fatturato prodotto</small><strong>${money(revenue)}</strong></article>
        <article><small>Prezzo medio</small><strong>${money(avg)}</strong></article>
        <article class="${marginUnit<0?'danger':marginUnit!=null?'ok':''}"><small>Margine unitario stimato</small><strong>${money(marginUnit)}</strong><span>${marginTotal!=null?`Margine totale: ${money(marginTotal)}`:'Costo da completare'}</span></article>
      </div>
      ${negatives.length?`<div class="v62-loss-box"><strong>Dove stiamo perdendo margine</strong><p>Questi clienti hanno prezzo medio sotto il costo unitario stimato.</p><ul>${negatives.map(r=>`<li><b>${esc(r.customer)}</b> · ${qtyFmt(r.qty)} unità · prezzo ${money(r.price)} · perdita stimata ${money(r.marginTotal)}</li>`).join('')}</ul></div>`:''}
      <div class="v62-table-wrap"><table class="v62-detail-table"><thead><tr><th>Cliente</th><th>Quantità fatturata</th><th>Fatturato</th><th>Prezzo medio</th><th>Costo stimato</th><th>Margine unitario</th><th>Utile / perdita stimata</th></tr></thead><tbody>${rows.map(r=>`<tr class="${n(r.marginTotal)<0?'neg':''}"><td><strong>${esc(r.customer)}</strong></td><td>${qtyFmt(r.qty)}</td><td>${money(r.revenue)}</td><td>${money(r.price)}</td><td>${money(cpu)}</td><td>${money(r.marginUnit)}</td><td><b>${money(r.marginTotal)}</b></td></tr>`).join('')}</tbody></table></div>
      <p class="v62-note">Nota: il costo è una stima media ottenuta dai costi operativi del bilancio divisi per le quantità vendute. Per margine industriale reale serve costo specifico per modello/cliente.</p>`;
    modal.classList.add('open');
  }

  function enhanceProductRows(){
    const rec=currentProductivityRecord(); const m=rec?.metrics||{}; const box=document.querySelector('#v60ProductivityDecision'); if(!box||!m.topProducts)return;
    const rows=[...box.querySelectorAll('.v60-product-table tbody tr')];
    (m.topProducts||[]).slice(0,rows.length).forEach((p,i)=>{
      const tr=rows[i]; if(!tr||tr.classList.contains('v62-product-row'))return;
      tr.classList.add('v62-product-row'); tr.tabIndex=0; tr.dataset.v62Product=p.name; tr.title='Apri dettaglio prodotto per cliente';
      const first=tr.querySelector('td'); if(first&&!first.querySelector('.v62-row-action')) first.insertAdjacentHTML('beforeend','<em class="v62-row-action">Apri dettaglio cliente →</em>');
    });
  }
  document.addEventListener('click',e=>{const tr=e.target.closest?.('.v62-product-row'); if(tr){e.preventDefault();openProductDetail(tr.dataset.v62Product);}});
  document.addEventListener('keydown',e=>{const tr=e.target.closest?.('.v62-product-row'); if(tr&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openProductDetail(tr.dataset.v62Product);}});

  const prevRender=renderProductivity;
  renderProductivity=function(){prevRender();try{enhanceProductRows();}catch(e){console.warn('V62 product details',e);}};

  const oldAnswer=answerQuestion;
  answerQuestion=function(query){
    const s=String(query||'').toLowerCase(); const rec=currentProductivityRecord(); const m=rec?.metrics||{}; const cpu=v62CostPerUnit(rec);
    if(/cliente.*prodotto|prodotto.*cliente|dove.*pers|perd(i|e)amo|margine.*cliente/.test(s)&&rec){
      const details=m.productClientDetails||{}; const losses=[];
      Object.keys(details).forEach(prod=>{(details[prod].clients||[]).forEach(c=>{const q=n(c.qty),rev=n(c.revenue),price=q?rev/q:null,mu=(price!=null&&cpu!=null)?price-cpu:null,mt=(mu!=null&&q)?mu*q:null;if(mt<0)losses.push({prod,customer:c.customer,qty:q,price,mt});});});
      losses.sort((a,b)=>a.mt-b.mt);
      return losses.length?`Principali perdite stimate per prodotto/cliente: ${losses.slice(0,5).map(x=>`${x.prod} con ${x.customer}: ${qtyFmt(x.qty)} unità, prezzo medio ${money(x.price)}, perdita stimata ${money(x.mt)}`).join(' · ')}. Apri il dettaglio cliccando sulla riga del prodotto.`:'Non vedo perdite stimate per cliente con i dati disponibili, oppure serve ricaricare il report con dettaglio clienti per prodotto.';
    }
    return oldAnswer(query);
  };

  const css=document.createElement('style');
  css.textContent=`.v62-product-row{cursor:pointer}.v62-product-row:hover{background:#eef8f6!important}.v62-product-row:focus{outline:3px solid rgba(31,90,93,.28);outline-offset:-3px}.v62-row-action{display:block;margin-top:5px;color:#1f5a5d;font-style:normal;font-size:12px;font-weight:900}.v62-modal-backdrop{position:fixed;inset:0;background:rgba(11,27,51,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:22px}.v62-modal-backdrop.open{display:flex}.v62-modal{background:#fff;border-radius:24px;max-width:1180px;width:min(1180px,96vw);max-height:88vh;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.28);padding:28px;position:relative}.v62-close{position:absolute;right:22px;top:18px;border:0;background:#f1f6f5;border-radius:14px;width:44px;height:44px;font-size:26px;cursor:pointer;color:#0b1b33}.v62-sub{color:#667881;margin-top:-4px}.v62-detail-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.v62-detail-kpis article{border:1px solid #dbe7e4;border-radius:18px;padding:16px;background:#f9fcfb}.v62-detail-kpis small{display:block;color:#6e7d85;text-transform:uppercase;font-size:11px;letter-spacing:.08em;font-weight:900}.v62-detail-kpis strong{display:block;font-size:24px;margin-top:6px}.v62-detail-kpis article.danger{background:#fff6f6;border-color:#e7b6b6}.v62-detail-kpis article.danger strong,.v62-detail-table tr.neg td:last-child{color:#b34242}.v62-detail-kpis article.ok{background:#f1fbf6;border-color:#cde8da}.v62-loss-box{border-left:5px solid #b34242;background:#fff7f7;border-radius:16px;padding:14px 16px;margin:16px 0}.v62-loss-box p{margin:4px 0;color:#60717a}.v62-loss-box ul{margin:8px 0 0 18px}.v62-table-wrap{overflow:auto;border:1px solid #dbe7e4;border-radius:18px}.v62-detail-table{width:100%;border-collapse:collapse}.v62-detail-table th{background:#f6f9f8;color:#6e7d85;text-align:left;text-transform:uppercase;letter-spacing:.07em;font-size:12px;padding:12px}.v62-detail-table td{border-top:1px solid #e5ece9;padding:12px}.v62-detail-table tr.neg{background:#fff8f8}.v62-note,.v62-empty{margin-top:14px;color:#60717a}.v62-empty{border:1px solid #dbe7e4;border-radius:18px;padding:18px;background:#f9fcfb}@media(max-width:900px){.v62-detail-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}.v62-modal{padding:20px}}@media(max-width:560px){.v62-detail-kpis{grid-template-columns:1fr}.v62-modal-backdrop{padding:8px}.v62-modal{width:100%;max-height:92vh}}`;
  document.head.appendChild(css);
  setTimeout(()=>{try{if(document.querySelector('#productivity.view.active'))enhanceProductRows();}catch(e){}},600);
  console.info('NOMYRA Finance V62 loaded: clickable product details by client with margin/profit-loss analysis.');
})();

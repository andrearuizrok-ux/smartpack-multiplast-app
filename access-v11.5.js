/* V11.9.19 · ADAPTIVE VERTICAL CENTERING — center when space allows */
/* V11.9.18 · ADAPTIVE VIEWPORT RESPONSIVE — desktop/laptop/tablet */
/* V11.9.17 · OFFICE SELECTOR VIEWPORT FIT — fix taglio superiore */
/* V11.9.16 · VISUAL POLISH NOMYRA FINANCE — nessuna modifica funzionale */

/* ========================================================================
   V11.9.14 · NOMYRA FINANCE — MODULO SEPARATO
   Accesso dal selettore aree ufficio + collegamento dall'area
   Economico-finanziario. Apertura in nuova scheda.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPNomyraFinanceModuleV11914)return;

  const FINANCE_URL='https://nomyra-finance.pages.dev/';
  const $=(s,r=document)=>r.querySelector(s);

  function moduleHTML(){
    return `
      <section class="v11914-modules" data-v11914-modules>
        <div class="v11914-modules-label">
          <span>MODULI NOMYRA</span>
          <small>Strumenti specialistici collegati alla piattaforma operativa</small>
        </div>
        <a class="v11914-finance-card" href="${FINANCE_URL}" target="_blank" rel="noopener noreferrer">
          <div class="v11914-finance-mark">NF</div>
          <div class="v11914-finance-copy">
            <span>NOMYRA FINANCE</span>
            <b>Analisi finanziaria avanzata</b>
            <p>Bilanci, indicatori, trend, confronti e report economico-finanziari approfonditi.</p>
          </div>
          <div class="v11914-finance-open">
            <small>Modulo separato</small>
            <strong>Apri Finance ↗</strong>
          </div>
        </a>
      </section>`;
  }

  function injectOfficeModule(){
    const panel=$('.poi115-portal-panel');
    const grid=$('.poi115-office-grid',panel);
    if(!panel||!grid||$('[data-v11914-modules]',panel))return;
    const note=$('.poi115-lock-note',panel);
    if(note)note.insertAdjacentHTML('beforebegin',moduleHTML());
    else grid.insertAdjacentHTML('afterend',moduleHTML());
  }

  function financeBannerHTML(){
    return `
      <section class="v11914-finance-banner" data-v11914-finance-banner>
        <div class="v11914-finance-banner-mark">NF</div>
        <div class="v11914-finance-banner-copy">
          <span>ANALISI FINANZIARIA AVANZATA</span>
          <b>Approfondisci il bilancio in NOMYRA Finance</b>
          <p>Analisi dettagliate, confronti, trend e report oltre alla lettura operativa integrata in questa piattaforma.</p>
        </div>
        <a href="${FINANCE_URL}" target="_blank" rel="noopener noreferrer">Apri NOMYRA Finance ↗</a>
      </section>`;
  }

  function injectFinanceBanner(){
    const view=$('#adminFinanceV1170View');
    if(!view?.classList.contains('active')||$('[data-v11914-finance-banner]',view))return;
    const hero=$('.v1170-fin-hero',view);
    if(hero)hero.insertAdjacentHTML('afterend',financeBannerHTML());
    else view.insertAdjacentHTML('afterbegin',financeBannerHTML());
  }

  function injectStyles(){
    if($('#v11914FinanceModuleStyles'))return;
    const st=document.createElement('style');
    st.id='v11914FinanceModuleStyles';
    st.textContent=`
      .v11914-modules{
        margin-top:21px;
        padding-top:18px;
        border-top:1px solid #dfe8eb
      }
      .v11914-modules-label{
        display:flex;
        align-items:baseline;
        justify-content:space-between;
        gap:14px;
        padding:0 3px 10px
      }
      .v11914-modules-label>span{
        font-size:9.5px;
        line-height:1;
        font-weight:950;
        letter-spacing:.12em;
        color:#1f5e78
      }
      .v11914-modules-label>small{
        font-size:9.5px;
        color:#748892;
        text-align:right;
        line-height:1.35
      }
      .v11914-finance-card{
        display:grid;
        grid-template-columns:auto 1fr auto;
        gap:17px;
        align-items:center;
        text-decoration:none;
        color:inherit;
        padding:17px 18px;
        border:1px solid #c8dbe2;
        border-radius:18px;
        background:
          radial-gradient(circle at 88% 18%,rgba(185,120,80,.13),transparent 25%),
          linear-gradient(135deg,#ffffff 0%,#f8fbfc 66%,#fdf9f6 100%);
        box-shadow:0 6px 18px rgba(23,57,74,.045);
        transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease
      }
      .v11914-finance-card:hover{
        transform:translateY(-2px);
        border-color:#8fb2c0;
        box-shadow:0 14px 30px rgba(23,57,74,.10)
      }
      .v11914-finance-mark{
        width:50px;
        height:50px;
        border-radius:15px;
        display:grid;
        place-items:center;
        background:linear-gradient(145deg,#143548,#1f5e78);
        color:#fff;
        font-size:13px;
        font-weight:950;
        letter-spacing:.04em;
        box-shadow:0 8px 20px rgba(23,57,74,.17)
      }
      .v11914-finance-copy>span{
        display:block;
        font-size:8.5px;
        font-weight:950;
        letter-spacing:.09em;
        color:#b97850;
        margin:0 0 4px
      }
      .v11914-finance-copy>b{
        display:block;
        font-size:14.5px;
        line-height:1.25;
        color:#17303c
      }
      .v11914-finance-copy>p{
        margin:5px 0 0;
        color:#617781;
        font-size:10.5px;
        line-height:1.5
      }
      .v11914-finance-open{
        text-align:right;
        min-width:136px;
        display:grid;
        justify-items:end;
        gap:6px
      }
      .v11914-finance-open small{
        display:block;
        color:#81939b;
        font-size:8.5px
      }
      .v11914-finance-open strong{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:34px;
        padding:8px 12px;
        border-radius:10px;
        background:#17394a;
        color:#fff;
        font-size:10px;
        font-weight:900;
        white-space:nowrap;
        box-shadow:0 5px 14px rgba(23,57,74,.13)
      }
      .v11914-finance-card:hover .v11914-finance-open strong{
        background:#1f5e78
      }
      .v11915-structural-finance{margin-top:18px!important}
      .v11915-structural-finance .v11914-finance-card{min-height:86px}

      /* V11.9.17 · OFFICE SELECTOR VIEWPORT FIT
         Evita il taglio superiore quando il contenuto supera l'altezza viewport. */
      #poi113CompanyGate.poi115-office-menu-mode{
        overflow-y:auto!important;
        overflow-x:hidden!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
        justify-content:center!important;
        min-height:100vh!important;
        height:auto!important;
        padding-top:24px!important;
        padding-bottom:26px!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
        margin-top:0!important;
        margin-bottom:0!important;
      }
      @media(max-height:780px) and (min-width:1051px){
        #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
          justify-content:flex-start!important;
          padding-top:12px!important;
          padding-bottom:16px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
          align-items:start!important;
        }
      }

      /* V11.9.18 · ADAPTIVE OFFICE LAYOUT
         Responsive reale per larghezza + altezza viewport. */
      #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
        width:min(1520px,calc(100% - clamp(20px,3vw,56px)))!important;
        min-height:100dvh!important;
        padding:clamp(14px,2.4vh,30px) clamp(16px,2.1vw,32px) clamp(16px,2.4vh,30px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
        grid-template-columns:minmax(290px,.82fr) minmax(520px,1.18fr)!important;
        gap:clamp(22px,2.8vw,46px)!important;
        align-items:center!important;
      }
      @media (min-width:900px) and (min-height:781px){
        #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
          justify-content:center!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
          align-items:center!important;
        }
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy{
        padding:clamp(8px,1.6vh,18px) 6px!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-kicker{
        padding:clamp(6px,1vh,8px) 12px!important;
        font-size:clamp(9px,.65vw,10px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy h3{
        font-size:clamp(34px,3.15vw,48px)!important;
        line-height:1.04!important;
        margin:clamp(12px,2vh,22px) 0 clamp(9px,1.5vh,16px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy>p{
        font-size:clamp(13px,1.05vw,16px)!important;
        line-height:1.55!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-points{
        gap:clamp(6px,1vh,10px)!important;
        margin-top:clamp(14px,2.2vh,28px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-point{
        font-size:clamp(10.5px,.82vw,12px)!important;
        line-height:1.42!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-panel{
        padding:clamp(13px,1.8vh,22px)!important;
        border-radius:clamp(22px,2vw,30px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-panel-title{
        margin-bottom:clamp(8px,1.5vh,16px)!important;
        gap:12px!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-panel-title b{
        font-size:clamp(13px,.95vw,15px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-panel-title span{
        font-size:clamp(8.5px,.65vw,10px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-grid{
        gap:clamp(9px,1.25vh,14px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card{
        min-height:clamp(155px,21.5vh,230px)!important;
        padding:clamp(14px,1.9vh,21px)!important;
        border-radius:clamp(17px,1.6vw,22px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card .role{
        width:clamp(40px,5.3vh,48px)!important;
        height:clamp(40px,5.3vh,48px)!important;
        margin-bottom:clamp(9px,1.5vh,14px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card b{
        font-size:clamp(15px,1.25vw,18px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card span:not(.role){
        font-size:clamp(10px,.78vw,11.5px)!important;
        line-height:1.45!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card em{
        font-size:clamp(9px,.72vw,10.5px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-modules{
        margin-top:clamp(11px,1.8vh,21px)!important;
        padding-top:clamp(10px,1.7vh,18px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-modules-label{
        padding-bottom:clamp(6px,1vh,10px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-finance-card{
        min-height:clamp(68px,9.5vh,86px)!important;
        padding:clamp(11px,1.55vh,17px) clamp(13px,1.2vw,18px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-finance-mark{
        width:clamp(42px,5.6vh,50px)!important;
        height:clamp(42px,5.6vh,50px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-finance-copy>b{
        font-size:clamp(12.5px,.95vw,14.5px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .v11914-finance-copy>p{
        font-size:clamp(9px,.72vw,10.5px)!important;
      }
      #poi113CompanyGate.poi115-office-menu-mode .poi115-lock-note{
        margin-top:clamp(8px,1.2vh,12px)!important;
        padding:clamp(8px,1.05vh,11px) 12px!important;
        font-size:clamp(8.5px,.65vw,10px)!important;
      }

      @media (min-width:900px) and (max-width:1050px){
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
          grid-template-columns:minmax(260px,.72fr) minmax(500px,1.28fr)!important;
          gap:22px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy h3{
          font-size:34px!important;
        }
      }

      @media (min-width:900px) and (max-height:780px){
        #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
          justify-content:flex-start!important;
          padding-top:10px!important;
          padding-bottom:12px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
          align-items:start!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy h3{
          font-size:clamp(32px,2.8vw,42px)!important;
          margin-top:10px!important;
          margin-bottom:8px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-points{
          margin-top:12px!important;
          gap:5px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card{
          min-height:150px!important;
          padding:13px 15px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card .role{
          width:40px!important;
          height:40px!important;
          margin-bottom:8px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .v11914-modules{
          margin-top:9px!important;
          padding-top:9px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .v11914-finance-card{
          min-height:66px!important;
          padding:10px 13px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-lock-note{
          margin-top:7px!important;
          padding:7px 10px!important;
        }
      }

      @media (max-width:899px){
        #poi113CompanyGate.poi115-office-menu-mode .poi113-card{
          width:min(760px,calc(100% - 20px))!important;
          padding:16px 12px 24px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-shell{
          grid-template-columns:1fr!important;
          gap:18px!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy{
          padding:4px 2px 0!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-portal-copy h3{
          font-size:clamp(30px,6vw,39px)!important;
        }
        #poi113CompanyGate.poi115-office-menu-mode .poi115-office-card{
          min-height:165px!important;
        }
      }



      .v11914-finance-banner{display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;margin:10px 0 12px;padding:12px 14px;border:1px solid #d6e3e7;border-radius:14px;background:linear-gradient(135deg,#f8fbfc,#fff)}
      .v11914-finance-banner-mark{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#17394a;color:#fff;font-size:10px;font-weight:950}
      .v11914-finance-banner-copy>span{display:block;font-size:7.5px;font-weight:950;letter-spacing:.07em;color:#b97850}
      .v11914-finance-banner-copy>b{display:block;font-size:11.5px;color:#18323f;margin-top:2px}
      .v11914-finance-banner-copy>p{margin:3px 0 0;color:#6c8089;font-size:9px;line-height:1.4}
      .v11914-finance-banner>a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 11px;border:1px solid #cfdfe4;border-radius:10px;background:#fff;color:#1f5e78;text-decoration:none;font-size:9.5px;font-weight:900;white-space:nowrap}
      .v11914-finance-banner>a:hover{border-color:#8fb7c7;box-shadow:0 5px 14px rgba(23,57,74,.07)}

      @media(max-width:900px){
        .v11914-finance-card,.v11914-finance-banner{grid-template-columns:auto 1fr}
        .v11914-finance-open,.v11914-finance-banner>a{
          grid-column:1/-1;
          text-align:left;
          justify-self:start
        }
        .v11914-finance-open{
          justify-items:start;
          min-width:0
        }
        .v11914-finance-open small{display:none}
        .v11914-modules-label{display:block}
        .v11914-modules-label>small{
          display:block;
          text-align:left;
          margin-top:5px
        }
      }
      @media(max-width:620px){
        .v11914-modules{margin-top:18px;padding-top:16px}
        .v11914-finance-card{
          grid-template-columns:auto 1fr;
          padding:15px;
          gap:13px
        }
        .v11914-finance-mark{
          width:44px;
          height:44px;
          border-radius:13px
        }
        .v11914-finance-copy>b{font-size:14px}
        .v11914-finance-copy>p{font-size:11px}
        .v11914-finance-open{
          grid-column:1/-1;
          width:100%
        }
        .v11914-finance-open strong{
          font-size:11px;
          min-height:36px
        }
      }
    `;
    document.head.appendChild(st);
  }

  function refresh(){injectStyles();injectOfficeModule();injectFinanceBanner()}

  function boot(){
    refresh();
    [150,400,900,1800,3200].forEach(ms=>setTimeout(refresh,ms));
    const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pageshow',()=>setTimeout(refresh,0),{passive:true});
    window.addEventListener('focus',()=>setTimeout(refresh,0),{passive:true});
  }

  window.SPNomyraFinanceModuleV11914={refresh,url:FINANCE_URL,version:'V11.9.14'};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();



/* ========================================================================
   V11.9.13 · DETTAGLIO FINANZIARIO UNIFICATO
   Analisi gestionale + composizione contabile nello stesso click.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPFinanceUnifiedV11913)return;

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(num(v))}%`;

  let context={metric:'',company:'group',period:'',tab:'analysis'};
  let compositionHTML='';

  const companyLabel=c=>c==='smartpack'?'Smart Pack':c==='multiplast'?'Multiplast':'Gruppo';

  function clarity(){return window.SPFinanceClarityV1199||null}

  function derived(){
    const c=clarity();if(!c)return null;
    return context.company==='group'
      ? c.groupDerived?.(context.period)
      : c.derived?.(context.company,context.period);
  }

  function metricKey(){
    return context.metric.startsWith('cat:')?context.metric.slice(4):context.metric;
  }

  function metricInfo(){
    const k=metricKey();
    const map={
      sales:{
        title:'Ricavi vendite / fatturato',
        meaning:'Sono i ricavi generati dalla vendita di prodotti e servizi. Non comprendono variazioni di rimanenze o altri ricavi operativi.',
        formula:'Conti SPRING 70.*',
        why:'Permettono di distinguere il vero fatturato dal valore complessivo della produzione.'
      },
      production:{
        title:'Valore della produzione',
        meaning:'Rappresenta il valore complessivo generato dall’attività operativa del periodo.',
        formula:'Ricavi vendite + variazione rimanenze + altri ricavi operativi',
        why:'È la base utilizzata per leggere correttamente il margine operativo quando il bilancio include rimanenze e altri ricavi.'
      },
      ebitda:{
        title:'EBITDA',
        meaning:'Misura il risultato della gestione operativa prima di ammortamenti, oneri finanziari e imposte.',
        formula:'Valore della produzione − costi operativi',
        why:'Aiuta a capire se l’attività caratteristica dell’azienda genera margine.'
      },
      ebit:{
        title:'EBIT',
        meaning:'È il risultato operativo dopo aver considerato anche gli ammortamenti.',
        formula:'EBITDA − ammortamenti',
        why:'Mostra se la gestione operativa resta positiva dopo il costo economico degli investimenti.'
      },
      margin:{
        title:'Margine EBITDA / Valore produzione',
        meaning:'Indica quale percentuale del valore della produzione rimane come EBITDA.',
        formula:'EBITDA ÷ Valore della produzione × 100',
        why:'Permette di confrontare la redditività operativa tra periodi diversi.'
      },
      materials:{
        title:'Materie / acquisti',
        meaning:'Comprende materie prime, merci e acquisti operativi classificati in questa categoria.',
        formula:'Somma delle righe SPRING associate a Materie / acquisti',
        why:'Consente di capire quanto gli acquisti incidono sul valore generato dall’azienda.'
      },
      personnel:{
        title:'Personale',
        meaning:'Comprende retribuzioni, contributi, TFR e gli altri costi del personale classificati nel bilancio.',
        formula:'Somma delle righe SPRING associate al Personale',
        why:'Permette di leggere il peso del costo del lavoro rispetto al valore prodotto dall’azienda.'
      },
      energy:{
        title:'Energia',
        meaning:'Comprende energia elettrica, gas, acqua e altre utenze produttive classificate.',
        formula:'Somma delle righe SPRING associate a Energia',
        why:'Aiuta a monitorare l’incidenza delle utenze sulla gestione operativa.'
      },
      transport:{
        title:'Trasporti',
        meaning:'Comprende trasporto, spedizioni e altri costi logistici classificati.',
        formula:'Somma delle righe SPRING associate a Trasporti',
        why:'Consente di verificare quanto la logistica incide sul risultato operativo.'
      },
      otherOpex:{
        title:'Altri costi operativi',
        meaning:'Raccoglie i costi operativi che non rientrano nelle categorie principali.',
        formula:'Somma delle righe SPRING associate agli altri costi operativi',
        why:'Aiuta a individuare spese generali e servizi che possono comprimere il margine.'
      },
      depreciation:{
        title:'Ammortamenti',
        meaning:'Sono la quota di costo attribuita nel periodo agli investimenti e ai beni pluriennali.',
        formula:'Somma delle righe SPRING associate agli Ammortamenti',
        why:'Spiegano la differenza tra EBITDA ed EBIT e il peso della struttura produttiva sul risultato.'
      },
      receivables:{
        title:'Crediti clienti',
        meaning:'Sono gli importi ancora da incassare dai clienti alla data del bilancio.',
        formula:'Somma delle righe SPRING associate ai Crediti clienti',
        why:'Vanno letti insieme alle scadenze e ai tempi effettivi di incasso.'
      },
      payables:{
        title:'Debiti fornitori',
        meaning:'Sono gli importi ancora dovuti ai fornitori alla data del bilancio.',
        formula:'Somma delle righe SPRING associate ai Debiti fornitori',
        why:'Vanno confrontati con liquidità, crediti e calendario delle scadenze.'
      },
      cash:{
        title:'Liquidità',
        meaning:'Rappresenta la disponibilità rilevata su banche e cassa.',
        formula:'Somma delle righe SPRING associate a Liquidità',
        why:'Aiuta a valutare la capacità immediata di sostenere pagamenti e scadenze.'
      },
      inventory:{
        title:'Rimanenze',
        meaning:'Rappresentano il valore delle rimanenze rilevate nel bilancio.',
        formula:'Somma delle righe SPRING associate a Rimanenze',
        why:'Incidono sul valore della produzione e sul capitale assorbito dal ciclo operativo.'
      },
      financialCharges:{
        title:'Oneri finanziari',
        meaning:'Comprendono interessi passivi, commissioni e altri costi finanziari.',
        formula:'Somma delle righe SPRING associate agli Oneri finanziari',
        why:'Mostrano quanto la struttura finanziaria pesa sul risultato dell’azienda.'
      }
    };
    return map[k]||{title:'Indicatore',meaning:'',formula:'',why:''};
  }

  function valueOf(z){
    if(!z)return 0;
    const k=metricKey();
    if(k==='sales')return num(z.salesRevenue);
    if(k==='production')return num(z.productionValue);
    if(k==='ebitda')return num(z.ebitda);
    if(k==='ebit')return num(z.ebit);
    if(k==='margin')return num(z.marginProduction);
    return num(z.record?.[k]);
  }

  function analysisStatus(z){
    const k=metricKey(),v=valueOf(z),prod=num(z?.productionValue);
    if(!z?.configured)return {cls:'neutral',title:'Dato non disponibile',text:'Non ci sono dati sufficienti per interpretare questo indicatore.'};

    if(k==='ebitda'){
      if(v<0)return {cls:'risk',title:'Gestione operativa negativa',text:'Il valore della produzione non copre i costi operativi del periodo.'};
      if(num(z.marginProduction)<5)return {cls:'watch',title:'Margine positivo ma contenuto',text:'L’EBITDA è positivo, ma il margine operativo è ridotto rispetto al valore della produzione.'};
      return {cls:'good',title:'Gestione operativa positiva',text:'L’attività caratteristica genera margine prima di ammortamenti, oneri finanziari e imposte.'};
    }
    if(k==='ebit'){
      if(v<0&&num(z.ebitda)>0)return {cls:'watch',title:'EBIT negativo dopo gli ammortamenti',text:'La gestione produce EBITDA positivo, ma l’impatto degli ammortamenti porta il risultato operativo sotto zero.'};
      if(v<0)return {cls:'risk',title:'Risultato operativo negativo',text:'Il risultato operativo del periodo è negativo.'};
      return {cls:'good',title:'Risultato operativo positivo',text:'Dopo gli ammortamenti il risultato operativo resta positivo.'};
    }
    if(k==='margin'){
      if(v<5)return {cls:'watch',title:'Margine da monitorare',text:'Il margine EBITDA rispetto al valore della produzione è contenuto.'};
      if(v<10)return {cls:'watch',title:'Margine positivo',text:'Il margine è positivo, ma conviene confrontarlo con i periodi precedenti.'};
      return {cls:'good',title:'Margine operativo favorevole',text:'Il margine EBITDA è positivo rispetto al valore della produzione.'};
    }
    if(['materials','personnel','energy','transport','otherOpex','depreciation'].includes(k) && prod>0){
      const incidence=v/prod*100;
      return {cls:'neutral',title:`Incidenza sul valore della produzione: ${pct(incidence)}`,text:'L’incidenza da sola non indica se il costo è alto o basso: va confrontata con esercizio precedente, volumi prodotti e struttura dell’azienda.'};
    }
    if(k==='receivables')return {cls:'neutral',title:'Dato da leggere con le scadenze',text:'Crediti elevati possono essere normali se sono recenti; diventano critici se gli incassi sono in ritardo.'};
    if(k==='payables')return {cls:'neutral',title:'Dato da leggere con liquidità e scadenze',text:'Il totale dei debiti non basta: conta soprattutto quando devono essere pagati e quali incassi sono attesi.'};
    if(k==='cash')return {cls:'neutral',title:'Disponibilità immediata',text:'La liquidità va confrontata con le scadenze di breve periodo, non valutata isolatamente.'};
    return {cls:'neutral',title:'Lettura del dato',text:'Confronta il valore con i periodi precedenti e usa la composizione per verificare quali voci spiegano il totale.'};
  }

  function checks(){
    const k=metricKey();
    const map={
      sales:['Il fatturato è cresciuto rispetto allo stesso periodo precedente?','La variazione deriva da volumi, prezzi o mix clienti/prodotti?'],
      production:['Quanto del valore deriva da vendite reali e quanto da rimanenze?','La variazione delle rimanenze è coerente con produzione e magazzino?'],
      ebitda:['Quali costi operativi incidono maggiormente sul margine?','I prezzi di vendita stanno coprendo materia, energia, personale e trasporti?'],
      ebit:['Quanto incidono gli ammortamenti sul risultato?','Il risultato negativo è legato a investimenti recenti o a margini insufficienti?'],
      margin:['Il margine sta migliorando o peggiorando rispetto ai periodi precedenti?','Quali costi stanno crescendo più velocemente del valore della produzione?'],
      materials:['Il costo delle materie cresce in linea con produzione e vendite?','Ci sono variazioni di prezzo dei fornitori o consumi anomali?'],
      personnel:['Il costo del personale cresce in linea con produzione e ricavi?','Ci sono componenti straordinarie, premi, TFR o variazioni di organico che spiegano il dato?'],
      energy:['Il consumo/costo energia è coerente con ore macchina e volumi prodotti?','Ci sono aumenti tariffari o picchi anomali?'],
      transport:['I trasporti crescono in linea con consegne e fatturato?','Ci sono spedizioni straordinarie o clienti/zone più costose?'],
      otherOpex:['Quali sottovoci spiegano la maggior parte del totale?','Ci sono costi non ricorrenti o straordinari?'],
      depreciation:['Quali investimenti generano la quota di ammortamento?','Quanto cambia l’EBIT rispetto all’EBITDA per questo effetto?'],
      receivables:['Quali crediti sono già scaduti?','Qual è il tempo medio di incasso dei principali clienti?'],
      payables:['Quali debiti scadono nei prossimi 30-60 giorni?','Gli incassi previsti coprono le scadenze?'],
      cash:['La liquidità copre le scadenze immediate?','Quanto dipende l’equilibrio dagli incassi clienti attesi?'],
      inventory:['Le rimanenze stanno aumentando più delle vendite?','Il valore è coerente con le giacenze fisiche e il ritmo produttivo?'],
      financialCharges:['Gli oneri finanziari stanno crescendo rispetto al periodo precedente?','Quali linee di credito o commissioni spiegano il totale?']
    };
    return map[k]||['Il dato è coerente con il periodo precedente?','Ci sono componenti non ricorrenti che lo stanno influenzando?'];
  }

  function ensureDialog(){
    if($('#financeUnifiedV11913Dialog'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <dialog id="financeUnifiedV11913Dialog" class="v11913-dialog">
        <div class="modal-head">
          <div>
            <span class="eyebrow">ECONOMICO-FINANZIARIO · DETTAGLIO</span>
            <h3 id="financeUnifiedV11913Title">Indicatore</h3>
            <p id="financeUnifiedV11913Sub"></p>
          </div>
          <button class="close" type="button" onclick="document.getElementById('financeUnifiedV11913Dialog').close()">×</button>
        </div>
        <div class="v11913-tabs">
          <button type="button" data-v11913-tab="analysis">Analisi</button>
          <button type="button" data-v11913-tab="composition">Composizione del totale</button>
        </div>
        <div class="modal-body" id="financeUnifiedV11913Body"></div>
        <div class="modal-actions">
          <button class="btn" type="button" onclick="document.getElementById('financeUnifiedV11913Dialog').close()">Chiudi</button>
        </div>
      </dialog>`);
    document.querySelectorAll('[data-v11913-tab]').forEach(b=>{
      b.onclick=()=>{context.tab=b.dataset.v11913Tab;render()}
    });
  }

  function analysisHTML(){
    const z=derived(),info=metricInfo(),status=analysisStatus(z);
    const v=valueOf(z),display=metricKey()==='margin'?pct(v):money(v);
    return `
      <div class="v11913-value">
        <span>${esc(info.title)}</span>
        <b>${esc(display)}</b>
      </div>
      <div class="v11913-info-grid">
        <section><span>Cosa significa</span><p>${esc(info.meaning)}</p></section>
        <section><span>Formula</span><p><b>${esc(info.formula)}</b></p></section>
        <section class="full"><span>Perché è utile</span><p>${esc(info.why)}</p></section>
      </div>
      <div class="v11913-status ${status.cls}">
        <b>${esc(status.title)}</b>
        <span>${esc(status.text)}</span>
      </div>
      <div class="v11913-checks">
        <b>Cosa controllare</b>
        ${checks().map(x=>`<div><i>✓</i><span>${esc(x)}</span></div>`).join('')}
      </div>
      <div class="v11913-disclaimer">
        Analisi gestionale interna. Le indicazioni aiutano a leggere i dati ma non sostituiscono bilancio ufficiale o valutazione del commercialista.
      </div>`;
  }

  function captureComposition(){
    const c=clarity();
    if(!c?.open)return '<div class="empty"><b>Composizione non disponibile</b></div>';
    try{
      c.open(context.metric,context.company,context.period);
      const dlg=$('#financeCompositionV1199Dialog');
      const body=$('#financeCompositionV1199Body');
      const html=body?.innerHTML||'<div class="empty"><b>Composizione non disponibile</b></div>';
      if(dlg?.open)dlg.close();
      return html;
    }catch(_){
      return '<div class="empty"><b>Composizione non disponibile</b></div>';
    }
  }

  function render(){
    ensureDialog();
    const info=metricInfo();
    $('#financeUnifiedV11913Title').textContent=info.title;
    $('#financeUnifiedV11913Sub').textContent=`${companyLabel(context.company)} · ${context.period}`;
    document.querySelectorAll('[data-v11913-tab]').forEach(b=>b.classList.toggle('active',b.dataset.v11913Tab===context.tab));
    const body=$('#financeUnifiedV11913Body');
    if(context.tab==='analysis'){
      body.innerHTML=analysisHTML();
    }else{
      if(!compositionHTML)compositionHTML=captureComposition();
      body.innerHTML=compositionHTML;
    }
  }

  function open(metric,company='group',period=''){
    context={metric,company,period:period||document.getElementById('financePeriodV1170')?.value||'',tab:'analysis'};
    compositionHTML='';
    ensureDialog();render();
    try{$('#financeUnifiedV11913Dialog').showModal()}catch(_){}
  }

  function bind(){
    if(document.documentElement.dataset.v11913ClickBound==='1')return;
    document.documentElement.dataset.v11913ClickBound='1';
    // Registrato prima del listener V11.9.9 perché questa patch è in testa al file.
    document.addEventListener('click',e=>{
      const t=e.target.closest?.('.v1199-target');if(!t)return;
      const metric=t.dataset.v1199Metric,company=t.dataset.v1199Company||'group',period=t.dataset.v1199Period||'';
      if(!metric)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      open(metric,company,period);
    },true);
  }

  function injectStyles(){
    if($('#v11913Styles'))return;
    const st=document.createElement('style');st.id='v11913Styles';
    st.textContent=`
      .v11913-dialog{width:min(980px,96vw);max-height:92vh}
      .v11913-tabs{display:flex;gap:7px;padding:0 22px 11px;border-bottom:1px solid #e3ebee}
      .v11913-tabs button{border:1px solid #d4e2e6;background:#fff;border-radius:999px;padding:9px 14px;font:inherit;font-size:11px;font-weight:900;color:#5d727c;cursor:pointer}
      .v11913-tabs button.active{background:#173f54;color:#fff;border-color:#173f54}
      .v11913-value{padding:16px 18px;border:1px solid #d9e6ea;border-radius:14px;background:#f7fafb}
      .v11913-value span{display:block;font-size:10px;font-weight:900;color:#70838c;text-transform:uppercase;letter-spacing:.05em}
      .v11913-value b{display:block;margin-top:5px;font-size:31px;color:#142f3b}
      .v11913-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
      .v11913-info-grid section{padding:12px 13px;border:1px solid #e0e9ec;border-radius:12px;background:#fff}
      .v11913-info-grid section.full{grid-column:1/-1}
      .v11913-info-grid section>span{font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;color:#73858e}
      .v11913-info-grid p{margin:5px 0 0;font-size:12.5px;line-height:1.55;color:#455c66}
      .v11913-status{margin-top:10px;padding:13px 14px;border:1px solid #dce6e9;border-radius:12px;background:#f7fafb}
      .v11913-status b,.v11913-status span{display:block}.v11913-status b{font-size:13px}.v11913-status span{font-size:12.5px;line-height:1.5;margin-top:4px;color:#4f6670}
      .v11913-status.good{background:#eef9f4;border-color:#c6e5d4}.v11913-status.good b{color:#247258}
      .v11913-status.watch{background:#fff8e9;border-color:#efd9a8}.v11913-status.watch b{color:#8c611a}
      .v11913-status.risk{background:#fff4f4;border-color:#efc7ca}.v11913-status.risk b{color:#a72f38}
      .v11913-checks{margin-top:13px}.v11913-checks>b{font-size:12px}
      .v11913-checks>div{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #edf2f3}
      .v11913-checks i{font-style:normal;color:#28795e}.v11913-checks span{font-size:12px;line-height:1.45;color:#516872}
      .v11913-disclaimer{margin-top:12px;padding-top:10px;border-top:1px solid #e5edef;font-size:10.5px;line-height:1.45;color:#7a8c94}
      #financeUnifiedV11913Dialog .v1199-hero b{font-size:28px}
      #financeUnifiedV11913Dialog .v1199-tr{font-size:10.5px}
      #financeUnifiedV11913Dialog .v1199-note{font-size:11px}
      @media(max-width:680px){
        .v11913-info-grid{grid-template-columns:1fr}.v11913-info-grid section.full{grid-column:auto}
        .v11913-value b{font-size:26px}.v11913-tabs{overflow-x:auto}
      }
    `;
    document.head.appendChild(st);
  }

  function boot(){injectStyles();ensureDialog();bind()}

  window.SPFinanceUnifiedV11913={open,render,version:'V11.9.13'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ========================================================================
   V11.9.12 · SALUTE AZIENDA — COMPACT + PAGINA SEPARATA
   Riduce il peso informativo della dashboard e sposta l'analisi completa
   in una vista dedicata.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPCompanyHealthCompactV11912)return;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(v||0))}%`;

  let previousView='adminFinanceV1170View';

  function health(scope='group',period=''){
    try{return window.SPCompanyHealthV11911?.health?.(scope,period)||null}catch(_){return null}
  }

  function currentPeriod(){
    return document.getElementById('financePeriodV1170')?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
  }

  function scopeName(s){return s==='smartpack'?'Smart Pack':s==='multiplast'?'Multiplast':'Gruppo'}

  function shortMessage(h){
    if(!h)return '';
    const m=h.metrics||{};
    if(m.ebitda>0 && m.ebit<0){
      const cashWatch=(m.cashCover!=null && m.cashCover<.35);
      return `EBITDA positivo, ma EBIT negativo per l'impatto degli ammortamenti.${cashWatch?' Liquidità da monitorare.':''}`;
    }
    if(m.ebitda<0)return 'La gestione operativa non copre ancora i costi del periodo. Richiesto approfondimento.';
    if(m.ebit>=0 && m.margin>=10)return 'Redditività operativa positiva e risultato operativo in equilibrio.';
    if(m.ebit>=0)return 'Risultato operativo positivo, con alcuni indicatori da monitorare.';
    return h.overall?.text||'Analisi disponibile.';
  }

  function compactHtml(h){
    return `
      <section class="v11912-health-strip ${esc(h.overall.cls)}" data-v11912-health-strip>
        <div class="v11912-health-main">
          <span class="v11912-health-dot"></span>
          <div>
            <span class="v11912-health-eyebrow">SALUTE AZIENDA · ${esc(scopeName(h.scope).toUpperCase())}</span>
            <div class="v11912-health-line">
              <b>${esc(h.overall.label)}</b>
              <span>${esc(shortMessage(h))}</span>
            </div>
          </div>
        </div>
        <button type="button" onclick="SPCompanyHealthCompactV11912.open('${esc(h.scope)}','${esc(h.p)}')">Apri analisi salute →</button>
      </section>`;
  }

  function removeHeavy(){
    $$('[data-v11911-health]').forEach(x=>x.remove());
  }

  function decorateFinance(){
    removeHeavy();
    const view=$('#adminFinanceV1170View');
    if(!view?.classList.contains('active'))return;

    const p=currentPeriod();if(!p)return;
    const h=health('group',p);if(!h)return;

    let strip=$('[data-v11912-health-strip]',view);
    const anchor=$('.v1199-group-production',view) || $('.v1170-fin-group',view);
    if(!anchor)return;

    const html=compactHtml(h);
    if(!strip)anchor.insertAdjacentHTML('afterend',html);
    else{
      const t=document.createElement('div');t.innerHTML=html;
      strip.replaceWith(t.firstElementChild);
    }
  }

  function decorateOverview(){
    removeHeavy();
    const view=$('#adminOverviewV1170View');
    if(!view?.classList.contains('active'))return;
    const p=currentPeriod();if(!p)return;
    const sc=sessionStorage.getItem('poi_admin_overview_scope_v1182')||'group';
    const h=health(sc,p);if(!h)return;

    let strip=$('[data-v11912-health-strip]',view);
    const anchor=$('.v1182-economic-panel',view);
    if(!anchor)return;

    const html=compactHtml(h);
    if(!strip)anchor.insertAdjacentHTML('afterend',html);
    else{
      const t=document.createElement('div');t.innerHTML=html;
      strip.replaceWith(t.firstElementChild);
    }
  }

  function ensureView(){
    let v=$('#adminHealthV11912View');
    if(v)return v;
    const content=$('.content');
    if(!content)return null;
    v=document.createElement('section');
    v.id='adminHealthV11912View';
    v.className='view';
    content.appendChild(v);
    return v;
  }

  function signalRow(s){
    const label={good:'In equilibrio',watch:'Da monitorare',risk:'Critico',neutral:'Dato parziale'}[s.cls]||'';
    return `
      <article class="v11912-signal ${esc(s.cls)}">
        <div class="v11912-signal-head">
          <div><span>${esc(s.title)}</span><b>${esc(label)}</b></div>
        </div>
        <p>${esc(s.text)}</p>
      </article>`;
  }

  function buildWatchList(h){
    const out=[];
    const m=h.metrics||{};
    if(m.ebitda>0 && m.ebit<0)out.push(`Verificare l'incidenza degli ammortamenti (${money(m.depreciation)}) sul risultato operativo.`);
    if(m.margin<10)out.push(`Monitorare il margine operativo: attualmente ${pct(m.margin)} sul valore della produzione.`);
    if(m.cashCover!=null && m.cashCover<.35)out.push('Confrontare liquidità, scadenze fornitori e calendario previsto degli incassi clienti.');
    if(m.working>=0)out.push('Verificare l’anzianità dei crediti: essere superiori ai debiti è positivo solo se gli incassi sono effettivamente esigibili nei tempi previsti.');
    if(!out.length)out.push('Continuare a monitorare margini, liquidità, tempi di incasso e scadenze.');
    return out;
  }

  function renderPage(scope,period){
    const v=ensureView();if(!v)return;
    const h=health(scope,period);
    if(!h){
      v.innerHTML='<div class="empty"><b>Analisi non disponibile</b>Carica prima i dati economico-finanziari del periodo.</div>';
      return;
    }

    const watch=buildWatchList(h);
    const m=h.metrics||{};

    v.innerHTML=`
      <div class="v11912-page-head">
        <div>
          <span class="eyebrow">ANALISI GESTIONALE · ${esc(scopeName(scope).toUpperCase())}</span>
          <h2>Salute dell'azienda</h2>
          <p>${esc(period)} · lettura sintetica dei principali segnali economico-finanziari</p>
        </div>
        <button class="btn" type="button" onclick="SPCompanyHealthCompactV11912.back()">← Torna all'analisi economica</button>
      </div>

      <section class="v11912-page-summary ${esc(h.overall.cls)}">
        <div>
          <span>VALUTAZIONE DEL PERIODO</span>
          <h3>${esc(h.overall.label)}</h3>
          <p>${esc(shortMessage(h))}</p>
        </div>
      </section>

      <div class="v11912-page-grid">
        <section class="v11912-page-panel">
          <div class="v11912-page-title">
            <span class="eyebrow">SEGNALI</span>
            <h3>Cosa emerge dai dati</h3>
          </div>
          <div class="v11912-signal-list">
            ${h.signals.map(signalRow).join('')}
          </div>
        </section>

        <section class="v11912-page-panel">
          <div class="v11912-page-title">
            <span class="eyebrow">PRIORITÀ</span>
            <h3>Cosa monitorare</h3>
          </div>
          <div class="v11912-watch-list">
            ${watch.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x)}</span></div>`).join('')}
          </div>
        </section>
      </div>

      <section class="v11912-page-panel v11912-method">
        <div class="v11912-page-title">
          <span class="eyebrow">BASE DELL'ANALISI</span>
          <h3>Come viene costruita la lettura</h3>
        </div>
        <p>
          La sintesi usa EBITDA e margine operativo, EBIT, ammortamenti, crediti clienti,
          debiti fornitori e liquidità già presenti nel periodo. Non assegna un punteggio
          arbitrario e non sostituisce bilancio, commercialista o valutazioni creditizie.
        </p>
        <div class="v11912-method-actions">
          <button class="btn primary" type="button" onclick="SPCompanyHealthCompactV11912.back()">Apri dati economici</button>
        </div>
      </section>`;
  }

  function open(scope='group',period=''){
    previousView=$('.view.active')?.id||'adminFinanceV1170View';
    const p=period||currentPeriod();
    const v=ensureView();if(!v)return;
    $$('.view').forEach(x=>x.classList.remove('active'));
    v.classList.add('active');
    try{currentView='adminHealthV11912'}catch(_){}
    if($('#pageTitle'))$('#pageTitle').textContent='Salute dell’azienda';
    if($('#pageSubtitle'))$('#pageSubtitle').textContent='Sintesi dei principali segnali economico-finanziari';
    renderPage(scope,p);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function back(){
    const target=document.getElementById(previousView)||document.getElementById('adminFinanceV1170View');
    $$('.view').forEach(x=>x.classList.remove('active'));
    target?.classList.add('active');
    try{currentView=target?.id==='adminOverviewV1170View'?'adminOverviewV1170':'adminFinanceV1170'}catch(_){}
    if(target?.id==='adminFinanceV1170View'){
      if($('#pageTitle'))$('#pageTitle').textContent='Economico-finanziario';
      if($('#pageSubtitle'))$('#pageSubtitle').textContent='Ricavi, costi, EBITDA, EBIT, crediti e debiti';
    }else{
      if($('#pageTitle'))$('#pageTitle').textContent='Panoramica Amministrazione';
      if($('#pageSubtitle'))$('#pageSubtitle').textContent='Priorità, consegne, DDT SPRING e andamento economico';
    }
    decorate();
  }

  function injectStyles(){
    if($('#v11912HealthStyles'))return;
    const st=document.createElement('style');
    st.id='v11912HealthStyles';
    st.textContent=`
      /* Nasconde il blocco pesante della V11.9.11 se un render precedente lo ricrea. */
      [data-v11911-health]{display:none!important}

      .v11912-health-strip{
        margin-top:12px;padding:12px 14px;border:1px solid #dbe6ea;border-radius:14px;
        background:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px
      }
      .v11912-health-strip.good{border-left:4px solid #2f8a69}
      .v11912-health-strip.watch{border-left:4px solid #c58a2a}
      .v11912-health-strip.risk{border-left:4px solid #b8464e}
      .v11912-health-main{display:flex;align-items:center;gap:10px;min-width:0}
      .v11912-health-dot{width:10px;height:10px;border-radius:50%;background:#8799a1;flex:0 0 auto}
      .v11912-health-strip.good .v11912-health-dot{background:#2f8a69}
      .v11912-health-strip.watch .v11912-health-dot{background:#c58a2a}
      .v11912-health-strip.risk .v11912-health-dot{background:#b8464e}
      .v11912-health-eyebrow{display:block;font-size:8px;font-weight:950;letter-spacing:.06em;color:#6c808a}
      .v11912-health-line{display:flex;align-items:baseline;gap:10px;margin-top:2px;min-width:0}
      .v11912-health-line b{font-size:13px;white-space:nowrap;color:#193541}
      .v11912-health-line span{font-size:11.5px;color:#5d7079;line-height:1.4}
      .v11912-health-strip>button{border:0;background:transparent;color:var(--primary);font:inherit;font-size:10.5px;font-weight:900;cursor:pointer;white-space:nowrap}

      .v11912-page-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:15px}
      .v11912-page-head h2{font-size:26px;margin:4px 0}.v11912-page-head p{font-size:13px;color:#687c86;margin:0}
      .v11912-page-summary{padding:18px 20px;border:1px solid #dbe6ea;border-radius:16px;background:#fff;margin-bottom:14px}
      .v11912-page-summary.good{border-left:5px solid #2f8a69}.v11912-page-summary.watch{border-left:5px solid #c58a2a}.v11912-page-summary.risk{border-left:5px solid #b8464e}
      .v11912-page-summary span{font-size:9px;font-weight:950;color:#6e818a;letter-spacing:.06em}
      .v11912-page-summary h3{font-size:22px;margin:5px 0}.v11912-page-summary p{font-size:14px;line-height:1.55;color:#455b65;margin:0;max-width:1000px}
      .v11912-page-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}
      .v11912-page-panel{padding:17px;border:1px solid #dbe6ea;border-radius:16px;background:#fff}
      .v11912-page-title h3{font-size:17px;margin:3px 0 10px}
      .v11912-signal-list{display:grid;gap:8px}
      .v11912-signal{padding:11px 12px;border:1px solid #e2eaed;border-radius:12px}
      .v11912-signal.good{background:#f7fcf9}.v11912-signal.watch{background:#fffaf2}.v11912-signal.risk{background:#fff7f7}
      .v11912-signal-head>div{display:flex;justify-content:space-between;align-items:center;gap:12px}
      .v11912-signal-head span{font-size:12px;font-weight:900;color:#27424e}.v11912-signal-head b{font-size:10px;color:#6a7d86}
      .v11912-signal p{font-size:12px;line-height:1.5;color:#5b6e77;margin:6px 0 0}
      .v11912-watch-list{display:grid;gap:0}
      .v11912-watch-list>div{display:grid;grid-template-columns:34px 1fr;gap:9px;padding:11px 0;border-bottom:1px solid #edf2f3}
      .v11912-watch-list>div:last-child{border-bottom:0}
      .v11912-watch-list b{font-size:10px;color:#9a6a20}.v11912-watch-list span{font-size:12px;line-height:1.5;color:#4f646e}
      .v11912-method{margin-top:12px}.v11912-method>p{font-size:12px;line-height:1.55;color:#5e717a;max-width:1000px}
      .v11912-method-actions{margin-top:10px}

      @media(max-width:900px){
        .v11912-health-line{display:block}.v11912-health-line span{display:block;margin-top:2px}
        .v11912-page-grid{grid-template-columns:1fr}
      }
      @media(max-width:650px){
        .v11912-health-strip{align-items:flex-start;display:block}
        .v11912-health-strip>button{margin-top:8px;font-size:12px}
        .v11912-health-line b{font-size:14px}.v11912-health-line span{font-size:12.5px}
        .v11912-page-head{display:block}.v11912-page-head .btn{margin-top:10px}
        .v11912-page-summary p{font-size:14px}
      }
    `;
    document.head.appendChild(st);
  }

  function decorate(){
    injectStyles();
    removeHeavy();
    decorateFinance();
    decorateOverview();
  }

  function boot(){
    injectStyles();
    [100,350,900,1800,3200].forEach(ms=>setTimeout(decorate,ms));
    setInterval(()=>{
      removeHeavy();
      if($('#adminFinanceV1170View')?.classList.contains('active') ||
         $('#adminOverviewV1170View')?.classList.contains('active')){
        decorate();
      }
    },1800);
  }

  window.SPCompanyHealthCompactV11912={open,back,decorate,version:'V11.9.12'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ========================================================================
   V11.9.11 · SALUTE DELL'AZIENDA
   Sintesi gestionale spiegabile basata sui dati economico-finanziari già
   disponibili. Nessun punteggio opaco: ogni stato espone motivazione e KPI.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPCompanyHealthV11911)return;

  const $=(s,r=document)=>r.querySelector(s);
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{
    style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2
  }).format(n(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{
    minimumFractionDigits:1,maximumFractionDigits:1
  }).format(n(v))}%`;

  function S(){try{return state}catch(_){return window.state||null}}
  function period(){
    const input=$('#financePeriodV1170');
    const p=input?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
    if(/^\d{4}-\d{2}$/.test(p))return p;
    const xs=(S()?.adminFinanceV1170?.records||[])
      .map(x=>String(x.period||''))
      .filter(x=>/^\d{4}-\d{2}$/.test(x))
      .sort().reverse();
    return xs[0]||'';
  }
  function record(company,p){
    return (S()?.adminFinanceV1170?.records||[])
      .find(x=>x.company===company&&x.period===p)||null;
  }
  function aggregateRecord(scope,p){
    if(scope!=='group')return record(scope,p)||{};
    const rs=['smartpack','multiplast'].map(c=>record(c,p)).filter(Boolean);
    const sum=k=>rs.reduce((s,r)=>s+n(r[k]),0);
    return {
      depreciation:sum('depreciation'),
      receivables:sum('receivables'),
      payables:sum('payables'),
      cash:sum('cash'),
      inventory:sum('inventory'),
      financialCharges:sum('financialCharges')
    };
  }
  function scope(){
    const overview=$('#adminOverviewV1170View');
    if(overview?.classList.contains('active')){
      return sessionStorage.getItem('poi_admin_overview_scope_v1182')||'group';
    }
    return 'group';
  }
  function labelScope(s){return s==='smartpack'?'Smart Pack':s==='multiplast'?'Multiplast':'Gruppo'}

  function health(scopeName,p){
    const clarity=window.SPFinanceClarityV1199;
    if(!clarity)return null;
    const d=scopeName==='group'?clarity.groupDerived(p):clarity.derived(scopeName,p);
    if(!d?.configured)return null;

    const r=aggregateRecord(scopeName,p);
    const prod=Math.max(0,n(d.productionValue));
    const ebitda=n(d.ebitda),ebit=n(d.ebit),margin=n(d.marginProduction);
    const depreciation=n(r.depreciation);
    const receivables=n(r.receivables),payables=n(r.payables),cash=n(r.cash);
    const working=receivables-payables;
    const cashCover=payables>0?cash/payables:null;

    const signals=[];

    // Redditività operativa
    if(ebitda<0){
      signals.push({key:'profit',cls:'risk',title:'Redditività operativa',
        value:money(ebitda),text:'EBITDA negativo: i ricavi operativi non stanno coprendo i costi operativi del periodo.'});
    }else if(margin>=10){
      signals.push({key:'profit',cls:'good',title:'Redditività operativa',
        value:`EBITDA ${money(ebitda)} · ${pct(margin)}`,text:'La gestione operativa genera un margine positivo prima di ammortamenti e componenti non operative.'});
    }else if(margin>=5){
      signals.push({key:'profit',cls:'watch',title:'Redditività operativa',
        value:`EBITDA ${money(ebitda)} · ${pct(margin)}`,text:'Margine operativo positivo, ma non ampio: conviene monitorare costi e prezzi di vendita.'});
    }else{
      signals.push({key:'profit',cls:'watch',title:'Redditività operativa',
        value:`EBITDA ${money(ebitda)} · ${pct(margin)}`,text:'EBITDA positivo ma con margine contenuto rispetto al valore della produzione.'});
    }

    // Risultato operativo
    if(ebit>=0){
      signals.push({key:'ebit',cls:'good',title:'Risultato operativo',
        value:money(ebit),text:'Dopo gli ammortamenti il risultato operativo resta positivo.'});
    }else if(ebitda>0){
      signals.push({key:'ebit',cls:'watch',title:'Risultato operativo',
        value:money(ebit),text:`L'EBIT è negativo nonostante EBITDA positivo. Gli ammortamenti incidono per ${money(depreciation)}.`});
    }else{
      signals.push({key:'ebit',cls:'risk',title:'Risultato operativo',
        value:money(ebit),text:'Il risultato operativo è negativo già a partire da una gestione operativa debole o negativa.'});
    }

    // Crediti / debiti
    if(working>=0){
      signals.push({key:'working',cls:'good',title:'Crediti vs debiti fornitori',
        value:`+${money(working)}`,text:'I crediti clienti risultano superiori ai debiti fornitori registrati. La qualità dipende però dai tempi effettivi di incasso.'});
    }else{
      const ratio=prod?Math.abs(working)/prod:0;
      signals.push({key:'working',cls:ratio>=.10?'risk':'watch',title:'Crediti vs debiti fornitori',
        value:money(working),text:'I debiti fornitori superano i crediti clienti registrati nel periodo disponibile.'});
    }

    // Liquidità
    if(payables<=0){
      signals.push({key:'cash',cls:cash>0?'good':'neutral',title:'Liquidità',
        value:money(cash),text:'Non risultano debiti fornitori valorizzati con cui confrontare la liquidità disponibile.'});
    }else if(cashCover>=.35){
      signals.push({key:'cash',cls:'good',title:'Liquidità',
        value:`${money(cash)} · ${pct(cashCover*100)} dei debiti fornitori`,text:'La liquidità disponibile offre una copertura significativa dei debiti fornitori registrati.'});
    }else if(cashCover>=.15){
      signals.push({key:'cash',cls:'watch',title:'Liquidità',
        value:`${money(cash)} · ${pct(cashCover*100)} dei debiti fornitori`,text:'Liquidità presente, ma da monitorare insieme alle scadenze di pagamento e ai tempi di incasso dei crediti.'});
    }else{
      signals.push({key:'cash',cls:'risk',title:'Liquidità',
        value:`${money(cash)} · ${pct((cashCover||0)*100)} dei debiti fornitori`,text:'Liquidità contenuta rispetto ai debiti fornitori: è importante verificare scadenze e incassi attesi.'});
    }

    const risks=signals.filter(x=>x.cls==='risk').length;
    const watches=signals.filter(x=>x.cls==='watch').length;

    let overall;
    if(ebitda<0 || risks>=2){
      overall={cls:'risk',label:'Criticità da approfondire',
        text:'I dati disponibili mostrano più segnali di tensione. Conviene analizzare subito margini, costi, scadenze e liquidità.'};
    }else if(ebit<0 || watches>=2 || risks===1){
      overall={cls:'watch',label:'Da monitorare',
        text:'L’azienda genera attività economica, ma alcuni indicatori richiedono attenzione prima di considerare la situazione pienamente equilibrata.'};
    }else{
      overall={cls:'good',label:'Situazione favorevole',
        text:'I principali indicatori disponibili risultano positivi. Continua a monitorare margini, liquidità e tempi di incasso.'};
    }

    // Messaggio specifico più utile quando EBITDA > 0 ed EBIT < 0.
    if(ebitda>0 && ebit<0){
      overall.text=`La gestione operativa genera un EBITDA positivo (${money(ebitda)}), ma dopo ${money(depreciation)} di ammortamenti l’EBIT scende a ${money(ebit)}. Crediti e liquidità vanno letti insieme alle relative scadenze.`;
    }

    return {scope:scopeName,p,overall,signals,metrics:{prod,ebitda,ebit,margin,depreciation,receivables,payables,cash,working,cashCover}};
  }

  function cardHtml(h){
    return `
      <section class="v11911-health ${h.overall.cls}" data-v11911-health>
        <div class="v11911-health-head">
          <div>
            <span class="eyebrow">SALUTE DELL'AZIENDA · ${labelScope(h.scope).toUpperCase()}</span>
            <h3>Quadro gestionale del periodo</h3>
            <p>${h.p} · sintesi costruita sui dati economico-finanziari disponibili</p>
          </div>
          <div class="v11911-health-status ${h.overall.cls}">
            <i></i><span>${h.overall.label}</span>
          </div>
        </div>

        <div class="v11911-health-summary">${h.overall.text}</div>

        <div class="v11911-health-grid">
          ${h.signals.map(s=>`
            <article class="${s.cls}">
              <div class="v11911-health-label"><i></i><span>${s.title}</span></div>
              <b>${s.value}</b>
              <p>${s.text}</p>
            </article>
          `).join('')}
        </div>

        <div class="v11911-health-foot">
          <span><b>Come leggerlo:</b> questa è una sintesi gestionale automatica, non un rating creditizio né una valutazione contabile ufficiale.</span>
          <button type="button" onclick="SPFinanceClarityV1199?.open?.('ebit','${h.scope}','${h.p}')">Apri dettaglio economico →</button>
        </div>
      </section>`;
  }

  function decorateFinance(){
    const view=$('#adminFinanceV1170View');
    if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;
    const h=health('group',p);if(!h)return;

    let box=$('[data-v11911-health]',view);
    const anchor=$('.v1199-group-production',view) || $('.v1170-fin-group',view);
    if(!anchor)return;

    if(!box){
      anchor.insertAdjacentHTML('afterend',cardHtml(h));
    }else{
      const temp=document.createElement('div');temp.innerHTML=cardHtml(h);
      box.replaceWith(temp.firstElementChild);
    }
  }

  function decorateOverview(){
    const view=$('#adminOverviewV1170View');
    if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;
    const sc=scope(),h=health(sc,p);if(!h)return;

    let box=$('[data-v11911-health]',view);
    const anchor=$('.v1182-economic-panel',view) || $('.v1182-main-grid',view);
    if(!anchor)return;

    if(!box){
      anchor.insertAdjacentHTML('afterend',cardHtml(h));
    }else{
      const temp=document.createElement('div');temp.innerHTML=cardHtml(h);
      box.replaceWith(temp.firstElementChild);
    }
  }

  function injectStyles(){
    if($('#v11911HealthStyles'))return;
    const st=document.createElement('style');
    st.id='v11911HealthStyles';
    st.textContent=`
      .v11911-health{
        margin-top:16px;padding:18px 19px;background:#fff;border:1px solid #dbe6ea;
        border-radius:18px;box-shadow:0 7px 20px rgba(25,64,79,.045)
      }
      .v11911-health.good{border-top:4px solid #2f8a69}
      .v11911-health.watch{border-top:4px solid #c58a2a}
      .v11911-health.risk{border-top:4px solid #b8464e}
      .v11911-health-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
      .v11911-health-head h3{margin:4px 0 3px;font-size:20px;line-height:1.2}
      .v11911-health-head p{margin:0;color:#667a84;font-size:12.5px}
      .v11911-health-status{
        display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;
        font-size:12px;font-weight:900;white-space:nowrap
      }
      .v11911-health-status i,.v11911-health-label i{width:9px;height:9px;border-radius:50%;display:inline-block;flex:0 0 auto}
      .v11911-health-status.good{background:#eaf7f1;color:#206f57}.v11911-health-status.good i{background:#2f8a69}
      .v11911-health-status.watch{background:#fff6e6;color:#8a5d17}.v11911-health-status.watch i{background:#c58a2a}
      .v11911-health-status.risk{background:#fff0f1;color:#9e343c}.v11911-health-status.risk i{background:#b8464e}
      .v11911-health-summary{
        margin-top:13px;padding:13px 14px;border-radius:12px;background:#f7fafb;color:#344d59;
        font-size:13.5px;line-height:1.55;font-weight:600
      }
      .v11911-health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:11px}
      .v11911-health-grid article{padding:12px;border:1px solid #e0e9ec;border-radius:13px;background:#fff;min-width:0}
      .v11911-health-grid article.good{background:#f7fcf9}.v11911-health-grid article.watch{background:#fffaf1}.v11911-health-grid article.risk{background:#fff7f7}
      .v11911-health-label{display:flex;align-items:center;gap:6px;color:#617680;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .v11911-health-grid article.good .v11911-health-label i{background:#2f8a69}
      .v11911-health-grid article.watch .v11911-health-label i{background:#c58a2a}
      .v11911-health-grid article.risk .v11911-health-label i{background:#b8464e}
      .v11911-health-grid article.neutral .v11911-health-label i{background:#83959d}
      .v11911-health-grid article>b{display:block;margin-top:7px;font-size:16px;line-height:1.25;color:#142d39}
      .v11911-health-grid article.risk>b{color:#a63740}
      .v11911-health-grid article p{margin:6px 0 0;color:#5d707a;font-size:11.5px;line-height:1.5}
      .v11911-health-foot{
        margin-top:11px;padding-top:10px;border-top:1px solid #e8eef0;
        display:flex;justify-content:space-between;align-items:center;gap:16px
      }
      .v11911-health-foot>span{color:#71838b;font-size:10.5px;line-height:1.45}
      .v11911-health-foot button{border:0;background:transparent;color:var(--primary);font:inherit;font-size:10.5px;font-weight:900;cursor:pointer;white-space:nowrap}
      @media(max-width:1200px){.v11911-health-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:700px){
        .v11911-health{padding:15px}
        .v11911-health-head{display:block}.v11911-health-status{margin-top:10px}
        .v11911-health-head h3{font-size:20px}.v11911-health-head p{font-size:13px}
        .v11911-health-summary{font-size:14px}
        .v11911-health-grid{grid-template-columns:1fr}
        .v11911-health-grid article>b{font-size:18px}
        .v11911-health-grid article p{font-size:13px}
        .v11911-health-label{font-size:11px}
        .v11911-health-foot{display:block}.v11911-health-foot>span{font-size:12px}.v11911-health-foot button{margin-top:8px;font-size:12px}
      }
    `;
    document.head.appendChild(st);
  }

  function decorate(){
    injectStyles();
    decorateFinance();
    decorateOverview();
  }

  function boot(){
    injectStyles();
    [350,800,1600,3000].forEach(ms=>setTimeout(decorate,ms));
    setInterval(()=>{
      if($('#adminFinanceV1170View')?.classList.contains('active') ||
         $('#adminOverviewV1170View')?.classList.contains('active')){
        decorate();
      }
    },2000);
  }

  window.SPCompanyHealthV11911={health,decorate,version:'V11.9.11'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ========================================================================
   V11.9.10 · FINANCE ALERT READABILITY
   Migliora leggibilità e gerarchia degli alert economico-finanziari.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.__poiFinanceAlertReadabilityV11910)return;
  window.__poiFinanceAlertReadabilityV11910=true;

  function inject(){
    if(document.getElementById('poiFinanceAlertReadabilityV11910Styles'))return;
    const st=document.createElement('style');
    st.id='poiFinanceAlertReadabilityV11910Styles';
    st.textContent=`
      /* Alert principale risultato operativo */
      .v1170-loss-alert{
        padding:18px 20px!important;
        border-radius:16px!important;
        border-width:1px!important;
        min-height:74px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        gap:5px!important;
        background:#fff4f4!important;
        border-color:#efc7ca!important;
      }
      .v1170-loss-alert b{
        color:#a72f38!important;
        font-size:15px!important;
        line-height:1.35!important;
        font-weight:850!important;
        letter-spacing:0!important;
      }
      .v1170-loss-alert span{
        color:#4d5961!important;
        font-size:13.5px!important;
        line-height:1.55!important;
        font-weight:500!important;
      }

      /* Badge "Risultato operativo negativo" */
      .v1170-fin-status.loss{
        color:#9d2f38!important;
        background:#fff0f1!important;
        border:1px solid #efc7ca!important;
        font-size:12px!important;
        line-height:1.25!important;
        font-weight:850!important;
        padding:7px 11px!important;
        border-radius:999px!important;
        white-space:normal!important;
        text-align:center!important;
      }

      /* Valori negativi nei KPI */
      .v1170-fin-mini b.loss,
      .v1170-fin-group b.loss,
      .v1170-readonly-grid b.loss,
      .v1182-economic-grid b.loss,
      .v1182-forecast b.loss{
        color:#a72f38!important;
        font-weight:850!important;
      }

      /* Alert / stato nel popup di analisi */
      .v1172-status.loss{
        padding:15px 16px!important;
        background:#fff4f4!important;
        border-color:#efc7ca!important;
      }
      .v1172-status.loss b{
        color:#a72f38!important;
        font-size:14px!important;
        line-height:1.35!important;
        font-weight:850!important;
      }
      .v1172-status.loss span{
        color:#4d5961!important;
        font-size:13px!important;
        line-height:1.5!important;
        margin-top:5px!important;
      }

      @media(max-width:700px){
        .v1170-loss-alert{
          padding:16px!important;
          min-height:auto!important;
        }
        .v1170-loss-alert b{font-size:16px!important}
        .v1170-loss-alert span{font-size:14px!important}
        .v1170-fin-status.loss{font-size:12.5px!important;padding:8px 10px!important}
      }
    `;
    (document.head||document.documentElement).appendChild(st);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',inject,{once:true});
  }else inject();

  setTimeout(inject,300);
})();


/* ========================================================================
   V11.9.15 · CLEAN BOOT + NO LEGACY FLASH
   Mantiene coperta la UI finché non è pronta la schermata corretta.
   Elimina il flash di viste legacy e anticipa il routing della sessione.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.__poiCleanBootV11915)return;
  window.__poiCleanBootV11915=true;

  const started=performance.now();
  let released=false;
  let pollTimer=0;
  let routeTimer=0;

  const qs=s=>document.querySelector(s);

  function visible(el){
    if(!el)return false;
    try{
      const s=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return s.display!=='none' &&
             s.visibility!=='hidden' &&
             s.opacity!=='0' &&
             r.width>0 && r.height>0;
    }catch(_){ return true; }
  }

  function rememberedEmployee(){
    try{
      return JSON.parse(
        sessionStorage.getItem('poi_v113_employee') ||
        localStorage.getItem('poi_v1180_device_employee') ||
        'null'
      );
    }catch(_){ return null; }
  }

  function officeUnlocked(){
    return localStorage.getItem('poi_v1180_office_unlocked')==='1';
  }

  function rememberedOfficeRole(){
    return sessionStorage.getItem('poi_v115_office_role') ||
           localStorage.getItem('poi_v1180_office_role') ||
           '';
  }

  function validRole(r){
    return ['director','manager','admin','worker','mpworker'].includes(String(r||''));
  }

  function profileReady(){
    try{return !!window.POICloudV10?.getProfile?.()}catch(_){return false}
  }

  function finalScreenReady(){
    // Login globale reale: è una destinazione finale quando non c'è sessione.
    const auth=qs('#poiCloudAuth');
    if(auth?.classList.contains('open') && visible(auth))return true;

    // Schermata scelta uffici definitiva.
    const officePortal=qs('#poi113CompanyGate.open .poi115-portal-shell');
    if(officePortal && visible(officePortal))return true;

    // Home produzione definitiva.
    const productionHome=qs('#poi113CompanyGate.open .poi116-home');
    if(productionHome && visible(productionHome))return true;

    // Login USER/PIN definitivo.
    const access=qs('#poi113AccessGate.open');
    if(access && visible(access))return true;

    // Modulo operativo: richiediamo un ruolo reale + navigazione popolata.
    const role=sessionStorage.getItem('industrialos_role_session') ||
               sessionStorage.getItem('nomyra_group_role_v92') ||
               '';
    const app=qs('.app');
    const navButtons=document.querySelectorAll('#sideNav button').length;
    if(validRole(role) && app && visible(app) && navButtons>0)return true;

    // Portale NOMYRA admin.
    const nomyra=qs('#poi113NomyraGate.open');
    if(nomyra && visible(nomyra))return true;

    return false;
  }

  function release(reason){
    if(released)return;
    released=true;
    clearInterval(pollTimer);
    clearInterval(routeTimer);
    try{clearTimeout(window.__poiBootSafety)}catch(_){}
    document.documentElement.classList.remove('poi-booting');
    document.documentElement.dataset.bootReleasedBy='v11915';
    document.documentElement.dataset.bootReleaseReason=reason||'ready';
    document.documentElement.dataset.bootMs=String(Math.round(performance.now()-started));
    try{
      window.dispatchEvent(new CustomEvent('poi:first-screen-ready',{
        detail:{reason:reason||'ready',ms:Math.round(performance.now()-started)}
      }));
    }catch(_){}
  }

  function routeAsSoonAsPossible(){
    if(finalScreenReady())return;

    const api=window.POIV113;
    if(!api || !profileReady())return;

    const emp=rememberedEmployee();
    const unlocked=officeUnlocked();
    const officeRole=rememberedOfficeRole();

    try{
      if(emp?.company_code){
        api.showCompanyMenu?.();
        return;
      }

      if(unlocked){
        // Se non c'è un ruolo ricordato, il target corretto è la scelta aree ufficio.
        // Se c'è, showCompanyMenu ripristina il modulo già aperto.
        if(['director','manager','admin'].includes(officeRole)){
          api.showCompanyMenu?.();
        }else{
          api.showOfficeMenu?.();
        }
        return;
      }

      api.showProductionHome?.();
    }catch(_){}
  }

  function check(){
    routeAsSoonAsPossible();
    if(finalScreenReady())release('final-screen-ready');
  }

  function begin(){
    // La classe poi-booting è già impostata inline nell'HTML prima del primo paint.
    // Qui NON la rimuoviamo finché la destinazione reale non è pronta.
    check();
    pollTimer=setInterval(check,60);
    routeTimer=setInterval(routeAsSoonAsPossible,90);

    // Safety solo difensiva: prima prova sempre a forzare il routing corretto.
    // Non rilascia la vecchia shell "alla cieca".
    setTimeout(()=>{
      routeAsSoonAsPossible();
      if(finalScreenReady())release('safety-ready');
    },2600);

    // Ultima protezione contro un blocco infinito in caso di errore esterno.
    setTimeout(()=>release('hard-safety'),5000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',begin,{once:true});
  }else{
    begin();
  }

  window.addEventListener('pageshow',()=>setTimeout(check,0),{passive:true});
})();


/* V11.8.3 · BUILD CONSISTENCY */
(()=>{
  if(window.__spmpBuildConsistencyV1183)return;
  window.__spmpBuildConsistencyV1183=true;
  if(!('serviceWorker' in navigator))return;

  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing)return;
    refreshing=true;
    // Un solo refresh quando una nuova build prende il controllo.
    location.reload();
  });
})();

/* Smart Pack · Multiplast — V11.5 accessi separati
   - Account cliente: e-mail + password, scelta azienda, richieste di recupero.
   - Dipendenti: USER + PIN personale di 6 cifre.
   - NOMYRA / Andrea: area riservata per creare e amministrare gli USER.
*/
(()=>{
  'use strict';

  const BUILD='V11.5';
  const MARKER='PIATTAFORMA-GRUPPO-V11.5';
  const GROUP='smartpack-multiplast';
  const COMPANY_KEY='poi_v113_company';
  const EMPLOYEE_KEY='poi_v113_employee';
  const OFFICE_ROLE_KEY='poi_v115_office_role';
  const DEVICE_EMPLOYEE_KEY='poi_v1180_device_employee';
  const DEVICE_OFFICE_UNLOCKED_KEY='poi_v1180_office_unlocked';
  const DEVICE_OFFICE_ROLE_KEY='poi_v1180_office_role';
  const DEVICE_COMPANY_KEY='poi_v1180_company';
  const activationMode=new URL(location.href).searchParams.get('attiva')==='account';

  let selectedCompany=sessionStorage.getItem(COMPANY_KEY)||localStorage.getItem(DEVICE_COMPANY_KEY)||'';
  let officeUnlockedFlag=localStorage.getItem(DEVICE_OFFICE_UNLOCKED_KEY)==='1';
  let officeReauthInProgress=false;
  const OFFICE_REAUTH_KEY='poi_v1194_office_reauth';
  let manageCompany='smartpack';
  let recoveryCompany='smartpack';
  let directory=[];
  let pendingEntry=null;
  let pinChangeMode={forced:false,currentPin:''};
  let employee=null;
  try{
    employee=JSON.parse(
      sessionStorage.getItem(EMPLOYEE_KEY) ||
      localStorage.getItem(DEVICE_EMPLOYEE_KEY) ||
      'null'
    )
  }catch(_){employee=null}

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=()=>window.POICloudV10;
  const profile=()=>api()?.getProfile?.()||null;
  const client=()=>api()?.getClient?.()||null;
  const accountType=()=>profile()?.account_type||'standard';
  const isPlatform=()=>['platform_admin','backup_admin'].includes(accountType());
  const isTenant=()=>accountType()==='tenant_admin';
  const canViewRecoveries=()=>isPlatform()||isTenant();
  const companies=()=>{
    const values=profile()?.company_codes;
    return Array.isArray(values)&&values.length?values.filter(c=>['smartpack','multiplast'].includes(c)):['smartpack','multiplast'];
  };
  const companyName=c=>c==='multiplast'?'Multiplast':'Smart Pack';
  const roleName=r=>({
    director:'Gestione Smart Pack',manager:'Responsabile Produzione Multiplast',
    worker:'Produzione Smart Pack',mpworker:'Produzione Multiplast',admin:'Amministrazione'
  }[r]||r);
  const requestName=k=>({
    forgot_username:'USER dimenticato',forgot_pin:'PIN dimenticato',both:'USER e PIN dimenticati'
  }[k]||k);
  const formatDate=v=>v?new Date(v).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}):'—';

  function injectStyles(){
    if($('#poi113Styles'))return;
    const style=document.createElement('style');
    style.id='poi113Styles';
    style.textContent=`
      .poi113-overlay{display:none;position:fixed;inset:0;z-index:15000;background:rgba(12,35,46,.74);backdrop-filter:blur(7px);padding:22px;overflow:auto}.poi113-overlay.open{display:grid;place-items:center}
      .poi113-card{width:min(980px,100%);background:#f7fafb;border:1px solid #d7e4e9;border-radius:24px;box-shadow:0 30px 90px rgba(10,34,45,.34);padding:22px}.poi113-card.narrow{width:min(570px,100%)}
      .poi113-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.poi113-logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#17394a;color:#fff;font-weight:950;flex:0 0 auto}.poi113-head .grow{flex:1}.poi113-head h2{margin:0;font-size:21px}.poi113-head p{margin:5px 0 0;color:#647b86;font-size:10px;line-height:1.5}.poi113-close{border:0;background:#e8f0f3;min-width:38px;height:34px;padding:0 10px;border-radius:10px;font-size:10px;font-weight:900;cursor:pointer;color:#17394a}
      .poi113-company-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.poi113-company{background:#fff;border:1px solid #d6e4e9;border-radius:18px;padding:18px;text-align:left;cursor:pointer;transition:.18s}.poi113-company:hover{transform:translateY(-2px);border-color:#86b5c8;box-shadow:0 12px 28px rgba(24,70,88,.1)}.poi113-company b{display:block;font-size:18px}.poi113-company span{display:block;color:#627984;font-size:10px;line-height:1.5;margin-top:5px}
      .poi113-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.poi113-actions .btn{justify-content:center}.poi113-actions.stretch .btn{flex:1;min-width:170px}
      .poi113-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.poi113-form-grid .full{grid-column:1/-1}.poi113-error,.poi113-success{display:none;border-radius:11px;padding:9px 11px;font-size:9px;line-height:1.45}.poi113-error{border:1px solid #efc8c8;background:#fff5f5;color:#9d3e3e}.poi113-success{border:1px solid #bfe4d5;background:#f1fbf7;color:#176b57}.poi113-error.show,.poi113-success.show{display:block}
      .poi113-tabs{display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap}.poi113-tabs button{border:1px solid #d6e4e9;background:#fff;border-radius:999px;padding:7px 11px;font-size:9px;font-weight:900;cursor:pointer}.poi113-tabs button.active{background:#17394a;color:#fff;border-color:#17394a}
      .poi113-admin-grid{display:grid;grid-template-columns:340px 1fr;gap:14px}.poi113-panel{background:#fff;border:1px solid #dbe7eb;border-radius:16px;padding:14px}.poi113-panel h3{margin:0 0 4px;font-size:14px}.poi113-panel>p{margin:0 0 12px;color:#647b86;font-size:9px;line-height:1.45}
      .poi113-employee,.poi113-request{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px 0;border-bottom:1px solid #edf2f4}.poi113-employee:last-child,.poi113-request:last-child{border-bottom:0}.poi113-employee b,.poi113-request b{font-size:10px}.poi113-employee small,.poi113-request small{display:block;color:#6c7f88;font-size:8px;line-height:1.5;margin-top:3px}.poi113-row-actions{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.poi113-empty{padding:20px;text-align:center;color:#71858e;font-size:10px}.poi113-note{border:1px solid #d2e5ed;background:#f4fafc;border-radius:13px;padding:10px 12px;font-size:9px;color:#48636f;line-height:1.5}.poi113-request select{min-width:190px;max-width:250px;padding:7px;border:1px solid #d6e4e9;border-radius:9px;background:#fff;font-size:9px}.poi113-status{display:inline-flex;padding:4px 8px;border-radius:999px;background:#fff3df;color:#94611c;font-size:8px;font-weight:900}.poi113-status.done{background:#e9f6f1;color:#116b59}
      #poiCloudUserBox{display:none!important}#poiCloudSwitchProfile{display:none!important}
      #accessGate{display:none!important}
      .poi115-production-grid,.poi115-office-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.poi115-production-card,.poi115-office-card{background:#fff;border:1px solid #d6e4e9;border-radius:18px;padding:20px;text-align:left;cursor:pointer;transition:.18s;min-height:150px;display:flex;flex-direction:column}.poi115-production-card:hover,.poi115-office-card:hover{transform:translateY(-2px);border-color:#86b5c8;box-shadow:0 12px 28px rgba(24,70,88,.1)}.poi115-production-card b,.poi115-office-card b{display:block;font-size:18px}.poi115-production-card span,.poi115-office-card span{display:block;color:#627984;font-size:11px;line-height:1.5;margin-top:7px}.poi115-production-card em,.poi115-office-card em{font-style:normal;font-size:10px;font-weight:900;color:#1f5e78;margin-top:auto;padding-top:14px}.poi115-office-link{margin-top:14px;padding:14px;border:1px solid #d8e5e9;border-radius:14px;background:#f5f9fa;display:flex;gap:10px;align-items:center;justify-content:space-between}.poi115-office-link div b{font-size:12px}.poi115-office-link div span{display:block;font-size:9px;color:#657b85;margin-top:3px}.poi115-office-link .btn{white-space:nowrap}.poi115-security-note{margin-top:12px;border:1px solid #d5e7df;background:#f3faf7;border-radius:12px;padding:10px 12px;font-size:9px;line-height:1.45;color:#43645a}.poi115-office-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.poi115-office-card{min-height:165px}.poi115-office-card .role{width:42px;height:42px;border-radius:12px;background:#eaf4f7;color:#1f5e78;display:grid;place-items:center;font-weight:950;margin-bottom:14px}.poi1179-users-card .role{background:#eef0f8;color:#42528b}.poi1179-users-card{border-color:#d8ddef}.poi115-lock-note{margin-top:12px;color:#6a7d86;font-size:9px;line-height:1.45}.poi115-employee-company{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:#eef5f7}.poi115-employee-company b{font-size:12px}.poi115-employee-company span{font-size:9px;color:#657983}.poi115-employee-company .badge{width:36px;height:36px;border-radius:10px;background:#1f5e78;color:#fff;display:grid;place-items:center;font-weight:900}

      /* V11.5.1 · Home accesso full-screen */
      #poi113CompanyGate,#poi113AccessGate{
        background:
          radial-gradient(circle at 8% 12%,rgba(31,94,120,.13),transparent 28%),
          radial-gradient(circle at 88% 84%,rgba(57,111,83,.10),transparent 30%),
          linear-gradient(135deg,#f7fbfc 0%,#edf5f7 48%,#f7faf8 100%)!important;
        backdrop-filter:none!important;
        padding:0!important;
        overflow:auto!important;
      }
      #poi113CompanyGate::before,#poi113AccessGate::before{
        content:"";position:fixed;inset:0;pointer-events:none;opacity:.42;
        background-image:
          linear-gradient(rgba(23,57,74,.035) 1px,transparent 1px),
          linear-gradient(90deg,rgba(23,57,74,.035) 1px,transparent 1px);
        background-size:44px 44px;
        mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 88%);
      }
      #poi113CompanyGate.open,#poi113AccessGate.open{display:block!important}
      #poi113CompanyGate .poi113-card{
        position:relative;z-index:1;width:min(1380px,calc(100% - 48px));min-height:100vh;
        margin:0 auto;padding:42px 34px 38px;background:transparent;border:0;border-radius:0;box-shadow:none;
        display:flex;flex-direction:column;justify-content:center;
      }
      #poi113AccessGate .poi113-card{
        position:relative;z-index:1;width:min(620px,calc(100% - 36px));margin:7vh auto;
        background:rgba(255,255,255,.96);border:1px solid rgba(185,210,219,.9);
        box-shadow:0 28px 80px rgba(17,52,66,.16);border-radius:28px;padding:28px;
      }
      #poi113CompanyGate .poi113-head{margin-bottom:28px;align-items:center}
      #poi113CompanyGate .poi113-logo{
        width:58px;height:58px;border-radius:18px;background:linear-gradient(145deg,#17394a,#1f5e78);
        box-shadow:0 10px 25px rgba(23,57,74,.18);font-size:13px
      }
      #poi113CompanyGate .poi113-head h2{font-size:34px!important;letter-spacing:-.035em;line-height:1.08}
      #poi113CompanyGate .poi113-head p{font-size:14px!important;line-height:1.55;max-width:790px;color:#627985}
      #poi113CompanyGate .poi113-close{
        min-width:86px;height:42px;border:1px solid #cfdee3;background:rgba(255,255,255,.82);
        font-size:11px;border-radius:13px
      }

      .poi115-portal-shell{display:grid;grid-template-columns:minmax(0,.82fr) minmax(560px,1.18fr);gap:46px;align-items:center}
      .poi115-portal-copy{padding:18px 8px 18px 4px}
      .poi115-kicker{display:inline-flex;align-items:center;gap:8px;border:1px solid #cfe0e6;background:rgba(255,255,255,.72);
        color:#1f5e78;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
      .poi115-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:#28a476;box-shadow:0 0 0 5px rgba(40,164,118,.10)}
      .poi115-portal-copy h3{font-size:48px;line-height:1.04;letter-spacing:-.05em;margin:22px 0 16px;color:#102735;max-width:620px}
      .poi115-portal-copy>p{font-size:16px;line-height:1.65;color:#607883;max-width:620px;margin:0}
      .poi115-portal-points{display:grid;gap:10px;margin-top:28px}
      .poi115-portal-point{display:flex;gap:11px;align-items:flex-start;color:#536b76;font-size:12px;line-height:1.5}
      .poi115-portal-point i{font-style:normal;width:26px;height:26px;flex:0 0 auto;border-radius:8px;background:#e8f3f6;color:#1f5e78;display:grid;place-items:center;font-weight:950}
      .poi115-portal-panel{
        position:relative;background:rgba(255,255,255,.78);border:1px solid rgba(195,216,223,.95);
        border-radius:30px;padding:22px;box-shadow:0 28px 70px rgba(23,57,74,.10);overflow:hidden
      }
      .poi115-portal-panel::before{
        content:"";position:absolute;width:250px;height:250px;border-radius:50%;right:-120px;top:-140px;
        background:radial-gradient(circle,rgba(31,94,120,.12),transparent 65%);pointer-events:none
      }
      .poi115-panel-title{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:16px;padding:2px 2px 4px}
      .poi115-panel-title b{font-size:15px;color:#17394a}.poi115-panel-title span{font-size:10px;color:#738892}
      .poi115-production-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important}
      .poi115-production-card{
        position:relative;overflow:hidden;min-height:235px!important;padding:22px!important;border-radius:22px!important;
        border:1px solid #d4e3e8!important;background:#fff!important;box-shadow:0 8px 22px rgba(23,57,74,.055);
        transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease!important
      }
      .poi115-production-card::before{
        content:"";position:absolute;inset:auto -34px -48px auto;width:145px;height:145px;border-radius:50%;
        background:radial-gradient(circle,rgba(31,94,120,.12),transparent 68%);transition:.22s
      }
      .poi115-production-card:nth-child(2)::before{background:radial-gradient(circle,rgba(64,110,74,.14),transparent 68%)}
      .poi115-production-card:hover{transform:translateY(-6px)!important;box-shadow:0 20px 38px rgba(23,57,74,.13)!important;border-color:#7fb3c5!important}
      .poi115-production-card:hover::before{transform:scale(1.18)}
      .poi115-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
      .poi115-company-mark{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:14px;font-weight:950;background:#e8f3f6;color:#1f5e78}
      .poi115-production-card:nth-child(2) .poi115-company-mark{background:#edf5ef;color:#46724f}
      .poi115-live-badge{display:inline-flex;gap:6px;align-items:center;font-size:8.5px;font-weight:900;color:#667d87;background:#f4f8f9;border:1px solid #e0eaed;border-radius:999px;padding:6px 8px}
      .poi115-live-badge::before{content:"";width:6px;height:6px;background:#30a578;border-radius:50%}
      .poi115-production-card b{font-size:21px!important;line-height:1.2!important}
      .poi115-production-card span{font-size:12px!important;line-height:1.55!important;color:#667d88!important}
      .poi115-production-card em{font-size:11px!important;color:#1f5e78!important;padding-top:20px!important}
      .poi115-office-link{
        margin-top:15px!important;padding:15px 16px!important;background:rgba(248,251,252,.92)!important;
        border:1px solid #d9e6ea!important;border-radius:17px!important
      }
      .poi115-office-link div b{font-size:12.5px!important}.poi115-office-link div span{font-size:10px!important;line-height:1.45!important}
      .poi115-office-link .btn{min-height:40px;font-size:10.5px!important;padding:9px 13px!important}
      .poi115-security-note{
        margin-top:14px!important;background:transparent!important;border:0!important;border-top:1px solid #deeaed!important;
        border-radius:0!important;padding:13px 2px 0!important;font-size:9.5px!important;color:#6c828c!important
      }
      .poi115-footer{margin-top:24px;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#79909a;font-size:9.5px}
      .poi115-footer strong{color:#526c77}

      /* Office home: same visual language */
      .poi115-office-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      .poi115-office-card{min-height:230px!important;border-radius:22px!important;padding:21px!important;box-shadow:0 8px 22px rgba(23,57,74,.05)}
      .poi115-office-card:hover{transform:translateY(-5px)!important;box-shadow:0 18px 34px rgba(23,57,74,.12)!important}
      .poi115-office-card .role{width:48px!important;height:48px!important;border-radius:15px!important;font-size:13px!important}
      .poi115-office-card b{font-size:18px!important;line-height:1.25!important}
      .poi115-office-card span:not(.role){font-size:11.5px!important;line-height:1.55!important}
      .poi115-office-card em{font-size:10.5px!important}
      .poi115-lock-note{font-size:10px!important;background:#f6fafb;border:1px solid #dce8ec;border-radius:13px;padding:11px 12px}

      @keyframes poi115PortalIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      .poi115-portal-copy,.poi115-portal-panel{animation:poi115PortalIn .42s ease both}
      .poi115-portal-panel{animation-delay:.07s}
      .poi115-production-card:nth-child(1){animation:poi115PortalIn .4s .12s ease both}
      .poi115-production-card:nth-child(2){animation:poi115PortalIn .4s .18s ease both}

      @media(max-width:1050px){
        .poi115-portal-shell{grid-template-columns:1fr;gap:22px}
        .poi115-portal-copy{padding-bottom:0}
        .poi115-portal-copy h3{font-size:39px;max-width:760px}
        .poi115-portal-copy>p{max-width:780px}
        #poi113CompanyGate .poi113-card{padding-top:28px;justify-content:flex-start}
      }

      /* V11.5.2 · Home professionale clienti */
      #poi113CompanyGate,#poi113AccessGate{
        background:
          radial-gradient(circle at left center,rgba(34,93,126,.055),transparent 28%),
          radial-gradient(circle at right center,rgba(217,51,74,.040),transparent 26%),
          linear-gradient(180deg,#eff4f6 0%,#edf3f5 100%)!important;
        backdrop-filter:none!important;
      }
      #poi113CompanyGate .poi113-card{
        width:min(1520px,calc(100% - 56px))!important;
        min-height:100vh!important;
        margin:0 auto!important;
        padding:34px 28px 22px!important;
        background:transparent!important;
        box-shadow:none!important;
        border:0!important;
        border-radius:0!important;
      }
      #poi113CompanyGate .poi113-head{display:none!important}
      #poi113CompanyGate .poi113-close{display:none!important}
      .poi116-home{display:flex;flex-direction:column;min-height:calc(100vh - 56px)}
      .poi116-top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
      .poi116-brand{display:flex;align-items:flex-start;gap:18px}
      .poi116-brand img{width:332px;max-width:42vw;height:auto;display:block}
      .poi116-brand-copy b{display:block;font-size:34px;line-height:1.05;letter-spacing:-.03em;color:#0f2534;margin-top:4px}
      .poi116-brand-copy span{display:block;font-size:12px;line-height:1.45;color:#6b818c;margin-top:8px}
      .poi116-top-right{text-align:right;padding-top:6px}
      .poi116-top-right b{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#4f6571}
      .poi116-top-right span{display:block;font-size:13px;color:#536d7a;margin-top:6px}
      .poi116-top-right i{display:inline-block;margin-top:12px;width:200px;height:3px;background:linear-gradient(90deg,#1f7ae0 0 50%,#e52336 50% 100%);border-radius:999px}

      .poi116-center{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:28px}
      .poi116-kicker{display:inline-flex;align-items:center;gap:10px;color:#1e61b6;font-size:11px;font-weight:900;letter-spacing:.28em;text-transform:uppercase}
      .poi116-kicker::before,.poi116-kicker::after{content:"";display:inline-block;width:96px;height:3px;border-radius:999px;background:linear-gradient(90deg,#1f7ae0 0 50%,#e52336 50% 100%)}
      .poi116-title{font-size:48px;line-height:1.08;letter-spacing:-.04em;color:#0d2356;margin:26px 0 10px;font-weight:950}
      .poi116-subtitle{font-size:15px;line-height:1.55;color:#627888;margin:0}

      .poi116-cards{display:grid;grid-template-columns:1fr 1fr;gap:30px;max-width:1160px;width:100%;margin:36px auto 0}
      .poi116-card{
        position:relative;background:rgba(255,255,255,.92);border:1px solid #d4e2e8;border-radius:26px;
        padding:28px 28px 22px;box-shadow:0 12px 30px rgba(22,51,68,.055);text-align:left;min-height:340px;
      }
      .poi116-card::before{content:"";position:absolute;left:0;top:0;width:12px;height:156px;border-radius:26px 0 16px 0;background:#1f7ae0}
      .poi116-card.multiplast::before{background:#ea1d2c}
      .poi116-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
      .poi116-card-logo{max-width:230px;height:94px;object-fit:contain;object-position:left top;display:block}
      .poi116-chip{display:inline-flex;align-items:center;justify-content:center;border-radius:14px;padding:10px 18px;font-size:12px;font-weight:850}
      .poi116-card.smartpack .poi116-chip{background:#eaf3fd;color:#1f7ae0}
      .poi116-card.multiplast .poi116-chip{background:#fdeff0;color:#ea1d2c}
      .poi116-card h3{font-size:25px;line-height:1.2;letter-spacing:-.02em;color:#0d2356;margin:22px 0 12px}
      .poi116-card p{font-size:14px;line-height:1.6;color:#5f7480;margin:0;max-width:420px;min-height:78px}
      .poi116-main-btn{margin-top:28px;width:100%;height:68px;border:0;border-radius:16px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 22px;color:#fff;font-size:15px;font-weight:900;box-shadow:0 10px 24px rgba(22,51,68,.12);cursor:pointer}
      .poi116-main-btn .left{display:flex;align-items:center;gap:16px}
      .poi116-main-btn .icon{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:16px}
      .poi116-main-btn .arrow{font-size:28px;line-height:1;font-weight:500}
      .poi116-card.smartpack .poi116-main-btn{background:linear-gradient(180deg,#1b84ea 0%,#0d6bd1 100%)}
      .poi116-card.multiplast .poi116-main-btn{background:linear-gradient(180deg,#ef2133 0%,#df0f21 100%)}

      .poi116-office-wrap{max-width:980px;width:100%;margin:30px auto 0;text-align:center}
      .poi116-office-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;color:#768995;font-size:11px;font-weight:800;letter-spacing:.24em;text-transform:uppercase}
      .poi116-office-head::before,.poi116-office-head::after{content:"";height:1px;background:#d4dfe4}
      .poi116-office-btn{margin:22px auto 0;display:flex;align-items:center;justify-content:center;gap:18px;min-height:68px;max-width:480px;width:100%;border:1px solid #d9e2e6;background:linear-gradient(180deg,#f8fbfc 0%,#f0f4f6 100%);border-radius:18px;font-size:16px;font-weight:800;color:#506779;box-shadow:0 10px 22px rgba(22,51,68,.04);cursor:pointer}
      .poi116-office-btn .lock{width:34px;height:34px;border-radius:10px;background:#e4ebef;display:grid;place-items:center;font-size:17px}
      .poi116-office-btn .arr{font-size:30px;line-height:1;margin-left:8px;color:#637989}
      .poi116-bottom{margin-top:auto;padding-top:26px;display:flex;justify-content:space-between;align-items:center;color:#6d8390;font-size:11px}
      .poi116-bottom strong{color:#436273}
      .poi116-status{display:flex;align-items:center;gap:10px}
      .poi116-status .dot{width:8px;height:8px;border-radius:50%;background:#2fb15b}

      /* uffici: mantiene stile sobrio ma coerente */
      .poi115-office-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important}


      /* V11.5.3 · home single-screen desktop/tablet */
      #poi113CompanyGate{overflow:hidden!important}
      #poi113CompanyGate .poi113-card{
        height:100vh!important;
        min-height:100vh!important;
        padding:18px 24px 14px!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      .poi116-home{
        width:min(1460px,100%)!important;
        height:100%!important;
        min-height:0!important;
        display:grid!important;
        grid-template-rows:auto 1fr auto!important;
        gap:10px!important;
      }
      .poi116-top{margin-bottom:0!important}
      .poi116-brand{gap:14px!important}
      .poi116-brand img{width:250px!important;max-width:28vw!important}
      .poi116-brand-copy b{
        font-size:clamp(23px,2.2vw,31px)!important;
        line-height:1.04!important;
        margin-top:2px!important
      }
      .poi116-brand-copy span{font-size:11px!important;margin-top:6px!important}
      .poi116-top-right{padding-top:2px!important}
      .poi116-top-right b{font-size:10px!important}
      .poi116-top-right span{font-size:11px!important;margin-top:4px!important}
      .poi116-top-right i{margin-top:8px!important;width:150px!important}

      .poi116-center{
        justify-content:center!important;
        padding-top:2px!important
      }
      .poi116-kicker{font-size:9.5px!important;letter-spacing:.22em!important}
      .poi116-kicker::before,.poi116-kicker::after{width:72px!important}
      .poi116-title{
        font-size:clamp(34px,3.3vw,58px)!important;
        line-height:1.03!important;
        margin:12px 0 6px!important
      }
      .poi116-subtitle{
        font-size:13px!important;
        line-height:1.45!important
      }

      .poi116-cards{
        max-width:1100px!important;
        margin:20px auto 0!important;
        gap:18px!important
      }
      .poi116-card{
        min-height:255px!important;
        padding:20px 22px 18px!important;
        border-radius:22px!important
      }
      .poi116-card::before{
        width:10px!important;
        height:112px!important;
        border-radius:22px 0 14px 0!important
      }
      .poi116-card-logo{
        max-width:165px!important;
        height:72px!important
      }
      .poi116-chip{
        padding:8px 15px!important;
        font-size:11px!important;
        border-radius:12px!important
      }
      .poi116-card h3{
        font-size:18px!important;
        margin:16px 0 9px!important
      }
      .poi116-card p{
        font-size:12.5px!important;
        line-height:1.5!important;
        min-height:40px!important;
        max-width:360px!important
      }
      .poi116-main-btn{
        margin-top:20px!important;
        height:56px!important;
        border-radius:14px!important;
        padding:0 18px 0 17px!important;
        font-size:13px!important
      }
      .poi116-main-btn .left{gap:12px!important}
      .poi116-main-btn .icon{
        width:25px!important;
        height:25px!important;
        font-size:14px!important
      }
      .poi116-main-btn .arrow{font-size:24px!important}

      .poi116-office-wrap{
        max-width:860px!important;
        margin:18px auto 0!important
      }
      .poi116-office-head{
        gap:12px!important;
        font-size:9px!important;
        letter-spacing:.20em!important
      }
      .poi116-office-btn{
        margin-top:12px!important;
        min-height:58px!important;
        max-width:420px!important;
        border-radius:16px!important;
        gap:14px!important;
        font-size:14px!important
      }
      .poi116-office-btn .lock{
        width:29px!important;
        height:29px!important;
        font-size:15px!important
      }
      .poi116-office-btn .arr{
        font-size:25px!important;
        margin-left:2px!important
      }

      .poi116-bottom{
        padding-top:10px!important;
        font-size:10px!important
      }

      @media(max-width:1180px){
        #poi113CompanyGate .poi113-card{
          padding:16px 18px 12px!important;
        }
        .poi116-home{
          width:min(1220px,100%)!important;
          gap:8px!important
        }
        .poi116-brand img{width:212px!important;max-width:24vw!important}
        .poi116-brand-copy b{font-size:25px!important}
        .poi116-top-right i{width:130px!important}
        .poi116-title{font-size:clamp(30px,3.5vw,44px)!important}
        .poi116-cards{max-width:980px!important;gap:14px!important}
        .poi116-card{min-height:235px!important}
        .poi116-card-logo{max-width:140px!important;height:62px!important}
        .poi116-card h3{font-size:16px!important}
        .poi116-card p{font-size:11.8px!important}
      }

      @media(max-width:900px){
        #poi113CompanyGate{overflow:auto!important}
        #poi113CompanyGate .poi113-card{
          height:auto!important;
          min-height:100vh!important;
          padding:18px 14px 18px!important;
          align-items:flex-start!important
        }
        .poi116-home{
          height:auto!important;
          display:flex!important;
          flex-direction:column!important;
          gap:14px!important
        }
        .poi116-top{flex-direction:column!important;align-items:flex-start!important}
        .poi116-top-right{text-align:left!important}
        .poi116-top-right i{width:120px!important}
        .poi116-brand img{width:220px!important;max-width:56vw!important}
        .poi116-kicker::before,.poi116-kicker::after{width:32px!important}
        .poi116-title{font-size:32px!important;line-height:1.08!important}
        .poi116-cards{
          grid-template-columns:1fr!important;
          max-width:680px!important;
          gap:16px!important;
          margin-top:18px!important
        }
        .poi116-card{min-height:unset!important}
        .poi116-office-wrap{margin-top:12px!important}
        .poi116-bottom{
          flex-direction:column!important;
          align-items:flex-start!important;
          gap:6px!important
        }
      }

      @media(max-width:1180px){
        .poi116-brand img{width:270px}
        .poi116-brand-copy b{font-size:30px}
        .poi116-title{font-size:40px}
        .poi116-cards{gap:20px}
      }
      @media(max-width:980px){
        .poi116-top{flex-direction:column;align-items:flex-start}
        .poi116-top-right{text-align:left}
        .poi116-top-right i{width:170px}
        .poi116-kicker::before,.poi116-kicker::after{width:56px}
        .poi116-title{font-size:36px}
        .poi116-cards{grid-template-columns:1fr;max-width:740px}
        .poi116-card{min-height:unset}
      }

      @media(max-width:760px){
        #poi113CompanyGate .poi113-card{width:100%;padding:22px 15px 28px}
        #poi113CompanyGate .poi113-head h2{font-size:27px!important}
        #poi113CompanyGate .poi113-head p{font-size:12px!important}
        .poi115-portal-copy h3{font-size:34px}
        .poi115-portal-copy>p{font-size:13px}
        .poi115-production-grid,.poi115-office-grid{grid-template-columns:1fr!important}
        .poi115-production-card,.poi115-office-card{min-height:185px!important}
        .poi115-office-link{align-items:flex-start!important;flex-direction:column!important}
        .poi115-office-link .btn{width:100%}
        .poi115-portal-panel{padding:15px;border-radius:22px}
        .poi115-footer{align-items:flex-start;flex-direction:column}
      }


      /* V11.5 refinement — meno testo, più pulizia visiva */
      .poi116-top-clean{
        justify-content:center!important;align-items:center!important;
        margin:0 0 18px!important;padding:2px 0 18px!important;
        border-bottom:1px solid #e9eff2
      }
      .poi116-brand-clean{
        justify-content:center!important;align-items:center!important;
        width:100%!important;gap:0!important
      }
      .poi116-brand-clean img{
        width:320px!important;max-width:min(66vw,320px)!important;
        height:auto!important;object-fit:contain!important;margin:0 auto!important
      }
      .poi116-center{padding-top:10px!important}
      .poi116-title{
        margin:14px 0 7px!important;font-size:clamp(34px,3.5vw,48px)!important;
        letter-spacing:-.035em!important;color:#102d42!important
      }
      .poi116-subtitle{font-size:13px!important;color:#6d818b!important;margin:0!important}

      .poi1180-device-note{margin:8px 0 10px;padding:8px 10px;border-radius:10px;background:#eef7f4;color:#45665b;font-size:9px;line-height:1.4}.poi1180-device-note b{font-weight:950}
      .poi116-office-login{
        margin:14px auto 0;max-width:860px;width:100%;
        border:1px solid #dce7eb;background:rgba(255,255,255,.94);
        border-radius:16px;padding:14px;box-shadow:0 8px 20px rgba(22,51,68,.04);
        animation:poi116OfficeFormIn .18s ease both
      }
      .poi116-office-login form{
        display:grid;grid-template-columns:minmax(220px,1fr) minmax(190px,1fr) auto auto;
        gap:10px;align-items:end
      }
      .poi116-office-login label{
        display:grid;gap:5px;text-align:left;font-size:9px;font-weight:850;color:#607681
      }
      .poi116-office-login input{
        width:100%;height:42px;box-sizing:border-box;border:1px solid #cfdee3;
        border-radius:11px;background:#fff;padding:0 12px;font-size:12px;color:#173141;outline:none
      }
      .poi116-office-login input:focus{
        border-color:#5d9fbd;box-shadow:0 0 0 3px rgba(31,94,120,.08)
      }
      .poi116-office-login .poi116-office-submit,
      .poi116-office-login .poi116-office-cancel{
        height:42px;border-radius:11px;padding:0 16px;font-size:11px;font-weight:900;cursor:pointer;white-space:nowrap
      }
      .poi116-office-login .poi116-office-submit{
        border:1px solid #1f5e78;background:#1f5e78;color:#fff
      }
      .poi116-office-login .poi116-office-submit:disabled{opacity:.65;cursor:wait}
      .poi116-office-login .poi116-office-cancel{
        border:1px solid #d5e1e5;background:#fff;color:#5b717c
      }
      .poi116-office-login .poi116-office-error{
        grid-column:1/-1;display:none;text-align:left;color:#a33c46;font-size:9.5px;font-weight:800;padding:0 2px
      }
      .poi116-office-login .poi116-office-error.show{display:block}
      @keyframes poi116OfficeFormIn{
        from{opacity:0;transform:translateY(-5px)}
        to{opacity:1;transform:none}
      }
      @media(max-width:820px){
        .poi116-top-clean{align-items:center!important}
        .poi116-brand-clean img{width:270px!important;max-width:72vw!important}
        .poi116-office-login form{grid-template-columns:1fr 1fr}
        .poi116-office-login .poi116-office-submit,
        .poi116-office-login .poi116-office-cancel{width:100%}
      }
      @media(max-width:560px){
        .poi116-brand-clean img{width:235px!important;max-width:78vw!important}
        .poi116-title{font-size:31px!important}
        .poi116-office-login{
          margin-top:10px!important;
          padding:13px!important;
          border-radius:14px!important;
          scroll-margin-top:12px;
        }
        .poi116-office-login form{grid-template-columns:1fr}
        .poi116-office-login input{
          min-height:50px!important;
          height:50px!important;
          font-size:16px!important;
        }
        .poi116-office-login .poi116-office-submit,
        .poi116-office-login .poi116-office-cancel{
          min-height:50px!important;height:50px!important;font-size:14px!important;
          touch-action:manipulation;
        }
        .poi116-office-login .poi116-office-error{grid-column:1;font-size:12px!important;line-height:1.4}
      }

      @media(max-width:760px){.poi113-company-grid,.poi113-admin-grid,.poi113-form-grid,.poi115-production-grid,.poi115-office-grid{grid-template-columns:1fr}.poi113-form-grid .full{grid-column:auto}.poi113-card{padding:16px}.poi113-overlay{padding:10px}.poi113-employee,.poi113-request{grid-template-columns:1fr}.poi113-row-actions{justify-content:flex-start}.poi113-request select{min-width:100%;max-width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    injectStyles();
    if(!$('#poi113CompanyGate'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113CompanyGate"><section class="poi113-card">
        <div class="poi113-head"><div class="poi113-logo">SP·MP</div><div class="grow"><h2>Seleziona l’azienda</h2><p>Entra nell’ambiente di lavoro e poi usa il tuo USER e PIN personale.</p></div><button class="poi113-close" id="poi113CompanyLogout" type="button">Esci</button>
            <button class="poi1187-exit" id="poi1187OfficeExit" type="button">Esci</button></div>
        <div id="poi113CompanyBody"></div>
      </section></div>`);
    if(!$('#poi113AccessGate'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113AccessGate"><section class="poi113-card narrow">
        <div class="poi113-head"><div class="poi113-logo" id="poi113AccessLogo">SP</div><div class="grow"><h2 id="poi113AccessTitle">Accesso dipendente</h2><p>Non serve un indirizzo e-mail.</p></div><button class="poi113-close" id="poi113AccessBack" type="button">Indietro</button></div>
        <div id="poi113AccessBody"></div>
      </section></div>`);
    if(!$('#poi113Nomyra'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113Nomyra"><section class="poi113-card">
        <div class="poi113-head"><div class="poi113-logo">NY</div><div class="grow"><h2>Area riservata NOMYRA</h2><p>Creazione USER, primo PIN e amministrazione degli accessi del cliente.</p></div><button class="poi113-close" id="poi113NomyraLogout" type="button">Esci</button></div>
        <div class="poi113-tabs" id="poi113AdminTabs"></div>
        <div class="poi113-admin-grid">
          <div class="poi113-panel"><h3>Nuovo dipendente</h3><p>Solo NOMYRA può creare l’utente. Il primo PIN ha esattamente 6 cifre e dovrà essere cambiato al primo accesso.</p>
            <form id="poi113CreateForm"><div class="poi113-form-grid">
              <label class="field full">Nome e cognome<input name="display_name" required maxlength="100" placeholder="Mario Rossi"></label>
              <label class="field">USER<input name="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" autocomplete="off" placeholder="mario.rossi"></label>
              <label class="field">Primo PIN<input name="pin" required inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="new-password" placeholder="6 cifre"></label>
              <label class="field full">Profilo<select name="role_code" required></select></label>
              <div class="poi113-error full" id="poi113CreateError"></div>
              <button class="btn primary full" type="submit">Crea USER e primo PIN</button>
            </div></form>
          </div>
          <div class="poi113-panel"><h3 id="poi113ListTitle">Utenti</h3><p>Il PIN non è mai visibile. Può soltanto essere sostituito con un nuovo PIN temporaneo.</p><div id="poi113EmployeeList"><div class="poi113-empty">Caricamento…</div></div></div>
        </div>
        <div class="poi113-actions stretch"><button class="btn" id="poi113OpenOperations" type="button">Apri azienda come amministratore</button><button class="btn" id="poi113OpenRecoveries" type="button">Richieste di recupero</button></div>
      </section></div>`);
    if(!$('#poi113RecoveryAdmin'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113RecoveryAdmin"><section class="poi113-card">
        <div class="poi113-head"><div class="poi113-logo">RA</div><div class="grow"><h2>Recupero accessi dipendenti</h2><p>Le richieste degli operai arrivano qui, all’account base del cliente.</p></div><button class="poi113-close" id="poi113RecoveryAdminClose" type="button">Chiudi</button></div>
        <div class="poi113-tabs" id="poi113RecoveryTabs"></div>
        <div class="poi113-admin-grid">
          <div class="poi113-panel"><h3>Richieste</h3><p>Associa la persona al suo USER. Per un PIN smarrito assegna un nuovo PIN temporaneo di 6 cifre.</p><div id="poi113RecoveryList"><div class="poi113-empty">Caricamento…</div></div></div>
          <div class="poi113-panel"><h3>Elenco USER</h3><p>Consultazione per identificare il dipendente. La creazione e la sospensione restano riservate a NOMYRA.</p><div id="poi113Directory"><div class="poi113-empty">Caricamento…</div></div></div>
        </div>
      </section></div>`);
    if(!$('#poi113RecoveryRequest'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113RecoveryRequest"><section class="poi113-card narrow">
        <div class="poi113-head"><div class="poi113-logo">?</div><div class="grow"><h2>Recupera USER o PIN</h2><p id="poi113RecoveryRequestSub">La richiesta sarà inviata all’account aziendale.</p></div><button class="poi113-close" id="poi113RecoveryRequestClose" type="button">Chiudi</button></div>
        <form id="poi113RecoveryForm"><div class="poi113-form-grid">
          <label class="field full">Cosa hai dimenticato?<select name="request_kind"><option value="forgot_pin">PIN</option><option value="forgot_username">USER</option><option value="both">USER e PIN</option></select></label>
          <label class="field full" id="poi113RecoveryUsernameLabel">USER conosciuto<input name="username" maxlength="40" pattern="[A-Za-z0-9._-]+" autocomplete="off" placeholder="es. mario.rossi"></label>
          <label class="field full">Nome e cognome o matricola<input name="identity_hint" required minlength="2" maxlength="120" autocomplete="off" placeholder="Serve al responsabile per riconoscerti"></label>
          <label class="field full">Nota facoltativa<textarea name="note" maxlength="500" rows="3" placeholder="Reparto, turno o altra informazione utile"></textarea></label>
          <div class="poi113-error full" id="poi113RecoveryError"></div><div class="poi113-success full" id="poi113RecoverySuccess"></div>
          <button class="btn primary full" type="submit">Invia richiesta all’account aziendale</button>
        </div></form>
      </section></div>`);
    if(!$('#poi113PinChange'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113PinChange"><section class="poi113-card narrow">
        <div class="poi113-head"><div class="poi113-logo">PIN</div><div class="grow"><h2 id="poi113PinTitle">Cambia PIN personale</h2><p id="poi113PinSub">Il nuovo PIN deve contenere esattamente 6 cifre.</p></div><button class="poi113-close" id="poi113PinClose" type="button">Annulla</button></div>
        <form id="poi113PinForm"><div class="poi113-form-grid">
          <label class="field full" id="poi113CurrentPinLabel">PIN attuale<input name="current_pin" inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="current-password" placeholder="6 cifre"></label>
          <label class="field">Nuovo PIN<input name="new_pin" required inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="new-password" placeholder="6 cifre"></label>
          <label class="field">Ripeti nuovo PIN<input name="confirm_pin" required inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="new-password" placeholder="6 cifre"></label>
          <div class="poi113-error full" id="poi113PinError"></div>
          <button class="btn primary full" type="submit">Salva il nuovo PIN</button>
        </div></form>
      </section></div>`);

    $('#poi113CompanyLogout').onclick=corporateLogout;
    $('#poi113AccessBack').onclick=showProductionHome;
    $('#poi113NomyraLogout').onclick=corporateLogout;
    $('#poi113RecoveryAdminClose').onclick=()=>{$('#poi113RecoveryAdmin').classList.remove('open');isPlatform()?openNomyra():showCompanyMenu()};
    $('#poi113RecoveryRequestClose').onclick=()=>$('#poi113RecoveryRequest').classList.remove('open');
    $('#poi113PinClose').onclick=cancelPinChange;
    $('#poi113CreateForm').onsubmit=createEmployee;
    $('#poi113RecoveryForm').onsubmit=createRecoveryRequest;
    $('#poi113RecoveryForm [name="request_kind"]').onchange=updateRecoveryUsernameRequirement;
    $('#poi113PinForm').onsubmit=changePin;
    $('#poi113OpenOperations').onclick=openPlatformOperations;
    $('#poi113OpenRecoveries').onclick=()=>openRecoveryAdmin(manageCompany);
    decorateAuth();
    decorateCloudMenu();
  }

  function closeOverlays(){ $$('.poi113-overlay').forEach(x=>x.classList.remove('open')); }
  function rememberCompany(company){
    if(company)localStorage.setItem(DEVICE_COMPANY_KEY,company);
    else localStorage.removeItem(DEVICE_COMPANY_KEY);
  }

  function rememberEmployeeSession(value){
    if(value){
      localStorage.setItem(DEVICE_EMPLOYEE_KEY,JSON.stringify(value));
      rememberCompany(value.company_code||'');
    }else{
      localStorage.removeItem(DEVICE_EMPLOYEE_KEY);
    }
  }

  function rememberOfficeSession(role=''){
    officeUnlockedFlag=true;
    localStorage.setItem(DEVICE_OFFICE_UNLOCKED_KEY,'1');
    if(role){
      localStorage.setItem(DEVICE_OFFICE_ROLE_KEY,role);
      const company=role==='manager'?'multiplast':'smartpack';
      rememberCompany(company);
    }
  }

  function clearRememberedOffice({keepUnlocked=false}={}){
    localStorage.removeItem(DEVICE_OFFICE_ROLE_KEY);
    if(!keepUnlocked){
      localStorage.removeItem(DEVICE_OFFICE_UNLOCKED_KEY);
      officeUnlockedFlag=false;
    }
  }

  function clearRememberedDeviceSession(){
    localStorage.removeItem(DEVICE_EMPLOYEE_KEY);
    localStorage.removeItem(DEVICE_OFFICE_UNLOCKED_KEY);
    localStorage.removeItem(DEVICE_OFFICE_ROLE_KEY);
    localStorage.removeItem(DEVICE_COMPANY_KEY);
    officeUnlockedFlag=false;
  }

  function corporateLogout(){
    closeOverlays();
    sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);sessionStorage.removeItem(OFFICE_ROLE_KEY);
    sessionStorage.removeItem('industrialos_role_session');
    clearRememberedDeviceSession();
    employee=null;selectedCompany='';
    $('#poiCloudLogout')?.click();
  }

  const officeUnlocked=()=>officeUnlockedFlag===true; // dopo verifica password; resta valido sul dispositivo finché l'utente non blocca/esce
  const expectedProductionRole=company=>company==='multiplast'?'mpworker':'worker';
  function hydrateRememberedSession(){
    if(employee?.company_code){
      selectedCompany=employee.company_code;
      sessionStorage.setItem(EMPLOYEE_KEY,JSON.stringify(employee));
      sessionStorage.setItem(COMPANY_KEY,selectedCompany);
      sessionStorage.setItem('nomyra_group_company_v92',selectedCompany);
      sessionStorage.setItem('nomyra_group_role_v92',employee.role_code);
      sessionStorage.setItem('industrialos_role_session',employee.role_code);
      return;
    }

    if(officeUnlocked()){
      const role=localStorage.getItem(DEVICE_OFFICE_ROLE_KEY)||'';
      const company=localStorage.getItem(DEVICE_COMPANY_KEY)||(role==='manager'?'multiplast':role?'smartpack':'');
      if(company){
        selectedCompany=company;
        sessionStorage.setItem(COMPANY_KEY,company);
        sessionStorage.setItem('nomyra_group_company_v92',company);
      }
      if(['director','manager','admin'].includes(role)){
        sessionStorage.setItem(OFFICE_ROLE_KEY,role);
        sessionStorage.setItem('nomyra_group_role_v92',role);
        sessionStorage.setItem('industrialos_role_session',role);
      }
    }
  }
  hydrateRememberedSession();


  function hideLegacyProfileGate(){
    const legacy=$('#accessGate');if(legacy)legacy.style.setProperty('display','none','important');
    const oldLogout=$('#logoutProfile');
    if(oldLogout){
      oldLogout.dataset.poi115='1';
      oldLogout.onclick=profileExit;
      const mode=oldLogout.querySelector('#profileMode');
      if(!employee&&officeUnlocked()){
        // Keep the current role name, but make the action explicit.
        const txt=[...oldLogout.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
        if(txt)txt.textContent=' · Cambia area';
        oldLogout.title='Torna alla scelta area ufficio';
      }
    }
  }

  function profileExit(event){
    event?.preventDefault?.();event?.stopPropagation?.();
    if(employee){employeeLogout();return false}
    if(isPlatform()){corporateLogout();return false}
    if(officeUnlocked()){
      // Uscita da Gestione Smart Pack / Multiplast / Amministrazione:
      // mantiene valida la sessione uffici e torna al selettore dei ruoli.
      sessionStorage.removeItem(OFFICE_ROLE_KEY);
      sessionStorage.removeItem('industrialos_role_session');
      sessionStorage.removeItem(COMPANY_KEY);
      sessionStorage.removeItem('nomyra_group_company_v92');
      sessionStorage.removeItem('nomyra_group_role_v92');
      localStorage.removeItem(DEVICE_OFFICE_ROLE_KEY);
      localStorage.removeItem(DEVICE_COMPANY_KEY);
      selectedCompany='';
      showOfficeMenu();
      return false;
    }
    showProductionHome();return false;
  }

  function showProductionHome(){
    ensureUI();if(!profile())return;
    closeOverlays();hideLegacyProfileGate();
    document.getElementById('poi113CompanyGate')?.classList.remove('poi115-office-menu-mode');
    // Non azzerare officeUnlockedFlag: l'accesso globale e-mail/password
    // è già una verifica esplicita dell'account aziendale.
    employee=null;pendingEntry=null;
    sessionStorage.removeItem(EMPLOYEE_KEY);
    sessionStorage.removeItem(OFFICE_ROLE_KEY);
    sessionStorage.removeItem('industrialos_role_session');
    const gate=$('#poi113CompanyGate'),body=$('#poi113CompanyBody');
    $('#poi113CompanyLogout').style.display='none';

    body.innerHTML=`
      <div class="poi116-home">
        <div class="poi116-top poi116-top-clean">
          <div class="poi116-brand poi116-brand-clean">
            <img src="./group-logo.webp" alt="Smart Pack Multiplast">
          </div>
        </div>

        <div class="poi116-center">
          <h1 class="poi116-title">Accesso operativo</h1>
          <p class="poi116-subtitle">Seleziona l’area di lavoro.</p>

          <div class="poi116-cards">
            <section class="poi116-card smartpack">
              <div class="poi116-card-top">
                <img class="poi116-card-logo" src="./smartpack-logo.webp" alt="Smart Pack">
                <span class="poi116-chip">Produzione</span>
              </div>
              <h3>Produzione Smart Pack</h3>
              <p>Accedi alla postazione operativa del reparto Smart Pack.</p>
              <button class="poi116-main-btn" type="button" onclick="POIV113.openProductionLogin('smartpack')">
                <span class="left"><span class="icon">👤</span><span>Accedi con USER + PIN</span></span>
                <span class="arrow">→</span>
              </button>
            </section>

            <section class="poi116-card multiplast">
              <div class="poi116-card-top">
                <img class="poi116-card-logo" src="./multiplast-logo.webp" alt="Multiplast">
                <span class="poi116-chip">Produzione</span>
              </div>
              <h3>Produzione Multiplast</h3>
              <p>Accedi alla postazione operativa del reparto Multiplast.</p>
              <button class="poi116-main-btn" type="button" onclick="POIV113.openProductionLogin('multiplast')">
                <span class="left"><span class="icon">👤</span><span>Accedi con USER + PIN</span></span>
                <span class="arrow">→</span>
              </button>
            </section>
          </div>

          <div class="poi116-office-wrap" id="poi116OfficeWrap">
            <div class="poi116-office-head"><span>Accesso riservato</span></div>
            <button class="poi116-office-btn" type="button" onclick="POIV113.openOfficeLogin()">
              <span class="lock">🔒</span>
              <span>Accesso uffici / amministrazione</span>
              <span class="arr">→</span>
            </button>
          </div>
        </div>

        <div class="poi116-bottom">
          <div><strong>Portale riservato</strong> &nbsp;·&nbsp; uso aziendale</div>
          <div class="poi116-status"><span>v11.5</span><span>|</span><span class="dot"></span><span>Online</span></div>
        </div>
      </div>`;

    gate.classList.add('open');decorateCloudMenu();
  }

  function showOfficeMenu(){
    ensureUI();if(!profile())return;if(isPlatform()){openNomyra();return}
    if(!officeUnlocked()){openOfficeLogin();return}
    closeOverlays();hideLegacyProfileGate();
    const gate=$('#poi113CompanyGate'),body=$('#poi113CompanyBody');
    gate?.classList.add('poi115-office-menu-mode');
    $('.poi113-head h2',gate).textContent='Area uffici';
    $('.poi113-head p',gate).textContent='Scegli la funzione di lavoro autorizzata per questo account.';
    $('.poi113-logo',gate).textContent='UFF';
    $('#poi113CompanyLogout').style.display='inline-flex';$('#poi113CompanyLogout').textContent='Blocca';
    $('#poi113CompanyLogout').onclick=()=>{
      officeUnlockedFlag=false;
      sessionStorage.removeItem(OFFICE_ROLE_KEY);
      sessionStorage.removeItem('industrialos_role_session');
      clearRememberedOffice();
      showProductionHome();
    };

    body.innerHTML=`
      <div class="poi115-portal-shell">
        <section class="poi115-portal-copy">
          <span class="poi115-kicker">Accesso uffici verificato</span>
          <h3>Controllo, pianificazione e amministrazione.</h3>
          <p>Le funzioni di responsabilità restano separate dalle postazioni operative. Quando blocchi l’area uffici, la piattaforma torna automaticamente alla home Produzione.</p>
          <div class="poi115-portal-points">
            <div class="poi115-portal-point"><i>SP</i><span><b>Smart Pack</b><br>Ordini, Gmail, IML, pianificazione, registro e controllo produzione.</span></div>
            <div class="poi115-portal-point"><i>MP</i><span><b>Multiplast</b><br>Presse, priorità, consegne, turni, miscele e materiali.</span></div>
            <div class="poi115-portal-point"><i>AM</i><span><b>Amministrazione</b><br>DDT, consegne, documenti, chiusure e tracciabilità amministrativa.</span></div>
          </div>
        </section>

        <section class="poi115-portal-panel">
          <div class="poi115-panel-title"><div><b>Scegli area ufficio</b><span>Sessione aziendale sbloccata</span></div><span>Accesso protetto</span></div>
          <div class="poi115-office-grid">
            <button class="poi115-office-card" type="button" onclick="POIV113.enterOfficeRole('director')">
              <span class="role">SP</span><b>Gestione Smart Pack</b><span>Ordini, clienti, Gmail, IML, pianificazione, registro e controllo produttivo.</span><em>Entra →</em>
            </button>
            <button class="poi115-office-card" type="button" onclick="POIV113.enterOfficeRole('manager')">
              <span class="role">MP</span><b>Responsabile produzione Multiplast</b><span>Piano presse, priorità, consegne, miscele, materiali e performance.</span><em>Entra →</em>
            </button>
            <button class="poi115-office-card" type="button" onclick="POIV113.enterOfficeRole('admin')">
              <span class="role">AM</span><b>Amministrazione</b><span>DDT, consegne, chiusure ordine, documenti e tracciabilità.</span><em>Entra →</em>
            </button>
            <button class="poi115-office-card poi1179-users-card" type="button" onclick="window.SPUsersV1178?.open?.()">
              <span class="role">US</span><b>Utenti e accessi</b><span>Crea USER + PIN, gestisci operatori Smart Pack e Multiplast, sospendi accessi e resetta i PIN.</span><em>Gestisci →</em>
            </button>
          </div>

          <section class="v11914-modules v11915-structural-finance" data-v11914-modules data-v11915-finance-structural>
            <div class="v11914-modules-label">
              <span>MODULI NOMYRA</span>
              <small>Strumenti specialistici collegati alla piattaforma operativa</small>
            </div>
            <a class="v11914-finance-card"
               href="https://nomyra-finance.pages.dev/"
               target="_blank"
               rel="noopener noreferrer">
              <div class="v11914-finance-mark">NF</div>
              <div class="v11914-finance-copy">
                <span>NOMYRA FINANCE</span>
                <b>Analisi finanziaria avanzata</b>
                <p>Bilanci, indicatori, trend, confronti e report economico-finanziari approfonditi.</p>
              </div>
              <div class="v11914-finance-open">
                <small>Modulo separato</small>
                <strong>Apri Finance ↗</strong>
              </div>
            </a>
          </section>

          <div class="poi115-lock-note">Questa postazione resta collegata anche dopo F5 o riapertura del browser. Premi <b>Blocca</b> quando vuoi chiudere volontariamente la sessione uffici.</div>
        </section>
      </div>
      <div class="poi115-footer"><span><strong>Area uffici</strong> · sessione protetta</span><span>Blocca quando lasci la postazione</span></div>`;

    gate.classList.add('open');decorateCloudMenu();
  }

  function resetOfficeInlineLogin(){
    const wrap=$('#poi116OfficeWrap');
    if(!wrap){showProductionHome();return}
    wrap.innerHTML=`
      <div class="poi116-office-head"><span>Accesso riservato</span></div>
      <button class="poi116-office-btn" type="button" onclick="POIV113.openOfficeLogin()">
        <span class="lock">🔒</span>
        <span>Accesso uffici / amministrazione</span>
        <span class="arr">→</span>
      </button>`;
  }

  async function resolveAuthenticatedEmailV1195(){
    // 1) Fast local source: profile / cloud wrapper.
    try{
      const email=String(api()?.getUser?.()?.email||'').trim().toLowerCase();
      if(email)return email;
    }catch(_){}

    // 2) Local Supabase session: does not require a network roundtrip.
    try{
      const sb=client();
      const {data}=await sb.auth.getSession();
      const email=String(data?.session?.user?.email||'').trim().toLowerCase();
      if(email)return email;
    }catch(_){}

    // 3) Server-validated user as final fallback.
    try{
      const sb=client();
      const {data}=await sb.auth.getUser();
      return String(data?.user?.email||'').trim().toLowerCase();
    }catch(_){
      return '';
    }
  }

  async function verifyOfficePasswordV1196(email,password){
    const primary=client();
    if(!primary)throw new Error('Connessione cloud non disponibile.');

    // Verifica password su un client Supabase SEPARATO.
    // Così il client principale resta autenticato e non riceve SIGNED_IN.
    const base=String(primary.supabaseUrl||'').replace(/\/+$/,'');
    const key=String(primary.supabaseKey||'');

    const createClient=
      window.supabase?.createClient ||
      window.Supabase?.createClient ||
      null;

    if(base && key && typeof createClient==='function'){
      const temp=createClient(base,key,{
        auth:{
          persistSession:false,
          autoRefreshToken:false,
          detectSessionInUrl:false,
          storage:{
            getItem:()=>null,
            setItem:()=>{},
            removeItem:()=>{}
          }
        },
        global:{
          headers:{'X-Client-Info':'nomyra-office-reauth/1.0'}
        }
      });

      const timeout=new Promise((_,reject)=>{
        setTimeout(()=>reject(new Error('Verifica timeout')),12000);
      });

      const authCall=temp.auth.signInWithPassword({email,password});
      const result=await Promise.race([authCall,timeout]);

      if(result?.error)throw result.error;
      if(!result?.data?.session)throw new Error('Sessione di verifica non creata.');

      // Il client temporaneo non deve conservare alcuna sessione.
      try{await temp.auth.signOut({scope:'local'})}catch(_){}
      return true;
    }

    // Fallback compatibile: client principale, protetto dal guard.
    // Usato soltanto se la libreria globale non espone createClient.
    officeReauthInProgress=true;
    sessionStorage.setItem(OFFICE_REAUTH_KEY,'1');
    try{
      const timeout=new Promise((_,reject)=>{
        setTimeout(()=>reject(new Error('Verifica timeout')),12000);
      });
      const authCall=primary.auth.signInWithPassword({email,password});
      const result=await Promise.race([authCall,timeout]);
      if(result?.error)throw result.error;
      if(!result?.data?.session)throw new Error('Sessione non creata.');
      return true;
    }finally{
      setTimeout(()=>{
        officeReauthInProgress=false;
        sessionStorage.removeItem(OFFICE_REAUTH_KEY);
      },1500);
    }
  }

  async function openOfficeLogin(){
    ensureUI();hideLegacyProfileGate();

    // Se l'utente ha appena effettuato il login nel portale generale,
    // non chiedere una seconda volta e-mail e password.
    if(officeUnlocked()){
      showOfficeMenu();
      return;
    }

    // Login uffici richiesto soltanto dopo un blocco esplicito.
    officeUnlockedFlag=false;
    sessionStorage.removeItem(OFFICE_ROLE_KEY);
    sessionStorage.removeItem('industrialos_role_session');

    const gate=$('#poi113CompanyGate');
    if(!gate?.classList.contains('open')||!$('#poi116OfficeWrap')){
      showProductionHome();
    }

    const wrap=$('#poi116OfficeWrap');
    if(!wrap)return;

    wrap.innerHTML=`
      <div class="poi116-office-head"><span>Sblocca area uffici</span></div>
      <div class="poi1189-office-security">
        <b>Area riservata.</b>
        L'account aziendale è già collegato. Conferma la password per abilitare Amministrazione e gli altri moduli ufficio su questa postazione.
      </div>
      <div class="poi116-office-login">
        <form id="poi116OfficeInlineForm" autocomplete="off">
          <label class="poi1189-account-label">Account collegato
            <input name="email" type="email" required autocomplete="username" readonly>
          </label>
          <label>Password uffici
            <input name="password" type="password" required autocomplete="current-password" placeholder="Inserisci la password">
          </label>
          <button class="poi116-office-submit" type="submit">Sblocca uffici</button>
          <button class="poi116-office-cancel" type="button" onclick="POIV113.cancelOfficeLogin()">Annulla</button>
          <div class="poi116-office-error" id="poi116OfficeInlineError"></div>
        </form>
      </div>`;

    const form=$('#poi116OfficeInlineForm');
    let authenticatedEmail=await resolveAuthenticatedEmailV1195();
    if(authenticatedEmail)form.elements.email.value=authenticatedEmail;

    if(!authenticatedEmail){
      const err=$('#poi116OfficeInlineError');
      err.textContent='Non riesco a leggere l’account collegato su questo browser. Torna alla home, esci e accedi nuovamente.';
      err.classList.add('show');
      form.querySelector('.poi116-office-submit').disabled=true;
    }

    // Chrome Android sometimes scrolls the page while focusing immediately
    // after DOM replacement. Delay slightly and scroll the form into view.
    setTimeout(()=>{
      try{
        form?.scrollIntoView?.({block:'center',behavior:'smooth'});
        form?.elements?.password?.focus?.({preventScroll:true});
      }catch(_){
        try{form?.elements?.password?.focus?.()}catch(__){}
      }
    },180);

    form.onsubmit=async e=>{
      e.preventDefault();
      const err=$('#poi116OfficeInlineError');
      const btn=form.querySelector('.poi116-office-submit');
      const email=authenticatedEmail;
      const password=String(form.elements.password.value||'');

      err.classList.remove('show');
      err.textContent='';
      btn.disabled=true;
      btn.textContent='Verifica…';

      try{
        if(!email)throw new Error('Account collegato non disponibile.');
        if(!password)throw new Error('Inserisci la password.');

        await verifyOfficePasswordV1196(email,password);

        officeUnlockedFlag=true;
        rememberOfficeSession('');
        sessionStorage.removeItem(EMPLOYEE_KEY);
        localStorage.removeItem(DEVICE_EMPLOYEE_KEY);
        employee=null;

        // Remove the inline form before opening the office selector.
        // This avoids Chrome Android keeping focus/keyboard ownership.
        try{form.elements.password.blur()}catch(_){}
        showOfficeMenu();
      }catch(error){
        officeUnlockedFlag=false;
        clearRememberedOffice();

        const message=String(error?.message||'').toLowerCase();
        if(message.includes('timeout')){
          err.textContent='La verifica ha impiegato troppo tempo. Controlla la connessione e riprova.';
        }else if(message.includes('invalid')||message.includes('credentials')||error?.status===400){
          err.textContent='Password non corretta. L’area uffici resta bloccata.';
        }else{
          err.textContent='Non è stato possibile verificare la password. Riprova tra qualche secondo.';
        }
        err.classList.add('show');
        form.elements.password.value='';
        try{form.elements.password.focus()}catch(_){}
      }finally{
        if(document.contains(btn)){
          btn.disabled=false;
          btn.textContent='Sblocca uffici';
        }
      }
    };
  }

  function enterOfficeRole(role){
    document.getElementById('poi113CompanyGate')?.classList.remove('poi115-office-menu-mode');
    if(!officeUnlocked()||!['director','manager','admin'].includes(role)){openOfficeLogin();return}
    const company=role==='manager'?'multiplast':'smartpack';
    selectedCompany=company;
    sessionStorage.setItem(COMPANY_KEY,company);
    sessionStorage.setItem(OFFICE_ROLE_KEY,role);
    sessionStorage.setItem('nomyra_group_company_v92',company);
    sessionStorage.setItem('nomyra_group_role_v92',role);
    sessionStorage.setItem('industrialos_role_session',role);
    rememberOfficeSession(role);
    closeOverlays();enterRole(role,false);hideLegacyProfileGate();

    // V11.9.4: V11.8.6 può essersi avviato prima che currentRole fosse admin.
    // Riapplicalo esattamente quando si entra in Amministrazione.
    if(role==='admin'){
      setTimeout(()=>{
        try{
          window.SPAdminCoreNavV1186?.patch?.();
          window.SPAdminCoreNavV1186?.restore?.();
        }catch(e){console.warn('[V11.9.4] admin nav restore',e)}
      },60);
      setTimeout(()=>{
        try{window.SPAdminCoreNavV1186?.patch?.()}catch(_){}
      },650);
    }
  }

  function decorateAuth(){
    const auth=$('#poiCloudAuth');
    if(!auth)return;
    auth.classList.add('poi1188-global-auth','poi1190-login-home');

    if(!$('#poi1190LoginDecor')){
      const year=new Date().getFullYear();
      auth.insertAdjacentHTML('afterbegin',`
        <div id="poi1190LoginDecor" aria-hidden="true">
          <div class="poi1190-top-slogan">
            <span>SOLUZIONI PER UNA</span>
            <span>INDUSTRIA PIÙ FORTE</span>
          </div>
          <div class="poi1190-login-footer">
            <b>© ${year} NOMYRA · Tutti i diritti riservati</b>
            <span>Piattaforma Operativa Integrata</span>
          </div>
        </div>`);
    }

    const brand=$('#poiCloudAuth .poi-cloud-auth-brand');
    if(brand){
      brand.innerHTML=`
        <div class="poi1188-brandmark">N</div>
        <div class="poi1188-brandcopy">
          <strong>NOMYRA</strong>
          <span>Portale piattaforme aziendali</span>
        </div>`;
    }

    const title=$('#poiCloudAuth h2');
    if(title)title.textContent=activationMode?'Attivazione account autorizzato':'Accedi alla piattaforma';

    const intro=$('#poiCloudAuth .poi-cloud-auth-card>p');
    if(intro)intro.textContent=activationMode
      ?'Area riservata alla prima attivazione di un account già autorizzato.'
      :'Un unico accesso per amministrazione NOMYRA e account aziendali autorizzati.';
    const login=$('#poiCloudLoginForm'),register=$('#poiCloudRegisterForm'),showRegister=$('#poiShowRegister'),showLogin=$('#poiShowLogin');
    if(showRegister)showRegister.style.display='none';
    if(activationMode){
      if(login)login.style.display='none';if(register)register.style.display='block';
      const role=$('#poiRegRole')?.closest('label');if(role)role.style.display='none';
      const name=$('#poiRegName');if(name)name.placeholder='Nome account autorizzato';
      const button=register?.querySelector('button[type="submit"]');if(button&&!button.disabled)button.textContent='Attiva account';
      if(showLogin){showLogin.style.display='inline-flex';showLogin.textContent='Torna all’accesso';showLogin.onclick=()=>location.href=location.origin+location.pathname}
    }else{
      if(register)register.style.display='none';if(login)login.style.display='block';
      if(showLogin)showLogin.style.display='none';
    }
    const foot=$('.poi-cloud-auth-foot');
    if(foot)foot.innerHTML=activationMode
      ?'Sono accettati esclusivamente gli indirizzi già autorizzati da NOMYRA.'
      :'<b>Accesso sicuro.</b> Dopo il login verrà aperto automaticamente l’ambiente associato al tuo account. Gli operatori continueranno a usare USER + PIN nelle postazioni di produzione.';
    $('#poi113ForgotAccount')?.remove();
  }

  async function resetAccountPassword(){
    const email=$('#poiCloudEmail')?.value?.trim();
    if(!email){alert('Inserisci prima l’e-mail dell’account base.');return}
    const sb=client();if(!sb){alert('Collegamento cloud non pronto. Riprova tra qualche secondo.');return}
    const redirectTo=location.origin+location.pathname;
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    alert(error?'Non è stato possibile inviare il recupero.':'E-mail di recupero inviata all’account base. Controlla anche la cartella Spam.');
  }

  async function routeAfterGlobalLogin(){
    // Il profilo applicativo può arrivare qualche istante dopo SIGNED_IN.
    let p=null;
    for(let i=0;i<50;i++){
      p=profile();
      if(p)break;
      await new Promise(r=>setTimeout(r,60));
    }
    if(!p)return;

    if(isPlatform()){
      openNomyra();
      return;
    }

    if(isTenant()){
      // Il login globale identifica l'azienda ma NON sblocca gli uffici.
      // Questa postazione può essere condivisa con gli operatori.
      officeUnlockedFlag=false;
      localStorage.removeItem(DEVICE_OFFICE_UNLOCKED_KEY);
      localStorage.removeItem(DEVICE_OFFICE_ROLE_KEY);
      sessionStorage.removeItem(OFFICE_ROLE_KEY);
      sessionStorage.removeItem('industrialos_role_session');
      showProductionHome();
      return;
    }

    showCompanyMenu();
  }

  function bindPasswordRecovery(){
    const sb=client();if(!sb||sb.__poi113RecoveryBound)return;sb.__poi113RecoveryBound=true;
    sb.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_IN'&&activationMode){setTimeout(()=>location.replace(location.origin+location.pathname),500);return}
      if(event==='SIGNED_IN'&&!activationMode){
        // V11.9.7:
        // Supabase può riemettere SIGNED_IN quando il browser torna in primo piano
        // o ripristina una sessione. Non deve essere interpretato come un nuovo
        // login globale se l'utente è già dentro Produzione/Uffici.
        const activeOfficeRole=
          sessionStorage.getItem(OFFICE_ROLE_KEY) ||
          localStorage.getItem(DEVICE_OFFICE_ROLE_KEY) ||
          '';

        if(
          officeReauthInProgress ||
          sessionStorage.getItem(OFFICE_REAUTH_KEY)==='1' ||
          officeUnlocked() ||
          !!employee ||
          ['director','manager','admin'].includes(activeOfficeRole)
        ){
          return;
        }

        // Esegui il routing iniziale solo quando il portale di login è realmente aperto.
        const authGate=$('#poiCloudAuth');
        const authIsOpen=!!authGate && (
          authGate.classList.contains('open') ||
          getComputedStyle(authGate).display!=='none'
        );

        if(!authIsOpen && profile()) return;

        setTimeout(()=>routeAfterGlobalLogin(),100);
        return;
      }
      if(event!=='PASSWORD_RECOVERY')return;
      setTimeout(async()=>{
        const first=prompt('Nuova password dell’account base (almeno 8 caratteri):');if(first===null)return;
        if(first.length<8){alert('La password deve contenere almeno 8 caratteri.');return}
        const second=prompt('Ripeti la nuova password:');if(first!==second){alert('Le password non coincidono.');return}
        const {error}=await sb.auth.updateUser({password:first});
        alert(error?'Password non aggiornata.':'Password dell’account base aggiornata.');
      },120);
    });
  }

  function decorateCloudMenu(){
    const box=$('#poiCloudUserBox');if(box){box.style.display='none';box.innerHTML=''}
    const switchProfile=$('#poiCloudSwitchProfile');if(switchProfile)switchProfile.style.display='none';
    const users=$('#poiCloudUsers');
    if(users&&profile()){
      const canShowUsers=isPlatform()||(!employee&&officeUnlocked()&&isTenant());
      users.style.display=canShowUsers?'inline-flex':'none';
      users.textContent=isPlatform()?'Area riservata NOMYRA':'Recupero accessi dipendenti';
      users.onclick=()=>isPlatform()?openNomyra():openRecoveryAdmin();
    }
    if(!employee){
      const officeRole=sessionStorage.getItem(OFFICE_ROLE_KEY)||'';
      const name=$('#userName');if(name)name.textContent=isPlatform()?'NOMYRA':'Account aziendale';
      const role=$('#userRole');if(role)role.textContent=isPlatform()?'Amministrazione piattaforma':(officeUnlocked()&&officeRole?roleName(officeRole):'Postazione produzione / accesso uffici');
    }
    const employeeLogout=$('#poi113EmployeeLogout');
    if(!employeeLogout&&$('#poiCloudMenu')){
      const button=document.createElement('button');button.id='poi113EmployeeLogout';button.type='button';button.className='btn';button.textContent='Termina sessione dipendente';button.onclick=employeeLogout;
      $('#poiCloudMenu').insertBefore(button,$('#poiCloudLogout'));
    }
    const change=$('#poi113EmployeeChangePin');
    if(!change&&$('#poiCloudMenu')){
      const button=document.createElement('button');button.id='poi113EmployeeChangePin';button.type='button';button.className='btn';button.textContent='Cambia PIN personale';button.onclick=()=>openPinChange(false);
      $('#poiCloudMenu').insertBefore(button,$('#poi113EmployeeLogout')||$('#poiCloudLogout'));
    }
    if($('#poi113EmployeeLogout'))$('#poi113EmployeeLogout').style.display=employee?'inline-flex':'none';
    if($('#poi113EmployeeChangePin'))$('#poi113EmployeeChangePin').style.display=employee?'inline-flex':'none';
    const logout=$('#poiCloudLogout');
    if(logout)logout.style.display=isPlatform()?'inline-flex':'none';
    if(logout&&!logout.dataset.poi113){
      logout.dataset.poi113='1';
      logout.addEventListener('click',()=>{closeOverlays();sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);clearRememberedDeviceSession();employee=null;selectedCompany=''},true);
    }
  }

  function showCompanyMenu(){
    ensureUI();hideLegacyProfileGate();
    if(!profile())return;

    // Ripristino operatore ricordato sullo stesso dispositivo.
    if(employee&&employee.company_code&&companies().includes(employee.company_code)){
      selectedCompany=employee.company_code;
      sessionStorage.setItem(COMPANY_KEY,selectedCompany);
      sessionStorage.setItem(EMPLOYEE_KEY,JSON.stringify(employee));
      enterRole(employee.role_code,true);
      return;
    }

    if(isPlatform()){openNomyra();return}

    // Ripristino area uffici dopo F5 / chiusura e riapertura browser.
    if(officeUnlocked()){
      const rememberedRole=
        sessionStorage.getItem(OFFICE_ROLE_KEY) ||
        localStorage.getItem(DEVICE_OFFICE_ROLE_KEY) ||
        '';
      if(['director','manager','admin'].includes(rememberedRole)){
        enterOfficeRole(rememberedRole);
        return;
      }
      showOfficeMenu();
      return;
    }

    showProductionHome();
  }

  function openProductionLogin(company){
    if(!['smartpack','multiplast'].includes(company)||!companies().includes(company))return;
    selectedCompany=company;sessionStorage.setItem(COMPANY_KEY,company);closeOverlays();hideLegacyProfileGate();
    const smart=company==='smartpack';
    $('#poi113AccessLogo').textContent=smart?'SP':'MP';
    $('#poi113AccessTitle').textContent=(smart?'Produzione Smart Pack':'Produzione Multiplast')+' · USER + PIN';
    const p=$('#poi113AccessGate .poi113-head p');if(p)p.textContent='Inserisci le credenziali personali dell’operatore. Gli accessi ufficio non sono disponibili da questa postazione.';
    $('#poi113AccessBody').innerHTML=`<div class="poi115-employee-company"><span class="badge">${smart?'SP':'MP'}</span><div><b>${smart?'Produzione Smart Pack':'Produzione Multiplast'}</b><span>Accesso personale e tracciato</span></div></div><form id="poi113LoginForm"><div class="poi113-form-grid"><label class="field full">USER<input name="username" autocomplete="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" placeholder="es. mario.rossi"></label><label class="field full">PIN personale di 6 cifre<input name="pin" autocomplete="current-password" inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" required placeholder="••••••"></label><div class="poi113-error full" id="poi113LoginError"></div><button class="btn primary full" type="submit">Entra in produzione</button><button class="btn full" type="button" onclick="POIV113.openRecoveryRequest()">Ho dimenticato USER o PIN</button></div></form>`;
    $('#poi113LoginForm').onsubmit=employeeLogin;$('#poi113AccessBack').textContent='Indietro';$('#poi113AccessBack').onclick=showProductionHome;$('#poi113AccessGate').classList.add('open');setTimeout(()=>$('#poi113LoginForm [name="username"]')?.focus(),80);
  }

  function selectCompany(company){openProductionLogin(company)}

  async function employeeLogin(event){
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form),errorBox=$('#poi113LoginError'),button=form.querySelector('button[type="submit"]');
    errorBox.classList.remove('show');button.disabled=true;button.textContent='Verifica…';
    const username=String(values.get('username')||'').trim().toLowerCase();
    const pin=String(values.get('pin')||'');
    const {data,error}=await client().rpc('poi_verify_employee_pin',{p_username:username,p_pin:pin,p_company:selectedCompany,p_group:GROUP});
    button.disabled=false;button.textContent='Entra';
    const row=Array.isArray(data)?data[0]:data;
    if(error||!row?.success){
      errorBox.textContent=row?.error_code==='locked'?'Accesso bloccato per 15 minuti dopo troppi tentativi errati.':'USER o PIN non corretti.';
      errorBox.classList.add('show');return;
    }
    const expected=expectedProductionRole(selectedCompany);
    if(row.role_code!==expected||row.company_code!==selectedCompany){
      errorBox.textContent='Questo USER non è autorizzato alla postazione '+companyName(selectedCompany)+'.';errorBox.classList.add('show');return;
    }
    const next={employee_id:row.employee_id,username:row.username,display_name:row.display_name,role_code:row.role_code,company_code:row.company_code};
    $('#poi113AccessGate').classList.remove('open');
    if(row.must_change_pin){pendingEntry=next;openPinChange(true,pin);return}
    employee=next;completeEmployeeEntry();
  }

  function completeEmployeeEntry(){
    if(!employee)return;
    selectedCompany=employee.company_code;
    sessionStorage.setItem(COMPANY_KEY,selectedCompany);
    sessionStorage.setItem(EMPLOYEE_KEY,JSON.stringify(employee));
    rememberEmployeeSession(employee);
    localStorage.removeItem(DEVICE_OFFICE_UNLOCKED_KEY);
    localStorage.removeItem(DEVICE_OFFICE_ROLE_KEY);
    sessionStorage.setItem('nomyra_group_company_v92',selectedCompany);
    sessionStorage.setItem('nomyra_group_role_v92',employee.role_code);
    sessionStorage.setItem('industrialos_role_session',employee.role_code);
    closeOverlays();decorateCloudMenu();enterRole(employee.role_code,true);
  }

  function enterRole(role,asEmployee=false){
    if(!asEmployee){
      employee=null;
      sessionStorage.removeItem(EMPLOYEE_KEY);
      localStorage.removeItem(DEVICE_EMPLOYEE_KEY);
    }
    const roleCompany=(role==='manager'||role==='mpworker')?'multiplast':'smartpack';
    selectedCompany=roleCompany;
    sessionStorage.setItem(COMPANY_KEY,roleCompany);
    sessionStorage.setItem('nomyra_group_company_v92',roleCompany);
    sessionStorage.setItem('nomyra_group_role_v92',role);
    sessionStorage.setItem('industrialos_role_session',role);
    try{currentRole=role}catch(_){ }
    api()?.enterRole?.(role);
    if(roleCompany==='multiplast'){
      [10,80,220,520].forEach(delay=>setTimeout(()=>{
        try{currentRole=role}catch(_){ }
        try{window.switchCompanyV92?.('multiplast')}catch(e){console.warn('[V11.6.4] attivazione Multiplast',e)}
      },delay));
    }
    [60,180,450,700].forEach(delay=>setTimeout(()=>{
      const name=$('#userName'),label=$('#userRole');
      if(name)name.textContent=employee?.display_name||(isPlatform()?'NOMYRA':'Account aziendale');
      if(label)label.textContent=(employee?'Dipendente · ':'')+roleName(role);
      decorateCloudMenu();
    },delay));
  }

  function employeeLogout(){
    employee=null;pendingEntry=null;
    sessionStorage.removeItem(EMPLOYEE_KEY);
    sessionStorage.removeItem('industrialos_role_session');
    sessionStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(DEVICE_EMPLOYEE_KEY);
    localStorage.removeItem(DEVICE_COMPANY_KEY);
    decorateCloudMenu();showProductionHome();
  }

  function openPinChange(forced,currentPin=''){
    ensureUI();
    const target=forced?pendingEntry:employee;if(!target)return;
    pinChangeMode={forced,currentPin};
    const form=$('#poi113PinForm');form.reset();
    $('#poi113PinError').classList.remove('show');
    $('#poi113CurrentPinLabel').style.display=forced?'none':'block';
    form.elements.current_pin.required=!forced;
    $('#poi113PinTitle').textContent=forced?'Crea il tuo nuovo PIN':'Cambia PIN personale';
    $('#poi113PinSub').textContent=forced?'Il primo PIN era temporaneo. Scegli ora un PIN personale di 6 cifre.':'Inserisci il PIN attuale e un nuovo PIN personale di 6 cifre.';
    closeOverlays();$('#poi113PinChange').classList.add('open');
    setTimeout(()=>form.elements.new_pin.focus(),60);
  }

  function cancelPinChange(){
    $('#poi113PinChange').classList.remove('open');
    if(pinChangeMode.forced){pendingEntry=null;openProductionLogin(selectedCompany)}
  }

  async function changePin(event){
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form),target=pinChangeMode.forced?pendingEntry:employee,errorBox=$('#poi113PinError');
    if(!target)return;
    const current=pinChangeMode.forced?pinChangeMode.currentPin:String(values.get('current_pin')||'');
    const next=String(values.get('new_pin')||''),confirmPin=String(values.get('confirm_pin')||'');
    errorBox.classList.remove('show');
    if(!/^\d{6}$/.test(next)){errorBox.textContent='Il nuovo PIN deve contenere esattamente 6 cifre.';errorBox.classList.add('show');return}
    if(next!==confirmPin){errorBox.textContent='I due nuovi PIN non coincidono.';errorBox.classList.add('show');return}
    if(next===current){errorBox.textContent='Il nuovo PIN deve essere diverso dal PIN attuale.';errorBox.classList.add('show');return}
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Salvataggio…';
    const {data,error}=await client().rpc('poi_employee_change_pin',{p_employee_id:target.employee_id,p_current_pin:current,p_new_pin:next,p_group:GROUP});
    button.disabled=false;button.textContent='Salva il nuovo PIN';
    if(error||data!==true){errorBox.textContent='PIN attuale non corretto oppure accesso temporaneamente bloccato.';errorBox.classList.add('show');return}
    $('#poi113PinChange').classList.remove('open');
    if(pinChangeMode.forced){employee=pendingEntry;pendingEntry=null;completeEmployeeEntry()}else alert('PIN personale aggiornato.');
  }

  function openRecoveryRequest(){
    ensureUI();if(!selectedCompany)return;
    const form=$('#poi113RecoveryForm');form.reset();
    $('#poi113RecoveryError').classList.remove('show');$('#poi113RecoverySuccess').classList.remove('show');
    $('#poi113RecoveryRequestSub').textContent=`La richiesta sarà inviata all’account base di ${companyName(selectedCompany)}.`;
    updateRecoveryUsernameRequirement();
    $('#poi113AccessGate').classList.remove('open');$('#poi113RecoveryRequest').classList.add('open');
  }

  function updateRecoveryUsernameRequirement(){
    const form=$('#poi113RecoveryForm');if(!form)return;
    const kind=form.elements.request_kind.value,input=form.elements.username;
    input.required=kind==='forgot_pin';
    $('#poi113RecoveryUsernameLabel').childNodes[0].textContent=kind==='forgot_username'?'USER, se lo ricordi':'USER';
  }

  async function createRecoveryRequest(event){
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form),errorBox=$('#poi113RecoveryError'),success=$('#poi113RecoverySuccess'),button=form.querySelector('button[type="submit"]');
    errorBox.classList.remove('show');success.classList.remove('show');button.disabled=true;button.textContent='Invio…';
    const args={
      p_company:selectedCompany,p_request_kind:String(values.get('request_kind')||''),
      p_username:String(values.get('username')||'').trim().toLowerCase()||null,
      p_identity_hint:String(values.get('identity_hint')||'').trim(),p_note:String(values.get('note')||'').trim()||null,p_group:GROUP
    };
    const {error}=await client().rpc('poi_employee_recovery_create',args);
    button.disabled=false;button.textContent='Invia richiesta all’account aziendale';
    if(error){errorBox.textContent=/too_many_requests/i.test(error.message||'')?'Troppe richieste ravvicinate. Attendi 15 minuti.':'Richiesta non inviata. Controlla i dati e riprova.';errorBox.classList.add('show');return}
    form.reset();updateRecoveryUsernameRequirement();success.textContent='Richiesta inviata all’account aziendale. Rivolgiti al responsabile per ricevere USER o nuovo PIN.';success.classList.add('show');
  }


  function setupClientAccountPanel(){
    if(!isPlatform())return;
    const overlay=$('#poi113Nomyra');if(!overlay)return;
    const legacyGrid=overlay.querySelector('.poi113-admin-grid');if(legacyGrid)legacyGrid.style.display='grid';
    const recover=$('#poi113OpenRecoveries');if(recover)recover.style.display='inline-flex';
    if($('#poi114ClientPanel'))return;
    const tabs=$('#poi113AdminTabs');if(tabs)tabs.insertAdjacentHTML('afterend',`
      <div class="poi113-panel" id="poi114ClientPanel" style="margin-bottom:14px">
        <h3>Account cliente</h3>
        <p>Da qui NOMYRA gestisce direttamente l'unico account cliente della piattaforma. Non viene usato il recupero password via e-mail.</p>
        <form id="poi114ClientForm"><div class="poi113-form-grid">
          <label class="field full">E-mail cliente<input name="email" type="email" required autocomplete="off"></label>
          <label class="field full">Nome account<input name="display_name" required maxlength="100" autocomplete="off"></label>
          <label class="field full">Nuova password<input name="password" type="password" minlength="6" maxlength="72" autocomplete="new-password" placeholder="Lascia vuoto per non cambiarla"></label>
          <label class="field full" style="display:flex;align-items:center;gap:8px"><input name="active" type="checkbox" checked style="width:auto"> Account cliente attivo</label>
          <div class="poi113-error full" id="poi114ClientError"></div>
          <div class="poi113-success full" id="poi114ClientSuccess"></div>
          <button class="btn primary full" type="submit">Salva account cliente</button>
        </div></form>
      </div>`);
    $('#poi114ClientForm').onsubmit=saveClientAccount;
  }

  async function invokeAccountAdmin(body){
    const sb=client();if(!sb)throw new Error('cloud_not_ready');
    const {data,error}=await sb.functions.invoke('poi-account-admin',{body});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data;
  }

  async function loadClientAccount(){
    if(!isPlatform())return;
    setupClientAccountPanel();
    const form=$('#poi114ClientForm'),errorBox=$('#poi114ClientError'),success=$('#poi114ClientSuccess');
    if(!form)return;
    errorBox.classList.remove('show');success.classList.remove('show');
    try{
      const result=await invokeAccountAdmin({action:'list_clients'});
      const item=result?.clients?.[0];
      form.dataset.userId=item?.user_id||'';
      form.elements.email.value=item?.email||'info@smartpack.srl';
      form.elements.display_name.value=item?.display_name||'Smart Pack';
      form.elements.password.value='';
      form.elements.active.checked=item?.active!==false;
    }catch(err){
      errorBox.textContent='Impossibile caricare l’account cliente.';errorBox.classList.add('show');
    }
  }

  async function saveClientAccount(event){
    event.preventDefault();if(!isPlatform())return;
    const form=event.currentTarget,errorBox=$('#poi114ClientError'),success=$('#poi114ClientSuccess'),button=form.querySelector('button[type="submit"]');
    errorBox.classList.remove('show');success.classList.remove('show');
    const password=String(form.elements.password.value||'');
    if(password&&password.length<6){errorBox.textContent='La password deve contenere almeno 6 caratteri.';errorBox.classList.add('show');return}
    button.disabled=true;button.textContent='Salvataggio…';
    try{
      const result=await invokeAccountAdmin({
        action:'save_client',user_id:form.dataset.userId||undefined,
        email:String(form.elements.email.value||'').trim().toLowerCase(),
        display_name:String(form.elements.display_name.value||'').trim(),
        password:password||undefined,active:form.elements.active.checked
      });
      form.dataset.userId=result?.client?.user_id||form.dataset.userId||'';
      form.elements.password.value='';
      success.textContent=password?'Account cliente e password aggiornati.':'Account cliente aggiornato.';success.classList.add('show');
    }catch(err){
      const code=String(err?.message||'');
      errorBox.textContent=code.includes('invalid_email')?'E-mail non valida.':code.includes('invalid_password')?'Password non valida.':'Salvataggio non riuscito.';
      errorBox.classList.add('show');
    }finally{button.disabled=false;button.textContent='Salva account cliente'}
  }

  function roleOptions(company){
    return company==='smartpack'?[['worker','Produzione Smart Pack']]:[['mpworker','Produzione Multiplast']];
  }

  function openNomyra(company){
    ensureUI();if(!isPlatform())return;
    closeOverlays();manageCompany=company||manageCompany||companies()[0]||'smartpack';if(!companies().includes(manageCompany))manageCompany=companies()[0];
    $('#poi113Nomyra').classList.add('open');renderAdminTabs();setupClientAccountPanel();loadClientAccount();
  }

  function renderAdminTabs(){
    $('#poi113AdminTabs').innerHTML=companies().map(c=>`<button type="button" class="${c===manageCompany?'active':''}" onclick="POIV113.setManageCompany('${c}')">${companyName(c)}</button>`).join('');
    const select=$('#poi113CreateForm [name="role_code"]');if(select)select.innerHTML=roleOptions(manageCompany).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    $('#poi113ListTitle').textContent='Utenti · '+companyName(manageCompany);
    $('#poi113OpenOperations').textContent='Apri '+companyName(manageCompany)+' come amministratore';
  }

  function setManageCompany(company){if(!isPlatform()||!companies().includes(company))return;manageCompany=company;renderAdminTabs();loadEmployees()}

  async function loadEmployees(){
    const list=$('#poi113EmployeeList');list.innerHTML='<div class="poi113-empty">Caricamento…</div>';
    const {data,error}=await client().rpc('poi_employee_list',{p_group:GROUP,p_company:manageCompany});
    if(error){list.innerHTML='<div class="poi113-empty">Impossibile caricare gli USER.</div>';return}
    list.innerHTML=(data||[]).map(item=>`<div class="poi113-employee"><div><b>${esc(item.display_name)}</b><small>USER: ${esc(item.username)} · ${esc(roleName(item.role_code))}<br>${item.active?'Attivo':'Sospeso'} · ultimo accesso ${formatDate(item.last_login_at)}</small></div><div class="poi113-row-actions"><button class="btn small" type="button" onclick="POIV113.resetPin('${item.id}')">Nuovo PIN</button><button class="btn small ${item.active?'danger':''}" type="button" onclick="POIV113.toggleEmployee('${item.id}',${!item.active})">${item.active?'Sospendi':'Riattiva'}</button></div></div>`).join('')||'<div class="poi113-empty">Nessun dipendente creato per questa azienda.</div>';
  }

  async function createEmployee(event){
    event.preventDefault();if(!isPlatform())return;
    const form=event.currentTarget,values=new FormData(form),errorBox=$('#poi113CreateError'),button=form.querySelector('button[type="submit"]');
    errorBox.classList.remove('show');button.disabled=true;button.textContent='Creazione…';
    const args={p_company:manageCompany,p_username:String(values.get('username')||'').trim().toLowerCase(),p_display_name:String(values.get('display_name')||'').trim(),p_role_code:expectedProductionRole(manageCompany),p_pin:String(values.get('pin')||''),p_group:GROUP};
    const {error}=await client().rpc('poi_employee_create',args);
    button.disabled=false;button.textContent='Crea USER e primo PIN';
    if(error){errorBox.textContent=/duplicate|unique/i.test(error.message||'')?'Questo USER esiste già.':'Creazione non riuscita. Verifica USER, ruolo e PIN di 6 cifre.';errorBox.classList.add('show');return}
    form.reset();renderAdminTabs();loadEmployees();alert('USER creato. Comunica il primo PIN al dipendente: dovrà cambiarlo al primo accesso.');
  }

  async function resetPin(id){
    if(!isPlatform())return;
    const first=prompt('Nuovo PIN temporaneo di 6 cifre:');if(first===null)return;
    if(!/^\d{6}$/.test(first)){alert('Il PIN deve contenere esattamente 6 cifre.');return}
    const second=prompt('Ripeti il nuovo PIN temporaneo:');if(first!==second){alert('I due PIN non coincidono.');return}
    const {error}=await client().rpc('poi_employee_update',{p_employee_id:id,p_new_pin:first,p_group:GROUP});
    alert(error?'PIN non aggiornato.':'Nuovo PIN temporaneo salvato. Il dipendente dovrà cambiarlo al prossimo accesso.');if(!error)loadEmployees();
  }

  async function toggleEmployee(id,active){
    if(!isPlatform())return;if(!confirm(active?'Riattivare questo USER?':'Sospendere subito questo USER?'))return;
    const {error}=await client().rpc('poi_employee_update',{p_employee_id:id,p_active:active,p_group:GROUP});
    if(error)alert('Aggiornamento non riuscito.');else loadEmployees();
  }

  function openPlatformOperations(){
    if(!isPlatform())return;selectedCompany=manageCompany;sessionStorage.setItem(COMPANY_KEY,selectedCompany);closeOverlays();enterRole(manageCompany==='smartpack'?'director':'manager',false);
  }

  function openRecoveryAdmin(company){
    ensureUI();if(!canViewRecoveries())return;
    closeOverlays();recoveryCompany=company||selectedCompany||recoveryCompany||companies()[0]||'smartpack';if(!companies().includes(recoveryCompany))recoveryCompany=companies()[0];
    $('#poi113RecoveryAdmin').classList.add('open');renderRecoveryTabs();loadRecoveryAdmin();
  }

  function renderRecoveryTabs(){
    $('#poi113RecoveryTabs').innerHTML=companies().map(c=>`<button type="button" class="${c===recoveryCompany?'active':''}" onclick="POIV113.setRecoveryCompany('${c}')">${companyName(c)}</button>`).join('');
  }

  function setRecoveryCompany(company){if(!canViewRecoveries()||!companies().includes(company))return;recoveryCompany=company;renderRecoveryTabs();loadRecoveryAdmin()}

  async function loadRecoveryAdmin(){
    const requestBox=$('#poi113RecoveryList'),directoryBox=$('#poi113Directory');
    requestBox.innerHTML='<div class="poi113-empty">Caricamento…</div>';directoryBox.innerHTML='<div class="poi113-empty">Caricamento…</div>';
    const [requestResult,employeeResult]=await Promise.all([
      client().rpc('poi_employee_recovery_list',{p_group:GROUP,p_company:recoveryCompany}),
      client().rpc('poi_employee_list',{p_group:GROUP,p_company:recoveryCompany})
    ]);
    if(requestResult.error||employeeResult.error){requestBox.innerHTML='<div class="poi113-empty">Impossibile caricare le richieste.</div>';directoryBox.innerHTML='<div class="poi113-empty">Impossibile caricare gli USER.</div>';return}
    directory=employeeResult.data||[];
    directoryBox.innerHTML=directory.map(item=>`<div class="poi113-employee"><div><b>${esc(item.display_name)}</b><small>USER: ${esc(item.username)} · ${esc(roleName(item.role_code))} · ${item.active?'Attivo':'Sospeso'}</small></div></div>`).join('')||'<div class="poi113-empty">Nessun USER disponibile.</div>';
    const rows=requestResult.data||[];
    requestBox.innerHTML=rows.map(item=>{
      const pending=item.status==='pending';
      const options=['<option value="">Seleziona il dipendente</option>',...directory.filter(x=>x.active).map(x=>`<option value="${x.id}" ${x.id===item.employee_id?'selected':''}>${esc(x.display_name)} · ${esc(x.username)}</option>`)].join('');
      return `<div class="poi113-request"><div><b>${esc(requestName(item.request_kind))}</b> <span class="poi113-status ${pending?'':'done'}">${pending?'In attesa':item.status==='resolved'?'Risolta':'Archiviata'}</span><small>${esc(item.identity_hint)} · ${formatDate(item.created_at)}${item.requested_username?`<br>USER indicato: ${esc(item.requested_username)}`:''}${item.note?`<br>Nota: ${esc(item.note)}`:''}</small></div>${pending?`<div class="poi113-row-actions"><select id="poi113Match_${item.id}">${options}</select><button class="btn small primary" type="button" onclick="POIV113.resolveRecovery('${item.id}','${item.request_kind}')">Risolvi</button><button class="btn small" type="button" onclick="POIV113.dismissRecovery('${item.id}')">Archivia</button></div>`:''}</div>`;
    }).join('')||'<div class="poi113-empty">Nessuna richiesta ricevuta.</div>';
  }

  async function resolveRecovery(id,kind){
    if(!canViewRecoveries())return;
    const employeeId=$(`#poi113Match_${id}`)?.value||null;if(!employeeId){alert('Seleziona prima il dipendente corretto.');return}
    let pin=null;
    if(['forgot_pin','both'].includes(kind)){
      pin=prompt('Nuovo PIN temporaneo di 6 cifre:');if(pin===null)return;
      if(!/^\d{6}$/.test(pin)){alert('Il PIN deve contenere esattamente 6 cifre.');return}
      const confirmPin=prompt('Ripeti il nuovo PIN temporaneo:');if(pin!==confirmPin){alert('I due PIN non coincidono.');return}
    }
    const {data,error}=await client().rpc('poi_employee_recovery_resolve',{p_request_id:id,p_employee_id:employeeId,p_new_pin:pin,p_status:'resolved',p_group:GROUP});
    const row=Array.isArray(data)?data[0]:data;
    if(error){alert('Richiesta non risolta. Controlla il dipendente e riprova.');return}
    alert(`Richiesta risolta. USER: ${row?.username||'—'}${pin?' · Il nuovo PIN è temporaneo e dovrà essere cambiato al prossimo accesso.':''}`);loadRecoveryAdmin();
  }

  async function dismissRecovery(id){
    if(!canViewRecoveries()||!confirm('Archiviare questa richiesta senza modificare l’accesso?'))return;
    const {error}=await client().rpc('poi_employee_recovery_resolve',{p_request_id:id,p_employee_id:null,p_new_pin:null,p_status:'dismissed',p_group:GROUP});
    if(error)alert('Richiesta non archiviata.');else loadRecoveryAdmin();
  }

  function updateBuildLabels(){
    hideLegacyProfileGate();
    document.body.dataset.build=MARKER;
    document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;
    $$('.version-badge').forEach(x=>x.textContent=BUILD);
    ['sp109Build','sp110Build','sp11Build','sp111Build','sp113Build'].forEach(id=>$('#'+id)?.remove());
    const foot=$('.sidebar-foot');
    if(foot){const badge=document.createElement('div');badge.id='sp113Build';badge.style.cssText='margin-top:8px;font-size:11px;font-weight:900;opacity:.95';badge.textContent=BUILD+' · Accessi protetti USER/PIN';foot.appendChild(badge)}
  }


  function bindPortalMotion(){
    if(window.__poi115PortalMotion)return;
    window.__poi115PortalMotion=true;
    document.addEventListener('pointermove',e=>{
      const gate=$('#poi113CompanyGate');
      if(!gate?.classList.contains('open'))return;
      gate.style.setProperty('--poi115-x',`${Math.round(e.clientX/window.innerWidth*100)}%`);
      gate.style.setProperty('--poi115-y',`${Math.round(e.clientY/window.innerHeight*100)}%`);
    },{passive:true});
  }

  function boot(){
    updateBuildLabels();ensureUI();bindPortalMotion();hideLegacyProfileGate();bindPasswordRecovery();
    [250,700,1500,3000,7200].forEach(delay=>setTimeout(()=>{ensureUI();decorateAuth();decorateCloudMenu();updateBuildLabels();hideLegacyProfileGate()},delay));
    setTimeout(()=>{
      if(!profile()||$('.poi113-overlay.open'))return;
      if(employee){showCompanyMenu();return}
      if(isPlatform()){showCompanyMenu();return}
      if(!officeUnlocked()){
        sessionStorage.removeItem('industrialos_role_session');
        sessionStorage.removeItem(OFFICE_ROLE_KEY);
        showProductionHome();
        return;
      }

      // V11.9.15: ripristino anticipato della destinazione reale.
      // Il boot screen resta visibile finché questa schermata non è pronta,
      // evitando qualsiasi flash delle vecchie viste.
      showCompanyMenu();
    },180);
  }

  // V11.9.7 · Tab/focus stability
  // Non effettua logout né routing; riallinea solo la UI al ruolo già memorizzato.
  let focusRestoreTimerV1197=0;
  function restoreAfterFocusV1197(){
    clearTimeout(focusRestoreTimerV1197);
    focusRestoreTimerV1197=setTimeout(()=>{
      if(document.visibilityState==='hidden')return;
      if(!profile())return;

      if(employee){
        try{
          const remembered=employee.role_code||sessionStorage.getItem('industrialos_role_session')||'';
          if(remembered && typeof currentRole!=='undefined' && currentRole!==remembered){
            enterRole(remembered,true);
          }
        }catch(_){}
        return;
      }

      if(!officeUnlocked())return;
      const rememberedRole=
        sessionStorage.getItem(OFFICE_ROLE_KEY) ||
        localStorage.getItem(DEVICE_OFFICE_ROLE_KEY) ||
        '';
      if(!['director','manager','admin'].includes(rememberedRole))return;

      try{
        if(typeof currentRole!=='undefined' && currentRole!==rememberedRole){
          enterOfficeRole(rememberedRole);
        }
      }catch(_){}
    },180);
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')restoreAfterFocusV1197();
  },{passive:true});
  window.addEventListener('focus',restoreAfterFocusV1197,{passive:true});
  window.addEventListener('pageshow',restoreAfterFocusV1197,{passive:true});

  const publicApi={
    showCompanyMenu,selectCompany,showProductionHome,openProductionLogin,openOfficeLogin,cancelOfficeLogin:resetOfficeInlineLogin,showOfficeMenu,enterOfficeRole,
    openNomyra,openRecoveryAdmin,setManageCompany,setRecoveryCompany,
    openRecoveryRequest,resetPin,toggleEmployee,resolveRecovery,dismissRecovery,openPinChange
  };
  // V11.9.4 · Stabilizzatore menu Amministrazione
  // I moduli legacy possono richiamare renderNav diversi secondi dopo il boot.
  // Interveniamo soltanto quando il ruolo attivo è admin.
  let lastAdminNavReassertV1194=0;
  function reassertAdminNavV1194(){
    let role='';
    try{role=String(typeof currentRole!=='undefined'?currentRole:'')}catch(_){}
    if(role!=='admin')return;
    const now=Date.now();
    if(now-lastAdminNavReassertV1194<700)return;
    lastAdminNavReassertV1194=now;
    try{window.SPAdminCoreNavV1186?.patch?.()}catch(_){}
  }
  setInterval(reassertAdminNavV1194,1200);

  window.POIV113=publicApi;
  window.POIV112=publicApi;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ========================================================================
   V11.8.7 · USCITA ESPLICITA CON SESSIONE PERSISTENTE
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPExplicitLogoutV1187)return;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function fullLogout(){
    const ok=confirm('Vuoi uscire dalla sessione su questo computer?');
    if(!ok)return;

    try{
      // Preferisci la funzione completa già esistente, che cancella
      // sia sessionStorage sia localStorage della sessione ricordata.
      if(typeof corporateLogout==='function'){
        corporateLogout();
        return;
      }
    }catch(_){}

    // Fallback difensivo.
    [
      'poi_v1180_device_employee',
      'poi_v1180_office_unlocked',
      'poi_v1180_office_role',
      'poi_v1180_company',
      'poi_v113_employee',
      'poi_v115_office_role',
      'poi_v113_company',
      'industrialos_role_session',
      'nomyra_group_company_v92',
      'nomyra_group_role_v92'
    ].forEach(k=>{
      try{localStorage.removeItem(k)}catch(_){}
      try{sessionStorage.removeItem(k)}catch(_){}
    });

    try{$('#poiCloudLogout')?.click()}catch(_){}
    setTimeout(()=>location.reload(),120);
  }

  function decorateOfficeMenu(){
    const b=$('#poi1187OfficeExit');
    if(b && b.dataset.bound!=='1'){
      b.dataset.bound='1';
      b.onclick=fullLogout;
    }
  }

  function decorateTopbar(){
    const role=(()=>{try{return String(currentRole||'')}catch(_){return ''}})();
    if(!['director','manager','admin'].includes(role)){
      $('#poi1187TopExit')?.remove();
      return;
    }

    // Locate "Cambia area" in the top bar.
    const candidates=$$('button,a').filter(x=>/Cambia area/i.test(String(x.textContent||'')));
    const changeArea=candidates[0]||null;
    if(!changeArea)return;

    let exit=$('#poi1187TopExit');
    if(!exit){
      exit=document.createElement('button');
      exit.id='poi1187TopExit';
      exit.type='button';
      exit.className='poi1187-top-exit';
      exit.textContent='Esci';
      exit.onclick=fullLogout;
      changeArea.insertAdjacentElement('afterend',exit);
    }
  }

  function injectStyles(){
    if($('#poi1187Styles'))return;
    const st=document.createElement('style');
    st.id='poi1187Styles';
    st.textContent=`
      .poi1187-top-exit{
        min-height:42px;padding:0 14px;margin-left:7px;
        border:1px solid #d7e2e7;border-radius:12px;
        background:#fff;color:#8f3941;
        font:inherit;font-weight:900;cursor:pointer;
      }
      .poi1187-top-exit:hover{background:#fff3f4;border-color:#e4b9be}
      .poi1187-exit{
        min-height:42px;padding:0 16px;border:1px solid #e4b9be;border-radius:11px;
        background:#fff;color:#9b3f48;font-weight:900;cursor:pointer
      }
      .poi1187-exit:hover{background:#fff3f4}
      .poi1187-office-exit-wrap{display:flex;justify-content:flex-end;margin:10px 0 0}
      @media(max-width:760px){
        .poi1187-top-exit{min-height:38px;padding:0 10px}
      }
    `;
    document.head.appendChild(st);
  }

  function patch(){
    injectStyles();
    decorateOfficeMenu();
    decorateTopbar();
  }

  function boot(){
    patch();
    setTimeout(patch,300);
    setTimeout(patch,900);
    setInterval(patch,5000);
  }

  window.SPExplicitLogoutV1187={logout:fullLogout,patch,version:'V11.8.7'};

  if(window.SPBootLater)window.SPBootLater(boot);
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();




/* ========================================================================
   V11.9.0 · HOME ACCESSO NOMYRA — SOLO SCHERMATA PRE-LOGIN
   ======================================================================== */
(()=>{
  if(document.getElementById('poi1190LoginHomeStyles'))return;
  document.getElementById('poi1188GlobalAuthStyles')?.remove();

  const st=document.createElement('style');
  st.id='poi1190LoginHomeStyles';
  st.textContent=`
    /* Questa regola è volutamente limitata a #poiCloudAuth:
       nessun'altra schermata della piattaforma viene modificata. */
    #poiCloudAuth.poi1190-login-home{
      position:fixed!important;
      inset:0!important;
      z-index:2147483500!important;
      width:100vw!important;
      min-height:100dvh!important;
      box-sizing:border-box!important;
      padding:90px 24px 96px!important;
      place-items:center!important;
      overflow:auto!important;
      isolation:isolate!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;

      background:
        radial-gradient(52vw 52vw at -6% 104%,rgba(20,32,51,.96) 0 18%,rgba(20,32,51,.82) 18%,rgba(20,32,51,0) 56%),
        radial-gradient(42vw 42vw at 0% 100%,rgba(31,90,93,.62) 0 20%,rgba(31,90,93,0) 56%),
        radial-gradient(28vw 28vw at 88% 12%,rgba(220,228,225,.78) 0 28%,rgba(220,228,225,0) 70%),
        radial-gradient(34vw 34vw at 103% 78%,rgba(185,120,80,.08) 0 16%,rgba(185,120,80,0) 58%),
        linear-gradient(135deg,#f8fbfb 0%,#f1f6f6 52%,#fbfaf7 100%)!important;
    }


    #poiCloudAuth.poi1190-login-home[hidden],
    #poiCloudAuth.poi1190-login-home.hidden{
      display:none!important;
    }

        /* Linee Copper sottili che richiamano il visual NOMYRA */
    #poiCloudAuth.poi1190-login-home::before{
      content:"NOMYRA · ACCESSO RISERVATO";
      position:fixed!important;
      top:34px!important;
      left:54px!important;
      z-index:4!important;
      padding-left:42px!important;
      font-size:11px!important;
      font-weight:900!important;
      letter-spacing:.18em!important;
      color:#324b5a!important;
      white-space:nowrap!important;
    }

    #poiCloudAuth.poi1190-login-home::after{
      content:"";
      position:fixed;
      z-index:0;
      left:-3vw;
      bottom:10vh;
      width:32vw;
      height:32vw;
      border-radius:50%;
      background:radial-gradient(circle,rgba(31,90,93,.08) 0 34%,rgba(31,90,93,0) 68%);
      filter:blur(2px);
      pointer-events:none;
      animation:poi1193Ambient 10s ease-in-out infinite alternate;
    }

    @keyframes poi1193Ambient{
      from{transform:translate3d(0,0,0) scale(1);opacity:.78}
      to{transform:translate3d(18px,-12px,0) scale(1.035);opacity:1}
    }

    @media(prefers-reduced-motion:reduce){
      #poiCloudAuth.poi1190-login-home::after{animation:none!important}
    }

    #poiCloudAuth.poi1190-login-home #poi1190LoginDecor::before{
      content:"";
      position:fixed;
      top:40px;
      left:54px;
      width:25px;
      height:1.5px;
      background:#b97850;
      z-index:5;
    }

    .poi1190-top-slogan{
      position:fixed;
      top:40px;
      right:58px;
      z-index:4;
      display:grid;
      gap:4px;
      text-align:left;
      color:#607882;
      font-size:9px;
      font-weight:850;
      letter-spacing:.18em;
      line-height:1.45;
      pointer-events:none;
    }

    .poi1190-top-slogan::after{
      content:"";
      width:27px;
      height:1.5px;
      margin-top:8px;
      background:#b97850;
    }

    .poi1190-login-footer{
      position:fixed;
      left:0;
      right:0;
      bottom:25px;
      z-index:5;
      display:grid;
      justify-items:center;
      gap:4px;
      pointer-events:none;
      color:#526b78;
      text-align:center;
    }

    .poi1190-login-footer b{
      position:relative;
      font-size:10px;
      font-weight:800;
      letter-spacing:.025em;
    }

    .poi1190-login-footer b::before,
    .poi1190-login-footer b::after{
      content:"";
      position:absolute;
      top:50%;
      width:42px;
      height:1px;
      background:#8da0a8;
      opacity:.72;
    }
    .poi1190-login-footer b::before{right:calc(100% + 18px)}
    .poi1190-login-footer b::after{left:calc(100% + 18px)}

    .poi1190-login-footer span{
      font-size:9px;
      color:#85949a;
      font-weight:650;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card{
      position:relative!important;
      z-index:3!important;
      width:min(780px,calc(100vw - 44px))!important;
      max-width:780px!important;
      margin:0!important;
      box-sizing:border-box!important;
      padding:40px 46px 34px!important;
      border:1px solid #d7e2e4!important;
      border-radius:23px!important;
      background:rgba(255,255,255,.97)!important;
      box-shadow:
        0 28px 78px rgba(20,32,51,.12),
        0 2px 8px rgba(20,32,51,.03)!important;
      overflow:hidden!important;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card::before{
      content:"";
      position:absolute;
      top:0;left:0;right:0;
      height:3px;
      background:linear-gradient(90deg,#142033 0 43%,#1f5a5d 43% 87%,#b97850 87% 100%);
      opacity:.96;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-brand{
      display:flex!important;
      align-items:center!important;
      gap:17px!important;
      margin:0 0 25px!important;
    }

    #poiCloudAuth.poi1190-login-home .poi1188-brandmark{
      position:relative;
      flex:0 0 auto;
      width:62px!important;
      height:62px!important;
      border-radius:16px!important;
      display:grid!important;
      place-items:center!important;
      background:linear-gradient(145deg,#1a2b43,#0f1d33)!important;
      color:#fff!important;
      box-shadow:0 8px 22px rgba(20,32,51,.16)!important;
      font-size:25px!important;
      font-weight:950!important;
      letter-spacing:.02em!important;
    }

    #poiCloudAuth.poi1190-login-home .poi1188-brandmark::after{
      content:"";
      position:absolute;
      bottom:12px;
      width:22px;
      height:2px;
      border-radius:2px;
      background:#b97850;
    }

    #poiCloudAuth.poi1190-login-home .poi1188-brandcopy strong{
      display:block!important;
      color:#142033!important;
      font-size:25px!important;
      line-height:1!important;
      letter-spacing:.09em!important;
      font-weight:900!important;
    }

    #poiCloudAuth.poi1190-login-home .poi1188-brandcopy span{
      display:block!important;
      margin-top:7px!important;
      color:#687d89!important;
      font-size:11px!important;
      font-weight:550!important;
    }

    /* L'h2 legacy non serve nel visual approvato */
    #poiCloudAuth.poi1190-login-home h2{
      display:none!important;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card>p{
      position:relative!important;
      margin:0 0 28px!important;
      padding-top:17px!important;
      max-width:none!important;
      color:#506a79!important;
      font-size:12px!important;
      line-height:1.55!important;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card>p::before{
      content:"";
      position:absolute;
      top:0;
      left:0;
      width:30px;
      height:2px;
      border-radius:2px;
      background:#b97850;
    }

    #poiCloudAuth.poi1190-login-home #poiCloudLoginForm{
      display:grid!important;
      grid-template-columns:minmax(0,1fr)!important;
      gap:16px!important;
      align-items:end!important;
    }

    #poiCloudAuth.poi1190-login-home label{
      position:relative!important;
      display:block!important;
      margin:0!important;
      color:#233d4b!important;
      font-size:10px!important;
      font-weight:850!important;
      min-width:0!important;
    }

    #poiCloudAuth.poi1190-login-home input{
      width:100%!important;
      min-height:54px!important;
      box-sizing:border-box!important;
      margin-top:8px!important;
      border:1px solid #cfdde2!important;
      border-radius:12px!important;
      background-color:#fbfcfc!important;
      color:#17313e!important;
      font-size:15px!important;
      font-weight:600!important;
      padding:0 16px 0 46px!important;
      outline:none!important;
      box-shadow:none!important;
      transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;
    }

    #poiCloudAuth.poi1190-login-home input[type="email"]{
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237a909b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='14' rx='2'/%3E%3Cpath d='m3 7 9 6 9-6'/%3E%3C/svg%3E")!important;
      background-repeat:no-repeat!important;
      background-position:15px center!important;
    }

    #poiCloudAuth.poi1190-login-home input[type="password"]{
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237a909b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='4' y='10' width='16' height='11' rx='2'/%3E%3Cpath d='M8 10V7a4 4 0 0 1 8 0v3'/%3E%3C/svg%3E")!important;
      background-repeat:no-repeat!important;
      background-position:15px center!important;
    }

    #poiCloudAuth.poi1190-login-home input:focus{
      border-color:#1f5a5d!important;
      background-color:#fff!important;
      box-shadow:0 0 0 3px rgba(31,90,93,.10)!important;
    }

    #poiCloudAuth.poi1190-login-home input[type="email"]{
      text-overflow:clip!important;
      white-space:nowrap!important;
      overflow:hidden!important;
    }

    #poiCloudAuth.poi1190-login-home button[type="submit"]{
      position:relative!important;
      grid-column:1!important;
      width:100%!important;
      min-height:56px!important;
      margin:5px 0 0!important;
      border:0!important;
      border-radius:12px!important;
      background:linear-gradient(105deg,#173e52,#142033)!important;
      color:#fff!important;
      font-size:14px!important;
      font-weight:900!important;
      letter-spacing:.01em!important;
      box-shadow:0 8px 18px rgba(20,32,51,.12)!important;
      cursor:pointer!important;
      transition:transform .15s ease,box-shadow .15s ease!important;
    }

    #poiCloudAuth.poi1190-login-home button[type="submit"]::after{
      content:"→";
      position:absolute;
      right:23px;
      top:50%;
      transform:translateY(-53%);
      font-size:21px;
      font-weight:400;
    }

    #poiCloudAuth.poi1190-login-home button[type="submit"]:hover{
      transform:translateY(-1px)!important;
      box-shadow:0 11px 24px rgba(20,32,51,.17)!important;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-foot{
      grid-column:1/-1!important;
      position:relative!important;
      margin:2px 0 0!important;
      padding:13px 15px 13px 52px!important;
      border:0!important;
      border-radius:12px!important;
      background:linear-gradient(90deg,#eef6f5,#f4f7f6)!important;
      color:#58717c!important;
      font-size:9.5px!important;
      line-height:1.55!important;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-foot::before{
      content:"✓";
      position:absolute;
      left:17px;
      top:50%;
      transform:translateY(-50%);
      width:24px;
      height:24px;
      border:1.5px solid #1f5a5d;
      border-radius:50%;
      display:grid;
      place-items:center;
      color:#1f5a5d;
      font-size:13px;
      font-weight:950;
    }

    #poiCloudAuth.poi1190-login-home .poi-cloud-auth-foot b{
      color:#1f5a5d!important;
      font-weight:900!important;
    }

    /* Nasconde soltanto elementi legacy della schermata pre-login */
    #poiCloudAuth.poi1190-login-home #poiShowRegister{
      display:none!important;
    }

    @media(max-width:760px){
      #poiCloudAuth.poi1190-login-home{
        padding:76px 18px 88px!important;
        align-items:center!important;
      }
      #poiCloudAuth.poi1190-login-home::before{
        top:23px!important;
        left:22px!important;
        padding-left:31px!important;
        font-size:8px!important;
      }
      #poiCloudAuth.poi1190-login-home #poi1190LoginDecor::before{
        top:29px;left:22px;width:19px;
      }
      .poi1190-top-slogan{
        display:none;
      }
      #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card{
        width:min(100%,620px)!important;
        padding:31px 25px 26px!important;
        border-radius:19px!important;
      }
      #poiCloudAuth.poi1190-login-home .poi1188-brandmark{
        width:54px!important;height:54px!important;border-radius:14px!important;
      }
      #poiCloudAuth.poi1190-login-home .poi1188-brandcopy strong{
        font-size:21px!important;
      }
      #poiCloudAuth.poi1190-login-home #poiCloudLoginForm{
        grid-template-columns:1fr!important;
        gap:14px!important;
      }
      #poiCloudAuth.poi1190-login-home button[type="submit"],
      #poiCloudAuth.poi1190-login-home .poi-cloud-auth-foot{
        grid-column:1!important;
      }
      .poi1190-login-footer{bottom:16px}
      .poi1190-login-footer b{font-size:8.5px}
      .poi1190-login-footer span{font-size:8px}
      .poi1190-login-footer b::before,
      .poi1190-login-footer b::after{width:24px}
    }

    @media(max-height:720px) and (min-width:761px){
      #poiCloudAuth.poi1190-login-home{padding-top:66px!important;padding-bottom:72px!important}
      #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card{
        padding-top:29px!important;padding-bottom:25px!important;
      }
      #poiCloudAuth.poi1190-login-home .poi-cloud-auth-brand{margin-bottom:18px!important}
      #poiCloudAuth.poi1190-login-home .poi-cloud-auth-card>p{margin-bottom:20px!important}
      .poi1190-login-footer{bottom:13px}
    }
  `;
  document.head.appendChild(st);
})();




/* ========================================================================
   V11.8.9 · POSTAZIONE CONDIVISA / UFFICI BLOCCATI
   ======================================================================== */
(()=>{
  if(document.getElementById('poi1189SharedDeviceStyles'))return;
  const st=document.createElement('style');
  st.id='poi1189SharedDeviceStyles';
  st.textContent=`
    .poi1189-office-security{
      margin:8px 0 12px;
      padding:10px 12px;
      border:1px solid #d8e3e7;
      border-radius:11px;
      background:#f4f8f9;
      color:#5f737c;
      font-size:9px;
      line-height:1.5;
    }
    .poi1189-office-security b{color:#17394a}
    .poi1189-account-label input[readonly]{
      background:#edf3f5!important;
      color:#5f727b!important;
      cursor:default!important;
    }
    .poi1189-account-label::after{
      content:"Account aziendale già autenticato";
      display:block;
      margin-top:4px;
      font-size:8px;
      color:#748890;
      font-weight:750;
    }
  `;
  document.head.appendChild(st);
})();

/* ========================================================================
   NOMYRA / Smart Pack · Multiplast — V11.9.9 FINANCE CLARITY
   - "Ricavi" = conto 70 (vendite e prestazioni)
   - "Valore della produzione" = 70 + 71 + 73
   - EBITDA/EBIT restano calcolati sul valore della produzione già importato
   - composizione cliccabile degli importi aggregati SPRING
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPFinanceClarityV1199)return;

  const VERSION='V11.9.9';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(num(v))}%`;

  function S(){try{return state}catch(_){return window.state||null}}
  function keyOf(a){return String(a?.mapKey||(a?.partitario?`${a.code}|${a.partitario}`:a?.code||''))}
  function period(){
    const input=$('#financePeriodV1170');
    const p=input?.value||sessionStorage.getItem('poi_finance_period_v1179')||localStorage.getItem('poi_finance_period_v1179')||'';
    if(/^\d{4}-\d{2}$/.test(p))return p;
    const xs=(S()?.adminFinanceV1170?.records||[]).map(x=>String(x.period||'')).filter(x=>/^\d{4}-\d{2}$/.test(x)).sort().reverse();
    return xs[0]||'';
  }
  function record(company,p=period()){
    return (S()?.adminFinanceV1170?.records||[]).find(x=>x.company===company&&x.period===p)||null;
  }
  function snapshots(company,p=period()){
    return (S()?.financeSpringV1173?.snapshots||[]).filter(x=>x.company===company&&x.period===p);
  }
  function snapshot(company,p=period()){
    const xs=snapshots(company,p);
    return xs.slice().sort((a,b)=>String(b.importedAt||b.id||'').localeCompare(String(a.importedAt||a.id||'')))[0]||null;
  }
  function previousSnapshot(company,snap){
    if(!snap||snap.mode!=='cumulative')return null;
    const y=String(snap.period||'').slice(0,4);
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company&&x.period<snap.period&&String(x.period||'').slice(0,4)===y&&x.mode==='cumulative')
      .sort((a,b)=>String(b.period).localeCompare(String(a.period)))[0]||null;
  }
  function rawAmount(a){
    if(Number.isFinite(Number(a?.signedAmount)))return Number(a.signedAmount);
    if(num(a?.debit)||num(a?.credit)){
      if(String(a?.section||'')==='revenue'||String(a?.section||'')==='liability')return num(a.credit)-num(a.debit);
      return num(a.debit)-num(a.credit);
    }
    return num(a?.balance);
  }
  function contribution(a,snap,prev){
    let v=rawAmount(a);
    if(snap?.mode==='cumulative'&&prev){
      const pa=(prev.accounts||[]).find(x=>keyOf(x)===keyOf(a));
      v-=pa?rawAmount(pa):0;
    }
    return v;
  }
  function prefix(a,p){
    const c=String(a?.code||'').trim();
    return c===p||c.startsWith(p+'.');
  }
  function compositionByPrefixes(company,prefixes,p=period()){
    const snap=snapshot(company,p);if(!snap)return [];
    const prev=previousSnapshot(company,snap);
    return (snap.accounts||[])
      .filter(a=>prefixes.some(x=>prefix(a,x)))
      .map(a=>({...a,amount:contribution(a,snap,prev)}))
      .filter(a=>Math.abs(a.amount)>0.004)
      .sort((a,b)=>String(a.code).localeCompare(String(b.code),undefined,{numeric:true})||String(a.partitario||'').localeCompare(String(b.partitario||'')));
  }
  function categoryFallback(a){
    const c=String(a?.code||'').trim(),d=String(a?.description||'').toLowerCase(),sec=String(a?.section||'');
    const starts=x=>c===x||c.startsWith(x+'.');
    if(sec==='revenue'){
      if(starts('70')||starts('71')||starts('73'))return 'revenue';
      if(starts('87'))return 'extraordinaryIncome';
    }
    if(sec==='cost'){
      if(starts('72')||starts('75'))return 'materials';
      if(starts('81'))return 'personnel';
      if(starts('90'))return 'depreciation';
      if(starts('86'))return 'financialCharges';
      if(starts('93'))return 'taxes';
      if(starts('76')){
        if(starts('76.03')||starts('76.05')||/trasport|spedizion/.test(d))return 'transport';
        if(/energia elettrica|acqua potabile|\bgas\b|metano/.test(d))return 'energy';
        return 'otherOpex';
      }
      if(/^7[789]\b/.test(c)||starts('80')||starts('83'))return 'otherOpex';
    }
    if(sec==='asset'){
      if(starts('23.01')||starts('23.03'))return 'receivables';
      if(starts('31'))return 'cash';
      if(starts('21'))return 'inventory';
    }
    if(sec==='liability'&&starts('57'))return 'payables';
    return '';
  }
  function categoryFor(a,company){
    const maps=S()?.financeSpringV1173?.mappings?.[company]||{};
    return maps[keyOf(a)]||a?.category||categoryFallback(a);
  }
  function compositionByCategory(company,category,p=period()){
    const snap=snapshot(company,p);if(!snap)return [];
    const prev=previousSnapshot(company,snap);
    const stock=new Set(['receivables','payables','cash','inventory']);
    return (snap.accounts||[])
      .filter(a=>categoryFor(a,company)===category)
      .map(a=>({...a,amount:stock.has(category)?rawAmount(a):contribution(a,snap,prev)}))
      .filter(a=>Math.abs(a.amount)>0.004)
      .sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount));
  }
  function derived(company,p=period()){
    const r=record(company,p);
    if(!r)return {configured:false,salesRevenue:0,inventoryChange:0,otherOperatingRevenue:0,productionValue:0,opex:0,ebitda:0,ebit:0,marginProduction:0};
    const hasSnap=!!snapshot(company,p);
    const sum=rows=>rows.reduce((s,x)=>s+num(x.amount),0);
    const sales=hasSnap?sum(compositionByPrefixes(company,['70'],p)):num(r.salesRevenue||r.revenue);
    const inv=hasSnap?sum(compositionByPrefixes(company,['71'],p)):num(r.inventoryProductionChange||0);
    const other=hasSnap?sum(compositionByPrefixes(company,['73'],p)):num(r.otherOperatingRevenue||0);
    const production=hasSnap?(sales+inv+other):num(r.productionValue||r.revenue);
    const opex=num(r.materials)+num(r.personnel)+num(r.energy)+num(r.transport)+num(r.otherOpex);
    // Compatibilità contabile: il record storico usa r.revenue come valore della produzione.
    const base=num(r.revenue)||production;
    const ebitda=base-opex,ebit=ebitda-num(r.depreciation);
    return {configured:true,salesRevenue:sales,inventoryChange:inv,otherOperatingRevenue:other,productionValue:production||base,opex,ebitda,ebit,marginProduction:base?ebitda/base*100:0,record:r};
  }
  function groupDerived(p=period()){
    const xs=['smartpack','multiplast'].map(c=>derived(c,p)).filter(x=>x.configured);
    if(!xs.length)return {configured:false,salesRevenue:0,inventoryChange:0,otherOperatingRevenue:0,productionValue:0,opex:0,ebitda:0,ebit:0,marginProduction:0};
    const sum=k=>xs.reduce((s,x)=>s+num(x[k]),0);
    const productionValue=sum('productionValue'),ebitda=sum('ebitda');
    return {configured:true,salesRevenue:sum('salesRevenue'),inventoryChange:sum('inventoryChange'),otherOperatingRevenue:sum('otherOperatingRevenue'),productionValue,opex:sum('opex'),ebitda,ebit:sum('ebit'),marginProduction:productionValue?ebitda/productionValue*100:0};
  }

  function ensureDialog(){
    if($('#financeCompositionV1199Dialog'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <dialog id="financeCompositionV1199Dialog" class="v1199-dialog">
        <div class="modal-head"><div><span class="eyebrow">SPRING · TRASPARENZA DEL DATO</span><h3 id="financeCompositionV1199Title">Composizione importo</h3><p id="financeCompositionV1199Sub">Dettaglio delle voci che formano il valore.</p></div><button class="close" type="button" onclick="document.getElementById('financeCompositionV1199Dialog').close()">×</button></div>
        <div class="modal-body" id="financeCompositionV1199Body"></div>
        <div class="modal-actions"><button class="btn" type="button" onclick="document.getElementById('financeCompositionV1199Dialog').close()">Chiudi</button></div>
      </dialog>`);
  }
  function rowTable(rows){
    if(!rows.length)return '<div class="v1199-empty">Nessuna riga contabile disponibile per questo dettaglio.</div>';
    return `<div class="v1199-table"><div class="v1199-tr head"><div>Conto</div><div>Descrizione</div><div>Importo</div></div>${rows.map(a=>`<div class="v1199-tr"><div><b>${esc(a.code||'—')}</b>${a.partitario?`<small>Partitario ${esc(a.partitario)}</small>`:''}</div><div>${esc(a.description||'—')}</div><div class="amount ${num(a.amount)<0?'neg':''}">${money(a.amount)}</div></div>`).join('')}</div>`;
  }
  function formulaBlock(items,total,label='Totale'){
    return `<div class="v1199-formula">${items.map((x,i)=>`<div><span>${esc(x.label)}</span><b class="${num(x.value)<0?'neg':''}">${money(x.value)}</b></div>${i<items.length-1?'<i>+</i>':''}`).join('')}<strong>=</strong><div class="total"><span>${esc(label)}</span><b>${money(total)}</b></div></div>`;
  }
  function companyLabel(c){return c==='smartpack'?'Smart Pack':c==='multiplast'?'Multiplast':'Gruppo'}

  function open(metric,company='smartpack',p=period()){
    ensureDialog();
    const d=company==='group'?groupDerived(p):derived(company,p);
    if(!d.configured)return;
    const dlg=$('#financeCompositionV1199Dialog'),title=$('#financeCompositionV1199Title'),sub=$('#financeCompositionV1199Sub'),body=$('#financeCompositionV1199Body');
    sub.textContent=`${companyLabel(company)} · ${p}`;
    let html='',label='Composizione importo';

    if(metric==='sales'){
      label='Ricavi vendite / fatturato';
      const rows=company==='group'?[]:compositionByPrefixes(company,['70'],p);
      html=`<div class="v1199-hero"><span>Ricavi delle vendite e delle prestazioni</span><b>${money(d.salesRevenue)}</b><small>Solo conti 70.* del Conto Economico SPRING.</small></div>${company==='group'?groupCompanyRows('salesRevenue',p):rowTable(rows)}<div class="v1199-note"><b>Nota</b>Questo valore rappresenta il fatturato/ricavi di vendita. Non include variazione rimanenze (71) né altri ricavi e proventi operativi (73).</div>`;
    }else if(metric==='production'){
      label='Valore della produzione';
      const parts=[{label:'Ricavi vendite · 70',value:d.salesRevenue},{label:'Variazione rimanenze · 71',value:d.inventoryChange},{label:'Altri ricavi e proventi · 73',value:d.otherOperatingRevenue}];
      html=`<div class="v1199-hero"><span>Valore della produzione</span><b>${money(d.productionValue)}</b><small>Indicatore operativo composto: 70 + 71 + 73.</small></div>${formulaBlock(parts,d.productionValue,'Valore produzione')}${company==='group'?groupCompanyRows('productionValue',p):`<div class="v1199-sub"><h4>Conti 70 · Ricavi vendite</h4>${rowTable(compositionByPrefixes(company,['70'],p))}<h4>Conti 71 · Variazione rimanenze</h4>${rowTable(compositionByPrefixes(company,['71'],p))}<h4>Conti 73 · Altri ricavi e proventi</h4>${rowTable(compositionByPrefixes(company,['73'],p))}</div>`}<div class="v1199-note"><b>Esclusione importante</b>I conti 87 (proventi straordinari/non operativi) non fanno parte del Valore della produzione operativo.</div>`;
    }else if(metric==='ebitda'){
      label='EBITDA operativo';
      const r=d.record||{};
      const costValue=k=>company==='group'?['smartpack','multiplast'].reduce((s,c)=>s+num(record(c,p)?.[k]),0):num(r[k]);
      const parts=[{label:'Valore produzione',value:d.productionValue},{label:'− Materie / acquisti',value:-costValue('materials')},{label:'− Personale',value:-costValue('personnel')},{label:'− Energia',value:-costValue('energy')},{label:'− Trasporti',value:-costValue('transport')},{label:'− Altri costi operativi',value:-costValue('otherOpex')}];
      html=`<div class="v1199-hero"><span>EBITDA operativo</span><b class="${d.ebitda<0?'neg':''}">${money(d.ebitda)}</b><small>Valore della produzione meno costi operativi prima di ammortamenti.</small></div>${formulaBlock(parts,d.ebitda,'EBITDA')}${company!=='group'?costLinks(company,p):''}`;
    }else if(metric==='ebit'){
      label='EBIT operativo';
      const dep=company==='group'?['smartpack','multiplast'].reduce((s,c)=>s+num(record(c,p)?.depreciation),0):num(d.record?.depreciation);
      html=`<div class="v1199-hero"><span>EBIT operativo</span><b class="${d.ebit<0?'neg':''}">${money(d.ebit)}</b><small>Risultato operativo dopo gli ammortamenti.</small></div>${formulaBlock([{label:'EBITDA',value:d.ebitda},{label:'− Ammortamenti',value:-dep}],d.ebit,'EBIT')}${company!=='group'?`<h4>Ammortamenti da SPRING</h4>${rowTable(compositionByCategory(company,'depreciation',p))}`:''}`;
    }else if(metric==='margin'){
      label='Margine EBITDA / Valore della produzione';
      html=`<div class="v1199-hero"><span>Margine EBITDA sul Valore della produzione</span><b>${pct(d.marginProduction)}</b><small>EBITDA ÷ Valore della produzione × 100.</small></div><div class="v1199-ratio"><div><span>EBITDA</span><b>${money(d.ebitda)}</b></div><i>÷</i><div><span>Valore della produzione</span><b>${money(d.productionValue)}</b></div><i>=</i><div><span>Margine</span><b>${pct(d.marginProduction)}</b></div></div><div class="v1199-note"><b>Perché lo specifichiamo</b>Il denominatore non è il solo fatturato: comprende anche variazione rimanenze e altri ricavi operativi.</div>`;
    }else if(metric.startsWith('cat:')&&company!=='group'){
      const cat=metric.slice(4),labels={materials:'Materie / acquisti',personnel:'Personale',energy:'Energia',transport:'Trasporti',otherOpex:'Altri costi operativi',depreciation:'Ammortamenti',receivables:'Crediti clienti',payables:'Debiti fornitori',cash:'Liquidità',inventory:'Rimanenze',financialCharges:'Oneri finanziari'};
      label=labels[cat]||'Composizione importo';
      const rows=compositionByCategory(company,cat,p),total=rows.reduce((s,x)=>s+num(x.amount),0);
      html=`<div class="v1199-hero"><span>${esc(label)}</span><b>${money(total)}</b><small>Somma delle righe SPRING associate a questa categoria.</small></div>${rowTable(rows)}`;
    }

    title.textContent=label;body.innerHTML=html;try{dlg.showModal()}catch(_){}
  }
  function groupCompanyRows(k,p){
    return `<div class="v1199-company-grid">${['smartpack','multiplast'].map(c=>{const d=derived(c,p);return `<div><span>${companyLabel(c)}</span><b>${d.configured?money(d[k]):'—'}</b></div>`}).join('')}</div>`;
  }
  function costLinks(company,p){
    const cats=[['materials','Materie / acquisti'],['personnel','Personale'],['energy','Energia'],['transport','Trasporti'],['otherOpex','Altri costi operativi']];
    return `<div class="v1199-cost-buttons"><h4>Apri la composizione dei costi</h4>${cats.map(([k,l])=>`<button type="button" onclick="SPFinanceClarityV1199.open('cat:${k}','${company}','${p}')"><span>${l}</span><b>${money(record(company,p)?.[k])}</b></button>`).join('')}</div>`;
  }

  function setMetricTarget(el,metric,company,p){
    if(!el)return;
    el.classList.add('v1199-target');el.dataset.v1199Metric=metric;el.dataset.v1199Company=company;el.dataset.v1199Period=p;
    el.setAttribute('title','Apri composizione del valore');
  }
  function setLabelValue(card,label,value){
    if(!card)return;
    const s=card.querySelector('span'),b=card.querySelector('b');if(s)s.textContent=label;if(b)b.textContent=value;
  }
  function decorateCompany(box,company,p){
    const d=derived(company,p);if(!d.configured)return;
    const mini=$$('.v1170-fin-mini>div',box);
    if(mini[0]){setLabelValue(mini[0],'Ricavi vendite',money(d.salesRevenue));setMetricTarget(mini[0],'sales',company,p)}
    if(mini[1])setMetricTarget(mini[1],'ebitda',company,p);
    if(mini[2])setMetricTarget(mini[2],'ebit',company,p);
    if(mini[3]){const s=mini[3].querySelector('span');if(s)s.textContent='Margine EBITDA / Valore produzione';setMetricTarget(mini[3],'margin',company,p)}

    let strip=box.querySelector('.v1199-production-strip');
    if(!strip){strip=document.createElement('button');strip.type='button';strip.className='v1199-production-strip';const miniBox=box.querySelector('.v1170-fin-mini');miniBox?.insertAdjacentElement('afterend',strip)}
    if(strip){strip.innerHTML=`<div><span>Valore della produzione</span><b>${money(d.productionValue)}</b></div><small>70 + 71 + 73 · vedi composizione →</small>`;setMetricTarget(strip,'production',company,p)}

    const readonly=$$('.v1177-readonly-grid>div',box);
    readonly.forEach(card=>{
      const label=String(card.querySelector('span')?.textContent||'').trim();
      const map={'Ricavi':'sales','Materie / acquisti':'cat:materials','Personale':'cat:personnel','Energia':'cat:energy','Trasporti':'cat:transport','Altri costi operativi':'cat:otherOpex','Ammortamenti':'cat:depreciation','Crediti clienti':'cat:receivables','Debiti fornitori':'cat:payables','Liquidità':'cat:cash','Rimanenze':'cat:inventory','Oneri finanziari':'cat:financialCharges'};
      if(label==='Ricavi')setLabelValue(card,'Ricavi vendite',money(d.salesRevenue));
      if(map[label])setMetricTarget(card,map[label],company,p);
    });

    let note=box.querySelector('.v1199-accounting-note');
    if(!note){note=document.createElement('div');note.className='v1199-accounting-note';const lock=box.querySelector('.v1177-source-lock');lock?.insertAdjacentElement('afterend',note)}
    if(note)note.innerHTML='<b>Come leggiamo il bilancio:</b> Ricavi vendite = conti 70.* · Valore della produzione = 70 + 71 + 73. I proventi 87 restano separati perché non operativi.';
  }
  function decorateGroup(view,p){
    const d=groupDerived(p);if(!d.configured)return;
    const cards=$$('.v1170-fin-group>div',view);
    if(cards[0]){setLabelValue(cards[0],'Ricavi vendite gruppo',money(d.salesRevenue));setMetricTarget(cards[0],'sales','group',p)}
    if(cards[2])setMetricTarget(cards[2],'ebitda','group',p);
    if(cards[3])setMetricTarget(cards[3],'ebit','group',p);
    if(cards[4]){const s=cards[4].querySelector('span');if(s)s.textContent='Margine EBITDA / Valore produzione';const b=cards[4].querySelector('b');if(b)b.textContent=pct(d.marginProduction);setMetricTarget(cards[4],'margin','group',p)}
    let strip=view.querySelector('.v1199-group-production');
    const group=view.querySelector('.v1170-fin-group');
    if(!strip&&group){strip=document.createElement('button');strip.type='button';strip.className='v1199-group-production';group.insertAdjacentElement('afterend',strip)}
    if(strip){strip.innerHTML=`<span>Valore della produzione gruppo</span><b>${money(d.productionValue)}</b><small>Ricavi vendite + variazione rimanenze + altri ricavi operativi · Dettagli →</small>`;setMetricTarget(strip,'production','group',p)}
  }
  function decorateOverview(){
    const view=$('#adminOverviewV1170View');if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;
    const scope=sessionStorage.getItem('poi_admin_overview_scope_v1182')||'group';
    const d=scope==='group'?groupDerived(p):derived(scope,p);if(!d.configured)return;
    const first=$('.v1182-economic-grid>button',view);
    if(first){setLabelValue(first,'Ricavi vendite',money(d.salesRevenue));setMetricTarget(first,'sales',scope,p)}
    const status=$('.v1182-economic-status span',view);if(status&&/Margine EBITDA/i.test(status.textContent||''))status.textContent=`Margine EBITDA / Valore produzione ${pct(d.marginProduction)}`;
    let strip=$('.v1199-overview-production',view);
    const grid=$('.v1182-economic-grid',view);
    if(!strip&&grid){strip=document.createElement('button');strip.type='button';strip.className='v1199-overview-production';grid.insertAdjacentElement('afterend',strip)}
    if(strip){strip.innerHTML=`<span>Valore della produzione</span><b>${money(d.productionValue)}</b><small>70 + 71 + 73 · Dettagli →</small>`;setMetricTarget(strip,'production',scope,p)}
  }

  function decorate(){
    const view=$('#adminFinanceV1170View');
    const p=period();
    if(view?.classList.contains('active')&&p){
      decorateGroup(view,p);
      $$('.v1170-fin-company',view).forEach(box=>{
        const h=String(box.querySelector('.v1170-fin-company-head span')?.textContent||'').toUpperCase();
        decorateCompany(box,h.includes('SMART')?'smartpack':'multiplast',p);
      });
    }
    decorateOverview();
  }
  function injectStyles(){
    if($('#v1199FinanceStyles'))return;
    const st=document.createElement('style');st.id='v1199FinanceStyles';st.textContent=`
      .v1199-target{cursor:pointer!important;transition:.15s ease}.v1199-target:hover{border-color:#9fc4d2!important;box-shadow:0 5px 15px rgba(25,70,88,.08)!important}
      .v1199-production-strip,.v1199-group-production,.v1199-overview-production{width:100%;border:1px solid #bed7e0;background:#f3f9fb;border-radius:12px;padding:10px 12px;margin-top:8px;text-align:left;color:var(--ink);display:flex;justify-content:space-between;gap:14px;align-items:center}.v1199-production-strip div span,.v1199-group-production>span,.v1199-overview-production>span{display:block;font-size:8px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.05em}.v1199-production-strip div b,.v1199-group-production>b,.v1199-overview-production>b{display:block;font-size:16px;margin-top:2px}.v1199-production-strip small,.v1199-group-production small,.v1199-overview-production small{font-size:8px;color:var(--primary);font-weight:900}
      .v1199-accounting-note{margin-top:8px;padding:9px 10px;border:1px solid #d7e5e9;border-radius:10px;background:#f8fbfc;font-size:7.5px;color:#566f7a;line-height:1.45}.v1199-accounting-note b{color:#244b5d}
      .v1199-dialog{width:min(900px,96vw);max-height:92vh}.v1199-hero{padding:15px;border:1px solid #cee1e7;border-radius:14px;background:linear-gradient(135deg,#fff,#f4fafb)}.v1199-hero span,.v1199-hero b,.v1199-hero small{display:block}.v1199-hero span{font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase}.v1199-hero b{font-size:29px;margin:4px 0}.v1199-hero small{font-size:10px;color:var(--muted)}.v1199-hero b.neg,.v1199-tr .neg,.v1199-formula .neg{color:#b54148}
      .v1199-formula{display:flex;align-items:stretch;gap:6px;margin-top:10px;overflow-x:auto}.v1199-formula>div{min-width:140px;flex:1;padding:10px;border:1px solid var(--line);border-radius:11px;background:#fff}.v1199-formula>i,.v1199-formula>strong{display:grid;place-items:center;font-style:normal;color:#80939b}.v1199-formula span{display:block;font-size:8px;color:var(--muted)}.v1199-formula b{display:block;font-size:12px;margin-top:3px}.v1199-formula .total{background:#eef8f5;border-color:#c7e3d7}
      .v1199-table{margin-top:8px;border:1px solid var(--line);border-radius:12px;overflow:hidden}.v1199-tr{display:grid;grid-template-columns:130px 1fr 135px;gap:8px;padding:8px 10px;border-top:1px solid #edf2f3;align-items:center;font-size:9px}.v1199-tr.head{border-top:0;background:#f4f8f9;color:#74868e;font-size:7px;text-transform:uppercase;font-weight:950}.v1199-tr small{display:block;color:var(--muted);font-size:7px;margin-top:2px}.v1199-tr .amount{text-align:right;font-weight:900;font-variant-numeric:tabular-nums}.v1199-sub h4,.v1199-cost-buttons h4{font-size:10px;margin:14px 0 5px}.v1199-note{margin-top:10px;padding:10px 11px;border:1px solid #d8e6ea;background:#f7fafb;border-radius:10px;font-size:9px;line-height:1.45;color:#546b75}.v1199-note b{display:block;color:#244b5d;margin-bottom:2px}.v1199-company-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.v1199-company-grid>div,.v1199-ratio>div{padding:11px;border:1px solid var(--line);border-radius:11px;background:#fff}.v1199-company-grid span,.v1199-ratio span{display:block;font-size:8px;color:var(--muted)}.v1199-company-grid b,.v1199-ratio b{display:block;font-size:14px;margin-top:3px}.v1199-ratio{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:7px;align-items:center;margin-top:10px}.v1199-ratio>i{font-style:normal;color:#7f929a}.v1199-cost-buttons{margin-top:12px}.v1199-cost-buttons button{width:100%;display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border:0;border-bottom:1px solid #edf2f3;background:#fff;text-align:left}.v1199-cost-buttons button:hover{background:#f7fafb}.v1199-cost-buttons span{font-size:9px}.v1199-cost-buttons b{font-size:9px}.v1199-empty{padding:18px;text-align:center;color:var(--muted);font-size:9px}
      @media(max-width:650px){.v1199-tr{grid-template-columns:90px 1fr}.v1199-tr .amount{grid-column:1/-1;text-align:left}.v1199-formula{display:grid;grid-template-columns:1fr}.v1199-formula>i,.v1199-formula>strong{display:none}.v1199-company-grid,.v1199-ratio{grid-template-columns:1fr}.v1199-ratio>i{display:none}.v1199-production-strip,.v1199-group-production,.v1199-overview-production{display:block}.v1199-production-strip small,.v1199-group-production small,.v1199-overview-production small{display:block;margin-top:5px}}
    `;document.head.appendChild(st);
  }
  function bindClicks(){
    if(document.documentElement.dataset.v1199ClickBound==='1')return;
    document.documentElement.dataset.v1199ClickBound='1';
    document.addEventListener('click',e=>{
      const t=e.target.closest?.('.v1199-target');if(!t)return;
      const metric=t.dataset.v1199Metric,company=t.dataset.v1199Company,p=t.dataset.v1199Period;
      if(!metric)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open(metric,company,p);
    },true);
  }
  function boot(){
    injectStyles();ensureDialog();bindClicks();
    [250,700,1500,3000].forEach(ms=>setTimeout(decorate,ms));
    setInterval(()=>{
      const fin=$('#adminFinanceV1170View')?.classList.contains('active');
      const ov=$('#adminOverviewV1170View')?.classList.contains('active');
      if(fin||ov)decorate();
    },1800);
  }

  window.SPFinanceClarityV1199={open,decorate,derived,groupDerived,version:VERSION};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* ========================================================================
   V11.9.20 · FINANCE PERIOD + MANUAL INVENTORY + EBITDA QUADRATURE
   - EBITDA = Valore produzione corretto - costi operativi
   - Rimanenze iniziali/finali manuali con override esplicito
   - Periodo analisi Da/A + preset mese intero
   - Avviso per progressivi senza baseline precedente
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPFinancePeriodV11920)return;

  const VERSION='V11.9.20';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(num(v))}%`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function S(){try{return state}catch(_){return window.state||null}}
  function period(){
    const p=$('#financePeriodV1170')?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
    return /^\d{4}-\d{2}$/.test(p)?p:'';
  }
  function record(company,p=period()){
    return (S()?.adminFinanceV1170?.records||[]).find(x=>x.company===company&&x.period===p)||null;
  }
  function snap(company,p=period()){
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company&&x.period===p)
      .slice().sort((a,b)=>String(b.importedAt||b.id||'').localeCompare(String(a.importedAt||a.id||'')))[0]||null;
  }
  function prevCumulative(company,p=period()){
    const y=String(p).slice(0,4);
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company&&x.mode==='cumulative'&&x.period<p&&String(x.period||'').slice(0,4)===y)
      .slice().sort((a,b)=>String(b.period).localeCompare(String(a.period)))[0]||null;
  }
  function daysInMonth(y,m){return new Date(Number(y),Number(m),0).getDate()}
  function monthBounds(p){
    const [y,m]=String(p).split('-');
    if(!y||!m)return {start:'',end:''};
    return {start:`${y}-${m}-01`,end:`${y}-${m}-${String(daysInMonth(y,m)).padStart(2,'0')}`};
  }
  function nextMonthStart(p){
    const [y,m]=String(p).split('-').map(Number);
    const d=new Date(y,m,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  }
  function defaultRange(company,p){
    const s=snap(company,p), mb=monthBounds(p);
    if(!s)return mb;
    if(s.mode==='annual')return {start:`${String(p).slice(0,4)}-01-01`,end:mb.end};
    if(s.mode==='month')return mb;
    if(s.mode==='cumulative'){
      const prev=prevCumulative(company,p);
      return {start:prev?nextMonthStart(prev.period):`${String(p).slice(0,4)}-01-01`,end:mb.end};
    }
    return mb;
  }
  function groupRange(p){
    const rs=['smartpack','multiplast'].map(c=>record(c,p)).filter(Boolean);
    const starts=rs.map(r=>r.analysisStart).filter(Boolean).sort();
    const ends=rs.map(r=>r.analysisEnd).filter(Boolean).sort();
    if(starts.length&&ends.length)return {start:starts[0],end:ends[ends.length-1]};
    const defaults=rs.map(r=>defaultRange(r.company,p));
    return defaults.length
      ? {start:defaults.map(x=>x.start).filter(Boolean).sort()[0]||monthBounds(p).start,
         end:defaults.map(x=>x.end).filter(Boolean).sort().reverse()[0]||monthBounds(p).end}
      : monthBounds(p);
  }

  function manualInventory(company,p){
    const r=record(company,p);
    if(!r)return {enabled:false,opening:0,closing:0,change:0};
    const enabled=!!r.inventoryManualEnabled;
    const opening=num(r.inventoryOpeningManual);
    const closing=num(r.inventoryClosingManual);
    return {enabled,opening,closing,change:closing-opening};
  }

  let originals=null;
  function clarity(){return window.SPFinanceClarityV1199||null}

  function correctedDerived(company,p){
    if(!originals)return null;
    const base=originals.derived(company,p);
    if(!base?.configured)return base;
    const r=record(company,p)||{};
    const mi=manualInventory(company,p);
    const inv=mi.enabled?mi.change:num(base.inventoryChange);
    const sales=num(base.salesRevenue);
    const other=num(base.otherOperatingRevenue);
    const production=sales+inv+other;
    const opex=num(base.opex);
    const depreciation=num(r.depreciation);
    const ebitda=production-opex;
    const ebit=ebitda-depreciation;
    return {...base,
      salesRevenue:sales,
      inventoryChange:inv,
      inventoryChangeSource:mi.enabled?'manual':'spring',
      inventoryOpening:mi.enabled?mi.opening:null,
      inventoryClosing:mi.enabled?mi.closing:null,
      otherOperatingRevenue:other,
      productionValue:production,
      opex,ebitda,ebit,
      marginProduction:production?ebitda/production*100:0,
      record:r
    };
  }

  function correctedGroup(p){
    const xs=['smartpack','multiplast'].map(c=>correctedDerived(c,p)).filter(x=>x?.configured);
    if(!xs.length)return {configured:false,salesRevenue:0,inventoryChange:0,otherOperatingRevenue:0,productionValue:0,opex:0,ebitda:0,ebit:0,marginProduction:0};
    const sum=k=>xs.reduce((s,x)=>s+num(x[k]),0);
    const productionValue=sum('productionValue'),ebitda=sum('ebitda');
    return {
      configured:true,
      salesRevenue:sum('salesRevenue'),
      inventoryChange:sum('inventoryChange'),
      otherOperatingRevenue:sum('otherOperatingRevenue'),
      productionValue,
      opex:sum('opex'),
      ebitda,
      ebit:sum('ebit'),
      marginProduction:productionValue?ebitda/productionValue*100:0
    };
  }

  function installCorrectedEngine(){
    const c=clarity();
    if(!c||c.__v11920Corrected)return false;
    originals={derived:c.derived.bind(c),groupDerived:c.groupDerived.bind(c)};
    c.derived=(company,p)=>correctedDerived(company,p);
    c.groupDerived=p=>correctedGroup(p);
    c.__v11920Corrected=true;
    c.financeCorrectionVersion=VERSION;
    return true;
  }

  function sourceWarning(company,p){
    const s=snap(company,p);
    if(!s||s.mode!=='cumulative')return '';
    const prev=prevCumulative(company,p);
    const r=record(company,p)||{};
    const gr=groupRange(p);
    const mb=monthBounds(p);
    const asksMonthly=gr.start===mb.start&&gr.end===mb.end;
    if(asksMonthly&&!prev){
      return `${company==='smartpack'?'Smart Pack':'Multiplast'}: il bilancio è progressivo e non esiste un progressivo precedente. Per isolare il solo mese ${p}, importa anche il mese precedente.`;
    }
    if(prev){
      return `${company==='smartpack'?'Smart Pack':'Multiplast'}: progressivo confrontato con ${prev.period}; i flussi economici sono calcolati per differenza.`;
    }
    return `${company==='smartpack'?'Smart Pack':'Multiplast'}: primo progressivo disponibile; i flussi coprono l'intervallo dall'inizio esercizio.`;
  }

  function companyRow(company,p){
    const r=record(company,p);if(!r)return '';
    const mi=manualInventory(company,p);
    const name=company==='smartpack'?'Smart Pack':'Multiplast';
    const delta=mi.change;
    return `
      <div class="v11920-inventory-row" data-company="${company}">
        <div class="v11920-company"><b>${name}</b><span>Rimanenze di produzione</span></div>
        <label><span>Iniziali</span><input type="number" step="0.01" data-v11920-opening="${company}" value="${mi.enabled?mi.opening:''}" placeholder="0,00"></label>
        <label><span>Finali</span><input type="number" step="0.01" data-v11920-closing="${company}" value="${mi.enabled?mi.closing:''}" placeholder="0,00"></label>
        <div class="v11920-delta"><span>Variazione</span><b data-v11920-delta="${company}">${money(delta)}</b></div>
        <label class="v11920-switch"><input type="checkbox" data-v11920-enabled="${company}" ${mi.enabled?'checked':''}><span>Usa valori manuali</span></label>
      </div>`;
  }

  function panelHTML(p){
    const gr=groupRange(p);
    const warnings=['smartpack','multiplast'].map(c=>sourceWarning(c,p)).filter(Boolean);
    return `
      <section class="v11920-panel" data-v11920-panel>
        <div class="v11920-head">
          <div>
            <span class="eyebrow">PERIODO E RIMANENZE</span>
            <h3>Imposta l'intervallo di analisi</h3>
            <p>Le date descrivono il periodo analizzato. Le rimanenze manuali, quando attive, sostituiscono la variazione letta dal bilancio.</p>
          </div>
          <button type="button" class="btn" data-v11920-month>Mese intero</button>
        </div>
        <div class="v11920-range">
          <label><span>Da</span><input type="date" data-v11920-start value="${esc(gr.start)}"></label>
          <label><span>A</span><input type="date" data-v11920-end value="${esc(gr.end)}"></label>
          <div class="v11920-range-label"><span>Periodo visualizzato</span><b data-v11920-range-label>${esc(gr.start||'—')} → ${esc(gr.end||'—')}</b></div>
        </div>
        <div class="v11920-inventory">
          ${companyRow('smartpack',p)}
          ${companyRow('multiplast',p)}
        </div>
        ${warnings.length?`<div class="v11920-warning">${warnings.map(x=>`<div>⚠ ${esc(x)}</div>`).join('')}</div>`:''}
        <div class="v11920-actions">
          <span>Formula rimanenze manuali: <b>Finali − Iniziali</b>. La variazione entra nel Valore della produzione.</span>
          <button type="button" class="btn primary" data-v11920-save>Salva e ricalcola</button>
        </div>
      </section>`;
  }

  async function savePanel(p){
    const st=$('[data-v11920-start]')?.value||'';
    const en=$('[data-v11920-end]')?.value||'';
    if(st&&en&&st>en){alert('La data iniziale non può essere successiva alla data finale.');return}
    const s=S();if(!s)return;
    for(const company of ['smartpack','multiplast']){
      const r=record(company,p);if(!r)continue;
      r.analysisStart=st;
      r.analysisEnd=en;
      r.inventoryManualEnabled=!!$(`[data-v11920-enabled="${company}"]`)?.checked;
      r.inventoryOpeningManual=num($(`[data-v11920-opening="${company}"]`)?.value);
      r.inventoryClosingManual=num($(`[data-v11920-closing="${company}"]`)?.value);
      r.inventoryManualUpdatedAt=new Date().toISOString();
    }
    try{if(typeof save==='function')save()}catch(_){}
    try{await window.SPFinanceCloudV1179?.save?.(p)}catch(_){}
    updateFinanceDOM();
    decoratePanel(true);
    try{window.SPFinanceClarityV1199?.decorate?.()}catch(_){}
  }

  function bindPanel(panel,p){
    const updateDelta=c=>{
      const a=num($(`[data-v11920-opening="${c}"]`,panel)?.value);
      const b=num($(`[data-v11920-closing="${c}"]`,panel)?.value);
      const out=$(`[data-v11920-delta="${c}"]`,panel);if(out)out.textContent=money(b-a);
    };
    for(const c of ['smartpack','multiplast']){
      $(`[data-v11920-opening="${c}"]`,panel)?.addEventListener('input',()=>updateDelta(c));
      $(`[data-v11920-closing="${c}"]`,panel)?.addEventListener('input',()=>updateDelta(c));
    }
    const relabel=()=>{
      const a=$('[data-v11920-start]',panel)?.value||'—';
      const b=$('[data-v11920-end]',panel)?.value||'—';
      const out=$('[data-v11920-range-label]',panel);if(out)out.textContent=`${a} → ${b}`;
    };
    $('[data-v11920-start]',panel)?.addEventListener('change',relabel);
    $('[data-v11920-end]',panel)?.addEventListener('change',relabel);
    $('[data-v11920-month]',panel)?.addEventListener('click',()=>{
      const mb=monthBounds(p);
      const a=$('[data-v11920-start]',panel),b=$('[data-v11920-end]',panel);
      if(a)a.value=mb.start;if(b)b.value=mb.end;relabel();
    });
    $('[data-v11920-save]',panel)?.addEventListener('click',()=>savePanel(p));
  }

  function quadratureHTML(d){
    const ok=Math.abs((num(d.productionValue)-num(d.opex))-num(d.ebitda))<0.02;
    return `
      <section class="v11920-quadrature ${ok?'ok':'bad'}" data-v11920-quadrature>
        <div><span>Valore della produzione</span><b>${money(d.productionValue)}</b></div>
        <i>−</i>
        <div><span>Costi operativi</span><b>${money(d.opex)}</b></div>
        <i>=</i>
        <div><span>EBITDA</span><b class="${d.ebitda<0?'neg':''}">${money(d.ebitda)}</b></div>
        <strong>${ok?'Quadratura corretta':'Verificare quadratura'}</strong>
      </section>`;
  }

  function updateFinanceDOM(){
    const view=$('#adminFinanceV1170View');
    if(!view?.classList.contains('active')||!installCorrectedEngine()) {
      if(!view?.classList.contains('active'))return;
    }
    const p=period();if(!p)return;
    const g=correctedGroup(p);if(!g?.configured)return;

    const cards=$$('.v1170-fin-group>div',view);
    if(cards[1]){const b=cards[1].querySelector('b');if(b)b.textContent=money(g.opex)}
    if(cards[2]){const b=cards[2].querySelector('b');if(b){b.textContent=money(g.ebitda);b.classList.toggle('loss',g.ebitda<0)}}
    if(cards[3]){const b=cards[3].querySelector('b');if(b){b.textContent=money(g.ebit);b.classList.toggle('loss',g.ebit<0)}}
    if(cards[4]){const b=cards[4].querySelector('b');if(b)b.textContent=pct(g.marginProduction)}

    const prod=view.querySelector('.v1199-group-production');
    if(prod){
      const b=prod.querySelector('b');if(b)b.textContent=money(g.productionValue);
      const small=prod.querySelector('small');
      if(small)small.textContent=`Ricavi vendite + variazione rimanenze + altri ricavi operativi · Dettagli →`;
    }

    const boxes=$$('.v1170-fin-company',view);
    boxes.forEach(box=>{
      const title=String(box.querySelector('.v1170-fin-company-head span')?.textContent||'').toUpperCase();
      const company=title.includes('MULTIPLAST')?'multiplast':'smartpack';
      const d=correctedDerived(company,p);if(!d?.configured)return;
      const mini=$$('.v1170-fin-mini>div',box);
      if(mini[1]){const b=mini[1].querySelector('b');if(b){b.textContent=money(d.ebitda);b.classList.toggle('loss',d.ebitda<0)}}
      if(mini[2]){const b=mini[2].querySelector('b');if(b){b.textContent=money(d.ebit);b.classList.toggle('loss',d.ebit<0)}}
      if(mini[3]){const b=mini[3].querySelector('b');if(b)b.textContent=pct(d.marginProduction)}
      const strip=box.querySelector('.v1199-production-strip');
      if(strip){
        const b=strip.querySelector('b');if(b)b.textContent=money(d.productionValue);
        const small=strip.querySelector('small');
        if(small)small.textContent=`70 + variazione rimanenze ${d.inventoryChangeSource==='manual'?'manuale':'SPRING'} + 73 · vedi composizione →`;
      }
    });

    let q=view.querySelector('[data-v11920-quadrature]');
    const anchor=view.querySelector('.v1199-group-production')||view.querySelector('.v1170-fin-group');
    if(anchor){
      const tmp=document.createElement('div');tmp.innerHTML=quadratureHTML(g);
      if(q)q.replaceWith(tmp.firstElementChild);
      else anchor.insertAdjacentElement('afterend',tmp.firstElementChild);
    }

    const hero=view.querySelector('.v1170-fin-hero');
    const gr=groupRange(p);
    if(hero){
      let badge=hero.querySelector('.v11920-period-badge');
      if(!badge){badge=document.createElement('div');badge.className='v11920-period-badge';hero.querySelector('div')?.appendChild(badge)}
      if(badge)badge.innerHTML=`<span>Periodo analisi</span><b>${esc(gr.start||'—')} → ${esc(gr.end||'—')}</b>`;
    }
  }

  function decoratePanel(force=false){
    const view=$('#adminFinanceV1170View');
    if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;
    let old=view.querySelector('[data-v11920-panel]');
    if(old&&!force)return;
    const tmp=document.createElement('div');tmp.innerHTML=panelHTML(p);
    const panel=tmp.firstElementChild;
    if(old)old.replaceWith(panel);
    else{
      const source=view.querySelector('.v1173-source-banner');
      const hero=view.querySelector('.v1170-fin-hero');
      (source||hero)?.insertAdjacentElement('afterend',panel);
    }
    bindPanel(panel,p);
    updateFinanceDOM();
  }

  function injectStyles(){
    if($('#v11920FinanceStyles'))return;
    const st=document.createElement('style');st.id='v11920FinanceStyles';
    st.textContent=`
      .v11920-panel{margin:10px 0 12px;padding:14px;border:1px solid #d8e5e9;border-radius:15px;background:#fff;box-shadow:0 5px 16px rgba(23,57,74,.035)}
      .v11920-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
      .v11920-head h3{margin:3px 0 3px;font-size:14px}.v11920-head p{margin:0;color:#6a7e87;font-size:9.5px;line-height:1.45}
      .v11920-range{display:grid;grid-template-columns:180px 180px 1fr;gap:9px;margin-top:11px;padding:10px;border-radius:12px;background:#f6fafb;border:1px solid #e2ebee}
      .v11920-range label span,.v11920-inventory-row label>span,.v11920-delta span,.v11920-range-label span{display:block;color:#71858e;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
      .v11920-range input,.v11920-inventory-row input[type=number]{width:100%;min-height:35px;border:1px solid #d4e1e5;border-radius:9px;padding:7px 9px;background:#fff;font-size:10px;color:#17303c}
      .v11920-range-label{display:flex;flex-direction:column;justify-content:center;padding:0 8px}.v11920-range-label b{font-size:11px;color:#17394a}
      .v11920-inventory{display:grid;gap:7px;margin-top:9px}
      .v11920-inventory-row{display:grid;grid-template-columns:170px 150px 150px 150px 155px;gap:9px;align-items:end;padding:10px;border:1px solid #e1e9ec;border-radius:12px;background:#fff}
      .v11920-company{align-self:center}.v11920-company b{display:block;font-size:11px;color:#17394a}.v11920-company span{display:block;font-size:8.5px;color:#758992;margin-top:2px}
      .v11920-delta{padding:7px 9px;border-radius:9px;background:#f4f8f9}.v11920-delta b{font-size:11px;color:#17394a}
      .v11920-switch{display:flex!important;gap:7px;align-items:center!important;align-self:center;padding-top:12px}.v11920-switch input{width:auto!important;min-height:auto!important}.v11920-switch span{margin:0!important;text-transform:none!important;font-size:9px!important;color:#425c68!important}
      .v11920-warning{margin-top:9px;padding:9px 10px;border:1px solid #ead5a9;background:#fff8e8;color:#74531d;border-radius:10px;font-size:9px;line-height:1.5}
      .v11920-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:9px}.v11920-actions>span{font-size:8.5px;color:#687c85}
      .v11920-quadrature{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto;gap:10px;align-items:center;margin:9px 0 12px;padding:10px 12px;border:1px solid #dce7ea;border-radius:12px;background:#f8fbfc}
      .v11920-quadrature>div span{display:block;font-size:8px;color:#71858e;text-transform:uppercase;font-weight:850}.v11920-quadrature>div b{display:block;margin-top:3px;font-size:12px;color:#17303c}.v11920-quadrature>div b.neg{color:#ab3740}.v11920-quadrature>i{font-style:normal;font-size:14px;color:#82949c}.v11920-quadrature>strong{font-size:8.5px;padding:6px 8px;border-radius:999px;background:#eaf7f1;color:#247057;white-space:nowrap}.v11920-quadrature.bad>strong{background:#fff0f1;color:#a13a42}
      .v11920-period-badge{display:inline-flex;gap:7px;align-items:center;margin-top:8px;padding:6px 8px;border:1px solid #dbe7ea;border-radius:999px;background:#f7fafb;font-size:8.5px}.v11920-period-badge span{color:#758992}.v11920-period-badge b{color:#17394a}
      @media(max-width:1050px){.v11920-inventory-row{grid-template-columns:1fr 1fr 1fr}.v11920-company{grid-column:1/-1}.v11920-switch{grid-column:1/-1}.v11920-range{grid-template-columns:1fr 1fr}.v11920-range-label{grid-column:1/-1}}
      @media(max-width:650px){.v11920-head,.v11920-actions{display:block}.v11920-head .btn,.v11920-actions .btn{margin-top:8px;width:100%}.v11920-range,.v11920-inventory-row{grid-template-columns:1fr}.v11920-range-label,.v11920-company,.v11920-switch{grid-column:auto}.v11920-quadrature{grid-template-columns:1fr}.v11920-quadrature>i{display:none}}
    `;
    document.head.appendChild(st);
  }

  function boot(){
    injectStyles();
    const tryInstall=()=>{
      installCorrectedEngine();
      decoratePanel();
      updateFinanceDOM();
    };
    [100,300,700,1400,2600].forEach(ms=>setTimeout(tryInstall,ms));
    setInterval(()=>{
      const v=$('#adminFinanceV1170View');
      if(v?.classList.contains('active'))tryInstall();
    },900);
    document.addEventListener('change',e=>{
      if(e.target?.id==='financePeriodV1170')setTimeout(()=>{decoratePanel(true);updateFinanceDOM()},80);
    },true);
  }

  window.SPFinancePeriodV11920={
    version:VERSION,
    correctedDerived,
    correctedGroup,
    refresh:()=>{decoratePanel(true);updateFinanceDOM()}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();




/* ========================================================================
   V11.9.21 · GUIDED FINANCE COMPLETION + SINGLE SOURCE OF TRUTH
   UX cliente: Bilancio -> dati automatici -> soli campi manuali richiesti.
   Unifica Analisi e Composizione sullo stesso EBITDA corretto.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPFinanceGuidedV11921)return;

  const VERSION='V11.9.21';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(num(v))}%`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function S(){try{return state}catch(_){return window.state||null}}
  function period(){
    const p=$('#financePeriodV1170')?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
    return /^\d{4}-\d{2}$/.test(p)?p:'';
  }
  function record(company,p=period()){
    return (S()?.adminFinanceV1170?.records||[]).find(x=>x.company===company&&x.period===p)||null;
  }
  function snaps(company,p=period()){
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company&&x.period===p)
      .slice().sort((a,b)=>String(b.importedAt||b.id||'').localeCompare(String(a.importedAt||a.id||'')));
  }
  function snap(company,p=period()){return snaps(company,p)[0]||null}
  function prevSnap(company,s){
    if(!s||s.mode!=='cumulative')return null;
    const y=String(s.period||'').slice(0,4);
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company&&x.period<s.period&&String(x.period||'').slice(0,4)===y&&x.mode==='cumulative')
      .slice().sort((a,b)=>String(b.period).localeCompare(String(a.period)))[0]||null;
  }
  function keyOf(a){return String(a?.mapKey||(a?.partitario?`${a.code}|${a.partitario}`:a?.code||''))}
  function rawAmount(a){
    if(Number.isFinite(Number(a?.signedAmount)))return Number(a.signedAmount);
    const d=num(a?.debit),c=num(a?.credit),sec=String(a?.section||'');
    if(d||c){
      if(sec==='revenue'||sec==='liability')return c-d;
      return d-c;
    }
    return num(a?.balance);
  }
  function flowAmount(a,s,prev){
    let v=rawAmount(a);
    if(s?.mode==='cumulative'&&prev){
      const pa=(prev.accounts||[]).find(x=>keyOf(x)===keyOf(a));
      v-=pa?rawAmount(pa):0;
    }
    return v;
  }
  function prefix(a,p){
    const c=String(a?.code||'').trim();
    return c===p||c.startsWith(p+'.');
  }
  function prefixTotal(company,prefixes,p=period()){
    const s=snap(company,p);if(!s)return 0;
    const prev=prevSnap(company,s);
    return (s.accounts||[])
      .filter(a=>prefixes.some(x=>prefix(a,x)))
      .reduce((sum,a)=>sum+flowAmount(a,s,prev),0);
  }

  function manualInv(company,p){
    const r=record(company,p)||{};
    const enabled=!!r.inventoryManualEnabled;
    const opening=num(r.inventoryOpeningManual),closing=num(r.inventoryClosingManual);
    return {enabled,opening,closing,change:closing-opening};
  }

  function automaticParts(company,p){
    const r=record(company,p)||{};
    return {
      sales:prefixTotal(company,['70'],p),
      closing:prefixTotal(company,['71'],p),
      otherRevenue:prefixTotal(company,['73'],p),
      opening:prefixTotal(company,['75'],p),
      materialsTotal:num(r.materials),
      personnel:num(r.personnel),
      energy:num(r.energy),
      transport:num(r.transport),
      otherOpex:num(r.otherOpex),
      depreciation:num(r.depreciation)
    };
  }

  function derive(company,p=period()){
    const r=record(company,p);
    if(!r)return {configured:false};

    const a=automaticParts(company,p);
    const m=manualInv(company,p);

    // 72 + 75 sono stati aggregati insieme in materials.
    // Per sostituire correttamente le rimanenze iniziali manuali:
    // togliamo il 75 automatico e aggiungiamo il valore manuale.
    const purchasesExOpening=a.materialsTotal-a.opening;
    const opening=m.enabled?m.opening:a.opening;
    const closing=m.enabled?m.closing:a.closing;

    const production=a.sales+closing+a.otherRevenue;
    const materialsAdjusted=purchasesExOpening+opening;
    const opex=materialsAdjusted+a.personnel+a.energy+a.transport+a.otherOpex;
    const ebitda=production-opex;
    const ebit=ebitda-a.depreciation;

    return {
      configured:true,
      record:r,
      salesRevenue:a.sales,
      openingInventory:opening,
      closingInventory:closing,
      autoOpeningInventory:a.opening,
      autoClosingInventory:a.closing,
      manualInventory:m.enabled,
      inventoryChange:closing-opening,
      otherOperatingRevenue:a.otherRevenue,
      purchasesExOpening,
      materials:materialsAdjusted,
      personnel:a.personnel,
      energy:a.energy,
      transport:a.transport,
      otherOpex:a.otherOpex,
      depreciation:a.depreciation,
      productionValue:production,
      opex,ebitda,ebit,
      marginProduction:production?ebitda/production*100:0
    };
  }
  function group(p=period()){
    const xs=['smartpack','multiplast'].map(c=>derive(c,p)).filter(x=>x.configured);
    if(!xs.length)return {configured:false};
    const sum=k=>xs.reduce((s,x)=>s+num(x[k]),0);
    const productionValue=sum('productionValue'),opex=sum('opex'),ebitda=productionValue-opex;
    return {
      configured:true,
      salesRevenue:sum('salesRevenue'),
      openingInventory:sum('openingInventory'),
      closingInventory:sum('closingInventory'),
      inventoryChange:sum('inventoryChange'),
      otherOperatingRevenue:sum('otherOperatingRevenue'),
      materials:sum('materials'),
      personnel:sum('personnel'),
      energy:sum('energy'),
      transport:sum('transport'),
      otherOpex:sum('otherOpex'),
      depreciation:sum('depreciation'),
      productionValue,opex,ebitda,
      ebit:ebitda-sum('depreciation'),
      marginProduction:productionValue?ebitda/productionValue*100:0
    };
  }

  function installEngine(){
    const c=window.SPFinanceClarityV1199;
    if(!c)return false;
    c.derived=(company,p)=>derive(company,p);
    c.groupDerived=p=>group(p);
    c.financeCorrectionVersion=VERSION;
    c.__v11921=true;
    return true;
  }

  function monthBounds(p){
    const [y,m]=String(p).split('-').map(Number);
    if(!y||!m)return {start:'',end:''};
    const last=new Date(y,m,0).getDate();
    return {start:`${y}-${String(m).padStart(2,'0')}-01`,end:`${y}-${String(m).padStart(2,'0')}-${String(last).padStart(2,'0')}`};
  }
  function rangeFor(p){
    const rs=['smartpack','multiplast'].map(c=>record(c,p)).filter(Boolean);
    const starts=rs.map(r=>r.analysisStart).filter(Boolean).sort();
    const ends=rs.map(r=>r.analysisEnd).filter(Boolean).sort();
    if(starts.length&&ends.length)return {start:starts[0],end:ends[ends.length-1]};
    return monthBounds(p);
  }
  function companyName(c){return c==='smartpack'?'Smart Pack':'Multiplast'}

  function inventoryStatus(company,p){
    const a=automaticParts(company,p),m=manualInv(company,p);
    const autoOpening=Math.abs(a.opening)>0.004,autoClosing=Math.abs(a.closing)>0.004;
    if(m.enabled)return {cls:'manual',label:'Manuale',text:'I valori inseriti sostituiscono quelli letti dal bilancio.'};
    if(autoOpening&&autoClosing)return {cls:'auto',label:'Rilevate',text:'Il sistema ha trovato rimanenze iniziali e finali nel bilancio. Puoi confermarle o sostituirle.'};
    return {cls:'required',label:'Da completare',text:'Manca almeno una delle due rimanenze: inserisci manualmente iniziali e finali.'};
  }

  function automaticSummary(company,p){
    const d=derive(company,p),s=snap(company,p);
    if(!d.configured)return '';
    return `
      <article class="v11921-auto-company">
        <div class="v11921-auto-head">
          <div><b>${companyName(company)}</b><span>${s?`SPRING · ${esc(s.fileName||'bilancio importato')}`:'Dati disponibili'}</span></div>
          <i>✓ Letto automaticamente</i>
        </div>
        <div class="v11921-auto-grid">
          <div><span>Ricavi vendite</span><b>${money(d.salesRevenue)}</b></div>
          <div><span>Acquisti + rimanenze iniziali</span><b>${money(d.materials)}</b></div>
          <div><span>Personale</span><b>${money(d.personnel)}</b></div>
          <div><span>Energia</span><b>${money(d.energy)}</b></div>
          <div><span>Trasporti</span><b>${money(d.transport)}</b></div>
          <div><span>Altri costi operativi</span><b>${money(d.otherOpex)}</b></div>
        </div>
      </article>`;
  }

  function manualRow(company,p){
    const d=derive(company,p),m=manualInv(company,p),st=inventoryStatus(company,p);
    const opening=m.enabled?m.opening:d.autoOpeningInventory;
    const closing=m.enabled?m.closing:d.autoClosingInventory;
    return `
      <article class="v11921-manual-row ${st.cls}" data-v11921-company="${company}">
        <div class="v11921-manual-title">
          <div><b>${companyName(company)}</b><span>Rimanenze per il periodo</span></div>
          <em>${st.label}</em>
        </div>
        <p>${st.text}</p>
        <div class="v11921-fields">
          <label><span>Rimanenze iniziali</span><input type="number" step="0.01" data-v11921-opening="${company}" value="${opening||''}" placeholder="Inserisci importo €"></label>
          <label><span>Rimanenze finali</span><input type="number" step="0.01" data-v11921-closing="${company}" value="${closing||''}" placeholder="Inserisci importo €"></label>
          <div><span>Variazione</span><b data-v11921-delta="${company}">${money(closing-opening)}</b><small>Finali − iniziali</small></div>
        </div>
        <label class="v11921-use-manual">
          <input type="checkbox" data-v11921-enabled="${company}" ${m.enabled?'checked':''}>
          <span>Usa questi valori per l'analisi</span>
        </label>
      </article>`;
  }

  function completeness(p){
    const companies=['smartpack','multiplast'].filter(c=>record(c,p));
    let required=0,done=0;
    for(const c of companies){
      const st=inventoryStatus(c,p);
      if(st.cls==='required')required++;
      if(st.cls==='manual'||st.cls==='auto')done++;
    }
    return {companies,required,done,total:companies.length};
  }

  function guidedHTML(p){
    const rg=rangeFor(p),c=completeness(p);
    return `
      <section class="v11921-guide" data-v11921-guide>
        <div class="v11921-guide-head">
          <div>
            <span class="eyebrow">COMPLETA ANALISI</span>
            <h3>Il bilancio è stato letto. Completa solo ciò che serve.</h3>
            <p>I valori contabili vengono presi automaticamente da SPRING. Qui il cliente interviene solo sui dati che il bilancio non consente di determinare con certezza.</p>
          </div>
          <div class="v11921-progress"><b>${c.required?`${c.required} dato/i da verificare`:'Dati pronti'}</b><span>${c.total} aziende nel periodo</span></div>
        </div>

        <div class="v11921-step">
          <div class="v11921-step-no">1</div>
          <div class="v11921-step-body">
            <div class="v11921-step-title"><b>Periodo analizzato</b><span>Indica a quale intervallo si riferiscono i dati.</span></div>
            <div class="v11921-range">
              <label><span>Da</span><input type="date" data-v11921-start value="${esc(rg.start)}"></label>
              <label><span>A</span><input type="date" data-v11921-end value="${esc(rg.end)}"></label>
              <button type="button" class="btn" data-v11921-month>Mese intero</button>
            </div>
            <div class="v11921-period-help">Per analizzare un singolo mese da un bilancio progressivo servono due progressivi consecutivi (es. 31/05 e 30/06). In alternativa carica un bilancio del solo mese.</div>
          </div>
        </div>

        <div class="v11921-step">
          <div class="v11921-step-no">2</div>
          <div class="v11921-step-body">
            <div class="v11921-step-title"><b>Dati letti automaticamente</b><span>Non devi ricopiarli.</span></div>
            <details class="v11921-auto-details">
              <summary>Mostra valori letti dal bilancio</summary>
              <div class="v11921-auto-list">
                ${c.companies.map(x=>automaticSummary(x,p)).join('')}
              </div>
            </details>
          </div>
        </div>

        <div class="v11921-step important">
          <div class="v11921-step-no">3</div>
          <div class="v11921-step-body">
            <div class="v11921-step-title">
              <b>Rimanenze da confermare</b>
              <span>Il sistema ti indica se sono già presenti oppure se devi inserirle.</span>
            </div>
            <div class="v11921-manual-list">
              ${c.companies.map(x=>manualRow(x,p)).join('')}
            </div>
          </div>
        </div>

        <div class="v11921-guide-actions">
          <div><b>Quando hai finito</b><span>Salva: tutti i KPI e le finestre Analisi/Composizione verranno ricalcolati con la stessa formula.</span></div>
          <button type="button" class="btn primary" data-v11921-save>Conferma dati e ricalcola</button>
        </div>
      </section>`;
  }

  async function saveGuide(p){
    const start=$('[data-v11921-start]')?.value||'';
    const end=$('[data-v11921-end]')?.value||'';
    if(start&&end&&start>end){alert('La data iniziale non può essere successiva alla data finale.');return}
    for(const company of ['smartpack','multiplast']){
      const r=record(company,p);if(!r)continue;
      r.analysisStart=start;r.analysisEnd=end;
      r.inventoryManualEnabled=!!$(`[data-v11921-enabled="${company}"]`)?.checked;
      r.inventoryOpeningManual=num($(`[data-v11921-opening="${company}"]`)?.value);
      r.inventoryClosingManual=num($(`[data-v11921-closing="${company}"]`)?.value);
      r.inventoryManualUpdatedAt=new Date().toISOString();
    }
    try{if(typeof save==='function')save()}catch(_){}
    try{await window.SPFinanceCloudV1179?.save?.(p)}catch(_){}
    refreshAll(true);
  }

  function bindGuide(el,p){
    for(const c of ['smartpack','multiplast']){
      const update=()=>{
        const a=num($(`[data-v11921-opening="${c}"]`,el)?.value);
        const b=num($(`[data-v11921-closing="${c}"]`,el)?.value);
        const out=$(`[data-v11921-delta="${c}"]`,el);if(out)out.textContent=money(b-a);
      };
      $(`[data-v11921-opening="${c}"]`,el)?.addEventListener('input',update);
      $(`[data-v11921-closing="${c}"]`,el)?.addEventListener('input',update);
    }
    $('[data-v11921-month]',el)?.addEventListener('click',()=>{
      const b=monthBounds(p);
      const a=$('[data-v11921-start]',el),z=$('[data-v11921-end]',el);
      if(a)a.value=b.start;if(z)z.value=b.end;
    });
    $('[data-v11921-save]',el)?.addEventListener('click',()=>saveGuide(p));
  }

  function insertGuide(force=false){
    const view=$('#adminFinanceV1170View');if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;

    // Nasconde il pannello tecnico V11.9.20: le funzioni restano, ma il cliente vede solo il percorso guidato.
    $$('[data-v11920-panel]',view).forEach(x=>x.style.display='none');

    let old=$('[data-v11921-guide]',view);
    if(old&&!force)return;
    const tmp=document.createElement('div');tmp.innerHTML=guidedHTML(p);
    const guide=tmp.firstElementChild;
    if(old)old.replaceWith(guide);
    else{
      const source=$('.v1173-source-banner',view);
      const hero=$('.v1170-fin-hero',view);
      (source||hero)?.insertAdjacentElement('afterend',guide);
    }
    bindGuide(guide,p);
  }

  function updateDashboard(){
    const view=$('#adminFinanceV1170View');if(!view?.classList.contains('active'))return;
    const p=period();if(!p)return;
    const g=group(p);if(!g.configured)return;

    const cards=$$('.v1170-fin-group>div',view);
    if(cards[1]){const b=cards[1].querySelector('b');if(b)b.textContent=money(g.opex)}
    if(cards[2]){const b=cards[2].querySelector('b');if(b){b.textContent=money(g.ebitda);b.classList.toggle('loss',g.ebitda<0)}}
    if(cards[3]){const b=cards[3].querySelector('b');if(b){b.textContent=money(g.ebit);b.classList.toggle('loss',g.ebit<0)}}
    if(cards[4]){const b=cards[4].querySelector('b');if(b)b.textContent=pct(g.marginProduction)}

    const prod=$('.v1199-group-production',view);
    if(prod){
      const b=prod.querySelector('b');if(b)b.textContent=money(g.productionValue);
    }

    let q=$('[data-v11921-q]',view);
    const qhtml=`
      <section class="v11921-q" data-v11921-q>
        <div><span>Valore produzione</span><b>${money(g.productionValue)}</b></div>
        <i>−</i>
        <div><span>Costi operativi</span><b>${money(g.opex)}</b></div>
        <i>=</i>
        <div><span>EBITDA</span><b class="${g.ebitda<0?'neg':''}">${money(g.ebitda)}</b></div>
      </section>`;
    const anchor=prod||$('.v1170-fin-group',view);
    if(anchor){
      if(q){const t=document.createElement('div');t.innerHTML=qhtml;q.replaceWith(t.firstElementChild)}
      else anchor.insertAdjacentHTML('afterend',qhtml);
    }
  }

  function inferUnifiedContext(){
    const title=String($('#financeUnifiedV11913Title')?.textContent||'').trim().toLowerCase();
    const sub=String($('#financeUnifiedV11913Sub')?.textContent||'');
    let company='group';
    if(/^smart pack/i.test(sub))company='smartpack';
    else if(/^multiplast/i.test(sub))company='multiplast';
    const pm=sub.match(/(\d{4}-\d{2})/);
    const p=pm?.[1]||period();
    let metric='ebitda';
    if(title.includes('valore della produzione'))metric='production';
    else if(title.includes('ricavi vendite')||title.includes('fatturato'))metric='sales';
    else if(title==='ebit'||title.startsWith('ebit '))metric='ebit';
    else if(title.includes('margine'))metric='margin';
    else if(title.includes('ebitda'))metric='ebitda';
    return {metric,company,p};
  }

  function costCards(d){
    const rows=[
      ['Materie / acquisti',d.materials],
      ['Personale',d.personnel],
      ['Energia',d.energy],
      ['Trasporti',d.transport],
      ['Altri costi operativi',d.otherOpex]
    ];
    return `<div class="v11921-costs">${rows.map(([l,v])=>`<div><span>− ${esc(l)}</span><b>${money(v)}</b></div>`).join('')}</div>`;
  }

  function correctedComposition(metric,company,p){
    const d=company==='group'?group(p):derive(company,p);
    if(!d?.configured)return '<div class="empty"><b>Dati non disponibili</b></div>';

    if(metric==='ebitda'){
      return `
        <div class="v1199-hero"><span>EBITDA operativo</span><b>${money(d.ebitda)}</b><small>Un'unica formula usata in tutta la piattaforma.</small></div>
        <div class="v11921-formula">
          <div><span>Valore della produzione</span><b>${money(d.productionValue)}</b></div>
          <i>−</i>
          <div><span>Costi operativi</span><b>${money(d.opex)}</b></div>
          <i>=</i>
          <div class="result"><span>EBITDA</span><b class="${d.ebitda<0?'neg':''}">${money(d.ebitda)}</b></div>
        </div>
        <h4 class="v11921-comp-title">Composizione dei costi operativi</h4>
        ${costCards(d)}
        <div class="v11921-stock-note">
          <b>Rimanenze considerate</b>
          <span>Iniziali ${money(d.openingInventory)} · Finali ${money(d.closingInventory)} · Variazione ${money(d.inventoryChange)}${d.manualInventory?' · valori manuali confermati':''}</span>
        </div>`;
    }
    if(metric==='production'){
      return `
        <div class="v1199-hero"><span>Valore della produzione</span><b>${money(d.productionValue)}</b><small>Ricavi + rimanenze finali + altri ricavi operativi.</small></div>
        <div class="v11921-formula three">
          <div><span>Ricavi vendite</span><b>${money(d.salesRevenue)}</b></div><i>+</i>
          <div><span>Rimanenze finali</span><b>${money(d.closingInventory)}</b></div><i>+</i>
          <div><span>Altri ricavi operativi</span><b>${money(d.otherOperatingRevenue)}</b></div><i>=</i>
          <div class="result"><span>Valore produzione</span><b>${money(d.productionValue)}</b></div>
        </div>
        <div class="v11921-stock-note"><b>Rimanenze iniziali</b><span>${money(d.openingInventory)} vengono considerate tra i costi operativi/materie, non sommate al valore della produzione.</span></div>`;
    }
    if(metric==='ebit'){
      return `
        <div class="v1199-hero"><span>EBIT operativo</span><b>${money(d.ebit)}</b></div>
        <div class="v11921-formula">
          <div><span>EBITDA</span><b>${money(d.ebitda)}</b></div><i>−</i>
          <div><span>Ammortamenti</span><b>${money(d.depreciation)}</b></div><i>=</i>
          <div class="result"><span>EBIT</span><b class="${d.ebit<0?'neg':''}">${money(d.ebit)}</b></div>
        </div>`;
    }
    if(metric==='margin'){
      return `
        <div class="v1199-hero"><span>Margine EBITDA / Valore produzione</span><b>${pct(d.marginProduction)}</b></div>
        <div class="v11921-formula"><div><span>EBITDA</span><b>${money(d.ebitda)}</b></div><i>÷</i><div><span>Valore produzione</span><b>${money(d.productionValue)}</b></div><i>=</i><div class="result"><span>Margine</span><b>${pct(d.marginProduction)}</b></div></div>`;
    }
    if(metric==='sales'){
      return `<div class="v1199-hero"><span>Ricavi vendite / fatturato</span><b>${money(d.salesRevenue)}</b><small>Solo conti 70.*.</small></div>`;
    }
    return '';
  }

  function interceptComposition(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-v11913-tab="composition"]');
      if(!b)return;
      const dlg=$('#financeUnifiedV11913Dialog');
      if(!dlg?.open)return;
      const {metric,company,p}=inferUnifiedContext();
      const html=correctedComposition(metric,company,p);
      if(!html)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      $$('[data-v11913-tab]').forEach(x=>x.classList.toggle('active',x===b));
      const body=$('#financeUnifiedV11913Body');if(body)body.innerHTML=html;
    },true);
  }

  function injectStyles(){
    if($('#v11921Styles'))return;
    const st=document.createElement('style');st.id='v11921Styles';
    st.textContent=`
      .v11921-guide{margin:10px 0 12px;background:#fff;border:1px solid #d8e5e9;border-radius:17px;overflow:hidden;box-shadow:0 6px 18px rgba(23,57,74,.04)}
      .v11921-guide-head{display:flex;justify-content:space-between;gap:18px;padding:15px 16px;background:linear-gradient(135deg,#f8fbfc,#fff)}
      .v11921-guide-head h3{margin:3px 0 3px;font-size:15px;color:#142f3b}.v11921-guide-head p{margin:0;max-width:760px;font-size:10px;line-height:1.5;color:#647a84}
      .v11921-progress{text-align:right;align-self:center}.v11921-progress b{display:block;font-size:10px;color:#17394a}.v11921-progress span{display:block;font-size:8px;color:#7b8e96;margin-top:2px}
      .v11921-step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:13px 16px;border-top:1px solid #e8eef0}.v11921-step.important{background:#fffdf9}
      .v11921-step-no{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#17394a;color:#fff;font-size:10px;font-weight:950}
      .v11921-step-title{display:flex;gap:8px;align-items:baseline}.v11921-step-title b{font-size:11px;color:#17303c}.v11921-step-title span{font-size:9px;color:#72868f}
      .v11921-range{display:flex;gap:8px;align-items:end;margin-top:9px}.v11921-range label span,.v11921-fields label span,.v11921-fields>div>span{display:block;font-size:8px;font-weight:850;color:#71858e;text-transform:uppercase;margin-bottom:4px}
      .v11921-range input,.v11921-fields input{min-height:35px;border:1px solid #d5e2e6;border-radius:9px;background:#fff;padding:7px 9px;font-size:10px;color:#17303c}
      .v11921-period-help{margin-top:7px;font-size:8.5px;line-height:1.45;color:#6e818a}
      .v11921-auto-details{margin-top:8px;border:1px solid #e1eaed;border-radius:10px;background:#f8fbfc}.v11921-auto-details summary{cursor:pointer;padding:9px 10px;font-size:9px;font-weight:850;color:#1f5e78}
      .v11921-auto-list{padding:0 9px 9px;display:grid;gap:7px}.v11921-auto-company{padding:9px;border:1px solid #e2e9ec;border-radius:10px;background:#fff}
      .v11921-auto-head{display:flex;justify-content:space-between;gap:10px}.v11921-auto-head b{font-size:10px}.v11921-auto-head span{display:block;font-size:8px;color:#7b8d95}.v11921-auto-head i{font-style:normal;font-size:8px;color:#28745c}
      .v11921-auto-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:7px}.v11921-auto-grid div{padding:6px;border-radius:8px;background:#f6f9fa}.v11921-auto-grid span{display:block;font-size:7px;color:#778a92}.v11921-auto-grid b{display:block;margin-top:2px;font-size:8.5px;color:#17394a}
      .v11921-manual-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.v11921-manual-row{padding:10px;border:1px solid #dfe8eb;border-radius:12px;background:#fff}.v11921-manual-row.required{border-color:#e7c881;background:#fffaf0}.v11921-manual-row.manual{border-color:#b9d8ca;background:#f8fcfa}
      .v11921-manual-title{display:flex;justify-content:space-between;gap:10px}.v11921-manual-title b{font-size:10px}.v11921-manual-title span{display:block;font-size:8px;color:#798c94}.v11921-manual-title em{font-style:normal;font-size:8px;font-weight:900;color:#1f5e78}
      .v11921-manual-row p{margin:5px 0 8px;font-size:8.5px;line-height:1.4;color:#687c85}
      .v11921-fields{display:grid;grid-template-columns:1fr 1fr 120px;gap:7px;align-items:end}.v11921-fields input{width:100%}.v11921-fields>div{padding:6px 8px;border-radius:9px;background:#f4f8f9}.v11921-fields>div b{display:block;font-size:9.5px;color:#17394a}.v11921-fields small{font-size:7px;color:#7d8f97}
      .v11921-use-manual{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:8.5px;color:#3f5864}.v11921-use-manual input{width:auto;min-height:auto}
      .v11921-guide-actions{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 16px;border-top:1px solid #e8eef0;background:#f8fbfc}.v11921-guide-actions b{display:block;font-size:9px}.v11921-guide-actions span{display:block;font-size:8px;color:#71848d;margin-top:2px}
      .v11921-q{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:10px;align-items:center;margin:8px 0 11px;padding:9px 11px;border:1px solid #dce7ea;border-radius:11px;background:#f8fbfc}.v11921-q span{display:block;font-size:7.5px;color:#74878f;text-transform:uppercase}.v11921-q b{display:block;margin-top:2px;font-size:11px}.v11921-q b.neg{color:#ac3942}.v11921-q i{font-style:normal;color:#82959d}
      .v11921-formula{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:9px;align-items:center;margin:10px 0}.v11921-formula.three{grid-template-columns:1fr auto 1fr auto 1fr auto 1fr}.v11921-formula>div{padding:10px;border:1px solid #e0e8eb;border-radius:10px;background:#fff}.v11921-formula span{display:block;font-size:8px;color:#74868e}.v11921-formula b{display:block;margin-top:3px;font-size:11px}.v11921-formula .result{background:#f4f8f9}.v11921-formula .neg{color:#ac3942}.v11921-formula i{font-style:normal;color:#7f929a}
      .v11921-comp-title{font-size:10px;margin:13px 0 7px}.v11921-costs{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.v11921-costs div{padding:9px;border:1px solid #e2eaed;border-radius:9px;background:#fff}.v11921-costs span{display:block;font-size:7.5px;color:#758890}.v11921-costs b{display:block;margin-top:3px;font-size:9px;color:#a63a42}
      .v11921-stock-note{margin-top:9px;padding:9px 10px;border-radius:10px;background:#f7fafb;border:1px solid #e0e9ec}.v11921-stock-note b{display:block;font-size:8.5px}.v11921-stock-note span{display:block;margin-top:3px;font-size:8.5px;color:#667a84}
      @media(max-width:1050px){.v11921-auto-grid{grid-template-columns:repeat(3,1fr)}.v11921-manual-list{grid-template-columns:1fr}}
      @media(max-width:650px){.v11921-guide-head,.v11921-guide-actions{display:block}.v11921-progress{text-align:left;margin-top:8px}.v11921-range{display:grid;grid-template-columns:1fr}.v11921-range input{width:100%}.v11921-fields{grid-template-columns:1fr}.v11921-auto-grid{grid-template-columns:1fr 1fr}.v11921-formula,.v11921-formula.three,.v11921-q,.v11921-costs{grid-template-columns:1fr}.v11921-formula i,.v11921-q i{display:none}.v11921-guide-actions .btn{width:100%;margin-top:8px}}
    `;
    document.head.appendChild(st);
  }

  function refreshAll(force=false){
    installEngine();
    insertGuide(force);
    updateDashboard();
    try{window.SPFinanceClarityV1199?.decorate?.()}catch(_){}
  }

  function boot(){
    injectStyles();interceptComposition();
    // Nasconde il pannello tecnico appena compare.
    const mo=new MutationObserver(()=>{ 
      const view=$('#adminFinanceV1170View');
      if(view?.classList.contains('active')){
        $$('[data-v11920-panel]',view).forEach(x=>x.style.display='none');
      }
    });
    if(document.body)mo.observe(document.body,{subtree:true,childList:true});
    [100,300,700,1400,2600].forEach(ms=>setTimeout(()=>refreshAll(ms>500),ms));
    setInterval(()=>{
      if($('#adminFinanceV1170View')?.classList.contains('active'))refreshAll(false);
    },1000);
    document.addEventListener('change',e=>{
      if(e.target?.id==='financePeriodV1170')setTimeout(()=>refreshAll(true),100);
    },true);
  }

  window.SPFinanceGuidedV11921={version:VERSION,derive,group,refresh:()=>refreshAll(true)};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();




/* ========================================================================
   V11.9.22 · FINANCIAL ANALYSIS CENTER
   Bilancio -> controllo qualità -> KPI -> confronto -> andamento -> previsione
   L'utente inserisce SOLO dati grezzi/mancanti; tutte le formule sono automatiche.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPFinanceAnalysisV11922)return;

  const VERSION='V11.9.22';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
  const pct=v=>`${new Intl.NumberFormat('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}).format(num(v))}%`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const CATS=[
    ['','Da classificare / ignora'],
    ['revenue','Ricavi / valore produzione'],
    ['materials','Materie / acquisti / rimanenze iniziali'],
    ['personnel','Personale'],
    ['energy','Energia / utenze produttive'],
    ['transport','Trasporti / spedizioni'],
    ['otherOpex','Altri costi operativi'],
    ['depreciation','Ammortamenti'],
    ['extraordinaryIncome','Proventi non operativi'],
    ['financialCharges','Oneri finanziari'],
    ['taxes','Imposte'],
    ['receivables','Crediti clienti'],
    ['payables','Debiti fornitori'],
    ['cash','Liquidità'],
    ['inventory','Rimanenze patrimoniali']
  ];

  function S(){try{return state}catch(_){return window.state||null}}
  function currentPeriod(){
    const p=$('#financePeriodV1170')?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
    return /^\d{4}-\d{2}$/.test(p)?p:'';
  }
  function record(company,p){
    return (S()?.adminFinanceV1170?.records||[]).find(x=>x.company===company&&x.period===p)||null;
  }
  function snapshots(company){
    return (S()?.financeSpringV1173?.snapshots||[])
      .filter(x=>x.company===company)
      .slice().sort((a,b)=>String(a.period).localeCompare(String(b.period)));
  }
  function snapshot(company,p){return snapshots(company).filter(x=>x.period===p).slice(-1)[0]||null}
  function previousSnapshot(company,p){
    return snapshots(company).filter(x=>x.period<p).slice(-1)[0]||null;
  }
  function previousPreviousSnapshot(company,p){
    const prev=previousSnapshot(company,p);if(!prev)return null;
    return snapshots(company).filter(x=>x.period<prev.period).slice(-1)[0]||null;
  }
  function firstSnapshot(company){return snapshots(company)[0]||null}
  function companyName(c){return c==='multiplast'?'Multiplast':'Smart Pack'}
  function keyOf(a){return String(a?.mapKey||(a?.partitario?`${a.code}|${a.partitario}`:a?.code||''))}
  function mapping(company){return S()?.financeSpringV1173?.mappings?.[company]||{}}
  function categoryOf(company,a){return mapping(company)[keyOf(a)]||a?.category||''}

  function rawAmount(a){
    if(Number.isFinite(Number(a?.signedAmount)))return Number(a.signedAmount);
    const d=num(a?.debit),c=num(a?.credit),sec=String(a?.section||'');
    if(d||c){
      if(sec==='revenue'||sec==='liability')return c-d;
      return d-c;
    }
    return num(a?.balance);
  }

  function coverage(company,p){
    const r=record(company,p)||{};
    if(r.analysisStart&&r.analysisEnd)return {start:r.analysisStart,end:r.analysisEnd,source:'confermato'};
    const s=snapshot(company,p);if(!s)return {start:'',end:'',source:'mancante'};
    const [y,m]=String(p).split('-').map(Number);
    const end=`${y}-${String(m).padStart(2,'0')}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`;
    if(s.mode==='annual')return {start:`${y}-01-01`,end:`${y}-12-31`,source:'rilevato'};
    if(s.mode==='cumulative')return {start:`${y}-01-01`,end,source:'rilevato'};
    return {start:`${y}-${String(m).padStart(2,'0')}-01`,end,source:'rilevato'};
  }

  function derive(company,p){
    return window.SPFinanceGuidedV11921?.derive?.(company,p) ||
      window.SPFinanceClarityV1199?.derived?.(company,p) || {configured:false};
  }
  function group(p){
    return window.SPFinanceGuidedV11921?.group?.(p) ||
      window.SPFinanceClarityV1199?.groupDerived?.(p) || {configured:false};
  }

  function unmapped(company,p){
    const s=snapshot(company,p);if(!s)return [];
    return (s.accounts||[])
      .filter(a=>!categoryOf(company,a))
      .filter(a=>Math.abs(rawAmount(a))>0.004)
      .map(a=>({...a,_company:company,_key:keyOf(a)}));
  }

  function manualInventoryMissing(company,p){
    const s=snapshot(company,p);if(!s)return false;
    const d=derive(company,p);
    const r=record(company,p)||{};
    const hasManual=!!r.inventoryManualEnabled;
    const autoOpen=Math.abs(num(d?.autoOpeningInventory))>0.004;
    const autoClose=Math.abs(num(d?.autoClosingInventory))>0.004;
    return !hasManual && !(autoOpen&&autoClose);
  }

  function quality(p){
    const companies=['smartpack','multiplast'].filter(c=>snapshot(c,p));
    const missingAccounts=companies.reduce((n,c)=>n+unmapped(c,p).length,0);
    const missingInventory=companies.filter(c=>manualInventoryMissing(c,p)).length;
    const missingCoverage=companies.filter(c=>{const x=coverage(c,p);return !x.start||!x.end}).length;
    const score=Math.max(0,100-missingAccounts*4-missingInventory*20-missingCoverage*15);
    const ready=companies.length>0 && missingAccounts===0 && missingInventory===0 && missingCoverage===0;
    return {companies,missingAccounts,missingInventory,missingCoverage,score,ready};
  }

  function commonPeriods(){
    const a=new Set(snapshots('smartpack').map(x=>x.period));
    const b=new Set(snapshots('multiplast').map(x=>x.period));
    const both=[...a].filter(x=>b.has(x)).sort();
    if(both.length)return both;
    return [...new Set([...a,...b])].sort();
  }

  function previousComparablePeriod(p){
    const ps=commonPeriods().filter(x=>x<p);
    if(!ps.length)return '';
    const prev=ps[ps.length-1];
    const currentSnaps=['smartpack','multiplast'].map(c=>snapshot(c,p)).filter(Boolean);
    const prevSnaps=['smartpack','multiplast'].map(c=>snapshot(c,prev)).filter(Boolean);

    // Periodi "month" sono confrontabili direttamente.
    if(currentSnaps.length && currentSnaps.every(x=>x.mode==='month') &&
       prevSnaps.length && prevSnaps.every(x=>x.mode==='month')) return prev;

    // Per progressivi, per confrontare due INTERVALLI servono almeno 3 snapshot:
    // baseline -> periodo precedente -> periodo corrente.
    if(currentSnaps.some(x=>x.mode==='cumulative')){
      const hasPriorInterval=['smartpack','multiplast']
        .filter(c=>snapshot(c,p))
        .every(c=>!!previousPreviousSnapshot(c,p));
      return hasPriorInterval?prev:'';
    }
    return prev;
  }

  function delta(curr,prev){
    if(prev==null||!Number.isFinite(Number(prev)))return null;
    const c=num(curr),v=num(prev);
    return {abs:c-v,pct:v?((c-v)/Math.abs(v))*100:null};
  }
  function deltaHtml(d,invert=false){
    if(!d)return '<span class="na">Baseline</span>';
    const good=invert?d.abs<=0:d.abs>=0;
    return `<span class="${good?'up':'down'}">${d.abs>=0?'+':''}${money(d.abs)}${d.pct==null?'':` · ${d.pct>=0?'+':''}${pct(d.pct)}`}</span>`;
  }

  function cumulativeRaw(company,p){
    const s=snapshot(company,p);if(!s)return null;
    const mp=mapping(company);
    const v={salesRevenue:0,materials:0,personnel:0,energy:0,transport:0,otherOpex:0,depreciation:0,otherOperatingRevenue:0,openingInventory:0,closingInventory:0};
    for(const a of (s.accounts||[])){
      const code=String(a.code||'').trim(),cat=mp[keyOf(a)]||a.category||'';
      const amount=rawAmount(a);
      const starts=x=>code===x||code.startsWith(x+'.');
      if(starts('70'))v.salesRevenue+=amount;
      else if(starts('71'))v.closingInventory+=amount;
      else if(starts('73'))v.otherOperatingRevenue+=amount;
      else if(starts('75'))v.openingInventory+=amount;
      else if(cat==='materials')v.materials+=amount;
      else if(cat==='personnel')v.personnel+=amount;
      else if(cat==='energy')v.energy+=amount;
      else if(cat==='transport')v.transport+=amount;
      else if(cat==='otherOpex')v.otherOpex+=amount;
      else if(cat==='depreciation')v.depreciation+=amount;
    }
    const r=record(company,p)||{};
    if(r.inventoryManualEnabled){
      v.openingInventory=num(r.inventoryOpeningManual);
      v.closingInventory=num(r.inventoryClosingManual);
    }
    // materials letto da categorie può includere 75 se mappato; per il run-rate
    // ricostruiamo il costo materie con rimanenze iniziali esplicite.
    const materialsWithoutOpening=Math.max(0,v.materials-v.openingInventory);
    v.materials=materialsWithoutOpening+v.openingInventory;
    v.productionValue=v.salesRevenue+v.closingInventory+v.otherOperatingRevenue;
    v.opex=v.materials+v.personnel+v.energy+v.transport+v.otherOpex;
    v.ebitda=v.productionValue-v.opex;
    v.ebit=v.ebitda-v.depreciation;
    return v;
  }

  function forecast(p){
    const [year,month]=String(p).split('-').map(Number);
    if(!year||!month)return null;
    const current=['smartpack','multiplast'].map(c=>snapshot(c,p)).filter(Boolean);
    if(!current.length)return null;
    if(current.every(x=>x.mode==='annual')||month>=12)return null;

    const cumulatives=current.filter(x=>x.mode==='cumulative');
    if(cumulatives.length){
      const xs=['smartpack','multiplast'].map(c=>cumulativeRaw(c,p)).filter(Boolean);
      if(!xs.length)return null;
      const sum=k=>xs.reduce((s,x)=>s+num(x[k]),0);
      const actual={
        salesRevenue:sum('salesRevenue'),
        productionValue:sum('productionValue'),
        opex:sum('opex'),
        ebitda:sum('ebitda'),
        depreciation:sum('depreciation'),
        ebit:sum('ebit')
      };
      const factor=12/month;
      const projected={};
      for(const k of Object.keys(actual))projected[k]=actual[k]*factor;
      const q=quality(p);
      const confidence=!q.ready?'Bassa':month>=6?'Alta':month>=3?'Media':'Bassa';
      return {year,month,factor,actual,projected,confidence,method:`Run-rate progressivo ${month}/12`};
    }

    // Bilanci mensili: media dei mesi caricati nello stesso esercizio.
    const periods=commonPeriods().filter(x=>String(x).startsWith(String(year)+'-')&&x<=p);
    const vals=periods.map(x=>group(x)).filter(x=>x.configured);
    if(!vals.length)return null;
    const avg=k=>vals.reduce((s,x)=>s+num(x[k]),0)/vals.length;
    const projected={
      salesRevenue:avg('salesRevenue')*12,
      productionValue:avg('productionValue')*12,
      opex:avg('opex')*12,
      ebitda:avg('ebitda')*12,
      ebit:avg('ebit')*12
    };
    return {year,month,actual:group(p),projected,confidence:vals.length>=6?'Alta':vals.length>=3?'Media':'Bassa',method:`Media run-rate su ${vals.length} periodo/i caricati`};
  }

  function trendStatus(metric,curr,prev){
    if(prev==null)return {cls:'neutral',label:'Baseline'};
    const d=num(curr)-num(prev);
    const invert=['materials','personnel','energy','transport','otherOpex','opex'].includes(metric);
    if(Math.abs(d)<0.01)return {cls:'neutral',label:'Stabile'};
    const good=invert?d<0:d>0;
    return {cls:good?'good':'risk',label:good?'Migliora':'Peggiora'};
  }

  function metricRows(p){
    const cur=group(p),pp=previousComparablePeriod(p),prev=pp?group(pp):null;
    const defs=[
      ['sales','Ricavi vendite',cur.salesRevenue,prev?.salesRevenue,false],
      ['production','Valore della produzione',cur.productionValue,prev?.productionValue,false],
      ['materials','Materie / acquisti',cur.materials,prev?.materials,true],
      ['personnel','Personale',cur.personnel,prev?.personnel,true],
      ['energy','Energia',cur.energy,prev?.energy,true],
      ['transport','Trasporti',cur.transport,prev?.transport,true],
      ['otherOpex','Altri costi operativi',cur.otherOpex,prev?.otherOpex,true],
      ['ebitda','EBITDA',cur.ebitda,prev?.ebitda,false],
      ['ebit','EBIT',cur.ebit,prev?.ebit,false],
      ['margin','Margine EBITDA',cur.marginProduction,prev?.marginProduction,false]
    ];
    return {pp,rows:defs.map(([key,label,value,pv,invert])=>({key,label,value,pv,invert,status:trendStatus(key,value,pv)}))};
  }

  function dataStatusHTML(p){
    const q=quality(p);
    if(!q.companies.length){
      return `<section class="v11922-empty"><b>Carica il primo bilancio</b><p>Il primo bilancio diventa la baseline. Dal secondo caricamento la piattaforma attiva confronto, andamento e previsione.</p><button class="btn primary" type="button" data-v11922-import>Carica bilancio</button></section>`;
    }
    return `
      <div class="v11922-status ${q.ready?'ready':'todo'}">
        <i></i>
        <div><b>${q.ready?'Analisi pronta':'Analisi da completare'}</b><span>${q.ready?'Tutti i dati necessari risultano disponibili.':`${q.missingAccounts} conto/i da classificare · ${q.missingInventory} rimanenze da confermare`}</span></div>
        <strong>${q.score}% completezza</strong>
      </div>`;
  }

  function periodHTML(p){
    const cards=['smartpack','multiplast'].filter(c=>snapshot(c,p)).map(c=>{
      const s=snapshot(c,p),cov=coverage(c,p),base=firstSnapshot(c),prev=previousSnapshot(c,p);
      const mode=s.mode==='annual'?'Bilancio annuale':s.mode==='cumulative'?'Progressivo YTD':'Periodo / mese';
      return `<article>
        <div><b>${companyName(c)}</b><span>${esc(s.fileName||'Bilancio importato')}</span></div>
        <dl>
          <dt>Copertura</dt><dd>${esc(cov.start)} → ${esc(cov.end)}</dd>
          <dt>Tipo</dt><dd>${mode}</dd>
          <dt>Baseline</dt><dd>${base?esc(base.period):'—'}</dd>
          <dt>Precedente</dt><dd>${prev?esc(prev.period):'Primo bilancio'}</dd>
        </dl>
      </article>`;
    }).join('');
    return `<section class="v11922-period">
      <div class="v11922-section-head"><div><span class="eyebrow">01 · PERIODO</span><h3>Bilancio analizzato</h3><p>La piattaforma identifica la copertura in base al tipo di bilancio e alla sequenza caricata.</p></div><button class="btn" type="button" data-v11922-import>Carica nuovo periodo</button></div>
      <div class="v11922-period-grid">${cards}</div>
    </section>`;
  }

  function missingHTML(p){
    const companies=['smartpack','multiplast'].filter(c=>snapshot(c,p));
    const missing=companies.flatMap(c=>unmapped(c,p));
    const inv=companies.filter(c=>manualInventoryMissing(c,p));
    if(!missing.length&&!inv.length)return `<section class="v11922-missing complete"><span class="eyebrow">02 · CONTROLLO DATI</span><div><b>Bilancio completo</b><p>Nessuna voce obbligatoria da integrare. I calcoli sono eseguiti automaticamente.</p></div></section>`;

    return `<section class="v11922-missing">
      <div class="v11922-section-head"><div><span class="eyebrow">02 · CONTROLLO DATI</span><h3>Completa solo i dati non riconosciuti</h3><p>Non devi fare calcoli: copia il valore dal bilancio o indica a quale categoria appartiene il conto.</p></div></div>
      ${inv.length?`<div class="v11922-raw-fields">
        ${inv.map(c=>{
          const d=derive(c,p),r=record(c,p)||{};
          return `<div class="v11922-raw-row">
            <div><b>${companyName(c)} · Rimanenze</b><span>Inserisci i valori esattamente come risultano dal bilancio.</span></div>
            <label><span>Rimanenze iniziali</span><input type="number" step="0.01" data-v11922-open="${c}" value="${r.inventoryManualEnabled?num(r.inventoryOpeningManual):''}" placeholder="€"></label>
            <label><span>Rimanenze finali</span><input type="number" step="0.01" data-v11922-close="${c}" value="${r.inventoryManualEnabled?num(r.inventoryClosingManual):''}" placeholder="€"></label>
          </div>`;
        }).join('')}
      </div>`:''}
      ${missing.length?`<div class="v11922-unmapped">
        <div class="v11922-unmapped-head"><b>${missing.length} conto/i da classificare</b><span>La descrizione e l'importo arrivano già dal bilancio; scegli soltanto la categoria.</span></div>
        ${missing.slice(0,80).map(a=>`<div class="v11922-unmapped-row">
          <div><b>${esc(companyName(a._company))} · ${esc(a.code||'—')}${a.partitario?` / ${esc(a.partitario)}`:''}</b><span>${esc(a.description||'')}</span></div>
          <strong>${money(rawAmount(a))}</strong>
          <select data-v11922-map-company="${a._company}" data-v11922-map-key="${esc(a._key)}">${CATS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>
        </div>`).join('')}
      </div>`:''}
      <div class="v11922-missing-actions"><span>La piattaforma ricalcola automaticamente tutti i KPI dopo il salvataggio.</span><button class="btn primary" type="button" data-v11922-save-missing>Salva dati e ricalcola</button></div>
    </section>`;
  }

  function kpiHTML(p){
    const d=group(p);if(!d.configured)return '';
    const q=quality(p);
    const kpis=[
      ['sales','Ricavi vendite',d.salesRevenue],
      ['production','Valore produzione',d.productionValue],
      ['ebitda','EBITDA',d.ebitda],
      ['ebit','EBIT',d.ebit],
      ['margin','Margine EBITDA',d.marginProduction]
    ];
    return `<section class="v11922-kpi">
      <div class="v11922-section-head"><div><span class="eyebrow">03 · KPI</span><h3>Risultati del periodo</h3><p>${q.ready?'Calcoli validati sui dati disponibili.':'Risultati preliminari: completa prima i dati evidenziati sopra.'}</p></div></div>
      <div class="v11922-kpi-grid">${kpis.map(([key,label,v])=>`<button type="button" class="v1199-target" data-v1199-metric="${key}" data-v1199-company="group" data-v1199-period="${p}">
        <span>${label}</span><b class="${num(v)<0?'neg':''}">${key==='margin'?pct(v):money(v)}</b><small>Apri analisi →</small>
      </button>`).join('')}</div>
      <div class="v11922-formula"><span>Valore produzione</span><b>${money(d.productionValue)}</b><i>−</i><span>Costi operativi</span><b>${money(d.opex)}</b><i>=</i><span>EBITDA</span><b class="${d.ebitda<0?'neg':''}">${money(d.ebitda)}</b></div>
    </section>`;
  }

  function trendHTML(p){
    const d=metricRows(p),cur=group(p);
    if(!cur.configured)return '';
    return `<section class="v11922-trend">
      <div class="v11922-section-head"><div><span class="eyebrow">04 · ANDAMENTO</span><h3>Analisi delle voci</h3><p>${d.pp?`Confronto con il periodo comparabile ${esc(d.pp)}.`:'Questo è il primo intervallo confrontabile. Dal prossimo bilancio avrai anche le variazioni percentuali.'}</p></div></div>
      <div class="v11922-table">
        <div class="v11922-tr th"><span>Voce</span><span>Periodo</span><span>Confronto</span><span>Andamento</span><span></span></div>
        ${d.rows.map(r=>`<div class="v11922-tr">
          <span><b>${esc(r.label)}</b></span>
          <span>${r.key==='margin'?pct(r.value):money(r.value)}</span>
          <span>${r.key==='margin'?(r.pv==null?'—':`${num(r.value)-num(r.pv)>=0?'+':''}${pct(num(r.value)-num(r.pv))}`):deltaHtml(delta(r.value,r.pv),r.invert)}</span>
          <span><em class="${r.status.cls}">${r.status.label}</em></span>
          <span><button class="link v1199-target" type="button" data-v1199-metric="${r.key}" data-v1199-company="group" data-v1199-period="${p}">Analizza →</button></span>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function forecastHTML(p){
    const f=forecast(p);
    if(!f)return `<section class="v11922-forecast muted"><div class="v11922-section-head"><div><span class="eyebrow">05 · PREVISIONE</span><h3>Previsione fine esercizio</h3><p>Servono dati infrannuali sufficienti per produrre una stima attendibile.</p></div></div></section>`;
    const x=f.projected;
    return `<section class="v11922-forecast">
      <div class="v11922-section-head"><div><span class="eyebrow">05 · PREVISIONE</span><h3>Stima chiusura ${f.year}</h3><p>${esc(f.method)}. È una previsione gestionale automatica, non un budget.</p></div><span class="v11922-confidence">Affidabilità ${f.confidence}</span></div>
      <div class="v11922-forecast-grid">
        <div><span>Ricavi stimati</span><b>${money(x.salesRevenue)}</b></div>
        <div><span>Valore produzione stimato</span><b>${money(x.productionValue)}</b></div>
        <div><span>EBITDA stimato</span><b class="${x.ebitda<0?'neg':''}">${money(x.ebitda)}</b></div>
        <div><span>EBIT stimato</span><b class="${x.ebit<0?'neg':''}">${money(x.ebit)}</b></div>
      </div>
      <div class="v11922-forecast-note">La stima proietta il ritmo osservato fino al periodo caricato. Se cambiano prezzi, volumi, costi o stagionalità, il risultato reale può differire.</div>
    </section>`;
  }

  function historyHTML(p){
    const periods=commonPeriods().slice().reverse();
    if(!periods.length)return '';
    return `<section class="v11922-history">
      <div class="v11922-section-head"><div><span class="eyebrow">STORICO</span><h3>Bilanci caricati</h3><p>Il primo periodo è la baseline; ogni nuovo bilancio aggiorna automaticamente analisi e previsione.</p></div></div>
      <div class="v11922-history-list">${periods.slice(0,12).map((x,i)=>{
        const g=group(x),isBase=x===periods[periods.length-1],active=x===p;
        return `<button type="button" data-v11922-period="${x}" class="${active?'active':''}"><span>${esc(x)}${isBase?' · BASELINE':''}</span><b>${g.configured?`EBITDA ${money(g.ebitda)}`:'Dati da completare'}</b></button>`;
      }).join('')}</div>
    </section>`;
  }

  function centerHTML(p){
    return `<section class="v11922-center" data-v11922-center>
      <div class="v11922-center-head">
        <div><span class="eyebrow">ANALISI FINANZIARIA GUIDATA</span><h2>Dal bilancio all'analisi, automaticamente</h2><p>Carica il bilancio. NOMYRA legge le voci, controlla i dati, calcola KPI, confronta i periodi e aggiorna la previsione.</p></div>
        ${dataStatusHTML(p)}
      </div>
      ${periodHTML(p)}
      ${missingHTML(p)}
      ${kpiHTML(p)}
      ${trendHTML(p)}
      ${forecastHTML(p)}
      ${historyHTML(p)}
    </section>`;
  }

  async function saveMissing(p){
    const s=S();if(!s)return;
    s.financeSpringV1173=s.financeSpringV1173||{};
    s.financeSpringV1173.mappings=s.financeSpringV1173.mappings||{smartpack:{},multiplast:{}};
    for(const sel of $$('[data-v11922-map-company]')){
      const c=sel.dataset.v11922MapCompany,k=sel.dataset.v11922MapKey,v=sel.value||'';
      s.financeSpringV1173.mappings[c]=s.financeSpringV1173.mappings[c]||{};
      s.financeSpringV1173.mappings[c][k]=v;
    }
    for(const c of ['smartpack','multiplast']){
      const r=record(c,p);if(!r)continue;
      const oi=$(`[data-v11922-open="${c}"]`),ci=$(`[data-v11922-close="${c}"]`);
      if(oi||ci){
        r.inventoryOpeningManual=num(oi?.value);
        r.inventoryClosingManual=num(ci?.value);
        r.inventoryManualEnabled=true;
        r.inventoryManualUpdatedAt=new Date().toISOString();
      }
    }
    try{window.SPSpringBalanceV1173?.rebuildFromSnapshots?.('smartpack')}catch(_){}
    try{window.SPSpringBalanceV1173?.rebuildFromSnapshots?.('multiplast')}catch(_){}
    try{if(typeof save==='function')save()}catch(_){}
    try{await window.SPFinanceCloudV1179?.save?.(p)}catch(_){}
    render(true);
  }

  function patchImporter(){
    const api=window.SPSpringBalanceV1173;if(!api||api.__v11922)return;
    const old=api.openImport;
    api.openImport=function(){
      const r=old.apply(this,arguments);
      setTimeout(()=>{
        const company=$('#springCompanyV1173')?.value||'smartpack';
        const first=snapshots(company).length===0;
        const base=$('#springBaselineV1173');if(base)base.checked=first;
        const mode=$('#springModeV1173');
        const label=mode?.closest('label');
        if(label){
          const span=label.querySelector('.v11922-mode-help')||document.createElement('small');
          span.className='v11922-mode-help';
          span.textContent='Progressivo = dall’inizio esercizio alla data indicata · Mese = solo quel mese · Annuale = esercizio completo.';
          if(!span.parentNode)label.appendChild(span);
        }
        const baseLabel=base?.closest('label');
        if(baseLabel){
          const b=baseLabel.querySelector('b');if(b)b.textContent='Primo bilancio / baseline';
          const sm=baseLabel.querySelector('small');if(sm)sm.textContent='Il primo bilancio è il punto di partenza per confronti e andamento. La piattaforma lo seleziona automaticamente.';
        }
      },80);
      return r;
    };
    api.__v11922=true;
  }

  function bind(root,p){
    $$('[data-v11922-import]',root).forEach(b=>b.onclick=()=>window.SPSpringBalanceV1173?.openImport?.());
    $('[data-v11922-save-missing]',root)?.addEventListener('click',()=>saveMissing(p));
    $$('[data-v11922-period]',root).forEach(b=>b.onclick=()=>{
      const x=b.dataset.v11922Period;
      const input=$('#financePeriodV1170');if(input)input.value=x;
      localStorage.setItem('poi_finance_period_v1179',x);sessionStorage.setItem('poi_finance_period_v1179',x);
      window.SPReleaseV1170?.renderFinance?.(x);
      setTimeout(()=>render(true),120);
    });
  }

  function hideLegacy(view){
    // Manteniamo i vecchi moduli come motore dati, ma non li mostriamo al cliente.
    $$('[data-v11920-panel],[data-v11921-guide],.v1179-forecast-wrap',view).forEach(x=>x.style.display='none');
    // La sezione storica legacy duplica lo storico nuovo.
    $$('[data-v1173-history]',view).forEach(x=>x.style.display='none');
  }

  function render(force=false){
    patchImporter();
    const view=$('#adminFinanceV1170View');if(!view?.classList.contains('active'))return;
    hideLegacy(view);
    const p=currentPeriod();if(!p)return;
    let old=$('[data-v11922-center]',view);
    if(old&&!force)return;
    const tmp=document.createElement('div');tmp.innerHTML=centerHTML(p);
    const center=tmp.firstElementChild;
    if(old)old.replaceWith(center);
    else{
      const hero=$('.v1170-fin-hero',view);
      const source=$('.v1173-source-banner',view);
      (source||hero)?.insertAdjacentElement('afterend',center);
    }
    bind(center,p);
  }

  function injectStyles(){
    if($('#v11922Styles'))return;
    const st=document.createElement('style');st.id='v11922Styles';
    st.textContent=`
      .v11922-center{margin:11px 0 18px;display:grid;gap:10px}
      .v11922-center>section,.v11922-center-head{border:1px solid #d9e5e9;border-radius:17px;background:#fff;box-shadow:0 6px 18px rgba(23,57,74,.035)}
      .v11922-center-head{padding:16px 17px;display:flex;justify-content:space-between;gap:18px;align-items:center;background:linear-gradient(135deg,#f7fbfc,#fff)}
      .v11922-center-head h2{margin:3px 0 4px;font-size:21px;color:#142f3b}.v11922-center-head p{margin:0;font-size:10.5px;color:#667c86}
      .v11922-status{display:flex;gap:9px;align-items:center;min-width:275px;padding:10px 12px;border-radius:12px}.v11922-status.ready{background:#edf8f3}.v11922-status.todo{background:#fff8e9}
      .v11922-status i{width:10px;height:10px;border-radius:50%}.v11922-status.ready i{background:#2c8a68}.v11922-status.todo i{background:#c68a28}
      .v11922-status div{flex:1}.v11922-status b{display:block;font-size:10px}.v11922-status span{display:block;font-size:8px;color:#657b84;margin-top:2px}.v11922-status strong{font-size:9px;white-space:nowrap}
      .v11922-section-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.v11922-section-head h3{margin:3px 0;font-size:15px}.v11922-section-head p{margin:0;font-size:9px;color:#6d818a}
      .v11922-period,.v11922-missing,.v11922-kpi,.v11922-trend,.v11922-forecast,.v11922-history{padding:14px 15px}
      .v11922-period-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.v11922-period article{padding:10px;border:1px solid #e1eaed;border-radius:11px;background:#f9fbfc}.v11922-period article>div b{font-size:10px}.v11922-period article>div span{display:block;font-size:8px;color:#788b93}.v11922-period dl{display:grid;grid-template-columns:80px 1fr;gap:4px 8px;margin:8px 0 0;font-size:8.5px}.v11922-period dt{color:#768992}.v11922-period dd{margin:0;font-weight:850;color:#294653}
      .v11922-missing.complete{display:flex;gap:13px;align-items:center;background:#f7fcf9}.v11922-missing.complete>div b{font-size:11px}.v11922-missing.complete p{margin:2px 0 0;font-size:9px;color:#687d86}
      .v11922-raw-fields{display:grid;gap:7px;margin-top:10px}.v11922-raw-row{display:grid;grid-template-columns:1fr 180px 180px;gap:9px;align-items:end;padding:10px;border:1px solid #ead8ad;background:#fffaf0;border-radius:11px}.v11922-raw-row>div b{display:block;font-size:10px}.v11922-raw-row>div span{display:block;font-size:8px;color:#778991}.v11922-raw-row label span{display:block;font-size:7.5px;font-weight:850;text-transform:uppercase;color:#72858d;margin-bottom:4px}.v11922-raw-row input{width:100%;min-height:34px;border:1px solid #d8e3e7;border-radius:8px;padding:7px 8px;font-size:9px}
      .v11922-unmapped{margin-top:9px;border:1px solid #e1e9ec;border-radius:11px;overflow:hidden}.v11922-unmapped-head{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;background:#f6f9fa}.v11922-unmapped-head b{font-size:9px}.v11922-unmapped-head span{font-size:8px;color:#748790}
      .v11922-unmapped-row{display:grid;grid-template-columns:1fr 120px 240px;gap:10px;align-items:center;padding:8px 10px;border-top:1px solid #edf2f3}.v11922-unmapped-row>div b{display:block;font-size:8.5px}.v11922-unmapped-row>div span{display:block;font-size:8px;color:#71858d;margin-top:2px}.v11922-unmapped-row strong{font-size:9px;text-align:right}.v11922-unmapped-row select{min-height:32px;border:1px solid #d9e4e7;border-radius:8px;background:#fff;padding:5px 7px;font-size:8.5px}
      .v11922-missing-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:9px}.v11922-missing-actions span{font-size:8px;color:#6f838b}
      .v11922-kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:10px}.v11922-kpi-grid button{border:1px solid #dce7ea;border-radius:11px;background:#fff;padding:10px;text-align:left;cursor:pointer}.v11922-kpi-grid button:hover{border-color:#99bbc8}.v11922-kpi-grid span{display:block;font-size:8px;color:#71858e}.v11922-kpi-grid b{display:block;margin-top:4px;font-size:16px;color:#142f3b}.v11922-kpi-grid b.neg{color:#af3942}.v11922-kpi-grid small{display:block;margin-top:5px;font-size:7.5px;color:#087cb5;font-weight:850}
      .v11922-formula{display:flex;gap:8px;align-items:center;margin-top:8px;padding:8px 10px;border-radius:10px;background:#f7fafb;font-size:8.5px}.v11922-formula span{color:#71858e}.v11922-formula b{color:#17394a}.v11922-formula b.neg{color:#ad3942}.v11922-formula i{font-style:normal;color:#82959d}
      .v11922-table{margin-top:10px;border:1px solid #e0e9ec;border-radius:11px;overflow:hidden}.v11922-tr{display:grid;grid-template-columns:1.4fr 1fr 1.2fr .8fr 80px;gap:9px;align-items:center;padding:8px 10px;border-top:1px solid #edf2f3;font-size:8.5px}.v11922-tr.th{border-top:0;background:#f6f9fa;font-size:7.5px;text-transform:uppercase;color:#748790;font-weight:850}.v11922-tr b{font-size:8.8px}.v11922-tr .up{color:#26755b;font-weight:850}.v11922-tr .down{color:#aa3d45;font-weight:850}.v11922-tr .na{color:#7d8f97}.v11922-tr em{font-style:normal;padding:4px 6px;border-radius:999px;font-size:7.5px;font-weight:850}.v11922-tr em.good{background:#eaf7f1;color:#247057}.v11922-tr em.risk{background:#fff0f1;color:#a13c44}.v11922-tr em.neutral{background:#edf3f5;color:#607680}.v11922-tr .link{border:0;background:transparent;color:#087cb5;font-size:8px;font-weight:900;cursor:pointer}
      .v11922-forecast-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.v11922-forecast-grid div{padding:10px;border:1px solid #dfe9ec;border-radius:10px;background:#f9fbfc}.v11922-forecast-grid span{display:block;font-size:8px;color:#72858e}.v11922-forecast-grid b{display:block;margin-top:4px;font-size:14px}.v11922-forecast-grid b.neg{color:#ad3942}.v11922-confidence{padding:6px 8px;border-radius:999px;background:#edf4f7;color:#315b6b;font-size:8px;font-weight:900}.v11922-forecast-note{margin-top:8px;font-size:8px;line-height:1.45;color:#6f828a}.v11922-forecast.muted{opacity:.75}
      .v11922-history-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.v11922-history-list button{border:1px solid #dce6ea;background:#fff;border-radius:9px;padding:7px 9px;text-align:left;cursor:pointer}.v11922-history-list button.active{border-color:#7ca9ba;background:#f2f8fa}.v11922-history-list span{display:block;font-size:8px;color:#748790}.v11922-history-list b{display:block;font-size:8.5px;margin-top:2px}
      .v11922-empty{padding:16px;border:1px dashed #cfdfe4!important;text-align:center}.v11922-empty b{font-size:13px}.v11922-empty p{font-size:9px;color:#71858e}
      .v11922-mode-help{display:block;margin-top:4px;font-size:8px;line-height:1.4;color:#73868e}
      @media(max-width:1100px){.v11922-kpi-grid{grid-template-columns:repeat(3,1fr)}.v11922-unmapped-row{grid-template-columns:1fr 100px 190px}.v11922-tr{grid-template-columns:1.2fr 1fr 1fr .7fr 70px}}
      @media(max-width:760px){.v11922-center-head,.v11922-section-head,.v11922-missing-actions{display:block}.v11922-status{margin-top:10px;min-width:0}.v11922-period-grid,.v11922-kpi-grid,.v11922-forecast-grid{grid-template-columns:1fr}.v11922-raw-row,.v11922-unmapped-row,.v11922-tr{grid-template-columns:1fr}.v11922-tr.th{display:none}.v11922-unmapped-row strong{text-align:left}.v11922-formula{flex-wrap:wrap}.v11922-section-head .btn,.v11922-missing-actions .btn{margin-top:8px;width:100%}}
    `;
    document.head.appendChild(st);
  }

  function boot(){
    injectStyles();patchImporter();
    const mo=new MutationObserver(()=>{
      const view=$('#adminFinanceV1170View');
      if(view?.classList.contains('active')){
        hideLegacy(view);
        if(!$('[data-v11922-center]',view))setTimeout(()=>render(false),20);
      }
    });
    if(document.body)mo.observe(document.body,{subtree:true,childList:true});
    [120,350,800,1600,2800].forEach(ms=>setTimeout(()=>render(ms>500),ms));
    setInterval(()=>{
      if($('#adminFinanceV1170View')?.classList.contains('active')){hideLegacy($('#adminFinanceV1170View'));render(false)}
    },1100);
    document.addEventListener('change',e=>{
      if(e.target?.id==='financePeriodV1170')setTimeout(()=>render(true),100);
    },true);
  }

  window.SPFinanceAnalysisV11922={version:VERSION,quality,forecast,render:()=>render(true)};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


/* ========================================================================
   V11.9.23 · NOMYRA FINANCE LIVE CONNECTOR
   SP-MP visualizza i dati ufficiali prodotti da NOMYRA Finance.
   Nessun KPI viene ricalcolato da SP-MP: valori e KPI arrivano dal backend Finance.
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPNomyraFinanceLiveV11923)return;
  const VERSION='V11.9.23';
  const FIN_URL='https://cktactfxjmatbkoosjvs.supabase.co';
  const FIN_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGFjdGZ4am1hdGJrb29zanZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDk4MDQsImV4cCI6MjEwNjI4NTgwNH0.osb4lKiLMAmPvZ4z-Zu8ry1HZD5Vk5RMBaZV6_I1t6Q';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const eur=v=>v==null||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v));
  const fmt=(v,u)=>v==null||!Number.isFinite(Number(v))?'—':u==='%'?`${new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(Number(v))}%`:u==='x'?`${new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(Number(v))}x`:u==='EUR'?eur(v):new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(Number(v));
  let client=null,booting=null;
  const cache={companies:[],docs:[],values:[],kpis:[],loaded:false,error:null};
  let financeCompanyId='',financePeriod='';

  function currentCompany(){return sessionStorage.getItem('nomyra_group_company_v92')||localStorage.getItem('nomyra_group_company_v92')||'';}
  function companyMatches(finName,sp){
    const a=norm(finName),b=norm(sp); if(!a||!b)return false;
    if(a.includes(b)||b.includes(a))return true;
    if(b.includes('smartpack'))return a.includes('smartpack');
    if(b.includes('multiplast'))return a.includes('multiplast');
    return false;
  }
  async function getClient(){
    if(client)return client;
    if(booting)return booting;
    booting=import('https://esm.sh/@supabase/supabase-js@2').then(({createClient})=>{
      client=createClient(FIN_URL,FIN_KEY,{auth:{storageKey:'spmp-nomyra-finance-v11923',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      return client;
    }).finally(()=>booting=null);
    return booting;
  }
  async function session(){const c=await getClient();return (await c.auth.getSession()).data.session||null;}
  async function load(){
    const c=await getClient(); const s=await session();
    if(!s){cache.loaded=false;cache.error=null;return false;}
    cache.error=null;
    try{
      const [cr,dr,vr,kr]=await Promise.all([
        c.from('companies').select('id,name').order('name'),
        c.from('financial_documents').select('id,company_id,period,document_name,document_type,coverage_score,recognized_key_values,expected_key_values,confirmed_values,missing_values,extraction_status,updated_at').order('period',{ascending:false}),
        c.from('financial_values').select('document_id,company_id,key,label,value,unit,method,confidence,is_confirmed'),
        c.from('financial_kpis').select('document_id,company_id,key,label,value,unit,formula,explanation,result_reading,status').order('label')
      ]);
      for(const r of [cr,dr,vr,kr])if(r.error)throw r.error;
      cache.companies=cr.data||[];cache.docs=dr.data||[];cache.values=vr.data||[];cache.kpis=kr.data||[];cache.loaded=true;
      chooseContext();return true;
    }catch(e){cache.error=e?.message||String(e);cache.loaded=false;return false;}
  }
  function chooseContext(){
    const sp=currentCompany();
    let company=cache.companies.find(c=>companyMatches(c.name,sp));
    if(!company&&financeCompanyId)company=cache.companies.find(c=>c.id===financeCompanyId);
    if(!company&&cache.companies.length===1)company=cache.companies[0];
    if(!company)company=cache.companies[0]||null;
    financeCompanyId=company?.id||'';
    const docs=cache.docs.filter(d=>d.company_id===financeCompanyId);
    const spPeriod=$('#financePeriodV1170')?.value||'';
    if(!docs.some(d=>String(d.period)===String(financePeriod))){
      const exact=docs.find(d=>String(d.period)===String(spPeriod));
      financePeriod=String(exact?.period||docs[0]?.period||'');
    }
  }
  function activeCompany(){return cache.companies.find(c=>c.id===financeCompanyId)||null;}
  function activeDoc(){return cache.docs.find(d=>d.company_id===financeCompanyId&&String(d.period)===String(financePeriod))||null;}
  function docValues(doc){const out={};if(!doc)return out;cache.values.filter(v=>v.document_id===doc.id).forEach(v=>out[v.key]=v);return out;}
  function docKpis(doc){return doc?cache.kpis.filter(k=>k.document_id===doc.id):[];}
  function kpiBy(kpis,label){const n=norm(label);return kpis.find(k=>norm(k.label)===n)||kpis.find(k=>norm(k.label).includes(n));}
  function metricCard(label,row){return `<article class="nf23-metric"><span>${esc(label)}</span><b>${row?fmt(row.value,row.unit):'—'}</b><small>${row?.status==='critical'?'Da verificare':row?.status==='warning'?'Attenzione':'NOMYRA Finance'}</small></article>`;}
  function selectCompany(){return `<select data-nf23-company>${cache.companies.map(c=>`<option value="${esc(c.id)}" ${c.id===financeCompanyId?'selected':''}>${esc(c.name)}</option>`).join('')}</select>`;}
  function selectPeriod(){const ds=cache.docs.filter(d=>d.company_id===financeCompanyId);return `<select data-nf23-period>${ds.map(d=>`<option value="${esc(d.period)}" ${String(d.period)===String(financePeriod)?'selected':''}>${esc(d.period)}</option>`).join('')}</select>`;}

  function connectedHTML(){
    const company=activeCompany(),doc=activeDoc(),vals=docValues(doc),kpis=docKpis(doc);
    if(!company)return `<section class="nf23-shell"><div class="nf23-empty"><b>Nessuna azienda disponibile in NOMYRA Finance</b><p>L'account collegato non ha aziende accessibili.</p></div></section>`;
    const core=[
      ['Ricavi',kpiBy(kpis,'Ricavi')||vals.revenue],
      ['Valore produzione',kpiBy(kpis,'Valore della produzione')||vals.productionValue],
      ['EBITDA',kpiBy(kpis,'EBITDA / MOL')||vals.ebitda],
      ['EBITDA margin',kpiBy(kpis,'EBITDA margin')],
      ['EBIT',kpiBy(kpis,'EBIT')||vals.ebit]
    ];
    const patr=[['Liquidità',vals.cash],['Crediti',vals.receivables],['Debiti fornitori',vals.payables],['Rimanenze',vals.inventory],['Debiti totali',vals.debt],['Patrimonio netto',vals.equity]];
    const quality=doc?`${Math.round(Number(doc.coverage_score||0))}%`:'—';
    const missing=Number(doc?.missing_values||0);
    const rows=kpis.filter(k=>!['Ricavi','Valore della produzione','EBITDA / MOL','EBITDA margin','EBIT'].includes(k.label)).slice(0,24);
    return `<section class="nf23-shell" data-nf23-shell>
      <header class="nf23-head"><div><span class="nf23-eyebrow">ECONOMICO-FINANZIARIO · NOMYRA FINANCE</span><h2>Dati finanziari ufficiali</h2><p>Questa sezione legge i risultati già elaborati da NOMYRA Finance. SP-MP non ricalcola KPI o valori di bilancio.</p></div><div class="nf23-sync"><i></i><div><b>Finance collegato</b><span>Sincronizzazione cloud attiva</span></div><button data-nf23-refresh>↻ Aggiorna</button></div></header>
      <section class="nf23-context"><label>Azienda${selectCompany()}</label><label>Periodo Finance${selectPeriod()}</label><div><span>Documento</span><b>${esc(doc?.document_name||'Nessun bilancio')}</b><small>${esc(doc?.document_type||'')}</small></div><div><span>Copertura dati</span><b>${quality}</b><small>${missing?`${missing} voci mancanti`:'Bilancio verificato'}</small></div></section>
      ${!doc?`<div class="nf23-empty"><b>Nessun bilancio per questo periodo</b><p>Carica o completa il bilancio in NOMYRA Finance; appena viene salvato comparirà automaticamente qui.</p></div>`:`
      <section class="nf23-block"><div class="nf23-title"><div><span>KPI PRINCIPALI</span><h3>Situazione economica</h3></div><small>Fonte: NOMYRA Finance</small></div><div class="nf23-core">${core.map(x=>metricCard(...x)).join('')}</div></section>
      <section class="nf23-block"><div class="nf23-title"><div><span>STATO PATRIMONIALE</span><h3>Equilibrio finanziario</h3></div></div><div class="nf23-patr">${patr.map(([l,r])=>`<div><span>${esc(l)}</span><b>${r?fmt(r.value,r.unit||'EUR'):'—'}</b></div>`).join('')}</div></section>
      <section class="nf23-block"><div class="nf23-title"><div><span>INDICATORI</span><h3>Analisi completa Finance</h3></div><small>${rows.length} indicatori disponibili</small></div><div class="nf23-table"><div class="nf23-tr th"><span>Indicatore</span><span>Valore</span><span>Lettura NOMYRA</span></div>${rows.map(k=>`<div class="nf23-tr"><div><b>${esc(k.label)}</b><small>${esc(k.formula||'')}</small></div><strong>${fmt(k.value,k.unit)}</strong><p>${esc(k.result_reading||k.explanation||'Dato elaborato da NOMYRA Finance.')}</p></div>`).join('')}</div></section>`}
      <footer class="nf23-foot"><span>Ultimo aggiornamento documento: ${doc?.updated_at?new Date(doc.updated_at).toLocaleString('it-IT'):'—'}</span><button data-nf23-disconnect>Disconnetti Finance</button></footer>
    </section>`;
  }
  function disconnectedHTML(){return `<section class="nf23-shell" data-nf23-shell><div class="nf23-connect"><div class="nf23-mark">NF</div><div><span class="nf23-eyebrow">NOMYRA FINANCE</span><h2>Collega i dati finanziari</h2><p>Accedi una sola volta a NOMYRA Finance. Da quel momento bilanci, KPI e indicatori Finance saranno visualizzati direttamente dentro SP-MP.</p><div class="nf23-note"><b>Nessuna duplicazione:</b> i calcoli restano in NOMYRA Finance; questa piattaforma li visualizza soltanto.</div></div><button class="btn primary" data-nf23-connect>Collega Finance</button></div></section>`;}
  function errorHTML(){return `<section class="nf23-shell" data-nf23-shell><div class="nf23-empty"><b>Collegamento Finance non disponibile</b><p>${esc(cache.error||'Errore di sincronizzazione')}</p><button class="btn" data-nf23-refresh>Riprova</button></div></section>`;}

  async function render(){
    const view=$('#adminFinanceV1170View');if(!view?.classList.contains('active'))return;
    $$('[data-v11922-center], [data-v11914-finance-banner], [data-v11915-finance-structural]',view).forEach(x=>x.style.display='none');
    let host=$('[data-nf23-host]',view);if(!host){host=document.createElement('div');host.dataset.nf23Host='1';const hero=$('.v1170-fin-hero',view);(hero||view.firstElementChild)?.insertAdjacentElement?.('afterend',host)||view.prepend(host);}
    const s=await session();
    if(s&&!cache.loaded&&!cache.error)await load();
    host.innerHTML=cache.error?errorHTML():(s?connectedHTML():disconnectedHTML());bind(host);
  }
  function bind(host){
    $('[data-nf23-connect]',host)?.addEventListener('click',openLogin);
    $('[data-nf23-refresh]',host)?.addEventListener('click',async e=>{e.currentTarget.disabled=true;cache.error=null;await load();await render();});
    $('[data-nf23-company]',host)?.addEventListener('change',e=>{financeCompanyId=e.target.value;financePeriod='';chooseContext();render();});
    $('[data-nf23-period]',host)?.addEventListener('change',e=>{financePeriod=e.target.value;render();});
    $('[data-nf23-disconnect]',host)?.addEventListener('click',async()=>{const c=await getClient();await c.auth.signOut();cache.loaded=false;cache.error=null;render();});
  }
  function ensureModal(){
    if($('#nf23Login'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="nf23-modal" id="nf23Login" aria-hidden="true"><div class="nf23-modal-card"><button class="nf23-x" data-nf23-close>×</button><span class="nf23-eyebrow">COLLEGAMENTO SICURO</span><h2>Accedi a NOMYRA Finance</h2><p>Usa l'account autorizzato in NOMYRA Finance. La sessione viene conservata nel browser e usata solo per leggere i dati a cui l'utente ha accesso.</p><label>Email<input type="email" data-nf23-email autocomplete="username"></label><label>Password<input type="password" data-nf23-password autocomplete="current-password"></label><div class="nf23-msg" data-nf23-msg></div><button class="btn primary" data-nf23-login>Collega account</button></div></div>`);
    $('[data-nf23-close]')?.addEventListener('click',closeLogin);
    $('[data-nf23-login]')?.addEventListener('click',login);
  }
  function openLogin(){ensureModal();$('#nf23Login').classList.add('open');$('#nf23Login').setAttribute('aria-hidden','false');}
  function closeLogin(){$('#nf23Login')?.classList.remove('open');$('#nf23Login')?.setAttribute('aria-hidden','true');}
  async function login(){
    const msg=$('[data-nf23-msg]'),btn=$('[data-nf23-login]');btn.disabled=true;msg.textContent='Connessione in corso…';
    try{const c=await getClient();const email=$('[data-nf23-email]').value.trim(),password=$('[data-nf23-password]').value;if(!email||!password)throw new Error('Inserisci email e password.');const {error}=await c.auth.signInWithPassword({email,password});if(error)throw error;await load();closeLogin();render();}
    catch(e){msg.textContent=e?.message||'Accesso non riuscito.';}finally{btn.disabled=false;}
  }
  function styles(){if($('#nf23Styles'))return;const st=document.createElement('style');st.id='nf23Styles';st.textContent=`
    .nf23-shell{margin:12px 0 18px;display:grid;gap:10px}.nf23-head,.nf23-block,.nf23-context,.nf23-connect,.nf23-empty{background:#fff;border:1px solid #d9e5e9;border-radius:17px;box-shadow:0 8px 24px rgba(23,57,74,.045)}
    .nf23-head{padding:17px 18px;display:flex;justify-content:space-between;gap:18px;align-items:center;background:linear-gradient(135deg,#f5fafb,#fff)}.nf23-eyebrow,.nf23-title span{font-size:7.5px;letter-spacing:.11em;font-weight:950;color:#a96d48}.nf23-head h2,.nf23-connect h2{margin:4px 0;font-size:22px;color:#142f3b}.nf23-head p,.nf23-connect p{margin:0;max-width:720px;font-size:10px;line-height:1.5;color:#657b84}
    .nf23-sync{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:12px;background:#edf8f3;min-width:265px}.nf23-sync i{width:9px;height:9px;border-radius:50%;background:#2c8a68}.nf23-sync div{flex:1}.nf23-sync b{display:block;font-size:9px}.nf23-sync span{font-size:7.5px;color:#647a82}.nf23-sync button,.nf23-foot button{border:0;background:transparent;color:#176c87;font-size:8px;font-weight:900;cursor:pointer}
    .nf23-context{padding:11px 13px;display:grid;grid-template-columns:1.1fr .8fr 1.2fr .8fr;gap:9px;align-items:end}.nf23-context label,.nf23-context>div{font-size:7.5px;font-weight:850;color:#748790}.nf23-context select{display:block;width:100%;margin-top:4px;min-height:34px;border:1px solid #d7e3e7;border-radius:9px;background:#fff;padding:6px 8px;font-size:9px;color:#294653}.nf23-context>div{padding:6px 8px}.nf23-context>div span{display:block}.nf23-context>div b{display:block;color:#203d49;font-size:9.5px;margin-top:3px}.nf23-context>div small{display:block;color:#748790;margin-top:2px}
    .nf23-block{padding:14px 15px}.nf23-title{display:flex;justify-content:space-between;gap:12px;align-items:flex-end}.nf23-title h3{margin:3px 0 0;font-size:14px}.nf23-title small{font-size:7.5px;color:#748790}.nf23-core{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:10px}.nf23-metric{padding:11px;border:1px solid #dde8eb;border-radius:11px;background:#fbfcfd}.nf23-metric span{display:block;font-size:8px;color:#71858e}.nf23-metric b{display:block;margin-top:4px;font-size:16px;color:#142f3b}.nf23-metric small{display:block;margin-top:4px;font-size:7.5px;color:#477685}
    .nf23-patr{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:10px}.nf23-patr div{padding:9px;border-radius:10px;background:#f7fafb;border:1px solid #e0e9ec}.nf23-patr span{display:block;font-size:7.5px;color:#748790}.nf23-patr b{display:block;font-size:11px;margin-top:4px;color:#294653}
    .nf23-table{margin-top:10px;border:1px solid #e0e9ec;border-radius:11px;overflow:hidden}.nf23-tr{display:grid;grid-template-columns:1.1fr 150px 1.6fr;gap:12px;align-items:center;padding:9px 10px;border-top:1px solid #edf2f3}.nf23-tr.th{border-top:0;background:#f6f9fa;font-size:7.5px;text-transform:uppercase;color:#748790;font-weight:900}.nf23-tr b{font-size:9px}.nf23-tr small{display:block;margin-top:2px;font-size:7px;color:#819198}.nf23-tr strong{font-size:10px;color:#183c4a}.nf23-tr p{margin:0;font-size:8px;line-height:1.4;color:#617781}
    .nf23-foot{display:flex;justify-content:space-between;padding:3px 5px;font-size:7.5px;color:#7d8f96}.nf23-connect{padding:24px;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center}.nf23-mark{width:52px;height:52px;border-radius:14px;background:#17394a;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:950}.nf23-note{margin-top:10px;padding:9px 10px;background:#f7fafb;border-radius:9px;font-size:8.5px;color:#657b84}.nf23-empty{padding:22px;text-align:center}.nf23-empty b{font-size:13px}.nf23-empty p{font-size:9px;color:#71858e;margin:5px 0 10px}
    .nf23-modal{position:fixed;inset:0;z-index:999999;background:rgba(13,30,38,.55);display:none;align-items:center;justify-content:center;padding:20px}.nf23-modal.open{display:flex}.nf23-modal-card{position:relative;width:min(480px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25)}.nf23-modal-card h2{margin:4px 0}.nf23-modal-card p{font-size:10px;color:#657b84;line-height:1.5}.nf23-modal-card label{display:block;margin-top:10px;font-size:8px;font-weight:850;color:#657b84}.nf23-modal-card input{display:block;width:100%;margin-top:4px;min-height:39px;border:1px solid #d5e2e6;border-radius:9px;padding:8px}.nf23-modal-card .btn{width:100%;margin-top:12px}.nf23-x{position:absolute;right:13px;top:11px;border:0;background:transparent;font-size:22px;cursor:pointer}.nf23-msg{min-height:18px;margin-top:8px;font-size:8.5px;color:#a24148}
    @media(max-width:1000px){.nf23-core{grid-template-columns:repeat(3,1fr)}.nf23-patr{grid-template-columns:repeat(3,1fr)}.nf23-context{grid-template-columns:1fr 1fr}.nf23-tr{grid-template-columns:1fr 120px 1.2fr}}
    @media(max-width:700px){.nf23-head,.nf23-connect{display:block}.nf23-sync{margin-top:12px;min-width:0}.nf23-mark{margin-bottom:10px}.nf23-connect .btn{width:100%;margin-top:12px}.nf23-context,.nf23-core,.nf23-patr,.nf23-tr{grid-template-columns:1fr}.nf23-tr.th{display:none}}
  `;document.head.appendChild(st);}
  async function boot(){styles();ensureModal();try{await getClient();}catch(e){cache.error=e?.message||String(e);}const mo=new MutationObserver(()=>{if($('#adminFinanceV1170View')?.classList.contains('active'))setTimeout(render,30);});if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});[250,800,1800].forEach(ms=>setTimeout(render,ms));document.addEventListener('change',e=>{if(e.target?.id==='financePeriodV1170')setTimeout(render,80)},true);}
  window.SPNomyraFinanceLiveV11923={version:VERSION,load,render,disconnect:async()=>{const c=await getClient();await c.auth.signOut();cache.loaded=false;render();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* ========================================================================
   NOMYRA / Smart Pack · Multiplast — V11.9.24 ROBERTO OPERATIONS CENTER
   Additive module. Does NOT replace or alter:
   - Coda Roberto
   - Magazzino interno
   - Ordini IML
   - Giacenze IML
   - Tracciabilità
   ======================================================================== */
(()=>{
  'use strict';
  if(window.SPRobertoOpsV11924)return;
  const VERSION='V11.9.24.1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n(v));
  const ROLE_KEYS=['poi_office_role_v113','poi_office_role_v115','industrialos_role_session','nomyra_group_role_v92'];
  const LOAD_KEY='spmp_v11924_truck_loads';
  const DISMISSED_ADMIN=['scadenze','compliance'];
  const PROTECTED=['coda roberto','magazzino interno','ordini iml','giacenze iml','tracciabil'];

  function role(){for(const k of ROLE_KEYS){const v=sessionStorage.getItem(k)||localStorage.getItem(k);if(v)return String(v).toLowerCase()}return ''}
  function isRoberto(){return role()==='manager'}
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}
  function clean(t){return String(t||'').replace(/\s+/g,' ').trim()}
  function text(el){return clean(el?.innerText||el?.textContent||'')}

  function findAction(label){
    const q=label.toLowerCase();
    const nodes=$$('button,a,[role="button"],[onclick]');
    // HOTFIX V11.9.24.1: never resolve an action to one of this module's own
    // buttons, otherwise clickExisting() recursively clicks itself.
    return nodes.find(el=>
      visible(el) &&
      !el.closest('[data-v11924-center]') &&
      !el.closest('#v11924TruckModal') &&
      text(el).toLowerCase().includes(q)
    );
  }
  function clickExisting(labels){
    for(const l of labels){const el=findAction(l);if(el){el.click();return true}}
    return false;
  }

  function hideAdminOnly(){
    if(!isRoberto())return;
    $$('nav a,nav button,aside a,aside button,[class*="menu"] a,[class*="menu"] button,[class*="nav"] a,[class*="nav"] button').forEach(el=>{
      const t=text(el).toLowerCase();
      if(PROTECTED.some(x=>t.includes(x)))return;
      if(DISMISSED_ADMIN.some(x=>t===x||t.startsWith(x+' ')||t.includes(' '+x))){el.dataset.v11924AdminHidden='1';el.style.display='none'}
    });
  }

  function getState(){try{return window.state||state||null}catch(_){return window.state||null}}
  function harvestArrays(obj,depth=0,path='root',seen=new WeakSet(),out=[]){
    if(!obj||typeof obj!=='object'||depth>5)return out;
    if(seen.has(obj))return out;seen.add(obj);
    if(Array.isArray(obj)){
      if(obj.length&&obj.some(x=>x&&typeof x==='object'))out.push({path,arr:obj});
      obj.slice(0,120).forEach((v,i)=>{if(v&&typeof v==='object')harvestArrays(v,depth+1,`${path}[${i}]`,seen,out)});
      return out;
    }
    Object.entries(obj).slice(0,180).forEach(([k,v])=>{if(v&&typeof v==='object')harvestArrays(v,depth+1,`${path}.${k}`,seen,out)});
    return out;
  }
  const pick=(o,names)=>{for(const k of names){if(o&&o[k]!=null&&o[k]!=='')return o[k]}return null};
  function normalizeOrder(o){
    if(!o||typeof o!=='object')return null;
    const client=pick(o,['cliente','client','customer','ragioneSociale','customerName','clientName']);
    const product=pick(o,['prodotto','product','articolo','article','item','descrizione','description','sku','codice']);
    const ordered=pick(o,['quantita','qty','quantity','ordinato','orderedQty','quantityOrdered','qtaOrdine','qta']);
    const produced=pick(o,['prodottoQty','produced','producedQty','quantitaProdotta','qtaProdotta','madeQty','completedQty']);
    const loaded=pick(o,['caricato','loaded','loadedQty','quantitaCaricata','qtaCaricata','shippedQty']);
    const status=pick(o,['stato','status','state']);
    const id=pick(o,['id','orderId','numero','number','ordine','orderNumber','codiceOrdine']);
    if(client==null&&product==null&&ordered==null&&produced==null)return null;
    const q=n(ordered),p=n(produced),l=n(loaded);
    if(!q&&!p&&!client&&!product)return null;
    return {id:String(id||''),client:String(client||'Cliente'),product:String(product||'Articolo'),ordered:q,produced:p,loaded:l,status:String(status||''),raw:o};
  }
  function liveOrders(){
    const s=getState();if(!s)return [];
    const candidates=harvestArrays(s).filter(x=>/order|ordin|coda|production|produzion|commess|delivery|consegn/i.test(x.path));
    const list=[];
    for(const c of candidates){for(const o of c.arr){const x=normalizeOrder(o);if(x)list.push(x)}}
    const uniq=new Map();
    list.forEach(o=>{const k=[o.id,o.client,o.product,o.ordered].join('|');const old=uniq.get(k);if(!old||o.produced>old.produced)uniq.set(k,o)});
    return [...uniq.values()].slice(0,12);
  }

  function productionSummary(){
    const os=liveOrders();
    const open=os.filter(o=>!o.ordered||o.produced<o.ordered);
    const ready=os.filter(o=>o.produced>o.loaded);
    const totalOrdered=os.reduce((a,o)=>a+o.ordered,0),totalProduced=os.reduce((a,o)=>a+o.produced,0);
    return {os,open,ready,totalOrdered,totalProduced};
  }

  function materialCoverage(){
    const s=getState();
    if(!s)return {label:'Da verificare',tone:'warn',detail:'Apri Magazzino interno per verificare disponibilità e fabbisogni.'};
    let stocks=[];
    for(const c of harvestArrays(s).filter(x=>/stock|magazz|material|materia|giacenz/i.test(x.path))){
      for(const x of c.arr){
        if(!x||typeof x!=='object')continue;
        const qty=n(pick(x,['qty','quantity','giacenza','stock','disponibile','available','kg','quantita']));
        const min=n(pick(x,['min','minimum','scortaMinima','minStock','safetyStock']));
        const name=pick(x,['name','nome','materiale','material','description','descrizione','articolo']);
        if(name!=null&&qty>=0)stocks.push({name:String(name),qty,min});
      }
    }
    if(!stocks.length)return {label:'Da verificare',tone:'warn',detail:'Apri Magazzino interno: la copertura viene letta dalle giacenze registrate.'};
    const critical=stocks.filter(x=>x.min>0&&x.qty<=x.min);
    if(critical.length)return {label:`${critical.length} materiale${critical.length>1?'i':''} critico${critical.length>1?'i':''}`,tone:'risk',detail:`Controllare: ${critical.slice(0,3).map(x=>x.name).join(', ')}.`};
    return {label:'Materiali disponibili',tone:'ok',detail:`${stocks.length} materiali letti dal magazzino. Nessuna giacenza sotto la scorta minima rilevata.`};
  }

  function loads(){try{return JSON.parse(localStorage.getItem(LOAD_KEY)||'[]')}catch(_){return []}}
  function saveLoads(x){localStorage.setItem(LOAD_KEY,JSON.stringify(x));window.dispatchEvent(new CustomEvent('spmp:truckloads:changed',{detail:x}))}
  function newLoad(){
    ensureTruckModal();
    const modal=$('#v11924TruckModal');
    const os=liveOrders();
    $('[data-v11924-truck-items]',modal).innerHTML=os.length?os.map((o,i)=>{
      const available=Math.max(0,o.produced-o.loaded);
      return `<div class="v11924-truck-row"><label><input type="checkbox" data-v11924-item-check="${i}" ${available>0?'checked':''}> <b>${esc(o.product)}</b><span>${esc(o.client)}</span></label><div><small>Prodotto</small><b>${fmt(o.produced)}</b></div><div><small>Già caricato</small><b>${fmt(o.loaded)}</b></div><label><small>Da caricare</small><input type="number" min="0" max="${available}" value="${available}" data-v11924-item-qty="${i}"></label></div>`;
    }).join(''):`<div class="v11924-truck-empty">Non riesco ancora a leggere automaticamente righe ordine disponibili. Puoi comunque creare il caricamento indicando cliente, destinazione e note; quando gli ordini live sono disponibili verranno proposti qui.</div>`;
    modal.dataset.orders=JSON.stringify(os.map(o=>({id:o.id,client:o.client,product:o.product,produced:o.produced,loaded:o.loaded,ordered:o.ordered})));
    modal.classList.add('open');
  }
  function ensureTruckModal(){
    if($('#v11924TruckModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="v11924-modal" id="v11924TruckModal"><div class="v11924-modal-card"><button class="v11924-x" data-v11924-truck-close>×</button><span class="v11924-kicker">LOGISTICA PRODUZIONE</span><h2>Crea caricamento camion</h2><p>Seleziona solo quantità già prodotte e disponibili. Il caricamento resta collegato allo stato operativo dell'ordine.</p><div class="v11924-truck-fields"><label>Cliente<input data-v11924-truck-client placeholder="Cliente"></label><label>Data carico<input type="date" data-v11924-truck-date></label><label>Destinazione<input data-v11924-truck-destination placeholder="Destinazione"></label><label>Targa / vettore<input data-v11924-truck-vehicle placeholder="Facoltativo"></label></div><div class="v11924-truck-items" data-v11924-truck-items></div><label class="v11924-notes">Note<textarea data-v11924-truck-notes rows="3" placeholder="Indicazioni per il carico"></textarea></label><div class="v11924-modal-actions"><button class="v11924-secondary" data-v11924-truck-close>Annulla</button><button class="v11924-primary" data-v11924-truck-save>Salva caricamento</button></div></div></div>`);
    $$('[data-v11924-truck-close]').forEach(b=>b.onclick=()=>$('#v11924TruckModal')?.classList.remove('open'));
    $('[data-v11924-truck-save]').onclick=()=>{
      const m=$('#v11924TruckModal'),os=JSON.parse(m.dataset.orders||'[]');
      const items=[];
      os.forEach((o,i)=>{const check=$(`[data-v11924-item-check="${i}"]`,m);if(!check?.checked)return;const qty=Math.max(0,n($(`[data-v11924-item-qty="${i}"]`,m)?.value));if(qty)items.push({...o,qty})});
      const item={id:`TRK-${Date.now()}`,createdAt:new Date().toISOString(),client:$('[data-v11924-truck-client]',m).value.trim(),date:$('[data-v11924-truck-date]',m).value,destination:$('[data-v11924-truck-destination]',m).value.trim(),vehicle:$('[data-v11924-truck-vehicle]',m).value.trim(),notes:$('[data-v11924-truck-notes]',m).value.trim(),items,status:'PREPARAZIONE'};
      const xs=loads();xs.unshift(item);saveLoads(xs);m.classList.remove('open');render(true);
    };
    const date=$('[data-v11924-truck-date]');if(date)date.value=new Date().toISOString().slice(0,10);
  }

  function openProductionSheet(){
    if(clickExisting(['crea foglio produzione','foglio produzione','nuovo foglio produzione']))return;
    const q=findAction('coda roberto');if(q){q.click();setTimeout(()=>clickExisting(['foglio produzione','crea foglio']),250);return}
    alert('Apri Coda Roberto e seleziona l’ordine da mandare in produzione.');
  }
  function openQueue(){clickExisting(['coda roberto'])}
  function openWarehouse(){clickExisting(['magazzino interno'])}

  function ordersHTML(os){
    if(!os.length)return `<div class="v11924-empty"><b>Ordini live</b><span>I dati restano nella Coda Roberto. Appena la produzione registra quantità sull’ordine, questa vista le riepiloga automaticamente.</span><button data-v11924-open-queue>Apri Coda Roberto</button></div>`;
    return `<div class="v11924-orders-head"><span>Ordine / articolo</span><span>Ordinato</span><span>Prodotto</span><span>Da produrre</span><span>Pronto carico</span><span>Avanzamento</span></div>${os.slice(0,7).map(o=>{const rem=Math.max(0,o.ordered-o.produced),ready=Math.max(0,o.produced-o.loaded),pc=o.ordered?Math.min(100,Math.round(o.produced/o.ordered*100)):0;return `<div class="v11924-order-row"><div><b>${esc(o.product)}</b><small>${esc(o.client)}${o.id?' · '+esc(o.id):''}</small></div><strong>${fmt(o.ordered)}</strong><strong>${fmt(o.produced)}</strong><strong class="${rem?'warn':'ok'}">${fmt(rem)}</strong><strong>${fmt(ready)}</strong><div class="v11924-progress"><i style="width:${pc}%"></i><span>${pc}%</span></div></div>`}).join('')}`;
  }

  function dashboardHTML(){
    const sm=productionSummary(),cov=materialCoverage(),ld=loads();
    const open=sm.open.length,ready=sm.ready.length;
    return `<section class="v11924-center" data-v11924-center>
      <div class="v11924-hero">
        <div><span class="v11924-kicker">MULTIPLAST · RESPONSABILE PRODUZIONE</span><h1>Centro operativo Roberto</h1><p>Ordini, produzione, materiali e carichi in una sola schermata. I moduli esistenti restano disponibili sotto.</p></div>
        <div class="v11924-hero-actions"><button class="v11924-primary" data-v11924-production-sheet>+ Crea foglio produzione</button><button class="v11924-dark" data-v11924-new-truck>+ Caricamento camion</button></div>
      </div>
      <div class="v11924-kpis">
        <article><span>ORDINI DA COMPLETARE</span><b>${open}</b><small>Aggiornati dalla produzione registrata</small></article>
        <article><span>PRONTI / PARZIALI AL CARICO</span><b>${ready}</b><small>Prodotto disponibile non ancora caricato</small></article>
        <article class="${cov.tone}"><span>COPERTURA MATERIALI</span><b>${esc(cov.label)}</b><small>${esc(cov.detail)}</small><button data-v11924-open-warehouse>Apri Magazzino interno</button></article>
        <article><span>CARICAMENTI APERTI</span><b>${ld.filter(x=>x.status!=='CHIUSO').length}</b><small>Preparazioni camion registrate</small></article>
      </div>
      <div class="v11924-live">
        <div class="v11924-section-title"><div><span>ORDINI LIVE</span><h2>Situazione ordini e produzione</h2><p>Ordinato → prodotto → residuo → disponibile al carico.</p></div><button data-v11924-open-queue>Apri Coda Roberto</button></div>
        <div class="v11924-orders">${ordersHTML(sm.os)}</div>
      </div>
      <div class="v11924-shortcuts">
        <div><span>ACCESSI RAPIDI</span><b>Le funzioni che Roberto usa ogni giorno</b></div>
        <button data-v11924-shortcut="coda roberto">Coda Roberto</button>
        <button data-v11924-shortcut="magazzino interno">Magazzino interno</button>
        <button data-v11924-shortcut="ordini iml">Ordini IML</button>
        <button data-v11924-shortcut="giacenze iml">Giacenze IML</button>
        <button data-v11924-shortcut="tracciabil">Tracciabilità</button>
      </div>
    </section>`;
  }

  function findHost(){
    const candidates=['main','.main-content','.content','#app .content','#app main','.app-content','.dashboard-content'];
    for(const s of candidates){const el=$(s);if(el&&visible(el)&&!el.closest('#poi113CompanyGate'))return el}
    const active=$$('.view.active,.page.active,[class*="view"].active').find(el=>visible(el)&&!el.closest('#poi113CompanyGate'));
    return active||null;
  }
  function isOperationalScreen(host){
    if(!host)return false;
    const t=text(host).toLowerCase();
    if(/accesso operativo|area uffici|accedi alla piattaforma/.test(t))return false;
    return /pressa|produzione|dashboard|coda roberto|pianificazione|multiplast/.test(t);
  }
  function render(force=false){
    hideAdminOnly();
    if(!isRoberto()){$$('[data-v11924-center]').forEach(x=>x.remove());return}
    const host=findHost();if(!isOperationalScreen(host))return;
    const old=$('[data-v11924-center]',host);
    if(old&&!force)return;
    const box=document.createElement('div');box.innerHTML=dashboardHTML();const node=box.firstElementChild;
    if(old)old.replaceWith(node);else host.prepend(node);
    $('[data-v11924-production-sheet]',node).onclick=openProductionSheet;
    $('[data-v11924-new-truck]',node).onclick=newLoad;
    $$('[data-v11924-open-queue]',node).forEach(b=>b.onclick=openQueue);
    $('[data-v11924-open-warehouse]',node).onclick=openWarehouse;
    $$('[data-v11924-shortcut]',node).forEach(b=>b.onclick=()=>clickExisting([b.dataset.v11924Shortcut]));
  }

  function styles(){if($('#v11924Styles'))return;const st=document.createElement('style');st.id='v11924Styles';st.textContent=`
    .v11924-center{display:grid;gap:14px;margin:0 0 22px;font-family:inherit;color:#132f3b}
    .v11924-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:20px 22px;border:1px solid #d7e4e8;border-radius:20px;background:linear-gradient(135deg,#f7fbfc,#fff);box-shadow:0 7px 24px rgba(20,53,68,.05)}
    .v11924-kicker{display:block;font-size:9px;font-weight:950;letter-spacing:.09em;color:#1475cf}.v11924-hero h1{margin:4px 0 4px;font-size:26px;line-height:1.15}.v11924-hero p{margin:0;color:#617984;font-size:12px;line-height:1.45}.v11924-hero-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.v11924-hero button,.v11924-section-title button,.v11924-shortcuts button,.v11924-empty button,.v11924-kpis button{min-height:44px;border-radius:12px;padding:10px 15px;font-size:12px;font-weight:900;cursor:pointer}.v11924-primary{border:0;background:#0b76d1;color:#fff}.v11924-dark{border:0;background:#17394a;color:#fff}
    .v11924-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.v11924-kpis article{min-height:126px;padding:16px;border:1px solid #dbe7ea;border-radius:16px;background:#fff}.v11924-kpis article>span{display:block;font-size:9px;font-weight:950;letter-spacing:.05em;color:#6d838d}.v11924-kpis article>b{display:block;margin-top:7px;font-size:27px}.v11924-kpis article>small{display:block;margin-top:6px;font-size:10px;line-height:1.4;color:#71858e}.v11924-kpis article.ok{border-color:#abdac8;background:#f7fcfa}.v11924-kpis article.warn{border-color:#ead69f;background:#fffaf0}.v11924-kpis article.risk{border-color:#e7b2b5;background:#fff7f7}.v11924-kpis article button{margin-top:8px;min-height:30px;padding:5px 8px;border:0;background:transparent;color:#0b76d1;font-size:10px}
    .v11924-live{border:1px solid #dbe7ea;border-radius:18px;background:#fff;overflow:hidden}.v11924-section-title{padding:16px 18px;display:flex;justify-content:space-between;gap:18px;align-items:center;border-bottom:1px solid #e6edef}.v11924-section-title span{font-size:9px;font-weight:950;letter-spacing:.07em;color:#1475cf}.v11924-section-title h2{margin:3px 0;font-size:19px}.v11924-section-title p{margin:0;color:#71858e;font-size:10px}.v11924-section-title button{border:1px solid #d2e0e5;background:#fff;color:#17394a;min-height:38px}
    .v11924-orders-head,.v11924-order-row{display:grid;grid-template-columns:minmax(220px,1.5fr) .65fr .65fr .65fr .75fr 1fr;gap:12px;align-items:center;padding:10px 18px}.v11924-orders-head{background:#f5f8f9;font-size:9px;font-weight:950;color:#6a8089}.v11924-order-row{border-top:1px solid #edf2f3;font-size:11px}.v11924-order-row>div:first-child b{display:block;font-size:11px}.v11924-order-row>div:first-child small{display:block;margin-top:3px;color:#758991;font-size:9px}.v11924-order-row strong{font-size:12px}.v11924-order-row strong.warn{color:#b96f17}.v11924-order-row strong.ok{color:#24725a}.v11924-progress{height:24px;background:#eef3f5;border-radius:999px;position:relative;overflow:hidden}.v11924-progress i{display:block;height:100%;background:#77bba4}.v11924-progress span{position:absolute;inset:0;display:grid;place-items:center;font-size:9px;font-weight:950}.v11924-empty{padding:20px;display:flex;align-items:center;gap:15px}.v11924-empty b{font-size:13px}.v11924-empty span{flex:1;font-size:10px;color:#71858e}.v11924-empty button{border:1px solid #d2e0e5;background:#fff;color:#17394a}
    .v11924-shortcuts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:13px 15px;border:1px solid #dbe7ea;border-radius:16px;background:#f9fbfc}.v11924-shortcuts>div{margin-right:auto}.v11924-shortcuts>div span{display:block;font-size:8px;font-weight:950;color:#1475cf}.v11924-shortcuts>div b{display:block;margin-top:2px;font-size:11px}.v11924-shortcuts button{min-height:36px;border:1px solid #d4e1e5;background:#fff;color:#17394a;padding:7px 10px;font-size:10px}
    .v11924-modal{position:fixed;inset:0;z-index:999999;background:rgba(13,30,38,.58);display:none;align-items:center;justify-content:center;padding:18px}.v11924-modal.open{display:flex}.v11924-modal-card{position:relative;width:min(1050px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 26px 80px rgba(0,0,0,.26)}.v11924-modal-card h2{font-size:24px;margin:4px 0}.v11924-modal-card>p{margin:0 0 14px;color:#687e87;font-size:11px}.v11924-x{position:absolute;right:15px;top:11px;border:0;background:transparent;font-size:26px;cursor:pointer}.v11924-truck-fields{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.v11924-truck-fields label,.v11924-notes{font-size:9px;font-weight:900;color:#627985}.v11924-truck-fields input,.v11924-notes textarea,.v11924-truck-row input[type=number]{display:block;width:100%;margin-top:5px;border:1px solid #d4e1e5;border-radius:9px;padding:9px;font:inherit}.v11924-truck-items{margin-top:14px;border:1px solid #dde8eb;border-radius:12px;overflow:hidden}.v11924-truck-row{display:grid;grid-template-columns:1.7fr .5fr .55fr .65fr;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #edf2f3}.v11924-truck-row:first-child{border-top:0}.v11924-truck-row label:first-child{display:grid;grid-template-columns:auto 1fr;gap:0 8px;align-items:center}.v11924-truck-row label:first-child input{grid-row:1/3}.v11924-truck-row label:first-child span{font-size:9px;color:#71858e}.v11924-truck-row small{display:block;font-size:8px;color:#71858e}.v11924-truck-empty{padding:18px;color:#71858e;font-size:10px}.v11924-notes{display:block;margin-top:12px}.v11924-modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.v11924-modal-actions button{min-height:42px;padding:9px 15px;border-radius:10px;font-weight:900;cursor:pointer}.v11924-secondary{background:#fff;border:1px solid #d4e1e5;color:#17394a}
    @media(max-width:1050px){.v11924-kpis{grid-template-columns:1fr 1fr}.v11924-orders-head{display:none}.v11924-order-row{grid-template-columns:1.5fr repeat(4,.7fr);}.v11924-order-row .v11924-progress{grid-column:1/-1}.v11924-truck-fields{grid-template-columns:1fr 1fr}}
    @media(max-width:720px){.v11924-hero{display:block}.v11924-hero-actions{margin-top:13px;justify-content:stretch}.v11924-hero-actions button{flex:1}.v11924-kpis{grid-template-columns:1fr}.v11924-order-row{grid-template-columns:1fr 1fr}.v11924-order-row>div:first-child{grid-column:1/-1}.v11924-section-title{align-items:flex-start}.v11924-truck-fields,.v11924-truck-row{grid-template-columns:1fr}.v11924-shortcuts{align-items:stretch}.v11924-shortcuts>div{width:100%}.v11924-shortcuts button{flex:1}}
  `;document.head.appendChild(st)}

  function boot(){
    styles();
    ensureTruckModal();
    let timer;
    const tick=()=>{clearTimeout(timer);timer=setTimeout(()=>render(false),180)};
    // HOTFIX V11.9.24.1: observe only structural DOM changes. Watching style/class
    // attributes created a feedback loop with our own rendering/hide operations.
    const mo=new MutationObserver(tick);
    mo.observe(document.documentElement,{subtree:true,childList:true});
    document.addEventListener('click',()=>setTimeout(()=>render(false),120),true);
    window.addEventListener('spmp:truckloads:changed',()=>render(true));
    [350,1000,2200].forEach(ms=>setTimeout(()=>render(false),ms));
    // Lightweight refresh only; do not continuously rebuild the whole dashboard.
    setInterval(()=>{
      if(!isRoberto())return;
      const center=$('[data-v11924-center]');
      if(!center){render(false);return;}
      try{
        const sm=productionSummary();
        const orders=$('.v11924-orders',center);
        if(orders)orders.innerHTML=ordersHTML(sm.os);
        $$('[data-v11924-open-queue]',center).forEach(b=>b.onclick=openQueue);
      }catch(e){console.warn('[V11.9.24.1] refresh Roberto',e)}
    },20000);
  }
  window.SPRobertoOpsV11924={version:VERSION,render,newTruckLoad:newLoad,orders:liveOrders,loads};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

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
  const activationMode=new URL(location.href).searchParams.get('attiva')==='account';

  let selectedCompany=sessionStorage.getItem(COMPANY_KEY)||'';
  let officeUnlockedFlag=false;
  let manageCompany='smartpack';
  let recoveryCompany='smartpack';
  let directory=[];
  let pendingEntry=null;
  let pinChangeMode={forced:false,currentPin:''};
  let employee=null;
  try{employee=JSON.parse(sessionStorage.getItem(EMPLOYEE_KEY)||'null')}catch(_){employee=null}

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
        .poi116-office-login form{grid-template-columns:1fr}
        .poi116-office-login .poi116-office-error{grid-column:1}
      }

      @media(max-width:760px){.poi113-company-grid,.poi113-admin-grid,.poi113-form-grid,.poi115-production-grid,.poi115-office-grid{grid-template-columns:1fr}.poi113-form-grid .full{grid-column:auto}.poi113-card{padding:16px}.poi113-overlay{padding:10px}.poi113-employee,.poi113-request{grid-template-columns:1fr}.poi113-row-actions{justify-content:flex-start}.poi113-request select{min-width:100%;max-width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    injectStyles();
    if(!$('#poi113CompanyGate'))document.body.insertAdjacentHTML('beforeend',`
      <div class="poi113-overlay" id="poi113CompanyGate"><section class="poi113-card">
        <div class="poi113-head"><div class="poi113-logo">SP·MP</div><div class="grow"><h2>Seleziona l’azienda</h2><p>Entra nell’ambiente di lavoro e poi usa il tuo USER e PIN personale.</p></div><button class="poi113-close" id="poi113CompanyLogout" type="button">Esci</button></div>
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
  function corporateLogout(){
    closeOverlays();
    sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);sessionStorage.removeItem(OFFICE_ROLE_KEY);officeUnlockedFlag=false;
    employee=null;selectedCompany='';
    $('#poiCloudLogout')?.click();
  }

  const officeUnlocked=()=>officeUnlockedFlag===true; // solo dopo verifica password esplicita in questa sessione UI
  const expectedProductionRole=company=>company==='multiplast'?'mpworker':'worker';

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
      selectedCompany='';
      showOfficeMenu();
      return false;
    }
    showProductionHome();return false;
  }

  function showProductionHome(){
    ensureUI();if(!profile())return;
    closeOverlays();hideLegacyProfileGate();
    officeUnlockedFlag=false;employee=null;pendingEntry=null;
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
    $('.poi113-head h2',gate).textContent='Area uffici';
    $('.poi113-head p',gate).textContent='Scegli la funzione di lavoro autorizzata per questo account.';
    $('.poi113-logo',gate).textContent='UFF';
    $('#poi113CompanyLogout').style.display='inline-flex';$('#poi113CompanyLogout').textContent='Blocca';
    $('#poi113CompanyLogout').onclick=()=>{officeUnlockedFlag=false;sessionStorage.removeItem(OFFICE_ROLE_KEY);showProductionHome()};

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
          <div class="poi115-lock-note">Premi <b>Blocca</b> per chiudere la sessione uffici e tornare alla postazione Produzione. La password sarà richiesta nuovamente al prossimo accesso.</div>
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

  async function openOfficeLogin(){
    ensureUI();hideLegacyProfileGate();

    // Nessuna schermata intermedia: il login uffici compare direttamente nella HOME.
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
      <div class="poi116-office-head"><span>Accesso uffici / amministrazione</span></div>
      <div class="poi116-office-login">
        <form id="poi116OfficeInlineForm" autocomplete="off">
          <label>E-mail aziendale
            <input name="email" type="email" required autocomplete="username" placeholder="nome@azienda.it">
          </label>
          <label>Password
            <input name="password" type="password" required autocomplete="current-password" placeholder="Password">
          </label>
          <button class="poi116-office-submit" type="submit">Accedi</button>
          <button class="poi116-office-cancel" type="button" onclick="POIV113.cancelOfficeLogin()">Annulla</button>
          <div class="poi116-office-error" id="poi116OfficeInlineError"></div>
        </form>
      </div>`;

    const form=$('#poi116OfficeInlineForm');
    try{
      const {data}=await client().auth.getUser();
      if(data?.user?.email)form.elements.email.value=data.user.email;
    }catch(_){}

    setTimeout(()=>form?.elements?.password?.focus(),60);

    form.onsubmit=async e=>{
      e.preventDefault();
      const err=$('#poi116OfficeInlineError');
      const btn=form.querySelector('.poi116-office-submit');
      const email=String(form.elements.email.value||'').trim().toLowerCase();
      const password=String(form.elements.password.value||'');

      err.classList.remove('show');
      err.textContent='';
      btn.disabled=true;
      btn.textContent='Verifica…';

      try{
        const sb=client();
        if(!sb)throw new Error('Connessione cloud non disponibile.');
        const {error}=await sb.auth.signInWithPassword({email,password});
        if(error)throw error;

        officeUnlockedFlag=true;
        sessionStorage.removeItem(EMPLOYEE_KEY);
        employee=null;
        showOfficeMenu();
      }catch(error){
        officeUnlockedFlag=false;
        err.textContent='E-mail o password non corretti.';
        err.classList.add('show');
        form.elements.password.value='';
        form.elements.password.focus();
      }finally{
        btn.disabled=false;
        btn.textContent='Accedi';
      }
    };
  }

  function enterOfficeRole(role){
    if(!officeUnlocked()||!['director','manager','admin'].includes(role)){openOfficeLogin();return}
    const company=role==='manager'?'multiplast':'smartpack';
    selectedCompany=company;
    sessionStorage.setItem(COMPANY_KEY,company);
    sessionStorage.setItem(OFFICE_ROLE_KEY,role);
    sessionStorage.setItem('nomyra_group_company_v92',company);
    sessionStorage.setItem('nomyra_group_role_v92',role);
    sessionStorage.setItem('industrialos_role_session',role);
    closeOverlays();enterRole(role,false);hideLegacyProfileGate();
  }

  function decorateAuth(){
    const auth=$('#poiCloudAuth');
    if(!auth)return;
    const title=$('#poiCloudAuth h2');if(title)title.textContent=activationMode?'Attivazione account autorizzato':'Accesso aziendale';
    const brandText=$('#poiCloudAuth .poi-cloud-auth-brand p');if(brandText)brandText.textContent='Smart Pack + Multiplast';
    const intro=$('#poiCloudAuth .poi-cloud-auth-card>p');if(intro)intro.textContent=activationMode?'Area riservata alla prima attivazione di un account già autorizzato.':'Inserisci l’e-mail dell’account base e la password.';
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
    const foot=$('.poi-cloud-auth-foot');if(foot)foot.textContent=activationMode?'Sono accettati esclusivamente gli indirizzi già autorizzati da NOMYRA.':'Gli operai non inseriscono l’e-mail: accedono dopo la scelta dell’azienda con USER e PIN personale.';
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

  function bindPasswordRecovery(){
    const sb=client();if(!sb||sb.__poi113RecoveryBound)return;sb.__poi113RecoveryBound=true;
    sb.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_IN'&&activationMode){setTimeout(()=>location.replace(location.origin+location.pathname),500);return}
      if(event==='SIGNED_IN'&&!activationMode){
        // IMPORTANTE: una sessione account già valida NON autorizza automaticamente l'area uffici.
        // L'area uffici viene sbloccata solo da openOfficeLogin() dopo una nuova password corretta.
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
      logout.addEventListener('click',()=>{closeOverlays();sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);employee=null;selectedCompany=''},true);
    }
  }

  function showCompanyMenu(){
    ensureUI();hideLegacyProfileGate();
    if(!profile())return;
    if(employee&&selectedCompany&&companies().includes(selectedCompany)){enterRole(employee.role_code,true);return}
    if(isPlatform()){openNomyra();return}
    if(officeUnlocked()){showOfficeMenu();return}
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
    sessionStorage.setItem('nomyra_group_company_v92',selectedCompany);
    sessionStorage.setItem('nomyra_group_role_v92',employee.role_code);
    sessionStorage.setItem('industrialos_role_session',employee.role_code);
    closeOverlays();decorateCloudMenu();enterRole(employee.role_code,true);
  }

  function enterRole(role,asEmployee=false){
    if(!asEmployee){employee=null;sessionStorage.removeItem(EMPLOYEE_KEY)}
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
    employee=null;pendingEntry=null;sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem('industrialos_role_session');decorateCloudMenu();showProductionHome();
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
      if(!officeUnlocked()){sessionStorage.removeItem('industrialos_role_session');sessionStorage.removeItem(OFFICE_ROLE_KEY);showProductionHome();return}
      showOfficeMenu();
    },950);
  }

  const publicApi={
    showCompanyMenu,selectCompany,showProductionHome,openProductionLogin,openOfficeLogin,cancelOfficeLogin:resetOfficeInlineLogin,showOfficeMenu,enterOfficeRole,
    openNomyra,openRecoveryAdmin,setManageCompany,setRecoveryCompany,
    openRecoveryRequest,resetPin,toggleEmployee,resolveRecovery,dismissRecovery,openPinChange
  };
  window.POIV113=publicApi;
  window.POIV112=publicApi;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

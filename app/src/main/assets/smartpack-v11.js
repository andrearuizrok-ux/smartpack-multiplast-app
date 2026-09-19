
/* ===== migrated from v105-patch.js ===== */
/* SPMP V10.5 — UX Roberto + mobile order form + accesso diretto Gestione Smart Pack */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function injectStyles(){
    if(byId('sp105Styles')) return;
    var st=document.createElement('style');
    st.id='sp105Styles';
    st.textContent=`
      .sp105-director-comms{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 16px;padding:18px 20px;border:1px solid #b8d5df;border-radius:18px;background:linear-gradient(135deg,#f3fbfd,#e8f5f8);box-shadow:0 8px 24px rgba(31,94,120,.08)}
      .sp105-director-comms-main{display:flex;align-items:center;gap:13px;min-width:0}.sp105-director-comms-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#1f5e78;color:white;font-size:22px;flex:0 0 auto}.sp105-director-comms h3{margin:0 0 4px;font-size:16px}.sp105-director-comms p{margin:0;color:var(--muted);font-size:10px;line-height:1.45}.sp105-comms-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.sp105-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:white;border:1px solid var(--line);font-size:9px;font-weight:900;color:var(--primary)}
      .sp105-send-message{min-height:48px;padding:0 18px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap;box-shadow:0 6px 16px rgba(31,94,120,.15)}
      .sp105-no-password-note{display:inline-flex;align-items:center;gap:5px;margin-top:10px;font-size:9px;font-weight:800;color:#26755f}
      @media(max-width:900px){
        .sp105-director-comms{display:block;padding:15px}.sp105-send-message{width:100%;margin-top:13px;white-space:normal}
        #orderDialog{width:96vw!important;max-width:96vw!important;margin:auto!important}
        #orderDialog .modal-body{padding-left:14px!important;padding-right:14px!important}
        #orderDialog .form-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important}
        #orderDialog .form-grid>.field,#orderDialog .form-grid>.field.full{grid-column:1!important;width:100%!important;min-width:0!important}
        #orderDialog input,#orderDialog select,#orderDialog textarea{width:100%!important;min-width:0!important;box-sizing:border-box!important;font-size:16px!important}
        #orderDialog .modal-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;padding:12px 14px!important}
        #orderDialog .modal-actions .btn{width:100%!important;min-height:46px!important}
      }
    `;
    document.head.appendChild(st);
  }
  function enterDirectorDirect(){
    try{sessionStorage.setItem('industrialos_director_authenticated','1');sessionStorage.setItem('nomyra_group_director_authenticated','1');}catch(_){ }
    if(typeof window.enterSmartPack==='function') window.enterSmartPack('director');
    else if(typeof window.setRole==='function') window.setRole('director');
  }
  function patchDirectorAccess(){
    var auth=byId('directorAuth'); if(auth) auth.style.display='none';
    var buttons=[]; var v92=byId('v92Director'); if(v92) buttons.push(v92);
    var legacy=document.querySelector('[data-enter-role="director"]'); if(legacy&&buttons.indexOf(legacy)<0) buttons.push(legacy);
    buttons.forEach(function(b){
      b.classList.remove('locked'); b.onclick=function(e){e.preventDefault();enterDirectorDirect();};
      var pill=b.querySelector('.security-pill'); if(pill) pill.remove();
      var note=b.querySelector('.lock-note'); if(note){note.className='sp105-no-password-note';note.textContent='Accesso diretto temporaneo';}
    });
  }
  function messageStats(){
    var list=(window.state&&Array.isArray(window.state.directorMessages))?window.state.directorMessages:[];
    var active=list.filter(function(m){return m.active!==false;});
    var pending=active.filter(function(m){return !Array.isArray(m.acknowledgements)||m.acknowledgements.length===0;});
    return {active:active.length,pending:pending.length};
  }
  function decorateRobertoMonitor(){
    if(window.currentRole!=='director') return;
    var view=byId('productionView'); if(!view) return;
    var old=byId('sp105DirectorComms'); if(old) old.remove();
    var stats=messageStats(), box=document.createElement('div');
    box.id='sp105DirectorComms'; box.className='sp105-director-comms';
    box.innerHTML=`<div class="sp105-director-comms-main"><div class="sp105-director-comms-icon">📣</div><div><h3>Comunicazioni al reparto</h3><p>Invia subito un messaggio agli operatori. Le comunicazioni restano visibili finché non vengono archiviate.</p><div class="sp105-comms-meta"><span class="sp105-chip">${stats.active} messaggi attivi</span><span class="sp105-chip">${stats.pending} da confermare</span></div></div></div><button type="button" class="btn primary sp105-send-message">📣 INVIA MESSAGGIO AGLI OPERATORI</button>`;
    box.querySelector('button').onclick=function(){if(typeof window.v5OpenMessage==='function')window.v5OpenMessage();};
    view.insertBefore(box,view.firstChild);
  }
  function wrapProduction(){
    var old=window.renderProduction;
    if(typeof old==='function'&&!old.__sp105){
      var wrapped=function(){var r=old.apply(this,arguments);setTimeout(decorateRobertoMonitor,0);return r;};wrapped.__sp105=true;
      window.renderProduction=wrapped;try{renderProduction=wrapped;}catch(_){ }
    }
    decorateRobertoMonitor();
  }
  function patchAccessGateFunction(){
    try{window.showDirectorLogin=enterDirectorDirect;showDirectorLogin=enterDirectorDirect;}catch(_){ }
    var old=window.patchAccessGate;
    if(typeof old==='function'&&!old.__sp105){var wrapped=function(){var r=old.apply(this,arguments);setTimeout(patchDirectorAccess,0);return r;};wrapped.__sp105=true;window.patchAccessGate=wrapped;try{patchAccessGate=wrapped;}catch(_){ }}
  }
  function markVersion(){try{document.body.dataset.build='PIATTAFORMA-GRUPPO-V10.5';}catch(_){ }document.querySelectorAll('.version-badge').forEach(function(x){x.textContent='V10.5';});}
  function boot(){injectStyles();patchAccessGateFunction();patchDirectorAccess();wrapProduction();markVersion();setTimeout(function(){patchDirectorAccess();decorateRobertoMonitor();markVersion();},350);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* ===== Smart Pack · Multiplast — V11.2 ACCOUNT AZIENDA + USER/PIN ===== */
(()=>{
  'use strict';
  const BUILD='V11.4', MARKER='PIATTAFORMA-GRUPPO-V11.4', GROUP='smartpack-multiplast';
  let selectedCompany=sessionStorage.getItem('poi_v112_company')||'', employee=null, manageCompany='smartpack';
  try{employee=JSON.parse(sessionStorage.getItem('poi_v112_employee')||'null')}catch(_){employee=null}
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=()=>window.POICloudV10;
  const profile=()=>api()?.getProfile?.()||null;
  const client=()=>api()?.getClient?.()||null;
  const canManage=()=>['platform_admin','tenant_admin','backup_admin'].includes(profile()?.account_type)||api()?.isOwner?.();
  const companies=()=>{const c=profile()?.company_codes;return Array.isArray(c)&&c.length?c:['smartpack','multiplast']};
  const companyName=c=>c==='multiplast'?'Multiplast':'Smart Pack';
  const roleName=r=>({director:'Gestione Smart Pack',manager:'Responsabile Produzione Multiplast',worker:'Produzione Smart Pack',mpworker:'Produzione Multiplast',admin:'Amministrazione'}[r]||r);
  const accountName=t=>({platform_admin:'Amministratore NOMYRA',tenant_admin:'Amministratore azienda',backup_admin:'Amministratore di emergenza',standard:'Account autorizzato'}[t]||'Account autorizzato');

  function injectStyles(){
    if($('#poi112Styles'))return;
    const st=document.createElement('style');st.id='poi112Styles';st.textContent=`
      .poi112-overlay{display:none;position:fixed;inset:0;z-index:14000;background:rgba(12,35,46,.72);backdrop-filter:blur(7px);padding:22px;overflow:auto}.poi112-overlay.open{display:grid;place-items:center}
      .poi112-card{width:min(940px,100%);background:#f7fafb;border:1px solid #d7e4e9;border-radius:24px;box-shadow:0 30px 90px rgba(10,34,45,.34);padding:22px}.poi112-card.narrow{width:min(560px,100%)}
      .poi112-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.poi112-logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#17394a;color:#fff;font-weight:950}.poi112-head .grow{flex:1}.poi112-head h2{margin:0;font-size:21px}.poi112-head p{margin:5px 0 0;color:#647b86;font-size:10px;line-height:1.5}.poi112-close{border:0;background:#e8f0f3;width:34px;height:34px;border-radius:10px;font-size:19px;cursor:pointer}
      .poi112-account{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border:1px solid #dbe7eb;border-radius:14px;padding:11px 13px;margin-bottom:14px}.poi112-account span{font-size:9px;color:#627984}.poi112-badge{display:inline-flex;padding:5px 9px;border-radius:999px;background:#e8f5ef;color:#176c56;font-size:8px;font-weight:900}
      .poi112-company-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.poi112-company{background:#fff;border:1px solid #d6e4e9;border-radius:18px;padding:18px;text-align:left;cursor:pointer;transition:.18s}.poi112-company:hover{transform:translateY(-2px);border-color:#86b5c8;box-shadow:0 12px 28px rgba(24,70,88,.1)}.poi112-company b{display:block;font-size:18px}.poi112-company span{display:block;color:#627984;font-size:10px;line-height:1.5;margin-top:5px}.poi112-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.poi112-actions .btn{flex:1;justify-content:center;min-width:150px}
      .poi112-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.poi112-form-grid .full{grid-column:1/-1}.poi112-error{display:none;border:1px solid #efc8c8;background:#fff5f5;color:#9d3e3e;border-radius:11px;padding:9px 11px;font-size:9px}.poi112-error.show{display:block}
      .poi112-tabs{display:flex;gap:7px;margin-bottom:12px}.poi112-tabs button{border:1px solid #d6e4e9;background:#fff;border-radius:999px;padding:7px 11px;font-size:9px;font-weight:900;cursor:pointer}.poi112-tabs button.active{background:#17394a;color:#fff;border-color:#17394a}
      .poi112-admin-grid{display:grid;grid-template-columns:330px 1fr;gap:14px}.poi112-panel{background:#fff;border:1px solid #dbe7eb;border-radius:16px;padding:14px}.poi112-panel h3{margin:0 0 4px;font-size:14px}.poi112-panel>p{margin:0 0 12px;color:#647b86;font-size:9px;line-height:1.45}.poi112-employee{display:grid;grid-template-columns:1fr auto;gap:9px;padding:10px 0;border-bottom:1px solid #edf2f4}.poi112-employee:last-child{border-bottom:0}.poi112-employee b{font-size:10px}.poi112-employee small{display:block;color:#6c7f88;font-size:8px;margin-top:3px}.poi112-employee .poi112-row-actions{display:flex;gap:5px;align-items:center}.poi112-empty{padding:20px;text-align:center;color:#71858e;font-size:10px}.poi112-current{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:#eef7f4;color:#176b57;font-size:9px;font-weight:850;margin-top:10px}
      @media(max-width:760px){.poi112-company-grid,.poi112-admin-grid,.poi112-form-grid{grid-template-columns:1fr}.poi112-form-grid .full{grid-column:auto}.poi112-card{padding:16px}.poi112-overlay{padding:10px}.poi112-employee{grid-template-columns:1fr}.poi112-employee .poi112-row-actions{justify-content:flex-start}}
    `;document.head.appendChild(st);
  }

  function ensureUI(){
    injectStyles();
    if(!$('#poi112CompanyGate'))document.body.insertAdjacentHTML('beforeend',`<div class="poi112-overlay" id="poi112CompanyGate"><section class="poi112-card"><div class="poi112-head"><div class="poi112-logo">SP·MP</div><div class="grow"><h2 id="poi112Welcome">Scegli l’azienda</h2><p>Seleziona l’ambiente di lavoro. Gli operatori entrano con USER e PIN personale.</p></div><button class="poi112-close" id="poi112CompanyClose" type="button">×</button></div><div id="poi112CompanyBody"></div></section></div>`);
    if(!$('#poi112AccessGate'))document.body.insertAdjacentHTML('beforeend',`<div class="poi112-overlay" id="poi112AccessGate"><section class="poi112-card narrow"><div class="poi112-head"><div class="poi112-logo" id="poi112AccessLogo">SP</div><div class="grow"><h2 id="poi112AccessTitle">Accesso azienda</h2><p id="poi112AccessSub">Scegli come entrare.</p></div><button class="poi112-close" id="poi112AccessClose" type="button">×</button></div><div id="poi112AccessBody"></div></section></div>`);
    if(!$('#poi112Admin'))document.body.insertAdjacentHTML('beforeend',`<div class="poi112-overlay" id="poi112Admin"><section class="poi112-card"><div class="poi112-head"><div class="poi112-logo">UP</div><div class="grow"><h2>Utenti dipendenti e PIN</h2><p>Crea un USER personale per ogni dipendente. Il PIN viene cifrato e non è mai visibile dopo il salvataggio.</p></div><button class="poi112-close" id="poi112AdminClose" type="button">×</button></div><div class="poi112-tabs" id="poi112AdminTabs"></div><div class="poi112-admin-grid"><div class="poi112-panel"><h3>Nuovo dipendente</h3><p>Il nome USER è unico. Il PIN deve contenere da 4 a 8 cifre.</p><form id="poi112CreateForm"><div class="poi112-form-grid"><label class="field full">Nome e cognome<input name="display_name" required maxlength="100" placeholder="Mario Rossi"></label><label class="field">USER<input name="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" placeholder="mario.rossi"></label><label class="field">PIN<input name="pin" required inputmode="numeric" type="password" pattern="[0-9]{4,8}" minlength="4" maxlength="8" placeholder="4–8 cifre"></label><label class="field full">Profilo<select name="role_code" required></select></label><div class="poi112-error full" id="poi112CreateError"></div><button class="btn primary full" type="submit">Crea USER dipendente</button></div></form></div><div class="poi112-panel"><h3 id="poi112ListTitle">Dipendenti</h3><p>Resetta il PIN o sospendi immediatamente un accesso.</p><div id="poi112EmployeeList"><div class="poi112-empty">Caricamento…</div></div></div></div></section></div>`);
    $('#poi112CompanyClose').onclick=()=>$('#poi112CompanyGate').classList.remove('open');
    $('#poi112AccessClose').onclick=()=>{$('#poi112AccessGate').classList.remove('open');showCompanyMenu()};
    $('#poi112AdminClose').onclick=()=>$('#poi112Admin').classList.remove('open');
    $('#poi112CreateForm').onsubmit=createEmployee;
    decorateAuth();decorateCloudMenu();
  }

  function decorateAuth(){
    const reg=$('#poiCloudRegisterForm');if(reg){const role=$('#poiRegRole')?.closest('label');if(role)role.style.display='none';const b=reg.querySelector('button[type="submit"]');if(b)b.textContent='Attiva account autorizzato'}
    const show=$('#poiShowRegister');if(show)show.textContent='Attiva account autorizzato';
    const foot=$('.poi-cloud-auth-foot');if(foot)foot.textContent='Sono accettati solo gli indirizzi autorizzati: NOMYRA o account cliente. Ogni dipendente usa invece USER e PIN personale.';
    const login=$('#poiCloudLoginForm .poi-cloud-auth-grid');if(login&&!$('#poi112Forgot')){const b=document.createElement('button');b.id='poi112Forgot';b.type='button';b.className='btn';b.textContent='Password dimenticata?';b.onclick=resetPassword;login.appendChild(b)}
  }

  async function resetPassword(){
    const email=$('#poiCloudEmail')?.value?.trim();if(!email){alert('Inserisci prima l’indirizzo e-mail dell’account.');return}
    const sb=client();if(!sb){alert('Collegamento cloud non ancora pronto. Riprova tra qualche secondo.');return}
    const redirectTo=location.href.split('#')[0];const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    alert(error?'Non è stato possibile inviare il recupero: '+error.message:'E-mail di recupero inviata. Controlla anche la cartella Spam.');
  }

  function bindPasswordRecovery(){
    const sb=client();if(!sb||sb.__poi112RecoveryBound)return;sb.__poi112RecoveryBound=true;
    sb.auth.onAuthStateChange(async event=>{if(event!=='PASSWORD_RECOVERY')return;setTimeout(async()=>{const first=prompt('Inserisci la nuova password (almeno 8 caratteri):');if(first===null)return;if(first.length<8){alert('La password deve contenere almeno 8 caratteri.');return}const second=prompt('Ripeti la nuova password:');if(first!==second){alert('Le due password non coincidono.');return}const {error}=await sb.auth.updateUser({password:first});alert(error?'Password non aggiornata: '+error.message:'Password aggiornata. Ora puoi usarla per i prossimi accessi.')},100)});
  }

  function decorateCloudMenu(){
    const b=$('#poiCloudUsers');if(b){b.textContent='Utenti dipendenti e PIN';b.onclick=openAdmin}
    const menu=$('#poiCloudMenu');if(menu&&!$('#poi112EmployeeLogout')){const x=document.createElement('button');x.id='poi112EmployeeLogout';x.type='button';x.className='btn';x.textContent='Termina sessione dipendente';x.style.display=employee?'inline-flex':'none';x.onclick=employeeLogout;const out=$('#poiCloudLogout');menu.insertBefore(x,out)}
    const logout=$('#poiCloudLogout');if(logout&&!logout.dataset.poi112){logout.dataset.poi112='1';logout.addEventListener('click',()=>{$$('.poi112-overlay').forEach(x=>x.classList.remove('open'));sessionStorage.removeItem('poi_v112_employee');sessionStorage.removeItem('poi_v112_company');employee=null;selectedCompany=''},{capture:true})}
  }
  function $$(s,r=document){return [...r.querySelectorAll(s)]}

  function showCompanyMenu(){
    ensureUI();const p=profile();if(!p)return;
    $('#accessGate')?.style.setProperty('display','none','important');
    $('#poi112AccessGate').classList.remove('open');
    $('#poi112Welcome').textContent=`Benvenuto, ${p.display_name||'utente'}`;
    const cards=companies().map(c=>`<button class="poi112-company" type="button" onclick="POIV112.selectCompany('${c}')"><b>${companyName(c)}</b><span>${c==='smartpack'?'Ordini, produzione, IML, magazzino e amministrazione Smart Pack.':'Presse, miscele, turni, consegne e amministrazione Multiplast.'}</span></button>`).join('');
    $('#poi112CompanyBody').innerHTML=`<div class="poi112-account"><div><b>${esc(p.display_name||'Account')}</b><span>${esc(api()?.getUser?.()?.email||'')}</span></div><i class="poi112-badge">${esc(accountName(p.account_type))}</i></div><div class="poi112-company-grid">${cards}</div>${employee?`<div class="poi112-current">Sessione dipendente attiva: ${esc(employee.display_name)} · ${esc(companyName(employee.company_code))}</div>`:''}${canManage()?'<div class="poi112-actions"><button class="btn" type="button" onclick="POIV112.openAdmin()">Gestisci dipendenti e PIN</button></div>':''}`;
    $('#poi112CompanyGate').classList.add('open');
  }

  function selectCompany(c){
    if(!companies().includes(c))return;selectedCompany=c;sessionStorage.setItem('poi_v112_company',c);$('#poi112CompanyGate').classList.remove('open');
    const smart=c==='smartpack';$('#poi112AccessLogo').textContent=smart?'SP':'MP';$('#poi112AccessTitle').textContent=companyName(c);$('#poi112AccessSub').textContent='I dipendenti usano USER e PIN personale. L’account aziendale mantiene l’accesso amministrativo.';
    const adminButtons=canManage()?`<div class="poi112-actions"><button class="btn primary" type="button" onclick="POIV112.enterAdmin('${smart?'director':'manager'}')">${smart?'Gestione Smart Pack':'Gestione produzione'}</button><button class="btn" type="button" onclick="POIV112.enterAdmin('admin')">Amministrazione</button><button class="btn" type="button" onclick="POIV112.openAdmin('${c}')">Gestisci USER e PIN</button></div>`:'';
    $('#poi112AccessBody').innerHTML=`<form id="poi112PinForm"><div class="poi112-form-grid"><label class="field full">USER dipendente<input name="username" autocomplete="username" required maxlength="40" placeholder="es. mario.rossi"></label><label class="field full">PIN personale<input name="pin" autocomplete="current-password" inputmode="numeric" type="password" pattern="[0-9]{4,8}" required maxlength="8" placeholder="••••"></label><div class="poi112-error full" id="poi112PinError"></div><button class="btn primary full" type="submit">Entra come dipendente</button></div></form>${adminButtons}`;
    $('#poi112PinForm').onsubmit=employeeLogin;$('#poi112AccessGate').classList.add('open');setTimeout(()=>$('#poi112PinForm [name="username"]')?.focus(),80);
  }

  async function employeeLogin(e){
    e.preventDefault();const err=$('#poi112PinError'),f=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button[type="submit"]');err.classList.remove('show');btn.disabled=true;btn.textContent='Verifica…';
    const {data,error}=await client().rpc('poi_verify_employee_pin',{p_username:String(f.get('username')||''),p_pin:String(f.get('pin')||''),p_company:selectedCompany,p_group:GROUP});btn.disabled=false;btn.textContent='Entra come dipendente';
    const row=Array.isArray(data)?data[0]:data;if(error||!row?.success){err.textContent=row?.error_code==='locked'?'Accesso bloccato per 15 minuti dopo troppi tentativi errati.':'USER o PIN non corretti.';err.classList.add('show');return}
    employee={employee_id:row.employee_id,username:row.username,display_name:row.display_name,role_code:row.role_code,company_code:row.company_code};sessionStorage.setItem('poi_v112_employee',JSON.stringify(employee));
    $('#poi112AccessGate').classList.remove('open');decorateCloudMenu();enterRole(row.role_code,true);
  }

  function enterRole(role,asEmployee=false){
    if(!selectedCompany)selectedCompany=role==='manager'||role==='mpworker'?'multiplast':'smartpack';sessionStorage.setItem('poi_v112_company',selectedCompany);
    if(!asEmployee){employee=null;sessionStorage.removeItem('poi_v112_employee')}
    api()?.enterRole?.(role);setTimeout(()=>{const u=$('#userName'),r=$('#userRole');if(u)u.textContent=employee?.display_name||profile()?.display_name||'Utente';if(r)r.textContent=(employee?'Dipendente · ':'')+roleName(role);const x=$('#poi112EmployeeLogout');if(x)x.style.display=employee?'inline-flex':'none'},80);
  }
  function enterAdmin(role){$('#poi112AccessGate').classList.remove('open');enterRole(role,false)}
  function employeeLogout(){employee=null;sessionStorage.removeItem('poi_v112_employee');const x=$('#poi112EmployeeLogout');if(x)x.style.display='none';showCompanyMenu()}

  function roleOptions(c){return c==='smartpack'?[['worker','Produzione Smart Pack'],['admin','Amministrazione'],['director','Gestione Smart Pack']]:[['mpworker','Produzione Multiplast'],['manager','Responsabile produzione'],['admin','Amministrazione']]}
  function openAdmin(c){
    ensureUI();if(!canManage())return;manageCompany=c||selectedCompany||companies()[0]||'smartpack';if(!companies().includes(manageCompany))manageCompany=companies()[0];
    $('#poi112Admin').classList.add('open');renderAdminTabs();loadEmployees();
  }
  function renderAdminTabs(){
    $('#poi112AdminTabs').innerHTML=companies().map(c=>`<button type="button" class="${c===manageCompany?'active':''}" onclick="POIV112.setManageCompany('${c}')">${companyName(c)}</button>`).join('');
    const sel=$('#poi112CreateForm [name="role_code"]');if(sel)sel.innerHTML=roleOptions(manageCompany).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    $('#poi112ListTitle').textContent='Dipendenti · '+companyName(manageCompany);
  }
  function setManageCompany(c){if(!companies().includes(c))return;manageCompany=c;renderAdminTabs();loadEmployees()}
  async function loadEmployees(){
    const list=$('#poi112EmployeeList');list.innerHTML='<div class="poi112-empty">Caricamento…</div>';const {data,error}=await client().rpc('poi_employee_list',{p_group:GROUP,p_company:manageCompany});
    if(error){list.innerHTML='<div class="poi112-empty">Impossibile caricare gli utenti autorizzati.</div>';return}
    list.innerHTML=(data||[]).map(e=>`<div class="poi112-employee"><div><b>${esc(e.display_name)}</b><small>USER: ${esc(e.username)} · ${esc(roleName(e.role_code))} · ${e.active?'Attivo':'Sospeso'}${e.locked_until&&new Date(e.locked_until)>new Date()?' · Bloccato':''}</small></div><div class="poi112-row-actions"><button class="btn small" type="button" onclick="POIV112.resetPin('${e.id}')">Reset PIN</button><button class="btn small ${e.active?'danger':''}" type="button" onclick="POIV112.toggleEmployee('${e.id}',${!e.active})">${e.active?'Sospendi':'Riattiva'}</button></div></div>`).join('')||'<div class="poi112-empty">Nessun dipendente creato per questa azienda.</div>';
  }
  async function createEmployee(e){
    e.preventDefault();const f=new FormData(e.currentTarget),err=$('#poi112CreateError'),btn=e.currentTarget.querySelector('button[type="submit"]');err.classList.remove('show');btn.disabled=true;btn.textContent='Creazione…';
    const args={p_company:manageCompany,p_username:String(f.get('username')||'').trim().toLowerCase(),p_display_name:String(f.get('display_name')||'').trim(),p_role_code:String(f.get('role_code')||''),p_pin:String(f.get('pin')||''),p_group:GROUP};
    const {error}=await client().rpc('poi_employee_create',args);btn.disabled=false;btn.textContent='Crea USER dipendente';if(error){err.textContent=/duplicate|unique/i.test(error.message||'')?'Questo USER esiste già. Scegline un altro.':'Creazione non riuscita. Controlla USER, ruolo e PIN.';err.classList.add('show');return}e.currentTarget.reset();renderAdminTabs();loadEmployees();
  }
  async function resetPin(id){const pin=prompt('Nuovo PIN (da 4 a 8 cifre):');if(pin===null)return;if(!/^\d{4,8}$/.test(pin)){alert('Il PIN deve contenere da 4 a 8 cifre.');return}const {error}=await client().rpc('poi_employee_update',{p_employee_id:id,p_new_pin:pin,p_group:GROUP});alert(error?'Reset PIN non riuscito.':'PIN aggiornato. Il vecchio PIN non è più valido.');if(!error)loadEmployees()}
  async function toggleEmployee(id,active){if(!confirm(active?'Riattivare questo utente?':'Sospendere subito questo utente?'))return;const {error}=await client().rpc('poi_employee_update',{p_employee_id:id,p_active:active,p_group:GROUP});if(error)alert('Aggiornamento non riuscito.');else loadEmployees()}

  function boot(){
    if(window.POIV113)return;
    document.body.dataset.build=MARKER;document.title=document.title.replace(/V11\.\d+/,BUILD);injectStyles();
    [250,700,1500,3000].forEach(ms=>setTimeout(()=>{ensureUI();decorateAuth();decorateCloudMenu();bindPasswordRecovery()},ms));
  }
  window.POIV112={showCompanyMenu,selectCompany,enterAdmin,openAdmin,setManageCompany,resetPin,toggleEmployee};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


/* ===== migrated from v106-patch.js ===== */
/* Smart Pack · Multiplast — V10.6
   Stabilizzazione flusso operativo + foglio di carico + leggibilità mobile.
   Principi:
   - Produzione, disponibilità fisica e consegna sono stati separati.
   - Una produzione può essere messa in pausa / attesa liberando la pressa.
   - Roberto può autorizzare la chiusura parziale di un foglio sotto il 100%.
   - Il residuo genera una nuova produzione/foglio senza perdere lo storico.
   - Il netto prodotto diventa disponibilità fisica anche prima del 100% dell'ordine.
   - Gli operatori possono preparare un foglio di carico; Amministrazione vede subito i carichi pronti per DDT.
   - Interfaccia operativa ridisegnata per telefono e caratteri più grandi.
*/
(function(){
  'use strict';

  const V='10.6';
  const $6=id=>document.getElementById(id);
  const n6=v=>Number(v||0);
  const esc6=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt6=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n6(v));
  const date6=v=>{ if(!v)return '—'; try{return new Date(String(v).length===10?v+'T12:00:00':v).toLocaleDateString('it-IT')}catch(_){return String(v)} };
  const stamp6=v=>{ if(!v)return '—'; try{return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(_){return String(v)} };
  const nowIso6=()=>new Date().toISOString();
  const today6=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
  const uid6=p=>typeof uid==='function'?uid(p):p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);

  let selectedRunV106='';
  let selectedLoadV106='';
  let adminTabV106='ready';
  let legacyRenderProduction=null;
  let legacyOpenProgress=null;
  let legacyOpenStart=null;
  let legacyOpenDDT=null;
  let legacyDDTSubmit=null;
  let legacyRenderOrders=null;

  function save6(){ try{save()}catch(_){ try{localStorage.setItem('industrial_os_v2_state',JSON.stringify(state))}catch(__){} } }
  function audit6(action,ref,detail){ try{addAudit(action,ref,detail)}catch(_){ state.audit=Array.isArray(state.audit)?state.audit:[];state.audit.unshift({id:uid6('aud'),at:nowIso6(),action,ref,detail,role:typeof currentRole!=='undefined'?currentRole:''}); } }
  function toast6(msg){ try{toast(msg)}catch(_){ console.log(msg); } }

  function line6(code){ return (state.orders||[]).find(o=>String(o.code)===String(code))||null; }
  function lines6(parent){ return (state.orders||[]).filter(o=>String(o.parent)===String(parent)&&!o.cancelled); }
  function main6(parent){ const ls=lines6(parent);return ls.find(o=>String(o.code||'').endsWith('A'))||ls[0]||null; }
  function runs6(code){ return (state.productionRuns||[]).filter(r=>!r.warehouseProduction&&String(r.orderCode)===String(code)&&r.status!=='Annullata'); }
  function runNet6(r){ if(r?.netProducedV104!=null)return Math.max(0,n6(r.netProducedV104));return Math.max(0,n6(r?.produced)); }
  function runGross6(r){ if(r?.grossProducedV104!=null)return Math.max(0,n6(r.grossProducedV104));return Math.max(0,runNet6(r)+n6(r?.scrap)); }
  function runScrap6(r){ return Math.max(0,n6(r?.scrap)); }

  function lineProduction6(code){
    const rs=runs6(code);
    const net=rs.reduce((s,r)=>s+runNet6(r),0), gross=rs.reduce((s,r)=>s+runGross6(r),0), scrap=rs.reduce((s,r)=>s+runScrap6(r),0);
    const o=line6(code),target=Math.max(0,n6(o?.qty));
    const active=rs.find(r=>r.status==='In produzione');
    const blocked=rs.find(r=>r.status==='Bloccata');
    const paused=rs.find(r=>r.status==='In pausa');
    const waiting=rs.find(r=>r.status==='In attesa');
    let status='Da produrre';
    if(target>0&&net>=target)status='Produzione completa';
    else if(active)status='In produzione';
    else if(blocked)status='Bloccata';
    else if(paused)status='In pausa';
    else if(waiting)status='In attesa';
    else if(net>0)status='Produzione incompleta';
    else if(rs.some(r=>r.status==='In coda'))status='In coda';
    return {net,gross,scrap,target,remaining:Math.max(0,target-net),pct:target?Math.min(100,net/target*100):0,status,runs:rs};
  }

  function parentProduction6(parent){
    const ls=lines6(parent).filter(o=>n6(o.qty)>0);
    const data=ls.map(o=>({order:o,p:lineProduction6(o.code)}));
    const main=main6(parent),mp=main?lineProduction6(main.code):{net:0,target:0,pct:0,status:'—'};
    const complete=data.length>0&&data.every(x=>x.p.net>=n6(x.order.qty));
    const active=data.some(x=>x.p.status==='In produzione');
    const blocked=data.some(x=>x.p.status==='Bloccata');
    const paused=data.some(x=>['In pausa','In attesa'].includes(x.p.status));
    let status=complete?'Produzione completa':active?'In produzione':blocked?'Bloccata':paused?'In attesa / pausa':mp.net>0?'Produzione incompleta':'Da produrre';
    return {complete,status,net:mp.net,target:mp.target,pct:mp.pct,lines:data};
  }

  function delivered6(parent){
    if(window.SPFlowV101?.delivered) return Math.max(0,n6(window.SPFlowV101.delivered(parent)));
    return (state.deliveryRecords||[]).filter(r=>String(r.parent)===String(parent)).reduce((s,r)=>s+n6(r.qty),0);
  }
  function requested6(parent){ return Math.max(0,n6(main6(parent)?.qty)); }
  function deliveryRemaining6(parent){ return Math.max(0,requested6(parent)-delivered6(parent)); }
  function available6(parent){
    try{ if(window.SPFlowV101?.availableForOrder)return Math.max(0,n6(window.SPFlowV101.availableForOrder(parent))); }catch(_){ }
    return 0;
  }
  function closed6(parent){
    const a=main6(parent);if(!a)return false;
    return !!a.closedAt||/chiuso/i.test(String(a.status||''))||(requested6(parent)>0&&delivered6(parent)>=requested6(parent));
  }

  function syncOrderProduction6(parent){
    for(const o of lines6(parent)){
      const p=lineProduction6(o.code);
      o.productionNetQtyV106=p.net;o.productionGrossQtyV106=p.gross;o.productionScrapQtyV106=p.scrap;o.productionProgressPctV106=p.pct;o.productionStatusV106=p.status;
      // Manteniamo i campi precedenti coerenti, ma non tocchiamo delivered/remaining: appartengono alla consegna.
      o.productionNetQtyV104=p.net;o.productionGrossQtyV104=p.gross;o.productionScrapQtyV104=p.scrap;o.productionProgressPctV104=p.pct;
      if(p.net>=p.target&&p.target>0)o.productionCompletedAtV106=o.productionCompletedAtV106||nowIso6();
    }
    const a=main6(parent),pp=parentProduction6(parent);
    if(a){a.productionStatusV106=pp.status;a.productionCompleteV106=pp.complete;a.productionNetQtyV106=pp.net;a.productionProgressPctV106=pp.pct;}
  }
  function syncAllOrders6(){ for(const p of new Set((state.orders||[]).map(o=>String(o.parent))))syncOrderProduction6(p); }

  function kind6(o){
    const s=(String(o?.code||'')+' '+String(o?.liters||'')+' '+String(o?.product||'')).toUpperCase();return /COPERCHIO|CLT|C$/.test(s)?'Coperchio':'Secchio';
  }
  function liters6(v){const s=String(v||'').toUpperCase().replace('CLT','LT');if(s.startsWith('3'))return'3LT';if(s.startsWith('5'))return'5LT';if(s.startsWith('14'))return'14LT';if(s.startsWith('18'))return'18LT';return s;}

  // Ogni quantità netta realmente registrata è prodotto fisico utilizzabile: non aspettiamo il 100% dell'ordine.
  function syncRunLot6(j){
    if(!j||j.warehouseProduction)return;
    const o=line6(j.orderCode);if(!o)return;
    state.finishedGoodsLots=Array.isArray(state.finishedGoodsLots)?state.finishedGoodsLots:[];
    state.finishedGoodsMovements=Array.isArray(state.finishedGoodsMovements)?state.finishedGoodsMovements:[];
    const produced=runNet6(j);
    let lot=state.finishedGoodsLots.find(l=>String(l.sourceRunIdV101||l.runId||'')===String(j.id));
    if(!lot&&produced>0){
      lot={id:uid6('fg'),lotCode:`LOT-${j.orderCode}-${String(Date.now()).slice(-5)}`,productionRef:j.orderCode,runId:j.id,sourceRunIdV101:j.id,sourceOrderCode:o.code,sourceParent:o.parent,sourceType:'Produzione cliente',sheetId:sheetForRun6(j,false)?.id||'',kind:kind6(o),liters:liters6(o.liters),color:String(o.color||'BIANCO').toUpperCase(),product:o.product||'',imlCode:o.imlCode||'',qtyProduced:produced,qtyReserved:0,qtyConsumed:0,productionDate:j.productionDate||today6(),machineId:j.machineId||'',moldId:j.moldId||'',operator:j.operator||'',scrap:runScrap6(j),createdAt:nowIso6(),notes:j.note||''};
      state.finishedGoodsLots.unshift(lot);j.finishedGoodsLotV101=lot.id;
      state.finishedGoodsMovements.unshift({id:uid6('fgm'),type:'IN',date:lot.productionDate,qty:produced,lotId:lot.id,orderCode:o.code,parent:o.parent,ref:j.id,reason:'Produzione netta disponibile',at:nowIso6()});
    }else if(lot){
      const old=n6(lot.qtyProduced),floor=n6(lot.qtyConsumed)+n6(lot.qtyReserved),next=Math.max(floor,produced),delta=next-old;
      lot.qtyProduced=next;lot.operator=j.operator||lot.operator;lot.productionDate=j.productionDate||lot.productionDate;lot.scrap=runScrap6(j);lot.notes=j.note||lot.notes;
      if(delta!==0)state.finishedGoodsMovements.unshift({id:uid6('fgm'),type:'ADJUST',date:today6(),qty:delta,lotId:lot.id,orderCode:o.code,parent:o.parent,ref:j.id,reason:'Aggiornamento avanzamento produzione',at:nowIso6()});
    }
  }

  function sheetForRun6(j,create=true){
    state.productionSheets=Array.isArray(state.productionSheets)?state.productionSheets:[];
    let s=state.productionSheets.find(x=>String(x.runIdV106||'')===String(j.id));
    if(s)return s;
    const same=state.productionSheets.filter(x=>String(x.orderCode)===String(j.orderCode));
    const unlinked=same.find(x=>!x.runIdV106&&!x.closedAtV106);
    if(unlinked){unlinked.runIdV106=j.id;return unlinked;}
    if(!create)return null;
    const o=line6(j.orderCode);if(!o)return null;
    const cap=String(o.liters||'').startsWith('3')?725:String(o.liters||'').startsWith('5')?880:400;
    const total=Math.max(0,n6(j.qty));const packs=Math.max(1,Math.ceil(total/cap));let left=total,rows=[];
    for(let i=1;i<=packs;i++){const pieces=Math.min(cap,left);rows.push({id:uid6('row'),orderCode:o.code,imlCode:o.imlCode||'',pieces,packageLabel:'# '+i,lidColor:`${o.color||'BIANCO'} TAPPI`,status:'Da produrre',operatorProduction:j.operator||'',operatorHandles:'',finishAt:'',notes:''});left-=pieces;}
    const sheetNo=same.length+1;
    s={id:uid6('sheet'),sheetNo,sheetDate:today6(),productionDate:j.productionDate||'',parent:o.parent,client:o.client,product:o.product,imlCode:o.imlCode||'',orderCode:o.code,priority:o.priority||'Normale',packageType:'Cesta',rows,createdAt:nowIso6(),createdBy:'Produzione',machineId:j.machineId,moldId:j.moldId,runIdV106:j.id,statusV106:'Aperto'};
    // In testa: le vecchie funzioni che cercano per orderCode trovano il foglio della produzione corrente/residua.
    state.productionSheets.unshift(s);return s;
  }

  function updateSheetRun6(j,finalStatus=''){
    const s=sheetForRun6(j,true);if(!s)return;
    s.productionDate=j.productionDate||s.productionDate||today6();s.operatorV106=j.operator||s.operatorV106||'';s.grossProducedV104=runGross6(j);s.scrap=runScrap6(j);s.netProducedV104=runNet6(j);s.statusV106=finalStatus||j.status;
    for(const r of s.rows||[]){ if(j.operator)r.operatorProduction=j.operator;if(finalStatus==='Completata'){r.status='Completata';if(!r.finishAt)r.finishAt=new Date().toLocaleString('it-IT');}else if(finalStatus==='Chiuso parziale'){if(!r.finishAt)r.status='Non completata';}else if(j.status)r.status=j.status; }
    if(['Completata','Chiuso parziale'].includes(finalStatus)){s.closedAtV106=nowIso6();s.closedReasonV106=j.partialReasonV106||j.note||'';}
  }

  function createResidualRun6(j){
    const o=line6(j.orderCode);if(!o)return null;
    const p=lineProduction6(j.orderCode),residual=Math.max(0,n6(o.qty)-p.net);
    if(residual<=0)return null;
    const existing=(state.productionRuns||[]).find(r=>String(r.orderCode)===String(j.orderCode)&&!['Completata','Chiuso parziale','Annullata'].includes(r.status)&&r.id!==j.id);
    if(existing)return existing;
    const sameMachine=(state.productionRuns||[]).filter(r=>r.machineId===j.machineId);const seq=Math.max(0,...sameMachine.map(r=>n6(r.sequence)))+1;
    const count=runs6(j.orderCode).length+1;
    const r={id:`run_${j.orderCode}_R${count}_${Date.now().toString(36).slice(-4)}`,orderCode:j.orderCode,parent:j.parent,client:j.client||o.client,product:j.product||o.product,qty:residual,produced:0,grossProducedV104:0,netProducedV104:0,scrap:0,machineId:j.machineId,moldId:j.moldId,status:'In coda',operator:'',startAt:'',endAt:'',note:'Residuo da produzione precedente chiusa parzialmente',sequence:seq,priority:j.priority||o.priority||'Normale',createdAt:nowIso6(),continuationOfV106:j.id,residualRunV106:true};
    state.productionRuns.push(r);sheetForRun6(r,true);return r;
  }

  function recordRunHistory6(j,from,to,note){
    j.statusHistory=Array.isArray(j.statusHistory)?j.statusHistory:[];
    if(from!==to)j.statusHistory.push({from,to,at:nowIso6(),note:note||'',operator:j.operator||'',machineId:j.machineId||'',productionDate:j.productionDate||''});
  }

  function canIML6(j,newGross){ try{return window.SPFlowV101?.canSetIML?window.SPFlowV101.canSetIML(j,newGross):true}catch(_){return true} }
  function reconcileIML6(j,newGross){ try{return window.SPFlowV101?.reconcileIML?window.SPFlowV101.reconcileIML(j,newGross):true}catch(_){return true} }

  function saveRunV106(mode='save'){
    const j=(state.productionRuns||[]).find(r=>String(r.id)===String(selectedRunV106));if(!j)return;
    const addGross=Math.max(0,n6($6('progressPieces')?.value)),addScrap=Math.max(0,n6($6('progressScrapV54')?.value));
    const oldG=runGross6(j),oldS=runScrap6(j),oldN=runNet6(j),newG=oldG+addGross,newS=oldS+addScrap,newN=Math.max(0,newG-newS);
    if(newS>newG){alert('Gli scarti cumulativi non possono superare la produzione lorda.');return;}
    if(!canIML6(j,newG)){const o=line6(j.orderCode),iml=o?.imlCode&&typeof getIML==='function'?getIML(o.imlCode):null;alert(`IML insufficienti. Disponibilità fisica: ${fmt6(iml?.physical||0)} pz.`);return;}
    const op=String($6('progressOperator')?.value||j.operator||'').trim();if(!op){alert("Inserisci il nome dell'operatore.");return;}
    const date=String($6('progressProductionDate')?.value||today6()),note=String($6('progressNote')?.value||'').trim();
    let status=String($6('progressStatus')?.value||j.status||'In produzione');
    if(mode==='pause')status='In pausa';
    if(mode==='partial')status='Chiuso parziale';
    if(mode==='complete')status='Completata';
    if(['In attesa','Bloccata'].includes(status)&&!note){alert('Inserisci una nota per spiegare il motivo.');return;}
    if(status==='Completata'&&newN<n6(j.qty)){alert(`Questa produzione è a ${fmt6(newN)} / ${fmt6(j.qty)} pz. Se Roberto decide di fermarla qui, usa “Chiudi foglio parziale”.`);return;}
    if(status==='Chiuso parziale'){
      if(newN<=0){alert('Non puoi chiudere parzialmente un foglio senza produzione registrata.');return;}
      const reason=String($6('partialReasonV106')?.value||'').trim();if(!reason){alert('Seleziona il motivo della chiusura parziale.');return;}
      if(typeof currentRole!=='undefined'&&currentRole==='worker'&&!confirm('Confermi che la chiusura parziale è stata autorizzata da Roberto?'))return;
      j.partialReasonV106=reason;j.partialAuthorizedByV106='Roberto';j.partialAuthorizedAtV106=nowIso6();
    }
    const from=j.status;
    j.grossProducedV104=newG;j.scrap=newS;j.netProducedV104=newN;j.produced=newN;j.operator=op;j.productionDate=date;j.note=note;j.status=status;
    if(status==='In produzione'&&!j.startAt)j.startAt=nowIso6();
    if(status==='In pausa'){j.pausedAtV106=nowIso6();j.pauseNoteV106=note;}
    if(status==='In attesa')j.waitingAtV106=nowIso6();
    if(['Completata','Chiuso parziale'].includes(status))j.endAt=nowIso6();
    recordRunHistory6(j,from,status,note||j.partialReasonV106||'');
    state.operators=Array.isArray(state.operators)?state.operators:[];if(op&&!state.operators.includes(op))state.operators.push(op);
    reconcileIML6(j,newG);
    syncRunLot6(j);
    updateSheetRun6(j,['Completata','Chiuso parziale'].includes(status)?status:'');
    state.productionEvents=Array.isArray(state.productionEvents)?state.productionEvents:[];
    if(addGross||addScrap)state.productionEvents.unshift({id:uid6('pev106'),runId:j.id,orderCode:j.orderCode,parent:j.parent,machineId:j.machineId,at:nowIso6(),deltaPieces:newN-oldN,deltaScrap:newS-oldS,deltaGrossPiecesV104:newG-oldG,kind:status==='Chiuso parziale'?'chiusura parziale foglio':status==='Completata'?'completamento produzione':'aggiornamento produzione',operator:op,note:note||j.partialReasonV106||'',status,cumulativeGrossV107:newG,cumulativeScrapV107:newS,cumulativeNetV107:newN});
    if(status==='Chiuso parziale')createResidualRun6(j);
    syncOrderProduction6(j.parent);
    audit6(status==='Chiuso parziale'?'Foglio produzione chiuso parzialmente':status==='Completata'?'Produzione completata':status==='In pausa'?'Produzione in pausa':'Avanzamento produzione',j.orderCode,`Lordo ${fmt6(newG)} · scarti ${fmt6(newS)} · netto ${fmt6(newN)} · ${status}${j.partialReasonV106?' · '+j.partialReasonV106:''}`);
    save6();try{closeDlg('progressRunDialog')}catch(_){$6('progressRunDialog')?.close?.();}
    renderProductionV106();
    toast6(status==='Chiuso parziale'?`Foglio chiuso parzialmente · residuo ripianificato`:status==='In pausa'?`Produzione in pausa · pressa libera`:status==='Completata'?`Produzione completata`:`Avanzamento salvato`);
  }

  function decorateProgressDialog6(j){
    const sel=$6('progressStatus');if(sel){
      if(![...sel.options].some(o=>o.value==='In pausa'))sel.insertAdjacentHTML('beforeend','<option>In pausa</option>');
      sel.value=['In produzione','In pausa','In attesa','Bloccata','Completata'].includes(j.status)?j.status:'In produzione';
      const lab=sel.closest('label');if(lab)lab.childNodes[0].textContent='Stato / eccezione ';
    }
    let reason=$6('partialReasonV106');if(!reason){
      const note=$6('progressNote')?.closest('label');if(note){note.insertAdjacentHTML('afterend',`<label class="field full" id="partialReasonWrapV106">Motivo chiusura parziale (solo se necessario)<select id="partialReasonV106"><option value="">Seleziona...</option><option>IML terminati</option><option>Cambio priorità deciso da Roberto</option><option>Materiale terminato</option><option>Fine turno / cambio programma</option><option>Problema qualità</option><option>Altro</option></select></label>`);}
    }
    const actions=$6('progressRunDialog')?.querySelector('.modal-actions');if(actions){
      let p=$6('pauseRunV106Btn');if(!p){p=document.createElement('button');p.type='button';p.id='pauseRunV106Btn';p.className='btn';p.textContent='Pausa · libera pressa';actions.insertBefore(p,$6('completeRunBtn'));}
      p.onclick=()=>saveRunV106('pause');
      let c=$6('partialCloseV106Btn');if(!c){c=document.createElement('button');c.type='button';c.id='partialCloseV106Btn';c.className='btn warn-v106';c.textContent='Chiudi foglio parziale';actions.insertBefore(c,$6('completeRunBtn'));}
      c.onclick=()=>saveRunV106('partial');
      const done=$6('completeRunBtn');if(done){done.textContent='Completa produzione';done.onclick=()=>saveRunV106('complete');}
      const submit=$6('progressRunForm')?.querySelector('button[type="submit"]');if(submit)submit.textContent='Salva avanzamento';
    }
    const help=$6('progressRunDialog')?.querySelector('.notice.ok');if(help)help.innerHTML='<strong>Regola V10.6:</strong> Pausa e In attesa liberano la pressa. “Chiudi foglio parziale” termina questa produzione anche sotto il 100% e crea automaticamente il residuo da produrre. I pezzi netti già registrati restano disponibili per il carico/DDT.';
  }

  function openProgressV106(id){
    selectedRunV106=String(id);
    const j=(state.productionRuns||[]).find(r=>String(r.id)===String(id));if(!j)return;
    if(typeof legacyOpenProgress==='function')legacyOpenProgress(id);
    else {try{openDlg('progressRunDialog')}catch(_){} }
    setTimeout(()=>{
      selectedRunV106=String(id);
      decorateProgressDialog6(j);
      const info=$6('progressRunInfo');if(info){const lp=lineProduction6(j.orderCode);info.innerHTML=`<strong>${esc6(j.product||'')}</strong><br>Questa produzione: <b>${fmt6(runNet6(j))} / ${fmt6(j.qty)} pz netti</b> · Ordine complessivo prodotto: <b>${fmt6(lp.net)} / ${fmt6(lp.target)}</b><br>Lordo foglio ${fmt6(runGross6(j))} · scarti ${fmt6(runScrap6(j))} · stato ${esc6(j.status)}`;}
    },60);
  }

  function resumeRun6(id){
    const j=(state.productionRuns||[]).find(r=>String(r.id)===String(id));if(!j)return;
    const blocking=(state.productionRuns||[]).find(r=>r.id!==j.id&&r.machineId===j.machineId&&['In produzione','Bloccata'].includes(r.status));
    if(blocking){alert(`${machineLabel6(j.machineId)} non è libera: ${blocking.status} · ordine ${blocking.orderCode}.`);return;}
    if(!j.operator){startRun6(id);return;}
    const from=j.status;j.status='In produzione';j.resumedAtV106=nowIso6();recordRunHistory6(j,from,'In produzione','Ripresa produzione');syncOrderProduction6(j.parent);audit6('Produzione ripresa',j.orderCode,`${machineLabel6(j.machineId)} · ${j.operator}`);save6();renderProductionV106();toast6(`Ordine ${j.orderCode} ripreso`);
  }

  function startRun6(id){
    const j=(state.productionRuns||[]).find(r=>String(r.id)===String(id));if(!j)return;
    if(['In pausa','In attesa'].includes(j.status)){resumeRun6(id);return;}
    const blocking=(state.productionRuns||[]).find(r=>r.id!==j.id&&r.machineId===j.machineId&&['In produzione','Bloccata'].includes(r.status));
    if(blocking){alert(`${machineLabel6(j.machineId)} non è disponibile: ${blocking.status} · ordine ${blocking.orderCode}.`);return;}
    // La funzione storica considerava "In attesa" come occupazione pressa. In V10.6 è una attesa dell'ordine, quindi la neutralizziamo solo durante l'apertura del dialog.
    const waits=(state.productionRuns||[]).filter(r=>r.id!==j.id&&r.machineId===j.machineId&&r.status==='In attesa');waits.forEach(r=>r.status='In pausa');
    try{ if(typeof legacyOpenStart==='function')legacyOpenStart(id);else alert('Avvio produzione non disponibile.'); }
    finally{waits.forEach(r=>r.status='In attesa');}
  }

  function machineLabel6(id){const m=(state.machines||[]).find(x=>String(x.id)===String(id));return m?.name||(id==='P1'?'Pressa 1':id==='P2'?'Pressa 2':String(id||'Pressa'));}
  function moldLabel6(id){return (state.molds||[]).find(x=>String(x.id)===String(id))?.name||id||'—';}
  function queueSort6(a,b){return n6(a.sequence)-n6(b.sequence)||String(a.createdAt||'').localeCompare(String(b.createdAt||''));}

  function runCard6(j,mode='queue'){
    const lp=lineProduction6(j.orderCode),pct=j.qty?Math.min(100,runNet6(j)/n6(j.qty)*100):0;
    const status=j.status;
    const paused=['In pausa','In attesa'].includes(status);
    const blocked=status==='Bloccata';
    const primary=mode==='queue'?`<button class="btn primary" onclick="v106StartRun('${esc6(j.id)}')">Avvia</button>`:paused?`<button class="btn primary" onclick="v106ResumeRun('${esc6(j.id)}')">Riprendi</button>`:`<button class="btn primary" onclick="v5OpenProgress('${esc6(j.id)}')">Aggiorna</button>`;
    return `<article class="v106-run-card ${status==='In produzione'?'running':paused?'paused':blocked?'blocked':''}">
      <div class="v106-run-top"><div><span class="v106-overline">${esc6(machineLabel6(j.machineId))} · ${esc6(moldLabel6(j.moldId))}</span><h3>Ordine ${esc6(j.orderCode)}</h3><p>${esc6(j.client||'')} · ${esc6(j.product||'')}</p></div><span class="v106-state">${esc6(status)}</span></div>
      <div class="v106-big-progress"><div><span>Questo foglio</span><b>${fmt6(runNet6(j))} / ${fmt6(j.qty)} pz</b></div><strong>${pct.toLocaleString('it-IT',{maximumFractionDigits:0})}%</strong></div>
      <div class="v106-progress-track"><i style="width:${pct}%"></i></div>
      <div class="v106-mini-grid"><div><span>Ordine totale prodotto</span><b>${fmt6(lp.net)} / ${fmt6(lp.target)}</b></div><div><span>Scarti foglio</span><b>${fmt6(runScrap6(j))}</b></div><div><span>Operatore</span><b>${esc6(j.operator||'—')}</b></div></div>
      ${j.note?`<div class="v106-note">${esc6(j.note)}</div>`:''}
      <div class="v106-actions">${primary}${mode!=='queue'?`<button class="btn" onclick="v5OpenProgress('${esc6(j.id)}')">Dettagli / stato</button>`:''}<button class="btn" onclick="v106OpenSheetForRun('${esc6(j.id)}')">Foglio</button></div>
    </article>`;
  }

  function messageBlock6(){
    const msgs=(state.directorMessages||[]).filter(m=>m.active!==false).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,3);
    if(typeof currentRole!=='undefined'&&currentRole==='worker'){
      const unread=msgs.filter(m=>!(Array.isArray(m.acknowledgements)&&m.acknowledgements.length));
      if(!unread.length)return '';
      return `<section class="v106-msg-section"><div class="v106-section-title"><div><span>COMUNICAZIONI</span><h2>Da leggere</h2></div></div>${unread.map(m=>`<div class="v106-message ${m.severity==='urgent'?'urgent':''}"><div><b>${m.severity==='urgent'?'URGENTE · ':''}${m.target==='all'?'Tutto il reparto':m.target==='P1'?'Pressa 1':'Pressa 2'}</b><p>${esc6(m.text)}</p><small>${stamp6(m.createdAt)}</small></div><button class="btn primary" onclick="v52OpenAcknowledge('${esc6(m.id)}')">Conferma lettura</button></div>`).join('')}</section>`;
    }
    return `<section class="v106-msg-section"><div class="v106-director-message"><div><span>COMUNICAZIONI AL REPARTO</span><h2>Invia istruzioni agli operatori</h2><p>${msgs.length} messaggi attivi</p></div><button class="btn primary v106-main-cta" onclick="v5OpenMessage()">Invia messaggio agli operatori</button></div></section>`;
  }

  function openSheetForRun6(id){const j=(state.productionRuns||[]).find(r=>String(r.id)===String(id));if(!j)return;const s=sheetForRun6(j,true);save6();if(s&&typeof openSheet==='function')openSheet(s.id);}

  function ensureState6(){
    state.productionRuns=Array.isArray(state.productionRuns)?state.productionRuns:[];
    state.productionSheets=Array.isArray(state.productionSheets)?state.productionSheets:[];
    state.loadingSheetsV106=Array.isArray(state.loadingSheetsV106)?state.loadingSheetsV106:[];
    state.finishedGoodsLots=Array.isArray(state.finishedGoodsLots)?state.finishedGoodsLots:[];
    state.finishedGoodsMovements=Array.isArray(state.finishedGoodsMovements)?state.finishedGoodsMovements:[];
    for(const r of state.productionRuns){
      if(r.status==='In attesa'&&r.pauseFreeMachineV106===true)r.status='In pausa';
      if(r.grossProducedV104==null){r.grossProducedV104=Math.max(0,n6(r.produced)+n6(r.scrap));r.netProducedV104=Math.max(0,n6(r.produced));}
    }
    syncAllOrders6();
    for(const r of state.productionRuns)if(runNet6(r)>0)syncRunLot6(r);
  }

  function loadPendingQty6(parent){return (state.loadingSheetsV106||[]).filter(l=>String(l.parent)===String(parent)&&['In preparazione','Pronto per DDT'].includes(l.status)).reduce((s,l)=>s+Math.max(0,n6(l.qtyPrepared||l.qtyPlanned)-n6(l.qtyLinkedDDT)),0);}
  function readyLoadQty6(parent){return (state.loadingSheetsV106||[]).filter(l=>String(l.parent)===String(parent)&&l.status==='Pronto per DDT').reduce((s,l)=>s+Math.max(0,n6(l.qtyPrepared||l.qtyPlanned)-n6(l.qtyLinkedDDT)),0);}
  function openLoads6(){return (state.loadingSheetsV106||[]).filter(l=>!['Caricato','Annullato'].includes(l.status));}

  function ensureDialogs6(){
    if(!$6('loadingV106Dialog')){
      document.body.insertAdjacentHTML('beforeend',`<dialog id="loadingV106Dialog"><form id="loadingV106Form"><div class="modal-head"><div><span class="eyebrow">Reparto produzione</span><h3>Prepara foglio di carico</h3><p>Registra solo i dati utili al carico. Il DDT resta di competenza dell'Amministrazione.</p></div><button type="button" class="close" data-close="loadingV106Dialog">×</button></div><div class="modal-body"><div class="form-grid"><label class="field full">Ordine<select id="loadingOrderV106" name="parent" required></select></label><div class="notice full" id="loadingInfoV106">Seleziona un ordine.</div><label class="field">Quantità da preparare<input id="loadingQtyV106" type="number" name="qty" min="1" required></label><label class="field">N. pedane<input type="number" name="pallets" min="1" required></label><label class="field">Operatore<input name="operator" list="operatorsListV5" required></label><label class="field">Data preparazione<input type="date" name="date" required></label><label class="field full">Note<textarea name="notes" rows="2" placeholder="Opzionale"></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn" data-close="loadingV106Dialog">Annulla</button><button class="btn primary" type="submit">Crea foglio di carico</button></div></form></dialog>`);
    }
    if(!$6('loadPrintV106Dialog')){
      document.body.insertAdjacentHTML('beforeend',`<dialog id="loadPrintV106Dialog"><div class="modal-head"><div><span class="eyebrow">Logistica</span><h3>Foglio di carico</h3><p>Anteprima stampabile / PDF.</p></div><button type="button" class="close" data-close="loadPrintV106Dialog">×</button></div><div class="modal-body"><div id="loadPrintAreaV106"></div></div><div class="modal-actions"><button type="button" class="btn" data-close="loadPrintV106Dialog">Chiudi</button><button type="button" class="btn primary" id="printLoadV106Btn">Stampa / Salva PDF</button></div></dialog>`);
    }
    const form=$6('loadingV106Form');if(form&&!form.__v106){form.__v106=true;form.onsubmit=submitLoad6;$6('loadingOrderV106').onchange=refreshLoadDialog6;}
    const print=$6('printLoadV106Btn');if(print&&!print.__v106){print.__v106=true;print.onclick=()=>{document.body.classList.add('print-load-v106');window.print();setTimeout(()=>document.body.classList.remove('print-load-v106'),350);};}
  }

  function loadEligible6(){
    return (typeof groupOrders==='function'?groupOrders():[]).filter(g=>!closed6(g.parent)&&Math.max(0,available6(g.parent)-loadPendingQty6(g.parent))>0).sort((a,b)=>String(b.main?.date||'').localeCompare(String(a.main?.date||'')));
  }
  function openLoadDialog6(parent=''){
    ensureDialogs6();const arr=loadEligible6(),sel=$6('loadingOrderV106');
    if(!arr.length){alert('Non ci sono ordini aperti con prodotto fisicamente disponibile.');return;}
    sel.innerHTML='<option value="">Seleziona ordine...</option>'+arr.map(g=>`<option value="${esc6(g.parent)}">Ord. ${esc6(g.parent)} · ${esc6(g.client)} · disponibili ${fmt6(Math.max(0,available6(g.parent)-loadPendingQty6(g.parent)))} pz</option>`).join('');
    const f=$6('loadingV106Form');f.reset();f.elements.date.value=today6();if(parent)sel.value=String(parent);refreshLoadDialog6();try{openDlg('loadingV106Dialog')}catch(_){$6('loadingV106Dialog').showModal();}
  }
  function refreshLoadDialog6(){
    const parent=String($6('loadingOrderV106')?.value||''),info=$6('loadingInfoV106'),q=$6('loadingQtyV106');if(!parent){if(info)info.textContent='Seleziona un ordine.';return;}
    const a=main6(parent),av=available6(parent),reservedLoad=loadPendingQty6(parent),usable=Math.max(0,av-reservedLoad),rem=deliveryRemaining6(parent),pp=parentProduction6(parent);
    if(info)info.innerHTML=`<strong>${esc6(a?.client||'')} · ${esc6(a?.product||'')}</strong><br>Produzione: ${fmt6(pp.net)} / ${fmt6(pp.target)} pz (${pp.pct.toLocaleString('it-IT',{maximumFractionDigits:0})}%) · disponibili fisici ${fmt6(av)} pz<br>Già impegnati in altri fogli di carico: ${fmt6(reservedLoad)} · da consegnare ordine: ${fmt6(rem)} pz`;
    if(q){q.max=usable;q.value=Math.max(1,Math.min(usable,rem||usable));}
  }
  function submitLoad6(e){
    e.preventDefault();const f=new FormData(e.currentTarget),parent=String(f.get('parent')||''),a=main6(parent),qty=Math.max(0,n6(f.get('qty'))),av=Math.max(0,available6(parent)-loadPendingQty6(parent));if(!a||!parent)return;
    if(qty<=0||qty>av){alert(`Quantità non disponibile. Puoi preparare al massimo ${fmt6(av)} pz in questo momento.`);return;}
    const rec={id:uid6('load'),parent,orderCode:a.code,client:a.client,product:a.product,qtyPlanned:qty,qtyPrepared:qty,pallets:Math.max(1,n6(f.get('pallets'))),operator:String(f.get('operator')||'').trim(),date:String(f.get('date')||today6()),notes:String(f.get('notes')||'').trim(),status:'In preparazione',createdAt:nowIso6(),qtyLinkedDDT:0,ddtRefs:[]};
    if(!rec.operator){alert("Inserisci il nome dell'operatore.");return;}
    state.loadingSheetsV106.unshift(rec);audit6('Foglio di carico creato',parent,`${qty} pz · ${rec.pallets} pedane · ${rec.operator}`);save6();try{closeDlg('loadingV106Dialog')}catch(_){}renderProductionV106();toast6('Foglio di carico creato');
  }
  function confirmLoad6(id){const l=(state.loadingSheetsV106||[]).find(x=>x.id===id);if(!l)return;l.status='Pronto per DDT';l.readyAt=nowIso6();audit6('Carico pronto per DDT',l.parent,`${l.qtyPrepared} pz · ${l.pallets} pedane · ${l.operator}`);save6();renderProductionV106();toast6('Amministrazione vede ora il carico come pronto per DDT');}
  function cancelLoad6(id){const l=(state.loadingSheetsV106||[]).find(x=>x.id===id);if(!l)return;if(!confirm('Annullare questo foglio di carico?'))return;l.status='Annullato';l.cancelledAt=nowIso6();save6();renderProductionV106();}
  function printLoad6(id){
    ensureDialogs6();const l=(state.loadingSheetsV106||[]).find(x=>x.id===id),a=l&&main6(l.parent);if(!l||!a)return;
    $6('loadPrintAreaV106').innerHTML=`<div class="v106-load-sheet"><div class="v106-load-sheet-head"><div><span>SMART PACK</span><h1>FOGLIO DI CARICO</h1></div><div><b>${esc6(l.status)}</b><small>${date6(l.date)}</small></div></div><div class="v106-load-sheet-grid"><div><span>Cliente</span><b>${esc6(a.client)}</b></div><div><span>Ordine</span><b>${esc6(l.parent)}</b></div><div class="wide"><span>Prodotto</span><b>${esc6(a.product)}</b></div><div><span>Quantità</span><b>${fmt6(l.qtyPrepared)} pz</b></div><div><span>Pedane</span><b>${fmt6(l.pallets)}</b></div><div><span>Operatore</span><b>${esc6(l.operator)}</b></div><div><span>Data</span><b>${date6(l.date)}</b></div><div class="wide"><span>Note</span><b>${esc6(l.notes||'—')}</b></div></div><div class="v106-load-sign"><span>Firma / controllo carico</span><div></div></div></div>`;
    try{openDlg('loadPrintV106Dialog')}catch(_){$6('loadPrintV106Dialog').showModal();}
  }

  function loadCard6(l){const rem=Math.max(0,n6(l.qtyPrepared||l.qtyPlanned)-n6(l.qtyLinkedDDT));return `<article class="v106-load-card"><div><span class="v106-overline">FOGLIO DI CARICO</span><h3>Ordine ${esc6(l.parent)} · ${esc6(l.client)}</h3><p>${esc6(l.product)}</p></div><div class="v106-load-metrics"><div><span>Da caricare</span><b>${fmt6(rem)} pz</b></div><div><span>Pedane</span><b>${fmt6(l.pallets)}</b></div><div><span>Stato</span><b>${esc6(l.status)}</b></div></div><div class="v106-actions">${l.status==='In preparazione'?`<button class="btn primary" onclick="v106ConfirmLoad('${esc6(l.id)}')">Conferma pronto</button>`:''}<button class="btn" onclick="v106PrintLoad('${esc6(l.id)}')">Foglio</button>${typeof currentRole!=='undefined'&&currentRole==='director'?`<button class="btn" onclick="v106CancelLoad('${esc6(l.id)}')">Annulla</button>`:''}</div></article>`;}

  function renderProductionV106(){
    // Manteniamo l'automazione storica di creazione job, poi ridisegniamo la schermata in modo più semplice.
    if(typeof legacyRenderProduction==='function'){try{legacyRenderProduction()}catch(_){}}
    ensureState6();save6();
    const view=$6('productionView');if(!view)return;
    const role=typeof currentRole!=='undefined'?currentRole:'worker';
    const active=(state.productionRuns||[]).filter(r=>r.status==='In produzione').sort(queueSort6);
    const paused=(state.productionRuns||[]).filter(r=>['In pausa','In attesa','Bloccata'].includes(r.status)).sort(queueSort6);
    const queued=(state.productionRuns||[]).filter(r=>r.status==='In coda').sort(queueSort6);
    const loads=openLoads6().slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const machines=(state.machines||[]).filter(m=>['P1','P2'].includes(m.id));
    const machineSummary=machines.map(m=>{const r=active.find(x=>x.machineId===m.id),b=paused.find(x=>x.machineId===m.id&&x.status==='Bloccata');return `<div class="v106-machine ${r?'busy':b?'blocked':''}"><span>${esc6(machineLabel6(m.id))}</span><b>${r?`Ord. ${esc6(r.orderCode)} · ${fmt6(runNet6(r))}/${fmt6(r.qty)}`:b?`BLOCCATA · Ord. ${esc6(b.orderCode)}`:'LIBERA'}</b></div>`}).join('');
    if(role==='director'){
      view.innerHTML=`${messageBlock6()}<div class="v106-page-head"><div><span class="v106-overline">MONITOR ROBERTO</span><h1>Produzione adesso</h1><p>Prima ciò che richiede una decisione. I dettagli restano disponibili quando servono.</p></div><div class="v106-head-actions"><button class="btn" onclick="navTo('presses')">Presse e stampi</button><button class="btn primary" onclick="openNewOrder()">Nuovo ordine</button></div></div><div class="v106-machine-strip">${machineSummary}</div>
      <section class="v106-section"><div class="v106-section-title"><div><span>IN CORSO</span><h2>Produzioni attive</h2></div><b>${active.length}</b></div><div class="v106-grid">${active.map(j=>runCard6(j,'active')).join('')||'<div class="v106-empty">Nessuna produzione attiva.</div>'}</div></section>
      <section class="v106-section"><div class="v106-section-title"><div><span>DA GESTIRE</span><h2>In pausa / in attesa</h2></div><b>${paused.length}</b></div><div class="v106-grid">${paused.map(j=>runCard6(j,'paused')).join('')||'<div class="v106-empty">Nessuna produzione sospesa.</div>'}</div></section>
      <section class="v106-section"><div class="v106-section-title"><div><span>PIANIFICAZIONE</span><h2>Prossimi lavori</h2></div><b>${queued.length}</b></div><div class="v106-queue-list">${queued.map(j=>runCard6(j,'queue')).join('')||'<div class="v106-empty">Nessun lavoro in coda.</div>'}</div></section>
      <section class="v106-section"><div class="v106-section-title"><div><span>LOGISTICA</span><h2>Carichi in preparazione</h2></div><button class="btn" onclick="v106OpenLoad()">Nuovo foglio di carico</button></div><div class="v106-grid">${loads.map(loadCard6).join('')||'<div class="v106-empty">Nessun carico aperto.</div>'}</div></section>`;
    }else{
      view.innerHTML=`${messageBlock6()}<div class="v106-page-head"><div><span class="v106-overline">REPARTO PRODUZIONE</span><h1>Cosa devo fare adesso?</h1><p>Produzione, carico camion e comunicazioni in una schermata semplice.</p></div><button class="btn primary v106-main-cta" onclick="v106OpenLoad()">Prepara carico camion</button></div><div class="v106-machine-strip">${machineSummary}</div>
      <section class="v106-section"><div class="v106-section-title"><div><span>1 · PRODUZIONE</span><h2>Lavoro attuale</h2></div></div><div class="v106-grid">${active.map(j=>runCard6(j,'active')).join('')||'<div class="v106-empty">Nessuna produzione attiva. Controlla i prossimi lavori.</div>'}</div></section>
      ${paused.length?`<section class="v106-section"><div class="v106-section-title"><div><span>2 · SOSPESE</span><h2>Da riprendere quando possibile</h2></div></div><div class="v106-grid">${paused.map(j=>runCard6(j,'paused')).join('')}</div></section>`:''}
      <section class="v106-section"><div class="v106-section-title"><div><span>3 · PROSSIMI LAVORI</span><h2>Coda produzione</h2></div><b>${queued.length}</b></div><div class="v106-queue-list">${queued.map(j=>runCard6(j,'queue')).join('')||'<div class="v106-empty">Nessun lavoro in coda.</div>'}</div></section>
      <section class="v106-section"><div class="v106-section-title"><div><span>4 · CARICO CAMION</span><h2>Fogli di carico</h2></div><button class="btn primary" onclick="v106OpenLoad()">Nuovo foglio</button></div><div class="v106-grid">${loads.map(loadCard6).join('')||'<div class="v106-empty">Nessun carico da preparare.</div>'}</div></section>`;
    }
    // Il patch V10.5 potrebbe tentare di reinserire il vecchio box: lo rimuoviamo perché V10.6 ha già la CTA corretta.
    setTimeout(()=>{$6('sp105DirectorComms')?.remove();},20);
  }

  function adminGroups6(){return (typeof groupOrders==='function'?groupOrders():[]).filter(g=>!g.main?.cancelled).sort((a,b)=>String(b.main?.date||'').localeCompare(String(a.main?.date||'')));}
  function groupAdminState6(parent){
    const req=requested6(parent),del=delivered6(parent),rem=Math.max(0,req-del),av=available6(parent),prod=parentProduction6(parent),ready=readyLoadQty6(parent),closed=closed6(parent);
    const partial=del>0&&!closed;
    return {req,del,rem,av,prod,ready,closed,partial};
  }
  function adminCard6(g){
    const a=main6(g.parent),s=groupAdminState6(g.parent),load=(state.loadingSheetsV106||[]).find(l=>String(l.parent)===String(g.parent)&&l.status==='Pronto per DDT');
    const prodClass=s.prod.complete?'ok':s.prod.net>0?'warn':'';
    return `<article class="v106-admin-card"><div class="v106-admin-top"><div><span class="v106-overline">ORDINE ${esc6(g.parent)}</span><h3>${esc6(a?.client||'')}</h3><p>${esc6(a?.product||'')}</p></div><span class="v106-state ${s.closed?'ok':''}">${s.closed?'Chiuso':s.ready>0?'Pronto per DDT':s.partial?'Consegna parziale':'Aperto'}</span></div>
      <div class="v106-admin-metrics"><div><span>Produzione</span><b class="${prodClass}">${fmt6(s.prod.net)} / ${fmt6(s.prod.target)}</b><small>${s.prod.complete?'Completa':s.prod.status}</small></div><div><span>Disponibili fisici</span><b>${fmt6(s.av)}</b><small>utilizzabili per consegna</small></div><div><span>Consegnati</span><b>${fmt6(s.del)} / ${fmt6(s.req)}</b><small>residuo ${fmt6(s.rem)}</small></div><div><span>Carico pronto</span><b>${fmt6(s.ready)}</b><small>${load?`${fmt6(load.pallets)} pedane`:'nessun foglio pronto'}</small></div></div>
      <div class="v106-actions">${!s.closed&&s.ready>0?`<button class="btn primary" onclick="v106OpenDDT('${esc6(g.parent)}','${esc6(load?.id||'')}')">Registra DDT</button>`:''}${!s.closed&&s.ready<=0&&s.av>0?`<button class="btn" onclick="v106OpenDDT('${esc6(g.parent)}','')">DDT diretto</button>`:''}${load?`<button class="btn" onclick="v106PrintLoad('${esc6(load.id)}')">Foglio di carico</button>`:''}<button class="btn" onclick="traceOrder('${esc6(g.parent)}')">Dettagli</button></div>
    </article>`;
  }

  function renderAdminV106(){
    ensureState6();const view=$6('adminView');if(!view||!['admin','director'].includes(typeof currentRole!=='undefined'?currentRole:''))return;
    const groups=adminGroups6(),ready=groups.filter(g=>!groupAdminState6(g.parent).closed&&groupAdminState6(g.parent).ready>0),partial=groups.filter(g=>{const s=groupAdminState6(g.parent);return s.partial&&s.ready<=0;}),closed=groups.filter(g=>groupAdminState6(g.parent).closed),prep=groups.filter(g=>{const s=groupAdminState6(g.parent);return !s.closed&&!s.partial&&s.ready<=0;});
    const map={ready,prep,partial,closed};if(!map[adminTabV106]?.length){if(ready.length)adminTabV106='ready';else if(partial.length)adminTabV106='partial';else if(prep.length)adminTabV106='prep';else adminTabV106='closed';}
    const current=map[adminTabV106]||[];
    view.innerHTML=`<div class="v106-page-head"><div><span class="v106-overline">AMMINISTRAZIONE</span><h1>Consegne e DDT</h1><p>Il DDT dipende dalla merce fisicamente disponibile e dal carico preparato, non dal 100% della produzione.</p></div></div>
    <div class="v106-tabs"><button class="${adminTabV106==='ready'?'active':''}" onclick="v106AdminTab('ready')">Pronti per DDT <b>${ready.length}</b></button><button class="${adminTabV106==='prep'?'active':''}" onclick="v106AdminTab('prep')">Da preparare <b>${prep.length}</b></button><button class="${adminTabV106==='partial'?'active':''}" onclick="v106AdminTab('partial')">Consegne parziali <b>${partial.length}</b></button><button class="${adminTabV106==='closed'?'active':''}" onclick="v106AdminTab('closed')">Completati <b>${closed.length}</b></button></div>
    <div class="v106-admin-list">${current.map(adminCard6).join('')||'<div class="v106-empty">Nessun ordine in questa sezione.</div>'}</div>`;
  }

  function adminTab6(tab){adminTabV106=tab;renderAdminV106();}
  function openDDT6(parent,loadId=''){
    selectedLoadV106=String(loadId||'');if(typeof legacyOpenDDT==='function')legacyOpenDDT(parent);else if(typeof window.v53OpenDDT==='function'&&window.v53OpenDDT!==openDDT6)window.v53OpenDDT(parent);
    setTimeout(()=>{const l=(state.loadingSheetsV106||[]).find(x=>x.id===selectedLoadV106),q=$6('deliveryQtyV60'),info=$6('ddtV53Info');if(l&&q){const ready=Math.max(0,n6(l.qtyPrepared)-n6(l.qtyLinkedDDT)),av=available6(parent);q.value=Math.max(1,Math.min(ready,av));if(info)info.insertAdjacentHTML('beforeend',`<div class="v106-ddt-load"><strong>Foglio di carico pronto:</strong> ${fmt6(ready)} pz · ${fmt6(l.pallets)} pedane · operatore ${esc6(l.operator)}</div>`);}},40);
  }

  function markLoadsAfterDDT6(parent,ref,qty){
    let need=Math.max(0,n6(qty));const arr=(state.loadingSheetsV106||[]).filter(l=>String(l.parent)===String(parent)&&l.status==='Pronto per DDT').sort((a,b)=>String(a.readyAt||a.createdAt||'').localeCompare(String(b.readyAt||b.createdAt||'')));
    // Se il DDT è stato aperto da un foglio specifico, consumiamo quello per primo.
    arr.sort((a,b)=>(a.id===selectedLoadV106?-1:b.id===selectedLoadV106?1:0));
    for(const l of arr){if(need<=0)break;const rem=Math.max(0,n6(l.qtyPrepared)-n6(l.qtyLinkedDDT));const use=Math.min(rem,need);if(use<=0)continue;l.qtyLinkedDDT=n6(l.qtyLinkedDDT)+use;l.ddtRefs=Array.isArray(l.ddtRefs)?l.ddtRefs:[];if(ref&&!l.ddtRefs.includes(ref))l.ddtRefs.push(ref);need-=use;if(l.qtyLinkedDDT>=n6(l.qtyPrepared)){l.status='Caricato';l.loadedAt=nowIso6();l.ddtRef=ref;}}
    selectedLoadV106='';
  }

  function patchDDT6(){
    legacyOpenDDT=window.v53OpenDDT;
    window.v106OpenDDT=openDDT6;
    const form=$6('ddtV53Form');if(form&&form.onsubmit&&!form.__v106){
      legacyDDTSubmit=form.onsubmit;form.__v106=true;
      form.onsubmit=function(e){const parent=String(this.elements.parent?.value||''),ref=String(this.elements.ddtRef?.value||''),qty=n6(this.elements.deliveryQty?.value||$6('deliveryQtyV60')?.value),before=(state.deliveryRecords||[]).length;const r=legacyDDTSubmit.call(this,e);setTimeout(()=>{if((state.deliveryRecords||[]).length>before){markLoadsAfterDDT6(parent,ref,qty);save6();if(typeof currentRole!=='undefined'&&['admin','director'].includes(currentRole)&&typeof currentView!=='undefined'&&currentView==='admin')renderAdminV106();}},20);return r;};
    }
  }

  function patchSheetEditor6(){
    const form=$6('sheetRowsForm');if(!form||form.__v106)return;form.__v106=true;
    form.onsubmit=function(e){
      e.preventDefault();const s=(state.productionSheets||[]).find(x=>x.id===selectedSheetId);if(!s)return;const f=new FormData(this);s.productionDate=f.get('productionDate')||s.productionDate||today6();
      (s.rows||[]).forEach((r,i)=>{r.pieces=Math.max(0,n6(f.get(`pieces_${i}`)));r.status=String(f.get(`status_${i}`)||'');r.operatorProduction=String(f.get(`op_${i}`)||'');r.operatorHandles=String(f.get(`handles_${i}`)||'');const ft=String(f.get(`finish_${i}`)||'');r.finishAt=ft?new Date(ft).toLocaleString('it-IT'):'';r.lidColor=String(f.get(`lid_${i}`)||'');r.notes=String(f.get(`notes_${i}`)||'');});
      audit6('Aggiornamento dati foglio',s.orderCode,'Operatori, righe e note aggiornati. Quantità produzione/IML gestite dal Monitor produzione V10.6.');save6();try{closeDlg('sheetRowsDialog')}catch(_){};if(typeof openSheet==='function')openSheet(s.id);toast6('Foglio aggiornato');
    };
  }

  function renderOrdersV106(){
    // Manteniamo il registro commerciale, ma mostriamo subito produzione e consegna come due stati distinti.
    const view=$6('ordersView');if(!view)return;
    const gs=typeof groupOrders==='function'?groupOrders():[];
    view.innerHTML=`<div class="v106-page-head"><div><span class="v106-overline">ORDINI CLIENTI</span><h1>Ordini</h1><p>Produzione e consegna sono separate: un ordine può essere consegnabile anche con produzione incompleta se il magazzino copre il fabbisogno.</p></div><button class="btn primary" onclick="openNewOrder()">Nuovo ordine</button></div><div class="toolbar"><div class="field search"><input id="orderSearchV106" placeholder="Cerca ordine, cliente, prodotto, IML..."></div></div><div id="ordersCardsV106" class="v106-admin-list"></div>`;
    const input=$6('orderSearchV106'),out=$6('ordersCardsV106');
    const draw=()=>{const q=String(input.value||'').toLowerCase();const arr=gs.filter(g=>!q||[g.parent,g.client,g.main?.product,g.main?.imlCode].join(' ').toLowerCase().includes(q));out.innerHTML=arr.map(g=>{const a=g.main,p=parentProduction6(g.parent),del=delivered6(g.parent),av=available6(g.parent),req=requested6(g.parent);return `<article class="v106-admin-card"><div class="v106-admin-top"><div><span class="v106-overline">ORDINE ${esc6(g.parent)}</span><h3>${esc6(g.client)}</h3><p>${esc6(a?.product||'')} · ${fmt6(req)} pz</p></div><span class="v106-state ${closed6(g.parent)?'ok':''}">${closed6(g.parent)?'Chiuso':'Aperto'}</span></div><div class="v106-admin-metrics"><div><span>Produzione</span><b>${fmt6(p.net)} / ${fmt6(p.target)}</b><small>${esc6(p.status)}</small></div><div><span>Disponibili</span><b>${fmt6(av)}</b><small>fisici</small></div><div><span>Consegnati</span><b>${fmt6(del)} / ${fmt6(req)}</b><small>${del&&del<req?'parziale':del>=req&&req?'completo':'non consegnato'}</small></div><div><span>Consegna prevista</span><b>${date6(a?.dueDate)}</b><small>${esc6(a?.imlCode||'ANONIMO')}</small></div></div><div class="v106-actions"><button class="btn" onclick="traceOrder('${esc6(g.parent)}')">Dettagli</button><button class="btn" onclick="navTo('production')">Produzione</button></div></article>`}).join('')||'<div class="v106-empty">Nessun ordine.</div>';};input.oninput=draw;draw();
  }

  function injectStyles6(){
    if($6('sp106Styles'))return;const st=document.createElement('style');st.id='sp106Styles';st.textContent=`
      /* Leggibilità generale */
      body{font-size:14px;line-height:1.45;overflow-x:hidden}.top-title h1{font-size:21px}.top-title p{font-size:13px}.nav button,#sideNav button{font-size:14px!important;min-height:46px!important}.sidebar-foot{font-size:12px}.profile-badge{font-size:12px}.btn{font-size:14px!important;min-height:44px!important;padding:10px 14px}.btn.small{font-size:13px!important;min-height:40px!important}.field{font-size:13px!important;gap:7px}.field input,.field select,.field textarea{font-size:14px!important;min-height:44px;padding:10px 12px}.notice{font-size:13px}.status{font-size:12px}.panel-head h3,.section-head h3{font-size:16px}.panel-head p,.section-head p{font-size:12px}.kpi span,.kpi small{font-size:12px}.metric span{font-size:11px}.metric b{font-size:14px}.order-top h4{font-size:16px}.order-top p{font-size:13px}.data-table th{font-size:11px}.data-table td{font-size:13px}.empty{font-size:13px}.empty b{font-size:15px}.msg-banner p,.msg-banner small,.msg-admin-row span{font-size:13px!important}
      .warn-v106{border-color:#d9a545!important;background:#fff8e9!important;color:#7b5615!important}
      .v106-page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:16px}.v106-page-head h1{font-size:27px;margin:3px 0 5px}.v106-page-head p{font-size:14px;color:var(--muted);margin:0;max-width:760px}.v106-overline{font-size:11px;font-weight:900;letter-spacing:.1em;color:var(--primary);text-transform:uppercase}.v106-head-actions{display:flex;gap:8px;flex-wrap:wrap}.v106-main-cta{font-weight:900!important;min-height:50px!important}
      .v106-director-message{display:flex;align-items:center;justify-content:space-between;gap:18px;background:linear-gradient(135deg,#eef8fb,#f7fcfd);border:1px solid #bcd9e2;border-radius:18px;padding:18px 20px;margin-bottom:18px}.v106-director-message span{font-size:11px;font-weight:900;letter-spacing:.08em;color:var(--primary)}.v106-director-message h2{font-size:20px;margin:3px 0}.v106-director-message p{font-size:13px;color:var(--muted);margin:0}.v106-message{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid #bfd9e3;background:#f5fbfd;border-radius:16px;padding:15px 16px;margin-bottom:10px}.v106-message.urgent{border-color:#e7bd78;background:#fff9ed}.v106-message b{font-size:15px}.v106-message p{font-size:14px;margin:4px 0}.v106-message small{font-size:12px;color:var(--muted)}
      .v106-machine-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}.v106-machine{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cfe2e7;background:#f8fcfd;border-radius:14px;padding:13px 15px}.v106-machine span{font-size:13px;font-weight:800}.v106-machine b{font-size:15px;color:#26755f}.v106-machine.busy b{color:var(--primary)}.v106-machine.blocked b{color:var(--danger)}
      .v106-section{margin-top:22px}.v106-section-title{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:11px}.v106-section-title span{font-size:10px;letter-spacing:.1em;font-weight:900;color:var(--muted)}.v106-section-title h2{font-size:20px;margin:2px 0 0}.v106-section-title>b{display:grid;place-items:center;min-width:34px;height:34px;border-radius:999px;background:var(--soft);font-size:14px}.v106-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v106-queue-list{display:grid;gap:10px}.v106-empty{border:1px dashed #cbdde2;border-radius:14px;padding:20px;font-size:14px;color:var(--muted);background:#fafcfc}
      .v106-run-card,.v106-load-card,.v106-admin-card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:16px;box-shadow:0 5px 16px rgba(25,64,79,.045);min-width:0}.v106-run-card.running{border-color:#9fcfc1}.v106-run-card.paused{border-color:#e2c98b;background:#fffdf8}.v106-run-card.blocked{border-color:#e5b2b5;background:#fffafa}.v106-run-top,.v106-admin-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v106-run-top h3,.v106-admin-top h3,.v106-load-card h3{font-size:18px;margin:3px 0}.v106-run-top p,.v106-admin-top p,.v106-load-card p{font-size:13px;color:var(--muted);margin:0}.v106-state{display:inline-flex;padding:6px 9px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:900;white-space:nowrap}.v106-state.ok{background:#eaf7f1;color:#1f7d5f}.v106-big-progress{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:15px}.v106-big-progress span{display:block;font-size:12px;color:var(--muted)}.v106-big-progress b{display:block;font-size:18px;margin-top:2px}.v106-big-progress>strong{font-size:25px;color:var(--primary)}.v106-progress-track{height:9px;background:#e2ecef;border-radius:999px;overflow:hidden;margin:8px 0 12px}.v106-progress-track i{display:block;height:100%;background:linear-gradient(90deg,#1f5e78,#2d9b86);border-radius:999px}.v106-mini-grid,.v106-load-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v106-mini-grid>div,.v106-load-metrics>div{border:1px solid #e5edef;background:#fafcfc;border-radius:10px;padding:9px;min-width:0}.v106-mini-grid span,.v106-load-metrics span{display:block;font-size:11px;color:var(--muted)}.v106-mini-grid b,.v106-load-metrics b{display:block;font-size:14px;margin-top:3px;overflow-wrap:anywhere}.v106-note{font-size:13px;margin-top:10px;border-left:3px solid #d5a24d;padding:8px 10px;background:#fff9ee;border-radius:8px}.v106-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
      .v106-load-card{border-left:4px solid #2d9b86}.v106-load-metrics{margin-top:13px}.v106-admin-list{display:grid;gap:11px}.v106-admin-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:13px}.v106-admin-metrics>div{border:1px solid #e3ecef;border-radius:11px;padding:10px;min-width:0}.v106-admin-metrics span{display:block;font-size:11px;color:var(--muted)}.v106-admin-metrics b{display:block;font-size:16px;margin-top:3px}.v106-admin-metrics b.ok{color:var(--ok)}.v106-admin-metrics b.warn{color:#9a6818}.v106-admin-metrics small{display:block;font-size:11px;color:var(--muted);margin-top:3px}.v106-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.v106-tabs button{border:1px solid var(--line);background:#fff;border-radius:13px;padding:12px;font-size:13px;font-weight:800;color:#526872}.v106-tabs button.active{background:var(--primary);border-color:var(--primary);color:white}.v106-tabs b{margin-left:4px}.v106-ddt-load{margin-top:9px;padding:9px 10px;background:#eaf7f1;border-radius:9px;color:#24634f}
      .v106-load-sheet{background:white;border:1px solid #bbb;padding:18mm 15mm;color:#111}.v106-load-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #222;padding-bottom:12px}.v106-load-sheet-head span{font-size:12px;font-weight:900;letter-spacing:.12em}.v106-load-sheet-head h1{font-size:25px;margin:4px 0}.v106-load-sheet-head>div:last-child{text-align:right}.v106-load-sheet-head small{display:block;margin-top:4px}.v106-load-sheet-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #555;margin-top:16px}.v106-load-sheet-grid>div{padding:12px;border-right:1px solid #777;border-bottom:1px solid #777}.v106-load-sheet-grid>div:nth-child(even){border-right:0}.v106-load-sheet-grid .wide{grid-column:1/-1;border-right:0}.v106-load-sheet-grid span{display:block;font-size:10px;text-transform:uppercase;color:#555}.v106-load-sheet-grid b{display:block;font-size:15px;margin-top:4px}.v106-load-sign{margin-top:38px}.v106-load-sign span{font-size:12px}.v106-load-sign div{border-bottom:1px solid #333;height:55px}
      #progressRunDialog .modal-actions{flex-wrap:wrap}
      @media(max-width:900px){.v106-grid{grid-template-columns:1fr}.v106-admin-metrics{grid-template-columns:1fr 1fr}.v106-page-head{align-items:stretch}.v106-head-actions{justify-content:flex-end}}
      @media(max-width:600px){
        html{font-size:16px}body{font-size:16px!important}.content{padding-left:12px!important;padding-right:12px!important;overflow-x:hidden}.topbar{min-height:68px!important}.top-title h1{font-size:20px!important}.mobile-nav button{font-size:11px!important}
        .btn,.btn.small{font-size:15px!important;min-height:48px!important;padding:11px 13px!important}.field{font-size:14px!important}.field input,.field select,.field textarea{font-size:16px!important;min-height:48px!important}.notice,.status{font-size:13px!important}.panel-head h3,.section-head h3{font-size:17px!important}.panel-head p,.section-head p{font-size:13px!important}.data-table td{font-size:14px!important}.data-table th{font-size:12px!important}.kpi span,.kpi small{font-size:13px!important}.kpi b{font-size:23px!important}
        .v106-page-head{display:block;margin-bottom:14px}.v106-page-head h1{font-size:24px}.v106-page-head p{font-size:15px}.v106-page-head>.btn,.v106-head-actions{width:100%;margin-top:12px}.v106-head-actions{display:grid;grid-template-columns:1fr}.v106-head-actions .btn,.v106-main-cta{width:100%}.v106-director-message,.v106-message{display:block;padding:15px}.v106-director-message h2{font-size:19px}.v106-director-message p,.v106-message p{font-size:15px}.v106-director-message .btn,.v106-message .btn{width:100%;margin-top:12px}.v106-machine-strip{grid-template-columns:1fr}.v106-machine{padding:13px}.v106-machine span{font-size:14px}.v106-machine b{font-size:15px}.v106-section{margin-top:19px}.v106-section-title{align-items:center}.v106-section-title h2{font-size:19px}.v106-section-title .btn{width:auto;min-height:44px!important;font-size:14px!important}.v106-run-card,.v106-load-card,.v106-admin-card{padding:14px;border-radius:15px}.v106-run-top,.v106-admin-top{display:block}.v106-state{margin-top:8px;font-size:13px}.v106-run-top h3,.v106-admin-top h3,.v106-load-card h3{font-size:19px}.v106-run-top p,.v106-admin-top p,.v106-load-card p{font-size:14px}.v106-big-progress b{font-size:18px}.v106-big-progress>strong{font-size:25px}.v106-mini-grid,.v106-load-metrics,.v106-admin-metrics{grid-template-columns:1fr 1fr}.v106-mini-grid span,.v106-load-metrics span,.v106-admin-metrics span{font-size:12px}.v106-mini-grid b,.v106-load-metrics b,.v106-admin-metrics b{font-size:15px}.v106-admin-metrics small{font-size:12px}.v106-actions{display:grid;grid-template-columns:1fr}.v106-actions .btn{width:100%}.v106-tabs{display:flex;overflow-x:auto;gap:7px;padding-bottom:4px;-webkit-overflow-scrolling:touch}.v106-tabs button{flex:0 0 auto;min-height:46px;font-size:14px;padding:10px 12px}.form-grid{grid-template-columns:1fr!important}.form-grid .full{grid-column:1!important}dialog{width:calc(100vw - 8px)!important;max-width:calc(100vw - 8px)!important;max-height:97dvh!important;margin:auto 4px 0!important}.modal-head h3{font-size:20px!important}.modal-head p{font-size:14px!important}.modal-body{max-height:70dvh!important}.modal-actions{display:grid!important;grid-template-columns:1fr!important}.modal-actions .btn{width:100%!important}.table-wrap{max-width:100%;overflow-x:auto}.sheet-preview{font-size:11px}.v106-load-sheet{padding:8mm 6mm}.v106-load-sheet-head h1{font-size:20px}.v106-load-sheet-grid{grid-template-columns:1fr}.v106-load-sheet-grid .wide{grid-column:1}.v106-load-sheet-grid>div{border-right:0}
      }
      @media(max-width:380px){.v106-mini-grid,.v106-load-metrics,.v106-admin-metrics{grid-template-columns:1fr}.v106-section-title{display:block}.v106-section-title>.btn{width:100%;margin-top:8px}}
      @media print{body.print-load-v106 *{visibility:hidden!important}body.print-load-v106 #loadPrintV106Dialog,body.print-load-v106 #loadPrintV106Dialog *{visibility:visible!important}body.print-load-v106 #loadPrintV106Dialog{display:block!important;position:absolute!important;inset:0!important;width:100%!important;max-width:100%!important;max-height:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important}body.print-load-v106 #loadPrintV106Dialog .modal-head,body.print-load-v106 #loadPrintV106Dialog .modal-actions{display:none!important}body.print-load-v106 #loadPrintV106Dialog .modal-body{padding:0!important;max-height:none!important;overflow:visible!important}.v106-load-sheet{border:0!important;padding:10mm!important}}
    `;document.head.appendChild(st);
  }

  function patchVersion6(){
    document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · V10.6';
    try{document.body.dataset.build='PIATTAFORMA-GRUPPO-V10.6';}catch(_){}
    document.querySelectorAll('.version-badge').forEach(x=>x.textContent='V10.6');
  }

  function patchFunctions6(){
    legacyRenderProduction=renderProduction;
    legacyOpenProgress=window.v5OpenProgress;
    legacyOpenStart=window.v5OpenStart;
    legacyRenderOrders=typeof renderOrders==='function'?renderOrders:null;
    window.v5OpenProgress=openProgressV106;try{v5OpenProgress=openProgressV106}catch(_){}
    window.v106ResumeRun=resumeRun6;window.v106StartRun=startRun6;window.v106OpenSheetForRun=openSheetForRun6;
    window.v106OpenLoad=openLoadDialog6;window.v106ConfirmLoad=confirmLoad6;window.v106CancelLoad=cancelLoad6;window.v106PrintLoad=printLoad6;
    window.v106AdminTab=adminTab6;
    renderProduction=renderProductionV106;window.renderProduction=renderProductionV106;
    try{renderOrders=renderOrdersV106;window.renderOrders=renderOrdersV106}catch(_){}
    window.renderAdminV53=renderAdminV106;
    const form=$6('progressRunForm');if(form){form.onsubmit=e=>{e.preventDefault();saveRunV106('save');};}
    const done=$6('completeRunBtn');if(done)done.onclick=()=>saveRunV106('complete');
    patchSheetEditor6();patchDDT6();
    const startForm=$6('startRunForm');if(startForm&&startForm.onsubmit&&!startForm.__v106){const old=startForm.onsubmit;startForm.__v106=true;startForm.onsubmit=function(e){const r=old.call(this,e);setTimeout(()=>{syncAllOrders6();save6();if(typeof currentView!=='undefined'&&currentView==='production')renderProductionV106();},25);return r;};}
  }

  function reassertLate6(){
    // V10.3/V10.4 hanno alcuni hook ritardati: V10.6 deve restare l'ultimo livello operativo.
    window.v5OpenProgress=openProgressV106;try{v5OpenProgress=openProgressV106}catch(_){}
    renderProduction=renderProductionV106;window.renderProduction=renderProductionV106;
    try{renderOrders=renderOrdersV106;window.renderOrders=renderOrdersV106}catch(_){}
    window.renderAdminV53=renderAdminV106;
    const form=$6('progressRunForm');if(form)form.onsubmit=e=>{e.preventDefault();saveRunV106('save');};
    const done=$6('completeRunBtn');if(done)done.onclick=()=>saveRunV106('complete');
    // Il foglio resta documentale: non deve mai segnare una consegna o scalare IML da solo.
    const sf=$6('sheetRowsForm');if(sf){sf.__v106=false;patchSheetEditor6();}
    patchVersion6();
    if(typeof currentView!=='undefined'){if(currentView==='production')renderProductionV106();else if(currentView==='admin')renderAdminV106();else if(currentView==='orders')renderOrdersV106();}
  }

  function boot6(){
    injectStyles6();ensureDialogs6();ensureState6();patchFunctions6();patchVersion6();save6();
    setTimeout(()=>{patchVersion6();if(typeof currentView!=='undefined'){if(currentView==='production')renderProductionV106();else if(currentView==='admin')renderAdminV106();else if(currentView==='orders')renderOrdersV106();}},450);
    setTimeout(reassertLate6,1650);
    setTimeout(reassertLate6,2300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot6,{once:true});else boot6();
})();


/* ===== migrated from v107-patch.js ===== */
/* Smart Pack · Multiplast — V10.7
   Storico aggiornamenti produzione + correzione caricamento layer V10.6.
   Obiettivo: rendere tracciabile ogni avanzamento senza appesantire la home.
*/
(function(){
  'use strict';
  const V='10.7';
  const $7=id=>document.getElementById(id);
  const n7=v=>Number(v||0);
  const esc7=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt7=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(n7(v));
  const stamp7=v=>{if(!v)return '—';try{return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v));}catch(_){return String(v)}};
  const runNet7=r=>Math.max(0,n7(r?.netProducedV104!=null?r.netProducedV104:r?.produced));
  const runGross7=r=>Math.max(0,n7(r?.grossProducedV104!=null?r.grossProducedV104:runNet7(r)+n7(r?.scrap)));
  const runScrap7=r=>Math.max(0,n7(r?.scrap));

  let currentHistoryScope=null;

  function machine7(id){const m=(state.machines||[]).find(x=>String(x.id)===String(id));return m?.name||(id==='P1'?'Pressa 1':id==='P2'?'Pressa 2':String(id||'Pressa'));}
  function mainOrder7(parent){const ls=(state.orders||[]).filter(o=>String(o.parent)===String(parent)&&!o.cancelled);return ls.find(o=>String(o.code||'').endsWith('A'))||ls[0]||null;}
  function relevantRuns7(scope){
    const arr=(state.productionRuns||[]).filter(r=>!r.warehouseProduction&&r.status!=='Annullata');
    return scope.type==='run'?arr.filter(r=>String(r.id)===String(scope.id)):arr.filter(r=>String(r.parent)===String(scope.parent));
  }
  function orderTarget7(parent){const a=mainOrder7(parent);return Math.max(0,n7(a?.qty));}

  function statusLabel7(v){
    const s=String(v||'').toLowerCase();
    if(s.includes('complet'))return 'Completata';
    if(s.includes('parzial'))return 'Chiuso parziale';
    if(s.includes('pausa'))return 'In pausa';
    if(s.includes('attesa'))return 'In attesa';
    if(s.includes('bloccat'))return 'Bloccata';
    if(s.includes('produzione'))return 'In produzione';
    if(s.includes('coda'))return 'In coda';
    return v||'Aggiornamento';
  }

  function timeline7(scope){
    const runs=relevantRuns7(scope),ids=new Set(runs.map(r=>String(r.id))),items=[];
    for(const e of (state.productionEvents||[])){
      if(!ids.has(String(e.runId)))continue;
      const r=runs.find(x=>String(x.id)===String(e.runId));
      items.push({
        type:'qty',at:e.at||'',runId:e.runId,orderCode:e.orderCode||r?.orderCode||'',machineId:e.machineId||r?.machineId||'',
        operator:e.operator||r?.operator||'',note:e.note||'',kind:e.kind||'aggiornamento produzione',
        dg:n7(e.deltaGrossPiecesV104),ds:n7(e.deltaScrap),dn:n7(e.deltaPieces),
        cg:e.cumulativeGrossV107,cs:e.cumulativeScrapV107,cn:e.cumulativeNetV107
      });
    }
    for(const r of runs){
      for(const h of (Array.isArray(r.statusHistory)?r.statusHistory:[])){
        items.push({type:'status',at:h.at||'',runId:r.id,orderCode:r.orderCode,machineId:h.machineId||r.machineId,operator:h.operator||r.operator||'',note:h.note||'',from:h.from||'',to:h.to||''});
      }
      if(r.startAt&&!items.some(x=>x.runId===r.id&&x.type==='status'&&Math.abs(new Date(x.at)-new Date(r.startAt))<5000))items.push({type:'status',at:r.startAt,runId:r.id,orderCode:r.orderCode,machineId:r.machineId,operator:r.operator||'',from:'In coda',to:'In produzione',note:'Avvio produzione'});
    }
    return items.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  }

  function summary7(scope){
    const rs=relevantRuns7(scope);
    const gross=rs.reduce((s,r)=>s+runGross7(r),0),scrap=rs.reduce((s,r)=>s+runScrap7(r),0),net=rs.reduce((s,r)=>s+runNet7(r),0);
    const target=scope.type==='run'?Math.max(0,n7(rs[0]?.qty)):orderTarget7(scope.parent);
    return {gross,scrap,net,target,remaining:Math.max(0,target-net)};
  }

  function ensureDialog7(){
    if($7('historyV107Dialog'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="historyV107Dialog" class="v107-history-dialog"><div class="modal-head"><div><span class="eyebrow">Tracciabilità produzione</span><h3 id="historyV107Title">Storico produzione</h3><p id="historyV107Subtitle">Aggiornamenti registrati nel tempo.</p></div><button type="button" class="close" id="historyV107Close">×</button></div><div class="modal-body"><div id="historyV107Summary"></div><div id="historyV107Body"></div></div><div class="modal-actions"><button type="button" class="btn" id="historyV107CloseBottom">Chiudi</button></div></dialog>`);
    const close=()=>{try{$7('historyV107Dialog').close();}catch(_){}};
    $7('historyV107Close').onclick=close;$7('historyV107CloseBottom').onclick=close;
  }

  function itemHTML7(x){
    const r=(state.productionRuns||[]).find(z=>String(z.id)===String(x.runId));
    const machine=machine7(x.machineId||r?.machineId),op=x.operator||r?.operator||'—';
    if(x.type==='qty'){
      const details=`<div class="v107-deltas"><span><b>+${fmt7(x.dg)}</b> lordi</span><span><b>+${fmt7(x.ds)}</b> scarti</span><span><b>+${fmt7(x.dn)}</b> netti</span></div>`;
      const cum=x.cn!=null?`<small>Totale dopo aggiornamento: ${fmt7(x.cg)} lordi · ${fmt7(x.cs)} scarti · ${fmt7(x.cn)} netti</small>`:'';
      return `<article class="v107-history-item qty"><div class="v107-history-dot"></div><div class="v107-history-content"><div class="v107-history-head"><div><b>${esc7(statusLabel7(x.kind))}</b><span>${stamp7(x.at)}</span></div><em>${esc7(machine)}</em></div>${details}${cum}<p>Operatore: <strong>${esc7(op)}</strong>${x.note?` · Nota: ${esc7(x.note)}`:''}</p></div></article>`;
    }
    return `<article class="v107-history-item status"><div class="v107-history-dot"></div><div class="v107-history-content"><div class="v107-history-head"><div><b>${esc7(statusLabel7(x.to))}</b><span>${stamp7(x.at)}</span></div><em>${esc7(machine)}</em></div><p>${x.from?`${esc7(statusLabel7(x.from))} → `:''}<strong>${esc7(statusLabel7(x.to))}</strong>${x.note?` · ${esc7(x.note)}`:''}</p><small>Operatore: ${esc7(op)}</small></div></article>`;
  }

  function openHistory7(scope){
    ensureDialog7();currentHistoryScope=scope;
    const rs=relevantRuns7(scope);if(!rs.length){alert('Nessuna produzione trovata per questo ordine.');return;}
    const parent=scope.parent||rs[0]?.parent||'',a=mainOrder7(parent),sum=summary7({...scope,parent}),items=timeline7({...scope,parent});
    const isRun=scope.type==='run',r=rs[0];
    $7('historyV107Title').textContent=isRun?`Storico · Ordine ${r.orderCode}`:`Storico produzione · Ordine ${parent}`;
    $7('historyV107Subtitle').textContent=isRun?`${machine7(r.machineId)} · ${r.product||a?.product||''}`:`${a?.client||''} · ${a?.product||''}`;
    $7('historyV107Summary').innerHTML=`<div class="v107-history-summary"><div><span>Lordo</span><b>${fmt7(sum.gross)}</b></div><div><span>Scarti</span><b>${fmt7(sum.scrap)}</b></div><div><span>Netto</span><b>${fmt7(sum.net)}</b></div><div><span>${sum.remaining>0?'Residuo':'Obiettivo'}</span><b>${fmt7(sum.remaining>0?sum.remaining:sum.target)}</b></div></div>`;
    const role=typeof currentRole!=='undefined'?currentRole:'worker';
    const visible=role==='worker'?items.slice(0,6):items;
    $7('historyV107Body').innerHTML=visible.length?`<div class="v107-history-timeline">${visible.map(itemHTML7).join('')}</div>${role==='worker'&&items.length>6?`<div class="v107-history-more">Mostrati gli ultimi 6 eventi. Roberto e Amministrazione vedono lo storico completo.</div>`:''}`:'<div class="v107-history-empty">Nessun aggiornamento registrato. I prossimi avanzamenti appariranno qui automaticamente.</div>';
    try{$7('historyV107Dialog').showModal();}catch(_){ }
  }

  function parseId7(card){
    const html=[...card.querySelectorAll('button[onclick]')].map(b=>b.getAttribute('onclick')||'').join(' ');
    let m=html.match(/(?:v5OpenProgress|v106StartRun|v106ResumeRun|v106OpenSheetForRun)\('([^']+)'\)/);return m?.[1]||'';
  }
  function parseParent7(card){
    const html=[...card.querySelectorAll('button[onclick]')].map(b=>b.getAttribute('onclick')||'').join(' ');
    let m=html.match(/(?:traceOrder|v106OpenDDT)\('([^']+)'/);return m?.[1]||'';
  }

  function decorateProduction7(){
    const view=$7('productionView');if(!view)return;
    view.querySelectorAll('.v106-run-card').forEach(card=>{
      if(card.dataset.historyV107==='1')return;const id=parseId7(card);if(!id)return;card.dataset.historyV107='1';
      const actions=card.querySelector('.v106-actions');if(!actions)return;const b=document.createElement('button');b.type='button';b.className='btn v107-history-btn';b.textContent=(typeof currentRole!=='undefined'&&currentRole==='worker')?'Ultimi aggiornamenti':'Storico';b.onclick=()=>window.v107OpenRunHistory(id);actions.appendChild(b);
    });
  }
  function decorateAdmin7(rootId){
    const view=$7(rootId);if(!view)return;
    view.querySelectorAll('.v106-admin-card').forEach(card=>{
      if(card.dataset.historyV107==='1')return;const parent=parseParent7(card);if(!parent)return;card.dataset.historyV107='1';
      const actions=card.querySelector('.v106-actions');if(!actions)return;const b=document.createElement('button');b.type='button';b.className='btn v107-history-btn';b.textContent='Storico produzione';b.onclick=()=>window.v107OpenOrderHistory(parent);actions.appendChild(b);
    });
  }

  function enrichLatestEvent7(runId,operator,note){
    const e=(state.productionEvents||[]).find(x=>String(x.runId)===String(runId));if(!e)return;
    const r=(state.productionRuns||[]).find(x=>String(x.id)===String(runId));
    if(!e.operator)e.operator=operator||r?.operator||'';if(!e.note)e.note=note||r?.note||'';
    if(e.cumulativeGrossV107==null&&r)e.cumulativeGrossV107=runGross7(r);if(e.cumulativeScrapV107==null&&r)e.cumulativeScrapV107=runScrap7(r);if(e.cumulativeNetV107==null&&r)e.cumulativeNetV107=runNet7(r);
    try{save();}catch(_){ }
  }

  function patchProgressTracking7(){
    const oldOpen=window.v5OpenProgress;if(typeof oldOpen==='function'&&!oldOpen.__v107){
      const wrapped=function(id){window.__spV107CurrentRun=String(id);const r=oldOpen.apply(this,arguments);setTimeout(()=>patchProgressButtons7(),90);return r;};wrapped.__v107=true;window.v5OpenProgress=wrapped;try{v5OpenProgress=wrapped;}catch(_){ }
    }
    patchProgressButtons7();
  }
  function patchProgressButtons7(){
    const dlg=$7('progressRunDialog');if(!dlg||dlg.dataset.trackV107==='1')return;dlg.dataset.trackV107='1';
    dlg.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;if(!['pauseRunV106Btn','partialCloseV106Btn','completeRunBtn'].includes(b.id))return;const id=window.__spV107CurrentRun||'';const op=String($7('progressOperator')?.value||''),note=String($7('progressNote')?.value||'');setTimeout(()=>enrichLatestEvent7(id,op,note),80);},true);
    const f=$7('progressRunForm');if(f)f.addEventListener('submit',function(){const id=window.__spV107CurrentRun||'';const op=String($7('progressOperator')?.value||''),note=String($7('progressNote')?.value||'');setTimeout(()=>enrichLatestEvent7(id,op,note),80);},true);
  }

  function styles7(){
    if($7('sp107Styles'))return;const s=document.createElement('style');s.id='sp107Styles';s.textContent=`
      .v107-history-btn{border-color:#c8dce2!important;background:#f7fbfc!important;color:#1f5e78!important}
      .v107-history-dialog{width:min(820px,calc(100vw - 24px))!important}.v107-history-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:18px}.v107-history-summary>div{border:1px solid #dce8eb;background:#f8fbfc;border-radius:13px;padding:12px}.v107-history-summary span{display:block;font-size:12px;color:#6d7f8b}.v107-history-summary b{display:block;font-size:21px;margin-top:3px;color:#17394a}.v107-history-timeline{display:grid;gap:0}.v107-history-item{display:grid;grid-template-columns:18px 1fr;gap:10px;position:relative;padding:0 0 16px}.v107-history-item:not(:last-child):before{content:"";position:absolute;left:7px;top:15px;bottom:-1px;width:2px;background:#dbe6e9}.v107-history-dot{width:16px;height:16px;border-radius:50%;background:#1f5e78;border:4px solid #e8f3f6;position:relative;z-index:1}.v107-history-item.status .v107-history-dot{background:#b97850;border-color:#f6ece6}.v107-history-content{border:1px solid #e0e9ec;border-radius:14px;padding:12px 13px;background:#fff;min-width:0}.v107-history-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v107-history-head b{display:block;font-size:15px}.v107-history-head span{display:block;font-size:12px;color:#6d7f8b;margin-top:2px}.v107-history-head em{font-style:normal;font-size:12px;font-weight:800;color:#1f5e78;background:#edf5f7;border-radius:999px;padding:5px 8px;white-space:nowrap}.v107-history-content p{font-size:13px;margin:8px 0 0;line-height:1.5}.v107-history-content small{display:block;font-size:12px;color:#6d7f8b;margin-top:6px}.v107-deltas{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.v107-deltas span{font-size:12px;background:#f5f8f9;border-radius:9px;padding:8px}.v107-deltas b{font-size:15px}.v107-history-more,.v107-history-empty{font-size:13px;color:#6d7f8b;background:#f7fafb;border-radius:12px;padding:12px;text-align:center}
      @media(max-width:600px){.v107-history-dialog{width:calc(100vw - 8px)!important;max-width:calc(100vw - 8px)!important}.v107-history-summary{grid-template-columns:1fr 1fr}.v107-history-summary span{font-size:13px}.v107-history-summary b{font-size:22px}.v107-history-head{display:block}.v107-history-head b{font-size:17px}.v107-history-head span,.v107-history-head em{font-size:13px}.v107-history-head em{display:inline-flex;margin-top:7px}.v107-history-content p,.v107-history-content small{font-size:14px}.v107-deltas{grid-template-columns:1fr}.v107-deltas span{font-size:14px}.v107-deltas b{font-size:17px}}
    `;document.head.appendChild(s);
  }

  function version7(){document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · V10.7';try{document.body.dataset.build='PIATTAFORMA-GRUPPO-V10.7';}catch(_){}document.querySelectorAll('.version-badge').forEach(x=>x.textContent='V10.7');}
  function observe7(){
    ['productionView','adminView','ordersView'].forEach(id=>{const el=$7(id);if(!el||el.dataset.observerV107==='1')return;el.dataset.observerV107='1';new MutationObserver(()=>{if(id==='productionView')decorateProduction7();else decorateAdmin7(id);}).observe(el,{childList:true,subtree:true});});
  }
  function refresh7(){decorateProduction7();decorateAdmin7('adminView');decorateAdmin7('ordersView');version7();patchProgressTracking7();}
  function boot7(){styles7();ensureDialog7();observe7();patchProgressTracking7();version7();setTimeout(refresh7,250);setTimeout(refresh7,1900);setTimeout(refresh7,2700);}

  window.v107OpenRunHistory=id=>{const r=(state.productionRuns||[]).find(x=>String(x.id)===String(id));if(!r)return;openHistory7({type:'run',id:String(id),parent:r.parent});};
  window.v107OpenOrderHistory=parent=>openHistory7({type:'order',parent:String(parent)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot7,{once:true});else boot7();
})();


/* ===== migrated from v108-patch.js ===== */
/* Smart Pack · Multiplast — V10.8
   Hotfix cloud / stabilità: arresta la crescita duplicata dei productionRuns,
   ripulisce lo stato prima dei render e mantiene la UI utilizzabile durante il sync.
*/
(function(){
  'use strict';
  const BUILD='V11.4';
  const MARKER='PIATTAFORMA-GRUPPO-V11.4';
  let repairedOnce=false;

  function arr(v){return Array.isArray(v)?v:[];}
  function t(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:0;}
  function runScore(r){
    const active=String(r?.status||'')==='Annullata'?0:1;
    return active*1e15+t(r?.createdAt||r?.startAt||r?.endAt||'');
  }

  function dedupeRuns108(){
    if(!window.state && typeof state==='undefined')return {changed:false,before:0,after:0};
    const st=typeof state!=='undefined'?state:window.state;
    const src=arr(st.productionRuns);
    const byId=new Map(), anonymous=[];
    for(const r of src){
      if(!r||typeof r!=='object')continue;
      const id=String(r.id||'').trim();
      if(!id){anonymous.push(r);continue;}
      const prev=byId.get(id);
      if(!prev||runScore(r)>=runScore(prev))byId.set(id,r);
    }
    const next=[...byId.values(),...anonymous];
    const changed=next.length!==src.length;
    if(changed)st.productionRuns=next;
    return {changed,before:src.length,after:next.length};
  }

  function normalize108(){
    if(!window.state && typeof state==='undefined')return {changed:false,before:0,after:0};
    const st=typeof state!=='undefined'?state:window.state;
    const keys=['orders','imls','imlPurchaseOrders','productionSheets','productionRuns','productionEvents','production','machines','molds','operators','directorMessages','deliveryRecords','finishedGoodsLots','finishedGoodsMovements','imlLots','imlUsageEvents','warehouseAllocations','warehousePreparationEvents','loadingSheetsV106','audit'];
    for(const k of keys)if(!Array.isArray(st[k]))st[k]=[];
    for(const s of st.productionSheets)if(s&&typeof s==='object'&&!Array.isArray(s.rows))s.rows=[];
    return dedupeRuns108();
  }

  function patchRender108(){
    try{
      const old=renderCurrent;
      if(typeof old==='function'&&!old.__sp108){
        const wrapped=function(){normalize108();return old.apply(this,arguments);};
        wrapped.__sp108=true;
        renderCurrent=wrapped;window.renderCurrent=wrapped;
      }
    }catch(_){ }
    try{
      const oldD=renderDashboard;
      if(typeof oldD==='function'&&!oldD.__sp108){
        const wrappedD=function(){normalize108();return oldD.apply(this,arguments);};
        wrappedD.__sp108=true;
        renderDashboard=wrappedD;window.renderDashboard=wrappedD;
      }
    }catch(_){ }
  }

  function version108(){
    document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;
    try{document.body.dataset.build=MARKER;}catch(_){ }
    document.querySelectorAll('.version-badge').forEach(x=>x.textContent=BUILD);
  }

  function persistRepair108(){
    const r=normalize108();
    if(r.changed||!repairedOnce){
      repairedOnce=true;
      try{save();}catch(_){try{localStorage.setItem('industrial_os_v2_state',JSON.stringify(typeof state!=='undefined'?state:window.state));}catch(__){ }}
      try{console.info('[V10.8] productionRuns ripuliti',r.before,'→',r.after);}catch(_){ }
    }
    version108();
  }

  // Patch immediato: deve essere attivo prima che il caricamento cloud inizi ad applicare i segmenti.
  normalize108();
  patchRender108();
  version108();

  function boot108(){
    normalize108();patchRender108();version108();
    // Dopo che pullAllSegments imposta remoteReady, questi save riallineano il segmento cloud deduplicato.
    setTimeout(persistRepair108,700);
    setTimeout(persistRepair108,1800);
    setTimeout(persistRepair108,3500);
    setTimeout(()=>{patchRender108();version108();},5200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot108,{once:true});else boot108();
})();


/* ===== migrated from v109-patch.js ===== */
/* Smart Pack · Multiplast — V10.9
   Hotfix web/cloud: caricamento atomico dei segmenti, render sicuro e fallback UI.
*/
(function(){
  'use strict';
  const BUILD='V11.4', MARKER='PIATTAFORMA-GRUPPO-V11.4';
  function mark(){
    try{document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;document.body.dataset.build=MARKER;}catch(_){ }
    document.querySelectorAll('.version-badge').forEach(x=>x.textContent=BUILD);
    const foot=document.querySelector('.sidebar-foot');
    if(foot&&!document.getElementById('sp109Build')){
      const b=document.createElement('div');b.id='sp109Build';b.style.cssText='margin-top:8px;font-size:10px;font-weight:900;opacity:.9';b.textContent=BUILD+' · cloud stabile';foot.appendChild(b);
    }
  }
  function recover(){
    mark();
    try{
      if(typeof currentRole!=='undefined'&&currentRole){
        if(typeof renderNav==='function')renderNav();
        if(typeof renderCurrent==='function')renderCurrent();
      }
    }catch(err){console.error('[V10.9] recover render',err);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mark();setTimeout(recover,350);},{once:true});
  else{mark();setTimeout(recover,350)}
  setTimeout(mark,1200);setTimeout(recover,3200);
})();


/* ===== migrated from v110-patch.js ===== */
/* Smart Pack · Multiplast — V10.10
   Stabilità web/cloud: UI mai bloccata dalla rete, recupero menu/dashboard e versione visibile.
*/
(function(){
  'use strict';
  const BUILD='V11.4', MARKER='PIATTAFORMA-GRUPPO-V11.4';
  function mark(){
    try{document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;document.body.dataset.build=MARKER;}catch(_){}
    document.querySelectorAll('.version-badge').forEach(x=>x.textContent=BUILD);
    const foot=document.querySelector('.sidebar-foot');
    if(foot&&!document.getElementById('sp110Build')){
      const b=document.createElement('div');b.id='sp110Build';b.style.cssText='margin-top:8px;font-size:10px;font-weight:900;opacity:.9';b.textContent=BUILD+' · web/cloud stabile';foot.appendChild(b);
    }
  }
  function recover(){
    mark();
    try{
      const remembered=sessionStorage.getItem('industrialos_role_session')||'';
      if(typeof currentRole!=='undefined'&&!currentRole&&remembered)currentRole=remembered;
      if(typeof currentRole!=='undefined'&&currentRole){
        if(typeof renderNav==='function')renderNav();
        if(typeof renderCurrent==='function')renderCurrent();
      }
    }catch(err){console.warn('[V10.10] recovery',err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mark();setTimeout(recover,250);},{once:true});
  else{mark();setTimeout(recover,250)}
  [900,2200,5000].forEach(ms=>setTimeout(recover,ms));
})();


/* ===== Smart Pack · Multiplast — V11.0 FINAL CLEAN ===== */
(function(){
  'use strict';
  const BUILD='V11.4';
  const MARKER='PIATTAFORMA-GRUPPO-V11.4';

  function markBuild(){
    try{
      document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;
      if(document.body) document.body.dataset.build=MARKER;
      document.querySelectorAll('.version-badge').forEach(x=>x.textContent=BUILD);
      const foot=document.querySelector('.sidebar-foot');
      if(foot){
        let b=document.getElementById('sp11Build');
        if(!b){
          b=document.createElement('div');
          b.id='sp11Build';
          b.style.cssText='margin-top:8px;font-size:11px;font-weight:900;opacity:.95';
          foot.appendChild(b);
        }
        b.textContent=BUILD+' · FINAL CLEAN';
      }
    }catch(err){ console.warn('[V11] build label',err); }
  }

  function localRecovery(){
    markBuild();
    try{
      const remembered=sessionStorage.getItem('industrialos_role_session')||'';
      if(typeof currentRole!=='undefined' && !currentRole && remembered){ currentRole=remembered; }
      if(typeof currentRole!=='undefined' && currentRole){
        const gate=document.getElementById('accessGate');
        if(gate) gate.style.display='none';
        if(typeof renderNav==='function') renderNav();
        if(typeof renderCurrent==='function') renderCurrent();
        if(typeof injectMobileSummary==='function') injectMobileSummary();
      }
    }catch(err){ console.warn('[V11] local recovery',err); }
  }

  function boot(){
    markBuild();
    localRecovery();
    [500,1400,3200,6500].forEach(ms=>setTimeout(localRecovery,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


/* ===== Smart Pack · Multiplast — V11.4 COMPLIANCE + UI CONSOLIDATION ===== */
(function(){
  'use strict';
  const BUILD='V11.4';
  const MARKER='PIATTAFORMA-GRUPPO-V11.4';
  const $1=id=>document.getElementById(id);
  const esc1=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today1=()=>new Date().toISOString().slice(0,10);
  const uid1=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  let filter111='attention', search111='', edit111='', renew111='', history111='';

  function S(){try{return state}catch(_){return window.state||null}}
  function role111(){try{return currentRole||''}catch(_){return window.currentRole||''}}
  function canManage111(){return ['admin','director'].includes(role111())}
  function persist111(){try{save()}catch(_){try{localStorage.setItem('industrial_os_v2_state',JSON.stringify(S()))}catch(__){}}}
  function ensureState111(){
    const st=S(); if(!st)return;
    st.complianceRecords=Array.isArray(st.complianceRecords)?st.complianceRecords:[];
    st.complianceEmailLog=Array.isArray(st.complianceEmailLog)?st.complianceEmailLog:[];
    st.complianceSettings=(st.complianceSettings&&typeof st.complianceSettings==='object')?st.complianceSettings:{};
    if(!Array.isArray(st.complianceSettings.thresholds)||!st.complianceSettings.thresholds.length)st.complianceSettings.thresholds=[60,30,15,7,1,0];
    if(typeof st.complianceSettings.reportEmails!=='string')st.complianceSettings.reportEmails='';
    if(typeof st.complianceSettings.emailAlertsEnabled!=='boolean')st.complianceSettings.emailAlertsEnabled=true;
    if(typeof st.complianceSettings.weeklyDigestEnabled!=='boolean')st.complianceSettings.weeklyDigestEnabled=true;
    if(!st.complianceSettings.alertHorizonDays)st.complianceSettings.alertHorizonDays=60;
  }
  function parseDate111(v){if(!v)return null;const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?null:d}
  function days111(v){const d=parseDate111(v);if(!d)return 99999;const t=parseDate111(today1());return Math.ceil((d-t)/86400000)}
  function date111(v){const d=parseDate111(v);return d?d.toLocaleDateString('it-IT'):'—'}
  function status111(r){
    if(r.active===false)return {key:'archived',label:'Archiviato',cls:'archived',days:days111(r.expiryDate)};
    const d=days111(r.expiryDate);
    if(d<0)return {key:'expired',label:`Scaduto da ${Math.abs(d)} gg`,cls:'expired',days:d};
    if(d===0)return {key:'urgent',label:'Scade oggi',cls:'urgent',days:d};
    if(d<=7)return {key:'urgent',label:`Scade tra ${d} gg`,cls:'urgent',days:d};
    if(d<=30)return {key:'due',label:`Scade tra ${d} gg`,cls:'due',days:d};
    if(d<=60)return {key:'watch',label:`Tra ${d} gg`,cls:'watch',days:d};
    return {key:'ok',label:`Regolare · ${d} gg`,cls:'ok',days:d};
  }
  function active111(){return (S()?.complianceRecords||[]).filter(r=>r&&r.active!==false)}
  function alerts111(){return active111().map(r=>({r,s:status111(r)})).filter(x=>x.s.days<=Number(S()?.complianceSettings?.alertHorizonDays||60)).sort((a,b)=>a.s.days-b.s.days)}
  function recipients111(r){
    const local=String(r?.alertEmails||'').trim();
    const global=String(S()?.complianceSettings?.reportEmails||'').trim();
    return (local||global).split(/[;,]/).map(x=>x.trim()).filter(Boolean);
  }

  function injectStyles111(){
    if($1('sp111Styles'))return;
    const st=document.createElement('style');st.id='sp111Styles';st.textContent=`
      /* V11.1: cloud UI properly hidden unless explicitly open */
      .poi-cloud-auth,.poi-cloud-bootstrap{display:none;position:fixed;inset:0;z-index:10050;background:rgba(12,35,47,.58);backdrop-filter:blur(4px);padding:18px;place-items:center;overflow:auto}
      .poi-cloud-auth.open,.poi-cloud-bootstrap.open{display:grid!important}
      .poi-cloud-auth-card,.poi-cloud-bootstrap-card{width:min(720px,calc(100vw - 28px));max-height:92vh;overflow:auto;background:#fff;border:1px solid #d6e3e7;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(16,45,60,.24)}
      .poi-cloud-auth-brand{display:flex;align-items:center;gap:13px;margin-bottom:15px}.poi-cloud-auth-logo{width:48px;height:48px;border-radius:14px;background:#0f769d;color:#fff;display:grid;place-items:center;font-weight:900}.poi-cloud-auth-brand h2{margin:0;font-size:22px}.poi-cloud-auth-brand p,.poi-cloud-auth-card>p{color:var(--muted);font-size:13px}.poi-cloud-auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.poi-cloud-auth-grid .poi-cloud-auth-error{grid-column:1/-1;color:#a7373f;font-size:13px}.poi-cloud-auth-foot{margin-top:13px;padding:11px 12px;background:#f5f8f9;border-radius:11px;color:var(--muted);font-size:12px}
      .poi-cloud-menu{display:none;position:fixed;right:18px;top:76px;z-index:10020;width:min(340px,calc(100vw - 24px));background:#fff;border:1px solid #d6e3e7;border-radius:17px;padding:14px;box-shadow:0 18px 50px rgba(16,45,60,.18)}.poi-cloud-menu.open{display:grid!important;gap:8px}.poi-cloud-menu h4{margin:0;font-size:15px}.poi-cloud-menu p{margin:0 0 4px;color:var(--muted);font-size:12px}.cloud-user{display:grid;padding:10px;background:#f6f9fa;border-radius:10px}.cloud-user span{font-size:12px;color:var(--muted)}
      .poi-cloud-chip{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:8px 11px;border:1px solid #d1e0e5;background:#fff;border-radius:999px;font-size:12px;font-weight:800;color:#355461}.poi-cloud-dot{width:8px;height:8px;border-radius:50%;background:#9aaeb6}.poi-cloud-chip[data-state="online"] .poi-cloud-dot{background:#2f9d76}.poi-cloud-chip[data-state="syncing"] .poi-cloud-dot{background:#e0a338}.poi-cloud-chip[data-state="error"] .poi-cloud-dot{background:#ca5b61}.poi-cloud-chip small{font-size:10px;color:var(--muted)}
      #poiOnlineStrip{display:none!important}.poi-mobile-summary{display:none!important}
      /* Compliance bell */
      .sp111-bell{position:relative;display:none;align-items:center;justify-content:center;min-width:42px;height:42px;border:1px solid #d3e1e5;background:#fff;border-radius:13px;font-size:18px;cursor:pointer}.sp111-bell.show{display:inline-flex}.sp111-bell b{position:absolute;right:-5px;top:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#b7474f;color:#fff;font-size:10px;display:grid;place-items:center;border:2px solid #fff}
      /* Compliance page */
      .sp111-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}.sp111-head h1{font-size:27px;margin:3px 0 5px}.sp111-head p{margin:0;color:var(--muted);font-size:14px;max-width:800px}.sp111-head-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.sp111-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:15px 0}.sp111-kpi{border:1px solid #dce7ea;background:#fff;border-radius:15px;padding:14px;box-shadow:0 4px 14px rgba(22,60,76,.035)}.sp111-kpi span{display:block;font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.05em}.sp111-kpi b{display:block;font-size:26px;margin-top:4px}.sp111-kpi.expired b{color:#b7474f}.sp111-kpi.urgent b{color:#b06a20}.sp111-kpi.ok b{color:#277d61}
      .sp111-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0}.sp111-tabs{display:flex;gap:7px;flex-wrap:wrap}.sp111-tabs button{border:1px solid #d7e3e7;background:#fff;border-radius:999px;padding:9px 12px;font-weight:800;font-size:12px;color:#516773}.sp111-tabs button.active{background:#173f54;color:#fff;border-color:#173f54}.sp111-search{min-width:260px;max-width:360px;flex:1}.sp111-search input{width:100%;height:42px;border:1px solid #d4e2e6;border-radius:12px;padding:0 12px;font-size:14px}
      .sp111-list{display:grid;gap:10px}.sp111-card{display:grid;grid-template-columns:minmax(230px,1.35fr) minmax(140px,.75fr) minmax(145px,.8fr) auto;gap:12px;align-items:center;background:#fff;border:1px solid #dce6e9;border-radius:15px;padding:14px}.sp111-card.expired{border-left:5px solid #b7474f}.sp111-card.urgent{border-left:5px solid #d98b32}.sp111-card.due{border-left:5px solid #d6ad45}.sp111-card.watch{border-left:5px solid #75a2b3}.sp111-card.ok{border-left:5px solid #4c9c7d}.sp111-card.archived{opacity:.65}.sp111-main h3{font-size:16px;margin:2px 0}.sp111-main p{font-size:13px;color:var(--muted);margin:0}.sp111-meta span,.sp111-expiry span{display:block;font-size:11px;color:var(--muted)}.sp111-meta b,.sp111-expiry b{display:block;font-size:14px;margin-top:3px}.sp111-status{display:inline-flex;margin-top:5px;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:900}.sp111-status.expired{background:#fdecef;color:#a43e46}.sp111-status.urgent{background:#fff0df;color:#9b5b1d}.sp111-status.due{background:#fff7dc;color:#80661c}.sp111-status.watch{background:#eef5f7;color:#3e6d7c}.sp111-status.ok{background:#eaf7f1;color:#26765d}.sp111-status.archived{background:#eef1f2;color:#657981}.sp111-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.sp111-empty{padding:26px;text-align:center;border:1px dashed #cadce1;border-radius:14px;color:var(--muted);background:#fafcfc}
      .sp111-privacy{margin:12px 0;background:#f4f8fa;border:1px solid #d7e5e9;border-radius:11px;padding:10px 12px;font-size:12px;color:#526b76}.sp111-privacy b{color:#173f54}.sp111-admin-alert{margin-bottom:14px;border:1px solid #e0d2b3;background:#fffaf0;border-radius:15px;padding:14px}.sp111-admin-alert-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.sp111-admin-alert h3{font-size:16px;margin:0}.sp111-admin-alert p{font-size:12px;color:#715b32;margin:4px 0 0}.sp111-admin-alert-items{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.sp111-admin-mini{background:#fff;border:1px solid #eadfc6;border-radius:10px;padding:9px;font-size:12px}.sp111-admin-mini b{display:block;font-size:13px}.sp111-admin-mini span{color:#735f38}.sp111-email-state{margin:10px 0;padding:10px 12px;border-radius:11px;background:#f3f8fa;border:1px solid #d5e4e8;font-size:12px;color:#506a75}
      .sp111-history{display:grid;gap:8px}.sp111-history-row{border-left:3px solid #b97850;background:#faf7f4;border-radius:9px;padding:9px 11px}.sp111-history-row b{font-size:13px}.sp111-history-row span{display:block;font-size:12px;color:var(--muted);margin-top:2px}
      @media(max-width:900px){.sp111-card{grid-template-columns:1fr 1fr}.sp111-actions{grid-column:1/-1;justify-content:flex-start}.sp111-kpis{grid-template-columns:1fr 1fr}.sp111-admin-alert-items{grid-template-columns:1fr}.sp111-head{display:block}.sp111-head-actions{justify-content:flex-start;margin-top:12px}}
      @media(max-width:600px){
        .poi-cloud-auth{padding:4px}.poi-cloud-auth-card,.poi-cloud-bootstrap-card{width:calc(100vw - 8px);max-height:97dvh;border-radius:16px;padding:16px}.poi-cloud-auth-grid{grid-template-columns:1fr}.poi-cloud-menu{right:6px;top:69px;width:calc(100vw - 12px)}
        .poi-mobile-summary:not(:empty){display:block!important;margin:0 0 14px;padding:14px;border:1px solid #dbe7ea;background:#fff;border-radius:15px}.poi-ms-head h3{font-size:18px;margin:0}.poi-ms-head p{font-size:12px;color:var(--muted);margin:2px 0 10px}.poi-ms-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.poi-ms-card{border:1px solid #e1eaed;background:#f9fbfc;border-radius:11px;padding:10px}.poi-ms-card span{display:block;font-size:11px;color:var(--muted)}.poi-ms-card b{display:block;font-size:19px;margin-top:3px}.poi-ms-card small{display:block;font-size:10px;color:var(--muted);margin-top:2px}
        .sp111-bell{min-width:40px;height:40px}.sp111-head h1{font-size:23px}.sp111-head p{font-size:14px}.sp111-head-actions{display:grid;grid-template-columns:1fr;width:100%}.sp111-head-actions .btn{width:100%}.sp111-kpis{grid-template-columns:1fr 1fr}.sp111-toolbar{display:block}.sp111-tabs{overflow-x:auto;flex-wrap:nowrap;padding-bottom:6px}.sp111-tabs button{flex:0 0 auto;font-size:13px}.sp111-search{min-width:0;max-width:none;margin-top:9px}.sp111-card{grid-template-columns:1fr;padding:13px}.sp111-actions{grid-column:auto;display:grid;grid-template-columns:1fr}.sp111-actions .btn{width:100%}.sp111-main h3{font-size:18px}.sp111-main p,.sp111-meta b,.sp111-expiry b{font-size:14px}.sp111-meta span,.sp111-expiry span{font-size:12px}.sp111-kpi b{font-size:24px}
      }
    `;document.head.appendChild(st);
  }

  function mark111(){
    try{document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;document.body.dataset.build=MARKER}catch(_){ }
    document.querySelectorAll('.version-badge').forEach(x=>x.textContent=BUILD);
    ['sp109Build','sp110Build','sp11Build','sp111Build'].forEach(id=>$1(id)?.remove());
    const foot=document.querySelector('.sidebar-foot');if(foot){const b=document.createElement('div');b.id='sp111Build';b.style.cssText='margin-top:8px;font-size:11px;font-weight:900;opacity:.95';b.textContent=BUILD+' · Compliance';foot.appendChild(b)}
  }

  function ensureView111(){
    if($1('complianceView'))return;
    const admin=$1('adminView');if(!admin)return;
    const v=document.createElement('section');v.className='view';v.id='complianceView';admin.insertAdjacentElement('afterend',v);
  }
  function addNav111(){
    try{
      if(typeof NAV!=='undefined'){
        const item=['compliance','settings','Scadenze & Compliance'];
        for(const role of ['director','admin']){
          NAV[role]=NAV[role]||[];
          if(!NAV[role].some(x=>x[0]==='compliance')){
            const pos=Math.max(0,NAV[role].findIndex(x=>x[0]==='trace'));
            if(pos>=0)NAV[role].splice(pos,0,item);else NAV[role].push(item);
          }
        }
      }
      if(typeof META!=='undefined')META.compliance=['Scadenze & Compliance','Visite, formazione, certificazioni e verifiche sotto controllo'];
      if(typeof renderNav==='function')renderNav();
    }catch(err){console.warn('[V11.1] nav',err)}
  }
  function patchRender111(){
    try{
      const old=renderCurrent;if(typeof old==='function'&&!old.__sp111){
        const w=function(){if(typeof currentView!=='undefined'&&currentView==='compliance')return renderCompliance111();return old.apply(this,arguments)};w.__sp111=true;renderCurrent=w;window.renderCurrent=w;
      }
    }catch(err){console.warn('[V11.1] render patch',err)}
  }

  function bell111(){
    const top=document.querySelector('.topbar');if(!top)return;let b=$1('sp111Bell');
    if(!b){b=document.createElement('button');b.id='sp111Bell';b.type='button';b.className='sp111-bell';b.title='Scadenze e compliance';b.innerHTML='🔔<b>0</b>';const profile=document.querySelector('.profile');(profile||top.lastElementChild)?.insertAdjacentElement('beforebegin',b);b.onclick=()=>{try{navTo('compliance')}catch(_){}}}
    const n=alerts111().filter(x=>x.s.days<=30).length;b.querySelector('b').textContent=String(n);b.querySelector('b').style.display=n?'grid':'none';b.classList.toggle('show',canManage111());
  }

  function ensureDialogs111(){
    if(!$1('sp111RecordDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="sp111RecordDialog"><form id="sp111RecordForm"><div class="modal-head"><div><span class="eyebrow">Compliance</span><h3 id="sp111RecordTitle">Nuova scadenza</h3><p>Registra solo le informazioni operative necessarie.</p></div><button type="button" class="close" data-close="sp111RecordDialog">×</button></div><div class="modal-body"><div class="sp111-privacy"><b>Privacy:</b> per visite mediche e idoneità non inserire diagnosi o dettagli clinici. Sono sufficienti tipologia, data e prossima scadenza.</div><div class="form-grid"><label class="field">Azienda<select name="company" required><option>Smart Pack</option><option>Multiplast</option><option>Gruppo</option></select></label><label class="field">Tipo soggetto<select name="subjectType" required><option>Lavoratore</option><option>Azienda</option><option>Impianto</option><option>Attrezzatura</option><option>Veicolo</option><option>Documento</option></select></label><label class="field full">Persona / elemento<input name="subjectName" list="sp111People" required placeholder="Es. Mario Rossi / Compressore 1 / ISO 9001"><datalist id="sp111People"></datalist></label><label class="field">Categoria<select name="category" required><option>Visita medica</option><option>Giudizio di idoneità</option><option>Formazione sicurezza</option><option>Aggiornamento formazione</option><option>Patentino / abilitazione</option><option>Certificazione aziendale</option><option>Manutenzione / verifica</option><option>Assicurazione</option><option>Autorizzazione</option><option>Documento mezzo</option><option>Altro</option></select></label><label class="field">Titolo<input name="title" required placeholder="Es. Visita medica periodica"></label><label class="field">Data rilascio / effettuazione<input name="issueDate" type="date"></label><label class="field">Data scadenza<input name="expiryDate" type="date" required></label><label class="field">Responsabile<input name="responsible" placeholder="Es. Amministrazione"></label><label class="field">Email alert specifiche<input name="alertEmails" type="text" placeholder="email1@..., email2@..."></label><label class="field full">Riferimento documento / link<input name="documentRef" placeholder="Protocollo, cartella, link Drive..."></label><label class="field full">Note<textarea name="notes" rows="3" placeholder="Solo informazioni operative"></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn" data-close="sp111RecordDialog">Annulla</button><button class="btn primary" type="submit">Salva scadenza</button></div></form></dialog>`);
    if(!$1('sp111RenewDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="sp111RenewDialog"><form id="sp111RenewForm"><div class="modal-head"><div><span class="eyebrow">Rinnovo</span><h3>Registra rinnovo</h3><p id="sp111RenewInfo"></p></div><button type="button" class="close" data-close="sp111RenewDialog">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Nuova data rilascio / visita<input name="issueDate" type="date"></label><label class="field">Nuova scadenza<input name="expiryDate" type="date" required></label><label class="field full">Nuovo riferimento documento<input name="documentRef" placeholder="Opzionale"></label><label class="field full">Note rinnovo<textarea name="notes" rows="3"></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn" data-close="sp111RenewDialog">Annulla</button><button class="btn primary" type="submit">Conferma rinnovo</button></div></form></dialog>`);
    if(!$1('sp111SettingsDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="sp111SettingsDialog"><form id="sp111SettingsForm"><div class="modal-head"><div><span class="eyebrow">Alert</span><h3>Impostazioni scadenze</h3><p>Le notifiche interne sono immediate. Gli alert email automatici usano i destinatari configurati qui.</p></div><button type="button" class="close" data-close="sp111SettingsDialog">×</button></div><div class="modal-body"><div class="form-grid"><label class="field full">Destinatari report / alert email<input name="reportEmails" type="text" placeholder="amministrazione@azienda.it, roberto@azienda.it"></label><label class="field full">Soglie alert (giorni, separate da virgola)<input name="thresholds" type="text" value="60,30,15,7,1,0"></label><label class="field">Orizzonte dashboard (giorni)<input name="alertHorizonDays" type="number" min="7" max="365" value="60"></label><label class="field">Alert email automatici<select name="emailAlertsEnabled"><option value="true">Attivi</option><option value="false">Disattivati</option></select></label><label class="field">Report settimanale<select name="weeklyDigestEnabled"><option value="true">Attivo</option><option value="false">Disattivato</option></select></label></div><div class="sp111-email-state">Il programma salva queste preferenze nel cloud. Il controllo automatico email viene eseguito dal monitor scadenze collegato all'account Gmail autorizzato.</div></div><div class="modal-actions"><button type="button" class="btn" data-close="sp111SettingsDialog">Annulla</button><button class="btn primary" type="submit">Salva impostazioni</button></div></form></dialog>`);
    if(!$1('sp111HistoryDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="sp111HistoryDialog"><div class="modal-head"><div><span class="eyebrow">Storico</span><h3 id="sp111HistoryTitle">Storico rinnovi</h3><p id="sp111HistorySub"></p></div><button type="button" class="close" data-close="sp111HistoryDialog">×</button></div><div class="modal-body"><div id="sp111HistoryBody" class="sp111-history"></div></div><div class="modal-actions"><button type="button" class="btn" data-close="sp111HistoryDialog">Chiudi</button></div></dialog>`);
    const people=$1('sp111People');if(people)people.innerHTML=(S()?.operators||[]).map(x=>`<option value="${esc1(x)}">`).join('');
    const rf=$1('sp111RecordForm');if(rf&&!rf.__sp111){rf.__sp111=true;rf.onsubmit=saveRecord111}
    const rr=$1('sp111RenewForm');if(rr&&!rr.__sp111){rr.__sp111=true;rr.onsubmit=saveRenew111}
    const sf=$1('sp111SettingsForm');if(sf&&!sf.__sp111){sf.__sp111=true;sf.onsubmit=saveSettings111}
  }

  function openRecord111(id=''){
    ensureDialogs111();edit111=String(id||'');const f=$1('sp111RecordForm');f.reset();const r=(S()?.complianceRecords||[]).find(x=>x.id===edit111);
    $1('sp111RecordTitle').textContent=r?'Modifica scadenza':'Nuova scadenza';
    if(r){for(const k of ['company','subjectType','subjectName','category','title','issueDate','expiryDate','responsible','alertEmails','documentRef','notes'])if(f.elements[k])f.elements[k].value=r[k]||''}else{f.elements.company.value='Smart Pack';f.elements.subjectType.value='Lavoratore';f.elements.category.value='Visita medica';f.elements.responsible.value='Amministrazione'}
    try{$1('sp111RecordDialog').showModal()}catch(_){ }
  }
  function saveRecord111(e){e.preventDefault();ensureState111();const f=new FormData(e.currentTarget),st=S();let r=st.complianceRecords.find(x=>x.id===edit111);const data={company:String(f.get('company')||''),subjectType:String(f.get('subjectType')||''),subjectName:String(f.get('subjectName')||'').trim(),category:String(f.get('category')||''),title:String(f.get('title')||'').trim(),issueDate:String(f.get('issueDate')||''),expiryDate:String(f.get('expiryDate')||''),responsible:String(f.get('responsible')||'').trim(),alertEmails:String(f.get('alertEmails')||'').trim(),documentRef:String(f.get('documentRef')||'').trim(),notes:String(f.get('notes')||'').trim()};if(!data.subjectName||!data.title||!data.expiryDate)return;
    if(r){Object.assign(r,data,{updatedAt:new Date().toISOString()})}else{r={id:uid1('cmp'),...data,active:true,createdAt:new Date().toISOString(),history:[]};st.complianceRecords.unshift(r)}
    try{addAudit('Scadenza compliance salvata',r.subjectName,`${r.category} · scadenza ${r.expiryDate}`)}catch(_){ }
    persist111();$1('sp111RecordDialog').close();renderCompliance111();bell111();decorateAdmin111();
  }
  function openRenew111(id){ensureDialogs111();renew111=String(id);const r=(S()?.complianceRecords||[]).find(x=>x.id===renew111);if(!r)return;const f=$1('sp111RenewForm');f.reset();f.elements.issueDate.value=today1();$1('sp111RenewInfo').textContent=`${r.subjectName} · ${r.title} · scadenza attuale ${date111(r.expiryDate)}`;try{$1('sp111RenewDialog').showModal()}catch(_){}}
  function saveRenew111(e){e.preventDefault();const r=(S()?.complianceRecords||[]).find(x=>x.id===renew111);if(!r)return;const f=new FormData(e.currentTarget),next=String(f.get('expiryDate')||'');if(!next)return;r.history=Array.isArray(r.history)?r.history:[];r.history.unshift({at:new Date().toISOString(),issueDate:r.issueDate||'',expiryDate:r.expiryDate||'',documentRef:r.documentRef||'',notes:String(f.get('notes')||''),renewedBy:role111()});r.issueDate=String(f.get('issueDate')||r.issueDate||'');r.expiryDate=next;if(String(f.get('documentRef')||'').trim())r.documentRef=String(f.get('documentRef')).trim();r.lastRenewedAt=new Date().toISOString();r.updatedAt=r.lastRenewedAt;try{addAudit('Scadenza compliance rinnovata',r.subjectName,`${r.category} · nuova scadenza ${r.expiryDate}`)}catch(_){ }persist111();$1('sp111RenewDialog').close();renderCompliance111();bell111();decorateAdmin111()}
  function archive111(id){const r=(S()?.complianceRecords||[]).find(x=>x.id===String(id));if(!r)return;if(!confirm(`Archiviare “${r.title}” per ${r.subjectName}?`))return;r.active=false;r.archivedAt=new Date().toISOString();persist111();renderCompliance111();bell111();decorateAdmin111()}
  function historyOpen111(id){ensureDialogs111();history111=String(id);const r=(S()?.complianceRecords||[]).find(x=>x.id===history111);if(!r)return;$1('sp111HistoryTitle').textContent=`Storico · ${r.subjectName}`;$1('sp111HistorySub').textContent=`${r.category} · ${r.title}`;const h=Array.isArray(r.history)?r.history:[];$1('sp111HistoryBody').innerHTML=h.length?h.map(x=>`<div class="sp111-history-row"><b>Scadenza precedente: ${date111(x.expiryDate)}</b><span>Rinnovo registrato ${new Date(x.at).toLocaleString('it-IT')}${x.notes?' · '+esc1(x.notes):''}</span>${x.documentRef?`<span>Rif. documento: ${esc1(x.documentRef)}</span>`:''}</div>`).join(''):'<div class="sp111-empty">Nessun rinnovo precedente registrato.</div>';try{$1('sp111HistoryDialog').showModal()}catch(_){}}

  function openSettings111(){ensureDialogs111();const f=$1('sp111SettingsForm'),x=S()?.complianceSettings||{};f.elements.reportEmails.value=x.reportEmails||'';f.elements.thresholds.value=(x.thresholds||[60,30,15,7,1,0]).join(',');f.elements.alertHorizonDays.value=x.alertHorizonDays||60;f.elements.emailAlertsEnabled.value=String(x.emailAlertsEnabled!==false);f.elements.weeklyDigestEnabled.value=String(x.weeklyDigestEnabled!==false);try{$1('sp111SettingsDialog').showModal()}catch(_){}}
  function saveSettings111(e){e.preventDefault();const f=new FormData(e.currentTarget),x=S().complianceSettings;x.reportEmails=String(f.get('reportEmails')||'').trim();x.thresholds=String(f.get('thresholds')||'60,30,15,7,1,0').split(',').map(v=>Number(v.trim())).filter(Number.isFinite).sort((a,b)=>b-a);x.alertHorizonDays=Math.max(7,Math.min(365,Number(f.get('alertHorizonDays')||60)));x.emailAlertsEnabled=String(f.get('emailAlertsEnabled'))==='true';x.weeklyDigestEnabled=String(f.get('weeklyDigestEnabled'))==='true';x.updatedAt=new Date().toISOString();persist111();$1('sp111SettingsDialog').close();renderCompliance111();bell111()}

  function mailReport111(){
    const to=String(S()?.complianceSettings?.reportEmails||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);if(!to.length){alert('Configura prima almeno un destinatario email in “Impostazioni alert”.');return}
    const list=alerts111();if(!list.length){alert('Non ci sono scadenze nell’orizzonte di alert.');return}
    const lines=list.map(x=>`${x.s.days<0?'SCADUTO':x.s.days===0?'OGGI':x.s.days+' gg'} | ${x.r.company} | ${x.r.subjectName} | ${x.r.category} | ${x.r.title} | ${date111(x.r.expiryDate)} | Resp. ${x.r.responsible||'—'}`);
    const body=`Report Scadenze & Compliance\n\n${lines.join('\n')}\n\nNota privacy: il report contiene solo informazioni operative di scadenza, non dati clinici.`;
    location.href=`mailto:${encodeURIComponent(to.join(','))}?subject=${encodeURIComponent('Scadenze & Compliance · '+today1())}&body=${encodeURIComponent(body)}`;
  }

  function recordCard111(r){const s=status111(r);return `<article class="sp111-card ${s.cls}"><div class="sp111-main"><span class="v106-overline">${esc1(r.company||'Gruppo')} · ${esc1(r.category||'')}</span><h3>${esc1(r.subjectName||'')}</h3><p>${esc1(r.title||'')}</p></div><div class="sp111-meta"><span>Responsabile</span><b>${esc1(r.responsible||'—')}</b><span style="margin-top:6px">Tipo</span><b>${esc1(r.subjectType||'—')}</b></div><div class="sp111-expiry"><span>Scadenza</span><b>${date111(r.expiryDate)}</b><i class="sp111-status ${s.cls}">${esc1(s.label)}</i></div><div class="sp111-actions"><button class="btn small primary" onclick="sp111Renew('${esc1(r.id)}')">Rinnova</button><button class="btn small" onclick="sp111Edit('${esc1(r.id)}')">Modifica</button><button class="btn small" onclick="sp111History('${esc1(r.id)}')">Storico</button><button class="btn small" onclick="sp111Archive('${esc1(r.id)}')">Archivia</button></div></article>`}

  function renderCompliance111(){
    ensureState111();ensureView111();ensureDialogs111();mark111();bell111();const view=$1('complianceView');if(!view||!canManage111())return;
    const all=S().complianceRecords||[],act=all.filter(r=>r.active!==false),expired=act.filter(r=>status111(r).key==='expired'),urgent=act.filter(r=>{const d=status111(r).days;return d>=0&&d<=7}),due30=act.filter(r=>{const d=status111(r).days;return d>7&&d<=30}),ok=act.filter(r=>status111(r).days>30);
    let rows=filter111==='archived'?all.filter(r=>r.active===false):act.slice();if(filter111==='attention')rows=act.filter(r=>status111(r).days<=30);else if(filter111==='medical')rows=act.filter(r=>/visita|idoneità/i.test(r.category||''));else if(filter111==='training')rows=act.filter(r=>/formazione|patentino|abilitazione/i.test(r.category||''));else if(filter111==='company')rows=act.filter(r=>!['Lavoratore'].includes(r.subjectType));
    if(search111){const q=search111.toLowerCase();rows=rows.filter(r=>[r.company,r.subjectName,r.category,r.title,r.responsible,r.documentRef].join(' ').toLowerCase().includes(q))}rows.sort((a,b)=>status111(a).days-status111(b).days||String(a.subjectName).localeCompare(String(b.subjectName)));
    const settings=S().complianceSettings||{};view.innerHTML=`<div class="sp111-head"><div><span class="v106-overline">AMMINISTRAZIONE · PREVENZIONE</span><h1>Scadenze & Compliance</h1><p>Visite mediche, formazione, certificazioni, verifiche e documenti in un solo posto. Gli alert restano visibili finché la scadenza non viene rinnovata.</p></div><div class="sp111-head-actions"><button class="btn" onclick="sp111MailReport()">Prepara email report</button><button class="btn" onclick="sp111Settings()">Impostazioni alert</button><button class="btn primary" onclick="sp111New()">+ Nuova scadenza</button></div></div><div class="sp111-privacy"><b>Visite mediche:</b> registra soltanto effettuazione/idoneità e data della prossima scadenza. Non archiviare diagnosi o dettagli sanitari.</div><div class="sp111-email-state"><b>Alert interni:</b> attivi · <b>Email automatiche:</b> ${settings.emailAlertsEnabled!==false?'attive quando sono configurati i destinatari':'disattivate'} · Destinatari: ${esc1(settings.reportEmails||'non configurati')}</div><div class="sp111-kpis"><div class="sp111-kpi expired"><span>Scadute</span><b>${expired.length}</b></div><div class="sp111-kpi urgent"><span>Entro 7 giorni</span><b>${urgent.length}</b></div><div class="sp111-kpi"><span>8–30 giorni</span><b>${due30.length}</b></div><div class="sp111-kpi ok"><span>Regolari oltre 30 gg</span><b>${ok.length}</b></div></div><div class="sp111-toolbar"><div class="sp111-tabs">${[['attention','Da gestire'],['all','Tutte'],['medical','Visite / idoneità'],['training','Formazione'],['company','Azienda / impianti'],['archived','Archiviate']].map(([k,l])=>`<button class="${filter111===k?'active':''}" onclick="sp111Filter('${k}')">${l}</button>`).join('')}</div><label class="sp111-search"><input value="${esc1(search111)}" placeholder="Cerca persona, categoria, responsabile..." oninput="sp111Search(this.value)"></label></div><div class="sp111-list">${rows.map(recordCard111).join('')||'<div class="sp111-empty"><b>Nessuna scadenza in questa sezione.</b><br>Aggiungi il primo controllo con “Nuova scadenza”.</div>'}</div>`;
  }

  function decorateAdmin111(){
    if(!canManage111())return;const view=$1('adminView');if(!view||$1('sp111AdminAlert'))return;const list=alerts111().filter(x=>x.s.days<=30);if(!list.length)return;const box=document.createElement('section');box.id='sp111AdminAlert';box.className='sp111-admin-alert';box.innerHTML=`<div class="sp111-admin-alert-head"><div><h3>Scadenze da gestire</h3><p>${list.filter(x=>x.s.days<0).length} scadute · ${list.filter(x=>x.s.days>=0&&x.s.days<=7).length} entro 7 giorni · ${list.length} totali entro 30 giorni</p></div><button class="btn" onclick="navTo('compliance')">Apri scadenze</button></div><div class="sp111-admin-alert-items">${list.slice(0,3).map(x=>`<div class="sp111-admin-mini"><b>${esc1(x.r.subjectName)}</b><span>${esc1(x.r.category)} · ${date111(x.r.expiryDate)} · ${esc1(x.s.label)}</span></div>`).join('')}</div>`;view.prepend(box);
  }
  function observeAdmin111(){const view=$1('adminView');if(!view||view.dataset.sp111Obs)return;view.dataset.sp111Obs='1';new MutationObserver(()=>setTimeout(decorateAdmin111,0)).observe(view,{childList:true,subtree:false});setTimeout(decorateAdmin111,100)}

  function boot111(){
    ensureState111();injectStyles111();ensureView111();ensureDialogs111();addNav111();patchRender111();mark111();bell111();observeAdmin111();
    // The online strip is redundant because the topbar chip already shows sync status.
    $1('poiOnlineStrip')?.remove();
    [300,1000,2500,5000].forEach(ms=>setTimeout(()=>{mark111();bell111();addNav111();if(typeof currentView!=='undefined'&&currentView==='compliance')renderCompliance111();if(typeof currentView!=='undefined'&&currentView==='admin')decorateAdmin111();$1('poiOnlineStrip')?.remove();},ms));
  }

  window.sp111New=()=>openRecord111('');window.sp111Edit=openRecord111;window.sp111Renew=openRenew111;window.sp111Archive=archive111;window.sp111History=historyOpen111;window.sp111Settings=openSettings111;window.sp111MailReport=mailReport111;window.sp111Filter=k=>{filter111=k;renderCompliance111()};window.sp111Search=q=>{search111=q;renderCompliance111()};window.renderCompliance111=renderCompliance111;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot111,{once:true});else boot111();
})();

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
  const activationMode=new URL(location.href).searchParams.get('attiva')==='account';

  let selectedCompany=sessionStorage.getItem(COMPANY_KEY)||'';
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
      @media(max-width:760px){.poi113-company-grid,.poi113-admin-grid,.poi113-form-grid{grid-template-columns:1fr}.poi113-form-grid .full{grid-column:auto}.poi113-card{padding:16px}.poi113-overlay{padding:10px}.poi113-employee,.poi113-request{grid-template-columns:1fr}.poi113-row-actions{justify-content:flex-start}.poi113-request select{min-width:100%;max-width:100%}}
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
    $('#poi113AccessBack').onclick=showCompanyMenu;
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
  function corporateLogout(){ closeOverlays();sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);employee=null;selectedCompany='';$('#poiCloudLogout')?.click(); }

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
      users.style.display=canViewRecoveries()?'inline-flex':'none';
      users.textContent=isPlatform()?'Area riservata NOMYRA':'Recupero accessi dipendenti';
      users.onclick=()=>isPlatform()?openNomyra():openRecoveryAdmin();
    }
    if(!employee){
      const name=$('#userName');if(name)name.textContent=isPlatform()?'NOMYRA':'Account aziendale';
      const role=$('#userRole');if(role)role.textContent=isPlatform()?'Amministrazione piattaforma':'Accesso base cliente';
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
    if(logout&&!logout.dataset.poi113){
      logout.dataset.poi113='1';
      logout.addEventListener('click',()=>{closeOverlays();sessionStorage.removeItem(EMPLOYEE_KEY);sessionStorage.removeItem(COMPANY_KEY);employee=null;selectedCompany=''},true);
    }
  }

  function showCompanyMenu(){
    ensureUI();
    if(!profile())return;
    closeOverlays();
    $('#accessGate')?.style.setProperty('display','none','important');
    decorateCloudMenu();
    if(employee&&selectedCompany&&companies().includes(selectedCompany)){
      enterRole(employee.role_code,true);return;
    }
    if(isPlatform()){openNomyra();return}
    const cards=companies().map(c=>`<button class="poi113-company" type="button" onclick="POIV113.selectCompany('${c}')"><b>${companyName(c)}</b><span>${c==='smartpack'?'Ordini, produzione, IML, magazzino e amministrazione.':'Presse, miscele, turni, consegne e amministrazione.'}</span></button>`).join('');
    $('#poi113CompanyBody').innerHTML=`<div class="poi113-company-grid">${cards}</div>${isTenant()?'<div class="poi113-actions stretch"><button class="btn" type="button" onclick="POIV113.openRecoveryAdmin()">Richieste recupero USER e PIN</button></div>':''}`;
    $('#poi113CompanyGate').classList.add('open');
  }

  function selectCompany(company){
    if(!companies().includes(company))return;
    selectedCompany=company;sessionStorage.setItem(COMPANY_KEY,company);closeOverlays();
    // V11.5: l'account cliente entra direttamente nell'area autorizzata.
    // USER/PIN dipendente non è più richiesto per l'account base Smart Pack.
    if(isTenant()){enterRole(company==='smartpack'?'director':'manager',false);return}
    const smart=company==='smartpack';
    $('#poi113AccessLogo').textContent=smart?'SP':'MP';
    $('#poi113AccessTitle').textContent=companyName(company)+' · Accesso dipendente';
    $('#poi113AccessBody').innerHTML=`
      <form id="poi113LoginForm"><div class="poi113-form-grid">
        <label class="field full">USER<input name="username" autocomplete="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" placeholder="es. mario.rossi"></label>
        <label class="field full">PIN personale di 6 cifre<input name="pin" autocomplete="current-password" inputmode="numeric" type="password" pattern="[0-9]{6}" minlength="6" maxlength="6" required placeholder="••••••"></label>
        <div class="poi113-error full" id="poi113LoginError"></div>
        <button class="btn primary full" type="submit">Entra</button>
        <button class="btn full" type="button" onclick="POIV113.openRecoveryRequest()">Ho dimenticato USER o PIN</button>
      </div></form>`;
    $('#poi113LoginForm').onsubmit=employeeLogin;
    $('#poi113AccessGate').classList.add('open');
    setTimeout(()=>$('#poi113LoginForm [name="username"]')?.focus(),80);
  }

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
    const next={employee_id:row.employee_id,username:row.username,display_name:row.display_name,role_code:row.role_code,company_code:row.company_code};
    $('#poi113AccessGate').classList.remove('open');
    if(row.must_change_pin){pendingEntry=next;openPinChange(true,pin);return}
    employee=next;completeEmployeeEntry();
  }

  function completeEmployeeEntry(){
    if(!employee)return;
    selectedCompany=employee.company_code;sessionStorage.setItem(COMPANY_KEY,selectedCompany);sessionStorage.setItem(EMPLOYEE_KEY,JSON.stringify(employee));
    closeOverlays();decorateCloudMenu();enterRole(employee.role_code,true);
  }

  function enterRole(role,asEmployee=false){
    if(!asEmployee){employee=null;sessionStorage.removeItem(EMPLOYEE_KEY)}
    api()?.enterRole?.(role);
    [60,180,450].forEach(delay=>setTimeout(()=>{
      const name=$('#userName'),label=$('#userRole');
      if(name)name.textContent=employee?.display_name||(isPlatform()?'NOMYRA':'Account aziendale');
      if(label)label.textContent=(employee?'Dipendente · ':'')+roleName(role);
      decorateCloudMenu();
    },delay));
  }

  function employeeLogout(){
    employee=null;pendingEntry=null;sessionStorage.removeItem(EMPLOYEE_KEY);decorateCloudMenu();showCompanyMenu();
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
    if(pinChangeMode.forced){pendingEntry=null;selectCompany(selectedCompany)}
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
    const legacyGrid=overlay.querySelector('.poi113-admin-grid');if(legacyGrid)legacyGrid.style.display='none';
    const recover=$('#poi113OpenRecoveries');if(recover)recover.style.display='none';
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
    return company==='smartpack'?[['worker','Produzione Smart Pack'],['admin','Amministrazione'],['director','Gestione Smart Pack']]:[['mpworker','Produzione Multiplast'],['manager','Responsabile produzione'],['admin','Amministrazione']];
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
    const args={p_company:manageCompany,p_username:String(values.get('username')||'').trim().toLowerCase(),p_display_name:String(values.get('display_name')||'').trim(),p_role_code:String(values.get('role_code')||''),p_pin:String(values.get('pin')||''),p_group:GROUP};
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
    document.body.dataset.build=MARKER;
    document.title='Piattaforma Operativa Integrata – Gruppo Smart Pack – Multiplast · '+BUILD;
    $$('.version-badge').forEach(x=>x.textContent=BUILD);
    ['sp109Build','sp110Build','sp11Build','sp111Build','sp113Build'].forEach(id=>$('#'+id)?.remove());
    const foot=$('.sidebar-foot');
    if(foot){const badge=document.createElement('div');badge.id='sp113Build';badge.style.cssText='margin-top:8px;font-size:11px;font-weight:900;opacity:.95';badge.textContent=BUILD+' · Accessi semplificati';foot.appendChild(badge)}
  }

  function boot(){
    updateBuildLabels();ensureUI();
    [250,700,1500,3000,7200].forEach(delay=>setTimeout(()=>{ensureUI();decorateAuth();decorateCloudMenu();updateBuildLabels()},delay));
  }

  const publicApi={
    showCompanyMenu,selectCompany,openNomyra,openRecoveryAdmin,setManageCompany,setRecoveryCompany,
    openRecoveryRequest,resetPin,toggleEmployee,resolveRecovery,dismissRecovery,openPinChange
  };
  window.POIV113=publicApi;
  window.POIV112=publicApi;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

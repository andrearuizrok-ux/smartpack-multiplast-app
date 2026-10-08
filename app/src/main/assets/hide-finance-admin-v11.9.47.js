
(()=>{
'use strict';
if(window.SPHideFinanceAdmin11947)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function isAdminArea(){
  try{
    return currentRole==='admin' || currentRole==='administration' || /amministrazione/i.test(document.body.innerText||'');
  }catch(_){
    return true;
  }
}

function hideFinanceMenu(){
  // Hide any navigation entry leading to finance.
  $$('button,a,[data-view],[data-target],[data-nav]').forEach(el=>{
    const t=(el.textContent||'').trim();
    const attrs=[
      el.getAttribute('data-view')||'',
      el.getAttribute('data-target')||'',
      el.getAttribute('data-nav')||'',
      el.getAttribute('href')||''
    ].join(' ');
    if(/economico-finanziario|finance|bilancio/i.test(t+' '+attrs)){
      if(/Economico-finanziario/i.test(t) || /finance/i.test(attrs)){
        const item=el.closest('li,.nav-item,.menu-item,.sidebar-item')||el;
        item.style.setProperty('display','none','important');
      }
    }
  });
}

function hideDashboardFinance(){
  const view=$('#adminOverviewV1170View');
  if(!view)return;

  // Remove/hide finance/economic sections only, preserving other admin modules.
  $$('section,article,.card,.panel,div',view).forEach(el=>{
    const t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!t)return;

    const financeBlock =
      /ANDAMENTO ECONOMICO/i.test(t) ||
      /CONTROLLO GESTIONALE/i.test(t) ||
      /NOMYRA FINANCE/i.test(t) ||
      /Finance non collegato/i.test(t) ||
      /Ricavi vendite gruppo/i.test(t) ||
      /Valore della produzione/i.test(t) ||
      /\bEBITDA\b/i.test(t) ||
      /\bEBIT\b/i.test(t);

    const importFinance =
      /Importa Bilancio SPRING/i.test(t) ||
      /Importa bilancio/i.test(t);

    if(financeBlock || importFinance){
      // Hide only reasonably-sized containers; don't hide the entire overview.
      if(el!==view && (el.parentElement===view || el.parentElement?.parentElement===view || el.matches('section,article,.card,.panel'))){
        el.style.setProperty('display','none','important');
      }
    }
  });

  // Explicitly hide finance-related quick actions.
  $$('button,a',view).forEach(el=>{
    const t=(el.textContent||'').trim();
    if(/Importa Bilancio SPRING|Importa bilancio|Apri analisi completa|Finance|NOMYRA/i.test(t)){
      el.style.setProperty('display','none','important');
    }
  });
}

function blockFinanceView(){
  const view=$('#adminFinanceV1170View');
  if(!view)return;
  view.style.setProperty('display','none','important');
  view.classList.remove('active');
}

function redirectIfFinanceActive(){
  const view=$('#adminFinanceV1170View');
  if(!view?.classList.contains('active'))return;
  try{
    window.SPReleaseV1170?.adminQuick?.('overview');
    return;
  }catch(_){}
  try{
    if(typeof navTo==='function') navTo('adminOverview');
  }catch(_){}
}

function clean(){
  if(!isAdminArea())return;
  hideFinanceMenu();
  hideDashboardFinance();
  redirectIfFinanceActive();
  blockFinanceView();
}

function patchNavigation(){
  const old=window.renderCurrent || (typeof renderCurrent==='function'?renderCurrent:null);
  if(typeof old==='function'&&!old.__hidefin11947){
    const wrapped=function(){
      const r=old.apply(this,arguments);
      setTimeout(clean,30);
      return r;
    };
    wrapped.__hidefin11947=true;
    window.renderCurrent=wrapped;
    try{renderCurrent=wrapped}catch(_){}
  }
}

function boot(){
  patchNavigation();
  clean();
  const mo=new MutationObserver(()=>setTimeout(clean,20));
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(clean,200);
  setTimeout(clean,900);
}

window.SPHideFinanceAdmin11947={version:'V11.9.47',clean};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();

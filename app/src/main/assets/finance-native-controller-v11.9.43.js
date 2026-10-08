
(()=>{
'use strict';
if(window.SPFinanceNativeController11943)return;

const FIN_URL='https://nomyra-finance.pages.dev/';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function financeView(){return $('#adminFinanceV1170View')}

function cleanupObsolete(){
  const view=financeView(); if(!view)return;
  // Remove obsolete live-connector remnants if any survived from cache/old DOM.
  $$('[data-nf23-host],[data-nf23-shell],.nf23-shell,.nf23-connect',view).forEach(x=>x.remove());
  $$('button',view).filter(b=>/Collega Finance/i.test(b.textContent||'')).forEach(b=>{
    const block=b.closest('section,article,.panel,.card,div');
    if(block && /NOMYRA FINANCE/i.test(block.textContent||'')) block.remove();
  });
}

function addDeepLink(){
  const view=financeView(); if(!view)return;
  let btn=$('[data-fn43-link]',view);
  if(btn)return;
  const history=$('[data-fh42]',view);
  if(history){
    // History module already contains the correct deep-link button.
    return;
  }
  btn=document.createElement('button');
  btn.type='button';
  btn.dataset.fn43Link='1';
  btn.className='btn';
  btn.textContent='Approfondisci su NOMYRA Finance ↗';
  btn.onclick=()=>window.open(FIN_URL,'_blank','noopener,noreferrer');
  const hero=$('.v1170-fin-hero',view);
  if(hero)hero.appendChild(btn);
  else view.prepend(btn);
}

function forceNativeRender(){
  const view=financeView();
  if(!view?.classList.contains('active'))return;
  cleanupObsolete();

  // Re-render native finance page.
  try{
    const period=$('#financePeriodV1170')?.value ||
      sessionStorage.getItem('poi_finance_period_v1179') ||
      localStorage.getItem('poi_finance_period_v1179') || '';
    window.SPReleaseV1170?.renderFinance?.(period);
  }catch(_){}

  setTimeout(()=>{
    cleanupObsolete();
    try{window.SPFinanceAnalysisV11922?.render?.()}catch(_){}
    try{window.SPFinanceHistory11942?.render?.(true)}catch(_){}
    addDeepLink();
  },80);
}

function patchNavigation(){
  const old=window.renderCurrent || (typeof renderCurrent==='function'?renderCurrent:null);
  if(typeof old!=='function'||old.__fn43)return;
  const wrapped=function(){
    const r=old.apply(this,arguments);
    setTimeout(forceNativeRender,40);
    return r;
  };
  wrapped.__fn43=true;
  window.renderCurrent=wrapped;
  try{renderCurrent=wrapped}catch(_){}
}

function boot(){
  patchNavigation();
  const view=financeView();
  if(view){
    new MutationObserver(()=>{
      if(view.classList.contains('active'))setTimeout(forceNativeRender,30);
    }).observe(view,{attributes:true,attributeFilter:['class']});
  }
  setTimeout(forceNativeRender,200);
}
window.SPFinanceNativeController11943={version:'V11.9.43',render:forceNativeRender};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();

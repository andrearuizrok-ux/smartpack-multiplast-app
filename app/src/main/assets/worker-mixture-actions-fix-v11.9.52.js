
(()=>{
'use strict';
if(window.SPWorkerMixtureActionsFix11952)return;

function moduleReady(){
  return window.SPWorkerMixtures11949 &&
         typeof window.SPWorkerMixtures11949.newMix==='function';
}
function call(action,id){
  const api=window.SPWorkerMixtures11949;
  if(!api)return false;
  try{
    if(action==='new' && typeof api.newMix==='function'){ api.newMix(); return true; }
    if(action==='edit' && typeof api.edit==='function'){ api.edit(id); return true; }
    if(action==='remove' && typeof api.remove==='function'){ api.remove(id); return true; }
    if(action==='assign' && typeof api.assign==='function'){ api.assign(id); return true; }
  }catch(err){
    console.error('[V11.9.52 mixture action]',err);
  }
  return false;
}
function ensureAndCall(action,id,tries=0){
  if(call(action,id))return;
  if(tries>=12){
    alert('Il modulo Miscele non è riuscito ad avviarsi. Ricarica la pagina una volta e riprova.');
    return;
  }
  setTimeout(()=>ensureAndCall(action,id,tries+1),100);
}
function bindDelegation(){
  document.addEventListener('click',e=>{
    const newBtn=e.target.closest('[data-wd52-new-mix]');
    if(newBtn){
      e.preventDefault();e.stopPropagation();
      ensureAndCall('new','');
      return;
    }
    const edit=e.target.closest('[data-wd52-edit]');
    if(edit){
      e.preventDefault();e.stopPropagation();
      ensureAndCall('edit',edit.dataset.wd52Edit);
      return;
    }
    const rem=e.target.closest('[data-wd52-remove]');
    if(rem){
      e.preventDefault();e.stopPropagation();
      ensureAndCall('remove',rem.dataset.wd52Remove);
      return;
    }
    const assign=e.target.closest('[data-wd52-assign]');
    if(assign){
      e.preventDefault();e.stopPropagation();
      ensureAndCall('assign',assign.dataset.wd52Assign);
      return;
    }
  },true);
}
function repairRenderedButtons(){
  document.querySelectorAll('#mixturesView button').forEach(btn=>{
    const t=(btn.textContent||'').trim();
    if(/^\+\s*Nuova miscela$/i.test(t) && !btn.dataset.wd52NewMix){
      btn.dataset.wd52NewMix='1';
      btn.removeAttribute('onclick');
    }
  });
}
function boot(){
  bindDelegation();
  repairRenderedButtons();
  new MutationObserver(()=>repairRenderedButtons()).observe(document.body,{childList:true,subtree:true});
}
window.SPWorkerMixtureActionsFix11952={version:'V11.9.52',call:ensureAndCall};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

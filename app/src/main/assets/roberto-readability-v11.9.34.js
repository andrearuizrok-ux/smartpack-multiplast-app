
(()=>{
'use strict';
if(window.SPRobertoReadability11934)return;

function isRobertoArea(){
  try{return company==='smartpack' && currentRole==='director'}catch(_){return false}
}
function apply(){
  document.body.classList.toggle('spm-roberto-readable',isRobertoArea());
}
function styles(){
  if(document.getElementById('spmRobertoReadable11934'))return;
  const st=document.createElement('style');
  st.id='spmRobertoReadable11934';
  st.textContent=`
  body.spm-roberto-readable{font-size:16px;line-height:1.45}
  body.spm-roberto-readable #sidebar,
  body.spm-roberto-readable aside{font-size:16px}
  body.spm-roberto-readable #sideNav button,
  body.spm-roberto-readable .sidebar button,
  body.spm-roberto-readable nav button{
    min-height:48px;font-size:16px!important;line-height:1.25!important;
    padding-top:12px!important;padding-bottom:12px!important
  }
  body.spm-roberto-readable #sideNav .spm26-nav-label,
  body.spm-roberto-readable .eyebrow,
  body.spm-roberto-readable .kicker,
  body.spm-roberto-readable [class*="eyebrow"],
  body.spm-roberto-readable [class*="kicker"]{
    font-size:12px!important;letter-spacing:.06em!important
  }
  body.spm-roberto-readable h1{font-size:32px!important;line-height:1.15!important}
  body.spm-roberto-readable h2{font-size:26px!important;line-height:1.2!important}
  body.spm-roberto-readable h3{font-size:21px!important;line-height:1.25!important}
  body.spm-roberto-readable p,
  body.spm-roberto-readable .subtitle,
  body.spm-roberto-readable .muted,
  body.spm-roberto-readable .help,
  body.spm-roberto-readable small{
    font-size:14px!important;line-height:1.5!important
  }
  body.spm-roberto-readable .btn,
  body.spm-roberto-readable button,
  body.spm-roberto-readable input,
  body.spm-roberto-readable select,
  body.spm-roberto-readable textarea{font-size:16px!important}
  body.spm-roberto-readable .btn,
  body.spm-roberto-readable button{min-height:46px;border-radius:12px}
  body.spm-roberto-readable input,
  body.spm-roberto-readable select,
  body.spm-roberto-readable textarea{
    min-height:46px;padding:11px 12px
  }
  body.spm-roberto-readable label,
  body.spm-roberto-readable .field label,
  body.spm-roberto-readable th{
    font-size:14px!important;line-height:1.35!important
  }
  body.spm-roberto-readable td{
    font-size:15px!important;line-height:1.4!important;
    padding-top:12px!important;padding-bottom:12px!important
  }
  body.spm-roberto-readable .card,
  body.spm-roberto-readable .panel,
  body.spm-roberto-readable .section,
  body.spm-roberto-readable [class*="card"]{border-radius:18px}
  body.spm-roberto-readable .status,
  body.spm-roberto-readable .badge,
  body.spm-roberto-readable .chip,
  body.spm-roberto-readable [class*="badge"],
  body.spm-roberto-readable [class*="chip"]{
    font-size:12px!important;min-height:28px;padding:6px 9px!important
  }
  body.spm-roberto-readable .ro25-head p{font-size:15px!important}
  body.spm-roberto-readable .ro25-kpis span{font-size:12px!important}
  body.spm-roberto-readable .ro25-kpis b{font-size:30px!important}
  body.spm-roberto-readable .ro25-kpis small{font-size:13px!important}
  body.spm-roberto-readable .ro25-kpis button{font-size:13px!important}
  body.spm-roberto-readable [class*="planner"] small,
  body.spm-roberto-readable [class*="production"] small,
  body.spm-roberto-readable [class*="press"] small,
  body.spm-roberto-readable [class*="queue"] small{font-size:13px!important}
  body.spm-roberto-readable .actions,
  body.spm-roberto-readable .row-actions,
  body.spm-roberto-readable [class*="actions"]{gap:10px!important}
  body.spm-roberto-readable dialog{font-size:16px}
  body.spm-roberto-readable dialog h3{font-size:24px!important}
  body.spm-roberto-readable dialog p{font-size:15px!important}
  @media(max-width:1200px){
    body.spm-roberto-readable{font-size:15px}
    body.spm-roberto-readable #sideNav button{font-size:15px!important}
  }`;
  document.head.appendChild(st);
}
function patchRender(){
  const f=window.renderCurrent||((typeof renderCurrent==='function')?renderCurrent:null);
  if(typeof f==='function'&&!f.__read11934){
    const wrapped=function(){
      const r=f.apply(this,arguments);
      setTimeout(apply,30);
      return r;
    };
    wrapped.__read11934=true;
    window.renderCurrent=wrapped;
    try{renderCurrent=wrapped}catch(_){}
  }
}
function boot(){
  styles();patchRender();apply();
  setTimeout(apply,250);setTimeout(apply,900);
}
window.SPRobertoReadability11934={version:'V11.9.34',apply};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

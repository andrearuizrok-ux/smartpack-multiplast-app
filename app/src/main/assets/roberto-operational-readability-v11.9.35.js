
(()=>{
'use strict';
if(window.SPRobertoOperationalReadability11935)return;

function isRobertoArea(){
  try{return company==='smartpack' && currentRole==='director'}catch(_){return false}
}
function style(){
  if(document.getElementById('spmRead11935'))return;
  const st=document.createElement('style');
  st.id='spmRead11935';
  st.textContent=`
  body.spm-roberto-readable{
    --ro-main:16px;
    --ro-secondary:13px;
    --ro-small:12px;
  }

  /* Tabelle operative */
  body.spm-roberto-readable .data-table th,
  body.spm-roberto-readable table th{
    font-size:13px!important;
    line-height:1.3!important;
    font-weight:900!important;
    padding:12px 10px!important;
    white-space:nowrap;
  }
  body.spm-roberto-readable .data-table td,
  body.spm-roberto-readable table td{
    font-size:15px!important;
    line-height:1.45!important;
    padding:14px 10px!important;
    vertical-align:middle!important;
  }
  body.spm-roberto-readable .data-table td b,
  body.spm-roberto-readable table td b{
    font-size:16px!important;
    line-height:1.35!important;
  }
  body.spm-roberto-readable .data-table td small,
  body.spm-roberto-readable table td small{
    font-size:12.5px!important;
    line-height:1.45!important;
    margin-top:3px!important;
  }

  /* Badge e stati */
  body.spm-roberto-readable .status,
  body.spm-roberto-readable .badge,
  body.spm-roberto-readable .chip,
  body.spm-roberto-readable [class*="status"],
  body.spm-roberto-readable [class*="badge"],
  body.spm-roberto-readable [class*="chip"]{
    font-size:12px!important;
    line-height:1.2!important;
    min-height:30px!important;
    padding:7px 10px!important;
    border-radius:999px!important;
    display:inline-flex;
    align-items:center;
  }

  /* Azioni nelle righe */
  body.spm-roberto-readable table button,
  body.spm-roberto-readable .row-actions button,
  body.spm-roberto-readable [class*="row"] .btn{
    min-height:40px!important;
    font-size:13px!important;
    padding:8px 12px!important;
    border-radius:10px!important;
  }

  /* Registro ordini */
  body.spm-roberto-readable #ordersRegisterView td:first-child b,
  body.spm-roberto-readable #ordersView td:first-child b{
    font-size:17px!important;
  }
  body.spm-roberto-readable #ordersRegisterView td:nth-child(2) b,
  body.spm-roberto-readable #ordersRegisterView td:nth-child(3) b{
    font-size:16px!important;
  }
  body.spm-roberto-readable #ordersRegisterView .table-wrap,
  body.spm-roberto-readable #ordersView .table-wrap{
    overflow-x:auto;
  }

  /* Coda Roberto / Planner */
  body.spm-roberto-readable #plannerView [class*="card"],
  body.spm-roberto-readable #plannerView [class*="queue"],
  body.spm-roberto-readable #plannerView [class*="order"]{
    padding:16px!important;
  }
  body.spm-roberto-readable #plannerView h3,
  body.spm-roberto-readable #plannerView h4{
    font-size:19px!important;
  }
  body.spm-roberto-readable #plannerView small{
    font-size:13px!important;
  }

  /* Monitor produzione */
  body.spm-roberto-readable #productionView [class*="card"],
  body.spm-roberto-readable #productionView [class*="run"],
  body.spm-roberto-readable #productionView [class*="production"]{
    padding:16px!important;
  }
  body.spm-roberto-readable #productionView h3,
  body.spm-roberto-readable #productionView h4{
    font-size:19px!important;
  }

  /* Fogli produzione */
  body.spm-roberto-readable #sheetsView input,
  body.spm-roberto-readable #sheetsView select,
  body.spm-roberto-readable #sheetsView textarea{
    font-size:16px!important;
    min-height:46px!important;
  }

  /* Preparazione spedizione */
  body.spm-roberto-readable #shippingPrepView table td,
  body.spm-roberto-readable #truckLoadsView table td{
    font-size:15px!important;
  }
  body.spm-roberto-readable #shippingPrepView button,
  body.spm-roberto-readable #truckLoadsView button{
    min-height:44px!important;
    font-size:14px!important;
  }

  /* Materie prime / Magazzino interno */
  body.spm-roberto-readable #rawMaterialsView table td,
  body.spm-roberto-readable #warehouseView table td{
    font-size:15px!important;
  }
  body.spm-roberto-readable #rawMaterialsView .card b,
  body.spm-roberto-readable #warehouseView .card b{
    font-size:17px!important;
  }

  /* Ricerca e filtri */
  body.spm-roberto-readable .filters input,
  body.spm-roberto-readable .filters select,
  body.spm-roberto-readable [class*="filter"] input,
  body.spm-roberto-readable [class*="filter"] select{
    min-height:48px!important;
    font-size:16px!important;
  }

  /* Evita testi microscopici residui */
  body.spm-roberto-readable [style*="font-size:7"],
  body.spm-roberto-readable [style*="font-size:8"],
  body.spm-roberto-readable [style*="font-size:9"],
  body.spm-roberto-readable [style*="font-size:10"]{
    font-size:12px!important;
  }

  /* Più respiro nelle sezioni operative */
  body.spm-roberto-readable .panel-head,
  body.spm-roberto-readable .section-head,
  body.spm-roberto-readable [class*="panel-head"]{
    gap:14px!important;
    margin-bottom:12px!important;
  }

  @media(max-width:1100px){
    body.spm-roberto-readable .data-table th,
    body.spm-roberto-readable table th{font-size:12px!important}
    body.spm-roberto-readable .data-table td,
    body.spm-roberto-readable table td{font-size:14px!important}
  }
  `;
  document.head.appendChild(st);
}
function apply(){
  document.body.classList.toggle('spm-roberto-readable',isRobertoArea());
}
function boot(){
  style();apply();
  setTimeout(apply,200);
  setTimeout(apply,900);
}
window.SPRobertoOperationalReadability11935={version:'V11.9.35',apply};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

const LOCS=[{name:'Valinhos',lat:-22.97,lng:-46.99,tz:'America/Sao_Paulo'},{name:'São Paulo',lat:-23.55,lng:-46.63,tz:'America/Sao_Paulo'},{name:'Utrecht',lat:52.09,lng:5.12,tz:'Europe/Amsterdam'}];
let loc=LOCS[0],mainTab='sun',sunSub='day',moonSub='day',tideSub='day';
const now=new Date();let selYear=now.getFullYear();let tzMode=String(LOCS[0].tz);
const DPR=Math.min(window.devicePixelRatio||1,2);let dk=matchMedia('(prefers-color-scheme:dark)').matches;
function createPalette(){return {ring:dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)',tick:dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)',tickM:dk?'rgba(255,255,255,.18)':'rgba(0,0,0,.14)',txt:dk?'rgba(255,255,255,.38)':'rgba(0,0,0,.32)',card:dk?'rgba(255,255,255,.7)':'rgba(0,0,0,.65)',northA:dk?'#F09595':'#A32D2D',horiz:dk?'rgba(255,255,255,.2)':'rgba(0,0,0,.14)',grid:dk?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)',sun:'#c75b22',sunDot:'#e8922e',sunP:dk?'rgba(199,91,34,.4)':'rgba(199,91,34,.3)',sunT:dk?'rgba(199,91,34,.75)':'rgba(199,91,34,.55)',sunF:dk?'rgba(199,91,34,.16)':'rgba(199,91,34,.08)',gold:'#c9960e',goldF:dk?'rgba(201,150,14,.18)':'rgba(201,150,14,.1)',goldL:dk?'rgba(201,150,14,.45)':'rgba(201,150,14,.3)',twi:'#5a7aa5',twiF:dk?'rgba(90,122,165,.12)':'rgba(90,122,165,.07)',twiL:dk?'rgba(90,122,165,.35)':'rgba(90,122,165,.2)',moon:'#6e6ca0',moonDot:dk?'#a8a6d4':'#534ab7',moonP:dk?'rgba(110,108,160,.35)':'rgba(110,108,160,.25)',moonT:dk?'rgba(110,108,160,.65)':'rgba(110,108,160,.5)',moonF:dk?'rgba(110,108,160,.16)':'rgba(110,108,160,.08)',dotLbl:dk?'rgba(255,255,255,.85)':'rgba(0,0,0,.75)',dotStr:dk?'rgba(0,0,0,.6)':'rgba(255,255,255,.8)',mSurf:dk?'#c8c6be':'#d4d2ca',mShad:dk?'#222220':'#3a3a36',tideH:dk?'#5DCAA5':'#1D9E75',tideL:dk?'#85B7EB':'#378ADD',tideMid:dk?'#d4a56a':'#c9960e',altFind:dk?'#5DCAA5':'#1D9E75'}}
let C=createPalette();

const yrSel=document.getElementById('yrSelect');
function getTzLabel(){return tzMode}
function syncTzSelect(){const select=document.getElementById('tzSelect');if(![...select.options].some(o=>o.value===tzMode))select.add(new Option(tzMode,tzMode));select.value=tzMode}

function fT(m){if(!Number.isFinite(m))return '—';m=Math.round(m);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function dN(d){const a=['N','NNE','NE','ENE','L','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];return a[Math.round(((d%360+360)%360)/22.5)%16]}
function pN(p){if(p<.0625)return'Nova';if(p<.1875)return'Crescente';if(p<.3125)return'Quarto cresc.';if(p<.4375)return'Gibosa cresc.';if(p<.5625)return'Cheia';if(p<.6875)return'Gibosa ming.';if(p<.8125)return'Quarto ming.';if(p<.9375)return'Minguante';return'Nova'}
function doyF(d){const p=AstroCore.parts(d,tzMode);return AstroCore.dayOfYear(p.year,p.month-1,p.day)}
function fD(d){return new Intl.DateTimeFormat('pt-BR',{timeZone:tzMode,day:'numeric',month:'short'}).format(d)}
const dayLb=[0,3,6,9,12,15,18,21,24].map(h=>({i:h*12,t:String(h).padStart(2,'0')+'h'}));
const mosN=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function yrLb(){return mosN.map((m,i)=>({i:AstroCore.dayOfYear(selYear,i,1),t:m}))}

function getSolEqDoys(){
  const y=selYear;
  const mar=AstroCore.dayOfYear(y,2,20),jun=AstroCore.dayOfYear(y,5,21),sep=AstroCore.dayOfYear(y,8,22),dec=AstroCore.dayOfYear(y,11,21);
  return[{d:mar,l:'Eq ≈'},{d:jun,l:'Sol ≈'},{d:sep,l:'Eq ≈'},{d:dec,l:'Sol ≈'}]}

function render(){
  normalizeControls();
  renderSummary();
  if(mainTab==='sun')renderSun();else if(mainTab==='moon')renderMoon();else renderTide();
  enhanceOutput();savePreferences();
}

function renderSun(){
const sub=sunSub,mins=+document.getElementById('s-ts').value,dayV=+document.getElementById('s-ds').value;
document.getElementById('s-tv').textContent=fT(mins);document.getElementById('s-dv').textContent=fD(fromDoy(dayV));
const data=compute('sun',sub,mins,dayV),el=document.getElementById('sun-out');
const si=sub==='day'?Math.min(Math.round(mins/5),data.length-1):Math.min(dayV,data.length-1);
const sel=data[si],mxD=Math.max(...data.map(d=>d.alt)),mnD=Math.min(...data.map(d=>d.alt));
let h='<div class="card"><div class="card-label">Direção · azimute'+(sub==='year'?' · frequência por setor':'')+'</div><canvas id="s-cp" style="max-width:280px;margin:0 auto"></canvas></div>';
h+='<div class="card"><div class="card-label">Altitude'+(sub==='year'?' às '+fT(mins)+' ao longo do ano':' ao longo do dia')+'</div><canvas id="s-al" style="height:170px"></canvas>';
h+='<div class="legend"><div class="leg-i"><span class="leg-d" style="background:'+C.gold+'"></span>Golden hour</div><div class="leg-i"><span class="leg-d" style="background:'+C.twi+'"></span>Crepúsculos</div>'+(sub==='year'?'<div class="leg-i"><span class="leg-d" style="background:'+C.sun+';opacity:.3"></span>Alt. máx. diária</div><div class="leg-i"><span class="leg-d" style="background:#5a7aa5;opacity:.4"></span>Alt. 3h antes do pico</div>':'')+'</div></div>';
if(sub==='year'){
  const curAlt=sel.alt;
  const dBefore=makeDateFromDoy(dayV,Math.floor(Math.max(0,mins-5)/60),(Math.max(0,mins-5))%60);
  const dAfter=makeDateFromDoy(dayV,Math.floor(Math.min(1440,mins+5)/60),(Math.min(1440,mins+5))%60);
  const altBefore=SunCalc.getPosition(dBefore,loc.lat,loc.lng).altitude*180/Math.PI;
  const altAfter=SunCalc.getPosition(dAfter,loc.lat,loc.lng).altitude*180/Math.PI;
  const isAsc=altAfter>=altBefore;
  const dir=isAsc?'subindo':'descendo';
  h+='<div class="card"><div class="card-label">Horário a '+curAlt.toFixed(1)+'° ('+dir+') no ano</div><canvas id="s-atf" style="height:220px"></canvas>';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="font-size:11px;color:var(--tx3)">Zoom</span><input type="range" id="s-zoom" min="1" max="20" step="1" value="'+(window._sunZoom||1)+'" style="flex:1"><span style="font-size:11px;font-weight:600;min-width:24px;text-align:right" id="s-zv">'+(window._sunZoom||1)+'x</span></div>';
  h+='<div class="legend"><div class="leg-i"><span class="leg-d" style="background:'+C.altFind+'"></span>'+curAlt.toFixed(1)+'° '+dir+'</div><div class="leg-i" style="opacity:.5"><span class="leg-d" style="background:'+C.sunDot+'"></span>Meio-dia solar</div></div></div>'}
h+='<div class="stats-grid" id="s-st"></div>';el.innerHTML=h;
drawComp(sC(document.getElementById('s-cp'),280,280),280,[data],sel.az,C.sunP,C.sunT,C.sunDot,sub==='year'?data:null,C.sun);
const ac=document.getElementById('s-al'),aw=ac.parentElement.clientWidth-32;
let sunDailyMaxCache=null;let sunExtremesCache=null;
if(sub==='year'){sunDailyMaxCache=computeSunDailyMax();sunExtremesCache=computeSunExtremes()}
const altOpts={fill:C.sunF,line:C.sun,dot:C.sunDot,golden:true,twilight:true,minAlt:Math.min(-20,mnD-2),maxAlt:Math.max(15,mxD+5),xLabels:sub==='day'?dayLb:yrLb()};
if(sub==='year'&&sunDailyMaxCache){
  altOpts.maxAlt=Math.max(altOpts.maxAlt,...sunDailyMaxCache.map(d=>d.maxAlt+5));
  altOpts.auxLine=sunDailyMaxCache.map(d=>d.maxAlt);altOpts.auxColor=dk?'rgba(232,146,46,.25)':'rgba(199,91,34,.2)';
  altOpts.auxLine2=sunDailyMaxCache.map(d=>{const m3=Math.max(0,d.maxTime-180);return sunAltAtMin(d.doy,m3)});altOpts.auxColor2=dk?'rgba(90,122,165,.35)':'rgba(90,122,165,.22)';
  const ex=sunExtremesCache;const rc=dk?'rgba(93,202,165,.35)':'rgba(29,158,117,.28)';const bc=dk?'rgba(133,183,235,.35)':'rgba(55,138,221,.28)';
  altOpts.extraMarkers=[
    {d:Number.isFinite(ex.earlyRise.rise)?ex.earlyRise.doy:-1,l:'↑ cedo',col:rc,yi:0},{d:Number.isFinite(ex.lateRise.rise)?ex.lateRise.doy:-1,l:'↑ tarde',col:bc,yi:0},
    {d:Number.isFinite(ex.earlySet.set)?ex.earlySet.doy:-1,l:'↓ cedo',col:bc,yi:1},{d:Number.isFinite(ex.lateSet.set)?ex.lateSet.doy:-1,l:'↓ tarde',col:rc,yi:1}]}
drawAlt(sC(ac,aw,170),aw,170,data,si,altOpts);
if(sub==='year'){const curAlt=sel.alt;
  const dB2=makeDateFromDoy(dayV,Math.floor(Math.max(0,mins-5)/60),(Math.max(0,mins-5))%60);
  const dA2=makeDateFromDoy(dayV,Math.floor(Math.min(1440,mins+5)/60),(Math.min(1440,mins+5))%60);
  const isAsc=SunCalc.getPosition(dA2,loc.lat,loc.lng).altitude>=SunCalc.getPosition(dB2,loc.lat,loc.lng).altitude;
  const fc=document.getElementById('s-atf'),fw=fc.parentElement.clientWidth-32;
  const zoomEl=document.getElementById('s-zoom');
  const zoomVal=window._sunZoom||1;
  zoomEl.value=zoomVal;document.getElementById('s-zv').textContent=zoomVal+'x';
  zoomEl.addEventListener('input',()=>{window._sunZoom=+zoomEl.value;document.getElementById('s-zv').textContent=zoomEl.value+'x';drawSunAltYearTime(sC(fc,fw,220),fw,220,curAlt,isAsc,dayV,sunDailyMaxCache,+zoomEl.value)});
  drawSunAltYearTime(sC(fc,fw,220),fw,220,curAlt,isAsc,dayV,sunDailyMaxCache,zoomVal)}
let sh='<div class="stat-card"><div class="stat-lbl">Altitude</div><div class="stat-v'+(sel.alt<0?' neg':'')+'">'+sel.alt.toFixed(1)+'°</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Azimute</div><div class="stat-v">'+Math.round(sel.az)+'° '+dN(sel.az)+'</div></div>';
if(sub==='day'){const t=solarTimes(dayV);
if(AstroCore.validDate(t.sunrise))sh+='<div class="stat-card"><div class="stat-lbl">Nascer</div><div class="stat-v">'+fT(getMinutesInTz(t.sunrise))+'</div></div>';
if(AstroCore.validDate(t.sunset))sh+='<div class="stat-card"><div class="stat-lbl">Pôr do sol</div><div class="stat-v">'+fT(getMinutesInTz(t.sunset))+'</div></div>';
if(AstroCore.validDate(t.goldenHour))sh+='<div class="stat-card"><div class="stat-lbl">Início golden h.</div><div class="stat-v">'+fT(getMinutesInTz(t.goldenHour))+'</div></div>';
if(AstroCore.validDate(t.sunrise)&&AstroCore.validDate(t.sunset)){const d=Math.round((t.sunset-t.sunrise)/60000);sh+='<div class="stat-card"><div class="stat-lbl">Duração do dia</div><div class="stat-v">'+Math.floor(d/60)+'h'+String(d%60).padStart(2,'0')+'</div></div>'}}
if(sub==='year'){const al=data.map(d=>d.alt);sh+='<div class="stat-card"><div class="stat-lbl">Máx. no ano</div><div class="stat-v">'+Math.max(...al).toFixed(1)+'°</div></div>';sh+='<div class="stat-card"><div class="stat-lbl">Variação</div><div class="stat-v">'+(Math.max(...al)-Math.min(...al)).toFixed(1)+'°</div></div>'}
document.getElementById('s-st').innerHTML=sh;
if(sub==='year'){
  const ex=sunExtremesCache;const sq=getSolEqDoys();
  const tzLbl=getTzLabel();
  let tb='<div class="card"><div class="card-label">Datas-chave · estações aproximadas · '+tzLbl+'</div><table style="width:100%;font-size:12px;border-collapse:collapse">';
  tb+='<tr style="color:var(--tx3);font-size:10px;text-transform:uppercase;letter-spacing:.4px"><td style="padding:6px 4px">Evento</td><td style="padding:6px 4px">Data</td><td style="padding:6px 4px">Hora</td></tr>';
  function noonStr(doy){const d=ex.days[doy];if(!d||d.noon===null)return'—';return fT(d.noon)+' ☉'}
  const rows=[
    {n:'Equinócio mar.',d:sq[0].d,t:noonStr(sq[0].d)},
    {n:'Solstício jun.',d:sq[1].d,t:noonStr(sq[1].d)},
    {n:'Equinócio set.',d:sq[2].d,t:noonStr(sq[2].d)},
    {n:'Solstício dez.',d:sq[3].d,t:noonStr(sq[3].d)},
    {n:'Nascer mais cedo',d:ex.earlyRise.doy,t:fT(ex.earlyRise.rise)},
    {n:'Nascer mais tarde',d:ex.lateRise.doy,t:fT(ex.lateRise.rise)},
    {n:'Pôr mais cedo',d:ex.earlySet.doy,t:fT(ex.earlySet.set)},
    {n:'Pôr mais tarde',d:ex.lateSet.doy,t:fT(ex.lateSet.set)},
    {n:'Dia mais longo',d:ex.longest.doy,t:Math.floor(ex.longest.dur/60)+'h'+String(Math.round(ex.longest.dur%60)).padStart(2,'0')},
    {n:'Dia mais curto',d:ex.shortest.doy,t:Math.floor(ex.shortest.dur/60)+'h'+String(Math.round(ex.shortest.dur%60)).padStart(2,'0')}
  ];
  rows.forEach((r,i)=>{const sep=i===3||i===5||i===7?'border-bottom:1px solid var(--bd)':'';tb+='<tr style="'+sep+'"><td style="padding:5px 4px">'+r.n+'</td><td style="padding:5px 4px;font-weight:600">'+(r.t==='—'?'—':fD(fromDoy(r.d)))+'</td><td style="padding:5px 4px;font-weight:600;font-variant-numeric:tabular-nums">'+r.t+'</td></tr>'});
  tb+='</table>';
  const eots=ex.days.filter(d=>d.eot!==null).map(d=>d.eot);
  const eotMin=Math.min(...eots),eotMax=Math.max(...eots);
  tb+='<div style="font-size:10px;color:var(--tx3);margin-top:8px;line-height:1.5">☉ = meio-dia solar. Desvio do meio-dia solar em relação às 12h: '+eotMin.toFixed(0)+' a '+(eotMax>0?'+':'')+eotMax.toFixed(0)+' min (diferença entre meio-dia solar e 12:00 do relógio).</div>';
  tb+='</div>';
  document.getElementById('s-st').insertAdjacentHTML('afterend',tb)}}

function renderMoon(){
const sub=moonSub,mins=+document.getElementById('m-ts').value,dayV=+document.getElementById('m-ds').value;
document.getElementById('m-tv').textContent=fT(mins);document.getElementById('m-dv').textContent=fD(fromDoy(dayV));
const data=compute('moon',sub,mins,dayV),el=document.getElementById('moon-out');
const si=sub==='day'?Math.min(Math.round(mins/5),data.length-1):Math.min(dayV,data.length-1);const sel=data[si],mxD=Math.max(...data.map(d=>d.alt)),mnD=Math.min(...data.map(d=>d.alt));
let h='<div class="card"><div class="card-label">Direção · azimute</div><canvas id="m-cp" style="max-width:280px;margin:0 auto"></canvas></div>';
h+='<div class="card"><div class="card-label">Altitude'+(sub==='year'?' às '+fT(mins)+' ao longo do ano':' ao longo do dia')+'</div><canvas id="m-al" style="height:170px"></canvas></div>';
const pd=sub==='day'?makeDateFromDoy(dayV,Math.floor(mins/60),mins%60):makeDateFromDoy(dayV,Math.floor(mins/60),mins%60);
const il=SunCalc.getMoonIllumination(pd);
h+='<div class="card"><div class="card-label">Fase da lua</div><div class="moon-phase-row"><canvas id="m-mp"></canvas><div><div class="phase-pct">'+Math.round(il.fraction*100)+'%</div><div class="phase-name">'+pN(il.phase)+'</div></div></div></div>';
h+='<div class="stats-grid" id="m-st"></div>';el.innerHTML=h;
drawComp(sC(document.getElementById('m-cp'),280,280),280,[data],sel.az,C.moonP,C.moonT,C.moonDot,sub==='year'?data:null,C.moon);
const ac=document.getElementById('m-al'),aw=ac.parentElement.clientWidth-32;
drawAlt(sC(ac,aw,170),aw,170,data,si,{fill:C.moonF,line:C.moon,dot:C.moonDot,golden:false,twilight:false,minAlt:Math.min(-8,mnD-2),maxAlt:Math.max(15,mxD+5),xLabels:sub==='day'?dayLb:yrLb()});
drawMoonDisc(document.getElementById('m-mp'),il.phase);
let sh='<div class="stat-card"><div class="stat-lbl">Altitude</div><div class="stat-v'+(sel.alt<0?' neg':'')+'">'+sel.alt.toFixed(1)+'°</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Azimute</div><div class="stat-v">'+Math.round(sel.az)+'° '+dN(sel.az)+'</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Iluminação</div><div class="stat-v">'+Math.round(il.fraction*100)+'%</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Fase</div><div class="stat-v">'+pN(il.phase)+'</div></div>';
document.getElementById('m-st').innerHTML=sh}

function renderTide(){
const sub=tideSub,mins=+document.getElementById('t-ts').value,dayV=+document.getElementById('t-ds').value;
document.getElementById('t-tv').textContent=fT(mins);document.getElementById('t-dv').textContent=fD(fromDoy(dayV));
const el=document.getElementById('tide-out'),il=SunCalc.getMoonIllumination(makeDateFromDoy(dayV,Math.floor(mins/60),mins%60));
const tf=tForce(il.phase),tfP=Math.round(tf*100),barCol=tf>.6?C.tideH:tf>.3?C.tideMid:C.tideL;
let tt,td;if(tf>.75){tt='Sizígia';td='Sol e lua alinhados — marés extremas.'}else if(tf>.5){tt='Moderada-alta';td='Transição entre sizígia e quadratura.'}else if(tf>.25){tt='Moderada-baixa';td='Índice intermediário entre quadratura e sizígia.'}else{tt='Quadratura';td='Sol e lua em ângulo reto — marés suaves.'}
let h='';
if(sub==='day'){const tdd=computeTideDay(dayV),selIdx=Math.min(Math.round(mins/5),tdd.pts.length-1);
h+='<div class="card"><div class="card-label">Simulação didática ao longo do dia</div><canvas id="t-dc" style="height:180px"></canvas><div class="legend"><div class="leg-i"><span class="leg-d" style="background:'+C.tideH+'"></span>Acima da média</div><div class="leg-i"><span class="leg-d" style="background:'+C.tideL+'"></span>Abaixo da média</div></div></div>';
h+='<div class="card"><div class="card-label">Fase da lua</div><div class="moon-phase-row"><canvas id="t-mp"></canvas><div><div class="phase-pct">'+Math.round(il.fraction*100)+'%</div><div class="phase-name">'+pN(il.phase)+'</div></div></div></div>';
h+='<div class="card"><div class="card-label">Índice · '+tt+'</div><div style="display:flex;align-items:center;gap:10px"><span style="font-size:11px;color:var(--tx3);min-width:36px">Índice</span><div class="tide-bar-bg" style="flex:1"><div class="tide-bar-fill" style="width:'+tfP+'%;background:'+barCol+'"></div></div><span style="font-size:13px;font-weight:600;min-width:36px;text-align:right">'+tfP+'%</span></div><div class="tide-label-row"><span>Quadratura</span><span>Sizígia</span></div><div class="tide-info">'+td+'</div></div>';
h+='<div class="stats-grid" id="t-st"></div>';el.innerHTML=h;
const dc=document.getElementById('t-dc'),dw=dc.parentElement.clientWidth-32;drawTideDay(sC(dc,dw,180),dw,180,tdd.pts,selIdx);drawMoonDisc(document.getElementById('t-mp'),il.phase);
let sh='<div class="stat-card"><div class="stat-lbl">Nível relativo (u.r.)</div><div class="stat-v">'+(tdd.pts[selIdx].h>=0?'+':'')+tdd.pts[selIdx].h.toFixed(2)+'</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Amplitude</div><div class="stat-v">'+Math.round(tdd.amp*100)+'%</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Índice</div><div class="stat-v">'+tfP+'%</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Tipo</div><div class="stat-v" style="font-size:14px">'+tt+'</div></div>';
document.getElementById('t-st').innerHTML=sh}
else{const yd=computeTideAtTimeYear(mins),yf=computeTideForceYear();
h+='<div class="card"><div class="card-label">Simulação às '+fT(mins)+' ao longo do ano</div><canvas id="t-yh" style="height:180px"></canvas><div class="legend"><div class="leg-i"><span class="leg-d" style="background:'+C.tideH+'"></span>Nível relativo</div></div></div>';
h+='<div class="card"><div class="card-label">Índice de alinhamento no ano</div><canvas id="t-yf" style="height:160px"></canvas><div class="legend"><div class="leg-i"><span class="leg-d" style="background:'+C.tideH+'"></span>Sizígia</div><div class="leg-i"><span class="leg-d" style="background:'+C.tideL+'"></span>Quadratura</div></div></div>';
h+='<div class="card"><div class="card-label">Índice selecionado · '+tt+'</div><div style="display:flex;align-items:center;gap:10px"><span style="font-size:11px;color:var(--tx3);min-width:36px">Índice</span><div class="tide-bar-bg" style="flex:1"><div class="tide-bar-fill" style="width:'+tfP+'%;background:'+barCol+'"></div></div><span style="font-size:13px;font-weight:600;min-width:36px;text-align:right">'+tfP+'%</span></div><div class="tide-label-row"><span>Quadratura</span><span>Sizígia</span></div><div class="tide-info">'+td+'</div></div>';
h+='<div class="stats-grid" id="t-st"></div>';el.innerHTML=h;
const yh=document.getElementById('t-yh'),yhw=yh.parentElement.clientWidth-32;drawTideYear(sC(yh,yhw,180),yhw,180,yd,dayV);
const yfc=document.getElementById('t-yf'),yfw=yfc.parentElement.clientWidth-32;drawTideYear(sC(yfc,yfw,160),yfw,160,yf,dayV);
let sh='<div class="stat-card"><div class="stat-lbl">Nível relativo às '+fT(mins)+'</div><div class="stat-v">'+(dayV<yd.length?(yd[dayV].h>=0?'+':'')+yd[dayV].h.toFixed(2):'—')+'</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Índice</div><div class="stat-v">'+tfP+'%</div></div>';
const phases=Array.from({length:daysInYear()+1},(_,d)=>SunCalc.getMoonIllumination(makeDateFromDoy(d,0,0)).phase);const peaks=AstroCore.countSyzygies(phases);
sh+='<div class="stat-card"><div class="stat-lbl">Sizígias/ano</div><div class="stat-v">~'+peaks+'</div></div>';
sh+='<div class="stat-card"><div class="stat-lbl">Tipo</div><div class="stat-v" style="font-size:14px">'+tt+'</div></div>';
document.getElementById('t-st').innerHTML=sh}}

setupUI();render();let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(render,120)});

matchMedia('(prefers-color-scheme:dark)').addEventListener('change',e=>{dk=e.matches;C=createPalette();render()});

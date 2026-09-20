/* Interaction, persistence and accessible summaries. Calculations live in core/app. */
let liveMode = true, favorites = [], renderFrame = 0, searchController;
const byId = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function announce(message) { byId('status').textContent = message; }
function scheduleRender() { if (!renderFrame) renderFrame = requestAnimationFrame(() => { renderFrame = 0; render(); }); }
function activePrefix() { return {sun:'s',moon:'m',tide:'t'}[mainTab]; }
function selectedDay() { return +byId(activePrefix() + '-ds').value; }
function selectedMinutes() { return +byId(activePrefix() + '-ts').value; }
function dateISO(day = selectedDay()) {
  return new Date(Date.UTC(selYear, 0, day + 1)).toISOString().slice(0, 10);
}
function setControls(day, minutes) {
  for (const prefix of ['s','m','t']) {
    byId(prefix+'-ds').max = daysInYear()-1;
    byId(prefix+'-ds').value = Math.min(day,daysInYear()-1);
    byId(prefix+'-ts').value = minutes;
  }
}
function applyDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day] = value.split('-').map(Number);
  const test = new Date(Date.UTC(year,month-1,day));
  if (year < 1900 || year > 2100 || test.toISOString().slice(0,10) !== value) return false;
  selYear=year; setControls(AstroCore.dayOfYear(year,month-1,day),selectedMinutes());
  return true;
}
function useNow() {
  const p = AstroCore.parts(new Date(),tzMode);
  selYear=p.year;setControls(AstroCore.dayOfYear(p.year,p.month-1,p.day),p.hour*60+p.minute);
}
function normalizeControls() {
  if (liveMode) useNow();
  setControls(selectedDay(),selectedMinutes());
  const normalized=makeDateFromDoy(selectedDay(),Math.floor(selectedMinutes()/60),selectedMinutes()%60);
  const civil=AstroCore.parts(normalized,tzMode);
  if(!liveMode && civil.year===selYear)setControls(AstroCore.dayOfYear(civil.year,civil.month-1,civil.day),civil.hour*60+civil.minute);
  yrSel.value=selYear;byId('datePicker').value=dateISO();syncTzSelect();
  byId('nowBtn').setAttribute('aria-pressed',String(liveMode));
  const instant=makeDateFromDoy(selectedDay(),Math.floor(selectedMinutes()/60),selectedMinutes()%60);
  byId('timeContext').textContent=(liveMode?'Agora · ':'Explorando · ')+fD(instant)+' '+selYear+' · '+fT(getMinutesInTz(instant))+' · '+tzMode;
  byId('locationLabel').textContent=loc.name+' · '+loc.lat.toFixed(3)+', '+loc.lng.toFixed(3)+' · '+tzMode;
  for(const prefix of ['s','m','t']) {
    byId(prefix+'-tv').textContent=fT(selectedMinutes());byId(prefix+'-dv').textContent=fD(fromDoy(selectedDay()));
    byId(prefix+'-ts').setAttribute('aria-valuetext',fT(selectedMinutes()));
    byId(prefix+'-ds').setAttribute('aria-valuetext',dateISO());
  }
  document.querySelectorAll('.seg-btn,.sub-btn').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
}
function savePreferences() {
  try { localStorage.setItem('astro.preferences.v1',JSON.stringify({loc,tzMode,favorites,mainTab,sunSub,moonSub,tideSub,liveMode,date:dateISO(),minutes:selectedMinutes()})); }
  catch { /* Private browsing and full storage do not stop calculations. */ }
}
function chooseLocation(next) {
  if(!AstroCore.validLocation(next))return;
  loc={name:next.name.slice(0,120),lat:next.lat,lng:next.lng,tz:next.tz};tzMode=loc.tz;
  byId('customLocWrap').style.display='none';renderLocations();render();
}
function sameLocation(a,b) { return a.lat===b.lat&&a.lng===b.lng; }
function renderLocations() {
  const box=byId('locSel');box.replaceChildren();
  const locations=[...LOCS,...favorites.filter(f=>!LOCS.some(l=>sameLocation(l,f)))];
  if(!locations.some(l=>sameLocation(l,loc)))locations.push(loc);
  for(const item of locations){const button=document.createElement('button');button.className='loc-btn';button.textContent=item.name;
    const active=sameLocation(item,loc);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    button.onclick=()=>chooseLocation(item);box.append(button);}
  const custom=document.createElement('button');custom.className='loc-btn';custom.textContent='Coordenadas';custom.onclick=()=>{
    byId('customLocWrap').style.display='';byId('custLat').value=loc.lat;byId('custLng').value=loc.lng;byId('custLat').focus();
  };box.append(custom);
}
function createControls(cid,prefix) {
  byId(cid).innerHTML=`<div class="ctrl-card"><div class="slider-row"><div class="slider-header"><label for="${prefix}-ts">Horário</label><span id="${prefix}-tv"></span></div><input type="range" id="${prefix}-ts" min="0" max="1439" step="1" value="720"></div><div class="slider-row"><div class="slider-header"><label for="${prefix}-ds">Dia do ano</label><span id="${prefix}-dv"></span></div><input type="range" id="${prefix}-ds" min="0" max="${daysInYear()-1}" step="1" value="0"></div></div>`;
  for(const suffix of ['ts','ds'])byId(prefix+'-'+suffix).addEventListener('input',()=>{
    liveMode=false;setControls(+byId(prefix+'-ds').value,+byId(prefix+'-ts').value);scheduleRender();
  });
}
function moonEvents(day) {
  return cached('moonEvents:'+day,()=>{
    const start=makeDateFromDoy(day,0,0).getTime(),end=makeDateFromDoy(day+1,0,0).getTime(),events=[];
    // Same apparent horizon convention as SunCalc 1.9's getMoonTimes.
    const height=ms=>SunCalc.getMoonPosition(new Date(ms),loc.lat,loc.lng).altitude-0.133*Math.PI/180;
    let before=height(start);
    for(let ms=start+300000;ms<=end;ms+=300000){const after=height(ms);
      if((before<0&&after>=0)||(before>=0&&after<0)){
        let lo=ms-300000,hi=ms;const rising=after>=0;
        for(let i=0;i<14;i++){const mid=(lo+hi)/2;if((height(mid)>=0)===rising)hi=mid;else lo=mid;}
        events.push({name:rising?'Nascer da lua':'Pôr da lua',date:new Date((lo+hi)/2)});
      }before=after;
    }return events;
  });
}
function renderSummary() {
  const day=selectedDay(),mins=selectedMinutes(),instant=makeDateFromDoy(day,Math.floor(mins/60),mins%60),times=solarTimes(day);
  const daylight=SunCalc.getPosition(instant,loc.lat,loc.lng).altitude>-.833*Math.PI/180;
  const future=[];
  for(let d=day;d<=day+2;d++){
    const t=solarTimes(d);
    for(const [key,name] of [['sunrise','Nascer do sol'],['sunset','Pôr do sol'],['goldenHour','Golden hour da tarde']]){
      if(AstroCore.validDate(t[key])&&t[key]>instant)future.push({name,date:t[key]});
    }
  }
  future.sort((a,b)=>a.date-b.date);
  const next=future.find(e=>e.name!=='Golden hour da tarde');
  const golden=future.find(e=>e.name==='Golden hour da tarde');
  const moon=moonEvents(day),illum=SunCalc.getMoonIllumination(instant);
  const time=date=>AstroCore.validDate(date)?fT(getMinutesInTz(date)):'Não ocorre neste dia';
  const eventText=event=>event?fD(event.date)+' · '+time(event.date):'Sem evento nos próximos 3 dias';
  const light=daylight?(AstroCore.validDate(times.sunset)&&times.sunset>instant?Math.floor((times.sunset-instant)/3600000)+'h '+Math.floor((times.sunset-instant)/60000)%60+'min':'Sol acima do horizonte'):'Sol abaixo do horizonte';
  const rows=[['Próximo evento solar',next?next.name+' · '+eventText(next):eventText(null)],['Luz restante',light],['Golden hour da tarde',eventText(golden)],['Lua',pN(illum.phase)+' · '+Math.round(illum.fraction*100)+'% iluminada'],['Nascer da lua',time(moon.find(e=>e.name==='Nascer da lua')?.date)],['Pôr da lua',time(moon.find(e=>e.name==='Pôr da lua')?.date)]];
  byId('daySummary').innerHTML=rows.map(([label,value])=>`<div class="stat-card"><div class="stat-lbl">${escapeHTML(label)}</div><div class="summary-value">${escapeHTML(value)}</div></div>`).join('');
}
function enhanceOutput() {
  const panel=byId('panel-'+mainTab);
  if(mainTab==='tide'){
    const note=document.createElement('p');note.className='simulation-note';note.textContent='Simulação didática: índice de alinhamento e nível em unidades relativas (u.r.). Não representa altura em metros nem horários de maré de praias ou portos.';
    byId('tide-out').prepend(note);
  }
  panel.querySelectorAll('canvas').forEach(canvas=>{
    const label=canvas.closest('.card')?.querySelector('.card-label')?.textContent||'Gráfico astronômico';
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label+'; valores selecionados disponíveis em texto abaixo.');
    canvas.setAttribute('aria-describedby',mainTab==='sun'?'s-st':mainTab==='moon'?'m-st':'t-st');
  });
  const zoom=byId('s-zoom');if(zoom)zoom.setAttribute('aria-label','Zoom do gráfico anual de horário solar');
}
function setupUI() {
  createControls('sun-ctrls','s');createControls('moon-ctrls','m');createControls('tide-ctrls','t');
  try {
    const pref=JSON.parse(localStorage.getItem('astro.preferences.v1'));
    if(pref){
      if(AstroCore.validLocation(pref.loc)){loc=pref.loc;tzMode=loc.tz;}
      if(typeof pref.tzMode==='string'&&AstroCore.validZone(pref.tzMode))tzMode=pref.tzMode;
      if(Array.isArray(pref.favorites))favorites=pref.favorites.filter(AstroCore.validLocation).slice(0,12);
      if(['sun','moon','tide'].includes(pref.mainTab))mainTab=pref.mainTab;
      sunSub=pref.sunSub==='year'?'year':'day';moonSub=pref.moonSub==='year'?'year':'day';tideSub=pref.tideSub==='year'?'year':'day';
      if(pref.liveMode===false&&applyDate(pref.date)){liveMode=false;setControls(selectedDay(),Number.isFinite(pref.minutes)?Math.max(0,Math.min(1439,pref.minutes)):720);}
    }
  }catch{}
  const query=new URLSearchParams(location.search);
  if(query.has('lat')&&query.has('lng')){
    const shared={name:query.get('name')||'Local compartilhado',lat:Number(query.get('lat')),lng:Number(query.get('lng')),tz:query.get('tz')||'UTC'};
    if(AstroCore.validLocation(shared)){loc=shared;tzMode=shared.tz;}
  }
  if(query.has('date')&&applyDate(query.get('date'))){liveMode=false;const minutes=Number(query.get('minutes'));setControls(selectedDay(),Number.isFinite(minutes)?Math.min(1439,Math.max(0,minutes)):720);}
  if(['sun','moon','tide'].includes(query.get('tab')))mainTab=query.get('tab');
  if(query.get('view')==='year'){if(mainTab==='sun')sunSub='year';else if(mainTab==='moon')moonSub='year';else tideSub='year';}
  if(liveMode)useNow();renderLocations();syncTzSelect();
  function syncTabs(){
    document.querySelectorAll('#mainSeg .seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.idx===mainTab));
    for(const name of ['sun','moon','tide']){byId('panel-'+name).classList.toggle('active',name===mainTab);const sub={sun:sunSub,moon:moonSub,tide:tideSub}[name];document.querySelectorAll('#'+name+'Sub button').forEach(b=>b.classList.toggle('active',b.dataset.sub===sub));}
  }
  syncTabs();
  document.querySelectorAll('#mainSeg button').forEach(b=>b.onclick=()=>{mainTab=b.dataset.idx;syncTabs();render();});
  for(const name of ['sun','moon','tide'])document.querySelectorAll('#'+name+'Sub button').forEach(b=>b.onclick=()=>{
    if(name==='sun')sunSub=b.dataset.sub;else if(name==='moon')moonSub=b.dataset.sub;else tideSub=b.dataset.sub;syncTabs();render();
  });
  byId('nowBtn').onclick=()=>{liveMode=true;render();};
  byId('datePicker').onchange=e=>{if(applyDate(e.target.value)){liveMode=false;render();}else announce('Escolha uma data entre 1900 e 2100.');};
  yrSel.onchange=()=>{const y=Number(yrSel.value);if(!Number.isInteger(y)||y<1900||y>2100){yrSel.value=selYear;announce('Escolha um ano entre 1900 e 2100.');return;}liveMode=false;selYear=y;render();};
  byId('tzSelect').onchange=e=>{tzMode=e.target.value;render();};
  byId('custGo').onclick=()=>{
    if(!byId('custLat').reportValidity()||!byId('custLng').reportValidity())return;
    chooseLocation({name:'Local personalizado',lat:Number(byId('custLat').value),lng:Number(byId('custLng').value),tz:tzMode});
    announce('Coordenadas aplicadas. Confira o fuso nas configurações.');
  };
  byId('geoBtn').onclick=()=>{
    if(!navigator.geolocation){announce('Localização indisponível. Use a busca ou as coordenadas.');return;}
    announce('Obtendo localização…');navigator.geolocation.getCurrentPosition(position=>{
      chooseLocation({name:'Minha localização',lat:position.coords.latitude,lng:position.coords.longitude,tz:Intl.DateTimeFormat().resolvedOptions().timeZone});
      announce('Localização aplicada com o fuso do dispositivo.');
    },()=>announce('Não foi possível obter a localização. Use a busca ou informe coordenadas.'),{timeout:10000,maximumAge:60000});
  };
  byId('saveLoc').onclick=()=>{
    if(!favorites.some(f=>sameLocation(f,loc))){if(favorites.length>=12){announce('Limite de 12 favoritos. Remova um para salvar outro.');return;}favorites.push({...loc,tz:tzMode});}
    savePreferences();renderLocations();announce('Favorito salvo neste dispositivo.');
  };
  byId('removeLoc').onclick=()=>{favorites=favorites.filter(f=>!sameLocation(f,loc));savePreferences();renderLocations();announce('Favorito removido. Os três locais iniciais permanecem disponíveis.');};
  byId('cityForm').onsubmit=async e=>{
    e.preventDefault();const term=byId('cityQuery').value.trim();if(term.length<2){announce('Digite pelo menos duas letras.');return;}
    searchController?.abort();const controller=new AbortController();searchController=controller;
    const timer=setTimeout(()=>controller.abort(),10000);byId('cityResults').replaceChildren();announce('Buscando cidades…');
    try{
      const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:term,count:'6',language:'pt',format:'json'});
      const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('search');const data=await response.json();
      if(searchController!==controller)return;
      const results=(data.results||[]).map(r=>({name:[r.name,r.admin1,r.country].filter(Boolean).join(', '),lat:r.latitude,lng:r.longitude,tz:r.timezone})).filter(AstroCore.validLocation);
      for(const item of results){const b=document.createElement('button');b.textContent=item.name;b.onclick=()=>{chooseLocation(item);byId('cityResults').replaceChildren();announce('Cidade selecionada.');};byId('cityResults').append(b);}
      announce(results.length?'Selecione a cidade abaixo.':'Nenhuma cidade encontrada. Tente outro nome.');
    }catch{if(searchController===controller)announce('Busca indisponível. Verifique a conexão ou use coordenadas.');}finally{clearTimeout(timer);}
  };
  byId('shareBtn').onclick=async()=>{
    const url=new URL(location.href);url.search=new URLSearchParams({name:loc.name,lat:loc.lat,lng:loc.lng,tz:tzMode,date:dateISO(),minutes:selectedMinutes(),tab:mainTab,view:{sun:sunSub,moon:moonSub,tide:tideSub}[mainTab]});
    try{if(navigator.share)await navigator.share({title:'Astro — Sol & Lua',url:url.href});else{await navigator.clipboard.writeText(url.href);announce('Link copiado.');}}
    catch(error){if(error.name!=='AbortError'){const input=document.createElement('input');input.value=url.href;input.readOnly=true;input.setAttribute('aria-label','Link para compartilhar');byId('status').replaceChildren(input);input.select();}}
  };
  const overlay=byId('settingsOverlay'),sheet=overlay.querySelector('[role=dialog]');
  const close=()=>{overlay.classList.remove('open');document.querySelector('.app').inert=false;byId('gearBtn').focus();};
  byId('gearBtn').onclick=()=>{overlay.classList.add('open');document.querySelector('.app').inert=true;byId('settingsClose').focus();};
  byId('settingsClose').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};
  sheet.onkeydown=e=>{if(e.key==='Escape'){close();return;}if(e.key==='Tab'){const nodes=[...sheet.querySelectorAll('button,select,input')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  setInterval(()=>{if(liveMode&&!document.hidden)render();},30000);
  document.addEventListener('visibilitychange',()=>{if(liveMode&&!document.hidden)render();});
}

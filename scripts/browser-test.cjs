const {createServer}=require('./serve.cjs');
const puppeteer=require('puppeteer-core');
const {existsSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!executablePath)throw Error('Defina CHROME_PATH para executar os testes de navegador.');
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});await page.emulateTimezone('America/Los_Angeles');
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/?lat=52.09&lng=5.12&name=Utrecht&tz=Europe%2FAmsterdam&date=2026-07-15&minutes=720',{waitUntil:'networkidle0'});
  await page.waitForSelector('#s-st');
  assert.match(await page.$eval('#timeContext',e=>e.textContent),/12:00.*Europe\/Amsterdam/);
  assert.equal(await page.evaluate(()=>makeDateFromDoy(selectedDay(),12,0).toISOString()),'2026-07-15T10:00:00.000Z');
  await page.evaluate(()=>{applyDate('2026-03-29');setControls(selectedDay(),150);render();});
  assert.equal(await page.$eval('#s-ts',e=>e.value),'210','Missing civil hour must normalize to 03:30 in both label and control');
  await page.evaluate(()=>{applyDate('2026-07-15');setControls(selectedDay(),720);render();});
  assert.equal(await page.evaluate(()=>tForce(.5)),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Measure expensive calculations, not wall-clock timing alone.
  const perf=await page.evaluate(()=>{
    let calls=0;const original=SunCalc.getPosition;SunCalc.getPosition=(...args)=>{calls++;return original(...args);};
    sunSub='year';const start=performance.now();render();const first=calls,firstMs=performance.now()-start;
    calls=0;const again=performance.now();render();const repeat=calls,repeatMs=performance.now()-again;
    SunCalc.getPosition=original;return {first,repeat,firstMs,repeatMs};
  });
  console.log('Annual rendering:',JSON.stringify(perf));assert.ok(perf.repeat<2000,'Annual redraw must reuse cached calculations');
  assert.equal(await page.evaluate(()=>{const zoom=document.getElementById('s-zoom');zoom.value='5';zoom.dispatchEvent(new Event('input'));return zoom===document.getElementById('s-zoom');}),true,'Zoom must keep the dragged input mounted');
  for(const tab of ['sun','moon','tide']){
    await page.click(`[data-idx="${tab}"]`);
    for(const sub of ['day','year']){
      await page.click(`#${tab}Sub [data-sub="${sub}"]`);
      const text=await page.$eval('#panel-'+tab,e=>e.textContent);
      assert.ok(!/NaN|Infinity|undefined/.test(text),tab+'/'+sub+' must show finite values');
    }
  }
  assert.match(await page.$eval('#tide-out',e=>e.textContent),/Simulação didática/);
  const count=await page.evaluate(()=>AstroCore.countSyzygies(Array.from({length:daysInYear()+1},(_,d)=>SunCalc.getMoonIllumination(makeDateFromDoy(d,0,0)).phase)));
  assert.ok(count>=24&&count<=25);
  // Leap-year bounds change immediately and persist across tabs/reload.
  await page.evaluate(()=>{applyDate('2024-12-31');liveMode=false;render();});
  await page.click('#gearBtn');await page.$eval('#yrSelect',e=>{e.value='2025';e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#datePicker',e=>e.value),'2025-12-31');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'gearBtn');
  await page.goto(base+'/',{waitUntil:'networkidle0'});
  assert.equal(await page.$eval('#datePicker',e=>e.value),'2025-12-31');
  // Polar regions and exactly +/-90 must not expose NaN/Infinity.
  for(const lat of [69.65,90,-90]){
    await page.evaluate(lat=>{chooseLocation({name:'Polar',lat,lng:18.96,tz:'Europe/Oslo'});applyDate('2026-06-21');mainTab='sun';sunSub='year';render();},lat);
    const text=await page.$eval('#sun-out',e=>e.textContent);assert.ok(!/NaN|Infinity|undefined/.test(text),'polar latitude '+lat);
  }
  // Search UI: deterministic external service fixture and explicit offline error.
  await page.setRequestInterception(true);
  page.on('request',request=>{
    if(request.url().startsWith('https://geocoding-api.open-meteo.com/'))request.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({results:[{name:'Lisboa',country:'Portugal',latitude:38.72,longitude:-9.14,timezone:'Europe/Lisbon'}]})});
    else request.continue();
  });
  await page.click('.location-tools summary');await page.type('#cityQuery','Lisboa');await page.click('#cityForm button');await page.waitForSelector('#cityResults button');await page.click('#cityResults button');
  assert.match(await page.$eval('#locationLabel',e=>e.textContent),/Lisboa.*Europe\/Lisbon/);
  await page.click('#saveLoc');await page.goto(base+'/',{waitUntil:'networkidle0'});
  assert.match(await page.$eval('#locSel',e=>e.textContent),/Lisboa/);
  await page.click('#nowBtn');assert.equal(await page.$eval('#nowBtn',e=>e.getAttribute('aria-pressed')),'true');
  await page.$eval('#s-ts',e=>{e.value='900';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>!liveMode);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await page.$eval('#s-ts',e=>e.value),'900','Exploration must not be replaced when resuming the tab');
  await page.click('#nowBtn');
  assert.equal(await page.evaluate(()=>selectedMinutes()===getMinutesInTz(new Date())),true);
  // Offline load including shared URLs, lazy tabs and actual JS MIME.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.reload({waitUntil:'networkidle0'});
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true);
  await page.setOfflineMode(true);
  await page.goto(base+'/?lat=-23.55&lng=-46.63&name=São%20Paulo&tz=America%2FSao_Paulo&date=2026-09-20&minutes=600',{waitUntil:'networkidle0'});
  await page.waitForSelector('#s-st');
  for(const tab of ['moon','tide','sun'])await page.click(`[data-idx="${tab}"]`);
  assert.equal(await page.evaluate(async()=>{try{const r=await fetch('missing.js');return (r.headers.get('content-type')||'').includes('text/html');}catch{return false;}}),false);
  const artifacts=path.join(__dirname,'../artifacts');mkdirSync(artifacts,{recursive:true});
  await page.click('#sunSub [data-sub="day"]');await page.screenshot({path:path.join(artifacts,'mobile.png'),fullPage:true});
  await page.setViewport({width:320,height:720});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px must not overflow');
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]);await page.waitForFunction(()=>dk===true);
  await page.screenshot({path:path.join(artifacts,'mobile-dark.png'),fullPage:true});
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await page.waitForFunction(()=>dk===false);
  await page.setViewport({width:1280,height:900});await page.evaluate(()=>render());await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('Browser checks passed: six views, timezones, persistence, polar dates, search, accessibility and offline.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

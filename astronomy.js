/* SunCalc calculations with a bounded cache keyed by location, timezone and year. */
const calculationCache=new Map();

function getMinutesInTz(date){const p=AstroCore.parts(date,tzMode);return p?p.hour*60+p.minute:NaN}

function makeDate(year,month,day,hours,minutes){return AstroCore.fromCivil(year,month,day,hours,minutes,tzMode)}

function fromDoy(d){return makeDateFromDoy(d,12,0)}

function makeDateFromDoy(doy,hrs,mins){return makeDate(selYear,0,1+doy,hrs,mins)}

function cached(key,calculate){const k=[loc.lat,loc.lng,tzMode,selYear,key].join('|');if(calculationCache.has(k)){const value=calculationCache.get(k);calculationCache.delete(k);calculationCache.set(k,value);return value;}const value=calculate();if(calculationCache.size>=1200)calculationCache.delete(calculationCache.keys().next().value);calculationCache.set(k,value);return value}

function solarTimes(doy){return cached('events:'+doy,()=>SunCalc.getTimes(fromDoy(doy),loc.lat,loc.lng))}

function tForce(ph){return AstroCore.tideStrength(ph)}

function daysInYear(){return((selYear%4===0&&selYear%100!==0)||selYear%400===0)?366:365}


function computeRaw(type,mode,mins,dayOfYear){const a=[],dy=daysInYear();
if(mode==='day'){const base=fromDoy(dayOfYear);for(let m=0;m<=1440;m+=5){const d=makeDateFromDoy(dayOfYear,Math.floor(m/60),m%60);const q=type==='sun'?SunCalc.getPosition(d,loc.lat,loc.lng):SunCalc.getMoonPosition(d,loc.lat,loc.lng);a.push({min:m,alt:q.altitude*180/Math.PI,az:((q.azimuth*180/Math.PI+180)%360+360)%360,above:q.altitude>0})}}
else{for(let d=0;d<dy;d++){const dt=makeDateFromDoy(d,Math.floor(mins/60),mins%60);const q=type==='sun'?SunCalc.getPosition(dt,loc.lat,loc.lng):SunCalc.getMoonPosition(dt,loc.lat,loc.lng);a.push({doy:d,alt:q.altitude*180/Math.PI,az:((q.azimuth*180/Math.PI+180)%360+360)%360,above:q.altitude>0})}}return a}


/* Sun: find time when sun reaches targetAlt while ascending */
function sunAltAtMin(doy,m){const d=makeDateFromDoy(doy,Math.floor(m/60),m%60);return SunCalc.getPosition(d,loc.lat,loc.lng).altitude*180/Math.PI}

function findSunTimeAtAlt(dayOfYear,targetAlt,ascending){
  const samples=computeSunDailyMax()[dayOfYear].altitudes;
  for(let i=1;i<samples.length;i++){
    const crosses=ascending?samples[i-1]<targetAlt&&samples[i]>=targetAlt:samples[i-1]>targetAlt&&samples[i]<=targetAlt;
    if(!crosses)continue;
    let lo=(i-1)*5,hi=i*5;
    for(let step=0;step<12;step++){const mid=(lo+hi)/2;const below=sunAltAtMin(dayOfYear,mid)<targetAlt;if(below===ascending)lo=mid;else hi=mid;}
    return(lo+hi)/2;
  }return null;
}

function findSunTimeAtAltAsc(dayOfYear,targetAlt){return findSunTimeAtAlt(dayOfYear,targetAlt,true)}

function findSunTimeAtAltDesc(dayOfYear,targetAlt){return findSunTimeAtAlt(dayOfYear,targetAlt,false)}


/* Draw: time when sun is at current alt across the year */
function computeSunExtremesRaw(){
  const dy=daysInYear(),days=[];
  for(let d=0;d<dy;d++){const t=solarTimes(d);
    const rise=AstroCore.validDate(t.sunrise)?getMinutesInTz(t.sunrise):null;
    const set=AstroCore.validDate(t.sunset)?getMinutesInTz(t.sunset):null;
    const dur=(rise!==null&&set!==null)?(t.sunset-t.sunrise)/60000:(sunAltAtMin(d,720)>-0.833?1440:0);
    const noon=AstroCore.validDate(t.solarNoon)?getMinutesInTz(t.solarNoon):null;
    const eot=noon!==null?noon-720:null;
    days.push({doy:d,rise,set,dur,noon,eot})}
  const withRise=days.filter(d=>d.rise!==null),withSet=days.filter(d=>d.set!==null),withDur=days.filter(d=>d.dur!==null);
  return{
    earlyRise:withRise.reduce((a,b)=>a.rise<b.rise?a:b,{rise:Infinity,doy:0}),
    lateRise:withRise.reduce((a,b)=>a.rise>b.rise?a:b,{rise:-Infinity,doy:0}),
    earlySet:withSet.reduce((a,b)=>a.set<b.set?a:b,{set:Infinity,doy:0}),
    lateSet:withSet.reduce((a,b)=>a.set>b.set?a:b,{set:-Infinity,doy:0}),
    longest:withDur.reduce((a,b)=>a.dur>b.dur?a:b,{dur:-Infinity,doy:0}),
    shortest:withDur.reduce((a,b)=>a.dur<b.dur?a:b,{dur:Infinity,doy:0}),
    days}}


function computeSunDailyMaxRaw(){const dy=daysInYear(),out=[];for(let d=0;d<dy;d++){let mx=-999,mxMin=720;const altitudes=[];for(let m=0;m<=1440;m+=5){const alt=sunAltAtMin(d,m);altitudes.push(alt);if(alt>mx){mx=alt;mxMin=m}}out.push({doy:d,maxAlt:mx,maxTime:mxMin,altitudes})}return out}


function getMoonTransitMinRaw(doy){let mx=-999,tm=720;for(let m=0;m<=1440;m+=5){const d=makeDateFromDoy(doy,Math.floor(m/60),m%60);const p=SunCalc.getMoonPosition(d,loc.lat,loc.lng);if(p.altitude>mx){mx=p.altitude;tm=m}}return tm}

function computeTideDayRaw(doy){const il=SunCalc.getMoonIllumination(fromDoy(doy));const amp=.3+.7*tForce(il.phase);const transit=getMoonTransitMin(doy);const period=745;const offset=transit-period/4;const pts=[];
for(let m=0;m<=1440;m+=5){const t=(m-offset)/period*2*Math.PI;const hv=amp*Math.cos(t)+amp*.4*Math.cos(2*t+.5);pts.push({min:m,h:hv/1.4})}return{pts,amp,phase:il.phase,fraction:il.fraction}}

function computeTideAtTimeYear(mins){const dy=daysInYear(),pts=[];for(let d=0;d<dy;d++){const td=computeTideDay(d);const idx=Math.min(Math.round(mins/5),td.pts.length-1);pts.push({doy:d,h:td.pts[idx].h,force:tForce(td.phase)})}return pts}

function computeTideForceYearRaw(){const dy=daysInYear(),pts=[];for(let d=0;d<dy;d++){const il=SunCalc.getMoonIllumination(fromDoy(d));pts.push({doy:d,force:tForce(il.phase),phase:il.phase})}return pts}


function computeSunDailyMax(){return cached('max',()=>computeSunDailyMaxRaw())}


function computeSunExtremes(){return cached('extremes',()=>computeSunExtremesRaw())}


function getMoonTransitMin(doy){return cached('transit'+[doy].join(':'),()=>getMoonTransitMinRaw(doy))}


function computeTideDay(doy){return cached('tideDay'+[doy].join(':'),()=>computeTideDayRaw(doy))}


function computeTideForceYear(){return cached('tideForce',()=>computeTideForceYearRaw())}


function compute(type,mode,mins,dayOfYear){return cached('positions'+[type,mode,mode==='day'?dayOfYear:mins].join(':'),()=>computeRaw(type,mode,mins,dayOfYear))}

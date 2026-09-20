/* Canvas drawing; consumes the selected view and computed data. */

function sC(cv,w,h){cv.width=w*DPR;cv.height=h*DPR;cv.style.width=w+'px';cv.style.height=h+'px';const c=cv.getContext('2d');c.scale(DPR,DPR);return c}


function drawAzFreq(ctx,sz,data,color){
  const cx=sz/2,cy=sz/2,r=sz/2-26;
  const bins=36,binW=360/bins,counts=new Array(bins).fill(0);
  data.forEach(d=>{const b=Math.floor(((d.az%360+360)%360)/binW)%bins;counts[b]++});
  const mx=Math.max(...counts);if(mx===0)return;
  for(let i=0;i<bins;i++){if(counts[i]===0)continue;
    const a1=(i*binW-90)*Math.PI/180,a2=((i+1)*binW-90)*Math.PI/180;
    const fr=12+(r-24)*(counts[i]/mx);
    ctx.fillStyle=color;ctx.globalAlpha=.18+.42*(counts[i]/mx);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,fr,a1,a2);ctx.closePath();ctx.fill();
    ctx.strokeStyle=color;ctx.globalAlpha=.25+.35*(counts[i]/mx);ctx.lineWidth=.5;ctx.stroke()}
  ctx.globalAlpha=1}


function drawComp(ctx,sz,segs,selAz,pCol,tCol,dCol,freqData,freqColor){
const cx=sz/2,cy=sz/2,r=sz/2-26;ctx.clearRect(0,0,sz,sz);
for(let i=3;i>=1;i--){ctx.strokeStyle=C.ring;ctx.lineWidth=.5;ctx.beginPath();ctx.arc(cx,cy,r*i/3,0,Math.PI*2);ctx.stroke()}
ctx.strokeStyle=C.tickM;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
for(let i=0;i<360;i+=5){const rad=(i-90)*Math.PI/180,maj=i%30===0,mid=i%10===0;if(!mid&&!maj)continue;const inn=r-(maj?9:4);ctx.strokeStyle=maj?C.tickM:C.tick;ctx.lineWidth=maj?.8:.4;ctx.beginPath();ctx.moveTo(cx+inn*Math.cos(rad),cy+inn*Math.sin(rad));ctx.lineTo(cx+r*Math.cos(rad),cy+r*Math.sin(rad));ctx.stroke()}
ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 13px -apple-system,sans-serif';
[{t:'N',a:-90},{t:'L',a:0},{t:'S',a:90},{t:'O',a:180}].forEach(l=>{const rad=l.a*Math.PI/180,d=r+16;ctx.fillStyle=l.t==='N'?C.northA:C.card;ctx.fillText(l.t,cx+d*Math.cos(rad),cy+d*Math.sin(rad))});
if(freqData)drawAzFreq(ctx,sz,freqData,freqColor||pCol);
segs.forEach(seg=>{if(seg.length<2)return;[seg.filter(p=>!p.above),seg.filter(p=>p.above)].forEach((pts,pi)=>{if(pts.length<2)return;const col=pi?tCol:pCol,w=pi?2.5:1.2;const subs=[[]];pts.forEach((p,i)=>{if(i>0&&Math.abs(p.az-pts[i-1].az)>90)subs.push([]);subs[subs.length-1].push(p)});subs.forEach(ss=>{if(ss.length<2)return;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();ss.forEach((p,i)=>{const rad=(p.az-90)*Math.PI/180,x=cx+(r-12)*Math.cos(rad),y=cy+(r-12)*Math.sin(rad);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke()})})});
const sr=(selAz-90)*Math.PI/180;ctx.strokeStyle=dCol;ctx.lineWidth=2;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+(r-4)*Math.cos(sr),cy+(r-4)*Math.sin(sr));ctx.stroke();ctx.fillStyle=dCol;ctx.beginPath();ctx.arc(cx+(r-12)*Math.cos(sr),cy+(r-12)*Math.sin(sr),6,0,Math.PI*2);ctx.fill();ctx.fillStyle=dk?'#444':'#bbb';ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();ctx.font='600 10px -apple-system,sans-serif';ctx.fillStyle=C.dotLbl;ctx.textAlign='center';const lx=cx+(r-12)*Math.cos(sr)+20*Math.cos(sr),ly=cy+(r-12)*Math.sin(sr)+20*Math.sin(sr);ctx.strokeStyle=C.dotStr;ctx.lineWidth=3;const at=Math.round(((selAz%360)+360)%360)+'°';ctx.strokeText(at,lx,ly);ctx.fillText(at,lx,ly)}

function drawSolEqMarkers(ctx,xP,padT,padB,h,dy){
  const marks=getSolEqDoys();
  const col=dk?'rgba(255,255,255,.18)':'rgba(0,0,0,.12)';
  const txtCol=dk?'rgba(255,255,255,.3)':'rgba(0,0,0,.22)';
  marks.forEach(m=>{if(m.d>=dy)return;
    const x=xP(m.d);ctx.strokeStyle=col;ctx.lineWidth=.8;ctx.setLineDash([3,4]);
    ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,h-padB);ctx.stroke();ctx.setLineDash([]);
    ctx.font='500 8px -apple-system,sans-serif';ctx.fillStyle=txtCol;ctx.textAlign='center';
    ctx.fillText(m.l,x,padT-1)})}


function drawAlt(ctx,w,h,data,selIdx,o){
ctx.clearRect(0,0,w,h);const p={t:12,b:24,l:32,r:8},cw=w-p.l-p.r,ch=h-p.t-p.b,mi=o.minAlt,ma=o.maxAlt,rng=ma-mi;
function xP(i){return p.l+i/(data.length-1)*cw}function yP(a){return p.t+(1-(a-mi)/rng)*ch}
if(o.golden&&ma>=6){const y0=yP(0),y6=yP(Math.min(6,ma));ctx.fillStyle=C.goldF;ctx.fillRect(p.l,y6,cw,y0-y6);ctx.strokeStyle=C.goldL;ctx.lineWidth=.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(p.l,y6);ctx.lineTo(w-p.r,y6);ctx.stroke();ctx.setLineDash([]);ctx.font='500 8px -apple-system,sans-serif';ctx.fillStyle=C.gold;ctx.textAlign='left';ctx.fillText('golden hour',p.l+3,y6+9)}
if(o.twilight){[{f:0,t:-6,l:'civil'},{f:-6,t:-12,l:'náutico'},{f:-12,t:-18,l:'astronômico'}].forEach(z=>{if(z.t<mi-1)return;const y1=yP(z.f),y2=yP(Math.max(z.t,mi));ctx.fillStyle=C.twiF;ctx.fillRect(p.l,y1,cw,y2-y1);ctx.strokeStyle=C.twiL;ctx.lineWidth=.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(p.l,y2);ctx.lineTo(w-p.r,y2);ctx.stroke();ctx.setLineDash([]);ctx.font='500 7px -apple-system,sans-serif';ctx.fillStyle=C.twi;ctx.textAlign='left';ctx.fillText(z.l,p.l+3,y2-3)})}
if(mi<=0&&ma>=0){const hy=yP(0);ctx.strokeStyle=C.horiz;ctx.lineWidth=1.2;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.l,hy);ctx.lineTo(w-p.r,hy);ctx.stroke();ctx.font='500 8px -apple-system,sans-serif';ctx.fillStyle=C.txt;ctx.textAlign='left';ctx.fillText('horizonte',p.l+3,hy-5)}
const step=rng>80?30:rng>40?15:10;ctx.font='400 9px -apple-system,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
for(let a=Math.ceil(mi/step)*step;a<=ma;a+=step){const y=yP(a);if(y<p.t-2||y>h-p.b+2)continue;if(a!==0){ctx.strokeStyle=C.grid;ctx.lineWidth=.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke()}ctx.fillStyle=C.txt;ctx.fillText(a+'°',p.l-4,y)}
ctx.textAlign='center';ctx.textBaseline='top';if(o.xLabels)o.xLabels.forEach(lb=>{ctx.fillStyle=C.txt;ctx.fillText(lb.t,xP(lb.i),h-p.b+5)});
if(data.length>300)drawSolEqMarkers(ctx,xP,p.t,p.b,h,data.length);
if(mi<=0&&ma>=0){const hy=yP(0);ctx.fillStyle=o.fill;ctx.beginPath();ctx.moveTo(p.l,hy);data.forEach((d,i)=>{ctx.lineTo(xP(i),d.alt>=0?yP(d.alt):hy)});ctx.lineTo(xP(data.length-1),hy);ctx.closePath();ctx.fill()}
ctx.strokeStyle=o.line;ctx.lineWidth=2;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();data.forEach((d,i)=>{i===0?ctx.moveTo(xP(i),yP(d.alt)):ctx.lineTo(xP(i),yP(d.alt))});ctx.stroke();
if(o.auxLine&&o.auxLine.length===data.length){ctx.strokeStyle=o.auxColor||C.txt;ctx.lineWidth=1.5;ctx.lineCap='round';ctx.setLineDash([4,4]);ctx.beginPath();o.auxLine.forEach((v,i)=>{const x=xP(i),y=yP(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke();ctx.setLineDash([])}
if(o.auxLine2&&o.auxLine2.length===data.length){ctx.strokeStyle=o.auxColor2||C.txt;ctx.lineWidth=1.5;ctx.lineCap='round';ctx.setLineDash([3,5]);ctx.beginPath();o.auxLine2.forEach((v,i)=>{const x=xP(i),y=yP(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke();ctx.setLineDash([])}
if(o.extraMarkers){const emCol=dk?'rgba(93,202,165,.3)':'rgba(29,158,117,.2)';const emTxt=dk?'rgba(93,202,165,.5)':'rgba(29,158,117,.4)';
o.extraMarkers.forEach(m=>{if(m.d<0||m.d>=data.length)return;const x=xP(m.d);ctx.strokeStyle=m.col||emCol;ctx.lineWidth=.7;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(x,p.t);ctx.lineTo(x,h-p.b);ctx.stroke();ctx.setLineDash([]);
ctx.font='500 7px -apple-system,sans-serif';ctx.fillStyle=m.col||emTxt;ctx.textAlign='center';
const lbl=m.l;const tx=x,ty=p.t+(m.yi||0)*9;ctx.fillText(lbl,tx,ty)})}
if(selIdx!==null&&selIdx>=0&&selIdx<data.length){const sx=xP(selIdx),sy=yP(data[selIdx].alt);ctx.strokeStyle=o.dot+'44';ctx.lineWidth=.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(sx,p.t);ctx.lineTo(sx,h-p.b);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=o.dot;ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();ctx.fillStyle=dk?'#000':'#fff';ctx.beginPath();ctx.arc(sx,sy,1.5,0,Math.PI*2);ctx.fill();ctx.font='600 10px -apple-system,sans-serif';ctx.fillStyle=C.dotLbl;ctx.textAlign='center';ctx.strokeStyle=C.dotStr;ctx.lineWidth=3;const t=data[selIdx].alt.toFixed(1)+'°';ctx.strokeText(t,sx,sy-12);ctx.fillText(t,sx,sy-12)}}


function drawMoonDisc(cv,phase){const sz=56;cv.width=sz*DPR;cv.height=sz*DPR;cv.style.width=sz+'px';cv.style.height=sz+'px';const ctx=cv.getContext('2d');ctx.scale(DPR,DPR);const cx=sz/2,cy=sz/2,r=sz/2-3;ctx.fillStyle=C.mSurf;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.mShad;ctx.beginPath();const a=phase*2*Math.PI;if(phase<=.5){ctx.arc(cx,cy,r,-Math.PI/2,Math.PI/2,false);const k=Math.cos(a);ctx.ellipse(cx,cy,Math.abs(k)*r,r,0,Math.PI/2,-Math.PI/2,k>0)}else{ctx.arc(cx,cy,r,Math.PI/2,-Math.PI/2,false);const k=Math.cos(a);ctx.ellipse(cx,cy,Math.abs(k)*r,r,0,-Math.PI/2,Math.PI/2,k<=0)}ctx.fill();ctx.strokeStyle=dk?'rgba(255,255,255,.12)':'rgba(0,0,0,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke()}


function drawSunAltYearTime(ctx,w,h,targetAlt,isAscending,dayV,dailyMax,zoom){
  ctx.clearRect(0,0,w,h);const pad={t:12,b:24,l:38,r:8},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b,dy=daysInYear();
  const finder=isAscending?findSunTimeAtAltAsc:findSunTimeAtAltDesc;
  const pts=cached('altTimes:'+targetAlt+':'+isAscending,()=>{const result=[];for(let d=0;d<dy;d++){const t=finder(d,targetAlt);if(t!==null)result.push({d,m:t})}return result})
  const noonTimes=dailyMax?dailyMax.map(d=>d.maxTime):[];
  const zf=zoom||1;
  let yMin=0,yMax=1440;
  if(pts.length>0){
    const dataMin=Math.min(...pts.map(p=>p.m));const dataMax=Math.max(...pts.map(p=>p.m));
    const span=dataMax-dataMin||60;
    const margin=Math.max(20,span*.12)/zf;
    yMin=Math.max(0,Math.floor((dataMin-margin)/15)*15);
    yMax=Math.min(1440,Math.ceil((dataMax+margin)/15)*15);
    if(yMax-yMin<30){const mid=(yMin+yMax)/2;yMin=Math.max(0,mid-15);yMax=Math.min(1440,mid+15)}
  }
  function xP(i){return pad.l+i/(dy-1)*cw}function yP(mins){return pad.t+(1-(mins-yMin)/(yMax-yMin))*ch}
  ctx.font='400 9px -apple-system,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  const hRange=yMax-yMin;const hStep=hRange>600?3:hRange>300?2:hRange>120?1:0.5;
  for(let hr=Math.ceil(yMin/60/hStep)*hStep;hr<=Math.floor(yMax/60);hr+=hStep){const m=hr*60;const y=yP(m);if(y<pad.t-2||y>h-pad.b+2)continue;ctx.strokeStyle=C.grid;ctx.lineWidth=.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=C.txt;const lbl=fT(m);ctx.fillText(lbl,pad.l-4,y)}
  ctx.textAlign='center';ctx.textBaseline='top';yrLb().forEach(lb=>{ctx.fillStyle=C.txt;ctx.fillText(lb.t,xP(lb.i),h-pad.b+5)});
  drawSolEqMarkers(ctx,xP,pad.t,pad.b,h,dy);
  if(dailyMax&&dailyMax.length>1){ctx.strokeStyle=dk?'rgba(232,146,46,.3)':'rgba(199,91,34,.22)';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.setLineDash([4,4]);ctx.beginPath();
  dailyMax.forEach((d,i)=>{const x=xP(i),raw=d.maxTime,clamped=Math.max(yMin,Math.min(yMax,raw)),y=yP(clamped);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke();ctx.setLineDash([])}
  if(pts.length>1){ctx.strokeStyle=C.altFind;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();let st=false;
  pts.forEach((p,i)=>{const x=xP(p.d),y=yP(p.m);const gap=i>0&&(p.d-pts[i-1].d>3||Math.abs(p.m-pts[i-1].m)>120);if(gap){ctx.stroke();ctx.beginPath();st=false}if(!st){ctx.moveTo(x,y);st=true}else ctx.lineTo(x,y)});ctx.stroke()}
  const tx=xP(dayV);ctx.strokeStyle=C.dotLbl+'44';ctx.lineWidth=.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(tx,pad.t);ctx.lineTo(tx,h-pad.b);ctx.stroke();ctx.setLineDash([]);
  const todayT=finder(dayV,targetAlt);
  if(todayT!==null){const y=yP(todayT);ctx.fillStyle=C.altFind;ctx.beginPath();ctx.arc(tx,y,5,0,Math.PI*2);ctx.fill();ctx.font='600 10px -apple-system,sans-serif';ctx.fillStyle=C.dotLbl;ctx.textAlign='left';ctx.strokeStyle=C.dotStr;ctx.lineWidth=3;const t=fT(Math.round(todayT));ctx.strokeText(t,tx+8,y+4);ctx.fillText(t,tx+8,y+4)}
  else{ctx.font='500 10px -apple-system,sans-serif';ctx.fillStyle=C.txt;ctx.textAlign='center';ctx.fillText('Sol não atinge '+targetAlt.toFixed(1)+'° neste dia',w/2,h/2)}
  if(dailyMax&&dayV<dailyMax.length){const ny=yP(dailyMax[dayV].maxTime);if(ny>=pad.t&&ny<=h-pad.b){ctx.fillStyle=C.sunDot+'88';ctx.beginPath();ctx.arc(tx,ny,3,0,Math.PI*2);ctx.fill()}}}


function drawTideDay(ctx,w,h,data,selIdx){
ctx.clearRect(0,0,w,h);const p={t:12,b:24,l:32,r:8},cw=w-p.l-p.r,ch=h-p.t-p.b;
function xP(i){return p.l+i/(data.length-1)*cw}function yP(v){return p.t+(1-(v+1)/2)*ch}
const zy=yP(0);ctx.strokeStyle=C.horiz;ctx.lineWidth=1;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.l,zy);ctx.lineTo(w-p.r,zy);ctx.stroke();ctx.font='500 8px -apple-system,sans-serif';ctx.fillStyle=C.txt;ctx.textAlign='left';ctx.fillText('nível médio',p.l+3,zy-5);
ctx.textAlign='center';ctx.textBaseline='top';dayLb.forEach(lb=>{ctx.fillStyle=C.txt;ctx.fillText(lb.t,xP(lb.i),h-p.b+5)});
ctx.fillStyle=dk?'rgba(93,202,165,.15)':'rgba(29,158,117,.08)';ctx.beginPath();ctx.moveTo(p.l,zy);data.forEach((d,i)=>{ctx.lineTo(xP(i),d.h>=0?yP(d.h):zy)});ctx.lineTo(xP(data.length-1),zy);ctx.closePath();ctx.fill();
ctx.fillStyle=dk?'rgba(133,183,235,.12)':'rgba(55,138,221,.06)';ctx.beginPath();ctx.moveTo(p.l,zy);data.forEach((d,i)=>{ctx.lineTo(xP(i),d.h<0?yP(d.h):zy)});ctx.lineTo(xP(data.length-1),zy);ctx.closePath();ctx.fill();
ctx.strokeStyle=C.tideH;ctx.lineWidth=2;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();data.forEach((d,i)=>{i===0?ctx.moveTo(xP(i),yP(d.h)):ctx.lineTo(xP(i),yP(d.h))});ctx.stroke();
if(selIdx!==null&&selIdx>=0&&selIdx<data.length){const sx=xP(selIdx),sy=yP(data[selIdx].h);ctx.strokeStyle=C.dotLbl+'44';ctx.lineWidth=.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(sx,p.t);ctx.lineTo(sx,h-p.b);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=data[selIdx].h>=0?C.tideH:C.tideL;ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();ctx.font='600 10px -apple-system,sans-serif';ctx.fillStyle=C.dotLbl;ctx.textAlign='center';ctx.strokeStyle=C.dotStr;ctx.lineWidth=3;const t=(data[selIdx].h>=0?'+':'')+data[selIdx].h.toFixed(2);ctx.strokeText(t,sx,sy-12);ctx.fillText(t,sx,sy-12)}}


function drawTideYear(ctx,w,h,data,dayV,label){
ctx.clearRect(0,0,w,h);const p={t:12,b:24,l:32,r:8},cw=w-p.l-p.r,ch=h-p.t-p.b,dy=daysInYear();
const hasH=data[0].h!==undefined;const vals=hasH?data.map(d=>d.h):data.map(d=>d.force);
const minV=hasH?Math.min(...vals):0,maxV=hasH?Math.max(...vals):1,rng=maxV-minV||1;
function xP(i){return p.l+i/(dy-1)*cw}function yP(v){return p.t+(1-(v-minV)/rng)*ch}
ctx.font='400 9px -apple-system,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
const steps=hasH?[-.5,0,.5]:[ 0,.25,.5,.75,1];
steps.forEach(v=>{if(v<minV||v>maxV)return;const y=yP(v);ctx.strokeStyle=C.grid;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillStyle=C.txt;ctx.fillText(hasH?(v>=0?'+':'')+v.toFixed(1):Math.round(v*100)+'%',p.l-4,y)});
if(hasH){const zy=yP(0);ctx.strokeStyle=C.horiz;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,zy);ctx.lineTo(w-p.r,zy);ctx.stroke()}
ctx.textAlign='center';ctx.textBaseline='top';yrLb().forEach(lb=>{ctx.fillStyle=C.txt;ctx.fillText(lb.t,xP(lb.i),h-p.b+5)});
drawSolEqMarkers(ctx,xP,p.t,p.b,h,dy);
if(!hasH){data.forEach(d=>{const x=xP(d.doy),bh=(d.force/1)*ch,col=d.force>.6?C.tideH:d.force>.3?C.tideMid:C.tideL;ctx.fillStyle=col;ctx.globalAlpha=.5;ctx.fillRect(x-1,p.t+ch-bh,Math.max(2,cw/dy),bh)});ctx.globalAlpha=1}
ctx.strokeStyle=hasH?C.tideH:C.tideH;ctx.lineWidth=hasH?2:1.5;ctx.lineCap='round';ctx.setLineDash([]);ctx.beginPath();
data.forEach((d,i)=>{const x=xP(hasH?d.doy:d.doy),y=yP(hasH?d.h:d.force);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke();
const tx=xP(dayV);ctx.strokeStyle=C.dotLbl;ctx.lineWidth=1.5;ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(tx,p.t);ctx.lineTo(tx,h-p.b);ctx.stroke();ctx.setLineDash([]);
if(dayV<data.length){const v=hasH?data[dayV].h:data[dayV].force;const y=yP(v);ctx.fillStyle=C.sunDot;ctx.beginPath();ctx.arc(tx,y,5,0,Math.PI*2);ctx.fill();ctx.font='600 10px -apple-system,sans-serif';ctx.fillStyle=C.dotLbl;ctx.textAlign='center';ctx.strokeStyle=C.dotStr;ctx.lineWidth=3;const t=hasH?(v>=0?'+':'')+v.toFixed(2):Math.round(v*100)+'%';ctx.strokeText(t,tx,y-12);ctx.fillText(t,tx,y-12)}}

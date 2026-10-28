
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs = (s, r=document) => r.querySelector(s);

  // Draw isodose curves in hero SVG
  function drawIsodose() {
    const svg = document.getElementById('isodose-hero');
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    // the dose ramp, in the new five families: hot centre, cool fringe
    const curves = [
      {r:30, c:'#e06068'}, {r:46, c:'#f88078'}, {r:62, c:'#f8a808'},
      {r:78, c:'#f89838'}, {r:94, c:'#b0c8f8'}
    ];
    curves.forEach((cur,i)=>{
      const p = document.createElementNS(ns,'ellipse');
      p.setAttribute('cx','160'); p.setAttribute('cy','90');
      p.setAttribute('rx',cur.r*1.4); p.setAttribute('ry',cur.r);
      p.setAttribute('fill','none'); p.setAttribute('stroke',cur.c);
      p.setAttribute('stroke-width','2');
      // pathLength normalises the dash maths: the ellipse perimeter is ~716px, so a
      // hard-coded 1000 left a permanent gap and the trace never finished drawing.
      p.setAttribute('pathLength','1');
      p.setAttribute('stroke-dasharray','1'); p.setAttribute('stroke-dashoffset','1');
      p.classList.add('iso-curve');
      svg.appendChild(p);
    });
    // crosshairs
    const line = (x1,y1,x2,y2)=>{const l=document.createElementNS(ns,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('stroke','#2a3438');l.setAttribute('stroke-width','1');svg.appendChild(l);};
    line(0,90,320,90); line(160,0,160,180);
  }

  // MLC leaves
  function drawMLC() {
    const svg = document.getElementById('mlc');
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    for(let i=0;i<8;i++){
      const top = document.createElementNS(ns,'rect');
      top.setAttribute('x', 20 + i*46); top.setAttribute('y', 10);
      top.setAttribute('width','38'); top.setAttribute('height','46');
      top.setAttribute('fill','#e06068'); top.setAttribute('opacity','0.7');
      top.setAttribute('rx','2');
      svg.appendChild(top);
      const bot = document.createElementNS(ns,'rect');
      bot.setAttribute('x', 20 + i*46); bot.setAttribute('y', 64);
      bot.setAttribute('width','38'); bot.setAttribute('height','46');
      bot.setAttribute('fill','#f8a808'); bot.setAttribute('opacity','0.7');
      bot.setAttribute('rx','2');
      svg.appendChild(bot);
    }
  }

  // field map (Engineer Companion retrieval field)
  function drawFieldmap(id) {
    const svg = document.getElementById(id);
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    for(let i=0;i<6;i++){
      const r = document.createElementNS(ns,'circle');
      r.setAttribute('cx', 40+ (i%3)*70 + (Math.random()*10));
      r.setAttribute('cy', 30 + Math.floor(i/3)*50);
      r.setAttribute('r', 8 + i*2);
      r.setAttribute('fill','none'); r.setAttribute('stroke','#b0c8f8'); r.setAttribute('stroke-width','1.5');
      r.classList.add('field-node');
      svg.appendChild(r);
    }
    for(let i=0;i<5;i++){
      const l = document.createElementNS(ns,'line');
      l.setAttribute('x1',40+(i%3)*70); l.setAttribute('y1',30+Math.floor(i/3)*50);
      l.setAttribute('x2',40+((i+1)%3)*70); l.setAttribute('y2',30+Math.floor((i+1)/3)*50);
      l.setAttribute('stroke','#8fb4f0'); l.setAttribute('stroke-width','1');
      l.setAttribute('stroke-dasharray','200'); l.setAttribute('stroke-dashoffset','200');
      l.classList.add('field-edge');
      svg.appendChild(l);
    }
  }

  // vec: vectorization markers
  function drawVec() {
    const svg = document.getElementById('vec');
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    for(let i=0;i<12;i++){
      const r = document.createElementNS(ns,'rect');
      r.setAttribute('x', 10 + (i%4)*60); r.setAttribute('y', 10 + Math.floor(i/4)*32);
      r.setAttribute('width','48'); r.setAttribute('height','24');
      r.setAttribute('fill','none'); r.setAttribute('stroke','#f89838'); r.setAttribute('stroke-width','1.2');
      r.setAttribute('rx','1');
      svg.appendChild(r);
    }
  }

  // lattice with residual dot
  function drawLatt() {
    const svg = document.getElementById('latt');
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    for(let x=0;x<8;x++){
      for(let y=0;y<4;y++){
        const c = document.createElementNS(ns,'circle');
        c.setAttribute('cx', 20 + x*30); c.setAttribute('cy', 20 + y*28);
        c.setAttribute('r','2'); c.setAttribute('fill','#2a3438');
        svg.appendChild(c);
      }
    }
    const res = document.createElementNS(ns,'circle');
    res.setAttribute('cx','160'); res.setAttribute('cy','60'); res.setAttribute('r','6');
    res.setAttribute('fill','#e06068'); res.setAttribute('class','residual');
    svg.appendChild(res);
  }

  // wave
  function drawWave() {
    const svg = document.getElementById('wave');
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    let d='M0,40 ';
    for(let x=0;x<=600;x+=6){
      const y = 40 + 16*Math.sin(x/30) + 6*Math.cos(x/11);
      d += `L${x},${y} `;
    }
    const p = document.createElementNS(ns,'path');
    p.setAttribute('d', d); p.setAttribute('fill','none');
    p.setAttribute('stroke','#b0c8f8'); p.setAttribute('stroke-width','2');
    p.setAttribute('stroke-dasharray','1200'); p.setAttribute('stroke-dashoffset', reduce?'0':'1200');
    p.classList.add('wave-path');
    svg.appendChild(p);
  }

  drawIsodose(); drawMLC(); drawFieldmap('fieldmap-ec'); drawVec(); drawLatt(); drawWave();

  // counter helper
  function countUp(el, target, duration, suffix){
    if(reduce){ el.textContent = target; return; }
    const start = performance.now();
    const num = parseInt(String(target).replace(/\s/g,'').replace(',',''));
    if(isNaN(num)){ el.textContent = target; return; }
    function tick(now){
      const t = Math.min(1,(now-start)/duration);
      const eased = 1 - Math.pow(1-t,3);
      el.textContent = Math.round(num*eased).toLocaleString('ru-RU');
      if(t<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // gauge
  const gaugeNeedle = document.querySelector('.gauge-needle');
  const gaugeVal = document.getElementById('gaugeVal');
  const gaugeArc = document.querySelector('.gauge-arc');
  if(gaugeArc){ gaugeArc.setAttribute('stroke-dashoffset', reduce ? '0' : '251'); }

  // report printing
  const reportLines = document.querySelectorAll('.report-line');
  let printed = false;

  function runMotion(){
    if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'){ runFallback(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // ---- the runs EXTEND out of the edge of the screen ---------------------
    // A LCARS bar is not drawn on the page, it grows: it starts collapsed
    // against one edge and runs across. The same code runs on a phone, where
    // the run is simply thinner and the trigger is the same.
    const grow = (el, from, trigger, delay) => {
      const horiz = (from === 'left' || from === 'right');
      if(reduce){ gsap.set(el, horiz ? {scaleX:1} : {scaleY:1}); return; }
      gsap.set(el, horiz
        ? {scaleX:0, transformOrigin: from + ' center'}
        : {scaleY:0, transformOrigin: 'center ' + from});
      const tween = {duration:1.15, ease:'power3.out', delay: delay || 0};
      if(horiz) tween.scaleX = 1; else tween.scaleY = 1;
      if(trigger){
        tween.scrollTrigger = {trigger:trigger, start:'top 84%', once:true};
        tween.overwrite = 'auto';
      }
      gsap.to(el, tween);
    };

    // the screen frame: it is always on screen, so it grows on load
    const frame = qs('.lcars-frame');
    if(frame){
      grow(qs('.run-top', frame), 'left');
      grow(qs('.run-foot', frame), 'left', null, .12);
      grow(qs('.run-left', frame), 'top', null, .16);
      grow(qs('.run-right', frame), 'top', null, .24);
      grow(qs('.run-block', frame), 'top', null, .32);
      grow(qs('.frame-label', frame), 'right', null, .4);
    }

    // the runs that frame each panel
    document.querySelectorAll('.l-run').forEach((run)=>{
      const host = run.closest('.panelbox') || run;
      const arm = run.querySelector('i:first-child');
      const stub = run.querySelector('i:last-child');
      const fromRight = run.dataset.dir === 'right';
      if(arm) grow(arm, fromRight ? 'right' : 'left', host);
      if(stub) grow(stub, 'top', host, .12);
    });

    // the segmented bars: each segment extends from its own edge
    document.querySelectorAll('.l-bar').forEach((bar)=>{
      const segs = bar.querySelectorAll('i');
      segs.forEach((seg,i)=>{
        const last = i === segs.length - 1;
        grow(seg, last ? 'right' : 'left', bar, i * 0.06);
      });
    });

    // the plates: a bar with a label in its end, extending from the screen edge
    document.querySelectorAll('.l-plate').forEach((plate)=>{
      const bar = plate.querySelector('.pl-bar');
      const label = plate.querySelector('.pl-label');
      const host = plate.closest('.panelbox') || plate;
      if(bar) grow(bar, 'left', host);
      if(label) grow(label, 'right', host, .18);
    });

    // the labelled band blocks
    document.querySelectorAll('.l-band').forEach((band)=>{
      band.querySelectorAll('span').forEach((cell,i)=> grow(cell, 'left', band, i*0.07));
    });

    // the solid colour masses appear as masses, they do not slide in
    document.querySelectorAll('.statement').forEach((block)=>{
      if(reduce){ gsap.set(block, {opacity:1}); return; }
      gsap.set(block, {opacity:0, scale:.97});
      gsap.to(block, {opacity:1, scale:1, duration:.7, ease:'power2.out',
        scrollTrigger:{trigger:block, start:'top 88%', once:true}});
    });

    // the gauge and the lead readouts read their targets from the markup, so a
    // number can never drift away from content/projects/*/project.yaml
    const gaugeTarget = parseFloat((gaugeVal && gaugeVal.dataset.gauge) || '96') || 0;
    if(gaugeNeedle){
      const angle = -90 + (gaugeTarget/100)*180;
      if(reduce){ gsap.set(gaugeNeedle,{rotation:angle,transformOrigin:'100px 100px'}); }
      else {
        gsap.fromTo(gaugeNeedle,{rotation:-90,transformOrigin:'100px 100px'},{rotation:angle,transformOrigin:'100px 100px',duration:1.4,ease:'power2.out',scrollTrigger:{trigger:'#hero',start:'top 70%'}});
      }
    }
    if(gaugeVal){
      if(reduce){ gaugeVal.textContent=String(gaugeTarget); }
      else {
        ScrollTrigger.create({trigger:'#hero',start:'top 70%',once:true,onEnter:()=>countUp(gaugeVal,String(gaugeTarget),1200)});
      }
    }
    if(gaugeArc){
      if(reduce){ gsap.set(gaugeArc,{strokeDashoffset:0}); }
      else {
        gsap.to(gaugeArc,{strokeDashoffset: 251*(1-gaugeTarget/100), duration:1.4, ease:'power2.out', scrollTrigger:{trigger:'#hero',start:'top 70%'}});
      }
    }

    // the lead readouts read their targets from the markup as well
    const lead=(id, thousands)=>{
      const el=document.getElementById(id); if(!el) return;
      const n=parseFloat((el.dataset.target||'0').replace(/[^0-9.]/g,''))||0;
      const txt = thousands ? n.toLocaleString('ru-RU').replace(/\u00a0/g,' ') : String(n);
      el.textContent = txt;
      if(!reduce) countUp(el, txt, 1200);
    };

    // counters
    if(!reduce){
      ScrollTrigger.create({trigger:'#hero',start:'top 70%',once:true,onEnter:()=>{
        lead('cnt-latency'); lead('cnt-facts', true); lead('cnt-tests');
      }});
    } else {
      lead('cnt-latency'); lead('cnt-facts', true); lead('cnt-tests');
    }

    // isodose curves draw
    document.querySelectorAll('.iso-curve').forEach((el,i)=>{
      if(reduce){ gsap.set(el,{strokeDashoffset:0}); }
      else {
        gsap.to(el,{strokeDashoffset:0,duration:1.6,ease:'power2.out',delay:i*0.12,scrollTrigger:{trigger:'#header',start:'top 60%'}});
      }
    });

    // field edges draw
    document.querySelectorAll('.field-edge').forEach((el,i)=>{
      if(reduce){ gsap.set(el,{strokeDashoffset:0}); }
      else {
        gsap.to(el,{strokeDashoffset:0,duration:1.2,ease:'power2.out',delay:i*0.1,scrollTrigger:{trigger:'#projects',start:'top 70%'}});
      }
    });

    // wave draw
    const wave = document.querySelector('.wave-path');
    if(wave){
      if(reduce){ gsap.set(wave,{strokeDashoffset:0}); }
      else { gsap.to(wave,{strokeDashoffset:0,duration:2,ease:'power2.out',scrollTrigger:{trigger:'#record',start:'top 70%'}}); }
    }

    // l-bar fill on scroll
    document.querySelectorAll('[data-fillbar]').forEach(bar=>{
      const segs = bar.querySelectorAll('i');
      segs.forEach((seg,i)=>{
        gsap.set(seg,{scaleX: reduce?1:0});
        if(!reduce){
          gsap.to(seg,{scaleX:1,duration:0.8,delay:i*0.08,ease:'power2.out',scrollTrigger:{trigger:bar,start:'top 80%'}});
        }
      });
    });

    // report printing
    const report = document.getElementById('report');
    if(report){
      if(reduce){ reportLines.forEach(l=>l.classList.add('printed')); }
      else {
        ScrollTrigger.create({trigger:report,start:'top 80%',once:true,onEnter:()=>{
          reportLines.forEach((l,i)=>setTimeout(()=>l.classList.add('printed'), i*220));
        }});
      }
    }
  }

  function runFallback(){ if(reduce){ document.querySelectorAll('.report-line').forEach(l=>l.classList.add('printed')); } }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', runMotion); } else { runMotion(); }
})();

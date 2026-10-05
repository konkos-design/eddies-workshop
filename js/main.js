/* Eddie's Workshop — interactions */
(function(){
  const d=document, root=d.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $=(s,c=d)=>c.querySelector(s), $$=(s,c=d)=>[...c.querySelectorAll(s)];

  /* ---------- page transition curtain ---------- */
  const curtain=d.createElement('div'); curtain.className='curtain'; curtain.setAttribute('aria-hidden','true');
  curtain.innerHTML='<i></i><i></i><i></i><i></i><i></i>'; d.body.appendChild(curtain);
  let entered=false;
  try{ entered=sessionStorage.getItem('ew-nav')==='1'; sessionStorage.removeItem('ew-nav'); }catch(e){}
  if(entered && !reduce){ root.classList.add('is-entering'); setTimeout(()=>root.classList.remove('is-entering'),1000); }
  d.addEventListener('click',e=>{
    const a=e.target.closest('a'); if(!a) return;
    const href=a.getAttribute('href')||'';
    if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download')) return;
    if(!/\.html(#.*)?$/.test(href)||/^https?:/.test(href)) return;
    const url=new URL(a.href,location.href);
    if(url.pathname===location.pathname){ return; }
    if(reduce) return;
    e.preventDefault();
    try{ sessionStorage.setItem('ew-nav','1'); }catch(err){}
    d.body.classList.remove('menu-open');
    root.classList.add('is-leaving');
    setTimeout(()=>{ location.href=a.href; },560);
  });
  addEventListener('pageshow',e=>{ if(e.persisted) root.classList.remove('is-leaving','is-entering'); });

  /* ---------- header: solid / hide on scroll, progress ---------- */
  const hdr=$('.hdr'), prog=$('.progress'), totop=$('.totop'), fab=$('.callfab');
  const ringC=totop?$('circle',totop):null;
  let lastY=scrollY, ticking=false;
  function onScroll(){
    const y=scrollY, h=d.documentElement.scrollHeight-innerHeight, p=h>0?y/h:0;
    if(prog) prog.style.transform=`scaleX(${p})`;
    if(hdr){
      hdr.classList.toggle('is-solid',y>30);
      const goingDown=y>lastY&&y>420&&!d.body.classList.contains('menu-open');
      hdr.classList.toggle('is-hidden',goingDown);
    }
    if(totop){ totop.classList.toggle('is-on',y>700); if(ringC) ringC.style.strokeDashoffset=163.4*(1-p); }
    if(fab) fab.classList.toggle('is-on',y>500);
    lastY=y; ticking=false;
  }
  addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(onScroll); ticking=true; } },{passive:true});
  onScroll();
  if(totop) totop.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}));

  /* ---------- mobile menu ---------- */
  const burger=$('.burger');
  if(burger){
    burger.addEventListener('click',()=>{
      const open=d.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded',open);
      burger.setAttribute('aria-label',open?'Close menu':'Open menu');
      if(open) hdr.classList.remove('is-hidden');
    });
    d.addEventListener('keydown',e=>{ if(e.key==='Escape'&&d.body.classList.contains('menu-open')) burger.click(); });
    addEventListener('resize',()=>{ if(innerWidth>=1080&&d.body.classList.contains('menu-open')) burger.click(); });
  }

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(el=>{
    let i=0;
    const walk=node=>{
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          const frag=d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part=>{
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.appendChild(d.createTextNode(' ')); return; }
            const w=d.createElement('span'); w.className='w';
            const s=d.createElement('span'); s.textContent=part; s.style.setProperty('--i',i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if(n.nodeType===1 && n.tagName!=='BR'){ walk(n); }
      });
    };
    walk(el); el.classList.add('split');
  });

  /* ---------- reveal on scroll ---------- */
  $$('[data-stagger]').forEach(g=>{
    const step=parseFloat(g.dataset.stagger)||.08;
    [...g.children].forEach((c,i)=>{ if(!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal',g.dataset.revealChild||'up'); c.style.setProperty('--d',(i*step).toFixed(2)+'s'); });
  });
  $$('[data-delay]').forEach(el=>el.style.setProperty('--d',el.dataset.delay+'s'));
  const revealEls=$$('[data-reveal],[data-split],.scope');
  if('IntersectionObserver' in window && !reduce){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); fireCounters(en.target); } });
    },{threshold:0,rootMargin:'0px 0px -10% 0px'});
    revealEls.forEach(el=>io.observe(el));
  } else revealEls.forEach(el=>{ el.classList.add('is-in'); fireCounters(el); });

  /* ---------- counters ---------- */
  function fireCounters(scope){
    const els=scope.matches&&scope.matches('[data-count]')?[scope]:$$('[data-count]',scope);
    els.forEach(el=>{
      if(el.dataset.done) return; el.dataset.done=1;
      const end=parseFloat(el.dataset.count), dec=(el.dataset.count.split('.')[1]||'').length, dur=1600, t0=performance.now();
      const tick=t=>{ const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,4); el.textContent=(end*e).toFixed(dec); if(k<1) requestAnimationFrame(tick); };
      if(reduce) el.textContent=end.toFixed(dec); else requestAnimationFrame(tick);
    });
  }

  /* ---------- magnetic buttons ---------- */
  if(finePointer && !reduce){
    $$('.btn,.circ,.socials a').forEach(b=>{
      b.addEventListener('pointermove',e=>{ const r=b.getBoundingClientRect(); const x=(e.clientX-r.left-r.width/2)*.22, y=(e.clientY-r.top-r.height/2)*.3; b.style.transform=`translate(${x}px,${y}px)`; });
      b.addEventListener('pointerleave',()=>{ b.style.transform=''; });
    });
    /* spotlight + tilt cards */
    $$('.svc').forEach(c=>{
      c.addEventListener('pointermove',e=>{ const r=c.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        c.style.setProperty('--mx',px*100+'%'); c.style.setProperty('--my',py*100+'%');
        c.style.transform=`perspective(900px) rotateX(${(.5-py)*6}deg) rotateY(${(px-.5)*8}deg) translateY(-4px)`; });
      c.addEventListener('pointerleave',()=>{ c.style.transform=''; });
    });
    $$('[data-tilt]').forEach(c=>{
      c.addEventListener('pointermove',e=>{ const r=c.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5; c.style.transform=`perspective(1000px) rotateX(${-py*7}deg) rotateY(${px*9}deg)`; });
      c.addEventListener('pointerleave',()=>{ c.style.transform=''; });
    });
  }

  /* ---------- parallax ---------- */
  const px=$$('[data-parallax]');
  if(px.length && !reduce){
    const run=()=>{ px.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; const k=parseFloat(el.dataset.parallax)||.1; const off=(r.top+r.height/2-innerHeight/2)*k; el.style.transform=`translate3d(0,${off.toFixed(1)}px,0)`; }); };
    addEventListener('scroll',()=>requestAnimationFrame(run),{passive:true}); run();
  }

  /* ---------- open / closed status (Sydney time) ---------- */
  const HOURS={1:[8,17],2:[8,17],3:[8,17],4:[8,17],5:[8,17],6:[8,12],0:null};
  function sydNow(){
    try{
      const parts=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
      const get=t=>parts.find(p=>p.type===t).value; const wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[get('weekday')];
      return {day:wd,mins:(parseInt(get('hour'),10)%24)*60+parseInt(get('minute'),10)};
    }catch(e){ const n=new Date(); return {day:n.getDay(),mins:n.getHours()*60+n.getMinutes()}; }
  }
  const fmt=h=>{ const ap=h>=12?'pm':'am'; const hh=h%12||12; return hh+':00'+ap; };
  const now=sydNow();
  $$('.status').forEach(s=>{
    const today=HOURS[now.day], txt=$('.status__txt',s);
    let open=false, label='';
    if(today && now.mins>=today[0]*60 && now.mins<today[1]*60){ open=true; label='Open now · until '+fmt(today[1]); }
    else{
      let k=0, dd=now.day, nextOpen=null;
      if(today && now.mins<today[0]*60){ nextOpen='today '+fmt(today[0]); }
      else{ for(k=1;k<8;k++){ dd=(now.day+k)%7; if(HOURS[dd]){ nextOpen=(k===1?'tomorrow ':['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dd]+' ')+fmt(HOURS[dd][0]); break; } } }
      label='Closed · opens '+nextOpen;
    }
    s.classList.add(open?'is-open':'is-closed'); if(txt) txt.textContent=label;
  });
  $$('.hours__row').forEach(r=>{ if(parseInt(r.dataset.day,10)===now.day) r.classList.add('is-today'); });

  /* ---------- drag-to-scroll rails ---------- */
  $$('[data-drag]').forEach(el=>{
    let down=false,sx=0,sl=0,moved=0;
    el.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse') return; down=true; moved=0; sx=e.clientX; sl=el.scrollLeft; el.classList.add('is-drag'); });
    addEventListener('pointerup',()=>{ down=false; el.classList.remove('is-drag'); });
    el.addEventListener('pointermove',e=>{ if(!down) return; const dx=e.clientX-sx; moved=Math.max(moved,Math.abs(dx)); el.scrollLeft=sl-dx; });
    el.addEventListener('click',e=>{ if(moved>6){ e.preventDefault(); e.stopPropagation(); } },true);
  });

  /* ---------- home review slider ---------- */
  function initSlider(){
  const track=$('.rv-track');
  if(track){
    const bar=$('.rv-bar i'), prev=$('[data-rv="prev"]'), next=$('[data-rv="next"]');
    const step=()=>{ const c=track.children[0]; return c? c.getBoundingClientRect().width+18 : 300; };
    const upd=()=>{ const max=track.scrollWidth-track.clientWidth; const vis=track.clientWidth/track.scrollWidth; if(bar){ bar.style.width=(vis*100)+'%'; bar.style.transform=`translateX(${max>0?(track.scrollLeft/max)*((1-vis)/vis)*100:0}%)`; } };
    track.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true}); addEventListener('resize',upd); upd();
    prev&&prev.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}));
    next&&next.addEventListener('click',()=>{ const max=track.scrollWidth-track.clientWidth; if(track.scrollLeft>=max-4) track.scrollTo({left:0,behavior:'smooth'}); else track.scrollBy({left:step(),behavior:'smooth'}); });
    let auto=setInterval(()=>{ if(!d.hidden && !track.matches(':hover')) next&&next.click(); },5200);
    track.addEventListener('pointerdown',()=>{ clearInterval(auto); });
  }
  }

  /* ---------- avatar helper ---------- */
  const COLORS=['#d9252d','#1a2747','#2c6e63','#7a3db8','#b5651d','#2f5fa8','#9b2c4a','#3d4a5c'];
  window.EW_avatar=name=>{ const ini=name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return `<span class="avatar" style="background:${COLORS[h%COLORS.length]}" aria-hidden="true">${ini}</span>`; };

  /* ---------- symptom checker ---------- */
  const diag=$('.diag');
  if(diag){
    const SYM={
      light:{code:'P0300 · CHECK ENGINE',title:'Warning light on the dash',text:'A warning light is the car asking for a proper look — not a guess. We read the codes, then go further: live data, wiring tests and pressure checks, so we fix the cause instead of throwing parts at a code.',area:'Engine diagnostics',time:'Same-day check where possible',wave:'M0 45 L40 45 L52 12 L64 78 L76 45 L120 45 L132 20 L144 70 L156 45 L200 45 L212 8 L224 82 L236 45 L280 45 L292 18 L304 72 L316 45 L360 45 L372 10 L384 80 L396 45 L440 45 L452 22 L464 68 L476 45 L520 45 L532 12 L544 78 L556 45 L600 45'},
      power:{code:'U0100 · LOST COMMS',title:'Losing power or going into limp mode',text:'Intermittent power loss is often electrical — a harness, a sensor or a CAN-bus fault that comes and goes. This is exactly the kind of job our auto-electrical side loves to hunt down.',area:'Auto electrical & CAN bus',time:'Diagnosis first, quote before work',wave:'M0 45 L60 45 L66 15 L72 45 L150 45 L156 15 L162 45 L170 45 L230 60 L240 30 L250 45 L330 45 L336 15 L342 45 L420 45 L426 70 L432 45 L470 45 L476 15 L482 45 L560 45 L566 15 L572 45 L600 45'},
      noise:{code:'NVH · SQUEAL / GRIND',title:'Squealing, grinding or knocking noise',text:'Belts squeal, brakes grind, suspension knocks. We road-test, lift it up and show you exactly what we find — worn pads, rotors, belts, bushes or a tired water pump.',area:'Brakes, belts & suspension',time:'Often fixed on the spot',wave:'M0 45 Q15 10 30 45 T60 45 T90 45 T120 45 T150 45 T180 45 T210 45 T240 45 T270 45 T300 45 T330 45 T360 45 T390 45 T420 45 T450 45 T480 45 T510 45 T540 45 T570 45 T600 45'},
      ac:{code:'HVAC · LOW PERFORMANCE',title:'Air-con blowing warm air',text:'Not cold enough? It could be gas, a leak, a blocked condenser or a failed compressor. We test the system properly, find the fault and get it blowing cold again before summer hits.',area:'Auto air conditioning',time:'Testing & regas available',wave:'M0 45 C60 45 60 20 120 20 S180 70 240 70 S300 20 360 20 S420 70 480 70 S540 45 600 45'},
      start:{code:'CRANK / NO START',title:'Hard to start or won’t start',text:'Battery, starter, glow plugs, ignition or a fuel issue — we test it properly (including a carbon-pile load test on the battery) so you only pay for what actually needs replacing.',area:'Starting & charging systems',time:'Battery & starter testing',wave:'M0 70 L80 70 L90 20 L100 70 L180 70 L186 50 L192 70 L260 70 L270 25 L280 70 L360 70 L366 55 L372 70 L440 70 L450 30 L460 70 L540 70 L546 58 L552 70 L600 70'},
      service:{code:'SERVICE DUE',title:'Overdue for a service',text:'Leaving a service too long is how small problems become big ones. Book a logbook or general service — oil, filters, fluids, brakes and a full safety check, done right with quality products.',area:'Logbook & general servicing',time:'Book ahead or call us',wave:'M0 45 L600 45'}
    };
    const btns=$$('.sym',diag), body=$('.diag__body',diag), path=$('.diag__wave path',diag);
    function show(key,focus){
      const s=SYM[key]; if(!s) return;
      btns.forEach(b=>{ const on=b.dataset.sym===key; b.setAttribute('aria-selected',on); b.tabIndex=on?0:-1; if(on&&focus) b.focus(); });
      body.innerHTML=`<div class="diag__swap"><div class="diag__code">&gt; ${s.code}</div><h3>${s.title}</h3><p>${s.text}</p><div class="diag__meta"><div><small>Where we start</small><b>${s.area}</b></div><div><small>Turnaround</small><b>${s.time}</b></div></div><a class="btn" href="contact.html">Book this check<span class="arr"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8h12M9 3l5 5-5 5"/></svg><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8h12M9 3l5 5-5 5"/></svg></span></a></div>`;
      if(path){ path.setAttribute('d',s.wave); path.style.strokeDasharray=1400; path.style.strokeDashoffset=1400; path.getBoundingClientRect(); path.style.transition='stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)'; path.style.strokeDashoffset=0; }
    }
    btns.forEach((b,i)=>{
      b.addEventListener('click',()=>{ show(b.dataset.sym); if(innerWidth<980){ const sc=$('.diag__screen',diag); const r=sc.getBoundingClientRect(); if(r.top>innerHeight*.5||r.top<0) sc.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); } });
      b.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowRight'){ e.preventDefault(); show(btns[(i+1)%btns.length].dataset.sym,true); } if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ e.preventDefault(); show(btns[(i-1+btns.length)%btns.length].dataset.sym,true); } });
    });
    show('light');
  }

  /* ---------- services page index ---------- */
  const idx=$('.svc-index');
  if(idx){
    const links=$$('a',idx), blocks=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);
    const io2=new IntersectionObserver(es=>{ es.forEach(en=>{ if(en.isIntersecting){ links.forEach(l=>{ const on=l.getAttribute('href')==='#'+en.target.id; l.classList.toggle('is-active',on); if(on&&innerWidth<1080){ const ol=l.closest('ol'); ol.scrollTo({left:l.offsetLeft-20,behavior:'smooth'}); } }); } }); },{rootMargin:'-40% 0px -55% 0px'});
    blocks.forEach(b=>io2.observe(b));
  }

  /* ---------- timeline fill ---------- */
  const tl=$('.timeline');
  if(tl){ const fill=$('.timeline__fill',tl); const run=()=>{ const r=tl.getBoundingClientRect(); const p=Math.min(1,Math.max(0,(innerHeight*.65-r.top)/r.height)); fill.style.height=(p*(r.height-16))+'px'; }; addEventListener('scroll',()=>requestAnimationFrame(run),{passive:true}); run(); }

  /* ---------- reviews page ---------- */
  const rvGrid=$('#rv-grid');
  if(rvGrid && window.EW_REVIEWS){
    const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const TAGN={diag:'Found the fault',fast:'Fitted me in',honest:'Honest & fair',loyal:'Long-time customer',people:'Friendly team'};
    rvGrid.innerHTML=window.EW_REVIEWS.map(r=>`<article class="rcard${r.src==='f'?' rcard--fb':''}" data-tags="${r.tags.join(' ')} ${r.src==='f'?'fb':'google'}">
      <div class="rcard__head">${window.EW_avatar(r.n)}<div><div class="rcard__name">${esc(r.n)}</div><div class="rcard__date">${r.src==='f'?'Recommends · Facebook':esc(r.d)+' · Google'}</div></div></div>
      <div class="rv__stars" aria-label="${r.s} out of 5 stars">${'★'.repeat(r.s)}${'☆'.repeat(5-r.s)}</div>
      <p class="rcard__text${r.t.length>330?' is-clamp':''}">${esc(r.t)}</p>${r.t.length>330?'<button class="rcard__more" type="button">Read full review</button>':''}
      <div class="rcard__tags">${r.tags.map(t=>`<span>${TAGN[t]}</span>`).join('')}</div></article>`).join('');
    rvGrid.addEventListener('click',e=>{ const b=e.target.closest('.rcard__more'); if(!b) return; const p=b.previousElementSibling; const open=p.classList.toggle('is-clamp'); b.textContent=open?'Read full review':'Show less'; });
    const fbtns=$$('.fbtn');
    const counts={all:window.EW_REVIEWS.length}; window.EW_REVIEWS.forEach(r=>{ r.tags.concat(r.src==='f'?['fb']:['google']).forEach(t=>counts[t]=(counts[t]||0)+1); });
    fbtns.forEach(b=>{ const sm=$('small',b); if(sm) sm.textContent=counts[b.dataset.f]||0;
      b.addEventListener('click',()=>{ fbtns.forEach(x=>x.setAttribute('aria-pressed',x===b)); const f=b.dataset.f;
        $$('.rcard',rvGrid).forEach((c,i)=>{ const show=f==='all'||c.dataset.tags.split(' ').includes(f); c.classList.toggle('is-hide',!show); if(show&&!reduce){ c.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:500,delay:Math.min(i,12)*30,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}); } }); }); });
    // rating bars
    const R=window.EW_RATING;
    $$('.bars__row').forEach(row=>{ const s=row.dataset.s, n=R.dist[s]||0; $('.bars__n',row).textContent=n; const f=$('.bars__fill',row); const set=()=>f.style.width=(n/R.total*100)+'%';
      if('IntersectionObserver' in window){ const o=new IntersectionObserver(es=>{ if(es[0].isIntersecting){ set(); o.disconnect(); } }); o.observe(row); } else set(); });
  }

  /* ---------- home reviews from data ---------- */
  const homeTrack=$('#home-reviews');
  if(homeTrack && window.EW_REVIEWS){
    const pick=['HoneyBear.Tech','Mark','Always Hope','Buddy Paris','Dean Treller','Mitchell Grima','Zoé Guinchard','Simone Cosentino'];
    const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const cut=t=>t.length>260?t.slice(0,t.lastIndexOf(' ',250))+'…':t;
    homeTrack.innerHTML=pick.map(n=>window.EW_REVIEWS.find(r=>r.n===n)).filter(Boolean).map(r=>`<article class="rv"><svg class="rv__q" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M8 34c0-8 3-14 11-20l3 4c-4 3-6 6-6 9h6v11H8v-4zm18 0c0-8 3-14 11-20l3 4c-4 3-6 6-6 9h6v11H26v-4z"/></svg><div class="rv__stars" aria-label="5 out of 5 stars">★★★★★</div><p class="rv__text">“${esc(cut(r.t))}”</p><div class="rv__who">${window.EW_avatar(r.n)}<div><div class="rv__name">${esc(r.n)}</div><div class="rv__src">${r.src==='f'?'Facebook recommendation':'Google review · '+esc(r.d)}</div></div></div></article>`).join('');
  }

  initSlider();

  /* ---------- gallery filter + lightbox ---------- */
  const gal=$('.gal');
  if(gal){
    const items=$$('.gal__item',gal), gbtns=$$('[data-gf]');
    gbtns.forEach(b=>b.addEventListener('click',()=>{ gbtns.forEach(x=>x.setAttribute('aria-pressed',x===b)); const f=b.dataset.gf;
      items.forEach((it,i)=>{ const show=f==='all'||it.dataset.cat.split(' ').includes(f); it.classList.toggle('is-hide',!show); if(show&&!reduce) it.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'none'}],{duration:550,delay:Math.min(i,14)*35,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}); }); }));
    const lb=$('.lb'), img=$('.lb__stage img',lb), cap=$('.lb__cap',lb), cnt=$('.lb__count',lb);
    let cur=0, lastFocus=null;
    const vis=()=>items.filter(i=>!i.classList.contains('is-hide'));
    function open(i){ const list=vis(); cur=(i+list.length)%list.length; const it=list[cur]; img.classList.remove('is-ready'); const src=$('img',it).getAttribute('src'); const im=new Image(); im.onload=()=>{ img.src=src; img.alt=$('img',it).alt; requestAnimationFrame(()=>img.classList.add('is-ready')); }; im.src=src; cap.textContent=it.dataset.caption||''; cnt.textContent=String(cur+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0'); if(!lb.classList.contains('is-open')){ lastFocus=d.activeElement; lb.classList.add('is-open'); d.body.style.overflow='hidden'; $('.lb__close',lb).focus(); } }
    function close(){ lb.classList.remove('is-open'); d.body.style.overflow=''; lastFocus&&lastFocus.focus(); }
    items.forEach(it=>it.addEventListener('click',()=>open(vis().indexOf(it))));
    $('.lb__close',lb).addEventListener('click',close);
    $('.lb__nav--p',lb).addEventListener('click',()=>open(cur-1));
    $('.lb__nav--n',lb).addEventListener('click',()=>open(cur+1));
    lb.addEventListener('click',e=>{ if(e.target===lb||e.target.classList.contains('lb__stage')) close(); });
    d.addEventListener('keydown',e=>{ if(!lb.classList.contains('is-open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowRight') open(cur+1); if(e.key==='ArrowLeft') open(cur-1); });
    let tx=0; lb.addEventListener('touchstart',e=>{ tx=e.touches[0].clientX; },{passive:true}); lb.addEventListener('touchend',e=>{ const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) open(cur+(dx<0?1:-1)); });
  }

  /* ---------- contact form (opens email app with details) ---------- */
  const form=$('#book-form');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault(); let ok=true;
      $$('[required]',form).forEach(inp=>{ const f=inp.closest('.field'); const bad=!inp.value.trim()||(inp.type==='email'&&!/^\S+@\S+\.\S+$/.test(inp.value))||(inp.type==='tel'&&inp.value.replace(/\D/g,'').length<8); f.classList.toggle('is-err',bad); const er=$('.err',f); if(er) er.textContent=bad?(inp.dataset.err||'Please fill this in'):''; if(bad&&ok){ inp.focus(); ok=false; } });
      if(!ok) return;
      const v=n=>(form.elements[n]&&form.elements[n].value.trim())||'-';
      const bodyTxt=`Name: ${v('name')}\nPhone: ${v('phone')}\nEmail: ${v('email')}\nVehicle: ${v('vehicle')}\nService: ${v('service')}\nPreferred day: ${v('day')}\n\n${v('message')}`;
      const href=`mailto:zicservicecentre@outlook.com?subject=${encodeURIComponent('Booking request — '+v('service')+' ('+v('vehicle')+')')}&body=${encodeURIComponent(bodyTxt)}`;
      const okBox=$('.form__ok',form); okBox.classList.add('is-on');
      const btn=$('button[type=submit]',form); btn.disabled=true; setTimeout(()=>btn.disabled=false,2500);
      location.href=href;
    });
    $$('input,textarea',form).forEach(i=>i.addEventListener('input',()=>{ const f=i.closest('.field'); if(f.classList.contains('is-err')){ f.classList.remove('is-err'); const er=$('.err',f); if(er) er.textContent=''; } }));
  }

  /* year */
  $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();

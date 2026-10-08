gsap.registerPlugin(ScrollTrigger);
// Lenis smooth scroll (same feel as WLT)
const lenis = new Lenis({ lerp: 0.09 });
function raf(t){ lenis.raf(t); requestAnimationFrame(raf);} requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);

// Preloader fake progress
let p = 0; const fill = document.getElementById('preBarFill'), ptext = document.getElementById('preText');
const pint = setInterval(()=>{ p = Math.min(100, p + Math.random()*22); fill.style.width = p+'%';
  ptext.textContent = p < 100 ? 'Loading ' + Math.floor(p) + '%' : 'Launching Experience';
  if(p>=100){ clearInterval(pint); setTimeout(()=>document.getElementById('preloader').classList.add('done'), 500); }
}, 220);

// Custom cursor
const cur = document.getElementById('cursor');
addEventListener('mousemove', e=>{ cur.style.left=e.clientX+'px'; cur.style.top=e.clientY+'px'; });

// Canvas particles (2D depth, no WebGL)
const cv = document.getElementById('particles'), ctx = cv.getContext('2d');
let dots = [];
function sizeCv(){ cv.width = innerWidth; cv.height = innerHeight; }
sizeCv(); addEventListener('resize', sizeCv);
for(let i=0;i<90;i++) dots.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:Math.random()*2.5+0.5,v:Math.random()*0.6+0.2,o:Math.random()*0.7+0.2});
(function draw(){ ctx.clearRect(0,0,cv.width,cv.height);
  dots.forEach(d=>{ d.y-=d.v; if(d.y<0){d.y=innerHeight;d.x=Math.random()*innerWidth;}
    ctx.globalAlpha=d.o; ctx.fillStyle = d.x%2>innerWidth/2 ? '#ff6a00' : '#ff2d78';
    ctx.beginPath(); ctx.arc(d.x,d.y,d.s,0,7); ctx.fill(); });
  ctx.globalAlpha=1; requestAnimationFrame(draw); })();

// HERO scroll story : 4 beats, product scales/rotates like a 3D camera
const tl = gsap.timeline({ scrollTrigger:{ trigger:'.stage-wrap', start:'top top', end:'bottom bottom', scrub:1 }});
tl.to('.b1',{x:-120,y:120,scale:1.3},0).to('.b2',{x:120,y:-120,scale:1.4},0)
  .to('.r2',{rotate:90,scale:1.2},0).to('.r3',{rotate:-60},0)
  .to('#heroProduct',{scale:1.25,rotateY:18,rotateX:8,y:-60,duration:1},0)
  .to('.beat-1',{opacity:1,y:0,duration:.3},0).to('.beat-1',{opacity:0,y:-60,duration:.3},1)
  .to('#heroProduct',{scale:1.5,rotateY:-18,y:-120,duration:1},1)
  .to('.beat-2',{opacity:1,y:0,duration:.3},1).to('.beat-2',{opacity:0,y:-60,duration:.3},2)
  .to('#heroProduct',{scale:1.9,rotateY:25,y:-180,duration:1},2)
  .to('.beat-3',{opacity:1,y:0,duration:.3},2).to('.beat-3',{opacity:0,y:-60,duration:.3},3)
  .to('#heroProduct',{scale:2.3,rotateY:0,y:-240,duration:1},3)
  .to('.beat-4',{opacity:1,y:0,duration:.3},3);
// mouse parallax fake-3D
document.getElementById('stage').addEventListener('mousemove', e=>{
  const x=(e.clientX/innerWidth-0.5), y=(e.clientY/innerHeight-0.5);
  gsap.to('#heroProduct',{x:x*60,rotateY:x*24,duration:.6,overwrite:'auto'});
  gsap.to('.ring',{x:x*-40,y:y*-40,duration:.8,overwrite:'auto'});
});

// SHOWCASE sticky
gsap.timeline({scrollTrigger:{trigger:'.show-sticky',start:'top top',end:'bottom bottom',scrub:1}})
 .fromTo('#showProduct',{scale:.8,rotate:-8},{scale:1.6,rotate:8,duration:1},0)
 .to('.c1',{opacity:1,duration:.2},0).to('.c1',{opacity:0,duration:.2},.33)
 .to('.c2',{opacity:1,duration:.2},.33).to('.c2',{opacity:0,duration:.2},.66)
 .to('.c3',{opacity:1,duration:.2},.66);

// tilt cards
if(window.VanillaTilt) VanillaTilt.init(document.querySelectorAll('[data-tilt]'),{max:14,speed:500,glare:true,'max-glare':.25});

// menu smooth anchors via lenis
document.querySelectorAll('[data-menu]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();lenis.scrollTo(a.dataset.menu);}));
// demo form
document.getElementById('sendBtn').onclick=()=>{document.getElementById('sent').style.display='block';};

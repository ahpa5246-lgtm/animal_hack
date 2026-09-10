const $=(s,scope=document)=>scope.querySelector(s);
const $$=(s,scope=document)=>[...scope.querySelectorAll(s)];

$$('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));

const modal=$('#reportModal');
const openModal=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''};
$('#reportBtn')?.addEventListener('click',openModal);
$('#reportBtnBottom')?.addEventListener('click',openModal);
$$('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

$('#reportForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  $('#formSuccess').style.display='block';
  setTimeout(()=>{closeModal();$('#formSuccess').style.display='none';},1200);
});

const timeSlider=$('#timeSlider');
const timeLabel=$('#timeLabel');
const riskScore=$('#riskScore');
const heatReason=$('#heatReason');
const recommendation=$('#recommendationText');
const zones=$$('.risk-zone');

function modelForHour(hour){
  const heat=Math.max(0,1-Math.abs(hour-14)/8);
  const trafficMorning=Math.max(0,1-Math.abs(hour-8)/4);
  const trafficEvening=Math.max(0,1-Math.abs(hour-18)/4);
  const traffic=Math.max(trafficMorning,trafficEvening);
  const score=Math.round(44+heat*29+traffic*13);
  return {heat,traffic,score:Math.min(96,score)};
}

function updateTime(hour){
  const {heat,traffic,score}=modelForHour(hour);
  timeLabel.textContent=`${String(hour).padStart(2,'0')}:00`;
  riskScore.textContent=score;
  heatReason.textContent=`+${Math.round(10+heat*18)}`;
  zones.forEach((z,i)=>{
    const intensity=.32+heat*.42+(i%2?traffic*.08:0);
    z.style.opacity=String(Math.min(.86,intensity));
    z.style.transform=`scale(${.88+heat*.23})`;
  });
  if(score>=80) recommendation.textContent='Deploy shaded water station 180m north.';
  else if(score>=65) recommendation.textContent='Add temporary water point and crossing warning.';
  else recommendation.textContent='Continue monitoring; no urgent intervention required.';
}

timeSlider?.addEventListener('input',e=>updateTime(Number(e.target.value)));
updateTime(Number(timeSlider?.value||14));

$$('.layer-panel input').forEach(input=>input.addEventListener('change',()=>{
  const layer=input.dataset.layer;
  let targets=[];
  if(layer==='risk')targets=$$('.risk-zone');
  if(layer==='animals')targets=$$('.sighting');
  if(layer==='water')targets=$$('.water-point');
  if(layer==='roads')targets=$$('.street');
  targets.forEach(el=>el.classList.toggle('hidden-layer',!input.checked));
}));

$$('.sighting').forEach(btn=>btn.addEventListener('click',()=>{
  const kind=btn.dataset.kind;
  const count=btn.dataset.count;
  const card=$('#riskCard');
  card.querySelector('h3').textContent=`${kind} sighting / ${count} observed`;
  recommendation.textContent=Number(count)>=5?'Prioritize field verification and water access check.':'Add this sighting to the local movement pattern.';
  card.animate([{transform:'translateY(-4px)'},{transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
}));

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.animate([
        {opacity:0,transform:'translateY(22px)'},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:700,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.14});
$$('.story-row,.action-cards article,.report-card').forEach(el=>revealObserver.observe(el));

window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  const visual=$('.city-visual');
  if(visual && y<window.innerHeight*1.2) visual.style.transform=`translateY(${y*.035}px)`;
},{passive:true});

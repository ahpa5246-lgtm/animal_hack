const $=(s,scope=document)=>scope.querySelector(s);
const $$=(s,scope=document)=>[...scope.querySelectorAll(s)];

// small custom cursor, disabled on touch devices
const cursor=$('.cursor-dot');
if(matchMedia('(pointer:fine)').matches){
  document.addEventListener('mousemove',e=>{cursor?.classList.add('on');if(cursor)cursor.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;});
  document.addEventListener('mouseleave',()=>cursor?.classList.remove('on'));
}

// reveal motion
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');revealObserver.unobserve(entry.target)}})
},{threshold:.12});
$$('.reveal').forEach(el=>revealObserver.observe(el));

// Risk Lens — pointer-controlled mask and contextual readout
const lens=$('#riskLens'),reveal=$('#riskReveal'),lensCursor=$('#lensCursor'),lensScore=$('#lensScore'),lensCause=$('#lensCause');
const riskAnchors=[
  {x:.28,y:.72,score:91,cause:'HEAT + WATER GAP'},
  {x:.52,y:.57,score:84,cause:'HEAT + TRAFFIC'},
  {x:.68,y:.40,score:76,cause:'CROSSING PRESSURE'},
  {x:.84,y:.56,score:69,cause:'MOVEMENT + HEAT'},
  {x:.44,y:.30,score:57,cause:'LOWER EXPOSURE'}
];
function lensState(clientX,clientY){
  if(!lens||!reveal||!lensCursor)return;
  const r=lens.getBoundingClientRect();
  let x=Math.min(Math.max(clientX-r.left,0),r.width),y=Math.min(Math.max(clientY-r.top,0),r.height);
  const px=x/r.width,py=y/r.height;
  reveal.style.setProperty('--lx',`${x}px`);reveal.style.setProperty('--ly',`${y}px`);
  lensCursor.style.left=`${x}px`;lensCursor.style.top=`${y}px`;
  const nearest=riskAnchors.reduce((best,a)=>{
    const d=Math.hypot(px-a.x,py-a.y);return d<best.d?{...a,d}:best;
  },{d:999,score:52,cause:'LOW EXPOSURE'});
  const gradient=Math.max(0,1-nearest.d/0.52);
  if(lensScore)lensScore.textContent=Math.round(48+(nearest.score-48)*gradient);
  if(lensCause)lensCause.textContent=gradient>.48?nearest.cause:'LOW EXPOSURE';
}
lens?.addEventListener('pointermove',e=>lensState(e.clientX,e.clientY));
lens?.addEventListener('pointerenter',e=>lensState(e.clientX,e.clientY));
lens?.addEventListener('keydown',e=>{
  const r=lens.getBoundingClientRect();
  const currentX=parseFloat(lensCursor?.style.left)||r.width*.62,currentY=parseFloat(lensCursor?.style.top)||r.height*.42;
  const step=30;let x=currentX,y=currentY;
  if(e.key==='ArrowLeft')x-=step;if(e.key==='ArrowRight')x+=step;if(e.key==='ArrowUp')y-=step;if(e.key==='ArrowDown')y+=step;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();lensState(r.left+x,r.top+y)}
});

// scrollytelling chapter state
const chapters=$$('.chapter'),storyProgress=$('#storyProgress');
const chapterObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible)return;
  chapters.forEach(ch=>ch.classList.toggle('active',ch===visible.target));
  const idx=chapters.indexOf(visible.target);if(storyProgress)storyProgress.style.width=`${(idx+1)/chapters.length*100}%`;
},{rootMargin:'-28% 0px -44% 0px',threshold:[.15,.35,.55]});
chapters.forEach(ch=>chapterObserver.observe(ch));

// intervention simulation
const waterSlider=$('#waterSlider'),waterCount=$('#waterCount'),simMap=$('#simulationMap'),simStatus=$('#simStatus');
const projectedRisk=$('#projectedRisk'),impactHeat=$('#impactHeat'),impactWater=$('#impactWater'),impactTraffic=$('#impactTraffic'),confidenceBar=$('#confidenceBar'),confidenceText=$('#confidenceText');
let sim={shade:true,crossing:false,water:1};
function paintSimulation(animate=false){
  sim.water=Number(waterSlider?.value||0);if(waterCount)waterCount.textContent=sim.water;
  $$('.sim-water').forEach((w,i)=>w.classList.toggle('visible',i<sim.water));
  $('#simCrossing')?.classList.toggle('visible',sim.crossing);
  const reduction=(sim.shade?15:0)+(sim.crossing?9:0)+sim.water*8;
  const risk=Math.max(38,84-reduction);const conf=Math.min(94,74+sim.water*3+(sim.shade?5:0)+(sim.crossing?3:0));
  if(projectedRisk)projectedRisk.textContent=risk;
  if(projectedRisk?.nextElementSibling)projectedRisk.nextElementSibling.textContent=`−${84-risk} pts`;
  if(impactHeat)impactHeat.textContent=sim.shade?'−17%':'0%';
  if(impactWater)impactWater.textContent=`+${sim.water*21}%`;
  if(impactTraffic)impactTraffic.textContent=sim.crossing?'−14%':'0%';
  if(confidenceBar)confidenceBar.style.width=`${conf}%`;if(confidenceText)confidenceText.textContent=`${conf}%`;
  simMap?.classList.toggle('improved',reduction>=23);
  if(animate&&simStatus){simStatus.textContent='RUNNING';setTimeout(()=>simStatus.textContent='MODELED',520)}
}
waterSlider?.addEventListener('input',()=>paintSimulation(false));
$$('[data-sim]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.sim;sim[key]=!sim[key];btn.classList.toggle('active',sim[key]);btn.setAttribute('aria-pressed',String(sim[key]));paintSimulation(false);
}));
$('#simulateBtn')?.addEventListener('click',()=>paintSimulation(true));paintSimulation(false);

// MapLibre live map
const baghdad=[44.3661,33.3152];
const zones={type:'FeatureCollection',features:[
  {type:'Feature',properties:{id:'18 / 03',name:'Al-Mansour',base:84,heat:28,traffic:22,water:15,action:'Deploy a shaded water station 180 m north of the observed corridor.'},geometry:{type:'Polygon',coordinates:[[[44.315,33.34],[44.337,33.34],[44.346,33.323],[44.328,33.309],[44.307,33.317],[44.315,33.34]]]}},
  {type:'Feature',properties:{id:'07 / 03',name:'Yarmouk',base:68,heat:20,traffic:17,water:13,action:'Add temporary water access and mark the evening crossing edge.'},geometry:{type:'Polygon',coordinates:[[[44.305,33.296],[44.326,33.301],[44.332,33.282],[44.311,33.274],[44.296,33.286],[44.305,33.296]]]}},
  {type:'Feature',properties:{id:'23 / 03',name:'Karrada',base:57,heat:17,traffic:14,water:9,action:'Continue monitoring the movement corridor before dispatch.'},geometry:{type:'Polygon',coordinates:[[[44.415,33.313],[44.438,33.315],[44.444,33.296],[44.421,33.289],[44.409,33.299],[44.415,33.313]]]}}
]};
const animals={type:'FeatureCollection',features:[
  {type:'Feature',properties:{kind:'Dogs',count:5,zone:'Al-Mansour'},geometry:{type:'Point',coordinates:[44.326,33.324]}},
  {type:'Feature',properties:{kind:'Cats',count:8,zone:'Karrada'},geometry:{type:'Point',coordinates:[44.427,33.302]}},
  {type:'Feature',properties:{kind:'Dogs',count:3,zone:'Yarmouk'},geometry:{type:'Point',coordinates:[44.315,33.288]}},
  {type:'Feature',properties:{kind:'Cats',count:4,zone:'Jadriya corridor'},geometry:{type:'Point',coordinates:[44.397,33.275]}}
]};
const water={type:'FeatureCollection',features:[
  {type:'Feature',properties:{name:'Water point A'},geometry:{type:'Point',coordinates:[44.351,33.318]}},
  {type:'Feature',properties:{name:'Water point B'},geometry:{type:'Point',coordinates:[44.405,33.291]}}
]};
function rasterStyle(){return{version:8,glyphs:'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm',paint:{'raster-opacity':1}}]}}
let mainMap;
function addMapLayers(map){
  map.addSource('risk-zones',{type:'geojson',data:zones});
  map.addLayer({id:'risk-fill',type:'fill',source:'risk-zones',paint:{'fill-color':['interpolate',['linear'],['get','base'],50,'#55d7f3',70,'#8b6cff',90,'#ff6b61'],'fill-opacity':.42}});
  map.addLayer({id:'risk-line',type:'line',source:'risk-zones',paint:{'line-color':'#f8f7f2','line-width':1,'line-opacity':.55}});
  map.addSource('animals',{type:'geojson',data:animals});
  map.addLayer({id:'animal-halo',type:'circle',source:'animals',paint:{'circle-radius':['+',14,['*',1.4,['get','count']]],'circle-color':'#ff6b61','circle-opacity':.12}});
  map.addLayer({id:'animal-circles',type:'circle',source:'animals',paint:{'circle-radius':['+',6,['*',1.05,['get','count']]],'circle-color':'#ff6b61','circle-stroke-color':'#f8f7f2','circle-stroke-width':1.3}});
  map.addLayer({id:'animal-labels',type:'symbol',source:'animals',layout:{'text-field':['to-string',['get','count']],'text-size':10,'text-font':['Noto Sans Regular'],'text-allow-overlap':true},paint:{'text-color':'#0a0b0d'}});
  map.addSource('water',{type:'geojson',data:water});
  map.addLayer({id:'water-halo',type:'circle',source:'water',paint:{'circle-radius':17,'circle-color':'#55d7f3','circle-opacity':.12}});
  map.addLayer({id:'water-circles',type:'circle',source:'water',paint:{'circle-radius':6,'circle-color':'#55d7f3','circle-stroke-color':'#f8f7f2','circle-stroke-width':1.2}});
  ['risk-fill','animal-circles'].forEach(layer=>{map.on('mouseenter',layer,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',layer,()=>map.getCanvas().style.cursor='')});
  map.on('click','risk-fill',e=>{const p=e.features?.[0]?.properties;if(p)applyZone(p)});
  map.on('click','animal-circles',e=>{const p=e.features?.[0]?.properties;if(!p)return;const z=zones.features.find(f=>f.properties.name===p.zone)?.properties;applyZone(z||{id:'SIGHTING',name:`${p.kind} cluster · ${p.count} observed`,base:63,heat:18,traffic:16,water:11,action:'Add this sighting to the local movement pattern and check nearby water access.'})});
}
function applyZone(p){
  $('#zoneId').textContent=p.id||'FIELD';$('#zoneName').textContent=p.name;$('#zoneScore').textContent=p.base;$('#heatValue').textContent=`+${p.heat}`;$('#trafficValue').textContent=`+${p.traffic}`;$('#waterValue').textContent=`+${p.water}`;$('#interventionText').textContent=p.action;
}
if(window.maplibregl&&$('#mainMap')){
  mainMap=new maplibregl.Map({container:'mainMap',style:rasterStyle(),center:baghdad,zoom:11.25,pitch:37,bearing:-9,attributionControl:true});
  mainMap.addControl(new maplibregl.NavigationControl({showCompass:true}),'bottom-right');mainMap.on('load',()=>addMapLayers(mainMap));
}
const layerGroups={risk:['risk-fill','risk-line'],animals:['animal-halo','animal-circles','animal-labels'],water:['water-halo','water-circles']};
$$('[data-layer-mode]').forEach(btn=>btn.addEventListener('click',()=>{
  $$('[data-layer-mode]').forEach(b=>b.classList.toggle('active',b===btn));
  const mode=btn.dataset.layerMode;
  Object.entries(layerGroups).forEach(([group,layers])=>layers.forEach(id=>{if(mainMap?.getLayer(id))mainMap.setLayoutProperty(id,'visibility',group===mode||mode==='risk'?'visible':'none')}));
}));
const timeSlider=$('#timeSlider');
function timeModel(hour){const heat=Math.max(0,1-Math.abs(hour-14)/8);const traffic=Math.max(Math.max(0,1-Math.abs(hour-8)/4),Math.max(0,1-Math.abs(hour-18)/4));return{heat,traffic,score:Math.min(96,Math.round(44+heat*29+traffic*13))}}
function updateTime(hour){const m=timeModel(hour);$('#timeLabel').textContent=`${String(hour).padStart(2,'0')}:00`;$('#zoneScore').textContent=m.score;$('#heatValue').textContent=`+${Math.round(10+m.heat*18)}`;$('#trafficValue').textContent=`+${Math.round(10+m.traffic*12)}`;$('#interventionText').textContent=m.score>=80?'Deploy a shaded water station 180 m north of the observed corridor.':m.score>=65?'Add temporary water access and a crossing warning.':'Continue monitoring; no urgent intervention required.';if(mainMap?.getLayer('risk-fill'))mainMap.setPaintProperty('risk-fill','fill-opacity',Math.min(.62,.18+m.heat*.32+m.traffic*.08))}
timeSlider?.addEventListener('input',e=>updateTime(Number(e.target.value)));if(timeSlider)updateTime(Number(timeSlider.value));

// field report drawer
const modal=$('#reportModal');
function openReport(){modal?.classList.add('open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>$('.report-sheet input, .report-sheet select')?.focus(),300)}
function closeReport(){modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
$$('[data-open-report]').forEach(b=>b.addEventListener('click',openReport));$$('[data-close-report]').forEach(b=>b.addEventListener('click',closeReport));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeReport()});
$('#reportForm')?.addEventListener('submit',e=>{e.preventDefault();const success=$('#reportSuccess');if(success){success.style.display='flex';setTimeout(()=>{success.style.display='none';closeReport()},1400)}});

// Reference V4: load the final visual layer, move the dog out of the clipped map card,
// and replace the synthetic hero basemap with real satellite imagery.
(()=>{
  if(!document.querySelector('link[data-reference-v4]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='reference-v4.css';
    link.dataset.referenceV4='true';
    document.head.appendChild(link);
  }

  const heroMapArt=$('.hero-map-art');
  const heroComposition=$('.hero-composition');
  const heroAnimal=heroMapArt?.querySelector('.hero-animal.animal-dog');
  if(heroMapArt&&heroComposition&&heroAnimal){
    heroComposition.appendChild(heroAnimal);
  }

  if(!window.maplibregl||!heroMapArt||$('#heroMap'))return;
  const heroMapEl=document.createElement('div');
  heroMapEl.id='heroMap';
  heroMapEl.setAttribute('aria-hidden','true');
  heroMapArt.prepend(heroMapEl);

  const heroStyle={
    version:8,
    sources:{
      imagery:{
        type:'raster',
        tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize:256,
        attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
      }
    },
    layers:[{
      id:'imagery',type:'raster',source:'imagery',
      paint:{'raster-opacity':.94,'raster-saturation':-.16,'raster-brightness-min':.14,'raster-brightness-max':.96,'raster-contrast':.05}
    }]
  };

  try{
    const heroMap=new maplibregl.Map({
      container:heroMapEl,
      style:heroStyle,
      center:[44.3661,33.3152],
      zoom:11.55,
      pitch:0,
      bearing:0,
      interactive:false,
      attributionControl:false,
      fadeDuration:0
    });
    heroMap.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
    heroMap.on('load',()=>heroMap.resize());
  }catch(err){
    heroMapEl.remove();
    console.warn('Hero satellite basemap unavailable; using CSS fallback.',err);
  }
})();

const $=(s,scope=document)=>scope.querySelector(s);const $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
const baghdad=[44.3661,33.3152];
function rasterStyle(){return{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm',paint:{'raster-opacity':1}}]}}
const zones={type:'FeatureCollection',features:[
{type:'Feature',properties:{name:'Al-Mansour / Zone 18',base:84},geometry:{type:'Polygon',coordinates:[[[44.315,33.34],[44.337,33.34],[44.346,33.323],[44.328,33.309],[44.307,33.317],[44.315,33.34]]]}},
{type:'Feature',properties:{name:'Yarmouk / Zone 07',base:68},geometry:{type:'Polygon',coordinates:[[[44.305,33.296],[44.326,33.301],[44.332,33.282],[44.311,33.274],[44.296,33.286],[44.305,33.296]]]}},
{type:'Feature',properties:{name:'Karrada / Zone 23',base:57},geometry:{type:'Polygon',coordinates:[[[44.415,33.313],[44.438,33.315],[44.444,33.296],[44.421,33.289],[44.409,33.299],[44.415,33.313]]]}}
]};
const animals={type:'FeatureCollection',features:[
{type:'Feature',properties:{kind:'Dogs',count:5,zone:'Al-Mansour / Zone 18'},geometry:{type:'Point',coordinates:[44.326,33.324]}},
{type:'Feature',properties:{kind:'Cats',count:8,zone:'Karrada / Zone 23'},geometry:{type:'Point',coordinates:[44.427,33.302]}},
{type:'Feature',properties:{kind:'Dogs',count:3,zone:'Yarmouk / Zone 07'},geometry:{type:'Point',coordinates:[44.315,33.288]}},
{type:'Feature',properties:{kind:'Cats',count:4,zone:'Jadriya corridor'},geometry:{type:'Point',coordinates:[44.397,33.275]}}
]};
const water={type:'FeatureCollection',features:[
{type:'Feature',properties:{name:'Water point A'},geometry:{type:'Point',coordinates:[44.351,33.318]}},
{type:'Feature',properties:{name:'Water point B'},geometry:{type:'Point',coordinates:[44.405,33.291]}}
]};
function addLayers(map,interactive=false){
 map.addSource('risk-zones',{type:'geojson',data:zones});
 map.addLayer({id:'risk-fill',type:'fill',source:'risk-zones',paint:{'fill-color':['interpolate',['linear'],['get','base'],50,'#5b7cff',70,'#d95cff',90,'#ff6b5f'],'fill-opacity':.38}});
 map.addLayer({id:'risk-line',type:'line',source:'risk-zones',paint:{'line-color':'#ffffff','line-width':1,'line-opacity':.42}});
 map.addSource('animals',{type:'geojson',data:animals});
 map.addLayer({id:'animal-halo',type:'circle',source:'animals',paint:{'circle-radius':['+',13,['*',1.3,['get','count']]],'circle-color':'#ff6b5f','circle-opacity':.13}});
 map.addLayer({id:'animal-circles',type:'circle',source:'animals',paint:{'circle-radius':['+',6,['*',1.05,['get','count']]],'circle-color':'#ff6b5f','circle-stroke-color':'#111318','circle-stroke-width':2}});
 map.addLayer({id:'animal-labels',type:'symbol',source:'animals',layout:{'text-field':['to-string',['get','count']],'text-size':10},paint:{'text-color':'#ffffff'}});
 map.addSource('water',{type:'geojson',data:water});
 map.addLayer({id:'water-halo',type:'circle',source:'water',paint:{'circle-radius':15,'circle-color':'#58d7ff','circle-opacity':.14}});
 map.addLayer({id:'water-circles',type:'circle',source:'water',paint:{'circle-radius':6,'circle-color':'#58d7ff','circle-stroke-color':'#ffffff','circle-stroke-width':1.2}});
 if(interactive){
  map.on('mouseenter','animal-circles',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','animal-circles',()=>map.getCanvas().style.cursor='');
  map.on('click','animal-circles',e=>{const f=e.features?.[0];if(!f)return;$('#zoneName').textContent=`${f.properties.kind} sighting / ${f.properties.count} observed`;$('#interventionText').textContent=Number(f.properties.count)>=5?'Prioritize a field check and nearby water access.':'Add this sighting to the local movement pattern.';});
  map.on('click','risk-fill',e=>{const f=e.features?.[0];if(!f)return;$('#zoneName').textContent=f.properties.name;$('#zoneScore').textContent=f.properties.base;});
 }
}
if(window.maplibregl){
 const heroMap=new maplibregl.Map({container:'heroMap',style:rasterStyle(),center:baghdad,zoom:11.7,pitch:50,bearing:-19,interactive:false,attributionControl:false});heroMap.on('load',()=>addLayers(heroMap,false));
 const mainMap=new maplibregl.Map({container:'mainMap',style:rasterStyle(),center:baghdad,zoom:11.25,pitch:30,bearing:-8,attributionControl:true});mainMap.addControl(new maplibregl.NavigationControl({showCompass:true}),'bottom-right');mainMap.on('load',()=>addLayers(mainMap,true));
 const groups={risk:['risk-fill','risk-line'],animals:['animal-halo','animal-circles','animal-labels'],water:['water-halo','water-circles']};
 $$('[data-layer]').forEach(input=>input.addEventListener('change',()=>{(groups[input.dataset.layer]||[]).forEach(id=>{if(mainMap.getLayer(id))mainMap.setLayoutProperty(id,'visibility',input.checked?'visible':'none')})}));
 const slider=$('#timeSlider');function model(hour){const heat=Math.max(0,1-Math.abs(hour-14)/8);const traffic=Math.max(Math.max(0,1-Math.abs(hour-8)/4),Math.max(0,1-Math.abs(hour-18)/4));return{heat,traffic,score:Math.min(96,Math.round(44+heat*29+traffic*13))}}
 function updateTime(hour){const m=model(hour);$('#timeLabel').textContent=`${String(hour).padStart(2,'0')}:00`;$('#zoneScore').textContent=m.score;$('#heatValue').textContent=`+${Math.round(10+m.heat*18)}`;$('#trafficValue').textContent=`+${Math.round(10+m.traffic*12)}`;$('#interventionText').textContent=m.score>=80?'Deploy a shaded water station 180m north.':m.score>=65?'Add temporary water access and a crossing warning.':'Continue monitoring; no urgent intervention required.';if(mainMap.getLayer('risk-fill'))mainMap.setPaintProperty('risk-fill','fill-opacity',Math.min(.62,.18+m.heat*.32+m.traffic*.08));}
 slider?.addEventListener('input',e=>updateTime(Number(e.target.value)));updateTime(Number(slider?.value||14));
}
const modal=$('#reportModal');function openReport(){modal?.classList.add('open');modal?.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}function closeReport(){modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');document.body.style.overflow=''}
$$('[data-open-report]').forEach(b=>b.addEventListener('click',openReport));$$('[data-close-report]').forEach(b=>b.addEventListener('click',closeReport));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeReport()});$('#reportForm')?.addEventListener('submit',e=>{e.preventDefault();$('#reportSuccess').style.display='block';setTimeout(()=>{$('#reportSuccess').style.display='none';closeReport()},1300)});
const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});reveal.unobserve(entry.target)}),{threshold:.12});$$('.system>h2,.product-card,.signals-head,.signal-card,.live-head,.closing').forEach(el=>reveal.observe(el));
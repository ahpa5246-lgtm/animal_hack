/*
 * Invisible Fence Spatial Intelligence Mode
 * Inspired by the open architecture of bilawalsidhu/gods-eye-view (MIT),
 * but implemented independently for animal-welfare risk mapping.
 */

const BAGHDAD = { lat: 33.3152, lon: 44.3661 };

function loadStyle(href){
  if ([...document.styleSheets].some(s=>s.href===href)) return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){ if(window.Cesium) resolve(); else existing.addEventListener('load',resolve,{once:true}); return; }
    const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}

loadStyle('gods-eye.css');

const mapCanvas=document.querySelector('#mapCanvas');
if(mapCanvas){
  const btn=document.createElement('button');
  btn.className='spatial-mode-button';
  btn.innerHTML='◎ 3D intelligence view';
  btn.setAttribute('aria-pressed','false');
  mapCanvas.appendChild(btn);

  const stage=document.createElement('div');
  stage.className='spatial-stage';
  stage.innerHTML=`
    <div id="cesiumContainer"></div>
    <div class="spatial-loading">Building Baghdad spatial model…</div>
    <div class="spatial-pulse">Spatial model live</div>
    <div class="spatial-hud">
      <div class="hud-kicker">Invisible Fence / Baghdad</div>
      <div class="hud-title">Animal Risk Field</div>
      <div class="hud-row"><span>Active cells</span><b id="hudCells">—</b></div>
      <div class="hud-row"><span>Observed animals</span><b>14</b></div>
      <div class="hud-row"><span>Critical zones</span><b>3</b></div>
      <div class="hud-row"><span>Model hour</span><b id="hudHour">14:00</b></div>
    </div>
    <div class="spatial-legend">
      <span class="legend-chip" style="--chip:#7df0b5">Lower risk</span>
      <span class="legend-chip" style="--chip:#f0bc66">Elevated</span>
      <span class="legend-chip" style="--chip:#f07465">Critical</span>
    </div>`;
  mapCanvas.appendChild(stage);

  let viewer=null;
  let initialized=false;
  let h3mod=null;

  async function init3D(){
    if(initialized) return;
    initialized=true;
    try{
      loadStyle('https://cdn.jsdelivr.net/npm/cesium@1.145.0/Build/Cesium/Widgets/widgets.css');
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/cesium@1.145.0/Build/Cesium/Cesium.js'),
        import('https://cdn.jsdelivr.net/npm/h3-js@4.5.0/+esm').then(m=>h3mod=m).catch(()=>null),
        loadScript('https://cdn.jsdelivr.net/npm/@turf/turf@7.4.0/turf.min.js').catch(()=>null)
      ]);
      if(!window.Cesium) throw new Error('Cesium failed to load');
      Cesium.Ion.defaultAccessToken='';
      viewer=new Cesium.Viewer('cesiumContainer',{
        animation:false,baseLayerPicker:false,fullscreenButton:false,geocoder:false,
        homeButton:false,infoBox:false,navigationHelpButton:false,sceneModePicker:false,
        selectionIndicator:false,timeline:false,shouldAnimate:true,
        baseLayer:Cesium.ImageryLayer.fromProviderAsync(Cesium.OpenStreetMapImageryProvider.fromUrl('https://tile.openstreetmap.org/'))
      });
      viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#07130f');
      viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#07130f');
      viewer.scene.fog.enabled=true;
      viewer.scene.globe.enableLighting=true;
      viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(BAGHDAD.lon,BAGHDAD.lat,17000),duration:1.8});
      addRiskField();
      stage.querySelector('.spatial-loading')?.classList.add('hidden');
    }catch(err){
      stage.querySelector('.spatial-loading')?.remove();
      const error=document.createElement('div');error.className='spatial-error';
      error.textContent='3D mode could not load on this connection. The 2D risk model remains fully available.';
      stage.appendChild(error);
      console.error(err);
    }
  }

  function scoreForPoint(lat,lon){
    const sites=[
      {lat:33.317,lon:44.332,w:92},{lat:33.292,lon:44.402,w:78},{lat:33.339,lon:44.384,w:69}
    ];
    let score=28;
    for(const s of sites){
      const d=Math.hypot((lat-s.lat)*88,(lon-s.lon)*94);
      score=Math.max(score,s.w-Math.min(55,d*17));
    }
    const hour=Number(document.querySelector('#timeSlider')?.value||14);
    const heat=Math.max(0,1-Math.abs(hour-14)/8);
    return Math.min(98,Math.round(score+heat*8));
  }

  function addRiskField(){
    if(!viewer) return;
    viewer.entities.removeAll();
    const sightings=[
      {lat:33.318,lon:44.332,label:'DOGS ×3'},{lat:33.295,lon:44.399,label:'CATS ×6'},{lat:33.341,lon:44.381,label:'DOGS ×5'}
    ];
    sightings.forEach(s=>viewer.entities.add({
      position:Cesium.Cartesian3.fromDegrees(s.lon,s.lat,8),
      point:{pixelSize:12,color:Cesium.Color.fromCssColorString('#f07465'),outlineColor:Cesium.Color.WHITE.withAlpha(.65),outlineWidth:1},
      label:{text:s.label,font:'11px DM Sans',fillColor:Cesium.Color.WHITE,showBackground:true,backgroundColor:Cesium.Color.fromCssColorString('#07130f').withAlpha(.78),pixelOffset:new Cesium.Cartesian2(0,-24),disableDepthTestDistance:Number.POSITIVE_INFINITY}
    }));

    if(h3mod){
      const center=h3mod.latLngToCell(BAGHDAD.lat,BAGHDAD.lon,8);
      const cells=h3mod.gridDisk(center,5);
      document.querySelector('#hudCells').textContent=String(cells.length);
      cells.forEach(cell=>{
        const boundary=h3mod.cellToBoundary(cell,true);
        const centerPoint=h3mod.cellToLatLng(cell);
        const risk=scoreForPoint(centerPoint[0],centerPoint[1]);
        const color=risk>=76?'#f07465':risk>=55?'#f0bc66':'#7df0b5';
        const flat=[]; boundary.forEach(([lat,lon])=>flat.push(lon,lat));
        viewer.entities.add({polygon:{hierarchy:Cesium.Cartesian3.fromDegreesArray(flat),material:Cesium.Color.fromCssColorString(color).withAlpha(.18),outline:true,outlineColor:Cesium.Color.fromCssColorString(color).withAlpha(.5),height:2}});
      });
    }else{
      document.querySelector('#hudCells').textContent='91';
      [
        {lon:44.332,lat:33.317,r:1800,c:'#f07465'},{lon:44.402,lat:33.292,r:1450,c:'#f0bc66'},{lon:44.384,lat:33.339,r:1250,c:'#f0bc66'}
      ].forEach(z=>viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(z.lon,z.lat),ellipse:{semiMajorAxis:z.r,semiMinorAxis:z.r,material:Cesium.Color.fromCssColorString(z.c).withAlpha(.2),outline:true,outlineColor:Cesium.Color.fromCssColorString(z.c).withAlpha(.55)}}));
    }
  }

  btn.addEventListener('click',async()=>{
    const active=!stage.classList.contains('active');
    stage.classList.toggle('active',active);btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
    btn.innerHTML=active?'↙ return to risk map':'◎ 3D intelligence view';
    if(active){await init3D();setTimeout(()=>viewer?.resize(),60);}
  });

  document.querySelector('#timeSlider')?.addEventListener('input',e=>{
    const hud=document.querySelector('#hudHour');
    if(hud) hud.textContent=`${String(e.target.value).padStart(2,'0')}:00`;
    if(viewer&&stage.classList.contains('active')) addRiskField();
  });
}

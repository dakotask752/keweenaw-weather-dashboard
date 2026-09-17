/* KEWEENAW FISHING DASHBOARD — CLEAN FINAL
   The dashboard completely replaces the old page body,
   so legacy/non-working HTML sections cannot appear.

   Features:
   - One blue banner
   - One working spot dropdown
   - Current conditions
   - Previous 72 hours
   - Historical charts with vertical labels
   - Small wind-direction arrows
   - Forecast
   - Fishing windows
   - Geographic uMap waypoints
   - Collapsible best-spot rankings below map
*/

const TZ='America/Detroit',PAST=72,DAYS=7,$=id=>document.getElementById(id);

const DIRS=[
  'N','NNE','NE','ENE','E','ESE','SE','SSE',
  'S','SSW','SW','WSW','W','WNW','NW','NNW'
];

const NOAA={
  '45023':{name:'North Entry Buoy',lat:47.270,lon:-88.607},
  '45025':{name:'South Entry Buoy',lat:46.969,lon:-88.398},
  '45006':{name:'West Superior Buoy',lat:47.335,lon:-89.793},
  '45001':{name:'Mid Superior Buoy',lat:48.061,lon:-87.793}
};

/* Verified fishing locations */
const spots={
  houghton:{
    name:'Houghton',
    lat:46.9536,
    lon:-88.1657,
    best:['W','WNW','NW'],
    station:'45025',
    src:'Reference point'
  },

  breakers:{
    name:'Breakers Beach',
    lat:47.22792,
    lon:-88.63944,
    best:['W','WNW','NW'],
    station:'45023',
    src:'OSM/Mapcarta mapped beach'
  },

  gratiot:{
    name:'Gratiot River Mouth',
    lat:47.35000,
    lon:-88.45000,
    best:['W','WNW','NW'],
    station:'45023',
    src:'Published fisheries mouth coordinate; rounded'
  },

  tobacco:{
    name:'Tobacco River Mouth',
    lat:47.23066,
    lon:-88.14915,
    best:['E','ENE','NE'],
    station:'45025',
    src:'OSM/Mapcarta mapped feature'
  },

  portage:{
    name:'Portage Entry',
    lat:46.98301,
    lon:-88.43716,
    best:['W','WNW','NW'],
    station:'45025',
    src:'Portage River Harbor of Refuge mapped coordinate'
  },

  misery:{
    name:'Misery River Mouth',
    lat:47.00000,
    lon:-88.98333,
    best:['W','WNW','NW'],
    station:'45006',
    src:'Published fisheries mouth coordinate; rounded'
  },

  agate:{
    name:'Agate Beach',
    lat:47.0399314,
    lon:-88.9256858,
    best:['W','WNW','NW'],
    station:'45006',
    src:'GNIS/OSM mapped beach'
  },

  ont:{
    name:'Ontonagon River Mouth',
    lat:46.87944,
    lon:-89.33027,
    best:['W','WNW','NW'],
    station:'45006',
    src:'Michigan Water Trails mouth coordinate'
  },

  firesteel:{
    name:'Firesteel River Mouth',
    lat:46.93084,
    lon:-89.19045,
    best:['W','WNW','NW'],
    station:'45006',
    src:'Published/USACE mouth coordinate'
  },

  falls:{
    name:'Falls River',
    lat:46.75000,
    lon:-88.45000,
    best:['W','WNW','NW'],
    station:'45025',
    src:'USGS Falls River station vicinity'
  },

  sevenmile:{
    name:'Sevenmile Point',
    lat:47.37159,
    lon:-88.42011,
    best:['W','WNW','NW'],
    station:'45023',
    src:'USGS/GNIS mapped cape'
  },

  esrey:{
    name:'Esrey Park',
    lat:47.46880,
    lon:-88.05733,
    best:['W','WNW','NW'],
    station:'45023',
    src:'USGS/GNIS mapped park'
  },

  horseshoe:{
    name:'Horseshoe Harbor Beach',
    lat:47.47246,
    lon:-87.80151,
    best:['E','ENE','NE'],
    station:'45001',
    src:'OSM/Mapcarta mapped beach'
  },

  highrock:{
    name:'High Rock Bay',
    lat:47.42407,
    lon:-87.71484,
    best:['E','ENE','NE'],
    station:'45001',
    src:'USGS/GNIS mapped bay'
  },

  keystone:{
    name:'Keystone Bay',
    lat:47.40213,
    lon:-87.74873,
    best:['E','ENE','NE'],
    station:'45001',
    src:'USGS/GNIS mapped bay'
  },

  sandpoint:{
    name:'Sand Point — Baraga',
    lat:46.78160,
    lon:-88.47096,
    best:['W','WNW','NW'],
    station:'45025',
    src:'USGS feature coordinate'
  },

  pequaming:{
    name:'Pequaming Point',
    lat:46.84910,
    lon:-88.40318,
    best:['W','WNW','NW'],
    station:'45025',
    src:'USGS feature coordinate'
  },

  baragasp:{
    name:'Baraga State Park',
    lat:46.76111,
    lon:-88.50083,
    best:['W','WNW','NW'],
    station:'45025',
    src:'USGS/TopoZone + Michigan Water Trails'
  },

  silver:{
    name:'Silver River Mouth Area',
    lat:46.82250,
    lon:-88.28730,
    best:['W','WNW','NW'],
    station:'45025',
    src:'Published coastal-wetland mouth coordinate'
  },

  cranberry:{
    name:'Cranberry River',
    lat:46.84244,
    lon:-89.42070,
    best:['W','WNW','NW'],
    station:'45006',
    src:'OSM/GeoNames-derived feature'
  },

  littleiron:{
    name:'Little Iron River Mouth',
    lat:46.82597,
    lon:-89.58829,
    best:['W','WNW','NW'],
    station:'45006',
    src:'University of Michigan fish-collection locality'
  },

  huron:{
    name:'Huron River Mouth',
    lat:46.90972,
    lon:-88.03667,
    best:['NE','ENE','E'],
    station:'45025',
    src:'Published river-mouth coordinate / USGS'
  }
};

let W=null;
let M=null;
let rankCache=new Map();
let requestNo=0;

const n=v=>
  Number.isFinite(Number(v))
    ?Number(v)
    :null;

const ft=m=>
  n(m)==null
    ?null
    :n(m)*3.28084;

const mph=v=>
  n(v)==null
    ?null
    :n(v)*2.23694;

const cF=v=>
  n(v)==null
    ?null
    :n(v)*9/5+32;

function dir(d){
  let x=n(d);

  return x==null
    ?'--'
    :DIRS[
      Math.round(
        (((x%360)+360)%360)/22.5
      )%16
    ];
}

function ddeg(s){
  let i=DIRS.indexOf(s);
  return i<0?null:i*22.5;
}

function avg(a){
  a=a.map(n).filter(v=>v!=null);
  return a.length
    ?a.reduce((x,y)=>x+y,0)/a.length
    :null;
}

function min(a){
  a=a.map(n).filter(v=>v!=null);
  return a.length
    ?Math.min(...a)
    :null;
}

function max(a){
  a=a.map(n).filter(v=>v!=null);
  return a.length
    ?Math.max(...a)
    :null;
}

function circ(a){
  a=a.map(n).filter(v=>v!=null);

  if(!a.length)return null;

  let s=0;
  let c=0;

  a.forEach(x=>{
    x*=Math.PI/180;
    s+=Math.sin(x);
    c+=Math.cos(x);
  });

  let z=Math.atan2(s,c)*180/Math.PI;

  return z<0?z+360:z;
}

function fmt(v,d=1){
  return v==null
    ?'--'
    :Number(v).toFixed(d);
}

/* Open-Meteo returns local wall-clock times because timezone is requested. */
function wall(x){
  let m=String(x||'').match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
  );

  return m
    ?new Date(
      Date.UTC(
        +m[1],
        +m[2]-1,
        +m[3],
        +m[4],
        +m[5]
      )
    )
    :new Date(x);
}

function time(x,full=false){
  if(!x)return'--';

  let d=wall(x);

  if(Number.isNaN(d.getTime()))
    return String(x);

  return new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone:TZ,
      ...(full
        ?{
          weekday:'short',
          month:'short',
          day:'numeric'
        }
        :{}),
      hour:'numeric',
      minute:'2-digit'
    }
  ).format(d);
}

function miles(a,b,c,d){
  let R=3958.7613;
  let r=Math.PI/180;
  let x=(c-a)*r;
  let y=(d-b)*r;

  let q=
    Math.sin(x/2)**2+
    Math.cos(a*r)*
    Math.cos(c*r)*
    Math.sin(y/2)**2;

  return R*2*Math.asin(
    Math.sqrt(q)
  );
}

async function get(url,headers){
  let r=
    await fetch(
      url,
      {headers}
    );

  if(!r.ok)
    throw Error(r.status);

  return r.json();
}

async function weather(s){
  return get(
    `https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}`+
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation`+
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl`+
    `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max`+
    `&past_hours=${PAST}&forecast_days=${DAYS}`+
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`+
    `&timezone=America%2FDetroit`
  );
}

async function marine(s){
  return get(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${s.lat}&longitude=${s.lon}`+
    `&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,sea_surface_temperature`+
    `&past_hours=${PAST}&forecast_days=${DAYS}`+
    `&timezone=America%2FDetroit`
  );
}

async function astronomy(s){

  let date=
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:TZ,
        year:'numeric',
        month:'2-digit',
        day:'2-digit'
      }
    ).format(new Date());

  let x=
    await get(
      `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${s.lat},${s.lon}&tz=-5&dst=true`
    );

  return x?.properties?.data||{};
}

async function noaa(s){

  try{

    let h={
      'Accept':'application/geo+json',
      'User-Agent':
        'KeweenawFishingDashboard/Final'
    };

    let p=
      await get(
        `https://api.weather.gov/points/${s.lat},${s.lon}`,
        h
      );

    let st=
      await get(
        p.properties.observationStations,
        h
      );

    return st.features?.[0]
      ?await get(
        `${st.features[0].id}/observations/latest`,
        h
      )
      :null;

  }catch{
    return null;
  }
}

async function alerts(s){

  try{

    return await get(
      `https://api.weather.gov/alerts/active?point=${s.lat},${s.lon}`
    );

  }catch{

    return null;
  }
}

function inds(d){

  let a=d?.hourly?.time||[];
  let now=Date.now();

  return a
    .map(
      (x,i)=>({
        i,
        t:new Date(x).getTime()
      })
    )
    .filter(
      x=>
        Number.isFinite(x.t)&&
        x.t<=now+3600000
    )
    .slice(-PAST)
    .map(x=>x.i);
}

function nearest(
  a,
  t=Date.now()
){

  let b=-1;
  let z=Infinity;

  (a||[]).forEach(
    (x,i)=>{

      let q=
        Math.abs(
          new Date(x).getTime()-t
        );

      if(q<z){
        z=q;
        b=i;
      }
    }
  );

  return b;
}

function cur(d){
  return nearest(
    d?.hourly?.time||[]
  );
}

function hist(d,k){

  return inds(d)
    .map(
      i=>d.hourly?.[k]?.[i]
    )
    .filter(
      x=>n(x)!=null
    );
}

function windScore(
  d,
  best
){

  let x=n(d);

  let bs=
    best
      .map(ddeg)
      .filter(v=>v!=null);

  if(
    x==null||
    !bs.length
  )
    return 50;

  let z=180;

  bs.forEach(
    b=>{

      let q=
        Math.abs(x-b);

      z=
        Math.min(
          z,
          q>180
            ?360-q
            :q
        );
    }
  );

  return z<=22.5
    ?100
    :z<=45
      ?80
      :z<=67.5
        ?55
        :z<=90
          ?30
          :10;
}

function speed(s){

  return s<3
    ?.15
    :s<5
      ?.35
      :s<10
        ?.7
        :s<20
          ?1
          :s<25
            ?.85
            :.55;
}

function pressureChange(w){

  let i=
    cur(w);

  let t=
    w.hourly.time;

  let oi=
    nearest(
      t,
      new Date(
        t[i]
      ).getTime()-
      86400000
    );

  return n(
    w.hourly.pressure_msl?.[i]
  )!=null&&
  n(
    w.hourly.pressure_msl?.[oi]
  )!=null

    ?n(
      w.hourly.pressure_msl[i]
    )-
    n(
      w.hourly.pressure_msl[oi]
    )

    :null;
}

function score(
  w,
  m,
  s
){

  let wi=
    inds(w);

  let num=0;
  let den=0;

  wi.forEach(
    i=>{

      let sp=
        n(
          w.hourly.wind_speed_10m?.[i]
        );

      let di=
        n(
          w.hourly.wind_direction_10m?.[i]
        );

      if(
        sp==null||
        di==null
      )
        return;

      let f=
        speed(sp);

      let v=
        windScore(
          di,
          s.best
        );

      num+=v*f;
      den+=f;
    }
  );

  let ws=
    den
      ?num/den
      :0;

  let mi=
    cur(m);

  let wv=
    ft(
      m?.hourly?.wave_height?.[mi]
    );

  let wave=
    wv==null
      ?50
      :Math.max(
        0,
        Math.min(
          100,
          100-
          Math.abs(
            wv-2.5
          )*20
        )
      );

  let pc=
    pressureChange(w);

  let ps=
    pc==null
      ?50
      :Math.max(
        0,
        Math.min(
          100,
          Math.abs(pc)*12.5
        )
      );

  return{
    wind:ws,
    wave:wave,
    pressure:ps,
    total:
      ws*.5+
      wave*.3+
      ps*.2
  };
}

function label(x){

  return x>=85
    ?'Excellent'
    :x>=70
      ?'Very Good'
      :x>=55
        ?'Good'
        :x>=40
          ?'Fair'
          :'Poor';
}

function trend(
  w,
  m,
  s
){

  let i=
    cur(w);

  let a=
    w.hourly.wind_direction_10m?.[i];

  let f=
    w.hourly.wind_direction_10m?.slice(
      i+1,
      i+13
    );

  let now=
    windScore(
      a,
      s.best
    );

  let later=
    windScore(
      circ(f),
      s.best
    );

  return later-now>10
    ?'Improving'
    :later-now<-10
      ?'Deteriorating'
      :'Stable';
}

function windows(
  w,
  m,
  s
){

  let i=
    cur(w);

  let out=[];

  let end=
    Math.min(
      w.hourly.time.length,
      i+48
    );

  for(
    let j=i;
    j<end;
    j++
  ){

    let sp=
      n(
        w.hourly.wind_speed_10m?.[j]
      );

    let di=
      n(
        w.hourly.wind_direction_10m?.[j]
      );

    if(
      sp==null||
      di==null
    )
      continue;

    let ws=
      windScore(
        di,
        s.best
      )*
      speed(sp);

    let mi=
      nearest(
        m.hourly.time,
        new Date(
          w.hourly.time[j]
        ).getTime()
      );

    let wh=
      ft(
        m.hourly.wave_height?.[mi]
      );

    let wv=
      wh==null
        ?50
        :Math.max(
          0,
          Math.min(
            100,
            100-
            Math.abs(
              wh-2.5
            )*20
          )
        );

    let op=
      n(
        w.hourly.pressure_msl?.[
          Math.max(
            i,
            j-24
          )
        ]
      );

    let p=
      n(
        w.hourly.pressure_msl?.[j]
      );

    let ps=
      op==null
        ?50
        :Math.max(
          0,
          Math.min(
            100,
            Math.abs(p-op)*12.5
          )
        );

    out.push({
      t:w.hourly.time[j],
      wind:sp,
      di:di,
      wave:wh,
      sc:
        ws*.5+
        wv*.3+
        ps*.2
    });
  }

  let c=[];

  for(
    let j=0;
    j<out.length-2;
    j++
  ){

    let a=
      out.slice(
        j,
        j+3
      );

    c.push({
      start:a[0].t,
      end:a[2].t,
      di:a[1].di,
      wind:a[1].wind,
      wave:a[1].wave,
      sc:avg(
        a.map(
          x=>x.sc
        )
      )
    });
  }

  return c
    .sort(
      (a,b)=>b.sc-a.sc
    )
    .slice(0,5)
    .sort(
      (a,b)=>
        new Date(a.start)-
        new Date(b.start)
    );
}

/*
   THIS IS THE KEY CLEANUP.

   The old body contents are completely replaced.
   That means old:
   - fishingRating
   - ranking containers
   - comparison panels
   - analysis panels
   - duplicate dropdowns
   - old banners
   - old map containers
   - old text
   cannot appear.

   Head styles/scripts are unaffected.
*/
function root(){

  let r=
    document.createElement(
      'div'
    );

  r.id=
    'kfdApp';

  r.className=
    'v3-dashboard-host';

  document.body.replaceChildren(
    r
  );

  return r;
}

function card(
  title,
  body,
  cls=''
){

  return `
<section class="k-card ${cls}">
  <h2>${title}</h2>
  ${body}
</section>`;
}

function build(){

  let r=
    root();

  r.innerHTML=`

<div class="v1-banner">

  <div class="v1-title">
    🎣 Keweenaw Fishing Dashboard
  </div>

  <div class="v1-subtitle">
    Live conditions • 72-hour history • forecast • fishing windows • Keweenaw local time
  </div>

</div>

<section class="k-toolbar k-card">

  <label for="location">
    <b>Fishing spot</b>
  </label>

  <select id="location"></select>

  <span id="lastUpdated">
    Loading…
  </span>

</section>

<div
  id="summary"
  class="summary-grid">
</div>

<div
  id="currentGrid"
  class="data-grid">
</div>

<div
  id="historical"
  class="k-card">
</div>

<div
  id="charts"
  class="k-card">
</div>

<div
  id="forecast"
  class="k-card">
</div>

<div
  id="windows"
  class="k-card">
</div>

<div
  id="map"
  class="k-card">
</div>

<div
  id="ranking"
  class="k-card">
</div>

`;

  let s=
    $('location');

  Object.entries(
    spots
  ).forEach(
    ([k,v])=>{

      let o=
        document.createElement(
          'option'
        );

      o.value=k;
      o.textContent=v.name;

      s.appendChild(o);
    }
  );

  let saved=
    localStorage.getItem(
      'kfdSpot'
    );

  if(
    saved&&
    spots[saved]
  ){
    s.value=saved;
  }

  s.onchange=()=>{

    localStorage.setItem(
      'kfdSpot',
      s.value
    );

    rankCache.clear();

    load();
  };
}

function avgBox(
  title,
  text
){

  return `
<div class="avg-box">
  <b>${title}</b>
  <div>${text}</div>
</div>`;
}

function renderSummary(
  s,
  w,
  m,
  l
){

  let c=
    w.current||{};

  let pc=
    pressureChange(w);

  let tr=
    trend(
      w,
      m,
      l
    );

  $('summary').innerHTML=`

<div class="score-card">

  <div class="small">
    CURRENT FISHING SCORE
  </div>

  <div class="big">
    ${Math.round(s.total)}/100
  </div>

  <b>
    ${label(s.total)}
  </b>

  <span>
    50% wind · 30% waves · 20% pressure
  </span>

</div>

${[
  [
    'Wind',
    `${dir(c.wind_direction_10m)} ${fmt(c.wind_speed_10m)} mph`,
    `Gust ${fmt(c.wind_gusts_10m)} mph`
  ],

  [
    'Waves',
    `${fmt(
      ft(
        m.hourly.wave_height[
          cur(m)
        ]
      )
    )} ft`,
    `Target ≈ 2.5 ft`
  ],

  [
    'Pressure',
    `${fmt(c.pressure_msl)} hPa`,
    `24h ${
      pc==null
        ?'--'
        :(pc>=0?'+':'')+
         fmt(pc)
    } hPa`
  ],

  [
    'Trend',
    tr,
    `Favorable directions: ${l.best.join(', ')}`
  ]

].map(
  x=>`

<div class="stat-card">

  <div class="small">
    ${x[0]}
  </div>

  <div class="stat-big">
    ${x[1]}
  </div>

  <span>
    ${x[2]}
  </span>

</div>

`
).join('')}

`;
}

function renderCurrent(
  w,
  m,
  a,
  no,
  al,
  l
){

  let c=
    w.current||{};

  let i=
    cur(m);

  let moon=
    a?.moondata||[];

  let find=
    p=>
      moon.find(
        x=>x.phen===p
      )?.time||'--';

  let sun=
    a?.sundata?.find(
      x=>x.phen===
        'Upper Transit'
    )?.time||'--';

  let st=
    NOAA[l.station];

  let dist=
    st
      ?miles(
        l.lat,
        l.lon,
        st.lat,
        st.lon
      )
      :null;

  let alertText=
    al?.features?.length

      ?al.features
        .slice(0,4)
        .map(
          x=>`

<div class="alert">

  <b>
    ${x.properties.event}
  </b>

  <br>

  ${x.properties.headline||''}

</div>

`
        )
        .join('')

      :'<span class="good">No active NWS alerts.</span>';

  $('currentGrid').innerHTML=[

    card(
      'Weather',

      `
<div class="metric">
  ${fmt(c.temperature_2m)}°F
</div>

<p>
  Feels like
  ${fmt(c.apparent_temperature)}°F
</p>

<p>
  Humidity
  ${fmt(
    c.relative_humidity_2m,
    0
  )}%
  · Rain
  ${fmt(
    c.precipitation,
    2
  )} in
</p>
`
    ),

    card(
      'Wind',

      `
<div class="metric">

  ${dir(
    c.wind_direction_10m
  )}

  ${fmt(
    c.wind_speed_10m
  )} mph

</div>

<p>
  ${fmt(
    c.wind_direction_10m,
    0
  )}°
  · Gust
  ${fmt(
    c.wind_gusts_10m
  )} mph
</p>

<p>
  Best:
  ${l.best.join(', ')}
</p>
`
    ),

    card(
      'Waves',

      `
<div class="metric">

  ${fmt(
    ft(
      m.hourly.wave_height?.[i]
    )
  )} ft

</div>

<p>
  ${dir(
    m.hourly.wave_direction?.[i]
  )}
  ·
  ${fmt(
    m.hourly.wave_period?.[i]
  )} sec
</p>

<p>
  Water
  ${fmt(
    cF(
      m.hourly.sea_surface_temperature?.[i]
    )
  )}°F
</p>
`
    ),

    card(
      'Sun & Moon',

      `
<p>
  <b>Sunrise:</b>
  ${time(
    w.daily.sunrise?.[0]
  )}
</p>

<p>
  <b>Solar noon:</b>
  ${sun}
</p>

<p>
  <b>Sunset:</b>
  ${time(
    w.daily.sunset?.[0]
  )}
</p>

<p>
  <b>Moon:</b>
  ${a?.curphase||'--'}
  ·
  ${
    a?.fracillum!=null
      ?Math.round(
        Number(
          a.fracillum
        )*100
      )+'%'
      :'--'
  }
</p>

<p>
  Rise
  ${find('Rise')}
  · Set
  ${find('Set')}
</p>
`
    ),

    card(
      'NOAA/NWS',

      no

        ?`
<p>
  Temp
  ${fmt(
    cF(
      no.properties?.temperature?.value
    )
  )}°F
  · Wind
  ${fmt(
    mph(
      no.properties?.windSpeed?.value
    )
  )} mph
</p>

<p>
  Pressure
  ${
    no.properties?.barometricPressure?.value!=null
      ?fmt(
        no.properties.barometricPressure.value/
        100
      )
      :'--'
  } hPa
</p>

<p class="small">
  ${l.station}
  ${
    st
      ?`(${st.name}, ${fmt(dist)} mi)`
      :''
  }
</p>

`

        :'<p>NOAA observation unavailable.</p>'
    ),

    card(
      'Alerts',
      alertText
    )

  ].join('');
}

function renderHistorical(
  w,
  m
){

  let wa=
    hist(
      w,
      'wind_speed_10m'
    );

  let wg=
    hist(
      w,
      'wind_gusts_10m'
    );

  let td=
    hist(
      w,
      'temperature_2m'
    );

  let pr=
    hist(
      w,
      'pressure_msl'
    );

  let wd=
    hist(
      w,
      'wind_direction_10m'
    );

  let wh=
    (m.hourly?.wave_height||[])
      .slice(-PAST)
      .map(ft)
      .filter(
        v=>v!=null
      );

  let wp=
    (m.hourly?.wave_period||[])
      .slice(-PAST);

  let wt=
    (m.hourly?.sea_surface_temperature||[])
      .slice(-PAST)
      .map(cF);

  $('historical').innerHTML=`

<h2>
  📊 Previous 72 hours
</h2>

<div class="avg-grid">

  ${avgBox(
    'Wind',
    `
    ${fmt(avg(wa))}
    mph average
    · ${dir(circ(wd))}
    · gust
    ${fmt(avg(wg))}
    mph
    · ${fmt(min(wa))}–${fmt(max(wa))} mph
    `
  )}

  ${avgBox(
    'Temperature',
    `
    ${fmt(avg(td))}°F average
    · ${fmt(min(td))}–${fmt(max(td))}°F
    `
  )}

  ${avgBox(
    'Pressure',
    `
    ${fmt(avg(pr))} hPa average
    · ${fmt(min(pr))}–${fmt(max(pr))} hPa
    `
  )}

  ${avgBox(
    'Waves',
    `
    ${fmt(avg(wh))} ft average
    · ${fmt(avg(wp))} sec period
    · water
    ${fmt(avg(wt))}°F
    `
  )}

</div>

`;
}

function chart(
  canvas,
  title,
  labels,
  sets,
  dirs
){

  let c=
    canvas.getContext('2d');

  let d=
    devicePixelRatio||1;

  let w=
    canvas.clientWidth||800;

  let h=
    canvas.clientHeight||300;

  c.canvas.width=
    w*d;

  c.canvas.height=
    h*d;

  c.setTransform(
    d,
    0,
    0,
    d,
    0,
    0
  );

  c.clearRect(
    0,
    0,
    w,
    h
  );

  let pl=45;
  let pr=15;
  let pt=25;

  /*
     Space reserved for vertical labels.
  */
  let pb=105;

  let pw=
    w-pl-pr;

  let ph=
    h-pt-pb;

  let vals=
    sets
      .flatMap(
        x=>x.data
      )
      .filter(
        v=>v!=null
      );

  let lo=
    Math.min(...vals);

  let hi=
    Math.max(...vals);

  if(lo===hi){
    lo--;
    hi++;
  }

  let x=
    i=>
      pl+
      (
        labels.length<2
          ?0
          :i*pw/
           (labels.length-1)
      );

  let y=
    v=>
      pt+
      (hi-v)*
      ph/
      (hi-lo);

  c.font=
    '11px Arial';

  c.strokeStyle=
    '#dbe3ea';

  for(
    let g=0;
    g<=4;
    g++
  ){

    let yy=
      pt+
      g*ph/4;

    c.beginPath();

    c.moveTo(
      pl,
      yy
    );

    c.lineTo(
      w-pr,
      yy
    );

    c.stroke();

    c.fillStyle=
      '#64748b';

    c.textAlign=
      'right';

    c.fillText(
      fmt(
        hi-
        g*(hi-lo)/4,
        1
      ),
      pl-6,
      yy+4
    );
  }

  /*
     Vertical timestamps.
     Seven labels keeps them readable.
  */
  let st=
    Math.max(
      1,
      Math.ceil(
        labels.length/7
      )
    );

  labels.forEach(
    (q,i)=>{

      if(
        i%st===0||
        i===labels.length-1
      ){

        let xx=
          x(i);

        c.save();

        c.translate(
          xx,
          h-8
        );

        c.rotate(
          -Math.PI/2
        );

        c.fillStyle=
          '#64748b';

        c.font=
          '10px Arial';

        c.textAlign=
          'left';

        c.textBaseline=
          'middle';

        c.fillText(
          q,
          0,
          0
        );

        c.restore();
      }
    }
  );

  /*
     Lines + plot points.
  */
  sets.forEach(
    s=>{

      c.strokeStyle=
        s.color;

      c.lineWidth=2;

      c.beginPath();

      s.data.forEach(
        (v,i)=>{

          if(v==null)
            return;

          if(i){
            c.lineTo(
              x(i),
              y(v)
            );
          }else{
            c.moveTo(
              x(i),
              y(v)
            );
          }
        }
      );

      c.stroke();

      c.fillStyle=
        s.color;

      s.data.forEach(
        (v,i)=>{

          if(v!=null){

            c.beginPath();

            c.arc(
              x(i),
              y(v),
              2.2,
              0,
              7
            );

            c.fill();
          }
        }
      );
    }
  );

  /*
     Small wind-direction arrows.
  */
  if(dirs){

    c.strokeStyle=
      '#475569';

    c.lineWidth=1;

    let step=
      Math.max(
        1,
        Math.ceil(
          labels.length/18
        )
      );

    for(
      let i=0;
      i<labels.length;
      i+=step
    ){

      let q=
        n(dirs[i]);

      if(
        q==null||
        sets[0].data[i]==null
      )
        continue;

      let a=
        (q+180)*
        Math.PI/180;

      let xx=
        x(i);

      let yy=
        y(
          sets[0].data[i]
        )-10;

      let L=6;

      c.save();

      c.translate(
        xx,
        yy
      );

      c.rotate(a);

      c.beginPath();

      c.moveTo(
        -L/2,
        0
      );

      c.lineTo(
        L/2,
        0
      );

      c.moveTo(
        L/2,
        0
      );

      c.lineTo(
        L/2-2.5,
        -2.5
      );

      c.moveTo(
        L/2,
        0
      );

      c.lineTo(
        L/2-2.5,
        2.5
      );

      c.stroke();

      c.restore();
    }
  }

  /*
     Legend.
  */
  let lx=pl;

  sets.forEach(
    s=>{

      c.fillStyle=
        s.color;

      c.fillRect(
        lx,
        7,
        16,
        3
      );

      c.fillStyle=
        '#334155';

      c.textAlign=
        'left';

      c.fillText(
        s.label,
        lx+21,
        11
      );

      lx+=
        c.measureText(
          s.label
        ).width+
        42;
    }
  );
}

function renderCharts(
  w,
  m
){

  let h=
    w.hourly;

  let ci=
    cur(w);

  let ix=[];

  for(
    let i=Math.max(
      0,
      ci-71
    );
    i<=ci;
    i++
  ){
    ix.push(i);
  }

  let lab=
    ix.map(
      i=>time(
        h.time[i],
        true
      )
    );

  $('charts').innerHTML=`

<h2>
  📈 Historical charts — 72 hours
</h2>

<div class="chart-grid">

  <div class="chart-box">

    <h3>
      Wind & gusts

      <span class="small">
        arrows show wind direction
      </span>
    </h3>

    <canvas id="cw"></canvas>

  </div>

  <div class="chart-box">

    <h3>
      Temperature
    </h3>

    <canvas id="ct"></canvas>

  </div>

  <div class="chart-box">

    <h3>
      Pressure
    </h3>

    <canvas id="cp"></canvas>

  </div>

  <div class="chart-box">

    <h3>
      Wave height
    </h3>

    <canvas id="cm"></canvas>

  </div>

</div>

`;

  chart(
    $('cw'),
    'Wind',
    lab,
    [
      {
        label:'Wind mph',
        color:'#2563eb',
        data:ix.map(
          i=>n(
            h.wind_speed_10m?.[i]
          )
        )
      },

      {
        label:'Gust mph',
        color:'#94a3b8',
        data:ix.map(
          i=>n(
            h.wind_gusts_10m?.[i]
          )
        )
      }
    ],
    ix.map(
      i=>
        h.wind_direction_10m?.[i]
    )
  );

  chart(
    $('ct'),
    'Temp',
    lab,
    [
      {
        label:'Temperature °F',
        color:'#ea580c',
        data:ix.map(
          i=>n(
            h.temperature_2m?.[i]
          )
        )
      }
    ]
  );

  chart(
    $('cp'),
    'Pressure',
    lab,
    [
      {
        label:'Pressure hPa',
        color:'#16a34a',
        data:ix.map(
          i=>n(
            h.pressure_msl?.[i]
          )
        )
      }
    ]
  );

  let mi=
    (m.hourly?.time||[])
      .map(
        (x,i)=>({
          i,
          t:new Date(x)
            .getTime()
        })
      )
      .filter(
        x=>
          x.t<=
          Date.now()+
          3600000
      )
      .slice(-72)
      .map(
        x=>x.i
      );

  chart(
    $('cm'),
    'Waves',
    mi.map(
      i=>
        time(
          m.hourly.time[i],
          true
        )
    ),
    [
      {
        label:'Wave ft',
        color:'#7c3aed',
        data:mi.map(
          i=>ft(
            m.hourly.wave_height?.[i]
          )
        )
      }
    ]
  );
}

function renderForecast(w){

  let d=
    w.daily;

  let h=
    w.hourly;

  let ci=
    cur(w);

  let daily=
    (d.time||[])
      .map(
        (x,i)=>`

<tr>

  <td>
    ${x}
  </td>

  <td>
    ${fmt(
      d.temperature_2m_max?.[i]
    )}°
    /
    ${fmt(
      d.temperature_2m_min?.[i]
    )}°F
  </td>

  <td>
    ${fmt(
      d.wind_speed_10m_max?.[i]
    )} mph
  </td>

  <td>
    ${fmt(
      d.precipitation_sum?.[i],
      2
    )} in
  </td>

</tr>

`
      )
      .join('');

  let hours=[];

  for(
    let i=ci;
    i<
      Math.min(
        h.time.length,
        ci+48
      );
    i++
  ){

    hours.push(`

<tr>

  <td>
    ${time(
      h.time[i],
      true
    )}
  </td>

  <td>
    ${fmt(
      h.temperature_2m?.[i]
    )}°F
  </td>

  <td>
    ${dir(
      h.wind_direction_10m?.[i]
    )}
    ${fmt(
      h.wind_speed_10m?.[i]
    )}
  </td>

  <td>
    ${fmt(
      h.wind_gusts_10m?.[i]
    )}
  </td>

  <td>
    ${fmt(
      h.pressure_msl?.[i]
    )}
  </td>

  <td>
    ${fmt(
      h.precipitation_probability?.[i],
      0
    )}%
  </td>

</tr>

`);
  }

  $('forecast').innerHTML=`

<h2>
  🔮 Forecast
</h2>

<div class="table-box">

  <h3>
    7-day outlook
  </h3>

  <table>

    <tr>
      <th>Day</th>
      <th>High / Low</th>
      <th>Max wind</th>
      <th>Rain</th>
    </tr>

    ${daily}

  </table>

</div>

<div class="table-box">

  <h3>
    Next 48 hours
  </h3>

  <table>

    <tr>
      <th>Local time</th>
      <th>Temp</th>
      <th>Wind</th>
      <th>Gust</th>
      <th>Pressure</th>
      <th>Rain</th>
    </tr>

    ${hours.join('')}

  </table>

</div>

`;
}

function renderWindows(
  w,
  m,
  l
){

  let x=
    windows(
      w,
      m,
      l
    );

  $('windows').innerHTML=`

<h2>
  🎣 Best fishing windows — next 48 hours
</h2>

<div class="window-grid">

${
  x.length

    ?x.map(
      (q,i)=>`

<div class="window">

  <div>

    <b>

      ${
        i===0
          ?'Best window · '
          :''
      }

      ${time(
        q.start,
        true
      )}
      –
      ${time(
        q.end
      )}

    </b>

    <span>

      ${dir(q.di)}
      ${fmt(q.wind)}
      mph ·
      ${fmt(q.wave)}
      ft waves

    </span>

  </div>

  <strong>
    ${Math.round(q.sc)}
  </strong>

</div>

`
    ).join('')

    :'<p>No forecast window available.</p>'
}

</div>

<p class="small">

  Planning aid only.
  The score uses wind 50%, waves 30%, pressure 20%.

</p>

`;
}

function renderMap(){

  let fs=
    Object.entries(
      spots
    ).map(
      ([k,s])=>({

        type:'Feature',

        properties:{
          name:s.name,
          key:k
        },

        geometry:{
          type:'Point',
          coordinates:[
            s.lon,
            s.lat
          ]
        }

      })
    );

  let data=
    encodeURIComponent(
      JSON.stringify({
        type:'FeatureCollection',
        features:fs
      })
    );

  /*
     External uMap URL.
     It does NOT point back to index.html.
  */
  let src=
    `https://umap.openstreetmap.fr/en/map/?data=${data}`+
    `&dataFormat=geojson`+
    `&scrollWheelZoom=true`+
    `&searchControl=false`+
    `&captionBar=false`+
    `&embedControl=false`;

  $('map').innerHTML=`

<h2>
  🗺 Verified fishing waypoints
</h2>

<p class="small">
  All pins are real geographic coordinates and stay anchored when you pan or zoom the map.
</p>

<iframe
  class="map-frame"
  src="${src}"
  title="Keweenaw fishing waypoints"
  loading="lazy"
  allowfullscreen>
</iframe>

`;
}

/*
   BEST SPOT RANKINGS

   This is the ONLY section after the map.
   It starts collapsed.
*/
async function renderRanking(){

  let el=
    $('ranking');

  if(!el)
    return;

  el.innerHTML=`

<details>

  <summary>
    📍 Best spot rankings
  </summary>

  <p class="small">
    Live comparison of all verified spots using the same wind, wave, and pressure scoring used above.
  </p>

  <div id="rankRows">
    Calculating…
  </div>

</details>

`;

  let rows=[];

  for(
    let [
      key,
      s
    ]
    of Object.entries(
      spots
    )
  ){

    try{

      let d=
        rankCache.get(key);

      if(!d){

        d=
          await Promise.all([
            weather(s),
            marine(s)
          ]);

        rankCache.set(
          key,
          d
        );
      }

      let sc=
        score(
          d[0],
          d[1],
          s
        );

      rows.push({
        key:key,
        name:s.name,
        wind:sc.wind,
        wave:sc.wave,
        pressure:sc.pressure,
        total:sc.total
      });

    }catch{

      rows.push({
        key:key,
        name:s.name,
        total:null
      });
    }
  }

  rows.sort(
    (a,b)=>
      (b.total??-1)-
      (a.total??-1)
  );

  let selected=
    $('location')?.value;

  $('rankRows').innerHTML=
    rows.map(
      (x,i)=>`

<div class="rank-row ${
  selected===x.key
    ?'rank-selected'
    :''
}">

  <div class="rank-position">
    ${i+1}
  </div>

  <div class="rank-name">

    <b>
      ${x.name}
    </b>

    ${
      selected===x.key
        ?'<span class="rank-current">CURRENT</span>'
        :''
    }

  </div>

  <div class="rank-breakdown">

    ${
      x.total==null

        ?'Data unavailable'

        :`
          Wind ${Math.round(x.wind)}
          · Waves ${Math.round(x.wave)}
          · Pressure ${Math.round(x.pressure)}
        `
    }

  </div>

  <div class="rank-score">

    ${
      x.total==null
        ?'--'
        :Math.round(x.total)
    }

  </div>

</div>

`
    ).join('');
}

async function load(){

  let k=
    $('location').value;

  let l=
    spots[k];

  let me=
    ++requestNo;

  $('lastUpdated').textContent=
    'Loading…';

  try{

    [W,M]=
      await Promise.all([
        weather(l),
        marine(l)
      ]);

    let [
      a,
      no,
      al
    ]=
      await Promise.all([
        astronomy(l),
        noaa(l),
        alerts(l)
      ]);

    if(
      me!==requestNo
    )
      return;

    let s=
      score(
        W,
        M,
        l
      );

    renderSummary(
      s,
      W,
      M,
      l
    );

    renderCurrent(
      W,
      M,
      a,
      no,
      al,
      l
    );

    renderHistorical(
      W,
      M
    );

    renderCharts(
      W,
      M
    );

    renderForecast(
      W
    );

    renderWindows(
      W,
      M,
      l
    );

    renderMap();

    /*
       Rankings are the final element.
    */
    await renderRanking();

    $('lastUpdated').textContent=
      `Updated ${
        time(
          new Date()
        )
      } local`;

  }catch(e){

    console.error(e);

    $('lastUpdated').textContent=
      'Some data failed to load — see browser console.';
  }
}

document.addEventListener(
  'DOMContentLoaded',
  ()=>{
    build();
    load();
  }
);
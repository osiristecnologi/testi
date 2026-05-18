// ═════════════════════════
══════════════════════
//   COINHAT-FEEDS v2 — app.js (Backend Integrated)
// ═══════════════════════════════════════════════

const $ = id => document.getElementById(id);
let CONFIG = { referral: '', wallet: '' };

// ── FORMAT ──
const fmt = {
  price(n){
    if(!n && n!==0) return'—';
    n = parseFloat(n);
    if(n<0.000001) return'$'+n.toExponential(2);
    if(n<0.01) return'$'+n.toFixed(6);
    if(n<1) return'$'+n.toFixed(4);
    if(n<1000) return'$'+n.toFixed(3);
    return'$'+n.toLocaleString('pt-BR',{maximumFractionDigits:2});
  },
  large(n){
    if(!n) return'—';
    if(n>=1e9) return'$'+(n/1e9).toFixed(2)+'B';
    if(n>=1e6) return'$'+(n/1e6).toFixed(2)+'M';
    if(n>=1e3) return'$'+(n/1e3).toFixed(1)+'K';
    return'$'+parseFloat(n).toFixed(2);
  },
  pct(n){
    if(n===undefined||n===null) return'—';
    const v=parseFloat(n);
    return(v>0?'+':'')+v.toFixed(2)+'%';
  },
  addr(a){ return a?a.slice(0,6)+'…'+a.slice(-5):'—' }
};

// ── TOAST ──
function toast(msg,type='info'){
  const c=$('toasts'), t=document.createElement('div');
  t.className='toast '+type; t.textContent=msg;
  c.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400)},2800);
}

// ── CACHE ──
const cache={
  set(k,v,ttl=300000){try{localStorage.setItem('cf2_'+k,JSON.stringify({v,t:Date.now()+ttl}))}catch(e){}},
  get(k){try{const d=JSON.parse(localStorage.getItem('cf2_'+k));if(d&&d.t>Date.now())return d.v}catch(e){}return null}
};

// ── SPARKLINE ──
function sparkline(up,w=120,h=36){
  const pts=[]; let y=h/2;
  for(let i=0;i<12;i++){
    y+=((Math.random()-.44)*(up?1.2:1))*5;
    y=Math.max(4,Math.min(h-4,y));
    pts.push({x:i*(w/11),y});
  }
  const line='M'+pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  return{line,area:line+` L ${w},${h} L 0,${h} Z`};
}

// ── SECTION ROUTER ──
function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  $('sec-'+id)?.classList.add('active');
  document.querySelectorAll('.nav-item[data-sec]').forEach(n=>{
    n.classList.toggle('active', n.dataset.sec===id);
  });
  document.querySelectorAll('.d-item[data-sec]').forEach(n=>{
    n.classList.toggle('active', n.dataset.sec===id);
  });
  if(id==='news')     loadNews();
  if(id==='airdrops') loadAirdrops();
  if(id==='alpha')    loadAlpha();
  if(id==='partners') loadPartners();
}

// ── DRAWER ──
const drawerOverlay=$('drawer-overlay');
function openDrawer(){ drawerOverlay.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ drawerOverlay.classList.remove('open'); document.body.style.overflow=''; }
$('menu-btn').addEventListener('click', openDrawer);
$('drawer-close').addEventListener('click', closeDrawer);
$('drawer-bg').addEventListener('click', closeDrawer);
document.querySelectorAll('.d-item[data-sec]').forEach(el=>{
  el.addEventListener('click',()=>{ showSection(el.dataset.sec); closeDrawer(); });
});

// ── BOTTOM NAV ──
document.querySelectorAll('.nav-item[data-sec]').forEach(el=>{
  el.addEventListener('click',()=>showSection(el.dataset.sec));
});
$('nav-swap-btn').addEventListener('click', () => showSection('swap'));

// ── SEARCH ──
const searchWrap=$('search-wrap'), searchField=$('search-field'), searchDrop=$('search-drop');
let searchTimer;
$('search-toggle').addEventListener('click',()=>{
  if(searchWrap.classList.toggle('open')) searchField.focus();
  else{ searchField.value=''; searchDrop.classList.remove('vis'); }
});
searchField.addEventListener('input',()=>{
  clearTimeout(searchTimer);
  const q=searchField.value.trim();
  if(q.length<2){ searchDrop.classList.remove('vis'); return; }
  searchTimer=setTimeout(()=>doSearch(q),380);
});
document.addEventListener('click',e=>{
  if(!searchWrap.contains(e.target)){ searchDrop.classList.remove('vis'); searchWrap.classList.remove('open'); }
});

async function doSearch(q){
  const cached=cache.get('s_'+q);
  if(cached){ renderSearch(cached); return; }
  try{
    const r=await fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`);
    const d=await r.json();
    const pairs=(d.pairs||[]).filter(p=>p.chainId==='solana').slice(0,7);
    cache.set('s_'+q,pairs,60000);
    renderSearch(pairs);
  }catch(e){}
}
function renderSearch(pairs){
  if(!pairs.length){
    searchDrop.innerHTML='<div class="s-item" style="color:var(--t3);justify-content:center;padding:18px">Nenhum resultado</div>';
    searchDrop.classList.add('vis'); return;
  }
  const COLORS=['#f7c600','#1a6bff','#16c784','#ea3943','#9945ff','#ff6b2b','#00d4ff'];
  searchDrop.innerHTML=pairs.map((p,i)=>{
    const hasImg=p.info?.imageUrl;
    const col=COLORS[i%COLORS.length];
    const init=(p.baseToken?.symbol||'?').slice(0,2).toUpperCase();
    return`<div class="s-item" data-idx="${i}">
      ${hasImg
        ?`<img src="${p.info.imageUrl}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`
        :''}
      <div class="s-fallback" style="background:${col};${hasImg?'display:none':'display:flex'}">${init}</div>
      <div>
        <div class="s-name">${p.baseToken?.name||'—'}</div>
        <div class="s-sym">${p.baseToken?.symbol||''}</div>
      </div>
      <span class="s-price">${fmt.price(p.priceUsd)}</span>
    </div>`;
  }).join('');
  searchDrop.classList.add('vis');
  searchDrop.querySelectorAll('.s-item').forEach((el,i)=>{
    el.addEventListener('click',()=>{
      openModal(pairs[i]);
      searchDrop.classList.remove('vis');
      searchWrap.classList.remove('open');
      searchField.value='';
    });
  });
}

// ── MEMECOINS ──
const LOGO_COLORS=['#9945ff','#f7c600','#1a6bff','#16c784','#ea3943','#ff6b2b','#00d4ff','#ff2e7e','#00c896','#ffb800','#3b82f6','#10b981'];
let allCoins=[], filteredCoins=[];

async function loadCoins(){
  const grid=$('coin-grid');
  grid.innerHTML=Array(18).fill('<div class="skel"></div>').join('');
  let coins=cache.get('coins2');
  if(!coins){
    try{
      const r=await fetch('https://api.dexscreener.com/token-boosts/top/v1');
      const boosts=await r.json();
      const addrs=boosts.filter(t=>t.chainId==='solana').slice(0,20).map(t=>t.tokenAddress).join(',');
      if(addrs){
        const r2=await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs}`);
        const d2=await r2.json();
        const seen=new Map();
        (d2.pairs||[]).filter(p=>p.chainId==='solana').forEach(p=>{
          const k=p.baseToken?.address; if(!k)return;
          const liq=parseFloat(p.liquidity?.usd||0);
          const cur=seen.get(k);
          if(!cur||liq>parseFloat(cur.liquidity?.usd||0))seen.set(k,p);
        });
        coins=[...seen.values()].slice(0,18);
      }
      if(!coins||coins.length<6){
        const r3=await fetch('https://api.dexscreener.com/latest/dex/search?q=solana+meme');
        const d3=await r3.json();
        const existing=new Set((coins||[]).map(p=>p.baseToken?.address));
        coins=coins||[];
        for(const p of (d3.pairs||[]).filter(p=>p.chainId==='solana')){
          if(!existing.has(p.baseToken?.address)){coins.push(p);existing.add(p.baseToken?.address);}
          if(coins.length>=18)break;
        }
      }
      cache.set('coins2',coins,30000);
    }catch(e){
      toast('Erro ao carregar tokens','error');
    }
  }
  allCoins=coins;
  filteredCoins=[...coins];
  renderCoins(filteredCoins);
  buildTicker(coins);
}

function renderCoins(coins){
  const grid=$('coin-grid');
  grid.innerHTML='';
  coins.slice(0,18).forEach((p,i)=>{
    const price=parseFloat(p.priceUsd||0);
    const chg=parseFloat(p.priceChange?.h24||0);
    const up=chg>=0;
    const col=LOGO_COLORS[i%LOGO_COLORS.length];
    const hasImg=p.info?.imageUrl;
    const spark=sparkline(up);
    const card=document.createElement('div');
    card.className='coin-card';
    card.style.animation=`fadeUp .38s ease ${i*28}ms both`;
    card.innerHTML=`
      <div class="card-top">
        <div class="card-logo-wrap">
          ${hasImg
            ?`<img class="card-logo" src="${p.info.imageUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            :''}
          <div class="card-logo-fb" style="background:${col};display:${hasImg?'none':'flex'}">${(p.baseToken?.symbol||'?').slice(0,2).toUpperCase()}</div>
          <div class="card-live-dot"></div>
        </div>
        <div class="card-chg-badge ${up?'up':'dn'}">
          ${up?'▲':'▼'}${Math.abs(chg).toFixed(1)}%
        </div>
      </div>
      <div class="card-body">
        <div class="c-name">${p.baseToken?.name||'—'}</div>
        <div class="c-sym">${p.baseToken?.symbol||'—'}</div>
        <div class="c-price">${fmt.price(price)}</div>
        <div class="card-stats">
          <div class="cs-item"><div class="cs-lbl">Mkt Cap</div><div class="cs-val">${fmt.large(p.marketCap)}</div></div>
          <div class="cs-item"><div class="cs-lbl">Vol 24h</div><div class="cs-val">${fmt.large(p.volume?.h24)}</div></div>
        </div>
      </div>
      <div class="card-spark">
        <svg viewBox="0 0 120 36" preserveAspectRatio="none" style="width:100%;height:38px;display:block">
          <defs><linearGradient id="sg${i}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${up?'#00c896':'#ff4560'}" stop-opacity=".25"/>
            <stop offset="100%" stop-color="${up?'#00c896':'#ff4560'}" stop-opacity="0"/>
          </linearGradient></defs>
          <path d="${spark.area}" fill="url(#sg${i})"/>
          <path d="${spark.line}" fill="none" stroke="${up?'#00c896':'#ff4560'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;
    card.addEventListener('click',()=>openModal(p));
    grid.appendChild(card);
  });
}

// Filter tabs
document.querySelectorAll('.ftab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const f=tab.dataset.filter;
    let coins=[...allCoins];
    if(f==='gainers') coins.sort((a,b)=>parseFloat(b.priceChange?.h24||0)-parseFloat(a.priceChange?.h24||0));
    else if(f==='losers') coins.sort((a,b)=>parseFloat(a.priceChange?.h24||0)-parseFloat(b.priceChange?.h24||0));
    else if(f==='volume') coins.sort((a,b)=>parseFloat(b.volume?.h24||0)-parseFloat(a.volume?.h24||0));
    else if(f==='new') coins.reverse();
    filteredCoins=coins;
    renderCoins(coins);
  });
});

$('refresh-btn').addEventListener('click',()=>{
  cache.set('coins2',null,0);
  loadCoins();
  toast('Atualizando preços…','info');
});

// ── TICKER ──
async function buildTicker(coins){
  let btc={price:67000,chg:1.2},eth={price:3400,chg:0.8},sol={price:168,chg:3.4};
  try{
    const r=await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]');
    const d=await r.json();
    d.forEach(t=>{
      if(t.symbol==='BTCUSDT')btc={price:parseFloat(t.lastPrice),chg:parseFloat(t.priceChangePercent)};
      if(t.symbol==='ETHUSDT')eth={price:parseFloat(t.lastPrice),chg:parseFloat(t.priceChangePercent)};
      if(t.symbol==='SOLUSDT')sol={price:parseFloat(t.lastPrice),chg:parseFloat(t.priceChangePercent)};
    });
  }catch(e){}
  const items=[
    {sym:'BTC',price:btc.price,chg:btc.chg},
    {sym:'ETH',price:eth.price,chg:eth.chg},
    {sym:'SOL',price:sol.price,chg:sol.chg},
    ...(coins||[]).slice(0,12).map(p=>({
      sym:p.baseToken?.symbol||'?',
      price:parseFloat(p.priceUsd||0),
      chg:parseFloat(p.priceChange?.h24||0)
    }))
  ];
  const html=items.map(t=>`
    <span class="t-item">
      <span class="t-sym">${t.sym}</span>
      <span class="t-p">${fmt.price(t.price)}</span>
      <span class="t-c ${t.chg>=0?'up':'dn'}">${t.chg>=0?'+':''}${(t.chg||0).toFixed(2)}%</span>
    </span>`).join('');
  $('ticker-track').innerHTML=html+html;
}

// ── MODAL ──
let currentPair=null;
function openModal(pair){
  currentPair=pair;
  const hasImg=pair.info?.imageUrl;
  const logo=$('m-logo'), fb=$('m-logo-fb');
  if(hasImg){
    logo.src=pair.info.imageUrl;
    logo.style.display='block'; fb.style.display='none';
    logo.onerror=()=>{ logo.style.display='none'; fb.style.display='flex'; };
  } else {
    logo.style.display='none';
    fb.style.display='flex';
    const col=LOGO_COLORS[Math.floor(Math.random()*LOGO_COLORS.length)];
    fb.style.background=col;
    fb.textContent=(pair.baseToken?.symbol||'?').slice(0,2).toUpperCase();
  }
  $('m-name').textContent=pair.baseToken?.name||'—';
  $('m-sym').textContent=pair.baseToken?.symbol||'';
  $('m-price').textContent=fmt.price(pair.priceUsd);
  const chg=parseFloat(pair.priceChange?.h24||0);
  const mchg=$('m-chg');
  mchg.textContent=fmt.pct(chg);
  mchg.style.color=chg>=0?'var(--green)':'var(--red)';
  $('m-mcap').textContent=fmt.large(pair.marketCap);
  $('m-vol').textContent=fmt.large(pair.volume?.h24);
  $('m-liq').textContent=fmt.large(pair.liquidity?.usd);
  const addr=pair.baseToken?.address||pair.pairAddress||'';
  $('m-contract').textContent=addr?fmt.addr(addr):'—';
  $('m-contract').title=addr;
  // Chart
  const chartSrc=`https://dexscreener.com/solana/${pair.pairAddress}?embed=1&theme=light&info=0&trades=0`;
  $('m-chart').src=chartSrc;
  // Links
  const links=[];
  if(pair.info?.websites?.[0]) links.push({icon:'🌐',label:'Site',url:pair.info.websites[0].url});
  (pair.info?.socials||[]).forEach(s=>{
    if(s.type==='twitter') links.push({icon:'𝕏',label:'Twitter',url:s.url});
    if(s.type==='telegram') links.push({icon:'✈',label:'Telegram',url:s.url});
  });
  $('m-links').innerHTML=links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener" class="link-chip">${l.icon} ${l.label}</a>`).join('');
  $('token-modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  $('token-modal').classList.remove('open');
  document.body.style.overflow='';
  setTimeout(()=>{ $('m-chart').src=''; },400);
}
$('modal-close').addEventListener('click', closeModal);
$('modal-bg').addEventListener('click', closeModal);
$('modal-swap-btn').addEventListener('click',()=>{ closeModal(); openSwap(); });
$('copy-btn').addEventListener('click',()=>{
  const addr=currentPair?.baseToken?.address||currentPair?.pairAddress||'';
  if(!addr)return;
  navigator.clipboard?.writeText(addr)
    .then(()=>toast('Endereço copiado!','success'))
    .catch(()=>{ try{
      const ta=document.createElement('textarea');
      ta.value=addr; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      toast('Copiado!','success');
    }catch(e){} });
});

// ── SWAP ──
async function openSwap(){
  const mint = currentPair?.baseToken?.address || 'EPjFWdd5AufqSSqeM2qg'; // USDC
  try {
    const r = await fetch('api/swap', {
      method: 'POST', 
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ outputMint: mint })
    });
    const d = await r.json();
    if(d.url) window.open(d.url, '_blank');
    else toast('Erro no swap','error');
  } catch(e) { toast('Servidor offline','error') }
}

// ── NEWS ──
async function loadNews(){
  try {
    const r = await fetch('api/news');
    const items = await r.json();
    $('news-grid').innerHTML=items.map((n,i)=>`
      <div class="news-card" style="animation:fadeUp .38s ease ${i*55}ms both" onclick="window.open('${n.url}','_blank')">
        <div class="news-thumb">${n.e}</div>
        <div class="news-content">
          <div class="news-src">${n.src}</div>
          <div class="news-ttl">${n.t}</div>
          <div class="news-foot">
            <span>${n.time}</span>
            <span class="news-read">Ler <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { toast('Erro ao carregar notícias','error'); }
}

// ── AIRDROPS ──
async function loadAirdrops(){
  try {
    const r = await fetch('api/airdrops');
    const items = await r.json();
    $('airdrops-content').innerHTML=items.map((a,i)=>`
      <div class="content-card" style="animation:fadeUp .38s ease ${i*60}ms both" onclick="window.open('${a.url}','_blank')">
        <div class="cc-icon-wrap">${a.i}</div>
        <div class="cc-title">${a.t}</div>
        <div class="cc-desc">${a.d}</div>
        <span class="cc-cta">${a.btn} →</span>
      </div>`).join('');
  } catch(e) { toast('Erro ao carregar airdrops','error'); }
}

// ── ALPHA ──
async function loadAlpha(){
  try {
    const r = await fetch('api/alpha');
    const items = await r.json();
    $('alpha-content').innerHTML=items.map((a,i)=>`
      <div class="alpha-item" style="animation:fadeUp .38s ease ${i*55}ms both">
        <div class="alpha-tag">${a.tag}</div>
        <div class="alpha-text">${a.text}</div>
        <div class="alpha-time">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${a.time}
        </div>
      </div>`).join('');
  } catch(e) { toast('Erro ao carregar alpha','error'); }
}

// ── PARTNERS ──
async function loadPartners(){
  try {
    const r = await fetch('api/partners');
    const items = await r.json();
    $('partners-grid').innerHTML=items.map((p,i)=>`
      <div class="partner-card" style="animation:fadeUp .38s ease ${i*55}ms both" onclick="window.open('${p.u}','_blank')">
        <div class="pc-icon-wrap">${p.i}</div>
        <div class="pc-name">${p.n}</div>
        <div class="pc-desc">${p.d}</div>
        <span class="pc-tag">${p.t}</span>
      </div>`).join('');
  } catch(e) { toast('Erro ao carregar parceiros','error'); }
}

// ── ESC & keyboard ──
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeModal(); closeDrawer(); }
});

// ── AUTO REFRESH ──
setInterval(()=>{
  cache.set('coins2',null,0);
  loadCoins();
},60000);

// ── INIT ──
async function init() {
    console.log("Iniciando app...");
    try {
        const r = await fetch('api/config');
        if (!r.ok) throw new Error('Falha ao carregar config');
        CONFIG = await r.json();
        console.log("Config carregada", CONFIG);
        
        loadCoins();
        
        // Init Jupiter Terminal
        const jupScript = document.createElement('script');
        jupScript.src = 'https://terminal.jup.ag/main-v3.js';
        jupScript.onload = () => {
            window.Jupiter.init({
                displayMode: "integrated",
                integratedTargetId: "jupiter-terminal",
                endpoint: "https://api.mainnet-beta.solana.com",
                platformFeeAndAccounts: {
                    feeBps: 50,
                    feeAccounts: {
                        "So11111111111111112": CONFIG.wallet,
                        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": CONFIG.wallet
                    }
                },
                formProps: {
                    initialInputMint: "So11111111111111112",
                    initialOutputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                }
            });
        };
        document.head.appendChild(jupScript);
    } catch(e) {
        toast('Erro de conexão com o servidor','error');
    }
}

init();

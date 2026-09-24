/* Contrast scan for the FloofMart app.
 * Usage: node contrast-scan.js <demo-copy.html> <screenshot-dir> [dark]
 * Opens 25 screens and sheets in a 390x844 viewport, screenshots each one, and lists
 * every visible piece of text below WCAG AA (4.5:1, or 3:1 for large/bold text).
 * Needs playwright-core and a Chromium; set CHROMIUM_PATH if it isn't /opt/pw-browsers/chromium.
 * Known false alarms: the struck-through "was" price (inside the deliberate gradient
 * shimmer), emoji icons (🔍 🃏 📄) whose colours the scan cannot read, and the 🐑 that
 * replaces the logo when a demo copy is opened outside the repo folder. */
const { chromium } = require('playwright-core'); const fs=require('fs');
const file=process.argv[2], out=process.argv[3], dark=process.argv[4]==='dark'; fs.mkdirSync(out,{recursive:true});
const SCAN=`(()=>{const L=c=>{const m=c.match(/[\\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
 const solid=c=>{const m=c.match(/[\\d.]+/g);return m&&(m.length<4||Number(m[3])>=.9)};
 const bgOf=el=>{while(el){const s=getComputedStyle(el); const gi=s.backgroundImage; if(gi&&gi!=='none'&&/gradient/.test(gi)){const m=gi.match(/rgba?\\([^)]*\\)/g); if(m) return m[m.length-1];} if(solid(s.backgroundColor)) return s.backgroundColor; el=el.parentElement;} return getComputedStyle(document.body).backgroundColor};
 const out=[]; document.querySelectorAll('body *').forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width||!r.height||r.bottom<0||r.top>innerHeight) return;
   const s=getComputedStyle(el); if(s.visibility==='hidden'||+s.opacity<0.5) return; let p=el,op=1; while(p){op*=+getComputedStyle(p).opacity; p=p.parentElement;} if(op<0.9) return;
   const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!hasText) return; if(s.webkitTextFillColor==='rgba(0, 0, 0, 0)') return;
   const top=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2))); if(top&&!el.contains(top)&&!top.contains(el)) return;
   const a=L(s.color),b=L(bgOf(el)); const cr=(Math.max(a,b)+.05)/(Math.min(a,b)+.05); const big=parseFloat(s.fontSize)>=18.6||(parseFloat(s.fontSize)>=14&&+s.fontWeight>=700);
   if(cr<(big?3:4.5)) out.push((el.className||el.tagName)+' | '+cr.toFixed(2)+' | '+el.textContent.trim().replace(/\\s+/g,' ').slice(0,34)); });
 return out;})()`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium' });
  const html=fs.readFileSync(file,'utf8');
  const p = await b.newPage({ viewport:{width:390,height:844}, colorScheme: dark?'dark':'light' });
  p.on('pageerror', e => console.log('ERR', e.message.slice(0,160)));
  await p.setContent(html,{waitUntil:'load'}); await p.waitForTimeout(2500);
  const closeAll=`(()=>{['closeCardView','closeCart','closeInvoice','closeWishlist','closeAddrEdit','closeFilters','closeOffer','closeSort','closeShipAddr','closeGuide','closeZoom'].forEach(f=>{try{window[f]&&window[f]()}catch(e){}}); document.querySelectorAll('.sheet.show,.scrim.show,.cv-scrim.show,.cardview.show').forEach(x=>x.classList.remove('show'));})()`;
  const S=[['01-home',''],['02-store',"go('store')"],['03-cardview',"openCardView(STATE.inventory[0].id)"],
    ['04-cart',"addToCart(STATE.inventory[0].id);addToCart(STATE.inventory[1].id);openCart()"],['05-checkout','checkout()'],['05b-checkout-scrolled',"document.querySelector('#invBody').scrollTop=600"],
    ['06-orders',"go('orders')"],['06b-orders-scrolled',"scrollTo(0,500)"],['07-history','openHistory()'],['07b-invoice',"(document.querySelector('#cardViewBody [onclick*=EF9ZT4]')||document.querySelector('#cardViewBody .hrow')||{click(){}}).click()"],
    ['08-binder',"go('orders');(document.querySelector('[onclick*=binder]')||{click(){}}).click()"],['09-buyback',"go('buyback')"],['10-profile',"go('profile')"],['11-settings',"go('settings')"],
    ['12-credit','loadCredit()'],['13-support',"go('support')"],['14-wishlist','openWishlist()'],['15-address','openAddrEdit()'],['16-shipaddr','openShipAddr&&openShipAddr()'],
    ['17-filters',"go('store');openFilters()"],['18-sort','openSort()'],['19-offer',"makeOfferById(STATE.inventory[2].id)"],['20-guide',"openGuide('start')"],['21-empty-search',"go('store');document.getElementById('q').value='zzzz';renderStore()"],
    ['22-empty-cart',"STATE.cart=[];updateCartDot();openCart()"]];
  const all={};
  for (const [n,js] of S){ try{ if(!/scrolled|07b|05b/.test(n)) await p.evaluate(closeAll); await p.evaluate(js); }catch(e){ console.log(n,'fail',e.message.slice(0,90)); }
    await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${n}.png` }); const bad=await p.evaluate(SCAN); bad.forEach(x=>{ const k=x.split(' | ')[0]+' | '+x.split(' | ')[2]; all[k]=all[k]||[x.split(' | ')[1],[]]; all[k][1].push(n.slice(0,2)); }); }
  console.log(Object.keys(all).length+' low-contrast text items'); Object.entries(all).slice(0,60).forEach(([k,v])=>console.log(v[0].padStart(5),k,'@',v[1].join(',')));
  await b.close();
})();

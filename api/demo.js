// Демо-страница агента-разведчика.
// GET  -> HTML-страница с кнопкой запуска.
// POST -> запускает 3 парсера, возвращает статистику и эффект.
const BASE = "https://ai-parser-sandy.vercel.app";
const ENDPOINTS = ["/api/parser", "/api/parser2", "/api/parser3"];
const MANUAL_MINUTES = 50; // сколько заняло бы вручную за один проход

async function runOne(path){
  try{
    const r = await fetch(BASE + path);
    const j = await r.json();
    return j.result || { added:0, skipped:0, feedsDone:[] };
  }catch(e){
    return { added:0, skipped:0, feedsDone:[], error:String(e) };
  }
}

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const t0 = Date.now();
    const results = await Promise.all(ENDPOINTS.map(runOne));
    const seconds = Math.max(1, Math.round((Date.now() - t0) / 1000));
    let added = 0, skipped = 0, excluded = 0;
    const feeds = [];
    for (const r of results){
      added += (r.added || 0);
      skipped += (r.skipped || 0);
      excluded += (r.excluded || 0);
      (r.feedsDone || []).forEach(f => feeds.push(f));
    }
    const scanned = added + skipped + excluded;
    return res.status(200).json({ added, skipped, excluded, scanned, seconds, feeds, manualMinutes: MANUAL_MINUTES });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(PAGE);
};

const PAGE = `<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Агент-разведчик</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0d1117; --panel:#151b24; --line:#232c39; --ink:#e6edf3;
    --dim:#7d8895; --accent:#4ade80; --accent2:#38bdf8; --warn:#f5a524;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font-family:'Space Grotesk',sans-serif;
    min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .wrap{width:100%;max-width:720px}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.22em;
    text-transform:uppercase;color:var(--dim);margin-bottom:14px}
  h1{font-size:clamp(30px,6vw,50px);font-weight:700;line-height:1.02;letter-spacing:-.02em;margin-bottom:12px}
  h1 span{color:var(--accent)}
  .lede{color:var(--dim);font-size:16px;max-width:52ch;margin-bottom:30px;line-height:1.5}
  .panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:26px}
  .go{width:100%;border:0;border-radius:11px;padding:18px;cursor:pointer;
    background:var(--accent);color:#04140a;font-family:'Space Grotesk',sans-serif;
    font-size:18px;font-weight:700;letter-spacing:-.01em;transition:transform .12s,opacity .2s}
  .go:hover{transform:translateY(-1px)}
  .go:disabled{opacity:.55;cursor:progress;transform:none}
  .feeds{list-style:none;margin:22px 0 0;display:grid;gap:9px}
  .feeds li{display:flex;align-items:center;gap:12px;font-family:'IBM Plex Mono',monospace;
    font-size:13px;color:var(--dim);opacity:.35;transition:opacity .3s,color .3s}
  .feeds li.on{opacity:1;color:var(--ink)}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--line);flex:none;transition:background .3s}
  .feeds li.on .dot{background:var(--accent2);box-shadow:0 0 10px var(--accent2)}
  .feeds li.done .dot{background:var(--accent);box-shadow:0 0 10px var(--accent)}
  .result{margin-top:24px;border-top:1px solid var(--line);padding-top:24px;display:none}
  .result.show{display:block;animation:fade .5s ease}
  @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .big{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
  .num{font-size:clamp(48px,12vw,86px);font-weight:700;line-height:1;color:var(--accent);letter-spacing:-.03em}
  .num-label{font-size:15px;color:var(--dim);max-width:22ch;line-height:1.35}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);
    border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-top:22px}
  .stat{background:var(--panel);padding:16px 14px}
  .stat b{display:block;font-size:26px;font-weight:700;letter-spacing:-.02em}
  .stat span{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;
    text-transform:uppercase;color:var(--dim)}
  .foot{margin-top:18px;font-size:13px;color:var(--dim);line-height:1.5}
  .foot b{color:var(--ink);font-weight:500}
</style></head>
<body><div class="wrap">
  <div class="eyebrow">StudyWorld · агент affiliate-разведки</div>
  <h1>Агент-разведчик<br><span>ищет авторов, пока вы заняты</span></h1>
  <p class="lede">Каждый день обходит 8 площадок про нейросети, отсеивает нерелевантное, конкурентов и повторы — и складывает новых авторов в таблицу. Нажмите кнопку: он сделает это прямо сейчас.</p>
  <div class="panel">
    <button class="go" id="go">Собрать статьи сейчас</button>
    <ul class="feeds" id="feeds">
      <li data-k="habr"><span class="dot"></span>Habr</li>
      <li data-k="dtf"><span class="dot"></span>DTF</li>
      <li data-k="tproger"><span class="dot"></span>Tproger</li>
      <li data-k="vc"><span class="dot"></span>VC.ru</li>
      <li data-k="klerk"><span class="dot"></span>Клерк</li>
      <li data-k="sostav"><span class="dot"></span>Sostav</li>
      <li data-k="lifehacker"><span class="dot"></span>Lifehacker</li>
      <li data-k="adpass"><span class="dot"></span>AdPass</li>
    </ul>
    <div class="result" id="result">
      <div class="big">
        <div class="num" id="minutes">0</div>
        <div class="num-label">минут ручной работы агент забрал за этот проход</div>
      </div>
      <div class="stats">
        <div class="stat"><b id="s-added">0</b><span>новых авторов</span></div>
        <div class="stat"><b id="s-scanned">0</b><span>статей просмотрено</span></div>
        <div class="stat"><b id="s-sec">0с</b><span>время агента</span></div>
      </div>
      <p class="foot" id="foot"></p>
    </div>
  </div>
</div>
<script>
const btn=document.getElementById('go');
const feeds=[...document.querySelectorAll('#feeds li')];
const result=document.getElementById('result');
function reset(){feeds.forEach(f=>f.classList.remove('on','done'));result.classList.remove('show');}
function light(){ // последовательно "зажигаем" площадки, пока идёт запрос
  let i=0;
  const iv=setInterval(()=>{
    if(i>0)feeds[i-1]&&feeds[i-1].classList.add('done');
    if(i<feeds.length){feeds[i].classList.add('on');i++;}
    else clearInterval(iv);
  },700);
  return ()=>{clearInterval(iv);feeds.forEach(f=>f.classList.add('done'));};
}
function animateNum(el,to,dur){
  const t0=performance.now();
  (function step(t){const p=Math.min(1,(t-t0)/dur);el.textContent=Math.round(to*p);
    if(p<1)requestAnimationFrame(step);})(t0);
}
btn.onclick=async()=>{
  btn.disabled=true;btn.textContent='Агент работает…';reset();
  const stop=light();
  try{
    const r=await fetch(location.pathname,{method:'POST'});
    const d=await r.json();
    stop();
    const savedMin=d.manualMinutes||45;
    document.getElementById('s-added').textContent=d.added;
    document.getElementById('s-scanned').textContent=d.scanned;
    document.getElementById('s-sec').textContent=d.seconds+'с';
    document.getElementById('foot').innerHTML=
      'Вручную такой обход 8 площадок с отсевом занимает <b>~'+savedMin+' минут</b>. '+
      'Агент справился за <b>'+d.seconds+' секунд</b> и добавил <b>'+d.added+'</b> новых авторов в общую таблицу — без дублей и конкурентов.';
    result.classList.add('show');
    animateNum(document.getElementById('minutes'),savedMin,900);
  }catch(e){
    stop();
    document.getElementById('foot').textContent='Не удалось связаться с агентом: '+e;
    result.classList.add('show');
  }
  btn.disabled=false;btn.textContent='Собрать статьи сейчас';
};
</script>
</body></html>`;

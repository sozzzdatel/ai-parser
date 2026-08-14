const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec";

// Группа 2 (тяжёлые ленты). Отдельный endpoint, чтобы не тормозить первый.
const RSS_FEEDS = [
  "https://vc.ru/rss/all",
  "https://lifehacker.ru/feed",
  "https://www.klerk.ru/export/articles.rss"
];

const MAX_PER_FEED = 10;

const KEYWORDS = ["нейросет","нейронн","нейронка","chatgpt","gpt","claude","gemini","midjourney","flux","генерация изображен","генерация видео","sora","kling","veo","runway","seedance","промт","промпт","deepseek","grok","nano banana","нано банан","stable diffusion","suno","elevenlabs","heygen","генеративн","искусственн интеллект","искусственного интеллект","машинное обучен","machine learning","deep learning","llm","языкова модель","языковая модель","copilot","cursor","ollama","llama","mistral","qwen","perplexity","распознавание речи","компьютерное зрение","датасет","обучение модел","gpt-","ии-","ии для","нлп","чат-бот","чатбот","ассистент","разработ","программирован","python","javascript","typescript","react","backend","frontend","devops","фреймворк","база данных","алгоритм","open source","опенсорс","автоматизац","edtech","онлайн-курс","онлайн-образован","обучение нейросет","vibe coding","вайб-кодинг"];

const EXCLUDE = ["edugram","study24","studyai","kampus","avtor24","mystylus","studybay","редакция","editorial"];

function matchesKeyword(text){ const t=(text||"").toLowerCase(); return KEYWORDS.some(k=>t.includes(k)); }
function isExcluded(text){ const t=(text||"").toLowerCase(); return EXCLUDE.some(e=>t.includes(e)); }

function parseItems(xml){
  const items=[];
  const chunks=xml.split(/<item[\s>]/i).slice(1);
  for(const chunk of chunks){
    const body=chunk.split(/<\/item>/i)[0];
    const pick=(tag)=>{
      const re=new RegExp("<"+tag+"[^>]*>([\\s\\S]*?)<\\/"+tag+">","i");
      const m=body.match(re);
      if(!m) return "";
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g,"").trim();
    };
    items.push({ title:pick("title"), link:pick("link"), description:pick("description"), author:pick("dc:creator")||pick("author") });
  }
  return items;
}

async function fetchWithTimeout(url, ms){
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(), ms);
  try{
    const r=await fetch(url,{ signal:c.signal, headers:{"User-Agent":"Mozilla/5.0 (compatible; RSSReader/1.0)"} });
    return await r.text();
  } finally { clearTimeout(t); }
}

async function sendToSheets(a){
  try{
    await fetch(WEBHOOK_URL,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url:a.link, contact:a.author||"", niche:"нейросети", reach:"", status:"новая", comment:a.title }) });
    return true;
  }catch(e){ return false; }
}

async function runParser(){
  let added=0, skipped=0, excluded=0, noauthor=0;
  const feedsDone=[];
  for(const feedUrl of RSS_FEEDS){
    let xml;
    try{ xml=await fetchWithTimeout(feedUrl, 3500); }
    catch(e){ feedsDone.push(feedUrl+" => ERR"); continue; }
    let items=parseItems(xml);
    const total=items.length;
    items=items.slice(0, MAX_PER_FEED);
    feedsDone.push(feedUrl+" => "+total);
    for(const item of items){
      const hay=item.title+" "+item.description+" "+item.author;
      if(!matchesKeyword(hay)){ skipped++; continue; }
      if(isExcluded(hay)){ excluded++; continue; }
      if(!item.author){ noauthor++; continue; }
      if(await sendToSheets(item)) added++;
    }
  }
  return { added, skipped, excluded, noauthor, feedsDone };
}

module.exports=async(req,res)=>{
  try{
    const result=await runParser();
    res.status(200).json({ success:true, message:"Добавлено авторов: "+result.added, result });
  }catch(error){
    res.status(500).json({ success:false, error:error.message });
  }
};

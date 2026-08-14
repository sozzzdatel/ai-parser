const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec";

const RSS_FEEDS = [
  "https://vc.ru/rss/all",
  "https://habr.com/ru/rss/articles/?fl=ru"
];

const KEYWORDS = ["нейросет","нейронн","chatgpt","gpt","claude","gemini","midjourney","flux","генерация изображен","генерация видео","sora","kling","veo","runway","seedance","промт","промпт","ии для","ai для","deepseek","grok","nano banana","нано банан","stable diffusion","suno","elevenlabs","heygen","генеративн","искусственн интеллект","искусственного интеллект"];

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

async function sendToSheets(a){
  try{
    await fetch(WEBHOOK_URL,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url:a.link, contact:a.author||"", niche:"нейросети", reach:"", status:"новая", comment:a.title }) });
    return true;
  }catch(e){ return false; }
}

async function runParser(){
  let added=0, skipped=0, excluded=0, noauthor=0;
  for(const feedUrl of RSS_FEEDS){
    let xml;
    try{
      const resp=await fetch(feedUrl,{ headers:{"User-Agent":"Mozilla/5.0 (compatible; RSSReader/1.0)"} });
      xml=await resp.text();
    }catch(e){ continue; }
    const items=parseItems(xml);
    for(const item of items){
      const hay=item.title+" "+item.description+" "+item.author;
      if(!matchesKeyword(hay)){ skipped++; continue; }
      if(isExcluded(hay)){ excluded++; continue; }
      if(!item.author){ noauthor++; continue; }
      if(await sendToSheets(item)) added++;
      await new Promise(r=>setTimeout(r,300));
    }
  }
  return { added, skipped, excluded, noauthor };
}

module.exports=async(req,res)=>{
  try{
    const result=await runParser();
    res.status(200).json({ success:true, message:"Добавлено авторов: "+result.added+" | не по теме: "+result.skipped+" | конкурентов исключено: "+result.excluded+" | без автора пропущено: "+result.noauthor, result });
  }catch(error){
    res.status(500).json({ success:false, error:error.message });
  }
};

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec";

const KEYWORDS = [
  "генерация видео AI 2026",
  "ChatGPT обзор 2026",
  "Midjourney альтернатива",
  "нейросети для видео",
  "Claude Opus использование"
];

const OFFICIAL_PATTERNS = [
  'editor@', 'editorial@', 'team@', 'official@', 'info@', 'support@',
  '@vc.ru', '@habr.com', '@sostav.ru', '@dzen.ru'
];

function isOfficial(contact) {
  if (!contact) return true;
  const lower = contact.toLowerCase();
  return OFFICIAL_PATTERNS.some(pattern => lower.includes(pattern));
}

async function searchGoogle(keyword) {
  try {
    const searchQuery = encodeURIComponent(keyword);
    const url = `https://www.google.com/search?q=${searchQuery}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const urlRegex = /href="([^"]*(?:vc\.ru|habr\.com|dzen\.ru)[^"]*)"/g;
    const links = [];
    let match;
    
    while ((match = urlRegex.exec(html)) && links.length < 2) {
      const url = match[1];
      if (!url.includes('webcache')) {
        links.push(url);
      }
    }
    
    return links;
  } catch (error) {
    console.error(`Ошибка поиска для "${keyword}":`, error.message);
    return [];
  }
}

async function analyzeWithClaude(url, title) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `URL: ${url}\nЗаголовок: ${title}\n\nИзвлеки автора и контакт. Ответь ТОЛЬКО JSON: {"author":"...","contact":"..."}`
        }]
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.content && data.content[0]) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[^}]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('Ошибка Claude:', error.message);
  }
  
  return null;
}

async function sendToSheets(data) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: data.url,
        contact: data.contact || '',
        niche: 'нейросети',
        reach: '100k+',
        status: 'собрана',
        comment: data.title
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Ошибка Sheets:', error.message);
    return false;
  }
}

async function runParser() {
  console.log('🚀 ЗАПУСК ПАРСЕРА');
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const keyword of KEYWORDS) {
    console.log(`🔍 Ищу: "${keyword}"`);
    const urls = await searchGoogle(keyword);
    
    for (const url of urls) {
      const title = url.split('/').pop();
      const analysis = await analyzeWithClaude(url, title);

      if (!analysis || !analysis.contact || isOfficial(analysis.contact)) {
        console.log(`⚠️ Пропущен: ${analysis?.contact || 'нет контакта'}`);
        totalSkipped++;
        continue;
      }

      const sent = await sendToSheets({ url, title, ...analysis });
      if (sent) {
        console.log(`✅ Добавлено: ${analysis.author}`);
        totalAdded++;
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`✨ ЗАВЕРШЕНО! Добавлено: ${totalAdded}, Пропущено: ${totalSkipped}`);
  return { totalAdded, totalSkipped };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await runParser();
    res.status(200).json({ success: true, message: 'Парсинг завершён', result });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

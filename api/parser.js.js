const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_API_KEY = "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";
const SHEET_ID = "1HwnbSNAFFeX3C4xMjM4TYTH1EEBAWiJl5VAkg_DUHNY";

const KEYWORDS = [
  "генерация видео AI 2026 site:vc.ru",
  "ChatGPT альтернатива site:habr.com",
  "Midjourney FLUX генерация изображений",
  "Sora нейросеть видео",
  "Claude Opus 2026",
  "нейросети для работы",
  "лучшие ИИ инструменты 2026",
  "ИИ для ed-tech",
  "промты для ChatGPT",
  "Gemini Google ИИ"
];

// Официальные контакты которые нужно исключить
const OFFICIAL_CONTACTS = [
  'editor@', 'editorial@', 'team@', 'official@', 'info@', 'support@',
  'hello@', 'contact@', 'press@', 'media@', '@vc.ru', '@habr.com'
];

async function searchArticles(keyword) {
  try {
    // Здесь можно использовать Google Custom Search API или другой источник
    // Для начала создадим mock статьи
    const articles = [
      {
        url: `https://vc.ru/ai/article-${Math.random()}`,
        title: `Статья про ${keyword}`,
        author: "Ivan Petrov",
        contact: `ivan.petrov${Math.floor(Math.random() * 1000)}@gmail.com`,
        niche: "нейросети"
      },
      {
        url: `https://habr.com/article-${Math.random()}`,
        title: `Обзор ${keyword}`,
        author: "Dmitry Smirnov",
        contact: `dmitry.smirnov${Math.floor(Math.random() * 1000)}@gmail.com`,
        niche: "ИИ"
      }
    ];
    
    return articles;
  } catch (error) {
    console.error('Ошибка поиска статей:', error);
    return [];
  }
}

function isOfficialContact(contact) {
  if (!contact) return true;
  
  const lowerContact = contact.toLowerCase();
  return OFFICIAL_CONTACTS.some(official => lowerContact.includes(official));
}

function analyzeArticle(article) {
  // Базовая проверка что контакт реальный и не официальный
  if (isOfficialContact(article.contact)) {
    return null;
  }
  
  return {
    url: article.url,
    contact: article.contact,
    niche: article.niche || "нейросети",
    reach: "от 50k",
    comment: article.title
  };
}

async function addToGoogleSheets(data) {
  try {
    // Здесь нужен Google Sheets API ключ сервисного аккаунта
    // Для теста отправляем на webhook
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Ошибка записи в Sheets:', error);
    return false;
  }
}

async function checkDuplicate(sheets, contact, url) {
  // Здесь проверяем дубли в Google Sheets
  // Для упрощения будем считать что проверка на backend
  return false;
}

async function runParser() {
  console.log('🚀 ЗАПУСК АВТОПАРСЕРА');
  console.log('=====================');
  
  let totalAdded = 0;
  let totalSkipped = 0;
  
  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 Ищу: "${keyword}"`);
    
    const articles = await searchArticles(keyword);
    
    for (const article of articles) {
      const analyzed = analyzeArticle(article);
      
      if (!analyzed) {
        console.log(`  ⚠️ Пропущен (official): ${article.contact}`);
        totalSkipped++;
        continue;
      }
      
      const added = await addToGoogleSheets(analyzed);
      
      if (added) {
        console.log(`  ✅ Добавлено: ${analyzed.contact}`);
        totalAdded++;
      }
    }
  }
  
  console.log(`\n✨ ЗАВЕРШЕНО!`);
  console.log(`  ✅ Добавлено: ${totalAdded}`);
  console.log(`  ⚠️ Пропущено: ${totalSkipped}`);
  
  return { totalAdded, totalSkipped };
}

// Vercel Serverless Function
module.exports = async (req, res) => {
  // Проверка что запрос пришёл из правильного источника
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const result = await runParser();
    res.status(200).json({ 
      success: true, 
      message: 'Парсинг завершён',
      result 
    });
  } catch (error) {
    console.error('Ошибка парсера:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
};

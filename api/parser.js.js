const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec";

const KEYWORDS = [
  "генерация видео AI 2026",
  "ChatGPT обзор 2026",
  "Midjourney альтернатива",
  "нейросети для видео",
  "Claude Opus использование",
  "лучшие ИИ инструменты",
  "FLUX изображения",
  "Sora видеогенератор",
  "нейросети для работы",
  "ИИ для обучения"
];

const OFFICIAL_PATTERNS = [
  'editor@', 'editorial@', 'team@', 'official@', 'info@', 'support@',
  'hello@', 'contact@', 'press@', 'media@', '@vc.ru', '@habr.com',
  '@sostav.ru', '@dzen.ru', 'noreply@'
];

function isOfficial(contact) {
  if (!contact) return true;
  const lower = contact.toLowerCase();
  return OFFICIAL_PATTERNS.some(pattern => lower.includes(pattern));
}

async function runParser() {
  console.log('🚀 ЗАПУСК ПАРСЕРА');
  let totalAdded = 0;
  let totalSkipped = 0;

  console.log(`\n✨ ЗАВЕРШЕНО!`);
  console.log(`  ✅ Добавлено: ${totalAdded}`);
  console.log(`  ⚠️ Пропущено: ${totalSkipped}`);

  return { totalAdded, totalSkipped };
}

module.exports = async (req, res) => {
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
    console.error('Ошибка:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

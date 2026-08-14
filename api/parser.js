const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx3i8FludvcS7c0v-wIdr9Q8HlcN1LoPp1Grqd7xT9qA0cal0zfQz-fSMi17JPaQ-llNA/exec";

const MOCK_ARTICLES = [
  { url: "https://vc.ru/ai/new-1", contact: "editor@example.com", niche: "видео", reach: "100k", comment: "Новая статья про видео" },
  { url: "https://habr.com/new-2", contact: "author@example.com", niche: "изображения", reach: "80k", comment: "Обзор Midjourney" },
  { url: "https://dzen.ru/new-3", contact: "creator@example.com", niche: "текст", reach: "150k", comment: "ChatGPT 5.5 обзор" }
  ];

async function sendToSheets(article) {
    try {
          await fetch(WEBHOOK_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: article.url, contact: article.contact, niche: article.niche, reach: article.reach, status: 'собрана', comment: article.comment })
          });
          return true;
    } catch (e) { return false; }
}

async function runParser() {
    let added = 0;
    for (const article of MOCK_ARTICLES) {
          if (await sendToSheets(article)) added++;
          await new Promise(r => setTimeout(r, 500));
    }
    return { added };
}

module.exports = async (req, res) => {
    try {
          const result = await runParser();
          res.status(200).json({ success: true, message: `Добавлено ${result.added} авторов`, result });
    } catch (error) {
          res.status(500).json({ success: false, error: error.message });
    }
};

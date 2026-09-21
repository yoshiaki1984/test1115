import { createApp } from './src/app.js';
import { openDb } from './src/db.js';

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? './data/fukubiki.sqlite';
const NEAR_RANGE = Number(process.env.NEAR_RANGE ?? 1);
let adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  adminPassword = 'fukubiki';
  console.warn('[warn] ADMIN_PASSWORD が未設定のため、既定の管理パスワード "fukubiki" を使用します。本番では必ず環境変数で設定してください。');
}

const repo = openDb(DB_PATH);
const app = createApp({ repo, adminPassword, nearRange: NEAR_RANGE });

const server = app.listen(PORT, () => {
  const status = repo.getStatus();
  console.log(`福引アプリ起動: http://localhost:${PORT}  (管理画面: /admin)`);
  console.log(status ? `登録済み: ${status.title} / ${status.total}件` : '当選番号は未登録です。/admin からPDFを登録するか、npm run import <pdf> を実行してください');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => {
      repo.close();
      process.exit(0);
    });
  });
}

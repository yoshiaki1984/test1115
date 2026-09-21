# 福引 当選番号チェック（スマホ最適化ウェブアプリ）

福引の当選発表PDFをDBに登録し、来場者がスマホで番号を入力すると
「焦らし演出 → 当選 / 落選」の演出付きで結果を表示するウェブアプリです。

- **来場者向け画面** `/` … 番号入力 → リール回転・激アツ演出 → 当選（賞品名表示・紙吹雪・ファンファーレ）/ 落選（ニアミス表示）
- **管理画面** `/admin` … 当選発表PDFのアップロード → 解析プレビュー → 登録。テキスト貼り付けでの登録、一覧確認、削除も可能
- **DB** … Node.js 組み込みの SQLite（`node:sqlite`）。ネイティブビルド不要

## 動作要件

- Node.js **22.13 以上**（`node:sqlite` を使用）

## セットアップ

```bash
cd fukubiki-app
npm install

# 昨年のPDF（samples/2025_tousen.pdf）を登録して起動する例
npm run import -- samples/2025_tousen.pdf --title "2025年 当選発表"
ADMIN_PASSWORD=好きなパスワード npm start
```

`http://localhost:3000` を開くと来場者向け画面、`http://localhost:3000/admin` が管理画面です。
スマホで試す場合は同じ Wi-Fi 内からサーバーのIPアドレスでアクセスしてください。

### 環境変数

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `PORT` | `3000` | 待ち受けポート |
| `ADMIN_PASSWORD` | `fukubiki`（警告付き） | 管理画面のパスワード。本番では必ず設定してください |
| `DB_PATH` | `./data/fukubiki.sqlite` | SQLite ファイルの保存先 |
| `NEAR_RANGE` | `1` | 落選時に「隣の番号は当選していた」と表示する範囲（`0` で無効） |

## 今年の当選発表PDFを登録する

1. `/admin` を開き、管理パスワードでログイン
2. 「当選発表PDFを登録」でPDFを選択し、**解析プレビュー** で件数・特賞/上位賞/一般の内訳・警告を確認
3. 問題なければ **この内容で登録**（既存リストは置き換わります。過去分は履歴として DB に残ります）

CLI からも登録できます: `npm run import -- <pdf> --title "2026年 当選発表"`（`--dry-run` で解析だけ）

### 読み取れるPDFのレイアウト

昨年の発表PDFと同じ、次の形式を前提にしています。

- 各ページが「当選番号」「品名」の2列の表
- 番号列は左端、品名列はその右（番号は上下中央、品名は上寄せのセル）
- 品名が長い場合は2行に折り返されてもよい（番号の無い行は前の品名の続きとして結合）
- 先頭に特賞・上位賞ブロック（番号順不同）、続いて一般賞ブロック（番号昇順）

賞のランクは自動判定します。

| ランク | 判定 | 演出 |
| --- | --- | --- |
| 特賞 `grand` | 品名に `【特賞】` を含む | 必ず「超激アツ」演出（虹色・長め・画面振動） |
| 上位賞 `upper` | 末尾から昇順に並ぶ区間より前のエントリ | 必ず「激アツ」演出 |
| 一般賞 `regular` | 末尾から番号が昇順に並ぶ区間 | 7割で「激アツ」演出 |
| 落選 | 該当なし | 3割で「ガセ激アツ」→落選、隣の番号が当選していれば「惜しい！」表示 |

レイアウトが変わって読み取れない場合は、管理画面の「テキストから登録」に
`番号,品名` を1行ずつ貼り付けて登録できます。

## API

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/status` | 登録状況（タイトル・件数・内訳） |
| GET | `/api/check/:number` | 照合結果 `{hit, prizes:[{prize,tier}], near:[...]}` |
| POST | `/api/admin/login` | パスワード確認（ヘッダー `x-admin-token`） |
| POST | `/api/admin/import/preview` | PDF（`Content-Type: application/pdf`）を解析のみ |
| POST | `/api/admin/import?title=` | PDF を解析して登録 |
| POST | `/api/admin/import/text` | JSON `{text, title, previewOnly}` から登録 |
| GET | `/api/admin/winners` | 登録済み一覧 |
| GET | `/api/admin/draws` | 取り込み履歴 |
| DELETE | `/api/admin/draw` | 現在の登録を削除 |

管理APIはすべて `x-admin-token: <ADMIN_PASSWORD>` ヘッダーが必要です。

## テスト

```bash
npm test
```

PDFパーサー（昨年PDFで421件・ランク判定・2行品名の結合）、DB、API（認証・登録・照合）を検証します。

## 構成

```
fukubiki-app/
├── server.js            # 起動エントリ
├── src/
│   ├── app.js           # Express アプリ（API・静的配信）
│   ├── db.js            # SQLite リポジトリ
│   ├── pdfParser.js     # 当選発表PDFの解析
│   └── textImport.js    # テキスト貼り付けからの取り込み
├── public/
│   ├── index.html / app.js / style.css   # 来場者向け画面（演出）
│   └── admin.html / admin.js             # 管理画面
├── scripts/import-pdf.js                 # CLI 取り込み
├── samples/2025_tousen.pdf               # 昨年の当選発表PDF（動作確認用）
└── test/                                 # node:test
```

## 補足

- 効果音は Web Audio で合成しています（右上のスピーカーで ON/OFF、設定は端末に保存）
- 演出中は右下の「結果を見る」でスキップできます
- 当選画面の案内文（「福引券は捨てずに…」）は `public/app.js` の `showResult` 内で変更できます
- 本番公開時は HTTPS のリバースプロキシ（nginx 等）の背後に置き、`ADMIN_PASSWORD` を必ず設定してください

## サーバー不要版（claude.ai Artifact）

`artifact/` にはサーバーを使わないシングルHTML版があります。当選リストをHTML内に埋め込み、
編集権限を持つ人がページ内の「管理者用」からPDFを読み込むと、ページ自身を再公開して全員に反映します（PDF解析はブラウザ内の pdf.js）。

```bash
npm run build:artifact -- samples/2025_tousen.pdf --title "2025年 当選発表"   # dist/fukubiki.html
```

出力した HTML を claude.ai の Artifact として公開（capability: `artifact`）すると、リンクを共有した人がスマホから利用できます。

### ID・パスワード保護

`--id` と `--pass` を付けてビルドすると、当選リストは ID＋パスワードから導出した鍵（PBKDF2 → AES-GCM）で暗号化して埋め込まれ、ページはログイン必須になります。正しい組み合わせが無いとページのソースを見ても当選データは読めません。
ページ内の管理パネルからも ID／パスワードを変更して再公開できます。`<meta name="robots" content="noindex">` を入れているため検索エンジンの索引対象になりません。

```bash
npm run build:artifact -- samples/2025_tousen.pdf --title "2026年 当選発表" --id 好きなID --pass 好きなパスワード
```

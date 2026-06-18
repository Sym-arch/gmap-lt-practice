# ConsulPass — 外資コンサル志望者向けWebテスト模試

GMAP(LT)・TG-WEB・玉手箱・SPI3 の模擬試験を提供する有料Webサービス。
Next.js（Vercel）＋ Supabase（認証・購入記録）＋ Stripe（決済）で構成。

## 販売モデル

- **無料体験**：各試験タイプの「模試 第1回」の最初の2問（高難度選抜問題）
- **全試験パック**：¥1,999（税込）買い切りで全試験・全回が解放
- 問題データはサーバー側で保護されており、無料分以外はブラウザに送信されない

## 収録状況

| 試験 | 状態 |
|------|------|
| GMAP(LT) | 全10回（300問）収録済み |
| TG-WEB | 第1回に体験2問を先行収録。残りを順次執筆中 |
| 玉手箱 | 同上 |
| SPI3 | 同上 |

## ローカル開発

```
npm install
npm run dev   # http://localhost:3000
```

環境変数なしでも起動でき、その場合は「全員が未ログインの無料ユーザー」として動作します。

## 本番セットアップ（3ステップ）

### 1. Supabase（無料枠でOK）

1. https://supabase.com でプロジェクト作成
2. SQL Editor で `supabase/schema.sql` の内容を実行（purchasesテーブル作成）
3. Project Settings → API から以下を控える
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（**秘密。クライアントに出さない**）
4. Authentication → Providers → Email を有効化
   - 「Confirm email」をONにすると登録時にメール確認が入る（推奨）

### 2. Stripe

1. https://stripe.com でアカウント作成（本人確認完了後に本番決済可）
2. 開発者 → APIキー → `STRIPE_SECRET_KEY` を控える
3. 開発者 → Webhook → エンドポイント追加
   - URL: `https://<本番ドメイン>/api/stripe-webhook`
   - イベント: `checkout.session.completed`
   - 発行された署名シークレットを `STRIPE_WEBHOOK_SECRET` に
   - ※Webhookは保険。決済完了ページでも購入は即時反映される

### 3. Vercel

1. プロジェクトの Settings → Environment Variables に `.env.example` の全変数を設定
2. Framework Preset は `vercel.json` により自動で Next.js になる
3. push すれば自動デプロイ

### 運営者アカウント

`PREMIUM_EMAILS` に自分のメールアドレスを設定すると、そのアカウントは購入なしで全問アクセスできます（動作確認・自分の学習用）。

## 問題データの追加・編集

問題は `lib/exams/<試験ID>/testNN.js` にあります。

```js
const test = {
  id: 1,                      // 第N回
  title: "模擬テスト 第1回",
  partial: true,              // 一部のみ収録の場合（全問揃ったら削除）
  questions: [
    {
      category: "keisu",      // lib/examMeta.js のカテゴリキー
      q: "問題文",
      table: { head: [...], rows: [[...]] },  // 表が必要な場合のみ
      choices: ["ア", "イ", "ウ", "エ"],       // 4択
      answer: 0,              // 正解のindex（0〜3）
      exp: "解説",
    },
  ],
};
export default test;
```

新しい回を追加したら `lib/examData.js` に import を1行足し、
試験の `availableTests`（`lib/examMeta.js`）を増やしてください。

## アーキテクチャ

```
app/
  page.js                    ランディングページ
  exams/[examId]/            試験トップ（模試一覧・復習モード）
  exams/[examId]/tests/[n]/  受験画面
  exams/[examId]/review/     復習モード
  login/ upgrade/            認証・購入ページ
  api/questions/             問題配信API（無料/有料ゲートの本体）
  api/checkout/              Stripe Checkoutセッション作成
  api/stripe-webhook/        決済完了Webhook
  api/me/                    ログイン・購入状態
lib/
  examMeta.js                試験メタ情報（クライアント公開可）
  examData.js                問題データ集約（サーバー専用）
  exams/<examId>/testNN.js   問題データ本体
supabase/schema.sql          DBスキーマ（purchasesテーブル）
```

成績・復習リストは現状ブラウザのlocalStorageに保存されます（端末ごと）。

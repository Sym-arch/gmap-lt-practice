# GMAP（LT）模擬テスト

GMAP（LT）クリティカルシンキング対策の模擬テストアプリです。
ビルド不要の静的サイト（HTML / CSS / JavaScript のみ）で、PWA としてオフラインでも動作します。

## 収録内容

- 模擬テスト **全10回**（各30問 = 6カテゴリ × 5問）
- カテゴリ構成（各テスト共通）
  1. 論理構造の把握（主張・根拠・前提・ピラミッド構造）
  2. 推論・論証の評価（対偶・必要十分条件・因果と相関・誤謬）
  3. 数的推論（割合・平均・損益分岐点・期待値など）
  4. 図表・データ解釈（表の読み取り・比率・増加率）
  5. 条件整理・推論（順序・対応関係・うそつき・集合）
  6. 問題解決・意思決定（MECE・仮説思考・原因分析）

## 機能

- 1問ごとに正誤判定＋解説を表示
- 結果画面でカテゴリ別の正答率を表示
- **復習モード**：間違えた問題を自動で蓄積し、まとめて解き直し可能（正解すると一覧から消える）
- 成績履歴（ベストスコア・受験回数）を端末内（localStorage）に保存
- **オフライン対応**（Service Worker。初回アクセス後はネット接続なしで利用可）
- スマホ・PC 両対応、ホーム画面に追加してアプリのように使用可能

## ローカルでの確認方法

Service Worker を使うため、簡易サーバーで開くのがおすすめです。

```sh
# Python がある場合
python -m http.server 8000
# → http://localhost:8000 を開く
```

※ `index.html` をダブルクリック（file://）でも問題演習自体は動きますが、オフラインキャッシュは無効になります。

## GitHub への登録

```sh
git init
git add .
git commit -m "GMAP(LT) 模擬テストアプリ"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/gmap-lt-practice.git
git push -u origin main
```

## Vercel へのデプロイ

1. [vercel.com](https://vercel.com) に GitHub アカウントでログイン
2. **Add New → Project** で上記リポジトリを Import
3. Framework Preset は **Other**（ビルド設定はすべて空のままで OK）
4. **Deploy** を押すだけで完了

以後、GitHub に push するたびに自動で再デプロイされます。

## 問題データの編集

問題は `data/test01.js` 〜 `data/test10.js` にあります。1問の形式：

```js
{
  category: "quantitative",   // structure / reasoning / quantitative / data / puzzle / problem
  q: "問題文",
  table: { head: ["列1", "列2"], rows: [["A", 100]] },  // 任意（表が必要な問題のみ）
  choices: ["選択肢ア", "イ", "ウ", "エ"],
  answer: 1,                  // 正解のインデックス（0〜3）
  exp: "解説",
}
```

問題を変更したら `sw.js` の `CACHE_NAME` のバージョン（例: `gmap-lt-v1` → `v2`）を上げると、利用者側のキャッシュが確実に更新されます。

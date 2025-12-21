# 🌸 Haru SMI – Prototype / v0.9

**Haru SMI** は更年期世代の女性に向けた  
「日々のコンディション記録 × AIアドバイス × コミュニティ」アプリです。

本リポジトリは **20名規模のユーザーテスト用プロトタイプ**として構築されています。

---

## 📌 主な機能

### 1. 📝 ディリーチェック（SMIスコア形式）
- 体調・気分・疲労・出血などの会話形式記録（カレンダーから遷移）
- 生理日のトラッキング（カレンダーから遷移）
- 気温・気圧取得（Open-Meteo APIにて自動取得）
- 体調と気象データを用いた当日のアドバイス表示（現在はタグにて表示）
- 将来は蓄積したデータを利用、統合して見える化し、パーソナライズ表示

### 2. 🍳 レシピ提案（現在はダミー表示）
- 将来は **Gemini API** を用いて体調に合わせたレシピを生成
- 現状は安全モードのため **固定メッセージ + 日付ごとに localStorage 保存**

### 3. 💬 コミュニティ（開発中）
- 運営側が用意したテーマへの投稿
- 日記投稿（公開 / 非公開）
- コメント機能
- いいね機能
- localStorageベースで動作（将来は Firebase or Supabase への移行を検討）

---

## 🛠 技術スタック

| 種類 | 使用技術 |
|------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State/Logic | React Hooks / Custom Logic |
| Build | Vite |
| DB（現状） | localStorage（開発中のため簡易構成） |
  ※以下検討中につき変更予定あり
| Hosting（予定） | Firebase Hosting |
| Backend（計画） | Firebase Functions or Supabase API |

---

## 📂 ディレクトリ構造（概要）
```
src/
├ api/ // 天気API・GeminiレシピAPI（現在はダミー）
├ components/ // UIコンポーネント（PostCard, CommentCardなど）
├ logic/ // アドバイス生成ロジック・コミュニティロジック
├ screens/ // 各画面（Dashboard, Insight, Community, PostDetail）
├ types/ // TypeScriptの型定義
├ main.tsx // Routing（react-router-dom）
└ App.tsx
```
---

## 🔧 環境変数

将来の Gemini API 利用を見据えて、下記の env を利用しています。
```
VITE_GEMINI_API_KEY=<your_key> // 現在は使用停止（ダミーモード）
```
---

## 🚀 セットアップ

### 1. 依存関係のインストール
```
npm install
```
### 2. ローカル起動
```
npm run dev
```

---

## レシピ生成（現状仕様）
- src/api/geminiRecipe.ts は現在 ダミー返却モードとして動作しています。
- API呼び出しは無効化
- ダミーレシピを返す
- localStorage に recipe_YYYY-MM-DD の形式で保存
- 将来の Gemini 復旧に備えて APIコードをコメントで保持

---

## 💬 コミュニティ機能（現状仕様）
- 実証実験フェーズのため localStorageベースのミニSNS として動作：
- 投稿 / コメント / いいね のCRUD
- 運営テーマ（固定スレッド）
- 日記投稿（公開/非公開の選択）
- 投稿詳細画面（PostDetailScreen）でコメントが可能
- 将来は Firebase または Supabase に移行予定。

---

## 🧪 実証実験での技術構成（GAS + スプレッドシート）

本プロダクトの本番構成は Firebase / Supabase を想定していますが、  
実証実験フェーズ（参加者20名規模）では下記の理由から **GAS（Google Apps Script）** を利用します。

- コストを最小化するため
- 簡易的なAPIサーバーとしてGAS Web APIを実装できる
- 小規模のデータであればレスポンスが許容範囲
- バックエンド構築の工数を削減し、UX検証に集中するため

実験中は以下のデータを GAS で管理します：

- 投稿データ（posts）
- コメントデータ（comments）
- いいねカウント
- ログデータ（必要に応じて）

---

## 🔥 今後の開発予定（技術検討中）
- Firebase Authentication でのユーザー管理を検討
- Firestore で投稿・コメント・日記を管理
- Firebase Functions 経由で Gemini API を安全に呼び出す
- スマホアプリ化（React Native or Flutter）

---

## 🧪 実証実験（ユーザーテスト）について
- 想定参加者：札幌市内在住or勤務の40代、50代の女性20名
- 目的：UX調査・コミュニティ機能の体験検証、アウトカムの確認
- テスト期間：約2週間
- データ保存方法は検討中

---

## 👥 開発・相談窓口（技術者向け）
このプロジェクトは「個人開発 × 実証実験」の段階です。
バックエンドやインフラ設計について技術的なアドバイスを歓迎しています。

特に以下のテーマでサポートを求めています：

- Firebase / Supabase 等を用いたDB設計
- Gemini API の安全なサーバー側実装（Cloud Functions）
- スマホアプリ化（Flutter / React Native）
- 設計レビュー

---

## 📄 ライセンス
実証実験用プロトタイプのため、現時点では非公開運用を前提とします。

## 備考
本プロトタイプはAI駆動開発によるものです。
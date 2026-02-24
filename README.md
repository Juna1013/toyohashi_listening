# 豊橋技術科学大学 リスニング練習アプリ

豊橋技術科学大学 第3年次入学者選抜 英語リスニング問題（大問5）の音声再生練習アプリです。

## 概要

- 過去問の英文パッセージを音声で再生し、リスニング練習ができます
- 速度調整・ループ再生・スクリプト表示など、学習に便利な機能を備えたオーディオプレイヤーを提供します
- Astro（SSG）でビルドした静的サイトです

## 技術スタック

| 技術 | 用途 |
| :--- | :--- |
| [Astro v5](https://astro.build) | SSG フレームワーク・ページ生成 |
| [React](https://react.dev) | オーディオプレイヤー（Islands Architecture） |
| [TailwindCSS v4](https://tailwindcss.com) | スタイリング |
| macOS `say` + `afconvert` | 音声ファイル生成（TTS → AAC） |

## ディレクトリ構成

```text
/
├── docs/
│   ├── design.md                    # 設計書
│   └── pastexams/
│       └── R8/                      # 令和8年度 過去問PDF
├── public/
│   └── audio/
│       └── 2026/                    # 生成済み音声ファイル (.m4a)
├── scripts/
│   └── generate-audio.mjs           # 音声生成スクリプト
└── src/
    ├── components/
    │   ├── AudioPlayer.tsx           # React 音声プレイヤー
    │   └── ui/                       # 共通 UI コンポーネント
    ├── content/
    │   ├── config.ts                 # Content Collections スキーマ
    │   └── questions/
    │       └── 2026.json             # 令和8年度 問題データ
    ├── layouts/
    │   └── BaseLayout.astro          # 共通レイアウト
    ├── pages/
    │   ├── index.astro               # トップページ（年度一覧）
    │   └── [year]/
    │       └── index.astro           # 問題ページ
    └── types/
        └── index.ts                  # TypeScript 型定義
```

## セットアップ

```sh
npm install
```

## コマンド

| コマンド | 内容 |
| :--- | :--- |
| `npm run dev` | 開発サーバー起動 `localhost:4321` |
| `npm run build` | 静的サイトを `./dist/` にビルド |
| `npm run preview` | ビルド結果をローカルでプレビュー |

## 新しい年度を追加する方法

### 1. 問題データを作成する

`src/content/questions/<年度>.json` を作成します。

```json
{
  "year": 2027,
  "title": "令和9年度 豊橋技術科学大学 第3年次入学者選抜 英語 大問5 聴き取りテスト",
  "questions": [
    {
      "number": 1,
      "instruction": "...",
      "passage": "...",
      "audioPath": "/audio/2027/passage1.m4a",
      "subQuestions": [
        {
          "question": "...",
          "choices": ["A. ...", "B. ...", "C. ..."]
        }
      ]
    }
  ]
}
```

### 2. 音声ファイルを生成する

`scripts/generate-audio.mjs` の `jsonPath` と `outputDir` を新年度に合わせて変更し、実行します。

```sh
node scripts/generate-audio.mjs
```

macOS の `say` コマンド（Samantha, 155 WPM）で AIFF を生成し、`afconvert` で AAC (.m4a) に変換します。生成されたファイルは `public/audio/<年度>/` に保存されます。

## 対応済み年度

| 年度 | タイトル |
| :--- | :--- |
| 2026年度 | 令和8年度 豊橋技術科学大学 第3年次入学者選抜 英語 大問5 聴き取りテスト |

# 豊橋技術科学大学 編入試験リスニング練習アプリ 設計書

## 1. プロジェクト概要

### 目的

豊橋技術科学大学の大学編入試験における英語リスニング問題の自主学習を支援するWebアプリケーション。
公開されている過去問はスキャンPDFのみで音源が存在しないため、**開発者がOCRでテキストを抽出・整形し、TTSで音声ファイルを事前生成**する。
ユーザーはWebアプリ上でその音声ファイルを再生して学習する。

### 主な機能（現フェーズ）

- 問題セット一覧の表示
- 設問ごとの音声ファイル再生（プレイヤー機能）
  - 再生・一時停止・停止
  - シーク（任意の位置へ移動）
  - 再生速度変更
  - 繰り返し再生

### 将来拡張（現フェーズのスコープ外）

- クイズ・解答確認機能
- ユーザーによる音声生成・PDF取り込み

## 2. 全体フロー

### 開発者側（ビルド時・オフライン作業）

```bash
[PDF] スキャン過去問
    ↓
[OCRスクリプト (Node.js)] テキスト抽出・クリーニング
    ↓
[手動編集] テキスト確認・修正・設問分割
    ↓
[TTSスクリプト (Node.js)] 音声ファイル（MP3）を生成
    ↓
[JSON] 問題メタデータ（テキスト・音声ファイルパス）を記述
    ↓
src/content/ および public/audio/ に配置 → ビルド・デプロイ
```

### ユーザー側（ブラウザ）

```bash
トップページ（問題セット一覧）
    ↓
問題セットを選択
    ↓
設問一覧ページ
    ↓
設問を選択 → AudioPlayer で音声を再生
```

## 3. 技術スタック

### Webアプリ

| 分類 | 技術 | 備考 |
|------|------|------|
| フレームワーク | Astro | SSG、完全静的サイトとしてビルド |
| UIコンポーネント | React | Astro Islands として導入（AudioPlayer等） |
| スタイリング | TailwindCSS | Astro公式インテグレーション |
| 音声再生 | HTML5 `<audio>` | 事前生成済みMP3ファイルを再生 |
| データ管理 | Astro Content Collections | JSONをビルド時に型安全に読み込み |
| ビルドツール | Vite（Astro内蔵） | |

### 開発者ツール（スクリプト群）

| 分類 | 技術 | 備考 |
|------|------|------|
| OCR | Tesseract.js（Node.js） または Python + pytesseract | バッチ処理でPDF→テキスト変換 |
| PDF処理 | pdf2pic / pdfjs-dist（Node.js） | PDFをPNG画像に変換してOCRへ渡す |
| 音声生成 | OpenAI TTS API（`tts-1-hd`）または gTTS (Python) | 高品質な英語MP3を生成 |

## 4. ディレクトリ構成

```bash
.
├── scripts/                    # 開発者用スクリプト（アプリには含まれない）
│   ├── ocr.ts                  # PDF → テキスト抽出
│   └── generate-audio.ts       # テキスト → MP3 生成
│
├── src/
│   ├── content/
│   │   ├── config.ts           # Content Collections スキーマ定義
│   │   └── questions/
│   │       ├── 2023.json       # 2023年度 問題セット
│   │       └── 2022.json       # 2022年度 問題セット
│   │
│   ├── pages/
│   │   ├── index.astro         # 問題セット一覧
│   │   └── [year]/
│   │       └── index.astro     # 設問一覧 + AudioPlayer
│   │
│   ├── components/
│   │   ├── AudioPlayer.tsx     # 音声プレイヤー (React Island)
│   │   ├── QuestionList.astro  # 設問一覧
│   │   └── ui/
│   │       ├── Button.astro
│   │       └── Card.astro
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro
│   │
│   └── types/
│       └── index.ts
│
└── public/
    └── audio/
        ├── 2023/
        │   ├── q01.mp3
        │   ├── q02.mp3
        │   └── ...
        └── 2022/
            └── ...
```

## 5. データモデル

### QuestionSet（問題セット、JSONファイル単位）

```typescript
interface QuestionSet {
  year: number;          // 例: 2023
  title: string;         // 例: "2023年度 豊橋技科大 編入試験 英語 リスニング"
  questions: Question[];
}
```

### Question（設問）

```typescript
interface Question {
  number: number;        // 設問番号
  instruction?: string;  // 指示文（例: "Listen to the passage and answer."）
  passage: string;       // 読み上げ英文（表示用テキスト）
  audioPath: string;     // 音声ファイルパス（例: "/audio/2023/q01.mp3"）
  options?: string[];    // 選択肢テキスト（表示のみ、将来の解答機能向け）
}
```

## 6. AudioPlayer コンポーネント設計

### 機能要件

- 再生 / 一時停止 / 停止
- シークバー（現在時刻・総時間表示）
- 再生速度変更（0.5 / 0.75 / 1.0 / 1.25 / 1.5 倍）
- 繰り返し再生トグル

### Props

```typescript
interface AudioPlayerProps {
  src: string;           // 音声ファイルのURL
  title?: string;        // プレイヤー上部に表示するタイトル
  transcript?: string;   // スクリプト表示（折りたたみ可能）
}
```

### 実装方針

- HTML5 `<audio>` 要素を `useRef` で参照し、Reactで状態管理
- シークバーは `<input type="range">` で実装
- 再生速度は `audioElement.playbackRate` で制御
- TailwindCSSでスタイリング

## 7. 開発フェーズ

### Phase 1: 基盤構築

- [ ] Astroプロジェクト初期化
- [ ] TailwindCSS・React インテグレーション設定
- [ ] Content Collections スキーマ定義
- [ ] ベースレイアウト・共通UIコンポーネント作成

### Phase 2: AudioPlayer実装

- [ ] AudioPlayer コンポーネント（再生・停止・シーク・速度変更・ループ）
- [ ] 設問一覧ページへの組み込み
- [ ] サンプル音声・JSONデータで動作確認

### Phase 3: コンテンツ整備（開発者作業）

- [ ] OCRスクリプト作成・過去問テキスト抽出
- [ ] TTSスクリプト作成・音声ファイル生成
- [ ] 各年度のJSONデータ作成

### Phase 4: ブラッシュアップ

- [ ] レスポンシブデザイン対応
- [ ] アクセシビリティ対応（キーボード操作、aria属性）
- [ ] （将来）クイズ・解答確認機能の追加

## 8. 注意事項・制約

- **著作権**: 過去問は個人学習目的に限定する。音声ファイル・テキストデータはリポジトリに含めず、個人環境で管理する
- **音声品質**: OpenAI TTS API（`tts-1-hd`）等の高品質TTSを使用することで試験音声に近い自然な英語発音を実現する
- **ブラウザ対応**: HTML5 `<audio>` は全モダンブラウザで対応済み。`playbackRate` もChrome/Firefox/Safari/Edgeで利用可能

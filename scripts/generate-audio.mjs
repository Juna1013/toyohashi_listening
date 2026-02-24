/**
 * 音声ファイル生成スクリプト
 * macOS の `say` コマンドを使って passages を AAC (.m4a) に変換します。
 *
 * 使い方: node scripts/generate-audio.mjs
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- 設定 ----
const VOICE = "Samantha"; // en_US の自然な音声
const RATE = 155;         // 語数/分（試験らしいゆっくり目のペース）
// ---------------

function log(msg) {
  process.stdout.write(msg + "\n");
}

/**
 * パッセージテキストを say コマンド用に整形する
 * - 話者ラベル（Person A: / Person B:）を除去し、発話間に無音を挿入
 * - 段落区切りに無音を挿入
 */
function prepareText(passage) {
  return (
    passage
      // 各段落の先頭にある話者ラベルを除去（無音で区切る）
      .replace(/Person [AB]: /g, "")
      // 段落区切り（二重改行）→ 600ms 無音
      .replace(/\n\n/g, " [[slnc 600]] ")
      // 単独改行
      .replace(/\n/g, " ")
      .trim()
  );
}

/**
 * say コマンドで AIFF を生成し、afconvert で m4a に変換する
 * テキストはファイル経由で渡す（長文・特殊文字対策）
 */
function generate(text, outM4a) {
  const tmpTxt = outM4a + ".tmp.txt";
  const tmpAiff = outM4a + ".tmp.aiff";

  try {
    writeFileSync(tmpTxt, text, "utf8");
    execSync(`say -v "${VOICE}" -r ${RATE} -f "${tmpTxt}" -o "${tmpAiff}"`, {
      stdio: "inherit",
    });
    execSync(`afconvert -f m4af -d aac "${tmpAiff}" "${outM4a}"`);
  } finally {
    for (const f of [tmpTxt, tmpAiff]) {
      try { unlinkSync(f); } catch {}
    }
  }
}

// ---- メイン処理 ----

const jsonPath = join(ROOT, "src/content/questions/2026.json");
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const outputDir = join(ROOT, "public/audio/2026");
mkdirSync(outputDir, { recursive: true });

for (const q of data.questions) {
  const outM4a = join(outputDir, `passage${q.number}.m4a`);
  log(`\n[Passage ${q.number}] 生成中... => ${outM4a}`);

  const text = prepareText(q.passage);
  generate(text, outM4a);

  log(`  完了`);
}

log("\n全ての音声ファイルを生成しました。");
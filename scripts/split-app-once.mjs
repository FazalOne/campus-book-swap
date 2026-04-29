/**
 * One-off: extract slices from src/App.tsx (1-based inclusive line numbers).
 * Run from repo root: node scripts/split-app-once.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "src", "App.tsx");
const lines = fs.readFileSync(appPath, "utf8").split(/\r?\n/);

function slice(start1, end1) {
  return lines.slice(start1 - 1, end1).join("\n");
}

const outDir = path.join(root, "src", "_extracted");
fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  ["icons.txt", 34, 412],
  ["bookLabels.txt", 442, 444],
  ["BookCard.txt", 447, 584],
  ["ChatPage.txt", 587, 1497],
  ["AdminPanel.txt", 1500, 2486],
  ["ProfilePage.txt", 2489, 2777],
  ["PublicProfilePage.txt", 2780, 3136],
  ["BrowseBooksPage.txt", 3139, 3464],
  ["MyBooksPage.txt", 3467, 3633],
  ["AddEditBookForm.txt", 3638, 3979],
  ["SwapsPage.txt", 3981, 4557],
  ["AboutPrivacyContactFooterLanding.txt", 4559, 4815],
];

for (const [name, a, b] of jobs) {
  fs.writeFileSync(path.join(outDir, name), slice(a, b), "utf8");
  console.log("wrote", name, "lines", a, "-", b);
}

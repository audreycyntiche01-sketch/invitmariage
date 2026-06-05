import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import { statSync, existsSync } from 'fs';
import path from 'path';

const SRC  = 'C:/Users/Dell/invitmariage/images';
const DEST = 'C:/Users/Dell/invitmariage/public/images';

const tasks = [
  // Nouvelles galeries 3-6
  { src: 'galerie 3.jpeg', dest: 'galerie3.jpeg', width: 1200, q: 82 },
  { src: 'galerie 4.jpeg', dest: 'galerie4.jpeg', width: 1200, q: 82 },
  { src: 'galerie 5.jpeg', dest: 'galerie5.jpeg', width: 1200, q: 82 },
  { src: 'galerie 6.jpeg', dest: 'galerie6.jpeg', width: 1200, q: 82 },
  // Fonds soirée manquants
  { src: 'fondsoiree1.jpg', dest: 'fondsoiree1.jpg', width: 1600, q: 85 },
  { src: 'fondsoiree2.jpg', dest: 'fondsoiree2.jpg', width: 1000, q: 85 },
];

for (const t of tasks) {
  const srcPath  = path.join(SRC,  t.src);
  const destPath = path.join(DEST, t.dest);
  if (!existsSync(srcPath)) { console.log(`⚠️  ${t.src} introuvable`); continue; }
  const before = Math.round(statSync(srcPath).size / 1024);
  const buf = await sharp(srcPath, { failOnError: false })
    .rotate().resize({ width: t.width, withoutEnlargement: true })
    .jpeg({ quality: t.q }).toBuffer();
  await writeFile(destPath, buf);
  const after = Math.round(buf.length / 1024);
  console.log(`${t.src.padEnd(20)} → ${t.dest}  (${before} Ko → ${after} Ko)`);
}

// Supprimer galerie 7 et 8 de public/images
for (const f of ['galerie7.jpeg', 'galerie8.jpeg', 'photo1.png.tmp']) {
  const p = path.join(DEST, f);
  if (existsSync(p)) { await unlink(p); console.log(`🗑  Supprimé : ${f}`); }
}

console.log('\nTerminé ✓');

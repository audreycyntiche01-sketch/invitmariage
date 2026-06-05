import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';

const DIR = 'C:/Users/Dell/invitmariage/public/images';

const files = [
  { src: 'photo1.png',  width: 900 },
  { src: 'couple.png',  width: 700 },
];

for (const f of files) {
  const src  = path.join(DIR, f.src);
  const before = statSync(src).size;

  const buf = await sharp(src, { failOnError: false })
    .rotate()
    .resize({ width: f.width, withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 85 })
    .toBuffer();

  await writeFile(src, buf);

  const after = statSync(src).size;
  console.log(
    `${f.src.padEnd(12)} : ${Math.round(before/1024)} Ko → ${Math.round(after/1024)} Ko`
  );
}
console.log('\nTerminé ✓');

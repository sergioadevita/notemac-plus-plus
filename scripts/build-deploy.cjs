/**
 * Post-build script for GitHub Pages deployment.
 * Restructures dist/ so that:
 *   dist/index.html        → landing page
 *   dist/Icons/             → icon assets for landing page
 *   dist/docs/screenshots/  → screenshot assets for landing page
 *   dist/app/               → Vite-built web app
 */
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');

// 1. Move all Vite output into dist/app/
fs.mkdirSync(path.join(dist, 'app'), { recursive: true });
for (const entry of fs.readdirSync(dist)) {
  if (entry !== 'app') {
    fs.renameSync(path.join(dist, entry), path.join(dist, 'app', entry));
  }
}

// 2. Copy landing page to dist/index.html
fs.copyFileSync(
  path.resolve(__dirname, '..', 'landing-page.html'),
  path.join(dist, 'index.html')
);

// 3. Copy Icons/ directory
const iconsSource = path.resolve(__dirname, '..', 'Icons');
const iconsDest = path.join(dist, 'Icons');
fs.mkdirSync(iconsDest, { recursive: true });
for (const file of fs.readdirSync(iconsSource)) {
  fs.copyFileSync(path.join(iconsSource, file), path.join(iconsDest, file));
}

// 4. Copy docs/index.html (documentation viewer)
fs.mkdirSync(path.join(dist, 'docs'), { recursive: true });
fs.copyFileSync(
  path.resolve(__dirname, '..', 'docs', 'index.html'),
  path.join(dist, 'docs', 'index.html')
);

// 5. Copy docs/screenshots/ directory
const screenshotsSource = path.resolve(__dirname, '..', 'docs', 'screenshots');
const screenshotsDest = path.join(dist, 'docs', 'screenshots');
fs.mkdirSync(screenshotsDest, { recursive: true });
for (const file of fs.readdirSync(screenshotsSource)) {
  fs.copyFileSync(
    path.join(screenshotsSource, file),
    path.join(screenshotsDest, file)
  );
}

// 6. Copy SEO files (sitemap.xml, robots.txt)
fs.copyFileSync(
  path.resolve(__dirname, '..', 'sitemap.xml'),
  path.join(dist, 'sitemap.xml')
);
fs.copyFileSync(
  path.resolve(__dirname, '..', 'robots.txt'),
  path.join(dist, 'robots.txt')
);

console.log('Deploy build ready:');
console.log('  dist/index.html       (landing page)');
console.log('  dist/Icons/            (icon assets)');
console.log('  dist/docs/            (documentation viewer + screenshots)');
console.log('  dist/app/              (web app)');
console.log('  dist/sitemap.xml      (SEO sitemap)');
console.log('  dist/robots.txt       (SEO robots)');

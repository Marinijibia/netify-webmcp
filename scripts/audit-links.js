const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '../apps/web/src/app');
const srcDir = path.resolve(__dirname, '../apps/web/src');

// Collect all existing routes in apps/web/src/app
const routes = new Set();
function findRoutes(dir, currentRoute = '') {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      if (item.name.startsWith('(') && item.name.endsWith(')')) {
        findRoutes(path.join(dir, item.name), currentRoute);
      } else if (item.name.startsWith('@')) {
        // parallel route
      } else {
        findRoutes(path.join(dir, item.name), currentRoute + '/' + item.name);
      }
    } else if (item.name === 'page.tsx' || item.name === 'page.ts' || item.name === 'page.jsx' || item.name === 'page.js') {
      routes.add(currentRoute === '' ? '/' : currentRoute);
    } else if (item.name === 'route.ts' || item.name === 'route.js') {
      routes.add(currentRoute === '' ? '/' : currentRoute);
    }
  }
}
findRoutes(appDir);
console.log(`\n======================================================`);
console.log(`🌐 VALID APP ROUTES IN NEXT.JS APP ROUTER (${routes.size} found)`);
console.log(`======================================================`);
Array.from(routes).sort().forEach(r => console.log('  • ' + r));

// Collect all source files to scan for links
const filesToScan = [];
function findFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name === 'node_modules' || item.name === '.next' || item.name === 'dist') continue;
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      findFiles(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(item.name)) {
      filesToScan.push(fullPath);
    }
  }
}
findFiles(srcDir);

console.log(`\n======================================================`);
console.log(`🔍 SCANNING ${filesToScan.length} SOURCE FILES FOR INTERNAL LINKS...`);
console.log(`======================================================`);

const linkRegex = /(?:href|router\.push|router\.replace)\s*(?:=|:|\()\s*['"`](\/[a-zA-Z0-9_\-\/\[\]\?&=%#:]*)['"`]/g;

const foundLinks = new Map(); // linkPath -> array of files where used

for (const file of filesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[1];
    if (!rawLink || rawLink.startsWith('//') || rawLink.startsWith('/_')) continue;
    const cleanPath = rawLink.split('?')[0].split('#')[0];
    if (!cleanPath) continue;
    if (!foundLinks.has(cleanPath)) foundLinks.set(cleanPath, []);
    foundLinks.get(cleanPath).push(path.relative(srcDir, file));
  }
}

console.log(`Found ${foundLinks.size} unique internal route paths used in application.`);

let validCount = 0;
let brokenCount = 0;
const brokenList = [];

for (const [linkPath, files] of foundLinks.entries()) {
  let matched = routes.has(linkPath);

  // Check static or dynamic segment matches
  if (!matched) {
    for (const validRoute of routes) {
      if (validRoute.includes('[')) {
        // e.g. /receivables/[id] -> ^\/receivables\/[^\/]+$
        const regexStr = '^' + validRoute.replace(/\[\.\.\.[^\]]+\]/g, '.*').replace(/\[[^\]]+\]/g, '[^/]+') + '$';
        const reg = new RegExp(regexStr);
        if (reg.test(linkPath)) {
          matched = true;
          break;
        }
      }
    }
  }

  // Also check public static assets e.g. /favicon.ico, /manifest.json, /.well-known/...
  if (!matched) {
    const publicDir = path.resolve(__dirname, '../apps/web/public');
    const assetPath = path.join(publicDir, linkPath);
    if (fs.existsSync(assetPath)) {
      matched = true;
    }
  }

  if (matched) {
    validCount++;
  } else {
    brokenCount++;
    brokenList.push({ linkPath, files: files.slice(0, 3) });
  }
}

console.log(`\n======================================================`);
console.log(`📊 LINK AUDIT SUMMARY`);
console.log(`======================================================`);
console.log(`✅ Valid Internal Links:  ${validCount}`);
console.log(`❌ Broken / Unknown Links: ${brokenCount}`);

if (brokenCount > 0) {
  console.log(`\n⚠️  DETAILS OF UNMATCHED LINKS:`);
  brokenList.forEach(({ linkPath, files }) => {
    console.log(`  ❌ "${linkPath}"`);
    console.log(`     Used in: ${files.join(', ')}`);
  });
  process.exitCode = 1;
} else {
  console.log(`\n🎉 ALL INTERNAL LINKS ARE 100% VALID! ZERO BROKEN LINKS DETECTED.`);
  process.exitCode = 0;
}

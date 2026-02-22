const fs = require('fs');
const path = require('path');

// Move everything produced by "expo export --platform web" into a
// /web subdirectory, then copy the root landing page into dist/index.html.
// This allows the Cloudflare worker (or any static server) to serve the
// landing page at "/" and the actual React app at "/web".

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const webDir = path.join(dist, 'web');
const landingPage = path.join(root, 'index.html');

if (!fs.existsSync(dist)) {
  console.warn('prepare-web: dist directory does not exist; nothing to do');
  process.exit(0);
}

// ensure web directory exists empty
if (fs.existsSync(webDir)) {
  fs.rmSync(webDir, { recursive: true, force: true });
}
fs.mkdirSync(webDir, { recursive: true });

for (const name of fs.readdirSync(dist)) {
  if (name === 'web') continue; // skip target directory
  const src = path.join(dist, name);
  const dest = path.join(webDir, name);
  fs.renameSync(src, dest);
}

// copy landing page into dist root so the asset directory includes it
if (fs.existsSync(landingPage)) {
  fs.copyFileSync(landingPage, path.join(dist, 'index.html'));
} else {
  console.warn('prepare-web: root index.html not found, landing page missing');
}

// Rewrite root-relative asset paths in the app's index.html.
// Expo generates /_expo/... and /assets/... but the app is served from /web,
// so the actual files live at /web/_expo/... and /web/assets/...
const webIndex = path.join(webDir, 'index.html');
if (fs.existsSync(webIndex)) {
  let html = fs.readFileSync(webIndex, 'utf8');
  html = html.replace(/\/_expo\//g, '/web/_expo/');
  html = html.replace(/(?<!\/web)\/assets\//g, '/web/assets/');

  // Inject a URL-rewriting shim before </head> so that Expo Router sees the
  // path WITHOUT the /web prefix (e.g. /web → /, /web/explore → /explore).
  // Required because experiments.baseUrl is not honoured by this Expo version.
  const urlShim = `<script>
    (function(){
      var p = window.location.pathname;
      if (p === '/web' || p === '/web/') {
        history.replaceState(null, '', '/');
      } else if (p.startsWith('/web/')) {
        history.replaceState(null, '', p.slice(4) || '/');
      }
    })();
  </script>`;
  html = html.replace(/<\/head>/, urlShim + '</head>');

  fs.writeFileSync(webIndex, html);
  console.log('prepare-web: patched asset paths + injected URL shim into dist/web/index.html');
}

console.log('prepare-web: moved web build into /web and installed landing page');

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
  // guard against leftover from previous run; delete the destination first if it exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    console.warn(`prepare-web: couldn't rename ${name}, falling back to copy`, err.message);
    // graceful fallback: copy files/dirs
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true, force: true });
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    }
  }
}

// copy landing page into dist root so the asset directory includes it
if (fs.existsSync(landingPage)) {
  fs.copyFileSync(landingPage, path.join(dist, 'index.html'));
} else {
  console.warn('prepare-web: root index.html not found, landing page missing');
}

// copy standalone legal HTML pages to dist root so they're served at /privacy and /terms
['privacy.html', 'terms.html'].forEach((name) => {
  const src = path.join(root, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, name.replace('.html', '') + '.html'));
    console.log(`prepare-web: copied ${name} to dist`);
  } else {
    console.warn(`prepare-web: ${name} not found, skipping`);
  }
});

// copy logo asset so landing page favicon actually resolves
const logoSrc = path.join(root, 'assets/images/logo.png');
if (fs.existsSync(logoSrc)) {
  // put copies where various paths might point to
  const logoDest = path.join(dist, 'assets/images/logo.png');
  fs.mkdirSync(path.dirname(logoDest), { recursive: true });
  fs.copyFileSync(logoSrc, logoDest);
  // root location so /logo.png works from landing page or app
  fs.copyFileSync(logoSrc, path.join(dist, 'logo.png'));
  // when the app is served from /web, some relative links may resolve under
  // that prefix; ensure a copy exists there too
  const webLogoDest = path.join(webDir, 'assets/images/logo.png');
  fs.mkdirSync(path.dirname(webLogoDest), { recursive: true });
  fs.copyFileSync(logoSrc, webLogoDest);
  fs.copyFileSync(logoSrc, path.join(webDir, 'logo.png')); // and at /web/logo.png
  console.log('prepare-web: copied logo.png into dist (root, assets, and web)');
} else {
  console.warn('prepare-web: logo asset not found, favicon link may break');
}

// also copy legal markdown files so they're served alongside the app
['privacy-policy.md', 'terms-and-conditions.md'].forEach((name) => {
  const src = path.join(root, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, name));
    fs.copyFileSync(src, path.join(webDir, name));
  }
});

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
      var qs = window.location.search;
      var hash = window.location.hash;
      if (p === '/web' || p === '/web/') {
        history.replaceState(null, '', '/' + qs + hash);
      } else if (p.startsWith('/web/')) {
        history.replaceState(null, '', (p.slice(4) || '/') + qs + hash);
      }
    })();
  </script>`;
  html = html.replace(/<\/head>/, urlShim + '</head>');

  // also swap the generated favicon reference to our logo so the SPA
  // consistently uses the same image (favicon.ico is auto-generated and not
  // easily controlled).
  html = html.replace(/<link rel="icon" href="\/favicon.ico"/, '<link rel="icon" href="/logo.png"');

  fs.writeFileSync(webIndex, html);
  console.log('prepare-web: patched asset paths + injected URL shim into dist/web/index.html and updated favicon link');
}

console.log('prepare-web: moved web build into /web and installed landing page');

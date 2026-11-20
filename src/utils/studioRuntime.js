// Runs a multi-file React + Tailwind app (from the Build Studio) inside an iframe, with no build step:
// each file is compiled with Babel in the browser, relative imports are resolved to blob URLs,
// and npm packages load from esm.sh. Errors are posted to the parent window so the AI can fix them.

const PKG_PINS = {
  'lucide-react': 'lucide-react@0.454.0',
  recharts: 'recharts@2.13.3',
  'date-fns': 'date-fns@3.6.0',
  clsx: 'clsx@2.1.1',
  'react-router-dom': 'react-router-dom@6.28.0',
}

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function findEntry(files = []) {
  const paths = files.map((f) => f.path || f.name)
  return ['src/App.jsx', 'src/App.tsx', 'src/App.js', 'App.jsx', 'App.js'].find((p) => paths.includes(p)) || paths.find((p) => /(^|\/)App\.(jsx|tsx|js)$/.test(p)) || null
}

export function buildStudioDocument(files = [], { title = 'App' } = {}) {
  const list = files.map((f) => ({ path: String(f.path || f.name || '').replace(/^\.?\//, ''), content: String(f.content || '') }))
  const entry = findEntry(list)
  const payload = JSON.stringify({ files: list, entry, pins: PKG_PINS }).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script type="importmap">{"imports":{
  "react":"https://esm.sh/react@18.3.1",
  "react/jsx-runtime":"https://esm.sh/react@18.3.1/jsx-runtime",
  "react-dom":"https://esm.sh/react-dom@18.3.1?external=react",
  "react-dom/client":"https://esm.sh/react-dom@18.3.1/client?external=react"
}}</script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
<style>html,body{margin:0;min-height:100%} #__studio_err{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;display:none;background:#1a0b0f;color:#ffb3c1;border:1px solid #ff4d6d;font:12px/1.5 ui-monospace,Menlo,monospace;padding:10px 12px;white-space:pre-wrap;max-height:40vh;overflow:auto}</style>
</head><body><div id="root"></div><div id="__studio_err" role="alert"></div>
<script>
(function(){
  var DATA = ${payload};
  // Never let the app inside the preview scroll the page around it (focus() would scroll ancestors too)
  var _focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(opts){ return _focus.call(this, Object.assign({}, opts || {}, { preventScroll: true })); };
  Element.prototype.scrollIntoView = (function(orig){ return function(){ try { var r = this.getBoundingClientRect(); window.scrollBy(0, r.top - 16); } catch(e) { return orig && orig.apply(this, arguments); } }; })(Element.prototype.scrollIntoView);
  var byPath = new Map(DATA.files.map(function(f){ return [f.path, f.content]; }));
  var urls = new Map(), visiting = new Set();
  function report(msg){
    var box = document.getElementById('__studio_err');
    box.textContent = String(msg); box.style.display = 'block';
    try { parent.postMessage({ __studio: 'error', message: String(msg).slice(0, 2000) }, '*'); } catch(e) {}
  }
  window.addEventListener('error', function(e){ report((e.error && e.error.stack) || e.message); });
  window.addEventListener('unhandledrejection', function(e){ report((e.reason && (e.reason.stack || e.reason.message)) || e.reason); });
  function resolve(from, spec){
    var parts = from.split('/'); parts.pop();
    spec.split('/').forEach(function(p){ if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); });
    var base = parts.join('/');
    var cands = [base, base + '.jsx', base + '.js', base + '.tsx', base + '.ts', base + '/index.jsx', base + '/index.js', base + '/index.tsx'];
    for (var i = 0; i < cands.length; i++) if (byPath.has(cands[i])) return cands[i];
    return null;
  }
  function bare(spec){
    if (/^react(-dom)?(\\/|$)/.test(spec)) return spec;
    var name = spec[0] === '@' ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    var sub = spec.slice(name.length);
    var pinned = DATA.pins[name] || name;
    var url = 'https://esm.sh/' + pinned + sub + '?external=react,react-dom';
    // The preview runs at about:srcdoc, where URL-based routers crash: route in memory instead.
    if ((name === 'react-router-dom' || name === 'react-router') && !sub) {
      if (!routerShims[name]) routerShims[name] = blob("export * from '" + url + "'; export { MemoryRouter as BrowserRouter, MemoryRouter as HashRouter, createMemoryRouter as createBrowserRouter, createMemoryRouter as createHashRouter } from '" + url + "';");
      return routerShims[name];
    }
    return url;
  }
  var routerShims = {};
  function blob(code){ return URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); }
  function compile(path){
    if (urls.has(path)) return urls.get(path);
    if (visiting.has(path)) throw new Error('Circular import involving ' + path);
    visiting.add(path);
    var src = byPath.get(path), url;
    if (/\\.css$/.test(path)) {
      var st = document.createElement('style'); st.textContent = src; document.head.appendChild(st);
      url = blob('export default null;');
    } else if (/\\.json$/.test(path)) {
      url = blob('export default ' + src + ';');
    } else {
      var ts = /\\.tsx?$/.test(path);
      var presets = [['react', { runtime: 'automatic' }]];
      if (ts) presets.push(['typescript', { isTSX: true, allExtensions: true }]);
      var code = Babel.transform(src, { filename: path, presets: presets, sourceType: 'module' }).code;
      code = code.replace(/(\\bfrom\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s+)(['"])([^'"]+)\\2/g, function(m, pre, q, spec){
        if (spec[0] === '.' || spec[0] === '/') {
          var r = resolve(path, spec);
          if (!r) throw new Error(path + ': cannot find "' + spec + '"');
          return pre + q + compile(r) + q;
        }
        return pre + q + bare(spec) + q;
      });
      url = blob(code);
    }
    visiting.delete(path); urls.set(path, url);
    return url;
  }
  try {
    if (!DATA.entry) throw new Error('No src/App.jsx yet. Ask the AI to build the app.');
    var appUrl = compile(DATA.entry);
    var main = "import React from 'react'; import { createRoot } from 'react-dom/client'; import App from '" + appUrl + "';" +
      "class Boundary extends React.Component { constructor(p){ super(p); this.state = { e: null }; }" +
      " static getDerivedStateFromError(e){ return { e: e }; }" +
      " componentDidCatch(e){ try { parent.postMessage({ __studio: 'error', message: String((e && e.stack) || e).slice(0, 2000) }, '*'); } catch(_){} }" +
      " render(){ return this.state.e ? React.createElement('pre', { style: { color: '#ff8fa3', padding: 16, whiteSpace: 'pre-wrap' } }, String(this.state.e)) : this.props.children; } }" +
      "createRoot(document.getElementById('root')).render(React.createElement(Boundary, null, React.createElement(App)));" +
      "parent.postMessage({ __studio: 'ready' }, '*');";
    import(blob(main)).catch(function(e){ report(e.stack || e.message); });
  } catch (e) { report(e.stack || e.message); }
})();
</script></body></html>`
}

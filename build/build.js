/* build/build.js – single-file static-site generator
   Run:  node build/build.js  (or `npm run build`)
*/
import fs from "fs-extra";
import path from "path";
import glob from "glob";
import yaml from "js-yaml";

const GEM_DIR = "gems";           // source gems
const OUT_DIR = "public";         // generated site
const LOGO_SRC = "assets/logo.png"; // user-supplied asset

await fs.emptyDir(OUT_DIR);

// Copy global assets (logo) if present
if (await fs.pathExists(LOGO_SRC)) {
  await fs.copy(LOGO_SRC, path.join(OUT_DIR, LOGO_SRC));
}

const gems = [];

// 1. Walk every meta.yaml under /gems
for (const metaPath of glob.sync(`${GEM_DIR}/*/meta.yaml`)) {
  const folder = path.dirname(metaPath);
  const meta = yaml.load(await fs.readFile(metaPath, "utf8"));

  if (!meta.slug || !meta.title)
    throw new Error(`Missing slug or title in ${metaPath}`);

  // Copy declared asset files verbatim
  for (const file of meta.files ?? []) {
    await fs.copy(path.join(folder, file), path.join(OUT_DIR, file));
  }

  gems.push({
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    tags: meta.tags ?? []
  });

  // Emit individual gem detail page
  await fs.outputFile(
    path.join(OUT_DIR, `${meta.slug}.html`),
`<!doctype html><html lang=\"en\"><head>
<meta charset=\"utf-8\"><title>${meta.title} – Little Gem Library</title>
<link href=\"../style.css\" rel=\"stylesheet\"></head><body class=\"p-6 max-w-3xl mx-auto\">
<a href=\"../index.html\">← Back to catalogue</a>
<h1 class=\"mt-4 text-3xl font-bold\">${meta.title}</h1>
<p class=\"mb-4\">${meta.description}</p>
<h2 class=\"font-semibold mt-6\">Prompt</h2>
<pre class=\"bg-gray-100 p-4 rounded whitespace-pre-wrap\">${meta.prompt}</pre>
${meta.files?.length ? `\n<h2 class=\"font-semibold mt-6\">Files</h2>\n<ul class=\"list-disc list-inside\">\n${meta.files.map(f=>`<li><a href=\"../${f}\">${path.basename(f)}</a></li>`).join("\n")}\n</ul>` : ""}
</body></html>`);
}

// 2. Emit catalogue JSON for search
await fs.writeJSON(path.join(OUT_DIR, "gems.json"), gems, { spaces: 2 });

// 3. Emit index page
await fs.outputFile(path.join(OUT_DIR, "index.html"),
`<!doctype html><html lang=\"en\"><head>
<meta charset=\"utf-8\"><title>Little Gem Library</title>
<link href=\"style.css\" rel=\"stylesheet\">
<script src=\"https://cdn.jsdelivr.net/npm/fuse.js@7\"></script></head><body class=\"p-6 max-w-5xl mx-auto\">
<div class=\"flex justify-center mb-8\">
  <img src=\"assets/logo.png\" alt=\"Little Gem Library logo\" class=\"w-56 sm:w-64 md:w-72 lg:w-80\">
</div>
<h1 class=\"text-4xl font-bold mb-4 text-center\">Little Gem Library</h1>
<input id=\"search\" class=\"w-full p-2 border rounded\" placeholder=\"Search gems…\">
<div id=\"list\" class=\"grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3\"></div>
<script type=\"module\">
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7/+esm';
const data = await fetch('gems.json').then(r=>r.json());
const fuse = new Fuse(data,{keys:['title','description','tags'],threshold:0.4});
const list=document.getElementById('list');
function render(arr){list.innerHTML=arr.map(g=>\`<a href="${g.slug}.html" class="block p-4 border rounded hover:shadow"><h2 class="font-semibold mb-1">${g.title}</h2><p class="text-sm text-gray-700">${(g.description||'').slice(0,90)}…</p><div class="mt-2 flex flex-wrap gap-1">${(g.tags||[]).map(t=>'<span class="px-2 py-0.5 bg-gray-200 text-xs rounded">'+t+'</span>').join('')}</div></a>\`).join('');}
render(data);
document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.trim();render(q?fuse.search(q).map(r=>r.item):data);});
</script></body></html>`);

// 4. Emit site stylesheet
await fs.outputFile(path.join(OUT_DIR, "style.css"),
`@import 'https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css';
body{background-color:#F9F0D6;}`);

console.log("✅ Build complete → see /public");

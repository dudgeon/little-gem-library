# Little Gem Library
A static catalogue of internal **Gemini “gems”** your team can browse and copy.

## Quick start
```bash
# 1. Install toolchain
npm install

# 2. Add the logo
#    Place the provided logo file here:
#    assets/logo.png

# 3. Build the site
npm run build   # outputs to /public
```

Open `public/index.html` in a browser or push `/public` to GitHub Pages.

### Adding a new gem

1. `mkdir gems/my-gem && cd gems/my-gem`
2. Create `meta.yaml` following the schema (see hello-world example).
3. Put any supporting files in `files/` and reference them in `meta.yaml`.
4. Run `npm run build` again – the catalogue and search update automatically.


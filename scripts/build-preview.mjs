import { build } from "vite";
import { readFile, writeFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(process.argv[2] || join(root, "micefactory-preview.html"));
const temporary = await mkdtemp(join(tmpdir(), "micefactory-preview-"));

try {
  // Only this export build changes asset references. The normal website stays unchanged.
  await build({
    root,
    configFile: false,
    base: "./",
    plugins: [{
      name: "portable-preview-assets",
      enforce: "pre",
      transform(code, id) {
        if (!id.endsWith("/src/App.jsx")) return;
        return code
          .replace('src={`/images/brand-${image.page}.jpeg`}', 'src={globalThis.__MICE_PREVIEW_ASSETS__[`brand-${image.page}.jpeg`]}')
          .replace('href="/micefactory-events.pdf"', 'href={globalThis.__MICE_PREVIEW_ASSETS__["profile.pdf"]}');
      },
    }],
    build: {
      outDir: temporary,
      emptyOutDir: true,
      copyPublicDir: false,
      cssCodeSplit: false,
      assetsInlineLimit: Infinity,
      rolldownOptions: { output: { codeSplitting: false } },
    },
  });

  const files = await readdir(join(temporary, "assets"));
  const jsFiles = files.filter(file => file.endsWith(".js"));
  if (jsFiles.length !== 1) throw new Error("Expected exactly one self-contained JavaScript bundle.");
  const js = await readFile(join(temporary, "assets", jsFiles[0]), "utf8");
  const css = await readFile(join(temporary, "assets", files.find(file => file.endsWith(".css"))), "utf8");
  const assets = {};
  for (const page of [2, 3, 4]) {
    const data = await readFile(join(root, "public/images", `brand-${page}.jpeg`));
    assets[`brand-${page}.jpeg`] = { mime: "image/jpeg", base64: data.toString("base64") };
  }
  assets["profile.pdf"] = { mime: "application/pdf", base64: (await readFile(join(root, "public/micefactory-events.pdf"))).toString("base64") };
  const favicon = (await readFile(join(root, "public/favicon.svg"))).toString("base64");
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#536670">
<title>MICEFACTORY Events — Interactive preview</title>
<link rel="icon" href="data:image/svg+xml;base64,${favicon}">
<style>${css.replaceAll("</style", "<\\/style")}</style>
</head><body><div id="root"></div>
<script>
globalThis.__MICE_PREVIEW_ASSETS__ = {};
for (const [name, asset] of Object.entries(${JSON.stringify(assets)})) {
  const binary = atob(asset.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  globalThis.__MICE_PREVIEW_ASSETS__[name] = URL.createObjectURL(new Blob([bytes], {type: asset.mime}));
}
</script>
<script type="module">${js.replaceAll("</script", "<\\/script")}</script>
</body></html>`;
  await writeFile(destination, html);
  console.log(`Portable interactive preview written to ${destination} (${(Buffer.byteLength(html) / 1048576).toFixed(1)} MiB).`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

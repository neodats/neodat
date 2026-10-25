import { readdir, readFile, access } from "node:fs/promises";
import { resolve, relative, dirname, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { Window } from "happy-dom";
const root = resolve(import.meta.dirname, "..");
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = await Promise.all(
    entries
      .filter((e) => !["node_modules", ".git"].includes(e.name))
      .map((e) =>
        e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)],
      ),
  );
  return result.flat();
}
const all = await files(root),
  errors = [];
for (const file of all) {
  if (file.endsWith(".js") || file.endsWith(".mjs")) {
    const check = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (check.status) errors.push(check.stderr);
  }
  if (![".html", ".css"].includes(extname(file))) continue;
  if (relative(root, file).startsWith("content")) continue;
  const source = await readFile(file, "utf8");
  const urls = [];
  if (file.endsWith(".html")) {
    if (relative(root, file).startsWith("google")) continue;
    const window = new Window();
    window.document.write(source);
    if (!window.document.documentElement.lang)
      errors.push(`${file}: missing lang`);
    if (!window.document.title) errors.push(`${file}: missing title`);
    if (
      window.document.querySelector(
        'script:not([src]):not([type="application/ld+json"])',
      )
    )
      errors.push(`${file}: inline executable script`);
    for (const el of window.document.querySelectorAll("[src],[href]")) {
      const url = el.getAttribute("src") || el.getAttribute("href");
      if (url) urls.push(url);
    }
    const ids = new Set();
    for (const el of window.document.querySelectorAll("[id]")) {
      if (ids.has(el.id)) errors.push(`${file}: duplicate id ${el.id}`);
      ids.add(el.id);
    }
    await window.happyDOM.close();
  } else {
    for (const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))
      urls.push(match[1]);
  }
  for (const url of urls) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
    const path = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!path) continue;
    const target = path.startsWith("/")
      ? resolve(root, "." + path)
      : resolve(dirname(file), path);
    try {
      await access(target);
    } catch {
      errors.push(`${relative(root, file)}: missing ${url}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `OK: JavaScript syntax, IDs and local references in ${all.filter((f) => f.endsWith(".html") && !relative(root, f).startsWith("content")).length} HTML pages.`,
  );

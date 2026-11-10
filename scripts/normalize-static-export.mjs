import { readdir, rename } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform === "win32") {
  const output = fileURLToPath(new URL("../out/", import.meta.url));
  const entries = await readdir(output, { recursive: true, withFileTypes: true });

  // Next.js 16 can emit nested segment files on Windows. The client requests flat names.
  // https://github.com/vercel/next.js/issues/85374
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".txt")) continue;

    const parts = relative(output, entry.parentPath).split(sep);
    const segment = parts.findIndex((part) => part.startsWith("__next."));
    if (segment < 0) continue;

    const filename = [...parts.slice(segment), entry.name].join(".");
    await rename(
      join(entry.parentPath, entry.name),
      join(output, ...parts.slice(0, segment), filename),
    );
  }
}

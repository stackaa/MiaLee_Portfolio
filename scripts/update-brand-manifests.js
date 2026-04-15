const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const brandFolders = ["hair brands", "beauty brands", "fashion brands", "lifestyle brands"];
const imageExtensions = new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

const buildManifest = (folder) => {
  const folderPath = path.join(rootDir, folder);
  if (!fs.existsSync(folderPath)) {
    console.warn(`Skipping missing folder: ${folder}`);
    return;
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const manifestPath = path.join(folderPath, "manifest.json");
  const manifestScriptPath = path.join(folderPath, "manifest.js");

  fs.writeFileSync(manifestPath, `${JSON.stringify(files, null, 2)}\n`, "utf8");

  const scriptContents = `window.LOGO_MANIFESTS = window.LOGO_MANIFESTS || {};\nwindow.LOGO_MANIFESTS[\"${folder}\"] = ${JSON.stringify(files, null, 2)};\n`;
  fs.writeFileSync(manifestScriptPath, scriptContents, "utf8");

  console.log(`Updated ${path.relative(rootDir, manifestPath)} with ${files.length} logos.`);
  console.log(`Updated ${path.relative(rootDir, manifestScriptPath)} with ${files.length} logos.`);
};

brandFolders.forEach(buildManifest);

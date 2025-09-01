import fs from "fs";
import path from "path";

const raw = fs.readFileSync(path.join(__dirname, "metadata.csv"), "utf-8");
const lines = raw.split("\n").filter(Boolean);

const assets = lines.map(line => {
  const [file, size] = line.split(",");
  return {
    file: file.trim(),
    size: parseInt(size.trim(), 10),
    type: getType(file),
  };
});

function getType(file: string) {
  if (file.endsWith(".js")) return "JavaScript";
  if (file.endsWith(".css")) return "CSS";
  if (file.endsWith(".png") || file.endsWith(".woff") || file.endsWith(".ttf")) return "Media";
  if (file.startsWith("/api/")) return "API";
  if (file.endsWith(".json") || file.endsWith(".txt")) return "Config";
  return "Other";
}

fs.writeFileSync("assets.json", JSON.stringify(assets, null, 2));
console.log("✅ Parsed metadata into assets.json");

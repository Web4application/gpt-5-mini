import fs from "fs";
import path from "path";

const toolsDir = path.resolve("./tools");

const tools = [];
const toolMap = {};

// loop through tool files
for (const file of fs.readdirSync(toolsDir)) {
  if (file !== "index.js" && file.endsWith(".js")) {
    const tool = (await import(path.join(toolsDir, file))).default;

    tools.push({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema
    });

    toolMap[tool.name] = tool.run;
  }
}

// --- auto-generate tools.json ---
fs.writeFileSync("tools.json", JSON.stringify(tools, null, 2));

// --- auto-generate TOOLS.md ---
const mdDoc = [
  "# 🛠 Available Tools",
  "",
  ...tools.map(
    (t) =>
      `## ${t.name}\n- **Description:** ${t.description}\n- **Input Schema:**\n\`\`\`json\n${JSON.stringify(
        t.input_schema,
        null,
        2
      )}\n\`\`\`\n`
  ),
].join("\n");

fs.writeFileSync("TOOLS.md", mdDoc);

console.log("✅ Tools loaded & documentation updated!");

export { tools, toolMap };

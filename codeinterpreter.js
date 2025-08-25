import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(bodyParser.json());

const PORT = 5000;

// Supported languages and commands
const LANG_COMMANDS = {
  python: (file) => `python3 ${file}`,
  javascript: (file) => `node ${file}`,
  typescript: (file) => `npx ts-node ${file}`,
  r: (file) => `Rscript ${file}`,
  matlab: (file) => `octave ${file}`,
  cpp: (file) => `g++ ${file} -o ${file}.out && ${file}.out`,
  csharp: (file) => `dotnet-script ${file}`,
};

app.post("/run", async (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) return res.status(400).send("Missing language or code");
  if (!LANG_COMMANDS[language]) return res.status(400).send("Language not supported");

  const fileName = `/tmp/${uuidv4()}.${language}`;

  // Save code to temp file
  fs.writeFileSync(fileName, code);

  exec(LANG_COMMANDS[language](fileName), { timeout: 5000 }, (err, stdout, stderr) => {
    // Delete file after execution
    fs.unlinkSync(fileName);

    if (err) return res.json({ success: false, error: stderr || err.message });
    return res.json({ success: true, output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Code Interpreter API running on port ${PORT}`);
});

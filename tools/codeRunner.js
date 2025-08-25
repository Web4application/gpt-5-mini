import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const TIMEOUT_MS = 5000;            // hard kill after 5s
const MAX_BUFFER = 1024 * 1024;     // 1 MB stdout/stderr buffer
const MAX_OUTPUT_CHARS = 1000;      // truncate long outputs

function truncate(s) {
  if (typeof s !== "string") s = String(s ?? "");
  return s.length > MAX_OUTPUT_CHARS ? s.slice(0, MAX_OUTPUT_CHARS) + "... [truncated]" : s;
}

function tmpDir() {
  const dir = path.join(os.tmpdir(), "gpt5-mini-" + crypto.randomBytes(6).toString("hex"));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeTemp(dir, filename, content) {
  const full = path.join(dir, filename);
  fs.writeFileSync(full, content, "utf8");
  return full;
}

function runCmd(command, cwd) {
  return new Promise((resolve) => {
    exec(command, { timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER, cwd }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) return resolve({ error: `Execution timed out (${TIMEOUT_MS}ms)` });
        // common "command not found" hint
        const msg = stderr?.trim() || stdout?.trim() || error.message;
        return resolve({ error: truncate(msg) || "Unknown execution error" });
      }
      resolve({ output: truncate((stdout || "").trim()) || (stderr ? `stderr: ${truncate(stderr.trim())}` : "") });
    });
  });
}

export default {
  name: "codeRunner",
  description:
    "Execute short code snippets. Supported languages: javascript, typescript, python, kotlin, matlab (or octave), notebook (.ipynb JSON), r, cpp, csharp.",
  input_schema: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["javascript", "typescript", "python", "kotlin", "matlab", "notebook", "r", "cpp", "csharp"],
        description: "Programming language/runtime"
      },
      code: {
        type: "string",
        description:
          "The code to execute. For 'notebook', provide full .ipynb JSON as a string."
      },
      // optional entrypoint filename hints for compiled langs (cpp/csharp),
      // not strictly required but can be useful in future
      filename: { type: "string", description: "Optional filename hint (e.g., main.cpp, Program.cs)" }
    },
    required: ["language", "code"]
  },

  run: async ({ language, code, filename }) => {
    const dir = tmpDir();

    try {
      switch (language) {
        case "javascript": {
          // Use file to avoid quote issues
          const file = writeTemp(dir, "snippet.js", code);
          return await runCmd(`node "${file}"`, dir);
        }

        case "typescript": {
          // Requires ts-node (npm i -g ts-node typescript) or project-local via npx
          const file = writeTemp(dir, "snippet.ts", code);
          // try ts-node first; if missing, npx ts-node
          let res = await runCmd(`ts-node "${file}"`, dir);
          if (res.error && /not found|ENOENT|ts-node: command not found/i.test(res.error)) {
            res = await runCmd(`npx ts-node "${file}"`, dir);
          }
          return res;
        }

        case "python": {
          const file = writeTemp(dir, "snippet.py", code);
          return await runCmd(`python3 "${file}"`, dir);
        }

        case "kotlin": {
          // Kotlin script .kts (needs kotlinc)
          const file = writeTemp(dir, "snippet.kts", code);
          let res = await runCmd(`kotlinc -script "${file}"`, dir);
          // Some envs use `kotlin` runner:
          if (res.error && /not found|ENOENT/i.test(res.error)) {
            res = await runCmd(`kotlin -script "${file}"`, dir);
          }
          return res;
        }

        case "matlab": {
          // Try MATLAB first, then Octave fallback
          const file = writeTemp(dir, "snippet.m", code);
          // MATLAB non-interactive batch
          let res = await runCmd(`matlab -batch "run('${file.replace(/\\/g, "/")}');exit"`, dir);
          if (res.error && /not found|ENOENT|matlab: command not found/i.test(res.error)) {
            // Octave fallback
            res = await runCmd(`octave --quiet --eval "run('${file.replace(/\\/g, "/")}')"`, dir);
            if (res.error) res.error = `MATLAB/Octave not available. ${res.error}`;
          }
          return res;
        }

        case "notebook": {
          // Execute .ipynb with jupyter nbconvert (Python kernel)
          const nbFile = writeTemp(dir, "notebook.ipynb", code);
          const cmd = `jupyter nbconvert --to notebook --execute --inplace "${nbFile}" --ExecutePreprocessor.timeout=60`;
          const res = await runCmd(cmd, dir);
          if (res.error) return { error: "Failed to execute notebook. Ensure Jupyter is installed. " + res.error };
          // Optionally return the executed notebook contents (could be large)
          const executed = fs.readFileSync(nbFile, "utf8");
          return { output: truncate(executed) };
        }

        case "r": {
          const file = writeTemp(dir, "snippet.R", code);
          return await runCmd(`Rscript "${file}"`, dir);
        }

        case "cpp": {
          const src = writeTemp(dir, filename || "main.cpp", code);
          const out = path.join(dir, "a.out");
          const compile = await runCmd(`g++ "${src}" -std=c++17 -O2 -o "${out}"`, dir);
          if (compile.error) return { error: "C++ compile error: " + compile.error };
          return await runCmd(`"${out}"`, dir);
        }

        case "csharp": {
          // Run with dotnet-script if available (global tool: dotnet tool install -g dotnet-script)
          const csx = writeTemp(dir, filename || "Program.csx", code);
          let res = await runCmd(`dotnet-script "${csx}"`, dir);
          if (res.error && /not found|ENOENT|command not found/i.test(res.error)) {
            // Try compile with csc if present
            const cs = writeTemp(dir, "Program.cs", code);
            const exe = path.join(dir, "Program.exe");
            const comp = await runCmd(`csc -nologo -out:"${exe}" "${cs}"`, dir);
            if (comp.error) return { error: "C# runner not found; install dotnet-script or csc. " + comp.error };
            res = await runCmd(`"${exe}"`, dir);
          }
          return res;
        }

        default:
          return { error: `Unsupported language: ${language}` };
      }
    } catch (e) {
      return { error: truncate(e?.message || String(e)) };
    } finally {
      // Best-effort cleanup; comment out if you want to inspect files for debugging
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  }
};

import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(500).json({ error: "Failed to parse form data." });
    }

    const topic = fields.topic?.[0];
    const template = fields.template?.[0];
    const filePath = files.file?.[0]?.filepath;

    if (!topic || !template || !filePath) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const fileUpload = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: "user_data",
      });

      const response = await openai.responses.create({
        model: "gpt-5",
        prompt: {
          content: template,
          variables: {
            topic,
            reference_pdf: {
              type: "input_file",
              file_id: fileUpload.id,
            },
          },
        },
      });

      res.status(200).json({ response: response.output_text });
    } catch (error) {
      console.error("❌ OpenAI error:", error);
      res.status(500).json({ error: "Failed to generate response." });
    }
  });
}

import fs from "fs";
import OpenAI from "openai";
const client = new OpenAI();

// Upload a PDF we will reference in the prompt variables
const file = await client.files.create({
    file: fs.createReadStream("draconomicon.pdf"),
    purpose: "user_data",
});

const response = await client.responses.create({
    model: "gpt-5",
    prompt: {
        id: "pmpt_abc123",
        variables: {
            topic: "Dragons",
            reference_pdf: {
                type: "input_file",
                file_id: file.id,
            },
        },
    },
});

console.log(response.output_text);

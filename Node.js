import Replicate from "replicate";
const replicate = new Replicate();

console.log("Running the model...");
const [output] = await replicate.run(
  "black-forest-labs/flux-schnell",
  {
    input: {
      prompt: "An astronaut riding a rainbow unicorn, cinematic, dramatic",
    },
  }
);

// Save the generated image
import { writeFile } from "node:fs/promises";

await writeFile("./output.png", output);
console.log("Image saved as output.png");

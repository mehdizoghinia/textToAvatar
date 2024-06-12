const express = require('express');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import cors

const app = express();
const port = 3001;

const apiKey = 'sk-proj-i0KeNpUZHRKZ05XfhcK4T3BlbkFJcXXZBSx6t34hCeQBtX7j';  // Replace with your actual API key
const openai = new OpenAI({ apiKey });

app.use(bodyParser.json());
app.use(cors());  // Use cors middleware

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Serve static files from the 'output' directory
app.use('/output', express.static(outputDir));

app.post('/generate-audio', async (req, res) => {
  const { text } = req.body;

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: text,
      format: 'ogg',  // Specify the desired format as OGG

    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const fileName = `output-${Date.now()}.ogg`;  // Use .ogg extension
    const filePath = path.resolve(outputDir, fileName);
    console.log('filePath', filePath);
    await fs.promises.writeFile(filePath, buffer);

    res.json({ url: `/output/${fileName}` });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).send('Failed to generate audio');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
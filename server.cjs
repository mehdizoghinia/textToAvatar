const express = require('express'); // Import the Express library
const fs = require('fs'); // Import the File System module
const path = require('path'); // Import the Path module
const OpenAI = require('openai'); // Import the OpenAI library
const bodyParser = require('body-parser'); // Import the Body-Parser middleware
const cors = require('cors');  // Import the CORS middleware

const app = express(); // Create an Express application
const port = 3001; // Define the port number

const apiKey = 'sk-proj-i0KeNpUZHRKZ05XfhcK4T3BlbkFJcXXZBSx6t34hCeQBtX7j';  // Replace with your actual API key
const openai = new OpenAI({ apiKey }); // Initialize OpenAI with the API key

app.use(bodyParser.json()); // Use Body-Parser to parse JSON requests
app.use(cors());  // Use CORS middleware to allow cross-origin requests

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'output'); // Define the output directory path
if (!fs.existsSync(outputDir)) { // Check if the directory does not exist
  fs.mkdirSync(outputDir, { recursive: true }); // Create the directory
}

// Serve static files from the 'output' directory
app.use('/output', express.static(outputDir)); // Serve files from the output directory

app.post('/generate-audio', async (req, res) => { // Define a POST route for generating audio
  const { text } = req.body; // Extract text from the request body

  try {
    const mp3 = await openai.audio.speech.create({ // Generate audio using OpenAI
      model: "tts-1-hd", // Specify the model
      voice: "nova", // Specify the voice
      input: text, // Provide the input text
      format: 'ogg',  // Specify the desired format as OGG
    });

    const buffer = Buffer.from(await mp3.arrayBuffer()); // Convert the audio data to a buffer
    const fileName = `output-${Date.now()}.ogg`;  // Generate a file name with a timestamp
    const filePath = path.resolve(outputDir, fileName); // Resolve the file path
    console.log('filePath', filePath); // Log the file path
    await fs.promises.writeFile(filePath, buffer); // Write the buffer to a file

    res.json({ url: `/output/${fileName}` }); // Respond with the URL of the generated file
  } catch (error) {
    console.error('Error generating audio:', error); // Log any errors
    res.status(500).send('Failed to generate audio'); // Respond with a failure message
  }
});

app.listen(port, () => { // Start the server
  console.log(`Server listening at http://localhost:${port}`); // Log the server start message
});

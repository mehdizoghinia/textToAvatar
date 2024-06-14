const express = require('express'); // Import the Express library
const fs = require('fs'); // Import the File System module
const path = require('path'); // Import the Path module
const OpenAI = require('openai'); // Import the OpenAI library
const bodyParser = require('body-parser'); // Import the Body-Parser middleware
const cors = require('cors');  // Import the CORS middleware
const multer = require('multer'); // Import Multer for handling file uploads
const fetch = require('node-fetch'); // Import node-fetch to make HTTP requests

const app = express(); // Create an Express application
const port = 3001; // Define the port number

const apiKey = 'API_KEY';  // Replace with your actual API key
const openai = new OpenAI({ apiKey }); // Initialize OpenAI with the API key

app.use(bodyParser.json()); // Use Body-Parser to parse JSON requests
app.use(cors());  // Use CORS middleware to allow cross-origin requests

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the output directory path
const outputDir = path.join(__dirname, 'output'); 

// Check if the directory does not exist and create it if it doesn't
if (!fs.existsSync(outputDir)) { 
  fs.mkdirSync(outputDir, { recursive: true }); 
  console.log('Output directory created:', outputDir);
} else {
  console.log('Output directory already exists:', outputDir);
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

app.post('/transcribe-audio', upload.single('audio'), async (req, res) => {
  const audioBuffer = req.file.buffer; // Get the audio buffer from the uploaded file

  const boundary = 'BoUnDaRy'; // Define the boundary string
  const formDataBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${req.file.originalname}"\r\nContent-Type: ${req.file.mimetype}\r\n\r\n`),
    audioBuffer,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}--\r\n`),
  ]);

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formDataBody,
    });

    if (!response.ok) {
      throw new Error(`Error transcribing audio: ${response.statusText}`);
    }

    const transcription = await response.json();
    res.json({ text: transcription.text }); // Respond with the transcribed text
  } catch (error) {
    console.error('Error transcribing audio:', error); // Log any errors
    res.status(500).send('Failed to transcribe audio'); // Respond with a failure message
  }
});

app.listen(port, () => { // Start the server
  console.log(`Server listening at http://localhost:${port}`); // Log the server start message
});

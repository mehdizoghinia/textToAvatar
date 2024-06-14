import React, { useState, useEffect, useRef } from "react"; // Import React and hooks from the React library
import { Canvas } from "@react-three/fiber"; // Import Canvas component from the react-three/fiber library
import "./App.css"; // Import the App.css file for styling
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"; // Import styles for chat UI kit

// Import components from the chat UI kit
import {
  MainContainer,
  ChatContainer,
  MessageList,
  MessageInput,
  TypingIndicator,
  Message,
} from "@chatscope/chat-ui-kit-react";

import { Experience } from "./components/Experience"; // Import the Experience component

// Define the OpenAI API key
const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

function App() {
  // State to track if the chatbot is typing
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);

  // State to manage chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      message:
        "Hi There, I'm Isabelle and I'd love to help you with your homework today",
      sender: "ChatGPT",
    },
  ]);

  // State to manage the audio URL
  const [audioUrl, setAudioUrl] = useState(null);

  // State to track user interaction
  const [userInteracted, setUserInteracted] = useState(false);

  // State to manage recording status
  const [isRecording, setIsRecording] = useState(false);

  // Ref to manage MediaRecorder
  const mediaRecorderRef = useRef(null);

  // Initial TTS message
  useEffect(() => {
    const playInitialMessage = async () => {
      // Function to play the initial TTS message
      await handleGenerateAudio("Hi There");
    };

    if (userInteracted) {
      // Check if the user has interacted
      playInitialMessage(); // Play the initial message
    }
  }, [userInteracted]); // Dependency array to run effect on user interaction

  useEffect(() => {
    if (audioUrl && userInteracted) {
      // Check if audio URL is available and user interacted
      const audio = new Audio(audioUrl); // Create a new Audio object
      audio.play(); // Play the audio
    }
  }, [audioUrl, userInteracted]); // Dependency array to run effect on audio URL or user interaction

  const handleUserMessage = async (userMessage) => {
    // Handle user message
    const newUserMessage = {
      message: userMessage,
      sender: "user",
      direction: "outgoing",
    };

    const updatedChatMessages = [...chatMessages, newUserMessage]; // Update chat messages
    setChatMessages(updatedChatMessages); // Set the updated chat messages

    setIsChatbotTyping(true); // Set chatbot typing state

    await processUserMessageToChatGPT(updatedChatMessages); // Process the user message with ChatGPT
  };

  async function processUserMessageToChatGPT(messages) {
    // Process user message with ChatGPT
    const apiMessages = messages.map((messageObject) => {
      let role = messageObject.sender === "ChatGPT" ? "assistant" : "user"; // Determine the role
      return { role: role, content: messageObject.message }; // Return message object
    });

    const systemMessage = {
      role: "system",
      content: "You are a helpful teacher.",
    };

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages], // Prepare request body
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY, // Set authorization header
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody), // Send the request
    });

    const data = await response.json(); // Parse the response
    console.log("data", data); // Log the data
    const botMessage = data.choices[0].message.content; // Extract the bot message

    setChatMessages([
      ...messages,
      {
        message: botMessage,
        sender: "ChatGPT",
      },
    ]);

    setIsChatbotTyping(false); // Reset chatbot typing state

    handleGenerateAudio(botMessage); // Generate audio for the bot message
  }

  const handleGenerateAudio = async (text) => {
    // Function to generate audio
    try {
      const response = await fetch("http://localhost:3001/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }), // Send the text to generate audio
      });

      if (response.ok) {
        const data = await response.json(); // Parse the response
        setAudioUrl(`http://localhost:3001${data.url}`); // Set the audio URL
      } else {
        console.error("Failed to generate audio"); // Log error if any
      }
    } catch (error) {
      console.error("Error:", error); // Log error if any
    }
  };

  const handleUserInteraction = () => {
    // Handle user interaction
    setUserInteracted(true); // Set user interaction state
  };

  const handleStartRecording = () => {
    // Function to start recording
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream); // Create a new MediaRecorder
      mediaRecorderRef.current = mediaRecorder; // Set the MediaRecorder ref
      mediaRecorder.start(); // Start recording
      setIsRecording(true); // Set recording state to true

      const audioChunks = []; // Array to store audio chunks
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data); // Push audio data to chunks
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" }); // Create a Blob from audio chunks
        handleTranscribeAudio(audioBlob); // Transcribe the audio
      };
    });
  };

  const handleStopRecording = () => {
    // Function to stop recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the MediaRecorder
      setIsRecording(false); // Set recording state to false
    }
  };

  const handleTranscribeAudio = async (audioBlob) => {
    // Function to transcribe audio
    const formData = new FormData(); // Create a new FormData object
    formData.append("audio", audioBlob, "audio.wav"); // Append the audio Blob with a filename

    try {
      const response = await fetch("http://localhost:3001/transcribe-audio", {
        method: "POST",
        body: formData, // Send the form data
      });

      if (response.ok) {
        const data = await response.json(); // Parse the response
        const transcribedMessage = data.text; // Extract the transcribed text

        const newUserMessage = {
          message: transcribedMessage,
          sender: "user",
          direction: "outgoing",
        };

        const updatedChatMessages = [...chatMessages, newUserMessage]; // Add the transcribed message to chat
        setChatMessages(updatedChatMessages); // Set the updated chat messages

        setIsChatbotTyping(true); // Set chatbot typing state

        await processUserMessageToChatGPT(updatedChatMessages); // Process the transcribed message with ChatGPT
      } else {
        console.error("Failed to transcribe audio"); // Log error if any
      }
    } catch (error) {
      console.error("Error:", error); // Log error if any
    }
  };

  return (
    <div className="app">
      {!userInteracted && ( // Display interaction overlay if user has not interacted
        <div className="interaction-overlay">
          <button onClick={handleUserInteraction}>Start</button>{" "}
          {/* Button to start interaction */}
        </div>
      )}
      <div className="canvas-container">
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
          {" "}
          {/* Setup Canvas */}
          <color attach="background" args={["#ececec"]} />
          <Experience audioUrl={audioUrl} />{" "}
          {/* Include Experience component */}
        </Canvas>
      </div>
      <div className="chat-container">
        <MainContainer>
          <ChatContainer>
            <MessageList
              className="message-list"
              typingIndicator={
                isChatbotTyping ? (
                  <TypingIndicator content="Teacher is responding" /> // Typing indicator
                ) : null
              }
            >
              {chatMessages.map((message, i) => (
                <Message
                  key={i}
                  model={{
                    message: message.message,
                    sentTime: "just now",
                    sender: message.sender === "ChatGPT" ? "ChatGPT" : "You",
                    direction:
                      message.sender === "ChatGPT" ? "incoming" : "outgoing",
                  }}
                />
              ))}
            </MessageList>
            <MessageInput
              placeholder="Type Message here"
              onSend={handleUserMessage} // Handle message input
            />
          </ChatContainer>
        </MainContainer>
      </div>
      <div className="recording-controls">
        {isRecording ? (
          <button onClick={handleStopRecording}>Stop Recording</button>
        ) : (
          <button onClick={handleStartRecording}>Start Recording</button>
        )}
      </div>
    </div>
  );
}

export default App; // Export the App component as default

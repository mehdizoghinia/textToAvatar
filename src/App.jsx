import React, { useState, useEffect } from "react"; // Import React and hooks
import { Canvas } from "@react-three/fiber"; // Import Canvas from react-three/fiber
import "./App.css"; // Import the CSS file
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"; // Import chat UI kit styles
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react"; // Import chat UI kit components
import { Experience } from "./components/Experience"; // Import the Experience component

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // Use Vite's way to access environment variables

function App() {
  const [isChatbotTyping, setIsChatbotTyping] = useState(false); // State to track if the chatbot is typing
  const [chatMessages, setChatMessages] = useState([
    // State to manage chat messages
    {
      message:
        "Hi There, I'm Isabelle and I'd love to help you with your homework today",
      sender: "ChatGPT",
    },
  ]);
  const [audioUrl, setAudioUrl] = useState(null); // State to manage the audio URL
  const [userInteracted, setUserInteracted] = useState(false); // State to track user interaction

  // Initial TTS message
  useEffect(() => {
    const playInitialMessage = async () => {
      // Function to play the initial TTS message
      await handleGenerateAudio(
        "Hi There, I'm Isabelle and I'd love to help you with your homework today"
      );
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
    setChatMessages(updatedChatMessages);

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
              {chatMessages.map(
                (
                  message,
                  i // Map through chat messages
                ) => (
                  <div
                    key={i}
                    className={`message ${
                      message.sender === "ChatGPT"
                        ? "message-incoming"
                        : "message-outgoing"
                    }`}
                  >
                    {message.message}
                  </div>
                )
              )}
            </MessageList>
            <MessageInput
              placeholder="Type Message here"
              onSend={handleUserMessage} // Handle message input
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;

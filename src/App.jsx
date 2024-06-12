import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { Experience } from "./components/Experience";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // Use Vite's way to access environment variables

function App() {
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      message: "Hello, I am ChatGPT!",
      sender: "ChatGPT",
    },
  ]);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleUserMessage = async (userMessage) => {
    const newUserMessage = {
      message: userMessage,
      sender: "user",
      direction: "outgoing",
    };

    const updatedChatMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedChatMessages);

    setIsChatbotTyping(true);

    await processUserMessageToChatGPT(updatedChatMessages);
  };

  async function processUserMessageToChatGPT(messages) {
    const apiMessages = messages.map((messageObject) => {
      let role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
      return { role: role, content: messageObject.message };
    });

    const systemMessage = {
      role: "system",
      content: "You are a helpful assistant.",
    };

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    });

    const data = await response.json();
    const botMessage = data.choices[0].message.content;

    setChatMessages([
      ...messages,
      {
        message: botMessage,
        sender: "ChatGPT",
      },
    ]);

    setIsChatbotTyping(false);

    handleGenerateAudio(botMessage);
  }

  const handleGenerateAudio = async (text) => {
    try {
      const response = await fetch("http://localhost:3001/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        setAudioUrl(`http://localhost:3001${data.url}`);
      } else {
        console.error("Failed to generate audio");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
          <color attach="background" args={["#ececec"]} />
          <Experience audioUrl={audioUrl} />
        </Canvas>
      </div>
      <div className="chat-container">
        <MainContainer>
          <ChatContainer>
            <MessageList
              className="message-list"
              typingIndicator={
                isChatbotTyping ? (
                  <TypingIndicator content="ChatGPT is thinking" />
                ) : null
              }
            >
              {chatMessages.map((message, i) => (
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
              ))}
            </MessageList>
            <MessageInput
              placeholder="Type Message here"
              onSend={handleUserMessage}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;

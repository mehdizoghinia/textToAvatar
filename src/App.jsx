import { Canvas } from "@react-three/fiber"; // Importing the Canvas component from react-three/fiber for rendering 3D content.
import { Experience } from "./components/Experience"; // Importing the Experience component which contains the 3D scene setup.
import React, { useState } from "react"; // Importing React and useState hook for managing component state.
import "./App.css"; // Importing the CSS file for styling.

function App() {
  const [text, setText] = useState(""); // State to manage the input text.
  const [audioUrl, setAudioUrl] = useState(null); // State to manage the generated audio URL.

  // Function to handle the generation of audio based on the input text.
  const handleGenerateAudio = async () => {
    try {
      const response = await fetch("http://localhost:3001/generate-audio", {
        method: "POST", // HTTP method set to POST.
        headers: {
          "Content-Type": "application/json", // Setting the content type to JSON.
        },
        body: JSON.stringify({ text }), // Sending the input text as the request body.
      });

      if (response.ok) {
        // Checking if the response status is OK.
        const data = await response.json(); // Parsing the JSON response.
        setAudioUrl(`http://localhost:3001${data.url}`); // Setting the audio URL state with the received URL.
      } else {
        console.error("Failed to generate audio"); // Logging an error if the response is not OK.
      }
    } catch (error) {
      console.error("Error:", error); // Logging any caught errors.
    }
  };

  return (
    <div
      className="app"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f0f0f0",
      }}
    >
      <div
        className="controls"
        style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
      >
        <input
          type="text" // Input type set to text.
          value={text} // Binding the input value to the text state.
          onChange={(e) => setText(e.target.value)} // Updating the text state on input change.
          placeholder="Enter text" // Placeholder text for the input field.
          style={{
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "300px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
        <button
          onClick={handleGenerateAudio}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          Generate Audio
        </button>
      </div>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience audioUrl={audioUrl} />
      </Canvas>
    </div>
  );
}

export default App; // Exporting the App component as default export.

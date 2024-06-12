import { Environment, OrbitControls, useTexture } from "@react-three/drei"; // Import hooks and components from drei
import { useThree } from "@react-three/fiber"; // Import useThree hook
import { Avatar } from "./Avatar"; // Import the Avatar component

export const Experience = ({ audioUrl }) => {
  const texture = useTexture("textures/class.jpg"); // Load a texture for the background
  const viewport = useThree((state) => state.viewport); // Access the viewport state for dimensions

  return (
    <>
      <OrbitControls enableZoom={false} enableRotate={false} />{" "}
      {/* Disable zoom and rotation */}
      <Avatar position={[0, -2.5, 5]} scale={2} audioUrl={audioUrl} />{" "}
      {/* Add the Avatar component */}
      <Environment preset="sunset" />{" "}
      {/* Set up the environment with a sunset preset for lighting */}
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />{" "}
        {/* Define the geometry of the plane */}
        <meshBasicMaterial map={texture} />{" "}
        {/* Apply the loaded texture to the plane */}
      </mesh>
    </>
  );
};

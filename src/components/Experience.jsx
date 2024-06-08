import { Environment, OrbitControls, useTexture } from "@react-three/drei"; // Importing helper components from react-three/drei for 3D scene.
import { useThree } from "@react-three/fiber"; // Importing useThree hook to access three.js state.
import { Avatar } from "./Avatar"; // Importing the Avatar component which contains the 3D model.

export const Experience = ({ audioUrl }) => {
  const texture = useTexture("textures/youtubeBackground.jpg"); // Loading a texture for the background.
  const viewport = useThree((state) => state.viewport); // Accessing the viewport state for dimensions.

  return (
    <>
      <OrbitControls />{" "}
      {/* Adding orbit controls to allow the user to interact with the 3D scene */}
      <Avatar position={[0, -3, 5]} scale={2} audioUrl={audioUrl} />{" "}
      {/* Adding the Avatar component with position, scale, and audio URL */}
      <Environment preset="sunset" />{" "}
      {/* Setting up the environment with a sunset preset for lighting */}
      <mesh>
        {" "}
        {/* Creating a mesh for the background plane */}
        <planeGeometry args={[viewport.width, viewport.height]} />{" "}
        {/* Defining the geometry of the plane with viewport dimensions */}
        <meshBasicMaterial map={texture} />{" "}
        {/* Applying the loaded texture to the plane */}
      </mesh>
    </>
  );
};

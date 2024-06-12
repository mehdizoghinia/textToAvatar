import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";

export const Experience = ({ audioUrl }) => {
  const texture = useTexture("textures/class.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <OrbitControls />
      <Avatar position={[0, -2.5, 5]} scale={2} audioUrl={audioUrl} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};

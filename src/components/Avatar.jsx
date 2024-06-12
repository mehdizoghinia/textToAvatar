import { useAnimations, useFBX, useGLTF } from "@react-three/drei"; // Importing necessary hooks and components from drei.
import { useFrame } from "@react-three/fiber"; // Importing hooks from react-three/fiber for frame updates and loaders.
import React, { useEffect, useRef, useState } from "react"; // Importing React and necessary hooks.
import * as THREE from "three"; // Importing THREE.js library.
import lipsync from "../pizzas.json"; // Importing the lipsync JSON data.

const corresponding = {
  // Mapping for visemes.
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar({ audioUrl, ...props }) {
  const [audio, setAudio] = useState(null); // State to manage the audio object.
  const [animation, setAnimation] = useState("Idle"); // State to manage the current animation.
  const [smoothMorphTarget] = useState(true); // State for smooth morph target (optional control).
  const [morphTargetSmoothing] = useState(0.5); // State for morph target smoothing value.

  const { nodes, materials } = useGLTF("/models/66675be5be9733f54c3c164f.glb"); // Load the GLTF model.
  const { animations: idleAnimation } = useFBX("/animations/Idle.fbx"); // Load the Idle animation.
  const { animations: greetingAnimation } = useFBX("/animations/Talking.fbx"); // Load the Greeting animation.

  // Name the animations for easier reference.
  idleAnimation[0].name = "Idle";
  greetingAnimation[0].name = "Talking";

  const group = useRef(); // Ref to manage the group of objects.
  const { actions } = useAnimations(
    [idleAnimation[0], greetingAnimation[0]],
    group
  ); // Load the animations into actions.

  console.log("actions", actions);

  useEffect(() => {
    // Effect to handle playing the audio and setting animation.
    if (audioUrl) {
      const newAudio = new Audio(audioUrl); // Creating a new Audio object.
      setAudio(newAudio); // Setting the new Audio object in state.
      newAudio.play(); // Playing the audio.
      setAnimation("Talking");
    } else {
      setAnimation("Idle");
    }
  }, [audioUrl]);

  useEffect(() => {
    // Effect to play the current animation.
    if (actions && actions[animation]) {
      actions[animation].reset().play();
      return () => actions[animation].fadeOut(0.5);
    } else {
      console.error(`Animation "${animation}" not found.`);
    }
  }, [animation, actions]);

  useFrame((state) => {
    // Frame-by-frame update for head follow.
    if (group.current) {
      group.current.getObjectByName("Head").lookAt(state.camera.position);
    }
  });

  useEffect(() => {
    // Effect to handle changes in the audio.
    if (audio) {
      audio.play();
    }
  }, [audio]);

  useFrame(() => {
    // Frame-by-frame update function.
    if (!audio) return; // If no audio is set, return early.
    const currentAudioTime = audio.currentTime; // Get the current time of the audio.
    if (audio.paused || audio.ended) {
      // If audio is paused or ended, set animation to idle.
      setAnimation("Idle");
      return;
    }

    Object.values(corresponding).forEach((value) => {
      // Reset morph target influences.
      if (!smoothMorphTarget) {
        nodes.Wolf3D_Head.morphTargetInfluences[
          nodes.Wolf3D_Head.morphTargetDictionary[value]
        ] = 0;
        nodes.Wolf3D_Teeth.morphTargetInfluences[
          nodes.Wolf3D_Teeth.morphTargetDictionary[value]
        ] = 0;
      } else {
        nodes.Wolf3D_Head.morphTargetInfluences[
          nodes.Wolf3D_Head.morphTargetDictionary[value]
        ] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[value]
          ],
          0,
          morphTargetSmoothing
        );

        nodes.Wolf3D_Teeth.morphTargetInfluences[
          nodes.Wolf3D_Teeth.morphTargetDictionary[value]
        ] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[value]
          ],
          0,
          morphTargetSmoothing
        );
      }
    });

    for (let i = 0; i < lipsync.mouthCues.length; i++) {
      // Iterate through lipsync data to update morph targets.
      const mouthCue = lipsync.mouthCues[i];
      if (
        currentAudioTime >= mouthCue.start &&
        currentAudioTime <= mouthCue.end
      ) {
        if (!smoothMorphTarget) {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = 1;
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = 1;
        } else {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[
                corresponding[mouthCue.value]
              ]
            ],
            1,
            morphTargetSmoothing
          );
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[
                corresponding[mouthCue.value]
              ]
            ],
            1,
            morphTargetSmoothing
          );
        }

        break;
      }
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("/models/66675be5be9733f54c3c164f.glb");

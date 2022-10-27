import * as THREE from "three";
import React, { Suspense, useRef, useState, useMemo } from "react";
import styled from "@emotion/styled";
import { Canvas } from "@react-three/fiber";
import {
  Sky,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from "@react-three/drei";
import { useControls, folder } from "leva";
import Color from "color";

import Text from "./Text";
import { RandBird, BIRDS } from "./Bird";

import Sticky from "./Sticky";
import PinArrow from "./Sticky/Sticky.pin.arrow";
import PinCamera from "./Sticky/Sticky.pin.camera";

function Jumbo({ color }) {
  const ref = useRef();
  // useFrame(({ clock }) => (ref.current.rotation.x = ref.current.rotation.y = ref.current.rotation.z = Math.sin(clock.getElapsedTime()) * 0.3))

  const base = Color(color);

  const color1 = base.darken(0.3);
  const color2 = base.darken(0.2);
  const color3 = base.darken(0.1);

  return (
    <group ref={ref}>
      <Text
        color={color1.toString()}
        hAlign="right"
        position={[-12, 6.5, 0]}
        children="LOOK"
        frustumCulled={false}
      />
      <Text
        color={color2.toString()}
        hAlign="right"
        position={[-12, 0, 0]}
        children="THIS"
        frustumCulled={false}
      />
      <Text
        color={color3.toString()}
        hAlign="right"
        position={[-12, -6.5, 0]}
        children="BIRD"
        frustumCulled={false}
      />
    </group>
  );
}

const Pins = {
  camera: PinCamera,
  arrow: PinArrow,
};

const levaBirdsInstancesFolderName = "birds";

export default function App() {
  const initials = {
    numbirds: 1,
    bird: BIRDS[0],
    speed: 1,
    factor: 0.5,
    rotY: 0,
    fov: 50,
    aabb: false,
    text: "#567238",
  };

  const { numbirds, bird, speed, factor, rotY, fov, aabb, Pin, text } =
    useControls({
      [levaBirdsInstancesFolderName]: folder({
        numbirds: {
          value: initials.numbirds,
          min: 0,
          step: 1,
        },
        bird: {
          value: initials.bird,
          options: BIRDS,
        },
        speed: {
          value: initials.speed,
          min: 0,
          max: 4,
        },
        factor: {
          value: initials.factor,
          min: 0,
          max: 3,
        },
        rotY: {
          value: initials.rotY,
          min: 0,
          max: 2 * Math.PI,
          // render: (get) => get(`${levaBirdsInstancesFolderName}.factor`) === 0
        },
      }),

      fov: {
        value: initials.fov,
        min: 0,
        max: 300,
      },

      aabb: initials.aabb,
      Pin: { options: Object.keys(Pins) },
      text: initials.text,
    });
  // console.log('main gui', gui)

  const states = {
    bird,
    speed,
    factor,
    rotY,
  };
  // console.log('states=', states)

  return (
    <App.Styled>
      <Canvas
      // linear={false}
      //
      >
        <Stats />
        <group>
          <PerspectiveCamera makeDefault position-z={50} fov={fov} />

          <Suspense fallback={null}>
            <Jumbo color={text} />
            {/* <Birds /> */}
            {new Array(numbirds).fill().map((el, i) => {
              // special initial position for the first bird (others are random)
              const pos = i === 0 ? { x: 35, y: 0, z: 0 } : {};

              return (
                <Sticky
                  key={i}
                  debug={aabb}
                  Pin={Pins[Pin]}
                  //
                >
                  <RandBird
                    {...pos}
                    bird={bird}
                    speed={speed}
                    factor={factor}
                    rotY={i === 0 ? 0 : undefined}
                    // collapsed={i === 0 ? false : true}
                    levaParentFolder={levaBirdsInstancesFolderName}
                    name={`bird#${i}`}
                    states={states}
                    //
                  />
                </Sticky>
              );
            })}

            <Sky />
            {/* <Environment preset="city" /> */}

            <OrbitControls />
          </Suspense>

          <ambientLight intensity={2} />
          <pointLight position={[40, 40, 40]} />
        </group>
      </Canvas>
    </App.Styled>
  );
}
App.Styled = styled.div`
  position: fixed;
  inset: 0;
`;

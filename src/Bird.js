import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils'

// import { SkeletonUtils } from 'three-stdlib'
import { useLoader, useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'

import { useControls, folder } from 'leva'

import { useSticky } from './Sticky'

const BIRDS = ['Stork', 'Parrot', 'Flamingo']
export { BIRDS }

function rand(min = 0, max = 1) {
  return min + Math.random() * (max - min)
}

//
// This component was auto-generated from GLTF by: https://github.com/react-spring/gltfjsx
//
function Bird({ speed, factor, url, rotY, ...props }) {
  const Sticky = useSticky()
  // const { animations, scene } = useLoader(GLTFLoader, url)
  const { animations, scene } = useGLTF(url)

  // https://codesandbox.io/s/gltf-animations-re-used-forked-r94i1n?file=/src/Model.js:520-532 (@see: https://discord.com/channels/740090768164651008/740093168770613279/1033017786705924297)
  const sceneCopy = useMemo(() => clone(scene), [scene]) //
  const { nodes, materials } = useGraph(sceneCopy)
  const { ref: group } = useAnimations(animations)

  const mesh = useRef()
  const [start] = useState(() => Math.random() * 5000)
  const mixer = useMemo(() => new THREE.AnimationMixer(sceneCopy), [sceneCopy])
  useEffect(() => void mixer.clipAction(animations[0], group.current).play(), [mixer, animations])

  const sceneRef = useRef()

  useFrame((state, delta) => {
    // mesh.current.position.y = Math.sin(start + state.clock.elapsedTime) * 5
    // mesh.current.rotation.x = Math.PI / 2 + (Math.sin(start + state.clock.elapsedTime) * Math.PI) / 10
    // mesh.current.rotation.y = (Math.sin(start + state.clock.elapsedTime) * Math.PI) / 2
    // group.current.rotation.y += Math.sin((delta * factor) / 2) * Math.cos((delta * factor) / 2) * 1.5
    // group.current.rotation.y += delta * factor
    if (factor !== 0) {
      group.current.rotation.y += delta * factor
    } else {
      group.current.rotation.y = rotY
    }
    mixer.update(delta * speed)
    Sticky.update() // ME
  })

  return (
    <group ref={group} dispose={null}>
      <scene name="Scene" ref={sceneRef} {...props}>
        <mesh
          ref={mesh}
          scale={1.5}
          name="Object_0"
          morphTargetDictionary={nodes.Object_0.morphTargetDictionary}
          morphTargetInfluences={nodes.Object_0.morphTargetInfluences}
          rotation={[Math.PI / 2, 0, Math.PI]}
          geometry={nodes.Object_0.geometry}
          material={materials.Material_0_COLOR_0}
          frustumCulled={false}></mesh>
      </scene>
    </group>
  )
}

function RandBird(props) {
  const initials = {
    bird: props.bird ?? BIRDS[Math.round(Math.random() * 2)],
    position: [props.x ?? rand(20, 100), props.y ?? rand(-10, 10), props.z ?? rand(-5, 5)],
    rotation: [0, props.x > 0 ? Math.PI : 0, 0],
    speed: props.speed ?? (bird === 'Stork' ? 0.125 : bird === 'Flamingo' ? 0.25 : 2.5),
    factor: props.factor ?? (bird === 'Stork' ? 0.5 + Math.random() : bird === 'Flamingo' ? 0.25 + Math.random() : 1 + Math.random() - 0.5),
    rotY: props.rotY ?? rand(0, Math.PI)
  }
  // console.log('initials', initials)

  const { bird, position, rotation, speed, factor, rotY } = useControls(props.levaParentFolder, {
    [props.name]: folder(
      {
        bird: {
          value: initials.bird,
          options: BIRDS,
          optional: true,
          disabled: true
        },
        position: {
          value: initials.position,
          optional: true
        },
        speed: {
          value: initials.speed,
          min: 0,
          max: 4,
          optional: true,
          disabled: true
        },
        factor: {
          value: initials.factor,
          min: 0,
          max: 3,
          optional: true,
          disabled: true
        },
        rotY: {
          value: initials.rotY,
          min: 0,
          max: 2 * Math.PI,
          optional: true,
          disabled: true
          // render: (get) => get(`${props.levaParentFolder}.${props.name}.factor`) === 0
        }
      },
      {
        collapsed: props.collapsed
      }
    )
  })

  const s = speed === undefined ? props.states?.speed : speed
  // console.log('s=', s)

  const f = factor === undefined ? props.states?.factor : factor
  // console.log('f=', f)

  const r = rotY === undefined ? props.states?.rotY : rotY
  // console.log('r=', r)

  const b = bird === undefined ? props.states?.bird : bird
  // console.log('b=', b)

  return <Bird position={position} rotation={rotation} speed={s} factor={f} rotY={r} url={`${process.env.PUBLIC_URL}/${b}.glb`} />
}
RandBird.defaultProps = {
  collapsed: true
}

export default Bird
export { RandBird }

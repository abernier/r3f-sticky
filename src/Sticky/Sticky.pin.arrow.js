import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useSticky } from './Sticky'

function Pin() {
  const { values } = useSticky()
  const { vw, vh, x, y, theta, offscreen, bbox, bs, refs } = values

  // Stem triangle shape
  const attributeRef = useRef()
  const a = 1
  const k = 3
  const vertices = useMemo(() => new Float32Array([0, 0, 0, -k * a * vw, a * vw, 0, -k * a * vw, -a * vw, 0]), [vw, a])
  useLayoutEffect(() => {
    attributeRef.current.needsUpdate = true // update once vertices change (@see: https://codesandbox.io/s/dark-rain-xoxsck?file=/src/index.js)
  }, [vertices])

  return (
    <group
      position-x={(x * 100 * vw) / 2}
      position-y={(y * 100 * vh) / 2}
      rotation-z={theta}
      visible={offscreen}
      // onPointerOver={({ object }) => object.scale.set(2, 2, 2)}
      // onPointerOut={({ object }) => object.scale.set(1, 1, 1)}
      //
    >
      {/* <mesh>
        <planeGeometry args={[a * vw, a * vw]} />
        <meshBasicMaterial color={'green'} />
      </mesh> */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute ref={attributeRef} attach="attributes-position" array={vertices} count={vertices.length / 3} itemSize={3} />
        </bufferGeometry>
        <meshStandardMaterial attach="material" color="hotpink" />
      </mesh>
    </group>
  )
}

export default Pin

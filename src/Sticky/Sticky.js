import * as THREE from 'three'
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'

import PinArrow from './Sticky.pin.arrow'

const { degToRad, radToDeg, clamp } = THREE.MathUtils

const StickyContext = createContext()

function Sticky({ children, Pin, debug }) {
  const [bbox] = useState(new THREE.Box3())
  const [bs] = useState(new THREE.Sphere())
  const [projectedCenter] = useState(new THREE.Vector3())

  const { camera, scene } = useThree()

  const [values, setValues] = useState({})

  const containerRef = useRef(null)
  const pinRef = useRef(null)
  const debugRef = useRef(null)
  const cubeRef = useRef(null)
  const sphereRef = useRef(null)
  const boxHelperRef = useRef(null)

  function update() {
    // console.log('udpate')

    //
    // vw vh
    //

    let vh, vw
    if (camera.type === 'PerspectiveCamera') {
      vh = (2 * camera.near * Math.tan(degToRad(camera.fov / 2))) / 100
      vw = vh * camera.aspect
    } else if ('OrthographicCamera') {
      // console.log(camera.left, camera.right, camera.top, camera.bottom, camera.zoom)
      // vh = camera.top - camera.bottom
      // vw = camera.right - camera.left
    } else {
      console.log('not supported camera type')
    }
    // console.log('vw/vh=', vw, vh)

    //
    // bbox, bs
    //

    const { current: target } = containerRef
    target.updateWorldMatrix(true, true) // needed?
    bbox.setFromObject(target)

    bbox.getBoundingSphere(bs)
    // console.log('bs=', bs)

    //
    // x y theta
    //

    projectedCenter.copy(bs.center).project(camera)
    // console.log('projectedCenter=', projectedCenter)

    const theta = Math.atan2(projectedCenter.y, projectedCenter.x)
    // console.log('theta=', radToDeg(theta))

    // Visible only if offscreen
    const offscreen = Math.abs(projectedCenter.x) > 1 || Math.abs(projectedCenter.y) > 1
    // console.log('offscreen=', offscreen)

    let x, y, z
    x = clamp(projectedCenter.x, -1, 1)
    y = clamp(projectedCenter.y, -1, 1)
    // z = clamp(projectedCenter.z, -1, 1)

    //
    // debug
    //

    if (debug) {
      debugRef.current.position.copy(bs.center)
      sphereRef.current.scale.setScalar(bs.radius)
      boxHelperRef.current.update() // boxHelper.udpate()
    }

    setValues({
      vw,
      vh,
      x,
      y,
      theta,
      offscreen,
      bbox,
      bs,
      refs: {
        container: containerRef.current,
        debug: debugRef.current,
        pin: pinRef.current
      }
    })
  }

  useLayoutEffect(() => {
    // console.log('camera changed', camera.position.z)

    const { current: pin } = pinRef
    pin.position.z = -camera.near
    camera.add(pin)

    update()

    return () => camera.remove(pin)
  }, [camera])

  const value = {
    update,
    values
  }

  return (
    <StickyContext.Provider value={value}>
      <group ref={containerRef}>
        {debug && (
          <boxHelper
            ref={boxHelperRef}
            args={[, 0xff0000]}
            attach={(parent, self) => {
              // console.log('attach', parent, self)
              self.setFromObject(parent)
              scene.add(self)
              return () => scene.remove(self)
            }}
            name="Sticky__debug"
          />
        )}

        {children}
      </group>
      <group ref={pinRef} name="Sticky__pin">
        <Pin />
      </group>
      {debug && (
        <group ref={debugRef} name="Sticky__debug">
          <mesh ref={cubeRef} position={[0, 0, 0]}>
            <boxGeometry args={[2 * bs.radius, 2 * bs.radius, 2 * bs.radius]} />
            <meshBasicMaterial color="#000" wireframe />
          </mesh>
          <mesh ref={sphereRef} position={[0, 0, 0]}>
            <sphereGeometry args={[1]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.125} wireframe />
          </mesh>
        </group>
      )}
    </StickyContext.Provider>
  )
}

Sticky.defaultProps = {
  Pin: PinArrow,
  debug: false
}

export const useSticky = () => useContext(StickyContext)

export default Sticky

import * as THREE from 'three'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useControls, folder } from 'leva'
import { useFBO } from '@react-three/drei'

import { useSticky } from './Sticky'

function PinCamera() {
  const { values } = useSticky()
  const { vw, vh, x, y, theta, offscreen, bbox, bs, refs } = values
  // console.log('Pin', vw, vh, x, y, theta, distance, offscreen)

  const gui = useControls('PinCamera', {
    color: '#757d87',
    maxsize: { value: 7, optional: true, disabled: false },
    border: 0.05,
    offscreenOnly: false,
    crop: true,
    stem: false,
    opacity: {
      value: 0.5,
      min: 0,
      max: 1
    },
    options: folder(
      {
        segments: {
          value: 64,
          min: 12,
          max: 96,
          step: 16
        },
        follow: true,
        angularDiameter: false
      },
      { collapsed: true }
    )
  })

  // Stem triangle shape
  const attributeRef = useRef(null)
  const a = 2
  const vertices = useMemo(() => new Float32Array([0, 0, 0, -a * vw, a * vw, 0, -a * vw, -a * vw, 0]), [vw, a])
  useLayoutEffect(() => {
    if (!attributeRef.current) return
    attributeRef.current.needsUpdate = true // update once vertices change (@see: https://codesandbox.io/s/dark-rain-xoxsck?file=/src/index.js)
  }, [vertices])

  const { gl, scene, camera, size, viewport } = useThree()

  // WebGLRenderTarget
  const renderTarget = useFBO({
    multisample: true,
    stencilBuffer: false
  })

  const cam2 = useMemo(() => camera.clone(), [camera])
  useLayoutEffect(() => {
    // console.log('resize cam2')
    cam2.aspect = size.width / size.height
    cam2.updateProjectionMatrix()
  }, [size, cam2])

  const [kube] = useState(new THREE.Object3D())
  const [v1] = useState(new Vector3())
  const [v1_proj] = useState(new Vector3())
  const [h_proj] = useState({ val: 0 })

  useFrame(() => {
    if (gui.offscreenOnly && !offscreen) return // good optim

    // cam2.copy(camera)
    cam2.position.copy(camera.position)
    cam2.quaternion.copy(camera.quaternion)
    cam2.projectionMatrix.copy(camera.projectionMatrix)

    if (gui.follow) {
      cam2.lookAt(bs.center) // constantly lookAt the subject
    }
    // cam2.updateMatrix()
    cam2.updateMatrixWorld()
    // cam2.updateProjectionMatrix() // needed?

    const projectedCenter = bs.center.clone().project(cam2)
    // console.log('projectedCenter', projectedCenter)

    //
    // gl.render cam2 (to renderTarget)
    //
    // @see: https://codesandbox.io/embed/r3f-render-target-qgcrx
    gl.setRenderTarget(renderTarget)
    scene.traverse((o) => {
      if (o.name.startsWith('Sticky')) o.visible = false
    })
    gl.render(scene, cam2) // 📸
    scene.traverse((o) => {
      if (o.name.startsWith('Sticky')) o.visible = true
    })
    gl.setRenderTarget(null)

    //
    // Compute bounding sphere height (from cam2)
    //
    // @see: https://discourse.threejs.org/t/bounding-sphere-projected-height-on-screen/43225

    kube.position.copy(bs.center)
    kube.lookAt(cam2.position)

    if (gui.angularDiameter) {
      const D = bs.center.clone().sub(cam2.position).length()
      const delta = 2 * Math.asin(r / D)
      let gamma = Math.PI - delta / 2
      v1.set(0, bs.radius * Math.cos(gamma), bs.radius * Math.sin(gamma))
    } else {
      v1.set(0, bs.radius, 0)
    }

    v1.applyMatrix4(kube.matrixWorld)
    v1_proj.copy(v1).project(cam2)
    const h = v1_proj.sub(projectedCenter).divideScalar(2).length() * 2
    h_proj.val = h
    // console.log('h=', h)

    //
    // Crop renderTarget texture
    //
    // @see: https://github.com/mrdoob/three.js/issues/1847#issuecomment-5471295
    //

    if (gui.crop) {
      let width
      let height
      let dim = renderTarget.width > renderTarget.height ? 'height' : 'width' // wide => limited by renderTarget.height / tall => limited by renderTarget.width

      height = h * renderTarget[dim]
      height = Math.min(height, renderTarget[dim])
      width = height
      const left = (projectedCenter.x / 2 + 0.5) * renderTarget.width - width / 2
      // left = Math.max(left, 0)
      // left = Math.min(left, renderTarget.width - width)
      // console.log('left=', left)
      const top = (projectedCenter.y / 2 + 0.5) * renderTarget.height - height / 2
      // top = Math.max(top, 0)
      // top = Math.min(top, renderTarget.height - height)
      // console.log('top=', top)

      const tex = renderTarget.texture
      // console.log('tex', tex)
      tex.repeat.x = width / renderTarget.width
      tex.repeat.y = height / renderTarget.height
      tex.offset.x = (left / width) * tex.repeat.x
      tex.offset.y = (top / height) * tex.repeat.y
    } else {
      // default values
      const tex = renderTarget.texture
      tex.repeat.x = tex.repeat.y = 1
      tex.offset.x = tex.offset.y = 0
    }
  })

  // const r = gui.maxsize * vw
  // console.log('h_proj', h_proj.val * window.innerHeight)
  let r = (h_proj.val / 2) * 100 * vh
  if (gui.maxsize) {
    r = Math.min(r, gui.maxsize * vw)
  }

  const segments = gui.segments
  const pinColor = gui.color
  const opacity = { transparent: gui.opacity < 1, opacity: gui.opacity }
  return (
    <group>
      <group
        position-x={(x * 100 * vw) / 2}
        position-y={(y * 100 * vh) / 2}
        rotation-z={theta}
        visible={gui.offscreenOnly ? offscreen : true}
        // onPointerOver={({ object }) => object.scale.set(2, 2, 2)}
        // onPointerOut={({ object }) => object.scale.set(1, 1, 1)}
      >
        {/* <mesh position-y={r}>
        <boxGeometry args={[0.5 * vh, 0.5 * vh, 0]} />
        <meshBasicMaterial color={'green'} />
      </mesh> */}
        <mesh visible={gui.stem}>
          <bufferGeometry>
            <bufferAttribute ref={attributeRef} attach="attributes-position" array={vertices} count={vertices.length / 3} itemSize={3} />
          </bufferGeometry>
          <meshBasicMaterial color={pinColor} />
        </mesh>
        <group
          position-x={gui.stem ? -(r + 1 * vw) : 0}
          //
        >
          <mesh scale={1 + gui.border / gui.maxsize}>
            {/* Outer circle */}
            <circleGeometry args={[r, segments]} />
            <meshBasicMaterial color={pinColor} {...opacity} />
          </mesh>
          <group>
            <mesh
              rotation-z={-theta}
              //
            >
              {/* Render target circle */}
              <circleGeometry args={[r, segments]} />
              <meshBasicMaterial map={renderTarget.texture} toneMapped={false} {...opacity} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

export default PinCamera

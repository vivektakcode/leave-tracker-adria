'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ThreeJSBackgroundProps {
  className?: string
}

export default function ThreeJSBackground({ className = '' }: ThreeJSBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mountRef.current || typeof window === 'undefined' || hasError) return

    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let symbols: THREE.Sprite[] = []

    try {
      // Scene + Camera
      scene = new THREE.Scene()
      sceneRef.current = scene
      
      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.z = 20
      cameraRef.current = camera

      // Renderer (high-performance)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      rendererRef.current = renderer

      // Append canvas
      if (mountRef.current) mountRef.current.appendChild(renderer.domElement)

      // Loader - load currency PNGs from public folder
      const loader = new THREE.TextureLoader()
      const currencyFiles = [
        'dollar.png',
        'euro.png',
        'rupee.png',
        'pound.png',
        'yen.png',
        'dirham.png',
        'moroccan-dirham.png'
      ]

      // Colors / tints to give variety to the symbols
      const tints = [
        0x00f5ff, // cyan
        0xff7bd2, // pink
        0x9bff7b, // mint green
        0xffd66b, // gold
        0xaab6ff, // soft blue
        0xff8a5b, // orange-pink
        0xc77bff  // purple
      ]

      currencyFiles.forEach((file, i) => {
        const tex = loader.load(`/${file}`) // Load directly from public folder
        const color = new THREE.Color(tints[i % tints.length])

        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          color: color,
          opacity: 0.9
        })

        const sprite = new THREE.Sprite(mat)

        // Spread across a wide 3D volume
        sprite.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 35
        )

        // Scale variance
        const scale = Math.random() * 5 + 3
        sprite.scale.set(scale, scale, 1)

        // Animation metadata
        sprite.userData = {
          originalX: sprite.position.x,
          originalY: sprite.position.y,
          originalZ: sprite.position.z,
          speed: Math.random() * 0.6 + 0.15,
          amplitude: Math.random() * 2.5 + 0.8,
          rotationSpeed: Math.random() * 0.02 + 0.002,
          floatOffset: Math.random() * 1000
        }

        // Make certain symbols slightly brighter
        if (i % 3 === 0) {
          (mat as THREE.SpriteMaterial).color = color.multiplyScalar(1.4)
        }

        if (scene) scene.add(sprite)
        symbols.push(sprite)
      })

      // Add ambient light for better visibility
      if (scene) scene.add(new THREE.AmbientLight(0xffffff, 0.8))

      // Set background color
      renderer.setClearColor(0x071226, 0)

      // Animation
      const animate = () => {
        try {
          if (!scene || !camera || !renderer) return
          const time = Date.now() * 0.001

          symbols.forEach((s, idx) => {
            const d = s.userData
            // float motion
            s.position.y = d.originalY + Math.sin(time * d.speed + d.floatOffset) * d.amplitude
            s.position.x = d.originalX + Math.cos(time * d.speed * 0.6 + idx) * (d.amplitude * 0.6)
            s.position.z = d.originalZ + Math.cos(time * d.speed * 0.4 + idx * 0.7) * (d.amplitude * 0.8)
            // rotate slowly for parallax effect
            s.material.rotation += d.rotationSpeed
            // gentle pulsing via scale
            const pulse = 1.0 + Math.sin(time * (d.speed * 0.8) + idx) * 0.08
            s.scale.setScalar((s.scale.x || 1) * pulse)
          })

          // Slow camera drift
          camera.position.x = Math.sin(time * 0.08) * 2.5
          camera.position.y = Math.cos(time * 0.06) * 1.6
          camera.lookAt(0, 0, 0)

          renderer.render(scene, camera)
          animationIdRef.current = requestAnimationFrame(animate)
        } catch (err) {
          console.error('Animation error', err)
          setHasError(true)
          if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        }
      }

      animate()

      // Mouse parallax (optional subtle interaction)
      let mouseX = 0, mouseY = 0
      const onMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1
      }
      window.addEventListener('mousemove', onMove)

      // Resize handler
      const onResize = () => {
        if (!renderer || !camera) return
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      // Cleanup
      return () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('resize', onResize)
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        if (mountRef.current && renderer?.domElement) {
          try { mountRef.current.removeChild(renderer.domElement) } catch {}
        }
        renderer?.dispose()
        // Clear refs
        sceneRef.current = null
        cameraRef.current = null
        rendererRef.current = null
        symbols = []
      }
    } catch (err) {
      console.error('Three.js init error', err)
      setHasError(true)
    }
  }, [isClient, hasError])

  if (!isClient || hasError) {
    return (
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #071226 0%, #0b2440 100%)'
        }}
      />
    )
  }

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #071226 0%, #0b2440 100%)' }}
    />
  )
}

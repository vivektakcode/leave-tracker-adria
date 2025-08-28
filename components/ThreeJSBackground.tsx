'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ThreeJSBackgroundProps {
  className?: string
}

export default function ThreeJSBackground({ className = '' }: ThreeJSBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
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
      // Simple scene setup
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.z = 15

      // Simple renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0xffffff, 0) // White background, transparent

      // Append canvas
      if (mountRef.current) mountRef.current.appendChild(renderer.domElement)

      // Load currency symbols
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

      // Simple, subtle colors
      const colors = [
        0x4a90e2, // soft blue
        0x7ed321, // soft green
        0xf5a623, // soft orange
        0xbd10e0, // soft purple
        0xe74c3c, // soft red
        0x1abc9c, // soft teal
        0x9b59b6  // soft violet
      ]

      // Create small, simple currency symbols
      currencyFiles.forEach((file, i) => {
        const texture = loader.load(`/${file}`)
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.6, // Subtle opacity
          color: new THREE.Color(colors[i % colors.length])
        })

        const sprite = new THREE.Sprite(material)
        
        // Small size
        sprite.scale.set(1.5, 1.5, 1)
        
        // Spread across screen
        sprite.position.set(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20
        )

        // Simple animation data
        sprite.userData = {
          originalX: sprite.position.x,
          originalY: sprite.position.y,
          originalZ: sprite.position.z,
          speed: Math.random() * 0.3 + 0.1, // Very slow
          amplitude: Math.random() * 1.0 + 0.5 // Small movement
        }

        if (scene) scene.add(sprite)
        symbols.push(sprite)
      })

      // Simple animation
      const animate = () => {
        try {
          if (!scene || !camera || !renderer) return
          
          const time = Date.now() * 0.0003 // Very slow

          symbols.forEach((symbol, index) => {
            const data = symbol.userData
            
            // Very gentle floating
            symbol.position.x = data.originalX + Math.sin(time * data.speed + index) * data.amplitude
            symbol.position.y = data.originalY + Math.cos(time * data.speed + index * 0.5) * data.amplitude
            symbol.position.z = data.originalZ + Math.sin(time * data.speed * 0.3 + index * 0.3) * (data.amplitude * 0.5)
          })

          // Minimal camera movement
          camera.position.x = Math.sin(time * 0.05) * 0.5
          camera.position.y = Math.cos(time * 0.04) * 0.3
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

      // Simple resize handler
      const onResize = () => {
        if (!renderer || !camera) return
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', onResize)
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        if (mountRef.current && renderer?.domElement) {
          try { mountRef.current.removeChild(renderer.domElement) } catch {}
        }
        renderer?.dispose()
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
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      />
    )
  }

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}
    />
  )
}

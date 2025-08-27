'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeJSBackgroundProps {
  className?: string
}

export default function ThreeJSBackground({ className = '' }: ThreeJSBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement)

    // Create floating dots
    const dots: THREE.Mesh[] = []
    const dotCount = 50
    const dotGeometry = new THREE.SphereGeometry(0.02, 8, 6)
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf97316, // Orange color
      transparent: true,
      opacity: 0.6
    })

    for (let i = 0; i < dotCount; i++) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone())
      
      // Random position
      dot.position.x = (Math.random() - 0.5) * 20
      dot.position.y = (Math.random() - 0.5) * 20
      dot.position.z = (Math.random() - 0.5) * 10
      
      // Random scale
      const scale = Math.random() * 0.5 + 0.5
      dot.scale.set(scale, scale, scale)
      
      // Store original position for animation
      dot.userData = {
        originalX: dot.position.x,
        originalY: dot.position.y,
        originalZ: dot.position.z,
        speed: Math.random() * 0.02 + 0.01,
        rotationSpeed: Math.random() * 0.02 + 0.01
      }
      
      dots.push(dot)
      scene.add(dot)
    }

    // Add some larger accent dots
    const accentDots: THREE.Mesh[] = []
    const accentCount = 8
    const accentGeometry = new THREE.SphereGeometry(0.04, 12, 8)
    const accentMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xea580c, // Darker orange
      transparent: true,
      opacity: 0.4
    })

    for (let i = 0; i < accentCount; i++) {
      const dot = new THREE.Mesh(accentGeometry, accentMaterial.clone())
      
      dot.position.x = (Math.random() - 0.5) * 15
      dot.position.y = (Math.random() - 0.5) * 15
      dot.position.z = (Math.random() - 0.5) * 8
      
      const scale = Math.random() * 0.8 + 0.6
      dot.scale.set(scale, scale, scale)
      
      dot.userData = {
        originalX: dot.position.x,
        originalY: dot.position.y,
        originalZ: dot.position.z,
        speed: Math.random() * 0.015 + 0.008,
        rotationSpeed: Math.random() * 0.015 + 0.008
      }
      
      accentDots.push(dot)
      scene.add(dot)
    }

    // Animation loop
    const animate = () => {
      const time = Date.now() * 0.001

      // Animate dots
      dots.forEach((dot, index) => {
        const data = dot.userData
        const speed = data.speed
        const rotationSpeed = data.rotationSpeed
        
        // Floating motion
        dot.position.x = data.originalX + Math.sin(time * speed + index) * 0.5
        dot.position.y = data.originalY + Math.cos(time * speed + index * 0.5) * 0.5
        dot.position.z = data.originalZ + Math.sin(time * speed * 0.7 + index * 0.3) * 0.3
        
        // Rotation
        dot.rotation.x += rotationSpeed
        dot.rotation.y += rotationSpeed * 0.7
        
        // Subtle opacity variation
        const opacity = 0.4 + Math.sin(time * 2 + index) * 0.2
        ;(dot.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, opacity)
      })

      // Animate accent dots
      accentDots.forEach((dot, index) => {
        const data = dot.userData
        const speed = data.speed
        const rotationSpeed = data.rotationSpeed
        
        // Slower, more elegant motion
        dot.position.x = data.originalX + Math.sin(time * speed * 0.5 + index) * 0.8
        dot.position.y = data.originalY + Math.cos(time * speed * 0.6 + index * 0.7) * 0.8
        dot.position.z = data.originalZ + Math.sin(time * speed * 0.4 + index * 0.5) * 0.5
        
        // Rotation
        dot.rotation.x += rotationSpeed * 0.5
        dot.rotation.y += rotationSpeed * 0.3
        
        // Subtle opacity variation
        const opacity = 0.3 + Math.sin(time * 1.5 + index) * 0.15
        ;(dot.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, opacity)
      })

      // Rotate camera slightly for dynamic feel
      camera.position.x = Math.sin(time * 0.1) * 0.5
      camera.position.y = Math.cos(time * 0.1) * 0.3
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!renderer || !camera) return
      
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    />
  )
} 
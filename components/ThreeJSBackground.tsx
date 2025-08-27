'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ThreeJSBackgroundProps {
  className?: string
}

export default function ThreeJSBackground({ className = '' }: ThreeJSBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Ensure component only runs on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Don't run Three.js on server side or if there's an error
    if (!isClient || !mountRef.current || typeof window === 'undefined' || hasError) return

    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let dots: THREE.Mesh[] = []
    let accentDots: THREE.Mesh[] = []
    let lines: THREE.Line[] = []
    let particles: THREE.Points[] = []

    try {
      // Scene setup
      scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera setup - wider field of view for better coverage
      camera = new THREE.PerspectiveCamera(
        60, // Wider field of view
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      camera.position.z = 8 // Moved back for better coverage

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      rendererRef.current = renderer

      // Add renderer to DOM
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement)
      }

      // Create floating dots with better distribution and visibility
      const dotCount = 120 // Significantly increased dot count
      const dotGeometry = new THREE.SphereGeometry(0.03, 16, 12) // Larger, more detailed dots
      
      // Create simple solid orange material (no glossy effects)
      const solidOrangeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xf97316, // Orange color
        transparent: false,
        opacity: 1.0, // Fully opaque
      })

      for (let i = 0; i < dotCount; i++) {
        const dot = new THREE.Mesh(dotGeometry, solidOrangeMaterial.clone())
        
        // Better distribution across the entire viewport
        dot.position.x = (Math.random() - 0.5) * 35
        dot.position.y = (Math.random() - 0.5) * 35
        dot.position.z = (Math.random() - 0.5) * 18
        
        // Random scale - make them more varied and visible
        const scale = Math.random() * 1.5 + 1.0
        dot.scale.set(scale, scale, scale)
        
        // Store original position for animation
        dot.userData = {
          originalX: dot.position.x,
          originalY: dot.position.y,
          originalZ: dot.position.z,
          speed: Math.random() * 0.05 + 0.03, // Faster movement
          rotationSpeed: Math.random() * 0.04 + 0.03, // Faster rotation
          amplitude: Math.random() * 2.0 + 1.0, // Larger movement amplitude
          pulseSpeed: Math.random() * 2.5 + 1.5, // Individual pulse speed
        }
        
        dots.push(dot)
        if (scene) scene.add(dot)
      }

      // Add larger accent dots for visual interest
      const accentCount = 25 // More accent dots
      const accentGeometry = new THREE.SphereGeometry(0.06, 20, 16) // Much larger accent dots
      
      // Create simple solid darker orange material for accent dots
      const solidDarkOrangeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xea580c, // Darker orange
        transparent: false,
        opacity: 1.0, // Fully opaque
      })

      for (let i = 0; i < accentCount; i++) {
        const dot = new THREE.Mesh(accentGeometry, solidDarkOrangeMaterial.clone())
        
        // Distribute accent dots across the entire viewport
        dot.position.x = (Math.random() - 0.5) * 30
        dot.position.y = (Math.random() - 0.5) * 30
        dot.position.z = (Math.random() - 0.5) * 15
        
        const scale = Math.random() * 2.0 + 1.5 // Larger scale
        dot.scale.set(scale, scale, scale)
        
        dot.userData = {
          originalX: dot.position.x,
          originalY: dot.position.y,
          originalZ: dot.position.z,
          speed: Math.random() * 0.025 + 0.015, // Faster movement
          rotationSpeed: Math.random() * 0.03 + 0.02, // Faster rotation
          amplitude: Math.random() * 1.8 + 1.2,
          pulseSpeed: Math.random() * 2.0 + 1.0,
        }
        
        accentDots.push(dot)
        if (scene) scene.add(dot)
      }

      // Add some connecting lines between nearby dots for sophistication
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xf97316, 
        transparent: false, 
        opacity: 1.0 // Fully opaque lines
      })

      // Create connections between some dots
      for (let i = 0; i < dots.length; i += 1.5) {
        if (i + 1 < dots.length && dots[i] && dots[i + 1]) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            dots[i].position,
            dots[i + 1].position
          ])
          const line = new THREE.Line(geometry, lineMaterial)
          lines.push(line)
          if (scene) scene.add(line)
        }
      }

      // Add floating particles for extra visual interest
      const particleCount = 200 // Increased particle count
      const particleGeometry = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(particleCount * 3)
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 45
        particlePositions[i + 1] = (Math.random() - 0.5) * 45
        particlePositions[i + 2] = (Math.random() - 0.5) * 25
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xfb923c, // Lighter orange
        size: 0.025, // Larger particles
        transparent: false,
        opacity: 1.0, // Fully opaque
        sizeAttenuation: true
      })
      
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
      particles.push(particleSystem)
      if (scene) scene.add(particleSystem)

      // Add simple lighting (minimal for basic materials)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      if (scene) scene.add(ambientLight)

      // Animation loop
      const animate = () => {
        try {
          // Check if component is still mounted and scene exists
          if (!mountRef.current || !scene || !camera || !renderer) {
            return
          }

          const time = Date.now() * 0.001

          // Animate dots with faster, more dynamic movement and pulsing
          dots.forEach((dot, index) => {
            if (!dot || !dot.userData || !dot.material || !dot.position) return
            
            const data = dot.userData
            const speed = data.speed
            const rotationSpeed = data.rotationSpeed
            const amplitude = data.amplitude
            const pulseSpeed = data.pulseSpeed
            
            // More dynamic floating motion
            dot.position.x = data.originalX + Math.sin(time * speed * 2.0 + index) * amplitude
            dot.position.y = data.originalY + Math.cos(time * speed * 1.8 + index * 0.8) * amplitude
            dot.position.z = data.originalZ + Math.sin(time * speed * 1.0 + index * 0.4) * (amplitude * 0.7)
            
            // Faster rotation
            dot.rotation.x += rotationSpeed * 2.0
            dot.rotation.y += rotationSpeed * 1.5
            
            // Dynamic pulsing effect for visibility
            const pulse = 1.0 + Math.sin(time * pulseSpeed + index) * 0.4
            dot.scale.setScalar(pulse)
          })

          // Animate accent dots with faster movement and pulsing
          accentDots.forEach((dot, index) => {
            if (!dot || !dot.userData || !dot.material || !dot.position) return
            
            const data = dot.userData
            const speed = data.speed
            const rotationSpeed = data.rotationSpeed
            const amplitude = data.amplitude
            const pulseSpeed = data.pulseSpeed
            
            // Faster, more elegant motion
            dot.position.x = data.originalX + Math.sin(time * speed * 2.5 + index) * amplitude
            dot.position.y = data.originalY + Math.cos(time * speed * 2.2 + index * 1.0) * amplitude
            dot.position.z = data.originalZ + Math.sin(time * speed * 1.5 + index * 0.7) * (amplitude * 0.8)
            
            // Faster rotation
            dot.rotation.x += rotationSpeed * 1.8
            dot.rotation.y += rotationSpeed * 1.2
            
            // Dynamic pulsing effect
            const pulse = 1.2 + Math.sin(time * pulseSpeed + index) * 0.6
            dot.scale.setScalar(pulse)
          })

          // Animate connecting lines
          lines.forEach((line, index) => {
            if (!line || !line.geometry || !line.geometry.attributes.position) return
            
            if (index % 2 === 0) {
              const positions = line.geometry.attributes.position.array as Float32Array
              if (positions && positions.length >= 6) {
                // Subtle line animation
                positions[0] += Math.sin(time * 0.8 + index) * 0.015
                positions[1] += Math.cos(time * 0.8 + index) * 0.015
                line.geometry.attributes.position.needsUpdate = true
              }
            }
          })

          // Animate particle system
          particles.forEach((particleSystem, index) => {
            if (!particleSystem || !particleSystem.geometry || !particleSystem.geometry.attributes.position) return
            
            const positions = particleSystem.geometry.attributes.position.array as Float32Array
            if (positions) {
              for (let i = 0; i < positions.length; i += 3) {
                positions[i] += Math.sin(time * 0.5 + i) * 0.003
                positions[i + 1] += Math.cos(time * 0.5 + i) * 0.003
              }
              particleSystem.geometry.attributes.position.needsUpdate = true
            }
          })



          // More dynamic camera movement for sophisticated feel
          if (camera) {
            camera.position.x = Math.sin(time * 0.2) * 1.5
            camera.position.y = Math.cos(time * 0.15) * 1.2
            camera.lookAt(0, 0, 0)
          }

          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }
          
          // Continue animation only if component is still mounted
          if (mountRef.current) {
            animationIdRef.current = requestAnimationFrame(animate)
          }
        } catch (error) {
          console.error('Three.js animation error:', error)
          setHasError(true)
          // Stop animation on error
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
          }
        }
      }

      animate()

      // Handle resize
      const handleResize = () => {
        if (!renderer || !camera) return
        
        try {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        } catch (error) {
          console.error('Three.js resize error:', error)
        }
      }

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        try {
          window.removeEventListener('resize', handleResize)
          
          // Cancel animation frame
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
            animationIdRef.current = null
          }
          
          // Remove renderer from DOM
          if (mountRef.current && renderer && renderer.domElement) {
            try {
              mountRef.current.removeChild(renderer.domElement)
            } catch (e) {
              // Element might already be removed
            }
          }
          
          // Dispose of Three.js objects
          if (renderer) {
            renderer.dispose()
          }
          
          // Clear arrays
          dots = []
          accentDots = []
          lines = []
          particles = []
          
          // Clear refs
          sceneRef.current = null
          rendererRef.current = null
          
        } catch (error) {
          console.error('Three.js cleanup error:', error)
        }
      }
    } catch (error) {
      console.error('Three.js initialization error:', error)
      setHasError(true)
    }
  }, [isClient, hasError]) // Add hasError as dependency

  // Don't render anything until client-side
  if (!isClient) {
    return (
      <div 
        className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      />
    )
  }

  // If there's an error, fall back to simple background
  if (hasError) {
    return (
      <div 
        className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      />
    )
  }

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
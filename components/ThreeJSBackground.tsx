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

  // Ensure component only runs on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Don't run Three.js on server side
    if (!isClient || !mountRef.current || typeof window === 'undefined') return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup - wider field of view for better coverage
    const camera = new THREE.PerspectiveCamera(
      60, // Wider field of view
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 8 // Moved back for better coverage

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

    // Create floating dots with better distribution and visibility
    const dots: THREE.Mesh[] = []
    const dotCount = 120 // Significantly increased dot count
    const dotGeometry = new THREE.SphereGeometry(0.03, 16, 12) // Larger, more detailed dots
    
    // Create glass-like material with shine
    const glassMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf97316, // Orange color
      transparent: true,
      opacity: 0.9, // Very visible
      shininess: 100, // High shine
      specular: 0xffffff, // White specular highlight
      emissive: 0x331100, // Subtle glow
    })

    for (let i = 0; i < dotCount; i++) {
      const dot = new THREE.Mesh(dotGeometry, glassMaterial.clone())
      
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
        shineSpeed: Math.random() * 3 + 2 // Individual shine speed
      }
      
      dots.push(dot)
      scene.add(dot)
    }

    // Add larger accent dots for visual interest
    const accentDots: THREE.Mesh[] = []
    const accentCount = 25 // More accent dots
    const accentGeometry = new THREE.SphereGeometry(0.06, 20, 16) // Much larger accent dots
    
    // Create premium glass material for accent dots
    const premiumGlassMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xea580c, // Darker orange
      transparent: true,
      opacity: 0.95, // Very visible
      shininess: 150, // Maximum shine
      specular: 0xffffff, // Bright white specular
      emissive: 0x442200, // Stronger glow
    })

    for (let i = 0; i < accentCount; i++) {
      const dot = new THREE.Mesh(accentGeometry, premiumGlassMaterial.clone())
      
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
        shineSpeed: Math.random() * 2.5 + 1.5
      }
      
      accentDots.push(dot)
      scene.add(dot)
    }

    // Add some connecting lines between nearby dots for sophistication
    const lines: THREE.Line[] = []
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xf97316, 
      transparent: true, 
      opacity: 0.5 // More visible lines
    })

    // Create connections between some dots
    for (let i = 0; i < dots.length; i += 1.5) {
      if (i + 1 < dots.length) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          dots[i].position,
          dots[i + 1].position
        ])
        const line = new THREE.Line(geometry, lineMaterial)
        lines.push(line)
        scene.add(line)
      }
    }

    // Add floating particles for extra visual interest
    const particles: THREE.Points[] = []
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
      transparent: true,
      opacity: 0.8, // More visible
      sizeAttenuation: true
    })
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    particles.push(particleSystem)
    scene.add(particleSystem)

    // Add lighting for glass effects
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xf97316, 1, 100)
    pointLight.position.set(0, 0, 10)
    scene.add(pointLight)

    // Animation loop
    const animate = () => {
      try {
        const time = Date.now() * 0.001

        // Animate dots with faster, more dynamic movement and pulsing
        dots.forEach((dot, index) => {
          if (!dot || !dot.userData || !dot.material) return
          
          const data = dot.userData
          const speed = data.speed
          const rotationSpeed = data.rotationSpeed
          const amplitude = data.amplitude
          const pulseSpeed = data.pulseSpeed
          const shineSpeed = data.shineSpeed
          
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
          
          // Dynamic shine effect
          const shine = 0.8 + Math.sin(time * shineSpeed + index) * 0.2
          if (dot.material && 'shininess' in dot.material) {
            (dot.material as THREE.MeshPhongMaterial).shininess = 80 + shine * 50
          }
          
          // Dynamic opacity variation
          const opacity = 0.7 + Math.sin(time * 4 + index) * 0.2
          if (dot.material && 'opacity' in dot.material) {
            (dot.material as THREE.MeshPhongMaterial).opacity = Math.max(0.5, opacity)
          }
        })

        // Animate accent dots with faster movement and pulsing
        accentDots.forEach((dot, index) => {
          if (!dot || !dot.userData || !dot.material) return
          
          const data = dot.userData
          const speed = data.speed
          const rotationSpeed = data.rotationSpeed
          const amplitude = data.amplitude
          const pulseSpeed = data.pulseSpeed
          const shineSpeed = data.shineSpeed
          
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
          
          // Dynamic shine effect
          const shine = 0.9 + Math.sin(time * shineSpeed + index) * 0.3
          if (dot.material && 'shininess' in dot.material) {
            (dot.material as THREE.MeshPhongMaterial).shininess = 100 + shine * 80
          }
          
          // Dynamic opacity variation
          const opacity = 0.6 + Math.sin(time * 3.5 + index) * 0.3
          if (dot.material && 'opacity' in dot.material) {
            (dot.material as THREE.MeshPhongMaterial).opacity = Math.max(0.4, opacity)
          }
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

        // Animate lights for dynamic shine
        if (pointLight && directionalLight) {
          pointLight.position.x = Math.sin(time * 0.3) * 15
          pointLight.position.y = Math.cos(time * 0.3) * 15
          directionalLight.position.x = Math.sin(time * 0.2) * 20
          directionalLight.position.y = Math.cos(time * 0.2) * 20
        }

        // More dynamic camera movement for sophisticated feel
        camera.position.x = Math.sin(time * 0.2) * 1.5
        camera.position.y = Math.cos(time * 0.15) * 1.2
        camera.lookAt(0, 0, 0)

        if (renderer && scene && camera) {
          renderer.render(scene, camera)
        }
        
        animationIdRef.current = requestAnimationFrame(animate)
      } catch (error) {
        console.error('Three.js animation error:', error)
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

    // Cleanup
    return () => {
      try {
        window.removeEventListener('resize', handleResize)
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        if (renderer) {
          renderer.dispose()
        }
      } catch (error) {
        console.error('Three.js cleanup error:', error)
      }
    }
  }, [isClient]) // Add isClient as dependency

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
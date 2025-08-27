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
    const dotCount = 60 // Reduced for better performance with larger dots
    const dotGeometry = new THREE.SphereGeometry(0.025, 12, 8) // Larger, more detailed dots
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf97316, // Orange color
      transparent: true,
      opacity: 0.8 // Much more visible
    })

    for (let i = 0; i < dotCount; i++) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone())
      
      // Better distribution across the entire viewport
      dot.position.x = (Math.random() - 0.5) * 30
      dot.position.y = (Math.random() - 0.5) * 30
      dot.position.z = (Math.random() - 0.5) * 15
      
      // Random scale - make them more varied and visible
      const scale = Math.random() * 1.2 + 0.8
      dot.scale.set(scale, scale, scale)
      
      // Store original position for animation
      dot.userData = {
        originalX: dot.position.x,
        originalY: dot.position.y,
        originalZ: dot.position.z,
        speed: Math.random() * 0.04 + 0.02, // Faster movement
        rotationSpeed: Math.random() * 0.03 + 0.02, // Faster rotation
        amplitude: Math.random() * 1.5 + 0.5, // Random movement amplitude
        pulseSpeed: Math.random() * 2 + 1 // Individual pulse speed
      }
      
      dots.push(dot)
      scene.add(dot)
    }

    // Add larger accent dots for visual interest
    const accentDots: THREE.Mesh[] = []
    const accentCount = 15 // More accent dots
    const accentGeometry = new THREE.SphereGeometry(0.045, 16, 10) // Much larger accent dots
    const accentMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xea580c, // Darker orange
      transparent: true,
      opacity: 0.7 // More visible
    })

    for (let i = 0; i < accentCount; i++) {
      const dot = new THREE.Mesh(accentGeometry, accentMaterial.clone())
      
      // Distribute accent dots across the entire viewport
      dot.position.x = (Math.random() - 0.5) * 25
      dot.position.y = (Math.random() - 0.5) * 25
      dot.position.z = (Math.random() - 0.5) * 12
      
      const scale = Math.random() * 1.5 + 1.0 // Larger scale
      dot.scale.set(scale, scale, scale)
      
      dot.userData = {
        originalX: dot.position.x,
        originalY: dot.position.y,
        originalZ: dot.position.z,
        speed: Math.random() * 0.025 + 0.015, // Faster movement
        rotationSpeed: Math.random() * 0.02 + 0.015, // Faster rotation
        amplitude: Math.random() * 1.2 + 0.8,
        pulseSpeed: Math.random() * 1.5 + 0.8
      }
      
      accentDots.push(dot)
      scene.add(dot)
    }

    // Add some connecting lines between nearby dots for sophistication
    const lines: THREE.Line[] = []
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xf97316, 
      transparent: true, 
      opacity: 0.3 // More visible lines
    })

    // Create connections between some dots
    for (let i = 0; i < dots.length; i += 2) {
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

    // Add some floating particles for extra visual interest
    const particles: THREE.Points[] = []
    const particleCount = 100
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 40
      particlePositions[i + 1] = (Math.random() - 0.5) * 40
      particlePositions[i + 2] = (Math.random() - 0.5) * 20
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xfb923c, // Lighter orange
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    })
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    particles.push(particleSystem)
    scene.add(particleSystem)

    // Animation loop
    const animate = () => {
      const time = Date.now() * 0.001

      // Animate dots with faster, more dynamic movement and pulsing
      dots.forEach((dot, index) => {
        const data = dot.userData
        const speed = data.speed
        const rotationSpeed = data.rotationSpeed
        const amplitude = data.amplitude
        const pulseSpeed = data.pulseSpeed
        
        // More dynamic floating motion
        dot.position.x = data.originalX + Math.sin(time * speed * 1.5 + index) * amplitude
        dot.position.y = data.originalY + Math.cos(time * speed * 1.2 + index * 0.7) * amplitude
        dot.position.z = data.originalZ + Math.sin(time * speed * 0.8 + index * 0.3) * (amplitude * 0.6)
        
        // Faster rotation
        dot.rotation.x += rotationSpeed * 1.5
        dot.rotation.y += rotationSpeed * 1.0
        
        // Dynamic pulsing effect for visibility
        const pulse = 0.8 + Math.sin(time * pulseSpeed + index) * 0.3
        dot.scale.setScalar(pulse)
        
        // Dynamic opacity variation
        const opacity = 0.6 + Math.sin(time * 3 + index) * 0.2
        ;(dot.material as THREE.MeshBasicMaterial).opacity = Math.max(0.4, opacity)
      })

      // Animate accent dots with faster movement and pulsing
      accentDots.forEach((dot, index) => {
        const data = dot.userData
        const speed = data.speed
        const rotationSpeed = data.rotationSpeed
        const amplitude = data.amplitude
        const pulseSpeed = data.pulseSpeed
        
        // Faster, more elegant motion
        dot.position.x = data.originalX + Math.sin(time * speed * 2 + index) * amplitude
        dot.position.y = data.originalY + Math.cos(time * speed * 1.8 + index * 0.9) * amplitude
        dot.position.z = data.originalZ + Math.sin(time * speed * 1.2 + index * 0.6) * (amplitude * 0.7)
        
        // Faster rotation
        dot.rotation.x += rotationSpeed * 1.2
        dot.rotation.y += rotationSpeed * 0.8
        
        // Dynamic pulsing effect
        const pulse = 1.0 + Math.sin(time * pulseSpeed + index) * 0.4
        dot.scale.setScalar(pulse)
        
        // Dynamic opacity variation
        const opacity = 0.5 + Math.sin(time * 2.5 + index) * 0.2
        ;(dot.material as THREE.MeshBasicMaterial).opacity = Math.max(0.3, opacity)
      })

      // Animate connecting lines
      lines.forEach((line, index) => {
        if (index % 3 === 0) {
          const positions = line.geometry.attributes.position.array as Float32Array
          if (positions.length >= 6) {
            // Subtle line animation
            positions[0] += Math.sin(time * 0.5 + index) * 0.01
            positions[1] += Math.cos(time * 0.5 + index) * 0.01
            line.geometry.attributes.position.needsUpdate = true
          }
        }
      })

      // Animate particle system
      particles.forEach((particleSystem, index) => {
        const positions = particleSystem.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(time * 0.3 + i) * 0.002
          positions[i + 1] += Math.cos(time * 0.3 + i) * 0.002
        }
        particleSystem.geometry.attributes.position.needsUpdate = true
      })

      // More dynamic camera movement for sophisticated feel
      camera.position.x = Math.sin(time * 0.15) * 1.0
      camera.position.y = Math.cos(time * 0.12) * 0.8
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
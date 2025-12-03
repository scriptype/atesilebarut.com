import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x1a1a1a)
document.querySelector('.container').appendChild(renderer.domElement)

camera.position.x = -20.67
camera.position.y = 18.08
camera.position.z = 22.91
camera.lookAt(2.51, 6.23, -3.26)

// Lighting
const ambientLight = new THREE.AmbientLight(0xFF69B4, 1.2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xFF69B4, 0.7)
directionalLight.position.set(0, 20, 0)
scene.add(directionalLight)

const leftLight = new THREE.DirectionalLight(0x00FFFF, 0.6)
leftLight.position.set(-20, 10, 0)
scene.add(leftLight)

const rightLight = new THREE.DirectionalLight(0xFF0000, 0.6)
rightLight.position.set(20, 10, 0)
scene.add(rightLight)

const bottomLight = new THREE.DirectionalLight(0x0000FF, 0.5)
bottomLight.position.set(-40, 30, 30)
scene.add(bottomLight)

const cameraLight = new THREE.DirectionalLight(0xFFFFFF, 0.4)
cameraLight.position.set(0, -15, 0)
scene.add(cameraLight)

const leftCameraLight = new THREE.DirectionalLight(0xFFFF00, 0.3)
leftCameraLight.position.set(-40, 18, 20)
scene.add(leftCameraLight)

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.target.set(2.51, 6.23, -3.26)
controls.update()

// Load FBX
const loader = new FBXLoader()
loader.load('baslik.fbx', (fbx) => {
    scene.add(fbx)

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(fbx)
    const center = box.getCenter(new THREE.Vector3())
    fbx.position.sub(center)

    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 50 / maxDim
    fbx.scale.multiplyScalar(scale)

    // Make materials double-sided and opaque, preserve existing textures
    fbx.traverse((child) => {
        if (child.isMesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.side = THREE.DoubleSide
                    if (mat.transparent) {
                        mat.transparent = false
                    }
                    mat.opacity = 1
                })
            } else if (child.material) {
                child.material.side = THREE.DoubleSide
                if (child.material.transparent) {
                    child.material.transparent = false
                }
                child.material.opacity = 1
            } else {
                child.material = new THREE.MeshPhongMaterial({ color: 0x888888 })
                child.material.side = THREE.DoubleSide
            }
        }
    })

    // Find the Ates meshes
    const atesMeshes = []
    let baslikParent = null
    fbx.traverse((child) => {
        if (child.name === 'Empty_Baslık_Ekranı') {
            baslikParent = child
        }
    })

    if (baslikParent) {
        // First, hide all children with Ates in the name
        baslikParent.traverse((child) => {
            if (child.name.startsWith('Ates_')) {
                child.visible = false
            }
        })

        // Then find and collect the Ates meshes
        for (let i = 1; i <= 11; i++) {
            const meshName = `Ates_${String(i).padStart(2, '0')}`
            baslikParent.traverse((child) => {
                if (child.name === meshName) {
                    atesMeshes.push({ name: meshName, mesh: child })
                }
            })
        }
        atesMeshes.sort((a, b) => parseInt(a.name.slice(-2)) - parseInt(b.name.slice(-2)))
    }

    // Show only the first Ates mesh
    if (atesMeshes.length > 0) {
        atesMeshes[0].mesh.visible = true
    }

    // Find the Misket meshes
    const misketMeshes = []
    let misketParent = null
    fbx.traverse((child) => {
        if (child.name === 'Empty_Misket_Anim') {
            misketParent = child
        }
    })

    if (misketParent) {
        // First, hide all children with Misket in the name
        misketParent.traverse((child) => {
            if (child.name.startsWith('Misket_')) {
                child.visible = false
            }
        })

        // Then find and collect the Misket meshes dynamically
        misketParent.traverse((child) => {
            if (child.name.startsWith('Misket_') && child.isMesh) {
                misketMeshes.push({ name: child.name, mesh: child })
            }
        })
        misketMeshes.sort((a, b) => parseInt(a.name.slice(-2)) - parseInt(b.name.slice(-2)))
    }

    // Show only the first Misket mesh
    if (misketMeshes.length > 0) {
        misketMeshes[0].mesh.visible = true
    }

    // Find the Goz meshes
    const gozMeshes = []
    let gozParent = null

    fbx.traverse((child) => {
        if (child.name === 'Empty_Barut_Goz_Anim') {
            gozParent = child
        }
    })

    if (gozParent) {
        // First, hide all children with Goz in the name
        gozParent.traverse((child) => {
            if (child.name.startsWith('Goz_')) {
                child.visible = false
            }
        })

        // Then find and collect the Goz meshes dynamically
        gozParent.traverse((child) => {
            if (child.name.startsWith('Goz_') && child.isMesh) {
                gozMeshes.push({ name: child.name, mesh: child })
            }
        })
        gozMeshes.sort((a, b) => parseInt(a.name.slice(-2)) - parseInt(b.name.slice(-2)))
    }

    // Show only the first Goz mesh
    if (gozMeshes.length > 0) {
        gozMeshes[0].mesh.visible = true
    }

    // Animation for cycling through meshes
    let atesIndex = 0
    let misketIndex = 0
    let gozIndex = 0
    let lastMeshSwitchTime = -100
    let gozCycleStartTime = -100
    const meshVisibilityDuration = 1000 / 24

    // Goz blink animation: double blink, wait, single blink, wait, repeat
    // Pattern: open, blink1, open, blink2, open (long), blink3, open (very long)
    const gozBlinkDurations = [
        600,  // Goz_01: open after first blink
        180,  // Blink cycle (02-03-04)
        100,  // Goz_01: brief open between blinks
        180,  // Blink cycle
        1200, // Goz_01: long open
        180,  // Blink cycle
        1500  // Goz_01: long open before repeat
    ]
    const gozBlinkMeshes = [0, 0, 0, 0, 0, 0, 0] // Which mesh to show at each stage
    const gozTotalCycleDuration = gozBlinkDurations.reduce((a, b) => a + b, 0)

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate)
        const now = performance.now()

        // Animate Ates and Misket meshes at 24fps
        if (now - lastMeshSwitchTime >= meshVisibilityDuration) {
            // Animate Ates meshes
            if (atesMeshes.length > 0) {
                atesMeshes[atesIndex].mesh.visible = false
                atesIndex = (atesIndex + 1) % atesMeshes.length
                atesMeshes[atesIndex].mesh.visible = true
            }

            // Animate Misket meshes
            if (misketMeshes.length > 0) {
                misketMeshes[misketIndex].mesh.visible = false
                misketIndex = (misketIndex + 1) % misketMeshes.length
                misketMeshes[misketIndex].mesh.visible = true
            }

            lastMeshSwitchTime = now
        }

        // Animate Goz meshes with complex blinking pattern
        if (gozMeshes.length > 0) {
            const cycleTime = (now - gozCycleStartTime) % gozTotalCycleDuration
            let accumulatedTime = 0
            let stageIndex = 0

            for (let i = 0; i < gozBlinkDurations.length; i++) {
                if (cycleTime < accumulatedTime + gozBlinkDurations[i]) {
                    stageIndex = i
                    break
                }
                accumulatedTime += gozBlinkDurations[i]
            }

            // Determine which mesh to show: 0 for open eye, cycle through 1-3 for blinks
            let newGozIndex = 0
            if (stageIndex === 1 || stageIndex === 3 || stageIndex === 5) {
                // Blink stages: cycle through meshes 1, 2, 3
                const blinkProgress = (cycleTime - accumulatedTime) / gozBlinkDurations[stageIndex]
                newGozIndex = 1 + Math.floor(blinkProgress * 3)
                if (newGozIndex > 3) {
                  newGozIndex = 3
                }
            }

            if (newGozIndex !== gozIndex) {
                gozMeshes[gozIndex].mesh.visible = false
                gozIndex = newGozIndex
                gozMeshes[gozIndex].mesh.visible = true
            }
        }

        controls.update()
        renderer.render(scene, camera)
    }
    animate()
})

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

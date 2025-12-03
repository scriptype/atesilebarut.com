import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x1a1a1a)
document.querySelector('.container').appendChild(renderer.domElement)

camera.position.x = -40
camera.position.y = 30
camera.position.z = 30
camera.lookAt(100, -280, 500)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 5)
scene.add(directionalLight)

const backLight = new THREE.DirectionalLight(0xffffff, 0.6)
backLight.position.set(-10, -10, -5)
scene.add(backLight)

const leftLight = new THREE.DirectionalLight(0xffffff, 0.5)
leftLight.position.set(-15, 0, 5)
scene.add(leftLight)

const rightLight = new THREE.DirectionalLight(0xffffff, 0.5)
rightLight.position.set(15, 0, 5)
scene.add(rightLight)

const topLight = new THREE.DirectionalLight(0xffffff, 0.4)
topLight.position.set(0, 20, 0)
scene.add(topLight)

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05

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
        console.log('Found Ates meshes:', atesMeshes.map(m => m.name))
    }

    // Show only the first Ates mesh
    if (atesMeshes.length > 0) {
        atesMeshes[0].mesh.visible = true
    }

    // Animation for cycling through meshes
    let currentMeshIndex = 0
    let lastMeshSwitchTime = -100
    const meshVisibilityDuration = 1000 / 24

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate)
        const now = performance.now()

        if (atesMeshes.length > 0) {
            if (now - lastMeshSwitchTime >= meshVisibilityDuration) {
                atesMeshes[currentMeshIndex].mesh.visible = false
                currentMeshIndex = (currentMeshIndex + 1) % atesMeshes.length
                atesMeshes[currentMeshIndex].mesh.visible = true
                lastMeshSwitchTime = now
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
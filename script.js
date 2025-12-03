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

    // Make materials double-sided, opaque, and assign defaults where missing
    fbx.traverse((child) => {
        if (child.isMesh) {
            if (!child.material) {
                child.material = new THREE.MeshPhongMaterial({ color: 0x888888 })
            }
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.side = THREE.DoubleSide
                    mat.transparent = false
                    mat.opacity = 1
                })
            } else {
                child.material.side = THREE.DoubleSide
                child.material.transparent = false
                child.material.opacity = 1
            }
        }
    })

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate)
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

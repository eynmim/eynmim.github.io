import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export default function PCBViewer({ glbPath, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !glbPath) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(0, 60, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 30;
    controls.maxDistance = 250;

    // Lighting — warm hardware tones
    const ambient = new THREE.AmbientLight(0x332200, 1.0);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffddaa, 3.0);
    keyLight.position.set(50, 80, 60);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffaa44, 1.5);
    fillLight.position.set(-40, 40, -30);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffbe0b, 0.8);
    rimLight.position.set(0, -20, -50);
    scene.add(rimLight);
    const backLight = new THREE.DirectionalLight(0x44aa66, 0.4);
    backLight.position.set(-30, -10, 40);
    scene.add(backLight);

    // Load GLB
    let model = null;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      glbPath,
      (gltf) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 60 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        scene.add(model);
        controls.target.set(0, 0, 0);
      },
      undefined,
      (err) => console.warn('GLB load error:', err)
    );

    // Scroll-linked rotation
    let scrollProgress = 0;
    const scrollContainer = container.closest('.pd-scroll');
    const onScroll = () => {
      if (!scrollContainer) return;
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      scrollProgress = maxScroll > 0 ? scrollContainer.scrollTop / maxScroll : 0;
    };
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    }

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    let rafId;
    let targetRotX = 0, targetRotZ = 0;
    let currentRotX = 0, currentRotZ = 0;

    function animate() {
      controls.update();

      // Scroll-linked model rotation with smooth lerp
      if (model) {
        const sp = scrollProgress;

        // Phase 1 (0-30%): slight tilt forward
        // Phase 2 (30-70%): rotate to side view
        // Phase 3 (70-100%): flip upside down (show bottom)
        if (sp < 0.3) {
          const t = sp / 0.3;
          targetRotX = t * 0.4; // slight tilt
          targetRotZ = t * 0.1;
        } else if (sp < 0.7) {
          const t = (sp - 0.3) / 0.4;
          targetRotX = 0.4 + t * 1.2; // rotate more
          targetRotZ = 0.1 + t * 0.3;
        } else {
          const t = (sp - 0.7) / 0.3;
          targetRotX = 1.6 + t * (Math.PI - 1.6); // complete flip
          targetRotZ = 0.4 - t * 0.4;
        }

        // Smooth lerp
        currentRotX += (targetRotX - currentRotX) * 0.06;
        currentRotZ += (targetRotZ - currentRotZ) * 0.06;

        model.rotation.x = currentRotX;
        model.rotation.z = currentRotZ;

        // Camera moves slightly as we scroll
        camera.position.y = 60 - sp * 40;
        camera.position.z = 100 + sp * 30;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', onScroll);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [glbPath]);

  return <div ref={containerRef} className={`pcb-viewer ${className}`} />;
}

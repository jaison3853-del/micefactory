import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b);

export default function IceWorld({ reduced, onReady, onPhase }) {
  const host = useRef(null);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setAvailable(false);
      onReady();
      return;
    }
    const gl = renderer.getContext();
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const softwareRenderer =
      debug &&
      /swiftshader|llvmpipe/i.test(
        gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
      );
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, softwareRenderer ? 0.75 : 1.4),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const day = new THREE.Color("#607780"),
      night = new THREE.Color("#26353e");
    scene.background = day.clone();
    scene.fog = new THREE.FogExp2(day.clone(), 0.032);
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 140);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(environment, 0.08);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.65;
    environment.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight("#c6e7f0", "#26323d", 2));
    const sun = new THREE.DirectionalLight("#ddf6ff", 4.3);
    sun.position.set(-6, 9, -8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#8dbac9", 1.5);
    fill.position.set(6, 3, 8);
    scene.add(fill);
    const coreLight = new THREE.PointLight("#c3f6ff", 13, 8);
    coreLight.position.set(0, 1.2, 0);
    scene.add(coreLight);

    // Generated alpine terrain: the entire experience works without remote assets.
    const noise = new ImprovedNoise();
    function elevation(x, z) {
      const rise = smooth(3.5, 11, Math.sqrt(x * x + z * z));
      const broad = noise.noise(x * 0.09 + 11, z * 0.09, 4) * 4;
      const ridges = Math.abs(noise.noise(x * 0.19, z * 0.19, 6)) * 3;
      const detail = noise.noise(x * 0.65, z * 0.65, 2) * 0.35;
      return (
        -0.36 + rise * (broad + ridges + detail) + (1 - rise) * detail * 0.16
      );
    }
    const groundGeo = new THREE.PlaneGeometry(100, 100, 185, 185);
    groundGeo.rotateX(-Math.PI / 2);
    const vertices = groundGeo.attributes.position,
      colors = new Float32Array(vertices.count * 3),
      base = new THREE.Color();
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getZ(i),
        h = elevation(x, z);
      vertices.setY(i, h);
      base.setHSL(
        0.55,
        0.08,
        clamp(
          0.34 + h * 0.035 + noise.noise(x * 2, z * 2, 0) * 0.12,
          0.22,
          0.6,
        ),
      );
      colors.set([base.r, base.g, base.b], i * 3);
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    const textureSize = 256,
      textureData = new Uint8Array(textureSize * textureSize * 4);
    for (let y = 0; y < textureSize; y++)
      for (let x = 0; x < textureSize; x++) {
        const n =
          noise.noise(x * 0.13, y * 0.13, 1) * 0.55 +
          noise.noise(x * 0.6, y * 0.6, 2) * 0.28 +
          noise.noise(x * 1.8, y * 1.8, 3) * 0.17;
        const value = Math.round(clamp(0.5 + n, 0, 1) * 255),
          i = (y * textureSize + x) * 4;
        textureData[i] = textureData[i + 1] = textureData[i + 2] = value;
        textureData[i + 3] = 255;
      }
    const frost = new THREE.DataTexture(
      textureData,
      textureSize,
      textureSize,
      THREE.RGBAFormat,
    );
    frost.wrapS = frost.wrapT = THREE.RepeatWrapping;
    frost.magFilter = frost.minFilter = THREE.LinearFilter;
    frost.repeat.set(45, 45);
    frost.needsUpdate = true;
    const iceFrost = frost.clone();
    iceFrost.repeat.set(1, 1);
    iceFrost.needsUpdate = true;
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.08,
      transparent: true,
      bumpMap: frost,
      bumpScale: 0.36,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    scene.add(ground);
    const boxGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.065);
    const ice = new THREE.MeshPhysicalMaterial({
      color: "#83a5b5",
      metalness: 0.42,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      transparent: true,
      bumpMap: iceFrost,
      bumpScale: 0.035,
    });
    const dome = new THREE.Group();
    scene.add(dome);
    const blocks = [];
    const addBlock = (x, y, z, sx, sy, sz, ry = 0, rz = 0) => {
      const block = new THREE.Mesh(boxGeo, ice);
      block.position.set(x, y, z);
      block.scale.set(sx, sy, sz);
      block.rotation.set(0, ry, rz);
      blocks.push({
        mesh: block,
        position: block.position.clone(),
        ry,
        rz,
        seed: blocks.length * 1.753,
      });
    };
    for (let row = 0; row < 6; row++) {
      const y = 0.22 + row * 0.43,
        radius = Math.sqrt(Math.max(0.1, 2.7 ** 2 - (y + 0.28) ** 2)) * 0.9;
      const count = Math.max(7, Math.round((2 * Math.PI * radius) / 0.82));
      for (let j = 0; j < count; j++) {
        const a = (j / count) * Math.PI * 2 + ((row % 2) * Math.PI) / count;
        if (row < 3 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.36)
          continue;
        addBlock(
          Math.sin(a) * radius,
          y,
          Math.cos(a) * radius,
          ((2 * Math.PI * radius) / count) * 0.94,
          0.407,
          0.65,
          a,
        );
      }
    }
    // The open front arch leads into the illuminated interior.
    for (let layer = 0; layer < 2; layer++) {
      const z = 2.3 + layer * 0.6;
      [-1, 1].forEach((side) => {
        for (let row = 0; row < 2; row++)
          addBlock(side * 0.73, 0.19 + row * 0.43, z, 0.43, 0.407, 0.62);
      });
      for (let j = 0; j <= 6; j++) {
        const a = (j / 6) * Math.PI;
        addBlock(
          Math.cos(a) * 0.73,
          0.65 + Math.sin(a) * 0.73,
          z,
          0.39,
          0.4,
          0.62,
          0,
          a - Math.PI / 2,
        );
      }
    }
    const instances = new THREE.InstancedMesh(boxGeo, ice, blocks.length);
    instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instances.frustumCulled = false;
    dome.add(instances);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: "#354c59",
      metalness: 0.6,
      roughness: 0.36,
    });
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3, 0.2, 80),
      pedestalMat,
    );
    disc.position.y = -0.2;
    scene.add(disc);
    const rings = new THREE.Group();
    scene.add(rings);
    const luminous = new THREE.MeshBasicMaterial({
      color: "#bceafa",
      transparent: true,
    });
    const torusGeo = new THREE.TorusGeometry(2.7, 0.027, 10, 110);
    const outerGlow = new THREE.Mesh(torusGeo, luminous);
    outerGlow.rotation.x = Math.PI / 2;
    outerGlow.position.y = -0.07;
    rings.add(outerGlow);
    const innerGlow = new THREE.Mesh(torusGeo, luminous);
    innerGlow.rotation.x = Math.PI / 2;
    innerGlow.scale.setScalar(0.79);
    innerGlow.position.y = 0.02;
    rings.add(innerGlow);
    const ringSegments = [];
    for (let i = 0; i < 12; i++) {
      const segment = new THREE.Mesh(
        new THREE.TorusGeometry(2.43, 0.17, 6, 18, ((Math.PI * 2) / 12) * 0.87),
        pedestalMat,
      );
      segment.rotation.set(Math.PI / 2, 0, (i / 12) * Math.PI * 2);
      segment.position.y = 0.04;
      ringSegments.push(segment);
      rings.add(segment);
    }
    // A floating ice-cut M replaces the reference's brand character.
    const monument = new THREE.Group();
    monument.position.y = 1.35;
    scene.add(monument);
    const shape = new THREE.Shape();
    const pts = [
      [-1.3, -1.1],
      [-1.3, 1.1],
      [-0.75, 1.1],
      [0, 0.08],
      [0.75, 1.1],
      [1.3, 1.1],
      [1.3, -1.1],
      [0.72, -1.1],
      [0.72, 0.13],
      [0, -0.82],
      [-0.72, 0.13],
      [-0.72, -1.1],
    ];
    pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    const letterGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.38,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    letterGeo.center();
    const letterMat = new THREE.MeshPhysicalMaterial({
      color: "#c2dbe0",
      metalness: 0.72,
      roughness: 0.16,
      clearcoat: 1,
      transparent: true,
    });
    monument.add(new THREE.Mesh(letterGeo, letterMat));
    const shardGeo = new THREE.IcosahedronGeometry(0.45, 0);
    const shardMat = new THREE.MeshPhysicalMaterial({
      color: "#97bfce",
      metalness: 0.55,
      roughness: 0.16,
      clearcoat: 1,
    });
    const shards = [];
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996,
        shard = new THREE.Mesh(shardGeo, shardMat),
        pos = new THREE.Vector3(
          Math.cos(a) * (1.7 + (i % 3) * 0.2),
          Math.sin(a) * 1.9,
          Math.sin(i * 3.1) * 0.7,
        );
      shard.position.copy(pos);
      shard.scale.set(0.4 + (i % 3) * 0.16, 0.8 + (i % 4) * 0.22, 0.5);
      shard.rotation.set(i, a, i * 0.7);
      monument.add(shard);
      shards.push({ mesh: shard, position: pos });
    }
    monument.visible = false;
    let seed = 425;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const snowGeo = new THREE.BufferGeometry(),
      snowData = new Float32Array(750 * 3);
    for (let i = 0; i < snowData.length; i += 3) {
      snowData[i] = (random() - 0.5) * 35;
      snowData[i + 1] = random() * 15;
      snowData[i + 2] = (random() - 0.5) * 35;
    }
    snowGeo.setAttribute("position", new THREE.BufferAttribute(snowData, 3));
    const snow = new THREE.Points(
      snowGeo,
      new THREE.PointsMaterial({
        color: "#d3e9ee",
        size: 0.025,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    scene.add(snow);

    let dragging = false,
      lastX = 0,
      drag = 0,
      mobile = window.innerWidth < 760,
      needsRender = true;
    const pointer = { x: 0, y: 0 };
    const resize = () => {
      needsRender = true;
      mobile = window.innerWidth < 760;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.fov = mobile ? 53 : 43;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const move = (e) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (dragging) {
        drag += (e.clientX - lastX) * 0.003;
        lastX = e.clientX;
      }
    };
    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
    };
    const up = () => {
      dragging = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    const journey = el.closest(".journey");
    let frame = 0,
      inView = true,
      lastPhase = -1,
      lastRender = -Infinity;
    const visible = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
    });
    visible.observe(el);
    const target = new THREE.Vector3(),
      endCamera = new THREE.Vector3();
    const start = performance.now();
    const render = (now) => {
      frame = requestAnimationFrame(render);
      if (
        document.hidden ||
        !inView ||
        now - lastRender < 32 ||
        (reduced && !needsRender) ||
        document.body.classList.contains("dialog-open")
      )
        return;
      needsRender = false;
      lastRender = now;
      const t = (now - start) / 1000;
      const p = reduced
        ? 0
        : clamp(
            (window.scrollY - journey.offsetTop) /
              Math.max(1, journey.offsetHeight - window.innerHeight),
            0,
            1,
          );
      const phase = p < 0.3 ? 0 : p < 0.66 ? 1 : 2;
      if (phase !== lastPhase) {
        lastPhase = phase;
        onPhase(phase);
      }
      const lift = smooth(0.09, 0.43, p),
        chamber = smooth(0.5, 0.78, p),
        assembly = reduced ? 1 : smooth(0, 2.1, t);
      dome.visible = p < 0.59;
      blocks.forEach(({ mesh, position, ry, rz, seed }, i) => {
        mesh.position.copy(position).multiplyScalar(1 + lift * 1.1);
        mesh.position.y +=
          lift * (1.4 + Math.sin(seed) * 1.3) +
          (1 - assembly) * (2 + Math.sin(seed) * 1.5);
        mesh.rotation.set(
          lift * Math.sin(seed) * 0.7,
          ry + lift * Math.cos(seed) * 0.7,
          rz + lift * 0.3,
        );
        mesh.updateMatrix();
        instances.setMatrixAt(i, mesh.matrix);
      });
      instances.instanceMatrix.needsUpdate = true;
      ice.opacity = 1 - smooth(0.4, 0.59, p);
      rings.rotation.y = reduced ? 0 : t * 0.08 + p * 3;
      rings.position.y = chamber * -0.3;
      innerGlow.scale.setScalar(
        0.79 + Math.sin(t * 1.4) * (reduced ? 0 : 0.008),
      );
      ringSegments.forEach((part, i) => {
        part.position.y =
          0.04 + lift * 0.17 * Math.sin(i + t * (reduced ? 0 : 0.5));
      });
      monument.visible = chamber > 0.01;
      monument.scale.setScalar(Math.max(0.001, chamber));
      monument.rotation.y = reduced ? 0 : Math.sin(t * 0.32) * 0.28 + drag;
      monument.position.y = 1.8 + (reduced ? 0 : Math.sin(t * 0.8) * 0.1);
      shards.forEach(({ mesh, position }, i) => {
        mesh.position
          .copy(position)
          .multiplyScalar(1 + Math.sin(t * 0.3 + i) * (reduced ? 0 : 0.07));
      });
      groundMat.opacity = 1 - chamber * 0.96;
      ground.visible = chamber < 0.999;
      scene.background.copy(day).lerp(night, chamber);
      scene.fog.color.copy(scene.background);
      if (!reduced) {
        snow.rotation.y = t * 0.006;
        snow.position.y = -((t * 0.045) % 3);
      }
      const approach = smooth(0, 0.42, p),
        orbit = reduced
          ? 0.56
          : 0.56 + pointer.x * 0.045 + Math.sin(t * 0.07) * 0.025 + drag * 0.35,
        distance = mobile ? 13.8 : 11.5;
      camera.position.set(
        Math.sin(orbit) * distance * (1 - approach),
        THREE.MathUtils.lerp(4.4, 8.7, approach),
        Math.cos(orbit) * distance * (1 - approach) + 0.4 * approach,
      );
      camera.position.lerp(
        endCamera.set(mobile ? 0.3 : 2.4, 2.7, mobile ? 10.5 : 9.7),
        chamber,
      );
      if (!reduced) camera.position.y += pointer.y * -0.1;
      target.set(0, THREE.MathUtils.lerp(0.7, 0, approach) + chamber * 1.45, 0);
      camera.lookAt(target);
      renderer.render(scene, camera);
    };
    render(start);
    onReady();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visible.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointerdown", down);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      frost.dispose();
      iceFrost.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced, onReady, onPhase]);
  return (
    <div
      className="sculpture"
      ref={host}
      aria-label="An interactive ice landscape that transforms as you scroll"
    >
      {!available && (
        <div className="scene-fallback">
          <span className="fallback-monogram">M</span>
          <span className="mono">A WORLD BEYOND ORDINARY</span>
        </div>
      )}
    </div>
  );
}

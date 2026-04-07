import { useEffect, useRef } from 'react';
import {
  Vector3 as a, MeshPhysicalMaterial as c, InstancedMesh as d, Clock as e,
  AmbientLight as f, SphereGeometry as g, ShaderChunk as h, Scene as i,
  Color as l, Object3D as m, SRGBColorSpace as n, MathUtils as o,
  PMREMGenerator as p, Vector2 as r, WebGLRenderer as s, PerspectiveCamera as t,
  PointLight as u, ACESFilmicToneMapping as v, Plane as w, Raycaster as y
} from 'three';
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js';

class ThreeApp {
  #e; canvas; camera; cameraMinAspect; cameraMaxAspect; cameraFov; maxPixelRatio; minPixelRatio;
  scene; renderer; #t; size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#i; onBeforeRender = () => {}; onAfterRender = () => {}; onAfterResize = () => {};
  #s = false; #n = false; isDisposed = false; #o; #r; #a; #c = new e(); #h = { elapsed: 0, delta: 0 }; #l;

  constructor(e) { this.#e = { ...e }; this.#m(); this.#d(); this.#p(); this.resize(); this.#g(); }
  #m() { this.camera = new t(); this.cameraFov = this.camera.fov; }
  #d() { this.scene = new i(); }
  #p() {
    if (this.#e.canvas) { this.canvas = this.#e.canvas; }
    else if (this.#e.id) { this.canvas = document.getElementById(this.#e.id); }
    else { console.error('Three: Missing canvas or id parameter'); }
    this.canvas.style.display = 'block';
    this.renderer = new s({ canvas: this.canvas, powerPreference: 'high-performance', ...(this.#e.rendererOptions ?? {}) });
    this.renderer.outputColorSpace = n;
  }
  #g() {
    if (!(this.#e.size instanceof Object)) {
      window.addEventListener('resize', this.#f.bind(this));
      if (this.#e.size === 'parent' && this.canvas.parentNode) {
        this.#r = new ResizeObserver(this.#f.bind(this));
        this.#r.observe(this.canvas.parentNode);
      }
    }
    this.#o = new IntersectionObserver(this.#u.bind(this), { root: null, rootMargin: '0px', threshold: 0 });
    this.#o.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#v.bind(this));
  }
  #y() {
    window.removeEventListener('resize', this.#f.bind(this));
    this.#r?.disconnect(); this.#o?.disconnect();
    document.removeEventListener('visibilitychange', this.#v.bind(this));
  }
  #u(e) { this.#s = e[0].isIntersecting; this.#s ? this.#w() : this.#z(); }
  #v() { if (this.#s) { document.hidden ? this.#z() : this.#w(); } }
  #f() { if (this.#a) clearTimeout(this.#a); this.#a = setTimeout(this.resize.bind(this), 100); }
  resize() {
    let e, t;
    if (this.#e.size instanceof Object) { e = this.#e.size.width; t = this.#e.size.height; }
    else if (this.#e.size === 'parent' && this.canvas.parentNode) { e = this.canvas.parentNode.offsetWidth; t = this.canvas.parentNode.offsetHeight; }
    else { e = window.innerWidth; t = window.innerHeight; }
    this.size.width = e; this.size.height = t; this.size.ratio = e / t;
    this.#x(); this.#b(); this.onAfterResize(this.size);
  }
  #x() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) { this.#A(this.cameraMinAspect); }
      else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) { this.#A(this.cameraMaxAspect); }
      else { this.camera.fov = this.cameraFov; }
    }
    this.camera.updateProjectionMatrix(); this.updateWorldSize();
  }
  #A(e) { const t = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / e); this.camera.fov = 2 * o.radToDeg(Math.atan(t)); }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const e = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(e / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #b() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#t?.setSize(this.size.width, this.size.height);
    let e = window.devicePixelRatio;
    if (this.maxPixelRatio && e > this.maxPixelRatio) { e = this.maxPixelRatio; }
    else if (this.minPixelRatio && e < this.minPixelRatio) { e = this.minPixelRatio; }
    this.renderer.setPixelRatio(e); this.size.pixelRatio = e;
  }
  get postprocessing() { return this.#t; }
  set postprocessing(e) { this.#t = e; this.render = e.render.bind(e); }
  #w() {
    if (this.#n) return;
    const animate = () => {
      this.#l = requestAnimationFrame(animate);
      this.#h.delta = this.#c.getDelta(); this.#h.elapsed += this.#h.delta;
      this.onBeforeRender(this.#h); this.render(); this.onAfterRender(this.#h);
    };
    this.#n = true; this.#c.start(); animate();
  }
  #z() { if (this.#n) { cancelAnimationFrame(this.#l); this.#n = false; this.#c.stop(); } }
  #i() { this.renderer.render(this.scene, this.camera); }
  clear() {
    this.scene.traverse(e => {
      if (e.isMesh && typeof e.material === 'object' && e.material !== null) {
        Object.keys(e.material).forEach(t => { const i = e.material[t]; if (i !== null && typeof i === 'object' && typeof i.dispose === 'function') { i.dispose(); } });
        e.material.dispose(); e.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() { this.#y(); this.#z(); this.clear(); this.#t?.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.isDisposed = true; }
}

const pointerMap = new Map();
const pointerPos = new r();
let pointerListening = false;

function createPointer(e) {
  const t = { position: new r(), nPosition: new r(), hover: false, touching: false, onEnter() {}, onMove() {}, onClick() {}, onLeave() {}, ...e };
  if (!pointerMap.has(e.domElement)) {
    pointerMap.set(e.domElement, t);
    if (!pointerListening) {
      document.body.addEventListener('pointermove', onPointerMove);
      document.body.addEventListener('pointerleave', onPointerLeave);
      document.body.addEventListener('click', onPointerClick);
      document.body.addEventListener('touchstart', onTouchStart, { passive: false });
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
      document.body.addEventListener('touchend', onTouchEnd, { passive: false });
      document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });
      pointerListening = true;
    }
  }
  t.dispose = () => {
    pointerMap.delete(e.domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);
      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);
      pointerListening = false;
    }
  };
  return t;
}

function onPointerMove(e) { pointerPos.x = e.clientX; pointerPos.y = e.clientY; processPointer(); }
function processPointer() {
  for (const [elem, t] of pointerMap) {
    const i = elem.getBoundingClientRect();
    if (isOver(i)) { updatePos(t, i); if (!t.hover) { t.hover = true; t.onEnter(t); } t.onMove(t); }
    else if (t.hover && !t.touching) { t.hover = false; t.onLeave(t); }
  }
}
function onPointerClick(e) {
  pointerPos.x = e.clientX; pointerPos.y = e.clientY;
  for (const [elem, t] of pointerMap) { const i = elem.getBoundingClientRect(); updatePos(t, i); if (isOver(i)) t.onClick(t); }
}
function onPointerLeave() { for (const t of pointerMap.values()) { if (t.hover) { t.hover = false; t.onLeave(t); } } }
function onTouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault(); pointerPos.x = e.touches[0].clientX; pointerPos.y = e.touches[0].clientY;
    for (const [elem, t] of pointerMap) { const rect = elem.getBoundingClientRect(); if (isOver(rect)) { t.touching = true; updatePos(t, rect); if (!t.hover) { t.hover = true; t.onEnter(t); } t.onMove(t); } }
  }
}
function onTouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault(); pointerPos.x = e.touches[0].clientX; pointerPos.y = e.touches[0].clientY;
    for (const [elem, t] of pointerMap) { const rect = elem.getBoundingClientRect(); updatePos(t, rect); if (isOver(rect)) { if (!t.hover) { t.hover = true; t.touching = true; t.onEnter(t); } t.onMove(t); } else if (t.hover && t.touching) { t.onMove(t); } }
  }
}
function onTouchEnd() { for (const [, t] of pointerMap) { if (t.touching) { t.touching = false; if (t.hover) { t.hover = false; t.onLeave(t); } } } }
function updatePos(e, t) { const { position: i, nPosition: s } = e; i.x = pointerPos.x - t.left; i.y = pointerPos.y - t.top; s.x = (i.x / t.width) * 2 - 1; s.y = (-i.y / t.height) * 2 + 1; }
function isOver(e) { const { x: t, y: i } = pointerPos; const { left: s, top: n, width: o, height: rr } = e; return t >= s && t <= s + o && i >= n && i <= n + rr; }

const { randFloat: k, randFloatSpread: E } = o;
const F = new a(); const I = new a(); const O = new a(); const V = new a();
const B = new a(); const N = new a(); const _ = new a(); const j = new a();
const H = new a(); const T = new a();

class Physics {
  constructor(e) {
    this.config = e;
    this.positionData = new Float32Array(3 * e.count).fill(0);
    this.velocityData = new Float32Array(3 * e.count).fill(0);
    this.sizeData = new Float32Array(e.count).fill(1);
    this.center = new a();
    this.#init(); this.setSizes();
  }
  #init() {
    const { config: e, positionData: t } = this;
    this.center.toArray(t, 0);
    for (let i = 1; i < e.count; i++) { const s = 3 * i; t[s] = E(2 * e.maxX); t[s + 1] = E(2 * e.maxY); t[s + 2] = E(2 * e.maxZ); }
  }
  setSizes() {
    const { config: e, sizeData: t } = this;
    t[0] = e.size0;
    for (let i = 1; i < e.count; i++) { t[i] = k(e.minSize, e.maxSize); }
  }
  update(e) {
    const { config: t, center: i, positionData: s, sizeData: n, velocityData: o } = this;
    let r = 0;
    if (t.controlSphere0) { r = 1; F.fromArray(s, 0); F.lerp(i, 0.1).toArray(s, 0); V.set(0, 0, 0).toArray(o, 0); }
    for (let idx = r; idx < t.count; idx++) { const base = 3 * idx; I.fromArray(s, base); B.fromArray(o, base); B.y -= e.delta * t.gravity * n[idx]; B.multiplyScalar(t.friction); B.clampLength(0, t.maxVelocity); I.add(B); I.toArray(s, base); B.toArray(o, base); }
    for (let idx = r; idx < t.count; idx++) {
      const base = 3 * idx; I.fromArray(s, base); B.fromArray(o, base); const radius = n[idx];
      for (let jdx = idx + 1; jdx < t.count; jdx++) {
        const otherBase = 3 * jdx; O.fromArray(s, otherBase); N.fromArray(o, otherBase); const otherRadius = n[jdx];
        _.copy(O).sub(I); const dist = _.length(); const sumRadius = radius + otherRadius;
        if (dist < sumRadius) { const overlap = sumRadius - dist; j.copy(_).normalize().multiplyScalar(0.5 * overlap); H.copy(j).multiplyScalar(Math.max(B.length(), 1)); T.copy(j).multiplyScalar(Math.max(N.length(), 1)); I.sub(j); B.sub(H); I.toArray(s, base); B.toArray(o, base); O.add(j); N.add(T); O.toArray(s, otherBase); N.toArray(o, otherBase); }
      }
      if (t.controlSphere0) { _.copy(F).sub(I); const dist = _.length(); const sumRadius0 = radius + n[0]; if (dist < sumRadius0) { const diff = sumRadius0 - dist; j.copy(_.normalize()).multiplyScalar(diff); H.copy(j).multiplyScalar(Math.max(B.length(), 2)); I.sub(j); B.sub(H); } }
      if (Math.abs(I.x) + radius > t.maxX) { I.x = Math.sign(I.x) * (t.maxX - radius); B.x = -B.x * t.wallBounce; }
      if (t.gravity === 0) { if (Math.abs(I.y) + radius > t.maxY) { I.y = Math.sign(I.y) * (t.maxY - radius); B.y = -B.y * t.wallBounce; } }
      else if (I.y - radius < -t.maxY) { I.y = -t.maxY + radius; B.y = -B.y * t.wallBounce; }
      const maxBoundary = Math.max(t.maxZ, t.maxSize);
      if (Math.abs(I.z) + radius > maxBoundary) { I.z = Math.sign(I.z) * (t.maxZ - radius); B.z = -B.z * t.wallBounce; }
      I.toArray(s, base); B.toArray(o, base);
    }
  }
}

class SubsurfaceMaterial extends c {
  constructor(e) {
    super(e);
    this.uniforms = { thicknessDistortion: { value: 0.1 }, thicknessAmbient: { value: 0 }, thicknessAttenuation: { value: 0.1 }, thicknessPower: { value: 2 }, thicknessScale: { value: 10 } };
    this.defines.USE_UV = '';
    this.onBeforeCompile = e => {
      Object.assign(e.uniforms, this.uniforms);
      e.fragmentShader = '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' + e.fragmentShader;
      e.fragmentShader = e.fragmentShader.replace('void main() {', '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      ');
      const t = h.lights_fragment_begin.replaceAll('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );', '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        ');
      e.fragmentShader = e.fragmentShader.replace('#include <lights_fragment_begin>', t);
      if (this.onBeforeCompile2) this.onBeforeCompile2(e);
    };
  }
}

const defaultConfig = { count: 200, colors: [0, 0, 0], ambientColor: 16777215, ambientIntensity: 1, lightIntensity: 200, materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 }, minSize: 0.5, maxSize: 1, size0: 1, gravity: 0.5, friction: 0.9975, wallBounce: 0.95, maxVelocity: 0.15, maxX: 5, maxY: 5, maxZ: 2, controlSphere0: false, followCursor: true };
const dummy = new m();

class BallpitMesh extends d {
  constructor(e, t = {}) {
    const i = { ...defaultConfig, ...t };
    const s = new z();
    const n = new p(e, 0.04).fromScene(s).texture;
    const o = new g();
    const r = new SubsurfaceMaterial({ envMap: n, ...i.materialParams });
    r.envMapRotation.x = -Math.PI / 2;
    super(o, r, i.count);
    this.config = i;
    this.physics = new Physics(i);
    this.ambientLight = new f(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new u(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
    this.setColors(i.colors);
  }
  setColors(e) {
    if (Array.isArray(e) && e.length > 1) {
      const colorScale = (() => {
        let colors, instances;
        function setColors(e) { colors = e; instances = []; colors.forEach(col => { instances.push(new l(col)); }); }
        setColors(e);
        return { setColors, getColorAt: function (ratio, out = new l()) { const scaled = Math.max(0, Math.min(1, ratio)) * (colors.length - 1); const idx = Math.floor(scaled); const start = instances[idx]; if (idx >= colors.length - 1) return start.clone(); const alpha = scaled - idx; const end = instances[idx + 1]; out.r = start.r + alpha * (end.r - start.r); out.g = start.g + alpha * (end.g - start.g); out.b = start.b + alpha * (end.b - start.b); return out; } };
      })();
      for (let idx = 0; idx < this.count; idx++) { this.setColorAt(idx, colorScale.getColorAt(idx / this.count)); if (idx === 0) { this.light.color.copy(colorScale.getColorAt(idx / this.count)); } }
      this.instanceColor.needsUpdate = true;
    }
  }
  update(e) {
    this.physics.update(e);
    for (let idx = 0; idx < this.count; idx++) {
      dummy.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) { dummy.scale.setScalar(0); } else { dummy.scale.setScalar(this.physics.sizeData[idx]); }
      dummy.updateMatrix(); this.setMatrixAt(idx, dummy.matrix);
      if (idx === 0) this.light.position.copy(dummy.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas, opts = {}) {
  const three = new ThreeApp({ canvas, size: 'parent', rendererOptions: { antialias: true, alpha: true } });
  let spheres;
  three.renderer.toneMapping = v;
  three.camera.position.set(0, 0, 20);
  three.camera.lookAt(0, 0, 0);
  three.cameraMaxAspect = 1.5;
  three.resize();
  init(opts);
  const raycaster = new y();
  const plane = new w(new a(0, 0, 1), 0);
  const point = new a();
  let paused = false;
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.webkitUserSelect = 'none';
  const pointer = createPointer({
    domElement: canvas,
    onMove() { raycaster.setFromCamera(pointer.nPosition, three.camera); three.camera.getWorldDirection(plane.normal); raycaster.ray.intersectPlane(plane, point); spheres.physics.center.copy(point); spheres.config.controlSphere0 = true; },
    onLeave() { spheres.config.controlSphere0 = false; }
  });
  function init(e) { if (spheres) { three.clear(); three.scene.remove(spheres); } spheres = new BallpitMesh(three.renderer, e); three.scene.add(spheres); }
  three.onBeforeRender = e => { if (!paused) spheres.update(e); };
  three.onAfterResize = e => { spheres.config.maxX = e.wWidth / 2; spheres.config.maxY = e.wHeight / 2; };
  return { three, get spheres() { return spheres; }, setCount(e) { init({ ...spheres.config, count: e }); }, togglePause() { paused = !paused; }, dispose() { pointer.dispose(); three.dispose(); } };
}

const Ballpit = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => { if (instanceRef.current) { instanceRef.current.dispose(); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas className={`${className} w-full h-full`} ref={canvasRef} />;
};

export default Ballpit;

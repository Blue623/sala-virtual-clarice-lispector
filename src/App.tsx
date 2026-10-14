/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Volume2,
  VolumeX,
  Keyboard,
  Sun,
  Moon,
  X
} from 'lucide-react';
import {
  createWainscotingAndWallArt,
  createModernistSofa,
  createSideTableAndRotaryPhone
} from './furniture3D.ts';
import {
  renderPhotographicWindow
} from './windowPhotography.ts';
import {
  createDustMotesSystem,
  DustMotesSystem
} from './dustParticles.ts';

const FAMOUS_QUOTES = [
  "Escrevo como se fosse para salvar a vida de alguém. Provavelmente a minha própria.",
  "O que me acalma é o mistério. É não ter certeza de nada.",
  "Liberdade é pouco. O que eu desejo ainda não tem nome.",
  "Que ninguém se engane, só se consegue a simplicidade através de muito trabalho.",
  "Renda-se, como eu me rendi. Mergulhe no que você não conhece como eu mergulhei.",
  "Eu não sou daquelas que se deixam vencer pela rotina. Eu a invento.",
  "A palavra é minha quarta dimensão. Não quero a palavra pronta, quero o sopro antes dela nascer.",
  "Tudo no mundo começou com um sim. Uma molécula disse sim a outra molécula e nasceu a vida."
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const vrButtonContainerRef = useRef<HTMLDivElement>(null);

  // Audio states
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oceanGainRef = useRef<GainNode | null>(null);
  const [isOceanPlaying, setIsOceanPlaying] = useState<boolean>(false);
  const [soundVolume] = useState<number>(0.3);

  // Time of Day state: 'golden', 'night', 'day'
  const [timeOfDay, setTimeOfDay] = useState<'golden' | 'night' | 'day'>('golden');

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [typedText, setTypedText] = useState<string>('');
  const [quoteIndex] = useState<number>(0);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const hotspotRingsRef = useRef<THREE.Mesh[]>([]);
  const windowTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const deskSpotRef = useRef<THREE.SpotLight | null>(null);
  const windowLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dustSystemRef = useRef<DustMotesSystem | null>(null);

  // Spatial UI Panel
  const spatialUIPanelRef = useRef<THREE.Mesh | null>(null);
  const spatialCloseBtnRef = useRef<THREE.Mesh | null>(null);

  // Teleportation and VR Rig Refs
  const cameraGroupRef = useRef<THREE.Group | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);

  /* ---------------- Audio Synthesis ---------------- */
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playTypewriterClick = useCallback((intensity = 1) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + Math.random() * 500, now);
      filter.Q.setValueAtTime(3.5, now);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.35 * intensity * soundVolume * 3, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      whiteNoise.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(ctx.destination);
      whiteNoise.start(now);
    } catch {
      // Audio fallback
    }
  }, [initAudio, soundVolume]);

  const toggleOceanSound = useCallback((forceState?: boolean) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const nextState = forceState !== undefined ? forceState : !isOceanPlaying;
    if (!nextState) {
      if (oceanGainRef.current) {
        oceanGainRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        setTimeout(() => setIsOceanPlaying(false), 1000);
      } else {
        setIsOceanPlaying(false);
      }
      return;
    }

    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.11;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25 * soundVolume * 3, ctx.currentTime + 1.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      oceanGainRef.current = gain;
      setIsOceanPlaying(true);
    } catch (err) {
      console.warn('Ocean sound init error:', err);
    }
  }, [initAudio, soundVolume, isOceanPlaying]);

  const playRotaryDialSound = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const pulseTime = now + i * 0.052;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(620 + Math.random() * 60, pulseTime);
        gain.gain.setValueAtTime(0.18 * soundVolume * 3, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.025);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(pulseTime);
        osc.stop(pulseTime + 0.03);
      }
    } catch {
      // ignore
    }
  }, [initAudio, soundVolume]);

  const playRockingCreakSound = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15 * soundVolume * 3, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // ignore
    }
  }, [initAudio, soundVolume]);

  const triggerHapticFeedback = (controller: any, intensity = 0.6, duration = 40) => {
    if (controller?.gamepad?.hapticActuators && controller.gamepad.hapticActuators[0]) {
      controller.gamepad.hapticActuators[0].pulse(intensity, duration);
    }
  };

  const renderWindowCanvas = useCallback((mode: 'golden' | 'night' | 'day') => {
    return renderPhotographicWindow('copacabana_view', mode, null);
  }, []);

  const updateSpatialVRPanel = useCallback((title: string, lines: string[]) => {
    if (!spatialUIPanelRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(8, 12, 22, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CLARICE LISPECTOR • ESPAÇO VIRTUAL META QUEST', 50, 70);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 44px serif';
    ctx.fillText(title, 50, 140);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 170);
    ctx.lineTo(974, 170);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '30px serif';
    let yPos = 240;
    lines.forEach((line) => {
      ctx.fillText(line, 50, yPos);
      yPos += 48;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px monospace';
    ctx.fillText('[Aponte o raio no botão vermelho para fechar]', 50, 580);

    const texture = new THREE.CanvasTexture(canvas);
    (spatialUIPanelRef.current.material as THREE.MeshBasicMaterial).map = texture;
    (spatialUIPanelRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    spatialUIPanelRef.current.visible = true;
    if (spatialCloseBtnRef.current) spatialCloseBtnRef.current.visible = true;
  }, []);

  const handleHotspotTrigger = useCallback((id: string, controller?: any) => {
    if (controller) triggerHapticFeedback(controller, 0.8, 50);

    if (id === 'rotary_phone') {
      playRotaryDialSound();
      updateSpatialVRPanel('Telefone de Baquelite', [
        '"À noite, o telefone parece o único elo com a humanidade."',
        '',
        'As ligações da madrugada com amigos e editores.',
        'Presença viva nas fotos originais do gabinete no Leme.'
      ]);
    } else if (id === 'rocking_chair') {
      playRockingCreakSound();
      updateSpatialVRPanel('Cadeira de Balanço Thonet', [
        '"Sentar na cadeira de balanço era o meu modo de esperar',
        'pelo que ainda não tinha nome."',
        '',
        'Modelo clássico de madeira curvada a vapor vienense.'
      ]);
    } else if (id === 'window') {
      toggleOceanSound(true);
      updateSpatialVRPanel('Janela para o Leme & Atlântico', [
        '"O mar é uma certeza sem palavras. A onda vem e desfaz tudo."',
        '',
        'A curva da praia de Copacabana e o Forte do Leme.',
        'O som das marés acompanha suas criações literárias.'
      ]);
    } else if (id === 'sofa' || id === 'sofa_typewriter') {
      playTypewriterClick(1.0);
      updateSpatialVRPanel('O Sofá Modernista & A Máquina no Colo', [
        '"Não sou escritora de gabinete formal. Escrevo no colo."',
        '',
        'Clarice apoiava a máquina portátil sobre as pernas,',
        'escrevendo no sofá de linho em impulsos febris.'
      ]);
    } else if (id === 'typewriter') {
      playTypewriterClick(1.2);
      updateSpatialVRPanel('Máquina de Escrever Portátil Olympia', [
        `"${FAMOUS_QUOTES[quoteIndex]}"`,
        '',
        '— Clarice Lispector',
        'Cada toque ressoa na acústica do gabinete no Leme.'
      ]);
    } else if (id === 'xicara') {
      playTypewriterClick(0.7);
      updateSpatialVRPanel('Café Preto no Gabinete', [
        '"Um café forte, o silêncio da madrugada e a máquina aberta."',
        '',
        'O ritual indispensável de escrita de Clarice Lispector.'
      ]);
    } else if (id === 'bookshelf') {
      playTypewriterClick(0.8);
      updateSpatialVRPanel('Estante de Manuscritos & Leituras', [
        '"Livros são portas que se abrem para o indizível."',
        '',
        'Obras de Spinoza, Dostoiévski e seus próprios originais.'
      ]);
    } else {
      playTypewriterClick(0.9);
      updateSpatialVRPanel('Memórias de Clarice', [
        'Registro de fragmentos literários e manuscritos.',
        'Aponte para o chão para se teletransportar pela sala.'
      ]);
    }
    setActiveModal(id);
  }, [playTypewriterClick, playRotaryDialSound, playRockingCreakSound, toggleOceanSound, updateSpatialVRPanel, quoteIndex]);

  useEffect(() => {
    if (!deskSpotRef.current || !windowLightRef.current || !ambientLightRef.current || !windowTextureRef.current) return;

    const canvas = renderWindowCanvas(timeOfDay);
    windowTextureRef.current.image = canvas;
    windowTextureRef.current.needsUpdate = true;

    if (timeOfDay === 'golden') {
      ambientLightRef.current.color.setHex(0xdce7f5);
      ambientLightRef.current.intensity = 0.55;
      windowLightRef.current.color.setHex(0xffaa5e);
      windowLightRef.current.intensity = 1.4;
      deskSpotRef.current.color.setHex(0xffdfa8);
      deskSpotRef.current.intensity = 2.8;
    } else if (timeOfDay === 'night') {
      ambientLightRef.current.color.setHex(0x1a2238);
      ambientLightRef.current.intensity = 0.28;
      windowLightRef.current.color.setHex(0x38bdf8);
      windowLightRef.current.intensity = 0.4;
      deskSpotRef.current.color.setHex(0xffb74d);
      deskSpotRef.current.intensity = 3.6;
    } else {
      ambientLightRef.current.color.setHex(0xffffff);
      ambientLightRef.current.intensity = 0.75;
      windowLightRef.current.color.setHex(0x60a5fa);
      windowLightRef.current.intensity = 1.8;
      deskSpotRef.current.color.setHex(0xfffaed);
      deskSpotRef.current.intensity = 2.0;
    }

    dustSystemRef.current?.setTimeOfDay(timeOfDay);
  }, [timeOfDay, renderWindowCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.04);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.45, 1.85);
    cameraRef.current = camera;

    const cameraGroup = new THREE.Group();
    cameraGroup.position.set(0, 0, 0);
    cameraGroup.add(camera);
    scene.add(cameraGroup);
    cameraGroupRef.current = cameraGroup;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.15, -0.2);
    controlsRef.current = controls;

    const interactiveList: THREE.Object3D[] = [];
    interactiveObjectsRef.current = interactiveList;

    const gltfLoader = new GLTFLoader();

    /* ---------------- Controles WebXR e Raycaster ---------------- */
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);

    const laserGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -4)
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    controller1.add(new THREE.Line(laserGeom, laserMat));
    controller2.add(new THREE.Line(laserGeom.clone(), laserMat.clone()));

    const vrRaycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    const onSelectVR = (event: any) => {
      const controller = event.target as THREE.Group;
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      vrRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const uiIntersects = vrRaycaster.intersectObjects([spatialCloseBtnRef.current!].filter(Boolean), true);
      if (uiIntersects.length > 0) {
        if (spatialUIPanelRef.current) spatialUIPanelRef.current.visible = false;
        if (spatialCloseBtnRef.current) spatialCloseBtnRef.current.visible = false;
        triggerHapticFeedback(controller, 0.4, 30);
        return;
      }

      const objectIntersects = vrRaycaster.intersectObjects(interactiveObjectsRef.current, true);
      if (objectIntersects.length > 0) {
        let root: THREE.Object3D | null = objectIntersects[0].object;
        while (root && !root.userData?.id && root !== scene) {
          root = root.parent;
        }
        if (root?.userData?.id) {
          handleHotspotTrigger(root.userData.id, controller);
          return;
        }
      }

      if (floorRef.current) {
        const floorIntersects = vrRaycaster.intersectObject(floorRef.current);
        if (floorIntersects.length > 0 && cameraGroupRef.current) {
          const targetPoint = floorIntersects[0].point;
          cameraGroupRef.current.position.set(targetPoint.x, 0, targetPoint.z);
          triggerHapticFeedback(controller, 0.3, 25);
        }
      }
    };

    controller1.addEventListener('select', onSelectVR);
    controller2.addEventListener('select', onSelectVR);
    cameraGroup.add(controller1);
    cameraGroup.add(controller2);

    /* ---------------- WebXR Spatial UI Panel ---------------- */
    const panelGeo = new THREE.PlaneGeometry(1.6, 1.0);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const spatialPanel = new THREE.Mesh(panelGeo, panelMat);
    spatialPanel.position.set(0, 1.6, -1.2);
    spatialPanel.visible = false;
    scene.add(spatialPanel);
    spatialUIPanelRef.current = spatialPanel;

    const closeBtnGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);
    const closeBtnMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const closeBtn = new THREE.Mesh(closeBtnGeo, closeBtnMat);
    closeBtn.position.set(0.7, 0.44, 0.03);
    closeBtn.visible = false;
    spatialPanel.add(closeBtn);
    spatialCloseBtnRef.current = closeBtn;

    /* ---------------- Botão Entrar no VR ---------------- */
    const xr = (navigator as unknown as { xr?: any }).xr;
    if (xr && vrButtonContainerRef.current) {
      const button = document.createElement('button');
      button.className = 'glass-btn px-4 py-2.5 rounded-2xl text-xs font-semibold text-white tracking-wide border border-cyan-400/60 shadow-lg shadow-cyan-500/20 backdrop-blur-md flex items-center gap-2 cursor-pointer transition';
      button.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> ENTRAR NO MODO VR';

      xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        if (supported) {
          let currentSession: any = null;
          button.onclick = async () => {
            if (!currentSession) {
              try {
                const session = await xr.requestSession('immersive-vr', {
                  optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                });
                await renderer.xr.setSession(session);
                button.innerHTML = 'SAIR DO VR';
                currentSession = session;
                session.addEventListener('end', () => {
                  button.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> ENTRAR NO MODO VR';
                  currentSession = null;
                });
              } catch (e) {
                console.warn('VR session failed:', e);
              }
            } else {
              currentSession.end();
            }
          };
        } else {
          button.innerHTML = '<span class="text-slate-400">MODO 3D IMERSIVO</span>';
        }
      }).catch(() => {
        button.innerHTML = '<span class="text-slate-400">MODO 3D IMERSIVO</span>';
      });

      vrButtonContainerRef.current.innerHTML = '';
      vrButtonContainerRef.current.appendChild(button);
    }

    /* Lighting Principal */
    const ambient = new THREE.AmbientLight(0xdce7f5, 0.6);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const deskSpot = new THREE.SpotLight(0xffdfa8, 2.8, 6, Math.PI / 3, 0.45, 1.2);
    deskSpot.position.set(-0.3, 1.6, -0.6);
    deskSpot.target.position.set(0, 0.76, -0.8);
    deskSpot.castShadow = true;
    deskSpot.shadow.mapSize.width = 1024;
    deskSpot.shadow.mapSize.height = 1024;
    scene.add(deskSpot);
    scene.add(deskSpot.target);
    deskSpotRef.current = deskSpot;

    const windowLight = new THREE.DirectionalLight(0x7fcfff, 1.4);
    windowLight.position.set(0, 3.2, -4.5);
    windowLight.target.position.set(0, 1.0, 0);
    scene.add(windowLight);
    scene.add(windowLight.target);
    windowLightRef.current = windowLight;

    /* ---------------- Paredes e Piso ---------------- */
    const roomWidth = 5.2;
    const roomDepth = 4.6;
    const wallHeight = 3.2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xdfd9ce,
      roughness: 0.85,
      metalness: 0.05
    });

    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.65, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -0.3);
    floor.receiveShadow = true;
    scene.add(floor);
    floorRef.current = floor;

    const leftWallGeo = new THREE.BoxGeometry(0.12, wallHeight, roomDepth);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, -0.3);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWallGeo = new THREE.BoxGeometry(0.12, wallHeight, roomDepth);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(roomWidth / 2, wallHeight / 2, -0.3);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    const backWallMat = wallMat.clone();
    const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.7, 0.12), backWallMat);
    backWallTop.position.set(0, 2.85, -2.6);
    scene.add(backWallTop);

    const backWallBottom = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 1.05, 0.12), backWallMat);
    backWallBottom.position.set(0, 0.52, -2.6);
    scene.add(backWallBottom);

    const backWallLeft = new THREE.Mesh(new THREE.BoxGeometry((roomWidth - 2.7) / 2, 1.6, 0.12), backWallMat);
    backWallLeft.position.set(-((roomWidth - 2.7) / 4 + 1.35), 1.85, -2.6);
    scene.add(backWallLeft);

    const backWallRight = new THREE.Mesh(new THREE.BoxGeometry((roomWidth - 2.7) / 2, 1.6, 0.12), backWallMat);
    backWallRight.position.set((roomWidth - 2.7) / 4 + 1.35, 1.85, -2.6);
    scene.add(backWallRight);

    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceiling = new THREE.Mesh(ceilingGeo, new THREE.MeshStandardMaterial({ color: 0xeee9df, roughness: 0.9 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, wallHeight, -0.3);
    scene.add(ceiling);

    /* Janela para o Leme */
    const windowCanvas = renderWindowCanvas('golden');
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    windowTextureRef.current = windowTexture;

    const windowBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.6),
      new THREE.MeshBasicMaterial({ map: windowTexture })
    );
    windowBackdrop.position.set(0, 1.85, -2.62);
    windowBackdrop.userData = { id: 'window', title: 'Janela para o Leme' };
    scene.add(windowBackdrop);
    interactiveList.push(windowBackdrop);

    /* -------------------------------------------------------------
       1. MESA DE MADEIRA CENTRAL (wood_table.glb)
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/wood_table.glb',
      (gltf) => {
        const table = gltf.scene;

        table.rotation.y = Math.PI / 2;
        table.updateMatrixWorld(true);

        const bbox = new THREE.Box3().setFromObject(table);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetHeight = 0.76;
        const currentHeight = size.y > 0 ? size.y : 1;
        const computedScale = targetHeight / currentHeight;
        table.scale.set(computedScale, computedScale, computedScale);

        table.updateMatrixWorld(true);
        const updatedBox = new THREE.Box3().setFromObject(table);
        table.position.set(0, -updatedBox.min.y, -0.8);

        table.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        table.userData = { id: 'wood_table', title: 'Mesa de Madeira de Clarice' };
        scene.add(table);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/wood_table.glb:', error)
    );

    /* -------------------------------------------------------------
       2. MÁQUINA DE ESCREVER NA MESA (typewriter.glb)
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/typewriter.glb',
      (gltf) => {
        const typewriter = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(typewriter);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetWidth = 0.36;
        const currentWidth = size.x > 0 ? size.x : 1;
        const computedScale = targetWidth / currentWidth;
        typewriter.scale.set(computedScale, computedScale, computedScale);

        const updatedBox = new THREE.Box3().setFromObject(typewriter);
        typewriter.position.set(0, 0.76 - updatedBox.min.y, -0.75);
        typewriter.rotation.y = 0;

        typewriter.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        typewriter.userData = { id: 'typewriter', title: 'Máquina de Escrever Olympia' };
        interactiveList.push(typewriter);
        scene.add(typewriter);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/typewriter.glb na mesa:', error)
    );

    /* -------------------------------------------------------------
       3. XÍCARA DE CAFÉ SOBRE A MESA (xicara.glb)
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/xicara.glb',
      (gltf) => {
        const cup = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(cup);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetWidth = 0.12;
        const currentWidth = size.x > 0 ? size.x : 1;
        const computedScale = targetWidth / currentWidth;
        cup.scale.set(computedScale, computedScale, computedScale);

        const updatedBox = new THREE.Box3().setFromObject(cup);
        cup.position.set(0.55, 0.76 - updatedBox.min.y, -0.75);

        cup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        cup.userData = { id: 'xicara', title: 'Xícara de Café' };
        interactiveList.push(cup);
        scene.add(cup);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/xicara.glb:', error)
    );

    /* -------------------------------------------------------------
       4. ESTANTE DE LIVROS (bookshelf.glb) - ENCOSTADA NA PAREDE DIREITA
       Rotacionada com a frente voltada para o interior (-X) e encostada em x = 2.45
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/bookshelf.glb',
      (gltf) => {
        const shelf = gltf.scene;

        // Rotação para virar as prateleiras para o interior da sala (-X)
        shelf.rotation.y = -Math.PI / 2;
        shelf.updateMatrixWorld(true);

        const bbox = new THREE.Box3().setFromObject(shelf);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetHeight = 1.95;
        const currentHeight = size.y > 0 ? size.y : 1;
        const computedScale = targetHeight / currentHeight;
        shelf.scale.set(computedScale, computedScale, computedScale);

        shelf.updateMatrixWorld(true);
        const updatedBox = new THREE.Box3().setFromObject(shelf);
        // Encostada rente à parede lateral direita (x = 2.45) e um pouco mais para o fundo (z = -0.6)
        shelf.position.set(2.45 - updatedBox.max.x, -updatedBox.min.y, -0.6);

        shelf.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        shelf.userData = { id: 'bookshelf', title: 'Estante de Manuscritos & Livros' };
        interactiveList.push(shelf);
        scene.add(shelf);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/bookshelf.glb:', error)
    );

    /* -------------------------------------------------------------
       5. MÁQUINA DE ESCREVER NO SOFÁ
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/typewriter.glb',
      (gltf) => {
        const sofaTypewriter = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(sofaTypewriter);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetWidth = 0.32;
        const currentWidth = size.x > 0 ? size.x : 1;
        const computedScale = targetWidth / currentWidth;
        sofaTypewriter.scale.set(computedScale, computedScale, computedScale);

        const updatedBox = new THREE.Box3().setFromObject(sofaTypewriter);
        // Sobre o assento do sofá encostado na parede esquerda
        sofaTypewriter.position.set(-2.0, 0.48 - updatedBox.min.y, 0.15);
        sofaTypewriter.rotation.y = Math.PI / 2 + 0.15;

        sofaTypewriter.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        sofaTypewriter.userData = { id: 'sofa_typewriter', title: 'Máquina Portátil no Sofá' };
        interactiveList.push(sofaTypewriter);
        scene.add(sofaTypewriter);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/typewriter.glb no sofá:', error)
    );

    /* -------------------------------------------------------------
       6. CADEIRA DE BALANÇO THONET (rocking_chair.glb)
    -------------------------------------------------------------- */
    gltfLoader.load(
      '/models/rocking_chair.glb',
      (gltf) => {
        const chair = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(chair);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const targetHeight = 0.95;
        const currentHeight = size.y > 0 ? size.y : 1;
        const computedScale = targetHeight / currentHeight;
        chair.scale.set(computedScale, computedScale, computedScale);

        const updatedBox = new THREE.Box3().setFromObject(chair);
        // Ao lado da mesa, sem obstruções
        chair.position.set(0.95, -updatedBox.min.y, -0.4);
        chair.rotation.y = -Math.PI / 6;

        chair.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        chair.userData = { id: 'rocking_chair', title: 'Cadeira de Balanço Thonet' };
        interactiveList.push(chair);
        scene.add(chair);
      },
      undefined,
      (error) => console.error('Erro ao carregar /models/rocking_chair.glb:', error)
    );

    /* Móveis Autênticos Fixos (Sem pilhas de livros na mesa) */
    scene.add(createWainscotingAndWallArt(interactiveList));
    scene.add(createModernistSofa(interactiveList));
    scene.add(createSideTableAndRotaryPhone(interactiveList));

    /* Hotspot markers */
    const markers = [
      { id: 'typewriter', pos: new THREE.Vector3(0, 0.95, -0.75), color: 0xf59e0b },
      { id: 'xicara', pos: new THREE.Vector3(0.55, 0.95, -0.75), color: 0xf43f5e },
      { id: 'window', pos: new THREE.Vector3(0, 2.2, -2.4), color: 0x38bdf8 },
      { id: 'rocking_chair', pos: new THREE.Vector3(0.95, 0.95, -0.4), color: 0xeab308 },
      { id: 'sofa_typewriter', pos: new THREE.Vector3(-2.0, 0.75, 0.15), color: 0x10b981 },
      { id: 'rotary_phone', pos: new THREE.Vector3(-2.05, 0.75, -0.95), color: 0xef4444 },
      { id: 'bookshelf', pos: new THREE.Vector3(2.1, 1.4, -0.6), color: 0xa855f7 }
    ];

    const rings: THREE.Mesh[] = [];
    markers.forEach((m) => {
      const ringGeo = new THREE.RingGeometry(0.04, 0.055, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: m.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(m.pos);
      ring.userData = { id: m.id, isHotspot: true };
      scene.add(ring);
      rings.push(ring);
      interactiveList.push(ring);
    });
    hotspotRingsRef.current = rings;

    /* Dust Motes System */
    const dustSystem = createDustMotesSystem(240);
    dustSystem.setTimeOfDay(timeOfDay);
    scene.add(dustSystem.group);
    dustSystemRef.current = dustSystem;

    /* Desktop Click Raycasting */
    const mouseRaycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerClick = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRaycaster.setFromCamera(mouse, camera);
      const intersects = mouseRaycaster.intersectObjects(interactiveObjectsRef.current, true);
      if (intersects.length > 0) {
        let root: THREE.Object3D | null = intersects[0].object;
        while (root && !root.userData?.id && root !== scene) {
          root = root.parent;
        }
        if (root?.userData?.id) {
          handleHotspotTrigger(root.userData.id);
        }
      }
    };
    window.addEventListener('click', onPointerClick);

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    /* Snap Turn & Loop */
    const clock = new THREE.Clock();
    let snapCooldown = false;

    renderer.setAnimationLoop(() => {
      const time = clock.getElapsedTime();

      hotspotRingsRef.current.forEach((r) => {
        r.lookAt(camera.position);
        const scale = 1 + Math.sin(time * 3.0) * 0.08;
        r.scale.set(scale, scale, scale);
      });

      if (spatialUIPanelRef.current && spatialUIPanelRef.current.visible) {
        spatialUIPanelRef.current.lookAt(camera.position);
      }

      const session = renderer.xr.getSession();
      if (session) {
        for (const source of session.inputSources) {
          if (source.gamepad && source.handedness === 'right') {
            const axisX = source.gamepad.axes[2] || source.gamepad.axes[0] || 0;
            if (Math.abs(axisX) > 0.75) {
              if (!snapCooldown && cameraGroupRef.current) {
                const angle = axisX > 0 ? -Math.PI / 4 : Math.PI / 4;
                cameraGroupRef.current.rotation.y += angle;
                snapCooldown = true;
                setTimeout(() => { snapCooldown = false; }, 400);
              }
            }
          }
        }
      }

      if (dustSystemRef.current && dustSystemRef.current.group.visible) {
        dustSystemRef.current.update(time);
      }

      if (!renderer.xr.isPresenting) {
        controls.update();
      }

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('click', onPointerClick);
      window.removeEventListener('resize', onWindowResize);
      renderer.setAnimationLoop(null);
      dustSystem.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleHotspotTrigger, renderWindowCanvas, timeOfDay]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#080a0f]">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Header */}
      <header className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="glass-panel px-5 py-3 rounded-2xl pointer-events-auto flex items-center space-x-4 border-l-4 border-cyan-400">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h1 className="text-xs tracking-widest text-cyan-400 uppercase font-semibold">
                Espaço Imersivo WebXR
              </h1>
            </div>
            <h2 className="text-base sm:text-lg font-serif-vintage tracking-wider text-slate-100 font-bold">
              O Gabinete de Clarice Lispector
            </h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => {
              const next = timeOfDay === 'golden' ? 'night' : timeOfDay === 'night' ? 'day' : 'golden';
              setTimeOfDay(next);
              playTypewriterClick(0.7);
            }}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-amber-300"
            title="Alternar Atmosfera"
          >
            {timeOfDay === 'golden' ? <Sun className="w-5 h-5 text-amber-400" /> : timeOfDay === 'night' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-sky-400" />}
          </button>

          <button
            onClick={() => toggleOceanSound()}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-cyan-300"
            title={isOceanPlaying ? "Desativar Maré" : "Ouvir Mar"}
          >
            {isOceanPlaying ? <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Botão VR */}
      <div ref={vrButtonContainerRef} className="absolute bottom-6 right-6 z-20 pointer-events-auto" />

      {/* Modal Desktop da Máquina */}
      {activeModal === 'typewriter' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-amber-400/30">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3 mb-3">
              <Keyboard className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-serif-vintage text-amber-200 font-bold">
                Máquina de Escrever Olympia
              </h3>
            </div>
            <textarea
              rows={5}
              value={typedText}
              onChange={(e) => {
                setTypedText(e.target.value);
                playTypewriterClick(0.8);
              }}
              className="w-full bg-[#f5edd6] text-stone-900 rounded-xl p-4 font-mono-type text-sm outline-none"
              placeholder="Digite seus pensamentos..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
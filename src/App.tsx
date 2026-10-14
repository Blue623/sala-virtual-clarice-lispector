/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Volume2,
  VolumeX,
  Crosshair,
  HelpCircle,
  Keyboard,
  Waves,
  BookOpen,
  Mic,
  Feather,
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Sparkles,
  Sun,
  Moon,
  Check,
  Upload,
  RotateCcw,
  Phone,
  Camera,
  Coffee,
  Quote,
  Armchair
} from 'lucide-react';
import {
  createWainscotingAndWallArt,
  createThonetRockingChair,
  createModernistSofa,
  createStripedRug,
  createSlattedCoffeeTable,
  createSideTableAndRotaryPhone,
  createDiningNookAndGreenLamp,
  createBookcaseCeramicsAndRecords,
  createDeskBookStacksAndCoffee
} from './furniture3D.ts';
import { HISTORICAL_PHOTOS } from './historicalPhotos.ts';
import {
  WINDOW_PHOTO_PRESETS,
  WindowPhotoPresetId,
  renderPhotographicWindow
} from './windowPhotography.ts';
import {
  createDustMotesSystem,
  DustMotesSystem
} from './dustParticles.ts';

interface NoteItem {
  id: number;
  date: string;
  text: string;
}

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

  // Audio state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oceanGainRef = useRef<GainNode | null>(null);
  const [isOceanPlaying, setIsOceanPlaying] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(0.3);

  // Time of Day state: 'golden', 'night', 'day'
  const [timeOfDay, setTimeOfDay] = useState<'golden' | 'night' | 'day'>('golden');

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Typewriter state
  const [typedText, setTypedText] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<NoteItem[]>([]);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [copiedNoteId, setCopiedNoteId] = useState<number | null>(null);

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
  const [dustMotesActive, setDustMotesActive] = useState<boolean>(true);

  // Spatial UI Panel in 3D for Meta Quest
  const spatialUIPanelRef = useRef<THREE.Mesh | null>(null);
  const spatialCloseBtnRef = useRef<THREE.Mesh | null>(null);

  // Load saved notes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('clarice_study_notes');
      if (stored) setSavedNotes(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const saveNoteList = (notes: NoteItem[]) => {
    setSavedNotes(notes);
    try {
      localStorage.setItem('clarice_study_notes', JSON.stringify(notes));
    } catch {
      // ignore
    }
  };

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

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.04);
      oscGain.gain.setValueAtTime(0.3 * intensity * soundVolume * 3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
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

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      lfoGain.gain.setValueAtTime(170, ctx.currentTime);
      lfo.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25 * soundVolume * 3, ctx.currentTime + 1.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      lfo.start();
      oceanGainRef.current = gain;
      setIsOceanPlaying(true);
    } catch (err) {
      console.warn('Ocean sound init error:', err);
    }
  }, [initAudio, isOceanPlaying, soundVolume]);

  const playRotaryDialSound = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 7; i++) {
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
      osc.frequency.linearRampToValueAtTime(80, now + 0.28);
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

  // Gallery and window
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [customWindowImage, setCustomWindowImage] = useState<string | null>(null);
  const [windowPanoramaDataUrl, setWindowPanoramaDataUrl] = useState<string>('');
  const customImgElementRef = useRef<HTMLImageElement | null>(null);

  const [windowPhotoPreset, setWindowPhotoPreset] = useState<WindowPhotoPresetId>(() => {
    try {
      return (localStorage.getItem('clarice_window_photo_preset') as WindowPhotoPresetId) || 'copacabana_view';
    } catch {
      return 'copacabana_view';
    }
  });

  const renderWindowCanvas = useCallback((
    mode: 'golden' | 'night' | 'day',
    customImg?: HTMLImageElement | null,
    presetId?: WindowPhotoPresetId
  ) => {
    const activePreset = presetId || windowPhotoPreset;
    return renderPhotographicWindow(activePreset, mode, customImg !== undefined ? customImg : customImgElementRef.current);
  }, [windowPhotoPreset]);

  /* ---------------- Helper: Render Spatial UI Canvas Texture for Meta Quest ---------------- */
  const updateSpatialVRPanel = useCallback((title: string, lines: string[]) => {
    if (!spatialUIPanelRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Glassmorphism Panel
    ctx.fillStyle = 'rgba(8, 12, 22, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header Tag
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px Courier Prime, monospace';
    ctx.fillText('CLARICE LISPECTOR • ESPAÇO VIRTUAL META QUEST', 50, 70);

    // Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 44px serif';
    ctx.fillText(title, 50, 140);

    // Separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 170);
    ctx.lineTo(974, 170);
    ctx.stroke();

    // Body Lines
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '30px serif';
    let yPos = 240;
    lines.forEach((line) => {
      ctx.fillText(line, 50, yPos);
      yPos += 48;
    });

    // Footer tip
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px Courier Prime, monospace';
    ctx.fillText('[Aponte com o controle no botão vermelho para fechar]', 50, 580);

    const texture = new THREE.CanvasTexture(canvas);
    (spatialUIPanelRef.current.material as THREE.MeshBasicMaterial).map = texture;
    (spatialUIPanelRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    spatialUIPanelRef.current.visible = true;
    if (spatialCloseBtnRef.current) spatialCloseBtnRef.current.visible = true;
  }, []);

  /* ---------------- Trigger Hotspot Modal (Unificado Desktop + VR) ---------------- */
  const handleHotspotTrigger = useCallback((id: string) => {
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
        'O som das marés acompanha suas criações.'
      ]);
    } else if (id === 'sofa') {
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
    } else if (id === 'wall_quote') {
      playTypewriterClick(0.8);
      updateSpatialVRPanel('A Inscrição na Parede', [
        '"Se vocês gostam de escrever ou desenhar ou pintar, façam!',
        'A gente não se sente mais sozinha, e fica de coração quente."',
        '',
        'Manifesto afetivo pintado no apartamento.'
      ]);
    } else {
      playTypewriterClick(0.9);
      updateSpatialVRPanel('Memórias de Clarice', [
        'Registro de fragmentos literários, fotos e manuscritos.',
        'Explore outros anéis luminosos pela sala.'
      ]);
    }
    setActiveModal(id);
  }, [playTypewriterClick, playRotaryDialSound, playRockingCreakSound, toggleOceanSound, updateSpatialVRPanel, quoteIndex]);

  /* ---------------- Update Lighting on TimeOfDay change ---------------- */
  useEffect(() => {
    if (!deskSpotRef.current || !windowLightRef.current || !ambientLightRef.current || !windowTextureRef.current) return;

    const canvas = renderWindowCanvas(timeOfDay, customImgElementRef.current);
    windowTextureRef.current.image = canvas;
    windowTextureRef.current.needsUpdate = true;
    try {
      setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
    } catch {
      // ignore
    }

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

  /* ---------------- Three.js Scene Setup (com Meta Quest WebXR) ---------------- */
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

    // Rig para compatibilidade entre Desktop Orbit e VR Quest
    const cameraGroup = new THREE.Group();
    cameraGroup.position.set(0, 0, 0);
    cameraGroup.add(camera);
    scene.add(cameraGroup);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Orbit Controls (Desktop)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.15, -0.2);
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 5.0;
    controlsRef.current = controls;

    const interactiveList: THREE.Object3D[] = [];
    interactiveObjectsRef.current = interactiveList;

    /* ---------------- Meta Quest VR Controllers & Laser Ray ---------------- */
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);

    const laserGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3.5)
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });

    const laser1 = new THREE.Line(laserGeom, laserMat);
    const laser2 = new THREE.Line(laserGeom.clone(), laserMat.clone());
    controller1.add(laser1);
    controller2.add(laser2);

    const vrRaycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    const onSelectVR = (event: any) => {
      const controller = event.target as THREE.Group;
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      vrRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = vrRaycaster.intersectObjects(interactiveObjectsRef.current, true);
      if (intersects.length > 0) {
        let root: THREE.Object3D | null = intersects[0].object;
        while (root && !root.userData?.id && root !== scene) {
          root = root.parent;
        }
        if (root && root.userData?.id) {
          if (root.userData.id === 'close_spatial_ui') {
            if (spatialUIPanelRef.current) spatialUIPanelRef.current.visible = false;
            if (spatialCloseBtnRef.current) spatialCloseBtnRef.current.visible = false;
            playTypewriterClick(0.6);
          } else {
            handleHotspotTrigger(root.userData.id);
          }
        }
      }
    };

    controller1.addEventListener('select', onSelectVR);
    controller2.addEventListener('select', onSelectVR);
    cameraGroup.add(controller1);
    cameraGroup.add(controller2);

    /* ---------------- WebXR Spatial UI Panel 3D ---------------- */
    const panelGeo = new THREE.PlaneGeometry(1.6, 1.0);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const spatialPanel = new THREE.Mesh(panelGeo, panelMat);
    spatialPanel.position.set(0, 1.6, -1.2);
    spatialPanel.visible = false;
    scene.add(spatialPanel);
    spatialUIPanelRef.current = spatialPanel;

    // Botão de fechar o painel 3D
    const closeBtnGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);
    const closeBtnMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const closeBtn = new THREE.Mesh(closeBtnGeo, closeBtnMat);
    closeBtn.position.set(0.7, 0.44, 0.03);
    closeBtn.userData = { id: 'close_spatial_ui' };
    closeBtn.visible = false;
    spatialPanel.add(closeBtn);
    spatialCloseBtnRef.current = closeBtn;
    interactiveList.push(closeBtn);

    /* ---------------- WebXR Session Setup Button ---------------- */
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

    /* Lighting */
    const ambient = new THREE.AmbientLight(0xdce7f5, 0.55);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const deskSpot = new THREE.SpotLight(0xffdfa8, 2.8, 6, Math.PI / 3, 0.45, 1.2);
    deskSpot.position.set(-0.45, 1.75, -0.25);
    deskSpot.target.position.set(0, 0.9, -0.3);
    deskSpot.castShadow = true;
    scene.add(deskSpot);
    scene.add(deskSpot.target);
    deskSpotRef.current = deskSpot;

    const windowLight = new THREE.DirectionalLight(0x7fcfff, 1.4);
    windowLight.position.set(0, 3.2, -4.5);
    windowLight.target.position.set(0, 1.0, 0);
    scene.add(windowLight);
    scene.add(windowLight.target);
    windowLightRef.current = windowLight;

    /* Room Architecture */
    const room = new THREE.Group();
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.65, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    const ceilGeo = new THREE.PlaneGeometry(8, 8);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.y = 3.2;
    ceiling.rotation.x = Math.PI / 2;
    room.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.85 });
    const backWallL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.2), wallMat);
    backWallL.position.set(-2.2, 1.6, -2.6);
    room.add(backWallL);

    const backWallR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.2), wallMat);
    backWallR.position.set(2.2, 1.6, -2.6);
    room.add(backWallR);

    const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.2), wallMat);
    backWallTop.position.set(0, 2.85, -2.6);
    room.add(backWallTop);

    const backWallBtm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.25), wallMat);
    backWallBtm.position.set(0, 0.45, -2.6);
    room.add(backWallBtm);

    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 8), wallMat);
    sideWallL.position.set(-3.0, 1.6, 0);
    room.add(sideWallL);

    const sideWallR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 8), wallMat);
    sideWallR.position.set(3.0, 1.6, 0);
    room.add(sideWallR);
    scene.add(room);

    /* Window View to Copacabana */
    const windowCanvas = renderWindowCanvas('golden');
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    windowTextureRef.current = windowTexture;

    const windowBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.6),
      new THREE.MeshBasicMaterial({ map: windowTexture })
    );
    windowBackdrop.position.set(0, 1.85, -2.62);
    windowBackdrop.userData = { id: 'window', title: 'Janela para o Leme e Atlântico' };
    scene.add(windowBackdrop);
    interactiveList.push(windowBackdrop);

    /* Desk Assembly */
    const deskGroup = new THREE.Group();
    const woodDeskMat = new THREE.MeshStandardMaterial({ color: 0x472d1f, roughness: 0.4 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.15), woodDeskMat);
    deskTop.position.set(0, 0.95, -0.3);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Máquina de Escrever Olympia
    const typewriterGroup = new THREE.Group();
    typewriterGroup.position.set(0, 1.0, -0.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.34), new THREE.MeshStandardMaterial({ color: 0x222428 }));
    typewriterGroup.add(body);
    typewriterGroup.userData = { id: 'typewriter', title: 'Máquina de Escrever Olympia' };
    interactiveList.push(typewriterGroup);
    deskGroup.add(typewriterGroup);

    // Microfone TV Cultura 1977
    const micHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 })
    );
    micHead.position.set(0.28, 1.26, -0.32);
    micHead.userData = { id: 'interview', title: 'Entrevista 1977' };
    interactiveList.push(micHead);
    deskGroup.add(micHead);

    scene.add(deskGroup);

    /* Authentic Furniture */
    scene.add(createWainscotingAndWallArt(interactiveList));
    scene.add(createStripedRug());
    scene.add(createModernistSofa(interactiveList));
    scene.add(createThonetRockingChair(interactiveList));
    scene.add(createSlattedCoffeeTable(interactiveList));
    scene.add(createSideTableAndRotaryPhone(interactiveList));
    scene.add(createDiningNookAndGreenLamp(interactiveList));
    scene.add(createBookcaseCeramicsAndRecords());
    deskGroup.add(createDeskBookStacksAndCoffee());

    /* Hotspot markers */
    const markers = [
      { id: 'typewriter', pos: new THREE.Vector3(0, 1.25, -0.2), color: 0xf59e0b },
      { id: 'window', pos: new THREE.Vector3(0, 2.2, -2.4), color: 0x38bdf8 },
      { id: 'interview', pos: new THREE.Vector3(0.28, 1.35, -0.32), color: 0xc084fc },
      { id: 'rocking_chair', pos: new THREE.Vector3(-0.8, 0.95, 0.45), color: 0xeab308 },
      { id: 'sofa', pos: new THREE.Vector3(-2.0, 0.85, 0.2), color: 0x10b981 },
      { id: 'rotary_phone', pos: new THREE.Vector3(-2.05, 0.75, -0.95), color: 0xef4444 },
      { id: 'coffee_table', pos: new THREE.Vector3(-1.25, 0.55, 0.45), color: 0x06b6d4 },
      { id: 'wall_quote', pos: new THREE.Vector3(-2.8, 1.85, 0.8), color: 0xa855f7 }
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
    const dustSystem = createDustMotesSystem(350);
    dustSystem.setTimeOfDay(timeOfDay);
    scene.add(dustSystem.group);
    dustSystemRef.current = dustSystem;

    /* Desktop Mouse Raycasting */
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
        if (root && root.userData?.id) {
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

    /* Animation Loop */
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const time = clock.getElapsedTime();

      // Pulsing rings e rotação para a câmera
      hotspotRingsRef.current.forEach((r) => {
        r.lookAt(camera.position);
        const scale = 1 + Math.sin(time * 3.0) * 0.08;
        r.scale.set(scale, scale, scale);
      });

      // Painel espacial sempre virado para o jogador em VR
      if (spatialUIPanelRef.current && spatialUIPanelRef.current.visible) {
        spatialUIPanelRef.current.lookAt(camera.position);
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
      {/* 3D Canvas */}
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

        {/* Quick Toolbar */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => {
              const next = timeOfDay === 'golden' ? 'night' : timeOfDay === 'night' ? 'day' : 'golden';
              setTimeOfDay(next);
              playTypewriterClick(0.7);
            }}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-amber-300"
            title="Alternar Horário do Dia"
          >
            {timeOfDay === 'golden' ? <Sun className="w-5 h-5 text-amber-400" /> : timeOfDay === 'night' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-sky-400" />}
          </button>

          <button
            onClick={() => toggleOceanSound()}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-cyan-300"
            title={isOceanPlaying ? "Desativar Maré" : "Ouvir Mar de Copacabana"}
          >
            {isOceanPlaying ? <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* VR Button Mount Target */}
      <div ref={vrButtonContainerRef} className="absolute bottom-6 right-6 z-20 pointer-events-auto" />

      {/* Modais de desktop mantidos quando fora do VR */}
      {activeModal === 'typewriter' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-amber-400/30">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-serif-vintage text-amber-200 font-bold mb-3">
              Máquina de Escrever Olympia
            </h3>
            <textarea
              rows={5}
              value={typedText}
              onChange={(e) => {
                setTypedText(e.target.value);
                playTypewriterClick(0.8);
              }}
              className="w-full bg-[#f5edd6] text-stone-900 rounded-xl p-4 font-mono-type text-sm outline-none"
              placeholder="Digite suas ideias ou pensamentos de Clarice..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
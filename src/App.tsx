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
  Compass,
  Check,
  Upload,
  Image as ImageIcon,
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
import { HISTORICAL_PHOTOS, ArchivalPhoto } from './historicalPhotos.ts';
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

  // Time of Day state: 'golden' (entardecer), 'night' (madrugada), 'day' (meio-dia)
  const [timeOfDay, setTimeOfDay] = useState<'golden' | 'night' | 'day'>('golden');

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Typewriter text state
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

  // Load saved notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('clarice_study_notes');
      if (stored) {
        setSavedNotes(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save notes to localStorage
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
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
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

      // Noise click
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

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

      // Deep mechanical strike
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

      // Carriage bell (periodic)
      if (Math.random() < 0.15) {
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(2520, now + 0.02);
        bellGain.gain.setValueAtTime(0.12 * soundVolume * 3, now + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        bell.connect(bellGain);
        bellGain.connect(ctx.destination);
        bell.start(now + 0.02);
        bell.stop(now + 0.47);
      }
    } catch {
      // Audio fallback silent
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
        setTimeout(() => {
          setIsOceanPlaying(false);
        }, 1000);
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
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec wave surge
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

  /* Mechanical Rotary Telephone Dial Sound */
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
      const rewindTime = now + 0.38;
      const oscR = ctx.createOscillator();
      const gainR = ctx.createGain();
      oscR.type = 'sawtooth';
      oscR.frequency.setValueAtTime(320, rewindTime);
      oscR.frequency.exponentialRampToValueAtTime(110, rewindTime + 0.35);
      gainR.gain.setValueAtTime(0.08 * soundVolume * 3, rewindTime);
      gainR.gain.exponentialRampToValueAtTime(0.001, rewindTime + 0.35);
      oscR.connect(gainR);
      gainR.connect(ctx.destination);
      oscR.start(rewindTime);
      oscR.stop(rewindTime + 0.36);
    } catch {
      // ignore
    }
  }, [initAudio, soundVolume]);

  /* Bentwood Thonet Chair Creak Sound */
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

  // Selected archival photo for museum gallery
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  // Image state for window
  const [customWindowImage, setCustomWindowImage] = useState<string | null>(null);
  const [windowPanoramaDataUrl, setWindowPanoramaDataUrl] = useState<string>('');
  const customImgElementRef = useRef<HTMLImageElement | null>(null);

  // Photo Preset for the 3D window (persisted in localStorage)
  const [windowPhotoPreset, setWindowPhotoPreset] = useState<WindowPhotoPresetId>(() => {
    try {
      return (localStorage.getItem('clarice_window_photo_preset') as WindowPhotoPresetId) || 'copacabana_view';
    } catch {
      return 'copacabana_view';
    }
  });

  /* ---------------- Photographic Window Renderer ---------------- */
  const renderWindowCanvas = useCallback((
    mode: 'golden' | 'night' | 'day',
    customImg?: HTMLImageElement | null,
    presetId?: WindowPhotoPresetId
  ) => {
    const activePreset = presetId || windowPhotoPreset;
    return renderPhotographicWindow(activePreset, mode, customImg !== undefined ? customImg : customImgElementRef.current);
  }, [windowPhotoPreset]);

  const handleSelectPreset = (presetId: WindowPhotoPresetId) => {
    setWindowPhotoPreset(presetId);
    setCustomWindowImage(null);
    customImgElementRef.current = null;
    try {
      localStorage.setItem('clarice_window_photo_preset', presetId);
      localStorage.removeItem('clarice_study_window_custom_img');
    } catch {
      // ignore
    }
    const canvas = renderWindowCanvas(timeOfDay, null, presetId);
    if (windowTextureRef.current) {
      windowTextureRef.current.image = canvas;
      windowTextureRef.current.needsUpdate = true;
    }
    try {
      setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
    } catch {
      // ignore
    }
    playTypewriterClick(0.9);
  };

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

  // Sync dust motes visibility
  useEffect(() => {
    if (dustSystemRef.current) {
      dustSystemRef.current.group.visible = dustMotesActive;
    }
  }, [dustMotesActive]);

  // Image Upload handler for window view
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        customImgElementRef.current = img;
        setCustomWindowImage(dataUrl);
        try {
          localStorage.setItem('clarice_study_window_custom_img', dataUrl);
        } catch {
          // ignore quota limits
        }
        const canvas = renderWindowCanvas(timeOfDay, img);
        if (windowTextureRef.current) {
          windowTextureRef.current.image = canvas;
          windowTextureRef.current.needsUpdate = true;
        }
        setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        playTypewriterClick(1.2);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleResetArtwork = () => {
    customImgElementRef.current = null;
    setCustomWindowImage(null);
    try {
      localStorage.removeItem('clarice_study_window_custom_img');
    } catch {
      // ignore
    }
    const canvas = renderWindowCanvas(timeOfDay, null);
    if (windowTextureRef.current) {
      windowTextureRef.current.image = canvas;
      windowTextureRef.current.needsUpdate = true;
    }
    setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
    playTypewriterClick(0.7);
  };

  // Drag and drop state for applying leme.jpg anywhere on the screen
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            customImgElementRef.current = img;
            setCustomWindowImage(dataUrl);
            try {
              localStorage.setItem('clarice_study_window_custom_img', dataUrl);
            } catch {
              // ignore
            }
            const canvas = renderWindowCanvas(timeOfDay, img);
            if (windowTextureRef.current) {
              windowTextureRef.current.image = canvas;
              windowTextureRef.current.needsUpdate = true;
            }
            setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
            playTypewriterClick(1.5);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [renderWindowCanvas, timeOfDay, playTypewriterClick]);

  // Load saved custom window image from localStorage on mount
  useEffect(() => {
    try {
      const savedImg = localStorage.getItem('clarice_study_window_custom_img');
      if (savedImg) {
        const img = new Image();
        img.onload = () => {
          customImgElementRef.current = img;
          setCustomWindowImage(savedImg);
          const canvas = renderWindowCanvas(timeOfDay, img);
          if (windowTextureRef.current) {
            windowTextureRef.current.image = canvas;
            windowTextureRef.current.needsUpdate = true;
          }
          setWindowPanoramaDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.src = savedImg;
      }
    } catch {
      // ignore
    }
  }, [renderWindowCanvas, timeOfDay]);

  /* ---------------- Three.js Scene Setup ---------------- */
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

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.15, -0.2);
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 5.0;
    controlsRef.current = controls;

    // WebXR VR button setup
    const xr = (navigator as unknown as { xr?: { isSessionSupported: (mode: string) => Promise<boolean>; requestSession: (mode: string, options?: any) => Promise<any> } }).xr;
    if (xr && vrButtonContainerRef.current) {
      const button = document.createElement('button');
      button.className = 'glass-btn px-4 py-2.5 rounded-2xl text-xs font-semibold text-white tracking-wide border border-cyan-400/60 shadow-lg shadow-cyan-500/20 backdrop-blur-md flex items-center gap-2 cursor-pointer transition';
      button.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> MODO VR (META QUEST)';

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
                  button.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> MODO VR (META QUEST)';
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
          button.title = 'WebXR VR compatível com Meta Quest / Apple Vision Pro.';
        }
      }).catch(() => {
        button.innerHTML = '<span class="text-slate-400">MODO 3D IMERSIVO</span>';
      });

      vrButtonContainerRef.current.innerHTML = '';
      vrButtonContainerRef.current.appendChild(button);
    }

    // Interactive array
    const interactiveList: THREE.Object3D[] = [];
    interactiveObjectsRef.current = interactiveList;

    /* Lighting */
    const ambient = new THREE.AmbientLight(0xdce7f5, 0.55);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const deskSpot = new THREE.SpotLight(0xffdfa8, 2.8, 6, Math.PI / 3, 0.45, 1.2);
    deskSpot.position.set(-0.45, 1.75, -0.25);
    deskSpot.target.position.set(0, 0.9, -0.3);
    deskSpot.castShadow = true;
    deskSpot.shadow.bias = -0.001;
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

    const cyanRim = new THREE.PointLight(0x38bdf8, 1.1, 5);
    cyanRim.position.set(1.6, 0.7, -0.5);
    scene.add(cyanRim);

    const purpleRim = new THREE.PointLight(0xa855f7, 0.8, 4.5);
    purpleRim.position.set(-1.6, 0.8, -0.6);
    scene.add(purpleRim);

    /* Room Architecture */
    const room = new THREE.Group();

    // Wood floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.65, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(8, 8);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.y = 3.2;
    ceiling.rotation.x = Math.PI / 2;
    room.add(ceiling);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.85 });

    const backWallL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.2), wallMat);
    backWallL.position.set(-2.2, 1.6, -2.6);
    backWallL.receiveShadow = true;
    room.add(backWallL);

    const backWallR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.2), wallMat);
    backWallR.position.set(2.2, 1.6, -2.6);
    backWallR.receiveShadow = true;
    room.add(backWallR);

    const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.2), wallMat);
    backWallTop.position.set(0, 2.85, -2.6);
    room.add(backWallTop);

    const backWallBtm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.25), wallMat);
    backWallBtm.position.set(0, 0.45, -2.6);
    backWallBtm.receiveShadow = true;
    room.add(backWallBtm);

    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 8), wallMat);
    sideWallL.position.set(-3.0, 1.6, 0);
    sideWallL.receiveShadow = true;
    room.add(sideWallL);

    const sideWallR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 8), wallMat);
    sideWallR.position.set(3.0, 1.6, 0);
    sideWallR.receiveShadow = true;
    room.add(sideWallR);

    // Subtle neon cyber-baseboard
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    trim.position.set(0, 0.03, -2.48);
    room.add(trim);
    scene.add(room);

    /* Window View to Copacabana */
    const windowCanvas = renderWindowCanvas('golden');
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    windowTextureRef.current = windowTexture;
    try {
      setWindowPanoramaDataUrl(windowCanvas.toDataURL('image/jpeg', 0.92));
    } catch {
      // ignore
    }

    const windowBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.6),
      new THREE.MeshBasicMaterial({ map: windowTexture })
    );
    windowBackdrop.position.set(0, 1.85, -2.62);
    windowBackdrop.userData = { id: 'window', title: 'Janela para o Leme e Atlântico' };
    scene.add(windowBackdrop);
    interactiveList.push(windowBackdrop);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b1d15, roughness: 0.5 });
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.65, 0.08), frameMat);
    outerFrame.position.set(0, 1.85, -2.55);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.1), frameMat);
    hBar.position.set(0, 1.85, -2.53);
    const vBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.1), frameMat);
    vBar1.position.set(-0.55, 1.85, -2.53);
    const vBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.1), frameMat);
    vBar2.position.set(0.55, 1.85, -2.53);
    scene.add(outerFrame, hBar, vBar1, vBar2);

    /* Desk Assembly */
    const deskGroup = new THREE.Group();
    const woodDeskMat = new THREE.MeshStandardMaterial({ color: 0x472d1f, roughness: 0.4, metalness: 0.08 });

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.15), woodDeskMat);
    deskTop.position.set(0, 0.95, -0.3);
    deskTop.receiveShadow = true;
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    // Futuristic under-rail
    const deskGlow = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 0.02, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    deskGlow.position.set(0, 0.91, -0.3);
    deskGroup.add(deskGlow);

    const leftPed = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 1.0), woodDeskMat);
    leftPed.position.set(-0.75, 0.46, -0.3);
    leftPed.castShadow = true;
    leftPed.receiveShadow = true;
    const rightPed = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 1.0), woodDeskMat);
    rightPed.position.set(0.75, 0.46, -0.3);
    rightPed.castShadow = true;
    rightPed.receiveShadow = true;
    deskGroup.add(leftPed, rightPed);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xc49b55, metalness: 0.9, roughness: 0.2 });
    for (let y = 0.25; y <= 0.75; y += 0.25) {
      const hL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), handleMat);
      hL.position.set(-0.75, y, 0.22);
      const hR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), handleMat);
      hR.position.set(0.75, y, 0.22);
      deskGroup.add(hL, hR);
    }

    // 1. Olympia Typewriter
    const typewriterGroup = new THREE.Group();
    typewriterGroup.position.set(0, 1.0, -0.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.34), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.5, metalness: 0.3 }));
    body.castShadow = true;
    typewriterGroup.add(body);

    const keysBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: 0x16171a }));
    keysBase.position.set(0, 0.05, 0.07);
    keysBase.rotation.x = 0.2;
    typewriterGroup.add(keysBase);

    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.11, -0.1);
    typewriterGroup.add(roller);

    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.22), new THREE.MeshBasicMaterial({ color: 0xf3ede0, side: THREE.DoubleSide }));
    paper.rotation.x = -0.35;
    paper.position.set(0, 0.2, -0.12);
    typewriterGroup.add(paper);

    typewriterGroup.userData = { id: 'typewriter', title: 'Máquina de Escrever Olympia' };
    interactiveList.push(typewriterGroup);
    deskGroup.add(typewriterGroup);

    // 2. Vintage Brass Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-0.6, 1.0, -0.45);
    const brassLampMat = new THREE.MeshStandardMaterial({ color: 0xbf953f, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 16), brassLampMat);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 12), brassLampMat);
    stem.position.set(0, 0.23, 0);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 16, 1, true), brassLampMat);
    shade.rotation.x = 0.8;
    shade.position.set(0.08, 0.45, 0.08);
    lampGroup.add(base, stem, shade);
    deskGroup.add(lampGroup);

    // 3. Vintage Microphone (Interview 1977)
    const micGroup = new THREE.Group();
    micGroup.position.set(0.28, 1.0, -0.32);
    const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16), handleMat);
    const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.25, 12), handleMat);
    micPole.position.y = 0.13;
    const micHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.15 })
    );
    micHead.rotation.x = 0.3;
    micHead.position.set(0, 0.26, 0.02);
    micHead.castShadow = true;
    micGroup.add(micBase, micPole, micHead);

    micGroup.userData = { id: 'interview', title: 'Entrevista Histórica TV Cultura (1977)' };
    interactiveList.push(micHead);
    deskGroup.add(micGroup);

    // 4. Manuscripts and Paper Drafts
    const notesGroup = new THREE.Group();
    notesGroup.position.set(-0.35, 1.0, -0.15);
    const paperSheetMat = new THREE.MeshStandardMaterial({ color: 0xefe7d3, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.006, 0.3), paperSheetMat);
      sheet.position.set(0, i * 0.007, 0);
      sheet.rotation.y = i * 0.08 - 0.12;
      sheet.castShadow = true;
      notesGroup.add(sheet);
    }
    notesGroup.userData = { id: 'notes', title: 'Manuscritos e Fragmentos' };
    interactiveList.push(notesGroup);
    deskGroup.add(notesGroup);

    // 5. Ashtray & Cigarette
    const ashtray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.04, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.8 })
    );
    ashtray.position.set(0.42, 1.0, -0.05);
    deskGroup.add(ashtray);

    // Armchair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x3b1c11, roughness: 0.6 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), chairMat);
    seat.position.set(0, 0.6, -0.85);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.1), chairMat);
    backrest.position.set(0, 0.95, -1.1);
    deskGroup.add(seat, backrest);

    scene.add(deskGroup);

    /* Authentic furniture and living-studio elements based on real photos */
    scene.add(createWainscotingAndWallArt(interactiveList));
    scene.add(createStripedRug());
    scene.add(createModernistSofa(interactiveList));
    scene.add(createThonetRockingChair(interactiveList));
    scene.add(createSlattedCoffeeTable(interactiveList));
    scene.add(createSideTableAndRotaryPhone(interactiveList));
    scene.add(createDiningNookAndGreenLamp(interactiveList));
    scene.add(createBookcaseCeramicsAndRecords());
    deskGroup.add(createDeskBookStacksAndCoffee());

    /* Bookshelves with randomized books */
    const shelfWood = new THREE.MeshStandardMaterial({ color: 0x382218, roughness: 0.65 });
    const bookColors = [0x78231c, 0x1f3c5a, 0x1f4d36, 0x5a4123, 0x8a6d2b, 0x2e233d, 0xd0ab59];

    function createShelf(x: number, z: number, rotY: number, title: string) {
      const caseG = new THREE.Group();
      caseG.position.set(x, 0, z);
      caseG.rotation.y = rotY;

      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.4), shelfWood);
      sideL.position.set(-0.7, 1.3, 0);
      const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.4), shelfWood);
      sideR.position.set(0.7, 1.3, 0);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.04), shelfWood);
      back.position.set(0, 1.3, -0.2);
      caseG.add(sideL, sideR, back);

      for (let lvl = 0.4; lvl <= 2.4; lvl += 0.45) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.38), shelfWood);
        plank.position.set(0, lvl, 0);
        caseG.add(plank);

        let curX = -0.62;
        while (curX < 0.6) {
          const bWidth = 0.035 + Math.random() * 0.04;
          const bHeight = 0.22 + Math.random() * 0.14;
          const bDepth = 0.24 + Math.random() * 0.06;
          const bColor = bookColors[Math.floor(Math.random() * bookColors.length)];

          const book = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth, bHeight, bDepth),
            new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.5 })
          );
          book.position.set(curX + bWidth / 2, lvl + bHeight / 2 + 0.02, -0.05);
          book.castShadow = true;
          caseG.add(book);
          curX += bWidth + 0.008;
        }
      }

      caseG.userData = { id: 'library', title };
      interactiveList.push(caseG);
      return caseG;
    }

    const shelfL = createShelf(-2.6, -0.5, Math.PI / 2, 'Biblioteca Pessoal — Obras de Clarice');
    const shelfR = createShelf(2.6, -0.5, -Math.PI / 2, 'Biblioteca Pessoal — Arquivos Literários');
    scene.add(shelfL, shelfR);

    /* Hotspot markers (augmented with authentic historical objects) */
    const markers = [
      { id: 'typewriter', pos: new THREE.Vector3(0, 1.25, -0.2), color: 0xf59e0b },
      { id: 'window', pos: new THREE.Vector3(0, 2.2, -2.4), color: 0x38bdf8 },
      { id: 'interview', pos: new THREE.Vector3(0.28, 1.35, -0.32), color: 0xc084fc },
      { id: 'notes', pos: new THREE.Vector3(-0.35, 1.15, -0.15), color: 0x34d399 },
      { id: 'library', pos: new THREE.Vector3(-2.2, 1.6, -0.5), color: 0xfbbf24 },
      { id: 'rocking_chair', pos: new THREE.Vector3(-0.8, 0.95, 0.45), color: 0xeab308 },
      { id: 'sofa', pos: new THREE.Vector3(-2.0, 0.85, 0.2), color: 0x10b981 },
      { id: 'rotary_phone', pos: new THREE.Vector3(-2.05, 0.75, -0.95), color: 0xef4444 },
      { id: 'coffee_table', pos: new THREE.Vector3(-1.25, 0.55, 0.45), color: 0x06b6d4 },
      { id: 'wall_quote', pos: new THREE.Vector3(-2.8, 1.85, 0.8), color: 0xa855f7 },
      { id: 'dining_nook', pos: new THREE.Vector3(1.4, 1.3, 1.8), color: 0x84cc16 }
    ];

    const rings: THREE.Mesh[] = [];
    markers.forEach((m) => {
      const ringGeo = new THREE.RingGeometry(0.04, 0.055, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: m.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(m.pos);
      ring.lookAt(camera.position);
      ring.userData = { id: m.id, isHotspot: true };

      const dotGeo = new THREE.CircleGeometry(0.015, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      ring.add(dot);

      scene.add(ring);
      rings.push(ring);
      interactiveList.push(ring);
    });
    hotspotRingsRef.current = rings;

    /* Poetic Floating Dust Motes & Sunbeam System */
    const dustSystem = createDustMotesSystem(450);
    dustSystem.setTimeOfDay(timeOfDay);
    dustSystem.group.visible = dustMotesActive;
    scene.add(dustSystem.group);
    dustSystemRef.current = dustSystem;

    /* Raycasting / Interaction */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);
      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    };

    const onPointerClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);
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

    window.addEventListener('pointermove', onPointerMove);
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

      // Pulsing rings
      hotspotRingsRef.current.forEach((r) => {
        r.lookAt(camera.position);
        const scale = 1 + Math.sin(time * 3.0) * 0.08;
        r.scale.set(scale, scale, scale);
      });

      // Update poetic floating dust motes & window sunbeam
      if (dustSystemRef.current && dustSystemRef.current.group.visible) {
        dustSystemRef.current.update(time);
      }

      if (!renderer.xr.isPresenting) {
        controls.update();
      }

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onPointerClick);
      window.removeEventListener('resize', onWindowResize);
      renderer.setAnimationLoop(null);
      dustSystem.dispose();
      dustSystemRef.current = null;
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ---------------- Trigger Hotspot Modal ---------------- */
  const handleHotspotTrigger = useCallback((id: string) => {
    if (id === 'rotary_phone') {
      playRotaryDialSound();
    } else if (id === 'rocking_chair') {
      playRockingCreakSound();
    } else if (id === 'window') {
      toggleOceanSound(true);
    } else {
      playTypewriterClick(0.9);
    }
    setActiveModal(id);
  }, [playTypewriterClick, playRotaryDialSound, playRockingCreakSound, toggleOceanSound]);

  /* Reset camera view */
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.45, 1.85);
      controlsRef.current.target.set(0, 1.15, -0.2);
      controlsRef.current.update();
      playTypewriterClick(0.5);
    }
  };

  /* Insert quote into typewriter */
  const insertQuote = () => {
    const nextIdx = (quoteIndex + 1) % FAMOUS_QUOTES.length;
    setQuoteIndex(nextIdx);
    const q = FAMOUS_QUOTES[nextIdx];
    setTypedText(`"${q}"\n\n— Clarice Lispector`);
    playTypewriterClick(1.4);
  };

  /* Save draft note */
  const saveDraft = () => {
    const trimmed = typedText.trim();
    if (!trimmed) return;

    const newNote: NoteItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      text: trimmed
    };

    saveNoteList([newNote, ...savedNotes]);
    playTypewriterClick(2.0);
    setActiveModal('notes');
  };

  /* Copy note to clipboard */
  const copyNote = (note: NoteItem) => {
    navigator.clipboard.writeText(note.text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  /* Delete note */
  const deleteNote = (id: number) => {
    const updated = savedNotes.filter((n) => n.id !== id);
    saveNoteList(updated);
    playTypewriterClick(0.7);
  };

  /* Export all notes */
  const exportNotes = () => {
    if (savedNotes.length === 0) return;
    const content = savedNotes
      .map((n) => `--- ${n.date} (ID: ${n.id}) ---\n${n.text}\n`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarice-manuscritos-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#080a0f]">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Header */}
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
          <div className="hidden md:block text-xs border-l border-slate-700/80 pl-4 text-slate-400">
            <div>Leme / Copacabana — RJ</div>
            <div className="text-amber-300 font-mono-type text-[10px]">C. 1977 • Realidade Holográfica</div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Galeria das 5 Fotos Históricas */}
          <button
            onClick={() => handleHotspotTrigger('historical_gallery')}
            className="glass-panel glass-btn px-3 py-2 rounded-xl text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 flex items-center space-x-1.5 text-xs font-semibold shadow-md"
            title="Ver Galeria das 5 Fotos Históricas Reais do Gabinete"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">5 Fotos Reais</span>
          </button>

          {/* Time of Day Cycle */}
          <button
            onClick={() => {
              const next = timeOfDay === 'golden' ? 'night' : timeOfDay === 'night' ? 'day' : 'golden';
              setTimeOfDay(next);
              playTypewriterClick(0.7);
            }}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-amber-300"
            title={`Alternar Atmosfera: Atual (${timeOfDay === 'golden' ? 'Pôr do Sol Dourado' : timeOfDay === 'night' ? 'Madrugada de Inspiração' : 'Dia Ensolarado'})`}
          >
            {timeOfDay === 'golden' ? <Sun className="w-5 h-5 text-amber-400" /> : timeOfDay === 'night' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-sky-400" />}
          </button>

          {/* Poetic Dust Particles Toggle */}
          <button
            onClick={() => {
              setDustMotesActive(!dustMotesActive);
              playTypewriterClick(0.6);
            }}
            className={`glass-panel glass-btn p-3 rounded-xl transition ${
              dustMotesActive ? 'text-amber-300 border-amber-500/40 bg-amber-500/10' : 'text-slate-500 hover:text-amber-200'
            }`}
            title={dustMotesActive ? "Poeira Poética Solar Ativa (Clique para desativar)" : "Ativar Poeira Poética Solar"}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => toggleOceanSound()}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-cyan-300"
            title={isOceanPlaying ? "Desativar Som das Ondas" : "Ativar Som do Mar do Leme"}
          >
            {isOceanPlaying ? <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Camera Reset */}
          <button
            onClick={resetCamera}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-amber-300"
            title="Redefinir Visão da Mesa"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Guide */}
          <button
            onClick={() => setActiveModal('guide')}
            className="glass-panel glass-btn p-3 rounded-xl text-slate-200 hover:text-purple-300"
            title="Manual do Metaverso"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Floating Quote Banner */}
      <div className="absolute bottom-20 left-6 max-w-sm hidden lg:block z-20 pointer-events-none">
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 text-xs italic text-amber-200/90 font-serif-vintage shadow-2xl">
          "{FAMOUS_QUOTES[quoteIndex]}"
          <div className="text-right text-[10px] text-slate-400 mt-2 not-italic font-mono-type">
            — Clarice Lispector • A Hora da Estrela
          </div>
        </div>
      </div>

      {/* VR Container button */}
      <div ref={vrButtonContainerRef} className="absolute bottom-6 right-6 z-20 pointer-events-auto" />

      {/* Interactive Hotspots Bottom HUD (Augmented with authentic furniture items) */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass-panel px-3 py-2 rounded-2xl flex items-center space-x-2 sm:space-x-3 border border-blue-500/30 max-w-[95vw] overflow-x-auto">
        <button
          onClick={() => handleHotspotTrigger('typewriter')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-cyan-300 font-medium shrink-0"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden md:inline">Máquina Olympia</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('rocking_chair')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-amber-300 font-medium shrink-0"
        >
          <Armchair className="w-4 h-4" />
          <span className="hidden md:inline">Cadeira Thonet</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('sofa')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-emerald-300 font-medium shrink-0"
        >
          <Feather className="w-4 h-4" />
          <span className="hidden md:inline">Sofá no Colo</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('rotary_phone')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-rose-300 font-medium shrink-0"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden md:inline">Telefone de Disco</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('window')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-blue-300 font-medium shrink-0"
        >
          <Waves className="w-4 h-4" />
          <span className="hidden md:inline">Vista Copacabana</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('library')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-amber-300 font-medium shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden md:inline">Biblioteca</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('historical_gallery')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-orange-300 font-medium shrink-0 border border-orange-500/40 bg-orange-950/20"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden md:inline">5 Fotos Reais</span>
        </button>
        <button
          onClick={() => handleHotspotTrigger('notes')}
          className="glass-btn px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-emerald-300 font-medium shrink-0"
        >
          <Feather className="w-4 h-4" />
          <span className="hidden md:inline">Manuscritos ({savedNotes.length})</span>
        </button>
      </nav>

      {/* ================= MODAL: Typewriter ================= */}
      {activeModal === 'typewriter' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative border border-amber-400/30">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-amber-200 font-bold">
                  Máquina Olympia Modelo Portátil
                </h3>
                <p className="text-xs text-slate-400">Datilografia Sonora Direta • Memórias de Copacabana</p>
              </div>
            </div>

            {/* Simulated Vintage Typewriter Sheet */}
            <div className="bg-[#f5edd6] text-stone-900 rounded-xl p-6 font-mono-type shadow-inner min-h-[220px] relative border-4 border-stone-300">
              <div className="text-[11px] text-stone-500 mb-2 border-b border-stone-300 pb-1 flex justify-between font-semibold">
                <span>GABINETE DE CRIAÇÃO — LEME, RIO DE JANEIRO</span>
                <span>{typedText.length} CARACTERES</span>
              </div>
              <textarea
                rows={6}
                value={typedText}
                onChange={(e) => {
                  setTypedText(e.target.value);
                  playTypewriterClick(0.8);
                }}
                onKeyDown={(e) => {
                  playTypewriterClick(e.key === ' ' || e.key === 'Enter' ? 1.3 : 0.8);
                }}
                className="w-full bg-transparent resize-none border-none outline-none font-mono-type text-stone-900 text-sm leading-relaxed placeholder-stone-500"
                placeholder="Comece a digitar aqui... Cada tecla ressoa na atmosfera do gabinete."
                autoFocus
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-between items-center text-xs">
              <div className="flex gap-2">
                <button
                  onClick={insertQuote}
                  className="glass-btn px-3 py-2 rounded-xl text-amber-300 border border-amber-500/40 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pensamento de Clarice</span>
                </button>
                <button
                  onClick={saveDraft}
                  disabled={!typedText.trim()}
                  className="glass-btn px-3 py-2 rounded-xl text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Feather className="w-4 h-4" />
                  <span>Guardar nos Manuscritos</span>
                </button>
              </div>
              <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Síntese de áudio mecânico ativa</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Window Copacabana & Morro do Leme ================= */}
      {activeModal === 'window' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative border border-cyan-400/40 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-cyan-200 font-bold">
                  A Curva de Copacabana e o Morro do Leme
                </h3>
                <p className="text-xs text-slate-400">Vista Panorâmica da Janela de Clarice • Leme, Rio de Janeiro</p>
              </div>
            </div>

            {/* High-Resolution Window Image with Interactive Geological/Urban Annotations */}
            <div className="relative rounded-2xl overflow-hidden mb-4 border border-cyan-500/40 shadow-xl bg-slate-950 group">
              {windowPanoramaDataUrl ? (
                <img
                  src={windowPanoramaDataUrl}
                  alt="A Curva de Copacabana e o Morro do Leme vistos da janela de Clarice"
                  className="w-full h-56 sm:h-64 object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-56 bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
                  Carregando visualização da orla...
                </div>
              )}

              {/* Geographical Hotspot Badges over the image */}
              <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md border border-amber-400/50 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-300 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>⛰️ Morro do Leme & Forte</span>
              </div>

              <div className="absolute bottom-10 left-4 bg-slate-950/85 backdrop-blur-md border border-cyan-400/50 px-2.5 py-1 rounded-full text-[10px] font-medium text-cyan-200 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>🏖️ A Curva de Copacabana</span>
              </div>

              <div className="absolute top-3 left-4 bg-slate-950/85 backdrop-blur-md border border-purple-400/50 px-2.5 py-1 rounded-full text-[10px] font-medium text-purple-200 shadow-lg flex items-center gap-1.5">
                <span>🚢 Navios & Ilha de Cotunduba</span>
              </div>

              {/* Bottom Quote Bar over Image */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex justify-between items-center text-xs">
                <span className="text-[11px] font-serif-vintage italic text-amber-100/90 drop-shadow">
                  "O mar é uma certeza sem palavras. A onda vem e desfaz tudo que é pressa."
                </span>
                <span className="text-[10px] font-mono-type text-cyan-300 uppercase tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {timeOfDay === 'golden' ? 'Hora Dourada' : timeOfDay === 'night' ? 'Madrugada' : 'Dia Solar'}
                </span>
              </div>
            </div>

            {/* Dedicated Photography Selector for the 3D Window */}
            <div className="p-4 bg-gradient-to-r from-blue-950/70 to-cyan-950/70 rounded-2xl border border-cyan-400/40 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider font-serif-vintage">
                    Fotografia Fixada na Janela do Gabinete
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Foto Ativa no Espaço 3D
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Esta fotografia permanece fixada na janela do gabinete 3D. Selecione abaixo para alternar instantaneamente entre a vista fotográfica da curva de Copacabana e o célebre retrato de Clarice à janela:
              </p>

              {/* 3 Photo Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {WINDOW_PHOTO_PRESETS.map((preset) => {
                  const isSelected = !customWindowImage && windowPhotoPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-3 rounded-xl text-left transition border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                          : 'glass-btn border-slate-700/80 hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] uppercase font-mono-type px-1.5 py-0.5 rounded border ${
                            isSelected ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {preset.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <h5 className="font-serif-vintage text-xs font-bold text-slate-100 leading-snug">
                          {preset.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-right">
                        {isSelected ? (
                          <span className="text-emerald-300">✓ Fixada na Janela</span>
                        ) : (
                          <span className="text-cyan-400 hover:text-cyan-200">Fixar na Janela →</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom File Upload */}
              <div className="pt-2 border-t border-slate-800">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {customWindowImage ? 'Fotografia pessoal carregada ativa.' : 'Deseja usar outro arquivo de foto pessoal?'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {customWindowImage && (
                      <button
                        onClick={handleResetArtwork}
                        className="text-amber-300 hover:text-amber-200 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Presets</span>
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="glass-btn px-2.5 py-1 rounded-lg text-cyan-300 border-slate-700 flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{customWindowImage ? 'Trocar Foto' : 'Carregar Foto Externa'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Atmosphere Presets */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 mb-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Atmosfera de Luz da Janela:</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setTimeOfDay('golden');
                    playTypewriterClick(0.6);
                  }}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition border ${
                    timeOfDay === 'golden'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                      : 'glass-btn border-slate-700 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hora Dourada</span>
                </button>
                <button
                  onClick={() => {
                    setTimeOfDay('night');
                    playTypewriterClick(0.6);
                  }}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition border ${
                    timeOfDay === 'night'
                      ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 shadow-sm'
                      : 'glass-btn border-slate-700 text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Madrugada</span>
                </button>
                <button
                  onClick={() => {
                    setTimeOfDay('day');
                    playTypewriterClick(0.6);
                  }}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition border ${
                    timeOfDay === 'day'
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sm'
                      : 'glass-btn border-slate-700 text-slate-400 hover:text-sky-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dia Tropical</span>
                </button>
              </div>
            </div>

            {/* Poetic Dust Particles in Sunlight Shaft */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-900/60 border border-amber-500/30 mb-4 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-amber-200 block">
                    Poeira Poética Flutuando na Luz da Janela
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Partículas suspensas no ar que dançam suavemente atravessando os feixes de sol do gabinete
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setDustMotesActive(!dustMotesActive);
                  playTypewriterClick(0.7);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium text-[11px] transition shrink-0 ml-2 ${
                  dustMotesActive
                    ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200 shadow-sm'
                    : 'glass-btn border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dustMotesActive ? '✓ Ativa' : 'Desativada'}
              </button>
            </div>

            {/* Geographical Context & Ocean Sound Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">O Morro do Leme (Forte)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Localizado logo ao lado da janela de Clarice na Rua Gustavo Sampaio, o Morro do Leme guarda a Mata Atlântica e o histórico Forte Duque de Caxias, onde o mar quebra com intensidade nas rochas.
                </p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">A Curva de Copacabana</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  A clássica linha curva da praia em formato de crescente abraça a baía, terminando no Forte de Copacabana e nas silhuetas do Morro Dois Irmãos e da Pedra da Gávea.
                </p>
              </div>
            </div>

            {/* Sound bar */}
            <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-slate-800 gap-3">
              <button
                onClick={() => toggleOceanSound()}
                className="glass-btn px-4 py-2 rounded-xl text-cyan-300 border border-cyan-500/30 flex items-center space-x-2 font-medium"
              >
                {isOceanPlaying ? <Volume2 className="w-4 h-4 animate-pulse text-cyan-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span>{isOceanPlaying ? "Desativar Som do Mar" : "Ouvir Ondas do Mar do Leme"}</span>
              </button>
              <div className="flex items-center space-x-2 text-slate-400">
                <span className="text-[11px]">Volume da Maré:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Interview 1977 ================= */}
      {activeModal === 'interview' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative border border-purple-500/30">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-purple-200 font-bold">
                  Entrevista Histórica TV Cultura (Fevereiro de 1977)
                </h3>
                <p className="text-xs text-slate-400">Com Júlio Lerner • Programa Panorama • O Testamento em Imagens</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 max-h-80 overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <h4 className="font-serif-vintage text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
                  Sobre o processo de criação
                </h4>
                <p className="text-xs leading-relaxed italic text-purple-100/90 font-mono-type">
                  "Quando não escrevo, eu estou morta... Mas enquanto escrevo, vivo num estado de transe que é ao mesmo tempo terrível e salvador."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-serif-vintage text-amber-200 text-xs font-bold uppercase tracking-wider mb-1">
                  A Condição da Obra
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  Gravada poucos meses antes de sua partida, Clarice aceitou a entrevista sob a condição expressa de que só fosse transmitida após a sua morte. O diálogo reverbera silêncios, cigarro na mão e uma franqueza inigualável sobre a solidão e a transcendência da linguagem humana.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-serif-vintage text-cyan-200 text-xs font-bold uppercase tracking-wider mb-1">
                  A Palavra e o Mistério
                </h4>
                <p className="text-xs leading-relaxed italic text-cyan-100/90 font-mono-type">
                  "A palavra é minha quarta dimensão. Não quero a palavra pronta, quero o sopro antes dela nascer."
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Holograma arquivado do Metaverso Cultural</span>
              </span>
              <button
                onClick={() => playTypewriterClick(1.8)}
                className="glass-btn px-4 py-2 rounded-xl text-purple-300 font-medium"
              >
                Ouvir Eco de Reflexão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Library ================= */}
      {activeModal === 'library' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 relative border border-amber-500/30">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-amber-200 font-bold">
                  Biblioteca Pessoal & Obras Primordiais
                </h3>
                <p className="text-xs text-slate-400">Obras essenciais catalogadas no estúdio virtual</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-amber-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-amber-300 text-sm font-bold">A Hora da Estrela (1977)</h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono-type">Romance</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  A comovente e lírica história de Macabéa, uma datilógrafa alagoana perdida na metrópole carioca, contada pelo narrador Rodrigo S.M.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-cyan-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-cyan-300 text-sm font-bold">A Paixão Segundo G.H. (1964)</h4>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono-type">Filosófico</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  O confronto existencial de uma mulher em seu quarto de serviço com uma barata, desencadeando um mergulho visceral na matéria viva e na despersonalização.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-pink-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-pink-300 text-sm font-bold">Água Viva (1973)</h4>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-mono-type">Prosa Poética</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Um fluxo contínuo e arrebatador que capta o instante fugidio ("o instante já é"), entrelaçando pintura abstrata, música e a respiração da palavra.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-emerald-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-emerald-300 text-sm font-bold">Felicidade Clandestina (1971)</h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono-type">Contos</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Coletânea de narrativas autobiográficas e delicadas, incluindo a inesquecível espera pelo livro das Reinações de Narizinho na infância em Recife.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-indigo-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-indigo-300 text-sm font-bold">Perto do Coração Selvagem (1943)</h4>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono-type">Romance de Estreia</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  A inovação inaugural da literatura brasileira aos 23 anos com a trajetória psicológica de Joana, elogiada por Antonio Candido e a crítica da época.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-orange-400/40 transition">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-vintage text-orange-300 text-sm font-bold">Laços de Família (1960)</h4>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-mono-type">Contos</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  O desmascaramento das convenções burguesas cotidianas através de epifanias silenciosas como em "Amor" e "O Búfalo".
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total de títulos catalogados na estante virtual: 18</span>
              <button
                onClick={() => setActiveModal(null)}
                className="glass-btn px-4 py-2 rounded-xl text-slate-200 font-semibold"
              >
                Concluir Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Saved Notes ================= */}
      {activeModal === 'notes' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-emerald-500/30">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-emerald-200 font-bold">
                  Manuscritos & Fragmentos Pessoais
                </h3>
                <p className="text-xs text-slate-400">Seus registros salvos localmente neste terminal XR</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5 mb-4 pr-1">
              {savedNotes.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-mono-type text-xs">
                  Nenhum fragmento datilografado ainda.<br />
                  Clique em "Redigir na Máquina" para registrar suas reflexões.
                </div>
              ) : (
                savedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono-type relative group hover:border-emerald-500/40 transition"
                  >
                    <div className="text-[10px] text-amber-400 mb-1.5 flex justify-between items-center">
                      <span>{note.date}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyNote(note)}
                          className="text-slate-400 hover:text-emerald-300 p-1"
                          title="Copiar texto"
                        >
                          {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                          title="Remover nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-stone-300 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-slate-800 gap-2">
              <div className="flex space-x-2">
                {savedNotes.length > 0 && (
                  <>
                    <button
                      onClick={() => saveNoteList([])}
                      className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar Todos</span>
                    </button>
                    <button
                      onClick={exportNotes}
                      className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 pl-2 border-l border-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar TXT</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setActiveModal('typewriter');
                  setTypedText('');
                }}
                className="glass-btn px-4 py-2 rounded-xl text-emerald-300 flex items-center space-x-1.5 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Redigir na Máquina</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Meta Quest Guide ================= */}
      {activeModal === 'guide' && (
        <div className="fixed inset-0 bg-black/75 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative border border-blue-400/30">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-blue-200 font-bold">
                  Como Interagir no Metaverso Literário
                </h3>
                <p className="text-xs text-slate-400">Compatível com Meta Quest 2 / 3 / Pro, Apple Vision Pro, PC e Mobile</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-semibold text-cyan-300 flex items-center mb-1">
                  <Sparkles className="w-4 h-4 mr-2" /> No Óculos Meta Quest (Oculus Browser)
                </div>
                <p className="text-slate-400">
                  Clique no botão <strong>"MODO VR"</strong> no canto inferior direito. Use o gatilho (Trigger) dos controles Touch apontando para os anéis e objetos da sala (máquina, estante, janela, microfone).
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-semibold text-amber-300 flex items-center mb-1">
                  <Crosshair className="w-4 h-4 mr-2" /> No Computador (Mouse & Teclado)
                </div>
                <p className="text-slate-400">
                  Arraste com o botão esquerdo para orbitar a sala 360°; arraste com o direito para mover a posição e use a roda do mouse para zoom. Clique nos anéis brilhantes para abrir cada experiência.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="font-semibold text-emerald-300 flex items-center mb-1">
                  <Waves className="w-4 h-4 mr-2" /> Em Celulares e Tablets
                </div>
                <p className="text-slate-400">
                  Arraste na tela para olhar em volta do escritório e use a barra de navegação inferior para saltar diretamente para cada memorial.
                </p>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => setActiveModal(null)}
                className="glass-btn w-full py-2.5 rounded-xl text-slate-100 font-semibold"
              >
                Compreendi, Iniciar Exploração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Cadeira de Balanço Thonet ================= */}
      {activeModal === 'rocking_chair' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-amber-400/40 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Armchair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-amber-200 font-bold">
                  A Cadeira de Balanço Thonet com Palhinha
                </h3>
                <p className="text-xs text-slate-400">Modelo Clássico em Madeira Curvada a Vapor • Palha Vienense</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-amber-950/30 rounded-2xl border border-amber-500/30 text-amber-100/90 italic font-mono-type">
                "Sentar na cadeira de balanço era o meu modo de esperar pelo que ainda não tinha nome. Balançar acalma o corpo enquanto a alma viaja."
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Presença Icônica nas Fotografias Históricas
                </h4>
                <p className="text-slate-300 text-[11px]">
                  Como registrado nas fotos originais do apartamento da Rua Gustavo Sampaio, esta elegante cadeira vienense Thonet ocupava o centro da sala, posicionada estrategicamente sobre o tapete listrado entre o sofá e a grande estante de livros. Era onde Clarice recebia amigos íntimos, pensava em suas crônicas do Jornal do Brasil e desfrutava do silêncio do Leme.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={playRockingCreakSound}
                className="glass-btn px-4 py-2 rounded-xl text-amber-300 border border-amber-500/40 flex items-center space-x-2 font-medium"
              >
                <Armchair className="w-4 h-4" />
                <span>Ouvir Ranger da Cadeira</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPhotoIndex(1);
                  setActiveModal('historical_gallery');
                }}
                className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ver na Foto #2</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Sofá Modernista & Escrever no Colo ================= */}
      {activeModal === 'sofa' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-emerald-400/40 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-emerald-200 font-bold">
                  O Sofá Modernista & O Hábito de Escrever no Colo
                </h3>
                <p className="text-xs text-slate-400">Três Lugares em Linho Cinza • A Recusa da Escrivaninha Formal</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 text-emerald-100/90 italic font-mono-type">
                "Não sou escritora de gabinete. Escrevo sentada no sofá, com a máquina portátil no colo, fumando e pensando. O cão Ulisses dorme aos meus pés."
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  O Ritual Anticonvencional de Clarice
                </h4>
                <p className="text-slate-300 text-[11px]">
                  Clarice raramente se sentava de forma rígida em uma mesa de escritório tradicional. O sofá de madeira com estofamento em linho cinza, destacado nas Fotos #1 e #2 do arquivo, era seu posto de trabalho preferido. Ela equilibrava a pesada máquina portátil de escrever sobre os joelhos ou nas almofadas, datilografando em impulsos febris quando as frases se precipitavam.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setActiveModal('typewriter');
                  setTypedText('');
                }}
                className="glass-btn px-4 py-2 rounded-xl text-emerald-300 border border-emerald-500/40 flex items-center space-x-2 font-medium"
              >
                <Keyboard className="w-4 h-4" />
                <span>Datilografar no Sofá</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPhotoIndex(0);
                  setActiveModal('historical_gallery');
                }}
                className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ver na Foto #1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Telefone de Disco Preto ================= */}
      {activeModal === 'rotary_phone' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-rose-400/40 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-rose-200 font-bold">
                  Telefone de Disco Preto (Baquelite)
                </h3>
                <p className="text-xs text-slate-400">O Cordão com o Mundo • As Conversas da Madrugada</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-rose-950/30 rounded-2xl border border-rose-500/30 text-rose-100/90 italic font-mono-type">
                "À noite, o telefone parece o único elo com a humanidade. Às vezes ligo para amigos apenas para ouvir uma voz viva no meio da insônia."
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Presença Real nas Fotos #1, #2 e #3
                </h4>
                <p className="text-slate-300 text-[11px]">
                  O clássico aparelho preto em baquelite com disco mecânico ficava sobre a mesinha de madeira ao lado do sofá e da grande estante. Por ele, Clarice trocava confidências, desabafos e reflexões literárias com grandes amigos intelectuais, como Fernando Sabino, Lúcio Cardoso, Rubem Braga e Otto Lara Resende.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={playRotaryDialSound}
                className="glass-btn px-4 py-2 rounded-xl text-rose-300 border border-rose-500/40 flex items-center space-x-2 font-medium"
              >
                <Phone className="w-4 h-4" />
                <span>Girar Disco Mecânico</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPhotoIndex(2);
                  setActiveModal('historical_gallery');
                }}
                className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ver na Foto #3</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Mesa de Ripas & Cinzeiro de Vidro Verde ================= */}
      {activeModal === 'coffee_table' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-cyan-400/40 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-cyan-200 font-bold">
                  Mesa de Ripas & Cinzeiro de Vidro Verde
                </h3>
                <p className="text-xs text-slate-400">Design Modernista em Ripas de Jacarandá • Café e Cigarros</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-cyan-950/30 rounded-2xl border border-cyan-500/30 text-cyan-100/90 italic font-mono-type">
                "Fumo compulsivamente enquanto trabalho. O cinzeiro de vidro pesado no centro da mesa guarda o ritmo das minhas horas sem sono."
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Detalhe das Fotos #1 e #2
                </h4>
                <p className="text-slate-300 text-[11px]">
                  No centro da sala, repousa o banco/mesa de ripas de madeira escura com seus espaços vazados lineares característicos do mobiliário modernista brasileiro dos anos 60/70. Sobre ele, repousam sempre papéis soltos com apontamentos repentinos e o pesado cinzeiro de vidro verde garrafa que aparece nitidamente nas fotos #1 e #2.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setSelectedPhotoIndex(0);
                  setActiveModal('historical_gallery');
                }}
                className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ver Detalhe na Foto #1</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="glass-btn px-4 py-2 rounded-xl text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Citação na Parede ================= */}
      {activeModal === 'wall_quote' && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 relative border border-purple-400/40 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-purple-200 font-bold">
                  A Inscrição na Parede do Gabinete
                </h3>
                <p className="text-xs text-slate-400">O Manifesto Afetivo de Clarice Lispector</p>
              </div>
            </div>

            <div className="p-5 bg-purple-950/40 rounded-2xl border border-purple-500/30 text-purple-100 font-mono-type text-sm leading-relaxed mb-4">
              "Se vocês gostam de escrever ou desenhar ou pintar, façam porque é ótimo: enquanto a gente brinca assim, não se sente mais sozinha, e fica de coração quente."
              <div className="text-right text-xs text-amber-300 mt-3 font-serif-vintage not-italic">
                — Clarice Lispector
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Pintada delicadamente sobre a parede branca acima do lambril de madeira, esta mensagem (destacada na Foto #5 enviada) expressa a essência da relação de Clarice com as artes: não como vaidade ou mero ofício, mas como um abraço acolhedor contra o desamparo humano.
            </p>

            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedPhotoIndex(4);
                  setActiveModal('historical_gallery');
                }}
                className="text-purple-300 hover:text-purple-200 flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ver Inscrição na Foto #5</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="glass-btn px-4 py-2 rounded-xl text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Galeria das 5 Fotos Históricas Reais ================= */}
      {activeModal === 'historical_gallery' && (
        <div className="fixed inset-0 bg-black/85 z-40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 relative border border-amber-500/40 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif-vintage text-amber-200 font-bold">
                  Galeria de Fotografias Originais do Gabinete
                </h3>
                <p className="text-xs text-slate-400">
                  Estudo Arquitetural das 5 Fotos Históricas • Rua Gustavo Sampaio, Leme
                </p>
              </div>
            </div>

            {/* Photo Selector Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 border-b border-slate-800">
              {HISTORICAL_PHOTOS.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhotoIndex(idx);
                    playTypewriterClick(0.5);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                    selectedPhotoIndex === idx
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 shadow-md'
                      : 'glass-btn text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>Foto #{photo.id}</span>
                  <span className="text-[10px] opacity-75">
                    {idx === 0 ? 'Living' : idx === 1 ? 'Cadeira' : idx === 2 ? 'Estante' : idx === 3 ? 'Janela' : 'Frase'}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Photo Card Display */}
            {(() => {
              const currentPhoto = HISTORICAL_PHOTOS[selectedPhotoIndex];
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-mono-type text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
                          {currentPhoto.date}
                        </span>
                        <h4 className="text-base font-serif-vintage font-bold text-slate-100 mt-1.5">
                          {currentPhoto.title}
                        </h4>
                        <p className="text-xs text-cyan-300 font-medium">{currentPhoto.subtitle}</p>
                      </div>
                      <span className="text-xs text-slate-500 font-mono-type">
                        Foto {selectedPhotoIndex + 1} de 5
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-3">
                      {currentPhoto.description}
                    </p>
                  </div>

                  {/* Key Architectural & Furnishing Highlights */}
                  <div className="p-4 bg-amber-950/20 rounded-2xl border border-amber-500/30">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5 font-serif-vintage">
                      <Sparkles className="w-3.5 h-3.5" />
                      Detalhes Presentes no Metaverso 3D
                    </h5>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      {currentPhoto.keyDetails.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Direct Jump to related 3D object */}
                  <div className="flex flex-wrap justify-between items-center pt-2 text-xs gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          if (selectedPhotoIndex === 0) handleHotspotTrigger('sofa');
                          else if (selectedPhotoIndex === 1) handleHotspotTrigger('rocking_chair');
                          else if (selectedPhotoIndex === 2) handleHotspotTrigger('rotary_phone');
                          else if (selectedPhotoIndex === 3) handleHotspotTrigger('window');
                          else handleHotspotTrigger('wall_quote');
                        }}
                        className="glass-btn px-3 py-1.5 rounded-xl text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Explorar Elemento em 3D</span>
                      </button>

                      {selectedPhotoIndex === 3 && (
                        <button
                          onClick={() => {
                            handleSelectPreset('clarice_photo_4');
                            handleHotspotTrigger('window');
                          }}
                          className="glass-btn px-3 py-1.5 rounded-xl text-cyan-300 border border-cyan-400/50 flex items-center space-x-1.5 font-semibold bg-cyan-950/40 hover:bg-cyan-900/50 transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Fixar Esta Foto na Janela 3D</span>
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPhotoIndex((selectedPhotoIndex - 1 + 5) % 5);
                          playTypewriterClick(0.5);
                        }}
                        className="glass-btn px-3 py-1.5 rounded-xl text-slate-300 hover:text-white"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPhotoIndex((selectedPhotoIndex + 1) % 5);
                          playTypewriterClick(0.5);
                        }}
                        className="glass-btn px-3 py-1.5 rounded-xl text-amber-300 hover:text-white"
                      >
                        Próxima Foto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Creates the half-height vertical wood wainscoting (lambril),
 * the wall inscription with Clarice's quote, and framed artwork.
 */
export function createWainscotingAndWallArt(interactiveList: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();

  // 1. Wood wainscoting texture (vertical slats in warm honey pine)
  const slatCanvas = document.createElement('canvas');
  slatCanvas.width = 512;
  slatCanvas.height = 512;
  const sCtx = slatCanvas.getContext('2d')!;
  sCtx.fillStyle = '#b58452';
  sCtx.fillRect(0, 0, 512, 512);

  // Vertical wood slatted lines
  for (let x = 0; x < 512; x += 16) {
    sCtx.fillStyle = '#9e6d3d';
    sCtx.fillRect(x, 0, 2, 512);
    sCtx.fillStyle = '#ca9c68';
    sCtx.fillRect(x + 2, 0, 3, 512);
    sCtx.fillStyle = '#7a5129';
    sCtx.fillRect(x + 14, 0, 2, 512);
  }
  const slatTex = new THREE.CanvasTexture(slatCanvas);
  slatTex.wrapS = THREE.RepeatWrapping;
  slatTex.wrapT = THREE.RepeatWrapping;
  slatTex.repeat.set(8, 1);

  const lambrilMat = new THREE.MeshStandardMaterial({
    map: slatTex,
    roughness: 0.6,
    metalness: 0.05
  });

  // Left wall lambril
  const lambrilL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.15, 7.8), lambrilMat);
  lambrilL.position.set(-2.88, 0.575, 0);
  lambrilL.receiveShadow = true;
  group.add(lambrilL);

  // Top molding trim on left lambril
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x8a592b, roughness: 0.5 });
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 7.8), trimMat);
  trimL.position.set(-2.87, 1.16, 0);
  group.add(trimL);

  // Back wall left lambril
  const lambrilBackL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.15, 0.04), lambrilMat);
  lambrilBackL.position.set(-2.2, 0.575, -2.48);
  lambrilBackL.receiveShadow = true;
  group.add(lambrilBackL);

  // 2. Wall Inscription with Clarice's quote (seen in photos 1 and 5)
  // "Se vocês gostam de escrever ou desenhar ou pintar, façam porque é ótimo..."
  const quoteCanvas = document.createElement('canvas');
  quoteCanvas.width = 1024;
  quoteCanvas.height = 256;
  const qCtx = quoteCanvas.getContext('2d')!;
  qCtx.fillStyle = '#f1ebe1';
  qCtx.fillRect(0, 0, 1024, 256);

  qCtx.font = 'italic 20px "Courier Prime", monospace';
  qCtx.fillStyle = '#4a443b';
  qCtx.fillText('"Se vocês gostam de escrever ou desenhar ou pintar, façam porque é ótimo:', 30, 70);
  qCtx.fillText('enquanto a gente brinca assim, não se sente mais sozinha, e fica de coração quente."', 30, 110);
  qCtx.font = 'bold 18px "Cinzel", serif';
  qCtx.fillStyle = '#8c6b45';
  qCtx.fillText('— CLARICE LISPECTOR', 680, 160);

  const quoteTex = new THREE.CanvasTexture(quoteCanvas);
  const quotePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.6),
    new THREE.MeshBasicMaterial({ map: quoteTex, transparent: true, opacity: 0.92 })
  );
  quotePlane.position.set(-2.88, 1.85, 0.8);
  quotePlane.rotation.y = Math.PI / 2;
  quotePlane.userData = { id: 'wall_quote', title: 'Citação na Parede do Gabinete' };
  interactiveList.push(quotePlane);
  group.add(quotePlane);

  // 3. Five Framed Pictures / Art Prints on the wall above sofa (as in photo 1 & 2)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.4 });
  const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xb59247, metalness: 0.7, roughness: 0.3 });

  const artCoords = [
    { z: -1.2, y: 1.85, w: 0.45, h: 0.55, gold: false },
    { z: -0.6, y: 1.8, w: 0.55, h: 0.42, gold: true },
    { z: 0.05, y: 1.88, w: 0.42, h: 0.5, gold: false },
    { z: 0.65, y: 1.78, w: 0.48, h: 0.38, gold: false },
    { z: 1.25, y: 1.85, w: 0.5, h: 0.6, gold: true }
  ];

  artCoords.forEach((art, idx) => {
    const fMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, art.h, art.w),
      art.gold ? goldFrameMat : frameMat
    );
    fMesh.position.set(-2.87, art.y, art.z);

    // Canvas artwork
    const aCanvas = document.createElement('canvas');
    aCanvas.width = 128;
    aCanvas.height = 128;
    const aCtx = aCanvas.getContext('2d')!;
    aCtx.fillStyle = idx % 2 === 0 ? '#f7f2e7' : '#ece3d2';
    aCtx.fillRect(0, 0, 128, 128);
    // Abstract lines / figurative sketches like Clarice's own drawings
    aCtx.strokeStyle = idx % 2 === 0 ? '#443b35' : '#734d31';
    aCtx.lineWidth = 3;
    aCtx.beginPath();
    aCtx.arc(64, 55, 30, 0, Math.PI * 2);
    aCtx.moveTo(40, 110);
    aCtx.quadraticCurveTo(64, 80, 88, 110);
    aCtx.stroke();

    const artPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(art.w - 0.06, art.h - 0.06),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(aCanvas) })
    );
    artPlane.position.set(-2.855, art.y, art.z);
    artPlane.rotation.y = Math.PI / 2;

    fMesh.userData = { id: 'artwork', title: `Quadro do Gabinete #${idx + 1}` };
    interactiveList.push(fMesh);
    group.add(fMesh, artPlane);
  });

  return group;
}

/**
 * Creates the iconic Thonet Bentwood Rocking Chair with caned wicker weave (Cadeira de Balanço)
 */
export function createThonetRockingChair(interactiveList: THREE.Object3D[]): THREE.Group {
  const chair = new THREE.Group();
  chair.position.set(-0.8, 0, 0.45);
  chair.rotation.y = 0.4;

  const darkWood = new THREE.MeshStandardMaterial({
    color: 0x2b1810,
    roughness: 0.35,
    metalness: 0.1
  });

  // Woven caning / palhinha vienense texture for seat & backrest
  const caneCanvas = document.createElement('canvas');
  caneCanvas.width = 128;
  caneCanvas.height = 128;
  const cCtx = caneCanvas.getContext('2d')!;
  cCtx.fillStyle = '#e5be7a';
  cCtx.fillRect(0, 0, 128, 128);
  cCtx.strokeStyle = '#c49a52';
  cCtx.lineWidth = 2;
  // Octagonal caning pattern
  for (let i = 0; i <= 128; i += 16) {
    cCtx.beginPath();
    cCtx.moveTo(i, 0); cCtx.lineTo(i, 128);
    cCtx.moveTo(0, i); cCtx.lineTo(128, i);
    cCtx.stroke();
    // Diagonals
    cCtx.beginPath();
    cCtx.moveTo(i, 0); cCtx.lineTo(0, i);
    cCtx.moveTo(i, 128); cCtx.lineTo(128, i);
    cCtx.stroke();
  }
  const caneTex = new THREE.CanvasTexture(caneCanvas);
  caneTex.wrapS = THREE.RepeatWrapping;
  caneTex.wrapT = THREE.RepeatWrapping;
  caneTex.repeat.set(4, 4);

  const caneMat = new THREE.MeshStandardMaterial({
    map: caneTex,
    roughness: 0.7,
    side: THREE.DoubleSide
  });

  // 1. Curved Rocker Runners (Skids) on the floor
  const runnerCurveL = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.32, 0.08, -0.55),
    new THREE.Vector3(-0.32, 0.01, 0),
    new THREE.Vector3(-0.32, 0.12, 0.55)
  );
  const runnerGeoL = new THREE.TubeGeometry(runnerCurveL, 24, 0.018, 8, false);
  const runnerL = new THREE.Mesh(runnerGeoL, darkWood);
  runnerL.castShadow = true;

  const runnerCurveR = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.32, 0.08, -0.55),
    new THREE.Vector3(0.32, 0.01, 0),
    new THREE.Vector3(0.32, 0.12, 0.55)
  );
  const runnerGeoR = new THREE.TubeGeometry(runnerCurveR, 24, 0.018, 8, false);
  const runnerR = new THREE.Mesh(runnerGeoR, darkWood);
  runnerR.castShadow = true;
  chair.add(runnerL, runnerR);

  // 2. Iconic Bentwood Side Volute Loops (the famous Thonet scrolls)
  for (const side of [-0.3, 0.3]) {
    const loopGeo = new THREE.TorusGeometry(0.18, 0.016, 12, 32);
    const loop = new THREE.Mesh(loopGeo, darkWood);
    loop.rotation.y = Math.PI / 2;
    loop.position.set(side, 0.22, -0.05);
    loop.castShadow = true;
    chair.add(loop);

    // Front brace strut
    const frontStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.38, 8), darkWood);
    frontStrut.position.set(side, 0.22, 0.22);
    frontStrut.rotation.x = -0.25;
    chair.add(frontStrut);
  }

  // 3. Caned Seat
  const seatRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 12, 32), darkWood);
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.set(0, 0.38, 0.02);
  const seatCane = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), caneMat);
  seatCane.rotation.x = -Math.PI / 2;
  seatCane.position.set(0, 0.38, 0.02);
  chair.add(seatRing, seatCane);

  // 4. Tall Bentwood Backrest with Straw Webbing
  const backFrame = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.018, 12, 32), darkWood);
  backFrame.position.set(0, 0.8, -0.22);
  backFrame.rotation.x = 0.28;
  const backCane = new THREE.Mesh(new THREE.CircleGeometry(0.25, 24), caneMat);
  backCane.position.set(0, 0.8, -0.22);
  backCane.rotation.x = 0.28;
  chair.add(backFrame, backCane);

  // 5. Curved Armrests
  for (const side of [-0.28, 0.28]) {
    const armCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(side, 0.65, -0.15),
      new THREE.Vector3(side * 1.15, 0.58, 0.1),
      new THREE.Vector3(side, 0.4, 0.28)
    );
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 16, 0.016, 8, false), darkWood);
    arm.castShadow = true;
    chair.add(arm);
  }

  chair.userData = { id: 'rocking_chair', title: 'Cadeira de Balanço Thonet em Palhinha' };
  interactiveList.push(chair);
  return chair;
}

/**
 * Creates the Modernist Low 3-Seater Sofa / Daybed where Clarice typed with the machine on her lap.
 */
export function createModernistSofa(interactiveList: THREE.Object3D[]): THREE.Group {
  const sofa = new THREE.Group();
  sofa.position.set(-2.0, 0, 0.2);
  sofa.rotation.y = Math.PI / 2;

  const woodBaseMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.5 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85 }); // light warm grey linen

  // Low platform base
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.85), woodBaseMat);
  base.position.set(0, 0.26, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  sofa.add(base);

  // 4 Tapered wooden legs
  const legPositions = [
    [-0.95, -0.35],
    [0.95, -0.35],
    [-0.95, 0.35],
    [0.95, 0.35]
  ];
  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 12), woodBaseMat);
    leg.position.set(x, 0.11, z);
    leg.castShadow = true;
    sofa.add(leg);
  });

  // 3 Seat cushions (thick, cozy linen)
  for (let i = -1; i <= 1; i++) {
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.16, 0.8),
      fabricMat
    );
    seatCushion.position.set(i * 0.68, 0.38, 0);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    sofa.add(seatCushion);

    // Backrest cushion angled
    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.42, 0.18),
      fabricMat
    );
    backCushion.position.set(i * 0.68, 0.62, -0.34);
    backCushion.rotation.x = 0.15;
    backCushion.castShadow = true;
    sofa.add(backCushion);
  }

  // Backrest support wooden board
  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 0.04), woodBaseMat);
  backBoard.position.set(0, 0.55, -0.42);
  sofa.add(backBoard);

  // Portable typewriter resting on the sofa (as in photo 1 & 2: Clarice's lap-typing habit)
  const lapTypewriter = new THREE.Group();
  lapTypewriter.position.set(-0.35, 0.5, 0.05);
  const lapBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.28), new THREE.MeshStandardMaterial({ color: 0x1f2326, roughness: 0.4 }));
  const lapRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  lapRoller.rotation.z = Math.PI / 2;
  lapRoller.position.set(0, 0.08, -0.08);
  const lapPaper = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.18), new THREE.MeshBasicMaterial({ color: 0xfdfbf7, side: THREE.DoubleSide }));
  lapPaper.position.set(0, 0.16, -0.1);
  lapPaper.rotation.x = -0.3;
  lapTypewriter.add(lapBody, lapRoller, lapPaper);
  sofa.add(lapTypewriter);

  sofa.userData = { id: 'sofa', title: 'Sofá Modernista — O Hábito de Escrever no Colo' };
  interactiveList.push(sofa);
  return sofa;
}

/**
 * Creates the Multi-Striped Woven Area Rug (seen under the sofa and coffee table in photo 1 & 2)
 */
export function createStripedRug(): THREE.Mesh {
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 1024;
  rugCanvas.height = 512;
  const rCtx = rugCanvas.getContext('2d')!;

  // Striped pattern matching the actual rug
  const stripeColors = [
    '#e2d7c5', '#9e5a3f', '#c9bca8', '#4b5563', '#a7825b',
    '#6b7280', '#e5ded1', '#b45309', '#374151', '#d1c7b7',
    '#854d0e', '#57534e', '#f5f0e8', '#78350f', '#3f3f46'
  ];

  let currentY = 0;
  for (let i = 0; i < 40; i++) {
    const sHeight = 8 + (i % 5) * 6;
    rCtx.fillStyle = stripeColors[i % stripeColors.length];
    rCtx.fillRect(0, currentY, 1024, sHeight);
    currentY += sHeight;
    if (currentY >= 512) break;
  }

  const rugTex = new THREE.CanvasTexture(rugCanvas);
  const rugGeo = new THREE.PlaneGeometry(2.6, 1.8);
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    roughness: 0.95,
    metalness: 0.0
  });

  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1.15, 0.008, 0.35);
  rug.receiveShadow = true;
  return rug;
}

/**
 * Creates the Slatted Coffee Table (Mesa de Centro de Ripas) with green glass ashtray and papers.
 */
export function createSlattedCoffeeTable(interactiveList: THREE.Object3D[]): THREE.Group {
  const table = new THREE.Group();
  table.position.set(-1.25, 0, 0.45);

  const darkWood = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.4 });

  // Individual slats of the George Nelson style slatted bench
  for (let i = -6; i <= 6; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.65), darkWood);
    slat.position.set(i * 0.065, 0.28, 0);
    slat.castShadow = true;
    table.add(slat);
  }

  // Cross support braces
  const brace1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.05), darkWood);
  brace1.position.set(0, 0.25, -0.22);
  const brace2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.05), darkWood);
  brace2.position.set(0, 0.25, 0.22);
  table.add(brace1, brace2);

  // 4 Legs
  const legPositions = [
    [-0.38, -0.24],
    [0.38, -0.24],
    [-0.38, 0.24],
    [0.38, 0.24]
  ];
  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.04), darkWood);
    leg.position.set(x, 0.13, z);
    leg.castShadow = true;
    table.add(leg);
  });

  // The iconic translucent green glass ashtray (cinzeiro de vidro verde) seen in photo 1 & 2
  const ashtrayMat = new THREE.MeshPhysicalMaterial({
    color: 0x22c55e,
    transmission: 0.85,
    roughness: 0.15,
    ior: 1.5,
    transparent: true,
    opacity: 0.9
  });
  const ashtray = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.03, 16), ashtrayMat);
  ashtray.position.set(0.12, 0.31, 0.05);
  ashtray.castShadow = true;
  table.add(ashtray);

  // Cigarette resting on the ashtray
  const cigMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.045, 8), cigMat);
  cig.rotation.z = Math.PI / 2.5;
  cig.position.set(0.12, 0.325, 0.05);
  table.add(cig);

  // Manuscript sheets scattered on table
  const paperMat = new THREE.MeshBasicMaterial({ color: 0xfbf8ee });
  const paper1 = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), paperMat);
  paper1.rotation.x = -Math.PI / 2;
  paper1.rotation.z = 0.15;
  paper1.position.set(-0.15, 0.3, 0);
  table.add(paper1);

  table.userData = { id: 'coffee_table', title: 'Mesa de Ripas & Cinzeiro de Vidro Verde' };
  interactiveList.push(table);
  return table;
}

/**
 * Creates the Side Table with the Vintage Black Rotary Telephone (Telefone de Disco) and Table Lamp.
 */
export function createSideTableAndRotaryPhone(interactiveList: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(-2.0, 0, -0.95);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x472d1f, roughness: 0.4 });

  // Square wooden side table
  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.55), woodMat);
  tabletop.position.y = 0.48;
  tabletop.castShadow = true;
  group.add(tabletop);

  // Lower shelf
  const lowShelf = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.52), woodMat);
  lowShelf.position.y = 0.18;
  group.add(lowShelf);

  // 4 Legs
  for (const x of [-0.23, 0.23]) {
    for (const z of [-0.23, 0.23]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.48, 8), woodMat);
      leg.position.set(x, 0.24, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  // 1. Black Rotary Dial Telephone (Telefone Preto de Baquelite)
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(-0.08, 0.5, -0.05);

  const bakeliteMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.25,
    metalness: 0.3
  });

  // Telephone base (slanted trapezoid)
  const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), bakeliteMat);
  phoneBase.castShadow = true;
  phoneGroup.add(phoneBase);

  // Rotary Dial disc (white with numbered ring)
  const dialFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
  );
  dialFace.rotation.x = 0.4;
  dialFace.position.set(0, 0.05, 0.03);
  phoneGroup.add(dialFace);

  // Handset with cradle
  const handsetHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8), bakeliteMat);
  handsetHandle.rotation.z = Math.PI / 2;
  handsetHandle.position.set(0, 0.09, -0.04);
  const earPiece = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 12), bakeliteMat);
  earPiece.position.set(-0.11, 0.09, -0.04);
  earPiece.rotation.z = Math.PI / 2;
  const mouthPiece = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 12), bakeliteMat);
  mouthPiece.position.set(0.11, 0.09, -0.04);
  mouthPiece.rotation.z = -Math.PI / 2;
  phoneGroup.add(handsetHandle, earPiece, mouthPiece);

  phoneGroup.userData = { id: 'rotary_phone', title: 'Telefone de Disco Preto (Baquelite)' };
  interactiveList.push(phoneGroup);
  group.add(phoneGroup);

  // 2. Vintage Table Lamp with Fabric Shade
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0.12, 0.5, 0.1);

  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 12), new THREE.MeshStandardMaterial({ color: 0x8a592b }));
  lampStem.position.y = 0.14;
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.22, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9, side: THREE.DoubleSide })
  );
  lampShade.position.y = 0.28;
  lampGroup.add(lampStem, lampShade);

  // Warm light glow
  const lampLight = new THREE.PointLight(0xffecd1, 1.2, 3.5);
  lampLight.position.set(0, 0.28, 0);
  lampGroup.add(lampLight);
  group.add(lampGroup);

  return group;
}

/**
 * Creates the Dining Nook in the background with the iconic retro green pendant lamp (seen in photo 1 & 5).
 */
export function createDiningNookAndGreenLamp(interactiveList: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(1.4, 0, 1.8);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x472d1f, roughness: 0.5 });

  // Round dining table
  const tabletop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 32), woodMat);
  tabletop.position.y = 0.74;
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.72, 16), woodMat);
  pedestal.position.y = 0.36;
  group.add(tabletop, pedestal);

  // 2 Dining Chairs
  for (const angle of [0, Math.PI]) {
    const chair = new THREE.Group();
    chair.position.set(Math.cos(angle) * 0.72, 0, Math.sin(angle) * 0.72);
    chair.rotation.y = -angle + Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), woodMat);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.03), woodMat);
    back.position.set(0, 0.65, -0.19);
    chair.add(seat, back);

    for (const cx of [-0.18, 0.18]) {
      for (const cz of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), woodMat);
        leg.position.set(cx, 0.225, cz);
        chair.add(leg);
      }
    }
    group.add(chair);
  }

  // Retro Green Pendant Lamp (luminária pendente verde retrô vista nas fotos)
  const lampCord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 1.2, 8),
    new THREE.MeshBasicMaterial({ color: 0x222222 })
  );
  lampCord.position.set(0, 2.4, 0);

  // Green metal bell shade
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x65a30d, // olive / lime retro green
    roughness: 0.3,
    metalness: 0.2
  });
  const greenShade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 24, 1, true), shadeMat);
  greenShade.position.set(0, 1.75, 0);

  const pendantLight = new THREE.PointLight(0xfff7ed, 1.4, 4.0);
  pendantLight.position.set(0, 1.68, 0);

  group.add(lampCord, greenShade, pendantLight);

  group.userData = { id: 'dining_nook', title: 'Mesa de Refeições & Pendente Verde' };
  interactiveList.push(group);
  return group;
}

/**
 * Creates knick-knacks and ceramics on Clarice's bookcase:
 * - Portuguese Ceramic Rooster (Galo de Barcelos) as seen in photo 3
 * - Porcelain figurines & ceramic animals
 * - Stacks of vinyl records / LPs on lower shelves
 */
export function createBookcaseCeramicsAndRecords(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(-2.55, 0, -0.5);
  group.rotation.y = Math.PI / 2;

  // 1. Ceramic Rooster (Galo de Barcelos) on middle shelf (Y = 1.35)
  const roosterGroup = new THREE.Group();
  roosterGroup.position.set(0.15, 1.35, -0.05);

  const blackCeramic = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
  const redComb = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const rBody = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), blackCeramic);
  const rComb = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.05), redComb);
  rComb.position.set(0, 0.045, 0.01);
  const rTail = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 12), redComb);
  rTail.rotation.x = -1.2;
  rTail.position.set(0, 0.04, -0.04);
  roosterGroup.add(rBody, rComb, rTail);
  group.add(roosterGroup);

  // 2. Porcelain Figurines / Bibelôs
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 });
  const fig1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.09, 8), porcelainMat);
  fig1.position.set(-0.25, 1.35, -0.05);
  const fig2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), porcelainMat);
  fig2.position.set(-0.35, 1.35, -0.05);
  group.add(fig1, fig2);

  // 3. Stacks of Vinyl Records / LPs on lower shelf (Y = 0.4) as seen in photo 3
  const vinylMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  for (let v = 0; v < 18; v++) {
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.3, 0.3), vinylMat);
    lp.position.set(-0.55 + v * 0.011, 0.58, -0.02);
    group.add(lp);
  }

  // 4. Closed wooden cabinets doors at bottom
  const cabWood = new THREE.MeshStandardMaterial({ color: 0x301e14, roughness: 0.5 });
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.36, 0.02), cabWood);
  doorL.position.set(-0.34, 0.2, 0.15);
  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.36, 0.02), cabWood);
  doorR.position.set(0.34, 0.2, 0.15);
  group.add(doorL, doorR);

  return group;
}

/**
 * Creates authentic desk details based on the famous black and white photo (Photo 4):
 * - Stacks of Clarice's landmark books (A Paixão Segundo G.H., Água Viva, etc.)
 * - White porcelain espresso cup and saucer
 * - Open manuscript notebook with handwritten notes and fountain pen
 */
export function createDeskBookStacksAndCoffee(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 1.0, -0.3);

  // 1. High stack of Clarice's published books (photo 4)
  const bookCovers = [
    { title: 'A Paixão Segundo G.H.', color: 0xc2410c },
    { title: 'Laços de Família', color: 0x15803d },
    { title: 'Perto do Coração Selvagem', color: 0x1d4ed8 },
    { title: 'Água Viva', color: 0xb91c1c },
    { title: 'Uma Aprendizagem', color: 0x7e22ce }
  ];

  bookCovers.forEach((b, idx) => {
    const bookMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.035, 0.26),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.5 })
    );
    bookMesh.position.set(0.55, idx * 0.038, -0.15);
    bookMesh.rotation.y = (idx * 0.04) - 0.08;
    bookMesh.castShadow = true;
    group.add(bookMesh);
  });

  // 2. White Porcelain Coffee Cup & Saucer (Xícara de Café da Clarice)
  const chinaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const coffeeMat = new THREE.MeshBasicMaterial({ color: 0x2b1509 }); // dark espresso

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.01, 16), chinaMat);
  saucer.position.set(0.22, 0.005, 0.15);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.05, 16), chinaMat);
  cup.position.set(0.22, 0.035, 0.15);
  const coffeeLiquid = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), coffeeMat);
  coffeeLiquid.rotation.x = -Math.PI / 2;
  coffeeLiquid.position.set(0.22, 0.056, 0.15);
  group.add(saucer, cup, coffeeLiquid);

  // 3. Open Manuscript Notebook with Fountain Pen (Caderno de Manuscritos Aberto)
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xfaf5ea, roughness: 0.8 });
  const openNotebook = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.22), pageMat);
  openNotebook.position.set(-0.25, 0.01, 0.15);
  openNotebook.rotation.y = 0.08;

  // Fountain pen
  const penMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 8), penMat);
  pen.rotation.z = Math.PI / 2.2;
  pen.position.set(-0.12, 0.025, 0.16);
  group.add(openNotebook, pen);

  return group;
}

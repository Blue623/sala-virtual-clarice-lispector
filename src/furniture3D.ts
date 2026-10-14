/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/* ---------------- 1. Molduras e Arte de Parede ---------------- */
export function createWainscotingAndWallArt(interactiveList?: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();

  const woodMoldingMat = new THREE.MeshStandardMaterial({
    color: 0x3d271d,
    roughness: 0.5,
    metalness: 0.1
  });

  // Rodapé inferior ao redor do piso
  const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 4.4), woodMoldingMat);
  baseboardLeft.position.set(-2.56, 0.09, -0.3);
  group.add(baseboardLeft);

  const baseboardRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 4.4), woodMoldingMat);
  baseboardRight.position.set(2.56, 0.09, -0.3);
  group.add(baseboardRight);

  const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(5.12, 0.18, 0.04), woodMoldingMat);
  baseboardBack.position.set(0, 0.09, -2.54);
  group.add(baseboardBack);

  // Moldura / Quadro com foto ou manuscrito na parede lateral esquerda
  const frameGeo = new THREE.BoxGeometry(0.04, 0.85, 0.65);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f1a17, roughness: 0.6 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(-2.55, 1.85, -0.6);
  group.add(frame);

  const canvasGeo = new THREE.PlaneGeometry(0.55, 0.75);
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xefede6, roughness: 0.9 });
  const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
  canvasMesh.rotation.y = Math.PI / 2;
  canvasMesh.position.set(-2.525, 1.85, -0.6);
  group.add(canvasMesh);

  return group;
}

/* ---------------- 2. Sofá Modernista de Linho ---------------- */
/* ---------------- 2. Sofá Modernista de Linho (Encostado na Parede Esquerda) ---------------- */
export function createModernistSofa(interactiveList?: THREE.Object3D[]): THREE.Group {
  const sofaGroup = new THREE.Group();

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd7cfc2,
    roughness: 0.85,
    metalness: 0.02
  });

  const woodBaseMat = new THREE.MeshStandardMaterial({
    color: 0x472d1f,
    roughness: 0.45
  });

  // Base do Sofá (alinhada na parede esquerda x = -2.0)
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 1.6), woodBaseMat);
  base.position.set(-2.0, 0.18, 0.1);
  base.castShadow = true;
  base.receiveShadow = true;
  sofaGroup.add(base);

  // Pés
  const legGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.18, 16);
  const legPositions = [
    [-2.3, 0.09, 0.75],
    [-1.7, 0.09, 0.75],
    [-2.3, 0.09, -0.55],
    [-1.7, 0.09, -0.55]
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodBaseMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    sofaGroup.add(leg);
  });

  // Assento almofadado
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.22, 1.56), fabricMat);
  cushion.position.set(-2.0, 0.35, 0.1);
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  sofaGroup.add(cushion);

  // Encosto (costas encostadas na parede esquerda em x = -2.44)
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 1.56), fabricMat);
  backrest.position.set(-2.44, 0.62, 0.1);
  backrest.castShadow = true;
  sofaGroup.add(backrest);

  // Braço frontal
  const armFront = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.32, 0.14), fabricMat);
  armFront.position.set(-2.0, 0.45, 0.85);
  armFront.castShadow = true;
  sofaGroup.add(armFront);

  // Braço de trás
  const armBack = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.32, 0.14), fabricMat);
  armBack.position.set(-2.0, 0.45, -0.65);
  armBack.castShadow = true;
  sofaGroup.add(armBack);

  sofaGroup.userData = { id: 'sofa', title: 'Sofá de Linho de Clarice' };
  interactiveList?.push(sofaGroup);

  return sofaGroup;
}

/* ---------------- 3. Mesa Lateral com Telefone de Baquelite ---------------- */
export function createSideTableAndRotaryPhone(interactiveList?: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2316, roughness: 0.45 });
  const blackPhoneMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.2, metalness: 0.3 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc8a261, roughness: 0.3, metalness: 0.8 });

  // Tampo da Mesinha Redonda
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32), woodMat);
  tableTop.position.set(-2.05, 0.58, -0.95);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  // Pés da Mesinha
  const legGeo = new THREE.CylinderGeometry(0.016, 0.012, 0.58, 16);
  const legAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  legAngles.forEach((angle) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(
      -2.05 + Math.cos(angle) * 0.16,
      0.29,
      -0.95 + Math.sin(angle) * 0.16
    );
    leg.castShadow = true;
    group.add(leg);
  });

  // Base do Telefone de Disco
  const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.15), blackPhoneMat);
  phoneBase.position.set(-2.05, 0.63, -0.95);
  phoneBase.castShadow = true;
  group.add(phoneBase);

  // Disco giratório
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 24), brassMat);
  dial.rotation.x = Math.PI / 6;
  dial.position.set(-2.05, 0.67, -0.91);
  group.add(dial);

  // Gancho e Monofone
  const handsetBar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 16), blackPhoneMat);
  handsetBar.rotation.z = Math.PI / 2;
  handsetBar.position.set(-2.05, 0.71, -0.95);
  group.add(handsetBar);

  const earpieceL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.035, 16), blackPhoneMat);
  earpieceL.rotation.z = Math.PI / 2;
  earpieceL.position.set(-2.15, 0.71, -0.95);
  group.add(earpieceL);

  const earpieceR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.035, 16), blackPhoneMat);
  earpieceR.rotation.z = -Math.PI / 2;
  earpieceR.position.set(-1.95, 0.71, -0.95);
  group.add(earpieceR);

  // Registra para clique/laser
  group.userData = { id: 'rotary_phone', title: 'Telefone de Baquelite' };
  interactiveList?.push(group);

  return group;
}

/* ---------------- 4. Estante com Livros, Cerâmicas e Discos ---------------- */
export function createBookcaseCeramicsAndRecords(): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x422a1d, roughness: 0.5 });
  const bookColors = [0x78281f, 0x1b4f72, 0x196f3d, 0xb7950b, 0x512e5f, 0x34495e, 0xa04000];

  // Estrutura Vertical da Estante na parede direita
  const shelfX = 2.45;
  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 1.4), woodMat);
  backBoard.position.set(shelfX + 0.06, 1.15, -0.3);
  group.add(backBoard);

  // Prateleiras horizontais
  const shelfHeights = [0.25, 0.7, 1.15, 1.6, 2.05];
  shelfHeights.forEach((y) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.4), woodMat);
    shelf.position.set(shelfX - 0.1, y, -0.3);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);
  });

  // Livros nas prateleiras
  for (let s = 1; s < shelfHeights.length; s++) {
    const yBase = shelfHeights[s - 1] + 0.02;
    const numBooks = 10 + Math.floor(Math.random() * 4);
    let currentZ = -0.85;

    for (let b = 0; b < numBooks; b++) {
      const bookWidth = 0.025 + Math.random() * 0.025;
      const bookHeight = 0.24 + Math.random() * 0.08;
      const bookDepth = 0.22;
      const col = bookColors[(s * 3 + b) % bookColors.length];
      const bMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });

      const book = new THREE.Mesh(new THREE.BoxGeometry(bookDepth, bookHeight, bookWidth), bMat);
      book.position.set(shelfX - 0.1, yBase + bookHeight / 2, currentZ + bookWidth / 2);
      book.castShadow = true;
      group.add(book);

      currentZ += bookWidth + 0.008;
      if (currentZ > 0.25) break;
    }
  }

  // Vaso de cerâmica decorativo
  const vaseGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.22, 16);
  const vaseMat = new THREE.MeshStandardMaterial({ color: 0xc4a482, roughness: 0.6 });
  const vase = new THREE.Mesh(vaseGeo, vaseMat);
  vase.position.set(shelfX - 0.1, 1.73, 0.15);
  vase.castShadow = true;
  group.add(vase);

  return group;
}

/* ---------------- 5. Livros e Xícara sobre a Mesa Principal ---------------- */
/* ---------------- 5. Livros/Manuscritos sobre a Mesa Principal ---------------- */
export function createDeskBookStacksAndCoffee(): THREE.Group {
  const group = new THREE.Group();

  // Pilha de livros / manuscritos no canto esquerdo da mesa
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.85 });
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.6 });

  for (let i = 0; i < 4; i++) {
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.32), i % 2 === 0 ? coverMat : paperMat);
    book.position.set(-0.65, 1.01 + i * 0.032, -0.35 + (Math.random() - 0.5) * 0.02);
    book.rotation.y = (Math.random() - 0.5) * 0.12;
    book.castShadow = true;
    book.receiveShadow = true;
    group.add(book);
  }

  // (Pires e xícara procedurais antigos removidos para dar lugar a xicara.glb)

  return group;
}
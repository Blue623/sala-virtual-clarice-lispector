/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ArchivalPhoto {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  keyDetails: string[];
}

export const HISTORICAL_PHOTOS: ArchivalPhoto[] = [
  {
    id: 1,
    title: "O Living-Gabinete de Clarice Lispector no Leme",
    subtitle: "Rua Gustavo Sampaio, 520 • Leme, Rio de Janeiro",
    date: "Reconstrução Fiel Memorial",
    description:
      "A sala de estar e gabinete de criação de Clarice Lispector integrava vida cotidiana e escrita literária. No espaço, destacam-se o piso em tábua corrida, o lambril de madeira natural até meia parede, o sofá modernista de três lugares, a famosa cadeira de balanço Thonet em madeira curvada e palhinha, e ao fundo a copa com a luminária pendente verde retrô.",
    keyDetails: [
      "Sofá-cama de três lugares com base de madeira e almofadas de linho cinza",
      "Cadeira de balanço Thonet clássica com assento e encosto de palha vienense",
      "Mesa de centro de ripas em jacarandá com cinzeiro de vidro verde",
      "Tapete de tear listrado em tons terrosos e azuis",
      "Luminária pendente verde oliva sobre a mesa redonda ao fundo"
    ]
  },
  {
    id: 2,
    title: "A Cadeira de Balanço Thonet & A Parede de Quadros",
    subtitle: "O rito de contemplação e leitura",
    date: "C. 1970–1977",
    description:
      "Clarice mantinha sua cadeira de balanço Thonet no centro da sala, posicionada para permitir tanto a leitura quanto a conversa com os amigos que a visitavam. Acima do lambril de madeira, cinco gravuras e desenhos emoldurados decoravam a parede de gesso claro, ao lado da estante com livros de literatura universal e filosofia.",
    keyDetails: [
      "Volutas e curvas de madeira curvada a vapor características de Michael Thonet",
      "Telefone preto de disco (baquelite) na mesinha de canto",
      "Abajur cilíndrico com cúpula de tecido quente ao lado do sofá",
      "Cinco molduras com desenhos figurativos e gravuras modernistas",
      "Estante de madeira com nichos assimétricos e armários inferiores"
    ]
  },
  {
    id: 3,
    title: "Clarice Lispector Junto à Sua Estante de Livros",
    subtitle: "Retrato a cores de Clarice em seu apartamento no Leme",
    date: "Fotografia Histórica",
    description:
      "Clarice sentada na mesinha lateral ao lado de sua monumental estante de madeira, vestindo seu icônico vestido vermelho estampado com motivos florais pretos. Ao seu lado, a máquina de escrever portátil na maleta, o telefone de disco preto, seus vidros de remédios, e nas prateleiras: livros em pilhas orgânicas, bibelôs, o tradicional Galo de Barcelos português e dezenas de discos de vinil.",
    keyDetails: [
      "Clarice vestindo o famoso vestido vermelho com estampas florais pretas",
      "Estante apinhada de livros, bibelôs de porcelana e o Galo de cerâmica",
      "Pilhas verticais de LPs e discos de vinil nas prateleiras baixas",
      "Telefone de baquelite preto e luminária com cúpula cônica ao fundo",
      "Máquina de escrever portátil acomodada na poltrona"
    ]
  },
  {
    id: 4,
    title: "Clarice à Mesa de Trabalho Diante da Janela do Leme",
    subtitle: "O clássico retrato em preto e branco com Copacabana ao fundo",
    date: "Fotografia de Maureen Bisilliat / Acervo IMS",
    description:
      "Um dos mais célebres retratos da literatura brasileira: Clarice Lispector em seu casaco escuro e lenço no pescoço, cigarro entre os dedos da mão esquerda, caneta em punho sobre o caderno de anotações, e ao lado sua máquina de escrever Olympia. Diante dela, a grande janela revela a curva completa da praia de Copacabana e os picos do Morro Dois Irmãos e Morro do Leme.",
    keyDetails: [
      "Janela panorâmica emoldurando a curva de Copacabana e o mar do Leme",
      "Máquina de escrever com folha de lauda inserida no rolo",
      "Xícara de café com pires e cinzeiro repleto de bitucas",
      "Pilha de primeiras edições: A Paixão Segundo G.H., Laços de Família e Água Viva",
      "Caderno de manuscritos aberto com a caligrafia da autora"
    ]
  },
  {
    id: 5,
    title: "A Frase na Parede: O Refúgio da Criação",
    subtitle: "A epígrafe afetiva do gabinete",
    date: "Memorial Clarice Lispector",
    description:
      "Na parede branca acima do lambril de madeira, vê-se a frase inscrita pela autora: 'Se vocês gostam de escrever ou desenhar ou pintar, façam porque é ótimo: enquanto a gente brinca assim, não se sente mais sozinha, e fica de coração quente.' A frase resume a relação íntima e salvadora de Clarice com a escrita como ato de sobrevivência à solidão.",
    keyDetails: [
      "Inscrição caligráfica da autora na parede do gabinete",
      "Abajur aceso sobre a mesinha com luz difusa acolhedora",
      "A cadeira de balanço Thonet pronta para receber quem deseja sonhar",
      "Harmonia entre a madeira acolhedora e a luz natural carioca"
    ]
  }
];

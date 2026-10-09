// Catálogo único das portas de exploração. Nenhum site externo é carregado aqui.
// integration: local | iframe | external (futuro: instrumented para atividades próprias).
(function () {
  var logo = 'assets/tools/tool-placeholder.svg';
  var tools = {
    scratch: { id: 'scratch', name: 'Scratch', category: 'programacao', description: 'Ambiente de programação em blocos voltado à criação de jogos, animações, histórias e projetos interativos.', logo: logo, url: 'https://scratch.mit.edu/projects/editor/', integration: 'external', iframeAllowed: false },
    makecode: { id: 'makecode', name: 'MakeCode', category: 'programacao', description: 'Ambiente de programação em blocos e texto utilizado com placas, robótica e projetos de computação física.', logo: logo, url: 'https://makecode.microbit.org/', integration: 'external', iframeAllowed: false },
    tinkercadCircuits: { id: 'tinkercadCircuits', name: 'Tinkercad Circuits', category: 'eletronica', description: 'Simulador de circuitos eletrônicos que permite trabalhar com Arduino, sensores, componentes e programação.', logo: logo, url: 'https://www.tinkercad.com/circuits', integration: 'external', iframeAllowed: false },
    wokwi: { id: 'wokwi', name: 'Wokwi', category: 'eletronica', description: 'Simulador online de Arduino, ESP32, sensores, displays e diversos componentes eletrônicos.', logo: logo, url: 'https://wokwi.com/', integration: 'external', iframeAllowed: false },
    circuitverse: { id: 'circuitverse', name: 'CircuitVerse', category: 'logica-digital', description: 'Simulador de circuitos digitais para explorar portas lógicas, circuitos combinacionais, registradores e outros conceitos de eletrônica digital.', logo: logo, url: 'https://circuitverse.org/simulator', integration: 'external', iframeAllowed: false },
    tinkercad3d: { id: 'tinkercad3d', name: 'Tinkercad 3D', category: 'modelagem-3d', description: 'Ferramenta de modelagem tridimensional simples e acessível para criação de objetos e protótipos.', logo: logo, url: 'https://www.tinkercad.com/3d-design', integration: 'external', iframeAllowed: false },
    tinkercadCodeblocks: { id: 'tinkercadCodeblocks', name: 'Tinkercad Codeblocks', category: 'modelagem-3d', description: 'Modelagem 3D por programação em blocos, permitindo criar objetos por meio de lógica, medidas, repetições e transformações.', logo: logo, url: 'https://www.tinkercad.com/codeblocks', integration: 'external', iframeAllowed: false },
    thingiverse: { id: 'thingiverse', name: 'Thingiverse', category: 'biblioteca-3d', description: 'Biblioteca online de modelos 3D compartilhados pela comunidade Maker.', logo: logo, url: 'https://www.thingiverse.com/', integration: 'external', iframeAllowed: false },
    makerworld: { id: 'makerworld', name: 'MakerWorld', category: 'biblioteca-3d', description: 'Plataforma de modelos 3D voltada à impressão 3D, projetos e compartilhamento de arquivos.', logo: logo, url: 'https://makerworld.com/en/3d-models', integration: 'external', iframeAllowed: false },
    gearsbot: { id: 'gearsbot', name: 'GearsBot', category: 'robotica', description: 'Ambiente de desafios de robótica. A versão local será integrada em breve.', logo: logo, url: '/gearsbot/', integration: 'local', iframeAllowed: true, available: false },
    pictoblox: { id: 'pictoblox', name: 'PictoBlox', category: 'robotica', description: 'Ambiente de programação em blocos com recursos para robótica, hardware, inteligência artificial e projetos STEM.', logo: logo, url: 'https://pictoblox.ai/', integration: 'external', iframeAllowed: false },
    phet: { id: 'phet', name: 'PhET', category: 'ciencias', description: 'Conjunto de simulações interativas de Física, Química, Matemática e outras áreas da ciência.', logo: logo, url: 'https://phet.colorado.edu/pt_BR/', integration: 'external', iframeAllowed: false, actionLabel: 'Explorar simulações' },
    teachableMachine: { id: 'teachableMachine', name: 'Teachable Machine', category: 'ia', description: 'Ferramenta para criação de modelos simples de inteligência artificial usando imagens, sons e poses.', logo: logo, url: 'https://teachablemachine.withgoogle.com/', integration: 'external', iframeAllowed: false },
    pictobloxML: { id: 'pictobloxML', name: 'PictoBlox ML', category: 'ia', description: 'Recursos de aprendizado de máquina e inteligência artificial integrados ao ambiente PictoBlox.', logo: logo, url: 'https://pictoblox.ai/', integration: 'external', iframeAllowed: false }
  };

  window.labmakerToolRegistry = Object.freeze({
    get: function (id) { return tools[id] || null; },
    list: function (ids) { return ids.map(function (id) { return tools[id]; }).filter(Boolean); }
  });
})();

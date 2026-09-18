
// Single-language bootloader.
(function() {
  // Mapeamento: nome do arquivo HTML -> pasta original de scripts
  var appPaths = {
    'blocos': 'puzzle',
    'labirinto': 'maze',
    'drone': 'bird',
    'geobot': 'turtle',
    'dancebot': 'movie',
    'djbot': 'music',
    'treinamento': 'pond/tutor',
    'torneio': 'pond/duck'
  };

  var pathParts = location.pathname.split('/');
  var fileName = pathParts[pathParts.length - 1];
  var appName = fileName.replace('.html', '');

  // Aplicar alias; manter suporte ao nome original como fallback
  var appPath = appPaths[appName] || appName;

  if (!appPath || appPath === 'index') {
    appPath = 'index';
  }

  var lang = 'pt-br';
  window['BlocklyGamesLanguages'] = [lang];
  window['BlocklyGamesLang'] = lang;

  var script = document.createElement('script');
  script.src = appPath + '/generated/' + lang + '/compressed.js';
  script.type = 'text/javascript';
  document.head.appendChild(script);
})();

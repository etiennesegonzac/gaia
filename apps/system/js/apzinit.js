window.addEventListener('load', function() {
  var apzFrame = document.createElement('iframe');
  apzFrame.style.border = '0';
  apzFrame.style.zIndex = '4'; // on top of the homescreen
  apzFrame.style.position = 'absolute';
  apzFrame.style.top = 'var(--statusbar-height)';
  apzFrame.style.left = apzFrame.style.right = apzFrame.style.bottom = '0';
  apzFrame.style.width = '100%';
  apzFrame.style.height = 'calc(100% - var(--statusbar-height) - var(--software-home-button-height))';
  apzFrame.src = '/hope/index.html';
  document.body.appendChild(apzFrame);

  // Statusbar color
  var sheet = document.createElement('style');
  sheet.setAttribute('type', 'text/css');

  var styleText = document.createTextNode([
    '#statusbar { background: #333333 !important; }',
    '#statusbar.light { filter:none !important; }',
    '#windows .appWindow .titlebar { background: #333333 !important }',
    '#windows .appWindow.homescreen { display:none !important; animation: none !important }',
    '#software-home-ring { outline: none; background: no-repeat center/70% url(/hope/assets/Home.png); }',
    '#hope-back {',
    'position: absolute;',
    'top: 0;',
    'left: 1rem;',
    'height: 5rem;',
    'width: 7rem;',
    'padding: 0;',
    'pointer-events: all;',
    'background: transparent;',
    'background-image: url(/hope/assets/Back.png);',
    'background-repeat: no-repeat;',
    'background-size: 23px 27px;',
    'background-position: center center;',
    'border: none;',
    '}',
  ].join('\n'));

  sheet.appendChild(styleText);
  document.head.appendChild(sheet);

  // Home button support
  window.addEventListener('home', function() {
    apzFrame.contentWindow.dispatchEvent(new CustomEvent('home-button-press'));
  });

  // Back button support
  var buttons = document.getElementById('software-buttons');
  var back = document.createElement('button');
  back.id = 'hope-back';
  buttons.insertBefore(back, buttons.firstElementChild);

  back.addEventListener('click', function() {
    apzFrame.contentWindow.dispatchEvent(new CustomEvent('back-button-press'));
  });
});

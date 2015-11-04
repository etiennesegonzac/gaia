window.addEventListener('load', function() {
  document.getElementById('screen').style.opacity = '0';
  var apzFrame = document.createElement('iframe');
  apzFrame.style.border = '0';
  apzFrame.style.zIndex = '10000000000';
  apzFrame.style.position = 'absolute';
  apzFrame.style.top = apzFrame.style.left = apzFrame.style.right = apzFrame.style.bottom = '0';
  apzFrame.style.width = apzFrame.style.height = '100%';
  apzFrame.src = '/apz-gambler/index.html';
  document.body.appendChild(apzFrame);
});

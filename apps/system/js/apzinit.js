window.addEventListener('load', function() {
  document.getElementById('screen').style.opacity = '0.01';
  var apzFrame = document.createElement('iframe');
  apzFrame.style.border = '0';
  apzFrame.style.zIndex = '10000000000';
  apzFrame.style.position = 'absolute';
  apzFrame.style.top = apzFrame.style.left = apzFrame.style.right = apzFrame.style.bottom = '0';
  apzFrame.style.width = apzFrame.style.height = '100%';
  apzFrame.src = '/apz-gambler/index.html';
  document.body.appendChild(apzFrame);

  // Shake to reload
  var EXCITEMENT_FILTER_ALPHA = 0.2;
  var EXCITEMENT_THRESHOLD = 500;
  var DEVICE_MOTION_EVENT = 'devicemotion';
  var SCREEN_CHANGE_EVENT = 'screenchange';

  var screenEnabled = true;
  var excitement = 0;

  window.addEventListener(SCREEN_CHANGE_EVENT, function(evt) {
    screenEnabled = evt.detail.screenEnabled;
    if (screenEnabled) {
      window.addEventListener(DEVICE_MOTION_EVENT, handleMotion);
    } else {
      window.removeEventListener(DEVICE_MOTION_EVENT, handleMotion);
    }
  });

  function handleMotion(evt) {
    let acc = evt.accelerationIncludingGravity;

    let newExcitement = acc.x * acc.x + acc.y * acc.y + acc.z * acc.z;
    excitement += (newExcitement - excitement) * EXCITEMENT_FILTER_ALPHA;

    if (excitement > EXCITEMENT_THRESHOLD) {
      apzFrame.src = '/apz-gambler/index.html';
    }
  }
});

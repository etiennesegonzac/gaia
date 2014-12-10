'use strict';
/* globals MozActivity */

(function() {
  var camera = null;
  function toggleTorch() {
    if (camera.flashMode == 'torch') {
      camera.flashMode = 'auto';
      camera.release();
      camera = null;
    } else {
      camera.flashMode = 'torch';
    }
  }

  window.addEventListener('click', function(e) {
    /*jshint nonew: false */
    var target = e.target;
    var cs = target.classList;
    var ds = target.dataset;
    if ((cs.contains('search') || cs.contains('geo') || cs.contains('pined')) &&
        ds.url) {
      new MozActivity({
        name: 'view',
        data: {
          type: 'url',
          url: ds.url
        }
      });
      return;
    }
    if (cs.contains('message') && ds.number) {
      var activity = new MozActivity({
                        name: 'new',
                        data: {
                          type: 'websms/sms',
                          number: ds.number
                        }
                      });
      var after = (function(target) {
        if (target.classList.contains('notification')) {
          target.parentElement.removeChild(target);
        }
      }).bind(null, target);
      activity.onsuccess = activity.onerror = after;
      return;
    }
    if (cs.contains('dial') && ds.number) {
      if ('mozTelephony' in navigator) {
        navigator.mozTelephony.dial(ds.number);
      }
      return;
    }
    if (cs.contains('search') && ds.app == 'contact') {
      new MozActivity({
        name: 'pick',
        data: {
          type: 'webcontacts/contact'
        }
      });
      return;
    }
    if (cs.contains('flash')) {
      cs.toggle('active');
      if ('mozCameras' in navigator) {
        if (camera) {
          toggleTorch();
          return;
        }
        navigator.mozCameras.getCamera('back', {}).then(function(params) {
          camera = params.camera;
          toggleTorch();
        }, function() {
          console.log('getCamera promise rejected');
        });
      }
      return;
    }
    if (cs.contains('camera')) {
      new MozActivity({
        name: 'record',
        data: {
          type: 'photos'
        }
      }); //jsignore: line
      return;
    }
  });
})();

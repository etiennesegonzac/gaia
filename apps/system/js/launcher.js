/* global Service, applications */
'use strict';

(function(exports) {
  var Launcher = function() {};
  Launcher.prototype = {
    name: 'Launcher',
    EVENT_PREFIX: 'launcher',
    element: document.getElementById('launcher'),
    list: document.querySelector('#launcher > ul'),

    start: function() {
      Service.request('registerHierarchy', this);
      this.element.addEventListener('click', this);
      this.element.addEventListener('touchstart', this);
      this.element.addEventListener('touchend', this);

      window.removeEventListener('system-resize', this);
      document.body.style.setProperty('--screen-height',
                                      window.innerHeight + 'px');

      for (var manifest in applications.installedApps) {
        var li = document.createElement('li');
        li.dataset.manifestURL = manifest;
        li.textContent = applications.installedApps[manifest].manifest.name;
        this.list.appendChild(li);
      }
    },

    isActive: function() {
      return true;
    },

    respondToHierarchyEvent: function(evt) {
      if (evt.type == 'home') {
        this.element.classList.remove('hide');
        this.element.classList.remove('expand');
        var selected = this.element.querySelector('.choice');
        if (selected) {
          selected.classList.remove('choice');
        }
        this.nextTransition().then(() => {
          this.element.style.overflow = '';
          window.dispatchEvent(new CustomEvent('homescreenopened'));
        });
      }
      return true;
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'system-resize':
          document.body.style.setProperty('--screen-height',
                                          window.innerHeight);
          break;
        case 'touchstart':
          evt.target.classList.add('pulse');
          break;
        case 'touchend':
          evt.target.classList.remove('pulse');
          break;
        case 'click':
          evt.target.classList.add('choice');
          this.element.style.overflow = 'hidden';
          this.element.classList.add('expand');

          var app = applications.installedApps[evt.target.dataset.manifestURL];
          app.launch();

          var transitioned = false, ready = false;

          this.nextAppLaunch().then((config) => {
            var app = window.appWindowManager.getApp(config.origin,
              config.manifestURL);
            app.ready(() => {
              ready = true;
              if (transitioned) {
                this.element.classList.add('hide');
              }
            });
          });
          this.nextTransition().then(() => {
            transitioned = true;
            if (ready) {
              this.element.classList.add('hide');
            }
          });
          break;
      }
    },

    nextTransition: function() {
      var el = this.element;
      return new Promise(function(resolve, reject) {
        el.addEventListener('transitionend', function trWait() {
          el.removeEventListener('transitionend', trWait);
          resolve();
        });
      });
    },

    nextAppLaunch: function() {
      return new Promise(function(resolve, reject) {
        window.addEventListener('launchapp', function launchWait(evt) {
          window.removeEventListener('launchapp', launchWait);
          resolve(evt.detail);
        });
      });
    },
  };

  exports.Launcher = Launcher;
})(window);

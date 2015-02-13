/* global Service, applications, layoutManager, inputWindowManager */
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

      this.updateHeightCSSVar();

      //var index = 0;
      //for (var manifest in applications.installedApps) {
        //var li = document.createElement('li');
        //li.dataset.index = index;
        //li.dataset.manifestURL = manifest;
        //li.textContent = applications.installedApps[manifest].manifest.name;

        //this.list.appendChild(li);
        //index++;
      //}
    },

    isActive: function() {
      return true;
    },

    respondToHierarchyEvent: function(evt) {
      if (evt.type == 'system-resize') {
        this.updateHeightCSSVar();
      }

      if (evt.type == 'home') {
        if (layoutManager.keyboardEnabled) {
          inputWindowManager.hideInputWindowImmediately();
        }

        this.element.classList.remove('hide');
        this.element.classList.remove('expand');

        this.removeClassesOnItems();

        this.nextTransition().then(() => {
          this.element.style.overflow = '';
          window.dispatchEvent(new CustomEvent('homescreenopened'));
        });
      }

      return true;
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'touchstart':
          evt.target.classList.add('pulse');
          break;
        case 'touchend':
          evt.target.classList.remove('pulse');
          break;
        case 'click':
          var selected = parseInt(evt.target.dataset.index);
          this.setClassesOnItemsFor(selected);

          this.element.style.overflow = 'hidden';
          this.element.classList.add('expand');

          var app = applications.installedApps[evt.target.dataset.manifestURL];
          var entryPoint = evt.target.dataset.entryPoint || '';
          app.launch(entryPoint);

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

    setClassesOnItemsFor: function(selected) {
      var items = this.list.querySelectorAll('li');
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (i == selected) {
          item.classList.add('choice');
        }
        if ((i < selected) && (i >= (selected - 7))) {
          item.classList.add('top');
        }
        if ((i > selected) && (i <= (selected + 7))) {
          item.classList.add('bottom');
        }
      }
    },

    removeClassesOnItems: function() {
      var items = this.list.querySelectorAll('li');
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item.classList.remove('choice');
        item.classList.remove('top');
        item.classList.remove('bottom');
      }
    },

    updateHeightCSSVar: function() {
      document.body.style.setProperty('--screen-height',
                                      window.innerHeight + 'px');
    }
  };

  exports.Launcher = Launcher;
})(window);

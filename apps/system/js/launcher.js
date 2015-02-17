/* global Service, applications, layoutManager, inputWindowManager, places,
   UrlHelper, MozActivity */
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

      window.addEventListener('appopened', this);

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

      places.getStore().then(store => {
        store.onchange = this.fillHistory.bind(this);
      });
      this.fillHistory();
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
        case 'appopened':
          this.updateChoice(evt.detail);
          break;
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

          if (evt.target.dataset.url) {
            var activity = new MozActivity({
              name: 'view',
              data: {
                type: 'url',
                url: evt.target.dataset.url
              }
            });

            activity.onsuccess = function() {
              // TODO
            };

            this.nextTransition().then(() => {
              this.element.classList.add('hide');
            });
            return;
          }

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

    updateChoice: function(app) {
      var selector = 'li[data-manifest-u-r-l="' + app.manifestURL + '"]';
      selector += ', li[data-url="' + app.url + '"]';
      var matching = this.element.querySelectorAll(selector);
      var target;
      // entry points :/
      if (matching.length > 1) {
        for (var i = 0; i < matching.length; i++) {
          var el = matching[i];
          if (app.origin.indexOf(el.dataset.entryPoint) !== -1) {
            target = el;
          }
        }
      } else if (matching.length === 1) {
        target = matching[0];
      }

      if (!target || target.classList.contains('choice')) {
        return;
      }

      this.removeClassesOnItems();
      this.element.scrollTo(0, target.offsetTop);
      this.setClassesOnItemsFor(target.dataset.index);
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
    },

    fillHistory: function() {
      this._historyItems = [];
      places.getStore().then(store => {
        this.addHistoryItem(store.sync());
      });
    },

    _historyItems: [],
    addHistoryItem: function(cursor) {
      cursor.next().then(task => {
        if (task.operation == 'done') {
          this.renderHistory();
          return;
        }

        if (task.operation == 'add') {
          this._historyItems.push(task.data);
        }

        this.addHistoryItem(cursor);
      });
    },

    renderHistory: function() {
      var previous = this.list.querySelectorAll('li.history');
      var selectedURL = null;
      for (var i = 0; i < previous.length; i++) {
        var item = previous[i];
        if (item.classList.contains('choice')) {
          selectedURL = item.dataset.url;
        }
        item.parentNode.removeChild(item);
      }

      // Shapping it up, need work
      this._historyItems.sort((a, b) => {
        return a.visits[a.visits.length - 1] < b.visits[b.visits.length - 1];
      }).map(history => {
        var origin = UrlHelper.getOriginFromInput(history.url).split('//')[1];
        return {
          origin: origin,
          url: history.url
        };
      }).reduce((acc, history) => {
        var previousFromDomain = acc.find(i => {
          return i.origin == history.origin;
        });
        if (previousFromDomain) {
          previousFromDomain.url = history.url;
        } else {
          acc.push(history);
        }
        return acc;
      }, []).slice(0, 3).reverse().forEach(history => {
        var li = document.createElement('li');
        li.classList.add('history');
        li.dataset.url = history.url;
        if (history.url == selectedURL) {
          li.classList.add('choice');
        }
        var img = document.createElement('img');
        img.src = 'style/launcher/icons/history.svg';
        li.appendChild(img);

        var span = document.createElement('span');
        span.textContent = history.origin;
        li.appendChild(span);

        this.list.insertBefore(li, this.list.firstElementChild);
      });

      this.updateIndices();
    },

    updateIndices: function() {
      var items = this.list.querySelectorAll('li');
      var selected = -1;
      this.list.style.height = (items.length * 90) + 'px';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item.dataset.index = i;
        item.style.top = (i * 90) + 'px';
        if (item.classList.contains('choice')) {
          selected = i;
        }
      }
      if (selected >= 0) {
        this.removeClassesOnItems();
        this.setClassesOnItemsFor(selected);
      }
    }
  };

  exports.Launcher = Launcher;
})(window);

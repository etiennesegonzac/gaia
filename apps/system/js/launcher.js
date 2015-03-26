/* global Service, applications, layoutManager, inputWindowManager, places,
   UrlHelper, MozActivity, asyncStorage, SystemBanner, OrientationManager */
'use strict';

(function(exports) {
  const functionCount = 9;
  const rowHeight = 90;
  const rowsPerScreen = 7;
  const actionDS = 'actions';
  const historyLimit = 5;

  var Launcher = function() {};
  Launcher.prototype = {
    name: 'Launcher',
    EVENT_PREFIX: 'launcher',
    element: document.getElementById('launcher'),
    list: document.querySelector('#launcher > ul'),
    historyList: null,

    start: function() {
      Service.request('registerHierarchy', this);
      this.element.addEventListener('click', this);
      this.element.addEventListener('touchstart', this);
      this.element.addEventListener('touchend', this);

      window.addEventListener('appopened', this);
      window.addEventListener('launchapp', this);

      this.updateHeightCSSVar();

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
        if (this.element.classList.contains('hide')) {
          this.show();
        } else {
          this.scrollToTop();
        }
      }

      return true;
    },

    handleEvent: function(evt) {
      var target = evt.target;

      switch (evt.type) {
        case 'appopened':
          this.updateChoice(evt.detail);
          break;
        case 'launchapp':
          if (!evt.detail.stayBackground) {
            this.element.classList.add('expand');
            this.hide();
          }
          break;
        case 'touchstart':
          target.classList.add('pulse');
          break;
        case 'touchend':
          target.classList.remove('pulse');
          break;
        case 'click':
          if (target === this.historyList) {
            this.handleHistoryClick(evt);
            break;
          }

          this.collapseHistory();

          if (target.dataset.action) {
            var parent = target.parentNode;
            var index = parseInt(parent.dataset.index);
            if (parent.classList.contains('action')) {
              this.removeActionAtIndex(index);
            } else {
              this.addActionAtIndex(index);
            }
            break;
          }

          if (target.classList.contains('history') &&
              !target.classList.contains('action')) {
            this.addActionAtIndex(parseInt(target.dataset.index));
            return;
          }

          var selected = parseInt(target.dataset.index);
          this.setClassesOnItemsFor(selected);

          this.element.style.overflow = 'hidden';
          this.element.classList.add('expand');

          var url = target.dataset.url;
          if (url && url.indexOf('callscreen.gaiamobile') !== -1) {
            var number = target.dataset.url.split('#number=')[1];
            navigator.mozTelephony.dial(number);
            this.nextAttentionOpened().then(() => {
              this.show();
            });
            return;
          }

          if (url && (url.indexOf('app:/') === -1)) {
            var activity = new MozActivity({
              name: 'view',
              data: {
                type: 'url',
                url: url
              }
            });

            activity.onsuccess = function() {
              // TODO
            };

            this.nextTransition().then(() => {
              this.hide();
            });
            return;
          }

          var app = applications.installedApps[target.dataset.manifestURL];
          var entryPoint = target.dataset.entryPoint || '';
          var directHash;

          if (url && url.indexOf('communications.gaiamobile.org/contacts') !==
              -1) {
            var manif = 'app://communications.gaiamobile.org/manifest.webapp';
            var hash = target.dataset.url.split('#')[1].split('&')[0];

            app = applications.installedApps[manif];
            directHash = '#' + hash;
            entryPoint = 'contacts';
          }

          if (!app) {
            target.classList.add('shake');
            setTimeout(() => {
              target.classList.remove('shake');
            }, 300);
            return;
          }
          app.launch(entryPoint);

          var transitioned = false, ready = false;
          var finish = () => {
            if (transitioned && ready) {
              this.hide();
            }
          };

          this.nextAppLaunch().then((config) => {
            var app = window.appWindowManager.getApp(config.origin,
                                                     config.manifestURL);
            if (directHash) {
              var src = app.browser.element.src;
              app.browser.element.src = src.split('#')[0] + directHash;
            }
            app.ready(() => {
              ready = true;
              finish();
            });
          });
          this.nextTransition().then(() => {
            transitioned = true;
            finish();
          });
          break;
      }
    },

    _historyCollapsed: true,
    handleHistoryClick: function(evt) {
      if (this._historyCollapsed) {
        this.expandHistory();
      } else {
        this.collapseHistory();
      }
    },

    expandHistory: function() {
      if (!this._historyCollapsed) {
        return;
      }
      this._historyCollapsed = false;

      var itemCount = this.historyList.querySelectorAll('li.history').length;
      var count = functionCount + this._actions.length + itemCount + 1;
      var height = count * rowHeight;
      this.list.style.height = height + 'px';

      var delta = itemCount * rowHeight;

      setTimeout(() => {
        this.element.scrollBy({top: delta, behavior: 'smooth'});
      });
    },

    collapseHistory: function() {
      if (this._historyCollapsed) {
        return;
      }
      this._historyCollapsed = true;

      var itemCount = this.historyList.querySelectorAll('li.history').length;
      var delta = itemCount * (-1) * rowHeight;
      this.element.scrollBy({top: delta, behavior: 'smooth'});

      setTimeout(() => {
        var count = functionCount + this._actions.length + 1;
        this.list.style.height = (count  * rowHeight) + 'px';
      }, 350 /* smooth scroll duration, sorta */);
    },

    hide: function() {
      this.element.classList.add('hide');
      window.dispatchEvent(new CustomEvent('launcherwillhide'));

      this.collapseHistory();
    },

    show: function() {
      if (layoutManager.keyboardEnabled) {
        inputWindowManager.hideInputWindowImmediately();
      }

      this.element.classList.remove('hide');
      this.element.classList.remove('expand');

      this.removeClassesOnItems();

      this.nextTransition().then(() => {
        this.element.style.overflow = '';
        window.dispatchEvent(new CustomEvent('homescreenopened'));
        screen.mozLockOrientation(OrientationManager.defaultOrientation);
      });
    },

    scrollToTop: function() {
      this.element.scrollTo({top: 0, behavior: 'smooth'});
    },

    updateChoice: function(app) {
      var selector = 'li[data-url="' + app.url + '"], ';
      if (app && app.browser && app.browser.element) {
        selector += 'li[data-url^="' + app.browser.element.src + '"], ';
      }
      selector += 'li[data-manifest-u-r-l="' + app.manifestURL + '"]';
      var matching = this.element.querySelectorAll(selector);
      var target;
      // entry points :/
      if (matching.length > 1) {
        for (var i = 0; i < matching.length; i++) {
          var el = matching[i];
          // Can't now which one to match, pined shortcut from app
          if (el.dataset.url) {
            return;
          }
          if (!target && app.origin.indexOf(el.dataset.entryPoint) !== -1) {
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

    addActionAtIndex: function(index) {
      var items = this.historyList.querySelectorAll('li');
      var added = items[index];

      if (this._actions.length === 10) {
        added.classList.add('shake');
        setTimeout(() => {
          added.classList.remove('shake');
        }, 300);
        return;
      }

      added.classList.add('action');
      added.querySelector('img').src = 'style/launcher/icons/action.svg';
      added.style.transform = 'translateY(-' + (index + 1) * rowHeight + 'px)';

      this.historyList.style.transform = 'translateY(' + rowHeight + 'px)';

      var finish = () => {
        added.classList.add('adding');

        this._actions.push({
          url: added.dataset.url,
          title: added.dataset.title,
          action: true
        });
        this.persistActions(() => {
          // swirl duration
          this.collapseHistory();
          setTimeout(this.fillHistory.bind(this, {adding: true}), 300);
        });
      };

      // All items stay in place, no transition
      if (index === 0) {
        finish();
        return;
      }

      this.nextTransition().then(() => {
        finish();
      });
    },

    addAction: function(action) {
      this._actions.push({
        url: action.url,
        title: action.title,
        action: true
      });
      this.persistActions(() => {
        setTimeout(this.fillHistory.bind(this));
      });
    },

    removeActionAtIndex: function(index) {
      var items = this.list.querySelectorAll('li');
      var removed = items[index];
      removed.style.transform = 'translateY(var(--screen-height))';

      var limit = Math.min((index + 1 + rowsPerScreen), items.length);
      for (var i = (index + 1); i < limit; i++) {
        var item = items[i];
        item.style.transform = 'translateY(-' + rowHeight + 'px)';
      }

      this._actions = this._actions.filter((action) => {
        return (action.url != removed.dataset.url);
      });
      this.persistActions(() => {
        this.collapseHistory();
        setTimeout(this.fillHistory.bind(this), 300);
      });
    },

    persistActions: function(cb) {
      var urls = {};
      var uniqActions = this._actions.filter((item) => {
        if (urls[item.url]) {
          return false;
        }
        urls[item.url] = true;
        return true;
      });
      this._actions = uniqActions;
      asyncStorage.setItem(actionDS, uniqActions, () => {
        cb && cb();
      });
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

    nextAttentionOpened: function() {
      return new Promise(function(resolve, reject) {
        window.addEventListener('attentionopened', function attentionWait(evt) {
          window.removeEventListener('attentionopened', attentionWait);
          resolve(evt.detail);
        });
      });
    },

    setClassesOnItemsFor: function(selected) {
      var items = document.querySelectorAll('#launcher > ul > li, ' +
                                            '#history-list');
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (i == selected) {
          item.classList.add('choice');
        }
        if ((i < selected) && (i >= (selected - rowsPerScreen))) {
          item.classList.add('top');
        }
        if ((i > selected) && (i <= (selected + rowsPerScreen))) {
          item.classList.add('bottom');
        }
      }
    },

    removeClassesOnItems: function() {
      var items = document.querySelectorAll('#launcher > ul > li, ' +
                                            '#history-list');
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

    fillHistory: function(opts) {
      this._historyItems = [];
      places.getStore().then(store => {
        if (opts && opts.operation) {
          store.get(opts.id).then(obj => {
            if (obj.url.indexOf('&pin') !== -1) {
              this.addAction(obj);
              var banner = new SystemBanner();
              banner.show('Shortcut added.');
            } else {
              this.addHistoryItem(store.sync());
            }
          });
        } else {
          this.addHistoryItem(store.sync(), opts && opts.adding);
        }
      });
    },

    _historyItems: [],
    addHistoryItem: function(cursor, adding) {
      cursor.next().then(task => {
        if (task.operation == 'done') {
          this.renderHistory(adding);
          return;
        }

        if (task.operation == 'add') {
          this._historyItems.push(task.data);
        }

        this.addHistoryItem(cursor, adding);
      });
    },

    _actions: [],
    renderHistory: function(adding) {
      asyncStorage.getItem(actionDS, results => {
        this._actions = results || [];

        var previous = this.list.querySelectorAll('li.history');
        var selectedURL = null;
        for (var i = 0; i < previous.length; i++) {
          var item = previous[i];
          if (item.classList.contains('choice')) {
            selectedURL = item.dataset.url;
          }
          item.parentNode.removeChild(item);
        }

        if (this.historyList) {
          this.historyList.parentNode.removeChild(this.historyList);
          this.historyList = null;
        }

        var lastAction = null;
        var limit = historyLimit + this._actions.length;

        // Shapping it up, need work
        // This should never land in master
        this._actions.concat(this._historyItems.sort((a, b) => {
          return a.visits[0] < b.visits[0];
        })).map(history => {
          var domain = UrlHelper.getDomainFromInput(history.url);
          return {
            domain: domain,
            title: history.title || domain,
            url: history.url,
            action: !!history.action
          };
        }).reduce((acc, history) => {
          var duplicate = acc.find(i => {
            if (i.url.startsWith('app://') || i.action || history.action) {
              return i.url == history.url;
            }
            return i.domain == history.domain;
          });
          if (duplicate) {
            duplicate.title = history.title;
            duplicate.url = history.url;
            duplicate.action = duplicate.action || history.action;
          } else {
            acc.push(history);
          }
          return acc;
        }, []).slice(0, limit).forEach(history => {
          var li = document.createElement('li');
          li.classList.add('history');
          li.dataset.url = history.url;
          if (history.url == selectedURL) {
            li.classList.add('choice');
          }
          var img = document.createElement('img');
          img.src = 'style/launcher/icons/history.svg';
          img.dataset.action = history.url;
          li.appendChild(img);

          var span = document.createElement('span');
          span.textContent = history.title;
          li.dataset.title = history.title;
          li.appendChild(span);

          if (history.action) {
            img.src = 'style/launcher/icons/action.svg';
            li.classList.add('action');
            lastAction = li;
            this.list.appendChild(li);
          } else {
            if (!this.historyList) {
              this.historyList = document.createElement('ul');
              this.historyList.id = 'history-list';
              var placeHolder = document.createElement('li');
              var icon = document.createElement('img');
              icon.src = 'style/launcher/icons/history.svg';
              placeHolder.appendChild(icon);

              var spanHolder = document.createElement('span');
              spanHolder.textContent = 'Add action';
              placeHolder.appendChild(spanHolder);

              this.historyList.appendChild(placeHolder);
              this.list.appendChild(this.historyList);
            }

            this.historyList.appendChild(li);
          }
        });

        if (adding && lastAction) {
          lastAction.classList.add('new');
        }

        this.updateIndices();
      });
    },

    updateIndices: function() {
      var items = document.querySelectorAll('#launcher > ul > li, ' +
                                            '#history-list');
      var selected = -1;
      this.list.style.height = (items.length * rowHeight) + 'px';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item.dataset.index = i;
        item.style.top = (i * rowHeight) + 'px';
        item.style.transform = '';
        if (item.classList.contains('choice')) {
          selected = i;
        }
      }
      if (selected >= 0) {
        this.removeClassesOnItems();
        this.setClassesOnItemsFor(selected);
      }

      if (!this.historyList) {
        return;
      }

      var historyItems = this.historyList.querySelectorAll('li');
      for (i = 0; i < historyItems.length; i++) {
        var historyItem = historyItems[i];
        historyItem.dataset.index = i;
      }
    }
  };

  exports.Launcher = Launcher;
})(window);

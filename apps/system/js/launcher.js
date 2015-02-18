/* global Service, applications, layoutManager, inputWindowManager, places,
   UrlHelper, MozActivity, asyncStorage */
'use strict';

(function(exports) {
  const rowHeight = 90;
  const rowsPerScreen = 7;
  const actionDS = 'actions';

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
        case 'touchstart':
          target.classList.add('pulse');
          break;
        case 'touchend':
          target.classList.remove('pulse');
          break;
        case 'click':
          if (target.dataset.action) {
            var parent = target.parentNode;
            var index = parseInt(parent.dataset.index);
            if (parent.classList.contains('action')) {
              this.removeActionAtIndex(index);
            } else {
              this.addActionAtIndex(target.dataset.action, index);
            }
            break;
          }

          var selected = parseInt(target.dataset.index);
          this.setClassesOnItemsFor(selected);

          this.element.style.overflow = 'hidden';
          this.element.classList.add('expand');

          if (target.dataset.url) {
            var activity = new MozActivity({
              name: 'view',
              data: {
                type: 'url',
                url: target.dataset.url
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

    hide: function() {
      this.element.classList.add('hide');
      window.dispatchEvent(new CustomEvent('launcherwillhide'));
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
      });
    },

    scrollToTop: function() {
      this.element.scrollTo({top: 0, behavior: 'smooth'});
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

    addActionAtIndex: function(action, index) {
      var items = this.list.querySelectorAll('li');
      var added = items[index];
      added.classList.add('action');
      added.style.transform = 'translateY(-' + (index - this._actions.length) *
                                               rowHeight + 'px)';

      for (var i = this._actions.length; i < index; i++) {
        var item = items[i];
        if (item !== added) {
          item.style.transform = 'translateY(' + rowHeight + 'px)';
        }
      }

      var finish = () => {
        added.classList.add('adding');

        this._actions.push({
          url: added.dataset.url,
          title: added.dataset.title,
          action: true
        });
        asyncStorage.setItem(actionDS, this._actions, () => {
          // swirl duration
          setTimeout(this.fillHistory.bind(this, {adding: true}), 300);
        });
      };

      // All items stay in place, no transition
      if ((index - this._actions.length) === 0) {
        finish();
        return;
      }

      this.nextTransition().then(() => {
        finish();
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
      asyncStorage.setItem(actionDS, this._actions, () => {
        setTimeout(this.fillHistory.bind(this), 300);
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

    setClassesOnItemsFor: function(selected) {
      var items = this.list.querySelectorAll('li');
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

    fillHistory: function(opts) {
      this._historyItems = [];
      places.getStore().then(store => {
        this.addHistoryItem(store.sync(), opts && opts.adding);
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

        var lastAction = null;

        // Shapping it up, need work
        // This should never land in master
        this._actions.concat(this._historyItems.sort((a, b) => {
          return a.visits[a.visits.length - 1] < b.visits[b.visits.length - 1];
        })).map(history => {
          var domain = UrlHelper.getDomainFromInput(history.url);
          return {
            domain: domain,
            title: history.title || domain,
            url: history.url,
            action: !!history.action
          };
        }).reduce((acc, history) => {
          var sameDomain = acc.find(i => {
            return i.domain == history.domain;
          });
          if (sameDomain) {
            sameDomain.url = history.url;
            sameDomain.action = sameDomain.action || history.action;
          } else {
            acc.push(history);
          }
          return acc;
        }, []).slice(0, 3 + this._actions.length).reverse().forEach(history => {
          var li = document.createElement('li');
          li.classList.add('history');
          li.dataset.url = history.url;
          if (history.url == selectedURL) {
            li.classList.add('choice');
          }
          var img = document.createElement('img');
          img.src = 'style/launcher/icons/history.svg';
          if (history.action) {
            img.src = 'style/launcher/icons/action.svg';
            li.classList.add('action');
            lastAction = lastAction || li;
          }
          img.dataset.action = history.url;
          li.appendChild(img);

          var span = document.createElement('span');
          span.textContent = history.title;
          li.dataset.title = history.title;
          li.appendChild(span);

          this.list.insertBefore(li, this.list.firstElementChild);
        });

        if (adding && lastAction) {
          lastAction.classList.add('new');
        }

        this.updateIndices();
      });
    },

    updateIndices: function() {
      var items = this.list.querySelectorAll('li');
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
    }
  };

  exports.Launcher = Launcher;
})(window);

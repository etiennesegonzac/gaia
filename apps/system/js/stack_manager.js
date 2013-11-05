'use strict';

var StackManager = {
  init: function sm_init() {
    window.addEventListener('launchapp', this);
    window.addEventListener('launchwrapper', this);
    window.addEventListener('appterminated', this);
    window.addEventListener('launchedfromcardview', this);
    window.addEventListener('home', this);
  },

  getAllOrigins: function sm_getAll() {
    return this._stack.map(function(sheet) {
      return sheet.origin;
    });
  },

  getCurrent: function sm_getCurrent() {
    return this._stack[this._current];
  },
  getPrev: function sm_getPrev() {
    return this._stack[this._current - 1];
  },
  getNext: function sm_getNext() {
    return this._stack[this._current + 1];
  },

  goPrev: function sm_goPrev() {
    var newApp = this.getPrev();
    if (!newApp) {
      return;
    }

    WindowManager.setActiveApp(newApp);
    this._current--;
  },

  goNext: function sm_goNext() {
    var newApp = this.getNext();
    if (!newApp) {
      return;
    }

    WindowManager.setActiveApp(newApp);
    this._current++;
  },

  goTo: function sm_goTo(origin) {
    this._stack.some(function(sConfig, idx) {
      if (sConfig.origin == origin) {
        this._current = idx;
        return true;
      }
      return false;
    }, this);
  },

  get length() {
    return this._stack.length;
  },

  /* Internal */
  _stack: [],
  _current: 0,

  handleEvent: function sm_handleEvent(e) {
    switch (e.type) {
      case 'launchapp':
      case 'launchwrapper':
        var config = e.detail;
        if (!config.stayBackground) {
          this._insertOrMoveToTop(config);
        }
        break;
      case 'launchedfromcardview':
        var origin = e.detail.origin;
        this.goTo(origin);
        break;
      case 'home':
        if (this._stack.length > 1) {
          this._moveToTop(this._current);
        }
        break;
      case 'appterminated':
        var manifestURL = e.detail.manifestURL;
        this._remove(manifestURL);
        break;
    }
  },

  _moveToTop: function sm_moveToTop(index) {
    var sheet = this._stack.splice(index, 1)[0];
    this._current = this._stack.push(sheet) - 1;
  },

  _insertOrMoveToTop: function sm_iorMtt(config) {
    var found = this._stack.some(function(sConfig, idx) {
      if (sConfig.url == config.url) {
        this._moveToTop(idx);
        return true;
      }
      return false;
    }, this);

    if (!found) {
      this._current = this._stack.push(config) - 1;
    }
  },

  _remove: function sm_remove(manifestURL) {
    for (var i = (this._stack.length - 1); i >= 0; i--) {
      var sConfig = this._stack[i];

      if (sConfig.manifestURL == manifestURL) {
        this._stack.splice(i, 1);
        if (i <= this._current) {
          this._current--;
        }
        return;
      }
    }
  },

  /* Debug */
  _dump: function sm_dump() {
    console.log('StackManager : dump');
    var prefix = 'StackManager';
    for (var i = 0; i < this._stack.length; i++) {
      var separator = (i == this._current) ? ' * ' : ' - ';
      console.log(prefix + separator + i + ' -> ' + this._stack[i].name);
    }
  },
  __clearAll: function sm_clearAll() {
    this._stack = [];
    this._current = 0;
  }
};

StackManager.init();

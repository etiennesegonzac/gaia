'use strict';

(function(exports) {
  var _id = 0;

  /**
   * The titlebar UI of the AppWindow.
   *
   * @class AppTitleBar
   * @param {AppWindow} app The app window instance this chrome belongs to.
   * @extends BaseUI
   */
  var AppTitleBar = function AppTitleBar(app) {
    this.app = app;
    this.instanceID = _id++;
    this.containerElement = app.element;
    this.render();
  };

  AppTitleBar.prototype = Object.create(window.BaseUI.prototype);

  AppTitleBar.prototype.CLASS_NAME = 'AppTitleBar';

  AppTitleBar.prototype.EVENT_PREFIX = 'titlebar';

  AppTitleBar.prototype._DEBUG = true;

  AppTitleBar.prototype.hidingNavigation = false;

  AppTitleBar.prototype.view = function at_view() {
    return '<div class="titlebar" id="' +
            this.CLASS_NAME + this.instanceID + '">' +
             '<div class="bubble"><span>&hellip;<span></div>' +
           '</div>';
  };

  AppTitleBar.prototype._fetchElements = function at__fetchElements() {
    this.element = this.containerElement.querySelector('.titlebar');
    this.bubble = this.element.querySelector('.bubble');
    this.title = this.bubble.querySelector('span');
  };

  AppTitleBar.prototype.expand = function at_expand(callback) {
    var element = this.element;
    element.classList.add('expand');

    if (!callback) {
      return;
    }

    var safetyTimeout = null;
    var finish = function(evt) {
      if (evt && evt.target !== element) {
        return;
      }
      element.removeEventListener('transitionend', finish);
      clearTimeout(safetyTimeout);
      callback();
    };
    element.addEventListener('transitionend', finish);
    safetyTimeout = setTimeout(finish, 250);
  };

  AppTitleBar.prototype.collapse = function at_collapse() {
    this.element.classList.remove('expand');
  };

  AppTitleBar.prototype.handleEvent = function at_handleEvent(evt) {
    if (evt.type.startsWith('mozbrowser')) {
      if (this['_handle_' + evt.type]) {
        this['_handle_' + evt.type](evt);
      }
      return;
    }

    switch (evt.type) {
      case 'rocketbar-overlayopened':
        this.collapse();
        break;
    }
  };

  AppTitleBar.prototype._registerEvents = function at__registerEvents() {
    window.addEventListener('rocketbar-overlayopened', this);
    this.app.element.addEventListener('mozbrowsermetachange', this);
    this.app.element.addEventListener('mozbrowsertitlechange', this);
  };

  AppTitleBar.prototype._unregisterEvents = function at__unregisterEvents() {
    window.removeEventListener('rocketbar-overlayopened', this);

    if (!this.app) {
      return;
    }

    this.app.element.removeEventListener('mozbrowsermetachange', this);
    this.app.element.removeEventListener('mozbrowsertitlechange', this);
    this.app = null;
  };

  AppTitleBar.prototype._handle_mozbrowsermetachange =
    function at__handle_mozbrowsermetachange(evt) {
      var detail = evt.detail;
      if (detail.name !== 'theme-color' || !detail.type) {
        return;
      }

      // If the theme-color meta is removed, let's reset the color.
      var color = '';

      // Otherwise, set it to the color that has been asked.
      if (detail.type !== 'removed') {
        color = detail.content;
      }
      this.element.style.backgroundColor = color;
    };

  AppTitleBar.prototype._handle_mozbrowsertitlechange =
    function at__handle_mozbrowsertitlechange(evt) {
      this.title.textContent = evt.detail;
    };

  exports.AppTitleBar = AppTitleBar;
}(window));

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
             '<div class="title">&hellip;</div>' +
           '</div>';
  };

  AppTitleBar.prototype._fetchElements = function at__fetchElements() {
    this.element = this.containerElement.querySelector('.titlebar');
    this.title = this.element.querySelector('.title');
  };

  AppTitleBar.prototype.handleEvent = function at_handleEvent(evt) {
    if (evt.type.startsWith('mozbrowser')) {
      if (this['_handle_' + evt.type]) {
        this['_handle_' + evt.type](evt);
      }
    }
  };

  AppTitleBar.prototype._registerEvents = function at__registerEvents() {
    this.app.element.addEventListener('mozbrowsermetachange', this);
    this.app.element.addEventListener('mozbrowsertitlechange', this);
  };

  AppTitleBar.prototype._unregisterEvents = function at__unregisterEvents() {
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

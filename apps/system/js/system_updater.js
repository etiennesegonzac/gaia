/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
'use strict';

var SystemUpdater = {
  get updateStatus() {
    delete this.updateStatus;
    return this.updateStatus = document.getElementById('system-update-status');
  },

  init: function su_init() {
    window.addEventListener('mozChromeEvent', this);
  },

  showDownloadPrompt: function su_showDownloadPrompt() {
    var _ = navigator.mozL10n.get;

    var cancel = {
      title: _('later'),
      callback: this.declineDownload.bind(this)
    };

    var confirm = {
      title: _('download'),
      callback: this.acceptDownload.bind(this)
    };

    CustomDialog.show(_('updateAvailable'), _('wantToDownload'),
                      cancel, confirm);
  },

  declineDownload: function su_declineDownload() {
    CustomDialog.hide();
    this._dispatchEvent('update-available-result', 'wait');
  },

  acceptDownload: function su_acceptDownload() {
    CustomDialog.hide();
    this._dispatchEvent('update-available-result', 'download');

    this.showStatus();
    UtilityTray.show();
  },

  showStatus: function su_showStatus() {
    this.updateStatus.classList.add('displayed');
  },

  updateProgress: function su_updateProgress(value) {
    var progressEl = this.updateStatus.querySelector('progress');
    progressEl.value = value;

    if (value === 1) {
      var imgEl = this.updateStatus.querySelector('img');
      imgEl.src = 'style/system_updater/images/spinner.png';
      imgEl.classList.add('spin');
    }
  },

  hideStatus: function su_hideStatus() {
    this.updateStatus.classList.remove('displayed');

    var progressEl = this.updateStatus.querySelector('progress');
    progressEl.value = 0;

    var imgEl = this.updateStatus.querySelector('img');
    imgEl.src = 'style/system_updater/images/download.png';
    imgEl.classList.remove('spin');
  },

  declineInstall: function su_declineInstall() {
    CustomDialog.hide();
    this._dispatchEvent('update-ready-result', 'wait');
  },

  acceptInstall: function su_acceptInstall() {
    CustomDialog.hide();
    this._dispatchEvent('update-ready-result', 'restart');
  },

  handleEvent: function su_handleEvent(evt) {
    if (evt.type !== 'mozChromeEvent')
      return;

    var _ = navigator.mozL10n.get;

    var detail = evt.detail;
    if (!detail.type)
      return;

    switch (detail.type) {
      case 'update-available':
        NotificationHelper.send(_('updateAvailable'), _('getIt'), 'style/system_updater/images/download.png',
                                this.showDownloadPrompt.bind(this),
                                this.declineDownload.bind(this));
        break;
      case 'update-downloaded':
        var cancel = {
          title: _('no'),
          callback: this.declineInstall.bind(this)
        };

        var confirm = {
          title: _('yes'),
          callback: this.acceptInstall.bind(this)
        };

        UtilityTray.hide();
        this.hideStatus();
        CustomDialog.show(_('updateReady'), _('wantToInstall'),
                          cancel, confirm);
        break;
      case 'update-progress':
        var progress = detail.progress / detail.total;
        this.updateProgress(progress);
        break;
    }
  },

  _dispatchEvent: function su_dispatchEvent(type, value) {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true, {
      type: type,
      result: value
    });
    window.dispatchEvent(event);
  }
};

SystemUpdater.init();

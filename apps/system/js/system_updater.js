/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
'use strict';

var SystemUpdater = {
  init: function su_init() {
    window.addEventListener('mozChromeEvent', this);
  },

  declineDownload: function su_declineDownload() {
    CustomDialog.hide();
    this._dispatchEvent('update-available-result', 'wait');
  },

  showDownloadPrompt: function su_showDownloadPrompt() {
    var _ = navigator.mozL10n.get;

    var cancel = {
      title: _('no'),
      callback: this.declineDownload
    };

    var confirm = {
      title: _('yes'),
      callback: this.acceptDownload
    };

    CustomDialog.show(_('updateAvailable'), _('wantToDownload'),
                      cancel, confirm);
  },

  acceptDownload: function su_acceptDownload() {
    CustomDialog.hide();
    this._dispatchEvent('update-available-result', 'download');
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
    switch (detail) {
      case 'update-available':
        NotificationHelper.send(_('updateAvailable'), _('getIt'), null,
                                this.showDownloadPrompt.bind(this),
                                this.declineDownload.bind(this));
        break;
      case 'update-ready':
        var cancel = {
          title: _('no'),
          callback: this.declineInstall
        };

        var confirm = {
          title: _('yes'),
          callback: this.acceptDownload
        };

        CustomDialog.show(_('updateReady'), _('wantToInstall'),
                          cancel, confirm);
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

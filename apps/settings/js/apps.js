/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var ApplicationsList = {
  _apps: [],

  _permissions: ['power', 'sms', 'contacts', 'telephony',
                      'mozBluetooth', 'browser', 'mozApps',
                      'mobileconnection', 'mozFM', 'systemXHR',
                      'background', 'backgroundservice', 'settings',
                      'alarm', 'camera',
                      'fmradio', 'voicemail',
                      'wifi-manage', 'wifi', 'geolocation',
                      'webapps-manage', 'desktop-notification',
                      'device-storage:pictures', 'device-storage:music',
                      'device-storage:videos', 'device-storage:apps',
                      'alarms', 'alarm', 'attention',
                      'content-camera', 'camera', 'tcp-socket', 'bluetooth',
                      'storage'],

  container: document.querySelector('#appPermissions > ul'),
  detailTitle: document.querySelector('#appPermissionsDetails > header > h1'),
  developerName: document.querySelector('#developer-infos > h3'),
  developerLink: document.querySelector('#developer-infos > a'),
  detailPermissionsList: document.querySelector('#appPermissionsDetails > ul'),

  init: function al_init() {
    this.loadApps();

    var appsMgmt = navigator.mozApps.mgmt;
    appsMgmt.oninstall = this.oninstall.bind(this);
    appsMgmt.onuninstall = this.onuninstall.bind(this);
  },

  loadApps: function al_loadApps() {
    var self = this;

    navigator.mozApps.mgmt.getAll().onsuccess = function mozAppGotAll(evt) {
      var apps = evt.target.result;
      apps.forEach(function(app) {
        if (!self._isManageable(app))
          return;

        self._apps.push(app);
      });

      self.render();
    }
  },

  render: function al_render() {
    this.container.innerHTML = '';

    this._apps.forEach(function appIterator(app) {
      var icon = '';
      if (app.manifest.icons &&
          Object.keys(app.manifest.icons).length) {

        var key = Object.keys(app.manifest.icons)[0];
        var iconURL = app.manifest.icons[key];

        // Adding origin if it's not a data URL
        if (!(iconURL.slice(0, 4) === 'data')) {
          iconURL = app.origin + '/' + iconURL;
        }

        icon = '<img src="' + iconURL + '" />';
      }

      var item = document.createElement('li');
      item.innerHTML = '<a href="#appPermissionsDetails">' +
                       icon + app.manifest.name + '</a>';
      item.onclick = this.showAppDetails.bind(this, app);
      this.container.appendChild(item);
    }, this);

  },

  oninstall: function al_oninstall(evt) {
    var app = evt.application;
    if (!this._isManageable(app))
      return;

    this._apps.push(app);
    this.render();
  },

  onuninstall: function al_onuninstall(evt) {
    var app = evt.application;
    if (!this._isManageable(app))
      return;

    this._apps.splice(this._apps.indexOf(app), 1);
    this.render();
  },

  showAppDetails: function al_showAppDetail(app) {
    var manifest = app.manifest;
    this.detailTitle.textContent = manifest.name;
    this.developerName.textContent = manifest.developer.name;
    this.developerLink.href = manifest.developer.url;
    this.developerLink.textContent = manifest.developer.url;


    this.detailPermissionsList.innerHTML = '';

    var _ = navigator.mozL10n.get;

    var mozPerms = navigator.mozPermissionSettings;
    if (!mozPerms)
      return;

    this._permissions.forEach(function appIterator(perm) {
      var value = mozPerms.get(perm, app.manifestURL, app.origin, false);
      if (value === 'allow') {
        var item = document.createElement('li');
        item.textContent = perm;

        var revokeButton = document.createElement('button');
        revokeButton.textContent = _('revoke');

        revokeButton.onclick = this._removePermission.bind(this, app, perm);
        item.appendChild(revokeButton);

        this.detailPermissionsList.appendChild(item);
      }
    }, this);
  },

  _isManageable: function al_isManageable(app) {
    return (app.removable && app.manifest.launch_path !== undefined);
  },

  _removePermission: function al_removePermission(app, perm) {
    var mozPerms = navigator.mozPermissionSettings;
    if (!mozPerms)
      return;

    mozPerms.set(perm, 'deny', app.manifestURL, app.origin, false);

    var self = this;
    setTimeout(function nextTick() {
      self.showAppDetails(app);
    });
  }
};

window.addEventListener('localized', function init(evt) {
  window.removeEventListener('localized', init);

  ApplicationsList.init();
});

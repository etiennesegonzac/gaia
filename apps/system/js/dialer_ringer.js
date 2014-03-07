'use strict';

/* global SettingsListener, SettingsURL */

(function(exports) {
  /**
   *
   * The delay between an incoming phone call and the firt ring or vibration
   *  needs to be as short as possible.
   *
   * On very low-end devices, waiting for the system app to start, to load an
   * attention screen and then to load the ringtone from the settings database
   * makes the delay unacceptable.
   *
   * This simple module keeps the ringtone (blob) around and starts alerting the
   * user as soon as a new incoming call is detected via the mozTelephony API.
   *
   * We also listen for the sleep and volumedown hardware buttons to provide
   * the user with an easy way to stop the ringing.
   *
   * @example
   * var dialerRinger = new DialerRinger();
   * dialerRinger.start(); // Attach the event listeners.
   * dialerRinger.stop();  // Deattach the event listeners.
   *
   * @class    DialerRinger
   * @requires SettingsListener
   * @requires SettingsURL
   *
   **/
  var DialerRinger = function DialerRinger() {
    this._started = false;

    this._shouldRing = null;
    this._shouldVibrate = true;
    this._alerting = false;
    this._vibrateInterval = null;

    this._player = new Audio();
    this._player.mozAudioChannelType = 'ringer';
    this._player.preload = 'metadata';
    this._player.loop = true;

    return this;
  };

  DialerRinger.prototype.start = function dr_start() {
    if (this._started) {
      throw 'Instance should not be start()\'ed twice.';
    }
    this._started = true;

    SettingsListener.observe('audio.volume.notification', 7, function(value) {
      this._shouldRing = !!value;
      if (this._shouldRing && this._alerting) {
        this._player.play();
      }
    }.bind(this));

    var phoneSoundURL = new SettingsURL();
    SettingsListener.observe('dialer.ringtone', '', function(value) {
      this._player.pause();
      this._player.src = phoneSoundURL.set(value);

      if (this._shouldRing && this._alerting) {
        this._player.play();
      }
    }.bind(this));

    SettingsListener.observe('vibration.enabled', true, function(value) {
      this._shouldVibrate = !!value;
    }.bind(this));

    var telephony = window.navigator.mozTelephony;
    telephony.addEventListener('callschanged', this);

    window.addEventListener('sleep', this);
    window.addEventListener('volumedown', this);
  };

  DialerRinger.prototype.stop = function dr_stop() {
    this._started = false;

    var telephony = window.navigator.mozTelephony;
    telephony.removeEventListener('callschanged', this);

    window.removeEventListener('sleep', this);
    window.removeEventListener('volumedown', this);

    // TODO: should remove the settings listener once the helper
    // allows it.
  };

  DialerRinger.prototype.handleEvent = function dr_handleEvent(evt) {
    if (evt.type === 'sleep' || evt.type === 'volumedown') {
      this._stopAlerting();
      return;
    }

    if (this._alerting || evt.type !== 'callschanged') {
      return;
    }

    var telephony = window.navigator.mozTelephony;
    var calls = telephony.calls;
    if (calls.length !== 1 || calls[0].state !== 'incoming') {
      return;
    }

    var incomingCall = calls[0];
    var self = this;

    self._startAlerting();
    incomingCall.addEventListener('statechange', function callStateChange() {
      incomingCall.removeEventListener('statechange', callStateChange);

      self._stopAlerting();
    });
  };

  DialerRinger.prototype._startAlerting = function dr_startAlerting() {
    this._alerting = true;

    if ('vibrate' in navigator && this._shouldVibrate) {
      this._vibrateInterval = window.setInterval(function vibrate() {
        navigator.vibrate([200]);
      }, 600);
      navigator.vibrate([200]);
    }

    this._player.play();
  };

  DialerRinger.prototype._stopAlerting = function dr_stopAlerting() {
    this._alerting = false;
    this._player.pause();
    this._player.currentTime = 0;
    window.clearInterval(this._vibrateInterval);
  };

  exports.DialerRinger = DialerRinger;
}(window));

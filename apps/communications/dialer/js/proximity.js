'use strict';

var ProximityHandler = {
  _cpuLock: null,

  get screenOff() {
    delete this.screenOff;
    return this.screenOff = document.getElementById('screen-off');
  },

  enable: function ph_enable() {
    console.log("+++ enabling");
    this._cpuLock = navigator.requestWakeLock('cpu');

    window.addEventListener('userproximity', this);
  },

  disable: function ph_disable() {
    console.log("+++ disabling");
    window.removeEventListener('userproximity', this);

    navigator.mozPower.screenEnabled = true;

    if (this._cpuLock) {
      this._cpuLock.unlock();
      this._cpuLock = null;
    }
  },

  handleEvent: function ph_handleEvent(evt) {
    if (evt.type != 'userproximity')
      return;

    console.log("+++ updating screen sate near -> " + evt.near);
    navigator.mozPower.screenEnabled = !evt.near;
  }
};

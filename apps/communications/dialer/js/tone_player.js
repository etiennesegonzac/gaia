'use strict';

var TonePlayer = {
  _shortPress: false,

  init: function tp_init(channel) {
    //this.setChannel(channel);
  },

  ensureAudio: function tp_ensureAudio() {
    if (this._audio) {
      return;
    }

    this._audio = new AudioContext();
  },

  trashAudio: function tp_trashAudio() {
    this.stop();
    delete this._audio;
  },

  start: function tp_start(frequencies, shortPress) {
    this._shortPress = shortPress;
    this.ensureAudio();

    var cur = this._audio.currentTime;

    var gainNode = this._audio.createGain();
    gainNode.connect(this._audio.destination);
    gainNode.gain.setValueAtTime(0.5, cur);
    gainNode.gain.setTargetAtTime(0.0, cur + 0.3, 0.05);

    for (var i = 0; i < frequencies.length; i++) {
      var freq = frequencies[i];
      var osc = this._audio.createOscillator();
      osc.connect(gainNode);
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.start(cur);
      osc.stop(cur + 0.3);
    }
  },

  stop: function tp_stop() {
    if (this._shortPress) {
      return;
    }
  },

  // Takes an array of steps, a step being:
  // - frequence for canal 1
  // - frequence for canal 2
  // - duration
  playSequence: function tp_playSequence(sequence, index) {
    if (typeof index === 'undefined') {
      index = 0;
    }

    if (index >= sequence.length) {
      return;
    }

    this.ensureAudio();

    var step = sequence[index];
    var frequencies = step.slice(0, 2);
    var duration = step[2];
    this.start(frequencies, false);

    setTimeout(function nextStep(self) {
      self.stop();
      self.playSequence(sequence, (index + 1));
    }, duration, this);
  }
};

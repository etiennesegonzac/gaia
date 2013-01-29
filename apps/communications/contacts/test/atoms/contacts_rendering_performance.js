'use strict';

(function(window) {
  window.ContactsRenderingPerformance = {
    register: function() {
      window.cStart = window.performance.now();

      window.addEventListener('contacts-first-chunk', this.firstChunkHandler.bind(this));
      window.addEventListener('contacts-last-chunk', this.lastChunkHandler.bind(this));

      marionetteScriptFinished(true);
    },

    firstChunkHandler: function(evt) {
      window.cFirst = window.performance.now();
    },

    lastChunkHandler: function(evt) {
      window.cLast = window.performance.now();
    },

    waitForResults: function() {
      if (window.cLast) {
        this.finish();
        return;
      }

      var self = this;
      window.addEventListener('contacts-last-chunk', function finished(evt) {
        window.removeEventListener('contacts-last-chunk', finished);
        self.finish();
      });
    },

    finish: function() {
      marionetteScriptFinished({
        start: window.cStart,
        first: window.cFirst,
        last: window.cLast
      });
    }
  };
})(window.wrappedJSObject);

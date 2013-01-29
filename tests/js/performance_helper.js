require('/tests/js/integration_helper.js');

var PerformanceHelper = (function() {

  var PerformanceHelper = {
    kSpawnInterval: 6000, // Time before gecko spawns a new template process
    kRuns: 3,

    registerLoadTimeListener: function(device) {
      var registerListener =
        'var w = window.wrappedJSObject;' +
        'w.loadTimes = [];' +
        'w.onapplicationloaded = function(e) {' +
        '  w.loadTimes.push(e.detail.time);' +
        '};' +
        'w.addEventListener("apploadtime", w.onapplicationloaded);';

      device.executeScript(registerListener);
    },

    unregisterLoadTimeListener: function(device) {
      var removeListener =
        'var w = window.wrappedJSObject;' +
        'w.removeEventListener("apploadtime", w.onapplicationloaded);';

      device.executeScript(removeListener);
    },

    getLoadTimes: function(device) {
      var getResults = 'return window.wrappedJSObject.loadTimes;';
      return device.executeScript(getResults);
    },

    average: function(arr) {
      var sum = arr.reduce(function(i, j) {
        return i + j;
      });

      return sum / arr.length;
    }
  };

  return PerformanceHelper;
}(this));

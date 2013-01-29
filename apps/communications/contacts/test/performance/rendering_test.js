require('apps/communications/contacts/test/integration/app.js');
require('/tests/js/performance_helper.js');

suite('Contacts', function() {
  var device;
  var app;

  MarionetteHelper.start(function(client) {
    app = new ContactsIntegration(client);
    device = app.device;
  });

  setup(function() {
    yield IntegrationHelper.unlock(device); // it affects the first run otherwise
  });

  test('average rendering time', function() {
    this.timeout(100000);
    yield app.device.setScriptTimeout(50000);

    var firstPaints = [];
    var lastPaints = [];

    for (var i = 0; i < PerformanceHelper.kRuns; i++) {
      yield IntegrationHelper.delay(device, PerformanceHelper.kSpawnInterval);
      yield app.launch();
      var results = yield app.observeRendering();
      firstPaints.push((results.first - results.start));
      lastPaints.push((results.last - results.start));
      yield app.close();
    }

    console.log("\n=== Contacts average first chunk rendering: " + PerformanceHelper.average(firstPaints) + "ms");
    console.log("=== Contacts average total rendering: " + PerformanceHelper.average(lastPaints) + "ms");
  });
});

require('/tests/js/app_integration.js');
require('/tests/js/integration_helper.js');

function DialerIntegration(device) {
  AppIntegration.apply(this, arguments);
}

DialerIntegration.prototype = {
  __proto__: AppIntegration.prototype,
  appName: 'Phone'
};

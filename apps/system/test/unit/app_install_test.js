requireApp('system/js/app_install.js');

requireApp('system/test/unit/mock_app.js');
requireApp('system/test/unit/mock_chrome_event.js');

suite('system/AppInstallManager', function() {
  var realL10n;
  var realDispatchResponse;

  var fakeDialog;

  var lastDispatchedResponse = null;

  suiteSetup(function() {
    realL10n = navigator.mozL10n;
    navigator.mozL10n = {
      get: function get(key, params) {
        return key;
      }
    };

    realDispatchResponse = AppInstallManager.dispatchResponse;
    AppInstallManager.dispatchResponse = function fakeDispatch(id, type) {
      lastDispatchedResponse = {
        id: id,
        type: type
      };
    };
  });

  suiteTeardown(function() {
    navigator.mozL10n = realL10n;
    AppInstallManager.dispatchResponse = realDispatchResponse;
  });

  setup(function() {
    fakeDialog = document.createElement('form');
    fakeDialog.id = 'app-install-dialog';
    fakeDialog.innerHTML = [
      '<section>',
        '<h1 id="app-install-message"></h1>',
        '<table>',
          '<tr>',
            '<th data-l10n-id="size">Size</th>',
            '<td id="app-install-size"></td>',
          '</tr>',
          '<tr>',
            '<th data-l10n-id="author">Author</th>',
            '<td>',
              '<span id="app-install-author-name"></span>',
              '<br /><span id="app-install-author-url"></span>',
            '</td>',
          '</tr>',
        '</table>',
        '<menu>',
          '<button id="app-install-cancel-button" type="reset" data-l10n-id="cancel">Cancel</button>',
          '<button id="app-install-install-button" type="submit" data-l10n-id="install">Install</button>',
        '</menu>',
      '</section>'
    ].join('');

    document.body.appendChild(fakeDialog);
    AppInstallManager.init();
  });

  teardown(function() {
    fakeDialog.parentNode.removeChild(fakeDialog);
    lastDispatchedResponse = null;
  });

  suite('init', function() {
    test('should bind dom elements', function() {
      AppInstallManager.init();
      assert.equal('app-install-dialog', AppInstallManager.dialog.id);
      assert.equal('app-install-message', AppInstallManager.msg.id);
      assert.equal('app-install-size', AppInstallManager.size.id);
      assert.equal('app-install-author-name', AppInstallManager.authorName.id);
      assert.equal('app-install-author-url', AppInstallManager.authorUrl.id);
      assert.equal('app-install-install-button', AppInstallManager.installButton.id);
      assert.equal('app-install-cancel-button', AppInstallManager.cancelButton.id);
    });

    test('should bind to the click event', function() {
      AppInstallManager.init();
      assert.equal(AppInstallManager.handleInstall.name,
                   AppInstallManager.installButton.onclick.name);
      assert.equal(AppInstallManager.handleCancel.name,
                   AppInstallManager.cancelButton.onclick.name);
    });
  });

  suite('events', function() {
    setup(function() {
      AppInstallManager.init();
    });

    suite('webapps-ask-install', function() {
    });
  });

  suite('actions', function() {
    setup(function() {
      AppInstallManager.init();
    });

    suite('install', function() {
    });

    suite('cancel', function() {
    });
  });
});

requireApp('system/js/system_updater.js');
requireApp('system/test/unit/mock_chrome_event.js');
requireApp('system/test/unit/mock_custom_dialog.js');

// We're going to swap those with mock objects
// so we need to make sure they are defined.
if (!this.CustomDialog) {
  this.CustomDialog = null;
}

suite('system/system_updater', function() {
  var subject;
  var realCustomDialog;
  var realL10n;
  var realDispatchEvent;

  var lastDispatchedEvent = null;

  suiteSetup(function() {
    subject = SystemUpdater;

    realCustomDialog = window.CustomDialog;
    window.CustomDialog = MockCustomDialog;

    realL10n = navigator.mozL10n;
    navigator.mozL10n = {
      get: function get(key) {
        return key;
      }
    };

    realDispatchEvent = subject._dispatchEvent;
    subject._dispatchEvent = function fakeDispatch(type, value) {
      lastDispatchedEvent = {
        type: type,
        value: value
      };
    };
  });

  suiteTeardown(function() {
    window.CustomDialog = realCustomDialog;
    navigator.mozL10n = realL10n;
    subject._dispatchEvent = realDispatchEvent;
  });

  teardown(function() {
    MockCustomDialog.mTearDown();
  });

  suite('download prompt', function() {
    setup(function() {
      var event = new MockChromeEvent('download-prompt');
      subject.handleEvent(event);
    });

    test('dialog shown', function() {
      assert.isTrue(MockCustomDialog.mShown);
      assert.equal('updateAvailable', MockCustomDialog.mShowedTitle);
      assert.equal('wantToDownload', MockCustomDialog.mShowedMsg);

      assert.equal('no', MockCustomDialog.mShowedCancel.title);
      assert.equal('yes', MockCustomDialog.mShowedConfirm.title);
    });

    test('cancel callback', function() {
      assert.equal(subject.declineDownload, MockCustomDialog.mShowedCancel.callback);

      subject.declineDownload();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('download-prompt-result', lastDispatchedEvent.type);
      assert.equal('wait', lastDispatchedEvent.value);
    });

    test('confirm callback', function() {
      assert.equal(subject.acceptDownload, MockCustomDialog.mShowedConfirm.callback);

      subject.acceptDownload();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('download-prompt-result', lastDispatchedEvent.type);
      assert.equal('download', lastDispatchedEvent.value);
    });
  });

  suite('update prompt', function() {
    setup(function() {
      var event = new MockChromeEvent('update-prompt');
      subject.handleEvent(event);
    });

    test('dialog shown', function() {
      assert.isTrue(MockCustomDialog.mShown);
      assert.equal('updateReady', MockCustomDialog.mShowedTitle);
      assert.equal('wantToInstall', MockCustomDialog.mShowedMsg);

      assert.equal('no', MockCustomDialog.mShowedCancel.title);
      assert.equal('yes', MockCustomDialog.mShowedConfirm.title);
    });

    test('cancel callback', function() {
      assert.equal(subject.declineInstall, MockCustomDialog.mShowedCancel.callback);

      subject.declineInstall();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('update-prompt-result', lastDispatchedEvent.type);
      assert.equal('wait', lastDispatchedEvent.value);
    });

    test('confirm callback', function() {
      assert.equal(subject.acceptDownload, MockCustomDialog.mShowedConfirm.callback);

      subject.acceptInstall();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('update-prompt-result', lastDispatchedEvent.type);
      assert.equal('restart', lastDispatchedEvent.value);
    });
  });
});

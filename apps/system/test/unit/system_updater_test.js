requireApp('system/js/system_updater.js');
requireApp('system/test/unit/mock_chrome_event.js');
requireApp('system/test/unit/mock_custom_dialog.js');
requireApp('system/test/unit/mock_notification_helper.js');

// We're going to swap those with mock objects
// so we need to make sure they are defined.
if (!this.CustomDialog) {
  this.CustomDialog = null;
}
if (!this.NotificationHelper) {
  this.NotificationHelper = null;
}

suite('system/system_updater', function() {
  var subject;
  var realCustomDialog;
  var realNotificationHelper;
  var realL10n;
  var realDispatchEvent;

  var lastDispatchedEvent = null;

  suiteSetup(function() {
    subject = SystemUpdater;

    realCustomDialog = window.CustomDialog;
    window.CustomDialog = MockCustomDialog;

    realNotificationHelper = window.NotificationHelper;
    window.NotificationHelper = MockNotificationHelper;

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
    window.NotificationHelper = realNotificationHelper;
    navigator.mozL10n = realL10n;
    subject._dispatchEvent = realDispatchEvent;
  });

  teardown(function() {
    MockCustomDialog.mTearDown();
    MockNotificationHelper.mTearDown();
  });

  suite('update available event', function() {
    setup(function() {
      var event = new MockChromeEvent('update-available');
      subject.handleEvent(event);
    });

    test('notification sent', function() {
      assert.equal('updateAvailable', MockNotificationHelper.mTitle);
      assert.equal('getIt', MockNotificationHelper.mBody);
    });

    test('notification close callback', function() {
      assert.equal(subject.declineDownload.name, MockNotificationHelper.mCloseCB.name);

      subject.declineDownload();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('update-available-result', lastDispatchedEvent.type);
      assert.equal('wait', lastDispatchedEvent.value);
    });

    test('notification click callback', function() {
      assert.equal(subject.showDownloadPrompt.name, MockNotificationHelper.mClickCB.name);

      subject.showDownloadPrompt();
      assert.isTrue(MockCustomDialog.mShown);
      assert.equal('updateAvailable', MockCustomDialog.mShowedTitle);
      assert.equal('wantToDownload', MockCustomDialog.mShowedMsg);

      assert.equal('no', MockCustomDialog.mShowedCancel.title);
      assert.equal('yes', MockCustomDialog.mShowedConfirm.title);
    });

    suite('prompt handling', function() {
      setup(function() {
        subject.showDownloadPrompt();
      });

      test('cancel callback', function() {
        assert.equal(subject.declineDownload, MockCustomDialog.mShowedCancel.callback);

        subject.declineDownload();
        assert.isFalse(MockCustomDialog.mShown);

        assert.equal('update-available-result', lastDispatchedEvent.type);
        assert.equal('wait', lastDispatchedEvent.value);
      });

      test('confirm callback', function() {
        assert.equal(subject.acceptDownload, MockCustomDialog.mShowedConfirm.callback);

        subject.acceptDownload();
        assert.isFalse(MockCustomDialog.mShown);

        assert.equal('update-available-result', lastDispatchedEvent.type);
        assert.equal('download', lastDispatchedEvent.value);
      });
    });
  });

  suite('update ready event', function() {
    setup(function() {
      var event = new MockChromeEvent('update-ready');
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

      assert.equal('update-ready-result', lastDispatchedEvent.type);
      assert.equal('wait', lastDispatchedEvent.value);
    });

    test('confirm callback', function() {
      assert.equal(subject.acceptDownload, MockCustomDialog.mShowedConfirm.callback);

      subject.acceptInstall();
      assert.isFalse(MockCustomDialog.mShown);

      assert.equal('update-ready-result', lastDispatchedEvent.type);
      assert.equal('restart', lastDispatchedEvent.value);
    });
  });
});

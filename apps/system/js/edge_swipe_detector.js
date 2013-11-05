'use strict';

var EdgeSwipeDetector = {
  previous: document.getElementById('left-panel'),
  next: document.getElementById('right-panel'),

  init: function esd_init() {
    window.addEventListener('homescreen-displayed', this);
    window.addEventListener('appopen', this);
    window.addEventListener('launchapp', this);
    window.addEventListener('launchwrapper', this);
    window.addEventListener('launchedfromcardview', this);

    ['touchstart', 'touchmove', 'touchend'].forEach(function(e) {
      this.previous.addEventListener(e, this);
      this.next.addEventListener(e, this);
    }, this);
  },

  handleEvent: function esd_handleEvent(e) {
    switch (e.type) {
      case 'appopen':
        document.getElementById('screen').classList.add('edges');
        break;
      case 'homescreen-displayed':
        document.getElementById('screen').classList.remove('edges');
        this.previous.classList.add('disabled');
        this.next.classList.add('disabled');
        break;
      case 'launchedfromcardview':
        this.previous.classList.remove('disabled');
        this.next.classList.remove('disabled');
        break;
      case 'launchapp':
      case 'launchwrapper':
        if (!e.detail.stayBackground) {
          this.previous.classList.remove('disabled');
          this.next.classList.remove('disabled');
        }
        break;
      case 'touchstart':
        this._touchStart(e);
        break;
      case 'touchmove':
        this._touchMove(e);
        break;
      case 'touchend':
        this._touchEnd(e);
        break;
    }
  },

  _touchStartEvt: null,
  _startDate: null,
  _startX: null,
  _deltaX: null,
  _startY: null,
  _deltaY: null,
  _forwardTimeout: null,

  _progress: null,
  _winWidth: null,
  _direction: null,
  _notSwiping: null,

  _touchStart: function esd_touchStart(e) {
    this._winWidth = window.innerWidth;
    this._direction = (e.target == this.next) ? 'rtl' : 'ltr';
    this._touchStartEvt = e;
    this._startDate = Date.now();

    var currentSheet = StackManager.getCurrent();
    this._iframe = WindowManager.getAppFrame(
     currentSheet.origin).firstChild;

    var touch = e.changedTouches[0];
    this._startX = touch.screenX;
    this._startY = touch.screenY;
    this._deltaX = 0;
    this._deltaY = 0;
    this._notSwiping = false;

    this._clearForwardTimeout();
    this._forwardTimeout = setTimeout((function long() {
      // Didn't move for a while after the touchstart,
      // this isn't a swipe
      this._forwardTimeout = null;
      this._notSwiping = true;
      this._sendTouchEvent(this._touchStartEvt);
    }).bind(this), 300);

    SheetsTransition.begin(this._direction);
  },

  _touchMove: function esd_touchMove(e) {
    var touch = e.touches[0];
    this._deltaX = Math.abs(touch.screenX - this._startX);
    this._deltaY = Math.abs(touch.screenY - this._startY);
    this._progress = this._deltaX / this._winWidth;

    if (this._notSwiping) {
      this._sendTouchEvent(e);
      return;
    }

    this._checkIfSwiping(e);

    if (this._deltaX > 5) {
      this._clearForwardTimeout();
      SheetsTransition.moveInDirection(this._direction, this._progress);
    }
  },

  _touchEnd: function esd_touchEnd(e) {
    if ((this._deltaX < 5) && (this._deltaY < 5)) {
      this._sendTap(e);
      this._notSwiping = true;
    } else if (this._notSwiping) {
      this._sendTouchEvent(e);
    }

    this._clearForwardTimeout();

    var deltaT = Date.now() - this._startDate;
    var speed = this._progress / deltaT; // progress / ms
    var inertia = speed * 120; // 120 ms of intertia
    var adjustedProgress = (this._progress + inertia);

    if (adjustedProgress < 0.33 || this._notSwiping) {
      SheetsTransition.snapInPlace();
      SheetsTransition.end();
      return;
    }

    var direction = this._direction;
    if (direction == 'ltr') {
      SheetsTransition.snapBack(speed);
    } else {
      SheetsTransition.snapForward(speed);
    }

    SheetsTransition.end(function afterTransition() {
      if (direction == 'ltr') {
        StackManager.goPrev();
      } else {
        StackManager.goNext();
      }
    });
  },

  _clearForwardTimeout: function esd_clearForwardTimeout() {
    if (this._forwardTimeout) {
      clearTimeout(this._forwardTimeout);
      this._forwardTimeout = null;
    }
  },

  _checkIfSwiping: function esd_checkIfSwiping(e) {
    if ((this._deltaX * 2 < this._deltaY) &&
        (this._deltaY > 5)) {
      this._clearForwardTimeout();
      this._notSwiping = true;
      this._sendTouchEvent(this._touchStartEvt);
      this._sendTouchEvent(e);

      SheetsTransition.snapInPlace();
      SheetsTransition.end();
    }
  },

  _sendTouchEvent: function esd_sendTouchEvent(e) {
    this._iframe.sendTouchEvent.apply(null, this._unSynthetizeEvent(e));
  },

  _sendTap: function esd_sendTap(e) {
    var firstTouch = this._touchStartEvt.changedTouches[0];
    var lastTouch = e.changedTouches[0];

    // If the timeout ended the touchstart was already sent
    if (this._forwardTimeout) {
      this._sendTouchEvent(this._touchStartEvt);
    }
    this._iframe.sendMouseEvent('mousedown', firstTouch.pageX,
                                firstTouch.pageY, 0, 1, 0);

    setTimeout((function fakeTap() {
      this._sendTouchEvent(e);
      this._iframe.sendMouseEvent('mouseup', lastTouch.pageX,
                                  lastTouch.pageY, 0, 1, 0);
    }).bind(this), 50);
  },

  _unSynthetizeEvent: function esd_unSynthetizeEvent(e) {
    var type = e.type;
    var relevantTouches = (type == 'touchmove') ? e.touches : e.changedTouches;
    var identifiers = [];
    var xs = [];
    var ys = [];
    var rxs = [];
    var rys = [];
    var rs = [];
    var fs = [];

    for (var i = 0; i < relevantTouches.length; i++) {
      var t = relevantTouches[i];

      identifiers.push(t.identifier);
      xs.push(t.pageX);
      ys.push(t.pageY);
      rxs.push(t.radiusX);
      rys.push(t.radiusY);
      rs.push(t.rotationAngle);
      fs.push(t.force);
    }

    return [type, identifiers, xs, ys, rxs, rys, rs, fs, xs.length];
  }
};

EdgeSwipeDetector.init();

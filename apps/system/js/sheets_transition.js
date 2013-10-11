'use strict';

var SheetsTransition = {
  _current: null,
  _new: null,

  begin: function st_begin(direction) {
    var currentSheet = StackManager.getCurrent();
    var newSheet = (direction == 'ltr') ?
      StackManager.getPrev() : StackManager.getNext();

    this._current = currentSheet ?
      WindowManager.getAppFrame(currentSheet.origin) : null;
    this._new = newSheet ?
      WindowManager.getAppFrame(newSheet.origin) : null;

    if (this._current) {
      this._current.classList.add('inside-edges');
      this._current.style.transition = 'transform';
    }

    if (this._new) {
      this._new.classList.toggle('outside-edges-left', (direction == 'ltr'));
      this._new.classList.toggle('outside-edges-right', (direction == 'rtl'));
      this._new.style.transition = 'transform';
    }
  },

  _lastProgress: null,

  moveInDirection: function st_moveInDirection(direction, progress) {
    var overflowing = !this._new;
    if (overflowing && (progress > 0.20)) {
      progress = 0.20 + (progress - 0.20) / (2 + progress);
    }

    this._lastProgress = progress;

    var directionFactor = (direction == 'ltr') ? 1 : -1;
    this._setTranslate(this._current, progress * directionFactor * 100);
    this._setTranslate(this._new, (progress - 1) * directionFactor * 100);
  },

  end: function st_end(callback) {
    var callbackCalled = false;

    var sheets = [this._current, this._new];
    sheets.forEach(function(sheet) {
      if (!sheet) {
        return;
      }

      sheet.addEventListener('transitionend', function trWait() {
        sheet.removeEventListener('transitionend', trWait);

        sheet.classList.remove('inside-edges');
        sheet.classList.remove('outside-edges-left');
        sheet.classList.remove('outside-edges-right');
        sheet.style.transition = '';

        if (!callbackCalled) {
          callbackCalled = true;
          if (callback && (typeof(callback) == 'function')) {
            callback();
          }
        }
      });

      sheet.style.transform = '';
    });

    this._current = null;
    this._new = null;
  },

  snapInPlace: function st_snapInPlace() {
    var duration = 300 - (300 * (1 - this._lastProgress));

    this._setDuration(this._current, duration);
    this._setDuration(this._new, duration);
  },

  snapBack: function st_snapBack(speed) {
    this._snapAway(speed, 'outside-edges-right');
  },

  snapForward: function st_snapForward(speed) {
    this._snapAway(speed, 'outside-edges-left');
  },

  _snapAway: function st_snapAway(speed, outClass) {
    if (!this._new) {
      this.snapInPlace();
      return;
    }

    var durationLeft = (1 - this._lastProgress) / speed;
    durationLeft /= 1.2; // boost

    var duration = Math.min(durationLeft, ((1 - this._lastProgress) * 300));

    this._setDuration(this._current, duration);
    this._setDuration(this._new, duration);

    if (this._current) {
      this._current.classList.remove('inside-edges');
      this._current.classList.add(outClass);
    }

    if (this._new) {
      this._new.classList.remove('outside-edges-right');
      this._new.classList.remove('outside-edges-left');
      this._new.classList.add('inside-edges');
    }
  },

  _setTranslate: function st_setTranslate(sheet, percentage) {
    if (!sheet) {
      return;
    }

    sheet.style.transform = 'translateX(' + percentage + '%)';
  },

  _setDuration: function st_setDuration(sheet, ms) {
    if (!sheet) {
      return;
    }

    sheet.style.transition = 'transform ' + ms + 'ms linear';
  }
};

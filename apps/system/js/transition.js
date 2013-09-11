/*
 * There are 2 transition related definitions to keep in sync:
   * the transforms in system.css use to snap in place
   * the as-you-go transforms in the _generateMovingStyles method
 * */
var TransitionManager = (function() {
  'use strict';

  function debug(str) {
    console.log('TransitionManager: ' + str + '\n');
  }

  var current = null;
  window.addEventListener('historychange', function onHistoryChange(e) {
    //TODO: if detail.removing we should animate differently
    var previous = current;
    current = e.detail.current;
    var forward = e.detail.forward;

    var prevWrapper = previous ? previous.wrapper : null;
    var curWrapper = current.wrapper;

    document.body.classList.add('rocketbar-freeze');

    if (prevWrapper) {
      prevWrapper.dataset.previous = forward;
      prevWrapper.dataset.next = !forward;
      prevWrapper.classList.add('transitioning');
    }

    curWrapper.dataset.previous = !forward;
    curWrapper.dataset.next = forward;
    curWrapper.classList.add('transitioning');
    curWrapper.classList[forward ? 'add' : 'remove']('shadow');

    var partial = !!curWrapper.style.MozTransition;
    if (partial) {
      // Already in the middle of the transition
      if (prevWrapper) {
        delete prevWrapper.dataset.current;
      }
      curWrapper.dataset.current = true;
    } else {
      // Making sure we transition for the right position
      curWrapper.offsetLeft; // forcing reflow
      var nextTick = function() {
        if (prevWrapper) {
          prevWrapper.style.MozTransition = 'transform 0.2s linear 0.2s, opacity 0.2s linear 0.2s';
          delete prevWrapper.dataset.current;
        }

        curWrapper.style.MozTransition = 'transform 0.4s linear';
        curWrapper.dataset.current = true;
      }

      // Let's give a little time for the sheets to come up.
      if (current.painted) {
        nextTick();
      } else {
        current.onfirstpaint = nextTick;
        setTimeout(function() {
          current.onfirstpaint = null;
          nextTick();
        }, 600);
      }
    }

    curWrapper.addEventListener('transitionend', function animWait(e) {
      if (e.propertyName != 'transform') {
        return;
      }
      curWrapper.removeEventListener('transitionend', animWait);

      document.body.classList.remove('rocketbar-freeze');

      if (prevWrapper) {
        prevWrapper.classList.remove('transitioning');
        prevWrapper.style.MozTransition = '';
        prevWrapper.classList.remove('shadow');
        prevWrapper.style.zIndex = '';
      }

      curWrapper.style.MozTransition = '';
      curWrapper.classList.remove('shadow');
      curWrapper.classList.remove('transitioning');
      curWrapper.style.zIndex = '';

      var evt = new CustomEvent('sheetchanged', {
        bubbles: true,
        detail: {
          previous: previous,
          current: current
        }
      });
      window.dispatchEvent(evt);
    }, true);
  });
})();

var PanelSwitcher = {
  previous: document.getElementById('left-panel'),
  next: document.getElementById('right-panel'),

  init: function ps_init() {
    ['touchstart', 'touchmove', 'touchend'].forEach(function(e) {
      this.previous.addEventListener(e, this);
      this.next.addEventListener(e, this);
    }, this);
  },

  lastX: 0,
  lastDate: null,
  lastProgress: 0,
  out: null,
  in: null,
  overflowing: false,
  pageInfoVisible: false,
  handleEvent: function navigation_handleEvent(e) {
    var forward = (e.target == this.next);
    var diffX = this.lastX - this.startX;
    var progress = Math.abs(diffX / window.innerWidth);
    switch(e.type) {
      case 'touchstart':
        this.pageInfoVisible = PagesIntro.isVisible();
        if (this.pageInfoVisible) PagesIntro.hide();
        this.lastX = this.startX = e.touches[0].pageX;
        this.lastDate = Date.now();

        var history = (forward ? WindowManager.getNext() :
                                 WindowManager.getPrevious());

        this.overflowing = !history;

        this.in = history ? history.wrapper : null;
        this.out = WindowManager.getCurrent().wrapper;

        this.prepareForManipulation(this.in, forward, this.overflowing);
        this.prepareForManipulation(this.out, forward, this.overflowing);

        break;
      case 'touchmove':
        this.lastX = e.touches[0].pageX;
        this.lastProgress = progress;
        this.lastDate = Date.now();

        this.move(progress);
        break;
      case 'touchend':
        var deltaT = Date.now() - this.lastDate;
        var deltaP = Math.abs(progress - this.lastProgress);
        var inertia = (deltaP / deltaT) * 100;

        var snapBack = true;
        if (!this.overflowing && (progress + inertia) >= 0.32) {
          forward ? WindowManager.goNext() : WindowManager.goBack();
          snapBack = false;
        }

        if (snapBack && this.pageInfoVisible) {
          PagesIntro.show();
        }

        var progressToAnimate = snapBack ? progress : (1 - progress);
        var durationLeft = Math.min((progressToAnimate / deltaP) * deltaT, progressToAnimate * 500);

        // Snaping faster when overflowing
        if (this.overflowing) {
          durationLeft /= 2;
        }

        this.snapInPlace(this.in, durationLeft);
        this.snapInPlace(this.out, durationLeft);

        this.out = this.in = null;
        break;
    }
  },

  _movingStyles: [],
  prepareForManipulation: function t_prepareForTransition(wrapper, forward, overflowing) {
    if (!wrapper) {
      return;
    }

    wrapper.classList.add('transitioning');

    if (wrapper === this.out) {
      wrapper.style.zIndex = forward ? 500 : 1000;
      wrapper.classList[!forward ? 'add' : 'remove']('shadow');
    } else {
      wrapper.style.zIndex = forward ? 1000 : 500;
      wrapper.classList[forward ? 'add' : 'remove']('shadow');
    }

    wrapper.style.MozTransition = 'transform, opacity';

    this._movingStyles.push(this._generateMovingStyles(wrapper, forward, overflowing));
  },

  move: function t_move(progress) {
    for (var i = 0; i < this._movingStyles.length; i++) {
      this._setStyles.apply(null, this._movingStyles[i](progress));
    }
  },

  snapInPlace: function t_snapInPlace(wrapper, durationLeft) {
    if (!wrapper) {
      return;
    }

    wrapper.style.MozTransition =
      'transform ' + durationLeft + 'ms linear, opacity ' + durationLeft + 'ms linear';

    this._clearStyles(wrapper);
    this._movingStyles = [];
  },

  _generateMovingStyles: function t_movingStyles(wrapper, forward, overflowing) {
    if (!wrapper) {
      return function noSheet(progress) {
        return [null];
      };
    }

    var leftToRight = ((wrapper == this.out && !forward) ||
                       (wrapper !== this.out && forward));
    var backToFront = !leftToRight && !overflowing;

    return function(progress) {
      var translate = 0, scale = 1, opacity = 1;
      var remainingFactor = forward ? ((progress - 0.5) / 0.5) :
                                      ((0.5 - progress) / 0.5);
      var progressFactor = forward ? (100 - progress * 100) :
                                     (progress * 100);

      if (backToFront && (forward && progress >= 0.5 ||
                          !forward && progress <= 0.5)) {
        translate = (-20 * remainingFactor) + '%';
        opacity = 1 - 0.7 * remainingFactor;
        scale = 1 - 0.1 * remainingFactor;
      }

      if (leftToRight) {
        translate = 'calc(' + progressFactor + '% - 8px)';
      }

      if (overflowing) {
        var overflowFactor = (progress * 100) * (1 - (progress * 0.7));

        if (forward) {
          overflowFactor *= -1;
        }

        translate = 'calc(' + overflowFactor + '% - 8px)';
      }

      return [wrapper, translate, scale, opacity];
    }
  },

  _setStyles: function t_setStyles(wrapper, translate, scale, opacity) {
    if (!wrapper) {
      return;
    }

    if (translate && scale) {
      var transform = 'translateX(' + translate + ') scale(' + scale + ')';
      wrapper.style.MozTransform = transform;
    }
    if (opacity) {
      wrapper.style.opacity = opacity;
    }
  },

  _clearStyles: function t_clearStyles(wrapper) {
    if (!wrapper) {
      return;
    }
    wrapper.style.MozTransform = '';
    wrapper.style.opacity = '';
  }
};

PanelSwitcher.init();

var KeyboardHandler = {
  init: function kh_init() {
    window.addEventListener('keyboardchange', this);
    window.addEventListener('keyboardhide', this);
  },

  handleEvent: function kh_handleEvent(e) {
    var keyboardHeight = KeyboardManager.getHeight();
    WindowManager.resizeCurrentSheet(window.innerWidth,
                                     window.innerHeight - keyboardHeight);
  }
};

KeyboardHandler.init();

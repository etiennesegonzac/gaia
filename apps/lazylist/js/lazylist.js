'use strict';

var LazyList = {
  COUNT: 2000,
  THRESHOLD: 250,
  container: document.getElementById('container'),
  fill: document.getElementById('fill'),
  one: document.getElementById('one'),
  two: document.getElementById('two'),
  three: document.getElementById('three'),
  _orderedPanes: [this.one, this.two, this.three],

  _paneHeight: 0,
  _panesTop: 0,
  _needsLayout: true,

  init: function ll_init() {
    // Settings the total height based on the count
    this.fill.style.height = 'calc(' + (this.COUNT * 5) + 'rem + ' +
                                     this.COUNT + 'px)';

    // Setting up the panes
    this._paneHeight = this.one.getBoundingClientRect().height;
    this.layoutPanes();

    this.container.addEventListener('scroll', this);
  },

  layoutPanes: function ll_layoutPanes(initial) {
    var scrollTop = this.container.scrollTop;
    var height = this._paneHeight;

    if ((scrollTop % height) <= this.THRESHOLD) {
      if (!this._needsLayout) {
        return;
      }

      this._needsLayout = false;
    } else {
      this._needsLayout = true;
      return;
    }

    var orderedPanes = this._orderedPanes;

    var first = orderedPanes[0];
    var firstBottom = parseInt(first.style.top) + height;

    if (scrollTop <= 10) {
      this._orderedPanes = [this.one, this.two, this.three];
    } else {
      if (firstBottom < scrollTop) {
        // scrolling down, first pane unused
        this._orderedPanes = [orderedPanes[1], orderedPanes[2], orderedPanes[0]];
        orderedPanes[0].textContent = parseInt(orderedPanes[0].textContent) + 3;
        this._panesTop += height;
      } else {
        // scrolling up, last pane unused
        this._orderedPanes = [orderedPanes[2], orderedPanes[0], orderedPanes[1]];
        orderedPanes[2].textContent = parseInt(orderedPanes[2].textContent) - 3;
        this._panesTop -= height;
      }
    }

    var top = this._panesTop;

    for (var i = 0; i < this._orderedPanes.length; i++) {
      var pane = this._orderedPanes[i];
      pane.style.top = top + (i * height) + 'px';
    }
  },

  handleEvent: function ll_handleEvent(evt) {
    if (evt.type != 'scroll')
      return;

    this.layoutPanes();
  }
};

window.addEventListener('load', function appLoaded() {
  window.removeEventListener('load', appLoaded);
  LazyList.init();
});

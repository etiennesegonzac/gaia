/*global Utils
*/
(function(exports) {
'use strict';
/**
 * Dependencies
 */

var component = window['gaia-component'];
var FastList = window.FastList;

/**
 * Mini Logger
 */

var debug = 0 ? (...args) => console.log('[ThreadList]', ...args) : ()=>{};

/**
 * Thread List
 */

exports.ThreadList = component.register('thread-list', {
  created: function() {
    this.setupShadowRoot();
    this.els = {
      fastList: this.shadowRoot.querySelector('.fast-list')
    };
  },

  setup: function() {
    var source = new DataSource2(this);
    this.list = new FastList(this.els.fastList, source);
  },

  configure: function(config) {
    Object.assign(this, config);
  },

  template: `
    <section class="fast-list">
      <ul>
        <section><h2> </h2><div class="background"></div></section>
        <li><a><div><h3> </h3><p> </p><img></img></div></a></li>
      </ul>
    </section>
    <!--
<section class="fast-list">
  <ul>
    <section><h2> </h2><div class="background"></div></section>
    <li>
      <label class="pack-checkbox negative">
        <input type="checkbox">
        <span></span>
      </label>
      <a>
        <aside role="note" class="icon icon-unread icon-draft"></aside>
        <aside class="pack-end threadlist-item-picture"
               role="img" aria-label="Contact photo"
               data-l10n-id="contact-photo">
          <span data-type="img"></span>
        </aside>
        <p class="threadlist-item-title"><bdi class="ellipsis-dir-fix"></bdi>
        </p>
        <p class="summary">
          <time data-time-update="true" data-time-only="true"></time>
          <span class="mms-icon" data-l10n-id="mms-label">MMS</span>
          <span dir="auto" class="body-text ellipsis-dir-fix"></span>
        </p>
      </a>
    </li>
  </ul>
</section>-->
    <style>

    <section class="fast-list">
      <ul>
        <section><h2> </h2><div class="background"></div></section>
        <li><a><div><h3> </h3><p> </p><img></img></div></a></li>
      </ul>
    </section>
    <style>

      * { margin: 0; font: inherit; }
      a { color: inherit; text-decoration: none; }
      :host {
        display: block;
        height: 100%;
      }
      .fast-list {
        height: 100%;
        position: relative;
      }
      .fast-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .fast-list ul h2 {
        position: sticky;
        position: -webkit-sticky;
        top: 0px;
        height: 32px;
        z-index: 100;
        margin: 0;
        padding: 0 6px;
        box-sizing: border-box;
        border-bottom: solid 1px var(--border-color);
        font-size: 0.9em;
        line-height: 32px;
        background: var(--background-minus);
        color: var(--highlight-color);
      }
      .fast-list ul .background {
        position: absolute;
        z-index: 0;
        width: 100%;
        background: linear-gradient(
          to top,
          var(--border-color),
          var(--border-color) 1px,
          transparent 1px,
          transparent);
        background-position: 0 -60px;
        background-size: 100% 60px;
        background-repeat: repeat-y;
      }
      .fast-list li {
        -moz-user-select: none;
        z-index: 10;
        box-sizing: border-box;
        width: 100%;
        height: 60px;
        padding: 9px 16px;
        font-size: 18px;
        font-weight: normal;
        font-style: normal;
        list-style-type: none;
        color: var(--text-color);
      }
      .fast-list li > a {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
      }
      .fast-list li > a > div {
        width: 100%;
      }
      .fast-list li h3 {
        font-size: inherit;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fast-list li p {
        font-size: 0.7em;
        line-height: 1.35em;
        word-wrap: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fast-list li > img {
        width: 60px;
        float: right;
      }

// header {
//   background: #fff;
// }

// ul {
//   padding: 0 1.0rem;
//   background-color: #fff;
// }

// .mms-icon {
//   display: none;

//   font-size: 1.5rem;
//   color: #ff6622;
// }

// [data-last-message-type="mms"] .mms-icon {
//   display: inline;
// }

// [data-last-message-type="mms"] .body-text {
//   display: none;
// }

// .threadlist-item-picture {
//   display: none;
// }

// .threadlist-item-picture.has-picture {
//   display: block;
// }

// .threadlist-item .default-picture > span[data-type=img],
// .threadlist-item .group-picture > span[data-type=img] {
//   /* Please keep this image in sync with what is used in js/inbox.js */
//   background: url('images/default_contact_image.png') top left;
// }

// .threadlist-item:nth-child(even) .default-picture > span[data-type=img],
// .threadlist-item:nth-child(even) .group-picture > span[data-type=img] {
//   background-position: bottom right;
// }

// .threadlist-item:nth-child(3n+1) .default-picture > span[data-type=img],
// .threadlist-item:nth-child(3n+1) .group-picture > span[data-type=img] {
//   background-position: top right;
// }

// .threadlist-item:nth-child(4n+4) .default-picture > span[data-type=img],
// .threadlist-item:nth-child(4n+4) .group-picture > span[data-type=img] {
//   background-position: center center;
// }

// .threadlist-item-picture.group-picture > span[data-type=img] {
//   display: flex;

//   align-items: center;
//   justify-content: center;

//   color: #fff;
//   font-size: 2.5rem;
// }

// /**
//  * Bug 967878, 979018 -[Messages] Background doesn't
//  * scroll with the threads causing expensive over-invalidation
//  */

// aside.icon-unread {
//   margin: 0;
//   width: 1.9rem;
//   visibility: hidden;
// }

// .unread aside.icon-unread {
//   background: url("images/unread.png") no-repeat left center / 1rem;
//   visibility: visible;
// }

// .threadlist-item a * {
//   pointer-events: none;
// }

// .summary {
//   display: flex;
// }

// .draft .icon-draft {
//   background: url("images/draft.png") no-repeat left center / 1.2rem;
//   visibility: visible;
// }

// .is-draft .pack-end {
//   opacity: 0.5;
// }

// .is-draft .threadlist-item-title {
//   font-style: italic;
//   color: #5f5f5f;
// }

// /* Override time margin for flex layout */
// .summary time {
//   display: inline-block;
//   -moz-margin-end: 1rem;
// }

// .unread .summary time {
//   color: #1D8399;
// }
    </style>`,

  attrs: {
    model: {
      get: function() { return this._model; },
      set: function(value) {
        this._model = value;
        if (!this._init) {
          this.setup();
          this._init = true;
        }
      }
    }
  }
});

var headerHeight = 30;
var itemHeight = 60;

/**
 * Data Source
 */

function DataSource2(config) {
  this.config = config;
  this.data = config.model;
  this.sections = format(this.data, config.getSectionTime);
}

function format(data, getSection) {
  var map = new Map();

  data.forEach(item => {
    var sectionDate = Utils.getDayDate(getSection(item));
    if (!map.has(sectionDate)) {
      map.set(sectionDate, []);
    }
    map.get(sectionDate).push(item);
  });

  return map;
}

DataSource2.prototype = {
  populateItem: function(el, i) {
    var data = this.getRecordAt(i);
    this.config.populateItem(el, data);
  },

  getSections: function() {
    return this.sections.keys();
  },

  sectionHeaderHeight: function() {
    return headerHeight;
  },

  fullSectionHeight: function(key) {
    return this.sections.get(key).length * itemHeight;
  },

  fullSectionLength: function(key) {
    return this.sections(key).length;
  },

  getRecordAt: function(index) {
    return this.data[index];
  },

  getSectionFor: function(index) {
    var item = this.getRecordAt(index);
    return this.config.getSectionTime(item);
  },

  indexAtPosition: function(pos) {
    var index = 0;

    for (var section of this.sections.values()) {
      pos -= headerHeight;
      var sectionHeight = section.length * itemHeight;

      if (pos > sectionHeight) {
        pos -= sectionHeight;
        index += section.length;
        continue;
      }

      for (var item of section) {
        pos -= itemHeight;
        index++;
        if (pos <= 0 || index === this.fullLength() - 1) {
          return index;
        }
      }
    }
  },

  positionForIndex: function(index) {
    var top = 0;
    for (var section of this.sections.values()) {
      top += headerHeight;
      if (index < section.length) {
        top += index * itemHeight;
        return top;
      }
      index -= section.length;
      top += section.length * itemHeight;
    }
  },

  fullLength: function() {
    return this.data.length;
  },

  itemHeight: function() {
    return itemHeight;
  },

  fullHeight: function() {
    var height = 0;
    for (var section of this.sections.values()) {
      height += headerHeight + section.length * itemHeight;
    }
    return height;
  },

  insertAtIndex: function(index, record, toSection) {
    this._cachedLength = null;
    for (var entry of this.sections.entries()) {
      if (index < entry[1].length || entry[0] === toSection) {
        return entry[1].splice(index, 0, record);
      }
      index -= entry[1].length;
    }
  },

  replaceAtIndex: function(index, record) {
    for (var section of this.sections.values()) {
      if (index < section.length) {
        return section.splice(index, 1, record);
      }
      index -= section.length;
    }
  },

  removeAtIndex: function(index) {
    this._cachedLength = null;

    for (var section of this.sections.values()) {
      if (index < section.length) {
        return section.splice(index, 1)[0];
      }
      index -= section.length;
    }
  }
};

})(window);
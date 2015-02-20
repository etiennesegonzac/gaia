'use strict';
(function(exports) {
  /* global Search */
  /* global UrlHelper */
  /* global SearchProvider */

  /**
   * The main Newtab page object.
   * Instantiates places to populate history and top sites.
   */
  function Newtab() {
    // Initialize the parent port connection
    var self = this;
    navigator.mozApps.getSelf().onsuccess = function() {
      var app = this.result;
      app.connect('search-results').then(function onConnAccepted(ports) {
        ports.forEach(function(port) {
          self._port = port;
        });
        self.init();
      }, function onConnectionRejected(reason) {
        console.log('Error connecting: ' + reason + '\n');
      });
    };
  }

  Newtab.prototype = {

    /**
     * A reference to the Places provider.
     */
    provider: null,

    /**
     * Initializes top sites and history.
     */
    init: function() {
      for (var i in Search.providers) {
        Search.providers[i].init(this);
        Search.providers[i].searchObj = this;
      }

      // Setup the connection handler.
      navigator.mozSetMessageHandler('connection',
        connectionRequest => {
          var keyword = connectionRequest.keyword;
          var port = connectionRequest.port;
          if (keyword === 'search') {
            port.onmessage = this.dispatchMessage.bind(this);
            port.start();
          }
        });
    },

    dispatchMessage: function(e) {
      if (e.data.action ==='focus') {
        document.getElementById('fake-splash-page').style.display = 'none';
      } else if (e.data.action === 'change') {
        document.getElementById('suggestions-wrapper').style.display = 'block';
        document.getElementById('history-header').style.display = 'block';
        Object.keys(Search.providers).forEach((providerKey) => {
          var provider = Search.providers[providerKey];
          provider.search(e.data.input).then(results => {
            provider.render(results);
          });
        });
      } else if (e.data.action === 'clear') {
        for (var i in Search.providers) {
          Search.providers[i].clear();
        }
      } else if (e.data.action === 'submit') {
        var url = e.data.input;
        if (UrlHelper.isNotURL(url)) {
          url = SearchProvider('searchUrl')
            .replace('{searchTerms}', encodeURIComponent(e.data.input));
        }

        var hasScheme = UrlHelper.hasScheme(url);

        // No scheme, prepend basic protocol and return
        if (!hasScheme) {
          url = 'http://' + url;
        }

        window.open(url, '_blank', 'remote=true');
      }
    },

    /**
     * Requests a screenshot of the page from the system app.
     */
    requestScreenshot: function(url) {
      this._port.postMessage({
        'action': 'request-screenshot',
        'url': url
      });
    },

    /**
     * Requests that the system app opens a new private window.
     */
    requestPrivateWindow: function() {
      this._port.postMessage({
        'action': 'private-window'
      });
    },
  };

  exports.newtab = new Newtab();

  /**
   * Stub search object to populate providers.
   * TODO: We should split up the places provider into some data layer where
   * the search or newtab page could leverage it.
   */
  exports.Search = {

    providers: {},

    /**
     * Adds a search provider
     */
    provider: function(provider) {
      if (!(provider.name in this.providers)) {
        this.providers[provider.name] = provider;
      }
    },

    /**
     * Opens a browser to a URL.
     * @param {String} url The url to navigate to
     */
    navigate: function(url) {
      window.open(url, '_blank', 'remote=true');
    }
  };

})(window);

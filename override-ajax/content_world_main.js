function log_request(source, data) {
  console.log("ajax_request_data", source, data);
}

function override_xhr(window, callback) {
  var _open = XMLHttpRequest.prototype.open;
  var _setRequestHeader = window["XMLHttpRequest"].prototype.setRequestHeader;

  window["XMLHttpRequest"].prototype.setRequestHeader = function (name, value) {
    if (!this["chromane_request_headers"]) {
      this["chromane_request_headers"] = {};
    }

    this["chromane_request_headers"][name] = value;

    return _setRequestHeader.apply(this, arguments);
  };

  window["XMLHttpRequest"].prototype.open = function (_method, request_url) {
    this.addEventListener("load", (_event) => {
      if (
        (this.readyState === 4 &&
          this.status === 200 &&
          this.responseType === "text") ||
        this.responseType === ""
      ) {
        const message = {
          name: "xhr_response_captured",
          data: {
            status: this.status,
            response_text: this.responseText,

            request_url: request_url,
            response_url: this.responseURL,

            request_headers: this["chromane_request_headers"],
            // response_headers: this.getAllresponseHeaders(),
          },
        };
        callback(message);
      }
      if (this.responseType === "blob") {
        const blob = this.response;
        const reader = new FileReader();

        reader.onload = (event) => {
          const response = event.target?.result;
          const message = {
            name: "xhr_response_captured",
            data: {
              status: this.status,
              response_text: response,

              request_url: request_url,
              response_url: this.responseURL,

              request_headers: this["chromane_request_headers"],
            },
          };
          callback(message);
        };
        reader.readAsText(blob);
      }
    });

    return _open.apply(this, arguments);
  };
}

function override_fetch(window, callback) {
  var _fetch = window.fetch;

  window.fetch = async function (_request_url, _options) {
    var request, url;
    if (arguments[0] instanceof Request) {
      request = arguments[0];
      url = request.url;
    } else {
      request = arguments[1];
      url = arguments[0];
    }

    var request_text;
    if (request instanceof Request) {
      var request_clone = request.clone();
      request_text = await request_clone.text();
    } else {
      request_text = "";
    }

    var response = await _fetch.apply(window, arguments);
    var response_clone = response.clone();
    var response_text = await response_clone.text();

    var message = {
      name: "fetch_response_captured",
      data: {
        status: response_clone.status,
        response_text: response_text,
        response_url: url,

        request_url: url,
        request_text,
        // request_options: options,
        response_headers: {},
        response_body: {},
      },
    };

    if (arguments[1] && arguments[1].headers) {
      if (arguments[1].headers instanceof Headers) {
        message.data.response_headers = {};

        for (var pair of arguments[1].headers.entries()) {
          message.data.response_headers[pair[0]] = pair[1];
        }
      } else {
        message.data.response_headers = arguments[1].headers;
      }
    }

    if (arguments[1] && arguments[1].body) {
      message.data.response_body = arguments[1].body;
    }

    callback(message);

    return response;
  };
}

override_fetch(window, (data) => {
  log_request("fetch", data);
});
override_xhr(window, (data) => {
  log_request("xhr", data);
});

var d3 = {version: "3.3.13"}; // semver
var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; // conversion for NodeLists

var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;

// Redefine d3_array if the browser doesn’t support slice-based conversion.
try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = function(list) {
    var i = list.length, array = new Array(i);
    while (i--) array[i] = list[i];
    return array;
  };
}
function d3_identity(d) {
  return d;
}
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}
function d3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}

d3.map = function(object) {
  var map = new d3_Map;
  if (object instanceof d3_Map) object.forEach(function(key, value) { map.set(key, value); });
  else for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {}

d3_class(d3_Map, {
  has: d3_map_has,
  get: function(key) {
    return this[d3_map_prefix + key];
  },
  set: function(key, value) {
    return this[d3_map_prefix + key] = value;
  },
  remove: d3_map_remove,
  keys: d3_map_keys,
  values: function() {
    var values = [];
    this.forEach(function(key, value) { values.push(value); });
    return values;
  },
  entries: function() {
    var entries = [];
    this.forEach(function(key, value) { entries.push({key: key, value: value}); });
    return entries;
  },
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) f.call(this, key.substring(1), this[key]);
  }
});

var d3_map_prefix = "\0", // prevent collision with built-ins
    d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

function d3_map_has(key) {
  return d3_map_prefix + key in this;
}

function d3_map_remove(key) {
  key = d3_map_prefix + key;
  return key in this && delete this[key];
}

function d3_map_keys() {
  var keys = [];
  this.forEach(function(key) { keys.push(key); });
  return keys;
}

function d3_map_size() {
  var size = 0;
  for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) ++size;
  return size;
}

function d3_map_empty() {
  for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) return false;
  return true;
}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.substring(i + 1);
    type = type.substring(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.xhr = d3_xhrType(d3_identity);

function d3_xhrType(response) {
  return function(url, mimeType, callback) {
    if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, mimeType = null;
    return d3_xhr(url, mimeType, response, callback);
  };
}

function d3_xhr(url, mimeType, response, callback) {
  var xhr = {},
      dispatch = d3.dispatch("beforesend", "progress", "load", "error"),
      headers = {},
      request = new XMLHttpRequest,
      responseType = null;

  // If IE does not support CORS, use XDomainRequest.
  if (d3_window.XDomainRequest
      && !("withCredentials" in request)
      && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

  "onload" in request
      ? request.onload = request.onerror = respond
      : request.onreadystatechange = function() { request.readyState > 3 && respond(); };

  function respond() {
    var status = request.status, result;
    if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {
      try {
        result = response.call(xhr, request);
      } catch (e) {
        dispatch.error.call(xhr, e);
        return;
      }
      dispatch.load.call(xhr, result);
    } else {
      dispatch.error.call(xhr, request);
    }
  }

  request.onprogress = function(event) {
    var o = d3.event;
    d3.event = event;
    try { dispatch.progress.call(xhr, request); }
    finally { d3.event = o; }
  };

  xhr.header = function(name, value) {
    name = (name + "").toLowerCase();
    if (arguments.length < 2) return headers[name];
    if (value == null) delete headers[name];
    else headers[name] = value + "";
    return xhr;
  };

  // If mimeType is non-null and no Accept header is set, a default is used.
  xhr.mimeType = function(value) {
    if (!arguments.length) return mimeType;
    mimeType = value == null ? null : value + "";
    return xhr;
  };

  // Specifies what type the response value should take;
  // for instance, arraybuffer, blob, document, or text.
  xhr.responseType = function(value) {
    if (!arguments.length) return responseType;
    responseType = value;
    return xhr;
  };

  // Specify how to convert the response content to a specific type;
  // changes the callback value on "load" events.
  xhr.response = function(value) {
    response = value;
    return xhr;
  };

  // Convenience methods.
  ["get", "post"].forEach(function(method) {
    xhr[method] = function() {
      return xhr.send.apply(xhr, [method].concat(d3_array(arguments)));
    };
  });

  // If callback is non-null, it will be used for error and load events.
  xhr.send = function(method, data, callback) {
    if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
    request.open(method, url, true);
    if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
    if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
    if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
    if (responseType != null) request.responseType = responseType;
    if (callback != null) xhr.on("error", callback).on("load", function(request) { callback(null, request); });
    dispatch.beforesend.call(xhr, request);
    request.send(data == null ? null : data);
    return xhr;
  };

  xhr.abort = function() {
    request.abort();
    return xhr;
  };

  d3.rebind(xhr, dispatch, "on");

  return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
};

function d3_xhr_fixCallback(callback) {
  return callback.length === 1
      ? function(error, request) { callback(error == null ? request : null); }
      : callback;
}

module.exports = d3.xhr;

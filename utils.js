function namespace(code) {
  code()
}

namespace(function() {

window.httpGet = function(url, action, onError, onSuccess) {
  _httpSend('GET', url, null, action, onError, onSuccess)
}

window.httpPost = function(url, body, action, onError, onSuccess) {
  _httpSend('POST', url, body, action, onError, onSuccess)
}

function _httpSend(verb, url, body, action, onError, onSuccess) {
  var request = new XMLHttpRequest()
  request.onreadystatechange = function() {
    if (this.readyState !== XMLHttpRequest.DONE) return
    this.onreadystatechange = null
    this.ontimeout = null

    if (this.status !== 200) {
      onError('Received a ' + this.status + ' error while attempting to ' + action)
    } else {
      onSuccess(JSON.parse(this.responseText))
    }
  }
  request.ontimeout = function() {
    this.onreadystatechange = null
    this.ontimeout = null

    onError('Network timed out while attempting to ' + action)
  }

  request.timeout = 120000 // 120,000 milliseconds = 2 minutes
  request.open(verb, url, true)
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  request.setRequestHeader('User-Agent', 'Presently/%version%')
  request.send(body)
}

var storage = null
if (typeof(chrome) !== 'undefined' && chrome.storage) {
  storage = chrome.storage
} else if (typeof(browser) !== 'undefined' && browser.storage) {
  storage = browser.storage
} else {
  storage = {
    'local': {
      'get': function(key, callback) {callback({[key]: window.localStorage.getItem(key)})},
      'set': function(key, value) {window.localStorage.setItem(key, value)},
      'clear': function() {window.localStorage.clear()},
    }
  }
  storage.sync = storage.local // No such thing as 'remote storage' if we aren't loaded as an extension.
}

window.getLocal  = function(key, callback) {internalGet(storage.local,  key, callback)}
window.getRemote = function(key, callback) {internalGet(storage.sync,   key, callback)}
window.setLocal  = function(key, value)    {internalSet(storage.local,  key, value)}
window.setRemote = function(key, value)    {internalSet(storage.sync,   key, value)}

// For perf reasons -- I call this quite often.
var inMemory = {}
function internalGet(store, key, callback) {
  if (inMemory[key]) {
    setTimeout(function() {
      callback(inMemory[key])
    }, 0)
    return
  }
  store.get([key], function(result) {
    // result will be {} if nothing is found, or result[key] will be null (for localstorage)
    inMemory[key] = result[key]
    callback(result[key])
  })
}

function internalSet(store, key, value) {
  inMemory[key] = value
  // This odd syntax is how we construct dictionaries with variable keys.
  store.set({[key]: value})
}

window.clearStorage = function() {
  storage.local.clear()
}

window.localize = function(key, defaultValue) {
  var value = null
  if (typeof(chrome) !== 'undefined' && chrome.i18n) {
    value = chrome.i18n.getMessage(key)
  } else if (typeof(browser) !== 'undefined' && browser.i18n) {
    value = browser.i18n.getMessage(key)
  }
  if (value == null || value == '') {
    console.warn('No localized string available for "' + key + '", falling back to english.')
    return defaultValue
  }
  return value
}

window.reparent = function(child, newParent) {
  var oldParent = child.parentElement
  oldParent.removeChild(child)
  newParent.appendChild(child)
}

})

window.httpGet = function(url, callback) {
  _httpSend('GET', url, null, callback)
}

window.httpPost = function(url, body, callback) {
  _httpSend('POST', url, body, callback)
}

function _httpSend(verb, url, body, callback) {
  var request = new XMLHttpRequest()
  request.onreadystatechange = function() {
    if (this.readyState != XMLHttpRequest.DONE) return
    if (this.status != 200) throw 'HTTP request returned non-200 status: ' + this.status
    callback(JSON.parse(this.responseText))
  }
  request.timeout = 120000 // 120,000 milliseconds = 2 minutes
  request.open(verb, url, true)
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.send(body)
}

var iconWidths = { // Computed at 144px
  '!': 99, '"': 126, '#': 108, '$': 99, '%': 126, '&': 108, '\'': 108, '(': 126, ')': 108, '*': 99,
  '+': 126, ',': 108, '-': 99, '.': 126, '/': 108, '0': 99, '1': 126, '2': 108, '3': 108, '4': 126,
  '5': 108, '6': 99, '7': 126, '8': 108, '9': 99, ':': 126, ';': 108, '<': 99, '=': 126, '>': 108,
  '?': 108, '@': 126, 'A': 108, 'B': 99, 'C': 126, 'D': 126, 'E': 126, 'F': 99, 'G': 126, 'H': 108,
  'I': 108, 'J': 108, 'K': 108, 'L': 108, 'M': 81, 'N': 95, 'O': 54, 'P': 54, 'Q': 54, 'R': 54,
  'S': 54, 'T': 54, 'U': 54, 'V': 54, 'W': 54, 'X': 99, 'Y': 36, 'Z': 36, '[': 36, '\\': 36,
  ']': 36, '^': 36, '_': 81, '`': 81, 'a': 62.7188, 'b': 62.7188, 'c': 62.7188, 'd': 62.7188,
  'e': 62.7188, 'f': 99, 'g': 63, 'h': 99, 'i': 99, 'j': 99, 'k': 72, 'l': 40.0156, 'm': 112.016,
  'n': 72, 'o': 72, 'p': 72, 'q': 72, 'r': 47.9531, 's': 56.0469, 't': 40.0156, 'u': 72, 'v': 72,
  'w': 104, 'x': 72, 'y': 72, 'z': 63.9219, '{': 69.125, '|': 28.8281, '}': 69.125, '~': 77.9063,
}

// Icons that Currently uses:
// Flurries / snow: p (circles)
// Flurries: ] (snowflake)
// Sleet: 4 (lines)
// Rain: 7 (drops)
// Thunderstorms: x z (lightning and ... hail?)
// Clear: v (sun)
// Cloudy: ` (cloud)
// Fog: g (horizontal lines)
// Cloudy: 1 (cloud w/ sun)
// Sleet: 3 (lines)
// Rain: 6 (drops)
// Snow: o (circles)

// Night Specific
// Flurries: a (snowflake)
// Rain: 8
// Sleet: 5
// Snow: [
// Thunderstorms: c
// Clear: /
// Cloudy: 2

// [Icon during day, Icon during night]
window.WEATHER_CLEAR        = ['I', 'N']
window.WEATHER_CLOUDY       = ['"', '#']
window.WEATHER_OVERCAST     = ['!', '!']
window.WEATHER_WINDY        = ['D', 'E']
window.WEATHER_RAINY        = ['1', '2']
window.WEATHER_SNOWY        = ['7', '8']
window.WEATHER_SLEET        = ['%', '&']
window.WEATHER_THUNDERSTORM = ['G', 'H']
window.WEATHER_TORNADO      = ['X', 'X']
window.WEATHER_FOGGY        = ['?', '?'] // Intentionally not using the 'sun peeking out' variant

window.Climacon = function(weather, fontSize = '144px', daytime = true) {
  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = fontSize
  icon.innerText = weather[daytime ? 0 : 1]

  var offset = iconWidths[icon.innerText] - 99 // Width beyond the base cloud size
  // Since the 'cloud' part of the icon is always flush left, adjust accordingly
  icon.style.marginLeft = offset
  return icon
}

storage = null
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
window.getRemote = function(key, callback) {internalGet(storage.sync, key, callback)}
window.setLocal  = function(key, value)    {internalSet(storage.local,  key, value)}
window.setRemote = function(key, value)    {internalSet(storage.sync, key, value)}

// For perf reasons -- I call this quite often.
var inMemory = {}
function internalGet(store, key, callback) {
  if (inMemory[key]) {
    callback(inMemory[key])
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

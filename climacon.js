namespace(function() {

window.Climacon = function(weather, fontSize = '144px', isDaytimeAware = false) {
  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = fontSize
  icon.innerText = weather[0]
  if (isDaytimeAware) {
    window.getLatitudeLongitude(function(error) {
      // If we don't have latitude & longitude, just show the daytime icon.
    }, function(latitude, longitude) {
      var now = new Date()
      var sunCalc = SunCalc.getTimes(now, latitude, longitude)
      // This check will work fine modulo timezones, since the times themselves don't need to be displayed.
      if (now < sunCalc.sunrise || now > sunCalc.sunset) { // Sun has not risen yet / has set
        if (icon.innerText == window.WEATHER_CLEAR[0]) {
          icon.innerText = getMoonIcon()
        } else {
          icon.innerText = weather[1]
        }
      }
    })
  }

  // 99px = Width beyond the base cloud size
  // Since the 'cloud' part of the icon is always flush left, adjust accordingly
  icon.style.marginLeft = iconWidths[icon.innerText] - 99
  return icon
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

// Nighttime-specific
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

var iconWidths = { // Computed at 144px
  '!': 99, '"': 126, '#': 108, '$': 99, '%': 126, '&': 108, '\'': 108, '(': 126, ')': 108, '*': 99,
  '+': 126, ',': 108, '-': 99, '.': 126, '/': 108, '0': 99, '1': 126, '2': 108, '3': 108, '4': 126,
  '5': 108, '6': 99, '7': 126, '8': 108, '9': 99, ':': 126, ';': 108, '<': 99, '=': 126, '>': 108,
  '?': 108, '@': 126, 'A': 108, 'B': 99, 'C': 126, 'D': 126, 'E': 126, 'F': 99, 'G': 126, 'H': 108,
  'I': 108, 'J': 108, 'K': 108, 'L': 108, 'M': 81, 'N': 95, 'O': 95, 'P': 95, 'Q': 95, 'R': 95,
  'S': 95, 'T': 95, 'U': 95, 'V': 95, 'W': 95, 'X': 99, 'Y': 36, 'Z': 36, '[': 36, '\\': 36,
  ']': 36, '^': 36, '_': 81, '`': 81, 'a': 62.7188, 'b': 62.7188, 'c': 62.7188, 'd': 62.7188,
  'e': 62.7188, 'f': 99, 'g': 63, 'h': 99, 'i': 99, 'j': 99, 'k': 72, 'l': 40.0156, 'm': 112.016,
  'n': 72, 'o': 72, 'p': 72, 'q': 72, 'r': 47.9531, 's': 56.0469, 't': 40.0156, 'u': 72, 'v': 72,
  'w': 104, 'x': 72, 'y': 72, 'z': 63.9219, '{': 69.125, '|': 28.8281, '}': 69.125, '~': 77.9063,
}

function getMoonIcon() {
  var illum = SunCalc.getMoonIllumination(new Date())
  if (illum.phase < 0.125) return 'O'
  if (illum.phase < 0.250) return 'P'
  if (illum.phase < 0.375) return 'Q'
  if (illum.phase < 0.500) return 'R'
  if (illum.phase < 0.625) return 'S'
  if (illum.phase < 0.750) return 'T'
  if (illum.phase < 0.875) return 'U'
  if (illum.phase < 1.000) return 'V'
  return 'N'
}

})
namespace(function() {

window.Climacon = function(weather, fontSize, isDaytimeAware = false) {
  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = fontSize + 'px'
  icon.style.marginLeft = iconWidths[weather[0]] * (fontSize / 100) + 'px'
  icon.innerText = weather[0]

  // Don't actually request location data here. If we don't have it, the daytime icon is fine.
  if (isDaytimeAware && window.coords != null) {
    var now = new Date()
    var sunCalc = SunCalc.getTimes(now, window.coords.latitude, window.coords.longitude)
    // This check will work fine modulo timezones, since the times themselves don't need to be displayed.
    if (now < sunCalc.sunrise || now > sunCalc.sunset) { // Sun has not risen yet / has set
      if (icon.innerText === window.WEATHER_CLEAR[0]) {
        icon.innerText = getMoonIcon()
      } else {
        icon.innerText = weather[1]
      }
    }
  }

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
// Intentionally not using the 'sun peeking out' variant
window.WEATHER_FOGGY        = ['?', '?']

// Offsets computed at 100px
var iconWidths = {'!': 0, '"': 19, '#': 6, '$': 0, '%': 19, '&': 6, "'": 6, '(': 19, ')': 6, '*': 0, '+': 19, ', ': 6, '-': 0, '.': 19, '/'
: 6, '0': 0, '1': 19, '2': 6, '3': 6, '4': 19, '5': 6, '6': 0, '7': 19, '8': 6, '9': 0, ':': 19, ';': 6, '<': 0, '=': 19, '>': 6, '?': 6, '@': 19, 'A': 6, 'B': 0, 'C': 19, 'D': 19, 'E': 19, 'F': 0, 'G': 19, 'H': 6, 'I': 0, 'O': 0, 'P': 0, 'Q': 0, 'R': 0, 'S': 0, 'T': 0, 'U': 0, 'V': 0,  'X': 3, 'h': 0, 'i': 0, 'j': 0}

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

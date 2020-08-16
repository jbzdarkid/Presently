namespace(function() {

window.Climacon = function(weather, fontSize, isDaytimeAware = false) {
  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = fontSize + 'px'
  icon.innerText = weather[0]
  icon.title = weather[2]
  if (isDaytimeAware) {
    icon.innerText = ''
    window.getLatitudeLongitude(function(error) {
      // If we don't have latitude & longitude, just show the daytime icon.
      icon.innerText = weather[0]
    }, function(latitude, longitude) {
      var now = new Date()
      var sunCalc = SunCalc.getTimes(now, latitude, longitude)
      // This check will work fine modulo timezones, since the times themselves don't need to be displayed.
      if (now < sunCalc.sunrise || now > sunCalc.sunset) { // Sun has not risen yet / has set
        if (icon.innerText == window.WEATHER_CLEAR[0]) {
          var data = getMoonIcon()
          icon.innerText = data[0]
          icon.title = data[1]
        } else {
          icon.innerText = weather[1]
        }
      } else {
        icon.innerText = weather[0]
      }
    })
  }

  icon.style.marginLeft = iconWidths[icon.innerText] * (fontSize / 100) + 'px'
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
window.WEATHER_CLEAR        = ['I', 'N', 'Clear']
window.WEATHER_CLOUDY       = ['"', '#', 'Cloudy']
window.WEATHER_OVERCAST     = ['!', '!', 'Overcast']
window.WEATHER_WINDY        = ['D', 'E', 'Windy']
window.WEATHER_RAINY        = ['1', '2', 'Rainy']
window.WEATHER_SNOWY        = ['7', '8', 'Snowy']
window.WEATHER_SLEET        = ['%', '&', 'Sleet']
window.WEATHER_THUNDERSTORM = ['G', 'H', 'Stormy']
window.WEATHER_TORNADO      = ['X', 'X', 'Tornado']
// Intentionally not using the 'sun peeking out' variant
window.WEATHER_FOGGY        = ['?', '?', 'Foggy']

// Offsets computed at 100px
var iconWidths = {'!': 0, '"': 19, '#': 6, '$': 0, '%': 19, '&': 6, "'": 6, '(': 19, ')': 6, '*': 0, '+': 19, ', ': 6, '-': 0, '.': 19, '/': 6, '0': 0, '1': 19, '2': 6, '3': 6, '4': 19, '5': 6, '6': 0, '7': 19, '8': 6, '9': 0, ':': 19, ';': 6, '<': 0, '=': 19, '>': 6, '?': 6, '@': 19, 'A': 6, 'B': 0, 'C': 19, 'D': 19, 'E': 19, 'F': 0, 'G': 19, 'H': 6, 'I': 0, 'O': 0, 'P': 0, 'Q': 0, 'R': 0, 'S': 0, 'T': 0, 'U': 0, 'V': 0,  'X': 3, 'h': 0, 'i': 0, 'j': 0}

function getMoonIcon() {
  var illum = SunCalc.getMoonIllumination(new Date())
  if (illum.phase < 0.125) return ['O', 'New Moon']
  if (illum.phase < 0.250) return ['P', 'Waxing Crescent']
  if (illum.phase < 0.375) return ['Q', 'First Quarter']
  if (illum.phase < 0.500) return ['R', 'Waxing Gibbous']
  if (illum.phase < 0.625) return ['S', 'Full Moon']
  if (illum.phase < 0.750) return ['T', 'Waning Gibbous']
  if (illum.phase < 0.875) return ['U', 'Third Quarter']
  if (illum.phase < 1.000) return ['V', 'Waning Crescent']
  return ['N', 'Clear']
}

})
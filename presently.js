function httpGet(url, callback) {
  _httpSend('GET', url, null, callback)
}

function httpPost(url, body, callback) {
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

// https://stackoverflow.com/a/32108184
Object.prototype.isEmpty = function() {
  return Object.keys(this).length === 0 && this.constructor === Object
}

// E.g. https://api.weather.gov/icons/land/day/rain
icons = {
  // 'Name in the weather.gov API' : [IconDuringDay, IconDuringNight]
  'skc':             ['I', 'N'], // Fair/clear
  'few':             ['"', '#'], // A few clouds
  'sct':             ['"', '#'], // Partly Cloudy
  'bkn':             ['"', '#'], // Mostly Cloudy
  'ovc':             ['!', '!'], // Overcast
  'wind_skc':        ['B', 'B'], // Fair/clear and windy
  'wind_few':        ['D', 'E'], // A few clouds and windy
  'wind_sct':        ['D', 'E'], // Partly cloudy and windy
  'wind_bkn':        ['C', 'C'], // Mostly cloudy and windy
  'wind_ovc':        ['C', 'C'], // Overcast and windy
  'snow':            [':', ';'], // Snow
  'rain_snow':       ['7', '8'], // Rain/snow
  'rain_sleet':      ['4', '5'], // Rain/sleet
  'snow_sleet':      ['3', '3'], // Snow/sleet
  'fzra':            ['$', '$'], // Freezing Rain
  'rain_fzra':       ['%', '&'], // Rain/freezing rain
  'snow_fzra':       ['%', '&'], // Snow/Freezing rain
  'sleet':           ['3', '3'], // Sleet
  'rain':            ['(', ')'], // Rain
  'rain_showers':    ['0', '0'], // Rain showers (high cloud cover)
  'rain_showers_hi': ['1', '2'], // Rain showers (low cloud cover)
  'tsra':            ['F', 'F'], // Thunderstorm (high cloud cover)
  'tsra_sct':        ['F', 'F'], // Thunderstorm (medium cloud cover)
  'tsra_hi':         ['G', 'H'], // Thunderstorm (low cloud cover)
  'tornado':         ['X', 'X'], // Tornado
  'hurricane':       ['X', 'X'], // Hurricane conditions
  'tropical_storm':  ['X', 'X'], // Tropical storm conditions
  'dust':            ['?', '?'], // Dust
  'smoke':           ['?', '?'], // Smoke
  'haze':            ['?', '?'], // Haze
  'hot':             ['^', '^'], // Hot
  'cold':            ['[', '['], // Cold
  'blizzard':        ['6', '6'], // Blizzard
  'fog':             ['@', 'A'], // Fog/mist
}

icon_widths = {
  '!': 99, '"': 126, '#': 108, '$': 99, '%': 126, '&': 108, '\'': 108, '(': 126, ')': 108, '*': 99,
  '+': 126, ',': 108, '-': 99, '.': 126, '/': 108, '0': 99, '1': 126, '2': 108, '3': 108, '4': 126,
  '5': 108, '6': 99, '7': 126, '8': 108, '9': 99, ':': 126, ';': 108, '<': 99, '=': 126, '>': 108,
  '?': 108, '@': 126, 'A': 108, 'B': 99, 'C': 126, 'D': 126, 'E': 126, 'F': 99, 'G': 126, 'H': 108,
  'I': 108, 'J': 108, 'K': 108, 'L': 108, 'M': 81, 'N': 54, 'O': 54, 'P': 54, 'Q': 54, 'R': 54,
  'S': 54, 'T': 54, 'U': 54, 'V': 54, 'W': 54, 'X': 99, 'Y': 36, 'Z': 36, '[': 36, '\\': 36,
  ']': 36, '^': 36, '_': 81, '`': 81, 'a': 62.7188, 'b': 62.7188, 'c': 62.7188, 'd': 62.7188,
  'e': 62.7188, 'f': 99, 'g': 63, 'h': 99, 'i': 99, 'j': 99, 'k': 72, 'l': 40.0156, 'm': 112.016,
  'n': 72, 'o': 72, 'p': 72, 'q': 72, 'r': 47.9531, 's': 56.0469, 't': 40.0156, 'u': 72, 'v': 72,
  'w': 104, 'x': 72, 'y': 72, 'z': 63.9219, '{': 69.125, '|': 28.8281, '}': 69.125, '~': 77.9063,
}

function updateDayFromPeriod(id, period) {
  var day = document.getElementById('forecast-' + id)
  day.textContent = '';

  // Not all icons are the same width. Pad all icons to the same size.
  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = '144px'

  var prediction = period.icon.split('/')[6].split(',')[0].split('?')[0]
  icon.innerText = (period.isDaytime ? icons[prediction][0] : icon.innerText = icons[prediction][1])
  icon.title = (period.detailedForecast ? period.detailedForecast : period.shortForecast)
  var offset = icon_widths[icon.innerText] - 99 // Width beyond the base cloud size
  // Since the 'cloud' part of the icon is always flush left, adjust accordingly
  icon.style.marginLeft = offset

  day.appendChild(icon)

  var temp = document.createElement('span')
  temp.innerText = period.temperature
  temp.style.fontFamily = 'OpenSans-Bold'
  temp.style.fontSize = '48px'
  day.appendChild(temp)

  var name = document.createElement('span')
  name.innerText = (period.name ? period.name : 'Now')
  name.style.fontSize = '24px'
  day.appendChild(name)

  return day
}

var hourlyForecastUrl = null
var forecastUrl = null
var units = 'us'
function getTempAndForecast() {
  // Get current temp
  httpGet(hourlyForecastUrl + '?units=' + units, function(response) {
    document.getElementById('forecast-loading').style.display = 'none'
    document.getElementById('forecast').style.display = 'flex'

    updateDayFromPeriod('0', response.properties.periods[0])
    document.title = response.properties.periods[0].temperature + '\u00B0 | Presently'
  })

  // Get forecast
  httpGet(forecastUrl + '?units=' + units, function(response) {
    document.getElementById('forecast-loading').style.display = 'none'
    document.getElementById('forecast').style.display = 'flex'

    for (var i=0; i<4; i++) {
      updateDayFromPeriod(i+1, response.properties.periods[i])
    }
  })
}

function updateWeather() {
  if (hourlyForecastUrl && forecastUrl) {
    console.log('Loaded URLs from memory:', hourlyForecastUrl, forecastUrl)
    getTempAndForecast()
    return
  }

  chrome.storage.local.get(['urls'], function(result) {
    if (result && !result.isEmpty()) {
      var parts = result.urls.split('|')
      hourlyForecastUrl = parts[0]
      forecastUrl = parts[1]
      console.log('Loaded URLs from chrome storage:', hourlyForecastUrl, forecastUrl)
      getTempAndForecast()
      return
    }

    // Get lat/long based on ip addr
    httpGet('https://ipapi.co/json', function(response) {
      // Get points for forecast
      httpGet(`https://api.weather.gov/points/${response.latitude},${response.longitude}`, function(response) {
        hourlyForecastUrl = response.properties.forecastHourly
        forecastUrl = response.properties.forecast
        console.log('Fetched URLs from weather.gov:', hourlyForecastUrl, forecastUrl)
        // I'm using local storage here since different computers might be in different locations.
        chrome.storage.local.set({'urls': hourlyForecastUrl + '|' + forecastUrl}, null)
        getTempAndForecast(hourlyForecastUrl, forecastUrl)
        return
      })
    })
  })
}

var lastTimeUpdate = null
var lastWeatherUpdate = null
function updateTimeAndWeather() {
  /* If I ever want a clock, this is how you do that.
  var now = moment(),
  second = now.seconds() * 6,
  minute = now.minutes() * 6 + second / 60,
  hour = ((now.hours() % 12) / 12) * 360 + 90 + minute / 12;

  $('#hour').css('transform', 'rotate(' + hour + 'deg)');
  $('#minute').css('transform', 'rotate(' + minute + 'deg)');
  $('#second').css('transform', 'rotate(' + second + 'deg)');
  */

  // Every second, update the time
  if (lastTimeUpdate == null || moment() - lastTimeUpdate > 1000) {
    lastTimeUpdate = moment()
    document.getElementById('time').innerText = lastTimeUpdate.format('hh mm')
    document.getElementById('date').innerText = lastTimeUpdate.format('dddd, MMM DD')
  }

  // Every hour, update the weather.
  if (lastWeatherUpdate == null || moment() - lastWeatherUpdate > 60 * 60 * 1000) {
    lastWeatherUpdate = moment()
    updateWeather()
  }
  setTimeout(updateTimeAndWeather, 10 * 1000)
}

window.onload = function() {
  document.body.style.background = '#222222';
  document.body.style.color = 'rgba(0, 0, 0, 0.6)'
  document.addEventListener('keydown', function(event) {
    if (event.key == 't' || event.key == 'T') {
      units = (units == 'us' ? 'si' : 'us')
      chrome.storage.local.set({'units': units}, null)
      updateWeather()
    }
  })

  chrome.storage.local.get(['units'], function(result) {
    if (result && !result.isEmpty()) {
      units = result.units
    } else {
      units = 'us'
    }
    updateTimeAndWeather()
  })
}

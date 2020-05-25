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

function updateDayFromPeriod(id, period) {
  var day = document.getElementById('forecast-' + id)
  day.textContent = '';

  var icon = document.createElement('span')
  icon.style.fontFamily = 'Climacons'
  icon.style.fontSize = '144px'

  var prediction = period.icon.split('/')[6].split(',')[0].split('?')[0]
  icon.innerText = (period.isDaytime ? icons[prediction][0] : icon.innerText = icons[prediction][1])
  icon.title = (period.detailedForecast ? period.detailedForecast : period.shortForecast)
  day.appendChild(icon)

  var temp = document.createElement('b')
  temp.innerText = period.temperature
  temp.style.fontSize = '48px'
  day.appendChild(temp)

  var name = document.createElement('p')
  name.innerText = (period.name ? period.name : 'Now')
  name.style.fontSize = '24px'
  day.appendChild(name)

  return day
}

var hourlyForecastUrl = null
var forecastUrl = null
function updateWeather() {
  var getTempAndForecast = function() {
    // Get current temp
    httpGet(hourlyForecastUrl, function(response) {
      document.getElementById('forecast-loading').style.display = 'none'
      document.getElementById('forecast').style.display = 'flex'

      updateDayFromPeriod('0', response.properties.periods[0])
    })

    // Get forecast
    httpGet(forecastUrl, function(response) {
      document.getElementById('forecast-loading').style.display = 'none'
      document.getElementById('forecast').style.display = 'flex'

      for (var i=0; i<4; i++) {
        updateDayFromPeriod(i+1, response.properties.periods[i])
      }
    })
  }

  if (hourlyForecastUrl && forecastUrl) {
    chrome.storage.local.get(['hourlyForecastUrl'], function(result) {
      hourlyForecastUrl = result.key
      chrome.storage.local.get(['forecastUrl'], function(result) {
        forecastUrl = result.key
      })
    })
  }

  if (hourlyForecastUrl && forecastUrl) {
    getTempAndForecast(hourlyForecast, forecast)
  }

  // Get lat/long based on ip addr
  httpGet('https://ipapi.co/json', function(response) {
    // Get points for forecast
    httpGet(`https://api.weather.gov/points/${response.latitude},${response.longitude}`, function(response) {
      hourlyForecastUrl = response.properties.forecastHourly
      forecastUrl = response.properties.forecast
      // I'm using local storage here since different computers might be in different locations.
      chrome.storage.local.set({'hourlyForecastUrl': hourlyForecastUrl, 'forecastUrl': forecastUrl}, null)
      getTempAndForecast(hourlyForecastUrl, forecastUrl)
    })
  })
}

var lastTimeUpdate = null
var lastWeatherUpdate = null
function updateTimeAndWeather() {
  /*
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
    document.getElementById('date').innerText = lastTimeUpdate.format('dddd, MMM Do')
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
  // document.body.text.color = rgba(0, 0, 0, 0.6)
  updateTimeAndWeather()
}

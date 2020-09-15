namespace(function() {

// TODOs:
// - Consider img01.png for mobile theme chooser / if window is small
// - OpenSans is failing to load in FF, try downloading from here: https://www.fontsquirrel.com/fonts/open-sans

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')
var MONTHS = window.localize('months_of_year', 'January, February, March, April, May, June, July, August, September, October, November, December').split(', ')

var previousWidth = window.innerWidth
window.onresize = function() {
  if (window.innerWidth < 800 && previousWidth >= 800) {
    displayNeedsUpdate = true
    // Manually strip the seconds off (we'll do this more carefully once the time reloads)
    var time = document.getElementById('time').innerText
    document.getElementById('time').innerText = time.substr(0, 5)
  } else if (window.innerWidth >= 800 && previousWidth < 800) {
    displayNeedsUpdate = true
    timeExpires = new Date(0) // Forcibly expire the time to fetch seconds
  }
  previousWidth = window.innerWidth
}

function onForecastError(error) {
  document.getElementById('forecast-loading').style.display = 'flex'
  document.getElementById('forecast-error').innerText = error
}

// Default true when JS loads; we need to draw the display at least once.
window.displayNeedsUpdate = true
window.updateWeather = function() {
  if (displayNeedsUpdate) {
    displayNeedsUpdate = false
    window.getLocal('weatherData', function(weatherData) {
      if (weatherData) window.drawWeatherData(weatherData)
    })
  }

  window.getLocal('weatherExpires', function(weatherExpires) {
    var now = new Date()
    if (weatherExpires && now.getTime() < weatherExpires) return // Weather not expired, nothing to do.

    // We've decided we're going update the weather data -- prevent any other updates for 5 minutes,
    // to avoid making unnecessary network calls. We'll give it a longer expiration if the call succeeds.
    weatherExpires = now
    weatherExpires.setMinutes(weatherExpires.getMinutes() + 5)
    window.setLocal('weatherExpires', weatherExpires.getTime())

    console.log('Weather data is expired, fetching new weather data...')
    window.requestLocation(onForecastError, function(coords) {
      weatherApi.getWeather(coords, onForecastError, function(weatherData) {
        /* Expected data format:
        [
          {temp: 0, weather: WEATHER_CLOUDY, forecast: "Cloudy, with a chance of meatballs"},
          {high: 10, low: 0, weather: WEATHER_CLEAR, forecast: "..."},
          {high: 10, low: 0, weather: WEATHER_CLEAR, forecast: "..."},
          {high: 10, low: 0, weather: WEATHER_CLEAR, forecast: "..."},
          {high: 10, low: 0, weather: WEATHER_CLEAR, forecast: "..."},
        ]*/

        // I'm choosing a time which is *slightly* into the next hour, since the US weather API updates on the hour.
        weatherExpires = new Date()
        weatherExpires.setHours(weatherExpires.getHours() + 1, 1, 0, 0)
        window.setLocal('weatherExpires', weatherExpires.getTime())
        window.setLocal('weatherData', weatherData)

        drawWeatherData(weatherData)
      })
    })
  })
}

var timeExpires = new Date(0)
function updateTime() {
  var now = new Date()
  if (now < timeExpires) return
  timeExpires = new Date(now)
  // Expire the time next second (but clear the milliseconds)
  timeExpires.setSeconds(now.getSeconds() + 1, 0)

  /* If I ever want an analog clock, this is how to do that:
  var second = now.getSeconds() * 6,
  var minute = now.getMinutes() * 6 + second / 60,
  var hour = ((now.getHours() % 12) / 12) * 360 + 90 + minute / 12;

  $('#hour').css('transform', 'rotate(' + hour + 'deg)');
  $('#minute').css('transform', 'rotate(' + minute + 'deg)');
  $('#second').css('transform', 'rotate(' + second + 'deg)');
  */

  var timeString = window.timeToString(now)
  // Don't show seconds if the window isn't wide enough
  if (window.innerWidth >= 800 && document.getElementById('Seconds-On').checked) {
    timeString += ' ' + now.getSeconds().toString().padStart(2, '0')
  }
  document.getElementById('time').innerText = timeString

  var dateString = DAYS[now.getDay()] + ', ' + MONTHS[now.getMonth()] + ' ' + now.getDate()
  document.getElementById('date').innerText = dateString
}

function mainLoop() {
  updateTime()
  updateWeather()

  setTimeout(mainLoop, 100)
}

document.addEventListener('DOMContentLoaded', function() {
  window.loadSettings(function() {
    // Request the user's location once on page load to populate sunrise/sundown times.
    // On success, we also request a repaint, since this will fix any nighttime climacons.
    // We need to do this after settings, so that we know which API to call.
    window.requestLocation(onForecastError, function(success) {
      displayNeedsUpdate = true
    })

    // If we navigated to ?settings (i.e. from the extension menu), immediately show settings.
    if (document.location.search == '?settings') {
      window.showSettings()
    }
    mainLoop()
  })
})

})
namespace(function() {

// TODOs:
// - OpenSans is failing to load in FF, try downloading from here: https://www.fontsquirrel.com/fonts/open-sans
// - Make sure things fade out, where possible. E.g. errors going away / alerts going away
// - Invest in more "English" strings for network failures (i.e. not "503" or "0", use "API unavailable" or "Network disconnected")
// - When resizing the weather, persist the error (if shown)
// - https://stackoverflow.com/questions/63033412/dark-mode-flickers-a-white-background-for-a-millisecond-on-reload
// - map selector using leaflet.js (I may need to host map images)
// - Fire / smoke API: https://docs.airnowapi.org/

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
  window.getLocal('weatherVeryExpires', function(weatherVeryExpires) {
    var now = (new Date()).getTime()
    if (weatherVeryExpires && now < weatherVeryExpires) return

    // The weather is very expired, discard it and show an error.
    window.setLocal('weatherData', null)
    document.getElementById('forecast-loading').style.display = 'flex'
    document.getElementById('forecast-error').innerText = error
    document.getElementById('forecast').style.display = 'none'
  })
}

// Default true when JS loads; we need to draw the display at least once.
window.displayNeedsUpdate = true
function updateWeather() {
  window.getLocal('weatherVeryExpires', function(weatherVeryExpires) {
    window.getLocal('weatherExpires', function(weatherExpires) {
      window.getLocal('weatherData', function(weatherData) {
        var now = (new Date()).getTime()

        // If we need to redraw the display, do so as long as we have weather data that's not very expired.
        if (displayNeedsUpdate && weatherData && weatherVeryExpires && now < weatherVeryExpires) {
          window.drawWeatherData(weatherData)
          displayNeedsUpdate = false
          return
        }

        // If the weather is not expired, exit.
        if (weatherExpires && now < weatherExpires) return

        // Else, the weather is expired and should be updated.
        // We prevent any updates for 5 minutes to avoid making excessive network calls.
        // If the weather update succeeds, we'll set a later expiration time.
        weatherExpires = new Date()
        weatherExpires.setMinutes(weatherExpires.getMinutes() + 5)
        window.setLocal('weatherExpires', weatherExpires.getTime())
        console.log('Fetching new weather data...')

        window.requestLocation(onForecastError, function(coords) {
          window.weatherApi.getWeather(coords, onForecastError, function(weatherData) {
            console.log('Fetched new weather data')
            var weatherExpires = new Date()
            weatherExpires.setHours(weatherExpires.getHours() + 1, 1, 0, 0)
            window.setLocal('weatherExpires', weatherExpires.getTime())

            var weatherVeryExpires = new Date()
            weatherVeryExpires.setHours(weatherVeryExpires.getHours() + 2, 0, 0, 0)
            window.setLocal('weatherVeryExpires', weatherVeryExpires.getTime())

            window.setLocal('weatherData', weatherData)
            window.drawWeatherData(weatherData)
            displayNeedsUpdate = false
          })
        })
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

  var hours = now.getHours()
  if (document.getElementById('Hours-12').checked) {
    hours = (hours + 11) % 12 + 1 // Convert 0-23 to 1-12
  }
  var timeString = hours.toString().padStart(2, '0')
  timeString += ' ' + now.getMinutes().toString().padStart(2, '0')
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

document.addEventListener("keydown", function(event) {
  if (String.fromCharCode(event.keyCode) === 'T') {
    if (document.getElementById('Temperature-Fahrenheit').checked) {
      window.setRemote('settings-Temperature', 'Temperature-Celsius')
      document.getElementById('Temperature-Celsius').checked = true
    } else {
      window.setRemote('settings-Temperature', 'Temperature-Fahrenheit')
      document.getElementById('Temperature-Fahrenheit').checked = true
    }
    displayNeedsUpdate = true
  }
});

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

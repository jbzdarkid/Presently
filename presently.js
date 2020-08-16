namespace(function() {

// TODOs:
// - fix jump while weather is loading (make the spinner take up as much vertical space as weather does)
// - Sunrise & sunset are not recomputed unless the location changes. Maybe I should recompute them when I fetch the weather?
//     Maybe I should always fetch location data as a part of the weather?
// - Don't go fetch new weather every time the theme changes. That's just sloppy.
// - Analog clock + hide forecast (if window gets too small)
// - Consider img01.png for mobile theme chooser / if window is small
// - OpenSans is failing to load in FF, try downloading from here: https://www.fontsquirrel.com/fonts/open-sans
// - Spend some more time worrying about icons being centered. Maybe make a test page for the icons I actually use, then pixel-align them?

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')
var MONTHS = window.localize('months_of_year', 'January, February, March, April, May, June, July, August, September, October, November, December').split(', ')

function normalizedUnits(degreesF) {
  if (document.getElementById('Temperature-Fahrenheit').checked) {
    return degreesF
  } else {
    var deg = (parseInt(degreesF) - 32) * 5
    return Math.floor(deg / 9)
  }
}

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

function drawWeatherData(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'
  document.title = normalizedUnits(weatherData[0].temp) + '\u00B0 | Presently'

  { // i == 0
    var day = document.getElementById('forecast-0')
    day.textContent = ''

    var currentHour = (new Date()).getHours()
    var icon = Climacon(weatherData[0].weather, 180, true /* isDaytimeAware */)
    icon.style.marginBottom = '-10px'
    day.appendChild(icon)

    var temp = document.createElement('div')
    temp.style.width = '90px'
    day.appendChild(temp)

    var t = document.createElement('div')
    t.innerText = normalizedUnits(weatherData[0].temp)
    t.style.textAlign = 'center'
    t.style.fontFamily = 'OpenSans-Bold'
    t.style.fontSize = '72px'
    temp.appendChild(t)

    var name = document.createElement('span')
    name.innerText = window.localize('current_day_name', 'Now')
    name.style.fontFamily = 'OpenSans-Regular'
    name.style.fontSize = '48px'
    day.appendChild(name)
  }

  // If the window is too small, do not draw the forecast.
  if (window.innerWidth < 800) {
    for (var i=1; i<weatherData.length && i < 5; i++) {
      document.getElementById('forecast-' + i).style.display = 'none'
    }
    return
  }

  for (var i=1; i<weatherData.length && i < 5; i++) {
    var day = document.getElementById('forecast-' + i)
    day.style.display = null
    day.textContent = ''

    day.appendChild(Climacon(weatherData[i].weather, 96))

    var temp = document.createElement('div')
    temp.style.width = '90px'
    day.appendChild(temp)

    var h = document.createElement('div')
    h.innerText = normalizedUnits(weatherData[i].high)
    h.style.float = 'left'
    h.style.textAlign = 'right'
    h.style.fontFamily = 'OpenSans-Regular'
    h.style.fontSize = '30px'
    temp.appendChild(h)

    var l = document.createElement('div')
    l.innerText = normalizedUnits(weatherData[i].low)
    l.style.float = 'right'
    l.style.textAlign = 'left'
    l.style.fontFamily = 'OpenSans-Regular'
    l.style.fontSize = '30px'
    l.style.opacity = '0.5'
    temp.appendChild(l)

    var name = document.createElement('span')
    name.innerText = DAYS[((new Date()).getDay() + i) % 7]
    name.style.fontFamily = 'OpenSans-Regular'
    name.style.fontSize = '24px'
    day.appendChild(name)
  }
}

// Default true when JS loads; we need to draw the display at least once.
window.displayNeedsUpdate = true
window.updateWeather = function() {
  if (displayNeedsUpdate) {
    displayNeedsUpdate = false
    window.getLocal('weatherData', function(weatherData) {
      if (weatherData) drawWeatherData(weatherData)
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
    window.getLatitudeLongitude(function(error) {
      document.getElementById('forecast-error').innerText = error
    }, function(latitude, longitude) {
      weatherApi.getWeather(latitude, longitude, function(error) {
        document.getElementById('forecast-error').innerText = error
      }, function(weatherData) {
        /* Expected data format:
        [
          {temp: 0, weather: WEATHER_CLEAR},
          {high: 10, low: 0, weather: WEATHER_CLEAR},
          {high: 10, low: 0, weather: WEATHER_CLEAR},
          {high: 10, low: 0, weather: WEATHER_CLEAR},
          {high: 10, low: 0, weather: WEATHER_CLEAR},
        ]*/

        // Clear minutes, seconds, and milliseconds
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
  // Don't show seconds beyond a minimum width
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
  window.weatherApi = window.USApi

  window.loadSettings(function() {
    if (document.location.search == '?settings') {
      showSettings()
    }
    mainLoop()
  })
})

})
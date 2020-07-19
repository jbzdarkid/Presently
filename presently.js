// TODOs:
// - Other weather APIs (to support non-US locations)
// - Themes
// - Analog clock + hide forecast (if window gets too small)
// - Default to request user location (if none exists)
//   This should fall back to ip-based if user declines
//   Give the user text boxes to customize (and a refresh button which will repeat the above)
//   Should (ideally) show city name + sunrise/sunset (just as a nice confirmation of what these numbers mean)
// - fix jump while weather is loading (make the spinner take up as much vertical space as weather does

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')
var MONTHS = window.localize('months_of_year', 'January, February, March, April, May, June, July, August, September, October, November, December').split(', ')

function normalizedUnits(degreesF) {
  if (document.getElementById('Temperature-Farenheit').checked) {
    return degreesF
  } else {
    var deg = (parseInt(degreesF) - 32) * 5
    return Math.floor(deg / 9)
  }
}

function drawWeatherData(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'
  document.title = normalizedUnits(weatherData[0].temp) + '\u00B0 | Presently'

  { // i == 0
    var day = document.getElementById('forecast-0')
    day.textContent = '';

    var currentHour = (new Date()).getHours()
    var icon = Climacon(weatherData[0].weather, '15em', true /* isDaytimeAware */)
    icon.style.marginBottom = '-10px'
    day.appendChild(icon)

    var temp = document.createElement('div')
    temp.style.width = '90px'
    temp.style.fontSize = '4em'
    day.appendChild(temp)

    var t = document.createElement('div')
    t.innerText = normalizedUnits(weatherData[0].temp)
    t.style.textAlign = 'center'
    t.style.fontFamily = 'OpenSans-Bold'
    t.style.fontSize = '1.5em'
    temp.appendChild(t)

    var name = document.createElement('span')
    name.innerText = window.localize('current_day_name', 'Now')
    name.style.fontSize = '4em'
    day.appendChild(name)
  }

  for (var i=1; i<weatherData.length && i < 5; i++) {
    var day = document.getElementById('forecast-' + i)
    day.textContent = '';

    day.appendChild(Climacon(weatherData[i].weather, '8em'))

    var temp = document.createElement('div')
    temp.style.width = '90px'
    day.appendChild(temp)

    var h = document.createElement('div')
    h.innerText = normalizedUnits(weatherData[i].high)
    h.style.float = 'left'
    h.style.textAlign = 'right'
    h.style.fontFamily = 'OpenSans-Regular'
    h.style.fontSize = '2.5em'
    temp.appendChild(h)

    var l = document.createElement('div')
    l.innerText = normalizedUnits(weatherData[i].low)
    l.style.float = 'right'
    l.style.textAlign = 'left'
    l.style.fontFamily = 'OpenSans-Regular'
    l.style.fontSize = '2.5em'
    l.style.opacity = '0.5'
    temp.appendChild(l)

    var name = document.createElement('span')
    name.innerText = DAYS[((new Date()).getDay() + i) % 7]
    name.style.fontSize = '2em'
    day.appendChild(name)
  }
}

var displayNeedsUpdate = true // Default true when JS loads; we need to draw the display at least once.
function updateWeather() {
  if (displayNeedsUpdate) { // True when we first load, or when changing units
    displayNeedsUpdate = false
    window.getLocal('weatherData', function(weatherData) {
      if (weatherData) drawWeatherData(weatherData)
    })
  }

  window.getLocal('weatherExpires', function(weatherExpires) {
    var now = new Date()
    if (weatherExpires && now.getTime() < weatherExpires) return // Weather not expired, nothing to do.

    // We've decided we're going update the weather data -- prevent any other updates for 5 minutes,
    // to avoid making unnecessary network calls. We'll give it the full expiration once the call succeeds.
    weatherExpires = now
    weatherExpires.setMinutes(weatherExpires.getMinutes() + 5)
    window.setLocal('weatherExpires', weatherExpires.getTime())

    // TODO: This is triggering on refresh...!
    console.log('Weather data is expired, fetching new weather data...')
    window.USApi.getWeather(function(weatherData) {
      if (!weatherData) return // Potentially we can fail to fetch data, in which case we should not do anything.

      // Clear minutes, seconds, and milliseconds
      // I'm choosing a time which is *slightly* into the next hour, since the US weather API updates on the hour.
      weatherExpires = new Date()
      weatherExpires.setHours(weatherExpires.getHours() + 1, 1, 0, 0)
      window.setLocal('weatherExpires', weatherExpires.getTime())
      window.setLocal('weatherData', weatherData)

      drawWeatherData(weatherData)
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
    // Convert 0-23 to 1-12
    hours = (hours + 11) % 12 + 1
  }
  var timeString = hours.toString().padStart(2, '0') + ' ' + now.getMinutes().toString().padStart(2, '0')
  if (document.getElementById('Seconds-On').checked) {
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

window.onload = function() {
  document.body.style.background = '#222222'
  document.body.style.color = 'rgba(0, 0, 0, 0.6)'

  if (document.location.search == '?settings') {
    showSettings()
  }
  document.getElementById('settings-button').onclick = showSettings

  window.mainLoop()
}

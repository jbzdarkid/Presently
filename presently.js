// TODO: Localization!
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

var units = 'F'
var normalizedUnits = function(degreesF) {
  if (units == 'F') {
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

    var icon = Climacon(weatherData[0].weather, '15em')
    icon.style.marginBottom = '-35px'
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
    name.innerText = 'Now'
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
    name.innerText = days[((new Date()).getDay() + i) % 7]
    name.style.fontSize = '2em'
    day.appendChild(name)
  }
}

var displayNeedsUpdate = true // Default true when JS loads; we need to draw the display at least once.
function updateWeather() {
  if (!displayNeedsUpdate) return
  displayNeedsUpdate = false
  // Even though we could show the loading widget again, don't. It's just going to cause a flicker.
  
  window.getLocal('cachedWeather', function(weatherData) {
    var now = new Date()
    if (weatherData && now < weatherData[0].expires) {
      drawWeatherData(weatherData)
      return
    }

    // TODO: Other APIs for other regions.
    console.log('Fetching weather data...')
    window.USApi.getWeather(function(weatherData) {
      weatherData[0]['expires'] = new Date(now)
      // Clear minutes, seconds, and milliseconds
      // I'm choosing a time which is *slightly* into the next hour, since the US weather API is hourly.
      weatherData[0]['expires'].setHours(now.getHours() + 1, 1, 0, 0)
      window.setLocal('cachedWeather', weatherData)

      drawWeatherData(weatherData)
    })
  })
}

var timeExpires = new Date(0)
function updateTime() {
  var now = new Date()
  if (now < timeExpires) return
  timeExpires = new Date(now)
  // Clear seconds & milliseconds. TODO: Clock with seconds as an option?
  timeExpires.setMinutes(now.getMinutes() + 1, 0, 0)

  /* If I ever want an analog clock, this is how to do that:
  var second = now.getSeconds() * 6,
  var minute = now.getMinutes() * 6 + second / 60,
  var hour = ((now.getHours() % 12) / 12) * 360 + 90 + minute / 12;

  $('#hour').css('transform', 'rotate(' + hour + 'deg)');
  $('#minute').css('transform', 'rotate(' + minute + 'deg)');
  $('#second').css('transform', 'rotate(' + second + 'deg)');
  */
  
  var hours = now.getHours()
  var hourString = (hours > 12 ? hours - 12 : hours).toString().padStart(2, '0')
  var minuteString = now.getMinutes().toString().padStart(2, '0')
  document.getElementById('time').innerText = hourString + ' ' + minuteString

  var dateString = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate()
  document.getElementById('date').innerText = dateString
}

// Toggle units with t
document.addEventListener('keydown', function(event) {
  if (event.key == 't' || event.key == 'T') {
    units = (units == 'F' ? 'C' : 'F')
    window.setRemote('units', units)
    
    console.log('Redrawing weather data because the units have changed')
    displayNeedsUpdate = true
    updateWeather()
  }
})

function mainLoop() {
  updateTime()
  updateWeather()

  setTimeout(mainLoop, 100)
}

window.onload = function() {
  document.body.style.background = '#222222';
  document.body.style.color = 'rgba(0, 0, 0, 0.6)'
  
  window.getRemote('units', function(cachedUnits) {
    if (units != null) units = cachedUnits
    window.mainLoop()
  })
}

namespace(function() {

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')

window.WeatherData = class{
  constructor() {
    this.data = [{}, {}, {}, {}, {}, {}]
    this.alert = []
  }

  setCurrent(weather, forecast, temp) {
    this.data[0]['weather'] = weather
    this.data[0]['forecast'] = forecast
    this.data[0]['temp'] = temp
  }

  setForecast(day, weather, forecast, high, low) {
    if (weather == null) throw 'Weather cannot be empty in setForecast'
    if (high < low) throw 'High cannot be less than low in setForecast'
    this.data[day]['weather'] = weather
    this.data[day]['forecast'] = forecast
    this.data[day]['high'] = high
    this.data[day]['low'] = low
  }

  setAlert(summary, description) {
    if (summary == null) throw 'Summary cannot be empty in setAlert'
    this.alert = [summary, description]
  }
}

function normalizedUnits(degreesF) {
  if (document.getElementById('Temperature-Fahrenheit').checked) {
    return degreesF
  } else {
    var deg = (parseInt(degreesF, 10) - 32) * 5
    return Math.floor(deg / 9)
  }
}

window.drawWeatherData = function(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  document.getElementById('forecast-error').innerText = ''

  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'
  document.title = normalizedUnits(weatherData.data[0].temp) + '\u00B0 | Presently'

  { // i == 0
    var day = document.getElementById('forecast-0')
    day.textContent = ''

    var climacon = Climacon(weatherData.data[0].weather, 180, true /* isDaytimeAware */)
    climacon.style.marginBottom = '-10px'
    climacon.title = weatherData.data[0].forecast
    day.appendChild(climacon)

    var temp = document.createElement('div')
    temp.style.width = '90px'
    day.appendChild(temp)

    var t = document.createElement('div')
    t.innerText = normalizedUnits(weatherData.data[0].temp)
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
    // Also, push the current weather down, so it doesn't clip with the date
    document.getElementById('forecast-0').style.top = '0px'
    for (var i=1; i<5; i++) {
      document.getElementById('forecast-' + i).style.display = 'none'
    }
    return
  }
  // Otherwise, restore the offset for current weather
  document.getElementById('forecast-0').style.top = '-80px'

  for (var i=1; i<5; i++) {
    var day = document.getElementById('forecast-' + i)
    day.style.display = 'flex'
    day.textContent = ''

    // var todayForecast = document.getElementById('TodayForecast').value
    // var now = new Date()
    // if (todayForecast == 'TodayForecast-Never' ||
    //     (todayForecast == 'TodayForecast-6AM' && now < 6) ||
    //     (todayForecast == 'TodayForecast-Noon' && now < 12) ||
    //     (todayForecast == 'TodayForecast-6PM' && now < 18)) {
    //   var datum = weatherData.data[i + 1]
    // } else {
      var datum = weatherData.data[i]
    // }

    var climacon = Climacon(datum.weather, 96)
    climacon.title = datum.forecast
    day.appendChild(climacon)

    var temp = document.createElement('div')
    temp.style.width = '90px'
    day.appendChild(temp)

    var h = document.createElement('div')
    h.innerText = normalizedUnits(datum.high)
    h.style.float = 'left'
    h.style.textAlign = 'right'
    h.style.fontFamily = 'OpenSans-Regular'
    h.style.fontSize = '30px'
    temp.appendChild(h)

    var l = document.createElement('div')
    l.innerText = normalizedUnits(datum.low)
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

  if (weatherData.alert[0] == null) {
    document.getElementById('alert').style.display = 'none'
    document.getElementById('alertText').innerText = ''
    document.getElementById('alertText').title = ''
  } else {
    document.getElementById('alert').style.display = null
    document.getElementById('alertText').innerText = weatherData.alert[0]
    document.getElementById('alertText').title = weatherData.alert[1]
  }
}

})
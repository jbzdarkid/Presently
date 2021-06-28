namespace(function() {

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')

window.WeatherData = class{
  constructor() {
    this.periods = []
    this.alert = []
    this.current = null
  }

  addPeriod(period, hourly) {
    if (period.startTime == null) throw 'Period must have a startTime'
    if (period.weather == null) throw 'Period must have weather'
    if (period.forecast == null && period.shortForecast == null) throw 'Period must have a forecast or a shortForecast'
    if (period.high == null) throw 'Period must have a high'
    if (period.low == null) throw 'Period must have a low'
    if (period.startTime < 1500000000000) throw 'Period must be in milliseconds, not seconds'
    period.startTime = new Date(period.startTime).getTime()
    period.high = Math.round(period.high)
    period.low = Math.round(period.low)
    this.periods.push(period)
    if (hourly != null && this.current == null) this.current = period
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

function drawCurrentWeather(period) {
  var day = document.getElementById('forecast-0')
  day.textContent = ''

  var climacon = Climacon(period.weather, 180, true /* isDaytimeAware */)
  climacon.style.marginBottom = '-10px'
  climacon.title = period.shortForecast
  day.appendChild(climacon)

  var tempDiv = document.createElement('div')
  day.appendChild(tempDiv)

  var temp = Math.round((period.high + period.low) / 2)
  document.title = normalizedUnits(temp) + '\u00B0 | Presently'

  var t = document.createElement('div')
  t.innerText = normalizedUnits(temp)
  t.style.textAlign = 'center'
  t.style.fontFamily = 'OpenSans-Bold'
  t.style.fontSize = '72px'
  tempDiv.appendChild(t)

  var name = document.createElement('span')
  name.innerText = window.localize('current_day_name', 'Now')
  name.style.fontFamily = 'OpenSans-Regular'
  name.style.fontSize = '48px'
  day.appendChild(name)

  // If the window is too small, push the current weather down, so it doesn't clip with the date
  if (window.innerWidth < 800) {
    document.getElementById('forecast-0').style.top = '0px'
  } else {
    document.getElementById('forecast-0').style.top = '-80px'
    document.getElementById('forecast-0').style.marginBottom = '-80px'
  }
}

function drawAlert(alert) {
  if (alert == null || alert[0] == null) {
    document.getElementById('alert').style.display = 'none'
    document.getElementById('alertText').innerText = ''
    document.getElementById('alertText').title = ''
  } else {
    document.getElementById('alert').style.display = null
    document.getElementById('alertText').innerText = alert[0]
    document.getElementById('alertText').title = alert[1]
  }
}

function drawForecast(day, weather, forecast, highTemp, lowTemp, dayOfWeek) {
  var d = document.getElementById('forecast-' + day)
  d.style.display = 'flex'
  d.textContent = ''

  var climacon = Climacon(weather, 96)
  climacon.title = forecast
  d.appendChild(climacon)

  var temp = document.createElement('div')
  temp.style = 'display: flex; align-items: center; flex-direction: column; width: 100%'
  d.appendChild(temp)

  var highAndLow = document.createElement('div')
  highAndLow.style = 'display: flex; justify-content: space-around; width: 100%'
  temp.appendChild(highAndLow)

  var high = document.createElement('div')
  high.innerText = normalizedUnits(highTemp)
  high.style = 'font-family: OpenSans-Regular; font-size: 30px'
  highAndLow.appendChild(high)

  var low = document.createElement('div')
  low.innerText = normalizedUnits(lowTemp)
  low.style = 'font-family: OpenSans-Regular; font-size: 30px; opacity: 0.5'
  highAndLow.appendChild(low)

  var name = document.createElement('span')
  name.innerText = dayOfWeek
  name.style.fontFamily = 'OpenSans-Regular'
  name.style.fontSize = '24px'
  temp.appendChild(name)
}

window.drawWeatherData = function(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  document.getElementById('forecast-error').innerText = ''

  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'

  // Periods may be entered out-of-order (e.g. from the hourly & daily APIs)
  weatherData.periods.sort(function(a, b) {
    var sortKey = a.startTime - b.startTime
    // Sort periods which have a shortForecast earlier (-1: a<b; 1: a>b)
    sortKey += (b.shortForecast == null ? 1 : 0) - (a.shortForecast == null ? 1 : 0)
    return sortKey
  })

  // Always draw the current weather
  drawCurrentWeather(weatherData.current || weatherData.periods[0])

  // If the window is too small, do not draw the forecast.
  if (window.innerWidth < 800) return

  var now = new Date()
  var nextDay = new Date(now)
  var forecastDays = 5
  var todayForecast = document.getElementById('TodayForecast').value
  if ((todayForecast == 'TodayForecast-6AM'  && now.getHours() < 6)  ||
      (todayForecast == 'TodayForecast-Noon' && now.getHours() < 12) ||
      (todayForecast == 'TodayForecast-6PM'  && now.getHours() < 18) ||
      (todayForecast == 'TodayForecast-Always')) {
    forecastDays-- // Remove one day because we will be showing today's weather as the first forecast
  }

  var i = 0 // weatherData.periods index
  for (var day=0; day<forecastDays; day++) {
    nextDay.setHours(24, 0, 0, 0) // iter 0: sets next day to (now + 1 day). All other iters, increments by 1 day.
    var weather = null
    var forecast = null
    var shortForecast = null
    var high = -9999
    var low = 9999

    for (; i<weatherData.periods.length; i++) {
      var period = weatherData.periods[i]
      // Search for the last period which applies (next period starts in the future)
      if (i+1 < weatherData.periods.length && new Date(weatherData.periods[i+1].startTime) < now) continue

      // Update data from this period
      if (weather == null) weather = period.weather
      if (forecast == null && period.forecast != null) forecast = period.forecast
      if (shortForecast == null && period.shortForecast != null) shortForecast = period.shortForecast
      if (period.high > high) high = period.high
      if (period.low < low) low = period.low

      // If the next period is still in the same day, continue.
      if (i+1 < weatherData.periods.length && new Date(weatherData.periods[i+1].startTime) < nextDay) continue

      // Otherwise, break out and draw the accumulated weather data.
      break
    }

    if (forecastDays === 4) { // When today's forecast is included, shift the index by one for todays weather
      drawForecast(day + 1, weather, forecast || shortForecast, high, low, DAYS[(now.getDay() + day) % 7])
    } else if (day !== 0) { // Else, don't draw forecast for today's weather, but keep the index fixed.
      drawForecast(day, weather, forecast || shortForecast, high, low, DAYS[(now.getDay() + day) % 7])
    }
  }
}

})

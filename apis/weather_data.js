namespace(function() {

var DAYS = window.localize('days_of_week', 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday').split(', ')

window.WeatherData = class{
  constructor() {
    this.current = {}
    this.periods = []
    this.alert = []
  }

  setCurrent(weather, forecast, temp) {
    if (weather == null) throw 'setCurrent must have a weather'
    if (forecast == null) throw 'setCurrent must have a forecast'
    if (temp == null) throw 'setCurrent must have a temp'
    this.data[0]['weather'] = weather
    this.data[0]['forecast'] = forecast
    this.data[0]['temp'] = Math.round(temp)
  }

  addPeriod(period) {
    if (period.startTime == null) throw 'Period must have a startTime'
    if (period.weather == null) throw 'Period must have weather'
    if (period.forecast == null) throw 'Period must have a forecast'
    if (period.high == null) throw 'Period must have a high'
    if (period.low == null) throw 'Period must have a low'
    period.high = Math.round(period.high)
    period.low = Math.round(period.low)
    this.periods.push(period)
    this.periods.sort(function(a, b) {return a.startTime - b.startTime})
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

function drawCurrentWeather(weather, forecast, temp) {
  var day = document.getElementById('forecast-0')
  day.textContent = ''

  var climacon = Climacon(weather, 180, true /* isDaytimeAware */)
  climacon.style.marginBottom = '-10px'
  climacon.title = forecast
  day.appendChild(climacon)

  var tempDiv = document.createElement('div')
  tempDiv.style.width = '90px'
  day.appendChild(tempDiv)

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

window.drawWeatherData2 = function(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  document.getElementById('forecast-error').innerText = ''

  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'

  var now = new Date()
  var nextDay = new Date(now)
  nextDay.setHours(24, 0, 0, 0)
  var day = 0

  var weather = null
  var forecast = null
  var high = -9999
  var low = 9999

  // Note: day<5 because we only draw 4 forecast days.
  for (var i=0; i<weatherData.periods.length && day < 5; i++) {
    var period = weatherData.periods[i]
    // Search for the last period which applies (next period starts in the future)
    if (i+1 < weatherData.periods.length && new Date(weatherData.periods[i+1].startTime) < now) continue

    // Update data from this period
    if (weather == null) {
      weather = period.weather
      forecast = period.forecast
    }
    if (period.high > high) high = period.high
    if (period.low < low) low = period.low

    // If the next period is still in the same day, continue.
    if (i+1 < weatherData.periods.length && new Date(weatherData.periods[i+1].startTime) < nextDay) continue

    // Otherwise, draw the accumulated weather data.
    if (day == 0) {
      drawCurrentWeather(weather, forecast, Math.round((high + low) / 2))
      var todayForecast = document.getElementById('TodayForecast').value
      if ((todayForecast == 'TodayForecast-6AM'  && now.getHours() < 6)  ||
          (todayForecast == 'TodayForecast-Noon' && now.getHours() < 12) ||
          (todayForecast == 'TodayForecast-6PM'  && now.getHours() < 18) ||
          (todayForecast == 'TodayForecast-Always')) {
        var dayOfWeek = DAYS[((new Date()).getDay() + day) % 7]
        day++
        drawForecast(day, weather, forecast, high, low, dayOfWeek)
      }
    } else {
      drawForecast(day, weather, forecast, high, low, DAYS[((new Date()).getDay() + day) % 7])
    }
    day++
    nextDay.setHours(24, 0, 0, 0)
    var weather = null
    var forecast = null
    var high = -9999
    var low = 9999
  }
}

window.drawWeatherData = function(weatherData) {
  document.getElementById('forecast-loading').style.display = 'none'
  document.getElementById('forecast-error').innerText = ''

  // This needs to be a flexbox so that the forecast elements float side-by-side.
  document.getElementById('forecast').style.display = 'flex'

  drawCurrentWeather(weatherData.data[0].weather, weatherData.data[0].forecast, weatherData.data[0].temp)

  // If the window is too small, do not draw the forecast.
  if (window.innerWidth < 800) return

  for (var i=1; i<5; i++) {
  // var todayForecast = document.getElementById('TodayForecast').value
  // var now = new Date()
  // if (todayForecast == 'TodayForecast-Never' ||
  //     (todayForecast == 'TodayForecast-6AM' && now < 6) ||
  //     (todayForecast == 'TodayForecast-Noon' && now < 12) ||
  //     (todayForecast == 'TodayForecast-6PM' && now < 18)) {
  //   var datum = weatherData.data[day + 1]
  // } else {
    var datum = weatherData.data[i]
  // }

    drawForecast(i, datum.weather, datum.forecast, datum.high, datum.low)
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
namespace(function() {

var predictionToWeather = {
  'skc': WEATHER_CLEAR,
  'hot': WEATHER_CLEAR,

  'few': WEATHER_CLOUDY,
  'sct': WEATHER_CLOUDY,
  'bkn': WEATHER_CLOUDY,

  'wind_bkn': WEATHER_OVERCAST,
  'wind_ovc': WEATHER_OVERCAST,
  'ovc':      WEATHER_OVERCAST,

  'wind_skc': WEATHER_WINDY,
  'wind_few': WEATHER_WINDY,
  'wind_sct': WEATHER_WINDY,

  'fzra':            WEATHER_RAINY,
  'rain':            WEATHER_RAINY,
  'rain_fzra':       WEATHER_RAINY,
  'rain_showers':    WEATHER_RAINY,
  'rain_showers_hi': WEATHER_RAINY,

  'snow':      WEATHER_SNOWY,
  'rain_snow': WEATHER_SNOWY,
  'snow_fzra': WEATHER_SNOWY,

  'sleet':      WEATHER_SLEET,
  'rain_sleet': WEATHER_SLEET,
  'snow_sleet': WEATHER_SLEET,

  'tsra':     WEATHER_THUNDERSTORM,
  'tsra_sct': WEATHER_THUNDERSTORM,
  'tsra_hi':  WEATHER_THUNDERSTORM,

  'tornado':        WEATHER_TORNADO,
  'hurricane':      WEATHER_TORNADO,
  'tropical_storm': WEATHER_TORNADO,

  'dust':  WEATHER_FOGGY,
  'smoke': WEATHER_FOGGY,
  'haze':  WEATHER_FOGGY,
  'fog':   WEATHER_FOGGY,
}

function getWeatherFromIcon(icon) {
  // Icons are URLs, and usually look something like this:
  // https://api.weather.gov/icons/land/night/bkn?size=medium
  // They can also have two forecasts, and look like this:
  // https://api.weather.gov/icons/land/night/bkn,skc?size=medium
  // Or like this, apparently:
  // https://api.weather.gov/icons/land/day/hot/rain_showers,20?size=medium

  var start = icon.lastIndexOf('/') + 1
  var end = icon.indexOf(',', start)
  if (end == -1) end = icon.indexOf('?', start)
  var weather = predictionToWeather[icon.substr(start, end - start)]
  if (weather == null) console.error('Failed to convert icon', icon, 'to weather')
  return weather
}

function getPointInfo(coords, onError, onSuccess) {
  // This data never changes, but it isn't computable. Cache it in remote storage so it can be shared.
  var key = 'usapi,points,' + coords.latitude + ',' + coords.longitude
  window.getRemote(key, function(response) {
    if (response) {
      onSuccess(response)
      return
    }

    httpGet('https://api.weather.gov/points/' + coords.latitude + ',' + coords.longitude, 'discover information about your location', function(error) {
      if (error.includes('404')) {
        onError('Your location is not inside the US, so we cannot look it up using the US API.')
      } else {
        onError(error)
      }
    }, function(response) {
      window.setRemote(key, response.properties)
      onSuccess(response.properties)
    })
  })
}

window.USApi = {}

USApi.getLocationData = function(coords, onError, onSuccess) {
  getPointInfo(coords, onError, function(response) {
    var timezone = response.timeZone
    var city = response.relativeLocation.properties.city
    var state = response.relativeLocation.properties.state
    onSuccess(timezone, city + ', ' + state)
  })
}

USApi.getWeather = function(coords, onError, onSuccess) {
  getPointInfo(coords, onError, function(response) {
    var weatherData = new WeatherData()
    var callbacksPending = 3

    // Force a new weather fetch by setting a custom header
    var headers = {'Feature-Flags': (new Date()).getTime()}

    httpGet(response.forecastHourly, headers, 'fetch the current weather', onError, function(response) {
      var period = response.properties.periods[0]
      weatherData.setCurrent(getWeatherFromIcon(period.icon), period.shortForecast, period.temperature)
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    httpGet(response.forecast, headers, 'fetch the weather forecast', onError, function(response) {
      var tomorrow = new Date().setHours(24, 0, 0, 0)
      var day = 1
      for (var i=0; i<response.properties.periods.length && day<5;) {
        var period = response.properties.periods[i]
        // Skip periods until we find one which starts after midnight.
        // This ensures that we show a proper forecast beginning on the next day.
        if (new Date(period.startTime) < tomorrow) {
          i++
          continue
        }

        weatherData.setForecast(day, getWeatherFromIcon(period.icon), period.detailedForecast, period.temperature, response.properties.periods[i+1].temperature)
        i += 2
        day++
      }
      if (day < 5) return // Didn't get enough days of data
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    var baseUrl = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert&limit=1&point='
    httpGet(baseUrl + coords.latitude + ',' + coords.longitude, headers, 'fetch active weather alerts', function(error) {
      // Disregard errors from the alerts API; we can and should still show the weather if it fails.
      if (--callbacksPending === 0) onSuccess(weatherData)
    }, function(response) {
      if (response.features.length > 0) {
        weatherData.setAlert(response.features[0].properties.event, response.features[0].properties.description)
      }

      if (--callbacksPending === 0) onSuccess(weatherData)
    })
  })
}

})
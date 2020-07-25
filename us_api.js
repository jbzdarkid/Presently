window.USApi = {}

namespace(function() {

var predictionToWeather = {
  'skc': WEATHER_CLEAR,

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

  var prediction = icon.split('/')[6].split(',')[0].split('?')[0]
  return predictionToWeather[prediction]
}

USApi.getLocationData = function(latitude, longitude, onError, onSuccess) {
  window.getLocal('usapi,weatherdata,' + latitude + ',' + longitude, function(response) {
    if (response) {
      onSuccess(response[0], response[1])
      return
    }

    // TODO: Can I manually compute points to save this network call? At worst, I should cache them.
    httpGet('https://api.weather.gov/points/' + latitude + ',' + longitude, function(error) {
      onError(error)
    }, function(response) {
      var timezone = response.properties.timeZone
      var city = response.properties.relativeLocation.properties.city
      var state = response.properties.relativeLocation.properties.state
      window.setLocal('usapi,weatherdata,' + latitude + ',' + longitude, [timezone, city + ', ' + state])
      onSuccess(timezone, city + ', ' + state)
    })
  })
}

USApi.getWeather = function(latitude, longitude, onError, onSuccess) {
  // TODO: Can I manually compute points to save this network call? At worst, I should cache them.
  httpGet('https://api.weather.gov/points/' + latitude + ',' + longitude, function(error) {
    onError(error)
  }, function(response) {
    var weatherData = [{}, {}, {}, {}, {}]
    var callbacksPending = 2

    httpGet(response.properties.forecastHourly, function(error) {
      onError(error)
    }, function(response) {
      var period = response.properties.periods[0]
      weatherData[0]['temp'] = period.temperature
      weatherData[0]['weather'] = getWeatherFromIcon(period.icon)
      if (--callbacksPending == 0) onSuccess(weatherData)
    })

    httpGet(response.properties.forecast, function(error) {
      onError(error)
    }, function(response) {
      var now = new Date()
      var day = 1
      for (var i=0; i<response.properties.periods.length && day<5; i++) {
        var period = response.properties.periods[i]
        // Skip periods until we find one which has not yet started.
        // This ensures that we will always have a high and a low for the given period,
        // and it avoids duplicating info for the current day.
        if (new Date(period.startTime) < now) continue

        weatherData[day]['high'] = period.temperature
        weatherData[day]['low'] = response.properties.periods[i+1].temperature // Nighttime temp
        weatherData[day]['weather'] = getWeatherFromIcon(period.icon)
        day++
      }
      if (--callbacksPending == 0) onSuccess(weatherData)
    })
  })
}

})
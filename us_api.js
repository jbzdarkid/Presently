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

USApi.getWeather = function(callback) {
  window.getLocal2('urls', fallback=function(callback) {
    window.getLatitudeLongitude(function(latitude, longitude) {
      httpGet('https://api.weather.gov/points/' + latitude + ',' + longitude, function(response) {
        console.log('Fetched URLs via latitude, longitude')
        var urls = response.properties.forecastHourly + '|' + response.properties.forecast
        window.setLocal('urls', urls)
        callback(urls)
      })
    })
  }, function(urls) {
    var weatherData = [{}, {}, {}, {}, {}]
    var callbacksPending = 2
    var hourlyForecastUrl = urls.split('|')[0]
    var forecastUrl = urls.split('|')[1]

    httpGet(hourlyForecastUrl, function(response) {
      var period = response.properties.periods[0]
      weatherData[0]['temp'] = period.temperature
      weatherData[0]['weather'] = getWeatherFromIcon(period.icon)
      if (--callbacksPending == 0) callback(weatherData)
    })

    httpGet(forecastUrl, function(response) {
      var day = 1
      for (var i=0; i<response.properties.periods.length && day<5; i++) {
        var period = response.properties.periods[i]
        // Skip periods until we find the start of a day (6 AM).
        // This ensures that we will always have a high and a low for the given period,
        // and it avoids duplicating info for the current day.
        var startDate = new Date(period.startTime)
        if (startDate.getHours() != 6) continue

        weatherData[day]['high'] = period.temperature
        weatherData[day]['low'] = response.properties.periods[i+1].temperature // Nighttime temp
        weatherData[day]['weather'] = getWeatherFromIcon(period.icon)
        day++
      }
      if (--callbacksPending == 0) callback(weatherData)
    })
  })
}

})
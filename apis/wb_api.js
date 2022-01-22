namespace(function() {

// From https://www.weatherbit.io/api/codes
var iconCodeToWeather = {
  200: WEATHER_THUNDERSTORM, // Thunderstorm with light rain
  201: WEATHER_THUNDERSTORM, // Thunderstorm with rain
  202: WEATHER_THUNDERSTORM, // Thunderstorm with heavy rain
  230: WEATHER_THUNDERSTORM, // Thunderstorm with light drizzle
  231: WEATHER_THUNDERSTORM, // Thunderstorm with drizzle
  232: WEATHER_THUNDERSTORM, // Thunderstorm with heavy drizzle
  233: WEATHER_THUNDERSTORM, // Thunderstorm with Hail
  300: WEATHER_RAINY, // Light Drizzle
  301: WEATHER_RAINY, // Drizzle
  302: WEATHER_RAINY, // Heavy Drizzle
  500: WEATHER_RAINY, // Light Rain
  501: WEATHER_RAINY, // Moderate Rain
  502: WEATHER_RAINY, // Heavy Rain
  511: WEATHER_RAINY, // Freezing rain
  520: WEATHER_RAINY, // Light shower rain
  521: WEATHER_RAINY, // Shower rain
  522: WEATHER_RAINY, // Heavy shower rain
  600: WEATHER_SNOWY, // Light snow
  601: WEATHER_SNOWY, // Snow
  602: WEATHER_SNOWY, // Heavy Snow
  610: WEATHER_SNOWY, // Mix snow/rain
  611: WEATHER_SLEET, // Sleet
  612: WEATHER_SLEET, // Heavy sleet
  621: WEATHER_SNOWY, // Snow shower
  622: WEATHER_SNOWY, // Heavy snow shower
  623: WEATHER_SNOWY, // Flurries
  700: WEATHER_FOGGY, // Mist
  711: WEATHER_FOGGY, // Smoke
  721: WEATHER_FOGGY, // Haze
  731: WEATHER_FOGGY, // Sand/dust
  741: WEATHER_FOGGY, // Fog
  751: WEATHER_FOGGY, // Freezing Fog
  800: WEATHER_CLEAR, // Clear sky
  801: WEATHER_CLOUDY, // Few clouds
  802: WEATHER_CLOUDY, // Scattered clouds
  803: WEATHER_OVERCAST, // Broken clouds
  804: WEATHER_OVERCAST, // Overcast clouds
  900: WEATHER_RAINY, // Unknown Precipitation
}

function getWeatherFromIcon(icon) {
  weather = iconCodeToWeather[icon]
  if (weather == null) {
    console.error('Failed to convert icon', icon, 'to weather')
    weather = WEATHER_CLEAR
  }
  return weather
}

window.WBApi = {}

// This information just comes for free alongside the current weather.
// So, we should always check to see if it's cached.
WBApi.getLocationData = function(coords, onError, onSuccess) {
  var key = 'wbapi,location,' + coords.latitude + ',' + coords.longitude
  window.getRemote(key, function(response) {
    if (response) {
      var timezone = response.data[0].timezone
      var city = response.data[0].city_name
      var state = response.data[0].state_code
      onSuccess(timezone, null, city + ', ' + state)
      return
    }

    window.getRemote('weatherbit-apikey', function(apikey) {
      if (apikey == null) {
        onError('Missing API key for weatherbit.io')
        return
      }

      var prefix = 'https://api.weatherbit.io/v2.0'
      var suffix = '?units=I&key=' + apikey + '&lat=' + coords.latitude + '&lon=' + coords.longitude
      httpGet(prefix + '/current' + suffix, 'discover information about your location', onError, function(response) {
        window.setRemote(key, response)
        var timezone = response.data[0].timezone
        var city = response.data[0].city_name
        var state = response.data[0].state_code
        onSuccess(timezone, null, city + ', ' + state)
      })
    })
  })
}

WBApi.getWeather = function(coords, onError, onSuccess) {
  window.getRemote('weatherbit-apikey', function(apikey) {
    if (apikey == null) {
      onError('Missing API key for weatherbit.io')
      return
    }
    var weatherData = new WeatherData()
    var callbacksPending = 3

    var prefix = 'https://api.weatherbit.io/v2.0'
    var suffix = '?units=I&key=' + apikey + '&lat=' + coords.latitude + '&lon=' + coords.longitude
    httpGet(prefix + '/current' + suffix, 'fetch the current weather', onError, function(response) {
      var key = 'wbapi,location,' + coords.latitude + ',' + coords.longitude
      window.setRemote(key, response)

      var period = response.data[0]
      weatherData.addPeriod({
        'startTime': period.ts * 1000,
        'weather': getWeatherFromIcon(period.weather.code),
        'shortForecast': period.weather.description,
        'high': period.temp,
        'low': period.temp,
      }, true)
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    httpGet(prefix + '/forecast/daily' + suffix, 'fetch the weather forecast', onError, function(response) {
      for (var i=0; i<response.data.length; i++) {
        var period = response.data[i]
        weatherData.addPeriod({
          'startTime': period.ts * 1000,
          'weather': getWeatherFromIcon(period.weather.code),
          'forecast': period.weather.description,
          'high': period.high_temp,
          'low': period.low_temp,
        })
      }
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    httpGet(prefix + '/alerts' + suffix, 'fetch active weather alerts', onError, function(response) {
      if (response.alerts.length > 0) {
        weatherData.setAlert(response.alerts[0].title, response.alerts[0].description)
      }
      if (--callbacksPending === 0) onSuccess(weatherData)
    })
  })
}

})

namespace(function() {

var iconCodeToWeather = [
  WEATHER_TORNADO,      // 0 - Tornado
  WEATHER_TORNADO,      // 1 - Tropical Storm
  WEATHER_TORNADO,      // 2 - Hurricane
  WEATHER_THUNDERSTORM, // 3 - Strong Storms
  WEATHER_THUNDERSTORM, // 4 - Thunder and Hail
  WEATHER_SNOWY,        // 5 - Rain to Snow Showers
  WEATHER_SLEET,        // 6 - Rain / Sleet
  WEATHER_SLEET,        // 7 - Wintry Mix Snow / Sleet
  WEATHER_RAINY,        // 8 - Freezing Drizzle
  WEATHER_RAINY,        // 9 - Drizzle
  WEATHER_RAINY,        // 10 - Freezing Rain
  WEATHER_RAINY,        // 11 - Light Rain
  WEATHER_RAINY,        // 12 - Rain
  WEATHER_SNOWY,        // 13 - Scattered Flurries
  WEATHER_SNOWY,        // 14 - Light Snow
  WEATHER_SNOWY,        // 15 - Blowing / Drifting Snow
  WEATHER_SNOWY,        // 16 - Snow
  WEATHER_SLEET,        // 17 - Hail
  WEATHER_SLEET,        // 18 - Sleet
  WEATHER_FOGGY,        // 19 - Blowing Dust / Sandstorm
  WEATHER_FOGGY,        // 20 - Foggy
  WEATHER_FOGGY,        // 21 - Haze / Windy
  WEATHER_FOGGY,        // 22 - Smoke / Windy
  WEATHER_WINDY,        // 23 - Breezy
  WEATHER_WINDY,        // 24 - Blowing Spray / Windy
  WEATHER_WINDY,        // 25 - Frigid / Ice Crystals
  WEATHER_CLOUDY,       // 26 - Cloudy
  WEATHER_OVERCAST,     // 27 - Mostly Cloudy
  WEATHER_OVERCAST,     // 28 - Mostly Cloudy
  WEATHER_CLOUDY,       // 29 - Partly Cloudy
  WEATHER_CLOUDY,       // 30 - Partly Cloudy
  WEATHER_CLEAR,        // 31 - Clear
  WEATHER_CLEAR,        // 32 - Sunny
  WEATHER_CLEAR,        // 33 - Fair / Mostly Clear
  WEATHER_CLEAR,        // 34 - Fair / Mostly Sunny
  WEATHER_SLEET,        // 35 - Mixed Rain & Hail
  WEATHER_CLEAR,        // 36 - Hot
  WEATHER_THUNDERSTORM, // 37 - Isolated Thunderstorms
  WEATHER_THUNDERSTORM, // 38 - Thunderstorms
  WEATHER_RAINY,        // 39 - Scattered Showers
  WEATHER_RAINY,        // 40 - Heavy Rain
  WEATHER_SNOWY,        // 41 - Scattered Snow Showers
  WEATHER_SNOWY,        // 42 - Heavy Snow
  WEATHER_SNOWY,        // 43 - Blizzard
  WEATHER_CLEAR,        // 44 - Not Available (N/A)
  WEATHER_RAINY,        // 45 - Scattered Showers
  WEATHER_SNOWY,        // 46 - Scattered Snow Showers
  WEATHER_THUNDERSTORM, // 47 - Scattered Thunderstorms
]

function getWeatherFromIcon(icon) {
  weather = iconCodeToWeather[icon]
  if (weather == null) {
    console.error('Failed to convert icon', icon, 'to weather')
    weather = WEATHER_CLEAR
  }
  return weather;
}

window.IBMApi = {}

IBMApi.getLocationData = function(coords, onError, onSuccess) {
  window.getRemote('weather-com-apikey', function(apikey) {
    if (apikey == null) {
      onError('Missing API key for weather.com')
      return
    }

    var url = 'https://api.weather.com/v3/location/search?query=' + coords.latitude + ',' + coords.longitude + '&apiKey=' + apikey + '&format=json&language=en-US'
    httpGet(url, 'discover information about your location', onError, function(response) {
      var timezone = response.location.ianaTimeZone[0]
      var city = response.location.city[0]
      var state = response.location.adminDistrictCode[0]
      onSuccess(timezone, null, city + ', ' + state)
    })
  })
}

IBMApi.getWeather = function(coords, onError, onSuccess) {
  window.getRemote('weather-com-apikey', function(apikey) {
    if (apikey == null) {
      onError('Missing API key for weather.com')
      return
    }
    var weatherData = new WeatherData()
    var callbacksPending = 3

    var prefix = 'https://api.weather.com/v1/geocode/' + coords.latitude + '/' + coords.longitude + '/forecast'
    var suffix = '?apiKey=' + apikey + '&units=e&language=en-US'

    httpGet(prefix + '/hourly/12hour.json' + suffix, 'fetch the current weather', onError, function(response) {
      for (var i=0; i<response.forecasts.length; i++) {
        var period = response.forecasts[i]
        weatherData.addPeriod({
          'startTime': period.fcst_valid * 1000,
          'weather': getWeatherFromIcon(period.icon_code),
          'shortForecast': period.phrase_32char,
          'high': period.temp,
          'low': period.temp,
        }, true)
      }
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    httpGet(prefix + '/daily/5day.json' + suffix, 'fetch the weather forecast', onError, function(response) {
      for (var i=0; i<response.forecasts.length; i++) {
        var period = response.forecasts[i]
        if (period.day) {
          weatherData.addPeriod({
            'startTime': period.day.fcst_valid * 1000,
            'weather': getWeatherFromIcon(period.day.icon_code),
            'forecast': period.day.narrative,
            'high': period.day.temp,
            'low': period.day.temp,
          })
        }
        if (period.night) {
          weatherData.addPeriod({
            'startTime': period.night.fcst_valid * 1000,
            'weather': getWeatherFromIcon(period.night.icon_code),
            'forecast': period.night.narrative,
            'high': period.night.temp,
            'low': period.night.temp,
          })
        }
      }
      if (--callbacksPending === 0) onSuccess(weatherData)
    })

    var url = 'https://api.weather.com/v3/alerts/headlines?format=json&language=en-US&apiKey=' + apikey
    httpGet(url + '&geocode=' + coords.latitude + ',' + coords.longitude, 'fetch active weather alerts', function(error) {
      if (error.includes('204')) {
        if (--callbacksPending === 0) onSuccess(weatherData)
      } else {
        onError(error)
      }
    }, function(response) {
      url = url.replace('/headlines?', '/detail?')
      httpGet(url + '&alertId=' + response.alerts[0].detailKey, 'fetch active weather alerts', onError, function(response) {
        weatherData.setAlert(response.alertDetail.eventDescription, response.alertDetail.texts[0].description)
        if (--callbacksPending === 0) onSuccess(weatherData)
      })
    })
  })
}

})

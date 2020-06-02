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

window.USApi = {}

/* Returned data format
[
  { // today (monday,
  e.g.)
    temp: 0,
    weather: WEATHER_CLEAR
  },{
    // tomorrow (tuesday)
    high: 10,
    low: 0,
    weather: WEATHER_CLEAR
  },{
    // wednesday
    high: 10,
    low: 0,
    weather: WEATHER_CLEAR
  },{
    // thursday
    high: 10,
    low: 0,
    weather: WEATHER_CLEAR
  },{
    // friday
    high: 10,
    low: 0,
    weather: WEATHER_CLEAR
  }
]
*/
USApi.getWeather = function(callback) {
  // Try to load URLs from memory
  if (this.hourlyForecastUrl && this.forecastUrl) {
    console.log('Loaded URLs from memory')
    getWeatherInternal(callback)
    return
  }

  // Else, fall back to local storage
  // TODO: Expire this somehow? Detect location change? Probably easiest to have a timeout -- monthly? Grid squares are big.
  window.getLocal('urls', function(urls) {
    if (urls) {
      var parts = urls.split('|')
      this.hourlyForecastUrl = parts[0]
      this.forecastUrl = parts[1]
      console.log('Loaded URLs from chrome storage')
      getWeatherInternal(callback)
      return
    }

    // Else local storage is empty, look up URLs based on user location
    // TODO: Allow user to specify in some way?
    function getLatitudeAndLongitude(callback) {
      if (false /*navigator.geolocation*/) {
        navigator.geolocation.getCurrentPosition(function(position) {
          // User accepted, use provided coordinates
          callback(position.coords.latitude, position.coords.longitude)
        }, function(error) {
          // User declined, or some other error -- use IP address
          httpGet('https://ipapi.co/json', function(response) {
            callback(response.latitude, response.longitude)
          })
        })
      } else {
        // API not supported, use IP address
        httpGet('https://ipapi.co/json', function(response) {
          callback(response.latitude, response.longitude)
        })
      }
    }
    
    getLatitudeAndLongitude(function(latitude, longitude) {
      httpGet('https://api.weather.gov/points/' + latitude + ',' + longitude, function(response) {
        this.hourlyForecastUrl = response.properties.forecastHourly
        this.forecastUrl = response.properties.forecast
        console.log('Fetched URLs via latitude, longitude')
        window.setLocal('urls', hourlyForecastUrl + '|' + forecastUrl)
        getWeatherInternal(callback)
      })
    })
  })
}

function getWeatherInternal(callback) {
  var weatherData = [{}, {}, {}, {}, {}]
  var callbacksPending = 2

  httpGet(this.hourlyForecastUrl, function(response) {
    callbacksPending--
    var period = response.properties.periods[0]
    weatherData[0]['temp'] = period.temperature
    weatherData[0]['weather'] = getWeatherFromIcon(period.icon)
    if (callbacksPending == 0) callback(weatherData)
  })

  httpGet(this.forecastUrl, function(response) {
    callbacksPending--
    var day = 1
    for (var i=0; i<response.properties.periods.length && day<5; i++) {
      // Skip periods until we find the start of a day (6 AM).
      // This ensures that we will always have a high and a low for the given period,
      // and it avoids duplicating info for the current day.
      var startDate = new Date(response.properties.periods[i].startTime)
      if (startDate.getHours() != 6) continue 

      weatherData[day]['high'] = response.properties.periods[i].temperature
      weatherData[day]['low'] = response.properties.periods[i+1].temperature
      weatherData[day]['weather'] = getWeatherFromIcon(response.properties.periods[i].icon)
      day++
    }
    if (callbacksPending == 0) callback(weatherData)
  })
}

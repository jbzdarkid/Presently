namespace(function() {

function onSunriseError(error) {
  document.getElementById('sunriseSunset').style.display = 'none'
  document.getElementById('placeName').innerText = error
}

window.showSettings = function() {
  window.getSunriseSunset(onSunriseError)

  // Fade out the main container, and prepare the settings container for display
  document.getElementById('main').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('settings').style.animation = null
  document.getElementById('closeSettings').onclick = null

  setTimeout(function() {
    // Hide the main container, and fade in the settings container
    document.getElementById('main').style.display = 'none'
    document.getElementById('settings').style.display = 'flex'
    document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards'
  }, 500)

  setTimeout(function() {
    // Reset the animation so that it can play again next time
    document.getElementById('settings').style.animation = null
    document.getElementById('closeSettings').onclick = hideSettings
    document.onkeydown = function(event) {
      if (event.key === 'Escape') hideSettings()
    }
  }, 1000)
}

function hideSettings() {
  // Fade out the settings container, and prepare the settings container for display
  document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('main').style.animation = null
  document.getElementById('settingsButton').onclick = null
  document.onkeydown = null

  setTimeout(function() {
    // Hide the settings container, and fade in the main container
    document.getElementById('settings').style.display = 'none'
    document.getElementById('main').style.display = 'flex'
    document.getElementById('main').style.animation = 'fadeIn 500ms 1 forwards'
  }, 500)

  setTimeout(function() {
    // Reset the animation so that it can play again next time
    document.getElementById('main').style.animation = null
    document.getElementById('settingsButton').onclick = showSettings
  }, 1000)
}

window.loadSettings = function(callback) {
  for (var input of document.getElementsByTagName('input')) {
    if (input.id === 'Latitude' || input.id === 'Longitude') {
      input.onchange = userChangedCoords
    } else if (input.id == 'API-Key-Value') {
      // Do nothing, onchange functionality depends on the active API
    } else {
      input.onchange = settingsChanged
    }
  }
  document.getElementById('settingsButton').onclick = showSettings
  document.getElementById('closeSettings').onclick = hideSettings
  document.getElementById('refreshLocation').onclick = function() {
    window.setLocal('coords', null) // When the user asks for a refresh, we clear the coordinates.
    window.requestLocation(onSunriseError)
  }

  var pendingSettings = 0

  pendingSettings++
  window.getRemote('settings-Temperature', function(value) {
    if (value == null) value = 'Temperature-Fahrenheit'
    document.getElementById(value).checked = true
    window.displayNeedsUpdate = true
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-Hours', function(value) {
    if (value == null) value = 'Hours-12'
    document.getElementById(value).checked = true
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-Seconds', function(value) {
    if (value == null) value = 'Seconds-On'
    document.getElementById(value).checked = true
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-Text', function(value) {
    if (value == null) value = 'Text-Light'
    document.getElementById(value).checked = true
    if (value == 'Text-Light') {
      document.body.style.color = 'rgba(255, 255, 255, 0.7)'
    } else {
      document.body.style.color = 'rgba(0,   0,   0,   0.6)'
    }
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-Color', function(color) {
    if (color == null) color = '4242BA'
    var themes = ['222222', 'E5E5E5', '5CBF94', '84C0D7', '903D3D', 'D2AB59', '6FB269', '6C5287', '3193A5', 'C34D40', '4242BA', '2E3C56', 'E59C2F', '412F3F', 'EA724C', '5C2533', '2D442F', '8DD397']
    for (var theme of themes) {
      var div = document.createElement('div')
      document.getElementById('Theme').appendChild(div)
      div.style = 'width: 100px; height: 100px; float: left'
      div.style.backgroundColor = '#' + theme
      div.style.cursor = 'pointer'
      div.id = theme
      div.onclick = function() {
        document.body.style.backgroundColor = '#' + this.id
        window.reparent(document.getElementById('ThemeCheck'), this)
        document.getElementById('ThemeCheck').alt = 'Selected Theme: #' + this.id
        settingsChanged()
      }
      if (theme == color) {
        document.body.style.backgroundColor = '#' + theme
        window.reparent(document.getElementById('ThemeCheck'), div)
      }
    }
    // Save the theme to avoid a flash during page load
    window.localStorage['settings-Color'] = color
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-TodayForecast', function(value) {
    if (value == null) value = 'TodayForecast-Noon'
    document.getElementById('TodayForecast').value = value
    if (--pendingSettings === 0) callback()
  })

  pendingSettings++
  window.getRemote('settings-API', function(api) {
    if (api == null) {
      api = 'USApi'
      window.setRemote('settings-API', api)
    }
    setApi(api)

    document.getElementById('API-Choice').value = api
    if (--pendingSettings === 0) callback()
  })

  document.getElementById('API-Choice').onchange = function() {
    var api = this.value
    setApi(api)
    window.setRemote('settings-API', api)
    // When you select a new API, we need to start a timeout to fetch new API data (whether or not the API key changed).
    // Obviously, if the user starts typing in the API key field, we cancel that.
    window.clearTimeout(apiKeyTimeout)
    apiKeyTimeout = window.setTimeout(function() {
      console.log('API changed to ' + api + ' changed, expiring weather data.')
      window.setLocal('weatherExpires', 0)
    }, 5000)
  }

  document.getElementById('TodayForecast').onchange = function() {
    window.setRemote('settings-TodayForecast', this.value)
    window.displayNeedsUpdate = true
  }
}

window.getSunriseSunset = function(onError, onSuccess) {
  if (window.coords == null) return
  window.weatherApi.getLocationData(window.coords, onError, function(timezone, tzOffset, placeName) {
    document.getElementById('sunriseSunset').style.display = null

    var sunCalc = SunCalc.getTimes(new Date(), window.coords.latitude, window.coords.longitude)
    var options = {
      timeZone: timezone ? timezone : 'UTC',
      timeStyle: 'short',
      hour12: document.getElementById('Hours-12').checked
    }
    if (tzOffset) {
       // Some APIs return an tzOffset in seconds instead of a timezone name. As such, we need to adjust the time directly.
      sunCalc.sunrise.setSeconds(sunCalc.sunrise.getSeconds() + tzOffset)
      sunCalc.sunset.setSeconds(sunCalc.sunset.getSeconds() + tzOffset)
    }
    document.getElementById('Sunrise').innerText = sunCalc.sunrise.toLocaleString('en-US', options)
    document.getElementById('Sunset').innerText = sunCalc.sunset.toLocaleString('en-US', options)
    document.getElementById('placeName').innerText = placeName
    // Round to 3 decimal places. From https://stackoverflow.com/a/11832950
    document.getElementById('Latitude').value = Math.round((window.coords.latitude + Number.EPSILON) * 1000) / 1000
    document.getElementById('Longitude').value = Math.round((window.coords.longitude + Number.EPSILON) * 1000) / 1000

    if (onSuccess) onSuccess(placeName)
  })
}

function settingsChanged() {
  if (document.getElementById('Temperature-Fahrenheit').checked) {
    window.setRemote('settings-Temperature', 'Temperature-Fahrenheit')
  } else {
    window.setRemote('settings-Temperature', 'Temperature-Celsius')
  }

  if (document.getElementById('Hours-12').checked) {
    window.setRemote('settings-Hours', 'Hours-12')
  } else {
    window.setRemote('settings-Hours', 'Hours-24')
  }

  if (document.getElementById('Seconds-On').checked) {
    window.setRemote('settings-Seconds', 'Seconds-On')
  } else {
    window.setRemote('settings-Seconds', 'Seconds-Off')
  }

  if (document.getElementById('Text-Light').checked) {
    window.setRemote('settings-Text', 'Text-Light')
    document.body.style.color = 'rgba(255, 255, 255, 0.7)'
  } else {
    window.setRemote('settings-Text', 'Text-Dark')
    document.body.style.color = 'rgba(0,   0,   0,   0.6)'
  }

  var color = document.getElementById('ThemeCheck').parentElement.id
  window.setRemote('settings-Color', color)
  // Save the theme to avoid a flash during page load
  window.localStorage['settings-Color'] = color

  window.displayNeedsUpdate = true
}

var userSettingsTimeout = null
function userChangedCoords() {
  // Users take time to type, so we only update the coordinates if there's been no input for 3 seconds.
  // Also, we disable the auto-location change, and show a loading message in the meantime.
  document.getElementById('sunriseSunset').style.display = 'none'
  document.getElementById('placeName').innerText = 'Loading...'
  document.getElementById('refreshLocation').disabled = true

  window.clearTimeout(userSettingsTimeout)
  userSettingsTimeout = window.setTimeout(function() {
    document.getElementById('refreshLocation').disabled = false
    window.coordsChanged(onSunriseError, {
      'latitude': parseFloat(document.getElementById('Latitude').value),
      'longitude': parseFloat(document.getElementById('Longitude').value),
    })
  }, 3000)
}

var apiKeyTimeout = null
function setApi(api) {
  var keyName = ''
  if (api == 'IBMApi') {
    window.weatherApi = window.IBMApi
    keyName = 'weather-com-apikey'
  } else if (api == 'OWMApi') {
    window.weatherApi = window.OWMApi
    keyName = 'open-weathermap-apikey'
  } else if (api == 'WBApi') {
    window.weatherApi = window.WBApi
    keyName = 'weatherbit-apikey'
  } else if (api == 'USApi') {
    window.weatherApi = window.USApi
  } else {
    debugger
  }

  if (api == 'USApi') { // The US API does not require an API key
    document.getElementById('API-Key').style.display = 'none'
  } else {
    document.getElementById('API-Key').style.display = null
    window.getRemote(keyName, function(result) {
      document.getElementById('API-Key-Value').value = result ? result : ''

      document.getElementById('API-Key-Value').oninput = function() {
        window.clearTimeout(apiKeyTimeout)
        apiKeyTimeout = window.setTimeout(function() {
          window.setRemote(keyName, document.getElementById('API-Key-Value').value)
          console.log('API key for ' + api + ' changed, expiring weather data.')
          window.setLocal('weatherExpires', 0)
        }, 500)
      }
    })
  }
}

})

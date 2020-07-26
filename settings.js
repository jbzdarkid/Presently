namespace(function() {

function showSettings() {
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
    document.onkeydown = function(event) {if (event.key === 'Escape') hideSettings()}
  }, 1000)
}

function hideSettings() {
  // Fade out the settings container, and prepare the settings container for display
  document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('main').style.animation = null
  document.getElementById('settingsButton').onclick = null
  document.onkeydown = undefined

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

document.addEventListener('DOMContentLoaded', function() {
  if (document.location.search == '?settings') {
    showSettings()
  }

  for (var input of document.getElementsByTagName('input')) {
    input.onchange = settingsChanged
  }
  document.getElementById('settingsButton').onclick = showSettings
  document.getElementById('closeSettings').onclick = hideSettings
  document.getElementById('refreshLocation').onclick = refreshLocation

  window.getRemote('settings-Temperature', function(value) {
    if (value == undefined) value = 'Temperature-Fahrenheit'
    document.getElementById(value).checked = true
    displayNeedsUpdate = true
    updateWeather()
  })

  window.getRemote('settings-Hours', function(value) {
    if (value == undefined) value = 'Hours-12'
    document.getElementById(value).checked = true
    // Will auto-update next time step
  })

  window.getRemote('settings-Seconds', function(value) {
    if (value == undefined) value = 'Seconds-On'
    document.getElementById(value).checked = true
    // Will auto-update next time step
  })

  window.getRemote('settings-Text', function(value) {
    if (value == undefined) value = 'Text-Light'
    document.getElementById(value).checked = true
    if (value == 'Text-Light') {
      document.body.style.color = 'rgba(255, 255, 255, 0.7)'
    } else {
      document.body.style.color = 'rgba(0, 0, 0, 0.6)'
    }
  })

  window.getLatitudeLongitude(function(error) {
    document.getElementById('sunriseSunset').style.display = 'none'
    document.getElementById('placeName').innerText = error
  }, function(latitude, longitude) {
    document.getElementById('Latitude').value = latitude
    document.getElementById('Longitude').value = longitude
  })

  window.getRemote('settings-Color', function(color) {
    if (color == undefined) color = '4242BA'
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
  })
})

function refreshLocation() {
  window.requestLatitudeLongitude(function(error) {
    document.getElementById('sunriseSunset').style.display = 'none'
    document.getElementById('placeName').innerText = error
  }, function(latitude, longitude) {
    onUpdateLatitudeLongitude(latitude, longitude, null)
  })
}

window.settingsChanged = function() {
  if (document.getElementById('Temperature-Fahrenheit').checked) {
    window.setRemote('settings-Temperature', 'Temperature-Fahrenheit')
  } else {
    window.setRemote('settings-Temperature', 'Temperature-Celsius')
  }
  displayNeedsUpdate = true
  updateWeather()

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
    document.body.style.color = 'rgba(0, 0, 0, 0.6)'
  }

  onUpdateLatitudeLongitude(document.getElementById('Latitude').value, document.getElementById('Longitude').value, function(latitude, longitude) {
    // Forcibly expire the weather data, so that we have to request new weather for the new location.
    window.setLocal('weatherExpires', 0)
  })

  var color = document.getElementById('ThemeCheck').parentElement.id
  window.setRemote('settings-Color', color)
}

})

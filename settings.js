namespace(function() {

function showSettings() {
  // Fade out the main container, and prepare the settings container for display
  document.getElementById('main').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('settings').style.animation = null
  document.getElementById('settingsButton').onclick = null

  setTimeout(function() {
    // Hide the main container, and fade in the settings container
    document.getElementById('main').style.display = 'none'
    document.getElementById('settings').style.display = 'flex'
    document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards'
  }, 500)

  setTimeout(function() {
    // Reset the animation so that it can play again next time
    document.getElementById('settings').style.animation = null
    document.getElementById('settingsButton').onclick = hideSettings
  }, 1000)
}

function hideSettings() {
  // Fade out the settings container, and prepare the settings container for display
  document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('main').style.animation = null
  document.getElementById('settingsButton').onclick = null

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
  document.getElementById('refreshLocation').onclick = refreshLocation

  window.getRemote('settings-Temperature', function(value) {
    if (value == undefined) value = 'Temperature-Farenheit'
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

  window.getLocal('latitude', function(latitude) {
    window.getLocal('longitude', function(longitude) {
      if (latitude == undefined || longitude == undefined) return
      document.getElementById('Latitude').value = window.round(latitude, 3)
      document.getElementById('Longitude').value = window.round(longitude, 3)
    })
  })

  window.getRemote('settings-Color', function(color) {
    if (color == undefined) color = 'E5E5E5'
    var themeBox = document.getElementById('Theme')
    var themes = ['222222', 'E5E5E5', '5CBF94', '84C0D7', '903D3D', 'D2AB59', '6FB269', '6C5287', '3193A5', 'C34D40', '4242BA', '2E3C56', 'E59C2F', '412F3F', 'EA724C', '5C2533', '2D442F', '8DD397']
    for (var theme of themes) {
      var div = document.createElement('div')
      themeBox.appendChild(div)
      div.style = 'width: 100px; height: 100px; float: left'
      div.style.backgroundColor = '#' + theme
      div.style.cursor = 'pointer'
      div.id = theme
      div.onclick = function() {
        window.setRemote('settings-Color', this.id)
        document.body.style.backgroundColor = '#' + this.id
        // Set checkbox somehow
        settingsChanged()
      }
      if (theme == color) {
        document.body.style.backgroundColor = '#' + theme
      }
    }
  })
})

function refreshLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log('Determined lat/long from browser')
    document.getElementById('Latitude').value = window.round(position.coords.latitude, 3)
    document.getElementById('Longitude').value = window.round(position.coords.longitude, 3)
    settingsChanged()
  }, function() {
    httpGet('https://ipapi.co/json', function(response) {
      console.log('Determined lat/long from ip address')
      document.getElementById('Latitude').value = window.round(response.latitude, 3)
      document.getElementById('Longitude').value = window.round(response.longitude, 3)
      settingsChanged()
    })
  })
}

window.settingsChanged = function() {
  if (document.getElementById('Temperature-Farenheit').checked) {
    window.setRemote('settings-Temperature', 'Temperature-Farenheit')
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

  window.setLocal('latitude', document.getElementById('Latitude').value)
  window.setLocal('longitude', document.getElementById('Longitude').value)
}

})

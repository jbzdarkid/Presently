namespace(function() {

function showSettings() {
  // Fade out the main container, and prepare the settings container for display
  document.getElementById('main').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('settings').style.animation = null
  document.getElementById('settings-button').onclick = null

  setTimeout(function() {
    // Hide the main container, and fade in the settings container
    document.getElementById('main').style.display = 'none'
    document.getElementById('settings').style.display = 'flex'
    document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards'
  }, 500)

  setTimeout(function() {
    // Reset the animation so that it can play again next time
    document.getElementById('settings').style.animation = null
    document.getElementById('settings-button').onclick = hideSettings
  }, 1000)
}

function hideSettings() {
  // Fade out the settings container, and prepare the settings container for display
  document.getElementById('settings').style.animation = 'fadeIn 500ms 1 forwards reverse'
  document.getElementById('main').style.animation = null
  document.getElementById('settings-button').onclick = null

  setTimeout(function() {
    // Hide the settings container, and fade in the main container
    document.getElementById('settings').style.display = 'none'
    document.getElementById('main').style.display = 'flex'
    document.getElementById('main').style.animation = 'fadeIn 500ms 1 forwards'
  }, 500)

  setTimeout(function() {
    // Reset the animation so that it can play again next time
    document.getElementById('main').style.animation = null
    document.getElementById('settings-button').onclick = showSettings
  }, 1000)
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
  if (document.location.search == '?settings') {
    showSettings()
  }
  document.getElementById('settings-button').onclick = showSettings

  for (var input of document.getElementsByTagName('input')) {
    input.onchange = settingsChanged
  }

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
  })

  window.getRemote('settings-Seconds', function(value) {
    if (value == undefined) value = 'Seconds-On'
    document.getElementById(value).checked = true
  })

  window.getRemote('latitude', function(value) {
    if (value == undefined) return
    document.getElementById('Latitude').value = value
  })

  window.getRemote('longitude', function(value) {
    if (value == undefined) return
    document.getElementById('Longitude').value = value
  })
})

function refreshLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log('Determined lat/long from browser')
    document.getElementById('Latitude').value = position.coords.latitude
    document.getElementById('Longitude').value = position.coords.longitude
    settingsChanged()
  }, function() {
    httpGet('https://ipapi.co/json', function(response) {
      console.log('Determined lat/long from ip address')
      document.getElementById('Latitude').value = response.latitude
      document.getElementById('Longitude').value = response.longitude
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

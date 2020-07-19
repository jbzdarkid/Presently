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
  addSetting("Temperature", "Farenheit", "Celsius")
  addSetting("Hours", "12", "24")
  addSetting("Seconds", "On", "Off")

  window.getRemote('units', function(cachedUnits) {
    if (units != null) units = cachedUnits
    displayNeedsUpdate = true
    updateWeather()
  })
})

var units = 'F'
var normalizedUnits = function(degreesF) {
  if (units == 'F') {
    return degreesF
  } else {
    var deg = (parseInt(degreesF) - 32) * 5
    return Math.floor(deg / 9)
  }
}

function addSetting(titleText, option1Text, option2Text) {
  var div = document.createElement('div')
  document.getElementById('settings-list').appendChild(div)

  var title = document.createElement('label')
  div.appendChild(title)
  title.style.fontFamily = 'OpenSans-Bold'
  title.style.fontSize = '32px'
  title.innerText = titleText

  div.appendChild(document.createElement('br'))
  div.appendChild(document.createElement('br'))

  var option1button = document.createElement('input')
  div.appendChild(option1button)
  option1button.name = window.localize(titleText, titleText)
  option1button.type = 'radio'
  option1button.id = titleText + '-' + option1Text
  option1button.onchange = function() {
    window.setRemote('settings-' + titleText, option1Text)
  }

  var option1label = document.createElement('label')
  div.appendChild(option1label)
  option1label.for = option1button.id
  option1label.innerText = window.localize(option1Text, option1Text)
  option1label.style.fontFamily = 'OpenSans-Light'
  option1label.style.fontSize = '20px'

  var option2button = document.createElement('input')
  div.appendChild(option2button)
  option2button.name = titleText
  option2button.type = 'radio'
  option2button.id = titleText + '-' + option2Text
  option2button.onchange = function() {
    window.setRemote('settings-' + titleText, option2Text)
  }

  var option2label = document.createElement('label')
  div.appendChild(option2label)
  option2label.for = option2button.id
  option2label.innerText = window.localize(option2Text, option2Text)
  option2label.style.fontFamily = 'OpenSans-Light'
  option2label.style.fontSize = '20px'

  window.getRemote('settings-' + titleText, function(value) {
    if (value == undefined || value == option1Text) {
      option1button.checked = true
    } else {
      option2button.checked = true
    }
  })
}

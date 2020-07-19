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

// Load settings
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

function addSetting(titleText, option1Text, option2Text) {
  var div = document.createElement('div')
  document.getElementById('settings-list-placeholder').appendChild(div)

  var title = document.createElement('label')
  div.appendChild(title)
  title.style.fontFamily = 'OpenSans-Bold'
  title.style.fontSize = '32px'
  title.innerText = titleText

  div.appendChild(document.createElement('br'))

  var option1button = document.createElement('input')
  div.appendChild(option1button)
  option1button.name = titleText
  option1button.type = 'radio'
  option1button.id = titleText + '-' + option1Text

  var option1label = document.createElement('label')
  div.appendChild(option1label)
  option1label.for = option1button.id
  option1label.innerText = option1Text
  option1label.style.fontFamily = 'OpenSans-Light'
  option1label.style.fontSize = '20px'

  var option2button = document.createElement('input')
  div.appendChild(option2button)
  option2button.name = titleText
  option2button.type = 'radio'
  option2button.id = titleText + '-' + option2Text

  var option2label = document.createElement('label')
  div.appendChild(option2label)
  option2label.for = option2button.id
  option2label.innerText = option2Text
  option2label.style.fontFamily = 'OpenSans-Light'
  option2label.style.fontSize = '20px'
}

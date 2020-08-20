namespace(function() {

window.coords = null
window.coordsChanged = function(coords, onError) {
  if (window.coords == coords) return

  // If this is the first time we set the coords since page load, it's not a legitimate location change.
  // However, we still want to get location data, so that we can populate the settings page.
  var isRealLocationChange = (window.coords != null)
  window.coords = coords
  window.setLocal('coords', coords)

  window.weatherApi.getLocationData(coords, onError, function(timezone, placeName) {
    document.getElementById('sunriseSunset').style.display = null

    var sunCalc = SunCalc.getTimes(new Date(), coords.latitude, coords.longitude)
    var options = {timeZone: timezone, timeStyle: 'short', hour12: document.getElementById('Hours-12').checked}
    document.getElementById('Sunrise').innerText = sunCalc.sunrise.toLocaleString('en-US', options)
    document.getElementById('Sunset').innerText = sunCalc.sunset.toLocaleString('en-US', options)
    document.getElementById('placeName').innerText = placeName
    // Round to 3 decimal places. From https://stackoverflow.com/a/11832950
    document.getElementById('Latitude').value = Math.round((coords.latitude + Number.EPSILON) * 1000) / 1000
    document.getElementById('Longitude').value = Math.round((coords.longitude + Number.EPSILON) * 1000) / 1000

    if (isRealLocationChange) {
      console.log('Location changed to ' + placeName + ', fetching new weather.')
      window.setLocal('weatherExpires', 0)
    }
  })
}

window.requestLocation = function(onError, onSuccess) {
  window.getLocal('coords', function(coords) {
    if (coords) {
      window.coordsChanged(coords, onError)
      if (onSuccess) onSuccess(coords)
      return
    }

    navigator.geolocation.getCurrentPosition(function(position) {
      window.coordsChanged(position.coords, onError)
      if (onSuccess) onSuccess(position.coords)
    }, function() {
      httpGet('https://ipapi.co/json', 'discover your location', function(error) {
        onError(error)
      }, function(coords) {
        window.coordsChanged(coords, onError)
        if (onSuccess) onSuccess(coords)
      })
    })
  })
}

})
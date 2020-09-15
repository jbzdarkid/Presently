namespace(function() {

window.coords = null
window.coordsChanged = function(onError, coords) {
  if (window.coords == coords) return

  // If this is the first time we set the coords since page load, it's not a legitimate location change.
  // However, we still want to get location data, so that we can populate the settings page.
  var isRealLocationChange = (window.coords != null)
  window.coords = coords
  window.setLocal('coords', coords)

  window.getSunriseSunset(onError, function(placeName) {
    if (isRealLocationChange) {
      console.log('Location changed to "' + placeName + '", expiring weather data.')
      window.setLocal('weatherExpires', 0)
    }
  })
}

window.requestLocation = function(onError, onSuccess) {
  window.getLocal('coords', function(coords) {
    if (coords) {
      window.coordsChanged(onError, coords)
      if (onSuccess) onSuccess(coords)
      return
    }

    navigator.geolocation.getCurrentPosition(function(position) {
      var coords = {'latitude': position.coords.latitude, 'longitude': position.coords.longitude}
      window.coordsChanged(onError, coords)
      if (onSuccess) onSuccess(coords)
    }, function() {
      httpGet('https://ipapi.co/json', 'discover your location', onError, function(position) {
        var coords = {'latitude': position.latitude, 'longitude': position.longitude}
        window.coordsChanged(onError, coords)
        if (onSuccess) onSuccess(coords)
      })
    })
  })
}

})
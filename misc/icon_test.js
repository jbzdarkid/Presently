var index = 40
function randomWeather() {
  var icons = [
    '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*',
    '+', ',', '-', '.', '/', '0', '1', '2', '3', '4',
    '5', '6', '7', '8', '9', ':', ';', '<', '=', '>',
    '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'h', 'i', 'j'
  ]
  var icon = icons[index]
  // var icon = icons[Math.floor(Math.random() * icons.length)]
  return [icon, icon, '']
}

function foo(id, size) {
  var elem = document.getElementById('forecast-' + id).firstChild

  var newElem = Climacon(randomWeather(), size)
  newElem.id = id
  elem.parentElement.replaceChild(newElem, elem)
}

function randomizeIcons() {
  foo('0', 180)
  foo('1', 100)
  foo('2', 100)
  foo('3', 100)
  foo('4', 100)
}

function bar(id) {
  var box = document.getElementById('forecast-' + id).getBoundingClientRect()

  var div = document.createElement('div')
  document.body.appendChild(div)
  div.className = 'bar'
  div.style.position = 'absolute'
  div.style.left = box.left + 'px'
  div.style.top = box.top + 'px'
  div.style.width = box.width + 'px'
  div.style.height = box.height + 'px'
  div.style.backgroundColor = 'red'
  div.style.opacity = 0.5

  var lineWidth = 70

  var hline = document.createElement('div')
  document.body.appendChild(hline)
  hline.className = 'bar'
  hline.style.position = 'absolute'
  hline.style.left = box.left + 'px'
  hline.style.top = (box.top + box.bottom - lineWidth) / 2 + 'px'
  hline.style.width = box.width + 'px'
  hline.style.height = lineWidth + 'px'
  hline.style.backgroundColor = 'blue'
  hline.style.opacity = 0.5

  var vline = document.createElement('div')
  document.body.appendChild(vline)
  vline.className = 'bar'
  vline.style.position = 'absolute'
  vline.style.left = (box.left + box.right - lineWidth) / 2 + 'px'
  vline.style.top = box.top + 'px'
  vline.style.width = lineWidth + 'px'
  vline.style.height = box.height + 'px'
  vline.style.backgroundColor = 'blue'
  vline.style.opacity = 0.5
}

function baz() {
  randomizeIcons()
  while (document.getElementsByClassName('bar').length > 0) {
    var elem = document.getElementsByClassName('bar')[0]
    elem.parentElement.removeChild(elem)
  }
  bar('1')
  index++
  setTimeout(baz, 1000)
}

window.onload = function() {
  setTimeout(baz, 2000)
}

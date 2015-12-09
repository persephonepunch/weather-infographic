$(function() {
  var uuid = pubnub.uuid();
  var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
  });
  var map = L.map('map', {zoomControl: false}).addLayer(mapboxTiles).setView([0, 50], 2);
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();


  var places = [];
  var allMarkers = [];
  var colorCold = '004BA8';
  var colorHot = 'D7263D';

  L.Map = L.Map.extend({
    openPopup: function(popup) {
      this._popup = popup;
      return this.addLayer(popup).fire('popupopen', {
        popup: this._popup
      });
    }
  });

  function colorLuminance(hex, lum) {
    lum = lum || 0;
    var rgb = "#",
    c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i * 2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
      rgb += ("00" + c).substr(c.length);
    }
    return rgb;
  }


  function getPopup(message) {
    var template = $('#popup').html();
    var timeZoneId = message.timeZoneId;
    var info = {
      sunrise: moment(message.sunrise).tz(timeZoneId).format('hh:mm:ss A'),
      sunset: moment(message.sunset).tz(timeZoneId).format('hh:mm:ss A'),
      time: moment().tz(timeZoneId).format('HH:mm:ss'),
      temperature: Math.floor(message.temperature - 273.15).toString() + ' \xB0 C',
      summary: message.description
    }
    return Mustache.render(template, info);
  }

  function getMarker(place) {
    var template = $('#map-marker').html();
    var weather = {
      place: place.place,
      humidity: place.humidity,
      weather: place.icon,
      tempColor: getTempColor(place.temperature)
    };

    place.wind >= 11 ? weather.wind = 'windHigh' : weather.wind = 'wind';
    place.icon.indexOf('n') > -1 ? weather.backgroundColor = 'rgba(0, 0, 0, 0.2)' : weather.backgroundColor = 'rgba(252, 246, 177, 0.6)';
    return Mustache.render(template, weather);
  }

  // specify popup options 
  var popupOptions = {
    'maxWidth': '300',
    'className': 'custom'
  };

  function refreshView() {
    allMarkers.forEach(function(marker) {
      map.removeLayer(marker);
    })
    allMarkers = [];
    places.forEach(function(place) {
      var infoLayer = L.marker(place.coordinates, {
        icon: getIcon(place)
      }).bindPopup(getPopup(place), popupOptions).addTo(map);
      allMarkers.push(infoLayer)
    });
  }

  var sampleMarker = {
    place: "San Francisco",
    sunrise: "2015-11-11T00:46:56+00:00",
    sunset: "2015-11-11T12:21:07+00:00",
    temperature: 294.584,
    timeZoneId: "Asia/Calcutta",
    icon: "50n",
    wind: 12,
    humidity: 70  
  }

  function getTempColor(temperature) {
    tempCelsius = temperature - 273.15
    if (tempCelsius < 0) {
      return 0;
    }

    return tempCelsius > 25 ? colorLuminance(colorHot, (tempCelsius - 25) / 25) : colorLuminance(colorCold, tempCelsius / 25)
  }

  function getIcon(place) {
    return L.divIcon({
      className: 'div-icon',
      iconSize: [35, 35],
      html: getMarker(place)
    });
  }
  //L.marker([45, 45], {icon: getIcon(sampleMarker)}).bindPopup(getPopup(sampleMarker), popupOptions).addTo(map);

  window.setInterval(refreshView, 5000)

  function pub() {
    console.log("publishing")
    pubnub.publish({
      channel: "wnPutTime",
      message: {
        'uuid': uuid
      },
      callback: function(m) {
        console.log(m)
      }
    })
  }



  pubnub.subscribe({
    channel: 'wnGet',
    message: function(message, env, ch, timer, magic_ch) {
      console.log(message);
      places = message
    }, 
    connect: pub,
    error: function(err) {
      console.log(err)
    }
  });  
})

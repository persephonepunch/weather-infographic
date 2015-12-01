$(function() {
  var pubnub = PUBNUB({ publish_key   : 'demo',
    subscribe_key : 'demo'}); 
  L.mapbox.accessToken = 'accessToken';
  var uuid = pubnub.uuid();
  var geoCoderControlEvents = ['error', 'select', 'autoselect'];  
  var geocoderControl = L.mapbox.geocoderControl('mapbox.places', { keepOpen: true, autocomplete: true, position: "bottomright", promximity: false });
  var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.pirates/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, { attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'});
  var map = L.map('map').addLayer(mapboxTiles).setView([0, 50], 2).addControl(geocoderControl);
  var icons = {"01": 'clear', "02": 'cloudy', "03": 'cloudy', "04": 'cloudy', "09": 'thunder', "10":'thunder', "11": 'thunder', "13": 'thunder', "50": 'thunder'}
  var places = [];
  var allMarkers = [];  

  L.Map = L.Map.extend({
    openPopup: function(popup) {        
     this._popup = popup;
     return this.addLayer(popup).fire('popupopen', {
      popup: this._popup
    });
   }
 });

  function getPopupTemplate(message) {
    var coord = message.coordinates;
    var timeZoneId = message.timeZoneId;
    var sunrise = message.sunrise;
    var sunset = message.sunset;
    var temperature = message.temperature;
    var summary = message.description;    
    var sunriseTemplate = '<li><img width="20px" src="assets/sunrise.png"/>'+' '+moment(sunrise).tz(timeZoneId).format('hh:mm:ss A')+'</li>';
    var sunsetTemplate = '<li><img width="20px" src="assets/sunset.png"/>'+moment(sunset).tz(timeZoneId).format('hh:mm:ss A')+'</li>';
    var timeTemplate = '<li><img width="15px" src="assets/time.png"/>'+moment().tz(timeZoneId).format('HH:mm:ss')+'</li>';
    var tempTemplate = '<li><img width="20px" src="assets/temperature.png"/>'+(Math.floor(temperature - 273.15)).toString()+' \xB0 C'+'</li>';
    var descriptionTemplate = '<li><img width="20px" src="assets/drizzle.png"/>'+summary+'</li>';
    var html = '<ul>'+ timeTemplate + sunriseTemplate + sunsetTemplate + tempTemplate+ descriptionTemplate +'</ul>'
    return html;
  }

  function getMarker(place) {
    var template = $('#map-marker').html();
    var weather = {
      cloud: icons[place.icon.match(/\d+/)[0]],
      place: place.place,
      temp: getTemp(place.temperature),
      humidity: place.humidity,
      weather: place.icon
    };    
    place.wind >= 11 ? weather.wind = 'windHigh' : weather.wind = 'wind';    
    place.icon.indexOf('n') > -1 ? weather.time = 'moon' : weather.time = 'sun';    
    return Mustache.render(template, weather);    
  }

    // specify popup options 
    var popupOptions =  {'maxWidth': '300', 'className' : 'custom'};

    function callback(e) {
    	map.setView([0, 50], 2);			
    	if(e.feature.id.indexOf('place') == -1) {
    		alert('Please select a smaller region');
    	} else {    		
    		pub(e.feature.center, e.feature.text);            
    	}		
    }

    geoCoderControlEvents.forEach(function(event) {
    	geocoderControl.on(event, callback)
    })    

    pubnub.subscribe({
    	channel: uuid,
    	message: function(message, env, ch, timer, magic_ch) {
        console.log(message);
        places.push(message);    		
      }		
    });    

    function refreshView () {        
      allMarkers.forEach(function(marker){
        map.removeLayer(marker);
      })
      allMarkers = [];
      places.forEach(function(place) {
       var infoLayer = L.marker(place.coordinates, {icon: getIcon(place)}).bindPopup(getPopupTemplate(place),popupOptions).addTo(map);
       allMarkers.push(infoLayer)		
     });		
    }

    var pla = {
      place: "San Francisco",
      sunrise: "2015-11-11T00:46:56+00:00",
      sunset: "2015-11-11T12:21:07+00:00",
      temperature: 294.584,
      timeZoneId: "Asia/Calcutta",
      icon: "01n",
      wind: 12,
      humidity: 50 
    }

    function getTemp(temperature) {      
      tempCelsius = temperature - 273.15
      if (tempCelsius < 0) {
        return 0; 
      }
      // On a scale of 0-40
      tempNormalized = Math.floor(tempCelsius*2.5);      
      return tempNormalized > 100 ? 100 : tempNormalized
    }

    function getIcon(place) {
     return L.divIcon({
      className: 'div-icon',
      iconSize: [40,50], 
      html: getMarker(place)
    });   
   }
   L.marker([45, 45], {icon: getIcon(pla)}).addTo(map);

   window.setInterval(refreshView, 5000)

   function pub(coordinates, place) {		
     pubnub.publish({
      channel: "wnPutTime",
      message: {'uuid': uuid, 'coordinates': coordinates, 'place': place},
      callback: function(m) {
       console.log(m)
     }
   })
   };
 })
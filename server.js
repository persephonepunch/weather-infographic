var express = require('express')
var app = express()
var fs = require('fs')
var request = require('superagent')
var gApiToken = process.env.gApiToken
var async = require('async')
var appId = process.env.appId
var cityCoordinates = require('./cities')
var cities = Object.keys(cityCoordinates)
var data
var currentConditions = []
var pubnub = require("pubnub")({
	ssl: true,
	publish_key   : process.env.publish_key,
	subscribe_key : process.env.subscribe_key
});

function refreshData () {
	data = []
	var i=0
	fetch(cities[i], cityCoordinates[cities[i]], i, data)	
}

function fetch (place, coordinates, i, aggregate) {
	// var uuid = message.uuid;	
	async.parallel([
		function(callback) {
			request
			.get('https://maps.googleapis.com/maps/api/timezone/json')
			.query('location='+coordinates[1]+','+coordinates[0])
			.query({timestamp: Math.floor(new Date().getTime()/1000)})
			.query({key: gApiToken})
			.end(function(err, res){			
				if(err) { console.log(err); callback(true); return; }
				obj = res.body;
				callback(false, obj);				
			});
		},
		function(callback){
			request
			.get('http://api.sunrise-sunset.org/json')
			.query({lat:coordinates[1]})
			.query({lng: coordinates[0]})
			.query({formatted: 0})
			.end(function(err, res){
				if(err) { console.log(err); callback(true); return; }
				obj = res.body.results;
				callback(false, obj);				
			})
		},		
		function(callback){
			request
			.get('http://api.openweathermap.org/data/2.5/weather')
			.query({lat:coordinates[1]})
			.query({lon: coordinates[0]})
			.query({APPID: appId})
			.end(function(err, res){
				if(err) { console.log(err); callback(true); return; }
				obj = res.body;
				callback(false, obj);				
			})
		}		
		],
  /*
   * Collate results
   */
   function(err, results) {
   	console.log("Error OR Results", JSON.stringify(err || results));
   	var data = {
   		//'uuid': uuid,
   		'place': place,
   		'coordinates': coordinates.reverse(),
   		'timeZoneId': results[0].timeZoneId,
   		'sunrise': results[1].sunrise,
   		'sunset': results[1].sunset,
   		'temperature': results[2].main.temp,
   		'wind': results[2].wind.speed,
   		'humidity': results[2].main.humidity,
   		'icon': results[2].weather[0].icon,
   		'description': results[2].weather[0].description
   	};
   	
   	if (i == cities.length -1) {
   		aggregate.push(data);   		
   		currentConditions = aggregate
   		pub(currentConditions)
   	}
   	else {
   		++i
   		console.log('fetching city...', i)
   		aggregate.push(data);
   		fetch(cities[i], cityCoordinates[cities[i]], i, aggregate)
   	}
   }
   );
}

refreshData()
setInterval(refreshData, 900000)

pubnub.subscribe({
	channel: "wnPutTime",
	callback: function(message) {		
		pub(currentConditions)
	}
});

function pub(data) {		
	pubnub.publish({
		channel: 'wnGet',
		message: data,
		callback: function(m) {
			console.log(m)
		}, 
		error: function(err) {
			console.log(err)
		}
	})
};

app.use(express.static('public'))
app.listen(process.env.PORT || 3000, function() {
	console.log('Weather Now listening on *:', process.env.PORT || 3000)
})
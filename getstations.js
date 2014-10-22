// Tries to get the users location.
var getLocation = function() {			//Runs the code ASAP
	if (navigator.geolocation) {		//Only runs the code if the browser is able
		navigator.geolocation.getCurrentPosition(function(position){
			coordinates = position.coords.latitude + ',' + position.coords.longitude;
			getStations(coordinates); 	//Invokes the getStation function with the users coordinates
			console.log("Your coordinates: " + coordinates)
		});
	} else { 							//Returns an error mesage if the browser sucks
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
}();

function getStations(coordinates) {		//Uses coordinates to find nearby stations and Google Places API
	$.ajax({
		url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankby=distance',
		data: {
			"key": 'AIzaSyDVw-ruTyNahkP3hx7LcNP8XXHNqr0BSYA',
			"location": coordinates,
			"types": 'train_station',
			"hostname": 'https://maps.googleapis.com',
		},
		dataType: "json",
		type: 'get',

		success: function(data) {
			$("#result").html("");
			var nearbystations = data.results;
			if (nearbystations.length > 0) {
				for (i = 0; i < 2; i++ ) {	//Itterates through nearby stations
					getSiteId(nearbystations[i].name.toLowerCase(),i+1);
					$("#result").append("<div id= \"station" + (i + 1) + "\"></div>"); 
				}
			}
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

function getSiteId(site, number) {		//Finds SiteId using the nearby stations and SL Platsinfo API
	console.log('#' + number + 'running getSiteId for ' + site);
	$.ajax({
		url: 'http://lit-headland-6335.herokuapp.com/api2/typeahead.json',
		data: {
			"key": '93755c16ac8e487096c640ae0327b483',
			"searchstring": site,
			"hostname": 'api.sl.se',
		},
		dataType: "json",
		type: 'get',
						
		success: function(data) {
			console.log('#' + number + 'received data in getSitdeId for ' + site);
			var siteidstation = (data.ResponseData[0].SiteId)
			var stationname = (data.ResponseData[0].Name)
			if (siteidstation.length > 0) {
				getDepartures(siteidstation, stationname, number)
			};
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

function getDepartures(siteid, stationname, number) {		//Uses SiteId to find departures with SL Realtidsinfo API
	console.log('#' + number + 'calling getDepartures ' + siteid);
	$.ajax({
	    url: 'http://lit-headland-6335.herokuapp.com/api2/realtimedepartures.json',
	    data: {
	    	"key": '74b0060de6e2403780e6dfbacada5743',
	    	"siteid": siteid,
	    	"timewindow": 10,
	    	"hostname": 'api.sl.se',
	    },
	    dataType: "json",
	    type: 'get',

		success: function(data) {
			console.log('received data in getDepartures for ' + siteid);
			var metros = data.ResponseData.Metros;
			var trains = data.ResponseData.Trains;
			if (metros.length > 0 || trains.length > 0) {	//Checks it is a metro or train station
				$("#station" + number).append("<h2>" + stationname + "</h2>");
				if (metros.length > 0) {					//Checks if it is a metro station
					$("#station" + number).append("<div class = \"metros\"><div class = \"direction1\"></div><div class = \"direction2\"></div></div>");
					for (j = 0; j < metros.length; j++ ) { 	//Iterates through all departures
						$("#station" + number + " > .metros > .direction" + metros[j].JourneyDirection).append("<li>" + metros[j].Destination + " " + metros[j].DisplayTime + "</li>");
					}
				}
				if (trains.length > 0) {					//Checks if it is a train station
					$("#station" + number).append("<div class = \"trains\"><div class = \"direction1\"></div><div class = \"direction2\"></div></div>");
					for (j = 0; j < trains.length; j++ ) {
						$("#station" + number + " > .trains > .direction" + trains[j].JourneyDirection).append("<li>" + trains[j].Destination + " " + trains[j].DisplayTime + "</li>");
					}
				}
			}
		},
		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

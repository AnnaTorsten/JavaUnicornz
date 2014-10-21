// Tries to get the users location.
var getLocation = function() {			//Runs the code ASAP
	if (navigator.geolocation) {		//Only runs the code if the browser is able
		navigator.geolocation.getCurrentPosition(function(position){
			coordinates = position.coords.latitude + ',' + position.coords.longitude;
			getStations(coordinates); 	//Invokes the getStation function with the users coordinates
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
			"types": 'train_station'
		},
		dataType: "json",
		type: 'get',
		crossDomain: 'true',

		success: function(data) {
			$("#result").html("");
			var nearbystations = data.results;
			if (nearbystations.length > 0) {
				for (i = 0; i < 5; i++ ) {	//Itterates through nearby stations
					getSiteId(nearbystations[i].name);
				}
			}
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

function getSiteId(site) {				//Finds SiteId using the nearby stations and SL Platsinfo API
	$.ajax({
		url: 'http://api.sl.se/api2/typeahead.json',
		data: {
			"key": '93755c16ac8e487096c640ae0327b483',
			"searchstring": site
		},
		dataType: "json",
		type: 'get',
		crossDomain: 'true',

		success: function(data) {
			var siteidstation = (data.ResponseData[0].SiteId)
			if (siteidstation.length > 0) {
				getDepartures(siteidstation)
			};
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

function getDepartures(siteid) {		//Uses SiteId to find departures with SL Realtidsinfo API
	$.ajax({
		url: 'http://api.sl.se/api2/realtimedepartures.json',
		data: {
			"key": '74b0060de6e2403780e6dfbacada5743',
			"siteid": siteid,
			"timewindow": 30			//The timewindow for departures. Too long and it seems to truncate results.
		},
		dataType: "json",
		type: 'get',
		crossDomain: 'true',

		success: function(data) {
			var metros = data.ResponseData.Metros;
			var trains = data.ResponseData.Trains;
			if (metros.length > 0) {	//Checks if the station has metros
				$("#result").append("<strong>" + metros[0].StopAreaName + "</strong><br>");
				for (j = 0; j < metros.length; j++ ) {
					$("#result").append(metros[j].Destination + " " + metros[j].DisplayTime + "<br>");
				}
			}
			if (trains.length > 0) {	//Checks if the station has trains
				$("#result").append("<strong>" + trains[0].StopAreaName + "</strong><br>");
				for (j = 0; j < trains.length; j++ ) {
					$("#result").append(trains[j].Destination + " " + trains[j].DisplayTime + "<br>");
				}
			}
		},
		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

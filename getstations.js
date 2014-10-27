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
		url: 'http://lit-headland-6335.herokuapp.com/maps/api/place/nearbysearch/json',
		    data: {
		    	"rankby": 'distance',
		    	"location": coordinates,
		    	"types": 'train_station',
		    	"protocol": 'https',
		    	"hostname": 'maps.googleapis.com',
		    },
		    dataType: 'json',
		    type: 'get',
		    //crossDomain: 'true',


		success: function(data) {
			$("#result").html("");
			var nearbystations = data.results;
			if (nearbystations.length > 0) {
				for (i = 0; i < 2; i++ ) {	//Itterates through nearby stations and calls getSiteID
					getSiteId(nearbystations[i].name.toLowerCase(),i+1);
					$("#result").append("<div class=\"station\" id=\"station" + (i + 1) + "\"></div>"); 
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
			"searchstring": site,
			"hostname": 'api.sl.se',
			"protocol": 'http',
		},
		dataType: 'json',
		type: 'get',
						
		success: function(data) {		//Calls getDepartures for the SiteId
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

	var siteidstation = siteid
	var stationname = stationname
	var number = number

	console.log('#' + number + 'calling getDepartures ' + siteid);
	$.ajax({
	    url: 'http://lit-headland-6335.herokuapp.com/api2/realtimedepartures.json',
	    data: {
	    	"siteid": siteid,
	    	"timewindow": 10,
	    	"hostname": 'api.sl.se',
	    	"protocol": 'http',
	    },
	    dataType: 'json',
	    type: 'get',

		success: function(data) {
			console.log('received data in getDepartures for ' + siteid);
			var metros = data.ResponseData.Metros;
			var trains = data.ResponseData.Trains;

			if (metros.length % 6 != 0 || trains.length % 6 != 0) {
				getDepartures(siteidstation, stationname, number);
				console.log("Incomplete answer, reloaded for station" + stationname);
				return;
			}

			if (metros.length > 0 || trains.length > 0) {	//Checks if it actually is a metro or train station
				$("#station" + number)						//Creates a headline with the stations name and one disabled button for each line.
					.append("<div class = \"stationhead\"><h2>" + stationname + "</h2>" +
					"<button class = \"line1\" disabled></button>" +
					"<button class = \"line2\" disabled></button>" + 
					"<button class = \"line3\" disabled></button>" + 
					"<button class = \"train\" disabled></button></div>");
				if (metros.length > 0) {					//Checks if it is a metro station
					$("#station" + number).append("<div class = \"metros\"></div>");
					for (j = 0; j < metros.length; j++ ) { 	//Iterates through all departures
						if ($("#station" + number + " > .metros > .line" + metros[j].GroupOfLineId)[0]) {	//Checks if a div for the line exists
							$("#station" + number + " > .metros > .line" + metros[j].GroupOfLineId + " > .direction" + metros[j].JourneyDirection)
								.append("<li>" + metros[j].Destination + " " + metros[j].DisplayTime + "</li>");
						} else {																			//Adds a div for the line if it doesn't exists
							var lineid = metros[j].GroupOfLineId;
							$("#station" + number + " > .metros")											//Adds a div for the line, and one div for each direction
								.append("<div class = \"line" + metros[j].GroupOfLineId + "\"><div class = \"direction1\"></div><div class = \"direction2\"></div></div>");
							$("#station" + number + " > .metros > .line" + metros[j].GroupOfLineId + " > .direction" + metros[j].JourneyDirection)
								.append("<li>" + metros[j].Destination + " " + metros[j].DisplayTime + "</li>");
							$("#station" + number + " > .stationhead > .line" + metros[j].GroupOfLineId).removeAttr("disabled").click(function() {
								$("#station" + number + " > .metros > ." + $(this).attr("class")).slideToggle();
							});
						};
					}
				}
				if (trains.length > 0) {					//Checks if it is a train station
					$("#station" + number).append("<div class = \"trains\"><div class = \"direction1\"></div><div class = \"direction2\"></div></div>");
					$("#station" + number + " > .stationhead > .train").removeAttr("disabled").click(function() {
						$("#station" + number + " > .trains").slideToggle();
					});
					for (j = 0; j < trains.length; j++ ) {
						$("#station" + number + " > .trains > .direction" + trains[j].JourneyDirection)
							.append("<li>" + trains[j].Destination + " " + trains[j].DisplayTime + "</li>");
					}
				}
			}
		},
		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

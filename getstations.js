// Global variable to track number of reloads on the response due to incomplete answer
var retries = 0;

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

// Uses coordinates to find nearby stations and Google Places API
function getStations(coordinates) {		
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


		success: function(data) {
			$("#result").html("");
			var nearbystations = data.results;
			if (nearbystations.length > 0) {
				// Iterates through nearby stations and calls getSiteID
				for (i = 0; i < 2; i++ ) {	
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

// Finds SiteId using the nearby stations and SL Platsinfo API
function getSiteId(site, number) {		
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

// Uses SiteId to find departures with SL Realtidsinfo API
function getDepartures(siteid, stationname, number) {		

	// Declare variables, in case the results are incomplete and we need to call getDepartures again.
	var siteidstation = siteid
	var stationname = stationname
	var number = number

	console.log('# ' + number + ' calling getDepartures ' + siteid);

	// Creating ajax call through server
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

	    // What happens when our API call was a success
		success: function(data) {
			// Type out, so we know whats happening
			console.log('Sucessfully received data in getDepartures for ' + siteid);

			// Create shortcuts to the Metro and Train lists in the response
			var metros = data.ResponseData.Metros;
			var trains = data.ResponseData.Trains;

			// Checks if the response seems complete 
			// There should be 6 depatures for each line if they are complete)
			if (metros.length % 6 != 0 || trains.length % 6 != 0) {
				// Log each error in a global variable
				retries = (retries + 1);

				// If no of errors are less than 3, make a new call in getDepartures and exit function
				if (retries < 3) {
					getDepartures(siteidstation, stationname, number);
					console.log("Incomplete answer, reloaded for station" + stationname + " retry no " + retries);
					return;

				} 
				// Else, just continue anyway and set retries back to 0
				else {
					retries = 0;
				}

			}

			// Checks if there are any depatures listed for Metros or Trains
			if (metros.length > 0 || trains.length > 0) {	
				// Creates a headline with the stations name and one disabled button for each line
				$("#station" + number)						
					.append("<div class = \"stationhead\"><h2>" + stationname + "</h2>" +
					"<button class = \"line1\" disabled></button>" +
					"<button class = \"line2\" disabled></button>" + 
					"<button class = \"line3\" disabled></button>" + 
					"<button class = \"train\" disabled></button></div>");

				// If there are departures listed in Metros, do this
				if (metros.length > 0) {					
					$("#station" + number).append("<div class = \"metros\"></div>");
					// Iterates through all departures
					for (j = 0; j < metros.length; j++ ) { 
						if ($("#station" + number + " > .metros > .line" + metros[j].GroupOfLineId)[0]) {	
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

// Global variable to track number of reloads on the response due to incomplete answer
// and to see when getdepartures is done for both stations
var retries = 0;
var responseready = 0;
$("#container").css({ opacity: 0 });

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
				retries++;

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

				//$('#loading').empty();
				if (responseready < 2) {
					$("#station" + number).css({ opacity: 0 })
				}

				// Creates a headline with the stations name and one disabled button for each line
				$("#station" + number)						
					.append("<div class = \"stationhead\"><h2>" + stationname.substring(0, stationname.indexOf('(')) + "</h2>" +
					"<svg class = \"line1 \" >" + greenButton + "</svg>" +
					"<svg class = \"line2\" >" + redButton + "</svg>" + 
					"<svg class = \"line3\" >" + blueButton + "</svg>" + 
					"<svg class = \"train\" >" + trainButton + "</svg></div>");
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
						}
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

				responseready++;
				
				console.log("response " + responseready + " is ready");

				var fadeloading = function() {
					$("#loading").fadeOut(400, function() { $(this).remove(); });
					}

				var showresponse = function() {
						fadeloading();
						setTimeout(function(){
							$("#station" + 1).css({ opacity: 1 });
							$("#station" + 2).css({ opacity: 1 });
							$("#container").css({ opacity: 1 });
						},600);
					}
				if (responseready == 2) {
					showresponse();
				}
			}


		},
		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}


var trainButton = "<svg version=\"1.1\" id=\"Lager_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"" + 
" x=\"0px\" y=\"0px\" width=\"40px\" height=\"40px\" viewBox=\"0 0 57.039 57.039\" enable-background=\"new 0 0 57.039 57.039\" " + 
"xml:space=\"preserve\"><g class=\"trainact\"><circle class=\"trainact\" fill=\"#4F4E48\" cx=\"28.52\" cy=\"28.519\" r=\"28.52\"/><g><path fill=\"#FFFFFF\" " + 
"d=\"M36.917,35.894c0,1.181-0.211,2.286-0.632,3.315c-0.422,1.03-1.048,1.9-1.879,2.611c-0.879,0.759-1.939,1.346-3.18,1.761c-1.241," + 
"0.416-2.776,0.624-4.607,0.624c-1.241,0-2.409-0.045-3.505-0.135c-1.096-0.09-2.06-0.22-2.891-0.388v-5.439h0.65c0.578,0.217,1.18,0.418," + 
"1.807,0.605c0.626,0.187,1.427,0.28,2.403,0.28c1.265,0,2.237-0.169,2.917-0.506c0.681-0.338,1.166-0.808,1.455-1.411c0.277-0.59," + 
"0.434-1.239,0.47-1.944c0.036-0.705,0.054-1.606,0.054-2.704V21.838h-6.161v-4.95h13.098V35.894z\"/></g></g></svg>"

var redButton = "<svg version=\"1.1\" id=\"Lager_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"" + 
" x=\"0px\" y=\"0px\" width=\"40px\" height=\"40px\" viewBox=\"0 0 57.039 57.039\" enable-background=\"new 0 0 57.039 57.039\" " + 
"xml:space=\"preserve\"><g class=\"redact\"><circle class=\"redact\" fill=\"#BF3C3C\" cx=\"28.52\" cy=\"28.519\" r=\"28.52\"/><g><path fill=\"#FFFFFF\" " + 
"d=\"M39.999,22.688h-8.125v20.983h-6.709V22.688h-8.125v-5.032h22.958V22.688z\"/></g></g></svg>"

var greenButton = "<svg version=\"1.1\" id=\"Lager_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"" + 
" x=\"0px\" y=\"0px\" width=\"40px\" height=\"40px\" viewBox=\"0 0 57.039 57.039\" enable-background=\"new 0 0 57.039 57.039\" " + 
"xml:space=\"preserve\"><g class=\"greenact\"><circle class=\"greenact\" fill=\"#2B7347\" cx=\"28.52\" cy=\"28.519\" r=\"28.52\"/><g><path fill=\"#FFFFFF\" " + 
"d=\"M39.999,22.688h-8.125v20.983h-6.709V22.688h-8.125v-5.032h22.958V22.688z\"/></g></g></svg>"

var blueButton = "<svg version=\"1.1\" id=\"Lager_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"" + 
" x=\"0px\" y=\"0px\" width=\"40px\" height=\"40px\" viewBox=\"0 0 57.039 57.039\" enable-background=\"new 0 0 57.039 57.039\" " + 
"xml:space=\"preserve\"><g class=\"blueact\"><circle class=\"blueact\" fill=\"#3766A8\" cx=\"28.52\" cy=\"28.519\" r=\"28.52\"/><g><path fill=\"#FFFFFF\" " + 
"d=\"M39.999,22.688h-8.125v20.983h-6.709V22.688h-8.125v-5.032h22.958V22.688z\"/></g></g></svg>"

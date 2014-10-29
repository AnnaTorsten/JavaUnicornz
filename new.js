// Global variable to track number of reloads on the response due to incomplete answer
// and to see when getdepartures is done for both stations
var retries = 0;
var responseready = 0;

// // Tries to get the users location.
var getLocation = function($scope) {
	// Checks if geolocation is supported
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position){
			coordinates = position.coords.latitude + ',' + position.coords.longitude;
			//calls on getStations based on coordinated
			getStations($scope, coordinates);
			console.log("You are here: " + coordinates)
		});
	} else {
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
};



// Uses coordinates to find nearby stations and Google Places API
function getStations($scope, coordinates) {		
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

		// if call is successful, do this
		success: function(data) {
			var nearbystations = data.results;
			if (nearbystations.length > 0) {

				// Iterates through nearby stations and calls getSiteID
				for (i = 0; i < 2; i++ ) {
					getSiteId($scope, nearbystations[i].name.toLowerCase(), i);

					var div = $('<div></div>')
					.addClass('station')
					.appendTo('#result');

					//$("#result").append("<div class=\"station\" id=\"station" + (i) + "\"></div>"); 
				}
			}
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

// Finds SiteId using the nearby stations and callin on SL Platsinfo API
function getSiteId($scope, site, number) {		
	console.log('Calling getSiteId for station ' + number + " " + site);

	$.ajax({
		url: 'http://lit-headland-6335.herokuapp.com/api2/typeahead.json',
		data: {
			"searchstring": site,
			"hostname": 'api.sl.se',
			"protocol": 'http',
		},
		dataType: 'json',
		type: 'get',
						
		//On success, call getDepartures for the SiteId
		success: function(data) {		
			console.log('Received siteId ' + data.ResponseData[0].SiteId + ' for station ' + number + " " + site);

			var siteid = (data.ResponseData[0].SiteId)
			var stationname = (data.ResponseData[0].Name)
			if (siteid.length > 0) {
				getDepartures($scope, siteid, stationname, number)
			};
		},

		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

// Uses SiteId to find departures with SL Realtidsinfo API
function getDepartures($scope, siteid, stationname, number) {

	console.log('Calling getDepartures for ' + siteid + ' station ' + number + ' ' + stationname);

	// Creating ajax call through server
	$.ajax({
	    url: 'http://lit-headland-6335.herokuapp.com/api2/realtimedepartures.json',
	    data: {
	    	"siteid": siteid,
	    	"timewindow": 60,
	    	"hostname": 'api.sl.se',
	    	"protocol": 'http',
	    },
	    dataType: 'json',
	    type: 'get',

	    // What happens when our API call was a success
		success: function(data) {
			// Type out, so we know whats happening
			console.log('Received data in getDepartures for ' + siteid + ' ' + stationname);
			console.log(data);
			
			var metros = window.metros = data.ResponseData.Metros;
			var trains = window.trains = data.ResponseData.Trains;
			var buses = window.buses = data.ResponseData.Buses;

			// Checks if the response seems complete 
			// There should be 6 depatures for each line if they are complete
			// Only retry max two times
			
			if (metros.length % 6 != 0 || trains.length % 6 != 0) {
				retries++;
				if (retries < 3) {
					getDepartures($scope, siteid, stationname, number);
					console.log("Incomplete answer, reloaded for station" + stationname + " retry no " + retries);
					return;
				} else {
					retries = 0;
				}
			} else {
				console.log("all was OK with request for " + siteid + ' ' + stationname);
			}


			$scope.$apply(function(){
				var stationObject = {
					"siteid": siteid,
					"name": stationname,
					metros: {},
					trains: {},
					buses: {}
				};
				$scope.stations.push(stationObject);

				// creates an object of metro data
				if (metros.length > 0) {
					var metrogrouped = stationObject.metros;

					for (var i in metros) {
						var linegroup = metros[i].GroupOfLineId;
						if (!metrogrouped[linegroup]) {
							metrogrouped[linegroup] = {};
						}
						var lineobjects = metrogrouped[linegroup];

						var direction = metros[i].JourneyDirection;
						if (!lineobjects[direction]) {
							lineobjects[direction] = [];
						}
						var journeyobjects = lineobjects[direction];

						journeyobjects.push(metros[i]);
					}
				}
				

				// creates an object of train data
				if (trains.length > 0) {
					var traingrouped = stationObject.trains;

					for (var i in trains) {
						var linegroup = "trainlines";
						if (!traingrouped[linegroup]) {
							traingrouped[linegroup] = {};
						}
						var lineobjects = traingrouped[linegroup];

						var direction = trains[i].JourneyDirection;
						if (!traingrouped[direction]) {
							traingrouped[direction] = [];
						}
						var journeyobjects = traingrouped[direction];

						journeyobjects.push(trains[i]);
					}
				}


				// creates an object of bus data
				if (buses.length > 0) {
					var busgrouped = stationObject.buses;

					for (var i in buses) {
						var linegroup = buses[i].LineNumber;
						if (!busgrouped[linegroup]) {
							busgrouped[linegroup] = {};
						}
						var lineobjects = busgrouped[linegroup];

						var direction = buses[i].JourneyDirection;
						if (!lineobjects[direction]) {
							lineobjects[direction] = [];
						}
						var journeyobjects = lineobjects[direction];

						journeyobjects.push(buses[i]);
					}
				}

				console.log($scope);
			});


			responseready++;

			console.log("response " + responseready + " is ready");

			var fadeloading = function() {
				$("#loading").fadeOut(400, function() { $(this).remove(); });
				}

			var showresponse = function() {
					fadeloading();
					setTimeout(function(){
						$("#station" + 0).css({ opacity: 1 });
						$("#station" + 1).css({ opacity: 1 });
					},600);
				}
			if (responseready == 2) {
				showresponse();
			}
		},
		error: function(data) {
			$("#result").html(JSON.stringify(data));
		}
	});
}

function myControl($scope) {
	$scope.stations = [];
	getLocation($scope);
}

var obje = {
    "a": {
        "foo": [12, 24],
        "bar": [23, 55]
    },
    "b": {
        "baz": [34, 2234],
        "quax": [55, 93]
    }
}

function myController($scope) {
    $scope.obj = obje;
}

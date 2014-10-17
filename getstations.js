


			$(document).ready(function(){
				$('#button').click(function(){

					var location = $("input[name=location]").val()
					$.ajax({
					    url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankby=distance',
					    data: {
					    	"key": 'AIzaSyDVw-ruTyNahkP3hx7LcNP8XXHNqr0BSYA',
					    	"location": coordinates,
					     // "radius": '5000', This isn't needed since we use rankby=distance in url.
					    	"types": 'train_station'
					    },
					    dataType: "json",
					    type: 'get',
					    crossDomain: 'true',

					    success: function(data) {
					    	$("#result").html("");
					    	var stations = data.results;
					    	if (stations.length > 0) {
						    	for (i = 0; i < stations.length-1; i++ ) {
						    		$("#result").append(stations[i].name + "<br>");
						    	};
					    	};
				    		// console.log(stations);
				    		// console.log(location);
					    },
					    error: function(data) {
					    	$("#result").html(JSON.stringify(data));
					    }
					});
				});
		    });

		function getLocation() {
		    if (navigator.geolocation) {
		        navigator.geolocation.getCurrentPosition(showPosition);
		    } else { 
		        x.innerHTML = "Geolocation is not supported by this browser.";
		    }
		}

		function showPosition(position) {
		    coordinates = position.coords.latitude + ',' + position.coords.longitude;
		    console.log(coordinates);	
		}

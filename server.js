// Load the http module to create an http server.
var http = require('http');
var https = require('https');
var url = require('url');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {

  // require('url').parse(request.url) metoden - node documentation. Bryter ned url:en i intressanta bitar.
  // Reversed AJAX, typ
  var parsedUrl = url.parse(request.url, true);
  console.log(parsedUrl);

  // rad 1 hämtar pathname (string), som är det som står före "?", efter domännamnet, i URLen
  // rad 2 hämtar query, som är ett object innehållandes parametrarna i URLen
  //var pathname = parsedUrl.pathname;
  //var query = parsedUrl.query;

  // skapar key "pathname:" i objectet som innehåller alla parametrar. Och lägger in pathname här.
  // så allt ligger samman. Ex: {"foo":"bar","pathname":"/api2"}
  //query.pathname = pathname;

	// lägg till fältet "key" i parsedUrl.query - som innehåller API-nyckeln
	//parsedUrl.query.key = '74b0060de6e2403780e6dfbacada5743';

	// lägg till fälten protocol och hostname i parsedUrl

	var module = http;
	parsedUrl.protocol = 'http';

	if (parsedUrl.query.protocol == 'https') {
		parsedUrl.protocol = 'https';
		module = https;
	}

	if (parsedUrl.pathname.indexOf('maps/api/place/nearbysearch/json') >= 0) {
		// Christoffers key
		parsedUrl.query.key = 'AIzaSyDVw-ruTyNahkP3hx7LcNP8XXHNqr0BSYA';
	} 
	else if (parsedUrl.pathname.indexOf('api2/typeahead.json') >= 0) {
		// Carolines key (körde slut på Christoffers)
		parsedUrl.query.key = '3f3bc4e3d6eb448fb32de7d0df622f97';
	} 
	else if (parsedUrl.pathname.indexOf('api2/realtimedepartures.json') >= 0) {
		// Christoffers key (körde slut på Carolines)
		parsedUrl.query.key = 'bd58e1f4458c420089861211933ed4d1';
	} 
	
	parsedUrl.hostname = parsedUrl.query.hostname;

	// tar bort fältet search och hostname, för annars kommer url.format() använda sig av den. Den är nu incomplete/obsolete.
	delete parsedUrl.search;
	delete parsedUrl.query.hostname;
	delete parsedUrl.query.protocol;

	// url.format() sätter ihop URL utifrån objectet parsedUrl. Typ som AJAX.
	var slUrl = url.format(parsedUrl);

	// gör http request till SL
	var req = module.request(slUrl, function (res) {

		// write to header - statuscode från SL, och SLs headers.
		// rad 2 - lägg till access-control... så att browsern låter dig göra requests mellan domäner
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.writeHead(res.statusCode, res.headers);
		
		res.setEncoding('utf8');
		// vidarebefordrar datat som kommer (i chunks) i svaret - se dokumentation
		res.on('data', function (chunk) {
			response.write(chunk);
		});
		//avslutar svaret, när ingen mer data kommer från SL
		res.on('end', function () {
			//avslutar
			response.end();
		})

	});
	// on error do this
	req.on('error', function (e) {
		response.writeHead(500, "Poor request" + e.message);
	});

	req.end();

});

// Listen on port 8000, IP defaults to 127.0.0.1
// (8000) endast när den körs lokalt
// annars (på heroku) på den port heroku bestämmer
server.listen(process.env.PORT || 8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");

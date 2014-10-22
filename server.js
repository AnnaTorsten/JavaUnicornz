// Load the http module to create an http server.
var http = require('http');
var url = require('url');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {

  // require('url').parse(request.url) metoden - node documentation. Bryter ned url:en i intressanta bitar.
  // Reversed AJAX, typ
  var parsedUrl = url.parse(request.url, true);
  console.log(parsedUrl);
  console.log(parsedUrl.query.hotname);

	// lägg till fälten protocol och hostname i parsedUrl
	parsedUrl.protocol = 'http';
	parsedUrl.hostname = parsedUrl.query.hostname;

	// tar bort fältet search och hostname, för annars kommer url.format() använda sig av den. Den är nu incomplete/obsolete.
	delete parsedUrl.search;
	delete parsedUrl.query.hostname;

	// url.format() sätter ihop URL utifrån objectet parsedUrl. Typ som AJAX.
	var slUrl = url.format(parsedUrl);

	// gör http request till SL
	var req = http.request(slUrl, function (res) {

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

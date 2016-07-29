var http = require("http");
var request = require('request');
var execa = require('execa');
var time = require('promise-time');
var client = require('twilio')('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');

var msg = {};
var textMsg = {};

function isServerUp () {
  const p = getTimePromise();

  return p.then(
    () => checkTimes(p.time))
  .catch(
    () => checkTimes(-1)
  )
}

function checkTimes (time) {
  if (time < 0) msg = { text: 'Pokemon Go servers are down.', style: 'text-danger' }
  else if (time < 800) msg = { text: 'Pokemon Go servers are up!', style: 'text-success' } 
  else if (time >= 800 && time < 3000) msg = { text: 'Pokemon Go servers are slow.', style: 'text-warning' }
  else msg = { text: 'Pokemon Go servers are down.', style: 'text-danger' }
  console.log(msg.text);
}

function getTimePromise () {
  return time(execa)('curl', ['-s', 'https://pgorelease.nianticlabs.com/plfe/'])
}

http.createServer(function (request, response) {
  var html = buildHtml(request);  

  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    'Expires': new Date().toUTCString()
  });
  response.end(html);
}).listen(8081);

function buildHtml(req) {
  var header = '<meta http-equiv="refresh" content="5" ></meta>' +
               '<script src="https://netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js" ></script> ' +
			   '<link rel="stylesheet" type="text/css" href="https://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" ></link> ';
  var body = '<div ng-app class="container">'  
		   + '  <div class="jumbotron">' 
		   + '     <h1 style="text-align: center;"><span  class="' + msg.style + ' ">' 
		   + msg.text
		   + '</span></h1><hr />'
		   + '<h5 style="float: right;"> As of ' + new Date().toLocaleString()
		   + '</h5>'
		   + '</div></div>';
  return '<!DOCTYPE html>'
       + '<html><head>' + header + '</head><body>' 
	   + body
	   + '</body></html>';
};

console.log('Server running at http://127.0.0.1:8081/');

startCheckingLoop();

function startCheckingLoop(){
	isServerUp();
	setTimeout(sendText, 5000);	
}
 
function sendText() {
	if (msg.text !== textMsg.text) {
		textMsg = msg;
		client.sendMessage({
			to:'+YOUR_NUMBER',
			from: '+TWILIO_NUMBER',
			body: textMsg.text
		}, function(err, responseData) { //this function is executed when a response is received from Twilio
			if (!err) { 
				console.log("Error: " + err );
			}
			console.log("sent");
		});
	}
	startCheckingLoop();
}

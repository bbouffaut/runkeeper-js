// RunKeeper.js
var request = require('request');

// Predefined API Routes
var API = {
  "user": {
   "Content-Type": "application/vnd.com.runkeeper.User+json",
   "uri": "/user"
 }
 , "profile": {
  "Content-Type": "application/vnd.com.runkeeper.Profile+json",
  "uri": "/profile"
}
, "settings": {
  "Content-Type": "application/vnd.com.runkeeper.Settings+json",
  "uri": "/settings"
}
, "fitnessActivityFeed": {
  "Content-Type": "application/vnd.com.runkeeper.FitnessActivityFeed+json",
  "uri": "/fitnessActivities"
}
, "fitnessActivities": {
  "Content-Type": "application/vnd.com.runkeeper.FitnessActivity+json",
  "uri": "/fitnessActivities?pageSize=100"
}
};

var HealthGraph = exports.HealthGraph = function(options) {

  this.client_id = options.client_id || null ;
  this.client_secret = options.client_secret || null;
  this.auth_url = options.auth_url || "https://runkeeper.com/apps/authorize";
  this.access_token_url = options.access_token_url || "https://runkeeper.com/apps/token";
  this.redirect_uri = options.redirect_uri || null;
  this.revoke_uri = options.revoke_uri || "https://runkeeper.com/apps/de-authorize";

  this.access_token = options.access_token || null;

  this.api_domain = options.api_domain || "api.runkeeper.com";

};

// Runkeeper OAuth docs: http://developer.runkeeper.com/healthgraph/registration-authorization
// BBO: return authorization URL
HealthGraph.prototype.getLoginUrl = function () {
  var uri = this.auth_url + "?client_id=" + this.client_id + "&response_type=code&redirect_uri=" + encodeURIComponent(this.redirect_uri);

  return uri;
};

// Runkeeper OAuth docs: http://developer.runkeeper.com/healthgraph/registration-authorization
// TODO: Add Authorization Code step (Step 1)
// getToken performs Step 2
HealthGraph.prototype.getNewToken = function (authorization_code, callback) {

  var request_params = {
    grant_type: "authorization_code",
    code: authorization_code,
    client_id: this.client_id,
    client_secret: this.client_secret,
    redirect_uri: this.redirect_uri
  };

  var paramlist  = [];
  for (pk in request_params) {
   paramlist.push(pk + "=" + request_params[pk]);
 };
 var body_string = paramlist.join("&");

 var request_details = {
  method: "POST",
  headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
  uri: this.access_token_url,
  body: body_string
};

request(request_details, function(error, response, body) {
  callback(error, JSON.parse(body));
});
};

// Runkeeper OAuth docs: http://developer.runkeeper.com/healthgraph/registration-authorization
// BBO: implement un-registering
HealthGraph.prototype.revokeAccess = function (callback) {
  var request_details = {
    method: 'GET',
    headers: {
      'Authorization' : 'Bearer ' + this.access_token},
      uri: this.revoke_uri
    };
    request(request_details, function(error, response, body) {
     callback(error, response);
   });
  };


// Generic API Call Wrapper for interacting with API Routes not otherwise specified.
// @method: optional, defaults to GET
// @media_type: required, this is the media type specified for the desired resource
// @endpoint: required, this is the specific API endpoint of the desired resource
// @callback: required, this is the callback function to pass any errors and the body of the API response to
HealthGraph.prototype.apiCall = function(method, media_type, endpoint, callback) {
	var request_details = {
		method: method || 'GET',
		headers: {'Accept': media_type,
   'Authorization' : 'Bearer ' + this.access_token,
   'Accept-Charset': 'UTF-8'},
   uri: "https://" + this.api_domain + endpoint,
   encoding: 'binary'
 };
 request(request_details, function(error, response, body) {
  var parsed;
  /*try {
   parsed = JSON.parse(body);
 } catch(e) {
   error = new Error('Body reply is not a valid JSON string.');
   error.runkeeperBody = body;
   error.statusCode = response.statusCode;
   error.statusMessage = response.statusMessage;
 } finally {
   callback(error, parsed);
 }*/
 callback(error,response,body);
});
};

// Generate Specific API Methods based on Predefined API Routes
for (func_name in API) {
  HealthGraph.prototype[func_name] = (function(func_name) {
   return function(callback) {
     var request_details = {
       method: API[func_name]['method'] || 'GET',
       headers: {'Accept': API[func_name]['media_type'],
       'Authorization' : 'Bearer ' + this.access_token},
       uri: "https://" + this.api_domain + API[func_name]['uri']
     };
     request(request_details,
      function(error, response, body) {
       var parsed;
       /*try {
        parsed = JSON.parse(body);
      } catch(e) {
        error = new Error('Body reply is not a valid JSON string.');
        error.runkeeperBody = body;
        error.statusCode = response.statusCode;
        error.statusMessage = response.statusMessage;
      } finally {
        callback(error, parsed);
      }*/
      callback(error,body);
    }
    );
   };
 })(func_name);
};
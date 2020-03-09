require('dotenv').config()
var express = require("express");
var slowDown = require("express-slow-down");
var Influx = require('influx');
var mysql = require('mysql');

var app = express();

var api_con = mysql.createConnection({
  host: process.env.SQL_DB_HOST,
  user: process.env.SQL_DB_USER,
  password: process.env.SQL_DB_PASSWORD,
  database: process.env.SQL_DB_DATABASE
});

var influx_client = new Influx.InfluxDB({
  database: process.env.INFLUX_DATABASE,
  host: process.env.INFLUX_HOST,
  port: process.env.INFLUX_PORT,
  username: process.env.INFLUX_USER,
  password: process.env.INFLUX_PASSWORD
})

const speedLimiter = slowDown({
	windowMs: 15 * 60 * 1000, // 15 minutes
	delayAfter: 150, // allow 150 requests per 15 minutes, then...
	delayMs: 500 // begin adding 500ms of delay per request above 100:
});
  
function checkAPIKey(key, callback) {
	var queryString = "SELECT api_key, name, length_limit FROM RuuviAPIKeys WHERE api_key='" + key + "'";

	api_con.query(queryString, function (err, api_result, fields) {
		if (err) throw err;

		var length_limit = null;

		if (api_result.length > 0) {
			length_limit = api_result[0].length_limit;
			pass = true;
		} else {
			pass = false;
		}
		
		callback(api_result, pass, length_limit);

	});
};

function GetResultsFromInflux(limit, sortBy, callback) {
	influx_query = 'SELECT temperature, airDensity, dewPoint, humidity, pressure ' + 
	'FROM ruuvi_outdoor_measurements ORDER BY ' + sortBy.toString();
	
	if (limit != -1) {
		influx_query += ' LIMIT ' + limit.toString();
	}

	influx_client.query(influx_query).then(data => {
		console.log(data);
		callback(data);
	});
}

function GenerateResponse(limit, sortBy, api_result, callback) {

	GetResultsFromInflux(limit, sortBy, function(measurements) {
		var JSON_res = {
			"status" : "OK",
			"user" : api_result[0].name,
			"api_key": api_result[0].api_key,
			"limit": limit,
			"sortby": sortBy,
			"body": []
		};

		i = 0

		while (measurements[i] != null) {
			var temporary = {};

			temporary['time'] = measurements[i].time;
			temporary['temperature'] = measurements[i].temperature
			temporary['air_density'] = measurements[i].airDensity
			temporary['dewpoint'] = measurements[i].dewPoint
			temporary['humidity'] = measurements[i].humidity
			temporary['pressure'] = measurements[i].pressure

			JSON_res.body[i] = temporary;
			i++;
		}

		if (JSON_res == null) {
			JSON_res = {
				"status": "Error",
				"data": []
			}
		}

		callback(JSON_res);
	});
}

app.use(speedLimiter);

app.get("/weather/apiv1", (req, res, next) => {
	var key = req.query.api_key;  // API key
	var limit = req.query.limit;  // limit of results
	var sortBy = req.query.sort;  // Sort by DESC/ASC
	var indent = req.query.indent;  // Indent results NOT IMPLEMENTED

	checkAPIKey(key, function(api_result, pass, length_limit) {

		if (limit == {} || limit == null || limit < 1) {

			if (length_limit == null) limit = -1
			else limit = 1

		} else if ((limit > length_limit) && length_limit != null) {
			limit = length_limit;
		}

		if (sortBy != {} && sortBy != null) {

			if (sortBy.toUpperCase() != "ASC") sortBy = "DESC";
			else sortBy = "ASC";

		} else {
			sortBy = "DESC";
		}
		
		if (pass == true) {
			GenerateResponse(limit, sortBy, api_result, function(JSON_res) {
				res.status(200).type('application/json').json(JSON_res);
			});
		}
		else {
			res.status(401).send('Unauthorized');
		}
	});
});

app.post('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

app.put('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

app.delete('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

app.listen(3000, () => {
	console.log("Server running on port 3000");
});

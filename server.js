require('dotenv').config()
var express = require('express');
var Influx = require('influx');
var mysql = require('mysql');
var slowDown = require('express-slow-down');
var cors = require('cors');

var app = express();

// Sourcefiles
var parameters = require('./source/parameters.js');
var sql_con = require('./source/sql_con.js');
var influx_con = require('./source/influx_con.js');
var response = require('./source/generate_response.js');

var sql_client = mysql.createConnection({
  host: process.env.SQL_DB_HOST,
  user: process.env.SQL_DB_USER,
  password: process.env.SQL_DB_PASSWORD,
  database: process.env.SQL_DB_DATABASE,
  port: process.env.SQL_DB_PORT
});

var influx_client = new Influx.InfluxDB({
  database: process.env.INFLUX_DATABASE,
  host: process.env.INFLUX_HOST,
  port: process.env.INFLUX_PORT,
  username: process.env.INFLUX_USER,
  password: process.env.INFLUX_PASSWORD
})

/**
 * Adds delay gradually to users after they try connecting 
 * over 150 times in 15 minutes.
 */
const speedLimiter = slowDown({
	windowMs: 15 * 60 * 1000, // 15 minutes
	delayAfter: 150, // allow 150 requests per 15 minutes, then...
	delayMs: 500 // begin adding 500ms of delay per request above 100:
});
app.use(speedLimiter);

// CORS Stuff
var whitelist = 
	[
		'https://jontzi.com', 
		'http://data.jontzi.com', 
		'https://weather.jontzi.com', 
		'http://localhost:3000',
		'https://jontzii.github.io'
	]

var corsOptions = {
	origin: function (origin, callback) {
	  if (whitelist.indexOf(origin) !== -1 || !origin) {
		callback(null, true)
	  } else {
		callback(new Error("CORS error"))
	  }
	}
}

app.use(function(req, res, next) {
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET');
	next();
})

/**
 * Normal API.
 */
app.get("/weather/api/1/", cors(corsOptions), (req, res, next) => {
	var key = req.query.api_key;  // API key
	var limit = req.query.limit;  // limit of results
	var sortBy = req.query.sort;  // Sort by DESC/ASC
	var indent = req.query.indent;  // Indent results
	var from = req.query.from;  // Return results from this time 
	var to = req.query.to;  // Return results untill this time
	
	sql_con.checkAPIKey(key, sql_client, function(api_result, pass, length_limit) {
		parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
			
			if (pass == true) {
				parameters.setIndent(indent, app);

				influx_con.GetResultsFromInflux(influx_client, limit, sortBy, where, function(measurements) {
					response.generateResponse(measurements, limit, sortBy, api_result, function(JSON_res) {
						res.status(200).type('application/json').json(JSON_res);
					});
				});
			}
			else {
				res.status(401).send('Unauthorized');
			}
		});
	});
});

/**
 * Find by id API.
 */
app.get("/weather/api/1/:id", cors(corsOptions), (req, res, next) => {
	var key = req.query.api_key;  // API key
	var indent = req.query.indent;  // Indent results
	var limit = 1;  // limit of results
	var sortBy = "DESC";  // Sort by DESC/ASC
	var where = ""; // WHERE Clause
	var id = req.params.id;  // id of result / command latest
	
	sql_con.checkAPIKey(key, sql_client, function (api_result, pass, length_limit) {
		if (pass == true) {
			parameters.setIndent(indent, app);

			influx_con.GetResultsFromInflux(influx_client, limit, sortBy, where, function(measurements) {
				response.generateResponse(measurements, limit, sortBy, api_result, function(JSON_res) {
					res.status(200).type('application/json').json(JSON_res);
				});
			});
		}
		else {
			res.status(401).send('Unauthorized');
		}
	});
});

app.listen(8300, () => {
	console.log("Server running on port 8300");
});

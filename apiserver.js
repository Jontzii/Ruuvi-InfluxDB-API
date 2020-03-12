require('dotenv').config()
var express = require('express');
var slowDown = require('express-slow-down');
var Influx = require('influx');
var mysql = require('mysql');

var app = express();

var api_con = mysql.createConnection({
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

var globalErr = false;

/**
 * Adds delay gradually to users after they try connecting 
 * over 150 times in 15 minutes.
 */
const speedLimiter = slowDown({
	windowMs: 15 * 60 * 1000, // 15 minutes
	delayAfter: 150, // allow 150 requests per 15 minutes, then...
	delayMs: 500 // begin adding 500ms of delay per request above 100:
});

/**
 * Check API key against SQL database.
 * 
 * @param {*} key Given API key.
 * @param {*} callback Callback to rest of the application.
 */
function checkAPIKey(key, callback) {
	var queryString = "SELECT api_key, name, length_limit FROM RuuviAPIKeys WHERE api_key = ?";

	api_con.query(queryString, [ key ], function (err, api_result) {
		if (err) {
			globalErr = true;
			throw err
		};

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

/**
 * Check whether to apply indent.
 * 
 * @param {*} indent true or false
 * @param {*} callback -
 */
function setIndent(indent, callback) {

	try {
		if (indent != {} 
			&& indent != null 
			&& !Array.isArray(indent) 
			&& indent.toLowerCase() == "true") JSON_spaces = 2;
	
		else JSON_spaces = 0;
	
		app.set('json spaces', JSON_spaces);

	} catch (err) {
		globalErr = true;
	} finally {
		callback();
	}
}

/**
 * Tries to sanitize calls made to Influx database to prevent injection.
 * 
 * Injection attacks are not as big of a deal with Influx as with SQL so 
 * at the time of writing there is no build in query parameterization written into node-influx
 * This function still tries to clean inputs so that the node server wont crash on query. 
 * 
 * @param {*} limit Amount of results to get.
 * @param {*} sortBy Sort by descending or ascending.
 * @param {*} indent Will JSON be indented for easy reading.
 * @param {*} from Where to start the query from timewise.
 * @param {*} to Where to end the query to timewise.
 * @param {*} length_limit Lenght limit for response from SQL.
 * @param {*} callback Callback to rest of the application.
 */
function CheckParameters(limit, sortBy, indent, from, to, length_limit, callback) {
	// This function may need refactoring

	try {

		// Check limit
		if (limit != {} && limit != null) {
			if (Number.isInteger(parseInt(limit)) && !Array.isArray(limit)) {
				// Limit is integer && not array

				if (length_limit != null && limit > length_limit) limit = length_limit;

				if (length_limit == null && limit <= 0) limit = 0;
				else if (length_limit != null && limit < 1) limit = 1;

			} else limit = 1;

		} else limit = 1;

		// Check sort
		if (sortBy != {} && sortBy != null && Array.isArray(sortBy)) {

			if (sortBy.toUpperCase() != "ASC") sortBy = "DESC";
			else sortBy = "ASC";

		} else {
			sortBy = "DESC";
		}

		// Input sanitation for from and to parameters
		// Checks that they are in correct format and corrects them in necessary

		var durations = ["s", "m", "h", "d", "w"];

		var fromPass = false;
		var toPass = false;

		if (from != {} && from != null && !Array.isArray(from)) {
			time_from = parseInt(from)
			duration_from = from.substr(from.length - 1, 1);

			if (Number.isInteger(time_from) && durations.includes(duration_from)) {
				time_from = time_from * Math.sign(time_from);
				from = time_from + duration_from;
				fromPass = true;
			}
		}

		if (to != {} && to != null && !Array.isArray(to)) {
			time_to = parseInt(to)
			duration_to = to.substr(to.length - 1, 1);

			if (Number.isInteger(time_to) && durations.includes(duration_to)) {
				time_to = time_to * Math.sign(time_to);
				to = time_to + duration_to;
				toPass = true;
			}
		}

		// Form where clause
		where = "";

		if (fromPass && toPass)
			where = " WHERE " + "time > now() - " + from + " AND " + "time < now() - " + to;
		else if (fromPass)
			where = " WHERE " + "time > now() - " + from;
		else if (toPass)
			where = " WHERE " + "time < now() - " + to;

		// Check indent
		setIndent(indent, function() {
			callback(limit, sortBy, where);
		});	

	} catch (err) {
		globalErr = true;
	}
}

/**
 * Gets results from Influx database.
 * 
 * @param {*} limit Amount of results to get.
 * @param {*} sortBy Sort by descending or ascending.
 * @param {*} where Where part of the query.
 * @param {*} callback Generates the JSON from data.
 */
function GetResultsFromInflux(limit, sortBy, where, callback) {
	influx_query = 'SELECT temperature, airDensity, dewPoint, humidity, pressure FROM ruuvi_outdoor_measurements' 
	
	if (where != null) {
		influx_query += where;
	}

	influx_query += ' ORDER BY ' + sortBy.toString();
	
	if (limit != -1) {
		influx_query += ' LIMIT ' + limit.toString();
	}

	//console.log(influx_query);

	influx_client.query(influx_query).then(data => {
		callback(data);
	}).catch(error => {
		callback(null);
	});
}

/**
 * Generates JSON response that is send to user.
 * 
 * @param {*} limit Amount of results to get.
 * @param {*} sortBy Sort by descending or ascending.
 * @param {*} where Where part of the query.
 * @param {*} api_result Results from SQL query.
 * @param {*} callback Sends the JSON to user.
 */
function GenerateResponse(limit, sortBy, where, api_result, callback) {

	GetResultsFromInflux(limit, sortBy, where, function(measurements) {
		
		let status = "Error";
		let length = 0;
		let ts = Date.now();
		let date_ob = new Date(ts);
		let date = 
			date_ob.getUTCFullYear() + "-" + 
			(date_ob.getUTCMonth() + 1) + "-" + 
			date_ob.getUTCDate() + " " +
			date_ob.getUTCHours() + ":" +
			date_ob.getUTCMinutes() + ":" +
			date_ob.getUTCSeconds()

		if (measurements != null && !globalErr) status = "Ok"

		var JSON_res = {
			"status" : status,
			"user" : api_result[0].name,
			"request_time": date,
			"limit": limit,
			"length": length,
			"sortby": sortBy,
			"body": []
		};

		if (measurements != null && !globalErr) {
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
	
			JSON_res.length = i;
		}

		callback(JSON_res);
	});
}

app.use(speedLimiter);

/**
 * Normal API.
 */
app.get("/weather/apiv1", (req, res, next) => {
	var key = req.query.api_key;  // API key
	var limit = req.query.limit;  // limit of results
	var sortBy = req.query.sort;  // Sort by DESC/ASC
	var indent = req.query.indent;  // Indent results
	var from = req.query.from;  // Return results from this time 
	var to = req.query.to;  // Return results untill this time
	
	checkAPIKey(key, function(api_result, pass, length_limit) {
		CheckParameters(limit, sortBy, indent, from, to, length_limit, function(limit, sortBy, where) {

			if (pass == true) {
				GenerateResponse(limit, sortBy, where, api_result, function(JSON_res) {
					res.status(200).type('application/json').json(JSON_res);
				});
			}
			else {
				res.status(401).send('Unauthorized');
			}
		});
	});
});

/**
 * Latest API.
 */
app.get("/weather/apiv1/latest", (req, res, next) => {
	var key = req.query.api_key;  // API key
	var indent = req.query.indent;  // Indent results

	checkAPIKey(key, function (api_result, pass, length_limit) {
		if (pass == true) {
			GenerateResponse("1", "DESC", "", api_result, function(JSON_res) {

				setIndent(indent, function() {
					res.status(200).type('application/json').json(JSON_res);
				})		
			});
		}
		else {
			res.status(401).send('Unauthorized');
		}
	})
});

/**
 * Prevent other REST API methods.
 */
app.post('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

/**
 * Prevent other REST API methods.
 */
app.put('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

/**
 * Prevent other REST API methods.
 */
app.delete('/', function (req, res) {
	res.status(401).send('Unauthorized');
});

/**
 * Prevent other REST API methods.
 */
app.listen(8300, () => {
	console.log("Server running on port 8300");
});

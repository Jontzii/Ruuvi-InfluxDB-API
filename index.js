var express = require("express");
const Influx = require('influx');
var mysql = require('mysql');

var app = express();

var api_con = mysql.createConnection({
  host: 'localhost',
  user: 'APIUser',
  password: 'kEUmoi5Bc5',
  database: 'ruuvi'
});

const client = new Influx.InfluxDB({
  database: 'ruuvi',
  host: 'localhost',
  port: 8086,
  username: 'ruuvi',
  password: 'RuuviTagPW'
})

function checkAPIKey(key, callback) {
	var queryString = "SELECT api_key FROM RuuviAPIKeys WHERE api_key='" + key + "'";
	api_con.query(queryString, function (err, result, fields) {
		if (err) throw err;

		if (result.length > 0) {
			console.log("Got to true");
			pass = true;
		} else {
			console.log("Got to false");
			pass = false;
		}
		
		callback();
	});
};

app.get("/weather/api", (req, res, next) => {
	var key = req.query.api_key;
	checkAPIKey(key, function() {
		if (pass == true)
			res.send("Apikey is set to " + key);
		else
			res.send("Not allowed");
	});
});

app.listen(3000, () => {
	console.log("Server running on port 3000");
});


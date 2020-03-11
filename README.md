# Influx DB API
API that returns values from Influx DB which contains meteorological data measured continuosly with Ruuvitag using [RuuviCollector](https://github.com/Scrin/RuuviCollector).

## URL
data.jontzi.com/weather/apiv1?api_key=xx

data.jontzi.com/weather/apiv1/latest?api_key=xx

## API Key
An API key is required to make any calls. Calls made without proper key will return HTTP 401 Unauthorized. Key can be authorized by adding it to MySQL table containing the keys. Currently api key's only purpose it to block most webscrapers/bots as the website is not secured by any other way. In the future a better and more secure method will probably be implemented.

## Data
All data is returned in a JSON-format. The following measurements are measured:
1. time - UTC Time of measurement
2. temperature - Measured temperature
3. air density - Calculated air density
4. dew point - Calculated dew point
5. humidity - Measured humidity
6. pressure - Measured pressure

## Parameters (optional)
Please note that incorrect optional parameters are ignored!
1. api_key - required - API key to use
2. limit - (optional) - How many results to get, max amount is defined per user in SQL
3. sortby DESC/ASC - (optional) - Sort results to be descending or ascending
4. from and to - (optional) - Select timeframe for results, read more below
4. indent true/false - (optional) - Indent JSON results to be more readable

### From and To
From and to select the starting and ending points for query. The points are calculated in the following way: time and date now - x * duration modifier, where x is the parameter open for user to edit. The value should be either positive or negative integer and duration modifier. Duration modifiers are listed below.

#### Duration modifiers
- "s" = seconds
- "m" = minute
- "h" = hours
- "d" = days
- "w" = weeks

## Example Calls
data.jontzi.com/weather/apiv1?api_key=xx&from=10h&to=2h&sort=asc
Returns every measured value from 10 hours ago until 2 hours ago. Results are sorted from old to new.

data.jontzi.com/weather/apiv1?api_key=xx&limit=20
Returns 20 latest measurements sorted from new to old.

data.jontzi.com/weather/apiv1/latest?api_key=xx
Returns latest measured data.

## TODO List
- HTTPS Support
- Optional MySQL/APIkey authorization
- Better "from" and "to"
- Select what data to return

## Dependecies
- [ExpressJS](https://github.com/expressjs/express)
- [Node-Influx](https://github.com/node-influx/node-influx)
- [Dotenv](https://github.com/motdotla/dotenv)
- [MySQL](https://github.com/mysqljs/mysql)
- [express-slow-down](https://github.com/rameshgkwd05/express-slow-down)

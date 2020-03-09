# Influx DB REST API
REST API that returns values from Ruuvi DB

## Flow
1. Users sends GET request with api key and optional paramters
2. App checks if given api key is correct from mysql database containing registered keys
3. If correct app retrieves asked information and sends it pack as a JSON

## Data returned
1. time - UTC Time of measurement
2. temperature - Measured temperature
3. air density - Calculated air density
4. dew point - Calculated dew point
5. humidity - Measured humidity
6. pressure - Measured pressure

## Variables (optional)
1. api_key - required - API key to use
2. limit - (optional) - How many results to get, max amount is defined per user in SQL
3. sortby DESC/ASC - (optional) - Sort results to be descending or ascending
4. ~~indent~~ - (optional) - indent results to be more readable - Not Yet Implemented

## Dependecies
- ExpressJS
- Node-Influx
- Dotenv
- MySQL
- express-slow-down
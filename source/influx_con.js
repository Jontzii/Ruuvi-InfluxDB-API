
module.exports = {

    /**
     * Gets results from Influx database.
     * 
     * @param {*} limit Amount of results to get.
     * @param {*} sortBy Sort by descending or ascending.
     * @param {*} where Where part of the query.
     * @param {*} callback Generates the JSON from data.
     */
    GetResultsFromInflux: function(influx_client, limit, sortBy, where, callback) {
        influx_query = 'SELECT temperature, airDensity, dewPoint, humidity, pressure FROM ruuvi_outdoor_measurements';

        if (where != null) {
            influx_query += where;
        }
    
        influx_query += ' ORDER BY ' + sortBy.toString();
        
        if (limit > 0) {
            influx_query += ' LIMIT ' + limit.toString();
        }
        
        //console.log(influx_query)

        influx_client.query(influx_query)
        .then(data => { callback(data); })
        .catch(err => { console.log(err); callback(null); });
    }
}


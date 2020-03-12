

module.exports = { 

    /**
     * Generates JSON response that is send to user.
     * 
     * @param {*} limit Amount of results to get.
     * @param {*} sortBy Sort by descending or ascending.
     * @param {*} where Where part of the query.
     * @param {*} api_result Results from SQL query.
     * @param {*} influx_con Influx connection object.
     * @param {*} callback Sends the JSON to user.
     */
    generateResponse: function(measurements, limit, sortBy, api_result, callback) {
        try {
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
    
            if (measurements != null) status = "Ok"
    
            var JSON_res = {
                "status" : status,
                "user" : api_result[0].name,
                "request_time": date,
                "limit": limit,
                "length": length,
                "sortby": sortBy,
                "body": []
            };
    
            if (measurements != null) {
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

        } catch (err) { console.log(err); }
    }
}

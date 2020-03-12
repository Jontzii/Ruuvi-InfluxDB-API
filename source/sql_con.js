
module.exports = {

    /**
     * Check API key against SQL database.
     * 
     * @param {*} key Given API key.
     * @param {*} sql_client SQL Client connection.
     * @param {*} callback Callback to rest of the application.
     */
    checkAPIKey: function(key, sql_client, callback) {
        
        var queryString = "SELECT api_key, name, length_limit FROM RuuviAPIKeys WHERE api_key = ?";
        var pass = false;
        var length_limit = null;

        sql_client.query(queryString, [ key ], function (err, result) {
            
            if (err) { console.log(err) }
            else if (result.length > 0) {
                length_limit = result[0].length_limit;
                pass = true;
            }
            
            callback(result, pass, length_limit);
        });
    }
}

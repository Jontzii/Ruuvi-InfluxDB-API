

module.exports = {
    
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
    checkParameters: function(limit = 1, sortBy = "DESC", from, to, length_limit, callback) {

        // This function may need refactoring
        try {
            where = "";

            // Check limit
            if (Number.isInteger(parseInt(limit)) && !Array.isArray(limit)) {
                // Limit is integer && not array

                if (length_limit != null && limit > length_limit) 
                    limit = length_limit;

                if (length_limit == null && limit <= 0) limit = 0;
                else if (length_limit != null && limit < 1) limit = 1;

            }

            // Check sort
            if (!Array.isArray(sortBy)) {

                if (sortBy.toUpperCase() != "ASC") sortBy = "DESC";
                else sortBy = "ASC";

            } else sortBy = "DESC";

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

            if (fromPass && toPass)
                where = " WHERE " + "time > now() - " + from + " AND " + "time < now() - " + to;
            else if (fromPass)
                where = " WHERE " + "time > now() - " + from;
            else if (toPass)
                where = " WHERE " + "time < now() - " + to;

        } 
        catch (err) { console.log(err); } 
        finally { callback(limit, sortBy, where); }
    },

    /**
     * Sets indent.
     * 
     * @param {*} indent true or false
     * @param {*} callback -
     */
    setIndent: function(indent = "false", app) {

        try {
            var JSON_spaces = 0

            if (!Array.isArray(indent) && indent.toLowerCase() == "true") JSON_spaces = 2;
        } 
        catch (err) { console.log(err); }
        finally { app.set('json spaces', JSON_spaces); }
    }
}

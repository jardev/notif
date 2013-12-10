/*
 * GET home page.
 */

exports.index = function(db) {
    return function(req, res) {
        var event_collection = db.get("events");
        var events = event_collection.find({}, { limit:20 }, function(e, docs) {
            res.render('index', {
                title: 'Notif',
                events_str: JSON.stringify(docs),
                "eventlist": docs
            });
        });
    };
};
/*
 * GET home page.
 */
var redis = require('redis');

exports.index = function(db) {
    return function(req, res) {
        var event_collection = db.get("events");
        var events = event_collection.find({}, { limit:20 }, function(e, docs) {
            res.render('index', {
                title: 'Notif',
                events_str: JSON.stringify(docs),
                eventlist: docs,
                user: req.user
            });
        });
    };
};

exports.newevent = function(passport) {
    return function(req, res) {
        if (!req.user) {
            res.redirect('/auth/facebook');
        } else {
            res.render('new_event');
        }
    };
};

function publish_event(app, event) {
    // render template
    app.render('news_item', {
        event: event,
        event_str: JSON.stringify(event)
    }, function(err, html) {
        // and send it to redis
        var client = redis.createClient();
        client.publish('news', html);
    });
}



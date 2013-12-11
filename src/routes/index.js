/*
 * GET home page.
 */
var moment = require('moment');

exports.index = function(db) {
    return function(req, res) {
        var event_collection = db.get("events");
        var events = event_collection.find({},
            { limit: 10, sort: { reported_at: -1} },
            function(e, docs) {
                res.render('index', {
                    title: 'Notif',
                    events_str: JSON.stringify(docs),
                    eventlist: docs,
                    user: req.user,
                    moment: moment
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

exports.postevent = function(app, passport, db, client) {
    return function(req, res) {
        if (!req.user) {
            return res.redirect('/auth/facebook');
        }

        req.assert('title', 'Вкажіть, що трапилось').notEmpty();
        req.assert('address', 'Вкажіть де трапилась подія').notEmpty();
        if (req.body.latitude) {
            req.assert('latitude', 'Невірна адреса').notEmpty().isFloat();
        }
        if (req.body.longitude) {
            req.assert('longitude', 'Невірна адреса').notEmpty().isFloat();
        }

        req.sanitize('latitude').toFloat();
        req.sanitize('longitude').toFloat();

        var errors = req.validationErrors();

        if (!errors) {
            // create and publish event
            collection = db.get('events');
            collection.insert({
                title: req.body.title,
                description: req.body.description,
                address: req.body.address,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                reported_at: Date()
            }, function(err, doc) {
                publish_event(app, client, doc);
            });
            res.redirect('/');
        } else {
            res.render('new_event', { errors: errors });
        }
    };
};

function publish_event(app, client, event) {
    // render template
    app.render('news_item', {
        moment: moment,
        event: event,
        event_str: JSON.stringify(event)
    }, function(err, html) {
        console.log(err);
        // and send it to redis
        console.log(html);
        if (!err)
            client.publish('news', html);
    });
}



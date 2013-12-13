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
                    title: 'Головна',
                    events_str: JSON.stringify(docs),
                    eventlist: docs,
                    user: req.user,
                    moment: moment
            });
        });
    };
};

exports.invite_user = function(db) {
    return function(req, res) {
        if (!req.user) {
            return res.redirect('/auth/facebook');
        }

        if (!req.params.facebook_id)
            return res.redirect('/people');

        invitations = db.get("invitations");
        invitations.insert({
            facebook_id: req.params.facebook_id,
            date: Date(),
            invited_by: req.user
        }, function(err, doc) {
            res.redirect('/people');
        });
    };
};

exports.delete_invite = function(db) {
    return function(req, res) {
        if (!req.user) {
            return res.redirect('/auth/facebook');
        }

        if (!req.params.facebook_id)
            return res.redirect('/people');

        invitations = db.get("invitations");
        invitations.remove({
            facebook_id: req.params.facebook_id,
            "invited_by._id": req.user._id
        }, function(err, docs) {
            res.redirect('/people');
        });
    };
};

exports.people = function(db, facebook) {
    return function(req, res) {
        if (!req.user) {
            return res.redirect('/auth/facebook');
        }

        facebook.getFbData(req.user.token, '/me/friends', function(data) {
            var all_friends = JSON.parse(data)['data'];

            db.get("users").find({ "invited_by._id": req.user._id }, function(err, users) {
                db.get("invitations").find({
                    "invited_by._id": req.user._id
                }, function(err, docs) {
                    var invitations = {};
                    var registered = {};
                    docs.forEach(function(doc) {
                        invitations[doc.facebook_id] = doc;
                    });
                    users.forEach(function(doc) {
                        registered[doc.facebook_id] = doc;
                    });

                    var friends = [];
                    var invited_friends = [];
                    all_friends.forEach(function(friend) {
                        var i = invitations[friend.id];
                        if (i) {
                            invited_friends.push(friend);
                        } else {
                            var r = registered[friend.id];
                            if (!r)
                                friends.push(friend);
                        }
                    });

                    res.render('people', {
                        user: req.user,
                        users: users,
                        friends: friends,
                        invited_friends: invited_friends
                    });
                });
            });
        });
    };
};

exports.newevent = function(req, res) {
    if (!req.user) {
        res.redirect('/auth/facebook');
    } else {
        res.render('new_event', {
            user: req.user
        });
    }
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
                reported_at: Date(),
                reporter: req.user
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



/**
 * Notif server
 */
// Express and HTTP
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var expressValidator = require('express-validator');
var flash = require('connect-flash');

var app = express();

// Load configuration
var config = require('./config');
config[app.get('env')]();

// Mongo DB
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/notif');

// Facebook Authentication
var facebook = require('./util/facebook');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
        clientID: "611838998881678",
        clientSecret: "d101ddf251be6c577deb7c47e2c469db",
        callbackURL: config.SITE_ADDRESS + "/auth/facebook/callback"
    }, function(accessToken, refreshToken, profile, done) {
        // check if the user is verified on Facebook
        if (!profile._json.verified) {
            return done(null);
        }

        // check if the user exists
        var users = db.get("users");
        users.findOne({ facebook_id: profile.id }, function(err, user) {
            if (err) {
                console.log(err);
                return done(null);
            }

            if (user) {
                users.updateById(user._id, { $set: { token: accessToken } },
                    function(err, doc) {
                        done(null, user);
                    }
                );
            } else {
                // Check if there's an invitation
                var invitations = db.get("invitations");
                invitations.findOne({ facebook_id: profile.id }, function(err, invitation) {
                    if (err)
                        return done(null);
                    if (invitation) {
                        users.insert({
                            facebook_id: profile.id,
                            name: profile.displayName,
                            email: profile._json.email,
                            registered_at: Date(),
                            invited_at: invitation.date,
                            invited_by: invitation.inviter_by,
                            token: accessToken
                        }, function(err, user) {
                            if (err)
                                return done(null);
                            invitations.remove(invitation);
                            done(null, user);
                        });
                    }
                });
            }
        });
    })
);
passport.serializeUser(function(user, done) {
    done(null, user.facebook_id);
});

passport.deserializeUser(function(id, done) {
    var users = db.get("users");
    users.findOne({ facebook_id: id }, function(err, user) {
        if (err)
            done(null);
        else
            done(null, user);
    });
});

// Redis and Socket.IO
var redis = require('redis');
var client = redis.createClient();
console.log('Connected to Redis server');

var io = require('socket.io');

// all environments
app.set('port', process.env.PORT || config.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.cookieParser('AsJjhsdjJH34jMNjhs2sjjh2jaHAJmwmsJH34hsdfkjh2'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.all('*', function(req, res, next) {
    res.locals.app_env = app.get('env');
    next();
});

// Routes
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['basic_info', 'email', 'user_friends', 'user_about_me',
            'publish_actions', 'photo_upload', 'publish_stream']
}));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/' }));
app.get('/', routes.index(db));
app.get('/newevent', routes.newevent);
app.post('/newevent', routes.postevent(app, passport, db, client));
app.get('/people', routes.people(db, facebook));
app.get('/invitations/:facebook_id/invite', routes.invite_user(db));
app.get('/invitations/:facebook_id/delete', routes.delete_invite(db));
app.get('/auth/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var socket = io.listen(server);
socket.on('connection', function(client) {
    var subscribe = redis.createClient();
    subscribe.subscribe('news');

    subscribe.on("message", function(channel, message) {
        client.send(message);
    });

    client.on("message", function(msg) {});

    client.on("disconnect", function() {
        subscribe.quit();
    });
});



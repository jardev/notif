/**
 * Notif server
 */
var PORT = 3000;
var HOST = "localhost";
var SITE_ADDRESS = "http://localhost:3000";

// Express and HTTP
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var expressValidator = require('express-validator');
var flash = require('connect-flash');

var app = express();

// Mongo DB
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/notif');

// Facebook Authentication
var facebook = require('./util/facebook');

var users = [];
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
        clientID: "611838998881678",
        clientSecret: "d101ddf251be6c577deb7c47e2c469db",
        callbackURL: SITE_ADDRESS + "/auth/facebook/callback"
    }, function(accessToken, refreshToken, profile, done) {
        /*User.findOrCreate(..., function(err, user) {
            if (err) { return done(err); }
            done(null, user);
        });*/
        console.log(profile);
        facebook.getFbData(accessToken, '/me/friends', function(data){
            console.log(data);
        });
        users[profile["id"]] = profile;
        done(null, profile);
    })
);
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    var user = users[id];
    done(null, user);
});

// Redis and Socket.IO
var redis = require('redis');
var client = redis.createClient();
console.log('Connected to Redis server');

var io = require('socket.io');

// all environments
app.set('port', process.env.PORT || PORT);
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
app.get('/newevent', routes.newevent(passport));
app.post('/newevent', routes.postevent(app, passport, db, client));
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



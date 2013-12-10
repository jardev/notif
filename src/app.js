
/**
 * Module dependencies.
 */
var site_address = "http://localhost:3000";

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var expressValidator = require('express-validator');
var flash = require('connect-flash');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/notif');

var app = express();

var facebook = require('./util/facebook');

var users = [];
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
        clientID: "611838998881678",
        clientSecret: "d101ddf251be6c577deb7c47e2c469db",
        callbackURL: site_address + "/auth/facebook/callback"
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

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
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
app.get('/auth/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

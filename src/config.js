exports.production = function () {
    this.PORT = 3000;
    this.HOST = '127.0.0.1';
    this.SITE_ADDRESS = 'http://hot.inua.co';
    this.FACEBOOK_APP_ID = "182345931968294";
    this.FACEBOOK_SECRET = "cb7b8a10212cf51f92d6f79dc8be0252";
};

exports.development = function() {
    this.PORT = 3000;
    this.HOST = 'localhost';
    this.SITE_ADDRESS = 'http://localhost:3000';
    this.FACEBOOK_APP_ID = "611838998881678";
    this.FACEBOOK_SECRET = "d101ddf251be6c577deb7c47e2c469db";
};
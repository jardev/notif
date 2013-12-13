exports.production = function () {
    this.PORT = 80;
    this.HOST = 'hot.inua.co';
    this.SITE_ADDRESS = 'http://hot.inua.co';
};

exports.development = function() {
    this.PORT = 3000;
    this.HOST = 'localhost';
    this.SITE_ADDRESS = 'http://localhost:3000';
};
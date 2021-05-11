'use strict';

require('dotenv').config({ path: process.env.NODE_ENV === 'development' ? './.env-dev' : './.env-prod' })
var path = require('path');
var http = require('http');
var oas3Tools = require('oas3-tools');
var serverPort = 8080;

global.logger = require('./utils/logger');

//TODO: Add log files and formats for production NODE_ENV

// swaggerRouter configuration
var options = {
    routing: {
        loglevel: 'info',
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function() {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});

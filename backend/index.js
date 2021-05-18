'use strict';

require('dotenv').config({ path: process.env.NODE_ENV === 'development' ? './.env-dev' : './.env-prod' })
var path = require('path');
var http = require('http');
var cors = require('cors')
var oasTools = require('oas-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var express = require('express');
const logger = require('./utils/logger');

var serverPort = process.env.PORT;

global.logger = require('./utils/logger');

//TODO: Add log files and formats for production NODE_ENV

// swaggerRouter configuration
var options = {
    loglevel: 'info',
    controllers: path.join(__dirname, './controllers')
};

oasTools.configure(options)
var spec = fs.readFileSync(path.join(__dirname, './api/openapi.yaml'), 'utf8');
var oasDoc = jsyaml.safeLoad(spec);
var app = express();
if (process.env.NODE_ENV === 'development') {
    app.use(cors())
}
app.use(express.json())

oasTools.initialize(oasDoc, app, function() {
    // Initialize the Swagger middleware
    http.createServer(app).listen(serverPort, function() {
        logger.info('Your server is listening on port %d', serverPort);
    });
});

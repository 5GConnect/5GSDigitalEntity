'use strict';
const coreComponentInfoHandler = require('./handler/CoreComponentInformationHandler')
const logger = require('../utils/logger');

module.exports.getCoreComponentInfo = function getCoreComponentInfo(req, res, next) {
    coreComponentInfoHandler.getCoreComponentsInstanceURI()
        .then(componentsURI => {
            Promise.all(componentsURI.map(componentURI => coreComponentInfoHandler.getCoreComponentsInfo(componentURI)))
                .then((values) => {
                    res.status(200).send(values);
                }).catch(genericError => {
                    res.status(500).send(genericError);
                })
        }).catch(genericError => {
            res.status(500).send(genericError);
        })
};

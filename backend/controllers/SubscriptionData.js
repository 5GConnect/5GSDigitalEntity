'use strict';
const subscriptionDataHandler = require('./handler/SubscriptionDataHandlers')
const coreComponentInfoHandler = require('./handler/CoreComponentInformationHandler')
const logger = require('../utils/logger');

module.exports.getSubscriptionInfo = function getSubscriptionInfo(req, res, next) {
    coreComponentInfoHandler.getCoreComponentInstanceURI('UDR')
        .then(componentURI => {
            coreComponentInfoHandler.getCoreComponentServicesInfo(componentURI)
                .then(services => {
                    subscriptionDataHandler.getUESubscriptionData(req.params.ueID, services['nudr-dr'].address, services['nudr-dr'].partialPath).then(
                        data => {
                            logger.verbose(`Sending response: ${JSON.stringify(data)}`);
                            res.status(200).send(data)
                        }
                    ).catch()
                })
                .catch(genericError => {
                    res.send(genericError);
                })
        }).catch(genericError => {
            res.send(genericError);
        })
};

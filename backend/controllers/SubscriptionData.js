'use strict';
const handler = require('./handler/SubscriptionDataHandlers')
const logger = require('../utils/logger');

module.exports.getSubscriptionInfo = function getSubscriptionInfo(req, res, next, ueID) {
    handler.getCoreComponentInstanceURI('UDR')
        .then(componentURI => {
            handler.getCoreComponentServicesInfo(componentURI)
                .then(services => {
                    handler.getUESubscriptionData(ueID, services['nudr-dr'].address, services['nudr-dr'].partialPath).then(
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

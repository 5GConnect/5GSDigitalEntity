'use strict';
const logger = require('../utils/logger');
const handler = require('./handler/SubscriptionDataHandlers')

module.exports.getSubscriptionInfo = function getSubscriptionInfo(req, res, next, ueID) {
    logger.info("Obtaining UDR instance URI");
    handler.getCoreComponentInstanceURI('UDR')
        .then(componentURI => {
            logger.info("Obtaining UDR instance exposed services");
            handler.getCoreComponentServicesInfo(componentURI)
                .then(services => {
                    handler.getUESubscriptionData(ueID, services['nudr-dr'].address, services['nudr-dr'].partialPath).then(
                        data => {
                            logger.info(`Sending response: ${JSON.stringify(data)}`);
                            res.status(200).send(data)
                        }
                    ).catch()
                })
                .catch(genericError => {
                    logger.error("Unable to obtain UDR instance exposed services");
                    res.send(genericError);
                })
        }).catch(genericError => {
            logger.error("Unable to obtain UDR instance URI");
            res.send(genericError);
        })
};

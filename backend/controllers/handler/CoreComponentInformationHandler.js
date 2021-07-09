const logger = require('../../utils/logger');
const requestManager = require('../utils/RequestManager')

/**
 *
 * @param {string} component the core component of which URI is needed
 * @returns a promise resolved with the component URI in NRF or rejected with a generic error
 */
module.exports.getCoreComponentInstanceURI = (component) => {
    logger.info(`Obtaining ${component} instance exposed service`);
    return requestManager.makeARequest(process.env.NRF_URL,
        'GET',
        `/nnrf-nfm/v1/nf-instances?nf-type=${component}`,
        data => data._links.items[0].href.split(/:[0-9]+/)[1])
}


module.exports.getCoreComponentsInstanceURI = () => {
    logger.info('Obtaining components instance exposed service');
    return requestManager.makeARequest(process.env.NRF_URL,
        'GET',
        '/nnrf-nfm/v1/nf-instances',
        data => data._links.items.map(item => item.href.split(/:[0-9]+/)[1]))
}

/**
 *
 * @param {string} componentURI the core component URI in NRF
 * @returns a promise resolved with an array containing the service name and the info needed to use it (address and path) or rejected with a generic error
 */
module.exports.getCoreComponentServicesInfo = (componentURI) => {
    //Technical debdt: get first element of ipEndPoints and versions. TODO: validate correctness.
    logger.info(`Obtaining ${componentURI} exposed service`);
    return requestManager.makeARequest(process.env.NRF_URL,
        'GET',
        `${componentURI}`,
        data => {
            let nfServices = data.nfServices
            let response = {}
            nfServices.forEach(nfService => {
                let ipEndPoint = nfService.ipEndPoints[0]
                response[nfService.serviceName] = {
                    address: `${nfService.scheme}://${ipEndPoint.ipv4Address}:${ipEndPoint.port}`,
                    partialPath: `/${nfService.serviceName}/${nfService.versions[0].apiVersionInUri}`
                }
            });
            return response
        });
}

module.exports.getCoreComponentsInfo = (componentURI) => {
    //Technical debdt: get first element of ipEndPoints and versions. TODO: validate correctness.
    logger.info(`Obtaining ${componentURI} informations`);
    return requestManager.makeARequest(process.env.NRF_URL,
        'GET',
        `${componentURI}`,
        data => {
            return {
                instance: data.nfType,
                instanceStatus: data.nfType,
                instanceId: data.nfInstanceId,
                services: data.nfServices
            }
        });
}

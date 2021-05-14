'use strict';
const logger = require('../../utils/logger');
const http2 = require('http2');
const errorHandler = require('./ErrorHandler')

function makeARequest(clientAddress, method, requestPath, onSuccess) {
    return new Promise((resolve, reject) => {
        //Technical debdt: use dns or make nrf transport address an external parameter. TODO: fix
        let client = http2.connect(clientAddress);
        let nrfRequest = client.request({ ':method': method, ':path': requestPath });
        nrfRequest.on('response', (responseHeaders) => {
            let status = responseHeaders[':status']
            if (status !== 200) {
                reject(errorHandler.handleError(responseHeaders));
                client.destroy();
            } else {
                let data = '';
                nrfRequest.on('data', (chunk) => { data += chunk; });
                nrfRequest.on('end', () => {
                    resolve(onSuccess(JSON.parse(data)));
                    client.destroy();
                });
            }
        });
    });
}

/**
 *
 * @param {string} component the core component of which URI is needed
 * @returns a promise resolved with the component URI in NRF or rejected with a generic error
 */
module.exports.getCoreComponentInstanceURI = (component) => {
    logger.info(`Obtaining ${component} instance exposed service`);
    return makeARequest('http://127.0.0.10:7777',
        'GET',
        `/nnrf-nfm/v1/nf-instances?nf-type=${component}`,
        data => data._links.items[0].href.split(/:[0-9]+/)[1])
}

/**
 *
 * @param {string} componentURI the core component URI in NRF
 * @returns a promise resolved with an array containing the service name and the info needed to use it (address and path) or rejected with a generic error
 */
module.exports.getCoreComponentServicesInfo = (componentURI) => {
    //Technical debdt: get first element of ipEndPoints and versions. TODO: validate correctness.
    logger.info(`Obtaining ${componentURI} exposed service`);
    return makeARequest('http://127.0.0.10:7777',
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

module.exports.getUESubscriptionData = function(ueImsi, clientAddress, partialRequestPath) {
    /*
     * Technical debdt: /subscription-data/{ue-imsi}/{plmnid}/provisioned-data/sm-data should return all necessary info. Due to O5GS implementation state
     * this is not true. Thus /subscription-data/{ue-imsi}/{plmnid}/provisioned-data/am-data is needed.
     */
    //TODO: Refactoring
    logger.info(`Obtaining ${ueImsi} subscription data`);
    let homePLMNI = ueImsi.split("-")[1].substring(0, 6);
    return makeARequest(clientAddress,
        'GET',
        `${partialRequestPath}/subscription-data/${ueImsi}/${homePLMNI}/provisioned-data/am-data`,
        async amData => {
            let defaultSNssais = amData.nssai.defaultSingleNssais ? amData.nssai.defaultSingleNssais : []
            let sNssais = amData.nssai.singleNssais ? amData.nssai.singleNssais : []
            defaultSNssais = defaultSNssais.map(defaultSNssai => {
                return makeARequest(clientAddress,
                    'GET',
                    `${partialRequestPath}/subscription-data/${ueImsi}/${homePLMNI}/provisioned-data/sm-data?single-nssai=${encodeURIComponent(JSON.stringify(defaultSNssai))}`,
                    smDataDefaultSNssai => smDataDefaultSNssai.dnnConfigurations).then(dnnConfiguration => {
                    defaultSNssai["dnnConfigurations"] = dnnConfiguration;
                    return defaultSNssai;
                });
            });
            sNssais = sNssais.map(sNssai => {
                return makeARequest(clientAddress,
                    'GET',
                    `${partialRequestPath}/subscription-data/${ueImsi}/${homePLMNI}/provisioned-data/sm-data?single-nssai=${encodeURIComponent(JSON.stringify(sNssai))}`,
                    smDataSNssai => smDataSNssai.dnnConfigurations).then(dnnConfiguration => {
                    sNssai["dnnConfigurations"] = dnnConfiguration;
                    return sNssai;
                });
            });
            amData.nssai.defaultSingleNssais = await Promise.all(defaultSNssais)
            amData.nssai.singleNssais = await Promise.all(sNssais)
            return amData;
        })
}

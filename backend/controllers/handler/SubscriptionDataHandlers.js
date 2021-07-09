'use strict';
const logger = require('../../utils/logger');
const requestManager = require('../utils/RequestManager')


module.exports.getUESubscriptionData = function(ueImsi, clientAddress, partialRequestPath) {
    /*
     * Technical debdt: /subscription-data/{ue-imsi}/{plmnid}/provisioned-data/sm-data should return all necessary info. Due to O5GS implementation state
     * this is not true. Thus /subscription-data/{ue-imsi}/{plmnid}/provisioned-data/am-data is needed.
     */
    //TODO: Refactoring
    logger.info(`Obtaining ${ueImsi} subscription data`);
    let homePLMNI = ueImsi.split("-")[1].substring(0, 6);
    return requestManager.makeARequest(clientAddress,
        'GET',
        `${partialRequestPath}/subscription-data/${ueImsi}/${homePLMNI}/provisioned-data/am-data`,
        async amData => {
            let defaultSNssais = amData.nssai.defaultSingleNssais ? amData.nssai.defaultSingleNssais : []
            let sNssais = amData.nssai.singleNssais ? amData.nssai.singleNssais : []
            defaultSNssais = defaultSNssais.map(defaultSNssai => {
                return requestManager.makeARequest(clientAddress,
                    'GET',
                    `${partialRequestPath}/subscription-data/${ueImsi}/${homePLMNI}/provisioned-data/sm-data?single-nssai=${encodeURIComponent(JSON.stringify(defaultSNssai))}`,
                    smDataDefaultSNssai => smDataDefaultSNssai.dnnConfigurations).then(dnnConfiguration => {
                    defaultSNssai["dnnConfigurations"] = dnnConfiguration;
                    return defaultSNssai;
                });
            });
            sNssais = sNssais.map(sNssai => {
                return requestManager.makeARequest(clientAddress,
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

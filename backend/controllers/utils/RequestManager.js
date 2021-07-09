const errorHandler = require('../handler/ErrorHandler')
const http2 = require('http2');

module.exports.makeARequest = (clientAddress, method, requestPath, onSuccess) => {
    return new Promise((resolve, reject) => {
        let client = http2.connect(clientAddress);
        let request = client.request({ ':method': method, ':path': requestPath });
        request.on('response', (responseHeaders) => {
            let status = responseHeaders[':status']
            if (status !== 200) {
                reject(errorHandler.handleError(responseHeaders));
                client.destroy();
            } else {
                let data = '';
                request.on('data', (chunk) => { data += chunk; });
                request.on('end', () => {
                    resolve(onSuccess(JSON.parse(data)));
                    client.destroy();
                });
            }
        });
    });
}

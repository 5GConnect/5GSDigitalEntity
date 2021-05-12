const logger = require('../../utils/logger');
module.exports.handleError = (header) => {
    logger.log(header)
    return "Generic-error"
}

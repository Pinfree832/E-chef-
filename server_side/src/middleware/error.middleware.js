const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${err.message}`, { stack: err.stack, url: req.originalUrl, method: req.method });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, errors: err.details });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Duplicate entry - resource already exists' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({ success: false, message, ...(err.data && { data: err.data }) });
}

function createError(message, statusCode = 500, data = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (data) err.data = data;
  return err;
}

module.exports = errorHandler;
module.exports.createError = createError;

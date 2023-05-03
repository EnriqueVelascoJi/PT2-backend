const { CustomAPIError } = require('../errors/custom-error');

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError){
    const jsonError = {
      status: err.status,
      msg: err.message,
    }

    if(err.error) jsonError.error = err.error

    return res.status(err.statusCode).json(jsonError)
  }
  return res.status(500).json({
    status: 'error',
    msg: 'Something went wrong, please try again.'
  })
}

module.exports = errorHandlerMiddleware
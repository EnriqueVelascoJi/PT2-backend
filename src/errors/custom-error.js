class CustomAPIError extends Error {
    constructor(statusCode, message, error = null){
      super(message)
      this.statusCode = statusCode
      this.status = "error"
      this.error = error
    }
  }
  
  const createCustomError = (statusCode, msg, error) => {
    return new CustomAPIError(statusCode, msg, error)
  }
  
  module.exports = {
    CustomAPIError,
    createCustomError,
  }
const loginValidation = (req, res, next) => {
    // Validar inicio de sesion
    if(!req.session.userId) return res.status(401).json({ status: 'error', msg: 'No has iniciado sesion.' })
  
    next()
  }
  
  module.exports = loginValidation
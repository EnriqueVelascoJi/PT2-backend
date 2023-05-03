const asyncWrapper = require('../middleware/async');
const pool = require('../postgres');   
const { createCustomError } = require('../errors/custom-error'); 
const { encrypt, decrypt } = require('../functions/encription');


// --> Crear usuario
const createUser = asyncWrapper(async (req, res, next) => {
    const userData = req.body
    console.log()
    const level = req.session.rol
    //Validar que el usuario sea un administrador
  if(level != 1) return next(createCustomError(400, "Acción no disponible, no tiene permisos de administrador."))

    // Validar numero de agente  
    var response = await pool.query('SELECT COUNT(*) FROM usuario WHERE numeroagente=$1;', [userData.numeroagente])
    if(response.rows[0].count != 0) return next(createCustomError(400, 'Número de agente ya registrado.'))
    // Resgistrar Agente
    
    response = await pool.query(
      'INSERT INTO usuario(numeroagente,contrasenia,rol,status, nombre, apellidop, apellidom) values($1,$2,$3,$4,$5, $6, $7);',
      [userData.numeroagente, userData.contrasenia, userData.rol, userData.status, userData.nombre, userData.apellidoP, userData.apellidoM]
    )
    
    res
    .status(201)
    .json({
      status: "success",
      msg: "Resgitro de agente exitoso.",
      data: userData
    })
    .end()
  })
// --> Iniciar sesión
const login = asyncWrapper( async(req,res,next) =>{
  const userData = req.body
  const logsesion = req.session.userId
  
  //Validar si hay sesion iniciada
  if(logsesion) return next(createCustomError(400, "Sesion iniciada, porfavor salga de la sesion"))
  
  //validar usuario
  if(userData.numeroagente && userData.contrasenia){
    const userf = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1 AND contrasenia=$2',[userData.numeroagente,userData.contrasenia])

    if(userf.rows.length == 1) {
      console.log(userf.rows)

      if(userf.rows[0].status == 1)return next(createCustomError(400, "Usuario bloqueado, contacta al administrador."))

      req.session.userId = userData.numeroagente
      req.session.rol = userf.rows[0].rol
      //console.log(req.session)

      //Log in usuario
      res.json({
        status: "success",
        msg: "Login de agente exitoso.",
        data: ""
      }).end()
    } else {
      return next(createCustomError(400, "Credenciales invalidas."))
    }
  }else{
    return next(createCustomError(400, "Credenciales invalidas."))
  }
})
// --> Cerrar sesion
const logOffs = asyncWrapper(async(req,res,next) =>{
  req.session.destroy();

  res.status(200).json({ status: "success", msg: "Sesion cerrada", }).end()
})
// --> Probar sesion
const pruebaLogin = asyncWrapper(async(req,res,next) =>{
  res.status(200).json({ status: "success", msg: "Si hay sesion", }).end()
})
// --> Editar usuario
const editUser = asyncWrapper( async(req,res,next) =>{
  const userData = req.body
  const level = req.session.rol

  //Validar que el usuario sea un administrador
  if(level != 1) return next(createCustomError(400, "Acción no disponible, no tiene permisos de administrador."))
  
  //Validar que el usuario a editar exista
  var response = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1',[userData.numeroagente])
  if(response.rows.length != 1) return next(createCustomError(400, "El usuario a editar no existe en la base de datos."))

  //Editar usuario
  try{
    response = await pool.query('UPDATE usuario SET contrasenia=$1, status=$2, nombre=$3, apellidop=$4, apellidom=$5 WHERE numeroagente=$6',[userData.contrasenia, userData.status, userData.nombre, userData.apellidop, userData.apellidom, userData.numeroagente])
    res.json({
      status: "success",
      msg: "Datos actualizados exitosamente",
      data: ""
    }).end()
  }catch(error){
    console.log(error)
      return next(error)
  }
})
// --> Eliminar usuario
const deleteUser = asyncWrapper( async(req,res,next) =>{
  const userData = req.body
  const level = req.session.rol

  //Validar que el usuario sea un administrador
  if(level != 1) return next(createCustomError(400, "Acción no disponible, no tiene permisos de administrador."))
  
  //Validar que el usuario a editar exista
  var response = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1',[userData.numeroagente])
  if(response.rows.length != 1) return next(createCustomError(400, "El usuario a eliminar no existe en la base de datos."))

  //Eliminar usuario
  try{
    response = await pool.query('DELETE FROM usuario WHERE numeroagente=$1',[userData.numeroagente])
    res.json({
      status: "success",
      msg: "Usuario eliminado exitosamente",
      data: ""
    }).end()
  }catch(error){
    console.log(error)
      return next(error)
  }
})
// --> Bloquear/Desbloquear usuario
const blockUser = asyncWrapper(async(res,req,next)=>{
  const userData = req.body
  const level = req.session.rol

  //Validar que el usuario sea un administrador
  if(level != 1) return next(createCustomError(400, "Acción no disponible, no tiene permisos de administrador."))
  
  //Validar que el usuario a bloquear exista
  var response = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1',[userData.numeroagente])
  if(response.rows.length != 1) return next(createCustomError(400, "El usuario a bloquear no existe en la base de datos."))

  //Bloquear usuario
  try{
    response = await pool.query('UPDATE usuario SET status=$1 WHERE numeroagente=$2',[userData.status, userData.numeroagente])
    res.json({
      status: "success",
      msg: "Datos actualizados exitosamente",
      data: ""
    }).end()
  }catch(error){
    console.log(error)
      return next(error)
  }
});
// --> Registro de involucrados
const involvedRegister = asyncWrapper(async(req,res,next)=>{
  const involvedArray = req.body.involucrados;
  const idIncidente = req.body.idIncidente;
  const agentnumber = req.session.userId

  //console.log(involvedArray)

  //Consultar el incidentevial
  var response = await pool.query('SELECT * FROM incidentevial WHERE idincidente=$1',[idIncidente])
  
  //Verificar que exista el incidente
  if(response.rows.length != 1) return next(createCustomError(400, "El incidente seleccionado es incorrecto."))

  var usuarioResponse = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1',[agentnumber])

  //Verificar que exista el agente
  if(usuarioResponse.rows.length != 1) return next(createCustomError(400, "No existe el agente en la base de datos."))

  //Comprobar que el agente sea quien creo el incidente vial
  if(usuarioResponse.rows[0].idusuario != response.rows[0].idusuario) return next(createCustomError(400, "No tiene permiso para editar este incidente vial."))

  //Registrar involucrados
  try{
    for(var index in involvedArray){
      console.log(involvedArray[index]);
      var involved = involvedArray[index]

      response = await pool.query('INSERT INTO involucrado(idincidente, modotransporte, tipoinvolucrado, consecuencia, edad, sexo, usocinturon, estadosobriedad,nombre, placa) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ',[idIncidente, involved.modotransporte, involved.tipoinvolucrado, involved.consecuencia, involved.edad, involved.sexo, involved.usocinturon, involved.estadosobriedad, involved.nombre, involved.placa ]);


    }

  }catch(error){
    console.log(error)
    return next(error)
  }

  res.json({
    status: "success",
    msg: "Involucrados registrados exitosamente",
    data: ""
  }).end()

});
// --> Obtenerinvolucrados
const getInvolves = asyncWrapper(async(req,res,next)=>{
  const idIncidente = req.params.id;

  //console.log(involvedArray)

  //Consultar el incidentevial
  var response = await pool.query('SELECT * FROM involucrado WHERE idincidente=$1',[idIncidente])
  
  //Verificar que exista el incidente
  // if(response.rows.length == 0) return next(createCustomError(400, "El incidente seleccionado es incorrecto."))

  

  

  res.json({
    status: "success",
    msg: "Involucrados",
    data: response.rows
  }).end()

});

// --> Editar y eliminar involucrados
const editInvolved = asyncWrapper(async(req,res,next)=>{
  const involvedArray = req.body.involucrados;
  const deleteInvolvedArray = req.body.involucradosEliminados;
  const idIncidente = req.body.idIncidente;
  const agentnumber = req.session.userId;

  //console.log(involvedArray)

  //Consultar el incidentevial
  var response = await pool.query('SELECT * FROM incidentevial WHERE idincidente=$1',[idIncidente])
  
  //Verificar que exista el incidente
  if(response.rows.length != 1) return next(createCustomError(400, "El incidente seleccionado es incorrecto."))

  var usuarioResponse = await pool.query('SELECT * FROM usuario WHERE numeroagente=$1',[agentnumber])

  //Verificar que exista el agente
  if(usuarioResponse.rows.length != 1) return next(createCustomError(400, "No existe el agente en la base de datos."))

  //Comprobar que el agente sea quien creo el incidente vial
  if(usuarioResponse.rows[0].idusuario != response.rows[0].idusuario) return next(createCustomError(400, "No tiene permiso para editar este incidente vial."))

  //Editar involucrados
  var deleteResponse = await pool.query('DELETE FROM involucrado WHERE idincidente=$1',[idIncidente])

  //Registrar involucrados
  try{
    for(var index in involvedArray){
      console.log(involvedArray[index]);
      var involved = involvedArray[index]

      response = await pool.query('INSERT INTO involucrado(idincidente, modotransporte, tipoinvolucrado, consecuencia, edad, sexo, usocinturon, estadosobriedad, nombre, placa) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ',[idIncidente, involved.modotransporte, involved.tipoinvolucrado, involved.consecuencia, involved.edad, involved.sexo, involved.usocinturon, involved.estadosobriedad, involved.nombre, involved.placa ]);


    }

  }catch(error){
    console.log(error)
    return next(error)
  }
  // try{

    

  //   for(var index in involvedArray){
  //     //console.log(involvedArray[index]);
  //     var involved = involvedArray[index]

      
  //     response = await pool.query('UPDATE involucrado SET modotransporte=$1, tipoinvolucrado=$2, consecuencia=$3, edad=$4, sexo=$5, usocinturon=$6, estadosobriedad=$7 WHERE idinvolucrado=$8',[involved.modotransporte, involved.tipoinvolucrado, involved.consecuencia, involved.edad, involved.sexo, involved.usocinturon, involved.estadosobriedad, involved.idinvolucrado ]);

  //   }

  // }catch(error){
  //   console.log(error)
  //   return next(error)
  // }

  // try{
  //   for(var index in deleteInvolvedArray){
  //     //console.log(deleteInvolvedArray[index]);
  //     var indexDelete = deleteInvolvedArray[index]
  //     console.log(indexDelete)
      
  //     response = await pool.query('DELETE FROM involucrado WHERE idinvolucrado=$1',[indexDelete]);

  //   }



  // }catch(error){
  //   console.log(error)
  //   return next(error)
  // }

  res.json({
    status: "success",
    msg: "Involucrados editados exitosamente",
    data: ""
  }).end()

});



//Records 
const getRecords = asyncWrapper(async(req, res, next) => {


  //Get the User Id
  const idusuario = req.session.userId

  //Get the Id from the incidentes table
  const responseId = await pool.query('SELECT idusuario FROM usuario WHERE numeroagente=$1',[idusuario])
  if(responseId.rows.length !== 1) return next(createCustomError(400, "No existe el agente en la base de datos."))
  const idTable = responseId.rows[0].idusuario

  const response = await pool.query('SELECT * FROM incidentevial WHERE idusuario=$1 ORDER BY idincidente ASC', [idTable])

  res
  .status(200)
  .json({
    status: "success",
    msg: "Registros",
    data: response.rows
  })
  .end()

})
const getRecord = asyncWrapper(async(req, res, next) => {


  //Get the User Id
  const idusuario = req.session.userId
  const idincidente = req.params.id

  //Get the Id from the incidentes table
  const responseId = await pool.query('SELECT idusuario FROM usuario WHERE numeroagente=$1',[idusuario])
  if(responseId.rows.length !== 1) return next(createCustomError(400, "No existe el agente en la base de datos."))
  const idTable = responseId.rows[0].idusuario

  const response = await pool.query('SELECT * FROM incidentevial WHERE idusuario=$1 and idincidente=$2', [idTable, idincidente])

  res
  .status(200)
  .json({
    status: "success",
    msg: "Registros",
    data: response.rows
  })
  .end()

})
const newRecord = asyncWrapper(async(req, res, next) => {


  //Get the information
  const recordData = req.body

  //Get the User Id
  const idusuario = req.session.userId

  //Get the Id from the incidentes table
  const responseId = await pool.query('SELECT idusuario FROM usuario WHERE numeroagente=$1',[idusuario])
  if(responseId.rows.length !== 1) return next(createCustomError(400, "No existe el agente en la base de datos."))
  const idTable = responseId.rows[0].idusuario

  //Data validation

  if(recordData.iph !== "-" && recordData.iph !== "") {
    const resulset = await pool.query('Select * from incidentevial where iph=$1',[recordData.iph]);
    if(resulset.rows.length !== 0) return next(createCustomError(400, "Ya hay un registro con ese IPH."))
  }

  //Data inserction
  const responseIncidente = await pool.query(
    'INSERT INTO incidentevial(idusuario,iph,clasificación,personasfallecidas,personaslesionadas,nolesionados,tipo,superficie,fecha,hora,estado,municipio,calle1,calle2,colonia,coordenadax,coordenaday,status,numeroincidente) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING idincidente;',
    [idTable, recordData.iph, recordData['clasificación'], recordData.personasfallecidas, recordData.personaslesionadas, recordData.nolesionados, recordData.tipo, recordData.superficie, recordData.fecha, recordData.hora, recordData.estado, recordData.municipio, recordData.calle1, recordData.calle2, recordData.colonia, recordData.coordenadax, recordData.coordenaday, recordData.status, recordData.numeroincidente]
  )
  
  res
  .status(201)
  .json({
    status: "success",
    msg: "Nuevo registro exitoso.",
    data: recordData,
    extraInfo: responseIncidente.rows[0]
  })
  .end()


})
const editRecord = asyncWrapper(async(req, res, next) => {
  
  //Get the information
  const recordData = req.body

  //Get the id to edit
  const idincidente = req.params.id

  //Get the User Id
  const idusuario = req.session.userId

  //Get the Id from the usuario table
  const responseIdUser = await pool.query('SELECT idusuario FROM usuario WHERE numeroagente=$1',[idusuario])
  if(responseIdUser.rows.length !== 1) return next(createCustomError(400, "No existe el usuario en la base de datos."))
  const idTableUser = responseIdUser.rows[0].idusuario

  //Get the specific incident
  var responseIdincidente = await pool.query('SELECT * FROM incidentevial WHERE idincidente=$1',[idincidente])
  if(responseIdincidente.rows.length != 1) return next(createCustomError(400, "El registro a editar no existe en la base de datos."))
  const idTableRecord = responseIdincidente.rows[0].idusuario

  //Verificar si los id son los mismos
  if(idTableRecord !== idTableUser) return next(createCustomError(400, "No puedes editar registros que no son tuyos"))

  //Data validation
  let idIncidenteAux = -1
  if(recordData.iph) {
    const responseIdincidenteAux = await pool.query('SELECT * FROM incidentevial WHERE iph=$1',[recordData.iph])
    if(responseIdincidenteAux.rows.length !== 0) idIncidenteAux = responseIdincidenteAux.rows[0].idincidente
    
  }
  

  // console.log(1111111, idIncidenteAux, idincidente)

  if(recordData.iph !== "-" && recordData.iph !== "" && idIncidenteAux != idincidente) {
    const resulset = await pool.query('Select * from incidentevial where iph=$1',[recordData.iph]);
    if(resulset.rows.length !== 0) return next(createCustomError(400, "Ya hay un registro con ese IPH."))
  }

  //Editar registro
  let queryText = "UPDATE incidentevial SET "
  let cont = 0
  let dataParams = []
  for(let key in recordData) {
    cont ++
    queryText += `${key}=$${cont+1}`
    dataParams = [...dataParams, recordData[key]]
    if(cont !== Object.keys(recordData).length)
    queryText += ','
  }
  console.log(queryText)
  const response = await pool.query(`${queryText} WHERE idincidente=$1`,
    [idincidente, ...dataParams])
    res.json({
      status: "success",
      msg: "Registro actualizado exitosamente",
      data: recordData
      
    }).end()
  

})
const deleteRecord = asyncWrapper(async(req, res, next) => {

  //Get the id to edit
  const idincidente = req.params.id

  //Get the User Id
  const idusuario = req.session.userId

  //Get the Id from the usuario table
  const responseIdUser = await pool.query('SELECT idusuario FROM usuario WHERE numeroagente=$1',[idusuario])
  if(responseIdUser.rows.length !== 1) return next(createCustomError(400, "No existe el usuario en la base de datos."))
  const idTableUser = responseIdUser.rows[0].idusuario

  //Get the specific incident to delete
  var responseIdincidente = await pool.query('SELECT * FROM incidentevial WHERE idincidente=$1',[idincidente])
  if(responseIdincidente.rows.length != 1) return next(createCustomError(400, "El registro a editar no existe en la base de datos."))
  const idTableRecord = responseIdincidente.rows[0].idusuario

  //Verificar si los id son los mismos
  if(idTableRecord !== idTableUser) return next(createCustomError(400, "No puedes eliminar registros que no son tuyos"))

  //Eliminar registro
    const response = await pool.query('DELETE FROM incidentevial WHERE idincidente=$1',[idincidente])

    res.json({
      status: "success",
      msg: "Registro eliminado correctamente",
      data: ""
    }).end()
})
const getAllRecords = asyncWrapper(async(req, res, next) => {

  
  //Get the rol
  const level = req.session.rol

  //Validar que el usuario sea un administrador
  if(level !== 1) return next(createCustomError(400, "Acción no disponible, no tiene permisos de administrador."))


  const response = await pool.query('SELECT iv.*, us.numeroagente, (iv.personasfallecidas + iv.personaslesionadas +iv.nolesionados) as involucrados FROM incidentevial iv inner join usuario us on iv.idusuario = us.idusuario;')

  res
  .status(200)
  .json({
    status: "success",
    msg: "Todos los registros.",
    data: response.rows
  })
  .end()

})
const getUserBasicInfo = asyncWrapper(async(req,res,next)=>{
  //Get the User Id
  const idusuario = req.session.userId;

  var response = await pool.query(
    'SELECT rol FROM usuario WHERE numeroagente=$1',
    [idusuario]
  )
  if(response.rows.length === 0) return next(createCustomError(400, "Error al recuperar información básica."))

  const finalData = {
    agentnumber: idusuario,
    rol: response.rows[0].rol,
  }

  res.status(200).json({ status: "success", msg: "Información de básica de agente obtenida exitosamente.", data: finalData })
});
const incompleteCount = asyncWrapper(async(req,res,next)=>{
  const agentnumber = req.session.userId;


  var response = await pool.query(
    'SELECT idusuario FROM usuario WHERE numeroagente=$1 ',
    [agentnumber]
  )
  if(response.rows.length === 0) return next(createCustomError(400, "El agente no esta registrado en la base de datos."))

  var idusuario = response.rows[0].idusuario;
  response = await pool.query(
    'SELECT count(*) FROM incidentevial WHERE idusuario=$1 AND status <100 ',
    [idusuario]
  )

  const finalData = {
    incidentscount:response.rows[0].count
  }

  res.status(200).json({ status: "success", msg: "Conteo de incidentes no terminados.", data: finalData })
});
const getLastIncomplete = asyncWrapper(async (req,res,next)=>{
  const agentnumber = req.session.userId;

  var response = await pool.query(
    'SELECT idusuario FROM usuario WHERE numeroagente=$1 ',
    [agentnumber]
  )
  if(response.rows.length === 0) return next(createCustomError(400, "El agente no esta registrado en la base de datos."))

  var idusuario = response.rows[0].idusuario;
  response = await pool.query(
    'SELECT * FROM incidentevial WHERE idusuario=$1 AND status < 100 order by fecha desc LIMIT 5 ',
    [idusuario]
  )

  const finalData = {
    incidents:response.rows
  }

  res.status(200).json({ status: "success", msg: "Ultimos incidentes no terminados recuperados.", data: finalData })

});
const getUsers = asyncWrapper(async(req,res,next)=>{
  const agentnumber = req.session.userId;

  var response = await pool.query(
    'SELECT idusuario, rol FROM usuario WHERE numeroagente=$1 ',
    [agentnumber]
  )
  if(response.rows.length === 0) return next(createCustomError(400, "El agente no esta registrado en la base de datos."))

  if(response.rows[0].rol !== 1) return next(createCustomError(400, "No tienes permisos de administrador"))

  response = await pool.query(
    'SELECT * FROM usuario WHERE rol!=1',
    []
  )

  const finalData = {
    agents:response.rows
  }

  res.status(200).json({ status: "success", msg: "Lista de agentes recuperada.", data: finalData })

});
const testEncrypt = asyncWrapper(async(req,res,next)=>{
  const matricula = req.body.matricula;

  const encmatricula = encrypt(matricula)

  const decmatricula = decrypt(encmatricula)

  const finalData = {
    original: matricula,
    encriptada: encmatricula,
    desencriptada: decmatricula
  }
  res.status(200).json({ status: "success", msg: "Prueba encriptacion.", data: finalData })

});

module.exports = {
  createUser,
  login,
  logOffs,
  pruebaLogin,
  editUser,
  deleteUser,
  involvedRegister,
  editInvolved,
  getInvolves,

  getRecords,
  getRecord,
  newRecord,
  editRecord,
  deleteRecord,
  getAllRecords,
  getUserBasicInfo,
  incompleteCount,
  getLastIncomplete,
  getUsers,
  testEncrypt,

}


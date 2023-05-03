
const express = require('express');

const morgan = require('morgan');
var types = require('pg').types;
const { server } = require('./config');
var session = require('express-session');
const cors = require('cors');
const app = express();

//Settings

//Middleware
app.use(morgan('dev'));
app.use(express.json());

app.use(cors())

app.use(session({
  store: null,
  name: 'sid',
  secret: server.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge : 1000*60*60*2,
    sameSite: 'none',
    httpOnly: false,
    secure: true,
  }
}))


//Routes
app.use('/user', require('./routes/user.routes'))
app.use('/records', require('./routes/records.routes'))


app.use(require('./middleware/errorHandler'))
//Static

//Starting the server
app.listen(4000, ()=>{
    console.log("App listening on port 4000")
});



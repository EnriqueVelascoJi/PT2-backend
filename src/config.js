const { config } = require('dotenv')
config()

module.exports = {
    db: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE
    },
    server: {
        port: process.env.PORT,
        type: process.env.TYPE || 'dev',
        secret: process.env.SECRET || 'tony key secret',
        redisHost: process.env.REDIS_HOST || 'localhost',
        redisPort: process.env.REDIS_PORT || 6379,
        
    },
    
}
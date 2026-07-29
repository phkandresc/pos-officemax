const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Guardar logs de errores en error.log
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        // Guardar todos los logs combinados
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        })
    ]
});

// En desarrollo, también imprimimos en la consola con un formato más legible
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
                if (stack) {
                    return `${timestamp} ${level}: ${message}\n${stack}`;
                }
                return `${timestamp} ${level}: ${message}`;
            })
        )
    }));
}

module.exports = logger;

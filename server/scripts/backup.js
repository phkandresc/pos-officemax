const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const logger = require('../config/logger');

// Directorio de backups
const backupDir = path.join(__dirname, '../../database/backups');

// Asegurar que el directorio existe
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const performBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pos_papeleria_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Extraer datos de DATABASE_URL
    // Formato esperado: postgres://user:pass@host:port/dbname
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        logger.error('No se puede realizar el backup: DATABASE_URL no definida');
        return;
    }

    // Comando pg_dump
    // Importante: pg_dump debe estar instalado en el sistema y accesible globalmente
    const command = `pg_dump "${dbUrl}" -F c -f "${filepath}"`;

    logger.info(`Iniciando backup automático de la base de datos: ${filename}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Error al ejecutar pg_dump: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.warn(`Advertencias durante el backup: ${stderr}`);
        }
        logger.info(`Backup completado exitosamente: ${filepath}`);
    });
};

// Programar para que corra todos los días a las 23:59
const scheduleBackups = () => {
    cron.schedule('59 23 * * *', () => {
        logger.info('Ejecutando tarea programada: Backup de base de datos');
        performBackup();
    });
    logger.info('Sistema de backups automáticos inicializado (Programado: 23:59 diario)');
};

module.exports = {
    performBackup,
    scheduleBackups
};

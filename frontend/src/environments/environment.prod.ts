export const environment = {
  production: true,
  apiUrl: 'https://apps.vanguardfresh.pe/app-calibracion/api/v1',
  appName: 'Calibración',
  version: '1.0.0',
  // Configuración de sincronización
  sync: {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutos
    enableAutoSync: true,
    maxRetries: 3,
  },
  // Configuración de storage
  storage: {
    dbName: 'calibracion_db',
    dbVersion: 1,
  },
};

export const environment = {
  production: true,
  apiUrl: 'https://apps.vanguardfresh.pe/app-calibracion/api/v1',
  appName: 'Inspecciones SST',
  version: '1.0.0',
  // Configuración de API
  api: {
    timeout: 30000, // 30 segundos
    retryAttempts: 3,
  },
  // Configuración de sincronización
  sync: {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutos
    enableAutoSync: true,
    maxRetries: 3,
  },
  // Configuración de storage
  storage: {
    dbName: 'inspeccionessst_db',
    dbVersion: 1,
  },
};

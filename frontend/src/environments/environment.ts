// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/inspeccionessst/public/api/v1',
  appName: 'Inspecciones SST',
  version: '1.0.0',
  // Configuración de API
  api: {
    timeout: 30000, // 30 segundos
    retryAttempts: 3,
  },
  // Configuración de sincronización
  sync: {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutos en milisegundos
    enableAutoSync: true,
    maxRetries: 3,
  },
  // Configuración de storage
  storage: {
    dbName: 'inspeccionessst_db',
    dbVersion: 1,
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

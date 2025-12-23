import { contextBridge } from 'electron';
// Здесь можно пробросить secure API, если нужно
contextBridge.exposeInMainWorld('api', {
  // Для примера
});


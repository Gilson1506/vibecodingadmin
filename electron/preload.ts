import { ipcRenderer, contextBridge } from 'electron'

// Expõe APIs seguras para o React (via window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update_available', callback),
    onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update_downloaded', callback),
    downloadUpdate: () => ipcRenderer.send('download_update'),
    restartApp: () => ipcRenderer.send('restart_app'),
    apiProxy: (req: any) => ipcRenderer.invoke('api_proxy', req),
})

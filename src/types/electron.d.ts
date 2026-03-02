export interface ElectronAPI {
    onUpdateAvailable: (callback: () => void) => void;
    onUpdateDownloaded: (callback: () => void) => void;
    downloadUpdate: () => void;
    restartApp: () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

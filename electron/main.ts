import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { autoUpdater } from 'electron-updater'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// Define as URLs para Dev e Produção
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

process.on('uncaughtException', (err) => {
    require('node:fs').writeFileSync('electron_crash.log', err.stack || err.toString());
});

let win: BrowserWindow | null

// Configuração básica do Auto-Updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function createWindow() {
    require('node:fs').writeFileSync('electron_trace.log', 'Starting createWindow\n', { flag: 'a' });
    try {
        win = new BrowserWindow({
            width: 1280,
            height: 800,
            minWidth: 1024,
            minHeight: 768,
            icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs'),
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false, // Permite requisições CORS de file:// para a API externa
            },
        })
        require('node:fs').writeFileSync('electron_trace.log', 'BrowserWindow instantiated\n', { flag: 'a' });

        win.setMenu(null);

        // Intercepta e reescreve cabeçalhos para a API externa (Spoofing)
        // Precisamos incluir tanto o domínio raiz quanto subdomínios
        win.webContents.session.webRequest.onBeforeSendHeaders(
            { urls: ['*://premierp2p.com/*', '*://*.premierp2p.com/*'] },
            (details, callback) => {
                details.requestHeaders['Origin'] = 'https://vibecodingadmin.vercel.app';
                details.requestHeaders['Referer'] = 'https://vibecodingadmin.vercel.app/';
                callback({ requestHeaders: details.requestHeaders });
            }
        );

        // Forçamos a abaixar a página localmente e abrir devtools
        require('node:fs').writeFileSync('electron_trace.log', `Loading index.html from: ${RENDERER_DIST}\n`, { flag: 'a' });
        win.loadFile(path.join(RENDERER_DIST, 'index.html')).catch(err => {
            require('node:fs').writeFileSync('electron_load_error.log', err.message);
        });

        require('node:fs').writeFileSync('electron_trace.log', 'DevTools opening skipped\n', { flag: 'a' });

        // Force external links to open in the system default browser
        win.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http')) {
                require('electron').shell.openExternal(url);
            }
            return { action: 'deny' };
        });

        win.once('ready-to-show', () => {
            require('node:fs').writeFileSync('electron_trace.log', 'ready-to-show emitted\n', { flag: 'a' });
            if (!VITE_DEV_SERVER_URL) {
                autoUpdater.checkForUpdatesAndNotify().catch(err => {
                    console.error("AutoUpdater error", err);
                });
            }
        });
    } catch (e) {
        require('node:fs').writeFileSync('electron_trace.log', 'Exception in createWindow: ' + String(e) + '\n', { flag: 'a' });
    }
}

// Eventos do Auto Updater para mandar mensagens pro Frontend
autoUpdater.on('update-available', () => {
    win?.webContents.send('update_available')
})
autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update_downloaded')
})
ipcMain.on('download_update', () => {
    autoUpdater.downloadUpdate()
})
ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

// IPC Native Proxy to Bypass CORS entirely
ipcMain.handle('api_proxy', async (_event, { url, method, data, headers }) => {
    try {
        const fetchHeaders: Record<string, string> = {}
        if (headers?.['Content-Type']) fetchHeaders['Content-Type'] = headers['Content-Type']
        if (headers?.['Authorization']) fetchHeaders['Authorization'] = headers['Authorization']
        fetchHeaders['Origin'] = 'https://vibecodingadmin.vercel.app'
        fetchHeaders['Referer'] = 'https://vibecodingadmin.vercel.app/'
        fetchHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

        const response = await fetch(url, {
            method,
            headers: fetchHeaders,
            body: data ? JSON.stringify(data) : undefined
        })
        const responseText = await response.text()

        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch (e) {
            return { ok: false, status: response.status, data: { message: responseText.substring(0, 200) } }
        }
        return { ok: response.ok, status: response.status, data: responseData }
    } catch (error: any) {
        return { ok: false, status: 500, data: { message: error.message } }
    }
})

app.whenReady().then(createWindow)

import { app, BrowserWindow, ipcMain } from 'electron'
const { spawn } = require('child_process')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let mediaServer = null
let restartMediaServer = false

const server_path = process.env.NODE_ENV === 'development'
  ? `${__dirname}/server.js`
  : `resources/app.asar.unpacked/source/server.js`

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function startMediaServer (event) {
  if (mediaServer === null) {
    mediaServer = spawn('node', [server_path], {detached: false})
    mediaServer.on('exit', (code, signal) => {
      mediaServer = null
      if (restartMediaServer) {
        mediaServer = spawn('node', [server_path], {detached: false})
        restartMediaServer = false
      } else {
        event.sender.send('MediaServer', 'done')
      }
    })
  }
}

function stopMediaServer () {
  if (mediaServer !== null) {
    mediaServer.kill()
  }
}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    minWidth: 800,
    minHeight: 400,
    frame: false
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    if (mediaServer) {
      stopMediaServer()
    }
    mainWindow = null
  })

  ipcMain.on('min', e => mainWindow.minimize())
  ipcMain.on('max', e => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on('close', e => mainWindow.close())
  ipcMain.on('MediaServer', (event, arg) => {
    if (arg === 'start') startMediaServer(event)
    else if (arg === 'stop') stopMediaServer()
    else if (arg === 'restart') {
      restartMediaServer = true
      stopMediaServer()
    }
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

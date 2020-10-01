import { app, BrowserWindow, ipcMain } from 'electron';
import SerialPort from 'serialport';
import { PORT } from './config';
import { app as expressApp } from './server';
import { attemptToOpenDrawer, COM_PORT_STORAGE_KEY, makeSureSettingsHaveComPort } from './utils/cashDrawer';
import { localStorage } from './utils/localStorage';
import { log } from './utils/logger';

export let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Cash drawer settings',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  expressApp.listen(PORT, () => {
    console.log('Listening on', PORT);
    console.log('version', '1.0.0');
  });

  mainWindow!.loadFile('dist/templates/index.html');
  mainWindow.webContents.on('did-finish-load', async () => {
    await makeSureSettingsHaveComPort();
    log('Settings file is located at: ', localStorage.path)
    const ports = await SerialPort.list();
    const savedPort = localStorage.get(COM_PORT_STORAGE_KEY);
    mainWindow!.webContents.send('list-com-ports', { ports, savedPort });
  });

  const testPort = (_: any, { port }: { port: string }) => attemptToOpenDrawer(port).then(msg => {
    mainWindow!.webContents.send('done-testing', {});
    log(msg)
  }).catch(err => {
    mainWindow!.webContents.send('done-testing', {});
    log(err);
  });

  const savePort = (_: any, { port }: { port: string }) => {
    log('Saved port', port, 'as default');
    localStorage.set(COM_PORT_STORAGE_KEY, port);
  };

  ipcMain.on('test-port', testPort);
  ipcMain.on('save-port', savePort);

  mainWindow.on('closed', () => {
    mainWindow = null;
    ipcMain.removeListener('test-port', testPort);
    ipcMain.removeListener('save-port', savePort);
  });

  mainWindow!.on('closed', function () {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(createWindow);

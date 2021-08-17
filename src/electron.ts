import { app, BrowserWindow, ipcMain, crashReporter } from 'electron';
import SerialPort from 'serialport';
import { PORT } from './config';
import { app as expressApp } from './server';
import { attemptToOpenDrawer, COM_PORT_STORAGE_KEY, ADASYS, makeSureSettingsHaveComPort, adasysToOpenDrawer } from './utils/cashDrawer';
import { localStorage } from './utils/localStorage';
import { log } from './utils/logger';
import electronLog from 'electron-log';
import path from 'path';
import * as tcpPortUsed from 'tcp-port-used';
import ffi from "ffi-napi";
export const PE17CashDrawer = new ffi.Library("PE17CashDrawer.dll", {
  "open": [
  "bool", ["int32", "int32"]
  ],
  "isOpen": [
  "bool", ["int32"]
  ]
  });

const userDataPath = app.getPath ('userData');
app.setPath('userData', path.join(process.cwd(), "cashbox"));
// crashReporter.start({
//   productName: 'cashbox',
//   companyName: 'cashbox',
//   submitURL: 'https://submit.backtrace.io/cashbox/22d968bfd04c27a247c027156745e0289c5808b4ebadbfe394ad2deda626ac2d/minidump',
//   uploadToServer: true,
// });

export let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Cash drawer settings',
    webPreferences: {
      nodeIntegration: true,
      partition: `persist:${new Date().getTime()}`
    },
  });
  mainWindow!.loadFile('dist/templates/index.html');
  mainWindow.webContents.on('did-finish-load', async () => {
    await makeSureSettingsHaveComPort();
    log('Settings file is located at: ', localStorage.path)
    const ports = await SerialPort.list();
    const savedPort = localStorage.get(COM_PORT_STORAGE_KEY);
    const adasys = localStorage.get(ADASYS);
    console.log('from storage adasys -> ', adasys);    
    mainWindow!.webContents.send('list-com-ports', { ports, savedPort, adasys });
  });

  const testPort = (_: any, { port }: { port: string }) => {
    const adasys = localStorage.get(ADASYS);
    if(adasys == true)
    adasysToOpenDrawer().then(msg => {
      mainWindow!.webContents.send('done-testing', {});
      log(msg)
    }).catch(err => {
      mainWindow!.webContents.send('done-testing', {});
      log(err);
    })
    else
    attemptToOpenDrawer(port).then(msg => {
    mainWindow!.webContents.send('done-testing', {});
    log(msg)
  }).catch(err => {
    mainWindow!.webContents.send('done-testing', {});
    log(err);
  })};

  const savePort = (_: any, { port }: { port: string }) => {
    log('Saved port', port, 'as default');
    localStorage.set(COM_PORT_STORAGE_KEY, port);
  };
  const adasys = (_: any, { isAdasys }: { isAdasys: boolean }) => {
    console.log('in main isAdasys->',isAdasys);    
    log('Saved Adasys system', isAdasys);
    localStorage.set(ADASYS, isAdasys);
  };

  ipcMain.on('test-port', testPort);
  ipcMain.on('save-port', savePort);
  ipcMain.on('adasys', adasys);

  mainWindow.on('closed', () => {
    mainWindow = null;
    ipcMain.removeListener('test-port', testPort);
    ipcMain.removeListener('save-port', savePort);
    ipcMain.removeListener('adasys', adasys);
  });

  mainWindow!.on('closed', function () {
    mainWindow = null;
    app.exit();
  });  
}


process.on('uncaughtException', (err) => {
  electronLog.error(`Caught exception: ${err}\n`)
  mainWindow = null;
  app.exit();  
});

process.on('SIGTERM', (err) => {
  electronLog.error(`Caught SIGTERM: ${err}\n`)
  mainWindow = null;
  app.exit();  
});
app.on('ready', () => {
  tcpPortUsed.check(PORT, '127.0.0.1').then(function(inUse:any) {
    console.log(`${PORT}  usage: ${inUse} `);
    if (inUse) {
      app.exit();
      // return false;
    }

    expressApp.listen(PORT, () => {
      console.log('Listening on', PORT);
      console.log('version', '1.0.0');
    }).on('error', function(err) {
      electronLog.error(`Caught exception on start: ${err}\n`)
      mainWindow = null;
      app.exit();
     });
  }, function(err:any) {
    console.error('Error on check:', err.message);
  })
  .then(createWindow)
  .then( ()=>
  {
    setTimeout(function(){mainWindow!.hide(); return true;}, 10000)
  }
);
  // createWindow();
})
// app.whenReady()
// // .then()

// .then(createWindow)
// .then( ()=>
// {
// setTimeout(function(){mainWindow!.hide(); return true;}, 10000)
// }
// );


import { BrowserWindow, ipcMain } from 'electron';
import SerialPort, { OpenOptions } from 'serialport';
import { localStorage } from './localStorage';
import { log } from './logger';

export const COM_PORT_STORAGE_KEY = 'selected-com-port';
const CANDIDATE_PID = 'VID_067B&PID_2303';
const OPEN_CASH_DRAWER_COMMAND = Buffer.from([0x1b, 0x70, 0, 50, 50]);
const CASH_DRAWER_OPTIONS: OpenOptions = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  autoOpen: false,
};

/**
 * sends predefined command with predefined settings
 * rejects if open or write failed
 * resolves with success message if no errors
 */
export function attemptToOpenDrawer(path: string = localStorage.get(COM_PORT_STORAGE_KEY) as string) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort(path, CASH_DRAWER_OPTIONS);
    const closeAndReject = (error: Error) => {
      if (port.isOpen) port.close();
      reject(error);
    };
    port.open((err) => {
      if (err) closeAndReject(err);
      else {
        port.write(OPEN_CASH_DRAWER_COMMAND, (err) => {
          if (err) closeAndReject(err);
          else {
            port.close();
            resolve('no errors');
          }
        });
      }
    });
  });
}

/**
 * preselects com port if nothing is defined in settings
 */
export async function makeSureSettingsHaveComPort() {
  const existing = localStorage.get(COM_PORT_STORAGE_KEY);
  if (existing) return existing;
  const ports = await SerialPort.list();
  let candidate = ports.find((port) => port.pnpId?.includes(CANDIDATE_PID));
  if (!candidate) candidate = ports.find((port) => port.vendorId && port.productId) || ports[0];
  log("Couldn't find settings file. Detected default port as", candidate.path)
  return localStorage.set(COM_PORT_STORAGE_KEY, candidate.path);
}

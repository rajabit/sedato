import { BrowserWindow, ipcMain } from "electron";
import { ValidationStatus } from "types/video2text";
import { validate } from "./video2text";

export default function video2textIpc(win: BrowserWindow) {
  ipcMain.handle(
    "video2text-validate",
    (e: Electron.IpcMainInvokeEvent, args) => {
      validate((event: string, data: ValidationStatus) =>
        callback(event, data)
      );
    }
  );

  const callback = (event: string, args: any) => {
    win?.webContents.send(event, args);
  };
}

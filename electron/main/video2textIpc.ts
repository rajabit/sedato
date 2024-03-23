import { BrowserWindow, ipcMain } from "electron";
import { ValidationStatus, ConvertStatus } from "types/video2text";
import { validate, convert } from "./video2text";

export default function video2textIpc(win: BrowserWindow) {
  ipcMain.handle(
    "video2text-validate",
    (e: Electron.IpcMainInvokeEvent, args) => {
      validate((event: string, data: ValidationStatus) =>
        callback(event, data)
      );
    }
  );

  ipcMain.handle("video2text", (e: Electron.IpcMainInvokeEvent, args) => {
    convert(args.input, (data: ConvertStatus) => callback("video2text", data));
  });

  const callback = (event: string, args: any) => {
    win?.webContents.send(event, args);
  };
}

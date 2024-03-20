import { BrowserWindow, dialog, ipcMain, app, shell } from "electron";
import { convertInterface, convertStat } from "types/hls";
import mp4tohls from "./mp4tohls";

export function ipcList(win: BrowserWindow) {
  ipcMain.handle("open-file", (e: Electron.IpcMainInvokeEvent, args) => {
    dialog
      .showOpenDialog({
        title: "Select Video",
        properties: args.properties,
        filters: args.acceptable,
      })
      .then((result) => {
        win?.webContents.send("open-file", result);
      });
  });

  ipcMain.handle(
    "video-to-hls-start",
    (e: Electron.IpcMainInvokeEvent, args: convertInterface) => {
      mp4tohls(args, app.getPath("documents"), (s, a) =>
        win?.webContents.send("video-to-hls-start-status", {
          stat: s,
          data: a,
        } as convertStat)
      );
    }
  );

  ipcMain.handle("open-folder", (e: Electron.IpcMainInvokeEvent, args: any) => {
    shell.openPath(args.path.replaceAll("/", "\\"));
  });
}

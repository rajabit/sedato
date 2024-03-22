import { BrowserWindow, dialog, ipcMain, app, shell } from "electron";
import { convertInterface, convertStat } from "types/hls";
import { usingSwap, check_ffmpeg } from "./video2hls";
import { spawn } from "child_process";

export default function video2hlsIpc(win: BrowserWindow) {
  ipcMain.handle("open-file", (e: Electron.IpcMainInvokeEvent, args) => {
    dialog
      .showOpenDialog({
        title: "Select File",
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
      usingSwap(args, app.getPath("documents"), (s, a) =>
        win?.webContents.send("video-to-hls-status", {
          stat: s,
          data: a,
        } as convertStat)
      );
    }
  );

  ipcMain.handle("open-folder", (e: Electron.IpcMainInvokeEvent, args: any) => {
    shell.openPath(args.path.replaceAll("/", "\\"));
  });

  ipcMain.handle(
    "check-ffmpeg",
    (e: Electron.IpcMainInvokeEvent, args: any) => {
      check_ffmpeg();
    }
  );

  ipcMain.handle(
    "video-to-hls-stop",
    (e: Electron.IpcMainInvokeEvent, args: any) => {
      console.log(`killing`, args);
      spawn("taskkill", ["/pid", args, "/f", "/t"]);
    }
  );
}

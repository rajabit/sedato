import { IpcRenderer, IpcRendererEvent } from "electron";

const listen = (
  event: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
): IpcRenderer => {
  return window.ipcRenderer.on(event, listener);
};

const invoke = (event: string, args: any): Promise<any> => {
  return window.ipcRenderer.invoke(event, args);
};

const removeListener = (
  channel: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
): IpcRenderer => {
  return window.ipcRenderer.off(channel, listener);
};

const listenOnce = (
  channel: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
): IpcRenderer => {
  return window.ipcRenderer.once(channel, listener);
};

const communicate = async (event: string, props: any = null): Promise<any> => {
  return new Promise((resolve) => {
    listenOnce(event, (event, args) => resolve(args));
    invoke(event, props);
  });
};

const ipcOpenFile = (acceptable: any, properties = ["openFile"]) => {
  return communicate("open-file", {
    acceptable: acceptable,
    properties: properties,
  });
};
const openFolder = (path: string) => {
  invoke("open-folder", { path: path });
};

export {
  listen,
  invoke,
  listenOnce,
  removeListener,
  communicate,
  ipcOpenFile,
  openFolder,
};

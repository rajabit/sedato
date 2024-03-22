import { spawn, spawnSync } from "child_process";
import { ValidationStatus } from "types/video2text";
import { app } from "electron";
import path from "path";
import fs, { mkdir } from "fs";

const check_python_installation = async (
  callback: (args: ValidationStatus) => void,
  tries: number = 3
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (tries == 3) {
        callback({
          status: "progressing",
        });
      }
      const res = spawnSync("python", ["-version"]);
      if (res.error != null && res.error.message.includes("ENOENT")) {
        callback({
          verified: false,
          status: "progressing",
        } as ValidationStatus);

        const proc = spawn(
          "winget",
          ["install", "-e", "--id", "Python.Python.3.10"],
          {
            shell: true,
            stdio: ["pipe", "pipe", "ignore"],
            timeout: 10000,
          }
        );

        proc?.stdout?.on("data", function (data) {
          callback({
            verified: false,
            status: "progressing",
          } as ValidationStatus);
        });

        proc.on("close", (code) => {
          if (tries > 0) {
            check_python_installation(callback, tries - 1);
          } else {
            callback({
              verified: false,
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });

        proc.on("error", function (err) {
          if (tries > 0) {
            check_python_installation(callback, tries - 1);
          } else {
            callback({
              verified: false,
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });
      } else {
        callback({
          status: "checked",
        } as ValidationStatus);
        resolve("checked");
      }
    } catch (ex) {
      callback({
        status: "failed",
      });
      resolve("failed");
    }
  });
};

const setup_venv = async (
  callback: (args: ValidationStatus) => void,
  tries: number = 3
) => {
  return new Promise((resolve) => {
    try {
      let doc_path: string = app.getPath("documents") + "/sedato/.venv";
      if (tries == 3) {
        callback({
          status: "progressing",
        });
      }
      const res = spawnSync(`${doc_path}/Scripts/python.exe`, ["-version"]);
      if (res.error != null && res.error.message.includes("ENOENT")) {
        callback({
          status: "progressing",
        } as ValidationStatus);

        const proc = spawn("python", ["-m", "venv", doc_path], {
          shell: true,
          stdio: ["pipe", "pipe", "ignore"],
          timeout: 10000,
        });

        proc?.stdout?.on("data", function (data) {
          callback({
            status: "progressing",
          } as ValidationStatus);
        });

        proc.on("close", (code) => {
          if (tries > 0) {
            setup_venv(callback, tries - 1);
          } else {
            callback({
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });

        proc.on("error", function (err) {
          if (tries > 0) {
            setup_venv(callback, tries - 1);
          } else {
            callback({
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });
      } else {
        callback({
          status: "checked",
        } as ValidationStatus);
        resolve("checked");
      }
    } catch (ex) {
      callback({
        status: "failed",
      });
      resolve("failed");
    }
  });
};

const install_modules = async (
  callback: (args: ValidationStatus) => void,
  tries: number = 3
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      callback({
        status: "progressing",
      });
      
      let python: string =
        app.getPath("documents") + "/sedato/.venv/Scripts/python.exe";
      let command: string =
        app.getPath("documents") + "/sedato/video2text/video2text.py";

      copy_from_archive("public/additional/video2text.py", command);

      const res = spawnSync(python, [command, "-c"]);
      let result = res.output.toString().replaceAll(",", "").trim();

      if (result == "installed") {
        resolve("checked");
        return;
      }

      let pip: string =
        app.getPath("documents") + "/sedato/.venv/Scripts/pip3.exe";
      let requirements =
        app.getPath("documents") + "/sedato/video2text/requirements.txt";

      fs.writeFileSync(
        requirements,
        "torch\ngit+https://github.com/huggingface/transformers.git\naccelerate\ndatasets[audio]"
      );

      const proc = spawn(pip, ["install", "-r", requirements], {
        shell: true,
        detached: true,
        stdio: ["pipe", "pipe", "ignore"],
        timeout: 500000,
      });

      proc?.stdout?.on("data", function (data) {
        callback({
          status: "progressing",
        } as ValidationStatus);
      });

      proc.on("close", (code) => {
        if (tries > 0) {
          install_modules(callback, tries - 1);
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });

      proc.on("error", function (err) {
        if (tries > 0) {
          install_modules(callback, tries - 1);
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });
    } catch (ex) {
      resolve("failed");
    }
  });
};

const validate = async (
  callback: (event: string, args: ValidationStatus) => void
) => {
  /** python installation */
  {
    if (
      (await check_python_installation((data) =>
        callback("python-installation", data)
      )) == "failed"
    )
      return;
  }

  /** setup venv */
  {
    if (
      (await setup_venv((data) => callback("setup-venv", data))) == "failed"
    ) {
      return;
    }
  }

  /** module installation */
  {
    if (
      (await install_modules((data) => callback("install-modules", data))) ==
      "failed"
    )
      return;
  }
};

const copy_from_archive = (source: string, dest: string) => {
  if (fs.existsSync(app.getAppPath() + `/${source}`)) {
    if (fs.statSync(app.getAppPath() + `/${source}`).isFile()) {
      let dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dest, fs.readFileSync(app.getAppPath() + `/${source}`));
    }
  }
};

export { validate };

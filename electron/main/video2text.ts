import { spawn, spawnSync } from "child_process";
import { ValidationStatus } from "types/video2text";
import { app } from "electron";
import path from "path";
import fs from "fs";

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

        proc.on("close", async (code) => {
          if (tries > 0) {
            resolve(await check_python_installation(callback, tries - 1));
          } else {
            callback({
              verified: false,
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });

        proc.on("error", async (err) => {
          if (tries > 0) {
            resolve(await check_python_installation(callback, tries - 1));
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
): Promise<string> => {
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

        proc.on("close", async (code) => {
          if (tries > 0) {
            resolve(await setup_venv(callback, tries - 1));
          } else {
            callback({
              status: "failed",
            } as ValidationStatus);
            resolve("failed");
          }
        });

        proc.on("error", async (err) => {
          if (tries > 0) {
            resolve(await setup_venv(callback, tries - 1));
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

const install_modules_torch = async (
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

      const res = spawnSync(python, [command, "-cto"]);
      let result = res.output.toString().replaceAll(",", "").trim();

      if (result == "installed") {
        callback({
          status: "checked",
        });
        resolve("checked");
        return;
      }

      let pip: string =
        app.getPath("documents") + "/sedato/.venv/Scripts/pip3.exe";

      const proc = spawn(
        pip,
        [
          "install",
          "torch",
          "torchvision",
          "torchaudio",
          "--index-url",
          "https://download.pytorch.org/whl/cu118",
        ],
        {
          shell: true,
          detached: true,
          stdio: ["pipe", "pipe", "ignore"],
          timeout: 500000,
        }
      );

      proc?.stdout?.on("data", function (data) {
        callback({
          status: "progressing",
        } as ValidationStatus);
      });

      proc.on("close", async (code) => {
        if (tries > 0) {
          resolve(await install_modules_torch(callback, tries - 1));
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });

      proc.on("error", async (err) => {
        if (tries > 0) {
          resolve(await install_modules_torch(callback, tries - 1));
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });
    } catch (ex) {
      callback({
        status: "failed",
      } as ValidationStatus);
      resolve("failed");
    }
  });
};

const install_modules_transformer = async (
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

      const res = spawnSync(python, [command, "-ctr"]);
      let result = res.output.toString().replaceAll(",", "").trim();

      if (result == "installed") {
        callback({
          status: "checked",
        });
        resolve("checked");
        return;
      }

      let pip: string =
        app.getPath("documents") + "/sedato/.venv/Scripts/pip3.exe";
      let requirements =
        app.getPath("documents") + "/sedato/video2text/requirements.txt";

      fs.writeFileSync(
        requirements,
        "git+https://github.com/huggingface/transformers.git\naccelerate\ndatasets[audio]"
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

      proc.on("close", async (code) => {
        if (tries > 0) {
          resolve(await install_modules_transformer(callback, tries - 1));
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });

      proc.on("error", async (err) => {
        if (tries > 0) {
          resolve(await install_modules_transformer(callback, tries - 1));
        } else {
          callback({
            status: "failed",
          } as ValidationStatus);
          resolve("failed");
        }
      });
    } catch (ex) {
      callback({
        status: "failed",
      } as ValidationStatus);
      resolve("failed");
    }
  });
};

const cuda_available = async (
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

      const res = spawnSync(python, [command, "-cuda"]);
      let result = res.output.toString().replaceAll(",", "").trim();

      if (result == "available") {
        callback({
          status: "checked",
        });
        resolve("checked");
        return;
      } else {
        callback({
          status: "unavailable",
        });
        resolve("checked");
        return;
      }
    } catch (ex) {
      callback({
        status: "failed",
      } as ValidationStatus);
      resolve("failed");
    }
  });
};

const validate = async (
  callback: (event: string, args: ValidationStatus) => void
) => {
  /** python installation */
  let step1 = await check_python_installation((data) =>
    callback("python-installation", data)
  );
  console.log(`step 1 check_python_installation`, step1);
  if (step1 == "failed") return;

  /** setup venv */
  let step2 = await setup_venv((data) => callback("setup-venv", data));
  console.log(`step 2 setup_venv`, step2);
  if (step2 == "failed") return;

  /** module installation */
  let step3 = await install_modules_torch((data) =>
    callback("install-modules", data)
  );
  console.log(`step 3 install_modules`, step3);
  if (step3 == "failed") return;

  let step4 = await install_modules_transformer((data) =>
    callback("install-modules", data)
  );
  console.log(`step 4 install_modules`, step3);
  if (step4 == "failed") return;

  /** cuda available */
  let step5 = await cuda_available((data) => callback("cuda-available", data));
  console.log(`step 5 cuda_available`, step3);
  if (step3 == "failed") return;
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

import { convertInterface } from "types/hls";
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import crypto from "crypto";

const qualities: any = {
  144: {
    width: 256,
    height: 144,
    bitrate: 200,
  },
  240: {
    width: 426,
    height: 240,
    bitrate: 400,
  },
  360: {
    width: 640,
    height: 360,
    bitrate: 700,
  },
  480: {
    width: 854,
    height: 480,
    bitrate: 1500,
  },
  720: {
    width: 1280,
    height: 720,
    bitrate: 2500,
  },
  1080: {
    width: 1920,
    height: 1080,
    bitrate: 5000,
  },
  1440: {
    width: 2560,
    height: 1440,
    bitrate: 8000,
  },
  2160: {
    width: 3840,
    height: 2160,
    bitrate: 16000,
  },
};

const usingSwap = (
  args: convertInterface,
  path: string,
  callback: (stat: string, data: any) => void
) => {
  try {
    callback("starting", {});
    let array: string[] = [
      `-hide_banner`,
      `-y`,
      `-i`,
      `"${args.video}"`,
      "-g",
      "250",
      "-sc_threshold",
      "40",
      "-keyint_min",
      "25",
      "-bf",
      "1",
    ];

    let current_path: string = "ffmpeg";

    for (let i: number = 0; i < args.qualities.length; i++) {
      array.push("-map");
      array.push("0:v:0");
    }

    for (let i: number = 0; i < args.qualities.length; i++) {
      const data = qualities[args.qualities[i]];

      const maxrate = Math.round(data.bitrate * 0.8);
      const bufsize = Math.round(data.bitrate * 2);

      const add = [
        `-c:v:${i}`,
        `libx264`,
        `-s:v:${i}`,
        `${data.width}x${data.height}`,
        `-b:v:${i}`,
        `${data.bitrate}k`,
        `-maxrate:v:${i}`,
        `${maxrate}k`,
        `-bufsize:v:${i}`,
        `${bufsize}k`,
      ];
      array = [...array, ...add];
    }

    let enc: string[] = [];
    let iv: string = args.signIV || crypto.randomBytes(16).toString("hex");
    let date = new Date().toISOString().replaceAll(":", "-");

    if (!fs.existsSync(`${path}/sedato/${date}`)) {
      fs.mkdirSync(`${path}/sedato/${date}`, { recursive: true });
    }

    if (args.encryption) {
      if (args.sign.length > 0 && args.signUrl.length > 0) {
        fs.writeFileSync(
          `${path}/tmp.key`,
          `${args.signUrl}\n${args.sign}\n${iv}`,
          "utf-8"
        );
        enc = ["-hls_key_info_file", `${path}/tmp.key`];
      } else {
        enc = ["-hls_enc", "1", "-hls_enc_key", iv];
      }
    }

    array = [
      ...array,
      `-threads`,
      `${args.threads}`,
      `-master_pl_name`,
      `${args.master}`,
      `-hls_time`,
      `${args.hlsTime}`,
      `-hls_allow_cache`,
      `1`,
      `-hls_segment_type`,
      `mpegts`,
      `-hls_list_size`,
      `0`,
      ...enc,
      `-progress`,
      `pipe:1`,
      `-var_stream_map`,
      `"${args.qualities.map((x, i) => `v:${i},name:${x}p`).join(" ")}"`,
      `-hls_segment_filename`,
      `"${path}/sedato/${date}/%v/${args.section}-%03d.ts"`,
      `"${path}/sedato/${date}/%v/${args.section}.m3u8"`,
    ];

    callback("command", `${current_path} ${array.join(" ")}`);

    let proc = spawn(current_path, array, {
      shell: true,
      stdio: ["pipe", "pipe", "inherit"],
      timeout: args.timeout,
    });

    proc?.stdout?.on("data", function (data) {
      var tLines = data.toString().split("\n");
      var progress: any = {};
      for (var i = 0; i < tLines.length; i++) {
        var item = tLines[i].split("=");
        if (typeof item[0] != "undefined" && typeof item[1] != "undefined") {
          progress[item[0]] = item[1];
        }
      }
      callback("progress", { pid: proc.pid, ...progress });
    });

    proc.on("close", (code) => {
      convert_audio(args, `${path}/sedato/${date}`, current_path, iv, callback);
    });

    proc.on("error", function (err) {
      callback("error", err);
    });
  } catch (ex: any) {
    callback("error", ex.message);
  }
};

const convert_audio = async (
  args: convertInterface,
  path: string,
  current_path: string,
  iv: string,
  callback: (stat: string, data: any) => void
) => {
  if (args.audios.length == 0) {
    if (!fs.existsSync(`${path}/audio`)) {
      fs.mkdirSync(`${path}/audio`, { recursive: true });
    }

    let enc: string[] = [];
    if (args.encryption) {
      if (args.sign.length > 0 && args.signUrl.length > 0) {
        fs.writeFileSync(
          `${path}/tmp.key`,
          `${args.signUrl}\n${args.sign}\n${iv}`,
          "utf-8"
        );
        enc = ["-hls_key_info_file", `${path}/tmp.key`];
      } else {
        enc = ["-hls_enc", "1", "-hls_enc_key", iv];
      }
    }

    let array: string[] = [
      `-hide_banner`,
      `-y`,
      `-i`,
      `"${args.video}"`,
      `-c:a`,
      `aac`,
      `-b:a`,
      `90k`,
      `-vn`,
      `-hls_time`,
      `${args.hlsTime}`,
      `-hls_allow_cache`,
      `1`,
      `-hls_list_size`,
      `0`,
      ...enc,
      `-keyint_min`,
      `25`,
      `-progress`,
      `pipe:1`,
      `-g`,
      `250`,
      `-sc_threshold`,
      `40`,
      `-hls_segment_filename`,
      `"${path}/audio/main_%04d.ts"`,
      `-strict`,
      `-2`,
      `"${path}/audio/main.m3u8"`,
    ];

    let proc = spawn(current_path, array, {
      shell: true,
      stdio: ["pipe", "pipe", "inherit"],
      timeout: args.timeout,
    });

    proc?.stdout?.on("data", function (data) {
      var tLines = data.toString().split("\n");
      var progress: any = {};
      for (var i = 0; i < tLines.length; i++) {
        var item = tLines[i].split("=");
        if (typeof item[0] != "undefined" && typeof item[1] != "undefined") {
          progress[item[0]] = item[1];
        }
      }
      callback("progress", { pid: proc.pid, ...progress });
    });

    proc.on("close", (code) => {
      fs.appendFile(
        `${path}/${args.master}`,
        `\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aac",LANGUAGE="Default",NAME="Default",DEFAULT=YES,AUTOSELECT=YES,URI="audio/main.m3u8"`,
        function (err) {
          callback("finished", {
            code: code,
            path: path,
          });
        }
      );
    });

    proc.on("error", function (err) {
      callback("error", err);
    });
  } else {
    for (let i = 0; i < args.audios.length; i++) {
      await convert_multiple_audio(args, path, current_path, i, iv, callback);
    }
    callback("finished", {
      code: 1,
      path: path,
    });
  }
};

const convert_multiple_audio = (
  args: convertInterface,
  path: string,
  current_path: string,
  index: number,
  iv: string,
  callback: (stat: string, data: any) => void
): Promise<number> => {
  return new Promise((resolve) => {
    if (!fs.existsSync(`${path}/audio-${args.audios[index].code}`)) {
      fs.mkdirSync(`${path}/audio-${args.audios[index].code}`, {
        recursive: true,
      });
    }

    let enc: string[] = [];
    if (args.encryption) {
      if (args.sign.length > 0 && args.signUrl.length > 0) {
        fs.writeFileSync(
          `${path}/tmp.key`,
          `${args.signUrl}\n${args.sign}\n${iv}`,
          "utf-8"
        );
        enc = ["-hls_key_info_file", `${path}/tmp.key`];
      } else {
        enc = ["-hls_enc", "1", "-hls_enc_key", iv];
      }
    }
    let array: string[] = [
      `-hide_banner`,
      `-y`,
      `-i`,
      `"${args.audios[index].path}"`,
      `-c:a`,
      `aac`,
      `-b:a`,
      `90k`,
      `-vn`,
      `-hls_time`,
      `${args.hlsTime}`,
      `-hls_allow_cache`,
      `1`,
      `-hls_list_size`,
      `0`,
      ...enc,
      `-keyint_min`,
      `25`,
      `-async`,
      `1`,
      `-progress`,
      `pipe:1`,
      `-g`,
      `250`,
      `-sc_threshold`,
      `40`,
      `-hls_segment_filename`,
      `"${path}/audio-${args.audios[index].code}/main_%04d.ts"`,
      `-strict`,
      `-2`,
      `"${path}/audio-${args.audios[index].code}/main.m3u8"`,
    ];

    let proc = spawn(current_path, array, {
      shell: true,
      stdio: ["pipe", "pipe", "inherit"],
      timeout: args.timeout,
    });

    proc?.stdout?.on("data", function (data) {
      var tLines = data.toString().split("\n");
      var progress: any = {};
      for (var i = 0; i < tLines.length; i++) {
        var item = tLines[i].split("=");
        if (typeof item[0] != "undefined" && typeof item[1] != "undefined") {
          progress[item[0]] = item[1];
        }
      }
      callback("progress", { pid: proc.pid, ...progress });
    });

    proc.on("close", (code) => {
      fs.appendFile(
        `${path}/${args.master}`,
        `\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aac",LANGUAGE="${
          args.audios[index].code
        }",NAME="${args.audios[index].title}",DEFAULT=${
          index == 0 ? "YES" : "NO"
        },AUTOSELECT=${index == 0 ? "YES" : "NO"},URI="audio-${
          args.audios[index].code
        }/main.m3u8"`,
        function (err) {
          resolve(index);
        }
      );
    });

    proc.on("error", function (err) {
      resolve(index);
    });
  });
};

const check_ffmpeg = () => {
  try {
    const res = spawnSync("ffmpeg");
    if (res.error != null && res.error.message.includes("ENOENT")) {
      spawn("winget", ["install", "ffmpeg"], {
        shell: true,
        detached: true,
      });
    }
  } catch (ex) {
    console.log(`error`, ex);
  }
};

export { check_ffmpeg, usingSwap };

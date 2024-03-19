import { spawn } from "child_process";

const options =
  `-hide_banner -y -i /home/mehdi/Videos/test/video.mp4 -codec libx264 -g 48 -crf 20 -sc_threshold 0 -keyint_min 48 -ar 48000 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -c:v:0 h264 -profile:v:0 main -filter:v:0 "scale=w=854:h=480:force_original_aspect_ratio=decrease" -b:v:0 1500k -maxrate:v:0 1200k -bufsize:v:0 3000k -c:v:1 h264 -profile:v:1 main -filter:v:1 "scale=w=1280:h=720:force_original_aspect_ratio=decrease" -b:v:1 2500k -maxrate:v:1 2000k -bufsize:v:1 5000k -c:v:2 h264 -profile:v:2 main -filter:v:2 "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" -b:v:2 5000k -maxrate:v:2 4000k -bufsize:v:2 10000k -c:v:3 h264 -profile:v:3 main -filter:v:3 "scale=w=426:h=240:force_original_aspect_ratio=decrease" -b:v:3 400k -maxrate:v:3 320k -bufsize:v:3 800k -c:v:4 h264 -profile:v:4 main -filter:v:4 "scale=w=256:h=144:force_original_aspect_ratio=decrease" -b:v:4 200k -maxrate:v:4 160k -bufsize:v:4 400k -threads 1 -master_pl_name main.m3u8 -start_number 0 -f hls -hls_time 10 -hls_playlist_type vod -hls_list_size 0 -hls_key_info_file /home/mehdi/Documents/tmp.key -progress pipe:1 -var_stream_map "v:0 v:1 v:2 v:3 v:4" -hls_segment_filename "/home/mehdi/Documents/sedato/2024-03-19T21:15:37.596Z/%v/section-%03d.ts" "/home/mehdi/Documents/sedato/2024-03-19T21:15:37.596Z/%v/section.m3u8"`.split(
    " "
  );
let proc = spawn("ffmpeg", options, {
  shell: true,
  detached: true,
  stdio: ["ignore"],
  timeout: 5 * 1000
});

console.log(`ffmpeg`, options.join(" "));

proc?.stdout?.on("data", function (data) {
  try {
    var tLines = data.toString().split("\n");
    var progress = {};
    for (var i = 0; i < tLines.length; i++) {
      var item = tLines[i].split("=");
      if (typeof item[0] != "undefined" && typeof item[1] != "undefined") {
        progress[item[0]] = item[1];
      }
    }
    console.clear();
    console.log(progress);
  }
  catch (ex) {
    console.clear();
    console.error(ex);
  }
});

proc.on("close", (code) => {
  console.log(`done`, code);
});

proc.on("error", function (err) {
  console.log(`error`, err);
});

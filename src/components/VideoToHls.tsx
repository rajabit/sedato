import { invoke, ipcOpenFile, listen, openFolder } from "@/demos/ipc";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { audioInterface, convertInterface, convertStat } from "types/hls";
import LoadingSVG from "./LoadingSVG";

const VideoToHls = () => {
  const [mount, setMount] = useState<boolean>(false);
  const [video, setVideo] = useState<string>("");
  const [signIV, setSignIV] = useState<string>("");
  const [sign, setSign] = useState<string>("");
  const [signUrl, setSignUrl] = useState<string>("");
  const [codec, setCodec] = useState<string>("libx264");
  const [master, setMaster] = useState<string>("main.m3u8");
  const [section, setSection] = useState<string>("section");
  const [audios, setAudios] = useState<Array<audioInterface>>([]);
  const [encryption, setEncryption] = useState<boolean>(false);
  const [timeout, setTimeout] = useState<number>(5000);
  const [threads, setThreads] = useState<number>(0);
  const [hlsTime, setHlsTime] = useState<number>(10);
  const [qualities, setQualities] = useState<Array<number>>([480, 720, 1080]);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stat, setStat] = useState<string>("index");
  const [data, setData] = useState<any>({});

  const restartForm = async () => {
    setVideo("");
    setAudios([]);
    setErrors([]);
    setStat("index");
    setData({});
  };
  const selectVideoFile = async () => {
    let val = await ipcOpenFile([
      { name: "Movies", extensions: ["mkv", "avi", "mp4", "mov"] },
    ]);
    if (!val.canceled && val.filePaths.length) setVideo(val.filePaths[0]);
  };
  const selectSignFile = async () => {
    let val = await ipcOpenFile([{ name: "Sign key", extensions: ["key"] }]);
    if (!val.canceled && val.filePaths.length) setSign(val.filePaths[0]);
  };
  const selectAudioFiles = async () => {
    let val = await ipcOpenFile(
      [{ name: "Audios", extensions: ["mp3", "wav"] }],
      ["openFile", "multiSelections"]
    );
    if (!val.canceled && val.filePaths.length) {
      setAudios([
        ...audios,
        ...val.filePaths.map((x: string) => {
          return {
            path: x,
            title: x.substring(x.lastIndexOf("/") + 1),
            code: "",
          } as audioInterface;
        }),
      ]);
    }
  };
  const onQualityChange = (e: any) => {
    setQualities(
      e.target.checked
        ? [...qualities, Number(e.target.value)]
        : qualities.filter((x) => x != e.target.value)
    );
  };
  const validator = (): string[] => {
    let errors: string[] = [];
    if (video.length == 0) {
      errors.push("Video File is required.");
    }
    if (qualities.length == 0) {
      errors.push("Select at least one of qualities to export.");
    }
    if (
      audios.filter((x) => x.code.length == 0 || x.title.length == 0).length > 0
    ) {
      errors.push("Complete code and title for every single audio file.");
    }
    if (
      encryption &&
      ((sign.length > 0 && signUrl.length == 0) ||
        (sign.length == 0 && signUrl.length > 0))
    ) {
      if (sign.length == 0) errors.push("Encryption Sign is required.");
      if (signUrl.length == 0) errors.push("Encryption Sign Url is required.");
    }
    if (signIV.length > 0 && signIV.length != 32) {
      errors.push("Sing IV is not valid.");
    }
    return errors;
  };
  const onSubmit = () => {
    let validate = validator();
    if (validate.length) {
      setErrors(validate);
      return;
    } else {
      setErrors([]);
    }

    invoke("video-to-hls-start", {
      video: video,
      audios: audios,
      codec: codec,
      encryption: encryption,
      hlsTime: hlsTime,
      master: master,
      qualities: qualities,
      section: section,
      timeout: timeout,
      threads: threads,
      sign: sign,
      signIV: signIV,
      signUrl: signUrl,
    } as convertInterface);
  };
  const onAudioTitleChange = (e: any, i: number) => {
    let array = [...audios];
    array[i].title = e.target.value;
    setAudios(array);
  };
  const onAudioCodeChange = (e: any, i: number) => {
    let array = [...audios];
    array[i].code = e.target.value;
    setAudios(array);
  };
  const dropAudio = (i: number) => {
    let array = [...audios];
    array.splice(i, 1);
    setAudios(array);
  };
  const stopProgress = (pid?: number) => {
    if (pid == null) return;
    invoke("video-to-hls-stop", pid);
  };

  useEffect(() => {
    console.log(`mounted`);
    if (!mount) {
      invoke("check-ffmpeg");
      listen("video-to-hls-status", (event, args: convertStat) => {
        setStat(args.stat);
        setData(args.data);
      });
      setMount(true);
    }
  }, []);

  switch (stat) {
    case "index":
      return (
        <div className="m-7">
          <form>
            <div className="flex justify-center items-center mb-5">
              <h1 className="text-2xl font-bold">Convert Video to HLS</h1>
              <div className="grow"></div>
              <button onClick={onSubmit} type="button" className="btn primary">
                <ArrowPathIcon />
                Convert
              </button>
            </div>

            {errors.length > 0 && (
              <div className="mb-5 border rounded border-red-800 bg-red-600/30 p-5">
                <ul>
                  {errors.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card mb-5">
              <div className="title">Video Information</div>
              <div className="subtitle">Select video file</div>
              <div className="content">
                <div className="form-section">
                  <label htmlFor="video">Video file</label>

                  <div className="flex items-center justify-start">
                    <button
                      className="btn slate me-3"
                      onClick={selectVideoFile}
                      type="button"
                    >
                      Click to Select
                    </button>
                    <small className="text-white/60">
                      {video.substring(video.lastIndexOf("/") + 1)}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-5">
              <div className="title">
                <label htmlFor="qualities">Qualities</label>
              </div>
              <div className="subtitle">Select qualities to export</div>
              <div className="content">
                <ul>
                  <li>
                    <label>
                      <input
                        title="144"
                        type="checkbox"
                        name="qualities"
                        value={144}
                        onChange={onQualityChange}
                        checked={qualities.includes(144)}
                      />
                      <span>144p (256 x 144) ~ 100-200 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="240"
                        type="checkbox"
                        name="qualities"
                        value={240}
                        onChange={onQualityChange}
                        checked={qualities.includes(240)}
                      />
                      <span>240p (426 x 240) ~ 250-400 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="360"
                        type="checkbox"
                        name="qualities"
                        value={360}
                        onChange={onQualityChange}
                        checked={qualities.includes(360)}
                      />
                      <span>360p (640 x 360) ~ 400-700 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="480"
                        type="checkbox"
                        name="qualities"
                        value={480}
                        onChange={onQualityChange}
                        checked={qualities.includes(480)}
                      />
                      <span>480p (854 x 480) ~ 500-2,000 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="720"
                        type="checkbox"
                        name="qualities"
                        value={720}
                        onChange={onQualityChange}
                        checked={qualities.includes(720)}
                      />
                      <span>720p (1280 x 720) ~ 1,500-4,000 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="1080"
                        type="checkbox"
                        name="qualities"
                        value={1080}
                        onChange={onQualityChange}
                        checked={qualities.includes(1080)}
                      />
                      <span>1080p (1920 x 1080) ~ 3,000-6,000 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="1440"
                        type="checkbox"
                        name="qualities"
                        value={1440}
                        onChange={onQualityChange}
                        checked={qualities.includes(1440)}
                      />
                      <span>1440p (2560 x 1440) ~ 6,000-13,000 kbps</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        title="2160"
                        type="checkbox"
                        name="qualities"
                        value={2160}
                        onChange={onQualityChange}
                        checked={qualities.includes(2160)}
                      />
                      <span>2160p (3840 x 2160) ~ 13,000-34,000 kbps</span>
                    </label>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card mb-5">
              <div className="title">Audio Tracks</div>
              <div className="subtitle">
                If you don't want to add any additional audio track to the video
                leave this box empty, <br />
                otherwise select audio files and input their language code
              </div>
              <div className="content">
                <button
                  className="btn slate mb-5"
                  onClick={selectAudioFiles}
                  type="button"
                >
                  Click to Select
                </button>
                <div className="flex flex-col w-full">
                  {audios.map((x, i) => (
                    <div
                      className="flex mb-2 justify-center items-start"
                      key={i}
                    >
                      <div className="text-xl p-2">{i + 1}.</div>
                      <div className="flex-[2] pe-1">
                        <div className="input">
                          <input
                            type="text"
                            className="className"
                            placeholder="Title"
                            value={x.title}
                            onChange={(e) => onAudioTitleChange(e, i)}
                          />
                        </div>
                        <span className="text-sm text-white/60">
                          {x.path.substring(x.path.lastIndexOf("/") + 1)}
                        </span>
                      </div>
                      <div className="flex-1 ps-1">
                        <div className="input">
                          <input
                            type="text"
                            className="font-medium p-1 w-full"
                            placeholder="Code"
                            value={x.code}
                            onChange={(e) => onAudioCodeChange(e, i)}
                          />
                        </div>
                      </div>
                      <div className="ms-2">
                        <button
                          title="Delete audio"
                          className="btn icon"
                          type="button"
                          onClick={() => dropAudio(i)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card mb-5">
              <div className="title">Encryption</div>
              <div className="subtitle">
                if you don't want to encrypt the video leave this box empty!
              </div>
              <div className="content">
                <div className="form-section">
                  <label>
                    <input
                      title="encryption"
                      type="checkbox"
                      name="encryption"
                      onChange={(e) => setEncryption(e.target.checked)}
                      checked={encryption}
                    />
                    Enable Encryption
                  </label>
                </div>

                <div
                  className={
                    encryption
                      ? "block duration-150"
                      : "pointer-events-none select-none opacity-30 duration-150"
                  }
                >
                  <div className="form-section">
                    <label htmlFor="sign">Sign file</label>
                    <div className="flex items-center justify-start">
                      <button
                        className="btn slate me-3"
                        onClick={selectSignFile}
                        type="button"
                      >
                        Click to Select
                      </button>
                      <small className="text-white/60">
                        {sign.substring(sign.lastIndexOf("/") + 1)}
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <label htmlFor="signUrl">Sign Url</label>
                    <div className="input">
                      <input
                        id="signUrl"
                        value={signUrl}
                        onChange={(e) => setSignUrl(e.target.value)}
                        type="url"
                        name="signUrl"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <label htmlFor="signIV">Sign IV</label>
                    <div className="input">
                      <input
                        id="signIV"
                        value={signIV}
                        onChange={(e) => setSignIV(e.target.value)}
                        type="text"
                        name="signIV"
                      />
                    </div>
                  </div>
                  <small className="text-white/30"></small>
                </div>
              </div>
            </div>

            <div className="card mb-16">
              <div className="title">Options</div>
              <div className="subtitle">Customize converter</div>
              <div className="content">
                <div className="form-section max-w-64">
                  <label htmlFor="threads">Threads</label>
                  <div className="input">
                    <input
                      id="threads"
                      value={threads}
                      onChange={(e) => setThreads(Number(e.target.value))}
                      type="number"
                      name="threads"
                    />
                  </div>
                </div>

                <div className="form-section max-w-64">
                  <label htmlFor="timeout">Timeout</label>
                  <div className="input">
                    <input
                      id="timeout"
                      value={timeout}
                      onChange={(e) => setTimeout(Number(e.target.value))}
                      type="number"
                      name="timeout"
                    />
                  </div>
                </div>

                <div className="form-section max-w-64">
                  <label htmlFor="hlsTime">Hls time</label>
                  <div className="input">
                    <input
                      id="hlsTime"
                      value={hlsTime}
                      onChange={(e) => setHlsTime(Number(e.target.value))}
                      type="number"
                      name="hlsTime"
                    />
                  </div>
                </div>

                <div className="form-section max-w-64">
                  <label htmlFor="codec">Codec</label>
                  <div className="input">
                    <input
                      id="codec"
                      value={codec}
                      onChange={(e) => setCodec(e.target.value)}
                      type="text"
                      name="codec"
                    />
                  </div>
                </div>

                <div className="form-section max-w-64">
                  <label htmlFor="master">Master name</label>
                  <div className="input">
                    <input
                      id="master"
                      value={master}
                      onChange={(e) => setMaster(e.target.value)}
                      type="text"
                      name="master"
                    />
                  </div>
                </div>

                <div className="form-section max-w-64">
                  <label htmlFor="section">Section Name</label>
                  <div className="input">
                    <input
                      id="section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      type="text"
                      name="section"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      );
    case "starting":
      return (
        <div className="size-full flex justify-center items-center">
          <LoadingSVG />
          <label className="ms-3">Starting converter...</label>
        </div>
      );
    case "progress":
    case "finished":
    case "error":
      return (
        <div className="px-5 pt-5">
          {stat == "progress" && (
            <div className="flex">
              <LoadingSVG />
              <label className="ms-3">Progressing...</label>
            </div>
          )}
          {stat == "finished" && (
            <div className="flex">
              <CheckIcon className="text-green-600" />
              <label className="ms-3 text-green-600">Finished</label>
            </div>
          )}
          {stat == "error" && (
            <div className="flex">
              <ExclamationTriangleIcon className="text-red-600" />
              <label className="ms-3 text-red-600">Failed</label>
            </div>
          )}
          <div className="py-2">
            {typeof data == "object" && stat != "finished" && (
              <ul>
                {Object.keys(data).map((x, i) => (
                  <li key={i}>
                    {x}: <span className="text-purple-500 ps-1">{data[x]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {stat == "finished" && data["path"] && (
            <>
              <div>
                Output Path:{" "}
                <small className="text-slate-400 ps-1 text-sm">
                  {data["path"]}
                </small>
              </div>
              <button
                onClick={() => openFolder(data["path"])}
                type="button"
                className="btn slate mt-3"
              >
                <FolderIcon /> Open Folder
              </button>
            </>
          )}
          {stat == "progress" && data["pid"] != null && (
            <button
              onClick={() => stopProgress(data["pid"])}
              type="button"
              className="btn slate mt-3"
            >
              <NoSymbolIcon />
              Stop / Ignore
            </button>
          )}
          {(stat == "error" || stat == "finished") && (
            <button
              onClick={restartForm}
              type="button"
              className="btn primary mt-3"
            >
              <ChevronRightIcon /> Convert new file
            </button>
          )}
        </div>
      );
  }
};

export default VideoToHls;

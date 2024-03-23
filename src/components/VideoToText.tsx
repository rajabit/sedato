import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import VideoToTextValidation from "./VideoToText/Validation";
import { useState } from "react";
import { invoke, ipcOpenFile, listen, openFolder } from "@/demos/ipc";
import { ConvertStatus } from "types/video2text";
import LoadingSVG from "./LoadingSVG";

const VideoToText = () => {
  const [file, setFile] = useState("");
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stat, setStat] = useState<ConvertStatus>({
    status: "",
  });

  const onSubmit = () => {
    if (file.length == 0) {
      setErrors(["Select input file first."]);
      return;
    } else {
      setErrors([]);
    }

    invoke("video2text", {
      input: file,
    });
  };
  const selectFile = async () => {
    let val = await ipcOpenFile([
      { name: "Audio/Video", extensions: ["mp4", "mp3", "wav"] },
    ]);
    if (!val.canceled && val.filePaths.length) setFile(val.filePaths[0]);
  };

  listen("video2text", (event, args) => {
    setStat(args);
  });

  const clearForm = () => {
    setFile("");
    goBack();
  };

  const goBack = () => {
    setStat({
      status: "",
      data: null,
    });
  };
  switch (stat.status) {
    case "progressing":
      return (
        <div className="m-7 flex flex-col items-start">
          <div className="flex justify-start items-center">
            <LoadingSVG />
            <label className="ms-3">Progressing...</label>
          </div>
        </div>
      );
    case "finished":
      return (
        <div className="m-7 flex flex-col items-start">
          <div className="flex justify-start items-center">
            <CheckIcon className="text-green-600" />
            <label className="ms-3 text-green-600">Finished</label>
          </div>
          <div>
            Output Path:{" "}
            <small className="text-slate-400 ps-1 text-sm">{stat.data}</small>
          </div>
          <button
            onClick={() => openFolder(stat.data)}
            type="button"
            className="btn slate mt-3"
          >
            <FolderIcon /> Open Folder
          </button>
          <button onClick={clearForm} type="button" className="btn slate">
            Start another
          </button>
        </div>
      );
    case "failed":
      return (
        <div className="m-7 flex flex-col items-start">
          <div className="flex justify-start items-center">
            <ExclamationTriangleIcon className="text-red-600" />
            <label className="ms-3 text-red-600">Failed</label>
          </div>

          <button onClick={goBack} type="button" className="btn slate mt-5">
            <ArrowLeftIcon />
            Restart
          </button>
        </div>
      );
    default:
      return (
        <div className="m-7 flex flex-col">
          <form>
            <div className="flex justify-center items-center mb-5">
              <h1 className="text-2xl font-bold">Convert Video to Text</h1>
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
              <div className="title">Install requirements</div>
              <div className="subtitle">
                If it's your first time using video to text click to install
                requirements
              </div>
              <div className="content">
                <div className="form-section">
                  <div className="flex items-center justify-start">
                    <VideoToTextValidation />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-5">
              <div className="title">Video/Audio Information</div>
              <div className="subtitle">Select Video/Audio file</div>
              <div className="content">
                <div className="form-section">
                  <label htmlFor="video">Video/Audio file</label>

                  <div className="flex items-center justify-start">
                    <button
                      className="btn slate me-3"
                      onClick={selectFile}
                      type="button"
                    >
                      Click to Select
                    </button>
                    <small className="text-white/60">
                      {file.substring(file.lastIndexOf("/") + 1)}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      );
  }
};

export default VideoToText;

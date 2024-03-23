import { invoke, listen } from "@/demos/ipc";
import {
  ArrowDownIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { ValidationStatus } from "types/video2text";
import LoadingSVG from "../LoadingSVG";

const VideoToTextValidation = () => {
  const [mount, setMount] = useState<boolean>(false);
  const [pythonInstallation, setPythonInstallation] =
    useState<string>("pending");
  const [pythonVenv, setPythonVenv] = useState<string>("pending");
  const [installModules, setInstallModules] = useState<string>("pending");
  const [cudaAvailable, setCudaAvailable] = useState<string>("pending");

  const setup = () => {
    listen("python-installation", (event, args: ValidationStatus) => {
      setPythonInstallation(args.status);
    });

    listen("setup-venv", (event, args: ValidationStatus) => {
      setPythonVenv(args.status);
    });

    listen("install-modules", (event, args: ValidationStatus) => {
      setInstallModules(args.status);
    });

    listen("cuda-available", (event, args: ValidationStatus) => {
      setCudaAvailable(args.status);
    });

    invoke("video2text-validate");
  };

  const start = () => {
    if (mount) return;
    setMount(true);
    setup();
  };

  const loaded = () => {
    console.log(`loaded`);
  };

  const stateStyle = (state: string) => {
    switch (state) {
      case "checked":
        return (
          <div className="flex items-center justify-center text-green-600">
            <CheckIcon className="w-6 h-6 me-0 mr-0" />
            {state}
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center justify-center text-red-600">
            <ExclamationCircleIcon className="w-6 h-6 me-0 mr-0" />
            {state}
          </div>
        );
      case "pending":
        return <div className="flex items-center justify-center">{state}</div>;
      case "progressing":
        return (
          <div className="flex items-center justify-center">
            <LoadingSVG />
            {state}
          </div>
        );
      case "unavailable":
        return (
          <div className="flex items-center justify-center text-yellow-600">
            <ExclamationCircleIcon className="w-6 h-6 me-0 mr-0" />
            {state}
          </div>
        );
      default:
        return <></>;
    }
  };

  return mount ? (
    <div className="list">
      <div className="item">
        <div className="content">
          <div className="title">Python 3.10 Installation</div>
        </div>
        <div className="action capitalize">
          {stateStyle(pythonInstallation)}
        </div>
      </div>
      <div className="item">
        <div className="content">
          <div className="title">Python Environment</div>
        </div>
        <div className="action capitalize">{stateStyle(pythonVenv)}</div>
      </div>
      <div className="item">
        <div className="content">
          <div className="title">Module Installation</div>
        </div>
        <div className="action capitalize">{stateStyle(installModules)}</div>
      </div>
      <div className="item">
        <div className="content">
          <div className="title">Cuda Available</div>
        </div>
        <div className="action capitalize">{stateStyle(cudaAvailable)}</div>
      </div>
    </div>
  ) : (
    <div>
      <button onClick={start} className="btn primary" type="button">
        <ArrowDownIcon />
        Click to Start validate
      </button>
    </div>
  );
};

export default VideoToTextValidation;

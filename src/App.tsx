import { useState } from "react";
import {
  VideoCameraIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import VideoToHls from "./components/VideoToHls";

function App() {
  const [route, setRoute] = useState(0);

  const routes = [
    {
      id: 0,
      title: "Video to Hls",
      icon: <VideoCameraIcon />,
      component: <VideoToHls />,
    },
  ];

  return (
    <>
      <div className="flex w-full backdrop-blur-md h-16 px-5 bg-slate-900 shadow-md header-border items-center">
        <FireIcon />
        <h1 className="text-2xl text-start px-4 font-bold font-[ubuntu-bold]">
          Sedato
        </h1>
        <div className="text-sm text-white/60">{routes[route].title}</div>
        <div className="grow"></div>
      </div>
      <div className="size-full flex justify-stretch items-stretch">
        <div className="flex shrink flex-col  bg-slate-900 items-center justify-start drawer-border min-w-48">
          {routes.map((x) => (
            <button
              key={x.id}
              type="button"
              className={
                route == x.id ? "drawer-button active" : "drawer-button"
              }
              onClick={() => setRoute(x.id)}
            >
              {x.icon}
              {x.title}
            </button>
          ))}
        </div>
        <div className="grow flex flex-col overflow-y-auto">
          {routes[route].component}
        </div>
      </div>
    </>
  );
}

export default App;

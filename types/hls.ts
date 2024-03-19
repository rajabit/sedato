interface audioInterface {
  path: string;
  code: string;
  title: string;
}

interface convertInterface {
  video: string;
  signUrl: string;
  signIV: string;
  sign: string;
  codec: string;
  master: string;
  section: string;
  audios: audioInterface[];
  encryption: boolean;
  threads: number;
  hlsTime: number;
  timeout: number;
  qualities: number[];
}

interface convertStat {
  stat: string;
  data: any;
}

export type { audioInterface, convertInterface, convertStat };

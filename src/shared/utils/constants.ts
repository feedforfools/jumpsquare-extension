import type { StreamingService } from "../../types/index.js";

export const WARNING_WINDOW_SECONDS = 8;

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: "primevideo",
    name: "Prime Video",
    url: "https://primevideo.com",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Amazon_Prime_Video_logo_%282024%29.svg/128px-Amazon_Prime_Video_logo_%282024%29.svg.png?20240816090318",
    isSupported: true,
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://netflix.com",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Antu_netflix-desktop.svg/512px-Antu_netflix-desktop.svg.png?20220806170207",
    isSupported: true,
  },
  {
    id: "disney",
    name: "Disney+",
    url: "https://disneyplus.com",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Disney%2B_2024_%28Print%29.svg/128px-Disney%2B_2024_%28Print%29.svg.png?20240323020902",
    isSupported: false,
  },
];

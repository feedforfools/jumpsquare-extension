import type { StreamingService } from "../../types/index.js";

export const WARNING_WINDOW_SECONDS = 8;

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: "netflix",
    name: "Netflix",
    url: "https://netflix.com",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/128px-Netflix_2015_logo.svg.png?20190206123158",
    isSupported: true,
  },
  {
    id: "primevideo",
    name: "Prime Video",
    url: "https://primevideo.com",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/90/Prime_Video_logo_%282024%29.svg",
    isSupported: true,
  },
  // {
  //   id: "disney",
  //   name: "Disney+",
  //   url: "https://disneyplus.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Disney%2B_2024_%28Print%29.svg/128px-Disney%2B_2024_%28Print%29.svg.png?20240323020902",
  //   isSupported: false,
  // },
  // {
  //   id: "hbomax",
  //   name: "HBO Max",
  //   url: "https://hbomax.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Max_2025_logo.svg/128px-Max_2025_logo.svg.png?20250330222701",
  //   isSupported: false,
  // },
  // {
  //   id: "paramount",
  //   name: "Paramount+",
  //   url: "https://www.paramountplus.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paramount%2B_logo.svg/128px-Paramount%2B_logo.svg.png?20240603202804",
  //   isSupported: false,
  // },
  // {
  //   id: "hulu",
  //   name: "Hulu",
  //   url: "https://hulu.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hulu_logo_%282018%29.svg/128px-Hulu_logo_%282018%29.svg.png?20241221101232",
  //   isSupported: false,
  // },
  // {
  //   id: "appletv",
  //   name: "Apple TV+",
  //   url: "https://tv.apple.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Apple_TV_Plus_Logo.svg/128px-Apple_TV_Plus_Logo.svg.png?20230909231732",
  //   isSupported: false,
  // },
  // {
  //   id: "nowtv",
  //   name: "NOW TV",
  //   url: "https://nowtv.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Now_logo.svg/128px-Now_logo.svg.png?20210604170013",
  //   isSupported: false,
  // },
  // {
  //   id: "peacock",
  //   name: "Peacock",
  //   url: "https://peacocktv.com",
  //   logoUrl:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/NBCUniversal_Peacock_Logo.svg/128px-NBCUniversal_Peacock_Logo.svg.png?20241229202326",
  //   isSupported: false,
  // },
];

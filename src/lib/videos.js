// Video's: embed-adressen maken en de verzameling video's uit de vragen-JSON.
// Gebruikt door de cursuspagina's ([category]/[step].astro) en de videopagina (videos.astro).
import data from "../data/mensenkennersvragen.json";

// Zet een YouTube- of Vimeo-adres om naar het adres van de speler die in een iframe past.
export const toEmbedUrl = (url) => {
  if (url?.includes("vimeo.com")) {
    const id = url.split("/").filter(Boolean).pop()?.split("?")[0];
    return `https://player.vimeo.com/video/${id}`;
  }
  if (url?.includes("youtube.com/watch?v=")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url?.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

// Alleen YouTube en Vimeo spelen we af in de pagina (zie frame-src in astro.config.mjs).
// Andere video's (TikTok, Facebook) worden een kaart met een link naar de video op die site.
const externalPlatforms = { "tiktok.com": "TikTok", "facebook.com": "Facebook" };

// Vult elke video aan met platform (bij een externe link) en embedUrl (bij YouTube/Vimeo).
export const prepareVideos = (videos = []) =>
  videos.map((video) => {
    const platform = Object.entries(externalPlatforms).find(([domain]) => video.url?.includes(domain))?.[1];
    return {
      ...video,
      platform,
      embedUrl: platform ? "" : toEmbedUrl(video.url)?.trim() || "",
    };
  });

// Onderwerpen van de video's, in de volgorde waarin ze voorkomen.
export const videoCategoriesOf = (videos) => [...new Set(videos.map((video) => video.category).filter(Boolean))];

// Alle video's om verder te kijken: de lijst aan het eind van module 4 (m4_submit in de JSON).
export const extraVideos = prepareVideos(data.blocks.find((block) => block.id === "m4_submit")?.videos);

// De video's die in de modules zelf staan (videoblokken met een url), onder het onderwerp "Uit de modules".
// label toont uit welke module de video komt. "library_title" in de JSON overschrijft een te algemene titel.
export const moduleVideos = prepareVideos(
  data.blocks
    .filter((block) => block.type === "video" && block.url && String(block.Category).startsWith("Module"))
    .map((block) => ({
      category: "Uit de modules",
      label: block.Category,
      title: block.library_title || block.title.replace(/^Video over /, "").replace(/^./, (c) => c.toUpperCase()),
      url: block.url,
    })),
);

// Alles samen voor de videopagina: eerst de video's uit de modules, dan de extra video's.
export const allVideos = [...moduleVideos, ...extraVideos];

// Laat ingesloten YouTube-video's met een eindtijd (end=<seconden> in het adres, zie toEmbedUrl in videos.js)
// niet verder spelen dan dat einde. Nodig als het stuk daarna op YouTube kapot is.
// - Bij gewoon afspelen stopt de video bij het einde; met de afspeelknop kijk je hem opnieuw vanaf 0:00.
// - Klikt iemand op de tijdbalk voorbij het einde, dan zet YouTube de video zelf op 0:00 (het stuk daarna
//   is kapot). Dat zetten we terug: de video gaat verder waar je was, en blijft spelen als hij speelde.
//   YouTube meldt zo'n klik precies hetzelfde als een bewuste klik op 0:00. Daarom: sta je al bij het einde,
//   dan mag 0:00 wel (opnieuw kijken); zat je ergens middenin, dan ga je terug naar die plek.
//
// Werkt via berichten tussen de pagina en de YouTube-speler (enablejsapi=1), zonder extra script van
// YouTube te laden; dat zou de Content-Security-Policy (script-src) ook tegenhouden.
export function limitVideoEnds() {
  const players = [...document.querySelectorAll('iframe[src*="youtube.com/embed/"][src*="#einde="]')]
    // lastTime: laatste gewone positie in de video; playing: speelde de video op dat moment?
    .map((iframe) => ({ iframe, end: Number(iframe.src.split("#einde=")[1]), lastTime: 0, playing: false }))
    .filter((player) => player.end > 0);
  if (players.length === 0) return;

  const send = (iframe, message) =>
    iframe.contentWindow?.postMessage(JSON.stringify(message), "https://www.youtube.com");

  // Vraag de speler om updates (o.a. de huidige tijd) te sturen.
  const listen = (iframe) => send(iframe, { event: "listening", id: iframe.src, channel: "widget" });
  players.forEach(({ iframe }) => {
    iframe.addEventListener("load", () => listen(iframe));
    listen(iframe);
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== "https://www.youtube.com") return;
    const player = players.find(({ iframe }) => iframe.contentWindow === event.source);
    if (!player) return;

    let data;
    try {
      data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }

    // Speelstatus bijhouden (1 = speelt, 2 = gepauzeerd).
    const state = data?.info?.playerState;
    if (state === 1) player.playing = true;
    if (state === 2) player.playing = false;

    const currentTime = data?.info?.currentTime;
    if (typeof currentTime !== "number") return;

    // Plotseling terug op 0:00 terwijl je middenin zat (en niet bij het einde): voorbij het einde geklikt.
    // Ga terug naar waar je was; speelde de video, dan speelt hij verder.
    if (currentTime < 0.5 && player.lastTime > 3 && player.lastTime < player.end - 1) {
      send(player.iframe, { event: "command", func: "seekTo", args: [player.lastTime, true] });
      send(player.iframe, { event: "command", func: player.playing ? "playVideo" : "pauseVideo", args: [] });
      return;
    }

    // Toch voorbij het einde terechtgekomen: terug naar net voor het einde.
    if (currentTime > player.end + 0.5) {
      send(player.iframe, { event: "command", func: "seekTo", args: [player.end - 1, true] });
    }
    // Bij (of voorbij) het einde: stoppen. YouTube toont dan het beginscherm met de grote afspeelknop,
    // zodat je de video met één klik opnieuw kunt bekijken (vanaf 0:00).
    if (currentTime >= player.end - 0.5) {
      send(player.iframe, { event: "command", func: "stopVideo", args: [] });
    }

    if (currentTime >= 0.5 && currentTime <= player.end) player.lastTime = currentTime;
  });
}

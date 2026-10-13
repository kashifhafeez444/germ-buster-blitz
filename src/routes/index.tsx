import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Crosshair, Expand, Mail, Medal, Play, RotateCcw, Shield, Sparkles, Trophy, UserRound, Volume2, VolumeX, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameArena, GermSprite, type GameResult } from "@/components/game-arena";
import { playGameSound, startMusic, stopMusic, unlockAudio } from "@/lib/game-audio";
import { rankPlayers, sampleLeaders } from "@/lib/game-rules";
import arenaImage from "@/assets/arena.jpg";
import characterOne from "@/assets/Character-01.png.asset.json";
import characterTwo from "@/assets/Character-02.png.asset.json";
import characterThree from "@/assets/Character-03.png.asset.json";
import logo from "@/assets/LOOG@3x.png.asset.json";
import brand from "@/assets/Asset_4@3x.png.asset.json";
import telfastPack from "@/assets/telfast-pack.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Allergy Rush — Tap. Protect. Triumph." },
    { name: "description", content: "Choose your hero and take on a 30-second germ-busting challenge. Tap the germs, defend your shield and climb the leaderboard." },
    { property: "og:title", content: "Allergy Rush — The Germ-Busting Challenge" },
    { property: "og:description", content: "Thirty seconds. One hero. A whole lot of germs. How high can you score?" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const characters = [
  { name: "The Cool One", image: characterOne.url },
  { name: "The Fearless One", image: characterTwo.url },
  { name: "The Chill One", image: characterThree.url },
] as const;

function Index() {
  const [screen, setScreen] = useState<"entry" | "playing" | "results" | "leaders">("entry");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState(2);
  const [sound, setSound] = useState(true);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<GameResult>({ score: 0, kills: 0, hits: 0 });
  useEffect(() => {
    if (screen === "playing") startMusic(sound);
    else stopMusic();
  }, [screen, sound]);
  const character = characters[selected] ?? characters[2];
  const start = () => {
    unlockAudio();
    playGameSound("start", sound);
    setRound((value) => value + 1);
    setScreen("playing");
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Embedded previews may not grant fullscreen permission. */ }
  };
  const rows = screen === "results" ? rankPlayers(name, result.score) : sampleLeaders.map((p) => ({ ...p, current: false }));

  return <main className={`game-app ${screen === "playing" ? "playing" : ""}`}>
    <img className="arena-backdrop" src={arenaImage} alt="" width={1920} height={1088}/>
    <header className="game-header">
      <img src={telfastPack.url} alt="Telfast Kids" className="header-sponsor" width={1238} height={2306}/>
      <img src={logo.url} alt="Allergy Rush" className="header-logo" width={1920} height={182}/>
      <div className="header-tools"><span className="live-badge"><i/> THE 30-SECOND CHALLENGE</span>
        <Button variant="utility" size="icon" title={sound ? "Mute sound" : "Enable sound"} aria-label={sound ? "Mute sound" : "Enable sound"} onClick={() => { unlockAudio(); setSound(!sound); }}>{sound ? <Volume2/> : <VolumeX/>}</Button>
        <Button variant="utility" size="icon" title="Full screen" aria-label="Full screen" onClick={fullscreen}><Expand/></Button>
      </div>
    </header>

    {screen === "entry" && <div className="welcome-layout">
      <section className="hero-side">
        <div className="eyebrow"><Shield/> SMALL GERMS. BIG CHALLENGE.</div>
        <h1>Tap. Protect.<br/><em>Triumph.</em></h1>
        <p className="hero-description">Germs are on the move. Your hero needs you.<br/>Got 30 seconds to be a lifesaver?</p>
        <div className="preview-stage"><div className="preview-shield"/><img src={character.image} alt={character.name} className="preview-character"/>
          <GermSprite type={0} className="preview-germ one"/><GermSprite type={1} className="preview-germ two"/><GermSprite type={2} className="preview-germ three"/><GermSprite type={3} className="preview-germ four"/><span className="score-tag">+250</span>
        </div>
        <div className="preview-caption"><Sparkles/> FAST FINGERS. FEARLESS HEROES.</div>
      </section>
      <form className="registration" onSubmit={(event) => { event.preventDefault(); start(); }}>
        <div className="panel-heading"><div><h2>Ready to save the day?</h2><p>Your hero is waiting. Let’s get you in.</p></div><span className="round-badge"><Clock3/> 30 SEC</span></div>
        <label className="field"><span className="field-label"><UserRound/> Your name</span><input className="entry-input" autoComplete="name" required maxLength={32} placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)} pattern=".*\S.*" title="Please enter your name"/></label>
        <label className="field"><span className="field-label"><Mail/> Email address</span><input className="entry-input" type="email" autoComplete="email" required maxLength={254} placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)}/></label>
        <div className="character-label"><strong>Choose your hero</strong><span>3 HEROES. ONE MISSION.</span></div>
        <div className="character-options">{characters.map((item, index) => <Button type="button" variant="character" aria-label={`Select ${item.name}`} aria-pressed={selected === index} key={item.name} onClick={() => setSelected(index)}><img src={item.image} alt=""/><span>{item.name}</span>{selected === index && <i className="character-check"><Check/></i>}</Button>)}</div>
        <div className="how-to"><h3>YOUR MISSION</h3><div className="instructions-grid">
          <div className="instruction"><Crosshair/><strong>Tap the germs</strong><span>Bust them before<br/>they reach your hero.</span></div>
          <div className="instruction"><Zap/><strong className="positive">+250 per kill</strong><span>Every tap counts.<br/>Make it a good one.</span></div>
          <div className="instruction"><Shield/><strong className="negative">−125 per hit</strong><span>Guard the shield.<br/>Keep your hero safe.</span></div>
        </div></div>
        <Button variant="arcade" type="submit" className="play-button"><Play fill="currentColor"/> LET’S PLAY <ArrowRight/></Button>
        <p className="privacy-note">Practice mode · Your details stay in this session.</p>
      </form>
    </div>}

    {screen === "playing" && <GameArena key={round} character={character.image} sound={sound} onFinish={(value) => { setResult(value); setScreen("results"); }}/>}

    {(screen === "results" || screen === "leaders") && <section className="results-page">
      <span className="results-eyebrow">{screen === "results" ? "MISSION COMPLETE" : "THE HALL OF HEROES"}</span>
      <h1>{screen === "results" ? `Nice work, ${name.trim()}!` : "Big taps. Bigger legends."}</h1>
      <p>{screen === "results" ? "Thirty seconds of courage. A hero worth protecting." : "The scores to beat. Ready to make your mark?"}</p>
      {screen === "results" && <div className="result-summary"><img src={character.image} alt={character.name}/><div className="final-score"><span>YOUR FINAL SCORE</span><strong>{result.score.toLocaleString()}</strong><div className="result-stats"><span><b>{result.kills}</b> germs busted</span><span><b>{result.hits}</b> shield hits</span></div></div></div>}
      <div className="leaderboard-title"><h2><Trophy/> Leaderboard</h2><span>Sample rankings · Practice mode</span></div>
      <table className="leaderboard"><thead><tr><th>RANK</th><th>HERO</th><th>SCORE</th></tr></thead><tbody>{rows.map((player, i) => <tr key={`${player.name}-${i}`} className={player.current ? "current-player" : ""}><td>{i === 0 ? <Medal className="rank-icon"/> : String(i + 1).padStart(2, "0")}</td><td>{player.name}{player.current && <span className="you-tag">YOU</span>}</td><td>{player.score.toLocaleString()}</td></tr>)}</tbody></table>
      <div className="results-actions">{screen === "results" && <Button variant="arcade" onClick={start}><RotateCcw/> PLAY AGAIN</Button>}<Button variant={screen === "leaders" ? "arcade" : "outline"} className="back-button" onClick={() => { setScreen("entry"); if (screen === "results") { setName(""); setEmail(""); } }}>{screen === "leaders" ? <ArrowLeft/> : <UserRound/>}{screen === "leaders" ? "BACK TO GAME" : "NEW PLAYER"}</Button></div>
    </section>}

    {screen !== "playing" && <footer className="game-footer"><span><Zap/> A little rush. A lot of protection.</span><Button variant="ghost" className="leaderboard-link" onClick={() => setScreen(screen === "leaders" ? "entry" : "leaders")}><Trophy/>{screen === "leaders" ? "Back to game" : "View leaderboard"}<ArrowRight/></Button><img src={brand.url} className="footer-brand" alt="It’s a No-Brainer"/></footer>}
  </main>;
}

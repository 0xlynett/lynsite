import AudioPlayer from "react-h5-audio-player";

import { lyric } from "../stores/lyrics";
import "../styles/audio-player.scss";

import JunkyardEulogy from "../assets/junkyard-eulogy.m4a";
import { useEffect, useRef, useState, type Ref } from "react";

export default function Audio() {
  const [time, setTime] = useState(0);
  const [pause, setPause] = useState(true);

  useEffect(() => {
    if (pause) return lyric.set("");

    if (time >= 9 && time < 11) {
      lyric.set("set your sights to the heights of the mountain");
    } else if (time >= 11 && time < 13.5) {
      lyric.set("sip the water from the bottom of the fountain");
    } else if (time >= 13.5 && time < 17) {
      lyric.set("kill your darlings, keep the spark alive");
    } else if (time >= 18 && time < 20.5) {
      lyric.set("make a deal with the girl in the mirror");
    } else if (time >= 20.5 && time < 22.5) {
      lyric.set("check and hear if the word's any clearer");
    } else if (time >= 22.5 && time < 25.5) {
      lyric.set("any day the muses will arrive");
    } else if (time >= 25.5 && time < 29) {
      lyric.set("will anything set me free?");
    } else if (time >= 30 && time < 35) {
      lyric.set("has anyone seen my dreams");
    } else if (time >= 41 && time < 43) {
      lyric.set("take a crack at your fears, let them find you");
    } else if (time >= 43 && time < 45.5) {
      lyric.set("turn your back on your peers right behind you");
    } else if (time >= 45.5 && time < 49) {
      lyric.set("hide away and cry yourself to sleep");
    } else if (time >= 50 && time < 52.5) {
      lyric.set("try again, from the top, from the top now");
    } else if (time >= 52.5 && time < 54.5) {
      lyric.set("make amends, make it stop, make it stop now");
    } else if (time >= 54.5 && time < 57.5) {
      lyric.set("shut the door and dive into the deep");
    } else if (time >= 57.5 && time < 62) {
      lyric.set("will anything set me free?");
    } else if (time >= 62 && time < 65) {
      lyric.set("if i make it then the words will come to me");
    } else if (time >= 65 && time < 67) {
      lyric.set("please tell me that the words will come to me");
    } else if (time >= 67 && time < 76) {
      lyric.set("will anything set me free?");
    } else if (time >= 76 && time < 78) {
      lyric.set("has anyone seen my dreams?");
    } else if (time >= 78 && time < 80) {
      lyric.set("they're lost somewhere in the guts of these machines");
    } else if (time >= 80 && time < 112) {
      lyric.set("lost somewhere in the guts of these machines");
    } else if (time >= 112 && time < 115) {
      lyric.set("lying somewhere in a sea of circuitry");
    } else {
      lyric.set("");
    }
  }, [time, pause]);

  return (
    <AudioPlayer
      src={JunkyardEulogy}
      // @ts-ignore
      onListen={(e) => setTime(e.target.currentTime)}
      listenInterval={100}
      onPause={() => setPause(true)}
      onWaiting={() => setPause(true)}
      onEnded={() => setPause(true)}
      onPlaying={() => setPause(false)}
    />
  );
}

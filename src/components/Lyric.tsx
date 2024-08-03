import { useStore } from "@nanostores/react";
import { lyric } from "../stores/lyrics";

export default function Lyric() {
  const $lyric = useStore(lyric);
  return $lyric;
}

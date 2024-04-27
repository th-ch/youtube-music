import { createBackend } from '@/utils';
import { YoutubeMusic, LyricsGenius } from "../providers";

const providers = [YoutubeMusic, LyricsGenius];

export default createBackend({
  start() {
    console.log("Available providers:", providers.map(p => p.name));
  }
});

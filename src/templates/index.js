import { lazy } from 'react';
import { loadFonts } from '../lib/fonts';
import { CARD_ART } from './cards';

/**
 * Template registry. To add a template:
 *   1. create src/templates/MyTemplate.jsx (default-export a component)
 *   2. add an entry below. That's it — it shows up in the studio automatically.
 *
 * music:  instrument for the birthday song — musicbox | piano | chiptune | synth | bell | pad | pluck
 * fonts:  Google Fonts this template needs (loaded only when it is opened)
 * video:  how the "download video" export films it: seconds of show after the gift opens, and
 *         scripted taps  [sec, 'css selector', nth?] or [sec, x%, y%]  (see lib/autoplay.js)
 */
const defs = [
  { id: 'balloon-bash', category: 'birthday', video: { seconds: 14, taps: [[7.5, 'button[aria-label="Blow out the candles"]']] }, fonts: ['Pacifico', 'Dancing Script'], name: 'Balloon Bash', tagline: 'Balloons rise, the cake glows, confetti pops.', emoji: '🎈', music: 'musicbox', tempo: 104, loader: () => import('./BalloonBash.jsx') },
  { id: 'midnight-fireworks', category: 'birthday', video: { seconds: 15, taps: [[9, 50, 28], [10.5, 28, 20], [12, 72, 24], [13.2, 50, 16]] }, fonts: ['Cinzel', 'Playfair Display', 'Dancing Script'], name: 'Midnight Fireworks', tagline: 'A night sky that lights up with their name.', emoji: '🎆', music: 'piano', tempo: 88, loader: () => import('./MidnightFireworks.jsx') },
  { id: 'neon-nights', category: 'birthday', video: { seconds: 14, taps: [[8, 50, 55], [9.5, 50, 55], [11, 50, 55]] }, fonts: ['Monoton', 'Righteous'], name: 'Neon Nights', tagline: 'Synthwave sunset and a glowing neon sign.', emoji: '🌆', music: 'synth', tempo: 112, loader: () => import('./NeonNights.jsx') },
  { id: 'golden-gala', category: 'birthday', video: { seconds: 15, taps: [] }, fonts: ['Cinzel', 'Playfair Display', 'Dancing Script'], name: 'Golden Gala', tagline: 'Velvet curtains open on black-tie gold.', emoji: '🥂', music: 'piano', tempo: 84, loader: () => import('./GoldenGala.jsx') },
  { id: 'cosmic-voyage', category: 'birthday', video: { seconds: 18, taps: [[14.5, 50, 40], [15.8, 30, 55]] }, fonts: ['Righteous', 'Dancing Script'], name: 'Cosmic Voyage', tagline: 'Fly through the stars to a planet with their face.', emoji: '🪐', music: 'pad', tempo: 78, loader: () => import('./CosmicVoyage.jsx') },
  { id: 'enchanted-garden', category: 'birthday', video: { seconds: 14, taps: [[8.5, 'button[aria-label="Bloom the flower"]', 0], [9.2, 'button[aria-label="Bloom the flower"]', 1], [9.9, 'button[aria-label="Bloom the flower"]', 2], [10.6, 'button[aria-label="Bloom the flower"]', 3]] }, fonts: ['Dancing Script'], name: 'Enchanted Garden', tagline: 'Flowers bloom and butterflies carry the wish.', emoji: '🌸', music: 'musicbox', tempo: 92, loader: () => import('./EnchantedGarden.jsx') },
  { id: 'candy-land', category: 'birthday', video: { seconds: 13, taps: [[7, 'button[aria-label="Squish the candy"]', 0], [8, 'button[aria-label="Squish the candy"]', 1], [9, 'button[aria-label="Squish the candy"]', 2]] }, fonts: ['Fredoka'], name: 'Candy Land', tagline: 'A squishy, bouncy sugar-rush surprise.', emoji: '🍭', music: 'pluck', tempo: 118, loader: () => import('./CandyLand.jsx') },
  { id: 'pixel-arcade', category: 'birthday', video: { seconds: 22, taps: [[6, 'button[aria-label="Collect coin"]', 0], [6.8, 'button[aria-label="Collect coin"]', 0], [7.6, 'button[aria-label="Collect coin"]', 0], [9.5, 50, 45], [10.8, 50, 45]] }, fonts: ['Press Start 2P'], name: 'Pixel Arcade', tagline: 'Level up! Age is just a high score.', emoji: '🕹️', music: 'chiptune', tempo: 120, loader: () => import('./PixelArcade.jsx') },
  { id: 'polaroid-memories', category: 'birthday', video: { seconds: 15, taps: [[8.5, 'button[aria-label="Bring photo to front"]', 3], [11.5, 'button[aria-label="Bring photo to front"]', 0]] }, fonts: ['Caveat'], name: 'Polaroid Memories', tagline: 'Photos develop on a cork board of love.', emoji: '📸', music: 'piano', tempo: 90, loader: () => import('./PolaroidMemories.jsx') },
  { id: 'surprise-box', category: 'birthday', video: { seconds: 17, taps: [[4.5, 'button[aria-label="Open the gift"]']] }, fonts: ['Caveat', 'Playfair Display', 'Dancing Script'], name: 'Surprise Box', tagline: 'Tap to unwrap one giant gift.', emoji: '🎁', music: 'bell', tempo: 100, loader: () => import('./SurpriseBox.jsx') },
  { id: 'sky-lanterns', category: 'birthday', video: { seconds: 17, taps: [[4.5, 50, 70], [6, 30, 60], [7.5, 70, 65], [9, 50, 55]] }, fonts: ['Playfair Display', 'Dancing Script'], name: 'Sky Lanterns', tagline: 'Wishes float up into the night.', emoji: '🏮', music: 'pad', tempo: 76, loader: () => import('./SkyLanterns.jsx') },
  { id: 'deep-sea-party', category: 'birthday', video: { seconds: 15, taps: [[4.5, '[aria-label="Treasure chest"]'], [8, '[aria-label="Party fish"]', 0], [9, '[aria-label="Party fish"]', 1], [10.2, '[aria-label="Pop the bubble"]', 0]] }, fonts: ['Fredoka', 'Caveat'], name: 'Deep Sea Party', tagline: 'Fish, bubbles and a message in a bottle.', emoji: '🐠', music: 'pluck', tempo: 96, loader: () => import('./DeepSeaParty.jsx') },
  { id: 'comic-pop', category: 'birthday', video: { seconds: 14, taps: [[9.5, 50, 50], [10.5, 30, 40], [11.5, 70, 45]] }, fonts: ['Bangers'], name: 'Comic Pop', tagline: 'POW! Your birthday hero origin story.', emoji: '💥', music: 'synth', tempo: 126, loader: () => import('./ComicPop.jsx') },
  { id: 'movie-premiere', category: 'birthday', video: { seconds: 52, taps: [] }, fonts: ['Cinzel', 'Playfair Display'], name: 'Movie Premiere', tagline: 'A cinematic trailer starring the birthday star.', emoji: '🎬', music: 'piano', tempo: 72, loader: () => import('./MoviePremiere.jsx') },
  { id: 'make-a-wish', category: 'birthday', video: { seconds: 17, taps: [[7.5, '[aria-label="The birthday cake"]']] }, fonts: ['Caveat', 'Playfair Display', 'Dancing Script'], name: 'Make a Wish', tagline: 'Blow out the candles. Really, with your breath.', emoji: '🕯️', music: 'musicbox', tempo: 84, loader: () => import('./MakeAWish.jsx') },
  { id: 'funny-teddy', category: 'birthday', video: { seconds: 40, taps: [[5.5, 50, 66], [9, 50, 66], [17, 50, 66]] }, fonts: ['Fredoka', 'Caveat', 'Dancing Script'], name: 'Funny Teddy', tagline: 'A clumsy teddy slips, sneezes and dances your wish.', emoji: '🧸', music: 'pluck', tempo: 112, loader: () => import('./FunnyTeddy.jsx') },

  { id: 'love-heartbeat', category: 'love', video: { seconds: 20, taps: [[12, 50, 38]] }, fonts: ['Playfair Display', 'Dancing Script'], name: 'Heartbeat', tagline: 'A pulse draws their name across the screen.', emoji: '❤️', music: 'piano', tempo: 66, song: 'love', loader: () => import('./LoveHeartbeat.jsx') },
  { id: 'love-letter', category: 'love', video: { seconds: 22, taps: [[3.2, '[aria-label="Open the letter"]']] }, fonts: ['Dancing Script', 'Playfair Display', 'Caveat'], name: 'Love Letter', tagline: 'A sealed letter opens, word by word.', emoji: '💌', music: 'musicbox', tempo: 70, song: 'love', loader: () => import('./LoveLetter.jsx') },
  { id: 'love-rose', category: 'love', video: { seconds: 20, taps: [[9, 50, 52], [11, 30, 60]] }, fonts: ['Playfair Display', 'Dancing Script'], name: 'Rose Bloom', tagline: 'A single rose blooms, petal by petal.', emoji: '🌹', music: 'piano', tempo: 64, song: 'love', loader: () => import('./LoveRose.jsx') },
  { id: 'love-stars', category: 'love', video: { seconds: 22, taps: [[6, 28, 42], [8, 72, 58], [10, 50, 30]] }, fonts: ['Cinzel', 'Dancing Script'], name: 'Our Constellation', tagline: 'Two stars find each other in the night.', emoji: '💫', music: 'pad', tempo: 60, song: 'love', loader: () => import('./LoveStars.jsx') },
  { id: 'love-fireflies', category: 'love', video: { seconds: 20, taps: [[8, 30, 55], [10, 70, 45], [12, 50, 62]] }, fonts: ['Dancing Script', 'Caveat'], name: 'Firefly Wish', tagline: 'Fireflies gather into a glowing heart.', emoji: '✨', music: 'musicbox', tempo: 68, song: 'love', loader: () => import('./LoveFireflies.jsx') },
  { id: 'love-story', category: 'love', video: { seconds: 26, taps: [[5, '[aria-label="Turn the page"]'], [9, '[aria-label="Turn the page"]'], [13, '[aria-label="Turn the page"]']] }, fonts: ['Playfair Display', 'Caveat', 'Dancing Script'], name: 'Our Story', tagline: 'A little book of everything you love.', emoji: '📖', music: 'piano', tempo: 72, song: 'love', loader: () => import('./LoveStory.jsx') },

  { id: 'thanks-card', category: 'thanks', video: { seconds: 16, taps: [[3, '[aria-label="Open the card"]']] }, fonts: ['Dancing Script', 'Playfair Display', 'Caveat'], name: 'Thank You Card', tagline: 'A sunflower card that opens with your words inside.', emoji: '🌻', music: 'musicbox', tempo: 92, song: 'thanks', loader: () => import('./ThanksCard.jsx') },
  { id: 'thanks-bouquet', category: 'thanks', video: { seconds: 16, taps: [[9, 50, 50]] }, fonts: ['Playfair Display', 'Dancing Script', 'Caveat'], name: 'Bouquet', tagline: 'Flowers grow one by one, just for them.', emoji: '💐', music: 'piano', tempo: 88, song: 'thanks', loader: () => import('./ThanksBouquet.jsx') },
  { id: 'thanks-teddy', category: 'thanks', video: { seconds: 15, taps: [] }, fonts: ['Fredoka', 'Dancing Script', 'Caveat'], name: 'Teddy Thanks', tagline: 'A teddy says it out loud, then gives a big hug.', emoji: '🧸', music: 'pluck', tempo: 100, song: 'thanks', loader: () => import('./ThanksTeddy.jsx') },
  { id: 'thanks-sunrise', category: 'thanks', video: { seconds: 18, taps: [] }, fonts: ['Playfair Display', 'Dancing Script', 'Caveat'], name: 'Golden Sunrise', tagline: 'A new day begins with gratitude.', emoji: '🌅', music: 'pad', tempo: 70, song: 'thanks', loader: () => import('./ThanksSunrise.jsx') },
  { id: 'thanks-notjust', category: 'thanks', video: { seconds: 19, taps: [] }, fonts: ['Playfair Display', 'Dancing Script', 'Caveat'], name: 'Not Just “Thanks 👍”', tagline: 'The chat says thanks. You say THANK YOU.', emoji: '💬', music: 'pluck', tempo: 108, song: 'thanks', loader: () => import('./ThanksNotJust.jsx') },
  { id: 'thanks-jar', category: 'thanks', video: { seconds: 17, taps: [[10, 50, 55]] }, fonts: ['Dancing Script', 'Caveat'], name: 'Gratitude Jar', tagline: 'Thank-you notes drop into a jar of hearts.', emoji: '🫙', music: 'musicbox', tempo: 80, song: 'thanks', loader: () => import('./ThanksJar.jsx') },
];

const withFonts = (d) => () => {
  loadFonts(d.fonts);
  return d.loader();
};

export const CATEGORIES = [
  { id: 'birthday', title: 'Birthday', blurb: 'Balloons, fireworks, a funny teddy and more', example: 'balloon-bash' },
  { id: 'love', title: 'Lovers', blurb: 'Letters, roses and starlight for someone special', example: 'love-heartbeat' },
  { id: 'thanks', title: 'Thank you', blurb: 'Say a real thank you, not just “thanks 👍”', example: 'thanks-card' },
];

export const TEMPLATES = defs.map((d) => ({ ...d, art: CARD_ART[d.id], loader: withFonts(d), Component: lazy(withFonts(d)) }));

export const templatesFor = (category) => TEMPLATES.filter((t) => t.category === category);

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

/** Start downloading a template's code before it is needed. */
export const preloadTemplate = (id) => {
  const t = TEMPLATES.find((x) => x.id === id);
  if (t) t.loader();
};

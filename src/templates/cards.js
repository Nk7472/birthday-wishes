// Artwork for the template cards in the carousel. Every card is a flat colour with one big
// emoji and a few satellites that loop with cheap transform/opacity animations.
// Layer: { e: emoji, x: %, y: %, s: size (cqw), a: animation, d: delay (s), t: duration (s) }
// Animations are defined in index.css as .ca-<name>.

const hero = (e, a = 'bob', s = 44) => ({ e, x: 50, y: 42, s, a, d: 0, t: 3.4, hero: true });
const L = (e, x, y, s, a, d = 0, t = 4) => ({ e, x, y, s, a, d, t });

export const CARD_ART = {
  'balloon-bash': { bg: '#FFE1EA', layers: [L('🎈', 14, 70, 15, 'rise', 0, 6), L('🎈', 82, 78, 17, 'rise', 1.6, 7), L('🎉', 80, 18, 12, 'twinkle', 0.4), L('✨', 18, 20, 10, 'twinkle', 1.1), hero('🎂')] },
  'midnight-fireworks': { bg: '#1D1D3A', dark: true, layers: [L('✨', 18, 22, 10, 'twinkle', 0), L('⭐', 82, 18, 9, 'twinkle', 0.8), L('🎇', 76, 62, 16, 'pulse', 0.3, 2.6), L('✨', 24, 70, 8, 'twinkle', 1.4), hero('🎆', 'pulse')] },
  'neon-nights': { bg: '#2A1448', dark: true, layers: [L('🌴', 80, 62, 15, 'sway', 0, 4), L('🎶', 18, 28, 12, 'rise', 0, 5), L('✨', 82, 20, 9, 'twinkle', 0.6), L('🎵', 24, 74, 10, 'rise', 1.8, 5), hero('🌆')] },
  'golden-gala': { bg: '#2B2314', dark: true, layers: [L('✨', 20, 24, 11, 'twinkle', 0), L('🌟', 80, 22, 11, 'twinkle', 0.9), L('✨', 76, 72, 9, 'twinkle', 1.6), hero('🥂', 'sway')] },
  'cosmic-voyage': { bg: '#10173A', dark: true, layers: [L('⭐', 16, 22, 9, 'twinkle', 0), L('🚀', 20, 72, 14, 'bob', 0.4, 3), L('✨', 82, 24, 10, 'twinkle', 1), L('⭐', 80, 74, 8, 'twinkle', 1.7), hero('🪐', 'spin', 46)] },
  'enchanted-garden': { bg: '#E2F4D6', layers: [L('🦋', 20, 26, 13, 'float', 0, 5), L('🌷', 80, 76, 14, 'sway', 0.5), L('🌼', 18, 78, 13, 'sway', 1.2), L('✨', 82, 20, 9, 'twinkle', 0.9), hero('🌸')] },
  'candy-land': { bg: '#FFD9EC', layers: [L('🍬', 18, 24, 13, 'bob', 0, 3), L('🧁', 80, 74, 15, 'bob', 0.8, 3.4), L('🍩', 20, 78, 13, 'sway', 1.2), L('⭐', 82, 22, 9, 'twinkle', 0.4), hero('🍭', 'sway')] },
  'pixel-arcade': { bg: '#1B1B3A', dark: true, layers: [L('👾', 80, 24, 14, 'bob', 0, 2.4), L('🪙', 18, 30, 11, 'bob', 0.6, 2), L('⭐', 82, 74, 9, 'twinkle', 0.2), L('🍰', 22, 76, 12, 'bob', 1.2, 3), hero('🕹️', 'sway')] },
  'polaroid-memories': { bg: '#EBDCC4', layers: [L('📌', 20, 20, 10, 'sway', 0), L('💌', 80, 24, 12, 'bob', 0.6, 3.6), L('🌟', 22, 76, 9, 'twinkle', 1), L('🎞️', 80, 76, 12, 'sway', 0.4), hero('📸', 'sway')] },
  'surprise-box': { bg: '#EFD9FF', layers: [L('🎊', 20, 24, 12, 'twinkle', 0), L('✨', 82, 22, 10, 'twinkle', 0.8), L('🎈', 80, 78, 14, 'rise', 0.3, 6), L('🎈', 18, 80, 13, 'rise', 2.4, 7), hero('🎁', 'jump')] },
  'sky-lanterns': { bg: '#28173F', dark: true, layers: [L('🏮', 20, 62, 12, 'rise', 0, 7), L('🏮', 80, 50, 11, 'rise', 2.2, 8), L('🌙', 78, 16, 12, 'bob', 0, 5), L('✨', 20, 20, 9, 'twinkle', 0.9), hero('🏮', 'bob')] },
  'deep-sea-party': { bg: '#CDEBFF', layers: [L('🫧', 20, 72, 11, 'rise', 0, 5), L('🫧', 76, 62, 9, 'rise', 1.4, 6), L('🐙', 80, 24, 14, 'sway', 0.3), L('🐚', 22, 84, 11, 'bob', 0.9, 3.4), hero('🐠', 'swim')] },
  'comic-pop': { bg: '#FFE55C', layers: [L('💬', 20, 22, 13, 'bob', 0, 2.6), L('⭐', 82, 24, 10, 'twinkle', 0.5), L('🎂', 80, 76, 14, 'bob', 0.9, 3), hero('💥', 'pulse')] },
  'movie-premiere': { bg: '#1B1B1F', dark: true, layers: [L('🍿', 80, 72, 14, 'bob', 0.4, 3), L('⭐', 20, 24, 10, 'twinkle', 0), L('🎞️', 80, 22, 11, 'sway', 1), L('✨', 22, 76, 9, 'twinkle', 1.4), hero('🎬', 'sway')] },
  'make-a-wish': { bg: '#251C41', dark: true, layers: [L('✨', 20, 24, 11, 'twinkle', 0), L('✨', 80, 26, 9, 'twinkle', 0.7), L('🎂', 50, 80, 14, 'bob', 0.3, 3.6), L('🌟', 82, 70, 9, 'twinkle', 1.3), hero('🕯️', 'flicker')] },
  'funny-teddy': { bg: '#FFE0C2', layers: [L('🎈', 18, 70, 15, 'rise', 0, 6), L('🍌', 20, 80, 11, 'sway', 0.6), L('🎂', 80, 76, 14, 'bob', 0.9, 3.2), L('🥳', 80, 20, 11, 'bob', 0.2, 2.6), hero('🧸', 'dance')] },

  'love-heartbeat': { bg: '#FFD8E2', layers: [L('💓', 18, 24, 12, 'pulse', 0.4, 2), L('💗', 82, 70, 13, 'pulse', 1, 2.2), L('✨', 82, 22, 9, 'twinkle', 0.8), L('💞', 20, 78, 12, 'bob', 0.6, 3), hero('❤️', 'beat', 46)] },
  'love-letter': { bg: '#FBE6D2', layers: [L('🌹', 20, 76, 14, 'sway', 0.3), L('💕', 80, 24, 12, 'rise', 0, 6), L('✨', 20, 22, 9, 'twinkle', 0.9), L('💕', 82, 70, 10, 'rise', 2.4, 7), hero('💌', 'bob')] },
  'love-rose': { bg: '#FFD3DB', layers: [L('🌸', 20, 20, 11, 'fall', 0, 7), L('🌸', 78, 12, 9, 'fall', 2.4, 8), L('🍃', 82, 62, 12, 'sway', 0.4), L('🌸', 50, 10, 8, 'fall', 4, 9), hero('🌹', 'sway')] },
  'love-stars': { bg: '#1B1F46', dark: true, layers: [L('⭐', 18, 22, 10, 'twinkle', 0), L('⭐', 82, 28, 8, 'twinkle', 0.9), L('🌙', 78, 14, 11, 'bob', 0.3, 5), L('💖', 50, 80, 13, 'pulse', 0.4, 2.4), hero('💫', 'spin', 42)] },
  'love-fireflies': { bg: '#12271F', dark: true, layers: [L('✨', 22, 30, 9, 'firefly', 0, 4), L('✨', 76, 22, 8, 'firefly', 1.3, 5), L('✨', 70, 70, 9, 'firefly', 2.1, 4.4), L('🌿', 20, 80, 13, 'sway', 0.5), hero('💚', 'beat', 38)] },
  'love-story': { bg: '#F2E3C6', layers: [L('💕', 80, 24, 11, 'rise', 0, 6), L('🖋️', 20, 78, 11, 'sway', 0.5), L('✨', 20, 22, 9, 'twinkle', 0.8), L('🌹', 80, 76, 12, 'bob', 0.9, 3.4), hero('📖', 'bob')] },

  'thanks-card': { bg: '#F6E7C8', layers: [L('🌼', 20, 22, 11, 'sway', 0), L('✨', 82, 22, 9, 'twinkle', 0.8), L('💛', 80, 76, 11, 'bob', 0.5, 3.2), L('🌼', 20, 78, 12, 'sway', 1.1), hero('🌻', 'sway')] },
  'thanks-bouquet': { bg: '#FFD8E0', layers: [L('🌸', 20, 20, 11, 'fall', 0, 7), L('✨', 80, 24, 9, 'twinkle', 0.6), L('🌸', 78, 12, 9, 'fall', 2.4, 8), L('💛', 18, 78, 11, 'bob', 0.8, 3.4), hero('💐', 'bob')] },
  'thanks-teddy': { bg: '#FFE0B8', layers: [L('💛', 20, 24, 11, 'rise', 0, 6), L('💛', 80, 70, 12, 'rise', 1.6, 7), L('✨', 82, 22, 9, 'twinkle', 0.5), L('🧡', 20, 78, 10, 'bob', 0.9, 3), hero('🧸', 'dance')] },
  'thanks-sunrise': { bg: '#6B3568', dark: true, layers: [L('✨', 20, 22, 10, 'twinkle', 0), L('☁️', 80, 24, 13, 'float', 0.4, 6), L('✨', 82, 70, 8, 'twinkle', 1.2), L('🕊️', 22, 74, 12, 'float', 0.8, 5), hero('🌅', 'bob')] },
  'thanks-notjust': { bg: '#E3ECFB', layers: [L('👍', 18, 24, 12, 'bob', 0, 2.6), L('❤️', 80, 70, 13, 'pulse', 0.6, 2), L('✨', 80, 22, 9, 'twinkle', 0.9), L('💛', 20, 78, 11, 'bob', 1.2, 3), hero('💬', 'pulse')] },
  'thanks-jar': { bg: '#14424A', dark: true, layers: [L('✨', 20, 22, 9, 'twinkle', 0), L('💛', 80, 26, 10, 'rise', 0.5, 6), L('✨', 80, 74, 9, 'twinkle', 1.1), L('🧡', 20, 76, 10, 'bob', 0.8, 3.2), hero('🫙', 'bob')] },
};

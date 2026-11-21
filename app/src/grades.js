// grades.js — the colour grades of Vice Panels.
//
// A grade is applied in three passes by the renderer: a CSS filter string
// while the panel collage is drawn onto the final canvas, a translucent
// gradient wash composited over the graded collage, and a vignette that
// darkens the corners so the caption lettering sits on a calmer ground.
// Every colour here is an ordinary CSS colour; no image or font is loaded.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    tagline: 'Hot orange sinking into magenta and deep violet.',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    wash: {
      direction: 'vertical',
      stops: [
        [0, 'rgba(43, 16, 85, 0.55)'],
        [0.45, 'rgba(255, 110, 64, 0.18)'],
        [1, 'rgba(255, 46, 136, 0.42)'],
      ],
      mode: 'soft-light',
    },
    vignette: 0.38,
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    tagline: 'Teal and magenta signage over a wet midnight street.',
    filter: 'saturate(1.55) contrast(1.16) brightness(0.98) hue-rotate(-10deg)',
    wash: {
      direction: 'diagonal',
      stops: [
        [0, 'rgba(0, 229, 255, 0.40)'],
        [0.55, 'rgba(20, 0, 60, 0.10)'],
        [1, 'rgba(255, 0, 168, 0.45)'],
      ],
      mode: 'soft-light',
    },
    vignette: 0.48,
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    tagline: 'Warm film light, honey on every edge.',
    filter: 'sepia(0.32) saturate(1.25) contrast(1.05) brightness(1.07)',
    wash: {
      direction: 'vertical',
      stops: [
        [0, 'rgba(255, 154, 60, 0.30)'],
        [1, 'rgba(120, 40, 0, 0.28)'],
      ],
      mode: 'overlay',
    },
    vignette: 0.30,
  },
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Black and white, hard contrast, heavy corners.',
    filter: 'grayscale(1) contrast(1.28) brightness(0.99)',
    wash: null,
    vignette: 0.62,
  },
  {
    id: 'clean-pop',
    name: 'Clean Pop',
    tagline: 'Barely touched: a little saturation, a little snap.',
    filter: 'saturate(1.18) contrast(1.10) brightness(1.01)',
    wash: {
      direction: 'vertical',
      stops: [
        [0, 'rgba(255, 255, 255, 0.16)'],
        [1, 'rgba(30, 30, 80, 0.16)'],
      ],
      mode: 'soft-light',
    },
    vignette: 0.22,
  },
];

export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

// layouts.js — the panel collages of Vice Panels.
//
// Every layout is a small set of polygons in normalised cover space (x and y
// both run 0..1, origin top-left). Panels share vertices so the cuts between
// them meet cleanly, GTA-poster style: one slanted spine, horizontal cuts that
// never quite agree with each other, and a border drawn over every seam.
// The renderer stretches the polygons to whatever export size is chosen, so
// the same layout serves the square, portrait and landscape covers.

function panel(points) {
  return { poly: points };
}

export const LAYOUTS = [
  {
    id: 'riot-five',
    name: 'Riot Five',
    tagline: 'The classic collage: two stacked scenes left, three right.',
    panels: [
      panel([[0, 0], [0.46, 0], [0.415, 0.55], [0, 0.62]]),
      panel([[0, 0.62], [0.415, 0.55], [0.38, 1], [0, 1]]),
      panel([[0.46, 0], [1, 0], [1, 0.30], [0.437, 0.36]]),
      panel([[0.437, 0.36], [1, 0.30], [1, 0.76], [0.408, 0.70]]),
      panel([[0.408, 0.70], [1, 0.76], [1, 1], [0.38, 1]]),
    ],
  },
  {
    id: 'hero-crew',
    name: 'Hero & Crew',
    tagline: 'One big portrait on the left, three beats stacked beside it.',
    panels: [
      panel([[0, 0], [0.60, 0], [0.56, 1], [0, 1]]),
      panel([[0.60, 0], [1, 0], [1, 0.30], [0.585, 0.34]]),
      panel([[0.585, 0.34], [1, 0.30], [1, 0.72], [0.572, 0.67]]),
      panel([[0.572, 0.67], [1, 0.72], [1, 1], [0.56, 1]]),
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    tagline: 'Three tall angled slices, like a poster triptych on a wall.',
    panels: [
      panel([[0, 0], [0.36, 0], [0.30, 1], [0, 1]]),
      panel([[0.36, 0], [0.68, 0], [0.62, 1], [0.30, 1]]),
      panel([[0.68, 0], [1, 0], [1, 1], [0.62, 1]]),
    ],
  },
  {
    id: 'skyline',
    name: 'Skyline Strip',
    tagline: 'A wide establishing shot up top, three close-ups underneath.',
    panels: [
      panel([[0, 0], [1, 0], [1, 0.52], [0, 0.58]]),
      panel([[0, 0.58], [0.36, 0.558], [0.33, 1], [0, 1]]),
      panel([[0.36, 0.558], [0.68, 0.539], [0.66, 1], [0.33, 1]]),
      panel([[0.68, 0.539], [1, 0.52], [1, 1], [0.66, 1]]),
    ],
  },
  {
    id: 'duel',
    name: 'The Duel',
    tagline: 'Two panels, one long diagonal: hero versus city.',
    panels: [
      panel([[0, 0], [0.62, 0], [0.30, 1], [0, 1]]),
      panel([[0.62, 0], [1, 0], [1, 1], [0.30, 1]]),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

// Axis-aligned bounds of a panel polygon, in normalised space. The renderer
// fits each photo to these bounds, then lets the polygon clip the overflow.
export function panelBounds(onePanel) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const [x, y] of onePanel.poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

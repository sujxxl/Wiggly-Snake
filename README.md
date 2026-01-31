# Wiggly Snake

This is an experimental, interactive generative art application inspired by "Staggering Beauty." It is a single-page Angular application that combines physics simulation, canvas rendering, and procedural audio to create a chaotic, sensory experience.

## Core Concept & Mechanics

The app features a physics-based "worm" or "snake" that stands upright in the center of the screen.

- **Physics Engine**: The creature is built using a custom verlet-integration-style physics engine. It consists of 40 connected segments (points) linked by virtual springs.
- **Movement**: The head of the snake follows your mouse or touch input. The body follows loosely, creating a realistic, weighty sway.
- **Constraints**: The tail is permanently pinned to the bottom-center of the screen, while the rest of the body is free to bend and stretch.
- **Auto-Balancing**: When you stop moving, the snake naturally drifts back to an upright position, calculated dynamically based on the screen height so it doesn't sag or stretch infinitely.

## The "Chaos" Mode

The defining feature of the app is its reaction to vigorous movement.

- **Trigger**: If you shake your mouse or swipe your screen rapidly, the velocity is calculated. Once it crosses a specific threshold, the app enters Chaos Mode.
- **Visual Overload**:
  - Flashing Colors: The background flashes rapidly between high-saturation neon colors and black/white.
  - Shape Distortion: The snake's body jitters, expands in thickness, and glows.
  - Screen Shake: The entire canvas translates randomly to simulate a violent earthquake effect.
  - Glitch Artifacts: Random geometric lines and shapes satisfy the background.
  - Googly Eyes: The eyes on the worm scale up and shake independently.

## Generative Audio

The app features a custom audio engine built with the Web Audio API (no pre-recorded mp3s).

- **Melodic (Idle)**: When moving slowly, it plays a soothing, generative melody using a C Minor Pentatonic scale. The sound is a soft "triangle" wave (flute-like).
- **Chaotic (Active)**: As interaction intensity increases:
  - The tempo accelerates.
  - The waveform switches to a harsh "square" wave (8-bit/chiptune style).
  - The filter opens up, making the sound brighter and more resonant.
  - Notes get detuned and jump octaves randomly, creating a frantic, dissonant soundscape.

## Visual Style

- **Normal State**: Minimalist. A solid black background with a smooth, fleshy-colored snake. The rendering uses HTML5 Canvas quadraticCurveTo for smooth, organic skin.
- **UI**: Completely minimal. The cursor is hidden (cursor-none) to immerse the user. A faint "MOVE / TOUCH / SHAKE" hint appears at the start and fades away upon interaction.

## Technology Stack

- **Framework**: Angular 18+ (Standalone Components, Signals, Zoneless Change Detection).
- **Rendering**: HTML5 `<canvas>` Context 2D.
- **Styling**: Tailwind CSS.
- **Performance**: Optimized animation loop using requestAnimationFrame running outside of Angular's change detection zone for 60fps performance.

## Installation Instructions

1. **Clone the repository**:

   ```
   git clone <repository-url>
   cd wiggly-snake
   ```

2. **Install dependencies**:

   ```
   npm install
   ```

3. **Run the application**:

   ```
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000/` to view the app.

## Usage

- Move your mouse or touch the screen to control the snake's head.
- Shake or swipe rapidly to trigger Chaos Mode.
- Enjoy the generative audio and visual effects!

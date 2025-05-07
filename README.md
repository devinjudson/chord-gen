# Chord Progression Generator

A web application that generates and plays musical chord progressions with melody generation capabilities. Built with Next.js, TypeScript, and Tone.js.

## Features

- Generate random chord progressions in any key and mode
- Multiple chord types (triads, sevenths, major7, minor7, sus4, add9)
- Melody generation with various rhythm patterns
- Real-time playback using Tone.js
- Piano keyboard and piano roll visualization
- MIDI export for both chords and melody
- Sample-based playback support
- Adjustable BPM and volume controls

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/chord-progression-generator.git
cd chord-progression-generator
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select a key and mode (major/minor)
2. Choose the number of chords (2-4)
3. Select chord types to include
4. (Optional) Enable melody generation and adjust settings
5. Click "Generate New Progression" to create a new progression
6. Use the play controls to start/stop/pause playback
7. Export as MIDI if desired

## Technologies Used

- Next.js
- TypeScript
- Tone.js
- Tailwind CSS
- Shadcn/ui

## License

This project is licensed under the MIT License - see the LICENSE file for details.

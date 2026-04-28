# String Art Generator

Transform any image into physical string art with numbered nail positions and step-by-step routing instructions.

![String Art Generator](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple)

## Features

- **Minimalist Bento Grid UI** — clean, organized layout for all controls and previews
- **Physical canvas dimensions** — enter your actual canvas size in cm or inches
- **Smart nail spacing** — set spacing in mm (5-30mm), automatically calculates nail count
- **Spacing quality indicator** — shows if spacing is optimal, tight, or relaxed
- **Recommended presets** — quick buttons for recommended, high-detail, or easy spacing
- **Upload any image** — automatically converts to grayscale for processing
- **Real-time playback** — watch the string art build with play/pause and seek controls
- **Nail overlay** — numbered positions starting from top-left, going clockwise
- **Export options:**
  - **PDF Instructions** — high-quality document with project summary and routing steps
  - **Step-by-step routing** — raw text file with nail counts per edge (TXT)
  - **Nail overlay template** — printable image with numbered positions (PNG)

## Nail Spacing Guide

| Spacing | Quality | Description |
|---------|---------|-------------|
| 5-6mm | Very Tight | Maximum detail, difficult to work with |
| 6-8mm | Tight | High detail, challenging |
| 8-12mm | **Optimal** | Best balance of detail and workability |
| 12-18mm | Relaxed | Easier to work with, less detail |
| 18-30mm | Sparse | Quick projects, minimal detail |

## How It Works

The algorithm uses a greedy approach:

1. Places numbered nails evenly around the canvas perimeter
2. Converts the image to grayscale (dark = more string needed)
3. Starting at nail 0, finds which nail connection creates the darkest line
4. "Subtracts" that line from the image and repeats
5. Outputs the complete routing path

## Creating Physical String Art

### 1. Materials
- **Base:** 12-18mm MDF or Birch Plywood. Avoid pine or softwoods.
- **Nails:** 20mm–30mm panel pins or linoleum nails (small heads are better).
- **String:** #69 Bonded Nylon or high-quality Polyester thread (0.15mm).

### 2. Preparation
- **Generate** — Upload your image and adjust settings until satisfied.
- **Export overlay** — Download the "Nail Overlay" (PNG).
- **Positioning** — Print the overlay at your exact physical size. Tape it to the board.

### 3. Execution
- **Hammering** — Drive nails through the marks on the template. Ensure they are straight.
- **Precision Wand** — Use an empty ballpoint pen barrel. Thread the string through it to use as a "wand" for fast, high-tension routing.
- **Routing** — Follow the PDF instructions (e.g., "0 → 142 → 67 → ...").
- **Locking** — Every 20–30 steps, wrap the string 360° around a nail to prevent the whole work from unraveling if you drop the thread.

## Getting Started

### Quick Start (any system with Node.js)

```bash
npm install
npm run dev
```

### WSL Setup (Windows Subsystem for Linux)

If you're on Windows using WSL, follow these steps for a clean virtual environment setup:

#### 1. Install Node.js via nvm (recommended)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell config
source ~/.bashrc

# Install latest LTS Node.js
nvm install --lts

# Verify installation
node --version
npm --version
```

#### 2. Clone and Setup Project

```bash
# Clone the repo (or unzip if you downloaded it)
cd ~
git clone https://github.com/YOUR_USERNAME/string-art-generator.git
cd string-art-generator

# Install dependencies in isolated node_modules
npm install
```

#### 3. Run Development Server

```bash
npm run dev
```

This starts Vite on `http://localhost:5173`. Open this URL in your Windows browser.

#### 4. Access from Windows Browser

WSL2 automatically forwards ports, so just open:
```
http://localhost:5173
```

If that doesn't work, find your WSL IP:
```bash
ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```
Then open `http://<WSL_IP>:5173` in Windows.

#### 5. Build for Production

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

The built files will be in the `dist/` folder, ready to deploy anywhere.

### Using a Specific Node Version Per Project

If you work on multiple projects, you can lock this project to a specific Node version:

```bash
# Create .nvmrc file
echo "20" > .nvmrc

# Then whenever you enter the project:
nvm use
```

### Troubleshooting WSL

**Port not accessible from Windows:**
```bash
# Check if server is running
curl http://localhost:5173

# Or bind to all interfaces explicitly
npm run dev -- --host 0.0.0.0
```

**Permission errors:**
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Slow file watching:**
```bash
# Add to package.json scripts or run directly
npm run dev -- --force
```

## Tips

- **More nails** = finer detail but more complex routing
- **More strings** = darker image but takes longer to create
- **High contrast images** work best
- Start with 200 nails and 2000 strings for a good balance

## License

MIT

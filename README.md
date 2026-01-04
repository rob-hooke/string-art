# String Art Generator

Transform any image into physical string art with numbered nail positions and step-by-step routing instructions.

![String Art Generator](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple)

## Features

- **Physical canvas dimensions** — enter your actual canvas size in cm or inches
- **Smart nail spacing** — set spacing in mm (5-30mm), automatically calculates nail count
- **Spacing quality indicator** — shows if spacing is optimal, tight, or relaxed
- **Recommended presets** — quick buttons for recommended, high-detail, or easy spacing
- **Upload any image** — automatically converts to grayscale for processing
- **Real-time preview** — watch the string art build with playback controls
- **Nail overlay** — numbered positions starting from top-left, going clockwise
- **Export options:**
  - Step-by-step routing instructions with nail counts per edge (TXT)
  - Printable nail overlay template with dimensions (PNG)

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

## Creating Physical String Art

1. **Generate** — Upload your image and adjust settings
2. **Export overlay** — Download the nail position template
3. **Print & mark** — Print the overlay at your canvas size, use it to position nails
4. **Route string** — Follow the numbered instructions (e.g., "0 → 142 → 67 → ...")

## Tips

- **More nails** = finer detail but more complex routing
- **More strings** = darker image but takes longer to create
- **High contrast images** work best
- Start with 200 nails and 2000 strings for a good balance

## License

MIT

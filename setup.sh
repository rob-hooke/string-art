#!/bin/bash
# setup.sh - Automated setup for String Art Generator in WSL

set -e

echo "🎨 String Art Generator - WSL Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in WSL
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
    echo -e "${GREEN}✓ WSL detected${NC}"
else
    echo -e "${YELLOW}⚠ Not running in WSL (that's fine, continuing anyway)${NC}"
fi

# Check for nvm or node
if command -v nvm &> /dev/null || [ -d "$HOME/.nvm" ]; then
    echo -e "${GREEN}✓ nvm found${NC}"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
elif command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
else
    echo -e "${YELLOW}Installing nvm...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo -e "${YELLOW}Installing Node.js LTS...${NC}"
    nvm install --lts
fi

# Ensure we have node
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js installation failed. Please install manually.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using Node.js $(node --version)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "To start the development server:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Then open in your browser:"
echo -e "  ${YELLOW}http://localhost:5173${NC}"
echo ""

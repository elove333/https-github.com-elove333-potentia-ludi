#!/bin/bash
# Quick Git Tools Setup Script
# See GIT_TOOLS.md for detailed information about each tool

set -e

# Version variables for easier maintenance
DELTA_VERSION="0.16.5"

echo "🛠️  Git Tools Setup for Potentia Ludi"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PKG_MANAGER="brew"
elif [[ -f /etc/debian_version ]]; then
    PKG_MANAGER="apt"
elif [[ -f /etc/fedora-release ]]; then
    PKG_MANAGER="dnf"
else
    PKG_MANAGER="unknown"
fi

echo -e "${YELLOW}Detected package manager: $PKG_MANAGER${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install tool
install_tool() {
    local tool=$1
    local install_cmd=$2
    
    if command_exists "$tool"; then
        echo -e "${GREEN}✓${NC} $tool already installed"
    else
        echo "Installing $tool..."
        eval "$install_cmd"
        if command_exists "$tool"; then
            echo -e "${GREEN}✓${NC} $tool installed successfully"
        else
            echo -e "${YELLOW}⚠${NC} Failed to install $tool"
        fi
    fi
}

# Ask user what to install
echo "Select setup level:"
echo "1) Minimal (lazygit, delta, pre-commit)"
echo "2) Recommended (+ starship, git-extras, git-secrets)"
echo "3) Full (+ forgit, git-absorb, git-lfs, commitizen)"
echo ""
read -p "Enter choice [1-3]: " setup_choice

# Install based on choice
case $setup_choice in
    1|2|3)
        # Minimal tools
        echo ""
        echo "Installing minimal tools..."
        
        case $PKG_MANAGER in
            brew)
                install_tool "lazygit" "brew install lazygit"
                install_tool "delta" "brew install git-delta"
                ;;
            apt)
                install_tool "delta" "wget https://github.com/dandavison/delta/releases/download/${DELTA_VERSION}/git-delta_${DELTA_VERSION}_amd64.deb && sudo dpkg -i git-delta_${DELTA_VERSION}_amd64.deb && rm git-delta_${DELTA_VERSION}_amd64.deb"
                echo -e "${YELLOW}⚠${NC} lazygit: Please install manually from https://github.com/jesseduffield/lazygit"
                ;;
            *)
                echo -e "${YELLOW}⚠${NC} Please install lazygit and delta manually"
                ;;
        esac
        
        install_tool "pre-commit" "pip install pre-commit || pip3 install pre-commit"
        ;;
esac

case $setup_choice in
    2|3)
        # Recommended tools
        echo ""
        echo "Installing recommended tools..."
        
        case $PKG_MANAGER in
            brew)
                install_tool "starship" "brew install starship"
                install_tool "git-extras" "brew install git-extras"
                install_tool "git-secrets" "brew install git-secrets"
                ;;
            apt)
                install_tool "git-extras" "sudo apt-get install -y git-extras"
                echo -e "${YELLOW}⚠${NC} starship: Please install from https://starship.rs"
                echo -e "${YELLOW}⚠${NC} git-secrets: Please install manually"
                ;;
            *)
                echo -e "${YELLOW}⚠${NC} Please install starship, git-extras, and git-secrets manually"
                ;;
        esac
        ;;
esac

case $setup_choice in
    3)
        # Full setup
        echo ""
        echo "Installing additional tools..."
        
        case $PKG_MANAGER in
            brew)
                install_tool "forgit" "brew install forgit"
                install_tool "git-absorb" "brew install git-absorb"
                install_tool "git-lfs" "brew install git-lfs"
                ;;
            *)
                echo -e "${YELLOW}⚠${NC} Please install forgit, git-absorb, and git-lfs manually"
                ;;
        esac
        
        install_tool "cz" "npm install -g commitizen cz-conventional-changelog"
        ;;
esac

# Setup configurations
echo ""
echo "Setting up configurations..."

# Create config directory
mkdir -p ~/.config

# Setup Starship if installed
if command_exists "starship"; then
    if [ -f ~/.config/starship.toml ]; then
        echo -e "${YELLOW}⚠${NC} ~/.config/starship.toml already exists, skipping"
    else
        cp docs/configs/starship.toml ~/.config/starship.toml
        echo -e "${GREEN}✓${NC} Starship config installed to ~/.config/starship.toml"
    fi
fi

# Setup pre-commit if installed
if command_exists "pre-commit"; then
    if [ -f .git/hooks/pre-commit ]; then
        echo -e "${YELLOW}⚠${NC} Pre-commit hooks already installed"
    else
        pre-commit install
        echo -e "${GREEN}✓${NC} Pre-commit hooks installed"
    fi
fi

# Setup git-lfs if installed
if command_exists "git-lfs"; then
    git lfs install
    echo -e "${GREEN}✓${NC} Git LFS initialized"
fi

# Setup git-secrets if installed
if command_exists "git-secrets"; then
    if [ -f .git/hooks/commit-msg ] && grep -q "git-secrets" .git/hooks/commit-msg; then
        echo -e "${YELLOW}⚠${NC} git-secrets already configured"
    else
        git secrets --install 2>/dev/null || true
        git secrets --register-aws
        echo -e "${GREEN}✓${NC} git-secrets configured"
    fi
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Add Starship to your shell config:"
echo "   For bash: echo 'eval \"\$(starship init bash)\"' >> ~/.bashrc"
echo "   For zsh:  echo 'eval \"\$(starship init zsh)\"' >> ~/.zshrc"
echo ""
echo "2. Review and merge Git config enhancements:"
echo "   cat docs/configs/gitconfig >> ~/.gitconfig"
echo ""
echo "3. Run pre-commit on all files:"
echo "   pre-commit run --all-files"
echo ""
echo "4. Try out the tools:"
echo "   lazygit     # Visual Git interface"
echo "   git lg      # Pretty Git log (after merging gitconfig)"
echo "   git summary # Repository summary (if git-extras installed)"
echo ""
echo "📖 See GIT_TOOLS.md for detailed usage instructions"

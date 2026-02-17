# Configuration Files

This directory contains example configuration files for various Git tools and utilities. These configurations are referenced in the [Git Tools & TUIs Guide](../../GIT_TOOLS.md).

## Files

### gitconfig
Enhanced Git configuration with useful aliases, better defaults, and tool integrations.

**Installation:**
```bash
# View your current config
cat ~/.gitconfig

# Copy specific sections from this file to your ~/.gitconfig
# Or merge the entire file:
cat docs/configs/gitconfig >> ~/.gitconfig
```

**Key features:**
- Delta integration for beautiful diffs
- Useful aliases (lg, st, co, cm, etc.)
- Better merge conflict display
- Auto-pruning of remote branches

### starship.toml
Starship prompt configuration with Git status indicators and language version display.

**Installation:**
```bash
# Install Starship first
brew install starship  # or your package manager

# Copy the config file
mkdir -p ~/.config
cp docs/configs/starship.toml ~/.config/starship.toml

# Add to your shell config (~/.bashrc or ~/.zshrc):
eval "$(starship init bash)"  # for bash
# or
eval "$(starship init zsh)"   # for zsh
```

**Features:**
- Git branch and status in prompt
- Node.js, Python, Rust version display
- Clean, fast prompt rendering
- Customizable symbols and colors

### .pre-commit-config.yaml
Pre-commit hooks configuration (located in repository root).

**Installation:**
```bash
# Install pre-commit
pip install pre-commit
# or
brew install pre-commit

# Install the hooks
pre-commit install

# (Optional) Run on all files
pre-commit run --all-files
```

**Included hooks:**
- Trailing whitespace removal
- End-of-file fixer
- YAML/JSON validation
- Large file detection
- ESLint for JavaScript/TypeScript

## Customization

Feel free to customize these configurations to match your preferences:

1. **gitconfig**: Modify aliases, change delta theme, adjust log formats
2. **starship.toml**: Change symbols, colors, add/remove sections
3. **.pre-commit-config.yaml**: Add language-specific hooks, adjust file filters

## Additional Resources

- [Git Tools & TUIs Guide](../../GIT_TOOLS.md) - Complete guide to Git tools
- [Git Workflows Guide](../../GIT_WORKFLOWS.md) - Git workflow examples
- [Contributing Guide](../../CONTRIBUTING.md) - Project contribution guidelines

## Tool-Specific Configurations

### lazygit
Create `~/.config/lazygit/config.yml`:
```yaml
gui:
  theme:
    activeBorderColor:
      - green
      - bold
  showFileTree: true

git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never
```

### tig
Create `~/.tigrc`:
```bash
# Vim-style navigation
bind generic g move-first-line
bind generic G move-last-line

# Custom display
set line-graphics = utf-8
set show-changes = yes
```

### gitui
Create `~/.config/gitui/key_bindings.ron`:
```ron
(
    move_up: Some(( code: Char('k'), modifiers: ( bits: 0,),)),
    move_down: Some(( code: Char('j'), modifiers: ( bits: 0,),)),
)
```

## Quick Setup Script

For a quick setup of recommended tools:

```bash
#!/bin/bash
# Quick Git Tools Setup

# Install core tools
brew install lazygit git-delta starship

# Install Python tools
pip install pre-commit

# Copy configurations
mkdir -p ~/.config
cp docs/configs/starship.toml ~/.config/starship.toml

# Merge gitconfig (review before running)
cat docs/configs/gitconfig >> ~/.gitconfig

# Install pre-commit hooks
pre-commit install

# Add to shell config
echo 'eval "$(starship init bash)"' >> ~/.bashrc
# or for zsh: echo 'eval "$(starship init zsh)"' >> ~/.zshrc

echo "✅ Git tools setup complete!"
echo "📖 See GIT_TOOLS.md for usage instructions"
```

Save this as `setup-git-tools.sh` and run with `bash setup-git-tools.sh`.

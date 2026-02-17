# Git Tools & TUI Applications Guide

This guide provides an overview of powerful Git tools and Terminal User Interfaces (TUIs) that enhance your Git workflow. These tools complement the workflows described in [GIT_WORKFLOWS.md](./GIT_WORKFLOWS.md) and make Git operations more intuitive and efficient.

## Table of Contents

- [TUI Git Clients](#tui-git-clients)
- [Git History Management](#git-history-management)
- [Shell Prompt Integrations](#shell-prompt-integrations)
- [Managing Large Files](#managing-large-files)
- [Diff Tools](#diff-tools)
- [Git Hook Managers](#git-hook-managers)
- [Git Tool Collections](#git-tool-collections)
- [Other Essential Git Tools](#other-essential-git-tools)
- [Recommended Setup](#recommended-setup)

---

## TUI Git Clients

Terminal User Interfaces for Git make complex operations visual and interactive while staying in the terminal.

### lazygit

**Simple terminal UI for git commands** - The most popular Git TUI with an intuitive interface.

#### Features
- Visual representation of branches, commits, and file changes
- Interactive staging and unstaging
- Easy commit amending and rebasing
- Branch management and merging
- Stash management
- Cherry-picking made visual
- Conflict resolution interface

#### Installation

**macOS:**
```bash
brew install lazygit
```

**Ubuntu/Debian:**
```bash
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit
sudo install lazygit /usr/local/bin
```

**Windows:**
```bash
choco install lazygit
# or
scoop install lazygit
```

#### Quick Start
```bash
# Launch lazygit in your repository
lazygit

# Key bindings (in lazygit):
# ← → ↑ ↓   - Navigate between panels
# space     - Stage/unstage files
# c         - Commit
# P         - Push
# p         - Pull
# b         - View branches
# r         - Refresh
# ?         - Show help
```

#### Configuration
Create `~/.config/lazygit/config.yml`:
```yaml
gui:
  theme:
    activeBorderColor:
      - green
      - bold
    inactiveBorderColor:
      - white
  showFileTree: true
  scrollHeight: 2

git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never
```

**Learn more:** [lazygit](https://github.com/jesseduffield/lazygit)

---

### tig

**ncurses-based text-mode interface for Git** - A lightweight, keyboard-driven Git browser.

#### Features
- Browse commit history
- Diff viewer with syntax highlighting
- Blame view
- Tree view for repository browsing
- Keyboard-centric navigation
- Works great over SSH

#### Installation

**macOS:**
```bash
brew install tig
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tig
```

**Fedora:**
```bash
sudo dnf install tig
```

#### Quick Start
```bash
# Launch tig in your repository
tig

# Common commands:
tig                    # Show commit log
tig status             # Show git status (like lazygit)
tig blame file.txt     # Show blame for a file
tig show <commit>      # Show commit details
tig refs               # Show all refs (branches, tags)

# Key bindings (in tig):
# Enter     - Open selected item
# q         - Quit current view
# j/k       - Navigate up/down
# d         - Show diff
# t         - View tree
# /         - Search
```

#### Configuration
Create `~/.tigrc`:
```bash
# Vim-style navigation
bind generic g move-first-line
bind generic G move-last-line

# Easier diff viewing
bind diff <Up> previous
bind diff <Down> next

# Custom display
set line-graphics = utf-8
set show-changes = yes
set vertical-split = horizontal
```

**Learn more:** [tig](https://jonas.github.io/tig/)

---

### forgit

**A utility tool powered by fzf for using git interactively** - Git + fuzzy finder magic.

#### Features
- Interactive file staging with preview
- Fuzzy search through commit history
- Interactive checkout
- Interactive revert
- Interactive stash management
- Interactive diff viewing
- Works with any fzf-compatible tool

#### Installation

**macOS:**
```bash
brew install forgit
```

**Manual (all platforms):**
```bash
# Clone the repository
git clone https://github.com/wfxr/forgit.git ~/.forgit

# Add to your shell config (~/.bashrc or ~/.zshrc):
echo 'source ~/.forgit/forgit.plugin.sh' >> ~/.bashrc
# or for zsh:
echo 'source ~/.forgit/forgit.plugin.zsh' >> ~/.zshrc
```

#### Quick Start
```bash
# Interactive commands (after sourcing forgit):
ga         # Interactive git add (with preview)
glo        # Interactive git log
gd         # Interactive git diff
grh        # Interactive git reset HEAD
gcf        # Interactive git checkout <file>
gclean     # Interactive git clean
gss        # Interactive git stash show
```

#### Configuration
Set environment variables in your shell config:
```bash
# Use delta for better diffs
export FORGIT_DIFF_PAGER="delta --paging=never"

# Custom fzf options
export FORGIT_FZF_DEFAULT_OPTS="
--exact
--border
--cycle
--reverse
--height '80%'
"
```

**Learn more:** [forgit](https://github.com/wfxr/forgit)

---

### gitu

**A TUI Git client inspired by Magit** - Emacs Magit experience in the terminal.

#### Features
- Magit-style interface and keybindings
- Fast and responsive
- Section-based UI
- Smart commit workflows
- Branch management

#### Installation

**From source (Rust required):**
```bash
cargo install gitu
```

**Binary releases:**
Download from [GitHub Releases](https://github.com/altsem/gitu/releases)

#### Quick Start
```bash
# Launch gitu in your repository
gitu

# Key bindings (Magit-style):
# s         - Stage/unstage
# c c       - Commit
# P p       - Push
# F p       - Pull
# b b       - Switch branch
# l l       - Show log
# ?         - Show help
```

**Learn more:** [gitu](https://github.com/altsem/gitu)

---

### gitui

**Blazing fast terminal-ui for Git written in Rust** - Speed-focused Git TUI.

#### Features
- Extremely fast performance
- Syntax highlighting
- Async operations
- Keyboard-driven workflow
- Lightweight and responsive
- Vim-style keybindings

#### Installation

**macOS:**
```bash
brew install gitui
```

**Ubuntu/Debian:**
```bash
# Download latest release (check https://github.com/extrawurst/gitui/releases for newest version)
wget https://github.com/extrawurst/gitui/releases/download/v0.25.1/gitui-linux-x86_64.tar.gz
tar xf gitui-linux-x86_64.tar.gz
sudo mv gitui /usr/local/bin/
```

**Cargo (Rust):**
```bash
cargo install gitui
```

#### Quick Start
```bash
# Launch gitui in your repository
gitui

# Key bindings:
# 1-5       - Switch tabs (Status, Log, Stashing, Stashes, Files)
# j/k       - Navigate
# Space     - Stage/unstage
# c         - Commit
# Enter     - Open/expand
# w         - Push
# q         - Quit
```

#### Configuration
Create `~/.config/gitui/key_bindings.ron`:
```ron
(
    move_up: Some(( code: Char('k'), modifiers: ( bits: 0,),)),
    move_down: Some(( code: Char('j'), modifiers: ( bits: 0,),)),
    status_reset_item: Some(( code: Char('d'), modifiers: ( bits: 0,),)),
)
```

**Learn more:** [gitui](https://github.com/extrawurst/gitui)

---

## Git History Management

Tools for managing, rewriting, and cleaning up Git history.

### git-absorb

**`git commit --fixup`, but automatic** - Automatically identifies and creates fixup commits.

#### Features
- Automatically creates fixup commits
- Identifies which commit each change belongs to
- Works with `git rebase --autosquash`
- Saves time on cleanup commits

#### Installation

**macOS:**
```bash
brew install git-absorb
```

**Cargo (Rust):**
```bash
cargo install git-absorb
```

#### Usage
```bash
# Make changes to files
echo "fix typo" >> file.txt

# Instead of manually creating fixup commits:
git absorb

# The tool automatically creates fixup commits
# Then squash with:
git rebase -i --autosquash main
```

**Learn more:** [git-absorb](https://github.com/tummychow/git-absorb)

---

### git-filter-repo

**Quickly rewrite git repository history** - Modern replacement for `git filter-branch`.

#### Features
- 10-100x faster than filter-branch
- Safer with better error handling
- More powerful filtering options
- Remove sensitive data
- Restructure repositories
- Extract subdirectories

#### Installation

**macOS:**
```bash
brew install git-filter-repo
```

**pip:**
```bash
pip3 install git-filter-repo
```

#### Usage Examples
```bash
# Remove a file from entire history
git filter-repo --path sensitive-file.txt --invert-paths

# Extract a subdirectory as new repository
git filter-repo --path subdirectory/ --path-rename subdirectory/:

# Remove large files over 10MB
git filter-repo --strip-blobs-bigger-than 10M

# Change author information
git filter-repo --mailmap mailmap.txt
```

**⚠️ Warning:** Always backup before rewriting history!

**Learn more:** [git-filter-repo](https://github.com/newren/git-filter-repo)

---

### git-imerge

**Incremental merge for Git** - Break down large merges into smaller steps.

#### Features
- Incremental conflict resolution
- Test changes gradually
- Better visualization of merge progress
- Safer for large merges

#### Installation

**pip:**
```bash
pip3 install git-imerge
```

#### Usage
```bash
# Start an incremental merge
git imerge start --name=my-merge --first-parent main feature-branch

# Continue the merge incrementally
git imerge continue

# Finish when complete
git imerge finish
```

**Learn more:** [git-imerge](https://github.com/mhagger/git-imerge)

---

### mergiraf

**A syntax-aware git merge driver** - Smart merging for programming languages.

#### Features
- Syntax-aware conflict resolution
- Supports multiple languages (Python, Java, JavaScript, etc.)
- Reduces false conflicts
- Preserves code structure

#### Installation

**pip:**
```bash
pip3 install mergiraf
```

#### Configuration
```bash
# Add to .git/config or ~/.gitconfig:
git config merge.tool mergiraf
git config mergetool.mergiraf.cmd 'mergiraf merge --base "$BASE" --current "$LOCAL" --other "$REMOTE" -o "$MERGED"'
git config mergetool.mergiraf.trustExitCode true
```

**Learn more:** [mergiraf](https://github.com/mergiraf/mergiraf)

---

### git-branchless

**Branchless workflow for Git** - Alternative to traditional branch-based workflows.

#### Features
- Work without creating branches
- Undo/redo operations
- Visualize commit graph
- Smart rebasing
- Safer history editing

#### Installation

**macOS:**
```bash
brew install git-branchless
```

**Cargo (Rust):**
```bash
cargo install git-branchless
```

#### Setup
```bash
# Initialize in your repository
cd your-repo
git branchless init

# Create a commit without a branch
git commit -m "My changes"

# View commit graph
git smartlog

# Undo last operation
git undo

# Redo operation
git redo
```

**Learn more:** [git-branchless](https://github.com/arxanas/git-branchless)

---

## Shell Prompt Integrations

Show Git information directly in your shell prompt.

### Starship

**The minimal, blazing-fast, and infinitely customizable prompt** - Modern cross-shell prompt.

#### Features
- Shows Git status in prompt
- Multi-language support (shows Node/Python/Rust versions)
- Fast and lightweight
- Highly customizable
- Works with any shell (bash, zsh, fish, PowerShell)

#### Installation

**macOS/Linux:**
```bash
curl -sS https://starship.rs/install.sh | sh
```

**macOS (Homebrew):**
```bash
brew install starship
```

#### Setup

**Bash** (`~/.bashrc`):
```bash
eval "$(starship init bash)"
```

**Zsh** (`~/.zshrc`):
```bash
eval "$(starship init zsh)"
```

**Fish** (`~/.config/fish/config.fish`):
```bash
starship init fish | source
```

#### Configuration
Create `~/.config/starship.toml`:
```toml
[git_branch]
symbol = "🌱 "
truncation_length = 20

[git_status]
ahead = "⇡${count}"
diverged = "⇕⇡${ahead_count}⇣${behind_count}"
behind = "⇣${count}"
conflicted = "🏳"
deleted = "🗑"
modified = "📝"
staged = "✅"
untracked = "🤷"

[nodejs]
symbol = "⬢ "

[python]
symbol = "🐍 "
```

**Learn more:** [Starship](https://starship.rs/)

---

### git-prompt.sh

**Bash prompt that comes with Git** - Built-in Git prompt functionality.

#### Features
- Shows current branch
- Shows working tree status
- Lightweight (no external dependencies)
- Part of Git installation

#### Setup

**Bash** (`~/.bashrc`):
```bash
# Source git-prompt (usually installed with Git)
source /usr/share/git-core/contrib/completion/git-prompt.sh  # Linux
# or
source /Library/Developer/CommandLineTools/usr/share/git-core/git-prompt.sh  # macOS

# Configure options
export GIT_PS1_SHOWDIRTYSTATE=1        # * for unstaged, + for staged
export GIT_PS1_SHOWSTASHSTATE=1        # $ if something is stashed
export GIT_PS1_SHOWUNTRACKEDFILES=1    # % if untracked files
export GIT_PS1_SHOWUPSTREAM="auto"     # <, >, <>, = for behind, ahead, diverged, equal

# Add to prompt
export PS1='\u@\h:\w$(__git_ps1 " (%s)") \$ '
```

**Learn more:** [git-prompt.sh documentation](https://git-scm.com/book/en/v2/Appendix-A%3A-Git-in-Other-Environments-Git-in-Bash)

---

## Managing Large Files

Tools for handling large files in Git repositories.

### git-annex

**Manage files with Git, without checking the file contents into Git** - For large file storage.

#### Features
- Store large files outside Git repository
- Track file locations and metadata
- Sync files between repositories
- Partial checkouts
- Content-based deduplication

#### Installation

**macOS:**
```bash
brew install git-annex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git-annex
```

#### Usage
```bash
# Initialize in repository
git annex init "my repository"

# Add large files
git annex add large-file.zip

# Sync with remote
git annex sync

# Get specific files
git annex get large-file.zip

# Drop files to save space
git annex drop large-file.zip
```

**Learn more:** [git-annex](https://git-annex.branchable.com/)

---

### git-lfs

**Git Large File Storage** - Official Git extension for large files.

#### Features
- Transparent large file handling
- Hosted by GitHub, GitLab, Bitbucket
- Simple workflow
- Automatic file tracking
- Bandwidth-efficient transfers

#### Installation

**macOS:**
```bash
brew install git-lfs
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git-lfs
```

**Windows:**
```bash
choco install git-lfs
```

#### Setup
```bash
# Install Git LFS in your system
git lfs install

# Track file types
git lfs track "*.psd"
git lfs track "*.zip"
git lfs track "*.mp4"

# Commit .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS"

# Use Git normally - LFS handles large files automatically
git add large-file.psd
git commit -m "Add large Photoshop file"
git push
```

**Learn more:** [git-lfs](https://git-lfs.github.com/)

---

## Diff Tools

Enhanced diff viewing and comparison tools.

### delta

**A syntax highlighting pager for Git diffs** - Beautiful, feature-rich diff viewer.

#### Features
- Syntax highlighting
- Side-by-side diffs
- Line numbering
- Git integration
- File path highlighting
- Multiple themes

#### Installation

**macOS:**
```bash
brew install git-delta
```

**Ubuntu/Debian:**
```bash
# Download from releases
wget https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_amd64.deb
sudo dpkg -i git-delta_0.16.5_amd64.deb
```

**Cargo (Rust):**
```bash
cargo install git-delta
```

#### Configuration
Add to `~/.gitconfig`:
```ini
[core]
    pager = delta

[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true
    light = false
    side-by-side = true
    line-numbers = true
    syntax-theme = Dracula

[merge]
    conflictstyle = diff3

[diff]
    colorMoved = default
```

#### Usage
```bash
# Delta is automatically used for:
git diff
git show
git log -p
git blame

# Use side-by-side view
git diff --side-by-side  # or configure as default
```

**Learn more:** [delta](https://github.com/dandavison/delta)

---

### difftastic

**A structural diff that understands syntax** - Tree-sitter based diff tool.

#### Features
- Syntax-aware diffing
- Shows structural changes
- Multi-language support
- Better for refactoring
- Understands code movement

#### Installation

**macOS:**
```bash
brew install difftastic
```

**Cargo (Rust):**
```bash
cargo install difftastic
```

#### Configuration
Add to `~/.gitconfig`:
```ini
[diff]
    tool = difftastic

[difftool]
    prompt = false

[difftool "difftastic"]
    cmd = difft "$LOCAL" "$REMOTE"

[pager]
    difftool = true
```

#### Usage
```bash
# Use difftastic for diffs
git difftool

# Use with specific commits
git difftool main..feature

# Compare files
difft file1.js file2.js
```

**Learn more:** [difftastic](https://github.com/Wilfred/difftastic)

---

### diff-so-fancy

**Make diffs human readable** - Clean, colorful diffs.

#### Features
- Improved readability
- Clean header formatting
- Better word-level highlighting
- Minimal configuration needed

#### Installation

**npm:**
```bash
npm install -g diff-so-fancy
```

**macOS:**
```bash
brew install diff-so-fancy
```

#### Configuration
Add to `~/.gitconfig`:
```ini
[core]
    pager = diff-so-fancy | less --tabs=4 -RFX

[interactive]
    diffFilter = diff-so-fancy --patch

[color "diff-highlight"]
    oldNormal = red bold
    oldHighlight = red bold 52
    newNormal = green bold
    newHighlight = green bold 22

[color "diff"]
    meta = 11
    frag = magenta bold
    func = 146 bold
    commit = yellow bold
    old = red bold
    new = green bold
    whitespace = red reverse
```

**Learn more:** [diff-so-fancy](https://github.com/so-fancy/diff-so-fancy)

---

## Git Hook Managers

Manage Git hooks across your team and projects.

### pre-commit

**A framework for managing multi-language pre-commit hooks** - Industry standard for hooks.

#### Features
- Multi-language support
- Plugin ecosystem
- Automatic dependency management
- Fast execution
- Easy to configure

#### Installation

**pip:**
```bash
pip install pre-commit
```

**macOS:**
```bash
brew install pre-commit
```

#### Setup
Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      - id: mixed-line-ending

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
```

Install hooks:
```bash
pre-commit install
```

#### Usage
```bash
# Hooks run automatically on commit

# Run manually on all files
pre-commit run --all-files

# Run specific hook
pre-commit run eslint --all-files

# Update hooks to latest versions
pre-commit autoupdate
```

**Learn more:** [pre-commit](https://pre-commit.com/)

---

### lefthook

**Fast Git hooks manager written in Go** - Lightweight and fast alternative.

#### Features
- Written in Go (no Ruby dependency)
- Very fast execution
- Parallel hook execution
- Simple YAML configuration
- Cross-platform

#### Installation

**npm:**
```bash
npm install -g @arkweid/lefthook
```

**macOS:**
```bash
brew install lefthook
```

**Go:**
```bash
go install github.com/evilmartians/lefthook@latest
```

#### Setup
Create `lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{js,ts,jsx,tsx}"
      run: npm run lint {staged_files}
    format:
      glob: "*.{js,ts,jsx,tsx,json,md}"
      run: npm run format {staged_files}

pre-push:
  commands:
    test:
      run: npm test

commit-msg:
  commands:
    lint:
      run: npx commitlint --edit {1}
```

Install:
```bash
lefthook install
```

#### Usage
```bash
# Hooks run automatically

# Run all pre-commit hooks manually
lefthook run pre-commit

# Skip hooks for a commit
LEFTHOOK=0 git commit -m "Skip hooks"
```

**Learn more:** [lefthook](https://github.com/evilmartians/lefthook)

---

## Git Tool Collections

Collections of useful Git commands and utilities.

### git-extras

**Git repo summary, repl, changelog population, and more** - 60+ Git utilities.

#### Features
- Additional Git commands
- Repository statistics
- Changelog generation
- Release management
- Author/contributor info
- Many utility commands

#### Installation

**macOS:**
```bash
brew install git-extras
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git-extras
```

#### Popular Commands
```bash
# Repository summary
git summary

# Show contributions by author
git effort --above 5

# Delete merged branches
git delete-merged-branches

# Create changelog
git changelog

# Create release
git release 1.0.0

# Ignore file/pattern
git ignore "*.log"

# Count commits
git count --all

# Show Git aliases
git alias

# Undo last commit (keep changes)
git undo

# Interactive rebase helper
git rebase-patch

# Info about repository
git info
```

**Learn more:** [git-extras](https://github.com/tj/git-extras)

---

### git-toolbelt

**A suite of useful Git commands** - Daily Git workflow helpers.

#### Features
- Better branch management
- Improved status commands
- Navigation helpers
- Repository cleanup tools

#### Installation

**Manual:**
```bash
git clone https://github.com/nvie/git-toolbelt.git ~/.git-toolbelt
export PATH="$PATH:$HOME/.git-toolbelt"
```

#### Useful Commands
```bash
# Show current branch
git current-branch

# Show all branches (local + remote)
git branches

# Delete local branches that are gone on remote
git cleanup-branches

# Show modified files since last commit
git modified

# Push current branch
git push-current

# Pull current branch
git pull-current
```

**Learn more:** [git-toolbelt](https://github.com/nvie/git-toolbelt)

---

## Other Essential Git Tools

### mob.sh

**Fast git handover for remote pair/mob programming** - Seamless collaboration tool.

#### Features
- Quick handover between team members
- WIP branch management
- Timer for rotation
- Video call integration (Zoom, Teams)
- Works with any Git workflow

#### Installation

**macOS:**
```bash
brew install mob
```

**Manual:**
```bash
curl -sL install.mob.sh | sh
```

#### Usage
```bash
# Start mob programming session
mob start

# Make changes and commit locally
# ...work...

# Hand over to next person
mob next

# Continue from previous person
mob start

# Finish and create PR
mob done

# Use with timer (10 minute rotation)
mob start --timer 10
```

**Learn more:** [mob.sh](https://mob.sh/)

---

### git-secrets

**Prevents committing secrets and credentials** - Security tool for Git.

#### Features
- Scans commits for secrets
- Pre-commit and commit-msg hooks
- Pattern matching for common secrets
- AWS credential detection
- Custom pattern support

#### Installation

**macOS:**
```bash
brew install git-secrets
```

**Manual:**
```bash
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install
```

#### Setup
```bash
# Install hooks in repository
cd your-repo
git secrets --install

# Add AWS patterns
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api[_-]?key\s*=\s*.+'

# Scan repository
git secrets --scan

# Scan entire history
git secrets --scan-history
```

**Learn more:** [git-secrets](https://github.com/awslabs/git-secrets)

---

### Commitizen

**Create committing rules for projects** - Conventional commits made easy.

#### Features
- Standardized commit messages
- Interactive commit creation
- Automatic version bumping
- Changelog generation
- Team standards enforcement

#### Installation

**npm:**
```bash
npm install -g commitizen
npm install -g cz-conventional-changelog
```

#### Setup
In your repository:
```bash
# Initialize Commitizen
commitizen init cz-conventional-changelog --save-dev --save-exact

# Or add to package.json:
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

#### Usage
```bash
# Use instead of 'git commit'
git cz

# Or
npm run commit

# Interactive prompts guide you through:
# - Type (feat, fix, docs, style, refactor, test, chore)
# - Scope
# - Description
# - Breaking changes
# - Issues closed
```

#### Example Commit Messages
```
feat(api): add new endpoint for user profiles

fix(auth): resolve token expiration issue

docs(readme): update installation instructions

chore(deps): update dependencies to latest versions
```

**Learn more:** [Commitizen](https://github.com/commitizen/cz-cli)

---

### git-town

**Additional Git commands for workflows** - High-level Git workflow automation.

#### Features
- Branch lifecycle management
- Sync across branches
- Shipping features
- Repository navigation
- Undo operations

#### Installation

**macOS:**
```bash
brew install git-town
```

**Manual:**
```bash
# Download from releases (check https://github.com/git-town/git-town/releases for latest version)
wget https://github.com/git-town/git-town/releases/download/v9.0.1/git-town_9.0.1_linux_amd64.tar.gz
tar xf git-town_9.0.1_linux_amd64.tar.gz
sudo mv git-town /usr/local/bin/
```

#### Configuration
```bash
# Set main branch
git config git-town.main-branch main

# Set perennial branches (long-lived branches)
git config git-town.perennial-branches "main develop staging"
```

#### Usage
```bash
# Create and start working on a feature branch
git town hack feature-name

# Sync your branch with main
git town sync

# Ship (merge) your feature
git town ship

# Undo last git-town command
git town undo

# View repository map
git town repo

# Kill a feature branch
git town kill feature-name
```

**Learn more:** [git-town](https://www.git-town.com/)

---

## Recommended Setup

For this project, we recommend the following Git tools setup:

### Minimal Setup (Essential tools)

```bash
# 1. Install lazygit for visual Git operations
brew install lazygit  # or your package manager

# 2. Install delta for better diffs
brew install git-delta
# Add to ~/.gitconfig:
# [core]
#     pager = delta
# [interactive]
#     diffFilter = delta --color-only
# [delta]
#     navigate = true
#     side-by-side = true

# 3. Install pre-commit for hooks
pip install pre-commit
# Install hooks: pre-commit install
```

### Recommended Setup (Enhanced workflow)

```bash
# Add to minimal setup:

# 4. Install Starship for better prompts
brew install starship
# Add to ~/.bashrc or ~/.zshrc:
# eval "$(starship init bash)"  # or zsh

# 5. Install git-extras for utility commands
brew install git-extras

# 6. Install git-secrets for security
brew install git-secrets
cd your-repo
git secrets --install
git secrets --register-aws
```

### Advanced Setup (Full-featured)

```bash
# Add to recommended setup:

# 7. Install forgit for interactive fuzzy operations
brew install forgit

# 8. Install Commitizen for conventional commits
npm install -g commitizen cz-conventional-changelog

# 9. Install git-absorb for automatic fixups
brew install git-absorb

# 10. Install git-lfs if working with large files
brew install git-lfs
git lfs install
```

### Configuration Files

**Create `~/.gitconfig` with enhanced settings:**
```ini
[user]
    name = Your Name
    email = your.email@example.com

[core]
    pager = delta
    editor = vim

[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true
    side-by-side = true
    line-numbers = true
    syntax-theme = Dracula

[merge]
    conflictstyle = diff3
    tool = vimdiff

[diff]
    colorMoved = default

[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !lazygit
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

[pull]
    rebase = false

[init]
    defaultBranch = main
```

**Create `~/.config/starship.toml` for prompt:**
```toml
[git_branch]
symbol = "🌱 "

[git_status]
ahead = "⇡${count}"
diverged = "⇕⇡${ahead_count}⇣${behind_count}"
behind = "⇣${count}"
staged = '[++\($count\)](green)'  # \( \) is Starship's variable interpolation syntax

[nodejs]
symbol = "⬢ "
```

**Create `.pre-commit-config.yaml` in this repository:**
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      - id: mixed-line-ending
```

---

## Quick Reference

### Most Used TUI Commands

```bash
# Open lazygit for visual Git operations
lazygit

# Open tig for browsing commits
tig

# Interactive git add with preview (forgit)
ga

# Interactive git log (forgit)
glo

# Fast terminal UI for Git (gitui)
gitui
```

### Most Used CLI Commands

```bash
# Repository summary (git-extras)
git summary

# Delete merged branches (git-extras)
git delete-merged-branches

# Conventional commit (commitizen)
git cz

# Create automatic fixup commits (git-absorb)
git absorb
git rebase -i --autosquash main

# Scan for secrets (git-secrets)
git secrets --scan

# Mob programming handover (mob)
mob next
```

---

## Learn More

- [GIT_WORKFLOWS.md](./GIT_WORKFLOWS.md) - Git workflows and conflict resolution
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
- [README.md](./README.md) - Project overview

---

## Contributing

Have a favorite Git tool that's not listed here? Please submit a pull request or open an issue!

When suggesting a new tool, please include:
- Tool name and brief description
- Installation instructions for major platforms
- Basic usage examples
- Link to official documentation
- Why it's useful for this project

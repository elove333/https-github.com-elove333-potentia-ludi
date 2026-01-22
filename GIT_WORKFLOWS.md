# Git Workflows & Conflict Resolution Guide

Below are several practical, copy-pasteable workflows and real conflict-resolution examples for common Git operations. Each workflow includes the exact commands, what to watch for, and how to resolve conflicts when they occur.

## Contents

- [Workflow A — Take one bugfix commit from feature branch to main using git cherry-pick](#workflow-a--cherry-pick-a-single-bugfix-commit-from-feature--main)
- [Workflow B — Safely rewrite recent commits locally with git reset and push with force-with-lease](#workflow-b--safely-rewrite-recent-local-commits-and-update-remote)
- [Conflict example 1 — Resolving conflicts from git cherry-pick (step-by-step)](#conflict-example-1--resolving-conflicts-during-git-cherry-pick)
- [Conflict example 2 — Resolving conflicts from git stash apply / git stash pop (step-by-step)](#conflict-example-2--resolving-conflicts-from-git-stash-apply--git-stash-pop)
- [Quick tips & safety reminders](#quick-tips--safety-reminders)

---

## Workflow A — cherry-pick a single bugfix commit from feature -> main

**Goal**: Take a single bugfix commit (no merge of entire branch) from branch `feature` to `main`.

### 1) Locate the commit on the feature branch

```bash
git fetch origin
git switch feature
git log --oneline --graph --decorate
# Suppose the bugfix commit is: 9a3f7b2 Fix: handle nil user agent
```

### 2) Switch to the target branch and bring it up to date

```bash
git switch main
git fetch origin
git pull --ff-only origin main    # or `git pull --rebase` depending on your policy
```

### 3) Cherry-pick the commit

- **Simple pick** (creates a new commit on main with the same change)
  ```bash
  git cherry-pick 9a3f7b2
  ```

- **With provenance in the commit message** (recommended in teams)
  ```bash
  git cherry-pick -x 9a3f7b2
  # commit message will include: (cherry picked from commit 9a3f7b2)
  ```

- **If you want to apply the change but edit the commit before committing**
  ```bash
  git cherry-pick --no-commit 9a3f7b2
  # edit files or combine with other changes, then:
  git commit -m "Bugfix: handle nil user agent (adapted for main)"
  ```

### 4) If there are no conflicts, push

```bash
git push origin main
```

### 5) If there are conflicts, resolve

See [Conflict example 1](#conflict-example-1--resolving-conflicts-during-git-cherry-pick) below for full steps.

### Notes

- Cherry-pick makes a new commit (new SHA). Use `-x` to keep traceability.
- Prefer cherry-pick for a small number of isolated commits. For long chains, merging or rebasing may be clearer.

---

## Workflow B — safely rewrite recent local commits and update remote

**Goal examples**:
- Combine/squash N recent commits into one using `git reset --soft`
- Or drop last commits locally; push safely using `force-with-lease`

**Always take a backup branch if unsure.**

### 1) Create a backup branch (cheap insurance)

```bash
git switch your-branch
git branch back-up/your-branch-before-rewrite
# push backup if you want remote storage:
git push origin back-up/your-branch-before-rewrite
```

### 2) Combine (squash) the last 3 commits into a single commit

- Find how many commits: e.g. `HEAD~3` means last 3 commits

```bash
# Move HEAD back 3 commits but keep all changes staged (index)
git reset --soft HEAD~3

# All changes from the 3 commits are now staged; create a new single commit:
git commit -m "Combined: concise message for the three commits"
```

### 3) Push the rewritten branch to remote

- If branch was already pushed, you must force-push. Use `--force-with-lease` to avoid clobbering upstream changes that you didn't expect:

```bash
git fetch origin
git push --force-with-lease origin your-branch
```

### 4) Drop last N commits entirely (dangerous — they will be removed from current branch)

```bash
# Reset branch to the commit you want to keep (e.g., keep HEAD~2)
git reset --hard HEAD~2

# Push with lease to update remote
git push --force-with-lease origin your-branch
```

### Recovering after a bad reset

- If you reset and realize you lost commits, use reflog to find the old HEAD and restore:

```bash
git reflog
# find the SHA of the previous HEAD, e.g., abcdef1
git reset --hard abcdef1
```

### Notes & best practices

- Use a backup branch before destructive operations.
- Prefer interactive rebase (`git rebase -i`) when rewriting many commits — it's more flexible (but reset is quick for simple squashes).
- Use `--force-with-lease` instead of `--force` to reduce risk on shared branches.
- Coordinate with team members before rewriting public history.

---

## Conflict example 1 — resolving conflicts during git cherry-pick

**Simulated scenario**: You're on `main` and run `git cherry-pick 9a3f7b2` and Git reports a conflict.

### What you'll see

```bash
$ git cherry-pick 9a3f7b2
error: could not apply 9a3f7b2... Fix: handle nil user agent
hint: after resolving the conflicts, mark the corrected paths
hint: with 'git add <paths>' or 'git rm <paths>'
hint: and then run 'git cherry-pick --continue'
```

### 1) Inspect status

```bash
git status
# will show files with conflicts as "both modified"
git diff         # shows conflict markers inline
git diff --name-only --diff-filter=U  # list conflicted files
```

### 2) Open the conflicted file(s)

Example conflict markers inside file `request_handler.rb`:

```ruby
# file: request_handler.rb
def build_user_agent(req)
<<<<<<< HEAD
  # main branch implementation expects 'req.agent' sometimes
  agent = req.agent || "unknown/0.0"
=======
  # cherry-picked bugfix expects req.user_agent
  agent = req.user_agent || "unknown/0.0"
>>>>>>> 9a3f7b2... Fix: handle nil user agent
end
```

### 3) Resolve the conflict by editing the file to a correct unified implementation

```ruby
# After editing request_handler.rb:
def build_user_agent(req)
  # unified handling covering both cases (support both fields)
  agent = req.user_agent || req.agent || "unknown/0.0"
end
```

### 4) Stage the resolved file(s)

```bash
git add request_handler.rb
```

### 5) Continue the cherry-pick

```bash
git cherry-pick --continue
```

### 6) If you decide to abort the whole cherry-pick

```bash
git cherry-pick --abort
# returns you to the state before you ran cherry-pick
```

### 7) If you want to skip this commit and continue with a sequence

```bash
git cherry-pick --skip
```

### Tips during conflict resolution

- Use `git mergetool` if you have a GUI merge tool configured.
- Test the code after resolving before continuing if possible.
- Use `git show --pretty=fuller <commit>` on the source commit to see context and author info.

---

## Conflict example 2 — resolving conflicts from git stash apply / git stash pop

**Scenario**: You stashed changes, switched branches, made changes, then `git stash pop` or `git stash apply` causes conflicts.

### 1) Create a stash (example)

```bash
git add fileA.py             # optionally staged changes
git stash push -m "WIP: algo change"
# or include untracked: git stash push -u -m "WIP"
```

### 2) Later you run:

```bash
git stash pop
# or
git stash apply stash@{0}
```

If conflict occurs:

```bash
Auto-merging fileA.py
CONFLICT (content): Merge conflict in fileA.py
```

**Important behavior note**:
- `git stash apply`: leaves stash in stash list
- `git stash pop`: attempts apply then drop. If conflicts occur, stash will NOT be dropped automatically (so you can safely resolve or recover).

### 3) Inspect status and conflicts

```bash
git status
git diff
git stash list    # stash still present if pop had conflicts
git stash show -p stash@{0}   # view what the stash contains
```

### 4) Resolve the conflict

Example markers in `fileA.py`:

```python
# fileA.py before resolution:
def compute():
<<<<<<< Updated upstream
    return old_algo()
=======
    return improved_algo()
>>>>>>> Stashed changes
```

Decide correct lines, edit file to final desired version:

```python
def compute():
    # use improved algorithm but keep fallback
    return improved_algo() or old_algo()
```

### 5) Stage and complete

```bash
git add fileA.py
# If you used git stash apply you may want to drop the stash now:
git stash drop stash@{0}

# If you used git stash pop and stash still exists because of conflict:
git stash drop stash@{0}   # drop to avoid duplicate stash later
```

### 6) If problem is complicated and you want to abort stash application

- If stash apply produced conflicts, simply resolve manually OR
- If you want to revert to pre-apply status, and stash apply left you with messy working tree, you can reset:

```bash
git reset --hard   # WARNING: this will discard all working tree changes (only use if you want to lose them)
# Or restore specific files from HEAD:
git checkout -- fileA.py
```

### Tips

Use `git stash branch <name> stash@{0}` to create a branch from a stash and avoid conflicts with current branch state:

```bash
git stash branch wip-from-stash stash@{0}
# switches to new branch and applies stash, safer way to continue work
```

---

## Quick tips & safety reminders

- **Always inspect** `git status` and `git diff` when conflicts happen.
- **Prefer** `git cherry-pick -x` for traceability.
- **Before destructive history rewrites** (`git reset --hard`, `git push --force`), create a backup branch and use `--force-with-lease`.
- **If you're not comfortable** with `reset --hard`, use `git revert` for public history to safely undo commits.
- **Use** `git reflog` to recover lost HEADs after resets.
- **For repeated conflict resolution**, configure and learn a good merge tool (`git mergetool`) for faster visual merging.

---

## Additional Resources

If you want:
- Walk through a concrete repo example with real file contents and show the exact edits to resolve conflicts.
- A short cheat sheet with the minimum commands you should memorize for each workflow.

Feel free to refer back to this guide whenever you need to perform these Git operations!

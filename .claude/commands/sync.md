Pull the latest changes from remote, then stage all modified tracked files, commit with a clear message, and push to main.

Steps:
1. Run `git pull --rebase` to pull and rebase on any remote changes
2. Run `git status` to see what has changed
3. Stage and commit only relevant changed files (not .DS_Store or other junk)
4. Push to main with `git push`

If there is nothing to commit, just pull and confirm up to date.

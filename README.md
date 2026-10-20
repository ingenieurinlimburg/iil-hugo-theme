# iil-hugo-theme

Shared Hugo theme of the **Ingenieur in Limburg** course sites. It sits on top of the
[Relearn](https://github.com/McShelby/hugo-theme-relearn) theme, so every course gets the same look,
shortcodes and settings, and an update here reaches all courses.

Use this page when you:

1. [create a new site](#track-1-new-site), or
2. [convert an existing site](#track-2-existing-site-to-slim-down) that still carries its own copy of Relearn and its own `docs/` folder.

Then see [updating](#updating-and-releasing) and [troubleshooting](#troubleshooting).

## How it fits together

```text
course_xxx  ──imports──▶  iil-hugo-theme  ──imports──▶  hugo-theme-relearn
(content + identity)      (look, shortcodes, defaults)   (back bone)
```

| Lives in `iil-hugo-theme` (shared) | Lives in each course |
|---|---|
| `static/css/theme-iil.css` (colours, layout tweaks) | `content/` (the pages) |
| `layouts/shortcodes/*`, `layouts/partials/*` | `static/img/logo.png`, `static/img/favicon.png` and diagrams |
| `archetypes/`, `i18n/` | `hugo.toml`: `baseURL`, `title`, `canonifyURLs`, `locale`, theme import |
| Shared config: maths (`$ … $`), print output, logo layout | `go.mod`, `go.sum` (pin the versions) |
| The import of Relearn | `.github/workflows/hugo.yml`, `.gitignore`, `README.md` |

Anything a course puts in its own folder (for example a layout or a CSS file) overrides the theme.

Sites are **built and published on GitHub** (GitHub Actions to GitHub Pages). The generated site is
never committed.

### Requirements on your computer

- **Hugo extended**, version 0.166 or newer (Relearn needs it)
- **Go** (Hugo modules use it) and **Git**

### Requirements on GitHub

- The `iil-hugo-theme` repository must be **public** (the build runs without a login).
- In each course repository: *Settings, Pages, Build and deployment, Source* is set to **GitHub Actions**.

---

## Track 1: new site

1. **Create the repository** `course_xxx` in the `ingenieurinlimburg` organisation on GitHub (empty, no README), then:

   ```bash
   git clone git@github.com:ingenieurinlimburg/course_xxx.git
   cd course_xxx
   hugo new site . --force
   ```

2. **Replace `hugo.toml`** with:

   ```toml
   baseURL = 'https://ingenieurinlimburg.github.io/course_xxx/'
   title = 'Course XXX'
   canonifyURLs = true
   locale = 'en-us'

   [module]
     [[module.imports]]
       path = 'github.com/ingenieurinlimburg/iil-hugo-theme'
   ```

3. **Initialise the modules** (this creates `go.mod` and `go.sum`):

   ```bash
   hugo mod init github.com/ingenieurinlimburg/course_xxx
   hugo mod get github.com/ingenieurinlimburg/iil-hugo-theme@v0.1.0   # use the latest tag
   hugo mod tidy
   ```

4. **Add the logo and favicon** (your own files, so the theme defaults are overridden):

   ```text
   static/img/logo.png
   static/img/favicon.png
   ```

5. **Remove the files `hugo new site` created** that the theme now provides: `archetypes/`, `layouts/`, `i18n/`, `assets/`, `data/` and `themes/` (empty folders, and `archetypes/default.md` if it is the same as the theme's).

6. **Add the first page**, `content/_index.md`:

   ```markdown
   +++
   title = 'Course XXX'
   math = true
   +++

   ## Welcome
   ```

   Each page that contains formulas needs `math = true` in its front matter. Sub-pages use `weight = 1, 2, …` to set the menu order.

7. **Add `.gitignore`:**

   ```text
   public/
   resources/
   .hugo_build.lock
   ```

8. **Add the build and deploy workflow**, `.github/workflows/hugo.yml`:

   ```yaml
   # Builds the Hugo site on every push and pull request (as a check),
   # and deploys it to GitHub Pages when the change is on main.
   name: Build and deploy site

   on:
     push:
     pull_request:
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: pages
     cancel-in-progress: false

   defaults:
     run:
       shell: bash

   jobs:
     build:
       runs-on: ubuntu-latest
       env:
         HUGO_ENVIRONMENT: production
       steps:
         - name: Check out repository
           uses: actions/checkout@v4

         - name: Set up Go (Hugo modules need it)
           uses: actions/setup-go@v5
           with:
             go-version-file: go.mod

         - name: Install Hugo (extended)
           uses: peaceiris/actions-hugo@v3
           with:
             hugo-version: "0.167.0"   # Relearn needs >= 0.166
             extended: true

         - name: Configure GitHub Pages
           id: pages
           uses: actions/configure-pages@v5

         - name: Build the site
           run: hugo --minify --baseURL "${{ steps.pages.outputs.base_url }}/"

         - name: Upload the site
           uses: actions/upload-pages-artifact@v3
           with:
             path: public

     deploy:
       if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

   GitHub currently shows a harmless warning that some of these actions use Node.js 20. The build works.

9. **Preview locally:** `hugo server`, then open the address it prints (it includes `/course_xxx/`).

10. **Publish:**

    ```bash
    git add -A && git commit -m "first version" && git push
    ```

    Then set *Settings, Pages, Source* to **GitHub Actions** (once), and re-run the workflow if it failed at the Pages step. The `deploy` job only runs on `main`.

---

## Track 2: existing site to slim down

For a site that has its own `themes/hugo-theme-relearn` submodule, its own `layouts/`, and a `docs/` folder in the repository.

1. **Work on a branch and keep a baseline:**

   ```bash
   git switch -c slim-down
   hugo && cp -r docs /tmp/docs-before
   ls data assets i18n          # check what is in these folders before deleting
   ```

2. **Look for course-specific files first.** Compare `layouts/`, `static/css/`, `i18n/` and `archetypes/` with the ones in this theme. Anything that is *only* in the course (a special shortcode, extra CSS) stays in the course, or goes into the theme if all courses should have it.

3. **Remove the Relearn submodule properly:**

   ```bash
   git submodule deinit -f themes/hugo-theme-relearn
   git rm -f themes/hugo-theme-relearn
   rm -rf .git/modules/themes/hugo-theme-relearn
   git rm -f .gitmodules        # if it is still there
   ```

4. **Remove what the theme now provides** (after step 2):

   ```bash
   git rm -r layouts archetypes static/css
   rm -rf i18n assets data public resources .hugo_build.lock
   ```

5. **Shrink `hugo.toml`** to the course settings (see Track 1, step 2). Delete `theme = …`, `publishDir`, and the `[markup]`, `[outputs]` and `[params.logo]` blocks, because the theme sets them.

6. **Initialise the modules** (Track 1, step 3), and check the course still has its own `static/img/logo.png` and `favicon.png`.

7. **Add `.gitignore`** (Track 1, step 7) and the **workflow** (Track 1, step 8). Make sure `docs` is not ignored away silently: `docs/` is no longer in the repository.

8. **Check locally** with `hugo server`: menu, colours, maths, solutions, diagrams and the print view. Optionally build once more and compare with `/tmp/docs-before`: only the stylesheet file names should differ.

9. **Remove the generated site from git:**

   ```bash
   git rm -r docs
   ```

10. **Commit, push and wait for the build.** Set *Settings, Pages, Source* to **GitHub Actions**. The `build` job on the branch must be green (the `deploy` job is skipped there, which is expected).

11. **Merge:**

    ```bash
    git switch main && git merge --ff-only slim-down && git push
    ```

    The run on `main` deploys the site. Open it once and check it.

---

## Updating and releasing

**Take in a Relearn update.** In the theme repository:

```bash
hugo mod get -u            # updates Relearn
hugo server                # check with a course (see below)
git commit -am "Update Relearn"
git tag v0.1.1 && git push --follow-tags
```

**Change the theme** (colours, shortcodes, shared settings): edit, commit, then tag a new version as above.

**Receive it in a course:**

```bash
hugo mod get github.com/ingenieurinlimburg/iil-hugo-theme@v0.1.1   # or: hugo mod get -u

hugo mod tidy
hugo mod graph        # should list iil-hugo-theme v0.1.1 and Relearn

hugo server
git add go.mod go.sum && git commit -m "Update theme" && git push
```

A course only changes when you update it, so test a new version on one course first. If Go cannot find a brand-new tag yet, wait a few minutes (module proxy cache) or run the command with `GOPROXY=direct`.

To preview unreleased theme changes in a course without tagging, add a `replace` for the theme folder to the course's `go.mod` (`replace github.com/ingenieurinlimburg/iil-hugo-theme => ../iil-hugo-theme`) and remove it again before committing.

## Troubleshooting

| Message or symptom | Cause and fix |
|---|---|
| `Get Pages site failed … Not Found` (step *Configure GitHub Pages*) | Pages is not enabled. *Settings, Pages, Source*: **GitHub Actions**, then re-run the job. |
| `could not read Username for 'https://github.com'` when downloading modules | The theme repository is not public. Make it public. |
| Site builds but has the stock green Relearn look | The theme CSS did not load or was not updated. Check `hugo mod graph` lists the theme, then hard-refresh the browser. The colours need the repeated `:root` selector in `static/css/theme-iil.css`, because Relearn's own selector is more specific. |
| Formulas show as `$ … $` | Add `math = true` to the front matter of that page. |
| Hugo says the version is too old | Install Hugo extended 0.166 or newer, and keep the version in the workflow in step. |
| `hugo.toml` settings from the theme seem ignored | `baseURL`, `title`, `canonifyURLs`, `publishDir` and `locale` must be in the course. Only markup, outputs and params merge from the theme. |
| Warning "Node.js 20 is deprecated" in Actions | Harmless. Newer action versions remove it when you choose to update them. |

## Log

* **v0.1.1:** mov
    * move math to individual courses
* **v0.1.0:** first version. Kempen green theme, shortcodes (`column`, `multiHcolumn`, `include_file`, `code_caption`, `google`), shared maths, print and logo settings, Relearn as module import.

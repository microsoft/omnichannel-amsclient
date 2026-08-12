# Releasing @microsoft/omnichannel-amsclient

## How npm Publishing Works

This package uses **GitHub Actions OIDC trusted publishing** — no npm tokens or secrets are needed. The `npm-release.yml` workflow handles everything.

### Dev Versions (Automatic)

Every push to `main` automatically publishes a dev version to npm:

```
0.2.0-main.abc1234
      ^^^^^^^^^^^^
      branch + short commit SHA (via version-from-git)
```

- **npm dist-tag**: `latest`
- **Install**: Use the exact version from the workflow output, such as `npm install @microsoft/omnichannel-amsclient@0.2.0-main.abc1234`
- **Triggered by**: Any merge/push to the `main` branch

The workflow intentionally moves `latest` to each `main` prerelease. An unqualified install (`npm install @microsoft/omnichannel-amsclient`) can receive a prerelease. There is no `@main` dist-tag — the workflow does not create one.

### Official Releases (Release PR and Tag)

Use an approved semantic version. In the examples below, replace `0.2.1` and `81` with the new version and pull-request number.

```bash
VERSION=0.2.1
PR_NUMBER=81
```

1. **Create a release branch from current `upstream/main`.**

   ```bash
   git fetch upstream
   git checkout -b "release/v$VERSION" upstream/main
   ```

2. **Set the version in `package.json` and `package-lock.json`.**

   ```bash
   npm version "$VERSION" --no-git-tag-version
   ```

3. **Finalize `docs/CHANGELOG.md`.**

   Move all release entries below `## [$VERSION] - YYYY-MM-DD`. Keep a new `## [Unreleased]` section above that heading.

4. **Open a pull request.**

   Include `package.json`, `package-lock.json`, and `docs/CHANGELOG.md`. Merge the pull request only after all required checks pass.

   The merge to `main` publishes a `VERSION-main.SHA` prerelease with the npm `latest` dist-tag. This publish is expected.

5. **Get the pull-request merge commit.**

   ```bash
   MERGE_SHA=$(gh pr view "$PR_NUMBER" --repo microsoft/omnichannel-amsclient --json mergeCommit --jq '.mergeCommit.oid')
   test -n "$MERGE_SHA"
   ```

6. **Create an annotated tag on that merge commit.**

   ```bash
   git fetch upstream --tags
   git tag -a "v$VERSION" "$MERGE_SHA" -m "Release v$VERSION"
   git push upstream "v$VERSION"
   ```

   The tag must equal `v` plus the version in `package.json`. The workflow rejects mismatched tags and prerelease tags.

7. **Wait for the tag workflows.**

Do not use **Run workflow** for an official release. The pushed tag starts the npm and CDN workflows.

The npm workflow publishes the package with `--tag latest`. Then it creates GitHub Release `v$VERSION` with notes and the published npm tarball.

### GitHub Release Notes

The workflow removes `v` from the tag. For example, it converts `v0.2.1` to `0.2.1`.

It finds `## [0.2.1]` in `docs/CHANGELOG.md`. It copies that section until the next `## [` version heading.

The copied text becomes the GitHub Release body. If the matching section is empty or absent, GitHub generates notes from merged pull requests.

The workflow packs the package once. It publishes that `.tgz` file to npm and attaches the same file to the GitHub Release.

### CDN Release

The `CDN Release` workflow also starts from the `v*` tag. It uploads the versioned bundle and updates the Production `latest` bundle.

Before tag creation, make sure that the Production environment and Azure Storage secrets are available.

### Verifying a Publish

```bash
# Read the version selected by latest
npm view @microsoft/omnichannel-amsclient version

# Read all dist-tags
npm view @microsoft/omnichannel-amsclient dist-tags

# Check the official version
npm view "@microsoft/omnichannel-amsclient@$VERSION" version

# Check a specific dev version
npm view @microsoft/omnichannel-amsclient@0.2.0-main.abc1234 version

# Check the GitHub Release and its asset
gh release view "v$VERSION" --repo microsoft/omnichannel-amsclient

# Check the versioned CDN bundle
curl -I "https://comms.omnichannelengagementhub.com/ams/$VERSION/iframe.html"
```

### Tag Format

| Tag pattern | What publishes | npm dist-tag |
|-------------|---------------|--------------|
| `v*` (e.g. `v0.2.1`) | Release version from `package.json` | `latest` |
| Push to `main` | Dev version `X.Y.Z-main.<sha>` | `latest` |

### Hotfix Versions

For urgent fixes that need to ship against an older release (not `main`), use a hotfix branch:

1. **Create a hotfix branch** from the target commit:
   ```bash
   git checkout -b hotfix/<name> <base-commit-sha>
   ```

2. **Set the version** in `package.json` using prerelease format:
   ```
   "version": "0.1.12-hotfix.<name>.1"
   ```

3. **Apply the fix**.

4. **Commit and push** the hotfix branch to the upstream repo:
   ```bash
   git push upstream hotfix/<name>
   ```

5. The `npm-release.yml` workflow triggers on `hotfix/**` branches. On hotfix branches, `version-from-git` is **skipped** — the version in `package.json` is used as-is. The npm dist-tag is `hotfix` (not `latest`).

6. **Verify the publish**:
   ```bash
   npm view @microsoft/omnichannel-amsclient@0.1.12-hotfix.<name>.1
   ```

Do not create a `v*` tag for a hotfix prerelease. The workflow rejects prerelease tags to protect the `latest` dist-tag.

#### Hotfix Version Naming Convention

```
<base-version>-hotfix.<descriptor>.<iteration>
```

- `base-version`: The version the hotfix is based on (e.g., `0.1.12`)
- `descriptor`: Short kebab-case name for the fix (e.g., `enau`)
- `iteration`: Increment if multiple attempts are needed (start at `1`)

Example: `0.1.12-hotfix.enau.1`

### Important Notes

- **Published versions**: npm does not permit a second publish of the same version. Use a new version after npm accepts a bad publish.
- **Trusted publisher**: Configured on npmjs.com to trust `microsoft/omnichannel-amsclient` → `npm-release.yml`. No npm tokens needed.
- **Provenance**: All publishes include a signed provenance statement verifiable on npmjs.com.
- **Release notes**: A matching changelog section supplies the GitHub Release notes. GitHub generates notes when the section is absent.
- **Release asset**: Each GitHub Release contains the npm `.tgz` file from `npm pack`.

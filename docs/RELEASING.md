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

### Release Versions (Manual — Tag Push)

To publish release version `0.2.0`:

1. **Make sure that `package.json` and `package-lock.json` contain `0.2.0`.**

   These files already contain `0.2.0` for this release. If the files contain another version, run:

   ```bash
   npm version 0.2.0 --no-git-tag-version
   ```

2. **Update `docs/CHANGELOG.md`.**

   Move the release entries to `## [0.2.0] - YYYY-MM-DD`. Keep a new `## [Unreleased]` section above the release.

3. **Open a pull request** with the version and changelog changes. Merge it after all required checks pass.

4. **Update the local `main` branch**:
   ```bash
   git checkout main
   git pull --ff-only upstream main
   ```

5. **Create and push the release tag**:
   ```bash
   git tag v0.2.0
   git push upstream v0.2.0
   ```

   The tag must equal `v` plus the version in `package.json`.

6. **Wait for the `npm Release` workflow.**

The workflow makes sure that the tag matches the package version. Then it builds and publishes the package with `--tag latest`.

The workflow also adds a provenance attestation on npmjs.com. It creates GitHub Release `v0.2.0` with notes and the npm `.tgz` file.

### Verifying a Publish

```bash
# Read the version selected by latest
npm view @microsoft/omnichannel-amsclient version

# Read all dist-tags
npm view @microsoft/omnichannel-amsclient dist-tags

# Check the official version
npm view @microsoft/omnichannel-amsclient@0.2.0 version

# Check a specific dev version
npm view @microsoft/omnichannel-amsclient@0.2.0-main.abc1234 version

# Check the GitHub Release and its asset
gh release view v0.2.0 --repo microsoft/omnichannel-amsclient
```

### Tag Format

| Tag pattern | What publishes | npm dist-tag |
|-------------|---------------|--------------|
| `v*` (e.g. `v0.2.0`) | Release version from `package.json` | `latest` |
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

# Releases

## Release model

Releases follow the same draft-and-approve model as `parcelLab/typescript-plcommon`:

1. CI checks the changes pushed to `main`.
2. After the required CI result succeeds, Release Drafter prepares an unpublished GitHub release. Conventional Commit metadata and PR labels suggest the version and group the release notes.
3. A maintainer reviews the version, target commit, and notes, then selects **Publish release** in GitHub.
4. The **Publish package** workflow publishes `@parcellab/sift` to GitHub Packages with the `latest` dist-tag.

Pushing or merging code does not publish the package. Saving a draft does not publish it either. Only stable `vX.Y.Z` releases are supported; prereleases and beta channels are not enabled.

## Prepare and publish a release

1. Merge the changes through a pull request and wait for `ci_check_result` to succeed on `main`.
2. Check the package versions already available in GitHub Packages and the existing Git tags. Never select a version that has already been published, even if its GitHub release is still a draft.
3. Open **Releases** and review the draft. Alternatively, create a new release manually, choose a new `vX.Y.Z` tag, and target the tested commit on `main`. For the first release after this migration, choose a commit containing the new publishing workflow.
4. Check the suggested version, release notes, and target commit. The target must belong to the history of `main`. Do not mark the release as a prerelease.
5. Select **Publish release**. This must be a maintainer action; the draft workflow deliberately does not publish releases using its `GITHUB_TOKEN`.
6. Wait for **Publish package** to succeed. A published GitHub release alone does not mean that package publication succeeded. Confirm that the expected package version and `latest` dist-tag are available before updating consumers.

To override the draft's suggested version or changelog baseline, run the **Test** workflow manually on `main` with the optional `version` (without `v`) and `from` (previous tag) inputs. Neither input publishes anything. `from` changes the changelog baseline, not the version baseline. Explicit overrides should also be supplied on later manual runs if needed; an automatic draft update may recalculate the version.

## Existing releases and tagged drafts

The migration does not modify existing GitHub releases, tags, or package versions. Earlier automation could publish a package while leaving its GitHub release in draft state.

If a stable draft already refers to an existing Git tag, the draft job emits a warning and leaves all drafts unchanged. This prevents Release Drafter from repurposing an already-released version. Passing `version` or `from` does not bypass this protection.

You can still create and publish a separate, new release manually. Automatic draft updates remain paused while a tagged stable draft exists. Resuming them requires a separate maintainer decision about the historical draft after checking package publication and tag history; do not delete or republish it as an assumed migration step. Release Drafter uses published GitHub releases, not npm versions, as its version baseline, so reconcile that baseline before resuming automatic updates.

## Versioning and package contents

The release tag is the source of truth for the published version. CI checks out the release commit and updates `package.json` and `package-lock.json` only in its working directory. It does not create another tag, commit version changes, or push to `main`. The checked-in manifest version is not used to calculate the next release.

The package is published from the repository root, preserving the existing `index.js`, `lib/`, type declarations, and package file list. Keep `lib/` committed and up to date in pull requests because consumers that install from Git tags still need the built files.

Publication runs the existing `prepublishOnly` script, which runs `npm run build` and `npm test` before upload. `npm test` includes both `test:spec` and `test:types`. Run these same build and test scripts locally when preparing changes.

## Permissions and concurrency

- Draft updates need `contents: write` and `pull-requests: read`.
- Publication needs `contents: read` and `packages: write`.
- GitHub Packages authentication uses the workflow's `GITHUB_TOKEN` as `NODE_AUTH_TOKEN` for registry checks and publication. No new repository secret is required, provided the repository's Actions token has write access to the package.
- Draft updates and package publications each have their own concurrency group. A running publication is not canceled by a newer release event. Publish releases one at a time and wait for completion; concurrency is not a FIFO release queue.

## Failed or repeated publication

The workflow rejects malformed tags, prereleases, tag/commit mismatches, and commits outside `main`. It also checks package availability before publication: an already-published version fails explicitly, and registry errors other than a missing version stop the workflow rather than being treated as permission to publish.

If a run fails before upload, inspect the error and rerun the failed workflow once the cause is resolved. A source or workflow fix normally needs a new commit and a new release tag, because the existing release is pinned to its original commit.

If upload succeeded but a later step failed, first verify the package in GitHub Packages. A rerun cannot overwrite that version and will fail the availability check. Do not move an existing tag, delete a published package, or reuse its version to repair a release. Publish a new version for code fixes; consumers can temporarily pin a known-good version if rollback is needed.

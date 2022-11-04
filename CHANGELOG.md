# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
### Changed
- Update `AMSLogData` to include `AMSClientRuntimeId`, `DocumentId` & `ElapsedTimeInMilliseconds`

## [0.1.2] - 2022-09-23
### Fixed
- Update logic to use MIME types to decide whether image or document endpoint to be used

## [0.1.1] - 2022-08-31
### Fixed
- Add `webp` as valid image type on `AMSClient.getViewStatus()`

## [0.1.0] - 2021-10-01
### Added
- Prevent multiple iframes being loaded
- Add `dispose()` on `FramedClient`
- Use `amsEndpoint` property by default
- Add `silentError` option
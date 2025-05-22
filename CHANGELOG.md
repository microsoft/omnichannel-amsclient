# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Add ability for `FramedClient` to pass custom `baseUrl`
- Add `FramedClient` telemetry events `FramedClientSetup`, `FramedClientInitialize` &  `FramedClientLoadIframe`

### Changes

- Remove multiple calls to iframe load, and enhancement for iframe load logic.

## [0.1.8] - 2025-02-18

### Changed

- Update `IframeCommunicator`'s `targetOrigin` to post cross-origin messages

## [0.1.7] - 2025-01-30

### Added

- Add `image/heic` & `image/webp` as part of `supportedImagesMimeTypes`

### Changed

- Update `FramedClient`'s `targetOrigin` to post cross-origin messages

## [0.1.6] - 2023-11-17

### Added

- Added error handling for createObject and uploadDocument

## [0.1.5] - 2023-11-17

### Fixed

- Fix `FramedClient` not retrieving custom supported image MIME types

## [0.1.4] - 2023-02-09

### Added

- Update `AMSLogData` to include `MimeType` & `FileExtension`

## [0.1.3] - 2023-01-13

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

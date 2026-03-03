# Omnichannel AMSClient

[![npm version](https://badge.fury.io/js/%40microsoft%2Fomnichannel-amsclient.svg)](https://badge.fury.io/js/%40microsoft%2Fomnichannel-amsclient)
![Release CI](https://github.com/microsoft/omnichannel-amsclient/workflows/Release%20CI/badge.svg)

TypeScript client for Microsoft Azure Messaging Services (AMS) APIs. Handles file uploads and downloads in Omnichannel conversations. Compatible with Web (browser), Node.js, and React Native.

**Zero runtime dependencies.**

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Client Modes](#client-modes)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [File Upload Flow](#file-upload-flow)
- [File Download Flow](#file-download-flow)
- [Telemetry](#telemetry)
- [Development](#development)
- [Contributing](#contributing)

## Installation

```bash
npm install @microsoft/omnichannel-amsclient --save
```

### CDN

The CDN bundle exposes the SDK on the global namespace:

```ts
const { createAMSClient, FramedClient, FramedlessClient } = window.Microsoft.CRM.Omnichannel.AMS.SDK;
```

## Quick Start

```ts
import createAMSClient from '@microsoft/omnichannel-amsclient';

// Create client (browser — uses iframe isolation)
const client = await createAMSClient({
    framedMode: true,
    debug: false
});

// Initialize with chat token
await client.initialize({ chatToken });

// Upload a file
const objectResponse = await client.createObject(chatToken.chatId, file);
const fileMetadata = await client.uploadDocument(objectResponse.id, file);

// Download a file
const viewStatus = await client.getViewStatus(fileMetadata);
const blob = await client.getView(fileMetadata, viewStatus.view_location);
```

## Client Modes

The library provides two client implementations selected via the `framedMode` config flag:

### FramedClient (`framedMode: true`)

For **browser** environments. Loads a hidden iframe from a CDN blob that contains the `IframeCommunicator`. All AMS API calls execute inside the iframe for cross-origin isolation. Communication between the host page and iframe uses `postMessage`.

- Requires a CDN-hosted iframe bundle (configured via `baseUrl`)
- Supports multiple concurrent instances via `multiClient: true`
- Call `dispose()` to remove the iframe when done

### FramedlessClient (`framedMode: false`)

For **Node.js** and **React Native** environments. Calls AMS APIs directly via `fetch`. Logs a warning if used in a browser (use FramedClient instead for proper CORS handling).

## Configuration

```ts
interface AMSConfig {
    framedMode: boolean;      // true = FramedClient (browser), false = FramedlessClient (Node/RN)
    debug?: boolean;          // Enable console.log/console.time debug output (default: false)
    logger?: PluggableLogger; // Custom telemetry logger
    silentError?: boolean;    // Suppress console.error on failures (default: true)
    multiClient?: boolean;    // Allow multiple FramedClient iframe instances (default: false)
    baseUrl?: string;         // CDN base URL for iframe (FramedClient only)
}
```

## API Reference

Both `FramedClient` and `FramedlessClient` expose the same public API:

### `initialize(initConfig)`

Authenticates with AMS using the provided chat token.

```ts
await client.initialize({
    chatToken: {
        chatId: string;
        token: string;
        regionGTMS?: Record<string, string>;
        amsEndpoint?: string;
        // ...other fields
    }
});
```

### `createObject(chatId, file, chatToken?, supportedImagesMimeTypes?)`

Creates an AMS object for the file. Returns `{ id: string }` (the document ID).

- `chatId` — Conversation ID
- `file` — `File` object
- `chatToken` — Optional override (uses token from `initialize()` by default)
- `supportedImagesMimeTypes` — Optional custom list of image MIME types

### `uploadDocument(documentId, file, chatToken?, supportedImagesMimeTypes?)`

Uploads file content to the AMS object. Returns `FileMetadata`.

- `documentId` — ID from `createObject()` response
- `file` — `File` or `AMSFileInfo` (with `data: ArrayBuffer` for non-browser)

### `getViewStatus(fileMetadata, chatToken?, supportedImagesMimeTypes?)`

Checks the processing status of an uploaded file. Returns `AMSViewStatusResponse` including `view_location`, `content_state`, and `view_state`.

### `getView(fileMetadata, viewLocation, chatToken?, supportedImagesMimeTypes?)`

Downloads the file content. Returns a `Blob`.

- `viewLocation` — URL from `getViewStatus()` response

### `fetchBlob(contentUrl)`

Direct blob download helper. Fetches any URL and returns the response as a `Blob`.

### `dispose()` (FramedClient only)

Removes the iframe element and cleans up internal state. Call when the client is no longer needed.

### Supported Image MIME Types

By default, the following types are treated as images (affecting which AMS API path is used):

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/heic`
- `image/webp`

Override by passing `supportedImagesMimeTypes` to any API method.

## File Upload Flow

```
1. createObject(chatId, file)     → { id: documentId }
2. uploadDocument(documentId, file) → FileMetadata { name, size, type, id, url }
```

Images use the `pish/image` → `imgpsh` API path. Documents use `sharing/file` → `original`.

## File Download Flow

```
1. getViewStatus(fileMetadata)                    → { view_location, content_state, view_state }
2. getView(fileMetadata, response.view_location)  → Blob
```

The `content_state` must not be `expired`. The `view_state` should be `ready`.

## Telemetry

Integrate custom telemetry by providing a `PluggableLogger`:

```ts
interface PluggableLogger {
    logClientSdkTelemetryEvent(logLevel: LogLevel, event: AMSLogData): void;
}
```

The client uses a `ScenarioMarker` internally that emits `Started`, `Completed`, and `Failed` events with elapsed time tracking for each API operation.

`LogLevel` values: `INFO`, `DEBUG`, `WARN`, `ERROR`, `LOG`.

## Development

### Prerequisites

- Node.js 22.x
- npm

### Build

```bash
npm install
npm run build:tsc          # Compile TypeScript → lib/
```

### Build CDN Package

```bash
npm run build:tsc
BASE_URL=https://[blob-url] SDK_VERSION=[version] node ./esbuild.config.js
```

This produces `dist/SDK.js`, `dist/SDK.min.js`, `dist/iframe.js`, `dist/iframe.min.js`, and `dist/iframe.html`.

### Test

```bash
npm test                   # Jest unit tests
npm run lint               # ESLint
```

### CI

- **Pull Request**: Build + test + lint (GitHub Actions, Node 22)
- **Release**: Build CDN + npm package, upload to Azure Blob Storage, publish to npm registry
- **Azure Pipelines**: Component Governance scan

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

See also: [Code of Conduct](docs/CODE_OF_CONDUCT.md) | [Security](docs/SECURITY.md) | [Support](docs/SUPPORT.md) | [Changelog](docs/CHANGELOG.md)

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

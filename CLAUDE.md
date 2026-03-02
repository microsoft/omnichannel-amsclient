# omnichannel-amsclient — Claude Code Instructions

## Quick Context

- **Package**: `@microsoft/omnichannel-amsclient` v0.1.12
- **Purpose**: File upload/download client for Omnichannel conversations via Azure Messaging Services (AMS)
- **Tech**: TypeScript, esbuild (CDN), TSC (npm), Jest, ESLint
- **Zero runtime dependencies**
- **Consumers**: omnichannel-chat-sdk (primary), chat-widget (via SDK), ConversationControl (agent UI)

## Architecture

Two-mode client selected by `framedMode` config flag:

```
createAMSClient(config)
  ├── framedMode: true  → FramedClient   (browser — iframe isolation + postMessage)
  └── framedMode: false → FramedlessClient (Node.js / React Native — direct fetch)
```

**FramedClient** loads a hidden iframe (`{baseUrl}/{version}/iframe.html`) containing `IframeCommunicator`. All AMS API calls execute inside the iframe. Host ↔ iframe communication via `postMessage` with request/response pattern and UUID-based request correlation.

**FramedlessClient** calls `API.ts` functions directly via `fetch`.

**API layer** (`API.ts`): Five functions — `skypeTokenAuth`, `createObject`, `uploadDocument`, `getViewStatus`, `getView`. Auth via `skype_token` header. AMS endpoint from `chatToken.amsEndpoint || chatToken.regionGTMS?.ams`.

## Source File Map

```
src/
├── index.ts                    # Entry — exports createAMSClient, sets CDN global
├── createAMSClient.ts          # Factory — returns FramedClient or FramedlessClient
├── API.ts                      # AMS REST calls (skypeTokenAuth, CRUD operations)
├── FramedClient.ts             # Browser client (iframe + postMessage, 400 lines)
├── FramedlessClient.ts         # Node/RN client (direct fetch, 270 lines)
├── IframeCommunicator.ts       # Runs inside iframe, bridges postMessage ↔ API (317 lines)
├── AMSError.ts                 # Error class (extends Error + requestUrl + originalError)
├── AMSLogger.ts                # Logger wrapper (delegates to PluggableLogger)
├── GlobalConfiguration.ts      # Static config (silentError, debug)
├── config.ts                   # Build-time config (baseUrl, sdkVersion — overwritten by esbuild)
├── telemetry/
│   ├── ScenarioMarker.ts       # Start/complete/fail tracking with elapsed time
│   ├── EventMarker.ts          # Event name suffixing (Started/Completed/Failed)
│   └── StopWatch.ts            # Simple elapsed time measurement
├── utils/
│   ├── platform.ts             # isBrowser/isNode/isReactNative detection
│   ├── uuid.ts                 # UUID v4 generator (Math.random based)
│   ├── extractFileExtension.ts # path.extname() equivalent (no path module dependency)
│   ├── fetchClientId.ts        # Read clientId from iframe URL params
│   ├── fetchDebugConfig.ts     # Read debug flag from iframe URL params
│   └── fetchTelemetryConfig.ts # Read telemetry flag from iframe URL params
└── [type files]                # Interfaces/enums (see below)
```

### Type Files

| File | Type | Key Fields |
|------|------|------------|
| `OmnichannelChatToken.ts` | interface | chatId, token, regionGTMS, amsEndpoint |
| `FileMetadata.ts` | interface | id, type, name?, size?, url? |
| `AMSCreateObjectResponse.ts` | interface | id |
| `AMSUploadDocumentResponse.ts` | interface | id, name, size, type, url, fileSharingProtocolType |
| `AMSViewStatusResponse.ts` | interface | view_location, content_state, view_state, view_length |
| `AMSFileInfo.ts` | interface | name, type, size, data (ArrayBuffer) |
| `AMSLogData.ts` | interface | AMSClientRuntimeId, ChatId, Event, AMSClientVersion |
| `PluggableLogger.ts` | interface | logClientSdkTelemetryEvent(logLevel, event) |
| `InitConfig.ts` | interface | chatToken |
| `FramedClientConfig.ts` | interface | multiClient?, baseUrl? |
| `PostMessageRequestData.ts` | interface | requestId?, file?, chatToken?, documentId?, fileMetadata? |
| `LogLevel.ts` | enum | INFO, DEBUG, WARN, ERROR, LOG |
| `PostMessageEventName.ts` | enum | IframeLoaded, SkypeTokenAuth, CreateObject, UploadDocument, GetViewStatus, GetView, SendTelemetry |
| `PostMessageEventType.ts` | enum | None, Request, Response |
| `PostMessageEventStatus.ts` | enum | None, Success, Failure |
| `FramedClientEventName.ts` | enum | Setup, Initialize, LoadIframe |

## Build & Test

```bash
npm install
npm run build:tsc              # TSC → lib/ (CJS output, type declarations)
npm test                       # Jest (ts-jest, node environment)
npm run lint                   # ESLint with @typescript-eslint
```

**CDN build** (requires env vars):
```bash
npm run build:tsc
BASE_URL=https://[blob-url] SDK_VERSION=[version] node ./esbuild.config.js
# Outputs: dist/SDK.js, dist/SDK.min.js, dist/iframe.js, dist/iframe.min.js, dist/iframe.html
```

**CI**: GitHub Actions — PR (build:tsc + test + lint on Node 22), Release (CDN upload to Azure Blob Storage + npm publish). Azure Pipelines for Component Governance scan.

## Key Patterns

### Auth
Skype token auth: `Authorization: skype_token {token}` header on all AMS requests. Authenticated via `POST /v1/skypetokenauth`.

### AMS Endpoint Resolution
```
chatToken.amsEndpoint || chatToken.regionGTMS?.ams
```
Fallback: `https://us-api.asm.skype.com` (hardcoded in `patchChatToken()`).

### Image vs Document API Paths
MIME type determines the AMS API path:
- **Image** (jpeg/png/gif/heic/webp): `pish/image` for create, `imgpsh` for upload, `imgpsh_fullsize_anim` for view
- **Document** (everything else): `sharing/file` for create, `original` for upload/view

### Telemetry
`ScenarioMarker` emits three events per operation:
- `{Operation}Started` — on entry
- `{Operation}Completed` — on success (with ElapsedTimeInMilliseconds)
- `{Operation}Failed` — on error (with ExceptionDetails)

Telemetry flows through `AMSLogger` → `PluggableLogger.logClientSdkTelemetryEvent()`. In framed mode, telemetry is forwarded from iframe to parent via `SendTelemetry` postMessage events.

### Error Handling
`AMSError` extends `Error` with `requestUrl` and `originalError`. API methods throw AMSError with descriptive messages. `GlobalConfiguration.silentError` controls whether errors are logged to console.

### FramedClient Iframe Lifecycle
```
NotLoaded → Loading → Loaded
                    → Failed
```
Iframe is loaded once, reused across operations. `dispose()` removes the iframe and resets state to `NotLoaded`.

## Known Quirks

1. **`config.ts`** — `baseUrl` and `sdkVersion` are placeholder values overwritten at CDN build time by `esbuild.config.js` (which writes to `lib/config.js`).
2. **`patchChatToken()`** in API.ts mutates the chatToken object in-place on every API call.
3. **`typeof window === undefined`** in `index.ts` — missing quotes (should be `=== 'undefined'`). The IIFE always executes.
4. **`silentError` default** — `config.silentError || true` in createAMSClient always evaluates to `true`.
5. **IframeCommunicator `postMessage('*')`** — uses wildcard origin for messages to parent window.
6. **Dead code** — Commented-out `uploadFile()` and `downloadFile()` in FramedlessClient.

## Documentation

- `README.md` — Usage guide, API reference, development setup
- `CLAUDE.md` — This file (developer reference for Claude Code)
- `docs/CHANGELOG.md` — Release history
- `docs/CODE_OF_CONDUCT.md` — Microsoft Open Source Code of Conduct
- `docs/SECURITY.md` — Security vulnerability reporting
- `docs/SUPPORT.md` — Support information

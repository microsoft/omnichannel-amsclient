# omnichannel-amsclient - Claude Code Instructions

## Repository Ecosystem

**This workspace may contain up to 6 related repositories.** Not all teams have all repos. Always be aware of which repository you're in when making changes.

| Repository | Type | Purpose | Typical Location |
|------------|------|---------|------------------|
| **CRM.Omnichannel** | Monorepo (Backend) | 20+ microservices for Omnichannel platform | `<workspace-root>/CRM.Omnichannel/` |
| **ConversationControl** | Frontend (Agent UI) | Agent experience and conversation management UI | `<workspace-root>/CRM.OmniChannel.ConversationControl/` |
| **LiveChatWidget** | Frontend (Customer) | Customer-facing chat widget | `<workspace-root>/CRM.OmniChannel.LiveChatWidget/` |
| **omnichannel-chat-sdk** | Public SDK | TypeScript SDK for chat integration | `<workspace-root>/omnichannel-chat-sdk/` |
| **omnichannel-chat-widget** | Public Components | React component library | `<workspace-root>/omnichannel-chat-widget/` |
| **omnichannel-amsclient** | Shared Library | File upload/download client | `<workspace-root>/omnichannel-amsclient/` |

---

## Quick Context
- **Purpose:** Attachment Management Service (AMS) client for file uploads/downloads in conversations
- **Type:** TypeScript Library (npm package)
- **Tech Stack:** TypeScript, esbuild, Jest
- **Distribution:** npm registry (@microsoft/omnichannel-amsclient)
- **Consumers:** CRM.OmniChannel.ConversationControl (agent file sharing), CRM.OmniChannel.LiveChatWidget (customer file uploads)

## Architecture Overview

**What is omnichannel-amsclient?**

This is a lightweight TypeScript client for uploading and downloading files in Omnichannel conversations. It abstracts the AMS backend APIs and handles file validation, Azure Blob Storage integration, and SAS token management.

**Key Features:**
- File upload with validation (size, type, malware scanning)
- File download with SAS token authentication
- Progress tracking for uploads/downloads
- TypeScript type definitions
- Error handling with proper error codes

**Integration:**
- **Backend:** AMS APIs in MessagingRuntime (`/api/ams/v1/files/*`)
- **Azure Blob Storage:** Files stored encrypted in Blob Storage
- **Consumers:** ConversationControl (agent), LiveChatWidget (customer)

---

## Build & Test Workflow

### Prerequisites
- Node.js (version in package.json engines)
- npm package manager

### Setup
```bash
cd omnichannel-amsclient

# Install dependencies
npm install
```

### Common Commands

**Build:**
- **Build library:** `npm run build` - esbuild compilation (ESM, CJS)
- **Watch mode:** `npm run watch` - Incremental development
- **Type check:** `npm run typecheck` - TypeScript validation

**Test:**
- **Unit tests:** `npm test` - Jest tests
- **Coverage:** `npm run coverage` - Test coverage report
- **Lint:** `npm run lint` - ESLint validation

**Release:**
- **Publish:** `npm publish` - Publish to npm registry
- **Version bump:** `npm version <major|minor|patch>` - Semantic versioning

---

## Coding Standards

### TypeScript Best Practices

- **Avoid `any` type** - Use proper type definitions
- **Explicit return types** - Always declare function return types
- **Async/await preferred** - Over .then() chains
- **Error handling** - Use proper error classes with error codes

**File Upload Example:**
```typescript
// ✅ CORRECT - Explicit types, async/await, error handling
export interface UploadFileOptions {
    conversationId: string;
    file: File | Blob;
    fileName: string;
    onProgress?: (progress: number) => void;
}

export interface UploadFileResult {
    fileId: string;
    blobUrl: string;
    sasToken: string;
    expiresAt: Date;
}

export async function uploadFile(
    options: UploadFileOptions
): Promise<UploadFileResult> {
    const { conversationId, file, fileName, onProgress } = options;

    // Validate inputs
    if (!conversationId) {
        throw new AMSClientError({
            message: 'conversationId is required',
            errorCode: 'INVALID_INPUT'
        });
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new AMSClientError({
            message: `File size exceeds maximum (${MAX_FILE_SIZE} bytes)`,
            errorCode: 'FILE_TOO_LARGE'
        });
    }

    try {
        // Request upload URL from AMS backend
        const uploadUrlResponse = await fetch('/api/ams/v1/files/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, fileName, fileSize: file.size })
        });

        if (!uploadUrlResponse.ok) {
            throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, fileId } = await uploadUrlResponse.json();

        // Upload to Azure Blob Storage
        await uploadToBlob(uploadUrl, file, onProgress);

        // Confirm upload with backend
        const confirmResponse = await fetch(`/api/ams/v1/files/${fileId}/confirm`, {
            method: 'POST'
        });

        if (!confirmResponse.ok) {
            throw new Error('Failed to confirm upload');
        }

        const result = await confirmResponse.json();
        return {
            fileId: result.fileId,
            blobUrl: result.blobUrl,
            sasToken: result.sasToken,
            expiresAt: new Date(result.expiresAt)
        };
    } catch (error) {
        throw new AMSClientError({
            message: 'File upload failed',
            errorCode: 'UPLOAD_FAILED',
            innerError: error as Error
        });
    }
}

// Helper function for blob upload
async function uploadToBlob(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.open('PUT', url);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        xhr.send(file);
    });
}
```

**File Download Example:**
```typescript
export interface DownloadFileOptions {
    fileId: string;
    conversationId: string;
    onProgress?: (progress: number) => void;
}

export async function downloadFile(
    options: DownloadFileOptions
): Promise<Blob> {
    const { fileId, conversationId, onProgress } = options;

    // Get download URL with SAS token from backend
    const response = await fetch(`/api/ams/v1/files/${fileId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
    });

    if (!response.ok) {
        throw new AMSClientError({
            message: 'Failed to get download URL',
            errorCode: 'DOWNLOAD_FAILED'
        });
    }

    const { downloadUrl } = await response.json();

    // Download from Azure Blob Storage
    return downloadFromBlob(downloadUrl, onProgress);
}
```

---

## Error Handling

**Use proper error classes with error codes:**

```typescript
export interface AMSClientErrorDetails {
    message: string;
    errorCode: string;
    innerError?: Error;
    context?: Record<string, unknown>;
}

export class AMSClientError extends Error {
    public readonly errorCode: string;
    public readonly innerError?: Error;
    public readonly context?: Record<string, unknown>;

    constructor(details: AMSClientErrorDetails) {
        super(details.message);
        this.name = 'AMSClientError';
        this.errorCode = details.errorCode;
        this.innerError = details.innerError;
        this.context = details.context;
    }
}

// Common error codes
export const AMSErrorCodes = {
    INVALID_INPUT: 'INVALID_INPUT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
    MALWARE_DETECTED: 'MALWARE_DETECTED',
    SAS_TOKEN_EXPIRED: 'SAS_TOKEN_EXPIRED'
} as const;
```

---

## File Validation

**Validate files before upload:**

```typescript
export interface FileValidationConfig {
    maxFileSize: number; // bytes
    allowedFileTypes: string[]; // MIME types
}

export const DEFAULT_FILE_VALIDATION: FileValidationConfig = {
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
};

export function validateFile(
    file: File,
    config: FileValidationConfig = DEFAULT_FILE_VALIDATION
): void {
    // Check file size
    if (file.size > config.maxFileSize) {
        throw new AMSClientError({
            message: `File size (${file.size} bytes) exceeds maximum (${config.maxFileSize} bytes)`,
            errorCode: AMSErrorCodes.FILE_TOO_LARGE,
            context: { fileName: file.name, fileSize: file.size }
        });
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
        throw new AMSClientError({
            message: `File type ${file.type} is not allowed`,
            errorCode: AMSErrorCodes.UNSUPPORTED_FILE_TYPE,
            context: { fileName: file.name, fileType: file.type }
        });
    }
}
```

---

## Testing Strategy

**Unit Tests (Jest):**
- **Location:** `__tests__/` directory
- **Run:** `npm test`
- **Coverage target:** >80% for business logic

**Test Best Practices:**
```typescript
import { uploadFile, AMSClientError, AMSErrorCodes } from '../src';

describe('uploadFile', () => {
    it('should upload file successfully', async () => {
        const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        const options = {
            conversationId: 'conv-123',
            file: mockFile,
            fileName: 'test.txt'
        };

        // Mock fetch responses
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ uploadUrl: 'https://blob.url', fileId: 'file-123' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ fileId: 'file-123', blobUrl: 'https://blob.url', sasToken: 'token', expiresAt: new Date() }) });

        const result = await uploadFile(options);

        expect(result.fileId).toBe('file-123');
        expect(result.blobUrl).toBe('https://blob.url');
    });

    it('should throw error for file too large', async () => {
        const largeFile = new File(['x'.repeat(30 * 1024 * 1024)], 'large.txt');
        const options = {
            conversationId: 'conv-123',
            file: largeFile,
            fileName: 'large.txt'
        };

        await expect(uploadFile(options)).rejects.toThrow(AMSClientError);
        await expect(uploadFile(options)).rejects.toMatchObject({
            errorCode: AMSErrorCodes.FILE_TOO_LARGE
        });
    });

    it('should track upload progress', async () => {
        const mockFile = new File(['content'], 'test.txt');
        const onProgress = jest.fn();
        const options = {
            conversationId: 'conv-123',
            file: mockFile,
            fileName: 'test.txt',
            onProgress
        };

        // Mock implementation...

        await uploadFile(options);

        expect(onProgress).toHaveBeenCalled();
        expect(onProgress).toHaveBeenCalledWith(expect.any(Number));
    });
});
```

---

## Integration with Other Repos

**This client integrates with:**
- **CRM.Omnichannel (Backend):** AMS APIs in MessagingRuntime
- **Azure Blob Storage:** Direct upload/download to blob storage

**Consumed by:**
- **CRM.OmniChannel.ConversationControl** (npm dependency) - Agent file sharing
- **CRM.OmniChannel.LiveChatWidget** (npm dependency) - Customer file uploads

**When changing client APIs:**
- This is a **shared library** - changes affect both ConversationControl and LiveChatWidget
- Use semantic versioning: major version for breaking changes
- Coordinate with both frontend teams
- Update CHANGELOG.md with migration guide

---

## Security Considerations

**File Upload Security:**
- **Size limits:** Enforce maximum file size (default 25MB)
- **Type validation:** Only allow approved MIME types
- **Malware scanning:** Backend scans files with Azure Defender
- **SAS tokens:** Time-limited (1 hour expiration)

**File Download Security:**
- **Authorization:** Backend validates user can access file
- **SAS tokens:** Generate fresh token per download request
- **HTTPS only:** Never use HTTP for file transfers

---

## Pull Request Guidelines

1. **Code standards:** Follow TypeScript best practices
2. **Commit messages:** Conventional commit format (feat:, fix:, chore:, etc.)
3. **Testing:** All tests must pass, add tests for new functionality
4. **Error handling:** Use AMSClientError with proper error codes
5. **Documentation:** Update README.md if APIs change
6. **CHANGELOG:** Update CHANGELOG.md under [Unreleased] section

---

## Common Issues & Troubleshooting

**Upload Failures:**
- Check file size limits (default 25MB)
- Verify file type is in allowed list
- Check network connectivity to Azure Blob Storage
- Verify SAS token not expired

**Download Failures:**
- Check authorization (user has access to conversation)
- Verify SAS token not expired (1 hour limit)
- Check file exists in blob storage

**Build Issues:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version`
- Verify esbuild installed correctly

---

## Documentation

- **[README.md](README.md)** - Client usage, API reference, examples
- **[CHANGELOG.md](CHANGELOG.md)** - Release history
- **[SECURITY.md](SECURITY.md)** - Security policies

---

**Summary:** Lightweight file upload/download client for Omnichannel conversations. Focus on proper validation, error handling, and security (SAS tokens, malware scanning). Coordinate API changes with both ConversationControl and LiveChatWidget teams.

import { AMSError } from "./AMSError";
import sanitizeRequestPath from "./utils/sanitizeRequestPath";

/**
 * Error thrown by FramedClient and FramedlessClient operations.
 * `message` is the operation name (for example 'createObject') to stay compatible with earlier versions.
 * `status` is the HTTP status code returned by AMS, when one was received.
 * `requestUrl` has object ids, query strings and fragments removed so it is safe to log.
 */
export interface AMSOperationError extends Error {
    status?: number;
    requestUrl?: string;
}

export interface AMSOperationErrorDetails {
    message?: string;
    status?: number;
    requestUrl?: string;
}

export const extractErrorDetails = (error: unknown): AMSOperationErrorDetails => {
    const details: AMSOperationErrorDetails = {
        message: error instanceof Error ? error.message : String(error)
    };

    if (error instanceof AMSError) {
        details.requestUrl = sanitizeRequestPath(error.requestUrl);
        if (typeof error.status === 'number') {
            details.status = error.status;
        }
    }

    return details;
};

export const createOperationError = (operation: string, details?: AMSOperationErrorDetails): AMSOperationError => {
    const operationError: AMSOperationError = new Error(operation);

    if (typeof details?.status === 'number') {
        operationError.status = details.status;
    }

    if (details?.requestUrl) {
        // Sanitized again because framed details can come from a different iframe build.
        operationError.requestUrl = sanitizeRequestPath(details.requestUrl);
    }

    return operationError;
};

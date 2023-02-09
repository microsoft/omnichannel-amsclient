export default interface AMSLogData {
    AMSClientRuntimeId: string;
    ChatId: string;
    DocumentId?: string;
    MimeType?: string;
    ElapsedTimeInMilliseconds?: number;
    Event?: string;
    Description?: string;
    ExceptionDetails?: Record<string, unknown>;
    AMSClientVersion: string;
    FileExtension?: string;
}
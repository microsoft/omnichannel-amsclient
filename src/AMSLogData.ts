export default interface AMSLogData {
    AMSClientRuntimeId: string;
    ChatId: string;
    DocumentId?: string;
    ElapsedTimeInMilliseconds?: number;
    Event?: string;
    Description?: string;
    ExceptionDetails?: Record<string, unknown>;
    AMSClientVersion: string;
}
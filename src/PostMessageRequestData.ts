import AMSFileInfo from "./AMSFileInfo";
import AMSLogData from "./AMSLogData";
import LogLevel from "./LogLevel";
import OmnichannelChatToken from "./OmnichannelChatToken";

interface PostMessageRequestData {
    requestId?: string;
    id?: string;
    file?: File | AMSFileInfo;
    chatToken?: OmnichannelChatToken;
    documentId?: string;
    fileMetadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    viewLocation?: string;
    logLevel?: LogLevel;
    logData?: AMSLogData;
}

export default PostMessageRequestData;
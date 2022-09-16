import AMSCreateObjectResponse from "./AMSCreateObjectResponse";
import AMSFileInfo from "./AMSFileInfo";
import AMSViewStatusResponse from "./AMSViewStatusResponse";
import FileMetadata from "./FileMetadata";
import GlobalConfiguration from "./GlobalConfiguration";
import OmnichannelChatToken from "./OmnichannelChatToken";

enum Operation {
    Create = "Create",
    Upload = "Upload"
}

enum DocumentTypes {
    CreateDocument = 'sharing/file',
    UploadDocument = 'original',
    CreateImage = 'pish/image',
    UploadImage = 'imgpsh'
}

enum HeadersName {
    Accept = 'Accept',
    AcceptEncoding = 'Accept-Encoding',
    BehaviorOverride = 'BehaviorOverride',
    Authorization = 'Authorization',
    ClientVersion = 'X-MS-Client-Version',
    ContentType = 'Content-Type'
}

enum MIMEType {
    applicationFormUrlEncoded = 'application/x-www-form-urlencoded',
    applicationJson = 'application/json'
}

enum AMSFileStatus {
    Expired = 'expired',
    Failed = 'failed',
    InProgress = 'in progress',
    Malware = 'malware',
    Ready = 'ready'
}

interface AMSHeaders {
    [HeadersName.Authorization]: string;
    [HeadersName.ClientVersion]: string;
    [HeadersName.ContentType]?: string;
    [HeadersName.Accept]?: string;
    [HeadersName.AcceptEncoding]?: string;
}

const validImageTypes = ['jpeg', 'jpg', 'gif', 'png', 'heic', 'heif', 'webp'];

const patchChatToken = (chatToken: OmnichannelChatToken) => {
    // Temporary
    if (!chatToken.regionGTMS) {
        chatToken.regionGTMS = {
            ams: 'https://us-api.asm.skype.com'
        }
    }
}

const createDefaultHeaders = (token: string): AMSHeaders => {
    return {
        [HeadersName.Authorization]: `skype_token ${token}`,
        [HeadersName.ClientVersion]: 'os=Windows; osVer=10; proc=Win32; lcid=en-us; deviceType=1; country=IN; clientName=swc; clientVer=912/0.106.0.34//swc'
    }
}

const skypeTokenAuth = async (chatToken: OmnichannelChatToken): Promise<Response> => {
    GlobalConfiguration.debug && console.log(`[API][skypeTokenAuth]`);

    patchChatToken(chatToken);

    const url = `${chatToken.amsEndpoint || chatToken.regionGTMS?.ams}/v1/skypetokenauth`;

    const headers = {
        [HeadersName.Authorization]: `skype_token ${chatToken.token}`,
        [HeadersName.Accept]: MIMEType.applicationJson,
        [HeadersName.BehaviorOverride]: 'redirectAs404',
        [HeadersName.ContentType]: MIMEType.applicationFormUrlEncoded
    }

    const request = {
        headers,
        method: 'POST',
        body: `skypetoken=${chatToken.token}`
    }

    try {
        const response = await fetch(url, request);
        return response;
    } catch (error) {
        !GlobalConfiguration.silentError && console.log(error);
        throw new Error('AMSAuth');
    }
}


const getTypeFromFile = (type: string, name: string, operation: string) => {

    if (type.includes('image')) {
        const stripFileName = name.split('.');
        if (stripFileName.length > 1) {
            if (validImageTypes.includes(stripFileName[1])) {
                return operation === Operation.Create ? DocumentTypes.CreateImage : DocumentTypes.UploadImage;
            } else {
                return operation === Operation.Create ? DocumentTypes.CreateDocument : DocumentTypes.UploadDocument;
            }
        }
    }
    return operation === Operation.Create ? DocumentTypes.CreateDocument : DocumentTypes.UploadDocument;
}

const createObject = async (id: string, file: File, chatToken: OmnichannelChatToken): Promise<AMSCreateObjectResponse> => {
    GlobalConfiguration.debug && console.log(`[API][createObject]`);

    const permissions = {
        [id]: ['read']
    };
    const typeObject = getTypeFromFile(file.type, file.name, Operation.Create);
    const body = {
        filename: file.name,
        permissions,
        type: typeObject
    };
    patchChatToken(chatToken);

    const url = `${chatToken.amsEndpoint || chatToken?.regionGTMS?.ams}/v1/objects`;
    const headers = {
        ...createDefaultHeaders(chatToken.token),
        [HeadersName.ContentType]: MIMEType.applicationJson
    };

    const request = {
        headers,
        method: 'POST',
        body: JSON.stringify(body),
        credentials: 'include'
    };

    try {
        const response = await fetch(url, request as any);  // eslint-disable-line @typescript-eslint/no-explicit-any
        const jsonResponse = await response.json();
        return jsonResponse; // returns document id
    } catch (error) {
        !GlobalConfiguration.silentError && console.log(error);
        throw new Error('AMSCreateObjectFailed');
    }
}

const uploadDocument = async (documentId: string, file: File | AMSFileInfo, chatToken: OmnichannelChatToken): Promise<FileMetadata> => {
    GlobalConfiguration.debug && console.log(`[API][uploadDocument]`);

    patchChatToken(chatToken);

    const typeObject = getTypeFromFile(file.type, file.name, Operation.Upload);
    const url = `${chatToken.amsEndpoint || chatToken?.regionGTMS?.ams}/v1/objects/${documentId}/content/${typeObject}`;
    const headers = {
        ...createDefaultHeaders(chatToken.token),
        [HeadersName.ContentType]: MIMEType.applicationFormUrlEncoded
    };

    const request = {
        headers,
        method: 'PUT',
        body: (file as any).data ? (file as AMSFileInfo).data : file as File  // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    try {
        await fetch(url, request as RequestInit);
        const fileMetadata = {
            name: file.name,
            size: file.size,
            type: file.type,
            id: documentId,
            url,
            fileSharingProtocolType: 0 // AMSBasedFileSharing
        }
        return fileMetadata;
    } catch (error) {
        !GlobalConfiguration.silentError && console.log(error);
        throw new Error('AMSUploadDocumentFailed');
    }
}

const getViewStatus = async (fileMetadata: FileMetadata, chatToken: OmnichannelChatToken): Promise<AMSViewStatusResponse> => {
    GlobalConfiguration.debug && console.log(`[API][getViewStatus]`);

    patchChatToken(chatToken);

    const url = `${chatToken.amsEndpoint || chatToken?.regionGTMS?.ams}/v1/objects/${fileMetadata.id}/views/${validImageTypes.includes(fileMetadata.type) ? 'imgpsh_fullsize_anim' : 'original'}/status`;

    const headers = createDefaultHeaders(chatToken.token);

    const request: any = {  // eslint-disable-line @typescript-eslint/no-explicit-any
        headers,
        method: 'GET',
    };

    try {
        const response = await fetch(url, request);
        const jsonResponse = await response.json();

        const { content_state, view_state, view_location } = jsonResponse;

        if (!view_location) {
            throw new Error('view_location is empty');
        }

        if (view_state && view_state !== AMSFileStatus.Ready.toString()) {
            !GlobalConfiguration.silentError && console.error('view_state is not ready');
        }

        if (content_state === AMSFileStatus.Expired.toString()) {
            throw new Error('content_state is expired');
        }

        return jsonResponse;
    } catch (error) {
        !GlobalConfiguration.silentError && console.log(error);
        throw new Error('AMSGetViewStatusFailed');
    }
}

const getView = async (fileMetadata: FileMetadata, viewLocation: string, chatToken: OmnichannelChatToken): Promise<Blob> => {
    GlobalConfiguration.debug && console.log(`[API][getView]`);

    patchChatToken(chatToken);

    const url = viewLocation;

    const headers = createDefaultHeaders(chatToken.token);

    if (validImageTypes.includes(fileMetadata.type)) {
        headers[HeadersName.Accept] = 'image/webp,image/ *,*/*;q=0.8';
        headers[HeadersName.AcceptEncoding] = 'gzip, deflate, sdch, br';
    }

    const request: any = {  // eslint-disable-line @typescript-eslint/no-explicit-any
        headers,
        method: 'GET',
    };

    try {
        const response = await fetch(url, request);
        const blobResponse = await response.blob();
        return blobResponse;
    } catch (error) {
        !GlobalConfiguration.silentError && console.log(error);
        throw new Error('AMSGetViewFailed');
    }
}

export default {
    skypeTokenAuth,
    createObject,
    uploadDocument,
    getViewStatus,
    getView
};
import AMSCreateObjectResponse from "./AMSCreateObjectResponse";
import AMSFileInfo from "./AMSFileInfo";
import AMSLogger from "./AMSLogger";
import AMSViewStatusResponse from "./AMSViewStatusResponse";
import API from "./API";
import FileMetadata from "./FileMetadata";
import InitConfig from "./InitConfig";
import LogLevel from "./LogLevel";
import OmnichannelChatToken from "./OmnichannelChatToken";
import PostMessageEventName from "./PostMessageEventName";
import platform from "./utils/platform";
import ScenarioMarker from "./telemetry/ScenarioMarker";
import { sdkVersion } from "./config";
import { uuidv4 } from "./utils/uuid";

class FramedlessClient {
    private runtimeId: string;
    private debug: boolean;
    private chatToken!: OmnichannelChatToken;
    private logger?: AMSLogger;
    private scenarioMarker?: ScenarioMarker;

    constructor(logger: AMSLogger | undefined = undefined) {
        this.runtimeId = uuidv4();
        this.debug = false;
        this.logger = logger;

        if (platform.isBrowser()) {
            console.error('FramedMode should be used on Web platform');
        }

        if (logger) {
            this.scenarioMarker = new ScenarioMarker(logger);
            this.scenarioMarker.setRuntimeId(this.runtimeId);
        }
    }

    /* istanbul ignore next */
    public setDebug(flag: boolean): void {
        this.debug = flag;
    }

    public async setup(): Promise<void> {
        return Promise.resolve();
    }

    public async initialize(initConfig: InitConfig): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedlessClient][initialize]`);

        this.chatToken = initConfig.chatToken;

        await this.skypeTokenAuth();
    }

    public async skypeTokenAuth(chatToken: OmnichannelChatToken | null = null): Promise<Response> {
        this.scenarioMarker?.startScenario(PostMessageEventName.SkypeTokenAuth, {
            ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
        });

        try {
            const response = await API.skypeTokenAuth(chatToken || this.chatToken);
            if (!response.ok) {
                this.scenarioMarker?.failScenario(PostMessageEventName.SkypeTokenAuth, {
                    ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                    ExceptionDetails: {
                        status: response.status
                    }
                });
            }

            this.scenarioMarker?.completeScenario(PostMessageEventName.SkypeTokenAuth, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId
            });

            return response;
        } catch (error) {
            this.scenarioMarker?.failScenario(PostMessageEventName.SkypeTokenAuth, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                ExceptionDetails: error
            });

            throw new Error('skypeTokenAuth');
        }
    }

    public async createObject(id: string, file: File, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<AMSCreateObjectResponse> {
        this.scenarioMarker?.startScenario(PostMessageEventName.CreateObject, {
            ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
        });

        try {
            const response = await API.createObject(id, file, chatToken || this.chatToken, supportedImagesMimeTypes);

            this.scenarioMarker?.completeScenario(PostMessageEventName.CreateObject, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: response?.id
            });

            return response;
        } catch (error) {
            this.scenarioMarker?.failScenario(PostMessageEventName.CreateObject, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                ExceptionDetails: error
            });

            throw new Error('createObject');
        }
    }

    public async uploadDocument(documentId: string, file: File | AMSFileInfo, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<FileMetadata> {
        this.scenarioMarker?.startScenario(PostMessageEventName.UploadDocument, {
            ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
            DocumentId: documentId
        });

        try {
            const response = await API.uploadDocument(documentId, file, chatToken || this.chatToken, supportedImagesMimeTypes);

            this.scenarioMarker?.completeScenario(PostMessageEventName.UploadDocument, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: documentId
            });

            return response;
        } catch (error) {
            this.scenarioMarker?.failScenario(PostMessageEventName.UploadDocument, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: documentId,
                ExceptionDetails: error
            });

            throw new Error('uploadDocument');
        }
    }

    public async getViewStatus(fileMetadata: FileMetadata, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<AMSViewStatusResponse> {
        this.scenarioMarker?.startScenario(PostMessageEventName.GetViewStatus, {
            ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
            DocumentId: fileMetadata?.id
        });

        try {
            const response = await API.getViewStatus(fileMetadata, chatToken || this.chatToken, supportedImagesMimeTypes);

            this.scenarioMarker?.completeScenario(PostMessageEventName.GetViewStatus, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: fileMetadata?.id
            });

            return response;
        } catch (error) {
            this.scenarioMarker?.failScenario(PostMessageEventName.GetViewStatus, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: fileMetadata?.id,
                ExceptionDetails: error
            });

            throw new Error('getViewStatus');
        }
    }

    public async getView(fileMetadata: FileMetadata, viewLocation: string, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<Blob> {
        this.scenarioMarker?.startScenario(PostMessageEventName.GetView, {
            ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
            DocumentId: fileMetadata?.id
        });

        try {
            const response = await API.getView(fileMetadata, viewLocation, chatToken || this.chatToken, supportedImagesMimeTypes);

            this.scenarioMarker?.completeScenario(PostMessageEventName.GetView, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: fileMetadata?.id
            });

            return response;
        } catch (error) {
            this.scenarioMarker?.failScenario(PostMessageEventName.GetView, {
                ChatId: chatToken ? chatToken.chatId : this.chatToken?.chatId,
                DocumentId: fileMetadata?.id,
                ExceptionDetails: error
            });

            throw new Error('getView');
        }
    }

    public async fetchBlob(contentUrl: string): Promise<Blob> {
        try {
            const response = await fetch(contentUrl);
            const blobResponse = await response.blob();
            return blobResponse;
        } catch (error) {
            console.log(error);
            throw new Error('fetchBlob');
        }
    }

    // public async uploadFile(fileInfo: any, chatToken: OmnichannelChatToken | null = null): Promise<any> {
    //     console.log('[FramedlessClient][UploadFile]');
    //     try {
    //         const createObjectResponse = await this.createObject(chatToken?.chatId as string, fileInfo, chatToken);
    //         const uploadDocumentResponse = await this.uploadDocument(createObjectResponse.id, fileInfo, chatToken);
    //         console.log(uploadDocumentResponse);
    //         return uploadDocumentResponse;
    //     } catch {
    //         throw new Error('uploadFile');
    //     }
    // }

    // public async downloadFile(fileInfo: any, chatToken: OmnichannelChatToken | null = null): Promise<any> {
    //     console.log('[FramedlessClient][DownloadFile]');

    //     try {
    //         const response = await this.getViewStatus(fileInfo, chatToken);

    //         const {view_location} = response;
    //         const viewResponse = await this.getView(fileInfo, view_location, chatToken);
    //         return viewResponse;
    //     } catch {
    //         throw new Error('downloadFile');
    //     }
    // }
}

export default FramedlessClient;
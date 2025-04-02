import AMSCreateObjectResponse from "./AMSCreateObjectResponse";
import AMSFileInfo from "./AMSFileInfo";
import AMSLogger from "./AMSLogger";
import AMSViewStatusResponse from "./AMSViewStatusResponse";
import { baseUrl, sdkVersion } from "./config";
import FileMetadata from "./FileMetadata";
import FramedClientConfig from "./FramedClientConfig";
import GlobalConfiguration from "./GlobalConfiguration";
import InitConfig from "./InitConfig";
import OmnichannelChatToken from "./OmnichannelChatToken";
import platform from "./utils/platform";
import PostMessageEventName from "./PostMessageEventName";
import PostMessageEventType from "./PostMessageEventType";
import PostMessageRequestData from "./PostMessageRequestData";
import { uuidv4 } from "./utils/uuid";
import PostMessageEventStatus from "./PostMessageEventStatus";

enum LoadIframeState {
    Loading,
    Loaded,
    Failed,
    NotLoaded
}

interface RequestCallback {
    resolve: CallableFunction,
    reject: CallableFunction
}

const version = sdkVersion;

const iframePrefix = 'Microsoft_Omnichannel_AMSClient_Iframe_Window';

class FramedClient {
    private runtimeId: string;
    private clientId: string;
    private iframeId: string;
    private origin: string;
    private targetWindow!: Window; // Reference of window object that sent the message
    private requestCallbacks: Record<string, RequestCallback>;  // eslint-disable-line @typescript-eslint/no-explicit-any
    private debug: boolean;
    private chatToken!: OmnichannelChatToken;
    private logger?: AMSLogger;
    private loadIframeState: LoadIframeState;

    constructor(logger: AMSLogger | undefined = undefined, framedClientConfig: FramedClientConfig | undefined = undefined) {
        this.runtimeId = uuidv4();
        this.clientId = uuidv4();
        this.origin = window.location.origin;
        this.requestCallbacks = {};
        this.debug = true;
        this.loadIframeState = LoadIframeState.NotLoaded;
        this.logger = logger;
        this.iframeId = iframePrefix;

        if (framedClientConfig && framedClientConfig.multiClient) {
            this.iframeId = this.clientId;
        }
    }

    /* istanbul ignore next */
    public setDebug(flag: boolean): void {
        this.debug = flag;
        this.debug = true;
    }

    public async setup(): Promise<void> {
        this.debug && console.log(`[FramedClient][setup]`);
        this.debug && console.time('ams:setup');
        this.onMessageEvent((event: MessageEvent) => this.handleEvent(event));  // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!platform.isBrowser()) {
            throw new Error('FramedMode was used in non-Web platform');
        }

        // in case the load is called multiple times, we just dont load the iframe again
        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }

        this.debug && console.timeEnd('ams:setup');

        /// since the promisse is hold and not released until there is a result, we are certain of the state
        if (this.loadIframeState === LoadIframeState.Failed) {
            !GlobalConfiguration.silentError && console.error('iframe not loaded');
        }
    }

    public async initialize(initConfig: InitConfig): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][initialize]`);
        this.debug && console.time('ams:initialize');
        this.chatToken = initConfig.chatToken;

        this.skypeTokenAuth();
        this.debug && console.timeEnd('ams:initialize');
    }

    public async skypeTokenAuth(chatToken: OmnichannelChatToken | null = null): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][skypeAuth]`);
        this.debug && console.time('ams:skypeTokenAuth');
        const data = {
            chatToken: chatToken || this.chatToken
        };

        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }
        this.debug && console.timeEnd('ams:skypeTokenAuth');
        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.SkypeTokenAuth, data, resolve, reject);
        })
    }

    public async createObject(id: string, file: File, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][createObject]`);
        this.debug && console.time('ams:createObject');
        const data = {
            id,
            file,
            chatToken: chatToken || this.chatToken,
            supportedImagesMimeTypes
        };

        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }
        this.debug && console.timeEnd('ams:createObject');
        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.CreateObject, data, resolve, reject);
        })
    }

    public async uploadDocument(documentId: string, file: File | AMSFileInfo, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][uploadDocument]`);
        this.debug && console.time('ams:uploadDocument');
        const data = {
            documentId,
            file,
            chatToken: chatToken || this.chatToken,
            supportedImagesMimeTypes
        };

        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }

        this.debug && console.timeEnd('ams:uploadDocument');
        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.UploadDocument, data, resolve, reject);
        })
    }

    public async getViewStatus(fileMetadata: FileMetadata, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<void> {
        this.debug && console.log(`[FramedClient][getViewStatus]`);
        this.debug && console.time('ams:getViewStatus');
        const data = {
            fileMetadata,
            chatToken: chatToken || this.chatToken,
            supportedImagesMimeTypes
        }

        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }
        this.debug && console.timeEnd('ams:getViewStatus');
        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.GetViewStatus, data, resolve, reject);
        })
    }

    public async getView(fileMetadata: FileMetadata, viewLocation: string, chatToken: OmnichannelChatToken | null = null, supportedImagesMimeTypes: string[] = []): Promise<void> {
        this.debug && console.log(`[FramedClient][getView]`);
        this.debug && console.time('ams:getView');
        const data = {
            fileMetadata,
            viewLocation,
            chatToken: chatToken || this.chatToken,
            supportedImagesMimeTypes
        }

        if(this.loadIframeState === LoadIframeState.NotLoaded) {
            await this.loadIframe();
        }

        this.debug && console.timeEnd('ams:getView');
        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.GetView, data, resolve, reject);
        })
    }

    public async fetchBlob(contentUrl: string): Promise<Blob> {
        try {
            const response = await fetch(contentUrl);
            const blobResponse = await response.blob();
            return blobResponse;
        } catch (error) {
            !GlobalConfiguration.silentError && console.log(error);
            throw new Error('fetchBlob');
        }
    }

    public onMessageEvent(cb: (event: MessageEvent) => void): void {
        window.addEventListener("message", cb, true);
    }

    public postMessage(eventType: PostMessageEventType, eventName: PostMessageEventName, data: PostMessageRequestData = {}, resolve: CallableFunction = (data: any) => ({}), reject: CallableFunction = (data: any) => ({})): void {  // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        const requestId = uuidv4();
        this.requestCallbacks[requestId] = {
            resolve,
            reject
        }

        if (!this.targetWindow) {
            !GlobalConfiguration.silentError && console.error('Target window not found!');
            return;
        }

        this.targetWindow.postMessage({
            runtimeId: this.runtimeId,
            clientId: this.clientId,
            requestId,
            eventType,
            eventName,
            ...data
        }, baseUrl);
    }

    public async handleEvent(event: MessageEvent): Promise<void> {  // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.origin !== this.origin && !baseUrl.includes(event.origin)) {
            return;
        }

        if (event.data.clientId !== this.clientId) {
            return;
        }

        /* istanbul ignore next */
        this.debug && console.log(event);

        // Finds target window to post message back
        if (event.source) {
            this.targetWindow = event.source as Window;
        }

        if (event.data.eventType === PostMessageEventType.Response) {
            /* istanbul ignore next */
            this.debug && console.log(`[FramedClient][Response]`);
            const { data } = event;

            if (event.data.eventName === PostMessageEventName.SkypeTokenAuth) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve();
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.CreateObject) {
                if (data.eventStatus === PostMessageEventStatus.Success) {
                    if (data.requestId in this.requestCallbacks) {
                        this.requestCallbacks[data.requestId].resolve(data.response as AMSCreateObjectResponse);
                        delete this.requestCallbacks[data.requestId];
                    }
                } else {
                    if (data.requestId in this.requestCallbacks) {
                        this.requestCallbacks[data.requestId].reject();
                        delete this.requestCallbacks[data.requestId];
                    }
                }
            } else if (event.data.eventName === PostMessageEventName.UploadDocument) {
                if (data.eventStatus === PostMessageEventStatus.Success) {
                    if (data.requestId in this.requestCallbacks) {
                        this.requestCallbacks[data.requestId].resolve(data.response as FileMetadata);
                        delete this.requestCallbacks[data.requestId];
                    }
                } else {
                    if (data.requestId in this.requestCallbacks) {
                        this.requestCallbacks[data.requestId].reject();
                        delete this.requestCallbacks[data.requestId];
                    }
                }
            } else if (event.data.eventName === PostMessageEventName.GetViewStatus) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as AMSViewStatusResponse);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.GetView) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as Blob);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.SendTelemetry) {
                this.logger?.log(data.logLevel, data.logData.Event, data.logData);
            }
        }
    }

    public dispose(): void {
        document.getElementById(this.iframeId)?.remove();
        this.requestCallbacks = {};
        this.loadIframeState === LoadIframeState.NotLoaded;
    }

    private async loadIframe(): Promise<void> {

        return new Promise((resolve, reject) => {
            this.debug && console.log(`[FramedClient][loadIframe]`);
            this.debug && console.time('ams:loadIframe');
            // next block is to check if the iframe is already loaded and preveent double loading in an efortless way
            if(this.loadIframeState === LoadIframeState.Loading || this.loadIframeState === LoadIframeState.Loaded) {
                resolve();
                return;
            }

            // if the iframe is already loaded, we just resolve the promise
            const currentIframe = document.getElementById(this.iframeId);
            if (currentIframe) {
                this.loadIframeState = LoadIframeState.Loaded;
                resolve();
                return;
            }
            // at this point, is assured that the iframe is not loaded yet, so we can proceed to load it
            /* istanbul ignore next */            
            const iframeElement: HTMLIFrameElement = document.createElement('iframe');
            iframeElement.id = this.iframeId;
            iframeElement.src = `${baseUrl}/${version}/iframe.html?clientId=${this.clientId}&debug=${this.debug}&telemetry=true`;
            //controlling iframe state to prevent clashing calls
            this.loadIframeState = LoadIframeState.Loading;

            iframeElement.addEventListener('load', () => {
                /* istanbul ignore next */
                this.debug && console.log('iframe loaded!');
                this.loadIframeState = LoadIframeState.Loaded;
                resolve();
            });

            iframeElement.addEventListener('error', () => {
                this.loadIframeState = LoadIframeState.Failed;
                reject();
            });
            document.head.append(iframeElement);
            this.debug && console.timeEnd('ams:loadIframe');
        });
    }
}

export default FramedClient;
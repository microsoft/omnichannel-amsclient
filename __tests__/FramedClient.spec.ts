/**
 * @jest-environment jsdom
 */

import FramedClient, { LoadIframeState } from "../src/FramedClient";
import PostMessageEventName from "../src/PostMessageEventName";
import PostMessageEventStatus from "../src/PostMessageEventStatus";
import PostMessageEventType from "../src/PostMessageEventType";
import platform from "../src/utils/platform";


describe('FramedClient', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('FramedClient.setup() should call loadIframe()', async () => {
        const client = new FramedClient();

        (client as any).loadIframe = jest.fn();

        await client.setup();

        expect((client as any).loadIframe).toHaveBeenCalledTimes(1);
    });

    it('FramedClient.setup() throw an error if platform is not browser', async () => {
        platform.isBrowser = jest.fn(() => false);

        const client = new FramedClient();

        (client as any).loadIframe = jest.fn();
        (client as any).loadIframeState = LoadIframeState.Loaded;

        try {
            await client.setup();
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedClient.initialize() should call skypeTokenAuth()', async () => {
        const client = new FramedClient();

        (client as any).loadIframe = jest.fn();
        (client as any).loadIframeState = LoadIframeState.Loaded;

        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(client, 'skypeTokenAuth').mockResolvedValue(Promise.resolve({}) as any);

        await client.initialize({chatToken: token});

        expect(client.skypeTokenAuth).toHaveBeenCalledTimes(1);
    });

    it('FramedClient.fetchBlob() should fetch the content URL', async () => {
        (global as any).fetch = jest.fn(() => Promise.resolve({
            blob: () => Promise.resolve()
        }));

        const client = new FramedClient();
        const contentUrl = 'contentUrl';

        await client.fetchBlob(contentUrl);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('FramedClient.fetchBlob() should throw an error if API call does not succeed', async () => {
        (global as any).fetch = jest.fn(() => Promise.reject());

        const client = new FramedClient();
        const contentUrl = 'contentUrl';

        try {
            await client.fetchBlob(contentUrl);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedClient.postMessage() should call targetWindow.postMessage()', async () => {
        const client = new FramedClient();
        (client as any).targetWindow = {
            postMessage: jest.fn()
        };

        client.postMessage(PostMessageEventType.None, PostMessageEventName.SkypeTokenAuth, {}, () => {}, () => {});

        expect((client as any).targetWindow.postMessage).toHaveBeenCalledTimes(1);
        expect((client as any).targetWindow.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({ replyOnFailure: true }),
            expect.any(String)
        );
    });

    it('FramedClient.dispose() should clean up', async () => {
        const client = new FramedClient();

        (client as any).loadIframeState = LoadIframeState.Loaded;

        client.dispose();

        expect((client as any).loadIframeState).toBe(LoadIframeState.NotLoaded);
    });
    describe('handleEvent() responses', () => {
        const respond = async (client: FramedClient, eventName: PostMessageEventName, data: Record<string, unknown>) => {
            await client.handleEvent({
                origin: window.location.origin,
                source: null,
                data: { clientId: (client as any).clientId, eventType: PostMessageEventType.Response, eventName, requestId: 'requestId', ...data }
            } as any);
        };

        const operations: [string, PostMessageEventName][] = [
            ['createObject', PostMessageEventName.CreateObject],
            ['uploadDocument', PostMessageEventName.UploadDocument],
            ['getViewStatus', PostMessageEventName.GetViewStatus],
            ['getView', PostMessageEventName.GetView]
        ];

        it.each(operations)('%s success should resolve with the response', async (_operation, eventName) => {
            const client = new FramedClient();
            const resolve = jest.fn();
            const reject = jest.fn();
            (client as any).requestCallbacks = { requestId: { resolve, reject } };

            await respond(client, eventName, { eventStatus: PostMessageEventStatus.Success, response: { id: 'id' } });

            expect(resolve).toHaveBeenCalledWith({ id: 'id' });
            expect(reject).not.toHaveBeenCalled();
            expect((client as any).requestCallbacks).toEqual({});
        });

        it.each(operations)('%s failure should reject with the operation message and status', async (operation, eventName) => {
            const client = new FramedClient();
            const resolve = jest.fn();
            const reject = jest.fn();
            (client as any).requestCallbacks = { requestId: { resolve, reject } };

            await respond(client, eventName, { eventStatus: PostMessageEventStatus.Failure, error: { message: 'AMS failed: 401 Unauthorized', status: 401 } });

            expect(resolve).not.toHaveBeenCalled();
            expect(reject).toHaveBeenCalledTimes(1);
            expect(reject.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(reject.mock.calls[0][0]).toMatchObject({ message: operation, status: 401 });
            expect((client as any).requestCallbacks).toEqual({});
        });

        it.each(operations.slice(0, 2))('%s failure from an older iframe without error details should still reject', async (operation, eventName) => {
            const client = new FramedClient();
            const reject = jest.fn();
            (client as any).requestCallbacks = { requestId: { resolve: jest.fn(), reject } };

            await respond(client, eventName, { eventStatus: PostMessageEventStatus.Failure });

            expect(reject.mock.calls[0][0]).toMatchObject({ message: operation });
            expect(reject.mock.calls[0][0].status).toBeUndefined();
        });

        it.each(operations.slice(2))('%s failure from an older iframe without requestId cannot settle the request', async (_operation, eventName) => {
            const client = new FramedClient();
            const resolve = jest.fn();
            const reject = jest.fn();
            (client as any).requestCallbacks = { requestId: { resolve, reject } };

            await respond(client, eventName, { eventStatus: PostMessageEventStatus.Failure, requestId: undefined });

            expect(resolve).not.toHaveBeenCalled();
            expect(reject).not.toHaveBeenCalled();
            expect((client as any).requestCallbacks).toHaveProperty('requestId');
        });

        it('skypeTokenAuth failure should still resolve', async () => {
            const client = new FramedClient();
            const resolve = jest.fn();
            const reject = jest.fn();
            (client as any).requestCallbacks = { requestId: { resolve, reject } };

            await respond(client, PostMessageEventName.SkypeTokenAuth, { eventStatus: PostMessageEventStatus.Failure, error: { status: 401 } });

            expect(resolve).toHaveBeenCalledTimes(1);
            expect(reject).not.toHaveBeenCalled();
        });
    });
});
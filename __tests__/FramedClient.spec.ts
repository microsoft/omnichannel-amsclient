/**
 * @jest-environment jsdom
 */

import FramedClient from "../src/FramedClient";
import PostMessageEventName from "../src/PostMessageEventName";
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
        (client as any).iframeLoaded = true;

        try {
            await client.setup();
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedClient.initialize() should call skypeTokenAuth()', async () => {
        const client = new FramedClient();

        (client as any).loadIframe = jest.fn();
        (client as any).iframeLoaded = true;

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
    });

    it('FramedClient.dispose() should clean up', async () => {
        const client = new FramedClient();

        (client as any).iframeLoaded = true;

        client.dispose();

        expect((client as any).iframeLoaded).toBe(false);
    });
});
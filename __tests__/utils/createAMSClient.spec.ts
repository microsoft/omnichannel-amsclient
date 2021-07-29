/**
 * @jest-environment jsdom
 */

import createAMSClient from "../../src";

describe('createAMSClient', () => {
    it('Creating AMSClient on framed mode should return FramedClient', async () => {
        const client = await createAMSClient({
            framedMode: true,
        });

        expect((client as any).iframeLoaded).not.toBe(undefined);
    });

    it('Creating AMSClient on framedless mode should return FramedlessClient', async () => {
        const client = await createAMSClient({
            framedMode: false,
        });

        expect((client as any).iframeLoaded).toBe(undefined);
    });
});
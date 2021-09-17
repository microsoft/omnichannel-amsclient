/**
 * @jest-environment jsdom
 */

import createAMSClient from "../../src";
import FramedClient from "../../src/FramedClient";

jest.mock("../../src/FramedClient");
jest.mock("../../src/FramedlessClient");

describe('createAMSClient', () => {
    it('Creating AMSClient on framed mode should return FramedClient', async () => {
        const client = await createAMSClient({
            framedMode: true,
        });

        expect(client.constructor.name).toEqual(FramedClient.name);;
    });

    it('Creating AMSClient on framedless mode should return FramedlessClient', async () => {
        const client = await createAMSClient({
            framedMode: false,
        });

        expect((client as any).iframeLoaded).toBe(undefined);
    });
});
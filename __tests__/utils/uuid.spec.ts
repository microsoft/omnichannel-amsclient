import { string } from "yargs";
import { uuidv4 } from "../../src/utils/uuid";

describe('uuid', () => {

    it('uuidv4() should return a string', () => {
        const uuid = uuidv4();
        expect(typeof(uuid)).toBe('string');
    });
})
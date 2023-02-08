import extractFileExtension from "../../src/utils/extractFileExtension";

describe('extractFileExtension', () => {
    it('extractFileExtension() with empty file name should return a \'\'', () => {
        const fileName = '';
        const extension = extractFileExtension(fileName);
        expect(extension).toBe('');
    });

    it('extractFileExtension() with a valid file name should return a the extension', () => {
        const expectedExtension = '.txt';
        const fileName = `file${expectedExtension}`;
        const extension = extractFileExtension(fileName);
        expect(extension).toBe(expectedExtension);
    });

    it('extractFileExtension() with a file name with multiple \'.\' should return a the extension', () => {
        const expectedExtension = '.txt';
        const fileName = `file.foo.bar${expectedExtension}`;
        const extension = extractFileExtension(fileName);
        expect(extension).toBe(expectedExtension);
    });

    it('extractFileExtension() with a dot file should return \'\'', () => {
        const fileName = `.dot`;
        const extension = extractFileExtension(fileName);
        expect(extension).toBe('');
    });

    it('extractFileExtension() with file name & no extension should return \'.\'', () => {
        const fileName = `name.`;
        const extension = extractFileExtension(fileName);
        expect(extension).toBe('.');
    });
})
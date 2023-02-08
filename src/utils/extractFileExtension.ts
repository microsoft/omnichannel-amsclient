/**
 * Method follows path.extname() implementation
 * path.extname() is not used due to using library on React Native would require additional dependencies.
 **/

const extractFileExtension = (fileName: string): string => {
    if (!fileName) return '';

    const tokens = fileName.split('.');

    if (tokens.length > 2) {
        return `.${tokens[tokens.length - 1]}`;
    }

    if (tokens.length == 2) {
        const [left, right] = tokens;

        // File with name but no extension
        if (!left && right) {
            return '';
        }

        // Dot files
        if (left && !right) {
            return '.';
        }

        return `.${tokens[tokens.length - 1]}`;
    }

    return '';
}

export default extractFileExtension;
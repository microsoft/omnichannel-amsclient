const {buildSync} = require('esbuild');
const fs = require('fs');

const {BASE_URL: baseUrl, SDK_VERSION: sdkVersion} = process.env;

if (!baseUrl) {
    process.stderr.write(`'BASE_URL' is not set`);
    process.exit(1);
}

if (!sdkVersion) {
    process.stderr.write(`'SDK_VERSION' is not set`);
    process.exit(1);
}

// Inject configs at build runtime
fs.writeFileSync('lib/config.js', `exports.baseUrl = '${baseUrl}'; exports.sdkVersion = '${sdkVersion}';`);

const options = {
    entryPoints: {
        SDK: 'lib/index.js',
        iframe: 'lib/IframeCommunicator.js'
    },
    bundle: true,
    outdir: 'dist',
};

try {
    buildSync(options);
    buildSync({...options, entryNames: '[name].min', minify: true});
} catch (err) {
    process.stderr.write(err.stderr);
    process.exit(1);
}

// Copy iframe.html
fs.copyFileSync('public/iframe.html', 'dist/iframe.html');
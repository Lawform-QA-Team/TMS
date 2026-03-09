const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@playwright': path.resolve(__dirname, 'test-scripts/playwright'),
        },
    },
};
module.exports = {
    webpack: {
        alias: {
            '@performance': path.resolve(__dirname, 'test-scripts/performance'),
        },
    },
};
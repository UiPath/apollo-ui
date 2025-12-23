module.exports = {
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('cssnano')({
            preset: ['default', {
                normalizeUrl: false
            }]
        }),
    ],
};

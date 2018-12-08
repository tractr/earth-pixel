const browserify = require('browserify');

browserify({
    standalone: "EarthPixel",
    paths: ['./node_modules']
})
    .add("lib/index.js")
    .bundle()
    .pipe(process.stdout);

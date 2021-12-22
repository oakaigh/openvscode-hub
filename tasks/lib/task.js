const gulp = require('gulp');

const del = require('del');

const path = require('path');


class Environment {
    constructor(base) {
        this.base = base;
    }

    resolve(name) {
        return path.format({
            dir: this.base,
            base: name
        })
    }
    
    create() {
        return () => gulp.src('*.*', { read: false })
                        .pipe(gulp.dest(this.base));
    }
    
    clean() {
        return () => del(this.base, { force: true });
    }

    init() {
        return gulp.series(
            this.clean(),
            this.create()
        );
    }
}

class Builder {
    constructor(source, dest) {
        this.source = source;
        this.dest = dest;
    }
}

exports = module.exports = { Environment, Builder };

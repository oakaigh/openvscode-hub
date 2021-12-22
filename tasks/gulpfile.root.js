const gulp = require('gulp');
const gulp_json = require('gulp-json-editor');

const merge_stream = require('merge-stream');

const path = require('path');
const child_process = require('child_process');

const task = require('./lib/task');


class Tasks extends task.Builder {
    prepare() {
        return () => merge_stream(
            gulp.src([
                'LICENSE',
                '.npmrc',
                'index.js',
                'src/**'
            ], {
                cwd: this.source,
                cwdbase: true
            })
                .pipe(gulp.dest(this.dest)),
            gulp.src(
                'package.json',
                { cwd: this.source }
            )
                .pipe(
                    gulp_json((obj) => {
                        return {
                            name: obj.name,
                            version: obj.version,
                            license: obj.license,
                            private: obj.private,
                            files: [ 'src' ],
                            main: '.',
                            dependencies: obj.dependencies
                        };
                    })
                )
                .pipe(gulp.dest(this.dest))
        );
    }

    bundle(bin_task) {
        if (bin_task == undefined)
            return (done) => done();

        return bin_task(
            path.resolve(
                path.format({
                    dir: this.dest,
                    base: 'src/bin'
                })
            )
        );
    }

    dependencies() {
        return (done) => {
            child_process.spawnSync(
                'npm',
                [ 'install' ],
                {
                    cwd: this.dest,
                    stdio: 'inherit'
                }
            );
            done();
        };
    }

    build(bin_task) {
        return gulp.series(
            this.prepare(),
            this.bundle(bin_task),
            this.dependencies()
        );
    }
}

exports = module.exports = Tasks;

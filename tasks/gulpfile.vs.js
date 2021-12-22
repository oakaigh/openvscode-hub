const gulp = require('gulp');
const gulp_chug = require('gulp-chug');

const fs = require('fs');
const path = require('path');

const child_process = require('child_process');

const task = require('./lib/task');


class Tasks extends task.Builder {
    prepare() {
        return gulp.series(
            (done) => {
                child_process.spawnSync(
                    'git',
                    [
                        'clone', 
                        '--depth', 1,
                        'resources/openvscode-server', 
                        this.source
                    ],
                    { stdio: 'inherit' }
                );
                done();
            },
            (done) => {
                child_process.spawnSync(
                    'yarn',
                    [ 'install' ],
                    {
                        cwd: this.source, 
                        env: { 
                            PATH: process.env.PATH,
                            NODE_OPTIONS: process.env.NODE_OPTIONS
                        },
                        stdio: 'inherit' 
                    }
                );
                done();
            }
        );
    }

    compile(user_options = {}) {
        const name = 'vscode';
        const type = 'reh-web';
        const args = {
            platform: process.platform,
            arch: process.platform === 'darwin' ? 'x64' : process.arch,
            minified: 'min',
            ...user_options
        };

        if (![
                args.platform,
                args.arch
            ].every(v => v !== undefined)
        )
            throw new Error();

        return gulp.series(
            () => gulp.src('./gulpfile.js', { 
                cwd: this.source,
                cwdbase: true,
                read: false 
            })
                .pipe(gulp_chug({ 
                    tasks: [
                        [
                            name, 
                            type, 
                            args.platform, 
                            args.arch, 
                            args.minified
                        ].filter(x => x != undefined).join('-')
                    ] 
                })),
            (done) => {
                fs.rename(
                    path.format({
                        dir: path.format({
                            dir: this.source,
                            base: '..'
                        }),
                        base: [
                            name,
                            type,
                            args.platform,
                            args.arch
                        ].join('-')
                    }),
                    this.dest, 
                    (err) => {
                        if (err)
                            throw err;
                        done();
                    }
                )
            }
        );
    }

    build(compile_options = {}) {
        return gulp.series(
            this.prepare(),
            this.compile(compile_options)
        );
    }
}

exports = module.exports = Tasks;

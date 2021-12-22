const gulp = require('gulp');

const task_build = require('./tasks/gulpfile.build');
const task_root = require('./tasks/gulpfile.root');
const task_server = require('./tasks/gulpfile.server');


const build = new task_build.Build('out');
const dist = new task_build.Dist('dist');

gulp.task('clean',
    gulp.parallel(
        build.clean(),
        dist.clean()
    )
);

gulp.task('build',
    gulp.series(
        gulp.parallel(
            build.init(),
            dist.init()
        ),
        new task_root('.', dist.base).build(
            (dest) => new task_server(
                build.resolve('openvscode-server'),
                dest
            ).build()
        )
    )
);

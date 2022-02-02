const fs = require('fs');
const path = require('path');


async function* watch(filename, user_options) {
    const options = {
        permissive: false,
        dereference: false,
        ...user_options
    };

    async function* _impl_builtin(filename, ...args) {
        yield* fs.promises.watch(filename, ...args);
    }

    async function* _impl_dir(filename, ...args) {
        const dir = path.dirname(filename),
            name = path.basename(filename);
        for await (const event of fs.promises.watch(dir, ...args)) {
            if (event.filename == name)
                yield event;
        }
    }

    if (options.permissive && !fs.existsSync(filename))
        for await (const _ of _impl_dir(filename, options))
            break;

    yield* options.dereference
        ? _impl_builtin(filename, options)
        : _impl_dir(filename, options);
}

exports = module.exports = { watch };

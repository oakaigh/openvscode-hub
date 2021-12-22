const fs = require('fs');
const path = require('path');


async function* watch(filename, ...args) {
    if (fs.existsSync(filename))
        yield* fs.promises.watch(filename, ...args);

    const dir = path.dirname(filename),
            name = path.basename(filename);
    for await (const event of fs.promises.watch(dir, ...args)) {
        if (event.filename == name)
            yield event;
    }
}

exports = module.exports = { watch };

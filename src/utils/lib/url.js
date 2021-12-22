const url = require('url');


const config = {
    resolvers: {
        'file:': async function* (uri, user_options = {}) {
            const fs = require('fs');
            const fs_util = require('./fs');      

            function parse(uri) {
                if (!uri)
                    return undefined;
                return { filename: url.fileURLToPath(uri) };
            }

            const options = {
                enabled: false,
                poll: false,
                permissive: false,
                ...user_options
            };

            if (!options.enabled)
                return;

            const parsed = parse(uri);

            async function* read() {
                try {
                    yield fs.promises.readFile(parsed.filename);
                } catch (e) {
                    if (!options.permissive)
                        throw e;
                }
                return;
            };

            yield* read();

            if (options.poll) {
                for await (const event of fs_util.watch(parsed.filename, {})) {
                    switch (event.eventType) {
                        case 'change':
                        case 'rename':
                        default:
                            break;
                    }
                    yield* read();
                }
            }
        },
        'data:': async function* (uri, user_options = {}) {
            const buffer = require('buffer');

            const config = {
                base64: 'base64'
            };

            function parse(uri) {
                function parse_mime(mime) {
                    function parse_param(params) {
                        if (!params)
                            return undefined;
                        const config = { sep: '=' };
                        const [ name, ...value ] = new String(params).split(config.sep);
                        if (!name)
                            return undefined;
                        return { [name]: value.join('') };
                    }

                    if (!mime)
                        return undefined;
                    const config = { sep: ';' };
                    const [ type, ...params ] = new String(mime).split(config.sep);
                    return { type, param: parse_param(params.join('')) };
                }

                if (!uri)
                    return undefined;
                const config = { sep: ',' };
                const [ mimetype, ...data ] = new String(uri.pathname).split(config.sep);
                return { mime: parse_mime(mimetype), data: data.join('') };
            }

            const options = {
                enabled: false,
                ...user_options
            };

            if (!options.enabled)
                return;

            const parsed = parse(uri);

            var encoding = undefined;
            try {
                const param = parsed.mime.param;
                encoding = config.base64 in param ? config.base64 : param.charset;
            } catch {}
            yield buffer.Buffer.from(decodeURIComponent(parsed.data), encoding);
        }
    }
};

async function* resolve(uri, options) {
    if (!(uri instanceof url.URL))
        throw new TypeError();

    const resolver = config.resolvers[uri.protocol];
    if (resolver == undefined)
        throw new Error(`unsupported protocol ${uri.protocol}`);
    yield* resolver(uri, options ? options[uri.protocol] : undefined);
}

exports = module.exports = { resolve };

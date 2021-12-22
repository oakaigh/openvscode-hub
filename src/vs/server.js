const path = require('path');
const child_process = require('child_process');

const express_proxy = require('http-proxy-middleware');
const userid = require('userid');

const utils = require('utils');


const config = {
    executable: 'server.sh',
    param: {
        socket_path: '--socket-path',
        connection_token: '--connection-token'
    },
    cookie_param: {
        connection_token: 'vscode-tkn'
    }
};

class Instance {
    constructor(options) {
        if (![
                options.socket_path,
                options.connection_token,
                options.username
            ].every(v => v !== undefined)
        )
            throw new Error();

        this.socket_path = options.socket_path;
        this.connection_token = options.connection_token;

        this.process = child_process.spawn(
            options.executable
                || path.resolve(__dirname, config.executable),
            [
                config.param.socket_path, this.socket_path,
                config.param.connection_token, this.connection_token
            ],
            {
                stdio: 'inherit',
                env: {},
                detached: false,
                shell: false,
                uid: userid.uid(options.username),
                gid: options.groupname !== undefined
                        ? userid.gid(options.groupname)
                        : userid.gids(options.username)[0]
            }
        );

        this.handler = undefined;
    }

    async handle() {
        if (this.handler !== undefined)
            return this.handler;

        for await (const _ of utils.fs.watch(
            this.socket_path, { persistent: false }
        )) break;

        // TODO logProvider
        const middleware = express_proxy.createProxyMiddleware({
            logLevel: 'debug',
            //logProvider: {},
            //router: undefined,
            //pathRewrite: {},
            target: {
                socketPath: this.socket_path
            },
            onProxyReq: (proxy_req) => {
                const headers = utils.http.cookie.serialize_header({
                    [config.cookie_param.connection_token]:
                        this.connection_token
                });
                for (const [name, value] of Object.entries(headers)) {
                    proxy_req.setHeader(name, value);
                }
            }
        });

        return this.handler = {
            request: middleware,
            upgrade: middleware.upgrade
        };
    }

    kill() { return this.process.kill(); }
}

class Instances {
    constructor() {
        this._ = new Map();
    }

    get(username, option_cb) {
        var instance = this._.get(username);
        if (instance != undefined)
            return instance;

        instance = new Instance({
            username: username,
            ...option_cb(username)
        });
        this._.set(username, instance);
        return instance;
    }

    delete(username) {
        var instance = this._.get(username);
        if (instance == undefined)
            return false;

        this._.delete(username);
        instance.kill();
        return true;
    }
}

exports = module.exports = { Instance, Instances };

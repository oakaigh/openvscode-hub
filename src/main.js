const path = require('path');
const uuid = require('uuid');

const https = require('https');

const express = require('express');
const express_vscode = require('./app');

const utils = require('./utils');

const url = require('url');


async function main(user_config) {
    const config = {
        executable: undefined,
        listener: undefined,
        tls: undefined,
        ...user_config
    };

    const server = new https.Server();

    express_vscode.initialize(express(), server, {
        executable: config.executable,
        service_name: 'login',
        routes: {
            login: '/login',
            logout: '/logout',
            home: '/'
        },
        session: {
            secret: uuid.v1()
        },
        socket_path: () => path.format({
            name: uuid.v1(),
            ext: '.sock'
        }),
        connection_token: () => uuid.v1()
    });

    async function init_tls(server, user_config) {
        const config = {
            ca: undefined,
            cert: undefined,
            key: undefined,
            sigalgs: undefined,
            ciphers: undefined,
            clientCertEngine: undefined,
            ...user_config
        };

        const sec_context = {};

        const promises = [];

        for (const name of [ 'ca', 'cert', 'key' ]) {
            if (config[name] == undefined)
                continue;

            promises.push(
                (async () => {
                    for await (const data of utils.url.resolve(
                        new url.URL(config[name]), {
                            'data:': {
                                enabled: true
                            },
                            'file:': {
                                enabled: true,
                                poll: true,
                                permissive: true,
                                dereference: false
                            }
                        }
                    )) {
                        sec_context[name] = data;
                        server.setSecureContext(sec_context);
                    }
                })()
            );
        }

        for (const name of [ 'sigalgs', 'ciphers', 'clientCertEngine' ]) {
            sec_context[name] = config[name];
        }

        return Promise.all(promises);
    }

    async function init_listener(server, user_config) {
        const config = {
            port: undefined,
            host: undefined,
            path: undefined,
            ...user_config
        };

        return server.listen(config, () => {
            console.info('listening on', server.address());
        });
    }

    await Promise.all([
        init_tls(server, config.tls),
        init_listener(server, config.listener)
    ]);
};

exports = module.exports = main;

const express = require('express');
const express_session = require('express-session');
const express_upgrade = require('express-upgrade');

const passport = require('passport');
const passport_pam = require('passport-pam');
const passport_http = require('passport-http');

const vscode = require('./server');


function initialize(app, server, user_options = {}) {
    const options = {
        executable: undefined,
        service_name: undefined,
        routes: {
            login: undefined,
            logout: undefined,
            home: undefined
        },
        session: {
            secret: undefined
        },
        socket_path: undefined,
        connection_token: undefined,
        ...user_options
    };
    const routes = options.routes;

    passport.serializeUser((username, done) => done(null, username));
    passport.deserializeUser((id, done) => done(null, id));
    passport.use('pam',
        new (passport_pam.Strategy(passport_http.BasicStrategy))(
            { challenge: true },
            { serviceName: options.service_name },
            (_req, username, _password, authenticated, done) => {
                return done(null, authenticated ? username : undefined);
            }
        )
    );

    app.use(
        express_session({
            secret: undefined,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: true },
            ...options.session
        })
    );
    app.use(
        passport.initialize(),
        passport.session()
    );

    app.use((req, _res, next) => {
        if (!req.session || !req.session.valid) {
            if (req.headers && req.headers.authorization) {
                delete req.headers.authorization;
            }
            req.session.valid = true;
        }
        return next();
    });

    app.get(routes.login,
        passport.authenticate('pam', { session: true }),
        (req, res, _next) => {
            req.session.valid = true;
            return res.redirect(routes.home);
        }
    );
    app.get(routes.logout,
        (req, res, _next) => {
            req.session.valid = false;
            req.logout();
            return req.session.destroy(() => {
                return res.redirect(routes.login);
            });
        }
    );
    app.use(
        (req, res, next) => {
            if (!req.user)
                return res.redirect(routes.login);
            return next();
        }
    );

    const instances = new vscode.Instances();

    const home = new express.Router();
    home.use(
        async (req, res, next) => {
            if (!req.user)
                return;

            const instance = instances.get(
                req.user,
                () => ({
                    executable: options.executable,
                    socket_path: options.socket_path(),
                    connection_token: options.connection_token()
                })
            );
            const handler = await instance.handle();

            req.originalUrl = undefined;

            return res.upgrade != undefined
                ? handler.upgrade(req, res.upgrade.socket, res.upgrade.head)
                : handler.request(req, res, next);
        }
    );
    app.use(routes.home, home);

    server.on('request', app);
    server.on('upgrade', express_upgrade(app));

    return app;
}

exports = module.exports = { initialize };

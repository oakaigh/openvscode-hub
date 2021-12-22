const http = require('http');


function upgrade(app) {
    return (req, socket, head) => {
        var res = new http.ServerResponse(req);

        res.assignSocket(socket);
        res.on('finish', () => {
            res.socket.destroy();
        });
        res.upgrade = { socket, head };

        return app(req, res);
    };
}

exports = module.exports = upgrade;

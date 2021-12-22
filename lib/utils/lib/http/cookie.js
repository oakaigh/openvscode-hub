const config = {
    header_name: 'cookie',
    parser: {
        delim: '=',
        sep: '; '
    }
};

function serialize(cookies) {
    const cookie_entries = [];
    for (const [name, value] of Object.entries(cookies)) {
        cookie_entries.push(
            [name, value].join(config.parser.delim)
        );
    }
    return cookie_entries.join(config.parser.sep);
}

function serialize_header(cookies) {
    return { [config.header_name]: serialize(cookies) };
}

exports = module.exports = { serialize, serialize_header };

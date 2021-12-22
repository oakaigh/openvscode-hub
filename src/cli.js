const process = require('process');

const yargs = require('yargs/yargs');
const yargs_helpers = require('yargs/helpers');

const fs = require('fs');

const main = require('./main');


const args = yargs(yargs_helpers.hideBin(process.argv))
    .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Configuration file'
    })
    .demandOption('config')
    .parse(process.argv);

main({
    executable: process.env.VSCODE_WEB_PATH,
    ...require('./config.json'),
    ...JSON.parse(fs.readFileSync(args['config']))
});

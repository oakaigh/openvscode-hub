const task = require('./lib/task');


class Build extends task.Environment {}

class Dist extends task.Environment {}

exports = module.exports = { Build, Dist };

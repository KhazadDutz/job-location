const events = require('events');
const instance = {};

module.exports = () => {
    if (!instance['events']) {
        instance['events'] = new events.EventEmitter();
    }
    return instance['events'];
}
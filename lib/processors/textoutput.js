const fs = require('fs');
const os = require('os');
const _ = require('lodash');

const MATCH_URL = /(\S+\.(com|net|org|edu|gov|de|au)(\/\S+)?)/g;

// Return an array of all the normal text messages
function getTextMessages(messages)
{
    return messages.filter(m => m.type === 'message');
}

function getMessages(messages)
{
    return getTextMessages(messages)
        .map( m => m.body )
        .filter( m => m )
        .map( m => m.trim() )
        .filter( m => m && m.trim().length )
        .filter( (m, i, a) => {
            // compress duplicate messages into 1
            // TODO: only compress if its the same users message
            return a.length < i + 1 || !(a[i + 1] === m);
        })
        .join('\n');
}

const Stats =
{
    title: "Output messages to txt file",

    run: function( answers )
    {
        fs.readFile(answers.input, 'utf8', (err, data) => {
            if (err) throw err;

            const messages = JSON.parse(data);

            const processed = getMessages(messages);

            fs.writeFileSync( 'noblanks.nodupes.txt', processed );
        });
    }
}

module.exports = Stats;
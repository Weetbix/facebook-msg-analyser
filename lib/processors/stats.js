const fs = require('fs');
const os = require('os');
const _ = require('lodash');

const MATCH_URL = /(\S+\.(com|net|org|edu|gov|de|au)(\/\S+)?)/g;


// Return an array of all the normal text messages
function getTextMessages(messages)
{
    return messages.filter(m => m.type === 'message');
}

function getWordCount(messages)
{
    return _.chain(getTextMessages(messages))
     .map(m => m.body)
     .join(' ')
     .toLower()
     .replace( MATCH_URL, '' )
     .words()
     .countBy()
          .map((value, key) => { return { word: key, count: value }; } )
     .sortBy('count')
     .reverse()
     .value();
}

const Stats =
{
    title: "Output general statistics",

    run: function( answers )
    {
        fs.readFile(answers.input, 'utf8', (err, data) => {
            if (err) throw err;

            const messages = JSON.parse(data);

            let stats = {
                TotalMessages : messages.length,
                Top100Words   : _.take(getWordCount(messages), 100)
            }

            console.log( JSON.stringify(stats, null, 2) );
        });
    }
}

module.exports = Stats;
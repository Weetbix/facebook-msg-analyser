var fs = require('fs');


const Stats =
{
    title: "Output general statistics",
    run: function( answers )
    {
        fs.readFile(answers.input, 'utf8', (err, data) => {
            if (err) throw err;

            const messages = JSON.parse(data);
            console.log( 'total messages: ' + messages.length );
        });
    }
}

module.exports = Stats;
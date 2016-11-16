const fs = require('fs');
const inquirer = require('inquirer');
const requireDir = require('require-dir');

// Load all the files in the processor folder as an object
const processors = requireDir('../lib/processors');

// Build a list of all our processors as options
const choices = Object.keys(processors)
    .map( key =>
    {
        return {
            name: processors[key].title,
            value: processors[key].run
        };
    } );

const questions =
[
    {
        type: 'input',
        name: 'input',
        message: 'Which file would you like to analyise',
        validate: value =>
        {
            const exists = fs.existsSync(value);
            if(exists)
            {
                return true;
            }

            return 'Please enter a valid file to analyse';
        }
    },
    {
        type: 'list',
        name: 'processor',
        message: 'What would you like to do',
        choices
    }
];


const answers = inquirer.prompt(questions)
    .then(answers =>
    {
        answers.processor(answers);
    });

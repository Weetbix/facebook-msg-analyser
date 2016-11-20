const fs = require('fs');
const _ = require('lodash');

const parse = require('fast-json-parse');
const dateFormat = require( 'dateformat' );
const officeClippy = require( 'office-clippy' );
const docx = officeClippy.docx;
const exporter = officeClippy.exporter;

// Return an array of all the normal text messages
function getTextMessages(messages)
{
    return messages.filter(m => m.type === 'message');
}

function getMessageForAttachmentType(name, attachment)
{
    switch(attachment.type)
    {
        case "sticker": return `${name} sent a sticker`;
        case "photo": return `${name} sent a photo`;
        case "animated_image": return `${name} sent a gif`;

        // Consider replacing body with just the text
        case "share": return `${name} shared a link`;
        case "file":
            if(attachment.name.startsWith("audioclip"))
                return `${name} sent a voice message`;
        case "video":
            return `${name} sent a video`;
    }
}

function preprocessMessage(message)
{
    // Replace body with messages for stickers/photos/images etc
    if( message.attachments && message.attachments.length > 0)
    {
        const attachment = message.attachments[0];
        const name = message.participantNames[0];

        let newMessage = getMessageForAttachmentType(name, attachment);
        message.body = newMessage;
    }
}

function preprocessMessages(messages)
{
    messages.forEach(m => preprocessMessage( m ));

    // Get the second persons name in the chat,
    // so we can give it a different style in the docx
    const secondPersonID = messages.find( m => m.senderID != messages[0].senderID )
                                    .senderID;

    // Add date attributes
    messages.forEach((m) =>
    {
        const date = new Date(m.timestamp);
        m.month = dateFormat( date, 'mmmm yyyy' );
        m.day = dateFormat( date, 'mmmm d yyyy' );
        m.isSecondPerson = m.senderID === secondPersonID;
    } );


    //group by month, and then day
    let groupedDay = _.groupBy( messages, 'day' );
    let groupedDayArray = Object.keys(groupedDay).map( (day) =>
    {
        return {
            timestamp :  groupedDay[ day ][0].timestamp,
            month : groupedDay[ day ][0].month,
            day : day,
            messages : groupedDay[ day ]
        };
    } );

    let groupedMonth = _.groupBy(groupedDayArray, 'month');
    let groupedMonthArray = Object.keys(groupedMonth).map( (month) =>
    {
        return {
            timestamp : groupedMonth[month][0].timestamp,
            month : month,
            days : groupedMonth[month]
        };
    } );

    groupedMonthArray = _.sortBy( groupedMonthArray, 'timestamp' );
    groupedMonthArray.forEach( (m) =>
    {
        m.days = _.sortBy( m.days, 'timestamp' );
    } );

    return groupedMonthArray;
}

function getMonthlyMessages(messages)
{
    const header = docx.createParagraph();
    header.title();
    header.addText( docx.createText( messages.month ) );

    return [
        header,
        ... messages.days.map(getDailyMessages)
    ];
}

function getDailyMessages(messages)
{
    const header = docx.createParagraph();
    header.heading1();
    header.addText( docx.createText( messages.day ) );

    return [
        header,
        ... messages.messages.map(getSingleMessages)
    ];
}

function getSingleMessages(message)
{
    const paragraph = docx.createParagraph();

    if( message.isSecondPerson )
    {
        paragraph.heading2();
    }
    paragraph.addText( docx.createText(message.body));
    return paragraph;
}

const DocxOutput =
{
    title: "Output messages to docx",

    run: function(answers)
    {
        fs.readFile(answers.input, 'utf8', (err, data) => {
            if (err) throw err;

            const json = parse(data).value;
            const messages = getTextMessages(json);
            const groupedMessages = preprocessMessages(messages);

            const doc = docx.create();

            const paragraphs = _.flattenDeep( groupedMessages.map( getMonthlyMessages ) );

            paragraphs.forEach( p => doc.addParagraph( p ) );

            const stream = fs.createWriteStream('./processed.docx');
            exporter.local(stream, doc);
        });
    }
}

module.exports = DocxOutput;
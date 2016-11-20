const fs = require('fs');
const _ = require('lodash');

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

const DocxOutput =
{
    title: "Output messages to docx",

    run: function(answers)
    {
        fs.readFile(answers.input, 'utf8', (err, data) => {
            if (err) throw err;

            const json = JSON.parse(data);
            const messages = getTextMessages(json);
            messages.forEach(m => preprocessMessage( m ));


            // Get the second persons name in the chat,
            // so we can give it a different style in the docx
            const secondPersonID = messages.find( m => m.senderID != messages[0].senderID )
                                           .senderID;

            const doc = docx.create();
            const paragraphs = messages.map( m =>
            {
                const paragraph = docx.createParagraph();

                if( m.senderID === secondPersonID )
                {
                    paragraph.heading2();
                }
                paragraph.addText( docx.createText(m.body));
                return paragraph;
            } );

            paragraphs.forEach( p => doc.addParagraph( p ) );

            const stream = fs.createWriteStream('./processed.docx');
            exporter.local(stream, doc);
        });
    }
}

module.exports = DocxOutput;
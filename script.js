const ImapC = require('imapc');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let EMAIL_DATA_PARSED

async function run(subject) {
    const config = {
        imap: {
            user: 'YOUR_EMAIL',
            password: 'YOUR_PASSWORD',
            host: 'imap.gmail.com',
            port: 993,
            tls: true
        }
    };

    const imap = new ImapC.ImapC(config);

    const result = await imap.connect();
    console.log("Connection result",result)
    const boxName = await imap.openBox();


    let markEmailasSeen = true // mark email as read if match is

    // default criteria is to search for new unseen emails
    const criteria = [];
    criteria.push('UNSEEN');
    criteria.push(['SINCE',new Date()]);
    if (subject) {
        criteria.push(['HEADER', 'SUBJECT', subject]);
    }

    let emails = await imap.fetchEmails(criteria,markEmailasSeen);

    while (emails.length < 1){
        console.log("Email has not arrived yet, will check again shortly")
        await sleep(5000); // how long to wait before searching for new emails
        emails = await imap.fetchEmails(criteria);
    }
    for (const email of emails) {
        // add logic to used with email found
        // console.log("Email body is",email.body)
        let match = email.body.match(/\d{8}/);
        EMAIL_DATA_PARSED = match[0]
        // to move emails to bin
        // deleteEmail = await imap.moveEmail(email.uid,'[Gmail]/Bin')
    }
    await imap.end();
}

// email subject to search
let subject = "test"

run(subject).then(function() {
    console.log("My data parsed from email is",EMAIL_DATA_PARSED)
})
.catch(e => {
    if (e.type && e.type === 'Step error') {
    console.log(JSON.stringify(e));
    }
    throw e.message;
});

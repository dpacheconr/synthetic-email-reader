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


    var durationInMinutes = 1;
    var to = Date.now()
    var since = new Date(to - durationInMinutes * 60000);


    // delete old emails before checking for new emails
    console.log("Checking for emails older than",since,"to delete")

    const deletecriteria = [];
    deletecriteria.push('ALL');
    deletecriteria.push(['SENTSINCE',since]);
    if (subject) {
        deletecriteria.push(['HEADER', 'SUBJECT', subject]);
    }

    let emailstodelete = await imap.fetchEmails(deletecriteria);
    console.log(emailstodelete.length)
    if (emailstodelete.length > 0){
        for (const emailtodelete of emailstodelete) {
            console.log("Deleting old email")
            // to move emails to bin
            deleteEmail = await imap.moveEmail(emailtodelete.uid,'[Gmail]/Bin')
        }
    
    } else {
        console.log("Not found any emails to delete")
    }
    
    console.log("Now waiting for new emails since",since)

    let markEmailasSeen = true // mark email as read if match is

    // default criteria is to search for new unseen emails
    const criteria = [];
    criteria.push('UNSEEN');
    criteria.push(['SINCE',since]);
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
        console.log("Email found")
        // let match = email.body.match(/\d{8}/);
        // OTP_CODE = match[0]

        // to move emails to bin
        deleteEmail = await imap.moveEmail(email.uid,'[Gmail]/Bin')
    }
    await imap.end();
}

// email subject to search
let subject = "One-time passcode (OTP)"

run(subject).then(function() {
    console.log("My code is ",OTP_CODE)
})
.catch(e => {
    if (e.type && e.type === 'Step error') {
    console.log(JSON.stringify(e));
    }
    throw e.message;
});


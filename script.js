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
            tls: true,
            tlsOptions: {rejectUnauthorized: false}
        }
    };

    const imap = new ImapC.ImapC(config);
    const result = await imap.connect();
    console.log("Connection result",result)
    const boxName = await imap.openBox('INBOX', false);

    var durationInMinutes = 1;
    var to = Date.now()
    var since = new Date(to - durationInMinutes * 60000);

    console.log("Checking for emails older than",since,"to delete")

    const deletecriteria = [];
    deletecriteria.push('ALL');
    // 'SENTSINCE' - Messages whose Date header (disregarding time and timezone) is within or later than the specified date. -> https://www.npmjs.com/package/imap
    deletecriteria.push(['SENTSINCE',since]);
    if (subject) {
        deletecriteria.push(['HEADER', 'SUBJECT', subject]);
    }

    let emailstodelete = await imap.fetchEmails(deletecriteria,true);
    console.log(emailstodelete.length)
    
    if (emailstodelete.length > 0){
        for (const emailtodelete of emailstodelete) {
            console.log("Marking old email as seen")

            // to move emails to bin
            await imap.addFlags(emailtodelete.uid,['\\Deleted']);
            await imap.expunge(emailtodelete.uid);
            }
    
    } else {
        console.log("Not found any emails to delete")
    }
    
    console.log("Waiting for new emails since",since)

    
    // default criteria is to search for new unseen emails
    const criteria = [];
    criteria.push('UNSEEN');
    criteria.push(['SINCE',since]);
    if (subject) {
        criteria.push(['HEADER', 'SUBJECT', subject]);
    }

    let emails = await imap.fetchEmails(criteria,true);

    while (emails.length < 1){
        console.log("Email has not arrived yet, will check again shortly")
        await sleep(5000); // how long to wait before searching for new emails
        emails = await imap.fetchEmails(criteria,true);
    }
    for (const email of emails) {
        // add logic to used with email found
        console.log("Email found")
        let match = email.body.match(/\d{8}/);
        let otpcode
        try {
          if (match) {
            otpcode = match[0]
          } else {
            match = email.body.match(/\d{7}/);
            otpcode = match[0]
          }
        }
        catch (e) {
        }
        EMAIL_DATA_PARSED = otpcode
        console.log("OTP code is",EMAIL_DATA_PARSED)

        // to move emails to bin

        await imap.addFlags(email.uid,['\\Deleted']);
        await imap.expunge(email.uid);
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


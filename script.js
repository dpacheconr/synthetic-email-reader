
const MailParser = require('mailparser');
var Imap = require('imap');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ImapC {
    constructor(config) {
        this.imap = new Imap(config.imap);
        this.debug = config.debug;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.imap.once('error', (err) => {
                reject(err);
            });
            this.imap.once('ready', () => {
                resolve('ready');
            });
            this.imap.connect();
        });
    }
    openBox(boxName = 'INBOX') {
        return new Promise((resolve, reject) => {
            this.imap.openBox(boxName, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(boxName);
            });
        });
    }
    end() {
        return new Promise((resolve) => {
            this.imap.once('close', () => {
                resolve('ended');
            });

            this.imap.end();
        });
    }
    _search(criteria) {
        return new Promise((resolve, reject) => {
            this.imap.search(criteria, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }
    fetchEmails(criteria) {
        return new Promise(async (resolve, reject) => {
            try {
                const emails = [];
                const results = await this._search(criteria);

                if (results.length === 0) {
                    return resolve(emails);
                }

                const fetch = this.imap.fetch(results, {
                    bodies: '',
                });

                let emailsProcessed = 0;
                fetch.on('message', async (msg, seqno) => {
                    const email = await this._processMessage(msg, seqno);
                    emails.push(email);

                    emailsProcessed++;
                    if (emailsProcessed === results.length) {
                        resolve(emails);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    _processMessage(msg, seqno) {
        return new Promise((resolve, reject) => {
            console.log("Processing msg",seqno)

            const email = {
                from_name: null,
                from_address: null,
                subject: null,
                date: null,
                body: null,
                files: [],
                seqno: seqno,
                uid: null,
            };
            const parser = new MailParser.MailParser();
            parser.on('headers', (headers) => {
                email.from_name = headers.get('from').value[0].name;
                email.from_address = headers.get('from').value[0].address.toLowerCase();
                email.subject = headers.get('subject');
                email.date = headers.get('date');

                console.log("Email found with below details \n",email)
            });

            parser.on('data', (data) => {
                if (data.type === 'attachment') {
                    const buffers = [];
                    data.content.on('data', (buffer) => {
                        buffers.push(buffer);
                    });

                    data.content.on('end', () => {
                        const file = {
                            buffer: Buffer.concat(buffers),
                            mimetype: data.contentType,
                            size: Buffer.byteLength(Buffer.concat(buffers)),
                            originalname: data.filename,
                        };

                        email.files.push(file);
                        data.release();
                    });
                } else if (data.type === 'text') {
                    email.body = data.text;
                }
            });

            parser.on('error', (err) => {
                reject(err);
            });

            parser.on('end', () => {
                resolve(email);
            });

            msg.on('body', function(stream) {
                stream.on('data', function(chunk) {
                    parser.write(chunk);
                });
            });
            msg.once('attributes', function(attrs) {
                email.uid = attrs.uid;
            });
            msg.once('end', () => {
                console.log("Finished msg",seqno)
                parser.end();
            });
        });
    }

}

async function run(subject) {
    const config = {
        imap: {
            user: 'YOUR-EMAIL-ADDRESS',
            password: 'YOUR-PASSWORD',
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
        }
    };

    const imap = new ImapC(config);
    const result = await imap.connect();
    console.log("Connection result",result)
    const boxName = await imap.openBox();
    console.log("Checking folder",boxName)

    // default criteria is to search for new unseen emails
    const criteria = [];
    criteria.push('UNSEEN');
    criteria.push(['SINCE',new Date()]);
    if (subject) {
        criteria.push(['HEADER', 'SUBJECT', subject]);
    }

    let emails = await imap.fetchEmails(criteria);

    while (emails.length < 1){
        console.log("Email has not arrived yet, will check again shortly")
        await sleep(5000); // how long to wait before searching for new emails
        emails = await imap.fetchEmails(criteria);
    }
    for (const email of emails) {
        // add logic to used with email found
        console.log("Email body is",email.body)
    }
    await imap.end();
}

// email subject to search
let subject = "test"

run(subject)
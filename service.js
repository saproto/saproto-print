var express = require('express');
var server = express();
var filesystem = require('fs');
var download = require('download');
var randomstring = require("randomstring");

var config = require('./config.js');

server.get('/', function (req, res) {

    // First, we get all needed data from the query string.
    var printername, urltoprint, secret, selectedprinter;

    try {

        // We only want authorized people to print, so we check the IP address.
        if (config.ips.indexOf(req.ip) < 0) {
            console.log('\nUnauthorized IP: ' + req.ip);
            res.send('UNAUTHORIZED');
            return;
        }

        // We encode everything with base64 to prevent strange characters from corrupting the URL.
        data = JSON.parse(new Buffer(req.query.data, 'base64').toString('ascii'));

        secret = data.secret;
        printername = data.printer;
        urltoprint = data.url;

        // Check if a valid printer was selected.
        if (printername == 'card') {
            selectedprinter = config.printers.card;
        } else if (printername == 'document') {
            selectedprinter = config.printers.document;
        } else {
            console.log('\nInvalid printer supplied: ' + printername);
            res.send('INVALID');
            return;
        }

        // We only want authorized people to print, so we check the secret.
        if (secret != config.secret) {
            console.log('\nInvalid secret supplied: ' + secret);
            res.send('UNAUTHORIZED');
            return;
        }

        console.log('\nPrintinging PDF to ' + selectedprinter + ' (' + printername + ') from the following location:\n' + urltoprint);

        // Save the file with a random filename.
        var filename = process.cwd() + '\\downloads\\' + randomstring.generate(32) + '.file';
        setTimeout(unLinkFile.bind(null, filename), 60000);

        var stream = download(urltoprint).pipe(filesystem.createWriteStream(filename));

        stream.on('finish', sendToPrinter.bind(null, filename, selectedprinter, res, config.sumatra));

    } catch (e) {

        // Something went wrong. This could be due to not all parameters being supplied!
        console.log('Genertic error: ' + e.message);
        res.send('ERROR_UNKNOWN');
        return;

    }

});

server.listen(config.port, config.host, function () {
    console.log('\nThe print server is now listening on port ' + config.port + '.')
});

function unLinkFile(filename) {
    try {
        filesystem.unlinkSync(filename);
        console.log("\nUnlinked " + filename + ".");
    } catch (e) {
        console.log("\nSomething went wrong unlinking " + filename + ".")
    }
}

function sendToPrinter(filename, printer, res, sumatra) {

    console.log('Downloaded ' + filename + '.');

    spawn = require('child_process').spawn;
    spawn(sumatra, [filename, '-print-to', printer]);

    res.send('OK');

}
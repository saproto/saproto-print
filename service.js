var printer = require('printer');
var express = require('express');
var server = express();
var filesystem = require('fs');
var download = require('download');
var randomstring = require("randomstring");

var config = require('./config.js');

console.log('\nThe following printers are available on this system.');
var printers = printer.getPrinters();
var cardprinter = null, documentprinter = null;
for (var i in printers) {
    var generic = true;
    if (printers[i].name == config.printers.document) {
        console.log('> Card printer: ' + printers[i].name + ' (' + printers[i].datatype + ')');
        generic = false;
    }
    if (printers[i].name == config.printers.card) {
        console.log('> Document printer: ' + printers[i].name + ' (' + printers[i].datatype + ')');
        generic = false;
    }
    if (generic) {
        console.log('> Unused printer: ' + printers[i].name + ' (' + printers[i].datatype + ')');
    }
}

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
        var filename = randomstring.generate(32) + '.file';
        setTimeout(unLinkFile.bind(null, filename), 60000);

        download(urltoprint).pipe(filesystem.createWriteStream('downloads/' + filename));
        console.log('Downloaded ' + filename + '.');

        res.send('OK');

        // Print the file.
        printer.printDirect({

            printer: selectedprinter,
            data: filesystem.readFileSync('downloads/' + filename),
            type: 'PDF',
            success: function (id) {
                console.log('Job started: ' + id + '.');
            },
            error: function (printerr) {
                console.log('Error printing: ' + printerr.message);
            }

        });

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
        filesystem.unlinkSync('downloads/' + filename);
        console.log("\nUnlinked " + filename + ".");
    } catch (e) {
        console.log("\nSomething went wrong unlinking " + filename + ".")
    }
}
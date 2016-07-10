var printer = require('printer');
var express = require('express');
var server = express();
var filesystem = require('fs');
var download = require('download');
var randomstring = require("randomstring");

var config = require('./config.js');

console.log('\nThe following printers are available on this system.\nThose prefixed with an asterisk may be used by clients.');
var printers = printer.getPrinters();
for (var i in printers) {
    console.log('> [' + (config.printers.indexOf(printers[i].name) > -1 ? '*' : ' ') + '] ' + printers[i].name + ' (' + printers[i].datatype + ')');
}

server.get('/', function (req, res) {

    // First, we get all needed data from the query string.
    var printername, urltoprint, secret;

    try {

        // We encode everything with base64 to prevent strange characters from corrupting the URL.
        printername = new Buffer(req.query.printer, 'base64').toString('ascii');
        urltoprint = new Buffer(req.query.url, 'base64').toString('ascii');
        secret = new Buffer(req.query.secret, 'base64').toString('ascii');

        // We only want authorized people to print, so we check the secret.
        if (secret != config.secret) {
            console.log('\nInvalid secret supplied: ' + secret);
            res.send('UNAUTHORIZED');
            return;
        }

        console.log('\nPrintinging PDF to ' + printername + ' from the following location:\n' + urltoprint);

        // Save the file with a random filename.
        var filename = randomstring.generate(32) + '.file';
        setTimeout(unLinkFile.bind(null, filename), 60000);

        download(urltoprint).pipe(filesystem.createWriteStream('downloads/' + filename));
        console.log('Downloaded ' + filename + '.');

        res.send('OK');

        // Print the file.
        printer.printDirect({

            printer: printername,
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

server.listen(config.port, function () {
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
# saproto-print
A small web-accessible print service that allows to print arbitrary PDF files over the internet for Windows. Uses the SumatraPDF executable to print via the command line.

## Configuration
Copy the `config.js.example` file to `config.js.example` and change the values. The `host` and `port` attributes are for socket binding, the `ips` attribute is an array of IP addresses (not ranges) that are allowed to connect to the service, and the `secret` attritubte provides an additional layer of security. The `card` and `document` printers are the printers the application will use to print membership cards and regular documents respectively. These need to be the full names. Don't forget to create a downloads folder in the services' directory.

## Usage
In order to send a print command to this server, first let the client software assemble an object with the following properties:

* `secret`: the print server secret.
* `url`: the URL to the PDF document that needs to be printed.
* `printer`: either `'card'` or `'document'`, depending on which printer the PDF should be printed to.

Any extra properties are ignored by the server. This object needs to be formatted as a JSON-encoded string, and then be base64 encoded. The print server can then be queried on the specified host and port using a HTTP GET request on `/`, with the `data` attribute in the query data set to the base64 encoded data.

The server will respond with any one of these strings:

* `UNAUTHORIZED`: either the wrong secret is used, or an unauthorized IP address is used.
* `INVALID`: an invalid printer type is passed.
* `ERROR_UNKNOWN`: an unknown error occured, this is most likely a server-side misconfiguration. Check the application log.
* `OK`: the PDF is successfully downloaded and locally stored, and printing of it is requested.

Even when `OK` is returned, there could still be errors with disconnected printers, ill-formatted PDF files and the likes. An `OK` doesn't guarantee that the document will correctly roll out of the printer. If something doesn't come out of the printer, check the application log.

## Example

A valid request to the server using the example config file looks like this.

```
> GET http://192.168.1.1:12345/?data=ew0KCSJzZWNyZXQiOiAiVGhpc1Rva2VuSXNOb3RTb1NlY3JldENoYW5nZUl0IiwNCgkidXJsIjogImh0dHA6Ly91bmVjLmVkdS5hei9hcHBsaWNhdGlvbi91cGxvYWRzLzIwMTQvMTIvcGRmLXNhbXBsZS5wZGYiLA0KCSJwcmludGVyIjogImRvY3VtZW50Ig0KfQ
< OK
```
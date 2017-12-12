var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
    name:'Proto Print Service',
    description: 'Remote printing functionality through webhook.',
    script: __dirname + '\\index.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    svc.start();
});

svc.install();
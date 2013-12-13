var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {
    console.log('Master started');
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

// Code to run if we're in a worker process
} else {
    var app = require('./app');
    console.log('Worker started');
}

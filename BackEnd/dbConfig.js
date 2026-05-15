const config = {
    user: '', //your database username
    password: '', //your database password
    server: 'localhost', //if your servername in SSMS is different, you also have to change here
    database: 'ThriveDb',
    options: {
        trustServerCertificate: true
    }
}

module.exports = config;
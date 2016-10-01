/**
 * Created by robbie on 01/10/16.
 */
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    authorize(JSON.parse(content), saveAuth);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

var authen = {};

function saveAuth(auth) {
    authen = auth;
    console.log("Authentication processed");
}

process.stdin.on('data', function (text) {
    var cmds = text.split(" ");
    if (cmds[0] === 'bal\n') {
        bal();
    }
    if (cmds[0] === 'currentmonth\n'){
        var date = new Date();
        calculateMonth(date.getMonth(), date.getFullYear());
    }
    if(cmds[0] === 'lastmonth\n'){
        var date = new Date();
        var newDate = date.getMonth()-1;
        var newYear = date.getFullYear();
        if(newDate === 0) {
            newDate = 12;
            newYear = newYear - 1;
        }
        calculateMonth(newDate, newYear);
    }
    if(cmds[0] === 'expense'){
        beginRowCreation(exp, cmds);
    }
    if(cmds[0] === 'income'){
        beginRowCreation(inc, cmds);
    }
});

var querySheet = function(range, funct){
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: authen,
        spreadsheetId: '1xdiZGJQTVJc8HHUksSKkMTfvnBFNZXTftYMwkgc5kKk',
        range: 'C5',
    }, function(err, response){
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        funct(response);
    });
}

var beginRowCreation = function(col, cmds){
    if(cmds[1] === undefined || cmds[2] === undefined){
        console.log("incorrect params");
        return;
    } else {
        var date = new Date();
        addNewRow(col, date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(), cmds[1], cmds[2]);
    }
}

var exp = ['F', 'H'];
var inc = ['I', 'K'];

var bal = function() {
    querySheet('C5', function(response){
        var rows = response.values;
        if (rows.length == 0) {
            console.log('Balance could not be found');
        } else {
            console.log("Balance: " + rows[0][0]);
        }
    });
}

var calculateMonth = function(month, year){
        querySheet('F4:G', function(response) {
            var monthlyTot = 0;
            var rows = response.values;
            if (rows.length == 0) {
                console.log('Month total could not be calculated');
            } else {
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var celldate = row[0].split("/");
                    if(year === parseInt(celldate[2]) && month === parseInt(celldate[1])){
                        monthlyTot = monthlyTot + row[1];
                    }
                }
                console.log("Spent "+ monthlyTot + ".");
            }
        });
}

var getTransactions = function(number){
    var transactions = [];
    querySheet('F4:H', function(response){
        querySheet('I4:K', function(response2){
            var expRows = response.values;
            var incRows = response2.values;
            for(var i = expRows.length-1; i <= 0; i--{
                for(var j = incRows.length-1; i <= 0; j--){
                    var expDate = expRows[i][0].split("/");
                    var incDate = incRows[j][0].split("/");

                    for(int k = 3; k >= 0; k++){
                        if(parseInt(expDate[k]) !== parseInt(expDate[k])){
                            if(parseInt(expDate[k]) < parseInt(expDate[k])){
                                transactions[]
                            }
                        }
                    }
                }
            }
        });
    });
}

var addNewRow = function(cols, date, amount, comment){
    querySheet('F4:G', function(response) {
        var rows = response.values;
        createRow(4 + rows.length, cols, date, amount, comment);
    });
}

var createRow = function(row, cols, date, amount, comment){
    console.log("row: " + row);
    var body = {
        majorDimension: "ROWS",
        "values": [
            [date, amount, comment]
        ]
    }
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.append({
        auth: authen,
        valueInputOption: "USER_ENTERED",
        spreadsheetId: '1xdiZGJQTVJc8HHUksSKkMTfvnBFNZXTftYMwkgc5kKk',
        range: 'Sheet1!'+ cols[0] + row + ':' + cols[1]  + row,
        resource: body,
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log("Successfully added");

    });
}

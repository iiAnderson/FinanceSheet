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
    if(cmds[0] === 'trans'){
        if(cmds[1] === undefined){
            console.log("invalid parameters");
            return;
        } else {
            getTransactions(parseInt(cmds[1]));
        }
    }
});

var querySheet = function(range, funct){
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: authen,
        spreadsheetId: '1xdiZGJQTVJc8HHUksSKkMTfvnBFNZXTftYMwkgc5kKk',
        range: range,
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
        addNewRow(col, [date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(), cmds[1], cmds[2]]);
    }
}

var exp = ['F', 'H'];
var inc = ['I', 'K'];
var dataSchema = ["Date", "Amount", "Comment"];
var spreadSheet = "";

function getDate(){
    return dataSchema.indexOf("Date");
}

function getAmount(){
    return dataSchema.indexOf("Amount");
}

function getComment(){
    return dataSchema.indexOf("Comment");
}

function bal() {
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

function addPrefix(arr, prefix){
    if(arr === undefined){
        return;
    }
    arr.forEach(function(fun){
        fun[3] = prefix;
    })
}

function getTransactions(number){
    var transactions = [];
    querySheet('F4:H', function(response){
        querySheet('I4:K', function(response2){
            var expRows = response.values;
            var incRows = response2.values;
            addPrefix(expRows, "EXP");
            addPrefix(incRows, "INC");
            while(transactions.length != number){
                    if(expRows === undefined && incRows.length !== 0){
                        if(incRows.length < number){
                            transactions = transactions.concat(incRows);
                            printTransactions(transactions);
                            return
                        } else {
                            transactions = transactions.concat(incRows.reverse().splice(0, number));
                            printTransactions(transactions);
                            return;
                        }
                    } else {
                        if(incRows === undefined && expRows.length !== 0){
                            if(expRows.length < number){
                                transactions = transactions.concat(expRows);
                                printTransactions(transactions);
                                return;
                            } else {
                                transactions = transactions.concat(expRows.reverse().splice(0, number));
                                printTransactions(transactions);
                                return;
                            }
                        }
                    }
                var expCell = parseDate(expRows[expRows.length-1][0]);
                var incCell = parseDate(incRows[incRows.length-1][0]);
                if(expCell.getTime() !== incCell.getTime()){
                    if(expCell.getTime() > incCell.getTime()){
                        transactions[transactions.length] = expRows.pop();
                    } else {
                        transactions[transactions.length] = incRows.pop();
                    }
                } else {
                    transactions[transactions.length] = expRows.pop();
                }
            }
            printTransactions(transactions);
        });
    });
}

function printTransactions(transactions){
    console.log("---------- Transactions -----------");
    transactions.forEach(function(t){
        console.log("[" + t[3] + "] " + t[getDate()] + " | £" + t[getAmount()] + " | " + t[getComment()]);
    })
}

function addNewRow(cols, dataSchema){
    querySheet('F4:G', function(response) {
        var rows = response.values;
        createRow(4 + rows.length, cols, dataSchema);
    });
}

function createRow(row, cols, dataSchema){
    console.log("row: " + row);
    var body = {
        majorDimension: "ROWS",
        "values": [
            dataSchema
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

function parseDate(input) {
    var parts = input.match(/(\d+)/g);
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}

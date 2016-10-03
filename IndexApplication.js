/**
 * Created by Robbie on 03/10/2016.
 */
$(document).ready(function () {
    $.when(
        $.getScript("sheets.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
    ).done(function () {

        function getDisplayTransactions(transactions) {
            return printTransactions(getTransactions(transactions));
        }

        function printTransactions(transactions) {
            var toPrint = "";
            console.log("---------- Transactions -----------");
            transactions.forEach(function (t) {
                toPrint += "[" + t[3] + "] " + t[getDate()] + " | £" + t[getAmount()] + " | " + t[getComment()] + "\n";
            });
            return toPrint;
        }

        console.log("hi");
        documennt.getElementbyId('transactionsDiv').innerHTML = getDisplayTransactions(2);

    });
});
$(document).ready(function () {

    let dataTable = $('.datatable');

    const wiki = "https://wiki.teamfortress.com/w/images/";

    //Configure jSuites Tags
    const userTags = jSuites.tags(document.getElementById('userTags'), { placeholder: 'Keywords' });

    const divOutput = $('#divOutput');
    const divResults = $("#divResults");
    const divCitations = $('#divCitations');

    $("#btnClear").on("click", clearWords);
    $("#btnSearch").on("click", searchQuotes);
    $('#btnGenerate').on("click", getSelectedQuotes);
    $('#selCharacter').change(() => { clearResults(); });

    clearResults();

    function highlightWord(word, text) {
        let regEx = new RegExp(word, "ig");
        let replaceMask = "<b>" + word.toUpperCase() + "</b>";

        return text.replaceAll(regEx, replaceMask);
    }

    function getRows(category, tag, array, caseSensitive) {

        //Replace space 160 to 32
        tag = tag.replaceAll(" ", " ");

        let rows = [];

        let quotes = array.filter(
            caseSensitive
                ? o => o.text.includes(tag)
                : o => o.text.indexOf(tag) != -1);

        for (let i = 0; i < quotes.length; i++)
            rows.push(printQuote(category, tag, quotes[i]));

        return rows;
    }

    function createRow(category, word, quote, audio, file) {
        return `<tr> 
        <td>                            
        <label class='form-check-label'><b>"${word}"</b></label>
        </td>
        <td>                            
        <label class='form-check-label'><i>${quote}</i></label>
        </td>
        <td><i>${category}</i></td> 
        <td>${audio}</td>                   
        <td>${file}</td>
    </tr>`
    }

    function printQuote(category, word, data) {
        var file = data.file + "." + data.type;
        var src = wiki + data.wiki + "/" + file;

        var audio = `<div>
                        <audio controls='controls' preload='none' style='max-width: 100%; width: 180px;'>
                            <source src=\"${src}\" type=\"audio/${data.type}\">
                        </audio>
                    </div>`;

        return createRow(category,word,highlightWord(word, data.text),audio,file);
    }

    function printResult(thisQuote, i) {

        let show = i == 0 ? "show" : "";
        let target = "collapse_" + i;
        let content = [];

        if (thisQuote.rows.length > 0) {
            for (let j = 0; j < thisQuote.rows.length; j++)
                content.push(thisQuote.rows[j]);
        }
        else {
            content.push(createRow("Not found", thisQuote.text, "No quotes were found", "", "nope.avi"));
        }

        return `<div class="accordion-item">
                    <h2 class="accordion-header" id="heading_${target}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${target}" aria-expanded="true" aria-controls="${target}">
                    <h3>"${thisQuote.text}"(${thisQuote.rows.length})</h3>
                    </button>
                    </h2>
                    <div id="${target}" class="accordion-collapse collapse ${show}" aria-labelledby="heading_${target}" data-bs-parent="#divResults">
                        <div class="accordion-body">
                            ${printTable("word_" + i, content.join(""))}
                        </div>
                    </div>
                </div>`;
    }
    function printTable(id, content) {
        return `<table id="${id}" class='datatable table table-hover white'>
        <thead>        
            <tr>
                <td style="width:10%"><b>Word</b></td>
                <td style="width:55%"><b>Quote</b></td>
                <td style="width:10%"><b>Category</b></td>
                <td style="width:20%"><b>Audio</b></td>
                <td style="width:5%"><b>File</b></td>
            </tr>
        </thead>
        <tbody>
        ${content}
        </tbody>
        </table>`;
    }
    function isValid(tags, commands, responses, taunts) {
        if (!commands && !responses && !taunts) {
            toastr["info"]("Select at least one category");
            return false;
        }

        if (tags.length == 1) {
            let word = tags[0].text.replaceAll(" ", "");

            if (word === "") {
                toastr["info"]("Enter at least one word");
                return false;
            }
        }

        if (tags.length > 200) {
            toastr["info"]("You must enter less than 200 words");
            return false;
        }

        for (let i = 0; i < tags.length; i++) {
            if (tags[i].text.length > 50) {
                toastr["info"]("Words must be less than 50 characters each");
                return false;
            }
        }

        return true;
    }
    function formatCitation(citation){
        let info_link = citation.split('|');

        if(info_link.length == 2){
            return `<p>${info_link[0]} <a href='${info_link[1]}' target='_blank'>${info_link[1]}</a></p>`;
        }
    }
    function searchQuotes() {

        clearResults();

        let html = [];
        let citations = [];
        let tags = userTags.getData();

        let taunts = $('#chkTaunts').is(':checked');
        let commands = $('#chkCommands').is(':checked');
        let responses = $('#chkResponses').is(':checked');

        if (!isValid(tags, commands, responses, taunts)) return;

        Loading(true);

        //Search JSON for results
        $.getJSON("./json/" + $('#selCharacter').val(), function (data) {

            let allQuotes = [];
            let caseSensitive = $('#rdbEnabled').is(':checked')
            
            if (commands) citations.push(formatCitation(data.character.citations.responses));
            if (responses) citations.push(formatCitation(data.character.citations.commands));
            if (taunts) citations.push(formatCitation(data.character.citations.taunts));

            for (let i = 0; i < tags.length; i++) {

                //Search for the word with or without case sensitive
                let thisQuote = allQuotes.find(
                    caseSensitive
                        ? o => o.text === tags[i].text
                        : o => o.text.toLowerCase() === tags[i].text.toLowerCase());

                //Only search if the word is not duplicated
                if (typeof thisQuote === "undefined") {

                    let rows = []

                    if (commands) rows = rows.concat(getRows("Commands", tags[i].text, data.character.commands, caseSensitive));
                    if (responses) rows = rows.concat(getRows("Responses", tags[i].text, data.character.responses, caseSensitive));
                    if (taunts) rows = rows.concat(getRows("Taunts", tags[i].text, data.character.taunts, caseSensitive));

                    thisQuote = { text: tags[i].text, rows: rows };

                    //Store the result
                    allQuotes.push(thisQuote);
                }

                html.push(printResult(thisQuote, i));
            }
        })
            .fail(function (textStatus, error) {
                var err = "Request Failed: " + textStatus.statusText;
                console.log(error, textStatus, err);
                toastr["error"](err);
                Loading(false);
            })
            .always(function () {
                divResults.html(wrapContent(tags.length > 1 ? "Words" : "Word", html.join("")));
                divCitations.html(wrapContent("Citations",`<div class='text-center'>${citations.join("")}</div>`));
                buildDataTable();
                goToId(divResults);
                Loading(false);
            });
    }
    function goToId(element) {
        $('html, body').animate({ scrollTop: element.offset().top }, 250);
    }
    function buildDataTable() {
        dataTable = $('.datatable').DataTable({
            "pageLength": 8,
            "autoWidth": false,
            responsive: true,
            "columnDefs": [{
                "targets": 0,
                "orderable": false
            }]
        });

        dataTable.on('click', 'tr', function () { $(this).toggleClass('selected'); });
        $('#btnGenerate').show();
    }

    function getSelectedQuotes() {
        divOutput.html("");

        let content = [];

        let tags = userTags.getData();
        let notSelected = 0;

        //you can select more than one audio per word in a single table
        for (let i = 0; i < tags.length; i++) {

            let selectedRows = $("#word_" + i).DataTable().rows('.selected').data();

            if (selectedRows.length > 0) {
                for (let j = 0; j < selectedRows.length; j++) {
                    content.push(`<tr>       
                                    <td>${selectedRows[j][0]}</td>     
                                    <td>${selectedRows[j][1]}</td>
                                    <td>${selectedRows[j][2]}</td>
                                    <td>${selectedRows[j][3]}</td>
                                    <td>${selectedRows[j][4]}</td>
                                </tr>`);
                }
            } else {
                content.push(createRow("---", tags[i].text, "<b class='text-danger'>Select a quote</b>", "---", "---"));
                notSelected++;
            }
        }

        if (notSelected > 0) {
            toastr["info"]("List generated, but not yet selected all the words.");
        } else {
            toastr["success"]("List generated");
        }

        let idTable = "generatedList";

        divOutput.html(wrapContent("Results", printTable(idTable, content.join(""))));

        idTable = "#" + idTable;

        if (!$.fn.DataTable.isDataTable(idTable)) { $(idTable).DataTable({ "ordering": false }); }

        goToId(divOutput);
    }

    function wrapContent(title, content) {
        return `<div class='mt-5'><h3 class='text-center'>${title}</h3>${content}</div>`
    }

    function clearWords() {
        userTags.reset();
        $("#userTags").focus();
    }

    function Loading(isLoading) {
        if (isLoading) {
            jSuites.loading.show();
            $("#btnSearch").html("<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span>&nbsp;Loading...");
            $("#btnSearch").prop('disabled', true);
        } else {
            jSuites.loading.hide();
            $("#btnSearch").text("Search");
            $("#btnSearch").prop('disabled', false);
        }
    }

    function clearResults() {
        divOutput.html("");
        divResults.html("");
        divCitations.html("");
        $('#btnGenerate').hide();
    }
});
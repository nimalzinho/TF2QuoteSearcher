$(document).ready(function () {

    let dataTable = $('.datatable');

    const wiki = "https://wiki.teamfortress.com/w/images/";
    const emptyContent = "---";

    // Configure jSuites Tags
    const userTags = jSuites.tags(document.getElementById('userTags'), {
        placeholder: 'Keywords...',
        
        // Mega Gambiarra! Wow! Much code! Very Stinky!
        // This code will put the cursor in a valid position
        onfocus: function() {        
            setTimeout(() => {
                // Try to grab the first element from the array            
                const value = userTags.getValue(0);
                                    
                if (value.length === 0) {
                    // Put the cursor inside the empty div
                    const $container = $('#userTags');
                    const $innerDiv = $container.find('div:first');

                    if ($innerDiv.length > 0) {
                            const elNativo = $innerDiv[0];
                            const range = document.createRange();
                            const sel = window.getSelection();
                    
                            range.setStart(elNativo, 0);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }                    
                    }                                    
            }, 10);
        }
    });

    const divOutput = $('#divOutput');
    const divResults = $("#divResults");
    const divCitations = $('#divCitations');

    setupControls();
    clearPreviousResults();    
    applyTheme();

    function highlightWordFromQuote(word, quoteText) {

        if (!quoteText || typeof quoteText !== "string") return "";        

        let regEx = new RegExp(word, "ig");
        let replaceMask = "<b>" + word + "</b>";

        return quoteText.replaceAll(regEx, replaceMask);
    }
    function getRowsFromArray(category, tag, array, caseSensitive) {

        if (array.length == 0) return [];

        // Replace space 160 to 32
        tag = tag.replaceAll(" ", " ");

        let rows = [];
        let quotes = [];

        if (caseSensitive){
            quotes = array.filter(o => o.text.includes(tag));     
        }else{
            let lowerCaseWord = tag.toLowerCase();
            quotes = array.filter((o) => o.text.toLowerCase().includes(lowerCaseWord));
        } 

        for (let i = 0; i < quotes.length; i++)
            rows.push(printHtmlTableRow(category, tag, quotes[i]));

        return rows;
    }
    function getCompleteUrl(wikiUrl, fileName){
        return wiki + wikiUrl + "/" + fileName;
    }
    function getFileName(quoteObj){

        if(!quoteObj || typeof quoteObj !== "object") return quoteObj;        

        if(quoteObj.type == "") return quoteObj.file;        

        return quoteObj.file + "." + quoteObj.type;
    }

    function printHtmlTableHeader(id, content) {
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
    function printHtmlAudioTag(completeUrl, typeName){

        if(typeName == "") return emptyContent;

        return `<div>
                        <audio controls='controls' preload='none' style='max-width: 100%; width: 180px;'>
                            <source src=\"${completeUrl}\" type=\"audio/${typeName}\">                            
                        </audio>
                        <small class='text-center'><i>this audio is property of<br><a href="https://www.valvesoftware.com/" target="_blank">Valve Corporation</a></i></small>
                    </div>`;
    }
    function printHtmlTableRow(categoryName, wordSearched, quoteObj) {
        let fileName = getFileName(quoteObj);
        let completeUrl = getCompleteUrl(quoteObj.wiki, fileName);
        let htmlAudio = printHtmlAudioTag(completeUrl, quoteObj.type);
        let quoteFound = highlightWordFromQuote(wordSearched, quoteObj.text);

        return `<tr>
                    <td>
                        <label class='form-check-label'><b>"${wordSearched}"</b></label>
                    </td>
                    <td>                            
                        <label class='form-check-label'><i>${quoteFound}</i></label>
                    </td>
                    <td><i>${categoryName}</i></td> 
                    <td>${htmlAudio}</td>                   
                    <td>${fileName}</td>
        </tr>`;
    }
    function printHtmlTableRowError(categoryName, wordSearched, errorMessage, fileName){
        let quote = {
                "type": "",
                "file": fileName,
                "text": errorMessage,
                "wiki": ""
            };
        
        return printHtmlTableRow(categoryName, wordSearched, quote);
    }

    function printHtmlAccordion(quote, i) {

        let show = i == 0 ? "show" : "";
        let target = "collapse_" + i;
        let content = [];

        if (quote.rows.length > 0) {
            for (let j = 0; j < quote.rows.length; j++)
                content.push(quote.rows[j]);
        }
        else {
            let row = printHtmlTableRowError("Not found", quote.text, "No quotes were found", "nope.avi");

            content.push(row);
        }

        return `<div class="accordion-item">
                    <h2 class="accordion-header" id="heading_${target}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${target}" aria-expanded="true" aria-controls="${target}">
                    <h3>"${quote.text}"(${quote.rows.length})</h3>
                    </button>
                    </h2>
                    <div id="${target}" class="accordion-collapse collapse ${show}" aria-labelledby="heading_${target}" data-bs-parent="#divResults">
                        <div class="accordion-body">
                            ${printHtmlTableHeader("word_" + i, content.join(""))}
                        </div>
                    </div>
                </div>`;
    }

    function printHtmlCitation(citation) {
        if (!citation || typeof citation !== "string") {
            return "";
        }

        let info_link = citation.split('|');

        if (info_link.length === 2) {
            let text = info_link[0].trim();
            let url = info_link[1].trim();
            
            return `<p class='pt-2'>${text} <a href='${url}' target='_blank'>${url}</a></p>`;
        }

        return "";
    }


    function showToastInfo(msg){
        toastr["info"](msg);
    }
    function showToastSuccess(msg){
        toastr["success"](msg);
    }
    function showToastError(msg){
        toastr["error"](msg);
    }
    function isUserInputValid(tags, commands, responses, taunts) {
        if (!commands && !responses && !taunts) {
            showToastInfo("Please select at least one category to proceed.");
            return false;
        }

        let enterAtLeastOneWord = "Please enter at least one word to continue.";

        if (tags.length == 0){
            showToastInfo(enterAtLeastOneWord);
            return false;
        }

        if (tags.length == 1) {
            let word = tags[0].text.replaceAll(" ", "");

            if (word === "") {
                showToastInfo(enterAtLeastOneWord);
                return false;
            }
        }

        if (tags.length > 200) {
            showToastInfo("The maximum word limit is 200. Please reduce the number of words.");
            return false;
        }

        for (let i = 0; i < tags.length; i++) {
            if (tags[i].text.length > 50) {
                showToastInfo("Each word must be less than 50 characters.");
                return false;
            }
        }

        return true;
    }

    function printHtmlCitationsFromData(data, searchForCommands, searchForResponses, searchForTaunts){
        let citationsToDisplay = [
            `<p><i>All the audio content is the property of <a href="https://www.valvesoftware.com/" target="_blank">Valve Corporation</a></i></p>`,
            `<p><i>All quotations are available at the following link(s):</i></p>`
        ];

        if (searchForCommands) citationsToDisplay.push(printHtmlCitation(data.character.citations.responses));
        if (searchForResponses) citationsToDisplay.push(printHtmlCitation(data.character.citations.commands));
        if (searchForTaunts) citationsToDisplay.push(printHtmlCitation(data.character.citations.taunts));
        
        return citationsToDisplay;
    }
    function printHtmlRowsFromData(tag, data, searchForCommands, searchForResponses, searchForTaunts, caseSensitive){
        let rows = []

        if (searchForCommands) rows = rows.concat(getRowsFromArray("Commands", tag, data.character.commands, caseSensitive));
        if (searchForResponses) rows = rows.concat(getRowsFromArray("Responses", tag, data.character.responses, caseSensitive));
        if (searchForTaunts) rows = rows.concat(getRowsFromArray("Taunts", tag, data.character.taunts, caseSensitive));        

        return rows;
    }

    function searchForQuotes() {

        clearPreviousResults();

        let tagsFromUser = userTags.getData();

        // Search JSON for results
        let characterJson = $('#selCharacter').val();
        if (characterJson == ""){
            loading(false);
            showToastInfo("Please select a Character.")
            return;
        }

        let urlToFetch = "./json/" + characterJson;

        let searchForTaunts = $('#chkTaunts').is(':checked');
        let searchForCommands = $('#chkCommands').is(':checked');
        let searchForResponses = $('#chkResponses').is(':checked');

        let isInputValid = isUserInputValid(tagsFromUser, searchForCommands, searchForResponses, searchForTaunts);

        if (!isInputValid) return;

        loading(true);

        let quotesToShowHtml = [];
        let citationsToShowHtml = [];

        $.getJSON(urlToFetch, function (data) {

            let quotesFound = [];
            let caseSensitive = $('#rdbEnabled').is(':checked')            
            
            for (let i = 0; i < tagsFromUser.length; i++) {

                // Search for the word with or without case sensitive
                let currentQuote = quotesFound.find(
                    caseSensitive
                        ? o => o.text === tagsFromUser[i].text
                        : o => o.text.toLowerCase() === tagsFromUser[i].text.toLowerCase());

                // Only search if the word is not duplicated
                if (typeof currentQuote === "undefined") {

                    let rows = printHtmlRowsFromData(tagsFromUser[i].text, 
                                                     data, 
                                                     searchForCommands, 
                                                     searchForResponses, 
                                                     searchForTaunts, 
                                                     caseSensitive);

                    currentQuote = { 
                            text: tagsFromUser[i].text, 
                            rows: rows 
                        };

                    // Store the result
                    quotesFound.push(currentQuote);
                }

                let accordion = printHtmlAccordion(currentQuote, i);

                quotesToShowHtml.push(accordion);
            }

            citationsToShowHtml = printHtmlCitationsFromData(data, 
                                                            searchForCommands, 
                                                            searchForResponses, 
                                                            searchForTaunts);
        })
            .fail(function (textStatus, error) {
                var err = "Request Failed: " + textStatus.statusText;
                console.log(error, textStatus, err);
                showToastError(err);
                loading(false);
            })
            .always(function () {
                
                divResults.html(printHtmlSector(tagsFromUser.length > 1 ? "Words" : "Word", quotesToShowHtml.join("")));
                divCitations.html(printHtmlSector("Citations",`<div class='text-center'>${citationsToShowHtml.join("")}</div>`));

                buildDataTable();
                moveUserToId(divResults);
                loading(false);
            });
    }
    
    function moveUserToId(element) {
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

        let tagsFromUser = userTags.getData();
        let notSelected = 0;

        // You can select more than one audio per word in a single table
        for (let i = 0; i < tagsFromUser.length; i++) {

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
                let errorMsg = "<b class='text-danger'>Select a quote</b>";
                let row = printHtmlTableRowError(emptyContent, tagsFromUser[i].text, errorMsg);

                content.push(row);
                notSelected++;
            }
        }

        notSelected > 0 ? showToastInfo("The list has been generated, but not all words have been selected yet.")
                        : showToastSuccess("Your list has been generated successfully.");
        
        let idTable = "generatedList";

        divOutput.html(printHtmlSector("Results", printHtmlTableHeader(idTable, content.join(""))));

        idTable = "#" + idTable;

        if (!$.fn.DataTable.isDataTable(idTable)) { $(idTable).DataTable({ "ordering": false }); }

        moveUserToId(divOutput);
    }
    function printHtmlSector(title, content) {
        return `<div class='mt-5'><h3 class='text-center'>${title}</h3>${content}</div>`
    }
    function clearWords() {
        userTags.reset();        
        $('#userTags').focus();
    }
    function loading(isloading) {                
        isloading ? jSuites.loading.show() : jSuites.loading.hide();          
        $("#btnSearch").prop('disabled', isloading);
    }
    
    function clearPreviousResults() {
        divOutput.html("");
        divResults.html("");
        divCitations.html("");
        $('#btnGenerate').hide();
    }
    
    function applyTheme(){                    
        const html = $('html');                
        const themeFromStorage = localStorage.getItem('theme');
        
        let theme = themeFromStorage;
        
        if (theme === null) {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = isDarkMode ? 'dark' : 'light';
        }

        html.attr('data-bs-theme', theme);
    }
    function setTheme(themeName) {
        themeName === 'auto' ? localStorage.removeItem('theme') 
                             : localStorage.setItem('theme', themeName);
        applyTheme();
    }
    
    function setupControls(){
        $("#btnClear").on("click", clearWords);
        $("#btnSearch").on("click", searchForQuotes);
        $('#btnGenerate').on("click", getSelectedQuotes);
        $('.dropdown-menu').on("click", ".dropdown-item", function() {
        
        const selectedTheme = $(this).data('theme');

        setTheme(selectedTheme);

        });

    $('#selCharacter').change(() => { clearPreviousResults(); });
    }
});

const wiki = "https://wiki.teamfortress.com/w/images/";
const debug = document.getElementById("divDebug");
const output = document.getElementById("divOutput");

function wrap(value) {return "<div class=\"col-lg-12 col-xxl-12 mb-6 p-3\">" + value + "</div>";}

function getSelectedQuotes() {
    let tables = document.getElementsByClassName("word");
    
    let selection = "";
    for (let i = 0; i < tables.length; i++) 
    {        
        let word = tables[i].getElementsByClassName("title")[0].innerText;
        let checkBoxes = tables[i].getElementsByTagName("INPUT");
        let labels = tables[i].getElementsByTagName("LABEL");
        
        let selected = 0;

        if(checkBoxes.length != labels.length)
            return;

        for (let j = 0; j < checkBoxes.length; j++) 
        {
            if (checkBoxes[j].checked) 
            {
                selection += word + " --- " + checkBoxes[j].value + " --- " + labels[j].innerText + "\n";
                selected++;
            }
        }

        if(selected == 0)
            selection += word + "\n";                
    }

    output.innerHTML = wrap(`<div class='form-group'>
                            <label for="txaOutput">Output</label>
                            <textarea class='form-control' id='txaOutput' rows="`+ tables.length +`">`+ selection +`</textarea>
                        </div>`);
}

$(document).ready(function(){

document.getElementById("btnSearch").addEventListener( "click", function( event ) {searchQuotes()}, false );

var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

function clear() 
{
    debug.innerHTML = "";
    output.innerHTML = "";
}
function p(value) {debug.innerHTML += value;}

function highlight(word, text){
    let regEx = new RegExp(word, "ig");
    let replaceMask = "<b class='text-primary'>" + word.toUpperCase() + "</b>";
    
    return text.replaceAll(regEx, replaceMask);
}

function getSelectedCategories(){
    return [
        document.getElementById("chkResponses").checked,
        document.getElementById("chkCommands").checked,
        document.getElementById("chkTaunts").checked
    ];    
}

function getWords(){
    let sentence =  document.getElementById("txtSentence").value;

    if(sentence.length == 0 || sentence.length > 500) return [""];
        
    //return (sentence.replace(/[^a-z-A-Z ]/g, "").replace(/  +/, " ").split(" ")).filter(() => { return true });
    return (sentence.split(" ")).filter(() => { return true });
}
function getUrl(){    
    return './js/' + document.getElementById("selCharacter").value;
}
function getRows(category, word, array){
    let quotes = [];

    if(word.length > 1)
    {
        let lowerCaseWord = word.toLowerCase();
        quotes = array.filter((o) => o.text.toLowerCase().includes(lowerCaseWord));
    }
    else
    {
        quotes = array.filter((o) => o.text.includes(word));
    }
     
    if(quotes.length <= 0) return "";            
    
    let rows = "";

    //rows += "<h6>" + category + ": " + quotes.length + "</h6>";

    quotes.forEach((data) => { rows += getRow(category, word, data)});        

    return rows;
}
function isValid(c, w){

    if(c[0] == false && c[1] == false && c[2] == false) {
            p(wrap("<div class='alert alert-info'><b>Check at least one category</b></div>"));
            return false;
    }

    if(w.length == 1 && w[0] == ""){
        p(wrap("<div class='alert alert-info'><b>Enter at least one word</b></div>"));
        return false;
    }

    if(w.length > 200){
        p(wrap("<div class='alert alert-info'><b>You must enter less than 200 words</b></div>"));
        return false;
    }  

    return true;
}
function getEmptyRow(){
    return `<tr> 
                <td></td>
                <td><i>Not found</i></td> 
                <td>No results</td>                        
                <td></td>
                <td></td>
            </tr>`;
}
function getRow(category, word, data){
    var file = data.file + "." + data.type;    
    var value = file;
    var src =  wiki + data.wiki + "/" + file;

return  `<tr>            
            <td>
                <input class='form-check-input' type='checkbox' value='${value}' onclick='getSelectedQuotes()'><label class='form-check-label'>&nbsp;${highlight(word, data.text)}</label>
            </td>
            <td>${category}</td>
            <td>
                <div>
                    <audio controls='controls' preload='none' width='180' style='max-width: 100%; width: 180px;'>
                        <source src=\"${src}\" type=\"audio/${data.type}\">
                    </audio>
                </div>
            </td>
            <td>
                <p>${file}</p>
            </td>
        </tr>`;
}
function getTable(word, rows){

    return `<div class='word'>
                <h3 class='title text-primary'>${word}</h3>
                    <table class='datatable table table-responsive table-striped'>
                    <thead>        
                        <tr>
                            <td><b>Quote</b></td>   
                            <td><b>Category</b></td>                                
                            <td><b>Audio</b></td>                  
                            <td><b>File</b></td>
                        </tr>
                    </thead>
                    <tbody>
                    ${rows}
                    </tbody>
                    </table>
            </div>`;
}
function searchQuotes(){
    
    clear();

    let categories =  getSelectedCategories();
    let words = getWords();    
    
    if(!isValid(categories, words)) return;

    let allResults = [];

    getJSON(getUrl(), function(err, data) {
        if (err !== null) 
        {
            alert('Something went wrong: ' + err);
        } 
        else 
        {
            words.forEach((word) => 
            {
                let rows = "";
                let thisWord = allResults.find(o => o.word === word);

                if(typeof thisWord === "undefined")
                {
                    if(categories[0]) rows += getRows("Responses", word, data.character.responses);
                    if(categories[1]) rows += getRows("Voice Commands", word, data.character.commands);
                    if(categories[2]) rows += getRows("Taunts", word, data.character.taunts);
                    if(rows === "") rows += getEmptyRow();

                    thisWord = { word:word, rows:rows };

                    allResults.push(thisWord);
                }
                else
                {
                    rows = thisWord.rows;
                }                                                                                      

                p(wrap(getTable(word,rows)));
            });
            
                //$('.datatable').DataTable();    
            
            
        }
    });    
}  

});
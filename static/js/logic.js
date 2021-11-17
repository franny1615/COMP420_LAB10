$(document).ready(function () {
    var dbValue = document.getElementById('dbselect').value;
    var tbValue = document.getElementById('tbselect').value;
    callDisplayTable(dbValue,tbValue);
});

let number_of_items = 0;
let number_per_page = 8;
let current_page = 1;
let number_of_pages = 0;
let column_names = null;
let column_data  = null;
let is_editing = false;
let cache = [];

function selectedDB(selectObject) {
    var dbValue = selectObject.value;
    cache = []; // clear any edits we were making
    is_editing = false;
    $.ajax({
        url:"/updatetablelist",
        type:"post",
        data: {db: dbValue},
        success: async function(response) {
            document.getElementById("tbselect").innerHTML = response;
            await new Promise(r => setTimeout(r, 500)); // give browser 500 milliseconds to process
            var tbValue = document.getElementById('tbselect').value; 
            callDisplayTable(dbValue,tbValue);
        },
        error: function(xhr) {
            document.getElementById("tbselect").innerHTML = "<option>couldn't load tables</option>";
        }
    });
}

function selectedTB(selectObject) {
    cache = []; // clear any edits we were making
    is_editing = false;
    var dbValue = document.getElementById('dbselect').value;
    var tbValue = selectObject.value;
    callDisplayTable(dbValue,tbValue);
}

function callDisplayTable(dbV, tbV){
    $.ajax({
        url:"/gettabledata",
        type:"post",
        data: {db: dbV, tb: tbV},
        beforeSend: function() {
            document.getElementById("displaytable").innerHTML = displayLoadingBar("Loading");
        },
        success: function(response) {
            if (response.query_result === "Success") {
                number_of_items = response.table_length;
                current_page = 1;
                number_of_pages = Math.ceil(number_of_items/number_per_page);
                column_names = response.column_names;
                column_data = response.table_data;
                buildTable();
            } else {
                document.getElementById("displaytable").innerHTML = "<h1>" + response.query_result + "</h1>";
            }
        },
        error: function(xhr) {
            document.getElementById("displaytable").innerHTML = "<h1>couldn't load table</h1>";
        }
    });
}

function displayLoadingBar(message) {
    var bar = 
    `
        <h3 style="text-align:center; width:100%;">`+message+`</h3>
        <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div>
        </div>
    `;
    return bar;
    
}

function buildTable() {
    var table = `<div style="width:100%;text-align:left;"><h3>Add New Entry:</h3></div>`;
    // new entry form added in first.
    table += `<table class="table table-dark" style="table-layout:fixed;width:100%;">`; // in the form of a table for a uniform look
    table += constructTHead();
    table += constructEmptyForm();
    table += `</table>`;
    // construct table html
    table += `<div style="width:100%;text-align:left;"><h3>Current Entries:</h3></div>`; 
    data   = buildPage(current_page, column_data, number_per_page); // helper method that gets a slice of all rows
    table += `<table class="table table-dark" style="table-layout:fixed;width:100%;">`;
    table += constructTHead();
    table += "<tbody>";
    for (let i = 0; i < data.length; i++) {
        table += `<tr id="` + "data_" + i + `">`;
            for(let j = 0; j < data[0].length; j++) {
                table += `<td id="table_data_`+i+'_'+j+`">` + `<input size="9" type="text" disabled="true" id="input_data_`+i+'_'+j+`" value="` + data[i][j] + `"></td>`;
            }
        table += `<td>
                    <button type="button" class="btn btn-outline-primary" onclick="editRow(`+i+`)"`+`id="editButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                        </svg>
                    </button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteRow(`+i+`)"`+`id="deleteButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                  </td>`
        table += `</tr>`;
    }
    table += `</tbody></table>`;
    table += `
        <nav aria-label="pagination">
            <ul class="pagination">
            <li class="page-item"><a class="page-link" href="#!" onclick="previousPage()">Previous</a></li>
            <li class="page-item"><a class="page-link" href="#!" onclick="nextPage()">Next</a></li>
            </ul>
        </nav>
    `;
    document.getElementById("displaytable").innerHTML = table;
}

function constructTHead() {
    var thead = `<thead><tr>`;
    for (let i = 0; i < column_names.length; i++) {
        thead += `<th scope="col">` + column_names[i] + `</th>`
    }
    thead += `<th scope="col">Actions</th>`
    thead += `</thead></tr>`;
    return thead;
}

function constructEmptyForm() {
    var tbody = `<tbody><tr>`;
    for(let i = 0; i < column_names.length; i++) {
        tbody += `<td>` + `<input size="9" type="text" id="new_entry_input_`+i+`"></td>`;
    }
    tbody += `<td style="text-align:center;">
                <button type="button" class="btn btn-outline-success" onclick="addNewEntry()"`+`id="newEntryButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-square" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                </button>
              </td>`;
    tbody += `</tbody></tr>`
    return tbody;
}

function buildPage(currPage, listArray, numberPerPage) {
    const trimStart = (currPage-1)*numberPerPage;
    const trimEnd = trimStart + numberPerPage;
    return listArray.slice(trimStart, trimEnd);
}

function previousPage() {
    if (current_page > 1) {
        current_page = current_page - 1;
        buildTable();
    }
}

function nextPage() {
    if (current_page < number_of_pages) {
        current_page = current_page + 1;
        buildTable();
    }
}

function editRow(index) {
    var dbValue = document.getElementById('dbselect').value;
    var tbValue = document.getElementById('tbselect').value;
    if (!is_editing) {
        cache = cacheData(index); // save original
        toggleInputDisable(true,index,cache);
        is_editing = true;
    } else {
        var j = 0;
        var data = cacheData(index); // data may have changed, recache
        $.ajax({
            url:"/updatetablerow",
            type:"POST",
            contentType: "application/json",
            data: JSON.stringify({
                columns: column_names, 
                values: data, 
                db: dbValue, 
                tb: tbValue, 
                cached_values: cache
            }),
            beforeSend: function() {
                document.getElementById("processing_query").innerHTML = displayLoadingBar("Processing Query");
            },
            success: function(response) { // on success that means server did the update, saved changes to db
                if(response.query_result === "Success") {
                    document.getElementById("processing_query").innerHTML = "";
                    toggleInputDisable(false,index,data); // display saved data
                    column_data[index] = data; // actually save it in local
                } else {
                    displayAlert(response.query_result);
                    toggleInputDisable(false,index,cache);
                }
            },
            error: function(xhr) {
                displayAlert("Couldn't Process Query");
                toggleInputDisable(false,index,cache); // display cached data
            }
        });
        is_editing = false;
    }
}

function displayAlert(message) {
    document.getElementById("processing_query").innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert" style="text-align:center;">` + message + `</div>`;
    setTimeout(function(){
        $('.alert').alert('close');
    }, 3000);
}

function cacheData(index) {
    var cache = [];
    var j = 0;
    for (let i = 0; i < column_names.length; i++) {
        tdIndex = index+'_'+j;
        var val = document.getElementById('input_data_'+tdIndex).value;
        cache.push(val);
        j = j + 1;
    }
    return cache;
}

function toggleInputDisable(enable, index, data) {
    var j = 0;
    for (let i = 0; i < column_names.length; i++) {
        tdIndex = index+'_'+j;
        var val = document.getElementById('input_data_'+tdIndex).value;
        if(enable) {
            document.getElementById('table_data_'+tdIndex).innerHTML = `<input size="9" type="text" id="input_data_`+index+'_'+j+`" value="` + data[i] + `">`;
        } else {
            document.getElementById('table_data_'+tdIndex).innerHTML = `<input size="9" type="text" disabled="true" id="input_data_`+index+'_'+j+`" value="` + data[i] + `">`;
        }
        j = j + 1;  
    }
}

function deleteRow(index) {
    var dbValue = document.getElementById('dbselect').value;
    var tbValue = document.getElementById('tbselect').value;
    var data = cacheData(index);
    $.ajax({
        url:"/deleterow",
        type:"POST",
        contentType: "application/json",
        data: JSON.stringify({
            columns: column_names, 
            values: data, 
            db: dbValue, 
            tb: tbValue
        }),
        beforeSend: function() {
            document.getElementById("processing_query").innerHTML = displayLoadingBar("Processing Query");
        },
        success: function(response) { // on success that means server did the update, saved changes to db
            if(response.query_result === "Success") {
                document.getElementById("processing_query").innerHTML = "";
                for (let i = 0; i < column_names.length; i++) {
                    data[i] = "DELETED"; // on next reload it just won't be there but while db data is cached in javascript
                }
                toggleInputDisable(false,index,data); // display saved data
                column_data[index] = data; // actually save it in local
            } else {
                displayAlert(response.query_result);
                toggleInputDisable(false,index,data);
            }
        },
        error: function(xhr) {
            displayAlert("Couldn't Process Query");
        }
    });
}

function addNewEntry() {
    var dbValue = document.getElementById('dbselect').value;
    var tbValue = document.getElementById('tbselect').value;
    var data = [];
    for (let i = 0; i < column_names.length; i++) {
        var val = document.getElementById('new_entry_input_'+i).value;
        data.push(val);
    }
    $.ajax({
        url:"/addNewEntry",
        type:"POST",
        contentType: "application/json",
        data: JSON.stringify({
            columns: column_names, 
            values: data, 
            db: dbValue, 
            tb: tbValue
        }),
        beforeSend: function() {
            document.getElementById("processing_query").innerHTML = displayLoadingBar("Processing Query");
        },
        success: function(response) {
            if (response.query_result === "Success") {
                clearInputsNewEntryForm();
                // add at index 0 push the rest forward the data
                column_data.splice(0,0,data); // 0 index, delete 0 items, insert data
                // rebuild table
                current_page = 1; // just so that user sees feedback
                buildTable();
                document.getElementById("processing_query").innerHTML = "";
            } else {
                displayAlert(response.query_result);
            }
        },
        error: function(xhr) {
            clearInputsNewEntryForm();
            displayAlert("Couldn't Process Query");
        }
    });
}

function clearInputsNewEntryForm() {
    for (let i = 0; i < column_names.length; i++) {
        document.getElementById('new_entry_input_'+i).value = "";
    }
}

function runSQLQuery() {
    var sql = document.getElementById('sql_query_input').value;
    if(sql !== "") {
        $.ajax({
            url:"/runSQLQuery",
            type:"POST",
            contentType: "application/json",
            data: JSON.stringify({
                SQL: sql 
            }),
            beforeSend: function() {
                document.getElementById("processing_query").innerHTML = displayLoadingBar("Processing Query");
            },
            success: function(response) {
                if (response.query_result === "Success") {
                    number_of_items = response.table_length;
                    current_page = 1;
                    number_of_pages = Math.ceil(number_of_items/number_per_page);
                    column_names = response.column_names;
                    column_data = response.table_data;
                    // rebuild table
                    current_page = 1; // just so that user sees feedback
                    buildTable();
                    document.getElementById("processing_query").innerHTML = "";
                } else {
                    displayAlert(response.query_result);
                }
            },
            error: function(xhr) {
                clearInputsNewEntryForm();
                displayAlert("Couldn't Process Query");
            }
        });
    }
}
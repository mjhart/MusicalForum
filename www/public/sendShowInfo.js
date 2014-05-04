window.addEventListener('load', function(){
    var showInfo = document.getElementById('showInfo');
    showInfo.addEventListener('submit', read_file, false);
    console.log("HELLO");
}, false);


function sendInfo(csv_string) {
    console.log("in send info");
    // prevent the page from redirecting
    //e.preventDefault();
    // create a FormData object from our form
    var fd = new FormData();
    var title = ("title",document.getElementById('title').value);
    var director = ("director",document.getElementById('director').value);
    var mdirector = ("mdirector",document.getElementById('mdirector').value);  
    var show_info = ("show_info",document.getElementById('show_info').value);
    var tmp_live_date = new Date(document.getElementById('p_live_at').value);
    var tmp_res_date = new Date(document.getElementById('r_live_at').value);
    var live_date = new Date(tmp_live_date);     
    var res_date = new Date(tmp_res_date);
    try{
        live_date.setHours(tmp_live_date.getUTCHours());
        res_date.setHours(tmp_res_date.getUTCHours());

        var p_live_at = ("p_live_at",live_date.toISOString());
        var r_live_at = ("r_live_at",res_date.toISOString());
    }
    catch(error){
        alert("Make sure to have filled in the dates! Your request was not submitted");
        return
    }
    var show_array = ("show_array",document.getElementById('show_array').innerHTML);
    var csv_string = ("csv_string",csv_string);
	console.log(p_live_at);
    
    values = {"title": title, "director": director, "mdirector" : mdirector, "show_info" : show_info,
               "p_live_at" : p_live_at, "r_live_at" : r_live_at, "show_array": show_array, "csv_string" : csv_string };
    
    if(live_date < res_date){
        alert("Make sure your live date is after your reserve date! Your request was not submitted");
    }
    else{
        post_to_url('new_show', values);
        // send it to the server
        /*var req = new XMLHttpRequest();
        req.open('POST', '/new_show', true);
        req.send(fd);*/

    }
}

function post_to_url(path, params) {
    method =  "post"; 

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

function read_file(e) { //read the file
    e.preventDefault(); // prevent the page from redirecting
    my_file = document.getElementById("myFile").files[0]; //save file
    console.log("in read file");
    

    if (window.FileReader) { //file reader is supporter
        get_text(my_file);
    } 
    else { // file reader is not supported --> error
        alert('ERROR: FileReader is not supported by your browser.');
    }
}

function get_text(file) {
    var file_reader = new FileReader(); // make a file reader 
    file_reader.readAsText(file); // read file into memory as UTF-8   
    file_reader.onload = load_handler;
    file_reader.onerror = error_handler;
    console.log("in get text");
    console.log(file);
    if(file == undefined){
        alert("You did not input a csv for reserves! Your request was not submitted");
    }
}

function load_handler(event) { //if no error occurs
    console.log("in load handler");
    var csv = event.target.result;
    parse_csv(csv);
}

function parse_csv(csv) {
    console.log("parse csv")
    var text = csv.split(/\r\n|\n/);
    var csv_data = [];
    text_length = text.length;
    i = 0;
    
    while(i < text_length){
        var data = text[i].split(';');
        var text_array = [];
        for (var j=0; j<data.length; j++) {
            text_array.push(data[j]);
        }
        csv_data.push(text_array);
        i=i+1;
    }
    console.log("csv_data="+csv_data);
    var csv_string = csv_data.toString();
    sendInfo(csv_string);

    
}

function error_handler(evt) { //in case of error
    alert("ERROR");
    if(evt.target.error.name == "NotReadableError") {
        alert("ERROR: cannot read this file");
    }
}
window.addEventListener('load', function(){
    var showInfo = document.getElementById('showInfo');
    showInfo.addEventListener('submit', read_file, false);
    console.log("HELLO");
}, false);


function sendInfo(csv_string) {
    // prevent the page from redirecting
    //e.preventDefault();
    // create a FormData object from our form
    var fd = new FormData();
    fd.append("title",document.getElementById('title').value);
    fd.append("director",document.getElementById('director').value);
    fd.append("mdirector",document.getElementById('mdirector').value);  
    fd.append("show_info",document.getElementById('show_info').value);
    var tmp_live_date = new Date(document.getElementById('p_live_at').value);
    var tmp_res_date = new Date(document.getElementById('r_live_at').value);
    var live_date = new Date(tmp_live_date);     
    var res_date = new Date(tmp_res_date);
    live_date.setHours(tmp_live_date.getUTCHours());
    res_date.setHours(tmp_res_date.getUTCHours());
    fd.append("p_live_at",live_date.toISOString());
    fd.append("r_live_at",res_date.toISOString());
    fd.append("show_array",document.getElementById('show_array').innerHTML);
    fd.append("csv_string",csv_string);
	alert(document.getElementById('show_array').innerHTML);
    
    if(live_date < res_date){
        alert("Make sure your live date is after your reserve date! Your request was not submitted");
    }
    else{
        // send it to the server
        var req = new XMLHttpRequest();
        req.open('POST', '/new_show', true);
        req.send(fd);
    }
}

function read_file(e) { //read the file
    e.preventDefault(); // prevent the page from redirecting
    my_file = document.getElementById("myFile").files[0]; //save file
    alert("here");

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
}

function load_handler(event) { //if no error occurs
    var csv = event.target.result;
    parse_csv(csv);
}

function parse_csv(csv) {
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
    if(evt.target.error.name == "NotReadableError") {
        alert("ERROR: cannot read this file");
    }
}
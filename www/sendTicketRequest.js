window.addEventListener('load', function(){     
    var ticketInfo = document.getElementById('ticketInfo');
    ticketInfo.addEventListener('submit', sendInfo, false);
}, false);


function sendInfo(e) {
    // prevent the page from redirecting
    e.preventDefault();
    // create a FormData object from our form
    // create a request
    var request = new XMLHttpRequest();

    var email = document.getElementById('email').value;
    var unformatted_date = document.getElementById('date').value;
    var formatted_date = format_date(unformatted_date); 

    // specify the type of request, URL, and flag
    var r = request.open('GET','/rtickets?email='+email+'&date='+formatted_date,true);   

    request.addEventListener('load', function(e){
        if (request.status == 200) {
            console.log("Request status 200");          
            // do something with loaded content
            var num_tickets = request.responseText;
            post_form(unformatted_date, parseInt(num_tickets));   
        }
        else {
            console.log("Request status not 200");              
            // something went wrong, check request status
            // hint 403 means forbidden, maybe forgot username
        }
        // Fill me in!
    }, false);

    request.send(null);   
}






   // post_form(unformatted_date);



function format_date(date) {    
    console.log("date "+ date);  
    var date_split = date.split(" ");
    var month = date_split[0];
    var month_num = "";
    months = [{ month:"January",number:"01"},{ month:"February",number:"02"},{ month:"March",number:"03"},{ month:"April",number:"04"},{ month:"May",number:"05"},{ month:"June",number:"06"},{ month:"July",number:"07"},{ month:"August",number:"08"},{ month:"September",number:"09"},{ month:"October",number:"10"},{ month:"November",number:"11"},{ month:"December",number:"12"}];
    for (var i = 0; i < months.length; i += 1) {
        if (months[i].month == month) {
            month_num = months[i].number;
        }
    }
    var day = date_split[1];
    var time = date_split[3];
    var time_split = time.split(":");
    if (date_split[4] == "PM") {
        time_split[0] = (parseInt(time_split[0]) + 12).toString();
    }
    time = time_split[0] + time_split[1];
    if (time.length == 3) {
        time = "0" + time;
    }

    date = month_num + day + time;  
    console.log("date "+ date);  
    return date;  
}

function post_form(date,num_tickets) {
    num_tickets = 4;    
    var height = (num_tickets*90)+50;
    document.getElementById('formbox').style.height = height.toString()+"px"; 
    var formbox2 = document.getElementById('formbox2');
    var form = document.createElement("form");
    formbox2.appendChild(form);
    form.id = "ticketForm";
    form.setAttribute('method',"POST");
    form.setAttribute('action',"/tickets");    
    var label = document.createElement("label");
    label.innerHTML = "You may reserve up to "+num_tickets+" tickets \n for "+date+".";
    form.appendChild(label);
    for (var i=0; i < num_tickets; i++) {
        var num = i+1;
        var input = document.createElement("input");
        input.setAttribute('type',"text");
        name_id = "name"+num.toString();
        input.setAttribute('name',name_id);
        input.setAttribute('id',name_id);
        input.setAttribute('placeholder','Ticketholder '+num.toString());  
        form.appendChild(input);      
    } 
    var s = document.createElement("input"); //input element, Submit button
    s.setAttribute('type',"submit");
    s.setAttribute('value',"Submit");  
    s.setAttribute('id','ticketholderInfo');
    s.style.backgroundColor = "#fcf";
    form.appendChild(s);  

    var ticketForm = document.getElementById('ticketForm');
    ticketForm.addEventListener('submit', sendTInfo, false);
    console.log("HELLO");   
}
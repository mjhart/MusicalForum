

function sendTInfo(e) {
    // prevent the page from redirecting
    e.preventDefault();
    
    var form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "/tickets");

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "email");
    hiddenField.setAttribute("value", document.getElementById('email').value);
    form.appendChild(hiddenField);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "date");
    hiddenField.setAttribute("value", format_date(document.getElementById('date').value));
    form.appendChild(hiddenField);

    var inputs = document.getElementsByTagName('input');
    var people = "";
    for (var i=2; i <inputs.length-1; i++) {
        if(inputs[i].value.length != 0) {
            people += ","        
            people += inputs[i].value;
        }
    }
    people = people.substring(1);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "people");
    hiddenField.setAttribute("value", people);
    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();
}





function format_date(date) {     
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
    return date;  
}
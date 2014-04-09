

function sendTInfo(e) {
    // prevent the page from redirecting
    e.preventDefault();
    // create a FormData object from our form
    var fd = new FormData();
    fd.append("email",document.getElementById('email').value);
    fd.append("date",document.getElementById('date').value);
    var inputs = document.getElementsByTagName('input');
    var people = "";
    for (var i=2; i <inputs.length-1; i++) {
        if(inputs[i].value.length != 0) {
            people += ","        
            people += inputs[i].value;
        }
    }
    people = people.substring(1);
    alert(people);
    fd.append("people",people);  

    // send it to the server
    var req = new XMLHttpRequest();
    req.open('POST', '/tickets', true);
    req.send(fd);
}

window.addEventListener('load', function(){
    //getAttendeeInfo();

    jQuery(".expandable-panel").click(function(event){
        var request = new XMLHttpRequest();


    var today = new Date();
    var date = event.target.id;
    // specify the type of request, URL, and flag
    var r = request.open('GET', '/attendee/' + date,true);

// This code will be executed when the page finishes loading
    request.addEventListener('load', function(e){
        
        if (request.status == 200) {
            //console.log("Request status 200");          
            // do something with loaded content
            var content = request.responseText;
            var info = JSON.parse(content);
            //var attendees = info['attendees'];
            var showGoers = new Array();
            for(var i in info){
                if(info[i].length != 0){
                    showGoers.push(info[i].name);
                }
            }
            //var attendees = showGoers.toString();
            var attendees = '';
            for(var i in showGoers){
                attendees += showGoers[i].toString()+', ';

            }
            
            // Get the substring so it is mmddtttt
            //date = date.substring(4);
            document.getElementById('attendees_'+date).innerHTML = attendees.substring(0,attendees.length-2);
        }
        else {
            console.log("Request status not 200");              
            // something went wrong, check request status
            // hint 403 means forbidden, maybe forgot username
        }
        // Fill me in!
    }, false);

    request.send(null);   








    }); 
}, false);


function getAttendeeInfo(obj) {
    // create a request
    
}


function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    if (tag != null)
        return tag.content;
    return '';
}


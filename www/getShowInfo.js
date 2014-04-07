window.addEventListener('load', function(){
    getInfo();
}, false);

function getInfo(e) {

    // create a request
    var request = new XMLHttpRequest();

    // specify the type of request, URL, and flag
    var r = request.open('GET', document.URL + '/new_show',true);

// This code will be executed when the page finishes loading
    request.addEventListener('load', function(e){
        if (request.status == 200) {
            console.log("Request status 200");          
            // do something with loaded content
            var content = request.responseText;
            var info = JSON.parse(content);

            var title = info['title'];
            var director = info['director'];
            var mdirector = info['mdirector'];
            var show_info = info['show_info'];
            var shows = info['show_array'];

            document.getElementById('ShowTitle').innerHTML = title;
            document.getElementById('DirectorInfo').innerHTML = director;
            document.getElementById('MDirectorInfo').innerHTML = mdirector;
            document.getElementById('ShowInfo').innerHTML = show_info;  

            var outer_div = document.getElementById("accordion");
            var div_children = outer_div.getElementsByTagName('div');
            var inner_div = document.createElement('div');

            inner_div.className = 'expandable-panel';
            inner_div.id = 'cp-'+div_children.length;
            
            inner_div.innerHTML = '<div class="expandable-panel-heading">'+'<h2>'+get_show_date(shows[div_children.length])+'<button id="cancel_show" class="num'
            +(div.children.length)+'" onclick="cancel(this)">Cancel</button></h2></div></div>';
            outer_div.appendChild(inner_div, outer_div.getElementsByTagName("div"));             

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


function get_show_date(show) {
    var show_date = "";
    for (var i=0; i<show.length; i++) {
        if ((show[i] == 't') && (show[i+1] == ':')) {
            return show_date;
        }
        else {
            show_date+=show[i]
        }
    }
}

/*
function send_request(){

    // create a request
    var request = new XMLHttpRequest();

    // specify the type of request, URL, and flag
    var r = request.open('GET', document.URL + '.json',true);

// This code will be executed when the page finishes loading
    request.addEventListener('load', function(e){
        if (request.status == 200) {
            console.log("Request status 200");          
            // do something with loaded content
            var content = request.responseText;
            var messages = JSON.parse(content);
            var ul = document.getElementById('messages');
            for (var i = ul.children.length; i < messages.length; i++) {
                var roomName = messages[i]['roomName'];
                var nickname = messages[i]['nickname'];
                var text = messages[i]['message'];

                var li = document.createElement('li');

                // Got the id and stored it in a variable called id, but used a more concise method of matching the two tweets for similarities.
                li.innerHTML = '<span id="nickname"><strong>' + nickname + ': </strong>' + text + "</span>";
                ul.appendChild(li, ul.getElementsByTagName("li"));          
            }
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
*/
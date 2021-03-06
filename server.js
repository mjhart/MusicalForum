var express = require('express');
var app = express();

app.use(express.bodyParser()); // definitely use this feature

var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://musicalforum.db');

var engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/www'); // tell Express where to find templates

app.use(express.static(__dirname + '/www/public'));

var date = new Date().toString();

//render staff home page
app.get('/staff_home_page', express.basicAuth('admin', 'admin'), function(request, response){
    response.render('staff_home_page.html');
});

app.get('/show_edit_late',function(request,response){
	response.render('show_edit_late.html');
})

app.get('/show_creation_success', function(request, response){
    response.render('show_creation_success.html');
});

app.get('/tickets_sold_out', function(request, response){
    response.render('tickets_sold_out.html');
});

app.get('/tickets_error', function(request, response){
    response.render('tickets_unknown_error.html');
});

app.get('/tickets_maxed_out', function(request, response){
    response.render('tickets_maxed_email.html');
});

app.get('/tickets_success', function(request, response){
    response.render('tickets_success.html');
});


app.get('/csvload/:date_time', function(req, res){
	res.sendfile(__dirname+'/'+req.params.date_time+'.csv');
});

app.post('/tickets', function(req, response) {
	var email = req.body.email;
	
	var old_date = parse_showtime(req.body.date);
	var date = parseDate(req.body.date);
	var people = req.body.people.split(",");

	var cur = new Date();

	// check that its not within 6 hours of show

	if(date.getTime() > cur.getTime() + 21600000) {
		conn.query("SELECT show_id FROM ShowInfo ORDER BY show_id DESC LIMIT 1")
		.on('row', function(row) {
			var id = row.show_id;
			conn.query("SELECT page_live_date FROM ShowInfo WHERE show_id = $1", [id])
			.on('row', function(row) {
				var show = new Date(row.page_live_date);
				if(cur.getTime() > show.getTime()) { // show is live

					// find p_id and num tickets for performance
					var sql = "SELECT p_id, tickets FROM Performances WHERE date_time = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)";
					conn.query(sql ,[old_date])
					.on('row', function(row) {
						var p_id = row.p_id;
						var numTix = row.tickets;

						// count total tickets already reserved for performance
						var sql = "SELECT * FROM Attendees WHERE p_id = $1";
						conn.query(sql ,[p_id])
						.on('end', function(res) {
							var p_count = res.rowCount;

							// count how many tickets to performance for this email
							conn.query("SELECT * FROM Attendees AS a, Performances AS p WHERE a.p_id = p.p_id AND a.email = $1 AND p.show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)", [email])
							.on('end', function(res) {
								var count = res.rowCount;
								var tix = Math.min(2-count, numTix - p_count);
								if(numTix - p_count <= 0) {
									response.redirect('/tickets_sold_out.html');
								}
								else if(people.length <= tix) {
									for(var i=0; i<people.length; i++) {
										var sql2 = "INSERT INTO Attendees VALUES($1, $2, $3)";
										conn.query(sql2, [p_id, people[i], email]);
									}
									response.redirect('/tickets_success.html');
								}
								else {
									response.redirect('/tickets_maxed_email.html');
								}
							});
						});
					});
				}
				else { // show is not live

					// check email is reserved
					var numTix = 0;
					conn.query("SELECT tickets_alloted FROM Reserves WHERE email = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)", [email])
					.on('row', function(row) {

						numTix = row.tickets_alloted;
					})
					.on('end', function(res) {
						if(numTix > 0) {

							// count already reserved tickets for email
							var sql = "SELECT * FROM Attendees WHERE email = $1 AND p_id IN (SELECT p_id FROM Performances WHERE show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1))";
							conn.query(sql, [email])
							.on('end', function(res) {
								var reserved = res.rowCount;
								if(reserved < numTix) {

									// get p_id and reserves of date/time and current show
									var found = false;
									var p_id;
									var numRes;
									var sql = "SELECT p_id, reserves FROM Performances WHERE date_time = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)";
									conn.query(sql ,[old_date])
									.on('row', function(row) {
										p_id = row.p_id;
										numRes = row.reserves;
										found = true;
									})
									.on('end', function(res) {

										if(found) {
											// count total tickets already reserved for performance
											var sql = "SELECT * FROM Attendees WHERE p_id = $1";
											conn.query(sql ,[p_id])
											.on('end', function(res) {
												var count = res.rowCount;
												var tix = Math.min(numRes-count, numTix-reserved)
												if(people.length <= tix) {
													for(var i=0; i<people.length; i++) {
														var sql2 = "INSERT INTO Attendees VALUES($1, $2, $3)";
														conn.query(sql2, [p_id, people[i], email]);
													}
													response.redirect('/tickets_success.html');
												}
												else {
													// show has no tickets left
													response.redirect('/tickets_sold_out.html');
												}
											});

										}
										else {
											response.redirect('/tickets_no_reserve.html');
										}
									});
								}
								else {
									response.redirect('/tickets_maxed_email.html');
								}
							});
						}
						else {
							response.redirect('/tickets_no_reserve.html');
						}
					});						
				}
			});
		});
	}
	else {
		response.redirect('/tickets_too_late.html');
	}
});


var fs = require('fs');
var csv = require('csv');

//when rendering editshow.html, check if the object passed in is an empty list, if it is populate as if a new show

app.get('/new_show', express.basicAuth('admin', 'admin') ,function(request, response){
	response.render('setup2.html');
});

//when editing, the object passed in will be two lists, one with show info and another with performance info

app.get('/edit_show', express.basicAuth('admin', 'admin'), function(request, response){
	var title = "";
	var director = "";
	var music_director = "";
	var show_info = "";
	var live_date = new Date();
	var reserve_date = new Date();
	var showinfo = {};
	var performances = [];
	var currshow = -1;
	d = new Date(); 
	var show_sql = 'SELECT show_id , reserve_live_date FROM ShowInfo ORDER BY show_id DESC LIMIT 1'
	var showq = conn.query(show_sql);
	showq.on('row', function(row){
		var liveDate = new Date(row.reserve_live_date);
		if(liveDate.getTime() > d.getTime()){
			currshow = row.show_id;
		}
		
	});
	showq.on('end',function(){
		if(currshow != -1){
			var sql = 'SELECT * FROM ShowInfo WHERE show_id = ' + currshow +';';
			var q = conn.query(sql);
			q.on('row', function(row){
				
				//var showinfo = {title : row.title, director : row.director, musical_director : row.mdirector, show_info : row.show_info,
				//	page_live : row.page_live_date, res_live : row.reserve_live_date};
				showinfo = row;
				
			});
			q.on('end', function(){
				var q1 = conn.query('SELECT * FROM Performances WHERE show_id = '+currshow+';');
				var counter = 0;
				q1.on('row', function(row){
					var r = {date_time : row.date_time, tickets : row.tickets, reserves : row.reserves, count : counter};
					counter = counter + 1;
					performances.push(r);
				});
				q1.on('end', function(){
					response.render('setup3.html', {info : showinfo, p : performances});
				});
			});
		}
		else{
			response.redirect("/show_edit_late.html");
		}
	});
});

app.get('/show', function(request, response){
	var performances = [];
	currshow = -1;
	lasttime = 0;
	d = new Date();
	var show_sql = 'SELECT show_id, reserve_live_date FROM ShowInfo ORDER BY show_id DESC LIMIT 1'
	var showq = conn.query(show_sql);
	var showinfo = {};

	showq.on('row', function(row){
		var liveDate = new Date(row.reserve_live_date);
		if(liveDate.getTime() < d.getTime() && liveDate.getTime() > lasttime){
			currshow = row.show_id;
			lasttime = row.reserve_live_date;
		}
	});
	showq.on('end', function(){
		if(currshow != -1){
			
			
			var sql = 'SELECT * FROM ShowInfo WHERE show_id = ' + currshow +';';
			var q = conn.query(sql);
			q.on('row', function(row){
				
				var title = row.title;
				var director = row.director;
				var music_director = row.musical_director;
				var show_info = row.show_info;
				//var showinfo = {title : row.title, director : row.directors, music_director : row.musical_director, show_info : row.show_info};
				showinfo = row;
				
				
			});
			q.on('end', function(){
				var q1 = conn.query('SELECT * FROM Performances WHERE show_id = '+currshow+';');
				var counter = 1;
				q1.on('row', function(row){
					var r = {date_time : row.date_time, tickets : row.tickets, reserves : row.reserves, count : counter};
					counter = counter + 1;
					//all info in p_info will be separately by newline, and the first line will be the performance time and id
					//var p_info = row.date_time;
					performances.push(r);
					/*var q2 = conn.query('SELECT name from Attendees WHERE p_id = '+row.p_id+';');
					q2.on('row',function(row){
						console.log(row);
						p_info += '\n'+row.name;

					});*/
					/*q2.on('end', function(){
						//performances.push(p_info);
					});*/

				});
				q1.on('end', function(){
					response.render('tickets2.html', {info : showinfo, p : performances});
				});
			});
		}
		else{
			response.redirect("/no_show.html");
		}
	});

});

app.get('/attendee/:date', function(request, response){
	var attendees = [];
	var sql = 'SELECT name FROM Attendees as a, Performances as p WHERE p.p_id = a.p_id and p.date_time = $1 AND p.show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)';
	var q = conn.query(sql, [request.params.date]);
	q.on('row', function(row){
		attendees.push(row);
	});
	q.on('end', function(){
		response.json(attendees);
	});
});


//Should only be called for people from reserve page
app.get('/rtickets', function(request, response){

	var old_date = parse_showtime(request.query.date);
	var date = parseDate(request.query.date);
	var email = request.query.email;
	var cur = new Date();

	if(date.getTime() > cur.getTime() + 21600000) {
		conn.query("SELECT show_id FROM ShowInfo ORDER BY show_id DESC LIMIT 1")
		.on('row', function(row) {
			var id = row.show_id;
			conn.query("SELECT page_live_date FROM ShowInfo WHERE show_id = $1", [id])
			.on('row', function(row) {
				var show = new Date(row.page_live_date);
				if(cur.getTime() > show.getTime()) { // show is live

					// find p_id and num tickets for performance
					var sql = "SELECT p_id, tickets FROM Performances WHERE date_time = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)";
					conn.query(sql ,[old_date])
					.on('row', function(row) {
						var p_id = row.p_id;
						var numTix = row.tickets;

						// count total tickets already reserved for performance
						var sql = "SELECT * FROM Attendees WHERE p_id = $1";
						conn.query(sql ,[p_id])
						.on('end', function(res) {
							var p_count = res.rowCount;

							// count how many tickets to performance for this email
							conn.query("SELECT * FROM Attendees AS a, Performances AS p WHERE a.p_id = p.p_id AND a.email = $1 AND p.show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)", [email])
							.on('end', function(res) {
								var count = res.rowCount;
								var tix = Math.min(2-count, numTix - p_count)
								if(tix > 0) {
									response.send(tix.toString());
								}
								else {
									response.send("0");
								}
							});
						});
					});
				}
				else { // show is not live


					// check email is reserved
					var numTix = 0;
					conn.query("SELECT tickets_alloted FROM Reserves WHERE email = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)", [email])
					.on('row', function(row) {

						numTix = row.tickets_alloted;
					})
					.on('end', function(res) {
						if(numTix > 0) {

							// count already reserved tickets for email
							var sql = "SELECT * FROM Attendees WHERE email = $1 AND p_id IN (SELECT p_id FROM Performances WHERE show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1))";
							conn.query(sql, [email])
							.on('end', function(res) {
								var reserved = res.rowCount;
								if(reserved < numTix) {

									// get p_id and reserves of date/time and current show
									var found = false;
									var p_id;
									var numRes;
									var sql = "SELECT p_id, reserves FROM Performances WHERE date_time = $1 AND show_id IN (SELECT show_id FROM ShowInfo ORDER BY show_ID DESC LIMIT 1)";
									conn.query(sql ,[old_date])
									.on('row', function(row) {
										p_id = row.p_id;
										numRes = row.reserves;
										found = true;
									})
									.on('end', function(res) {

										if(found) {
											// count total tickets already reserved for performance
											var sql = "SELECT * FROM Attendees WHERE p_id = $1";
											conn.query(sql ,[p_id])
											.on('end', function(res) {
												var count = res.rowCount;
												var tix = Math.min(numRes-count, numTix-reserved)
												if(tix > 0) {
													response.send(tix.toString());
												}
												else {
													response.send("0");
												}
											});

										}
										else {
											response.send("0");
										}
									});
								}
								else {
									response.send("0");
								}
							});
						}
						else {
							response.send("0");
						}
					});						
				}
			});
		});
	}
	else {
		response.send("0");
	}
	
});

app.get('/csv_page',function(request,response){
	var title = "";
	var director = "";
	var music_director = "";
	var show_info = "";
	var live_date = new Date();
	var reserve_date = new Date();
	var showinfo = {};
	var performances = [];
	var currshow = -1; 
	var show_sql = 'SELECT show_id FROM ShowInfo ORDER BY show_id DESC LIMIT 1'
	var showq = conn.query(show_sql);
	showq.on('row', function(row){
		currshow = row.show_id;
	});
	showq.on('end',function(){
		if(currshow != -1){
			var sql = 'SELECT * FROM ShowInfo WHERE show_id = ' + currshow +';';
			var q = conn.query(sql);
			q.on('row', function(row){
				
				//var showinfo = {title : row.title, director : row.director, musical_director : row.mdirector, show_info : row.show_info,
				//	page_live : row.page_live_date, res_live : row.reserve_live_date};
				showinfo = row;

				
			});
			q.on('end', function(){
				var q1 = conn.query('SELECT * FROM Performances WHERE show_id = '+currshow+';');
				var counter = 0;
				q1.on('row', function(row){
					var r = {date_time : row.date_time, tickets : row.tickets, reserves : row.reserves, count : counter};
					counter = counter + 1;
					performances.push(r);
				});
				q1.on('end', function(){
					response.render('csv_page.html', {info : showinfo, p : performances});
				});
			});
		}
		else{
			response.send("There is no show to edit");
		}
	});


})

app.get('/csv/:date', function(request, response){
	

	
	
	query_ans = '';

	var sql = 'SELECT name FROM Attendees as a, Performances as p WHERE p.date_time = $1 AND p.p_id = a.p_id';
	//var sql = 'SELECT * from Attendees';
	var q = conn.query(sql, [request.params.date]);
	q.on('row', function(row){
		query_ans += row.name+'\n';
	});
	q.on('end', function(){
		query_ans = query_ans.substring(0,query_ans.length);
	

		csv()
		.from.string(query_ans)
		.to.stream(fs.createWriteStream(__dirname+'/'+request.params.date+'.csv'))
		.on('record', function(row,index){
		})
		.on('close', function(count){	
		})
		.on('end', function(){
			setTimeout(function() {
				response.sendfile(__dirname+'/'+request.params.date+'.csv');
			},2000);	
		})
		.on('error', function(error){
			console.log(error.message);
		});
		
		

	});
	


});



app.post('/new_show', function(request, response){
	var title = request.body.title;
	var director = request.body.director;
	var mdirector = request.body.mdirector;
	var showinfo = request.body.show_info;
	var page_live = request.body.p_live_at;
	var reserve_live = request.body.r_live_at;
	var performance = request.body.show_array;
	var csv_string = request.body.csv_string;
	var live_date = new Date(page_live);
	var res_date = new Date(reserve_live);
	if(live_date.getTime() < res_date.getTime()){
		response.send("ERROR: live date must be after reserve date");
	}
	else{
		var curr_show = -1;
		q = conn.query('INSERT INTO ShowInfo VALUES (NULL, $1, $2, $3, $4, $5, $6);',[title,director,mdirector,showinfo,page_live,reserve_live]);
		q.on('end', function(){
			var sql = 'SELECT show_id FROM ShowInfo ORDER BY show_id DESC limit 1;'
			q1 = conn.query(sql);
			q1.on('row',function(row){
				curr_show = row.show_id;
			});
			q1.on('end', function(){
				var rs = csv_string.split(',');
				for(var j=0;j<rs.length - 1;j=j+3){
					q3 = conn.query('INSERT INTO Reserves VALUES ($1, $2, $3, $4);',[curr_show,rs[j],rs[j+2],rs[j+1]]).on('error', console.error);
				}
				var ps = performance.split(',');
				for(var i=0;i<ps.length;i=i+3){
					q2 = conn.query('INSERT INTO Performances VALUES ($1, NULL, $2, $3, $4);', [curr_show, ps[i], ps[i+1], ps[i+2]]).on('error', console.error);
					if(i + 3 == ps.length){
						setTimeout(function(){
							response.redirect('/show');
						},1000);
					}
					q2.on('end',function(){;

					});
				}
			});
		});
	}
});

function parseDate(str) {
	var d = new Date();
	d.setMonth(parseInt(str.substring(0,2))-1);
	d.setDate(parseInt(str.substring(2,4)));
	d.setHours(parseInt(str.substring(4,6)));
	d.setMinutes(str.substring(6,8));
	return d;
}

function parse_showtime(showtime) {

	var d = new Date();
	var year = d.getFullYear();
	var month = showtime.slice(0,2);
	var day = showtime.slice(2,4);
	var hour = showtime.slice(4,6);
	var minutes = showtime.slice(6,8)
	var am_pm = "AM";

	months = [{ month:"January",number:"01"},{ month:"February",number:"02"},{ month:"March",number:"03"},{ month:"April",number:"04"},{ month:"May",number:"05"},{ month:"June",number:"06"},{ month:"July",number:"07"},{ month:"August",number:"08"},{ month:"September",number:"09"},{ month:"October",number:"10"},{ month:"November",number:"11"},{ month:"December",number:"12"}];
	for (var i = 0; i < months.length; i += 1) {
		if (months[i].number == month) {
			month = months[i].month;
		}
	}
	if (hour > 12) {
		hour = hour-12;
		am_pm = "PM";
	}
	else {
		hour = hour.slice(1);
	}
	var show = (month + " " + day + " at " + hour + ":" + minutes + " " + am_pm); 
	return show;
}

app.listen(8080);
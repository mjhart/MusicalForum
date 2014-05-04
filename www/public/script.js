/*
Primary Author: Marco Kuiper (http://www.marcofolio.net/)

modifications by:
Jonathan Key
Lance Jabr
*/

// Speed of the automatic slideshow
var slideshowSpeed = 7000;

// Variable to store the images we need to set as background
// which also includes some text and url's.
var photos = [ {
		"image" : "photos/bg/rent3.jpg",
	}, {
		"image" : "photos/bg/nunsense.jpg",
	}, {
		"image" : "photos/bg/rent.jpg",
	}, {
		"image" : "photos/bg/fullmonty.jpg",
	}, {
		"image" : "photos/bg/itw1.jpg",
	}, {
		"image" : "photos/bg/nunsense2.jpg",
	}, {
		"image" : "photos/bg/itw2.jpg",
	}, {
		"image" : "photos/bg/rent4.jpg",
	}
];


$(document).ready(function() {
	//set the first photo holder
	var activeContainer = 1;	
	//start on a random picture
	var currentImg = Math.floor(Math.random()*photos.length);

	//this method takes us to the next picture 	
	var nextPic = function() {
		//advance to the next image
		currentImg++;
		if(currentImg == photos.length) {
			currentImg = 0;
		}

		// Check which container we need to use
		var currentContainer = activeContainer;
		if(activeContainer == 1) {
			activeContainer = 2;
		} else {
			activeContainer = 1;
		}
		
		//display the image
		showImage(photos[currentImg], currentContainer, activeContainer);
	};
	
	var currentZindex = -1;
	var showImage = function(photoObject, currentContainer, activeContainer) {
		// Make sure the new container is always on the background
		currentZindex--;
		
		// Set the background image of the new active container
		$("#headerimg" + activeContainer).css({
			"background-image" : "url(" + photoObject.image + ")",
			"display" : "block",
			"z-index" : currentZindex
		});
		
		// Fade out the current container
		// and display the header text when animation is complete
		$("#headerimg" + currentContainer).fadeOut(function() {
			setTimeout(function() {
				$("#headertxt").css({"display" : "block"});
			}, 500);
		});
	};
	
	// We should statically set the first image
	nextPic();
	
	// Start playing the animation
	setInterval(function(){nextPic();}, slideshowSpeed);
});

//this changes div heights to best suit the page
function fixDivHeight() {
	//find the height of the smallest thing on the page (one of the grey bars)
	var minHeight;
	if(document.getElementById('barb')){
		var barb = document.getElementById('barb');
		barb.style.height = (window.innerHeight - barb.offsetTop - document.getElementById('barcontainer').offsetTop) + 'px';
		minHeight = document.getElementById('barb').offsetHeight;
	} else {
		minHeight = document.getElementById('bar').offsetHeight;
	}
	var text = document.getElementById('text');
	text.style.height=Math.max(200, minHeight - 100, window.innerHeight-text.offsetTop - 100)+'px';
}

window.onload = fixDivHeight;
window.onresize = fixDivHeight;
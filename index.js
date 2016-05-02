//TYPED.JS animation
$(function() {
	$(".type-text").typed({
		strings:["<br> ^300Hi! <br><br> ^400We are Nina Sun, Brandon Choi, and Cosi Goldstein.<br> ^300Welcome to our final project for CS290: Digital 3D Geometry.<br><br> ^300Press 'ENTER' to continue<br>"],
		typeSpeed: 50,
	});
});

//KEYPRESS LISTENER for ENTER --> about.html
$(document).keypress(function(e) {
	if (e.which == 13) {
		window.location = "animation.html";
	}
});

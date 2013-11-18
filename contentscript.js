/* Visual settings */
// Size of smallest circle
var baseCircleHeight = 2;
var baseCircleWidth = 4;

// Control steepness of slope
// Note: Lower value = steeper slope
var baseDepthIncrementHeight = 10;
var baseDepthIncrementWidth = 16;

// Control curve of slopes
// 1 = linear slope (cone); less than 1 = concave (rounded); greater than 1 = convex (pointy)
var depthRateHeight = 0.97;
var depthRateWidth = 0.97;

// Controls parallax effect—how quickly the peak moves relative to the base
// Higher value = more dramatic effect
var perspectiveAdjustment = 0.008; 	

/* End visual settings */


var savedOnce;
var displayType;
var increment;
var contentIsVisible;
var staticView;
var secretMenu;
var scrolled = $(window).scrollTop();
var windowHalfSize = window.innerHeight / 2;
var wikilinks=new Array(); 			// Create array to store each wikilink object
var a = $("a[href^='/wiki']"); 		// Find all links pointing to other wikipedia articles

restoreOptions();

// Hide extraneous wikipedia elements
$("body").css({
	background:"white"
});
$("#toc").css({
	display: "none"
});
	$("#content.mw-body, #content.mw-body a, .mw-body div, .mw-code, .de1, .de1 span, .mw-body table, .mw-body tr, .mw-body td, .mw-body th, h2, h3, h4, .mw-editsection-bracket, .mw-editsection-divider, #content.mw-body ul, .thumbcaption, .thumb, .noprint, .rquote, .navbox, .catlinks, .external, .infobox").css({
		backgroundColor: "transparent"
	});

// Figure out how many backlinks each link has and call function to draw circles based on that info
function getSignificance(index) {
	var xhr = new XMLHttpRequest();

	var whatLinksHereURL = "/w/index.php?title=Special:WhatLinksHere/" + wikilinks[index][1] + "&limit=10000";

	xhr.open("GET", whatLinksHereURL, true);
	xhr.onreadystatechange = function() {

		if (xhr.readyState == 4) {
	    
		    // Grab everything from new article
		    var allContent = xhr.responseText;
		    var tempContent = allContent;

		    // Find the start position (the first <p>) of the paragraph we want
		    var nFirst=tempContent.indexOf('<ul id="mw-whatlinkshere-list">');
		    // Remove everything before start position, save it in new string
		    tempArticle = tempContent.substring(nFirst);
		    // Find the end position (the first </p>) of the paragraph
			var nLast=tempContent.indexOf("</ul>");
			// Remove everything after the end position, save it in a final string			
			tempContent = tempContent.substring(0,nLast);
			// Count number of <li> to determine number of links, save it to array
			wikilinks[index][2] = tempContent.match(/<li>/g).length;

			drawCircles(index);
  		};
	};
	xhr.send();

	// The regular expression produced a match, so notify the background page.
	chrome.extension.sendRequest({}, function(response) {});

};


// Draw circles for each link based on number of backlinks
function drawCircles(index) {

	// Add a circle object for each link
	// If there isn't a circle placholder yet, then add a new one	
	if ( $("#circle" + index).length == 0) {

		// Create circle objects for each link; more circles for more important links
		wikilinks[index][3] = Math.ceil(wikilinks[index][2] / increment);
		var circleHeight = baseCircleHeight;
		var circleWidth = baseCircleWidth;
		var circleObjects = "";
		var hybridOdd = true;

		// Math to find center location of link
		var linkPosition = wikilinks[index][0].position();
		var linkPosTop = linkPosition.top;
		var linkPosLeft = linkPosition.left;
		var linkHeight = wikilinks[index][0].height();
		var linkWidth = wikilinks[index][0].width();

		// Save vertical/horizontal center positions to array
		wikilinks[index][4] = linkPosTop + linkHeight/2;
		wikilinks[index][5] = linkPosLeft + linkWidth/2;

		// Reset depth increments when starting a new circle
		depthIncrementHeight = baseDepthIncrementHeight;
		depthIncrementWidth = baseDepthIncrementWidth;

		// Circles are drawn from the inside out
		for (var n=wikilinks[index][3]; n > 0; n--) {
			depthIncrementHeight = depthIncrementHeight * depthRateHeight; 
			depthIncrementWidth = depthIncrementWidth * depthRateWidth;

			// Set circle dimensions 
			circleHeight = circleHeight + depthIncrementHeight;
			circleWidth = circleWidth + depthIncrementWidth;

			// Save size of biggest circle
			if (n == 1) {
				wikilinks[index][6] = circleHeight;
			}

			circleObjects = "<span class='circle level_" + n + "' id='circle" + index + "'></span>";
			wikilinks[index][0].after(circleObjects);

			// Size and position circles
			$(".level_" + n + "#circle" + index).css({
		        position: "absolute",
		        top:  wikilinks[index][4],
		        left: wikilinks[index][5],
		        zIndex: -1000+2*n+1,
		        height: circleHeight,
		        width: circleWidth,
		        marginTop: -circleHeight/2,
		        marginLeft: -circleWidth/2,
			    borderTopLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
			    borderTopRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
			    borderBottomLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
			    borderBottomRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px",
		    });

			// Show fill color if fill is selected
		    if (displayType == "fill") {
				$("#content.mw-body").css({ background: "hsl(100, 60%, 80%)" });

	    		var bgHue = 100 - 3*n;
				var bgSat = 60;
				var bgLum = 80 + 2*n;
				if (n > 9) {
					bgLum = 98 - 2*(n-9);
				}

				// Style circles
				$(".level_" + n + "#circle" + index).css({ background: "hsla(" + bgHue + "," + bgSat + "%," + bgLum + "%, 1.0)" });		
		    }

			// Show hybrid styling if hybrid is selected
			if (displayType == "hybrid") {
	    		var bgHue = 100 - 2*n;
				var bgSat = 60;
				var bgLum = 100 - 2*n;

				if (n > 5) {
					bgLum = 90;
				}

				if (hybridOdd) {
					// For odd circles, show color
					$(".level_" + n + "#circle" + index).css({ background: "white" });
					hybridOdd = false;
				} else {
					// For even circles, show white
					$(".level_" + n + "#circle" + index).css({ background: "hsla(" + bgHue + "," + bgSat + "%," + bgLum + "%, 1.0)" });		
				    hybridOdd = true;
				}
			}

			if (displayType == "yellowHybrid") {
				if (hybridOdd) {
					// For odd circles, show white
					$(".level_" + n + "#circle" + index).css({ background: "white" });		
					hybridOdd = false;
				} else {
					// For even circles, show color
					$(".level_" + n + "#circle" + index).css({ background: "#d1b101" });
				    hybridOdd = true;
				}
			}

			if (displayType == "blackHybrid") {
				if (hybridOdd) {
					// For odd circles, show white
					$(".level_" + n + "#circle" + index).css({ background: "white" });		
					hybridOdd = false;
				} else {
					// For even circles, show color
					$(".level_" + n + "#circle" + index).css({ background: "black" });
				    hybridOdd = true;
				}

			}

		};
	};

	// If staticView is false, then set initial parallax effect
	if (!staticView) {
		moveCircles(index);
	}

};

function toggleWikiContent() {
	// If content is visible, hide it
	if (contentIsVisible) {  
		hideWikiContent();
	// If content is hidden, show it
	} else if (!contentIsVisible) {
		showWikiContent();
	}

}

// Hide content and update settings locally and globally
function hideWikiContent() {
	// Hide everything but title
	$("#content.mw-body, #content.mw-body a, .mw-body div, .mw-code, .de1, .de1 span, .mw-body table, .mw-body tr, .mw-body td, .mw-body th, h2, h3, h4, .mw-editsection-bracket, .mw-editsection-divider, #content.mw-body ul, .thumbcaption, .thumb, .noprint, .rquote, .navbox, .catlinks, .external, .infobox").css({
		color: "transparent",
		backgroundColor: "transparent",
		border: "none",
	});
	$("img, ul, .external, .mediaContainer, .reference-text, code").css({
		opacity: 0.0,
	});

	// Style title
	$(".firstHeading span").css({
		background: "white",
		position: "inherit",
	});
	$(".firstHeading").css({
		borderBottom: "none",
	});
	$("#siteSub").css({
		color: "black",
		background: "white",
	});	

	contentIsVisible = false;
	chrome.storage.sync.set({"contentIsVisible": false}, function() {});
};

// Show content and update settings locally and globally
function showWikiContent() {
	// Show everything
	$("#content.mw-body, #content.mw-body a, .mw-body div, .mw-code, .de1, .de1 span, .mw-body table, .mw-body tr, .mw-body td, .mw-body th, h2, h3, h4, .mw-editsection-bracket, .mw-editsection-divider, #content.mw-body ul, .thumbcaption, .thumb, .noprint, .rquote, .navbox, .catlinks, .external, .infobox").css({
		color: "black",
		backgroundColor: "transparent",
		border: "none"
	});
	$("img, ul, .external, .mediaContainer, .reference-text, code").css({
		opacity: 1.0,
	});
	$("#firstHeading, h2").css({
		borderBottom: "1px solid #aaa"
	});
	$(".infobox, .catlinks").css({
		border: "1px solid #aaa"
	});

	// Style title
	$(".firstHeading span").css({
		background: "transparent",
		position: "inherit",
	});
	$("#siteSub").css({
		color: "black",
		background: "transparent",
	});	

	contentIsVisible = true;
	chrome.storage.sync.set({"contentIsVisible": true}, function() {});
};


a.each(function (index) {

	$(this).attr("class","wikiLink");

	wikilinks[index] = new Array ( 
		$(this),  							// [0] wikilink object
		$(this).attr("href").substring(6),  // [1] wikilink href
		"",  								// [2] number of whatlinkshere links (set later)
		"",  								// [3] number of circles to create (set later)
		"",  								// [4] wikilink vertical center position (set later)
		"",  								// [5] wikilink horizontal center position (set later)
		""									// [6] size of biggest circle (set later)
	);

	// Only draw circles for wikipedia links that we think are in the main body of the article
	// Main body is currently defined as being exactly two levels below--child of a child--an object with id "mw-content-text"
	// Don't use any links that include a ":"

	// Filter out any links with a ":"
	if (wikilinks[index][0].attr("href").indexOf(":") == "-1") {
		// Only use links within the .mw-content.text div
		if (wikilinks[index][0].parents("div").attr("id") == "mw-content-text") {
			// Filter out any links in the Coordinates span
			if (wikilinks[index][0].parents("span").attr("id") == "coordinates") {
			// Filter out any links in the Reference list
			} else if (wikilinks[index][0].parents("div").attr("class") == "reflist") {
			// Finally, take the links that match criteria and do stuff with them
			} else {
				getSignificance(index);
			};
		};
	};

});

displayPanel();


// Insert menu into page
function displayPanel() {
	$("body").append('<div id="options"><div id="optionsHeader"><div id="optionsTitle">Topo</div><div id="optionsPanelToggle">+</div></div><form id="optionsForm"><div id="displayChoices"><input type="radio" name="displayChoice" id="fillRadio" value="fill"> Fill<br><input type="radio" name="displayChoice" id="hybridRadio" value="hybrid"> Stroke<br><input type="radio" name="displayChoice" id="noneRadio" value="none"> None</div><div id="displayChoicesHidden"><input type="radio" name="displayChoice" id="yellowHybridRadio" value="yellowHybrid"> Yellow Stroke<br><input type="radio" name="displayChoice" id="blackHybridRadio" value="blackHybrid"> Black Stroke</div><hr><br>Number of articles per layer:<br><input type="text" id="incrementField" value="50"><br><br><input type="checkbox" id="staticViewCheckbox" value="staticView"> Static View<br><br><button type="submit" id="optionsSaveButton">Save and Refresh</button><br><br><input type="checkbox" id="showArticleContentCheckbox""> Show Article Content<div id="optionsStatus"></div></form></div>');
}

$("#optionsHeader").click(function() {
	$("#optionsForm").slideToggle();
});


// Saves options to storage.
function saveOptions() {

	var status = document.getElementById("optionsStatus");
	var fillRadio = document.getElementById("fillRadio");
	var hybridRadio = document.getElementById("hybridRadio");
	var incrementField = document.getElementById("incrementField");
	var staticViewCheckbox = document.getElementById("staticViewCheckbox");

	status.innerHTML = "";

	// Figure out which displayType is selected and update storage with that info
	if (fillRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "fill"}, function() {});
	} else if (hybridRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "hybrid"}, function() {});
	} else if (noneRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "none"}, function() {});
	} else if (yellowHybridRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "yellowHybrid"}, function() {});
	} else if (blackHybridRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "blackHybrid"}, function() {});
	}

	// Secrets
	if (incrementField.value == "upupdowndown") {
		if (!secretMenu) { 
			$("#displayChoicesHidden").css("display","inline-block");
			incrementField.value = increment;
			chrome.storage.sync.set({"secretMenu": true}, function() {});
		}
		if (secretMenu) { status.innerHTML = status.innerHTML + "<font color='red'>Not a valid increment.</font>"; }
		return;
	// Form validation: Make sure increment input is a number
	} else if (isNaN(incrementField.value)) {
		status.innerHTML = status.innerHTML + "<font color='red'>Not a valid increment.</font>";
		return;
	// Form validation: Make sure increment is at least 10
	} else if (incrementField.value < 10) {
		status.innerHTML = status.innerHTML + "<font color='red'>Increment must be 10 or more.</font>";
		return;
	// If increment input is valid, update storage
	} else {
		chrome.storage.sync.set({"increment": incrementField.value}, function() {});
	}

	// Figure out whether to turn on static view (turn off parallax) and update storage with that info
	if (staticViewCheckbox.checked==true) {
		chrome.storage.sync.set({"staticView": true}, function() {});
	} else {
		chrome.storage.sync.set({"staticView": false}, function() {});
	}

	// savedOnce tracks whether the user has saved settings at least once, set it to true globally and locally upon save
	chrome.storage.sync.set({"savedOnce": true}, function() {});
	savedOnce = true;

	// Update status to let user know options were saved.
	status.innerHTML = "Options saved.";
	setTimeout(function() {
		status.innerHTML = "";
		$("#optionsForm").slideToggle();
		location.reload();
	}, 2000);

	
}

// Restores select box state to saved value from localStorage.
function restoreOptions() {
	chrome.storage.sync.get(['savedOnce', 'displayType', 'increment', 'contentIsVisible', 'staticView', 'secretMenu'], function(data) {
		savedOnce = data.savedOnce;
		displayType = data.displayType;
		increment = data.increment;
		contentIsVisible = data.contentIsVisible;
		staticView = data.staticView;
		secretMenu = data.secretMenu;

		if (displayType == "fill") { document.getElementById("fillRadio").checked=true;
			} else { document.getElementById("fillRadio").checked=false; }
		if (displayType == "hybrid") { document.getElementById("hybridRadio").checked=true;
			} else { document.getElementById("hybridRadio").checked=false; }
		if (displayType == "none") { document.getElementById("noneRadio").checked=true;
			} else { document.getElementById("noneRadio").checked=false; }
		if (displayType == "yellowHybrid") { document.getElementById("yellowHybridRadio").checked=true;
			} else { document.getElementById("yellowHybridRadio").checked=false; }
		if (displayType == "blackHybrid") { document.getElementById("blackHybridRadio").checked=true;
			} else { document.getElementById("blackHybridRadio").checked=false; }

		if (isNaN(increment)) { document.getElementById("incrementField").value = 50;
		} else { document.getElementById("incrementField").value = increment;
		}

		if (contentIsVisible) { 
			document.getElementById("showArticleContentCheckbox").checked=true;
		} else { 
			document.getElementById("showArticleContentCheckbox").checked=false;  
			hideWikiContent();
		}

		if (staticView) { 
			document.getElementById("staticViewCheckbox").checked=true;
		} else { 
			document.getElementById("staticViewCheckbox").checked=false;  

			// If staticView is false, then turn on bind parallax effect to scroll
			$(document).ready(function() {	
			    $(window).bind('scroll',function(e){
			    	scrolled = $(window).scrollTop();
					// Go through each wikilink...
					for (index = 0; index < wikilinks.length; index++) {
						moveCircles(index);
				    }
			    });
			});

		}

		if (secretMenu) { $("#displayChoicesHidden").css("display","inline-block"); }

		// If settings have never been saved, automatically set fill = true, increment = 50, contentIsVisible = true, staticView = false
		if (!savedOnce) {
			chrome.storage.sync.set({"displayType": "hybrid"}, function() {});
			chrome.storage.sync.set({"increment": 50}, function() {});
			displayType = "hybrid";
			document.getElementById("hybridRadio").checked=true;
			$("#optionsForm").slideToggle();
			increment = 50;
			contentIsVisible = true;
			staticView = false;
		} 

	});
}


// Move circles (parallax effect)
function moveCircles(index) {
	// Only apply parallax effect if the wikilink is within the window frame (with a little buffer)
	if ( ((wikilinks[index][4]) > scrolled) && (wikilinks[index][4] < (scrolled + windowHalfSize*2)) ) {
		// Adjust top position for each circle
		for (j = 0; j < wikilinks[index][3]+1; j++) {
			$("#circle" + index + ".level_" + j).css({
				// Find the link position. Figure out how far it is from the center of browser window, position individual circuits based on that distance
				//   link position       + (link position relative to (center of window))      * (perspective modifier)		 + "px"
				top: wikilinks[index][4] + (wikilinks[index][4] - (scrolled + windowHalfSize)) * (perspectiveAdjustment * j) + "px"
			});
		}
    
	}
}



document.querySelector('#optionsSaveButton').addEventListener('click', saveOptions);
document.querySelector('#showArticleContentCheckbox').addEventListener('click', toggleWikiContent);
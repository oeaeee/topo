// Search the article for #bodyContent and find all links pointing to other wikipedia articles
var a = $("a[href^='/wiki']");

var baseCircleHeight = 1;
var baseCircleWidth = 2;

var savedOnce;
var displayType;
var increment;
var hideArticleContent;
var secretMenu;

var scrolled = $(window).scrollTop();
var windowHalfSize = window.innerHeight / 2;

restore_options();

// Create array to store each wikilink object
var wikilinks=new Array(); 

// Hide extraneous wikipedia elements
$("body").css({
	backgroundColor: "white"
});
$("#toc").css({
	display: "none",
});
$(".mw-body div, .mw-body table, .mw-body tr, .mw-body td, .mw-body th, h2, h3, h4, .mw-editsection-bracket, .mw-editsection-divider, #content.mw-body ul, .thumbcaption, .thumb, .noprint, .rquote, .navbox, .mw-normal-catlinks, .external, .infobox").css({
	backgroundColor: "transparent",
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

		var depthIncrementHeight = 10;
		var depthIncrementWidth = 20;

		// Math to find center location of link
		var linkPosition = wikilinks[index][0].position();
		var linkPosTop = linkPosition.top;
		var linkPosLeft = linkPosition.left;
		var linkHeight = wikilinks[index][0].height();
		var linkWidth = wikilinks[index][0].width();

		// Save vertical/horizontal center positions to array
		wikilinks[index][4] = linkPosTop + linkHeight/2;
		wikilinks[index][5] = linkPosLeft + linkWidth/2;

		for (var n=wikilinks[index][3]; n > 0; n--) {
			depthIncrementHeight = depthIncrementHeight * 1.03;
			depthIncrementWidth = depthIncrementWidth * 1.03;

			// Circles are drawn from smallest to biggest, set circle dimensions 
			circleHeight = circleHeight + depthIncrementHeight;
			circleWidth = circleWidth + depthIncrementWidth;

			// If stroke is selected, create a second set of circles -- 'b' circles
			if (displayType == "stroke" || displayType == "blueStroke") {
				circleObjects = "<span class='circle level_" + n + "' id='circle" + index + "b'></span><span class='circle level_" + n + "' id='circle" + index + "a'></span>";				
			} else {
				circleObjects = "<span class='circle level_" + n + "' id='circle" + index + "a'></span>";
			}
			wikilinks[index][0].after(circleObjects);


			if (displayType == "stroke") {
				// Strokes are faked by using two circles; the 'a' circle covers most of the 'b' to fake a stroke				

				// Size and position 'b' circles
				$(".level_" + n + "#circle" + index + "b").css({
			        position: "absolute",
			        top:  wikilinks[index][4],
			        left: wikilinks[index][5],
			        zIndex: -1000+2*n,
			        // Height and width are slightly bigger to create offset
			        height: circleHeight + 4,
			        width: circleWidth + 4,
			        // Margins are slightly off to center appropriately
			        marginTop: -circleHeight/2 - 2, 
			        marginLeft: -circleWidth/2 - 2,
				    borderTopLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderTopRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderBottomLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderBottomRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px",
			    });

				if (n <= 10) { var strokeLum = 100-n}
				if (n > 10) { var strokeLum = 90 }
				// Fill 'a' circles with a white background to cover most of the 'b' circles
				$(".level_" + n + "#circle" + index + "a").css({ background: "white" });
			    // Fill 'b' circles with color
				$(".level_" + n + "#circle" + index + "b").css({ background: "hsl(0, 0%," + strokeLum + "%)" });		

			}

			if (displayType == "blueStroke") {
				// Strokes are faked by using two circles; the 'a' circle covers most of the 'b' to fake a stroke				
				$("#content.mw-body").css({ background: "#0c3b90" });

				// Size and position 'b' circles
				$(".level_" + n + "#circle" + index + "b").css({
			        position: "absolute",
			        top:  wikilinks[index][4],
			        left: wikilinks[index][5],
			        zIndex: -1000+2*n,
			        // Height and width are slightly bigger to create offset
			        height: circleHeight + 2,
			        width: circleWidth + 2,
			        // Margins are slightly off to center appropriately
			        marginTop: -circleHeight/2 - 1, 
			        marginLeft: -circleWidth/2 - 1,
				    borderTopLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderTopRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderBottomLeftRadius: circleWidth/2 + "px " + circleHeight/2 + "px", 
				    borderBottomRightRadius: circleWidth/2 + "px " + circleHeight/2 + "px",
			    });

				// Fill 'a' circles
				$(".level_" + n + "#circle" + index + "a").css({ background: "#0c3b90" });
			    // Fill 'b' circles
				$(".level_" + n + "#circle" + index + "b").css({ background: "white" });		

			}

			// Size and position 'a' circles
			$(".level_" + n + "#circle" + index + "a").css({
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

	    		var bgHueFill = 100 - 3*n;
				var bgSatFill = 60;
				var bgLumFill = 80 + 2*n;
				if (n > 9) {
					bgLumFill = 98 - 2*(n-9);
				}

				// Style 'a' circles
				$(".level_" + n + "#circle" + index + "a").css({ background: "hsla(" + bgHueFill + "," + bgSatFill + "%," + bgLumFill + "%, 1.0)" });		
		    }

			// Show hybrid styling if hybrid is selected
			if (displayType == "hybrid") {
				if (hybridOdd) {
		    		var bgHueFill = 100 - 2*n;
					var bgSatFill = 60;
					var bgLumFill = 100 - 2*n;

					if (n > 5) {
						bgLumFill = 90;
					}
					// For odd circles, show color
					$(".level_" + n + "#circle" + index + "a").css({ background: "hsla(" + bgHueFill + "," + bgSatFill + "%," + bgLumFill + "%, 1.0)" });		
					hybridOdd = false;
				} else {
					// For even circles, show white
					$(".level_" + n + "#circle" + index + "a").css({ background: "white" });
				    hybridOdd = true;
				}
			}

			if (displayType == "yellowHybrid") {
				if (hybridOdd) {
					// For odd circles, show color
					$(".level_" + n + "#circle" + index + "a").css({ background: "#d1b101" });		
					hybridOdd = false;
				} else {
					// For even circles, show white
					$(".level_" + n + "#circle" + index + "a").css({ background: "white" });
				    hybridOdd = true;
				}
			}

			if (displayType == "blackHybrid") {
				if (hybridOdd) {
					// For odd circles, show color
					$(".level_" + n + "#circle" + index + "a").css({ background: "black" });		
					hybridOdd = false;
				} else {
					// For even circles, show white
					$(".level_" + n + "#circle" + index + "a").css({ background: "white" });
				    hybridOdd = true;
				}

			}

		};
	};
	moveCircles(index);

};


function hideWikiContent() {
// Hide everything but title
	$("#content.mw-body, #content.mw-body a, .mw-body div, .mw-code, .de1, .de1 span, .mw-body table, .mw-body tr, .mw-body td, .mw-body th, h2, h3, h4, .mw-editsection-bracket, .mw-editsection-divider, #content.mw-body ul, .thumbcaption, .thumb, .noprint, .rquote, .navbox, .mw-normal-catlinks, .external, .infobox").css({
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
};


a.each(function (index) {

	$(this).attr("class","wikiLink");

	wikilinks[index] = new Array ( 
		$(this),  							// [0] wikilink object
		$(this).attr("href").substring(6),  // [1] wikilink href
		"",  								// [2] number of whatlinkshere links (set later)
		"",  								// [3] number of circles to create (set later)
		"",  								// [4] wikilink vertical center position (set later)
		""  								// [5] wikilink horizontal center position (set later)
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
	$("body").append('<div id="options"><div id="optionsHeader"><div id="optionsTitle">Topo</div><div id="optionsPanelToggle">+</div></div><form id="optionsForm"><div id="displayChoices"><input type="radio" name="displayChoice" id="strokeRadio" value="stroke"> Stroke<br><input type="radio" name="displayChoice" id="fillRadio" value="fill"> Fill<br><input type="radio" name="displayChoice" id="hybridRadio" value="hybrid"> Hybrid<br><input type="radio" name="displayChoice" id="noneRadio" value="none"> None</div><div id="displayChoicesHidden"><input type="radio" name="displayChoice" id="blueStrokeRadio" value="blueStroke"> Blue Stroke<br><input type="radio" name="displayChoice" id="yellowHybridRadio" value="yellowHybrid"> Yellow Hybrid<br><input type="radio" name="displayChoice" id="blackHybridRadio" value="blackHybrid"> Black</div><hr><br>Number of articles per layer:<br><input type="text" id="incrementField" value="50"><br><br><input type="checkbox" id="hideArticleContentCheckbox" value="hideArticleContent"> Hide Article Content<br><br><div id="optionsSaveButton">Save and Refresh</div><div id="optionsStatus"></div></form></div>');
}

$("#optionsHeader").click(function() {
	$("#optionsForm").slideToggle();
});


// Saves options to storage.
function save_options() {

	var status = document.getElementById("optionsStatus");
	var strokeRadio = document.getElementById("strokeRadio");
	var fillRadio = document.getElementById("fillRadio");
	var hybridRadio = document.getElementById("hybridRadio");
	var incrementField = document.getElementById("incrementField");
	var hideArticleContentCheckbox = document.getElementById("hideArticleContentCheckbox");

	status.innerHTML = "";

	// Figure out which displayType is selected and update storage with that info
	if (strokeRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "stroke"}, function() {});
	} else if (fillRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "fill"}, function() {});
	} else if (hybridRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "hybrid"}, function() {});
	} else if (noneRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "none"}, function() {});
	} else if (blueStrokeRadio.checked==true) {
		chrome.storage.sync.set({"displayType": "blueStroke"}, function() {});
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

	// Figure out whether to hide article content and update storage with that info
	if (hideArticleContentCheckbox.checked==true) {
		chrome.storage.sync.set({"hideArticleContent": true}, function() {});
	} else {
		chrome.storage.sync.set({"hideArticleContent": false}, function() {});
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
function restore_options() {

	chrome.storage.sync.get(['savedOnce', 'displayType', 'increment', 'hideArticleContent', 'secretMenu'], function(data) {
		savedOnce = data.savedOnce;
		displayType = data.displayType;
		increment = data.increment;
		hideArticleContent = data.hideArticleContent;
		secretMenu = data.secretMenu;

		if (displayType == "stroke") { document.getElementById("strokeRadio").checked=true;
			} else { document.getElementById("strokeRadio").checked=false; }
		if (displayType == "fill") { document.getElementById("fillRadio").checked=true;
			} else { document.getElementById("fillRadio").checked=false; }
		if (displayType == "hybrid") { document.getElementById("hybridRadio").checked=true;
			} else { document.getElementById("hybridRadio").checked=false; }
		if (displayType == "none") { document.getElementById("noneRadio").checked=true;
			} else { document.getElementById("noneRadio").checked=false; }
		if (displayType == "blueStroke") { document.getElementById("blueStrokeRadio").checked=true;
			} else { document.getElementById("blueStrokeRadio").checked=false; }
		if (displayType == "yellowHybrid") { document.getElementById("yellowHybridRadio").checked=true;
			} else { document.getElementById("yellowHybridRadio").checked=false; }
		if (displayType == "blackHybrid") { document.getElementById("blackHybridRadio").checked=true;
			} else { document.getElementById("blackHybridRadio").checked=false; }

		if (isNaN(increment)) { document.getElementById("incrementField").value = 50;
		} else { document.getElementById("incrementField").value = increment;
		}

		if (hideArticleContent) { 
			document.getElementById("hideArticleContentCheckbox").checked=true;
			hideWikiContent();
		} else { document.getElementById("hideArticleContentCheckbox").checked=false;  
		}

		if (secretMenu) { $("#displayChoicesHidden").css("display","inline-block"); }

		// If settings have never been saved, automatically set fill = true, increment = 50, hideArticleContent = false
		if (!savedOnce) {
			chrome.storage.sync.set({"displayType": "hybrid"}, function() {});
			chrome.storage.sync.set({"increment": 50}, function() {});
			displayType = "hybrid";
			document.getElementById("hybridRadio").checked=true;
			$("#optionsForm").slideToggle();
			increment = 50;
			hideArticleContent = false;
		} 

	});

}



$(document).ready(function() {	
	/* Scroll event handler */
    $(window).bind('scroll',function(e){
    	scrolled = $(window).scrollTop();

		// For each wikilink... 
		for (i = 0; i < wikilinks.length; i++) {
	    	moveCircles(i);
	    }

    });
});

function moveCircles(i) {

	// Adjust top position for each of it's circles
	for (j = 0; j < wikilinks[i][3]+1; j++) {
		var perspectiveAdjuster = 0.012 * (j^(1/20)) ;

		$("#circle" + i + "a.level_" + j).css({
			top: wikilinks[i][4] + (wikilinks[i][4] - (scrolled + windowHalfSize)) * perspectiveAdjuster + "px"
		});
	}
}


document.querySelector('#optionsSaveButton').addEventListener('click', save_options);
var baseURL = window.location.href.substring(0, window.location.href.length-10);
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var words = [];
var pointsTable = {};
var rackPoints = 0;

function main() {
	$.get(baseURL+"static/points.txt", function(data) {
		var pointsList = data.split("\n");
		for(var i=0; i<pointsList.length; i++) {
			var points = parseInt(pointsList[i].split(": ")[0]);
			letterList = pointsList[i].split(": ")[1].split(", ");
			for(var j=0; j<letterList.length; j++) pointsTable[letterList[j]] = points;
		}
	});
	$.get(baseURL+"static/words.txt", function(data) {
		words = data.split("\n");
	});
}
main();

function makeCaps(element) {
	element.value = element.value.toUpperCase().substring(0, 1);
}

function getPoints(word) {
	var points = 0;
	for(var i=0; i<word.length; i++) {
		points += pointsTable[word[i]];
	}
	return points;
}

function updateBoard(word, points) {
	document.getElementById("board").innerHTML = "<em>THE BOARD (POINTS EARNED: " + points + ")</em>";
	document.getElementById("rack").innerHTML = "<em>YOUR RACK (AVAILABLE POINTS: " + (rackPoints-points) + ")</em>";

	//modify board colors
	var boardString = "";
	for(i=1; i<=10; i++) {
		ch = document.getElementById("board-"+i).value;
		if(ch !== undefined && ch !== "") boardString += ch;
		else boardString += " ";
	}
	var matches = boardString.match(/\w+/);
	if(matches) index = boardString.indexOf(matches[0]) - word.indexOf(matches[0]);
	else index = 0;
	for(i=0; i<word.length; i++) {
		var el = document.getElementById("board-"+(index+i+1));
		if(el.value === undefined || el.value === "") {
			el.value = word[i];
			el.parentElement.style.background = "#5A6351";

			//modify rack colors
			for(j=1; j<=7; j++) {
				var newEl = document.getElementById("rack-"+j);
				if(el.value == newEl.value && el.parentElement.style.background != "#FF0000") {
					newEl.parentElement.style.background = "#FF0000";
					break;
				}
			}
		}
	}

	//update button
	document.getElementById("button").innerHTML = "RESET BOARD";
	document.getElementById("button").onclick = function() { resetBoard(); };
}

function updateRack(element) {
	makeCaps(element);
	var points = 0;
	for(var i=1; i<=7; i++) {
		var ch = document.getElementById("rack-"+i).value;
		if(ch !== undefined && ch !== "") points += pointsTable[ch];
	}
	rackPoints = points;
	document.getElementById("rack").innerHTML = "<em>YOUR RACK (AVAILABLE POINTS: " + points + ")</em>";
}

function findMatches(regEx) {
	var bestWord = "";
	var maxPoints = 0;
	var alphaCount = {};
	for(var i=0; i<26; i++) alphaCount[alphabet[i]] = 0;
	var boardPoints = 0;
	for(i=1; i<=10; i++) {
		var ch = document.getElementById("board-"+i).value;
		if(ch !== undefined && ch !== "") boardPoints += pointsTable[ch];
	}

	//update alphaCount
	for(i=1; i<=10; i++) {
		ch = document.getElementById("board-"+i).value;
		if(ch !== undefined && ch !== "") alphaCount[ch] += 1;
	}
	for(i=1; i<=7; i++) {
		ch = document.getElementById("rack-"+i).value;
		if(ch !== undefined && ch !== "") alphaCount[ch] += 1;
	}

	//look for matches
	for(i=0; i<words.length; i++) {
		if(words[i].match(regEx)) {
			var alphaCountCopy = $.extend({}, alphaCount);
			var enoughLetters = true;
			for(var j=0; j<words[i].length; j++) {
				alphaCountCopy[words[i][j]] -= 1;
				if(alphaCountCopy[words[i][j]] < 0) enoughLetters = false;
			}
			if(enoughLetters) {
				var points = getPoints(words[i]) - boardPoints;
				if(points > maxPoints) {
					bestWord = words[i];
					maxPoints = points;
				}
			}
		}
	}

	updateBoard(bestWord, maxPoints);
}

function resetBoard() {
	//reset colors
	for(i=1; i<=10; i++) {
		document.getElementById("board-"+i).value = "";
		document.getElementById("board-"+i).parentElement.style.background = "#F4A460";
	}
	for(i=1; i<=7; i++) {
		document.getElementById("rack-"+i).value = "";
		document.getElementById("rack-"+i).parentElement.style.background = "#F4A460";
	}
	rackPoints = 0;
	document.getElementById("rack").innerHTML = "<em>YOUR RACK (AVAILABLE POINTS: 0)</em>";

	//reset button
	document.getElementById("button").innerHTML = "FIND BEST MATCH";
	document.getElementById("button").onclick = function() { createRegEx(); };
}

function createRegEx() {
	var regEx = "";
	for(var i=1; i<=10; i++) {
		var ch = document.getElementById("board-"+i).value;
		if(ch === undefined || ch === "") regEx += ".";
		else regEx += ch;
	}

	//check beginning of RegEx string
	var count = 0;
	for(i=10; i>=1; i--) {
		if(regEx[regEx.length-i] == ".") count += 1;
		else break;
	}
	if(count !== 0) {
		regEx = ".{0," + count + "}" + regEx.substring(count, regEx.length);
	}

	//check end of RegEx string
	if(count != 10) {
		count = 0;
		for(i=1; i<=10; i++) {
			if(regEx[regEx.length-i] == ".") count += 1;
			else break;
		}
		if(count !== 0) {
			regEx = regEx.substring(0, regEx.length-count) + ".{0," + count + "}";
		}
	}

	//find available tiles on rack
	regEx = "^" + regEx + "$";
	findMatches(new RegExp(regEx));
}
var parsedFile;

loadAllProjects();

//Handler for loading selected month

$('#month-submit').on('click', function(){

	// $('.empty-table').slideUp();

	$('#project-table tr, #project-table th, #estimated-income p').remove();

	var selectedMonth = $('.month-selector :selected').val();

	Papa.parse("timesheets/" + selectedMonth + ".csv", {
						download: true,
						complete: function(results, file) {
								  console.log("Parsing complete:", results.data);
								  timesheet = results.data;
								  loadTimesheet(results.data);
								}
	});
});


//Handler for showing tasks when clicking rows

$( "tbody" ).on( "click", "tr.project-row", function() {

  $('.task-container').slideUp('fast', function(){
  	$(this).remove();
  });

  if( $(this).hasClass('selected-row')){
  	$(this).removeClass('selected-row');
  } else{
	  $('tr').removeClass('selected-row');
	  $( this ).addClass('selected-row');

	  var project = $( this ).attr('value');
	  var taskArray = getTaskArray(parsedFile, project);
	  var pieData = [];

	  for(var i = 0; i < taskArray.length; i++){

	  	var color = Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255);
	 
		pieData[i] = {
			value: Math.round(taskArray[i].hours*100)/100,
	        color: "rgb(" + color + ")",
	        highlight: "rgba(" + color + ", .75)",
	        label: taskArray[i].name
		}

	  }

	  var pieHTML = '<tr class="task-container"><td colspan="2">' +
	  					'<div class="task-container" id="canvas-holder">' +
	        			'<canvas id="chart-area1" width="200" height="200" />' +
	     			  '</div>' +
					  '<div class="task-container" id="chartjs-tooltip"></div>' +
					  '<div id="js-legend" class="chart-legend task-container"></div>' + 
					'</td></tr>';

	  $( this ).addClass('selected-row').after(pieHTML);

	  $('.task-container').slideDown('fast', function(){

	  	var ctx1 = document.getElementById("chart-area1").getContext("2d");
	    window.myPie = new Chart(ctx1).Pie(pieData, {animationSteps: 30});
	    // document.getElementById('js-legend').innerHTML = myPie.generateLegend();
	  	
	  });
	}

});

// Function that takes an array of objects (arr) and searches for an object with the "name" property
// If "exists" argument is specified as "true", returns true/false; if not specified, returns
// the object

function findObjectByName(arr, name, exists){
	for(var i = 0; i < arr.length; i++){
		if(arr[i].name == name){
			return (exists === true) ? true : arr[i];
		}
	}
}

// Function that loads up the current month's timesheet on initial page load

function loadCurrentMonth(){
	var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
	var options = [];
	var currentMonth;
	var d = new Date();

	for(var i = 1; i < $(".month-selector option").length + 1; i++){
		if(months[d.getMonth()] == $(".month-selector option:nth-child(" + i.toString() + ")").val()){
			currentMonth = months[d.getMonth()];
		}
	}

	if(currentMonth != undefined){
		Papa.parse("timesheets/" + currentMonth + ".csv", {
							download: true,
							complete: function(results, file) {
									  console.log("Parsing complete:", results.data);
									  timesheet = results.data;
									  loadTimesheet(results.data);
									}
		});
	}

}

function getHeaderLocations(parsedFile){
	var header = {
		project: parsedFile[0].indexOf('Project'),
		hours: parsedFile[0].indexOf('Hours'),
		task: parsedFile[0].indexOf('Task'),
		date: parsedFile[0].indexOf('Date')
	}

	return header;
}

function getProjectArray(parsedFile){

	var projectCol = getHeaderLocations(parsedFile).project;
	var hoursCol = getHeaderLocations(parsedFile).hours;
	var projectObs = [];

	for(var i = 1; i < parsedFile.length; i++){
		
		if(!findObjectByName(projectObs, parsedFile[i][projectCol], true) && parsedFile[i][projectCol] !== undefined){
			var newProject = {
				name: parsedFile[i][projectCol],
				hours: 0,
				dateCompleted: ""
			}

			projectObs.push(newProject);
		}

	}
	return projectObs;
}

function getTaskArray(parsedFile, project){
	var projectCol = getHeaderLocations(parsedFile).project;
	var hoursCol = getHeaderLocations(parsedFile).hours;
	var taskCol = getHeaderLocations(parsedFile).task;
	var dateCol = getHeaderLocations(parsedFile).date;
	var taskObs = [];

	for(var i = 1; i < parsedFile.length; i++){
		
		if(parsedFile[i][projectCol] == project && !findObjectByName(taskObs, parsedFile[i][taskCol]) && parsedFile[i][projectCol] !== undefined){
			var newTask = {
				name: parsedFile[i][taskCol],
				hours: 0,
				dates: []
			}

			taskObs.push(newTask);
		}

	}

	for(var i = 1; i < parsedFile.length; i++){
		
		var currentObject = findObjectByName(taskObs, parsedFile[i][taskCol]);

		if(parsedFile[i][projectCol] == project && parsedFile[i][taskCol] == currentObject.name){
			currentObject.hours += Number(parsedFile[i][hoursCol]);

			var d = new Date(parsedFile[i][dateCol]);
			currentObject.dates.push(d.getTime());
		}
	}

	return taskObs;

}

function generateProjects(parsedFile){
	var projects = getProjectArray(parsedFile);

	for(var i = 0; i < projects.length; i++){
		projects[i]['tasks'] = getTaskArray(parsedFile, projects[i].name);

		var totalProjectHours = 0;
		var dateCompleted = "0";

		for(var j = 0; j < projects[i].tasks.length; j++){

			var dates = projects[i].tasks[j].dates.sort().reverse();

			if(Number(dates[0]) > Number(dateCompleted)){
				dateCompleted = dates[0];
			}

			totalProjectHours += projects[i].tasks[j].hours;
		}

		var dateCompletedObject = new Date(dateCompleted);
		projects[i].dateCompleted = dateCompletedObject;
		projects[i].hours = Math.round(totalProjectHours*100)/100;
	}

	writeTable(projects)
}

function writeTable(projects){

	$('thead').append("<th>Project</th>" +
					  "<th>Hours</th>");

	var tableHTML = "";
	var totalHours = 0;

	for(var i = 0; i < projects.length; i++){
		totalHours += projects[i].hours;

		tableHTML += "<tr class = 'project-row' value = '" + projects[i].name + "'>"
					+ "<td>" + projects[i].name + "</td>"
					+ "<td class= 'hours'>" + Math.round(projects[i].hours*100)/100 + "</td>" 
				  + "</tr>";

		if(i == projects.length - 1){
			tableHTML += "<tr class = 'total-hours'>"
							+ "<td>Total</td>"
							+ "<td class = 'hours'>" + Math.round(totalHours*100)/100 + "</td>" 
					   + "</tr>";
		}
	}

	var estimatedIncome = totalHours * 30;

	$('tbody').append(tableHTML);

	$('#estimated-income').append('<p>Income: <strong>$' + estimatedIncome + '</strong></p>');
}

function showDates(projects){
	for(var i = 0; i < projects.length; i++){
		console.log(projects[i].dateCompleted.getMonth());
	}
}

var projects;


function loadAllProjects(){

	Papa.parse("timesheets/master.csv", {
						download: true,
						complete: function(results, file) {
									  // console.log("Parsing complete:", results.data);
									  parsedFile = results.data
									  generateProjects(parsedFile);
								}
	});

}

	



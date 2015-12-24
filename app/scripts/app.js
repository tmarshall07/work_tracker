var timesheet;

$('#month-submit').on('click', function(){

	$('.empty-table').slideUp();

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
	  var taskArray = getTaskArray(project);
	  var taskHTML = "<ul class='task-container'>";
	  var pieData = [];

	  for(i = 0; i < taskArray.length; i++){
	  	var taskRow = "<tr class = 'task-row'>" +
	  						"<td>" + taskArray[i].name + "</td>" +
	  						"<td class='hours'>" + Math.round(taskArray[i].hours*100)/100 + "</td>" +
						 "</tr>";
		var taskList = "<li>" + taskArray[i].name + ": " + Math.round(taskArray[i].hours*100)/100 + " hours</li>";

		pieData[i] = {
			value: Math.round(taskArray[i].hours*100)/100,
	        color: "#F7464A",
	        highlight: "#FF5A5E",
	        label: taskArray[i].name
		}

		taskHTML += taskList;	 
	  }

	  var pieHTML = '<div class="task-container" id="canvas-holder">' +
	        			'<canvas id="chart-area1" width="150" height="150" />' +
	     			  '</div>';
					  // '<div id="chartjs-tooltip"></div>';

	  taskHTML += "</ul>"

	  $( this ).addClass('selected-row').after(taskHTML + pieHTML);

	  $('.task-container').slideDown('fast', function(){
	  	var ctx1 = document.getElementById("chart-area1").getContext("2d");
	    window.myPie = new Chart(ctx1).Pie(pieData);
	  });
	}

});

// Function that takes an array of objects (arr) and searches for an object with the "name" property
// If "exists" argument is specified as "true", returns true/false; if not specified, returns
// the object

function findObjectByName(arr, name, exists){
	for(i = 0; i < arr.length; i++){
		if(arr[i].name == name){
			return (exists === true) ? true : arr[i];
		}
	}
}

function getHeaderLocations(){
	var header = {
		project: timesheet[0].indexOf('Project'),
		hours: timesheet[0].indexOf('Hours'),
		task: timesheet[0].indexOf('Task')
	}

	return header;
}

function getProjectArray(){

	var projectCol = getHeaderLocations().project;
	var hoursCol = getHeaderLocations().hours;
	var projectObs = [];

	for(var i = 1; i < timesheet.length; i++){
		
		if(!findObjectByName(projectObs, timesheet[i][projectCol], true) && timesheet[i][projectCol] !== undefined){
			var newProject = {
				name: timesheet[i][projectCol],
				hours: 0
			}

			projectObs.push(newProject);
		}

	}
	return projectObs;
}

function getTaskArray(project){
	var projectCol = getHeaderLocations().project;
	var hoursCol = getHeaderLocations().hours;
	var taskCol = getHeaderLocations().task;
	var taskObs = [];

	for(var i = 1; i < timesheet.length; i++){
		
		if(timesheet[i][projectCol] == project && !findObjectByName(taskObs, timesheet[i][taskCol]) && timesheet[i][projectCol] !== undefined){
			var newTask = {
				name: timesheet[i][taskCol],
				hours: 0
			}

			taskObs.push(newTask);
		}

	}

	for(var i = 1; i < timesheet.length; i++){
		
		var currentObject = findObjectByName(taskObs, timesheet[i][taskCol]);

		if(timesheet[i][projectCol] == project && timesheet[i][taskCol] == currentObject.name){
			currentObject.hours += Number(timesheet[i][hoursCol]);
		}
	}

	return taskObs;

}

//creates table from Papaparse csv file

function loadTimesheet(timesheet){
	var projectCol = getHeaderLocations().project;
	var hoursCol = getHeaderLocations().hours;
	var totalHours = 0;

	//Create header for table 

	$('thead').append("<th>" + timesheet[0][projectCol] + "</th>" +
					  "<th>" + timesheet[0][hoursCol] + "</th>");

	//Create objects for each project and add them to array "projectObs"
	
	var projectObs = getProjectArray();

	// Add hours to each project

	for(var i = 1; i < timesheet.length; i++){
		
		var currentObject = findObjectByName(projectObs, timesheet[i][projectCol]);

		if(currentObject !== undefined){
			currentObject.hours += Number(timesheet[i][hoursCol]);
		}
	}
	
	// Create table and append

	var tableHTML = "";
	for(var i = 0; i < projectObs.length; i++){
		totalHours += projectObs[i].hours;

		tableHTML += "<tr class = 'project-row' value = '" + projectObs[i].name + "'>"
					+ "<td>" + projectObs[i].name + "</td>"
					+ "<td class= 'hours'>" + Math.round(projectObs[i].hours*100)/100 + "</td>" 
				  + "</tr>";

		if(i == projectObs.length - 1){
			tableHTML += "<tr class = 'total-hours'>"
							+ "<td>Total</td>"
							+ "<td class = 'hours'>" + Math.round(totalHours*100)/100 + "</td>" 
					   + "</tr>";
		}
	}

	var estimatedIncome = projectObs.length * 250;

	$('tbody').append(tableHTML);

	$('#estimated-income').append('<p>Income: <strong>$' + estimatedIncome + '</strong></p>');

}







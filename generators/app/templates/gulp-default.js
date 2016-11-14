var gulp = require('gulp');
var prompt = require("gulp-prompt");

// Promts you to choose a task 
gulp.task('default', function() {
    var taskNames = [];
    for (var taskName in gulp.tasks) {
        if (gulp.tasks.hasOwnProperty(taskName)) {
            taskNames.push(taskName);
        }
    }

    return gulp.src('*').pipe(
        prompt.prompt({
            type: 'list',
            name: 'task',
            message: 'Choose task name',
            choices: taskNames
        }, function(userResponse){
            gulp.tasks[userResponse.task].fn();
        }));
});
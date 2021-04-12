const getLastNDays = (n) => {
    let date = getDateOffset(n, new Date);
    let data = workoutData.filter(x => x.date.toDate() > date && x.date.toDate() <= new Date());
    return data;
}

let activeFilter = "W";
const updateChartFilter = (n, el) => {
    if(el.innerHTML === activeFilter) return;
    activeFilter = el.innerHTML;
    $(".graph-filter").removeClass("active");
    el.classList.add("active");

    dataInFilter = getLastNDays(n);
    loadGraphs();
}

let dataInFilter;

const updateWeightChart = () => {
    let exercise = $("#exercise-graph-selector").val();
    [exercisesChartData, exercisesChartLabels] = getHeaviestByBodypartData(dataInFilter, exercise);
    exerciseChart.data.datasets[0].data = exercisesChartData;
    exerciseChart.data.labels = exercisesChartLabels;
    exerciseChart.update();
}

const renderExerciseSelector = () => {
    let exercises = exercisesData.map(x => x.name);
    exercises.sort();
    $("#exercise-graph-selector").html(exercises.map(x => `<option value="${x}" >${x}</option>`));

}

const getProportionalData = (data) => {
    let map = workoutCats.map(x => [x, 0]);
    let vol = Object.fromEntries(map);
    //for each workout
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].exercises.length; j++) {
            vol[data[i].exercises[j].category] += totalByLift(data[i].exercises[j]);
        }
    }
    return [Object.values(vol), Object.keys(vol)]
}

const getHeaviestByBodypartData = (data, exercise) => {
    let vol = [];
    let labels = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].exercises.length; j++) {
            if (data[i].exercises[j].name === exercise) {
                vol.push(Math.max(...data[i].exercises[j].weights));
                labels.push(data[i].date.toDate().toDateString());
            }
        }
    }
    return [vol, labels]
}


const getOverallVolumeData = (data) => {
    let vol = [];
    let labels = [];
    for (let i = 0; i < data.length; i++) {
        let [sets, reps, total] = workoutStats(data[i].exercises);
        if (total) {
            vol.push(total);
            labels.push(data[i].date.toDate().toDateString());
        }
    }
    return [vol, labels]
}

let proportionChart, overallChart, exerciseChart;
function loadGraphs() {

    if(!dataInFilter) dataInFilter = getLastNDays(-6);

    renderExerciseSelector();

    //OVERALL
    [overallData, overallLabels] = getOverallVolumeData(dataInFilter);
    overallChart = new Chart(document.getElementById('overall-chart'), {
        type: 'line',
        data: {
            labels: overallLabels.reverse(),
            datasets: [{
                borderColor: "#3d88ff",
                data: overallData.reverse()
            }]
        },
        options: {
            legend: { display: false }
        }
    });

    //EXERCISES
    let exercise = $("#exercise-graph-selector").val();
    [exercisesChartData, exercisesChartLabels] = getHeaviestByBodypartData(dataInFilter, exercise);
    exerciseChart = new Chart(document.getElementById('exercises-chart'), {
        type: 'line',
        data: {
            labels: exercisesChartLabels.reverse(),
            datasets: [{
                borderColor: "#3d88ff",
                data: exercisesChartData.reverse()
            }]
        },
        options: {
            legend: { display: false }
        }
    });



    //PROPORTIONAL
    var [proportionalData, proportionalLabel] = getProportionalData(dataInFilter);
    proportionChart = new Chart(document.getElementById("proportion-chart"), {
        type: 'pie',
        data: {
            labels: proportionalLabel,
            datasets: [{
                data: proportionalData,
                borderColor: "#fff",
                backgroundColor: workoutCatColors,
            }]
        },
        options: {
            legend: { display: false },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var labelText = data.labels[tooltipItem.index];
                        var dataArr = data.datasets[0].data;
                        var value = dataArr[tooltipItem.index];
                        var total = dataArr.reduce((a, b) => a + b);
                        let percent = (value * 100 / total).toFixed(2);
                        return `${labelText}: ${value}lbs (${percent}%)`
                    }
                }
            }
        }
    });


}
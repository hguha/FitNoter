const heaviestByExercise = (d) => {
    let weights = [];
    for(x of workoutData) {
        for(let i = 0; i < x.exercises.length; i++) {
            if(x.exercises[i].name === d.name) {
                weights.push(Math.max(...x.exercises[i].weights))
            }
        }
    }
    
    if(!weights.length) return 0;
    return Math.max(...weights);
}

//Props: data = exercise that we want to find the last workout with
const lastWorkoutWithExercise = (data) => {

    //remove today's workout
    let d = workoutData.filter(x => x.date.toDate().toDateString() !== (new Date).toDateString())
    console.log(d);
    //go through each day
    for(let i = 0; i < d.length; i++) {
        let f = d[i].exercises.filter(x => x.name === data.name);
        console.log(f);
        if(f.length) return f;
    }

    return [];
}

const renderLastWorkout = (data) => {
    let d = lastWorkoutWithExercise(data);
    
    if(!d.length) return "No Previous Record";
    d = d[0];

    let html = `
        <hr>
        ${d.reps.map((x, j)=> `<div class="set">${x} x ${0 || d.weights[j]}lbs</div>`).join("<hr>")}
        <hr>
        <div class="card-stats">
        ${d.reps.length} sets  -  ${d.reps.reduce((a,b) => Number(a)+Number(b))} reps -  ${totalByLift(d)}lbs 
        </div>
    `;

    return html;
    
}


const renderExercisesList = (data) => {
    let html = ``;
    for(let i = 0; i < data.length; i++) {
        html+=`<div class="list-row" onclick="addEditExercise(${i})">
            <div class="exercise-row">
                <div class="exercise-name">${data[i].name}</div>
                <div class="exercise-cat">${data[i].category}</div>
            </div>
            <div class="heaviest">Heaviest: ${heaviestByExercise(data[i])}lbs</div>
            </div>
            `
    }

    $("#exercise-list").html(html);
}

const addEditExercise = (idx) => {
    let editing = idx > -1;
    let d = exercisesData[idx] || {};
    swal.fire({
        title: d.name,
        showCancelButton: true,
        confirmButtonText: editing ? 'Update' : "Add",
        html: `
            <label for="modal-title">Name</label>
            <input id="modal-title" value="${editing ? d.name : ""}">

            <label for="modal-cat">Category</label>
            <select id="modal-cat">
                <option disabled ${!editing ? "selected" : ""} value>    </option>
                ${workoutCats.map(x => `<option value="${x}" ${d.category === x ? "selected" : ""} >${x}</option>`).join("")}
            </select><br>
            <h2>Previous Workout:</h2>
            ${editing ? renderLastWorkout(d) : "No Previous Record"}
        `,
        preConfirm: function () {
            return new Promise(function (resolve) {
                resolve({
                name: $('#modal-title').val(),
                category: $('#modal-cat').val(),
                })
            })
        },
    }).then(function (result) {
            if(result.isDismissed) { return; }

            if(result.isDenied) { 
                workoutRef.doc(exerciseData.docId).delete(); 
            }

            if(result.isConfirmed) {
                let data = {...d, ...result.value};
                delete data.docId;
                if(editing) { exercisesRef.doc(d.docId).set(result.value, {merge: true}); }
                else { exercisesRef.add({...result.value, uid: curUser.uid});}
            }
    }).catch(swal.noop)
}

let keyfilter = "";
let catfilter = "";
const filterExercises = () => {
    swal.fire({
        showCancelButton: true,
        confirmButtonText: "Filter",
        html: `
        <label for="modal-cat">Category</label>
        <select id="modal-cat" onchange="selectedCat()">
            <option ${!catfilter ? "selected" : ""} value>All</option>
            ${workoutCats.map(x => `<option value="${x}" ${catfilter === x ? "selected" : ""} >${x}</option>`).join("")}
        </select>
        <label for="modal-keyword">Keyword</label>
        <input id="modal-keyword">
        `,
        preConfirm: function () {
            return new Promise(function (resolve) {
                resolve({
                    keyword: $("#modal-keyword").val(),
                    category: $("#modal-cat").val(),
                })
            })
        },

    }).then(function (result) { //the part that handles the recieved input
            if(result.isDismissed) { return; }
            if(result.isConfirmed) {
                catfilter = result.value.category;
                keyfilter = result.value.keyword;
                console.log(catfilter, keyfilter)
                let data = catfilter ? exercisesData.filter(x => x.category === catfilter) : exercisesData;
                data = keyfilter ? data.filter(x => x.name.toLowerCase().search(keyfilter.toLowerCase()) > -1) : data;
                renderExercisesList(data);
            }
    }).catch(swal.noop)
}
const getDateOffset = (offset, date) => {
    return new Date(date.setDate(date.getDate() + offset));
}

changeWorkoutDate = (offset) => {
    curDate = getDateOffset(offset, curDate)
    renderList(workoutData);
}

const generateSetsRepsInputs = (d) => {
    let html = ``;
    if(!curIdx) {
        html += createSet(null, null, curIdx, false);
        curIdx++;
    }
    else {

        for(let i = 0; i < d.reps.length; i++) {
            html += createSet(d.weights[i], d.reps[i], i, true);
        }
    }
    return html;
}

const tallyRepsSets = () => {
    let reps = [], weights = [];
    for(let i=0; i < curIdx; i++) {
        //if the row is there and not empty
        if($(`#weight-${i}`).length && $(`#reps-${i}`).length && $(`#weight-${i}`).val() && $(`#reps-${i}`).val()) {
            weights.push($(`#weight-${i}`).val());
            reps.push($(`#reps-${i}`).val());
        }
    }

    return [weights, reps];
}

const createSet = (weight, reps, idx) => {
    let html = `
    <div class="row exercise-row-${idx}">
        <div class="col"><input class="reps" placeholder="Reps" id="reps-${idx}" value="${reps}" type="number"></div>
        <div class="col"><input class="weights" placeholder="Lbs" id="weight-${idx}" value="${weight}" type="number"></div>
        <div class="delete-set" ><a onclick="removeSet(${idx})"> <i class="fas fa-trash-alt"></i> </a></div>
    </div>
    `
    return html;
}

const addSet = () => {
    let weights = null, reps = null;
    if($(".sets-reps .row").last().length) {
        reps = Number($(".sets-reps .row").last().children().children()[0].value);
        weight = Number($(".sets-reps .row").last().children().children()[1].value);
    }
    $(".sets-reps").append(createSet(weight, reps, curIdx, false));
    curIdx++;
}

const removeSet = (idx) => {
    console.log("what?");
    $(`.exercise-row-${idx}`).remove();
}

const selectedCat = () => {
    let val = $(`#modal-cat`).val();
    html = `
        <option disabled selected value>    </option>
        ${exercisesData.map(x => x.category === val ? `<option value="${x.name}">${x.name}</option>` : "").join("")}
    `;

    $(`#modal-title`).html(html);

}

let knownExercises = ["Bicep Curl", "Bench Press", "Something Else"]
let curIdx;

const addOrEditItemModal = (idx) => {
    const editing = idx > -1;
    const d = editing ? exerciseData.exercises[idx] : {};

    curIdx = editing ? exerciseData.exercises[idx].reps.length : 0;
    swal.fire({
        title: editing ? `Update Exercise` : "Add Exercise",
        showCancelButton: true,
        showDenyButton: editing,
        confirmButtonText: editing ? "Update" : "Add",
        denyButtonText: 'Delete',
        html: `
        <label for="modal-cat">Category</label>
        <select id="modal-cat" onchange="selectedCat()">
            <option disabled ${!d.category ? "selected" : ""} value>    </option>
            ${workoutCats.map(x => `<option value="${x}" ${d.category === x ? "selected" : ""} >${x}</option>`).join("")}
        </select>
        
        <label for="modal-title">Name</label>
        <select id="modal-title">
        <option disabled ${!d.cat ? "selected" : ""} value>    </option>
        ${exercisesData.map(x => x.category === d.category ? `<option value="${x.name}" ${d.name === x.name ? "selected" : ""} >${x.name}</option>` : "").join("")}
    </select>
    <br>
    <hr style="margin: 15px 0">
        <div class="sets-reps">
            ${generateSetsRepsInputs(d)}
        </div>
        <a onclick="addSet()"> <i style="font-size: 25px" class="fas fa-plus-square"></i> </a>
       
        `,
        preConfirm: function () {
            return new Promise(function (resolve) {
                let [weights, reps] = tallyRepsSets();
                resolve({
                    name: $("#modal-title").val(),
                    category: $("#modal-cat").val(),
                    weights: weights,
                    reps: reps
                })
            })
        },

    }).then(function (result) { //the part that handles the recieved input
            if(result.isDismissed) { return; }
            
            if(result.isDenied) { 
                if(curUser) {
                    exerciseData.exercises.splice(idx, 1);
                    workoutRef.doc(exerciseData.docId).set(exerciseData); 
                }
            }

            if(result.isConfirmed) {
                exerciseData.exercises[idx > -1 ? idx : exerciseData.exercises.length]  = result.value; 
                workoutRef.doc(exerciseData.docId).set(exerciseData); 
            }
    }).catch(swal.noop)
}

//SERVICE WORKERS
window.onload = () => {  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
               .register('./sw.js');
    }
}

//ROUTING
let defaultRoute = "workout";
let curRoute = "";
var chart;
var curDate = new Date();
let workoutCats = ["Back", "Chest", "Bicep", "Tricep", "Legs", "Shoulder"];
let workoutCatColors = ["#0049FF", "#2E6AFF", "#55A2FF", "#55C4FF", "#55E5FF", "#00f2ff"];

const navigate = (route) => {
    if(curRoute == route) return;
    curRoute = route;
    $.get(`/templates/${route}.html`, (data) => {
        $("#app-content").html(data);
    });
}
navigate(defaultRoute);


$(`#menu button#${defaultRoute}`).addClass("active-tab");
$("#menu button").click(function() {
    $("#menu button").removeClass("active-tab");
    $(this).addClass("active-tab");
});

//AUTHENTICATION
const auth = firebase.auth();
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const provider = new firebase.auth.GoogleAuthProvider();
signInBtn.onclick = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => confirm("Are you sure you want to sign out?") ? auth.signOut() : null;

auth.onAuthStateChanged(user => {
    if (user) {
        $("#sign-in").hide();
        $("#content").show();
    } else {
        $("#sign-in").show();
        $("#content").hide();
    }
});

//DATABASE
let workoutData;
var exerciseData;
let curUser;

const formatDate = (d) => {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const formatDateForInput = (d) => {
    const year = d.getFullYear();
    const month = (d.getMonth() < 10 ? "0" : "") + String(d.getMonth()+1);
    const day = (d.getDate() < 10 ? "0" : "") + String(d.getDate());
    return `${year}-${month}-${day}`;
}

const nextDay = (date) => {
    return new Date(date.setDate(date.getDate() + 1));
}


const datePicker = (d) => {
    swal.fire({
        showCancelButton: true,
        confirmButtonText: 'Update',
        html: `
            <label for="modal-date">Date</label>
            <input id="modal-date" value="${formatDateForInput(curDate)}" type="date">
        `,
        preConfirm: function () {
            return new Promise(function (resolve) {
                resolve({ date: $('#modal-date').val()})
            })
        },
    }).then(function (result) {
            if(result.isConfirmed) {
               curDate = nextDay(new Date(String(result.value.date)))
               renderList(workoutData);
            }
    }).catch(swal.noop)
}


const createEmptyExerciseData = (d) => {
    return {
        uid: curUser.uid,
        date: curDate,
        exercises: []
    }
}

const totalByLift = (data) => {
    let total = 0;
    for(let i = 0; i < data.reps.length; i++) {
        total += data.reps[i] * data.weights[i];
    }

    return total;
   
}

const workoutStats = (data) => {
    let sets = 0, reps = 0, total = 0;
    for(let i = 0; i < data.length; i++) {
        sets += data[i].reps.length;
        reps += Number(data[i].reps.reduce((a,b) => Number(a)+Number(b)));
        total += totalByLift(data[i])
    }
    return [sets, reps, total]
}

const renderList = (data) => {
    $("#workout-date").html(formatDate(curDate));
    if(!data) return;

    //get the workout data for the selected day
    exerciseData = data.filter(d => d.date.toDate().toDateString() === curDate.toDateString())[0] || createEmptyExerciseData();
    let html = ``;
    
    let exercises = exerciseData.exercises;

    //here's where you could sort the items if you wanted.
    //render it!
    for(let i = 0; i < exercises.length; i++) {
        html+= `<div onclick="addOrEditItemModal(${i})" class="card">
            <div class="card-title">${exercises[i].name}</div>
            <hr>
            ${exercises[i].reps.map((x, j)=> `<div class="set">${x} x ${0 || exercises[i].weights[j]}lbs</div>`).join("<hr>")}
            <hr>
            <div class="card-stats">
               ${exercises[i].reps.length} sets  -  ${exercises[i].reps.reduce((a,b) => Number(a)+Number(b))} reps -  ${totalByLift(exercises[i])}lbs 
            </div>
        </div>`;
    }
    console.log(exercises);
    let [sets, reps, total] = workoutStats(exercises);
    html += `
        <div class="workout-stats">${sets} sets  -  ${reps} reps  -  ${total}lbs</div>
    `
    $("#workout-list").html(html);
}
// -  ${exercises.reduce((a,b) => Number(a.reps)+Number(b.reps))} reps -  ${exercises.reduce((a,b) => totalByLift(a)+totalByLift(b))}lbs 
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateToColName = (d) => {
    let m = d.getMonth();
    let y = d.getFullYear();
    let day = d.getDate();

    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const db = firebase.firestore();
let unsubscribe;
let workoutRef = db.collection("workouts");

let unsubscribe2;
let exercisesRef = db.collection("exercises");

auth.onAuthStateChanged(user => {
    curUser = user; 
    if (user) { 
        // GET WORKOUTS LIST
        unsubscribe = workoutRef
        .where('uid', '==', user.uid)
        .orderBy("date", "desc")
        .onSnapshot(query => {
            let data = query.docs.map(doc => {
                let d = doc.data();
                d["docId"] = doc.id;
                return d;
            });
            workoutData = data;
            renderList(workoutData);
        });

        // GET EXERCISES LIST
        unsubscribe = exercisesRef
        .where('uid', '==', user.uid)
        .onSnapshot(query => {
            let data = query.docs.map(doc => {
                let d = doc.data();
                d["docId"] = doc.id;
                return d;
            });
            exercisesData = data;
            renderExercisesList(exercisesData);
        });


    } 
    else { unsubscribe && unsubscribe(); }
});
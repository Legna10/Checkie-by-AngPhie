//define endpoint
const TASKS_API = "http://localhost:5000/api/tasks"; 
const STICKY_API = "http://localhost:5000/api/stickies";

//define html element
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const priorityInput = document.getElementById("priorityInput");
const tagInput = document.getElementById("tagInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const archiveList = document.getElementById("archiveList");
const stickyWall = document.getElementById("stickyWall");
const addStickyBtn = document.getElementById("addSticky");

//define var to store an id
let editingTaskId = null;
let editingNoteId = null;
//define var for modal 
let noteModal, modalTitle, modalBody, saveNoteBtn, cancelNoteBtn;

//tasks//
//render task item and insert into task list or archive list
function renderTask(t) {
  const li = document.createElement("li");
  li.className = `task-item ${t.priority.toLowerCase()}`;
  li.dataset.id = t.id; //
  li.innerHTML = `
    <div class="task-text"><strong>${t.text}</strong><br>
      <small>Due: ${t.dueDate} | Tag: ${t.tag}</small>
    </div>
    <div class="button-group">
      <button onclick="archiveTask(${t.id}, this)">✔️</button>
      <button onclick="editTask(${t.id}, this)">✏️</button>
      <button onclick="deleteTask(${t.id}, this)">🗑️</button>
    </div>`;
  (t.completed ? archiveList : taskList).appendChild(li); //create a list
}

//add or update tasks
addButton.onclick = async () => { //add tasks
  const text = taskInput.value.trim();
  const due = dueDateInput.value;
  const pri = priorityInput.value;
  const tag = tagInput.value.trim();

  if (!text || !due || !pri) {
    if (!text) alert("Please enter description");
    if (!due) alert("Please select due date");
    if (!pri) alert("Please select priority");
    return;
  }

  if (editingTaskId) { //edit existing task
    const res = await fetch(`${TASKS_API}/${editingTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueDate: due, priority: pri, tag })
    });
    const updated = await res.json();

    const li = document.querySelector(`li[data-id="${editingTaskId}"]`);
    li.querySelector(".task-text").innerHTML = `
      <strong>${updated.text}</strong><br>
      <small>Due: ${updated.dueDate} | Tag: ${updated.tag}</small>
    `;
    li.classList.remove("low", "medium", "high");
    li.classList.add(updated.priority.toLowerCase());

    addButton.textContent = "➕";
    editingTaskId = null;
  } else {
    const res = await fetch(TASKS_API, { //add new task
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueDate: due, priority: pri, tag, completed: false })
    });
    renderTask(await res.json());
  }

  //clear input after add new task or edit an existing task
  taskInput.value = "";
  dueDateInput.value = "";
  priorityInput.value = "";
  tagInput.value = "";
};

//edit task
window.editTask = (id, btn) => {
  const li = btn.closest("li");
  const text = li.querySelector("strong").textContent;
  const smallText = li.querySelector("small").textContent;
  const dueMatch = smallText.match(/Due: (.*?) \|/);
  const tagMatch = smallText.match(/Tag: (.*)/);

  taskInput.value = text;
  dueDateInput.value = dueMatch ? dueMatch[1] : "";
  tagInput.value = tagMatch && tagMatch[1] !== "null" ? tagMatch[1] : "";

  const className = li.className;
  if (className.includes("low")) priorityInput.value = "Low";
  else if (className.includes("medium")) priorityInput.value = "Medium";
  else if (className.includes("high")) priorityInput.value = "High";

  editingTaskId = id;
  addButton.textContent = "💾";
};

//archive task
window.archiveTask = async (id, btn) => {
  const li = btn.closest("li");
  const isArchived = li.classList.contains("archived");

  if (isArchived) {
    archiveList.removeChild(li);
    taskList.appendChild(li);
    li.classList.remove("archived");
  } else {
    taskList.removeChild(li);
    archiveList.appendChild(li);
    li.classList.add("archived");
  }

  await fetch(`${TASKS_API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: !isArchived })
  });
};

//deletee task
window.deleteTask = async (id, btn) => {
  await fetch(`${TASKS_API}/${id}`, { method: "DELETE" });
  btn.closest("li").remove();
};


//sticky wall//
//
function renderSticky(n) {
  const div = document.createElement("div");
  div.classList.add("sticky-note", `note-${n.color}`);
  div.dataset.id = n.id;
  div.innerHTML = `
    <div class="note-title">${n.title}</div>
    <div class="note-body">${n.body}</div>
    <div class="menu-wrapper">
      <button class="dots-btn edit-btn">✏️</button>
      <button class="dots-btn delete-btn">🗑️</button>
    </div>`;

  //edit sticy
  div.querySelector(".edit-btn").onclick = () => {
    modalTitle.value = div.querySelector(".note-title").textContent;
    modalBody.value = div.querySelector(".note-body").textContent;
    editingNoteId = n.id;
    noteModal.classList.remove("hidden");
  };

  //delete sticky
  div.querySelector(".delete-btn").onclick = async () => {
    await fetch(`${STICKY_API}/${n.id}`, { method: "DELETE" });
    div.remove();
  };

  stickyWall.insertBefore(div, addStickyBtn);
}

//modal to add sticky
addStickyBtn.onclick = () => {
  modalTitle.value = "";
  modalBody.value = "";
  editingNoteId = null;
  noteModal.classList.remove("hidden");
};

//modal to add or edit sticky
function createStickyModal() {
  const modal = document.createElement("div");
  modal.id = "noteModal";
  modal.className = "modal hidden";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Add Sticky Note</h3>
      <input type="text" id="modalTitle" placeholder="Title"/>
      <textarea id="modalBody" placeholder="Note..."></textarea>
      <div class="modal-actions">
        <button id="saveNote">save</button>
        <button id="cancelNote">く</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  //define modal element
  noteModal = document.getElementById("noteModal");
  modalTitle = document.getElementById("modalTitle");
  modalBody = document.getElementById("modalBody");
  saveNoteBtn = document.getElementById("saveNote");
  cancelNoteBtn = document.getElementById("cancelNote");

  saveNoteBtn.onclick = saveStickyNote; 
  cancelNoteBtn.onclick = () => {
    noteModal.classList.add("hidden");
    editingNoteId = null;
  };
}

//save sticky after add or edit
async function saveStickyNote() {
  const title = modalTitle.value.trim();
  const body = modalBody.value.trim();
  if (!title && !body) {
    alert("Title or note cannot be empty");
    return;
  }

  const color = ["green-1", "yellow-2", "red-1", "blue-1"][Math.floor(Math.random() * 4)];

  if (editingNoteId) { //edit
    const res = await fetch(`${STICKY_API}/${editingNoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body })
    });
    const updated = await res.json();
    const el = document.querySelector(`.sticky-note[data-id="${editingNoteId}"]`);
    el.querySelector(".note-title").textContent = updated.title;
    el.querySelector(".note-body").textContent = updated.body;
  } else {
    const res = await fetch(STICKY_API, { //add
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, color })
    });
    renderSticky(await res.json());
  }

  noteModal.classList.add("hidden");
  editingNoteId = null;
}


window.addEventListener("DOMContentLoaded", async () => {
  createStickyModal(); //show modal
  dueDateInput.min = new Date().toISOString().split("T")[0]; //set the min date today

  const tasks = await (await fetch(TASKS_API)).json(); //fetch all tasks data from json
  tasks.forEach(renderTask); //show all tasks
  const stickies = await (await fetch(STICKY_API)).json(); //fetch all stickies data from json
  stickies.forEach(renderSticky); //show all stickies
});

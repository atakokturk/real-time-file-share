// const receivedFiles = [];  
//const socket = io(); 


(function () {
  let sender_uid;
  const socket = io();

  function generateID(min,max) {
    return `${Math.trunc(Math.random() * 999999)+100000}`;
  }

  document
    .querySelector("#receiver-start-con-btn")
    .addEventListener("click", function () {                        //receiver ID eşitleme
      sender_uid = document.querySelector("#join-id").value;
      if (sender_uid.lenght == 0) {
        return;
      }

      let joinID = generateID();
      socket.emit("receiver-join", {
        uid: joinID,
        sender_uid: sender_uid,
      });
      document.querySelector(".join-screen").classList.remove("active");
      document.querySelector(".fs-screen").classList.add("active");
    });

  let fileShare = {};

  socket.on("fs-meta", function (metadata) {
    fileShare.metadata = metadata,
      fileShare.transmitted = 0,      //?parantez ekle x3
      fileShare.buffer = [];

    let el = document.createElement("div");
    el.classList.add("item");
    el.innerHTML = `
      <div class="progress">0%</div>
      <div class="filename">${metadata.filename}</div>
    `;
    document.querySelector(".files-list").appendChild(el),
      (fileShare.progress_node = el.querySelector(".progress"));
    socket.emit("fs-start", {
      uid: sender_uid,
    });
  });

  socket.on("fs-share", function (buffer) {
    console.log("Buffer", buffer),
      fileShare.buffer.push(buffer),
      fileShare.transmitted += buffer.byteLength,       //?parante< ekle x2 alt sıra
      fileShare.progress_node.innerText =
        Math.trunc(
          (fileShare.transmitted / fileShare.metadata.total_buffer_size) * 100
        ) + "%";

    if (fileShare.transmitted == fileShare.metadata.total_buffer_size) {
      console.log("Download File: ", fileShare);
      download(new Blob(fileShare.buffer), fileShare.metadata.filename);
      fileShare = {};
    } else {
      socket.emit("fs-start", {
        uid: sender_uid,
      });
    }
  });
})();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})


//------------------


// // Gelen dosyaları listeye ekle
// socket.on("file-meta", function (data) {
//     receivedFiles.push(data.metadata);
//     updateFileList();
// });

// // Listeyi güncelleyen fonksiyon
// function updateFileList() {
//     const fileList = document.querySelector("#file-list");
//     fileList.innerHTML = "";

//     receivedFiles.forEach((file, index) => {
//         const li = document.createElement("li");
//         li.innerHTML = `
//             <input type="checkbox" class="file-checkbox" data-index="${index}">
//             <span>${file.filename} (${(file.total_buffer_size / 1024).toFixed(2)} KB)</span>
//         `;
//         fileList.appendChild(li);
//     });
// }

// // "Seçilenleri İndir" butonuna tıklanınca
// document.querySelector("#download-selected").addEventListener("click", function () {
//     const selectedFiles = document.querySelectorAll(".file-checkbox:checked");

//     selectedFiles.forEach(checkbox => {
//         const index = checkbox.getAttribute("data-index");
//         downloadFile(index);
//     });
// });

// // Dosyayı indir
// function downloadFile(index) {
//     const file = receivedFiles[index];

//     socket.emit("request-file", { filename: file.filename });

//     socket.on("file-raw", function (data) {
//         const blob = new Blob([data.buffer], { type: "application/octet-stream" });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = file.filename;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     });
// }

const express = require("express");
const path = require("path");
const fs = require("fs")
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const uploadDir = path.join(__dirname, "uploads")

const PORT=5000

if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir)
}

let receivedFiles=[];

app.use(express.static(path.join(__dirname + "/public")));

app.get("/files", (req,res) => {
  fs.readdir(uploadDir, (err,files) =>{
    if(err){
      return res.status(500).json({err : "Files can not get"})
    }
    res.send(files);
  })
})

app.get("/download", (req,res) => {
  const files = req.query.files.split(",");     //zip döndürür
  const archiver = require("archiver");

  res.attachment("selected-files.zip")
  const archive = archiver("zip", {zlib: {level : 9}})

  archive.pipe(res)

  files.forEach(file => {
    const filePath = path.join(uploadDir,file)
    if (fs.existsSync(filePath)){
      archive.file(filePath, {name : file})
    }
    
  });
  archive.finalize();
})

io.on("connection", function (socket) {
  socket.on("file-upload",(fileData)=>{
    const filePath = path.join(uploadDir, fileData.fileName);
    fs.writeFileSync(filePath,fileData.fileBuffer)

    receivedFiles.push(fileData.fileName)

    io.emit("update-file-list", receivedFiles)
  })
  socket.on("sender-join", function (data) {
    socket.join(data.uid);
  });
  socket.on("receiver-join", function (data) {
    socket.join(data.uid);
    socket.in(data.sender_uid).emit("init", data.uid); //io.to(data.sender_uid).emit("init",data.uid);
  });
  socket.on("file-meta", function (data) {
    socket.in(data.uid).emit("fs-meta", data.metadata);
  });
  socket.on("fs-start", function (data) {
    socket.in(data.uid).emit("fs-share", {});
  });
  socket.on("file-raw", function (data) {
    socket.in(data.uid).emit("fs-share", data.buffer);
  });
});

app.get("/files", (req,res) =>{
  res.json(receivedFiles)               //listeyi döndüren api
})



server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})

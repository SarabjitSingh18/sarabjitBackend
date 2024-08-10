import multer from "multer";

//we are using the disk storage to create a storage 
//storage method here will be going to used as middleware forward
const storage = multer.diskStorage({ //using the diskstorage({}) method in multer //diskstorage accepts a object that cotains diff methods such as destination() and filename 
    destination: function (req, file, cb) { //cb means callback
        cb(null, "./public/temp") //provide the location of folder to save files
    },
    filename: function (req, file, cb) { //this will provide filename
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname) //you can change by file.{...options}
    }
})
//exporting the upload 
export const upload = multer ({
    // storage:storage we are using the es6 we can also do this
    storage,
})
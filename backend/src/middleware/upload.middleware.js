import multer from "multer";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter:(req,file,cb)=>{
        const isImage = file.mimetype.startsWith("image/");
        const isVideo = file.mimetype.startsWith("video/");
        const isAudio = file.mimetype.startsWith("audio/");
        const isDocument =
            file.mimetype.startsWith("application/") ||
            file.mimetype.startsWith("text/") ||
            /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv|zip|rar)$/i.test(file.originalname);

        if (!isImage && !isVideo && !isAudio && !isDocument) {
            cb(new Error("Only image, video, audio, and document uploads are allowed"));
            return;
        }

        cb(null, true);
    },
});
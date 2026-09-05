import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    text: {
        type: String,
    },

    image: {
        type: String, //imagekit.io/image/uyjbjd
    },

    video: {
        type: String,
    },

    audio: {
        type: String, // voice recording url
    },

    documentUrl: {
        type: String,
    },

    documentName: {
        type: String,
    },

    documentSize: {
        type: Number,
    },

}, { timestamps: true });


const Message = mongoose.model("Message", messageSchema);
export default Message;


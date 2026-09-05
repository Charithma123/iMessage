import User  from "../models/user.model.js"
import Message from "../models/message.model.js"
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";

export async function getUsersForSidebar(req,res){

    try {
        const loggedInUserId = req.user._id

        const filteredUser = await User.find({_id: {$ne: loggedInUserId}}).select("-clerkId");

        res.status(200).json(filteredUser);
        
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({message:"Internal Server error"});
    }

}

export async function getConversationForSidebar(req,res){

    try {
        const loggedInUserId = req.user._id;

        const conversations = await Message.aggregate([
            // keep only the message I sent or recievd
            {$match: {$or: [{senderId: loggedInUserId}, {receiverId: loggedInUserId}] } },

            // collapse them into one row per chat partner, nothing our latest message time.

            {
                $group:{
                    // the partner is the other person on the message(not me).
                    _id: {$cond: [{$req: ["$senderId", loggedInUserId]}, "$receiverId","$senderId"]},
                    lastMessageAt: {$max: "$createdAt"},
                },
            },

            // most recent conversation at the top
            {$sort: {lastMessageAt: -1}},
            // look up each partner's user profile (comes back as an array).
            {$lookup: {from: "users", localField:"_id", foreignField:"_id", as:"user"}},

            // pull that profile out of the array and make it the document.
            {$replaceRoot: {newRoot: {$first: "$user"}}},

            // hide the private clerkId field form the result
            {$project:{clerkId:0}},

        ]);

        res.status(200).json(conversations);

    } catch (error) {
        console.error("Error in getConversationForSidebar:", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getMessages(req,res) {

    try {
        const {id: userToChatId} = req.params;
        const myId = req.user._id;


        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId: userToChatId},
                {senderId:userToChatId, receiverId: myId},
            ]
        }).sort({createdAt:1})

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({message: "Internal server error"});
        
    }
    
}

export async function sendMessage(params) {
    try {
        const {text} = req.body;
        const {id:receiverId} = req.params;
        const senderId = req.user._id;

  
        let imageUrl;
        let videoUrl;
    

        if(req.file){
            if(!hasImageKitConfig()){
                return res.status(500).json({message: "Media upload is not configured"});
            }

           const url = await uploadChatMedia(req.file);
           if(req.file.mimetype.startsWith("video/")) videoUrl = url;
           else imageUrl = url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl,
            video:videoUrl,
        })

        await newMessage.save()

        // to do real time socket.io

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage: ", error.message);
        res.status(500).json({message: "Internal server error"});
    }
    
}
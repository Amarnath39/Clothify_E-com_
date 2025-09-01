import mongoose from "mongoose";

const Exchange = new mongoose.Schema({
    reason: {
        type: String,
    },
    img: [{
        type: String,
    }],
    orderId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Order'
    },

}, { timestamps: true });

export default mongoose.models.Exchange || mongoose.model("Exchange", Exchange);
import mongoose from "mongoose";

const regulationSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String
});

const Regulation =
  mongoose.models.Regulation ||
  mongoose.model("Regulation", regulationSchema);

export default Regulation;
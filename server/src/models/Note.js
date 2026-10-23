import mongoose from 'mongoose';

/**
 * Mongoose Schema for Knowledge Notes
 * 
 * Defines the data structure, data types, and validation rules
 * for notes stored in MongoDB.
 * Associated with a specific user owner.
 */
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note owner (user ID) is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Note description is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    // Automatically creates and manages `createdAt` and `updatedAt` ISO timestamps
    timestamps: true,
    // Ensure virtual `id` is included when converting Mongoose documents to JSON/objects
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Compound index for fast retrieval of a user's notes sorted by date
noteSchema.index({ user: 1, createdAt: -1 });

// Create the Note model from schema
const Note = mongoose.model('Note', noteSchema);

export default Note;

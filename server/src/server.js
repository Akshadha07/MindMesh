import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import Note from './models/Note.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';

// Resolve current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env before accessing them
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Public DNS resolver fallback to prevent querySrv lookup failures on certain networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to default system DNS if restricted
}

// Create an instance of the Express application
const app = express();

// Determine port and client origin from environment
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware: Enable Cross-Origin Resource Sharing with credentials for HTTP-only cookies
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// Middleware: Cookie parser to read session JWTs from HTTP-only cookies
app.use(cookieParser());

// Middleware: Built-in body parser to parse JSON payloads in incoming HTTP requests
app.use(express.json());

// Public health-check endpoint: Used to verify that the server is alive and responding
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MindMesh server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint: General information and API directory
app.get('/', (req, res) => {
  res.json({
    name: 'MindMesh API',
    description: 'Interactive Knowledge Management and Visualization Platform Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      notes: {
        list: 'GET /api/notes (Protected)',
        create: 'POST /api/notes (Protected)',
        getById: 'GET /api/notes/:id (Protected)',
        update: 'PATCH /api/notes/:id (Protected)',
        delete: 'DELETE /api/notes/:id (Protected)'
      }
    }
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Initial sample knowledge notes used for default architect user seeding
const initialSeedNotes = [
  {
    title: 'Neural Synapse Mapping',
    description: 'Structuring multidimensional associative links between core concepts in semantic memory spaces.',
    category: 'Artificial Intelligence',
    tags: ['AI', 'Cognitive', 'Architecture']
  },
  {
    title: 'Sakura Cyberpunk UI System',
    description: 'Harmonizing deep midnight navy backgrounds with electric neon-pink highlights and delicate blossom motifs.',
    category: 'UI/UX Design',
    tags: ['Design', 'Cyberpunk', 'CSS']
  },
  {
    title: 'Graph Theory & Knowledge Nodes',
    description: 'Evaluating adjacency matrices versus edge lists for high-speed client-side force-directed canvas rendering.',
    category: 'Computer Science',
    tags: ['Graph', 'Algorithms', 'Visualization']
  }
];

/**
 * Handle initial demo user and migration of legacy ownerless notes.
 * Guarantees that every note has a valid user reference without exposing data across users.
 */
const seedAndMigrateLegacyNotes = async () => {
  try {
    const demoEmail = 'architect@mindmesh.io';
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      demoUser = await User.create({
        username: 'Architect',
        email: demoEmail,
        password: 'Password123!'
      });
      console.log(`[Database Seed] Default demo user created: ${demoEmail}`);
    }

    // Migrate any ownerless notes from earlier development phases
    const ownerlessResult = await Note.updateMany(
      { user: { $exists: false } },
      { $set: { user: demoUser._id } }
    );
    if (ownerlessResult.modifiedCount > 0) {
      console.log(`[Database Migration] Attached ${ownerlessResult.modifiedCount} legacy notes to demo user.`);
    }

    // Seed default notes for demo user if none exist for them
    const userNoteCount = await Note.countDocuments({ user: demoUser._id });
    if (userNoteCount === 0) {
      const seeded = initialSeedNotes.map((n) => ({ ...n, user: demoUser._id }));
      await Note.insertMany(seeded);
      console.log(`[Database Seed] Seeded default notes for ${demoEmail}`);
    }
  } catch (err) {
    console.error('[Database Migration Warning]:', err.message);
  }
};

// =========================================================================
// PROTECTED NOTE CRUD API ENDPOINTS (Scoped to req.user._id)
// =========================================================================

/**
 * 1. GET /api/notes
 * Retrieves all knowledge notes belonging exclusively to the authenticated user.
 */
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });

    const responseNotes = notes.map((note) => ({
      ...note.toObject(),
      id: note._id.toString()
    }));

    res.status(200).json(responseNotes);
  } catch (error) {
    console.error('[API Error] GET /api/notes failed:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve notes from database',
      message: error.message
    });
  }
});

/**
 * 2. POST /api/notes
 * Creates a new note owned by the authenticated user.
 */
app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Note title is required and cannot be empty.'
      });
    }

    // Validate description
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Note description is required and cannot be empty.'
      });
    }

    // Process tags into a clean array
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const newNote = await Note.create({
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category && typeof category === 'string' && category.trim() ? category.trim() : 'General',
      tags: processedTags
    });

    res.status(201).json({
      ...newNote.toObject(),
      id: newNote._id.toString()
    });
  } catch (error) {
    console.error('[API Error] POST /api/notes failed:', error.message);
    res.status(500).json({
      error: 'Failed to create note in database',
      message: error.message
    });
  }
});

/**
 * 3. GET /api/notes/:id
 * Retrieves a single knowledge note by its ID, enforcing ownership.
 */
app.get('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `"${id}" is not a valid MongoDB ObjectId.`
      });
    }

    const note = await Note.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No knowledge note found with ID: ${id}`
      });
    }

    res.status(200).json({
      ...note.toObject(),
      id: note._id.toString()
    });
  } catch (error) {
    console.error('[API Error] GET /api/notes/:id failed:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve note from database',
      message: error.message
    });
  }
});

/**
 * 4. PATCH /api/notes/:id
 * Updates an existing knowledge note, enforcing ownership.
 */
app.patch('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `"${id}" is not a valid MongoDB ObjectId.`
      });
    }

    const { title, description, category, tags } = req.body;
    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Note title cannot be empty.'
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Note description cannot be empty.'
        });
      }
      updateData.description = description.trim();
    }

    if (category !== undefined) {
      updateData.category = typeof category === 'string' && category.trim() ? category.trim() : 'General';
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updateData.tags = tags.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        updateData.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No knowledge note found with ID: ${id}`
      });
    }

    res.status(200).json({
      ...updatedNote.toObject(),
      id: updatedNote._id.toString()
    });
  } catch (error) {
    console.error('[API Error] PATCH /api/notes/:id failed:', error.message);
    res.status(500).json({
      error: 'Failed to update note in database',
      message: error.message
    });
  }
});

/**
 * 5. DELETE /api/notes/:id
 * Deletes a knowledge note by its ID, enforcing ownership.
 */
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `"${id}" is not a valid MongoDB ObjectId.`
      });
    }

    const deletedNote = await Note.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deletedNote) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No knowledge note found with ID: ${id}`
      });
    }

    res.status(200).json({
      message: 'Note deleted successfully',
      id: deletedNote._id.toString(),
      title: deletedNote.title
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/notes/:id failed:', error.message);
    res.status(500).json({
      error: 'Failed to delete note from database',
      message: error.message
    });
  }
});

/**
 * Connect to MongoDB Atlas, run migrations, and start the Express server.
 */
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Connect to MongoDB Atlas using Mongoose
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Database] Successfully connected to MongoDB Atlas');

    // Run migration / seeding of default demo notes
    await seedAndMigrateLegacyNotes();

    // Start listening on configured port only after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`[MindMesh Server] Running at http://localhost:${PORT}`);
      console.log(`[MindMesh Server] Health check available at http://localhost:${PORT}/api/health`);
      console.log(`[MindMesh Server] Notes endpoints available at http://localhost:${PORT}/api/notes`);
      console.log(`[MindMesh Server] Auth endpoints available at http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    // Safe error message: logs error reason without printing secrets or connection strings
    console.error('[Database] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();

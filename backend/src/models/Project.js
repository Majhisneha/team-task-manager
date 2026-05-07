const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['Admin', 'Member'],
          default: 'Member',
        },
      },
    ],
  },
  { timestamps: true }
);

// Ensure admin is always in members list
projectSchema.pre('save', function (next) {
  const adminInMembers = this.members.some(
    (m) => m.user.toString() === this.admin.toString()
  );
  if (!adminInMembers) {
    this.members.push({ user: this.admin, role: 'Admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);

import { model, Schema } from 'mongoose';

// types

/*
DESCOUNT
HAPPY_BIRTHDAY
ALERT
NOTIFY
*/

const NotificationSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    midia: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model('notifications', NotificationSchema);

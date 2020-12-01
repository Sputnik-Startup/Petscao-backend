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
    midia: {
      type: String,
      default: 'https://i.ibb.co/wC9146G/image.png',
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

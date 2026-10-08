import mongoose from 'mongoose';
// FCM is used in this system to send the notification for andfroid and ios devices.

const notificationSchema = new mongoose.Schema({
   
  notification_id : {
    type : String,
    required : true,
    unique : true
  },
  user_id : {
    type : String,
    required : true
  },
  title : {
    type : String,
    required : true
  },
  message : {
    type : String,
    required : true
  },
  is_read : {
    type : Boolean,
    default : false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now   
  },
  device_token : {
    type : String,
    default : null,
    unique : true
  },
  device_type : {
    type : String,
    enum: ['android', 'ios'],
    required : true
  } 
})

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
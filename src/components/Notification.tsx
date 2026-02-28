import React from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { useNotification } from "../context/NotificationContext";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} variant="filled" {...props} ref={ref} />;
});

const Notification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const handleClose = (id: number) => () => {
    removeNotification(id);
  };

  return (
    <div>
      {notifications &&
        notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            autoHideDuration={6000}
            onClose={handleClose(notification.id)}
          >
            <Alert
              ref={React.createRef()}
              onClose={handleClose(notification.id)}
              severity={notification.type}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        ))}
    </div>
  );
};

export default Notification;

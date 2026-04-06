import React from "react";
import "./StatusIndicator.css";

interface StatusIndicatorProps {
  status: "online" | "offline";
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  return (
    <div className={`status-indicator ${status}`}>
      <span className="status-dot" />
    </div>
  );
};

export default StatusIndicator;

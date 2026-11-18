import { FiPhone, FiVideo } from "react-icons/fi";
import { useGroupCallContext } from "../../context/call/group/GroupCallContext";

const GroupCallButtons = ({ groupId }) => {
  const {
    activeCall,
    incomingCall,
    startGroupCall,
  } = useGroupCallContext();

  const disabled = Boolean(activeCall || incomingCall);

  return (
    <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
      <button
        type="button"
        title="Start group audio call"
        aria-label="Start group audio call"
        disabled={disabled}
        onClick={() => startGroupCall(groupId, "audio")}
        className="btn btn-ghost btn-circle text-green-400 hover:bg-green-500/20 disabled:opacity-40"
      >
        <FiPhone size={20} />
      </button>

      <button
        type="button"
        title="Start group video call"
        aria-label="Start group video call"
        disabled={disabled}
        onClick={() => startGroupCall(groupId, "video")}
        className="btn btn-ghost btn-circle text-blue-400 hover:bg-blue-500/20 disabled:opacity-40"
      >
        <FiVideo size={22} />
      </button>
    </div>
  );
};

export default GroupCallButtons;

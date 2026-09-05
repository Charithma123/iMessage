import { Button, TextArea } from "@heroui/react";
import {
  ImageIcon,
  LoaderIcon,
  SendHorizontalIcon,
  Paperclip,
  Mic,
  Square,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useChatStore } from "../../store/useChatStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import toast from "react-hot-toast";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function ChatComposer() {
  const composerText = useChatStore((state) => state.composerText);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const sendMediaMessage = useChatStore((state) => state.sendMediaMessage);
  const isSendingMedia = useChatStore((state) => state.isSendingMedia);
  const sendTextMessage = useChatStore((state) => state.sendTextMessage);
  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId } = useSelectedConversation();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up recording stream on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const playSoundIfEnabled = () => {
    if (isSoundEnabled) playRandomKeyStrokeSound();
  };

  const handleSend = async () => {
    const didSendMessage = await sendTextMessage(activeConversationId);
    if (didSendMessage) playSoundIfEnabled();
  };

  const handleComposerTextChange = (event) => {
    setComposerText(event.target.value);
    playSoundIfEnabled();
  };

  const handleMediaPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const didSendMessage = await sendMediaMessage({
      conversationId: activeConversationId,
      file,
    });

    if (didSendMessage) playSoundIfEnabled();
  };

  const handleDocPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const didSendMessage = await sendMediaMessage({
      conversationId: activeConversationId,
      file,
    });

    if (didSendMessage) playSoundIfEnabled();
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Audio recording is not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start voice recording:", err);
      toast.error("Microphone access denied or unavailable");
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      // Stop all microphone tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (shouldSend && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const ext = recorder.mimeType?.includes("mp4") ? "mp4" : "webm";
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${ext}`, {
          type: recorder.mimeType || "audio/webm",
        });

        const didSendMessage = await sendMediaMessage({
          conversationId: activeConversationId,
          file: audioFile,
        });

        if (didSendMessage) playSoundIfEnabled();
      }

      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingDuration(0);
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    stopRecording(false);
  };

  return (
    <footer className="shrink-0 border-t border-border px-1.5 pb-2 pt-2 sm:px-2">
      {isSendingMedia ? (
        <div className="mx-auto mb-2 flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Uploading file / media...</span>
        </div>
      ) : null}

      {/* Hidden file inputs */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        disabled={isSendingMedia || isRecording}
        tabIndex={-1}
        aria-hidden
        onChange={handleMediaPick}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*"
        className="sr-only"
        disabled={isSendingMedia || isRecording}
        tabIndex={-1}
        aria-hidden
        onChange={handleDocPick}
      />

      {isRecording ? (
        /* Active Recording UI */
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm sm:px-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="font-medium text-red-500">Recording...</span>
            <span className="font-mono text-xs text-muted">
              {formatDuration(recordingDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={cancelRecording}
              className="text-muted hover:text-danger"
              title="Cancel recording"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => stopRecording(true)}
              className="gap-1.5 bg-red-500 text-white hover:bg-red-600"
              title="Send voice message"
            >
              <Square className="size-3.5 fill-current" />
              <span>Send</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Normal Composer UI */
        <div className="mx-auto flex w-full max-w-full items-end gap-1.5 px-0.5 sm:gap-2 sm:px-1">
          {/* Photos/Videos */}
          <Button
            variant="ghost"
            isIconOnly
            isDisabled={isSendingMedia}
            className="size-9 shrink-0 touch-manipulation self-end text-accent"
            onPress={() => mediaInputRef.current?.click()}
            title="Attach photo or video"
          >
            <ImageIcon className="size-5 sm:size-6" strokeWidth={2} />
          </Button>

          {/* Documents */}
          <Button
            variant="ghost"
            isIconOnly
            isDisabled={isSendingMedia}
            className="size-9 shrink-0 touch-manipulation self-end text-accent"
            onPress={() => docInputRef.current?.click()}
            title="Attach document (PDF, Word, etc.)"
          >
            <Paperclip className="size-5 sm:size-6" strokeWidth={2} />
          </Button>

          <TextArea
            fullWidth
            variant="secondary"
            placeholder="iMessage"
            rows={1}
            value={composerText}
            onChange={handleComposerTextChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-full"
          />

          {composerText.trim() ? (
            <Button
              variant="primary"
              isIconOnly
              isDisabled={!composerText.trim()}
              onPress={handleSend}
              title="Send message"
            >
              <SendHorizontalIcon className="size-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              isIconOnly
              isDisabled={isSendingMedia}
              className="size-9 shrink-0 text-accent hover:bg-accent/10"
              onPress={startRecording}
              title="Record voice message"
            >
              <Mic className="size-5" />
            </Button>
          )}
        </div>
      )}
    </footer>
  );
}

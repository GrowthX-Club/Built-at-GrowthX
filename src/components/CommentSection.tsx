"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/types";
import Avatar from "./Avatar";

interface CommentSectionProps {
  projectId: string;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments));
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: newComment,
          parentId: replyTo,
        }),
      });

      if (res.ok) {
        const { comment } = await res.json();
        setComments([...comments, comment]);
        setNewComment("");
        setReplyTo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div>
      <h3 className="text-sm font-semibold text-dark mb-4">
        Discussion ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-secondary">
            <span>
              Replying to{" "}
              {comments.find((c) => c._id === replyTo)?.memberName}
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-orange hover:text-orange-600"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your feedback..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {topLevel.map((comment) => (
          <div key={comment._id}>
            <div className="flex gap-3">
              <Avatar name={comment.memberName} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dark">
                    {comment.memberName}
                  </span>
                  <span className="text-xs text-secondary">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-dark/80 mt-0.5">
                  {comment.content}
                </p>
                <button
                  onClick={() => setReplyTo(comment._id)}
                  className="text-xs text-secondary hover:text-orange mt-1"
                >
                  Reply
                </button>
              </div>
            </div>
            {replies(comment._id).map((reply) => (
              <div key={reply._id} className="ml-10 mt-3 flex gap-3">
                <Avatar name={reply.memberName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark">
                      {reply.memberName}
                    </span>
                    <span className="text-xs text-secondary">
                      {timeAgo(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-dark/80 mt-0.5">
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-secondary text-center py-4">
            No comments yet. Be the first to share feedback!
          </p>
        )}
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { CommunityPost, CommunityTopic } from "../types/community";
import { useStorage } from "../hooks/useStorage";
import PostCard from "../components/PostCard"; // Re-using for display, might need adaptation
import { UserProfile } from "../types/user";

type Props = {
  onBack: () => void;
  currentUserId: string;
  onOpenProfile: (userId: string) => void;
  // Below props are from the old implementation and might not be used
  onCreatePost?: (opts?: { topicId?: string; type?: "thread" | "diary" | "official" }) => void;
  onOpenThread?: (topicId: string) => void;
  onOpenDiary?: () => void;
  onOpenPostDetail?: (postId: string) => void;
};

// A simple component to render a post
const PostItem: React.FC<{ post: CommunityPost, currentUserId: string, onOpenProfile: (userId: string) => void }> = ({ post, currentUserId, onOpenProfile }) => {
  const author = post.profiles;
  const isOwnPost = post.user_id === currentUserId;
  const authorName = isOwnPost ? "あなた" : author?.nickname || "匿名";

  return (
    <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <img 
          src={author?.avatarUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${authorName}`} 
          alt={authorName}
          className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer"
          onClick={() => !isOwnPost && onOpenProfile(post.user_id)}
        />
        <span className="text-sm font-semibold">{authorName}</span>
        <span className="text-xs text-gray-500 ml-auto">
          {new Date(post.created_at).toLocaleString('ja-JP')}
        </span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
    </div>
  )
}

export default function CommunityScreen({
  onBack,
  currentUserId,
  onOpenProfile,
}: Props) {
  const storage = useStorage();
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Form states
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const admin = await storage.isAdmin();
      setIsUserAdmin(admin);
    };
    checkAdminStatus();
  }, [storage]);

  // Fetch topics on mount
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    const fetchedTopics = await storage.listCommunityTopics();
    setTopics(fetchedTopics);
    setLoading(false);
  }, [storage]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Fetch posts when a topic is selected
  const fetchPosts = useCallback(async (topicId: string) => {
    setLoading(true);
    const fetchedPosts = await storage.listCommunityPosts(topicId);
    setPosts(fetchedPosts);
    setLoading(false);
  }, [storage]);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic.id);
    }
  }, [selectedTopic, fetchPosts]);

  // Handlers
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const newTopic = await storage.createCommunityTopic(newTopicTitle);
    if (newTopic) {
      setNewTopicTitle("");
      fetchTopics(); // Refresh topics list
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedTopic) return;
    const newPost = await storage.createCommunityPost(selectedTopic.id, newPostContent);
    if (newPost) {
      setNewPostContent("");
      fetchPosts(selectedTopic.id); // Refresh posts list
    }
  };

  const renderAdminTopicCreator = () => (
    <div className="bg-rose-50 border border-rose-200 rounded-card p-4 shadow-sm space-y-3">
      <div className="text-sm font-semibold text-rose-700">管理者用：新しいテーマを作成</div>
      <form onSubmit={handleCreateTopic} className="flex items-center gap-2">
        <input
          type="text"
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
          placeholder="お題のタイトル"
          className="flex-grow p-2 border rounded-md text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-rose-500 text-white rounded-md text-sm font-semibold">
          作成
        </button>
      </form>
    </div>
  );

  // Main screen with topic list
  if (!selectedTopic) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center p-6 text-gray-800">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-sm text-gray-500 hover:opacity-80 transition-opacity">
              戻る
            </button>
            <div className="text-md font-semibold">コミュニティ</div>
          </div>
          
          {isUserAdmin && renderAdminTopicCreator()}

          <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
            <div className="text-sm font-semibold">テーマ一覧</div>
            {loading && <div className="text-xs text-gray-500">読み込み中...</div>}
            {!loading && topics.length === 0 && <div className="text-xs text-gray-500">まだテーマがありません。</div>}
            <div className="space-y-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="w-full text-left border border-gray-200 rounded-lg p-3 space-y-1 bg-white hover:bg-gray-100 transition-colors"
                >
                  <div className="font-semibold">{topic.title}</div>
                  <div className="text-xs text-gray-400">
                    作成日: {new Date(topic.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen for a selected topic with its posts
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center p-6 text-gray-800 pb-32">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedTopic(null)} className="text-sm text-gray-500 hover:opacity-80 transition-opacity">
            テーマ一覧に戻る
          </button>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-1">{selectedTopic.title}</h2>
          <p className="text-xs text-gray-400">
            このお題について投稿しましょう
          </p>
        </div>
        
        <div className="space-y-3">
          {loading && <div className="text-xs text-gray-500 text-center">投稿を読み込み中...</div>}
          {!loading && posts.length === 0 && <div className="text-xs text-gray-500 text-center">まだ投稿がありません。最初の投稿をしてみましょう！</div>}
          {posts.map((post) => (
            <PostItem key={post.id} post={post} currentUserId={currentUserId} onOpenProfile={onOpenProfile} />
          ))}
        </div>
        
        {/* New Post Form */}
        <form onSubmit={handleCreatePost} className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg max-w-sm mx-auto">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="コメントを入力..."
            className="w-full p-2 border rounded-md text-sm min-h-[60px] mb-2"
            rows={3}
          />
          <button type="submit" className="w-full px-4 py-3 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600 transition-colors">
            投稿する
          </button>
        </form>
      </div>
    </div>
  );
}


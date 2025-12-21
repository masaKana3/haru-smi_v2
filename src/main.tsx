import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import App from "./App";
import PostDetailScreen from "./screens/PostDetailScreen";
import "./index.css";

const PostDetailRoute: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const postId = params.id;
  
  // ★ App.tsx と同様にユーザーIDを定義 (本来はContextやAuth管理推奨)
  const currentUserId = "me";

  if (!postId) return null;
  return (
    <PostDetailScreen 
      postId={postId} 
      onBack={() => navigate("/")} // ディープリンクからの戻りはトップ(Dashboard)へ
      currentUserId={currentUserId}
      // ディープリンク時は編集・削除後の挙動を簡易的に設定
      onEdit={() => console.log("Edit from deep link not implemented yet")}
      onDeleted={() => navigate("/")}
    />
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/post/:id" element={<PostDetailRoute />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

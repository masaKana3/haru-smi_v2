import React, { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import { useNavigation } from "../hooks/useNavigation";

type Props = {
  onLoginSuccess: (userId: string) => void;
};

export default function AuthNavigator({ onLoginSuccess }: Props) {
  const nav = useNavigation();
  const [resetEmail, setResetEmail] = useState("");

  if (nav.screen === "signup") {
    return (
      <SignupScreen
        onSuccess={() => nav.navigate("login")}
        onCancel={() => nav.navigate("login")}
      />
    );
  }

  if (nav.screen === "forgotPassword") {
    return (
      <ForgotPasswordScreen
        onBack={() => nav.navigate("login")}
        onSuccess={(email) => {
          setResetEmail(email);
          nav.navigate("resetPassword");
        }}
      />
    );
  }

  if (nav.screen === "resetPassword") {
    return (
      <ResetPasswordScreen
        email={resetEmail}
        onSuccess={() => nav.navigate("login")}
        onCancel={() => nav.navigate("login")}
      />
    );
  }

  // デフォルトはログイン画面
  return (
    <LoginScreen
      onLoginSuccess={onLoginSuccess}
      onGoToSignup={() => nav.navigate("signup")}
      onForgotPassword={() => nav.navigate("forgotPassword")}
    />
  );
}
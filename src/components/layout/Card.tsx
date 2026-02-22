import React from "react";

type CardProps<T extends React.ElementType = "div"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Card<T extends React.ElementType = "div">({
  as,
  className = "",
  children,
  ...rest
}: CardProps<T>) {
  const Component = (as || "div") as React.ElementType;
  return (
    <Component
      className={`bg-white/60 border border-white/20 rounded-card p-6 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

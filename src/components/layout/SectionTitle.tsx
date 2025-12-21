import React from "react";

type SectionTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h3 className={`text-md font-semibold ${className}`}>
      {children}
    </h3>
  );
}

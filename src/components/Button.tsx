import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const baseStyles =
  "inline-flex items-center justify-center rounded-full border transition font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-blue text-white border-brand-blue hover:bg-blue-600 focus-visible:outline-brand-blue",
  secondary:
    "bg-white text-brand-blue border-brand-blue hover:bg-blue-50 focus-visible:outline-brand-blue",
  ghost:
    "bg-transparent text-brand-blue border-transparent hover:bg-blue-50 focus-visible:outline-brand-blue",
};

const Button = ({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={clsx(baseStyles, variants[variant], className)}
    {...props}
  />
);

export default Button;
